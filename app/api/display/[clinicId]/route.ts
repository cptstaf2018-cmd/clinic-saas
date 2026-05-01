import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const { clinicId } = await params;

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [current, waiting] = await Promise.all([
    db.appointment.findFirst({
      where: {
        clinicId,
        queueStatus: "current",
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { patient: { select: { name: true } } },
    }),
    db.appointment.findMany({
      where: {
        clinicId,
        queueStatus: "waiting",
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { patient: { select: { name: true } } },
      orderBy: { queueNumber: "asc" },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    current: current
      ? { name: current.patient.name, queueNumber: current.queueNumber }
      : null,
    waiting: (waiting as Array<{ patient: { name: string }; queueNumber: number | null }>).map((a) => ({
      name: a.patient.name,
      queueNumber: a.queueNumber,
    })),
  });
}
