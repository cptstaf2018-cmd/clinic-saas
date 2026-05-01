import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;

  const hours = await db.workingHours.findMany({
    where: { clinicId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(hours);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;

  let body: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOpen: boolean;
  }>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "يجب إرسال مصفوفة" }, { status: 400 });
  }

  // Upsert each day
  const results = await Promise.all(
    body.map((day) =>
      db.workingHours.upsert({
        where: {
          clinicId_dayOfWeek: { clinicId, dayOfWeek: day.dayOfWeek },
        },
        update: {
          startTime: day.startTime,
          endTime: day.endTime,
          isOpen: day.isOpen,
        },
        create: {
          clinicId,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isOpen: day.isOpen,
        },
      })
    )
  );

  return NextResponse.json(results);
}
