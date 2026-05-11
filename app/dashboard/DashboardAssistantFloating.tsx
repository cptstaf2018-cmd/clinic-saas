"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Access =
  | { allowed: true; source: "plan"; daysLeft: null; trialEndsAt: null }
  | { allowed: true; source: "trial"; daysLeft: number; trialEndsAt: string }
  | { allowed: false; source: "locked"; daysLeft: 0; trialEndsAt: string | null };

type Message = { role: "user" | "assistant"; text: string };

const QUICK_QUESTIONS = [
  "كيف أضيف مريض؟",
  "كيف أفتح شاشة الانتظار؟",
  "كيف أعدل أوقات العمل؟",
];

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function accessLabel(access: Access) {
  if (access.allowed && access.source === "plan") return "ضمن الباقة";
  if (access.allowed && access.source === "trial") return `${arabicNumber(access.daysLeft)} يوم`;
  if (!access.trialEndsAt) return "تجربة ٣ أيام";
  return "مقفل";
}

export default function DashboardAssistantFloating({ initialAccess }: { initialAccess: Access }) {
  const [open, setOpen] = useState(false);
  const [access, setAccess] = useState<Access>(initialAccess);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "مرحباً، اسألني عن طريقة استخدام التطبيق فقط." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/assistant")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.access) setAccess(data.access);
      })
      .catch(() => {});
  }, []);

  async function ask(value = input) {
    const question = value.trim();
    if (!question || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: question }]);

    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.access) setAccess(data.access);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: res.ok ? data.answer : data.error ?? "تعذر استخدام المساعد حالياً." },
    ]);
    setLoading(false);
  }

  const locked = !access.allowed && !!access.trialEndsAt;

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-6 md:right-[19rem]" dir="rtl">
      {open && (
        <section className="mb-3 flex h-[min(620px,calc(100vh-120px))] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)] ring-1 ring-slate-200">
          <header className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-blue-600 to-teal-600 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-black">مساعد العيادة</p>
              <p className="mt-0.5 text-[11px] font-bold text-white/70">إرشادات استخدام التطبيق</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-black">
                {accessLabel(access)}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/12 text-white transition hover:bg-white/20"
                aria-label="إغلاق المساعد"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4 w-4">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8fbf8] p-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
                <p className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm font-bold leading-6 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200"
                }`}>
                  {message.text}
                </p>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <p className="rounded-2xl bg-white px-3.5 py-2.5 text-sm font-black text-slate-400 ring-1 ring-slate-200">...</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            {locked ? (
              <div className="rounded-2xl bg-rose-50 p-3 text-sm font-bold leading-6 text-rose-700 ring-1 ring-rose-100">
                انتهت تجربة المساعد.
                <Link href="/dashboard/subscription" className="mr-2 underline">ترقية الاشتراك</Link>
              </div>
            ) : (
              <>
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                  {QUICK_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => ask(question)}
                      disabled={loading}
                      className="shrink-0 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    ask();
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="اسأل عن استخدام التطبيق..."
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
                    aria-label="إرسال السؤال"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3} className="h-5 w-5">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-teal-600 text-white shadow-[0_14px_35px_rgba(37,99,235,0.35)] ring-4 ring-white/80 transition hover:scale-105"
        aria-label="فتح مساعد العيادة"
        title="مساعد العيادة"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
          <path d="M12 3a7 7 0 0 0-7 7v2a7 7 0 0 0 14 0v-2a7 7 0 0 0-7-7Z" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M9.5 14a4 4 0 0 0 5 0" />
          <path d="M12 19v2" />
          <path d="M8 21h8" />
        </svg>
      </button>
    </div>
  );
}
