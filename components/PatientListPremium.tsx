"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeader, SearchBar, Badge, ActionButton, EmptyState, Panel } from "@/components/shared-ui";
import { LABELS } from "@/lib/design-system";

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

export default function PatientListPremium({ patients: initial, initialQuery = "" }: { patients: Patient[]; initialQuery?: string }) {
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

  const activePatients = filtered.filter((p) => p.hasUpcoming).length;

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      setError(LABELS.error);
      return;
    }

    setLoading(`${id}_edit`);
    try {
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
        setError(data.error ?? LABELS.error);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(null);
  }

  async function deletePatient(id: string) {
    setLoading(`${id}_delete`);
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPatients((prev) => prev.filter((patient) => patient.id !== id));
        setConfirmDeleteId(null);
      } else {
        const data = await res.json();
        setError(data.error ?? LABELS.error);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setLoading(null);
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
        <SectionHeader
          title={LABELS.patientsList}
          subtitle="إدارة ملفات المرضى ومتابعة التاريخ الطبي"
          badge={[
            { text: `${arabicNumber(filtered.length)} نتيجة`, color: "blue" },
            { text: `${arabicNumber(activePatients)} موعد قادم`, color: "rose" },
          ]}
        />
      </section>

      {/* Search Bar */}
      <Panel title="">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={LABELS.searchByName}
        />
      </Panel>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Patients Grid/List */}
      {filtered.length === 0 ? (
        <Panel title="">
          <EmptyState
            title={query ? "لا توجد نتائج مطابقة" : "لا يوجد مراجعون بعد"}
            description={query ? "حاول البحث باسم آخر" : "ستظهر الملفات هنا بعد أول حجز عبر واتساب"}
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((patient) => {
            const isEditing = editingId === patient.id;
            const isDelete = confirmDeleteId === patient.id;

            return (
              <div
                key={patient.id}
                className={`overflow-hidden rounded-xl border shadow-sm transition ${
                  isDelete ? "border-rose-200 bg-rose-50 ring-1 ring-rose-100" : isEditing ? "border-blue-200 bg-blue-50 ring-1 ring-blue-100" : "border-slate-200 bg-white hover:shadow-md"
                }`}
              >
                {!isEditing && !isDelete && (
                  <div className="flex flex-col gap-4 p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-black text-slate-950">{patient.name}</p>
                        {patient.hasUpcoming && (
                          <Badge label={LABELS.upcomingAppointment} color="amber" />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-400" dir="ltr">
                        {patient.phone}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {patient.totalVisits > 0 ? `${arabicNumber(patient.totalVisits)} زيارة` : "لم يزر بعد"}
                        {patient.lastVisit && <span className="mx-2 text-slate-300">•</span>}
                        {patient.lastVisit && `${formatDate(patient.lastVisit)}`}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="rounded-lg bg-slate-950 px-3 py-2.5 text-center text-xs font-black text-white transition hover:bg-slate-800"
                      >
                        {LABELS.patientProfile}
                      </Link>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(patient.id);
                            setEditName(patient.name);
                            setEditPhone(patient.phone);
                          }}
                          className="flex-1 rounded-lg bg-blue-50 px-2 py-2.5 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100"
                        >
                          {LABELS.edit}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(patient.id)}
                          className="flex-1 rounded-lg bg-rose-50 px-2 py-2.5 text-xs font-black text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
                        >
                          {LABELS.delete}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{LABELS.patientName}</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{LABELS.phone}</label>
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex gap-2">
                      <ActionButton
                        label={LABELS.save}
                        onClick={() => saveEdit(patient.id)}
                        loading={loading === `${patient.id}_edit`}
                        size="sm"
                      />
                      <ActionButton
                        label={LABELS.cancel}
                        onClick={() => setEditingId(null)}
                        variant="secondary"
                        size="sm"
                      />
                    </div>
                  </div>
                )}

                {isDelete && (
                  <div className="p-4 space-y-3">
                    <p className="font-black text-red-700">حذف {patient.name}؟</p>
                    <p className="text-xs font-semibold text-gray-500">سيتم حذف جميع البيانات المرتبطة به نهائياً. لا يمكن التراجع.</p>
                    <div className="flex gap-2">
                      <ActionButton
                        label="نعم، احذف"
                        onClick={() => deletePatient(patient.id)}
                        loading={loading === `${patient.id}_delete`}
                        variant="danger"
                        size="sm"
                      />
                      <ActionButton
                        label={LABELS.cancel}
                        onClick={() => setConfirmDeleteId(null)}
                        variant="secondary"
                        size="sm"
                      />
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
