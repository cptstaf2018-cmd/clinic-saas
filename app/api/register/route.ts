import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { clinicName, phone, password, otp } = await req.json();

  if (!clinicName || !phone || !password || !otp) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  // Verify OTP
  const otpRecord = await db.otpCode.findFirst({
    where: {
      phone: phone.trim(),
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  }

  if (otpRecord.code !== otp.trim()) {
    return NextResponse.json({ error: "الكود غير صحيح" }, { status: 400 });
  }

  // Check clinic not already registered
  const existingClinic = await db.clinic.findUnique({ where: { whatsappNumber: phone.trim() } });
  if (existingClinic) {
    return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);

  // Create clinic — no email required
  const clinic = await db.clinic.create({
    data: {
      name: clinicName,
      whatsappNumber: phone.trim(),
      users: {
        create: { passwordHash, role: "doctor" },
      },
      subscription: {
        create: { plan: "trial", status: "trial", expiresAt: trialExpiresAt },
      },
    },
  });

  // Mark OTP as used
  await db.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return NextResponse.json({ success: true, clinicId: clinic.id });
}
