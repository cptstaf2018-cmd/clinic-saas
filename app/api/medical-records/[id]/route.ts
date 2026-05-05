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

  const { complaint, diagnosis, prescription, notes, date } = await req.json();
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
    },
  });

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
