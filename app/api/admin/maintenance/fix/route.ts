import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/system-events";

type AdminSession = {
  user?: {
    role?: string | null;
    clinicId?: string | null;
  };
} | null;

function isSuperAdmin(session: AdminSession) {
  return session?.user?.role === "superadmin" && !session?.user?.clinicId;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body: { action?: string; clinicId?: string | null } = await req.json().catch(() => ({}));
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (body.action === "clear-stuck-sessions" || body.action === "reset-whatsapp-sessions") {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = await db.whatsappSession.deleteMany({
      where: {
        clinicId: body.clinicId ? body.clinicId : undefined,
        updatedAt: body.action === "clear-stuck-sessions" ? { lt: cutoff } : undefined,
      },
    });

    await db.systemEvent.updateMany({
      where: {
        type: { in: ["stuck_whatsapp_sessions", "whatsapp_inbound_without_reply"] },
        clinicId: body.clinicId ? body.clinicId : undefined,
        resolved: false,
      },
      data: { resolved: true, resolvedAt: now },
    });

    await logSystemEvent({
      clinicId: body.clinicId ?? null,
      type: body.action === "clear-stuck-sessions" ? "stuck_sessions_cleared" : "whatsapp_sessions_reset",
      severity: "success",
      source: "super_admin_fix",
      title: body.action === "clear-stuck-sessions" ? "تنظيف جلسات واتساب عالقة" : "إعادة تشغيل جلسات البوت",
      message: `تم حذف ${result.count} جلسة واتساب.`,
      metadata: { count: result.count },
    });

    return NextResponse.json({ success: true, message: `تم حذف ${result.count} جلسة واتساب.` });
  }

  if (body.action === "close-old-pending") {
    const result = await db.appointment.updateMany({
      where: {
        clinicId: body.clinicId ? body.clinicId : undefined,
        status: "pending",
        date: { lt: todayStart },
      },
      data: { status: "completed", queueStatus: "done" },
    });

    await db.systemEvent.updateMany({
      where: {
        type: "old_pending_appointments",
        clinicId: body.clinicId ? body.clinicId : undefined,
        resolved: false,
      },
      data: { resolved: true, resolvedAt: now },
    });

    await logSystemEvent({
      clinicId: body.clinicId ?? null,
      type: "old_pending_closed",
      severity: "success",
      source: "super_admin_fix",
      title: "إغلاق مواعيد قديمة معلقة",
      message: `تم إكمال ${result.count} موعد قديم.`,
      metadata: { count: result.count },
    });

    return NextResponse.json({ success: true, message: `تم إكمال ${result.count} موعد قديم.` });
  }

  if (body.action === "resolve-whatsapp-errors") {
    const result = await db.systemEvent.updateMany({
      where: {
        type: {
          in: [
            "whatsapp_send_failed",
            "whatsapp_bot_reply_failed",
            "whatsapp_inbound_without_reply",
            "whatsapp_bot_subscription_inactive",
          ],
        },
        clinicId: body.clinicId ? body.clinicId : undefined,
        resolved: false,
      },
      data: { resolved: true, resolvedAt: now },
    });

    await logSystemEvent({
      clinicId: body.clinicId ?? null,
      type: "whatsapp_errors_reviewed",
      severity: "success",
      source: "super_admin_fix",
      title: "مراجعة أخطاء واتساب",
      message: `تم إغلاق ${result.count} خطأ واتساب بعد المراجعة.`,
      metadata: { count: result.count },
    });

    return NextResponse.json({ success: true, message: `تم إغلاق ${result.count} خطأ واتساب.` });
  }

  if (body.action === "resolve-old-errors") {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const result = await db.systemEvent.updateMany({
      where: { resolved: false, createdAt: { lt: cutoff } },
      data: { resolved: true, resolvedAt: now },
    });
    await logSystemEvent({
      type: "old_errors_bulk_resolved",
      severity: "success",
      source: "super_admin_fix",
      title: "مسح الأخطاء القديمة",
      message: `تم حل ${result.count} خطأ أقدم من 7 أيام.`,
      metadata: { count: result.count },
    });
    return NextResponse.json({ success: true, message: `تم حل ${result.count} خطأ قديم.` });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
