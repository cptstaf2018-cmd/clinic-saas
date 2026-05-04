import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const clinicId = session.user.clinicId as string;

  const messages = await db.incomingMessage.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Attach patient name if phone is registered
  const phones = [...new Set(messages.map((m) => m.phone))];
  const patients = await db.patient.findMany({
    where: { clinicId, whatsappPhone: { in: phones } },
    select: { whatsappPhone: true, name: true },
  });
  const nameMap = Object.fromEntries(patients.map((p) => [p.whatsappPhone, p.name]));

  return NextResponse.json(
    messages.map((m) => ({ ...m, patientName: nameMap[m.phone] ?? null }))
  );
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const clinicId = session.user.clinicId as string;

  const { id } = await req.json();
  await db.incomingMessage.updateMany({
    where: { id, clinicId },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
