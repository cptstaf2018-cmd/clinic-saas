"use client";

import { useEffect, useState } from "react";

interface Message {
  id: string;
  phone: string;
  body: string;
  read: boolean;
  createdAt: string;
  patientName: string | null;
}

const COLORS = ["#0f172a", "#2563eb", "#059669", "#7c3aed", "#c2410c", "#0891b2"];

function colorFor(s: string) {
  return COLORS[Math.abs(s.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length];
}

function initials(name: string | null, phone: string) {
  if (!name) return phone.slice(-2);
  return name.trim().split(" ").slice(0, 2).map((word) => word[0]).join("");
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "الآن";
  if (diff < 60) return `منذ ${diff} د`;
  if (diff < 1440) return `منذ ${Math.floor(diff / 60)} س`;
  return new Date(iso).toLocaleDateString("ar-IQ", { month: "short", day: "numeric" });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void fetchMessages();
    }, 0);
    const timer = window.setInterval(() => {
      void fetchMessages();
    }, 15000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  async function markRead(id: string) {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
  }

  const unread = messages.filter((m) => !m.read).length;
  const read = messages.length - unread;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <div className="absolute inset-0 opacity-10 pattern-medical" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-700">واتساب العيادة</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">مركز الرسائل</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                تابع رسائل المراجعين الواردة من واتساب، وافصل المهم عن المقروء بدون ازدحام بصري.
              </p>
            </div>
            <button
              onClick={fetchMessages}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              تحديث الرسائل
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "إجمالي الرسائل", value: messages.length, tone: "bg-blue-600 text-white" },
            { label: "غير مقروءة", value: unread, tone: "bg-orange-500 text-white" },
            { label: "تمت مراجعتها", value: read, tone: "bg-emerald-600 text-white" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[26px] bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <div className={`h-10 w-10 rounded-2xl ${stat.tone} flex items-center justify-center text-sm font-black`}>
                {arabicNumber(stat.value)}
              </div>
              <p className="mt-4 text-sm font-black text-slate-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[30px] bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">الوارد</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">آخر رسائل واتساب من المراجعين.</p>
            </div>
            {unread > 0 && (
              <span className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white">
                {arabicNumber(unread)} جديد
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-black text-slate-400">لا توجد رسائل بعد</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">ستظهر هنا رسائل واتساب الجديدة.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {messages.map((message) => {
                const color = colorFor(message.phone);
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => !message.read && markRead(message.id)}
                    className={`w-full rounded-[24px] p-4 text-right transition hover:-translate-y-0.5 ${
                      message.read ? "bg-slate-50 ring-1 ring-slate-200" : "bg-white shadow-[0_12px_30px_rgba(37,99,235,0.12)] ring-2 ring-blue-100"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
                        style={{ background: color }}
                      >
                        {initials(message.patientName, message.phone)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {!message.read && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                            <p className="truncate text-base font-black text-slate-950">
                              {message.patientName ?? message.phone}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{timeAgo(message.createdAt)}</span>
                        </div>
                        {message.patientName && <p className="mt-1 text-xs font-bold text-slate-400" dir="ltr">{message.phone}</p>}
                        <p className="mt-3 line-clamp-2 text-sm font-semibold leading-7 text-slate-600">{message.body}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
