import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: {
      clinicId,
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      patient: { select: { id: true, name: true, whatsappPhone: true } },
    },
    orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;

  let body: { patientId: string; date: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  if (!body.patientId || !body.date) {
    return NextResponse.json(
      { error: "patientId و date مطلوبان" },
      { status: 400 }
    );
  }

  // Verify the patient belongs to this clinic
  const patient = await db.patient.findFirst({
    where: { id: body.patientId, clinicId },
  });

  if (!patient) {
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
  }

  // Determine next queue number for today
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const dateObj = new Date(body.date);
  const isToday = dateObj >= startOfDay && dateObj <= endOfDay;

  let queueNumber: number | undefined;
  if (isToday) {
    const last = await db.appointment.findFirst({
      where: {
        clinicId,
        date: { gte: startOfDay, lte: endOfDay },
        queueNumber: { not: null },
      },
      orderBy: { queueNumber: "desc" },
    });
    queueNumber = (last?.queueNumber ?? 0) + 1;
  }

  const appointment = await db.appointment.create({
    data: {
      clinicId,
      patientId: body.patientId,
      date: dateObj,
      ...(queueNumber !== undefined ? { queueNumber } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, whatsappPhone: true } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
