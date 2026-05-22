import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getIraqParts(date: Date) {
  const iraqDate = new Date(date.getTime() + IRAQ_OFFSET_MS);
  return {
    year: iraqDate.getUTCFullYear(),
    month: iraqDate.getUTCMonth() + 1,
    day: iraqDate.getUTCDate(),
  };
}

function iraqDayStartUtc(date: Date) {
  const parts = getIraqParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, -3, 0, 0, 0));
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;

  const startOfDay = iraqDayStartUtc(new Date());
  const endOfDay = new Date(startOfDay.getTime() + DAY_MS - 1);

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

  const dateObj = new Date(body.date);
  if (Number.isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: "تاريخ الموعد غير صحيح" }, { status: 400 });
  }

  // Determine next queue number for the selected Iraq day.
  const todayStart = iraqDayStartUtc(new Date());
  const selectedDayStart = iraqDayStartUtc(dateObj);
  const selectedDayEnd = new Date(selectedDayStart.getTime() + DAY_MS - 1);
  const isToday = selectedDayStart.getTime() === todayStart.getTime();

  let queueNumber: number | undefined;
  if (isToday) {
    const last = await db.appointment.findFirst({
      where: {
        clinicId,
        date: { gte: selectedDayStart, lte: selectedDayEnd },
        queueNumber: { not: null },
      },
      orderBy: { queueNumber: "desc" },
    });
    queueNumber = (last?.queueNumber ?? 0) + 1;
  }

  // منع الحجز المزدوج
  const conflict = await db.appointment.findFirst({
    where: { clinicId, date: dateObj, status: { notIn: ["cancelled"] } },
    include: { patient: { select: { name: true } } },
  });
  if (conflict) {
    return NextResponse.json({
      error: `هذا الوقت محجوز باسم ${conflict.patient.name}`,
      conflictName: conflict.patient.name,
    }, { status: 409 });
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
