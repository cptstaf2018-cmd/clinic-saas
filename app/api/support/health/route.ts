import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const [subscription, todayAppts, stuckSessions, pendingOld] =
    await Promise.all([
      db.subscription.findUnique({ where: { clinicId } }),
      db.appointment.findMany({
        where: { clinicId, date: { gte: todayStart, lte: todayEnd } },
        select: { status: true, queueStatus: true },
      }),
      db.whatsappSession.count({
        where: {
          clinicId,
          updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      }),
      db.appointment.count({
        where: { clinicId, status: "pending", date: { lt: todayStart } },
      }),
    ]);

  const subDaysLeft = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.expiresAt).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return NextResponse.json({
    db: dbOk,
    subscription: {
      status: subscription?.status ?? "inactive",
      plan: subscription?.plan ?? "—",
      daysLeft: subDaysLeft,
    },
    queue: {
      total: todayAppts.length,
      waiting: todayAppts.filter((a) => a.queueStatus === "waiting").length,
      current: todayAppts.filter((a) => a.queueStatus === "current").length,
      done: todayAppts.filter((a) => a.queueStatus === "done").length,
    },
    issues: {
      stuckSessions,
      pendingOldAppointments: pendingOld,
    },
  });
}
