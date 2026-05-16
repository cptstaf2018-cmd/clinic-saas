import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

// Rate limit: 3 requests per IP per 15 minutes
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);
  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  record.count++;
  return record.count > 3;
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

  const { phone } = await req.json();

  if (!phone || !/^07\d{8,9}$/.test(phone.trim())) {
    return NextResponse.json({ error: "رقم الهاتف غير صحيح" }, { status: 400 });
  }

  const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.adminWasenderKey) {
    return NextResponse.json(
      { error: "خدمة الإرسال غير متاحة حالياً، تواصل مع الدعم" },
      { status: 503 }
    );
  }

  // Pick first available unused code
  const code = await db.invitationCode.findFirst({
    where: { used: false },
    orderBy: { createdAt: "asc" },
  });

  if (!code) {
    return NextResponse.json(
      { error: "لا توجد كودات متاحة حالياً، تواصل مع الدعم" },
      { status: 404 }
    );
  }

  await sendWhatsApp(
    phone.trim(),
    `مرحباً 👋\n\nكود تسجيلك في منصة عيادتي:\n\n*${code.code}*\n\nأدخله في صفحة التسجيل:\nwww.clinic-ai-pro.com/register\n\nفريق عيادتي`,
    settings.adminWasenderKey
  );

  return NextResponse.json({ success: true });
}
