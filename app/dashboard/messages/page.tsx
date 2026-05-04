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

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 15000);
    return () => clearInterval(t);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
  }

  const unread = messages.filter((m) => !m.read).length;

  if (loading) return <div className="p-6 text-gray-400 text-sm text-center">جاري التحميل...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الرسائل الواردة</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? (
              <span className="text-blue-600 font-semibold">{unread} غير مقروءة</span>
            ) : (
              "كل الرسائل مقروءة"
            )}
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          تحديث
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <p className="text-gray-500 text-sm">لا توجد رسائل بعد</p>
          <p className="text-gray-400 text-xs mt-1">ستظهر هنا كل رسائل المرضى على الواتساب</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              onClick={() => !m.read && markRead(m.id)}
              className={`bg-white rounded-2xl border shadow-sm p-4 cursor-pointer transition-all ${
                m.read
                  ? "border-gray-100 opacity-70"
                  : "border-blue-200 shadow-blue-50 hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {!m.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">
                      {m.patientName ?? m.phone}
                    </p>
                    {m.patientName && (
                      <p className="text-xs text-gray-400 font-mono">{m.phone}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 shrink-0">
                  {new Date(m.createdAt).toLocaleTimeString("ar-IQ", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="text-sm text-gray-700 mt-2 pr-4">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
