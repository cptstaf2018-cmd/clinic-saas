import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacy } from "@/lib/pharmacy/access";
import { parseProduct } from "@/lib/pharmacy/product";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const parsed = parseProduct(body as Record<string, unknown>, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    // updateMany scopes the write to this clinic, so another clinic's id updates nothing
    const result = await db.pharmacyProduct.updateMany({
      where: { id, clinicId: access.clinicId, active: true },
      data: parsed.value,
    });
    if (result.count === 0) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "يوجد منتج آخر بنفس الباركود" }, { status: 409 });
    }
    throw error;
  }

  const product = await db.pharmacyProduct.findFirst({ where: { id, clinicId: access.clinicId } });
  return NextResponse.json(product);
}

/** Products are archived, not deleted, so past invoices keep pointing at them. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const result = await db.pharmacyProduct.updateMany({
    where: { id, clinicId: access.clinicId, active: true },
    data: { active: false, barcode: null },
  });
  if (result.count === 0) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  return NextResponse.json({ success: true });
}
