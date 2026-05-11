import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractPlanFromReference, isPlanId, planFromAmount } from "@/lib/plans";
import { createPaymentActivationCode } from "@/lib/activation-codes";
import { dateAfterDays, PAID_SUBSCRIPTION_DAYS } from "@/lib/subscription-durations";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  // 🔒 CRITICAL: Check role is exactly superadmin
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // 🔒 CRITICAL: Superadmin MUST NOT have clinicId
  if (session.user.clinicId) {
    console.warn(
      `[SECURITY] Superadmin has clinicId: ${session.user.clinicId}`
    );
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const body: { action: "approve" | "reject"; plan?: string } = await req.json();

  const payment = await db.payment.findUnique({
    where: { id },
    include: { clinic: { select: { name: true, whatsappNumber: true } } },
  });
  if (!payment) {
    return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
  }

  if (body.action === "approve") {
    const inferredPlan = extractPlanFromReference(payment.reference) ?? planFromAmount(payment.amount) ?? "basic";
    const plan = isPlanId(body.plan) ? body.plan : inferredPlan;
    const days = PAID_SUBSCRIPTION_DAYS;
    const expiresAt = dateAfterDays(days);

    await db.$transaction([
      db.payment.update({ where: { id }, data: { status: "approved" } }),
      db.subscription.upsert({
        where: { clinicId: payment.clinicId },
        update: { status: "active", plan, expiresAt },
        create: {
          clinicId: payment.clinicId,
          status: "active",
          plan,
          expiresAt,
        },
      }),
    ]);

    const activation = await createPaymentActivationCode({
      paymentId: payment.id,
      clinicId: payment.clinicId,
      clinicName: payment.clinic.name,
      whatsappNumber: payment.clinic.whatsappNumber,
      plan,
      days,
    });

    return NextResponse.json({ success: true, activationCode: activation.code });
  }

  if (body.action === "reject") {
    await db.payment.update({ where: { id }, data: { status: "rejected" } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });
}
