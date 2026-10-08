import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import PriceListView from "./PriceListView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "قائمة الأدوية", robots: { index: false, follow: false } };

export default async function PharmacyListPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { name: true, address: true, whatsappNumber: true, facilityType: true } });
  if (clinic?.facilityType !== "pharmacy") redirect("/dashboard");

  const products = await db.pharmacyProduct.findMany({
    where: { clinicId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, genericName: true, form: true, category: true, price: true, stock: true, requiresRx: true },
  });

  return <PriceListView pharmacy={{ name: clinic.name, address: clinic.address, phone: clinic.whatsappNumber }} products={products} printedAt={new Date().toISOString()} />;
}
