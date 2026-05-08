"use client";

import { useEffect, useState } from "react";

interface Message {
  id: string; phone: string; body: string;
  read: boolean; createdAt: string; patientName: string | null;
}

const COLORS = ["#2563eb","#16a34a","#7c3aed","#dc2626","#d97706","#0891b2"];
function colorFor(s: string) { return COLORS[s.charCodeAt(0) % COLORS.length]; }
function initials(name: string | null, phone: string) {
  if (!name) return phone.slice(-2);
  return name.trim().split(" ").slice(0,2).map(w=>w[0]).join("");
}
function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "الآن";
  if (diff < 60) return `منذ ${diff} د`;
  if (diff < 1440) return `منذ ${Math.floor(diff/60)} س`;
  return new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); const t = setInterval(fetchMessages, 15000); return () => clearInterval(t); }, []);

  async function markRead(id: string) {
    await fetch("/api/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }

  const unread = messages.filter(m => !m.read).length;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">الرسائل</h1>
          <p className="text-sm text-gray-400 mt-0.5">رسائل المرضى الواردة عبر واتساب</p>
        </div>
        <div className="flex items-center gap-3">
          {unread > 0 && (
            <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full">
              {unread} جديد
            </span>
          )}
          <button onClick={fetchMessages}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} className="w-4 h-4">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "إجمالي الرسائل", value: messages.length, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "غير مقروءة",     value: unread,           color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 shadow-sm"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Messages */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-8 h-8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="text-gray-400 font-semibold">لا توجد رسائل بعد</p>
          <p className="text-gray-300 text-sm mt-1">ستظهر هنا رسائل المرضى على واتساب</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(m => {
            const color = colorFor(m.phone);
            return (
              <div key={m.id} onClick={() => !m.read && markRead(m.id)} className="cursor-pointer"
                style={{
                  background: m.read ? "white" : "#fefeff",
                  border: m.read ? "1.5px solid #f1f5f9" : "1.5px solid #bfdbfe",
                  borderRadius: 16,
                  boxShadow: m.read ? "0 1px 4px rgba(0,0,0,0.04)" : "0 4px 16px rgba(37,99,235,0.10)",
                  opacity: m.read ? 0.75 : 1,
                  transition: "all .2s",
                  padding: 16,
                }}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-sm"
                    style={{ background: color }}>
                    {initials(m.patientName, m.phone)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!m.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {m.patientName ?? m.phone}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0">{timeAgo(m.createdAt)}</p>
                    </div>
                    {m.patientName && <p className="text-xs text-gray-400 font-mono mt-0.5">{m.phone}</p>}
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{m.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
