import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { dateAfterDays, TRIAL_PERIOD_DAYS } from "@/lib/subscription-durations";
import { sendWhatsApp } from "@/lib/whatsapp";

// In-memory rate limiter: max 5 attempts per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  record.count++;
  return record.count > 5;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "محاولات كثيرة، حاول بعد 15 دقيقة" },
      { status: 429 }
    );
  }

  const { clinicName, phone, password, invitationCode } = await req.json();

  if (!clinicName || !phone || !password || !invitationCode) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  // Check clinic not already registered before touching the code
  const existingClinic = await db.clinic.findUnique({ where: { whatsappNumber: phone.trim() } });
  if (existingClinic) {
    return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 400 });
  }

  // Find the code first to give a specific error if it doesn't exist at all
  const codeRecord = await db.invitationCode.findFirst({
    where: { code: invitationCode.trim().toUpperCase() },
  });

  if (!codeRecord || codeRecord.used) {
    return NextResponse.json({ error: "كود الدعوة غير صالح" }, { status: 400 });
  }

  // Atomic claim — prevents two concurrent requests from using the same code
  const claimed = await db.invitationCode.updateMany({
    where: { id: codeRecord.id, used: false },
    data: { used: true, usedAt: new Date() },
  });

  if (claimed.count === 0) {
    return NextResponse.json({ error: "كود الدعوة غير صالح" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialExpiresAt = dateAfterDays(TRIAL_PERIOD_DAYS);

  const clinic = await db.clinic.create({
    data: {
      name: clinicName,
      whatsappNumber: phone.trim(),
      specialtyOnboardingRequired: true,
      users: {
        create: { passwordHash, role: "doctor" },
      },
      subscription: {
        create: { plan: "trial", status: "trial", expiresAt: trialExpiresAt },
      },
    },
  });

  // Link code to clinic
  await db.invitationCode.update({
    where: { id: codeRecord.id },
    data: { clinicId: clinic.id },
  });

  // Welcome message — fire and forget, never blocks registration
  try {
    const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
    if (settings?.adminWasenderKey) {
      await sendWhatsApp(
        phone.trim(),
        `مرحباً بعيادة ${clinicName} 🏥\n\nتم تفعيل حسابك بنجاح.\nلديك فترة تجريبية مجانية لمدة 14 يوم.\n\nسجّل دخولك الآن:\nwww.clinic-ai-pro.com/login\n\nفريق عيادتي`,
        settings.adminWasenderKey
      );
    }
  } catch {}

  return NextResponse.json({ success: true, clinicId: clinic.id });
}
