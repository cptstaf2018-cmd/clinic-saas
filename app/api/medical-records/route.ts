import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature, upgradeMessage } from "@/lib/feature-gates";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";

function cleanContentJson(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => [
      key,
      typeof fieldValue === "string" ? fieldValue.trim() : String(fieldValue ?? "").trim(),
    ])
  );
}

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
  const { patientId, complaint, diagnosis, prescription, notes, date, followUpDate, specialtyCode, contentJson } =
    await req.json();

  if (!patientId || !complaint?.trim())
    return NextResponse.json({ error: "المريض والشكوى مطلوبان" }, { status: 400 });

  const patient = await db.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient)
    return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const subscription = await db.subscription.findUnique({ where: { clinicId } });
  if (followUpDate && !canUseFeature(subscription?.plan, "followUpTracking")) {
    return NextResponse.json({ error: upgradeMessage("followUpTracking") }, { status: 402 });
  }

  const specialtyConfig = await getClinicSpecialtyConfig(clinicId);
  const recordSpecialtyCode = typeof specialtyCode === "string" && specialtyCode.trim()
    ? specialtyCode.trim()
    : specialtyConfig.code;
  const cleanedContent = cleanContentJson(contentJson);

  const record = await db.medicalRecord.create({
    data: {
      clinicId,
      patientId,
      complaint: complaint.trim(),
      diagnosis: diagnosis?.trim() || null,
      prescription: prescription?.trim() || null,
      notes: notes?.trim() || null,
      date: date ? new Date(date) : new Date(),
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      specialtyCode: recordSpecialtyCode,
      contentJson: cleanedContent,
    },
  });

  // إنشاء موعد مراجعة تلقائي إذا حُدّد تاريخ
  if (followUpDate) {
    const followDate = new Date(followUpDate);
    followDate.setHours(9, 0, 0, 0); // الساعة 9 صباحاً افتراضياً

    // احسب رقم الدور لهذا اليوم
    const start = new Date(followDate); start.setHours(0, 0, 0, 0);
    const end   = new Date(followDate); end.setHours(23, 59, 59, 999);
    const count = await db.appointment.count({ where: { clinicId, date: { gte: start, lte: end } } });

    await db.appointment.create({
      data: {
        clinicId,
        patientId,
        date: followDate,
        status: "confirmed",
        queueNumber: count + 1,
        queueStatus: "waiting",
      },
    });
  }

  return NextResponse.json(record, { status: 201 });
}
