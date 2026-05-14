import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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

  // جدولة الإرسال بعد يومين — الكرون يتكفل بالإرسال الفعلي
  const cheerAt = new Date();
  cheerAt.setDate(cheerAt.getDate() + 2);

  await db.appointment.update({
    where: { id: appointmentId },
    data: { cheerAt, cheerSent: false },
  });

  return NextResponse.json({ ok: true, scheduledFor: cheerAt.toISOString() });
}
