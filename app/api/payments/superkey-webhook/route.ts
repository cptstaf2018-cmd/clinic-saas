import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  encodePaymentReference,
  getPlanDurationPrice,
  isPlanId,
  isSubscriptionDurationId,
  PlanId,
  SUBSCRIPTION_DURATIONS,
} from "@/lib/plans";
import { createPaymentActivationCode } from "@/lib/activation-codes";
import { validatePaymentReference } from "@/lib/payment-reference";
import { dateAfterDays, PAID_SUBSCRIPTION_DAYS } from "@/lib/subscription-durations";

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
    plan: PlanId;
    duration?: string;
    reference: string;
  } = await req.json();

  if (!body.clinicId || typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "clinicId و amount مطلوبان ويجب أن يكون المبلغ أكبر من صفر" },
      { status: 400 }
    );
  }

  if (!body.reference?.trim()) {
    return NextResponse.json({ error: "reference مطلوب لمنع الدفع المكرر" }, { status: 400 });
  }

  if (!isPlanId(body.plan)) {
    return NextResponse.json(
      { error: "الباقة غير صحيحة — القيم المقبولة: basic, standard, premium" },
      { status: 400 }
    );
  }

  const duration = isSubscriptionDurationId(body.duration) ? body.duration : "monthly";
  if (body.amount !== getPlanDurationPrice(body.plan, duration)) {
    return NextResponse.json(
      { error: "المبلغ لا يطابق الباقة والمدة المختارة" },
      { status: 400 }
    );
  }

  const referenceCheck = body.reference
    ? validatePaymentReference("superkey", body.reference)
    : null;

  if (referenceCheck && !referenceCheck.ok) {
    return NextResponse.json({ error: referenceCheck.error }, { status: 400 });
  }

  const storedReference = referenceCheck
    ? encodePaymentReference(body.plan, referenceCheck.reference, duration)
    : null;

  if (storedReference) {
    const duplicate = await db.payment.findFirst({
      where: {
        method: "superkey",
        reference: storedReference,
        status: "approved",
      },
    });

    if (duplicate) return NextResponse.json({ success: true, duplicate: true });
  }

  const clinic = await db.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "العيادة غير موجودة" }, { status: 404 });
  }

  const days = SUBSCRIPTION_DURATIONS[duration]?.days ?? PAID_SUBSCRIPTION_DAYS;
  const expiresAt = dateAfterDays(days);

  const [payment] = await db.$transaction([
    db.payment.create({
      data: {
        clinicId: body.clinicId,
        amount: body.amount,
        method: "superkey",
        status: "approved",
        reference: storedReference,
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

  const activation = await createPaymentActivationCode({
    paymentId: payment.id,
    clinicId: body.clinicId,
    clinicName: clinic.name,
    whatsappNumber: clinic.whatsappNumber ?? "",
    plan: body.plan,
    days,
  });

  return NextResponse.json({ success: true, activationCode: activation.code });
}
