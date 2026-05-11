"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Access =
  | { allowed: true; source: "plan"; daysLeft: null; trialEndsAt: null }
  | { allowed: true; source: "trial"; daysLeft: number; trialEndsAt: string }
  | { allowed: false; source: "locked"; daysLeft: 0; trialEndsAt: string | null };

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "كيف أعدل أوقات العمل؟",
  "كيف أبحث عن مريض؟",
  "أين أجد حالة الاشتراك؟",
  "كيف أضيف سجل طبي؟",
  "كيف أفتح شاشة الانتظار؟",
];

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function accessLabel(access: Access | null) {
  if (!access) return "جاري التحقق";
  if (access.allowed && access.source === "plan") return "متاح ضمن الباقة";
  if (access.allowed && access.source === "trial") return `تجربة المساعد: ${arabicNumber(access.daysLeft)} يوم متبقي`;
  if (!access.trialEndsAt) return "تجربة ٣ أيام متاحة";
  return "الميزة مقفلة";
}

export default function AssistantClient({ initialAccess }: { initialAccess: Access }) {
  const [access, setAccess] = useState<Access>(initialAccess);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "مرحباً، أنا مساعد إرشادي لا أغير أي بيانات. اسألني عن طريقة استخدام التطبيق فقط.",
    },
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

  async function ask(text = input) {
    const question = text.trim();
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
      {
        role: "assistant",
        text: res.ok ? data.answer : data.error ?? "تعذر استخدام المساعد حالياً.",
      },
    ]);
    setLoading(false);
  }

  const locked = !access.allowed && !!access.trialEndsAt;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="overflow-hidden rounded-[30px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">محادثة إرشادية</h2>
              <p className="mt-1 text-xs font-bold text-slate-500">يساعدك في فهم استخدام التطبيق فقط.</p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-black ring-1 ${locked ? "bg-rose-50 text-rose-700 ring-rose-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>
              {accessLabel(access)}
            </span>
          </div>
        </div>

        <div className="min-h-[420px] space-y-3 bg-[#f8fbf8] p-5">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
              <p className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-bold leading-7 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200"
              }`}>
                {message.text}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          {locked ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-700 ring-1 ring-rose-100">
              انتهت تجربة مساعد العيادة. الميزة متاحة في Pro فما فوق.
              <Link href="/dashboard/subscription" className="mr-2 underline">ترقية الاشتراك</Link>
            </div>
          ) : (
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
                placeholder="اسأل عن طريقة استخدام التطبيق..."
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <button disabled={loading} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50">
                {loading ? "..." : "إرسال"}
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-slate-200/70">
          <h3 className="text-lg font-black text-slate-950">أسئلة جاهزة</h3>
          <div className="mt-4 space-y-2">
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => ask(item)}
                disabled={loading || locked}
                className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-right text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[26px] bg-amber-50 p-5 ring-1 ring-amber-100">
          <p className="text-sm font-black text-amber-900">حدود المساعد</p>
          <p className="mt-2 text-sm font-bold leading-7 text-amber-800/80">
            لا يقرأ بيانات المرضى، لا يعدل المواعيد، ولا ينفذ أوامر. وظيفته شرح طريقة استخدام التطبيق فقط.
          </p>
        </section>
      </aside>
    </div>
  );
}
