"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Message = {
  id: string;
  phone: string;
  body: string;
  read: boolean;
  direction: string;
  status: string;
  error?: string | null;
  createdAt: string;
  patientId: string | null;
  patientName: string | null;
};

type Filter = "all" | "unread" | "read" | "new";

const COLORS = ["#0f172a", "#2563eb", "#059669", "#7c3aed", "#c2410c", "#0891b2"];
const QUICK_REPLIES = [
  "تم استلام رسالتك، سنتواصل معك قريباً.",
  "يرجى إرسال الاسم الكامل لتأكيد الحجز.",
  "يرجى إرسال صورة التحليل أو الوصفة هنا.",
  "موعدك مؤكد، شكراً لتواصلك.",
  "يرجى اختيار وقت مناسب للحجز.",
];

function colorFor(value: string) {
  return COLORS[Math.abs(value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % COLORS.length];
}

function initials(name: string | null, phone: string) {
  if (!name) return phone.slice(-2);
  return name.trim().split(" ").slice(0, 2).map((word) => word[0]).join("");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ar-IQ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function buildConversations(messages: Message[]) {
  const grouped = new Map<string, Message[]>();
  for (const message of messages) {
    grouped.set(message.phone, [...(grouped.get(message.phone) ?? []), message]);
  }

  return [...grouped.entries()]
    .map(([phone, items]) => {
      const sorted = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return {
        phone,
        patientId: sorted.find((item) => item.patientId)?.patientId ?? null,
        patientName: sorted.find((item) => item.patientName)?.patientName ?? null,
        messages: sorted,
        unread: sorted.filter((item) => item.direction !== "outbound" && !item.read).length,
        lastMessage: sorted[0],
      };
    })
    .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const nextMessages = (await res.json()) as Message[];
      setMessages(nextMessages);
      setSelectedPhone((current) => current ?? buildConversations(nextMessages)[0]?.phone ?? null);
    }
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

  const conversations = useMemo(() => buildConversations(messages), [messages]);
  const selectedConversation = conversations.find((conversation) => conversation.phone === selectedPhone) ?? conversations[0] ?? null;

  const filteredConversations = useMemo(() => {
    const term = query.trim();
    return conversations.filter((conversation) => {
      if (filter === "unread" && conversation.unread === 0) return false;
      if (filter === "read" && conversation.unread > 0) return false;
      if (filter === "new" && conversation.patientId) return false;
      if (!term) return true;
      return (
        conversation.phone.includes(term) ||
        (conversation.patientName?.includes(term) ?? false) ||
        conversation.lastMessage.body.includes(term)
      );
    });
  }, [conversations, filter, query]);

  const unread = messages.filter((message) => message.direction !== "outbound" && !message.read).length;
  const read = messages.length - unread;
  const newNumbers = conversations.filter((conversation) => !conversation.patientId).length;

  async function markConversationRead(phone: string) {
    const res = await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((message) => (message.phone === phone ? { ...message, read: true } : message)));
    }
  }

  async function createPatientFromConversation() {
    if (!selectedConversation || !newPatientName.trim()) {
      setToast({ ok: false, text: "اكتب اسم المراجع أولاً" });
      return;
    }

    setCreating(true);
    setToast(null);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPatientName.trim(), whatsappPhone: selectedConversation.phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMessages((prev) =>
        prev.map((message) =>
          message.phone === selectedConversation.phone
            ? { ...message, patientId: data.id, patientName: data.name }
            : message
        )
      );
      setNewPatientName("");
      setToast({ ok: true, text: "تم إنشاء ملف المراجع وربطه بالمحادثة" });
    } else {
      setToast({ ok: false, text: data.error ?? "تعذر إنشاء المراجع" });
    }
    setCreating(false);
  }

  async function sendReply() {
    if (!selectedConversation || !replyText.trim()) {
      setToast({ ok: false, text: "اكتب نص الرد أولاً" });
      return;
    }

    setSending(true);
    setToast(null);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: selectedConversation.phone, message: replyText.trim() }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setMessages((prev) => [
        {
          ...data,
          patientId: selectedConversation.patientId,
          patientName: selectedConversation.patientName,
        },
        ...prev,
      ]);
      setReplyText("");
      setToast({ ok: true, text: "تم إرسال الرد عبر واتساب" });
    } else {
      if (data?.id) {
        setMessages((prev) => [
          {
            ...data,
            body: replyText.trim(),
            phone: selectedConversation.phone,
            direction: "outbound",
            status: "failed",
            read: true,
            patientId: selectedConversation.patientId,
            patientName: selectedConversation.patientName,
          },
          ...prev,
        ]);
      }
      setToast({ ok: false, text: data.error ?? "فشل إرسال الرد" });
    }
    setSending(false);
  }

  const filterTabs: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "الكل", count: conversations.length },
    { value: "unread", label: "غير مقروء", count: conversations.filter((conversation) => conversation.unread > 0).length },
    { value: "read", label: "تمت مراجعتها", count: conversations.filter((conversation) => conversation.unread === 0).length },
    { value: "new", label: "أرقام جديدة", count: newNumbers },
  ];

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)]">
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-700">واتساب العيادة</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">صندوق الرسائل</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                محادثات مجمعة حسب رقم المراجع، مع متابعة غير المقروء وربط سريع بملف المريض.
              </p>
            </div>
            <button
              onClick={fetchMessages}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700"
            >
              تحديث الرسائل
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "إجمالي الرسائل", value: messages.length, tone: "bg-blue-600 text-white" },
            { label: "غير مقروءة", value: unread, tone: "bg-orange-500 text-white" },
            { label: "تمت مراجعتها", value: read, tone: "bg-emerald-600 text-white" },
            { label: "أرقام جديدة", value: newNumbers, tone: "bg-slate-900 text-white" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`h-10 w-10 rounded-2xl ${stat.tone} flex items-center justify-center text-sm font-black`}>
                {arabicNumber(stat.value)}
              </div>
              <p className="mt-4 text-sm font-black text-slate-500">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:h-[calc(100vh-290px)] lg:min-h-[620px] lg:max-h-[820px]">
          <div className="grid min-h-[640px] lg:h-full lg:min-h-0 lg:grid-cols-[390px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-slate-50/70 lg:border-b-0 lg:border-l">
              <div className="shrink-0 space-y-3 border-b border-slate-200 p-4">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="بحث باسم المراجع أو الرقم أو الرسالة"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-200 focus:ring-4 focus:ring-blue-50"
                />
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {filterTabs.map((tab) => {
                    const active = filter === tab.value;
                    return (
                      <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value)}
                        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ring-1 transition ${
                          active ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-600 ring-slate-200"
                        }`}
                      >
                        {tab.label}
                        <span className={`mr-2 rounded-full px-2 py-0.5 ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>
                          {arabicNumber(tab.count)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="py-16 text-center text-sm font-black text-slate-400">لا توجد محادثات مطابقة</div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => {
                      const active = selectedConversation?.phone === conversation.phone;
                      return (
                        <button
                          key={conversation.phone}
                          type="button"
                          onClick={() => setSelectedPhone(conversation.phone)}
                          className={`w-full rounded-2xl p-3 text-right transition ${
                            active ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white"
                              style={{ background: colorFor(conversation.phone) }}
                            >
                              {initials(conversation.patientName, conversation.phone)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-black">{conversation.patientName ?? conversation.phone}</p>
                                {conversation.unread > 0 ? (
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-blue-600 text-white"}`}>
                                    {arabicNumber(conversation.unread)}
                                  </span>
                                ) : null}
                              </div>
                              {conversation.patientName ? <p className={`mt-0.5 text-[11px] font-bold ${active ? "text-white/70" : "text-slate-400"}`} dir="ltr">{conversation.phone}</p> : null}
                              <p className={`mt-1 truncate text-xs font-bold ${active ? "text-white/75" : "text-slate-500"}`}>
                                {conversation.lastMessage.direction === "outbound" ? "أنت: " : ""}
                                {conversation.lastMessage.body}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <main className="flex min-h-[640px] flex-col bg-white lg:min-h-0">
              {!selectedConversation ? (
                <div className="flex flex-1 items-center justify-center text-sm font-black text-slate-400">اختر محادثة لعرضها</div>
              ) : (
                <>
                  <div className="shrink-0 border-b border-slate-200 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-2xl font-black text-slate-950">{selectedConversation.patientName ?? selectedConversation.phone}</h2>
                          {!selectedConversation.patientId ? (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">رقم جديد</span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-400" dir="ltr">{selectedConversation.phone}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedConversation.patientId ? (
                          <Link href={`/dashboard/patients/${selectedConversation.patientId}`} className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800">
                            فتح ملف المراجع
                          </Link>
                        ) : null}
                        {selectedConversation.unread > 0 ? (
                          <button onClick={() => markConversationRead(selectedConversation.phone)} className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100">
                            تعليم كمقروء
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {!selectedConversation.patientId ? (
                      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-xs font-black text-amber-700">هذا الرقم غير مربوط بمراجع</p>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                          <input
                            value={newPatientName}
                            onChange={(event) => setNewPatientName(event.target.value)}
                            placeholder="اسم المراجع"
                            className="min-w-0 flex-1 rounded-xl border border-amber-100 bg-white px-4 py-2.5 text-sm font-bold outline-none focus:ring-4 focus:ring-amber-100"
                          />
                          <button
                            onClick={createPatientFromConversation}
                            disabled={creating}
                            className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-amber-700 disabled:opacity-50"
                          >
                            {creating ? "جاري الإنشاء..." : "إنشاء مراجع"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {toast ? (
                      <div className={`mt-3 rounded-2xl px-4 py-3 text-sm font-black ${toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {toast.text}
                      </div>
                    ) : null}
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 md:p-6">
                    {[...selectedConversation.messages].reverse().map((message) => {
                      const outgoing = message.direction === "outbound";
                      return (
                      <div key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm ring-1 ${
                          outgoing
                            ? "rounded-tl-md bg-emerald-600 text-white ring-emerald-600"
                            : message.read
                              ? "rounded-tr-md bg-white text-slate-700 ring-slate-200"
                              : "rounded-tr-md bg-blue-50 text-slate-900 ring-blue-100"
                        }`}>
                          <p className="whitespace-pre-wrap text-sm font-bold leading-7">{message.body}</p>
                          <div className={`mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold ${outgoing ? "text-white/75" : "text-slate-400"}`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {outgoing ? <span>{message.status === "failed" ? "فشل الإرسال" : message.status === "pending" ? "قيد الإرسال" : "مرسل"}</span> : null}
                          </div>
                          {message.status === "failed" && message.error ? (
                            <p className="mt-2 text-[11px] font-bold text-white/85">{message.error}</p>
                          ) : null}
                        </div>
                      </div>
                    )})}
                  </div>

                  <div className="shrink-0 border-t border-slate-200 bg-white p-4">
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                      {QUICK_REPLIES.map((reply) => (
                        <button
                          key={reply}
                          type="button"
                          onClick={() => setReplyText(reply)}
                          className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                        >
                          {reply.slice(0, 28)}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <textarea
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="اكتب رد العيادة هنا..."
                        rows={2}
                        className="min-h-14 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
                      />
                      <button
                        onClick={sendReply}
                        disabled={sending || !replyText.trim()}
                        className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50 md:self-end"
                      >
                        {sending ? "جاري الإرسال..." : "إرسال واتساب"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </section>
      </div>
    </div>
  );
}
