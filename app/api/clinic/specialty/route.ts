import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMedicalSpecialty } from "@/lib/medical-specialties";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { specialty } = await req.json().catch(() => ({ specialty: "" }));
  if (typeof specialty !== "string" || !isMedicalSpecialty(specialty)) {
    return NextResponse.json({ error: "يرجى اختيار اختصاص صحيح" }, { status: 400 });
  }

  await db.$transaction([
    db.clinic.update({
      where: { id: session.user.clinicId },
      data: {
        specialty,
        specialtyOnboardingRequired: false,
      },
    }),
    db.clinicSettings.upsert({
      where: { clinicId: session.user.clinicId },
      create: {
        clinicId: session.user.clinicId,
        specialtyCode: specialty,
        setupCompleted: true,
      },
      update: {
        specialtyCode: specialty,
        setupCompleted: true,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
