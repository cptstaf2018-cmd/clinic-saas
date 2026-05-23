import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStoragePath } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function serializeAttachment(attachment: {
  id: string;
  patientId: string;
  fileUrl: string | null;
  [key: string]: unknown;
}) {
  return {
    ...attachment,
    fileUrl: attachment.fileUrl
      ? `/api/patients/${attachment.patientId}/attachments/${attachment.id}/file`
      : null,
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { id: patientId } = await params;
  const type = req.nextUrl.searchParams.get("type");

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const attachments = await db.patientAttachment.findMany({
    where: { patientId, clinicId, ...(type ? { type } : {}) },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(attachments.map(serializeAttachment));
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { id: patientId } = await params;

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const body = await req.json();
  const { type, title, notes, fileUrl, fileName, fileType, date } = body;
  const storagePath = fileUrl ? getStoragePath(String(fileUrl)) : null;

  if (!type || !title?.trim()) {
    return NextResponse.json({ error: "النوع والعنوان مطلوبان" }, { status: 400 });
  }

  const validTypes = ["lab", "xray", "prescription", "other"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "نوع غير صالح" }, { status: 400 });
  }

  if (fileUrl && (!storagePath || !storagePath.startsWith(`${clinicId}/`))) {
    return NextResponse.json({ error: "مسار الملف غير صالح" }, { status: 400 });
  }

  const attachment = await db.patientAttachment.create({
    data: {
      clinicId,
      patientId,
      type,
      title: title.trim(),
      notes: notes?.trim() || null,
      fileUrl: storagePath,
      fileName: fileName || null,
      fileType: fileType || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(serializeAttachment(attachment), { status: 201 });
}
