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

  const updated = await db.$transaction(async (tx) => {
    // Mark current patient as done
    await tx.appointment.updateMany({
      where: { clinicId, queueStatus: "current", date: { gte: startOfDay, lte: endOfDay } },
      data: { queueStatus: "done", status: "completed" },
    });

    // Find next waiting patient (lowest queueNumber)
    const next = await tx.appointment.findFirst({
      where: {
        clinicId,
        queueStatus: "waiting",
        status: { in: ["pending", "confirmed"] },
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { queueNumber: "asc" },
    });

    if (!next) return null;

    return tx.appointment.update({
      where: { id: next.id },
      data: { queueStatus: "current" },
    });
  });

  if (!updated) {
    return NextResponse.json({ error: "لا يوجد مريض في الانتظار" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
