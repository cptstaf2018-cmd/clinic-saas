import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { dateAfterDays, TRIAL_PERIOD_DAYS } from "@/lib/subscription-durations";
import { sendWhatsApp } from "@/lib/whatsapp";

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
    return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 15 دقيقة" }, { status: 429 });
  }

  const { clinicName, registrationType, phone, email, otp, password } = await req.json();

  if (!clinicName || !password || !otp) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  const isEmailReg = registrationType === "email";

  // ── Phone registration ────────────────────────────────────────────────────
  if (!isEmailReg) {
    if (!phone) return NextResponse.json({ error: "رقم الواتساب مطلوب" }, { status: 400 });

    const existingClinic = await db.clinic.findUnique({ where: { whatsappNumber: phone.trim() } });
    if (existingClinic) {
      return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 400 });
    }

    // Validate OTP (stored in OtpCode via send-otp endpoint)
    const otpRecord = await db.otpCode.findFirst({
      where: { phone: phone.trim(), code: otp.trim(), used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      // Fallback: try invitation code table (request-code flow)
      const codeRecord = await db.invitationCode.findFirst({
        where: { code: otp.trim().toUpperCase() },
      });
      if (!codeRecord || codeRecord.used) {
        return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
      }
      const claimed = await db.invitationCode.updateMany({
        where: { id: codeRecord.id, used: false },
        data: { used: true, usedAt: new Date() },
      });
      if (claimed.count === 0) {
        return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const trialExpiresAt = dateAfterDays(TRIAL_PERIOD_DAYS);
      const clinic = await db.clinic.create({
        data: {
          name: clinicName,
          whatsappNumber: phone.trim(),
          specialtyOnboardingRequired: true,
          users: { create: { passwordHash, role: "doctor" } },
          subscription: { create: { plan: "trial", status: "trial", expiresAt: trialExpiresAt } },
        },
      });
      await db.invitationCode.update({ where: { id: codeRecord.id }, data: { clinicId: clinic.id } });
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

    // Mark OTP used
    await db.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

    const passwordHash = await bcrypt.hash(password, 10);
    const trialExpiresAt = dateAfterDays(TRIAL_PERIOD_DAYS);
    const clinic = await db.clinic.create({
      data: {
        name: clinicName,
        whatsappNumber: phone.trim(),
        specialtyOnboardingRequired: true,
        users: { create: { passwordHash, role: "doctor" } },
        subscription: { create: { plan: "trial", status: "trial", expiresAt: trialExpiresAt } },
      },
    });
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

  // ── Email registration ────────────────────────────────────────────────────
  if (!email) return NextResponse.json({ error: "الإيميل مطلوب" }, { status: 400 });

  const cleanEmail = email.trim().toLowerCase();

  const existingEmail = await db.clinic.findFirst({ where: { backupEmail: cleanEmail } });
  if (existingEmail) {
    return NextResponse.json({ error: "هذا الإيميل مسجل مسبقاً" }, { status: 400 });
  }

  const otpRecord = await db.otpCode.findFirst({
    where: { phone: cleanEmail, code: otp.trim(), used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  }

  await db.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });

  const passwordHash = await bcrypt.hash(password, 10);
  const trialExpiresAt = dateAfterDays(TRIAL_PERIOD_DAYS);

  const clinic = await db.clinic.create({
    data: {
      name: clinicName,
      backupEmail: cleanEmail,
      specialtyOnboardingRequired: true,
      users: { create: { passwordHash, role: "doctor" } },
      subscription: { create: { plan: "trial", status: "trial", expiresAt: trialExpiresAt } },
    },
  });

  // Send welcome email
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "عيادتي <noreply@clinic-ai-pro.com>",
      to: cleanEmail,
      subject: "مرحباً بعيادتك في منصة عيادتي",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:32px">
        <h2 style="color:#1e293b">مرحباً بعيادة ${clinicName} 🏥</h2>
        <p style="color:#475569">تم تفعيل حسابك بنجاح. لديك فترة تجريبية مجانية لمدة 14 يوم.</p>
        <a href="https://www.clinic-ai-pro.com/login" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">سجّل دخولك الآن</a>
      </div>`,
    });
  } catch {}

  return NextResponse.json({ success: true, clinicId: clinic.id });
}
