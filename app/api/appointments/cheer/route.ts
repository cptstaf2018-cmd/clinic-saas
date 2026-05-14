import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const { appointmentId } = await req.json();

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId مطلوب" }, { status: 400 });
  }

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { name: true, whatsappPhone: true } },
      clinic: { select: { name: true } },
    },
  });

  if (!appointment || appointment.clinicId !== clinicId) {
    return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
  }

  const patientName = appointment.patient.name.split(" ")[0]; // الاسم الأول فقط
  const clinicName = appointment.clinic.name;
  const phone = appointment.patient.whatsappPhone;

  const message = [
    `السلام عليكم ${patientName} 🌿`,
    ``,
    `${clinicName} تطمئن عليكم وتتمنى لكم الشفاء العاجل 💙`,
    ``,
    `إذا احتجتم أي شيء، عيادتنا دائماً بخدمتكم.`,
  ].join("\n");

  await sendWhatsApp(phone, message, undefined, {
    clinicId,
    source: "cheer",
    appointmentId,
  });

  return NextResponse.json({ ok: true });
}
