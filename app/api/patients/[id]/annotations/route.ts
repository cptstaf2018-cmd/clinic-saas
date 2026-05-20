import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/feature-gates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const patient = await db.patient.findFirst({ where: { id, clinicId } });
  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });

  const url = new URL(req.url);
  const specialtyCode = url.searchParams.get("specialty");

  const annotations = await db.specialtyAnnotation.findMany({
    where: { patientId: id, clinicId, ...(specialtyCode ? { specialtyCode } : {}) },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ annotations });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const [patient, subscription] = await Promise.all([
    db.patient.findFirst({ where: { id, clinicId } }),
    db.subscription.findUnique({ where: { clinicId } }),
  ]);

  if (!patient) return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
  if (!canUseFeature(subscription?.plan, "specialtyMap")) {
    return NextResponse.json({ error: "الخرائط التفاعلية متاحة في الخطة المميزة فما فوق" }, { status: 403 });
  }

  const { specialtyCode, regionId, label, color, notes } = await req.json();
  if (!specialtyCode || !regionId || !label || !color) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const existing = await db.specialtyAnnotation.findFirst({
    where: { patientId: id, clinicId, specialtyCode, regionId },
  });

  const result = existing
    ? await db.specialtyAnnotation.update({
        where: { id: existing.id },
        data: { label, color, notes: notes ?? null },
      })
    : await db.specialtyAnnotation.create({
        data: { clinicId, patientId: id, specialtyCode, regionId, label, color, notes: notes ?? null },
      });

  return NextResponse.json({ annotation: result });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const { specialtyCode, regionId } = await req.json();

  await db.specialtyAnnotation.deleteMany({
    where: { patientId: id, clinicId, specialtyCode, regionId },
  });

  return NextResponse.json({ ok: true });
}
