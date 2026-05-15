import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Revenue per day (approved payments)
  const payments = await db.payment.findMany({
    where: { status: "approved", createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const revenueMap: Record<string, number> = {};
  for (const p of payments) {
    const day = p.createdAt.toISOString().slice(0, 10);
    revenueMap[day] = (revenueMap[day] ?? 0) + p.amount;
  }

  // Appointments per day
  const appointments = await db.appointment.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const appointmentsMap: Record<string, number> = {};
  for (const a of appointments) {
    const day = a.createdAt.toISOString().slice(0, 10);
    appointmentsMap[day] = (appointmentsMap[day] ?? 0) + 1;
  }

  // Fill gaps with zeroes
  const revenueTrend = [];
  const appointmentsTrend = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("ar-IQ", { month: "short", day: "numeric" });
    revenueTrend.push({ day: label, revenue: revenueMap[day] ?? 0 });
    appointmentsTrend.push({ day: label, appointments: appointmentsMap[day] ?? 0 });
  }

  // Plans distribution
  const subs = await db.subscription.groupBy({
    by: ["plan", "status"],
    _count: { plan: true },
    where: { status: { in: ["active", "trial"] } },
  });

  const planLabels: Record<string, string> = {
    trial: "تجريبي",
    basic: "أساسية",
    standard: "متوسطة",
    premium: "مميزة",
  };

  const plansDistribution = subs.map((s) => ({
    name: planLabels[s.plan] ?? s.plan,
    value: s._count.plan,
    plan: s.plan,
  }));

  // Totals
  const [totalRevenue, totalClinics, activeClinics, totalPatients] = await Promise.all([
    db.payment.aggregate({ where: { status: "approved" }, _sum: { amount: true } }),
    db.clinic.count(),
    db.subscription.count({ where: { status: { in: ["active", "trial"] }, expiresAt: { gt: new Date() } } }),
    db.patient.count(),
  ]);

  return NextResponse.json({
    revenueTrend,
    appointmentsTrend,
    plansDistribution,
    totals: {
      revenue: totalRevenue._sum.amount ?? 0,
      clinics: totalClinics,
      activeClinics,
      patients: totalPatients,
    },
  });
}
