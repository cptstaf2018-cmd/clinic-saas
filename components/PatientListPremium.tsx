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

const DAY_MS = 24 * 60 * 60 * 1000;

function lastVisitLabel(iso: string | null) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return "آخر زيارة اليوم";
  if (days === 1) return "آخر زيارة أمس";
  if (days < 30) return `آخر زيارة قبل ${arabicNumber(days)} يوم`;
  return `آخر زيارة ${formatDate(iso)}`;
}

const AVATAR_TONES = [
  "bg-brand-soft text-brand-on-soft",
  "bg-brand-mint-soft text-brand-mint-text",
  "bg-amber-50 text-amber-800",
  "bg-rose-50 text-rose-700",
];

function avatarTone(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash];
}

export default function PatientListPremium({
  patients: initial,
  initialQuery = "",
  canDelete = true,
}: {
  patients: Patient[];
  initialQuery?: string;
  canDelete?: boolean;
}) {
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
      <section className="overflow-hidden rounded-3xl border border-brand-border bg-white">
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
                className={`overflow-hidden rounded-3xl border transition ${
                  isDelete ? "border-rose-200 bg-rose-50" : isEditing ? "border-brand-blue/40 bg-brand-soft/50" : "border-brand-border bg-white hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(14,36,64,0.35)]"
                }`}
              >
                {!isEditing && !isDelete && (
                  <div className="flex flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${avatarTone(patient.name)}`}>
                        {patient.name.trim().charAt(0) || "؟"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/patients/${patient.id}`} className="truncate text-base font-bold text-brand-ink hover:text-brand-blue">
                            {patient.name}
                          </Link>
                          {patient.hasUpcoming && (
                            <Badge label={LABELS.upcomingAppointment} color="emerald" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-brand-muted" dir="ltr">
                          {patient.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-brand-bg px-4 py-2.5 text-xs text-brand-muted">
                      <span className="font-semibold text-brand-ink">
                        {patient.totalVisits > 0 ? `${arabicNumber(patient.totalVisits)} زيارة` : "لم يزر بعد"}
                      </span>
                      <span>{lastVisitLabel(patient.lastVisit) ?? "مراجع جديد"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="flex min-h-10 items-center justify-center rounded-xl bg-brand-gold px-3 text-xs font-semibold text-brand-gold-ink transition hover:bg-brand-gold-hover"
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
                          className="min-h-10 flex-1 rounded-xl bg-brand-soft px-2 text-xs font-semibold text-brand-on-soft transition hover:bg-brand-soft/70"
                        >
                          {LABELS.edit}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setConfirmDeleteId(patient.id)}
                            className="min-h-10 flex-1 rounded-xl bg-rose-50 px-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            {LABELS.delete}
                          </button>
                        )}
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
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-brand-soft"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">{LABELS.phone}</label>
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-brand-soft"
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
