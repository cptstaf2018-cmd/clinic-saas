import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import InvoiceView from "@/components/InvoiceView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "فاتورة تحاليل", robots: { index: false, follow: false } };

export default async function LabInvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const { id } = await params;
  const order = await db.labOrder.findFirst({
    where: { id, clinicId },
    include: { items: { orderBy: { name: "asc" } }, clinic: { select: { name: true, address: true, whatsappNumber: true, logoUrl: true, facilityType: true } } },
  });
  if (!order || order.clinic.facilityType !== "lab") notFound();

  const extra = [order.sex === "f" ? "أنثى" : "ذكر", order.age !== null ? `${order.age} سنة` : null, order.doctorName ? `الطبيب: ${order.doctorName}` : null].filter(Boolean).join(" · ");

  return (
    <InvoiceView
      autoPrint={(await searchParams).print === "1"}
      invoice={{
        kind: "lab",
        issuer: { name: order.clinic.name, address: order.clinic.address, phone: order.clinic.whatsappNumber, logoUrl: order.clinic.logoUrl },
        number: order.number,
        date: order.createdAt.toISOString(),
        party: { label: "المراجع", name: order.patientName, phone: order.patientPhone, extra },
        lines: order.items.map((item) => ({ name: item.name, detail: null, qty: 1, unitPrice: item.price, total: item.price })),
        subtotal: order.total,
        discount: 0,
        total: order.total,
        paymentLabel: order.paid ? "مدفوع" : "غير مدفوع",
        paid: order.paid,
        voided: order.status === "cancelled" ? { reason: null } : null,
        note: null,
      }}
    />
  );
}
