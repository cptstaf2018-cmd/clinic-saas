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

  const patient = await db.patient.findFirst({ where: { id, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const { name, phone } = await req.json();
  const data: Record<string, string> = {};
  if (name?.trim()) data.name = name.trim();
  if (phone?.trim()) data.whatsappPhone = phone.trim();

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });

  const updated = await db.patient.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, name: updated.name, phone: updated.whatsappPhone });
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

  const patient = await db.patient.findFirst({ where: { id, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  await db.$transaction([
    db.appointment.deleteMany({ where: { patientId: id, clinicId } }),
    db.patient.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
