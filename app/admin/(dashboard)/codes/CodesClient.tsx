"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Code = {
  id: string;
  code: string;
  note: string | null;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
};

export default function CodesClient({ initialCodes }: { initialCodes: Code[] }) {
  const router = useRouter();
  const [codes, setCodes]       = useState<Code[]>(initialCodes);
  const [note, setNote]         = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const [tab, setTab] = useState<"available" | "used">("available");

  const [sendingId, setSendingId]   = useState<string | null>(null);
  const [sendPhone, setSendPhone]   = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendMsg, setSendMsg]       = useState<{ id: string; ok: boolean; text: string } | null>(null);

  async function sendCode(codeId: string) {
    setSendLoading(true);
    setSendMsg(null);
    try {
      const res = await fetch("/api/admin/invitation-codes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId, phone: sendPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSendMsg({ id: codeId, ok: true, text: "تم الإرسال بنجاح ✓" });
      setSendingId(null);
      setSendPhone("");
    } catch (err: any) {
      setSendMsg({ id: codeId, ok: false, text: err.message });
    } finally {
      setSendLoading(false);
    }
  }

  async function createCode() {
    setCreating(true);
    const res = await fetch("/api/admin/invitation-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      setNote("");
      router.refresh();
    }
    setCreating(false);
  }

  async function deleteCode(id: string) {
    setCodes((prev) => prev.filter((c) => c.id !== id));
    await fetch("/api/admin/invitation-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  const available = codes.filter((c) => !c.used);
  const used      = codes.filter((c) => c.used);

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">كودات التسجيل</h1>
          <p className="text-sm text-gray-400 mt-0.5">أنشئ كوداً لكل عيادة جديدة وأعطه للدكتور</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">{available.length} متاح</span>
          <span className="bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">{used.length} مستخدم</span>
        </div>
      </div>

      {/* Create new code */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
        <p className="text-sm font-bold text-gray-700 mb-3">إنشاء كود جديد</p>
        <div className="flex gap-3">
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="ملاحظة (اختياري): عيادة د. أحمد — تكريت"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
          />
          <button onClick={createCode} disabled={creating}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors whitespace-nowrap shadow-[0_4px_14px_rgba(37,99,235,0.3)]">
            {creating ? "..." : "+ إنشاء كود"}
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 rounded-2xl bg-slate-100 p-1.5">
        <button onClick={() => setTab("available")} className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${tab === "available" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
          كودات متاحة
        </button>
        <button onClick={() => setTab("used")} className={`flex-1 rounded-xl px-4 py-2 text-sm font-black ${tab === "used" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
          الأرشيف المستخدم
        </button>
      </div>

      <>
        {/* Available codes */}
        {tab === "available" && available.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">متاحة للاستخدام</p>
            <div className="space-y-2">
              {available.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-green-200 shadow-sm px-5 py-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-lg font-extrabold text-[#2563EB] tracking-widest bg-blue-50 px-3 py-1 rounded-lg">
                        {c.code}
                      </span>
                      {c.note && <span className="text-sm text-gray-500">{c.note}</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => copyCode(c.code)}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors ${
                          copied === c.code
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"
                        }`}>
                        {copied === c.code ? "✓ نُسخ" : "نسخ"}
                      </button>
                      <button
                        onClick={() => {
                          setSendingId(sendingId === c.id ? null : c.id);
                          setSendPhone("");
                          setSendMsg(null);
                        }}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 transition-colors">
                        إرسال
                      </button>
                      <button onClick={() => deleteCode(c.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors">
                        حذف
                      </button>
                    </div>
                  </div>

                  {sendingId === c.id && (
                    <div className="flex gap-2 items-center pt-1 border-t border-gray-100">
                      <input
                        type="text"
                        value={sendPhone}
                        onChange={(e) => setSendPhone(e.target.value)}
                        placeholder="07701234567"
                        dir="ltr"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
                      />
                      <button
                        onClick={() => sendCode(c.id)}
                        disabled={sendLoading || !sendPhone}
                        className="bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap">
                        {sendLoading ? "..." : "إرسال واتساب"}
                      </button>
                    </div>
                  )}

                  {sendMsg?.id === c.id && (
                    <p className={`text-xs font-semibold ${sendMsg.ok ? "text-green-600" : "text-red-500"}`}>
                      {sendMsg.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "available" && available.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 mb-6">
            <p className="text-gray-400 text-sm">لا توجد كودات متاحة — أنشئ كوداً جديداً</p>
          </div>
        )}

        {/* Used codes */}
        {tab === "used" && used.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">مستخدمة</p>
            <div className="space-y-2">
              {used.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between gap-4 opacity-60">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-lg font-extrabold text-gray-400 tracking-widest line-through">
                      {c.code}
                    </span>
                    {c.note && <span className="text-sm text-gray-400">{c.note}</span>}
                  </div>
                  <span className="text-xs text-gray-400">
                    {c.usedAt ? new Date(c.usedAt).toLocaleDateString("ar-IQ") : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "used" && used.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 mb-6">
            <p className="text-gray-400 text-sm">لا توجد كودات مستخدمة بعد</p>
          </div>
        )}
      </>
    </div>
  );
}
