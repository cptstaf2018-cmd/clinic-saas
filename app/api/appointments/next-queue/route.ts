import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Find the next waiting appointment (lowest queueNumber)
  const next = await db.appointment.findFirst({
    where: {
      clinicId,
      date: { gte: startOfDay, lte: endOfDay },
      queueStatus: "waiting",
      status: { not: "cancelled" },
    },
    orderBy: { queueNumber: "asc" },
  });

  if (!next) {
    return NextResponse.json(
      { error: "لا يوجد موعد في قائمة الانتظار" },
      { status: 404 }
    );
  }

  // Move previous "current" to "done" and set next to "current" in a transaction
  await db.$transaction([
    db.appointment.updateMany({
      where: {
        clinicId,
        date: { gte: startOfDay, lte: endOfDay },
        queueStatus: "current",
      },
      data: { queueStatus: "done" },
    }),
    db.appointment.update({
      where: { id: next.id },
      data: { queueStatus: "current" },
    }),
  ]);

  const updated = await db.appointment.findUnique({
    where: { id: next.id },
    include: {
      patient: { select: { id: true, name: true, whatsappPhone: true } },
    },
  });

  return NextResponse.json(updated);
}
