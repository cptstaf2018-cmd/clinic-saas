import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { clinicName, whatsappNumber, email, password } = await req.json();

  if (!clinicName || !whatsappNumber || !email || !password) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "الإيميل مسجل مسبقاً" }, { status: 400 });
  }

  const existingClinic = await db.clinic.findUnique({ where: { whatsappNumber } });
  if (existingClinic) {
    return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);

  const clinic = await db.clinic.create({
    data: {
      name: clinicName,
      whatsappNumber,
      users: {
        create: { email, passwordHash, role: "doctor" },
      },
      subscription: {
        create: {
          plan: "trial",
          status: "trial",
          expiresAt: trialExpiresAt,
        },
      },
    },
  });

  return NextResponse.json({ success: true, clinicId: clinic.id });
}
