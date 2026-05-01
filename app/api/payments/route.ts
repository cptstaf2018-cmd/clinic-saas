import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const body: { amount: number; method: "manual" | "superkey"; reference?: string } =
    await req.json();

  if (!body.amount || !body.method) {
    return NextResponse.json(
      { error: "amount و method مطلوبان" },
      { status: 400 }
    );
  }

  const payment = await db.payment.create({
    data: {
      clinicId,
      amount: body.amount,
      method: body.method,
      status: "pending",
      reference: body.reference ?? null,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
