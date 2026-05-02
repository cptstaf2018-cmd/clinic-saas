import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { clinicName, phone, password, invitationCode } = await req.json();

  if (!clinicName || !phone || !password || !invitationCode) {
    return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
  }

  // Verify invitation code
  const codeRecord = await db.invitationCode.findUnique({
    where: { code: invitationCode.trim().toUpperCase() },
  });

  if (!codeRecord) {
    return NextResponse.json({ error: "كود الدعوة غير صحيح" }, { status: 400 });
  }
  if (codeRecord.used) {
    return NextResponse.json({ error: "كود الدعوة مستخدم مسبقاً" }, { status: 400 });
  }

  // Check clinic not already registered
  const existingClinic = await db.clinic.findUnique({ where: { whatsappNumber: phone.trim() } });
  if (existingClinic) {
    return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 400 });
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

  // Mark code as used
  await db.invitationCode.update({
    where: { id: codeRecord.id },
    data: { used: true, usedAt: new Date(), clinicId: clinic.id },
  });

  return NextResponse.json({ success: true, clinicId: clinic.id });
}
