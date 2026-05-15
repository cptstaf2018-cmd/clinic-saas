"use client";

export default function FinancialActions({ summary, whatsappNumber }: { summary: string; whatsappNumber: string }) {
  function handlePrint() {
    window.print();
  }

  async function handleWhatsApp() {
    const normalized = whatsappNumber.replace(/^0/, "964").replace(/\D/g, "");
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(summary)}`, "_blank");
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
        className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-950 hover:text-white"
      >
        📤 إرسال عبر واتساب
      </button>
    </div>
  );
}
