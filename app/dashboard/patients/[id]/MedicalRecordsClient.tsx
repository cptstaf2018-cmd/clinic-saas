"use client";

import { useState } from "react";

type MedicalRecord = {
  id: string;
  date: string;
  complaint: string;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  followUpDate: string | null;
};

type FormState = {
  complaint: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  date: string;
  followUpDate: string;
};

function emptyForm(): FormState {
  return {
    complaint: "",
    diagnosis: "",
    prescription: "",
    notes: "",
    date: new Date().toISOString().slice(0, 10),
    followUpDate: "",
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

export default function MedicalRecordsClient({
  patientId,
  initialRecords,
}: {
  patientId: string;
  initialRecords: MedicalRecord[];
}) {
  const [records, setRecords] = useState(initialRecords);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function startAdd() {
    setShowForm(true);
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  function startEdit(r: MedicalRecord) {
    setEditingId(r.id);
    setShowForm(false);
    setForm({
      complaint: r.complaint,
      diagnosis: r.diagnosis ?? "",
      prescription: r.prescription ?? "",
      notes: r.notes ?? "",
      date: r.date.slice(0, 10),
      followUpDate: r.followUpDate ? r.followUpDate.slice(0, 10) : "",
    });
    setError("");
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setError("");
  }

  async function saveNew() {
    if (!form.complaint.trim()) { setError("الشكوى الرئيسية مطلوبة"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/medical-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId, ...form }),
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
      body: JSON.stringify(form),
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">السجل الطبي</h2>
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
        />
      )}

      {records.length === 0 && !showForm ? (
        <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <p className="text-lg font-black text-slate-400">لا توجد سجلات طبية</p>
          <p className="mt-1 text-sm font-bold text-slate-300">أضف أول سجل عند الحاجة.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const isEdit = editingId === r.id;
            const isExpanded = expandedId === r.id;
            const isDelete = deleteId === r.id;

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
                      className="flex items-center justify-between p-4 cursor-pointer select-none"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 text-sm font-black text-blue-700 ring-1 ring-slate-200">
                          س
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-950 truncate">{r.complaint}</p>
                          <p className="text-xs font-bold text-slate-400">{formatDate(r.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 mr-2">
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
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-slate-200/70 pt-3">
                        {r.diagnosis && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">التشخيص</p>
                            <p className="text-sm text-gray-700">{r.diagnosis}</p>
                          </div>
                        )}
                        {r.prescription && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">الوصفة الطبية</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{r.prescription}</p>
                          </div>
                        )}
                        {r.notes && (
                          <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">ملاحظات</p>
                            <p className="text-sm text-gray-700">{r.notes}</p>
                          </div>
                        )}
                        {r.followUpDate && (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2} className="w-4 h-4 shrink-0">
                              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <div>
                              <p className="text-[11px] font-bold text-blue-600">موعد المراجعة القادمة</p>
                              <p className="text-sm font-semibold text-blue-800">{formatDate(r.followUpDate)}</p>
                            </div>
                          </div>
                        )}
                        {!r.diagnosis && !r.prescription && !r.notes && !r.followUpDate && (
                          <p className="text-xs text-gray-400">لا توجد تفاصيل إضافية</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4">
                    <p className="text-sm font-semibold text-red-700 mb-1">حذف هذا السجل؟</p>
                    <p className="text-xs text-gray-500 mb-3">لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteRecord(r.id)}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {loading ? "جاري الحذف..." : "نعم، احذف"}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
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
    </div>
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
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
  title: string;
}) {
  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-3 border border-blue-200 rounded-xl p-4 bg-blue-50/20 mb-4">
      <p className="text-sm font-bold text-blue-700">{title}</p>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            الشكوى الرئيسية <span className="text-red-500">*</span>
          </label>
          <input
            {...field("complaint")}
            placeholder="ما يشكو منه المريض"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">التشخيص</label>
          <input
            {...field("diagnosis")}
            placeholder="التشخيص الطبي"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">تاريخ الزيارة</label>
          <input
            type="date"
            {...field("date")}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            dir="ltr"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">الوصفة الطبية</label>
          <textarea
            {...field("prescription")}
            placeholder="الأدوية والجرعات"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">ملاحظات إضافية</label>
          <textarea
            {...field("notes")}
            placeholder="أي ملاحظات أخرى"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-blue-600 mb-1">
            📅 موعد المراجعة القادمة <span className="text-gray-400 font-normal">(اختياري)</span>
          </label>
          <input
            type="date"
            {...field("followUpDate")}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full border border-blue-200 bg-blue-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            dir="ltr"
          />
          {form.followUpDate && (
            <p className="text-xs text-blue-600 mt-1">
              ✓ سيُنشأ حجز مراجعة تلقائياً ويُرسل تذكير قبل 24 ساعة
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? "جاري الحفظ..." : "حفظ السجل"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
