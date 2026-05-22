import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;

function generateSlots(start: string, end: string, taken: Date[], isToday: boolean, nowUtc: Date): string[] {
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const iraqMin = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes() + 180;
  const startMin = toMin(start), endMin = toMin(end);
  const nowMin = isToday ? iraqMin(nowUtc) : 0;
  const takenSet = new Set(taken.map(d => {
    const im = iraqMin(d); return `${Math.floor(im / 60) % 24}:${String(im % 60).padStart(2, "0")}`;
  }));
  const slots: string[] = [];
  for (let m = startMin; m < endMin && slots.length < 12; m += 20) {
    if (isToday && m <= nowMin) continue;
    const h = Math.floor(m / 60), min = m % 60;
    if (!takenSet.has(`${h}:${String(min).padStart(2, "0")}`))
      slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "ص" : "م";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(dh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId;
  if (!clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  if (!dateParam) return NextResponse.json({ slots: [] });

  const [Y, Mo, D] = dateParam.split("-").map(Number);
  const nowUtc = new Date();
  const nowIraq = new Date(nowUtc.getTime() + IRAQ_OFFSET_MS);
  const todayIraq = `${nowIraq.getUTCFullYear()}-${String(nowIraq.getUTCMonth() + 1).padStart(2, "0")}-${String(nowIraq.getUTCDate()).padStart(2, "0")}`;
  const isToday = dateParam === todayIraq;

  const target = new Date(Date.UTC(Y, Mo - 1, D));
  const dow = target.getUTCDay();

  const wh = await db.workingHours.findUnique({ where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: dow } } });
  if (!wh?.isOpen) return NextResponse.json({ slots: [], closed: true });

  const utcStart = new Date(Date.UTC(Y, Mo - 1, D, -3, 0, 0));
  const utcEnd   = new Date(utcStart.getTime() + 86400000 - 1);

  const taken = await db.appointment.findMany({
    where: { clinicId, date: { gte: utcStart, lte: utcEnd }, status: { notIn: ["cancelled"] } },
    select: { date: true },
  });

  const raw = generateSlots(wh.startTime, wh.endTime, taken.map(a => a.date), isToday, nowUtc);
  const slots = raw.map(s => ({ value: s, label: formatTime(s) }));

  return NextResponse.json({ slots });
}
