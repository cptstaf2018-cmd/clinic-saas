import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ProductsClient from "./ProductsClient";
import { imageUrl } from "@/lib/pharmacy/queries";

export default async function PharmacyProductsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "pharmacy") redirect("/dashboard");

  const products = await db.pharmacyProduct.findMany({
    where: { clinicId, active: true },
    orderBy: { name: "asc" },
  });
  const { filter } = await searchParams;

  return (
    <ProductsClient
      initialFilter={filter === "low" ? "low" : "all"}
      initialProducts={products.map((product) => ({
        ...product,
        expiresAt: product.expiresAt ? product.expiresAt.toISOString().slice(0, 10) : null,
        imageUrl: imageUrl(product.id, product.imagePath, product.updatedAt),
        imagePath: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      }))}
    />
  );
}
