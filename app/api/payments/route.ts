import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encodePaymentReference, isPlanId, PLAN_PRICES } from "@/lib/plans";
import { PaymentMethodId, validatePaymentReference } from "@/lib/payment-reference";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const body: { amount: number; method: PaymentMethodId; plan?: string; reference?: string } =
    await req.json();

  if (!body.amount || !body.method || !body.plan || !body.reference?.trim()) {
    return NextResponse.json(
      { error: "الباقة والمبلغ ورقم العملية مطلوبة" },
      { status: 400 }
    );
  }

  if (!["superkey", "zaincash", "crypto"].includes(body.method)) {
    return NextResponse.json({ error: "طريقة الدفع غير صحيحة" }, { status: 400 });
  }

  if (!isPlanId(body.plan)) {
    return NextResponse.json({ error: "الباقة غير صحيحة" }, { status: 400 });
  }

  if (body.amount !== PLAN_PRICES[body.plan]) {
    return NextResponse.json(
      { error: "المبلغ لا يطابق الباقة المختارة" },
      { status: 400 }
    );
  }

  const referenceCheck = validatePaymentReference(body.method, body.reference ?? "");
  if (!referenceCheck.ok) {
    return NextResponse.json({ error: referenceCheck.error }, { status: 400 });
  }

  const pendingSamePlan = await db.payment.findFirst({
    where: {
      clinicId,
      status: "pending",
      reference: { contains: `[plan:${body.plan}]` },
    },
  });

  if (pendingSamePlan) {
    return NextResponse.json(
      { error: "لديك طلب دفع معلق لهذه الباقة. انتظر مراجعة السوبر أدمن أو تواصل مع الدعم." },
      { status: 409 }
    );
  }

  const duplicate = await db.payment.findFirst({
    where: {
      method: body.method,
      reference: { contains: referenceCheck.reference },
      status: { in: ["pending", "approved"] },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "رقم العملية مستخدم مسبقاً ولا يمكن إرساله مرة أخرى" },
      { status: 409 }
    );
  }

  const payment = await db.payment.create({
    data: {
      clinicId,
      amount: body.amount,
      method: body.method,
      status: "pending",
      reference: encodePaymentReference(body.plan, referenceCheck.reference),
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
