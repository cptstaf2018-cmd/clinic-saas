"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="min-h-11 rounded-2xl bg-brand-gold px-6 text-sm font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">
      طباعة أو حفظ PDF
    </button>
  );
}
