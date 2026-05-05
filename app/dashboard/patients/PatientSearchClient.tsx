"use client";

import { useState } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PatientSearchClient({
  patients: initial,
}: {
  patients: Patient[];
}) {
  const [patients, setPatients] = useState(initial);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = query.trim()
    ? patients.filter((p) => p.name.includes(query) || p.phone.includes(query))
    : patients;

  function startEdit(p: Patient) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPhone(p.phone);
    setConfirmDeleteId(null);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) { setError("الاسم مطلوب"); return; }
    setLoading(id + "_edit");
    setError("");
    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
    });
    if (res.ok) {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, name: editName.trim(), phone: editPhone.trim() } : p
        )
      );
      setEditingId(null);
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setLoading(null);
  }

  async function deletePatient(id: string) {
    setLoading(id + "_delete");
    const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ أثناء الحذف");
    }
    setLoading(null);
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-right"
          dir="rtl"
        />
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {query ? "لا توجد نتائج مطابقة" : "لا يوجد مرضى بعد"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isEditing = editingId === p.id;
            const isConfirmDelete = confirmDeleteId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border shadow-sm transition-all ${
                  isEditing ? "border-blue-300 ring-1 ring-blue-100" :
                  isConfirmDelete ? "border-red-300 ring-1 ring-red-100" :
                  "border-gray-200"
                }`}
              >
                {/* Normal row */}
                {!isEditing && !isConfirmDelete && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5 dir-ltr">{p.phone}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.totalVisits} زيارة
                        {p.lastVisit && ` · آخر زيارة ${formatDate(p.lastVisit)}`}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link
                        href={`/dashboard/patients/${p.id}`}
                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        الملف
                      </Link>
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => { setConfirmDeleteId(p.id); setEditingId(null); setError(""); }}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="px-4 py-3 space-y-3" dir="rtl">
                    <p className="text-xs font-semibold text-blue-700 mb-2">تعديل بيانات المريض</p>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">الاسم</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="اسم المريض"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">رقم الهاتف</label>
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="07701234567"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(p.id)}
                        disabled={loading === p.id + "_edit"}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {loading === p.id + "_edit" ? "جاري الحفظ..." : "حفظ"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {isConfirmDelete && (
                  <div className="px-4 py-3" dir="rtl">
                    <p className="text-sm font-semibold text-red-700 mb-1">حذف {p.name}؟</p>
                    <p className="text-xs text-gray-500 mb-3">
                      سيتم حذف المريض وجميع مواعيده بشكل نهائي. لا يمكن التراجع.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deletePatient(p.id)}
                        disabled={loading === p.id + "_delete"}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {loading === p.id + "_delete" ? "جاري الحذف..." : "نعم، احذف"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                      >
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

      <p className="text-xs text-gray-400 mt-4 text-center">
        {filtered.length} من {patients.length} مريض
      </p>
    </div>
  );
}
