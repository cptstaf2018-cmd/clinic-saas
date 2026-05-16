import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { patientId, appointmentId, amount, note } = await req.json();

  if (!patientId || !amount || amount <= 0)
    return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });

  // تحقق أن المريض تابع لهذه العيادة
  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const payment = await db.patientPayment.create({
    data: { clinicId, patientId, appointmentId: appointmentId ?? null, amount: Math.round(amount), note: note?.trim() || null },
  });

  return NextResponse.json(payment);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const payments = await db.patientPayment.findMany({
    where: {
      clinicId,
      ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lt: new Date(to) } : {}) } } : {}),
    },
    select: { amount: true, createdAt: true, note: true, patient: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  return NextResponse.json({ payments, total });
}
