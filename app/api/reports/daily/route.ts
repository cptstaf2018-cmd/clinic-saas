import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature, upgradeMessage } from "@/lib/feature-gates";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const subscription = await db.subscription.findUnique({ where: { clinicId } });
  if (!canUseFeature(subscription?.plan, "dailyReports")) {
    return NextResponse.json({ error: upgradeMessage("dailyReports") }, { status: 402 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const day = dateParam ? new Date(dateParam) : new Date();
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const [appointments, newPatients, medicalRecords, incomingMessages, payments] = await Promise.all([
    db.appointment.findMany({
      where: { clinicId, date: { gte: day, lt: nextDay } },
      select: { status: true, queueStatus: true },
    }),
    db.patient.count({ where: { clinicId, createdAt: { gte: day, lt: nextDay } } }),
    db.medicalRecord.count({ where: { clinicId, createdAt: { gte: day, lt: nextDay } } }),
    db.incomingMessage.count({ where: { clinicId, createdAt: { gte: day, lt: nextDay } } }),
    db.payment.findMany({
      where: { clinicId, createdAt: { gte: day, lt: nextDay } },
      select: { amount: true, status: true },
    }),
  ]);

  const byStatus = appointments.reduce<Record<string, number>>((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
    return acc;
  }, {});

  const revenue = payments
    .filter((payment) => payment.status === "approved")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return NextResponse.json({
    date: day.toISOString(),
    appointments: {
      total: appointments.length,
      pending: byStatus.pending ?? 0,
      confirmed: byStatus.confirmed ?? 0,
      completed: byStatus.completed ?? 0,
      cancelled: byStatus.cancelled ?? 0,
    },
    newPatients,
    medicalRecords,
    incomingMessages,
    payments: {
      total: payments.length,
      approvedRevenue: revenue,
    },
  });
}
