"use client";

export default function FinancialActions({ summary }: { summary: string }) {
  function handlePrint() {
    window.print();
  }

  async function handleWhatsApp() {
    try {
      await navigator.clipboard.writeText(summary);
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(summary)}`, "_blank");
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={handlePrint}
        className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-950 hover:text-white"
      >
        🖨️ طباعة التقرير المالي
      </button>
      <button
        onClick={handleWhatsApp}
        className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700"
      >
        📤 إرسال عبر واتساب
      </button>
    </div>
  );
}
