import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacy } from "@/lib/pharmacy/access";

const MAX_QTY = 1_000_000;
const MAX_MONEY = 100_000_000;

/** Receives stock: adds units atomically, so sales made at the till meanwhile are never overwritten. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const qty = body?.qty;
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return NextResponse.json({ error: "الكمية غير صحيحة" }, { status: 400 });
  const cost = body?.cost;
  if (cost !== undefined && cost !== null && (!Number.isInteger(cost) || cost < 0 || cost > MAX_MONEY)) {
    return NextResponse.json({ error: "سعر الشراء غير صحيح" }, { status: 400 });
  }

  const result = await db.pharmacyProduct.updateMany({
    where: { id, clinicId: access.clinicId, active: true },
    data: { stock: { increment: qty }, ...(typeof cost === "number" ? { cost } : {}) },
  });
  if (result.count === 0) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });

  const product = await db.pharmacyProduct.findFirst({ where: { id, clinicId: access.clinicId } });
  return NextResponse.json(product);
}
