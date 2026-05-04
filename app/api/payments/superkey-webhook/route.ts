import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const VALID_PLANS = ["basic", "standard", "premium"] as const;
type Plan = (typeof VALID_PLANS)[number];

export async function POST(req: Request) {
  const secret   = req.headers.get("x-superkey-secret") ?? "";
  const expected = process.env.SUPERKEY_WEBHOOK_SECRET ?? "";

  const authorized =
    expected.length > 0 &&
    secret.length === expected.length &&
    timingSafeEqual(Buffer.from(secret), Buffer.from(expected));

  if (!authorized) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body: {
    clinicId: string;
    amount: number;
    plan: Plan;
    reference?: string;
  } = await req.json();

  if (!body.clinicId || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "clinicId و amount مطلوبان ويجب أن يكون المبلغ أكبر من صفر" },
      { status: 400 }
    );
  }

  if (!VALID_PLANS.includes(body.plan)) {
    return NextResponse.json(
      { error: "الباقة غير صحيحة — القيم المقبولة: basic, standard, premium" },
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
      update: { status: "active", plan: body.plan, expiresAt },
      create: {
        clinicId: body.clinicId,
        status: "active",
        plan: body.plan,
        expiresAt,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
