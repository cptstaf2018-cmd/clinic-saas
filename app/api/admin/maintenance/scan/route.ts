import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/system-events";
import { Prisma } from "@/app/generated/prisma";

type AdminSession = {
  user?: {
    role?: string | null;
    clinicId?: string | null;
  };
} | null;

function isSuperAdmin(session: AdminSession) {
  return session?.user?.role === "superadmin" && !session?.user?.clinicId;
}

async function createOrRefreshEvent(input: {
  clinicId?: string | null;
  type: string;
  severity: "info" | "success" | "warning" | "error";
  source: string;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const latestAt =
    input.metadata &&
    typeof input.metadata === "object" &&
    !Array.isArray(input.metadata) &&
    "latestAt" in input.metadata &&
    typeof input.metadata.latestAt === "string"
      ? new Date(input.metadata.latestAt)
      : null;

  const existing = await db.systemEvent.findFirst({
    where: {
      clinicId: input.clinicId ?? null,
      type: input.type,
      resolved: false,
    },
    select: { id: true },
  });

  if (existing) {
    await db.systemEvent.update({
      where: { id: existing.id },
      data: {
        severity: input.severity,
        source: input.source,
        title: input.title,
        message: input.message,
        metadata: input.metadata,
      },
    });
    return "updated";
  }

  if (latestAt) {
    const reviewed = await db.systemEvent.findFirst({
      where: {
        clinicId: input.clinicId ?? null,
        type: input.type,
        resolved: true,
        resolvedAt: { gte: latestAt },
      },
      select: { id: true },
    });

    if (reviewed) return "skipped";
  }

  await logSystemEvent(input);
  return "created";
}

export async function POST() {
  const session = await auth();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const staleSessionCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentInboundCutoff = new Date(now.getTime() - 15 * 60 * 1000);
  const expiringCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const transientWhatsappCutoff = new Date(now.getTime() - 5 * 60 * 1000);

  const [stuckSessions, pendingOldAppointments, expiringSubscriptions] = await Promise.all([
    db.whatsappSession.groupBy({
      by: ["clinicId"],
      where: { updatedAt: { lt: staleSessionCutoff } },
      _count: { _all: true },
    }),
    db.appointment.groupBy({
      by: ["clinicId"],
      where: { status: "pending", date: { lt: todayStart } },
      _count: { _all: true },
    }),
    db.subscription.findMany({
      where: { status: "active", expiresAt: { gte: now, lte: expiringCutoff } },
      select: { clinicId: true, expiresAt: true, plan: true },
    }),
  ]);

  const recentInbound = await db.incomingMessage.findMany({
    where: {
      direction: "inbound",
      createdAt: { gte: recentInboundCutoff },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, clinicId: true, phone: true, body: true, createdAt: true },
  });

  const unansweredByClinic = new Map<string, { count: number; latestPhone: string; latestBody: string; latestAt: string }>();
  for (const inbound of recentInbound) {
    const outboundAfter = await db.incomingMessage.findFirst({
      where: {
        clinicId: inbound.clinicId,
        phone: inbound.phone,
        direction: "outbound",
        createdAt: { gt: inbound.createdAt },
      },
      select: { id: true },
    });

    if (!outboundAfter) {
      const current = unansweredByClinic.get(inbound.clinicId);
      unansweredByClinic.set(inbound.clinicId, {
        count: (current?.count ?? 0) + 1,
        latestPhone: inbound.phone,
        latestBody: inbound.body.slice(0, 180),
        latestAt: inbound.createdAt.toISOString(),
      });
    }
  }

  let createdOrUpdated = 0;
  const detected = {
    stuck_whatsapp_sessions: new Set<string>(),
    old_pending_appointments: new Set<string>(),
    subscription_expiring: new Set<string>(),
    whatsapp_inbound_without_reply: new Set<string>(),
  };

  for (const item of stuckSessions) {
    detected.stuck_whatsapp_sessions.add(item.clinicId);
    await createOrRefreshEvent({
      clinicId: item.clinicId,
      type: "stuck_whatsapp_sessions",
      severity: "warning",
      source: "maintenance_scan",
      title: "محادثات واتساب عالقة",
      message: `يوجد ${item._count._all} محادثة عالقة منذ أكثر من 24 ساعة.`,
      metadata: { count: item._count._all },
    });
    createdOrUpdated += 1;
  }

  for (const item of pendingOldAppointments) {
    detected.old_pending_appointments.add(item.clinicId);
    await createOrRefreshEvent({
      clinicId: item.clinicId,
      type: "old_pending_appointments",
      severity: "warning",
      source: "maintenance_scan",
      title: "مواعيد قديمة معلقة",
      message: `يوجد ${item._count._all} موعد قديم ما زال بحالة معلقة.`,
      metadata: { count: item._count._all },
    });
    createdOrUpdated += 1;
  }

  for (const subscription of expiringSubscriptions) {
    detected.subscription_expiring.add(subscription.clinicId);
    const daysLeft = Math.max(0, Math.ceil((subscription.expiresAt.getTime() - now.getTime()) / 86400000));
    await createOrRefreshEvent({
      clinicId: subscription.clinicId,
      type: "subscription_expiring",
      severity: "info",
      source: "maintenance_scan",
      title: "اشتراك ينتهي قريباً",
      message: `اشتراك العيادة ينتهي خلال ${daysLeft} يوم.`,
      metadata: { daysLeft, plan: subscription.plan, expiresAt: subscription.expiresAt.toISOString() },
    });
    createdOrUpdated += 1;
  }

  for (const [clinicId, item] of unansweredByClinic) {
    detected.whatsapp_inbound_without_reply.add(clinicId);
    const result = await createOrRefreshEvent({
      clinicId,
      type: "whatsapp_inbound_without_reply",
      severity: "error",
      source: "maintenance_scan",
      title: "رسائل واتساب بلا رد",
      message: `يوجد ${item.count} رسالة واردة خلال آخر 15 دقيقة بدون رد خارج بعدها.`,
      metadata: item,
    });
    if (result !== "skipped") createdOrUpdated += 1;
  }

  const maintenanceTypes = Object.keys(detected) as Array<keyof typeof detected>;
  for (const type of maintenanceTypes) {
    await db.systemEvent.updateMany({
      where: {
        type,
        resolved: false,
        clinicId: { notIn: Array.from(detected[type]) },
      },
      data: { resolved: true, resolvedAt: now },
    });
  }

  await db.$executeRaw`
    UPDATE "SystemEvent"
    SET resolved = true, "resolvedAt" = ${now}
    WHERE resolved = false
      AND severity = 'error'
      AND type IN ('whatsapp_send_failed', 'whatsapp_bot_reply_failed')
      AND "createdAt" < ${transientWhatsappCutoff}
      AND (message ILIKE '%429%' OR metadata::text ILIKE '%429%')
  `;

  await logSystemEvent({
    type: "maintenance_scan_completed",
    severity: "success",
    source: "maintenance_scan",
    title: "اكتمل فحص النظام",
    message: `تم فحص النظام وتحديث ${createdOrUpdated} تنبيه.`,
    metadata: {
      stuckSessions: stuckSessions.length,
      pendingOldAppointments: pendingOldAppointments.length,
      expiringSubscriptions: expiringSubscriptions.length,
      unansweredWhatsappClinics: unansweredByClinic.size,
    },
  });

  return NextResponse.json({
    success: true,
    message: `تم الفحص وتحديث ${createdOrUpdated} تنبيه.`,
    createdOrUpdated,
  });
}
