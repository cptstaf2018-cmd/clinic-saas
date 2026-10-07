import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPharmacyToday } from "@/lib/pharmacy/queries";

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
    db.pharmacySale.aggregate({ where: { clinicId, paymentMethod: "debt" }, _sum: { total: true }, _count: true }),
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
                <li key={sale.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                  <span className="w-16 text-sm font-bold text-brand-on-soft">#{sale.number}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-brand-ink">{sale.items.map((item) => `${item.name} × ${item.qty}`).join("، ")}</span>
                  {sale.customerName && <span className="text-xs text-brand-muted">{sale.customerName}</span>}
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${sale.paymentMethod === "debt" ? "bg-amber-50 text-amber-800" : "bg-brand-line text-brand-muted"}`}>{PAYMENT_LABEL[sale.paymentMethod] ?? sale.paymentMethod}</span>
                  <span className="w-24 text-left font-bold text-brand-ink">{money(sale.total)}</span>
                  <span className="w-28 text-left text-xs text-brand-muted">{sale.createdAt.toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
