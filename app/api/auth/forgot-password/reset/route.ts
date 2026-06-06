import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

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

  const otpRecord = await db.otpCode.findFirst({
    where: { phone: sendTo, used: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord || otpRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  }

  // Wrong code → immediately invalidate OTP (forces user to request a new one)
  if (otpRecord.code !== otp.trim()) {
    await db.otpCode.update({ where: { id: otpRecord.id }, data: { used: true } });
    return NextResponse.json({ error: "الكود غير صحيح. أطلب كوداً جديداً." }, { status: 400 });
  }

  // OTP is valid — look up the clinic user
  // Note: whatsappNumber is @unique so phone OTPs are always bound to exactly one clinic.
  // backupEmail has no unique constraint; findFirst returns the first match which is acceptable
  // for the current scale. A future migration should add @unique to backupEmail.
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

  return NextResponse.json({ success: true });
}
