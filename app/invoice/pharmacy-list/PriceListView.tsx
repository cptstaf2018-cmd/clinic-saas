"use client";

import { useMemo, useState } from "react";
import { BRAND_NAME, BrandMark } from "@/components/BrandLogo";
import { PRODUCT_CATEGORIES } from "@/lib/pharmacy/product";

type Product = { id: string; name: string; genericName: string | null; form: string | null; category: string; price: number; stock: number; requiresRx: boolean };

type Props = {
  pharmacy: { name: string; address: string | null; phone: string | null };
  products: Product[];
  printedAt: string;
};

const money = (value: number) => value.toLocaleString("ar-IQ");
const CHECK = "h-5 w-5 accent-[#0E2440]";

/** A printable medicines and price list. A4, with options for what to show. */
export default function PriceListView({ pharmacy, products, printedAt }: Props) {
  const [category, setCategory] = useState("");
  const [showStock, setShowStock] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const visible = useMemo(
    () => products.filter((product) => (!category || product.category === category) && (!onlyAvailable || product.stock > 0)),
    [products, category, onlyAvailable]
  );
  const date = new Date(printedAt).toLocaleDateString("ar-IQ", { timeZone: "Asia/Baghdad", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-brand-bg py-6 print:bg-white print:py-0" dir="rtl">
      <style>{`@media print { @page { size: A4; margin: 12mm; } body { background: #fff !important; } thead { display: table-header-group; } tr { break-inside: avoid; } }`}</style>

      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-brand-ink">
          <select aria-label="التصنيف" value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-brand-border bg-white px-3 outline-none focus:border-brand-blue">
            <option value="">كل التصنيفات</option>
            {PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className={CHECK} checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} />المتوفر فقط</label>
          <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" className={CHECK} checked={showStock} onChange={(event) => setShowStock(event.target.checked)} />إظهار الكمية</label>
        </div>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-2xl bg-brand-gold px-8 text-sm font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">طباعة</button>
      </div>

      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-sm text-brand-ink shadow-[0_1px_0_rgba(14,36,64,0.08)] print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-4 border-b border-brand-border pb-4">
          <div>
            <h1 className="text-2xl font-bold">{pharmacy.name}</h1>
            {pharmacy.address && <p className="mt-0.5 text-brand-muted">{pharmacy.address}</p>}
            {pharmacy.phone && <p className="text-brand-muted" dir="ltr" style={{ textAlign: "right" }}>{pharmacy.phone}</p>}
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">قائمة الأدوية والأسعار</p>
            <p className="mt-0.5 text-xs text-brand-muted">{date} · {money(visible.length)} صنف</p>
          </div>
        </header>

        {visible.length === 0 ? (
          <p className="py-10 text-center text-brand-muted">لا توجد أصناف مطابقة.</p>
        ) : (
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-xs text-brand-muted">
                <th className="w-10 py-2 text-right font-semibold">#</th>
                <th className="py-2 text-right font-semibold">الدواء</th>
                {showStock && <th className="w-20 py-2 text-center font-semibold">الكمية</th>}
                <th className="w-28 py-2 text-left font-semibold">السعر (د.ع)</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product, index) => (
                <tr key={product.id} className="border-b border-brand-line align-top">
                  <td className="py-2 text-xs text-brand-muted">{money(index + 1)}</td>
                  <td className="py-2 pl-2">
                    <p className="font-semibold">{product.name}{product.requiresRx && <span className="mr-2 text-[11px] font-medium text-brand-muted">(بوصفة)</span>}</p>
                    {(product.form || product.genericName) && <p className="text-xs text-brand-muted">{[product.form, product.genericName].filter(Boolean).join(" · ")}</p>}
                  </td>
                  {showStock && <td className="py-2 text-center">{money(product.stock)}</td>}
                  <td className="py-2 text-left font-bold">{money(product.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="mt-6 flex items-center justify-between gap-2 border-t border-brand-border pt-3 text-xs text-brand-muted">
          <span>الأسعار قابلة للتغيير</span>
          <span className="flex items-center gap-1.5"><BrandMark size={16} />{BRAND_NAME}</span>
        </footer>
      </article>
    </div>
  );
}
