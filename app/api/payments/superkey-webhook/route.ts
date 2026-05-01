import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const secret = req.headers.get("SUPERKEY_WEBHOOK_SECRET");
  if (!secret || secret !== process.env.SUPERKEY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body: {
    clinicId: string;
    amount: number;
    reference?: string;
  } = await req.json();

  if (!body.clinicId || !body.amount) {
    return NextResponse.json(
      { error: "clinicId و amount مطلوبان" },
      { status: 400 }
    );
  }

  const clinic = await db.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "العيادة غير موجودة" }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await db.$transaction([
    db.payment.create({
      data: {
        clinicId: body.clinicId,
        amount: body.amount,
        method: "superkey",
        status: "approved",
        reference: body.reference ?? null,
      },
    }),
    db.subscription.upsert({
      where: { clinicId: body.clinicId },
      update: { status: "active", expiresAt },
      create: {
        clinicId: body.clinicId,
        status: "active",
        plan: "basic",
        expiresAt,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
