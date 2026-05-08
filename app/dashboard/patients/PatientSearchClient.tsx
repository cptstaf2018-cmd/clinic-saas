"use client";

import { useState } from "react";
import Link from "next/link";

type Patient = {
  id: string; name: string; phone: string;
  totalVisits: number; lastVisit: string | null; hasUpcoming: boolean;
};

const COLORS = ["#2563eb","#16a34a","#7c3aed","#dc2626","#d97706","#0891b2","#db2777","#65a30d"];

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map(w => w[0]).join("") || "م";
}
function colorFor(id: string) { return COLORS[id.charCodeAt(0) % COLORS.length]; }
function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" });
}

export default function PatientSearchClient({ patients: initial }: { patients: Patient[] }) {
  const [patients, setPatients] = useState(initial);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = query.trim()
    ? patients.filter(p => p.name.includes(query) || p.phone.includes(query))
    : patients;

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError("الاسم مطلوب"); return; }
    setLoading(id + "_e");
    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
    });
    if (res.ok) {
      setPatients(p => p.map(x => x.id === id ? { ...x, name: editName.trim(), phone: editPhone.trim() } : x));
      setEditingId(null); setError("");
    } else { const d = await res.json(); setError(d.error ?? "حدث خطأ"); }
    setLoading(null);
  }

  async function deletePatient(id: string) {
    setLoading(id + "_d");
    const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) { setPatients(p => p.filter(x => x.id !== id)); setConfirmDeleteId(null); }
    else { const d = await res.json(); setError(d.error ?? "حدث خطأ"); }
    setLoading(null);
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={2} className="w-4 h-4 absolute right-3.5 top-3.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="search" placeholder="ابحث بالاسم أو رقم الهاتف..." value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full border border-gray-200 bg-white rounded-2xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          dir="rtl" />
      </div>

      {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-8 h-8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <p className="text-gray-400 font-semibold">{query ? "لا توجد نتائج" : "لا يوجد مرضى بعد"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const color = colorFor(p.id);
            const isEditing = editingId === p.id;
            const isDelete = confirmDeleteId === p.id;

            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm transition-all"
                style={{ border: isEditing ? "1.5px solid #bfdbfe" : isDelete ? "1.5px solid #fecaca" : "1.5px solid #f1f5f9" }}>

                {/* Normal */}
                {!isEditing && !isDelete && (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-white text-sm"
                      style={{ background: color }}>
                      {initials(p.name)}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                        {p.hasUpcoming && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">موعد قادم</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.phone}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.totalVisits > 0 ? `${p.totalVisits} زيارة` : "لم يزر بعد"}
                        {p.lastVisit && <span className="mx-1">·</span>}
                        {p.lastVisit && `آخر زيارة ${formatDate(p.lastVisit)}`}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1.5 shrink-0">
                      <Link href={`/dashboard/patients/${p.id}`}
                        className="text-xs font-bold px-3 py-2 rounded-xl transition-all"
                        style={{ background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
                        الملف
                      </Link>
                      <button onClick={() => { setEditingId(p.id); setEditName(p.name); setEditPhone(p.phone); setConfirmDeleteId(null); setError(""); }}
                        className="text-xs font-bold px-3 py-2 rounded-xl transition-all"
                        style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                        تعديل
                      </button>
                      <button onClick={() => { setConfirmDeleteId(p.id); setEditingId(null); setError(""); }}
                        className="text-xs font-bold px-3 py-2 rounded-xl transition-all"
                        style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                        حذف
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit */}
                {isEditing && (
                  <div className="px-4 py-4 space-y-3" dir="rtl">
                    <p className="text-xs font-bold text-blue-700">تعديل بيانات المريض</p>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="رقم الهاتف"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" dir="ltr" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(p.id)} disabled={loading === p.id + "_e"}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                        {loading === p.id + "_e" ? "..." : "حفظ"}
                      </button>
                      <button onClick={() => { setEditingId(null); setError(""); }}
                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors">
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirm */}
                {isDelete && (
                  <div className="px-4 py-4" dir="rtl">
                    <p className="text-sm font-bold text-red-700 mb-1">حذف {p.name}؟</p>
                    <p className="text-xs text-gray-500 mb-3">سيتم حذف المريض وجميع مواعيده نهائياً.</p>
                    <div className="flex gap-2">
                      <button onClick={() => deletePatient(p.id)} disabled={loading === p.id + "_d"}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                        {loading === p.id + "_d" ? "..." : "نعم، احذف"}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors">
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-gray-400 text-center mt-4">{filtered.length} من {patients.length} مريض</p>
    </div>
  );
}
