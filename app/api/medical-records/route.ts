import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId)
    return NextResponse.json({ error: "patientId مطلوب" }, { status: 400 });

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const records = await db.medicalRecord.findMany({
    where: { patientId, clinicId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const { patientId, complaint, diagnosis, prescription, notes, date } =
    await req.json();

  if (!patientId || !complaint?.trim())
    return NextResponse.json({ error: "المريض والشكوى مطلوبان" }, { status: 400 });

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const record = await db.medicalRecord.create({
    data: {
      clinicId,
      patientId,
      complaint: complaint.trim(),
      diagnosis: diagnosis?.trim() || null,
      prescription: prescription?.trim() || null,
      notes: notes?.trim() || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(record, { status: 201 });
}
