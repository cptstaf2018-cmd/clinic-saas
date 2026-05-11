"use client";

import Link from "next/link";

export default function ReportActions({ summary }: { summary: string }) {
  async function copySummary() {
    await navigator.clipboard.writeText(summary);
  }

  async function shareSummary() {
    if (navigator.share) {
      await navigator.share({ title: "تقرير العيادة", text: summary });
      return;
    }
    await copySummary();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
      >
        طباعة
      </button>
      <button
        type="button"
        onClick={copySummary}
        className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
      >
        نسخ الملخص
      </button>
      <button
        type="button"
        onClick={shareSummary}
        className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
      >
        مشاركة
      </button>
      <Link
        href="/dashboard/messages"
        className="rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-blue-700"
      >
        إرسال عبر الرسائل
      </Link>
    </div>
  );
}
