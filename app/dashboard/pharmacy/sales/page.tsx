import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPharmacyToday } from "@/lib/pharmacy/queries";
import SaleRow from "./SaleRow";

const PAYMENT_LABEL: Record<string, string> = { cash: "نقداً", zaincash: "زين كاش", debt: "دين" };
const PAGE_SIZE = 100;

function money(value: number) {
  return value.toLocaleString("ar-IQ");
}

export default async function PharmacySalesPage() {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "pharmacy") redirect("/dashboard");

  const [today, sales, debts] = await Promise.all([
    getPharmacyToday(clinicId),
    db.pharmacySale.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      include: { items: { select: { id: true, name: true, qty: true } } },
    }),
    db.pharmacySale.aggregate({ where: { clinicId, paymentMethod: "debt", voidedAt: null }, _sum: { total: true }, _count: true }),
  ]);

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <h1 className="text-3xl font-bold text-brand-ink">الفواتير</h1>
          <p className="mt-1 text-sm text-brand-muted">آخر {money(PAGE_SIZE)} فاتورة</p>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-3xl bg-brand-navy p-4 text-white"><p className="text-xs text-brand-side-muted">مبيعات اليوم</p><p className="mt-1 text-2xl font-bold">{money(today.sales)}</p></div>
          <div className="rounded-3xl border border-brand-border bg-white p-4"><p className="text-xs text-brand-muted">فواتير اليوم</p><p className="mt-1 text-2xl font-bold text-brand-ink">{money(today.invoices)}</p></div>
          <div className="rounded-3xl border border-brand-border bg-white p-4"><p className="text-xs text-brand-muted">ربح اليوم</p><p className="mt-1 text-2xl font-bold text-brand-mint-text">{money(today.profit)}</p></div>
          <div className="rounded-3xl border border-brand-border bg-white p-4"><p className="text-xs text-brand-muted">مبيعات بالدين</p><p className="mt-1 text-2xl font-bold text-amber-700">{money(debts._sum.total ?? 0)}</p><p className="text-xs text-brand-muted">{money(debts._count)} فاتورة</p></div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-border bg-white">
          {sales.length === 0 ? (
            <p className="p-10 text-center text-sm text-brand-muted">لا توجد فواتير بعد.</p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {sales.map((sale) => (
                <SaleRow
                  key={sale.id}
                  sale={{
                    id: sale.id,
                    number: sale.number,
                    summary: sale.items.map((item) => `${item.name} × ${item.qty}`).join("، "),
                    customerName: sale.customerName,
                    paymentLabel: PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod,
                    isDebt: sale.paymentMethod === "debt",
                    total: sale.total,
                    when: sale.createdAt.toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
                    voided: sale.voidedAt !== null,
                    voidReason: sale.voidReason,
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
