"use client";

import { useState } from "react";

type Row = {
  id: string;
  number: number;
  patientName: string;
  patientPhone: string | null;
  date: string;
  sentAt: string | null;
  token: string;
  tests: string[];
  abnormal: boolean;
};

const SHOWN_TESTS = 3;

export default function ArchiveRow({ order }: { order: Row }) {
  const [sentAt, setSentAt] = useState(order.sentAt);
  const [state, setState] = useState<"idle" | "sending" | "copied" | "error">("idle");

  async function resend() {
    setState("sending");
    const res = await fetch(`/api/lab/orders/${order.id}/send`, { method: "POST" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setSentAt(data.sentAt);
      setState("idle");
    } else {
      setState("error");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/result/${order.token}`).catch(() => null);
    setState("copied");
    setTimeout(() => setState("idle"), 1800);
  }

  const when = new Date(order.date).toLocaleDateString("ar-IQ", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Baghdad" });

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
      <div className="min-w-0 flex-1 basis-56">
        <p className="flex items-center gap-2 font-bold text-brand-ink">
          <span className="truncate">{order.patientName}</span>
          {order.abnormal && <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">خارج النطاق</span>}
        </p>
        <p className="mt-0.5 truncate text-xs text-brand-muted">
          <span dir="ltr">#{order.number}</span> · {when}{order.patientPhone ? ` · ` : ""}
          {order.patientPhone && <span dir="ltr">{order.patientPhone}</span>}
        </p>
        <p className="mt-1 truncate text-xs text-brand-ink/70">
          {order.tests.slice(0, SHOWN_TESTS).join("، ")}
          {order.tests.length > SHOWN_TESTS && ` +${(order.tests.length - SHOWN_TESTS).toLocaleString("ar-IQ")}`}
        </p>
      </div>

      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sentAt ? "bg-brand-mint-soft text-brand-mint-text" : "bg-amber-50 text-amber-800"}`}>
        {sentAt ? "أُرسلت للمراجع ✓" : "لم تُرسل"}
      </span>

      <div className="flex gap-2">
        <a href={`/result/${order.token}`} target="_blank" rel="noreferrer" className="flex min-h-10 items-center rounded-xl bg-brand-bg px-4 text-xs font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-white">فتح النسخة</a>
        <a href={`/invoice/lab/${order.id}`} target="_blank" rel="noreferrer" className="flex min-h-10 items-center rounded-xl bg-brand-bg px-4 text-xs font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-white">الفاتورة</a>
        <button type="button" onClick={copyLink} className="min-h-10 rounded-xl bg-brand-bg px-4 text-xs font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-white">{state === "copied" ? "نُسخ ✓" : "نسخ الرابط"}</button>
        {order.patientPhone && (
          <button type="button" onClick={resend} disabled={state === "sending"} className="min-h-10 rounded-xl bg-brand-gold px-4 text-xs font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:opacity-50">
            {state === "sending" ? "جاري..." : sentAt ? "إعادة الإرسال" : "إرسال"}
          </button>
        )}
      </div>
      {state === "error" && <p role="alert" className="basis-full text-xs font-semibold text-red-700">تعذر الإرسال. تحقق من ربط واتساب في الإعدادات.</p>}
    </li>
  );
}
