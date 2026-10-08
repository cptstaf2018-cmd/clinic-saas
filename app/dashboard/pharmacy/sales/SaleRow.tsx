"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Sale = {
  id: string;
  number: number;
  summary: string;
  customerName: string | null;
  paymentLabel: string;
  isDebt: boolean;
  total: number;
  when: string;
  voided: boolean;
  voidReason: string | null;
};

export default function SaleRow({ sale }: { sale: Sale }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function voidSale() {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/pharmacy/sales/${sale.id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setError(data.error ?? "تعذر إلغاء الفاتورة، تحقق من الاتصال");
      return;
    }
    setAsking(false);
    router.refresh();
  }

  return (
    <li className={`px-5 py-3.5 ${sale.voided ? "bg-brand-bg/70" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="w-16 text-sm font-bold text-brand-on-soft">#{sale.number}</span>
        <span className={`min-w-0 flex-1 truncate text-sm ${sale.voided ? "text-brand-muted line-through" : "text-brand-ink"}`}>{sale.summary}</span>
        {sale.customerName && <span className="text-xs text-brand-muted">{sale.customerName}</span>}
        {sale.voided ? (
          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">ملغاة</span>
        ) : (
          <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${sale.isDebt ? "bg-amber-50 text-amber-800" : "bg-brand-line text-brand-muted"}`}>{sale.paymentLabel}</span>
        )}
        <span className={`w-24 text-left font-bold ${sale.voided ? "text-brand-muted line-through" : "text-brand-ink"}`}>{sale.total.toLocaleString("ar-IQ")}</span>
        <span className="w-28 text-left text-xs text-brand-muted">{sale.when}</span>
        {!sale.voided && !asking && (
          <button type="button" onClick={() => setAsking(true)} className="min-h-9 rounded-xl px-3 text-xs font-semibold text-red-700 hover:bg-red-50">إلغاء الفاتورة</button>
        )}
      </div>

      {sale.voided && sale.voidReason && <p className="mt-1 text-xs text-brand-muted">سبب الإلغاء: {sale.voidReason}</p>}

      {asking && (
        <div className="mt-3 rounded-2xl bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">إلغاء الفاتورة #{sale.number}؟ ستعود الكميات إلى المخزون وتخرج من مبيعات اليوم، وتبقى الفاتورة في السجل.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="سبب الإلغاء (اختياري)" aria-label="سبب الإلغاء" className="h-10 min-w-0 flex-1 rounded-xl border border-red-200 bg-white px-3 text-sm outline-none focus:border-red-400" />
            <button type="button" disabled={busy} onClick={voidSale} className="min-h-10 rounded-xl bg-red-600 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? "جاري..." : "تأكيد الإلغاء"}</button>
            <button type="button" disabled={busy} onClick={() => setAsking(false)} className="min-h-10 rounded-xl bg-white px-4 text-sm font-semibold text-brand-ink ring-1 ring-brand-border">رجوع</button>
          </div>
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
        </div>
      )}
    </li>
  );
}
