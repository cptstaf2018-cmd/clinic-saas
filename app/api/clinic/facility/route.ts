import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isFacilityType } from "@/lib/facility-types";

/**
 * Lab and pharmacy have no medical specialty, so choosing one finishes
 * onboarding. A clinic keeps onboarding open until its specialty is saved
 * through /api/clinic/specialty.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { facilityType } = await req.json().catch(() => ({ facilityType: "" }));
  if (!isFacilityType(facilityType) || facilityType === "clinic") {
    return NextResponse.json({ error: "يرجى اختيار نوع صحيح" }, { status: 400 });
  }

  await db.clinic.update({
    where: { id: session.user.clinicId },
    data: { facilityType, specialty: null, specialtyOnboardingRequired: false },
  });

  return NextResponse.json({ success: true });
}
