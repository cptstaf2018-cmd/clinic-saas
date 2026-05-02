"use client";

import { useEffect, useState } from "react";

interface Code {
  id: string;
  code: string;
  note: string | null;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

export default function InvitationCodesPage() {
  const [codes, setCodes]     = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote]       = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied]   = useState<string | null>(null);

  const fetchCodes = async () => {
    const res = await fetch("/api/admin/invitation-codes");
    if (res.ok) setCodes(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  async function createCode() {
    setCreating(true);
    const res = await fetch("/api/admin/invitation-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) { setNote(""); fetchCodes(); }
    setCreating(false);
  }

  async function deleteCode(id: string) {
    await fetch("/api/admin/invitation-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchCodes();
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

      {loading ? (
        <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
      ) : (
        <>
          {/* Available codes */}
          {available.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">متاحة للاستخدام</p>
              <div className="space-y-2">
                {available.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-green-200 shadow-sm px-5 py-3 flex items-center justify-between gap-4">
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
                      <button onClick={() => deleteCode(c.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors">
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {available.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 mb-6">
              <p className="text-gray-400 text-sm">لا توجد كودات متاحة — أنشئ كوداً جديداً</p>
            </div>
          )}

          {/* Used codes */}
          {used.length > 0 && (
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
        </>
      )}
    </div>
  );
}
