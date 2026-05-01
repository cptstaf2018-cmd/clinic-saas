import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;

  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    select: {
      name: true,
      whatsappPhoneNumberId: true,
      whatsappAccessToken: true,
    },
  });

  if (!clinic) return NextResponse.json({ error: "العيادة غير موجودة" }, { status: 404 });

  const today = new Date();
  const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: {
      clinicId,
      status: { in: ["pending", "confirmed"] },
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: { patient: true },
  });

  if (appointments.length === 0) {
    return NextResponse.json({ sent: 0, message: "لا توجد مواعيد اليوم" });
  }

  const apiKey = clinic.whatsappAccessToken ?? undefined;

  let sent = 0;
  for (const apt of appointments) {
    const timeStr = new Date(apt.date).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
    await sendWhatsApp(
      apt.patient.whatsappPhone,
      `تذكير بموعدك اليوم 🔔\nعيادة: ${clinic.name}\nالوقت: ${timeStr}\nنراك قريباً 🏥`,
      apiKey
    );
    sent++;
  }

  return NextResponse.json({ sent, message: `تم إرسال ${sent} تذكير` });
}
