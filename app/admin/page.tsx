"use client";

import { useEffect, useState } from "react";

interface Subscription {
  plan: string;
  status: string;
  expiresAt: string;
}

interface Clinic {
  id: string;
  name: string;
  whatsappNumber: string;
  subscription: Subscription | null;
}

const STATUS_LABELS: Record<string, string> = { active: "فعّال", inactive: "متوقف", trial: "تجريبي" };
const STATUS_COLORS: Record<string, string> = {
  active:   "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
  trial:    "bg-yellow-100 text-yellow-800",
};
const PLAN_OPTIONS = [
  { value: "trial",    label: "تجريبي" },
  { value: "basic",    label: "أساسية" },
  { value: "standard", label: "متوسطة" },
  { value: "premium",  label: "مميزة" },
];
const STATUS_OPTIONS = [
  { value: "active",   label: "فعّال" },
  { value: "trial",    label: "تجريبي" },
  { value: "inactive", label: "متوقف" },
];

function toDateInput(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editPlan, setEditPlan] = useState("basic");
  const [editStatus, setEditStatus] = useState("active");
  const [editExpires, setEditExpires] = useState("");

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const fetchClinics = async () => {
    const res = await fetch("/api/admin/clinics");
    if (res.ok) setClinics(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchClinics(); }, []);

  function startEdit(c: Clinic) {
    setEditId(c.id);
    setEditName(c.name);
    setEditWhatsapp(c.whatsappNumber);
    setEditPlan(c.subscription?.plan ?? "basic");
    setEditStatus(c.subscription?.status ?? "active");
    setEditExpires(toDateInput(c.subscription?.expiresAt));
    setDeleteId(null);
    setError("");
  }

  async function saveEdit() {
    if (!editId) return;
    setActionLoading(editId + "_edit");
    setError("");
    const res = await fetch(`/api/admin/clinics/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "edit",
        name: editName,
        whatsappNumber: editWhatsapp,
        plan: editPlan,
        status: editStatus,
        expiresAt: editExpires ? new Date(editExpires).toISOString() : undefined,
      }),
    });
    if (res.ok) { setEditId(null); fetchClinics(); }
    else { const d = await res.json(); setError(d.error ?? "حدث خطأ"); }
    setActionLoading(null);
  }

  async function toggleStatus(clinic: Clinic) {
    const status = clinic.subscription?.status;
    const action = status === "active" ? "deactivate" : "activate";
    setActionLoading(clinic.id + "_toggle");
    await fetch(`/api/admin/clinics/${clinic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActionLoading(null);
    fetchClinics();
  }

  async function deleteClinic(id: string) {
    setActionLoading(id + "_delete");
    const res = await fetch(`/api/admin/clinics/${id}`, { method: "DELETE" });
    if (res.ok) { setClinics((prev) => prev.filter((c) => c.id !== id)); setDeleteId(null); }
    else { const d = await res.json(); setError(d.error ?? "حدث خطأ"); }
    setActionLoading(null);
  }

  if (loading) return <p className="text-gray-500">جاري التحميل...</p>;

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">العيادات</h1>
        <span className="text-sm text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1">
          {clinics.length} عيادة
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {clinics.map((clinic) => {
          const status = clinic.subscription?.status ?? "inactive";
          const plan   = clinic.subscription?.plan   ?? "—";
          const expires = clinic.subscription?.expiresAt
            ? new Date(clinic.subscription.expiresAt).toLocaleDateString("ar-IQ")
            : "—";
          const isEdit   = editId   === clinic.id;
          const isDelete = deleteId === clinic.id;

          return (
            <div
              key={clinic.id}
              className={`bg-white rounded-2xl border shadow-sm transition-all ${
                isEdit   ? "border-blue-300 ring-1 ring-blue-100" :
                isDelete ? "border-red-300 ring-1 ring-red-100"  :
                "border-gray-200"
              }`}
            >
              {/* Normal row */}
              {!isEdit && !isDelete && (
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{clinic.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 dir-ltr">{clinic.whatsappNumber}</p>
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-sm shrink-0">
                    <span className="text-gray-500 hidden sm:inline">{plan}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-gray-400 text-xs hidden md:inline">{expires}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {status !== "active" ? (
                      <button
                        onClick={() => toggleStatus(clinic)}
                        disabled={actionLoading === clinic.id + "_toggle"}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                      >
                        تفعيل
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus(clinic)}
                        disabled={actionLoading === clinic.id + "_toggle"}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                      >
                        إيقاف
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(clinic)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => { setDeleteId(clinic.id); setEditId(null); setError(""); }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )}

              {/* Edit form */}
              {isEdit && (
                <div className="px-5 py-4 space-y-3" dir="rtl">
                  <p className="text-sm font-bold text-blue-700 mb-1">تعديل بيانات العيادة</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">اسم العيادة</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">رقم الواتساب</label>
                      <input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">الباقة</label>
                      <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">الحالة</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">تاريخ انتهاء الاشتراك</label>
                      <input type="date" value={editExpires} onChange={(e) => setEditExpires(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" dir="ltr" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} disabled={actionLoading === editId + "_edit"}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
                      {actionLoading === editId + "_edit" ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors">
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Delete confirmation */}
              {isDelete && (
                <div className="px-5 py-4" dir="rtl">
                  <p className="font-bold text-red-700 mb-1">حذف {clinic.name}؟</p>
                  <p className="text-xs text-gray-500 mb-4">
                    سيتم حذف العيادة والمستخدمين والمرضى والمواعيد والمدفوعات نهائياً. لا يمكن التراجع.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => deleteClinic(clinic.id)}
                      disabled={actionLoading === clinic.id + "_delete"}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm disabled:opacity-50 transition-colors">
                      {actionLoading === clinic.id + "_delete" ? "جاري الحذف..." : "نعم، احذف نهائياً"}
                    </button>
                    <button onClick={() => setDeleteId(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors">
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {clinics.length === 0 && (
          <div className="text-center py-16 text-gray-400">لا توجد عيادات مسجلة</div>
        )}
      </div>
    </div>
  );
}
