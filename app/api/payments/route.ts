import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encodePaymentReference, isPlanId, PLAN_PRICES } from "@/lib/plans";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const body: { amount: number; method: "manual" | "superkey" | "zaincash" | "crypto"; plan?: string; reference?: string } =
    await req.json();

  if (!body.amount || !body.method || !body.plan || !body.reference?.trim()) {
    return NextResponse.json(
      { error: "الباقة والمبلغ ورقم العملية مطلوبة" },
      { status: 400 }
    );
  }

  if (!["manual", "superkey", "zaincash", "crypto"].includes(body.method)) {
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

  const duplicate = await db.payment.findFirst({
    where: {
      clinicId,
      method: body.method,
      reference: encodePaymentReference(body.plan, body.reference),
      status: { in: ["pending", "approved"] },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "رقم العملية مسجل مسبقاً" },
      { status: 409 }
    );
  }

  const payment = await db.payment.create({
    data: {
      clinicId,
      amount: body.amount,
      method: body.method,
      status: "pending",
      reference: encodePaymentReference(body.plan, body.reference),
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
