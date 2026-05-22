import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  const clinicId = (session?.user as { clinicId?: string })?.clinicId;
  if (!clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const dateParam = req.nextUrl.searchParams.get("date");
  if (!dateParam) return NextResponse.json({ ok: true });

  const dateObj = new Date(dateParam);
  if (isNaN(dateObj.getTime())) return NextResponse.json({ ok: true });

  const conflict = await db.appointment.findFirst({
    where: { clinicId, date: dateObj, status: { notIn: ["cancelled"] } },
    include: { patient: { select: { name: true } } },
  });

  if (conflict) {
    return NextResponse.json(
      { error: `هذا الوقت محجوز باسم ${conflict.patient.name}` },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
