import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isMedicalSpecialty } from "@/lib/medical-specialties";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      logoUrl: true,
      address: true,
      locationUrl: true,
      botEnabled: true,
      whatsappPhoneNumberId: true,
      whatsappAccessToken: true,
      whatsappWelcomeMessage: true,
      botOutOfScopeMessage: true,
      botMedicalDisclaimer: true,
      botHandoffMessage: true,
      botShowWorkingHours: true,
      botShowLocation: true,
      specialty: true,
      settings: true,
    },
  });

  if (!clinic) return NextResponse.json({ error: "العيادة غير موجودة" }, { status: 404 });

  return NextResponse.json({
    ...clinic,
    clinicId: clinic.id,
    specialty: clinic.settings?.specialtyCode ?? clinic.specialty ?? "internal_medicine",
    whatsappAccessToken: clinic.whatsappAccessToken ? "••••••••" : "",
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "name",
    "address",
    "locationUrl",
    "botEnabled",
    "whatsappPhoneNumberId",
    "whatsappAccessToken",
    "whatsappWelcomeMessage",
    "botOutOfScopeMessage",
    "botMedicalDisclaimer",
    "botHandoffMessage",
    "botShowWorkingHours",
    "botShowLocation",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body && body[key] !== undefined) {
      // Don't overwrite token if masked value sent back
      if (key === "whatsappAccessToken" && body[key] === "••••••••") continue;
      data[key] = body[key];
    }
  }

  if ("specialty" in body && body.specialty !== undefined) {
    if (typeof body.specialty !== "string" || !isMedicalSpecialty(body.specialty)) {
      return NextResponse.json({ error: "اختصاص العيادة غير صحيح" }, { status: 400 });
    }
    data.specialty = body.specialty;
    data.specialtyOnboardingRequired = false;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const clinicId = session.user.clinicId;
  const [clinic] = await db.$transaction([
    db.clinic.update({
      where: { id: clinicId },
      data,
      select: { id: true, name: true, specialty: true },
    }),
    ...(typeof body.specialty === "string" && isMedicalSpecialty(body.specialty)
      ? [
          db.clinicSettings.upsert({
            where: { clinicId },
            create: { clinicId, specialtyCode: body.specialty, setupCompleted: true },
            update: { specialtyCode: body.specialty, setupCompleted: true },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ success: true, clinic });
}
