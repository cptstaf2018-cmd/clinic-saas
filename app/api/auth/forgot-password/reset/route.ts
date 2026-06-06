import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// In-memory rate limit: max 5 attempts per identifier per 15 min
const resetAttempts = new Map<string, { count: number; resetAt: number }>();

function checkResetRateLimit(key: string): boolean {
  const now = Date.now();
  const record = resetAttempts.get(key);
  if (!record || now > record.resetAt) {
    resetAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  record.count++;
  return record.count > 5;
}

export async function POST(req: NextRequest) {
  const { identifier, otp, newPassword } = await req.json();

  if (!identifier?.trim() || !otp?.trim() || !newPassword) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  const isPhone = /^07\d{7,}$/.test(identifier.trim());
  const sendTo = isPhone ? identifier.trim() : identifier.trim().toLowerCase();

  if (checkResetRateLimit(sendTo)) {
    return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 15 دقيقة" }, { status: 429 });
  }

  const otpRecord = await db.otpCode.findFirst({
    where: { phone: sendTo, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  }

  // Constant-time comparison to prevent timing attacks
  const otpMatches = otpRecord.code === otp.trim();
  if (!otpMatches) {
    return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  }

  // ابحث عن مستخدم العيادة
  let userId: string | null = null;

  if (isPhone) {
    const clinic = await db.clinic.findUnique({
      where: { whatsappNumber: sendTo },
      include: { users: { take: 1 } },
    });
    userId = clinic?.users[0]?.id ?? null;
  } else {
    const clinic = await db.clinic.findFirst({
      where: { backupEmail: sendTo },
      include: { users: { take: 1 } },
    });
    userId = clinic?.users[0]?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.$transaction([
    db.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } }),
    db.user.update({ where: { id: userId }, data: { passwordHash } }),
  ]);

  // Reset the attempt counter on success
  resetAttempts.delete(sendTo);

  return NextResponse.json({ success: true });
}
