"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND_NAME, BrandMark } from "@/components/BrandLogo";
import { dateTime, money } from "@/lib/format";

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

export type InvoiceFormat = "a4" | "thermal";

const PX_PER_MM = 96 / 25.4;

/**
 * A printable invoice. A4 for the desk, or an 80 mm receipt for a thermal printer.
 * With ?print=1 the print dialog opens by itself, so one tap from the till prints it; ?format=thermal picks the receipt.
 * Pages have no margin, so the browser prints no date / title / address line of its own; the spacing is inside.
 */
export default function InvoiceView({ invoice, autoPrint, initialFormat = "a4" }: { invoice: InvoiceData; autoPrint: boolean; initialFormat?: InvoiceFormat }) {
  const [format, setFormat] = useState<InvoiceFormat>(initialFormat);
  // A receipt roll has no fixed page length: the page is as long as the receipt, in whole millimetres.
  const [receiptMm, setReceiptMm] = useState(200);
  const receiptRef = useRef<HTMLElement>(null);
  const thermal = format === "thermal";

  useEffect(() => {
    const receipt = receiptRef.current;
    if (!thermal || !receipt) return;
    const observer = new ResizeObserver(() => setReceiptMm(Math.ceil(receipt.offsetHeight / PX_PER_MM) + 4));
    observer.observe(receipt);
    return () => observer.disconnect();
  }, [thermal]);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  const title = invoice.kind === "pharmacy" ? "فاتورة بيع" : "فاتورة تحاليل";

  return (
    <div className="min-h-screen bg-brand-bg py-6 print:bg-white print:py-0" dir="rtl">
      <style>{`@media print { @page { size: ${thermal ? `80mm ${receiptMm}mm` : "A4"}; margin: 0; } body { background: #fff !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>

      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 print:hidden">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 ring-1 ring-brand-border" role="group" aria-label="حجم الورق">
          {([["a4", "ورق A4"], ["thermal", "إيصال حراري 80mm"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={format === value} onClick={() => setFormat(value)} className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${format === value ? "bg-brand-navy text-white" : "text-brand-muted"}`}>{label}</button>
          ))}
        </div>
        <button type="button" onClick={() => window.print()} className="min-h-11 rounded-2xl bg-brand-gold px-8 text-sm font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">طباعة</button>
      </div>

      {thermal ? <ThermalReceipt invoice={invoice} title={title} receiptRef={receiptRef} /> : <A4Invoice invoice={invoice} title={title} />}
    </div>
  );
}

function VoidStamp({ large }: { large: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <span className={`-rotate-12 rounded-2xl border-4 border-red-600/70 px-8 py-2 font-black text-red-600/70 ${large ? "text-6xl" : "text-3xl"}`}>ملغاة</span>
    </div>
  );
}

function A4Invoice({ invoice, title }: { invoice: InvoiceData; title: string }) {
  const count = invoice.lines.reduce((sum, line) => sum + line.qty, 0);
  const meta: [string, string][] = [
    ["رقم الفاتورة", String(invoice.number)],
    ["التاريخ", dateTime(invoice.date, { day: "numeric", month: "long", year: "numeric" })],
    ["الوقت", dateTime(invoice.date, { hour: "2-digit", minute: "2-digit" })],
    ["طريقة الدفع", invoice.paymentLabel],
  ];

  return (
    <article className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white text-sm text-brand-ink shadow-[0_1px_2px_rgba(14,36,64,0.06),0_12px_32px_-12px_rgba(14,36,64,0.18)] print:max-w-none print:rounded-none print:shadow-none">
      {invoice.voided && <VoidStamp large />}
      <div className="h-2 bg-brand-navy" />

      <div className="p-8 print:px-[14mm] print:py-[12mm]">
        {/* div, not <header>: the global print CSS hides every header (the dashboard's top bar) */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {invoice.issuer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={invoice.issuer.logoUrl} alt="" className="h-16 w-16 rounded-2xl object-contain" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-navy text-2xl font-bold text-brand-gold">{invoice.issuer.name.trim().charAt(0)}</span>
            )}
            <div>
              <h1 className="text-2xl font-bold leading-tight">{invoice.issuer.name}</h1>
              {invoice.issuer.address && <p className="mt-1 text-brand-muted">{invoice.issuer.address}</p>}
              {invoice.issuer.phone && <p className="text-brand-muted"><span dir="ltr">{invoice.issuer.phone}</span></p>}
            </div>
          </div>
          <div className="text-left">
            <p className="text-3xl font-bold tracking-tight">{title}</p>
            <p className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${invoice.paid ? "bg-brand-mint-soft text-brand-mint-text" : "bg-amber-100 text-amber-800"}`}>
              {invoice.paid ? "مدفوعة" : "غير مدفوعة"}
            </p>
          </div>
        </div>

        <dl className="mt-7 grid grid-cols-4 overflow-hidden rounded-2xl border border-brand-border">
          {meta.map(([label, value], index) => (
            <div key={label} className={`px-4 py-3 ${index ? "border-r border-brand-border" : ""}`}>
              <dt className="text-xs text-brand-muted">{label}</dt>
              <dd className="mt-0.5 font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {(invoice.party.name || invoice.party.phone) && (
          <section className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-2xl bg-brand-bg px-4 py-3">
            <span className="text-xs text-brand-muted">{invoice.party.label}</span>
            {invoice.party.name && <span className="font-bold">{invoice.party.name}</span>}
            {invoice.party.phone && <span dir="ltr" className="tabular-nums text-brand-muted">{invoice.party.phone}</span>}
            {invoice.party.extra && <span className="text-xs text-brand-muted">{invoice.party.extra}</span>}
          </section>
        )}

        <table className="mt-6 w-full border-collapse">
          <thead>
            <tr className="bg-brand-navy text-xs text-white">
              <th className="w-10 rounded-r-xl py-2.5 pr-4 text-right font-semibold">#</th>
              <th className="py-2.5 text-right font-semibold">الصنف</th>
              <th className="w-20 py-2.5 text-center font-semibold">الكمية</th>
              <th className="w-28 py-2.5 text-center font-semibold">سعر الوحدة</th>
              <th className="w-32 rounded-l-xl py-2.5 pl-4 text-left font-semibold">المبلغ</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {invoice.lines.map((line, index) => (
              <tr key={`${line.name}-${index}`} className="border-b border-brand-line align-top">
                <td className="py-3 pr-4 text-brand-muted">{index + 1}</td>
                <td className="py-3 pl-3">
                  <p className="font-semibold">{line.name}</p>
                  {line.detail && <p className="text-xs text-brand-muted">{line.detail}</p>}
                </td>
                <td className="py-3 text-center">{money(line.qty)}</td>
                <td className="py-3 text-center">{money(line.unitPrice)}</td>
                <td className="py-3 pl-4 text-left font-semibold">{money(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex items-start justify-between gap-6">
          <div className="max-w-xs pt-1 text-xs leading-6 text-brand-muted">
            {invoice.voided?.reason && <p className="font-semibold text-red-700">سبب الإلغاء: {invoice.voided.reason}</p>}
            {invoice.note && <p>{invoice.note}</p>}
          </div>
          <section className="w-72 shrink-0 tabular-nums">
            <div className="flex justify-between px-4 py-1.5 text-brand-muted"><span>عدد القطع</span><span>{money(count)}</span></div>
            <div className="flex justify-between px-4 py-1.5 text-brand-muted"><span>المجموع</span><span>{money(invoice.subtotal)}</span></div>
            {invoice.discount > 0 && <div className="flex justify-between px-4 py-1.5 text-brand-muted"><span>الخصم</span><span>− {money(invoice.discount)}</span></div>}
            <div className="mt-2 flex items-baseline justify-between rounded-2xl bg-brand-navy px-4 py-3 text-white">
              <span className="font-semibold">الإجمالي</span>
              <span className="text-2xl font-bold">{money(invoice.total)} <span className="text-xs font-medium text-brand-side-muted">د.ع</span></span>
            </div>
          </section>
        </div>

        <footer className="mt-10 flex items-center justify-between gap-2 border-t border-brand-border pt-4 text-xs text-brand-muted">
          <span className="font-semibold text-brand-ink">شكراً لزيارتكم، نتمنى لكم دوام الصحة</span>
          <span className="flex items-center gap-1.5"><BrandMark size={16} />{BRAND_NAME}</span>
        </footer>
      </div>
    </article>
  );
}

/** 80 mm thermal paper: pure black on white (thermal heads print greys as smudges), one column, dashed rules. */
function ThermalReceipt({ invoice, title, receiptRef }: { invoice: InvoiceData; title: string; receiptRef: React.Ref<HTMLElement> }) {
  const rule = "my-2 border-t border-dashed border-black";
  return (
    <article ref={receiptRef} className="relative mx-auto w-[80mm] bg-white p-[4mm] font-medium text-[12px] leading-5 text-black shadow-[0_12px_32px_-12px_rgba(14,36,64,0.25)] print:shadow-none">
      {invoice.voided && <VoidStamp large={false} />}
      <div className="text-center">
        {invoice.issuer.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={invoice.issuer.logoUrl} alt="" className="mx-auto mb-1 h-12 w-12 object-contain grayscale" />
        )}
        <h1 className="text-[16px] font-bold leading-6">{invoice.issuer.name}</h1>
        {invoice.issuer.address && <p>{invoice.issuer.address}</p>}
        {invoice.issuer.phone && <p dir="ltr">{invoice.issuer.phone}</p>}
      </div>

      <div className={rule} />
      <div className="tabular-nums">
        <div className="flex justify-between"><span className="font-bold">{title}</span><span className="font-bold">رقم {invoice.number}</span></div>
        <div className="flex justify-between"><span>{dateTime(invoice.date, { day: "numeric", month: "numeric", year: "numeric" })}</span><span>{dateTime(invoice.date, { hour: "2-digit", minute: "2-digit" })}</span></div>
        {(invoice.party.name || invoice.party.phone) && (
          <div className="flex justify-between gap-2"><span>{invoice.party.label}: {invoice.party.name ?? ""}</span>{invoice.party.phone && <span dir="ltr">{invoice.party.phone}</span>}</div>
        )}
      </div>
      <div className={rule} />

      <ul className="tabular-nums">
        {invoice.lines.map((line, index) => (
          <li key={`${line.name}-${index}`} className="py-1">
            <p className="font-bold">{line.name}</p>
            {line.detail && <p>{line.detail}</p>}
            <p className="flex justify-between"><span>{money(line.qty)} × {money(line.unitPrice)}</span><span className="font-bold">{money(line.total)}</span></p>
          </li>
        ))}
      </ul>

      <div className={rule} />
      <div className="tabular-nums">
        {invoice.discount > 0 && (
          <>
            <div className="flex justify-between"><span>المجموع</span><span>{money(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span>الخصم</span><span>− {money(invoice.discount)}</span></div>
          </>
        )}
        <div className="flex items-baseline justify-between text-[16px] font-bold"><span>الإجمالي</span><span>{money(invoice.total)} د.ع</span></div>
        <div className="flex justify-between"><span>الدفع</span><span className="font-bold">{invoice.paymentLabel}</span></div>
      </div>
      {invoice.voided?.reason && <p className="mt-1">سبب الإلغاء: {invoice.voided.reason}</p>}
      {invoice.note && <p className="mt-1">{invoice.note}</p>}
      <div className={rule} />

      <footer className="text-center">
        <p className="font-bold">شكراً لزيارتكم</p>
        <p className="text-[10px]">{BRAND_NAME}</p>
      </footer>
    </article>
  );
}
