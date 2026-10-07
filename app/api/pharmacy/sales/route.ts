import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacy } from "@/lib/pharmacy/access";
import { computeSale, validatePayment, type SaleLineInput } from "@/lib/pharmacy/sale";
import { getPharmacyToday } from "@/lib/pharmacy/queries";

const NUMBER_RETRIES = 3;

class SaleError extends Error {}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET() {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;

  const [today, recent] = await Promise.all([
    getPharmacyToday(access.clinicId),
    db.pharmacySale.findMany({
      where: { clinicId: access.clinicId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: { select: { name: true, qty: true, price: true } } },
    }),
  ]);
  return NextResponse.json({ today, recent });
}

export async function POST(req: Request) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const { clinicId } = access;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });
  const { lines, discount = 0, paymentMethod, customerName, customerPhone } = body as Record<string, unknown>;

  const payment = validatePayment(paymentMethod, { customerName, customerPhone });
  if (!payment.ok) return NextResponse.json({ error: payment.error }, { status: 400 });
  if (!Array.isArray(lines)) return NextResponse.json({ error: "الفاتورة فارغة" }, { status: 400 });

  const productIds = [...new Set(lines.map((line: SaleLineInput) => line?.productId).filter((id): id is string => typeof id === "string"))];

  for (let attempt = 1; attempt <= NUMBER_RETRIES; attempt++) {
    try {
      const sale = await db.$transaction(async (tx) => {
        const products = await tx.pharmacyProduct.findMany({ where: { clinicId, id: { in: productIds } } });
        const computed = computeSale(lines as SaleLineInput[], products, discount);
        if (!computed.ok) throw new SaleError(computed.error);

        // Conditional decrement: fails if another sale took the stock meanwhile
        for (const item of computed.items) {
          const updated = await tx.pharmacyProduct.updateMany({
            where: { id: item.productId, clinicId, stock: { gte: item.qty } },
            data: { stock: { decrement: item.qty } },
          });
          if (updated.count === 0) throw new SaleError(`نفدت كمية ${item.name} أثناء البيع، حدّث الصفحة`);
        }

        const last = await tx.pharmacySale.aggregate({ where: { clinicId }, _max: { number: true } });
        return tx.pharmacySale.create({
          data: {
            clinicId,
            number: (last._max.number ?? 1000) + 1,
            subtotal: computed.subtotal,
            discount: computed.discount,
            total: computed.total,
            cost: computed.cost,
            paymentMethod: payment.method,
            customerName: typeof customerName === "string" ? customerName.trim().slice(0, 80) || null : null,
            customerPhone: typeof customerPhone === "string" ? customerPhone.trim().slice(0, 20) || null : null,
            items: {
              create: computed.items.map(({ productId, name, qty, price, cost }) => ({ productId, name, qty, price, cost })),
            },
          },
          include: { items: true },
        });
      });
      return NextResponse.json(sale, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof SaleError) return NextResponse.json({ error: error.message }, { status: 400 });
      // Two sales grabbed the same invoice number: retry with the next one
      if (isUniqueViolation(error) && attempt < NUMBER_RETRIES) continue;
      throw error;
    }
  }
  return NextResponse.json({ error: "تعذر إتمام البيع، حاول مجدداً" }, { status: 409 });
}
