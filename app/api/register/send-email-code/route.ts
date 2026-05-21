import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  record.count++;
  return record.count > 3;
}

function generate6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "الإيميل غير صحيح" }, { status: 400 });
  }

  const cleanEmail = email.trim().toLowerCase();

  if (isRateLimited(cleanEmail)) {
    return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 15 دقيقة" }, { status: 429 });
  }

  const existing = await db.clinic.findFirst({ where: { backupEmail: cleanEmail } });
  if (existing) {
    return NextResponse.json({ error: "هذا الإيميل مسجل مسبقاً" }, { status: 400 });
  }

  // Invalidate previous OTPs for this email
  await db.otpCode.updateMany({
    where: { phone: cleanEmail, used: false },
    data: { used: true },
  });

  const code = generate6();
  await db.otpCode.create({
    data: {
      phone: cleanEmail,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  await sendOtpEmail(cleanEmail, code);

  return NextResponse.json({ success: true });
}
