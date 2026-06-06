import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

async function isRateLimited(sendTo: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = await db.otpCode.count({
    where: { phone: sendTo, createdAt: { gte: windowStart } },
  });
  return recentCount >= 3;
}

function generate6(): string {
  return String(randomInt(100000, 1000000));
}

export async function POST(req: NextRequest) {
  const { identifier } = await req.json();
  if (!identifier?.trim()) {
    return NextResponse.json({ error: "أدخل رقم الواتساب أو الإيميل" }, { status: 400 });
  }

  const isPhone = /^07\d{7,}$/.test(identifier.trim());
  const sendTo = isPhone ? identifier.trim() : identifier.trim().toLowerCase();
  const method: "whatsapp" | "email" = isPhone ? "whatsapp" : "email";

  if (await isRateLimited(sendTo)) {
    return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 15 دقيقة" }, { status: 429 });
  }

  let clinicFound = false;

  if (isPhone) {
    const clinic = await db.clinic.findUnique({
      where: { whatsappNumber: sendTo },
      select: { id: true },
    });
    clinicFound = !!clinic;
  } else {
    const clinic = await db.clinic.findFirst({
      where: { backupEmail: sendTo },
      select: { id: true },
    });
    clinicFound = !!clinic;
  }

  // Always return success to prevent user enumeration
  if (!clinicFound) {
    return NextResponse.json({ success: true, method, masked: maskIdentifier(sendTo, method) });
  }

  // إلغاء OTPs السابقة
  await db.otpCode.updateMany({
    where: { phone: sendTo, used: false },
    data: { used: true },
  });

  const code = generate6();
  await db.otpCode.create({
    data: { phone: sendTo, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  if (method === "whatsapp") {
    const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
    const adminKey = settings?.adminWasenderKey || process.env.ADMIN_WASENDER_KEY || process.env.WHATSAPP_API_TOKEN;
    await sendWhatsApp(
      sendTo,
      `عيادتي 🏥 — إعادة تعيين كلمة المرور\n\nكود التحقق:\n\n*${code}*\n\nصالح لمدة 10 دقائق.\nإذا لم تطلب هذا، تجاهل الرسالة.`,
      adminKey ?? undefined
    );
  } else {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "عيادتي <noreply@clinic-ai-pro.com>",
      to: sendTo,
      subject: "كود إعادة تعيين كلمة المرور",
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#0c1f3f">إعادة تعيين كلمة المرور 🔑</h2>
        <p style="color:#475569">كود التحقق الخاص بك:</p>
        <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#2563eb;margin:24px 0;text-align:center">${code}</div>
        <p style="color:#94a3b8;font-size:13px">صالح لمدة 10 دقائق. إذا لم تطلب هذا، تجاهل الرسالة.</p>
      </div>`,
    });
  }

  return NextResponse.json({ success: true, method, masked: maskIdentifier(sendTo, method) });
}

function maskIdentifier(value: string, method: "whatsapp" | "email"): string {
  if (method === "whatsapp") {
    return value.slice(0, 4) + "****" + value.slice(-3);
  }
  const [user, domain] = value.split("@");
  return user.slice(0, 2) + "***@" + domain;
}
