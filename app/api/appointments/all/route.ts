import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function getIraqParts(date: Date) {
  const iraqDate = new Date(date.getTime() + IRAQ_OFFSET_MS);
  return {
    year: iraqDate.getUTCFullYear(),
    month: iraqDate.getUTCMonth() + 1,
    day: iraqDate.getUTCDate(),
    dayOfWeek: iraqDate.getUTCDay(),
  };
}

function iraqDayStartUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { searchParams } = new URL(req.url);

  const range = searchParams.get("range") ?? "today"; // today | week | upcoming | past | all
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";

  const now = new Date();
  const today = getIraqParts(now);
  const startOfToday = iraqDayStartUtc(today.year, today.month, today.day);
  const endOfToday = new Date(startOfToday.getTime() + DAY_MS - 1);
  const startOfWeek = new Date(startOfToday.getTime() - today.dayOfWeek * DAY_MS);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * DAY_MS - 1);

  let dateFilter: Record<string, unknown> = {};
  if (range === "today")    dateFilter = { gte: startOfToday, lte: endOfToday };
  else if (range === "week") dateFilter = { gte: startOfWeek, lte: endOfWeek };
  else if (range === "upcoming") dateFilter = { gte: startOfToday };
  else if (range === "past") dateFilter = { lt: startOfToday };

  const where: Record<string, unknown> = {
    clinicId,
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(search ? {
      patient: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { whatsappPhone: { contains: search } },
        ],
      },
    } : {}),
  };

  const appointments = await db.appointment.findMany({
    where,
    include: { patient: { select: { name: true, whatsappPhone: true } } },
    orderBy: [{ date: "asc" }, { queueNumber: "asc" }],
    take: 300,
  });

  return NextResponse.json(appointments);
}
