import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseFacilityChoice } from "@/lib/facility-types";

/**
 * First-run setup: the new account says what it is (clinic, lab, pharmacy) and what it is called.
 * Lab and pharmacy have no medical specialty, so choosing one finishes onboarding. A clinic
 * keeps onboarding open until its specialty is saved through /api/clinic/specialty.
 * It only works while onboarding is pending, so an established account can never flip its type.
 */
export async function POST(req: Request) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const parsed = parseFacilityChoice(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { facilityType, name } = parsed.value;

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { specialtyOnboardingRequired: true, specialty: true } });
  if (!clinic?.specialtyOnboardingRequired || clinic.specialty) {
    return NextResponse.json({ error: "تم إعداد المنشأة مسبقاً" }, { status: 409 });
  }

  await db.clinic.update({
    where: { id: clinicId },
    data: facilityType === "clinic" ? { facilityType, name } : { facilityType, name, specialty: null, specialtyOnboardingRequired: false },
  });

  return NextResponse.json({ success: true });
}
