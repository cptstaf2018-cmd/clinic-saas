import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/feature-gates";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { id: patientId } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const attachments = await db.patientAttachment.findMany({
    where: { patientId, clinicId, ...(type ? { type } : {}) },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { id: patientId } = await params;

  const subscription = await db.subscription.findUnique({ where: { clinicId } });
  if (!canUseFeature(subscription?.plan, "fullMedicalFile")) {
    return NextResponse.json({ error: "هذه الميزة متاحة في خطة مميزة VIP فقط" }, { status: 403 });
  }

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const body = await req.json();
  const { type, title, notes, fileUrl, fileName, fileType, date } = body;

  if (!type || !title?.trim()) {
    return NextResponse.json({ error: "النوع والعنوان مطلوبان" }, { status: 400 });
  }

  const validTypes = ["lab", "xray", "prescription", "other"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "نوع غير صالح" }, { status: 400 });
  }

  const attachment = await db.patientAttachment.create({
    data: {
      clinicId,
      patientId,
      type,
      title: title.trim(),
      notes: notes?.trim() || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileType: fileType || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
