import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import InvoiceView from "@/components/InvoiceView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "فاتورة بيع", robots: { index: false, follow: false } };

const PAYMENT_LABEL: Record<string, string> = { cash: "نقداً", zaincash: "زين كاش", debt: "دين (غير مدفوع)" };

export default async function PharmacyInvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const { id } = await params;
  const sale = await db.pharmacySale.findFirst({
    where: { id, clinicId },
    include: { items: true, clinic: { select: { name: true, address: true, whatsappNumber: true, logoUrl: true, facilityType: true } } },
  });
  if (!sale || sale.clinic.facilityType !== "pharmacy") notFound();

  return (
    <InvoiceView
      autoPrint={(await searchParams).print === "1"}
      invoice={{
        kind: "pharmacy",
        issuer: { name: sale.clinic.name, address: sale.clinic.address, phone: sale.clinic.whatsappNumber, logoUrl: sale.clinic.logoUrl },
        number: sale.number,
        date: sale.createdAt.toISOString(),
        party: { label: "الزبون", name: sale.customerName, phone: sale.customerPhone, extra: null },
        lines: sale.items.map((item) => ({ name: item.name, detail: null, qty: item.qty, unitPrice: item.price, total: item.price * item.qty })),
        subtotal: sale.subtotal,
        discount: sale.discount,
        total: sale.total,
        paymentLabel: PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod,
        paid: sale.paymentMethod !== "debt",
        voided: sale.voidedAt ? { reason: sale.voidReason } : null,
        note: null,
      }}
    />
  );
}
