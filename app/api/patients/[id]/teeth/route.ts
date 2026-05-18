import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/feature-gates";

async function getClinicAndCheck(patientId: string, clinicId: string) {
  const [patient, subscription, clinic] = await Promise.all([
    db.patient.findFirst({ where: { id: patientId, clinicId } }),
    db.subscription.findUnique({ where: { clinicId } }),
    db.clinic.findUnique({ where: { id: clinicId }, select: { specialty: true } }),
  ]);
  return { patient, subscription, clinic };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const treatments = await db.toothTreatment.findMany({
    where: { patientId: id, clinicId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ treatments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const { patient, subscription, clinic } = await getClinicAndCheck(id, clinicId);
  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  if (!canUseFeature(subscription?.plan, "dentalChart")) {
    return NextResponse.json({ error: "خريطة الأسنان متاحة في الخطة المميزة فما فوق" }, { status: 403 });
  }

  const isDental = clinic?.specialty?.toLowerCase().includes("dent") || clinic?.specialty?.toLowerCase().includes("أسنان");
  if (!isDental) {
    return NextResponse.json({ error: "هذه الميزة لعيادات طب الأسنان فقط" }, { status: 403 });
  }

  const { toothNumber, treatment, notes } = await req.json();
  if (!toothNumber || !treatment) return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });

  // إذا السن موجود بالفعل — حدّثه
  const existing = await db.toothTreatment.findFirst({
    where: { patientId: id, clinicId, toothNumber },
  });

  let result;
  if (existing) {
    result = await db.toothTreatment.update({
      where: { id: existing.id },
      data: { treatment, notes: notes ?? null },
    });
  } else {
    result = await db.toothTreatment.create({
      data: { clinicId, patientId: id, toothNumber, treatment, notes: notes ?? null },
    });
  }

  return NextResponse.json({ treatment: result });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const { toothNumber } = await req.json();

  await db.toothTreatment.deleteMany({
    where: { patientId: id, clinicId, toothNumber },
  });

  return NextResponse.json({ ok: true });
}
