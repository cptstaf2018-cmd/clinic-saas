import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const record = await db.medicalRecord.findFirst({ where: { id, clinicId } });
  if (!record)
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });

  const { complaint, diagnosis, prescription, notes, date, followUpDate } = await req.json();
  if (!complaint?.trim())
    return NextResponse.json({ error: "الشكوى مطلوبة" }, { status: 400 });

  const updated = await db.medicalRecord.update({
    where: { id },
    data: {
      complaint: complaint.trim(),
      diagnosis: diagnosis?.trim() || null,
      prescription: prescription?.trim() || null,
      notes: notes?.trim() || null,
      date: date ? new Date(date) : record.date,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    },
  });

  // إذا تغيّر موعد المراجعة → أنشئ حجز جديد
  const oldFollowUp = record.followUpDate?.toISOString().slice(0, 10);
  const newFollowUp = followUpDate || null;
  if (newFollowUp && newFollowUp !== oldFollowUp) {
    const followDate = new Date(newFollowUp);
    followDate.setHours(9, 0, 0, 0);
    const start = new Date(followDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(followDate); end.setHours(23, 59, 59, 999);
    const count = await db.appointment.count({ where: { clinicId, date: { gte: start, lte: end } } });
    await db.appointment.create({
      data: {
        clinicId,
        patientId: record.patientId,
        date: followDate,
        status: "confirmed",
        queueNumber: count + 1,
        queueStatus: "waiting",
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const record = await db.medicalRecord.findFirst({ where: { id, clinicId } });
  if (!record)
    return NextResponse.json({ error: "السجل غير موجود" }, { status: 404 });

  await db.medicalRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
