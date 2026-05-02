import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;

  // Delete patients + appointments + whatsapp sessions only
  // Keeps: clinic, user, working hours, subscription, payments
  const [sessions, appointments, patients] = await db.$transaction([
    db.whatsappSession.deleteMany({ where: { clinicId } }),
    db.appointment.deleteMany({ where: { clinicId } }),
    db.patient.deleteMany({ where: { clinicId } }),
  ]);

  return NextResponse.json({
    deleted: {
      patients: patients.count,
      appointments: appointments.count,
      sessions: sessions.count,
    },
  });
}
