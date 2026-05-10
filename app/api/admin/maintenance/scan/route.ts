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
  const expiringCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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

  let createdOrUpdated = 0;

  for (const item of stuckSessions) {
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
    },
  });

  return NextResponse.json({
    success: true,
    message: `تم الفحص وتحديث ${createdOrUpdated} تنبيه.`,
    createdOrUpdated,
  });
}
