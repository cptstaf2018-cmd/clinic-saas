"use client";

import { useEffect, useState } from "react";
import { BRAND_NAME, BrandMark } from "@/components/BrandLogo";

export type InvoiceData = {
  kind: "pharmacy" | "lab";
  issuer: { name: string; address: string | null; phone: string | null; logoUrl: string | null };
  number: number;
  date: string;
  party: { label: string; name: string | null; phone: string | null; extra: string | null };
  lines: { name: string; detail: string | null; qty: number; unitPrice: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentLabel: string;
  paid: boolean;
  voided: { reason: string | null } | null;
  note: string | null;
};

type Format = "a4" | "thermal";

const money = (value: number) => value.toLocaleString("ar-IQ");

/**
 * A printable invoice. A4 for the desk, or an 80 mm receipt for a thermal printer.
 * With ?print=1 the print dialog opens by itself, so one tap from the till prints it.
 */
export default function InvoiceView({ invoice, autoPrint }: { invoice: InvoiceData; autoPrint: boolean }) {
  const [format, setFormat] = useState<Format>("a4");
  const thermal = format === "thermal";

  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  const when = new Date(invoice.date).toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const title = invoice.kind === "pharmacy" ? "فاتورة بيع" : "فاتورة تحاليل";

  return (
    <div className="min-h-screen bg-brand-bg py-6 print:bg-white print:py-0" dir="rtl">
      <style>{`@media print { @page { size: ${thermal ? "80mm auto" : "A4"}; margin: ${thermal ? "3mm" : "12mm"}; } body { background: #fff !important; } }`}</style>

      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 ring-1 ring-brand-border" role="group" aria-label="حجم الورق">
          {([["a4", "ورق A4"], ["thermal", "إيصال حراري 80mm"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={format === value} onClick={() => setFormat(value)} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${format === value ? "bg-brand-navy text-white" : "text-brand-muted"}`}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-2xl bg-brand-gold px-8 text-sm font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">طباعة</button>
      </div>

      <article className={`relative mx-auto overflow-hidden bg-white text-brand-ink shadow-[0_1px_0_rgba(14,36,64,0.08)] print:shadow-none ${thermal ? "max-w-[80mm] p-3 text-[12px]" : "max-w-3xl rounded-3xl p-8 text-sm print:rounded-none print:p-0"}`}>
        {invoice.voided && (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="-rotate-12 rounded-2xl border-4 border-red-500/70 px-8 py-2 text-5xl font-black text-red-500/70">ملغاة</span>
          </div>
        )}

        <header className={`flex items-start justify-between gap-4 border-b border-brand-border pb-4 ${thermal ? "flex-col items-center text-center" : ""}`}>
          <div className={`flex items-center gap-3 ${thermal ? "flex-col" : ""}`}>
            {invoice.issuer.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={invoice.issuer.logoUrl} alt="" className={`${thermal ? "h-12 w-12" : "h-16 w-16"} rounded-xl object-contain`} />
            )}
            <div>
              <h1 className={`${thermal ? "text-base" : "text-2xl"} font-bold`}>{invoice.issuer.name}</h1>
              {invoice.issuer.address && <p className="mt-0.5 text-brand-muted">{invoice.issuer.address}</p>}
              {invoice.issuer.phone && <p className="text-brand-muted" dir="ltr" style={{ textAlign: thermal ? "center" : "right" }}>{invoice.issuer.phone}</p>}
            </div>
          </div>
          <div className={thermal ? "" : "text-left"}>
            <p className={`${thermal ? "text-sm" : "text-xl"} font-bold`}>{title}</p>
            <p className="mt-0.5 font-semibold" dir="ltr">#{invoice.number}</p>
            <p className="text-xs text-brand-muted">{when}</p>
          </div>
        </header>

        {(invoice.party.name || invoice.party.phone) && (
          <section className="border-b border-brand-border py-3">
            <p className="text-xs text-brand-muted">{invoice.party.label}</p>
            <p className="font-bold">{invoice.party.name ?? "—"}</p>
            {invoice.party.phone && <p className="text-brand-muted" dir="ltr" style={{ textAlign: "right" }}>{invoice.party.phone}</p>}
            {invoice.party.extra && <p className="text-xs text-brand-muted">{invoice.party.extra}</p>}
          </section>
        )}

        <table className="mt-3 w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-xs text-brand-muted">
              <th className="py-2 text-right font-semibold">البند</th>
              <th className="py-2 text-center font-semibold">الكمية</th>
              {!thermal && <th className="py-2 text-center font-semibold">السعر</th>}
              <th className="py-2 text-left font-semibold">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={`${line.name}-${index}`} className="border-b border-brand-line align-top">
                <td className="py-2.5 pl-2">
                  <p className="font-semibold">{line.name}</p>
                  {line.detail && <p className="text-xs text-brand-muted">{line.detail}</p>}
                </td>
                <td className="py-2.5 text-center">{line.qty.toLocaleString("ar-IQ")}</td>
                {!thermal && <td className="py-2.5 text-center">{money(line.unitPrice)}</td>}
                <td className="py-2.5 text-left font-semibold">{money(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-4 ms-auto w-full max-w-xs space-y-1.5">
          {invoice.discount > 0 && (
            <>
              <div className="flex justify-between text-brand-muted"><span>المجموع</span><span>{money(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-brand-muted"><span>الخصم</span><span>− {money(invoice.discount)}</span></div>
            </>
          )}
          <div className={`flex items-baseline justify-between border-t border-brand-ink pt-2 ${thermal ? "text-base" : "text-xl"} font-bold`}>
            <span>الإجمالي</span>
            <span>{money(invoice.total)} <span className="text-xs font-medium">د.ع</span></span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">طريقة الدفع</span>
            <span className={`font-semibold ${invoice.paid ? "text-brand-mint-text" : "text-amber-700"}`}>{invoice.paymentLabel}</span>
          </div>
        </section>

        {invoice.voided?.reason && <p className="mt-3 text-xs text-red-700">سبب الإلغاء: {invoice.voided.reason}</p>}
        {invoice.note && <p className="mt-3 text-xs text-brand-muted">{invoice.note}</p>}

        <footer className={`mt-6 flex items-center justify-between gap-2 border-t border-brand-border pt-3 text-xs text-brand-muted ${thermal ? "flex-col" : ""}`}>
          <span>شكراً لزيارتكم</span>
          <span className="flex items-center gap-1.5"><BrandMark size={16} />{BRAND_NAME}</span>
        </footer>
      </article>
    </div>
  );
}
