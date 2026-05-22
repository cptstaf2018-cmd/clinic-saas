import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSecretaryRole } from "@/lib/clinic-roles";

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

  const body = await req.json();
  const data: Record<string, unknown> = {};
  const secretary = isSecretaryRole(session.user.role);

  if (body.name?.trim())        data.name = body.name.trim();
  if (body.phone?.trim())       data.whatsappPhone = body.phone.trim();
  if (!secretary) {
    if (body.bloodType !== undefined)         data.bloodType = body.bloodType || null;
    if (body.allergies !== undefined)         data.allergies = Array.isArray(body.allergies) ? body.allergies : [];
    if (body.chronicConditions !== undefined) data.chronicConditions = Array.isArray(body.chronicConditions) ? body.chronicConditions : [];
    if (body.currentMedications !== undefined)data.currentMedications = Array.isArray(body.currentMedications) ? body.currentMedications : [];
    if (body.surgicalHistory !== undefined)   data.surgicalHistory = body.surgicalHistory || null;
    if (body.smokingStatus !== undefined)     data.smokingStatus = body.smokingStatus || null;
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });

  const updated = await db.patient.update({ where: { id }, data });
  if (secretary) {
    return NextResponse.json({
      id: updated.id, name: updated.name, phone: updated.whatsappPhone,
    });
  }
  return NextResponse.json({
    id: updated.id, name: updated.name, phone: updated.whatsappPhone,
    bloodType: updated.bloodType, allergies: updated.allergies,
    chronicConditions: updated.chronicConditions, currentMedications: updated.currentMedications,
    surgicalHistory: updated.surgicalHistory, smokingStatus: updated.smokingStatus,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (isSecretaryRole(session.user.role))
    return NextResponse.json({ error: "حذف المراجع غير متاح لحساب السكرتير" }, { status: 403 });

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const patient = await db.patient.findFirst({ where: { id, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  await db.$transaction([
    db.medicalRecord.deleteMany({ where: { patientId: id, clinicId } }),
    db.appointment.deleteMany({ where: { patientId: id, clinicId } }),
    db.patient.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
