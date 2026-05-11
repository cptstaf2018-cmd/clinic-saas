"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import type { EncounterSection, SpecialtyConfig } from "@/src/config/specialties";

type RecordContent = Record<string, string>;

type MedicalRecord = {
  id: string;
  date: string;
  complaint: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  followUpDate: string | null;
  specialtyCode: string | null;
  contentJson: unknown;
};

type FormState = {
  complaint: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  date: string;
  followUpDate: string;
  specialtyFields: RecordContent;
};

function normalizeContent(value: unknown): RecordContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, fieldValue]) => [
      key,
      typeof fieldValue === "string" ? fieldValue : String(fieldValue ?? ""),
    ])
  );
}

function emptyForm(specialtyConfig: SpecialtyConfig): FormState {
  const specialtyFields = Object.fromEntries(
    specialtyConfig.encounterSections.map((section) => [section.id, ""])
  );

  return {
    complaint: "",
    diagnosis: "",
    prescription: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
    followUpDate: "",
    specialtyFields,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function sectionValue(section: EncounterSection, form: FormState) {
  return section.id === "chief_complaint" ? form.complaint : form.specialtyFields[section.id] ?? "";
}

function setSectionValue(section: EncounterSection, form: FormState, value: string): FormState {
  if (section.id === "chief_complaint") {
    return { ...form, complaint: value, specialtyFields: { ...form.specialtyFields, chief_complaint: value } };
  }

  return {
    ...form,
    specialtyFields: {
      ...form.specialtyFields,
      [section.id]: value,
    },
  };
}

export default function MedicalRecordsClient({
  patientId,
  initialRecords,
  canUseFollowUp,
  specialtyConfig,
}: {
  patientId: string;
  initialRecords: MedicalRecord[];
  canUseFollowUp: boolean;
  specialtyConfig: SpecialtyConfig;
}) {
  const [records, setRecords] = useState(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(specialtyConfig));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function startAdd() {
    setShowForm(true);
    setEditingId(null);
    setForm(emptyForm(specialtyConfig));
    setError("");
  }

  function startEdit(r: MedicalRecord) {
    const content = normalizeContent(r.contentJson);
    setEditingId(r.id);
    setShowForm(false);
    setForm({
      complaint: r.complaint,
      diagnosis: r.diagnosis ?? "",
      prescription: r.prescription ?? "",
      notes: r.notes ?? "",
      date: r.date.slice(0, 10),
      followUpDate: r.followUpDate ? r.followUpDate.slice(0, 10) : "",
      specialtyFields: {
        ...emptyForm(specialtyConfig).specialtyFields,
        ...content,
        chief_complaint: r.complaint,
      },
    });
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm(specialtyConfig));
    setError("");
  }

  function payload() {
    return {
      ...form,
      specialtyCode: specialtyConfig.code,
      contentJson: {
        ...form.specialtyFields,
        chief_complaint: form.complaint,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
        notes: form.notes,
      },
    };
  }

  async function saveNew() {
    if (!form.complaint.trim()) { setError("الشكوى الرئيسية مطلوبة"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/medical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, ...payload() }),
    });
    if (res.ok) {
      const created = await res.json();
      setRecords((prev) => [created, ...prev]);
      cancelForm();
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setLoading(false);
  }

  async function saveEdit(id: string) {
    if (!form.complaint.trim()) { setError("الشكوى الرئيسية مطلوبة"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/medical-records/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
      cancelForm();
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setLoading(false);
  }

  async function deleteRecord(id: string) {
    setLoading(true);
    const res = await fetch(`/api/medical-records/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
    }
    setLoading(false);
  }

  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-blue-700">قالب {specialtyConfig.nameAr}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">السجل الطبي</h2>
          <p className="mt-1 text-sm font-bold text-slate-400">{arabicNumber(records.length)} سجل محفوظ</p>
        </div>
        {!showForm && !editingId && (
          <button
            onClick={startAdd}
            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            سجل جديد
          </button>
        )}
      </div>

      {showForm && (
        <RecordForm
          form={form}
          setForm={setForm}
          onSave={saveNew}
          onCancel={cancelForm}
          loading={loading}
          error={error}
          title="إضافة سجل طبي جديد"
          canUseFollowUp={canUseFollowUp}
          specialtyConfig={specialtyConfig}
        />
      )}

      {records.length === 0 && !showForm ? (
        <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <p className="text-lg font-black text-slate-400">لا توجد سجلات طبية</p>
          <p className="mt-1 text-sm font-bold text-slate-300">أضف أول سجل من قالب {specialtyConfig.nameAr}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const isEdit = editingId === r.id;
            const isExpanded = expandedId === r.id;
            const isDelete = deleteId === r.id;
            const content = normalizeContent(r.contentJson);

            if (isEdit) {
              return (
                <div key={r.id} className="rounded-[24px] bg-blue-50/40 p-4 ring-1 ring-blue-100">
                  <RecordForm
                    form={form}
                    setForm={setForm}
                    onSave={() => saveEdit(r.id)}
                    onCancel={cancelForm}
                    loading={loading}
                    error={error}
                    title="تعديل السجل الطبي"
                    canUseFollowUp={canUseFollowUp}
                    specialtyConfig={specialtyConfig}
                  />
                </div>
              );
            }

            return (
              <div
                key={r.id}
                className={`rounded-[24px] transition-all ring-1 ${
                  isDelete ? "bg-red-50/50 ring-red-100" : "bg-slate-50 ring-slate-100"
                }`}
              >
                {!isDelete ? (
                  <>
                    <div
                      className="flex cursor-pointer select-none items-center justify-between p-4"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-black text-blue-700 ring-1 ring-slate-200">
                          {specialtyConfig.nameAr.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">{r.complaint}</p>
                          <p className="text-xs font-bold text-slate-400">{formatDate(r.date)}</p>
                        </div>
                      </div>
                      <div className="mr-2 flex shrink-0 items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(r); }}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-50"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteId(r.id); }}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-50"
                        >
                          حذف
                        </button>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border-t border-slate-200/70 px-4 pb-4 pt-3">
                        <RecordDetails record={r} content={content} specialtyConfig={specialtyConfig} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4">
                    <p className="mb-1 text-sm font-semibold text-red-700">حذف هذا السجل؟</p>
                    <p className="mb-3 text-xs text-gray-500">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteRecord(r.id)}
                        disabled={loading}
                        className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        {loading ? "جاري الحذف..." : "نعم، احذف"}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
    </div>
  );
}

function RecordDetails({
  record,
  content,
  specialtyConfig,
}: {
  record: MedicalRecord;
  content: RecordContent;
  specialtyConfig: SpecialtyConfig;
}) {
  const values = specialtyConfig.encounterSections
    .map((section) => ({
      label: section.labelAr,
      value: section.id === "chief_complaint" ? record.complaint : content[section.id],
    }))
    .filter((item) => item.value?.trim());

  const hasLegacyDetails = record.diagnosis || record.prescription || record.notes || record.followUpDate;

  return (
    <>
      {values.map((item) => (
        <div key={item.label}>
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
          <p className="whitespace-pre-line text-sm text-gray-700">{item.value}</p>
        </div>
      ))}
      {record.diagnosis && (
        <div>
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">التشخيص</p>
          <p className="text-sm text-gray-700">{record.diagnosis}</p>
        </div>
      )}
      {record.prescription && (
        <div>
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">الوصفة الطبية</p>
          <p className="whitespace-pre-line text-sm text-gray-700">{record.prescription}</p>
        </div>
      )}
      {record.notes && (
        <div>
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">ملاحظات</p>
          <p className="text-sm text-gray-700">{record.notes}</p>
        </div>
      )}
      {record.followUpDate && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} className="h-4 w-4 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div>
            <p className="text-[11px] font-bold text-blue-600">موعد المراجعة القادمة</p>
            <p className="text-sm font-semibold text-blue-800">{formatDate(record.followUpDate)}</p>
          </div>
        </div>
      )}
      {values.length === 0 && !hasLegacyDetails && (
        <p className="text-xs text-gray-400">لا توجد تفاصيل إضافية</p>
      )}
    </>
  );
}

function RecordForm({
  form,
  setForm,
  onSave,
  onCancel,
  loading,
  error,
  title,
  canUseFollowUp,
  specialtyConfig,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
  title: string;
  canUseFollowUp: boolean;
  specialtyConfig: SpecialtyConfig;
}) {
  const field = (key: keyof Omit<FormState, "specialtyFields">) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  function appendMedication(medication: string) {
    const next = form.prescription.trim()
      ? `${form.prescription.trim()}\n${medication}`
      : medication;
    setForm({ ...form, prescription: next });
  }

  return (
    <div className="mb-4 space-y-4 rounded-xl border border-blue-200 bg-blue-50/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-blue-700">{title}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100">
          {specialtyConfig.nameAr}
        </span>
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {specialtyConfig.encounterSections.map((section) => (
          <EncounterInput
            key={section.id}
            section={section}
            value={sectionValue(section, form)}
            onChange={(value) => setForm(setSectionValue(section, form, value))}
          />
        ))}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">التشخيص</label>
          <input
            {...field("diagnosis")}
            placeholder="التشخيص الطبي"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {specialtyConfig.quickDiagnoses.map((diagnosis) => (
              <button
                key={diagnosis}
                type="button"
                onClick={() => setForm({ ...form, diagnosis })}
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 hover:text-blue-700"
              >
                {diagnosis}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">تاريخ الزيارة</label>
          <input
            type="date"
            {...field("date")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            dir="ltr"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">الوصفة الطبية</label>
          <textarea
            {...field("prescription")}
            placeholder="الأدوية والجرعات"
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {specialtyConfig.favoriteMedications.map((medication) => (
              <button
                key={medication}
                type="button"
                onClick={() => appendMedication(medication)}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                {medication}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-500">ملاحظات إضافية</label>
          <textarea
            {...field("notes")}
            placeholder="أي ملاحظات أخرى"
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-black text-slate-500">المستندات المتاحة لهذا الاختصاص</p>
          <div className="flex flex-wrap gap-2">
            {specialtyConfig.documentTypes.map((documentType) => (
              <span key={documentType.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                {documentType.labelAr}
              </span>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-blue-600">
            موعد المراجعة القادمة <span className="font-normal text-gray-400">(اختياري)</span>
          </label>
          {canUseFollowUp ? (
            <input
              type="date"
              {...field("followUpDate")}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              dir="ltr"
            />
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800">
              تتبع المراجعات التلقائي متاح في باقة Pro.
            </div>
          )}
          {form.followUpDate && (
            <p className="mt-1 text-xs text-blue-600">
              سيُنشأ حجز مراجعة تلقائياً ويُرسل تذكير قبل 24 ساعة
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جاري الحفظ..." : "حفظ السجل"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}

function EncounterInput({
  section,
  value,
  onChange,
}: {
  section: EncounterSection;
  value: string;
  onChange: (value: string) => void;
}) {
  const label = (
    <label className="mb-1 block text-xs font-medium text-gray-500">
      {section.labelAr} {section.required ? <span className="text-red-500">*</span> : null}
    </label>
  );
  const commonClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

  if (section.kind === "textarea") {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={section.placeholderAr}
          rows={2}
          className={`${commonClass} resize-none`}
        />
      </div>
    );
  }

  if (section.kind === "select") {
    return (
      <div>
        {label}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={commonClass}
        >
          <option value="">اختر</option>
          {section.options?.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={section.id === "chief_complaint" ? "sm:col-span-2" : ""}>
      {label}
      <input
        type={section.kind === "number" || section.kind === "date" ? section.kind : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={section.placeholderAr}
        className={commonClass}
        dir={section.kind === "date" ? "ltr" : "rtl"}
      />
    </div>
  );
}
