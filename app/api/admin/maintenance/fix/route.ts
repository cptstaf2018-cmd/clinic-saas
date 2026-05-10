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

  if (body.action === "clear-stuck-sessions") {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = await db.whatsappSession.deleteMany({
      where: {
        clinicId: body.clinicId ? body.clinicId : undefined,
        updatedAt: { lt: cutoff },
      },
    });

    await db.systemEvent.updateMany({
      where: {
        type: "stuck_whatsapp_sessions",
        clinicId: body.clinicId ? body.clinicId : undefined,
        resolved: false,
      },
      data: { resolved: true, resolvedAt: now },
    });

    await logSystemEvent({
      clinicId: body.clinicId ?? null,
      type: "stuck_sessions_cleared",
      severity: "success",
      source: "super_admin_fix",
      title: "تنظيف جلسات واتساب عالقة",
      message: `تم حذف ${result.count} جلسة عالقة.`,
      metadata: { count: result.count },
    });

    return NextResponse.json({ success: true, message: `تم حذف ${result.count} جلسة عالقة.` });
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

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
