import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const { appointmentId }: { appointmentId: string } = await req.json();

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, clinicId },
    include: { patient: true, clinic: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
  }

  const dateStr = new Date(appointment.date).toLocaleDateString("ar-IQ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = new Date(appointment.date).toLocaleTimeString("ar-IQ", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await sendWhatsApp(
    appointment.patient.whatsappPhone,
    `تذكير بموعدك 🔔\nعيادة: ${appointment.clinic.name}\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nنراك قريباً! 🏥`
  );

  return NextResponse.json({ success: true });
}
