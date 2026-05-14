import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cache في الذاكرة لمدة 3 ثواني لكل عيادة
const cache = new Map<string, { data: unknown; expiresAt: number }>();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const { clinicId } = await params;

  // أرجع من الـ cache إذا لم تنتهِ مدته
  const cached = cache.get(clinicId);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true, logoUrl: true },
  });

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

  const data = {
    clinicName: clinic?.name ?? "",
    logoUrl: clinic?.logoUrl ?? null,
    current: current
      ? { name: current.patient.name, queueNumber: current.queueNumber }
      : null,
    waiting: (waiting as Array<{ patient: { name: string }; queueNumber: number | null }>).map((a) => ({
      name: a.patient.name,
      queueNumber: a.queueNumber,
    })),
  };

  cache.set(clinicId, { data, expiresAt: Date.now() + 3000 });

  return NextResponse.json(data);
}
