import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

function generate6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^07\d{8,9}$/.test(phone.trim())) {
    return NextResponse.json({ error: "رقم الهاتف غير صحيح" }, { status: 400 });
  }

  const cleanPhone = phone.trim();

  // Prevent duplicate active clinics
  const existing = await db.clinic.findUnique({ where: { whatsappNumber: cleanPhone } });
  if (existing) {
    return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 400 });
  }

  // Invalidate previous OTPs for this phone
  await db.otpCode.updateMany({
    where: { phone: cleanPhone, used: false },
    data: { used: true },
  });

  // Generate new OTP
  const code = generate6();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.otpCode.create({
    data: { phone: cleanPhone, code, expiresAt },
  });

  // Send via Super Admin's WasenderAPI key
  const adminKey = process.env.ADMIN_WASENDER_KEY || process.env.WHATSAPP_API_TOKEN;

  await sendWhatsApp(
    cleanPhone,
    `مرحباً بك في عيادتي 🏥\n\nكود التحقق الخاص بك:\n\n*${code}*\n\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`,
    adminKey ?? undefined
  );

  return NextResponse.json({ success: true });
}
