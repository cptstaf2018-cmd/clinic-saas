import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacy } from "@/lib/pharmacy/access";
import { parseProduct, type ProductInput } from "@/lib/pharmacy/product";

const MAX_PRODUCTS = 5000;

export async function GET() {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;

  const products = await db.pharmacyProduct.findMany({
    where: { clinicId: access.clinicId, active: true },
    orderBy: { name: "asc" },
    take: MAX_PRODUCTS,
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const parsed = parseProduct(body as Record<string, unknown>);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const count = await db.pharmacyProduct.count({ where: { clinicId: access.clinicId, active: true } });
  if (count >= MAX_PRODUCTS) return NextResponse.json({ error: "وصلت للحد الأقصى من المنتجات" }, { status: 400 });

  try {
    const product = await db.pharmacyProduct.create({
      data: { ...(parsed.value as ProductInput), clinicId: access.clinicId },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "يوجد منتج آخر بنفس الباركود" }, { status: 409 });
    }
    throw error;
  }
}
