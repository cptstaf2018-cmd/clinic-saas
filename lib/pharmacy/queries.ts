import { db } from "@/lib/db";

const BAGHDAD_OFFSET_MS = 3 * 60 * 60 * 1000; // Iraq is UTC+3 all year

export function startOfBaghdadDay(now = new Date()) {
  const local = new Date(now.getTime() + BAGHDAD_OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - BAGHDAD_OFFSET_MS);
}

export async function getPharmacyToday(clinicId: string) {
  const today = await db.pharmacySale.aggregate({
    where: { clinicId, voidedAt: null, createdAt: { gte: startOfBaghdadDay() } },
    _sum: { total: true, cost: true },
    _count: true,
  });
  const sales = today._sum.total ?? 0;
  return { sales, invoices: today._count, profit: sales - (today._sum.cost ?? 0) };
}

export function imageUrl(id: string, imagePath: string | null, updatedAt: Date): string | null {
  return imagePath ? `/api/pharmacy/products/${id}/image?v=${updatedAt.getTime()}` : null;
}

export async function listPosProducts(clinicId: string) {
  const rows = await db.pharmacyProduct.findMany({
    where: { clinicId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, genericName: true, category: true, form: true, barcode: true, price: true, stock: true, minStock: true, requiresRx: true, imagePath: true, updatedAt: true },
  });
  return rows.map(({ imagePath, updatedAt, ...product }) => ({ ...product, imageUrl: imageUrl(product.id, imagePath, updatedAt) }));
}
