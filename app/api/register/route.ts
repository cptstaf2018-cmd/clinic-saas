import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
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

  if (!codeRecord) {
    return NextResponse.json({ error: "كود الدعوة غير صحيح" }, { status: 400 });
  }
  if (codeRecord.used) {
    return NextResponse.json({ error: "كود الدعوة مستخدم مسبقاً" }, { status: 400 });
  }

  // Atomic claim — prevents two concurrent requests from using the same code
  const claimed = await db.invitationCode.updateMany({
    where: { id: codeRecord.id, used: false },
    data: { used: true, usedAt: new Date() },
  });

  if (claimed.count === 0) {
    return NextResponse.json({ error: "كود الدعوة مستخدم مسبقاً" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);

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

  // Link code to clinic
  await db.invitationCode.update({
    where: { id: codeRecord.id },
    data: { clinicId: clinic.id },
  });

  return NextResponse.json({ success: true, clinicId: clinic.id });
}
