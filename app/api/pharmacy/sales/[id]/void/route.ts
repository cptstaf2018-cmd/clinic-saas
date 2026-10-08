import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacy } from "@/lib/pharmacy/access";
import { canVoidSale, parseVoidReason } from "@/lib/pharmacy/sale";

/**
 * Cancels an invoice made by mistake. The record stays (sales are auditable),
 * it stops counting in the totals, and the sold quantities go back to stock.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const reason = parseVoidReason((body as { reason?: unknown })?.reason);

  const result = await db.$transaction(async (tx) => {
    const sale = await tx.pharmacySale.findFirst({ where: { id, clinicId: access.clinicId }, include: { items: true } });
    if (!sale) return { error: "الفاتورة غير موجودة", status: 404 } as const;
    if (!canVoidSale(sale)) return { error: "الفاتورة ملغاة سابقاً", status: 409 } as const;

    // Conditional update: if two clicks race, only one wins and stock is restored once.
    const claimed = await tx.pharmacySale.updateMany({ where: { id, clinicId: access.clinicId, voidedAt: null }, data: { voidedAt: new Date(), voidReason: reason } });
    if (claimed.count === 0) return { error: "الفاتورة ملغاة سابقاً", status: 409 } as const;

    for (const item of sale.items) {
      await tx.pharmacyProduct.updateMany({ where: { id: item.productId, clinicId: access.clinicId }, data: { stock: { increment: item.qty } } });
    }
    return { ok: true } as const;
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true });
}
