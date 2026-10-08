import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discardImage, receiveImage, sendImage } from "@/lib/entity-image";
import { requirePharmacy } from "@/lib/pharmacy/access";

type Ctx = { params: Promise<{ id: string }> };

const findProduct = (id: string, clinicId: string) =>
  db.pharmacyProduct.findFirst({ where: { id, clinicId, active: true }, select: { id: true, imagePath: true } });

export async function GET(_req: Request, { params }: Ctx) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const product = await findProduct((await params).id, access.clinicId);
  return sendImage(product?.imagePath ?? null);
}

export async function POST(req: Request, { params }: Ctx) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const product = await findProduct((await params).id, access.clinicId);
  if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });

  const saved = await receiveImage(req, `pharmacy/${access.clinicId}`);
  if (saved instanceof NextResponse) return saved;

  await db.pharmacyProduct.updateMany({ where: { id: product.id, clinicId: access.clinicId }, data: { imagePath: saved.path } });
  await discardImage(product.imagePath);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const product = await findProduct((await params).id, access.clinicId);
  if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });

  await db.pharmacyProduct.updateMany({ where: { id: product.id, clinicId: access.clinicId }, data: { imagePath: null } });
  await discardImage(product.imagePath);
  return NextResponse.json({ success: true });
}
