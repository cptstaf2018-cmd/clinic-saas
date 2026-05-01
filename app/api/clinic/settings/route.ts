import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: {
      name: true,
      whatsappNumber: true,
      logoUrl: true,
      botEnabled: true,
      whatsappPhoneNumberId: true,
      whatsappAccessToken: true,
      whatsappWelcomeMessage: true,
    },
  });

  if (!clinic) return NextResponse.json({ error: "العيادة غير موجودة" }, { status: 404 });

  return NextResponse.json({
    ...clinic,
    whatsappAccessToken: clinic.whatsappAccessToken ? "••••••••" : "",
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const allowed = ["name", "whatsappNumber", "botEnabled", "whatsappPhoneNumberId", "whatsappAccessToken", "whatsappWelcomeMessage"];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body && body[key] !== undefined) {
      // Don't overwrite token if masked value sent back
      if (key === "whatsappAccessToken" && body[key] === "••••••••") continue;
      data[key] = body[key];
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const clinic = await db.clinic.update({
    where: { id: session.user.clinicId },
    data,
    select: { id: true, name: true },
  });

  return NextResponse.json({ success: true, clinic });
}
