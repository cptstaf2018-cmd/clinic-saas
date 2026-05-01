import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId;
  const { searchParams } = new URL(req.url);

  const range = searchParams.get("range") ?? "today"; // today | week | upcoming | past | all
  const status = searchParams.get("status") ?? "all";
  const search = searchParams.get("search") ?? "";

  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);

  let dateFilter: Record<string, unknown> = {};
  if (range === "today")    dateFilter = { gte: startOfToday, lte: endOfToday };
  else if (range === "week") dateFilter = { gte: startOfWeek, lte: endOfWeek };
  else if (range === "upcoming") dateFilter = { gte: startOfToday };
  else if (range === "past") dateFilter = { lt: startOfToday };

  const where: Record<string, unknown> = {
    clinicId,
    ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    ...(status !== "all" ? { status } : {}),
  };

  const appointments = await db.appointment.findMany({
    where,
    include: { patient: { select: { name: true, whatsappPhone: true } } },
    orderBy: [{ date: "asc" }, { queueNumber: "asc" }],
    take: 200,
  });

  const filtered = search
    ? appointments.filter((a: { patient: { name: string; whatsappPhone: string } }) =>
        a.patient.name.includes(search) || a.patient.whatsappPhone.includes(search)
      )
    : appointments;

  return NextResponse.json(filtered);
}
