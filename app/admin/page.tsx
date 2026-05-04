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

  // Delete ALL state
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

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

  async function deleteAll() {
    setDeletingAll(true);
    const res = await fetch("/api/admin/clinics", { method: "DELETE" });
    if (res.ok) {
      setClinics([]);
      setShowDeleteAll(false);
      setDeleteAllConfirm("");
    } else {
      const d = await res.json();
      setError(d.error ?? "حدث خطأ");
    }
    setDeletingAll(false);
  }

  if (loading) return <p className="text-gray-500">جاري التحميل...</p>;

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">العيادات</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1">
            {clinics.length} عيادة
          </span>
          {clinics.length > 0 && (
            <button
              onClick={() => { setShowDeleteAll(true); setDeleteAllConfirm(""); setError(""); }}
              className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              حذف الكل
            </button>
          )}
        </div>
      </div>

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" dir="rtl">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} className="w-7 h-7">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">حذف جميع العيادات</h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                سيتم حذف <strong className="text-red-600">{clinics.length} عيادة</strong> مع جميع المرضى والمواعيد والمدفوعات نهائياً.
                <br/>هذا الإجراء <strong>لا يمكن التراجع عنه</strong>.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                اكتب <span className="text-red-600 font-bold">حذف الكل</span> للتأكيد
              </label>
              <input
                value={deleteAllConfirm}
                onChange={(e) => setDeleteAllConfirm(e.target.value)}
                placeholder="حذف الكل"
                className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={deleteAll}
                disabled={deleteAllConfirm !== "حذف الكل" || deletingAll}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {deletingAll ? "جاري الحذف..." : "نعم، احذف الكل نهائياً"}
              </button>
              <button
                onClick={() => setShowDeleteAll(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <button
                      onClick={async () => {
                        setActionLoading(clinic.id + "_enter");
                        const res = await fetch("/api/admin/impersonate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ clinicId: clinic.id }),
                        });
                        const data = await res.json();
                        setActionLoading(null);
                        if (data.token) window.open(`/api/admin/enter?token=${data.token}`, "_blank");
                        else setError(data.error ?? "حدث خطأ");
                      }}
                      disabled={actionLoading === clinic.id + "_enter"}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === clinic.id + "_enter" ? "..." : "دخول"}
                    </button>
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
