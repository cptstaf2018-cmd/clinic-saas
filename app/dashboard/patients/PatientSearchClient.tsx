"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
  hasUpcoming: boolean;
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ar-IQ", { month: "short", day: "numeric", year: "numeric" });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default function PatientSearchClient({ patients: initial, initialQuery = "" }: { patients: Patient[]; initialQuery?: string }) {
  const [patients, setPatients] = useState(initial);
  const [query, setQuery] = useState(initialQuery);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim();
    if (!term) return patients;
    return patients.filter((patient) => patient.name.includes(term) || patient.phone.includes(term));
  }, [patients, query]);

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      setError("الاسم مطلوب");
      return;
    }

    setLoading(`${id}_edit`);
    const res = await fetch(`/api/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
    });

    if (res.ok) {
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === id ? { ...patient, name: editName.trim(), phone: editPhone.trim() } : patient
        )
      );
      setEditingId(null);
      setError("");
    } else {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ");
    }
    setLoading(null);
  }

  async function deletePatient(id: string) {
    setLoading(`${id}_delete`);
    const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });

    if (res.ok) {
      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      setConfirmDeleteId(null);
    } else {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ");
    }
    setLoading(null);
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">سجل المراجعين</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {arabicNumber(filtered.length)} نتيجة من أصل {arabicNumber(patients.length)}
          </p>
        </div>
        <div className="relative w-full md:max-w-md">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="ابحث بالاسم أو رقم الهاتف"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            dir="rtl"
          />
        </div>
      </div>

      {error && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      {filtered.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
          <p className="text-lg font-black text-slate-400">{query ? "لا توجد نتائج مطابقة" : "لا يوجد مراجعون بعد"}</p>
          <p className="mt-1 text-sm font-semibold text-slate-300">ستظهر الملفات هنا بعد أول حجز عبر واتساب.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((patient) => {
            const isEditing = editingId === patient.id;
            const isDelete = confirmDeleteId === patient.id;

            return (
              <div
                key={patient.id}
                className={`overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.07)] ${
                  isDelete ? "ring-rose-100" : isEditing ? "ring-blue-100" : "ring-slate-200/80"
                }`}
              >
                {!isEditing && !isDelete && (
                  <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-black text-slate-950">{patient.name}</p>
                          {patient.hasUpcoming && (
                            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                              موعد قادم
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-400" dir="ltr">{patient.phone}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {patient.totalVisits > 0 ? `${arabicNumber(patient.totalVisits)} زيارة` : "لم يزر بعد"}
                          {patient.lastVisit && <span className="mx-2 text-slate-300">|</span>}
                          {patient.lastVisit && `آخر زيارة ${formatDate(patient.lastVisit)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 md:justify-end">
                      <Link href={`/dashboard/patients/${patient.id}`} className="flex-1 rounded-2xl bg-slate-950 px-4 py-2.5 text-center text-xs font-black text-white transition hover:bg-slate-800 md:flex-none">
                        الملف
                      </Link>
                      <button
                        onClick={() => {
                          setEditingId(patient.id);
                          setEditName(patient.name);
                          setEditPhone(patient.phone);
                          setConfirmDeleteId(null);
                          setError("");
                        }}
                        className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 md:flex-none"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(patient.id);
                          setEditingId(null);
                          setError("");
                        }}
                        className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-rose-700 md:flex-none"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="space-y-3 bg-slate-50/80 p-4">
                    <p className="text-sm font-black text-slate-800">تعديل بيانات المراجع</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="الاسم" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100" />
                      <input value={editPhone} onChange={(event) => setEditPhone(event.target.value)} placeholder="رقم الهاتف" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100" dir="ltr" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(patient.id)} disabled={loading === `${patient.id}_edit`} className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50">
                        {loading === `${patient.id}_edit` ? "جاري الحفظ..." : "حفظ"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {isDelete && (
                  <div className="space-y-3 bg-rose-50/60 p-4">
                    <p className="text-sm font-black text-slate-900">حذف {patient.name}؟</p>
                    <p className="text-xs font-semibold leading-6 text-slate-500">سيتم حذف ملف المراجع ومواعيده نهائياً.</p>
                    <div className="flex gap-2">
                      <button onClick={() => deletePatient(patient.id)} disabled={loading === `${patient.id}_delete`} className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-50">
                        {loading === `${patient.id}_delete` ? "جاري الحذف..." : "نعم، احذف"}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded-2xl bg-white px-5 py-2.5 text-sm font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50">
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
    </div>
  );
}
