import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isUniqueViolation, requireLab } from "@/lib/lab/access";
import { parseOrderInput } from "@/lib/lab/order";
import { orderTotal } from "@/lib/lab/result";
import { listBoardOrders } from "@/lib/lab/queries";

const NUMBER_RETRIES = 3;

export async function GET() {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;

  const orders = await listBoardOrders(access.clinicId);
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const { clinicId } = access;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const parsed = parseOrderInput(body as Record<string, unknown>);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { testIds, ...order } = parsed.value;

  // Only this lab's active tests; prices and ranges are copied so later catalog edits never change the order.
  const tests = await db.labTest.findMany({ where: { clinicId, active: true, id: { in: testIds } } });
  if (tests.length !== testIds.length) return NextResponse.json({ error: "أحد التحاليل غير موجود في الكتالوج" }, { status: 400 });

  for (let attempt = 1; attempt <= NUMBER_RETRIES; attempt++) {
    try {
      const created = await db.$transaction(async (tx) => {
        const last = await tx.labOrder.aggregate({ where: { clinicId }, _max: { number: true } });
        return tx.labOrder.create({
          data: {
            ...order,
            clinicId,
            number: (last._max.number ?? 1000) + 1,
            total: orderTotal(tests),
            publicToken: randomBytes(18).toString("base64url"),
            items: {
              create: tests.map((test) => ({
                testId: test.id,
                name: test.name,
                unit: test.unit,
                price: test.price,
                refLowM: test.refLowM,
                refHighM: test.refHighM,
                refLowF: test.refLowF,
                refHighF: test.refHighF,
                critLow: test.critLow,
                critHigh: test.critHigh,
              })),
            },
          },
          include: { items: true },
        });
      });
      return NextResponse.json(created, { status: 201 });
    } catch (error: unknown) {
      if (isUniqueViolation(error) && attempt < NUMBER_RETRIES) continue;
      throw error;
    }
  }
  return NextResponse.json({ error: "تعذر إنشاء الطلب، حاول مجدداً" }, { status: 409 });
}
