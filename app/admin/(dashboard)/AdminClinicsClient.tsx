"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Subscription = {
  plan: string;
  status: string;
  expiresAt: string;
};
type Clinic = {
  id: string;
  name: string;
  whatsappNumber: string;
  subscription: Subscription | null;
};

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

export default function AdminClinicsClient({ initialClinics }: { initialClinics: Clinic[] }) {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [query, setQuery] = useState("");
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
  const [now] = useState(() => Date.now());
  const activeCount = clinics.filter((clinic) => clinic.subscription?.status === "active").length;
  const inactiveCount = clinics.filter((clinic) => clinic.subscription?.status !== "active").length;
  const expiringCount = clinics.filter((clinic) => {
    if (!clinic.subscription?.expiresAt) return false;
    const diff = new Date(clinic.subscription.expiresAt).getTime() - now;
    return diff > 0 && diff <= 7 * 86400000;
  }).length;
  const filteredClinics = clinics.filter((clinic) => {
    const term = query.trim();
    if (!term) return true;
    return clinic.name.includes(term) || clinic.whatsappNumber.includes(term);
  });

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
    try {
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
      if (res.ok) {
        setClinics((prev) => prev.map((c) =>
          c.id === editId ? {
            ...c,
            name: editName,
            whatsappNumber: editWhatsapp,
            subscription: {
              plan: editPlan,
              status: editStatus,
              expiresAt: editExpires ? new Date(editExpires).toISOString() : (c.subscription?.expiresAt ?? ""),
            },
          } : c
        ));
        setEditId(null);
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setActionLoading(null);
  }

  async function toggleStatus(clinic: Clinic) {
    const status = clinic.subscription?.status;
    const action = status === "active" ? "deactivate" : "activate";
    const newStatus = action === "activate" ? "active" : "inactive";
    setActionLoading(clinic.id + "_toggle");
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setClinics((prev) => prev.map((c) =>
          c.id === clinic.id
            ? { ...c, subscription: c.subscription ? { ...c.subscription, status: newStatus } : null }
            : c
        ));
        router.refresh();
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setActionLoading(null);
  }

  async function deleteClinic(id: string) {
    setActionLoading(id + "_delete");
    try {
      const res = await fetch(`/api/admin/clinics/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClinics((prev) => prev.filter((c) => c.id !== id));
        setDeleteId(null);
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.error ?? "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setActionLoading(null);
  }

  async function deleteAll() {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/admin/clinics", { method: "DELETE" });
      if (res.ok) {
        setClinics([]);
        setShowDeleteAll(false);
        setDeleteAllConfirm("");
      } else {
        const d = await res.json();
        setError(d.error ?? "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setDeletingAll(false);
  }

  return (
    <div dir="rtl" className="space-y-6">
      <section className="rounded-[30px] bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-slate-500">مركز التحكم</p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">العيادات</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">إدارة الاشتراكات، الدخول للعيادات، ومتابعة التشغيل من شاشة واحدة.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[420px]">
            {[
              { label: "الكل", value: clinics.length },
              { label: "نشطة", value: activeCount },
              { label: "تنتهي قريباً", value: expiringCount },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white p-4 text-center ring-1 ring-slate-200">
                <p className="text-3xl font-black text-slate-950">{stat.value}</p>
                <p className="mt-1 text-xs font-black text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-[420px]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="بحث باسم العيادة أو رقم الهاتف"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:bg-white focus:ring-4 focus:ring-slate-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">{filteredClinics.length} نتيجة</span>
            <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">{inactiveCount} تحتاج متابعة</span>
          </div>
        </div>
      </section>

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

      <div className="grid gap-3">
        {filteredClinics.map((clinic) => {
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
              className={`bg-white rounded-[24px] border shadow-sm transition-all ${
                isEdit   ? "border-blue-200 ring-1 ring-blue-100" :
                isDelete ? "border-rose-200 ring-1 ring-rose-100"  :
                "border-slate-200"
              }`}
            >
              {/* Normal row */}
              {!isEdit && !isDelete && (
                <div className="grid gap-4 px-5 py-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
                  {/* Info */}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-950">{clinic.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400 dir-ltr">{clinic.whatsappNumber}</p>
                  </div>
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{plan}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-400 ring-1 ring-slate-200">{expires}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => window.open(`/api/admin/enter/${clinic.id}`, "_blank")}
                      className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800"
                    >
                      دخول
                    </button>
                    {status !== "active" ? (
                      <button
                        onClick={() => toggleStatus(clinic)}
                        disabled={actionLoading === clinic.id + "_toggle"}
                        className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:opacity-50"
                      >
                        تفعيل
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus(clinic)}
                        disabled={actionLoading === clinic.id + "_toggle"}
                        className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:opacity-50"
                      >
                        إيقاف
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(clinic)}
                      className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => { setDeleteId(clinic.id); setEditId(null); setError(""); }}
                      className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700"
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

        {filteredClinics.length === 0 && (
          <div className="text-center py-16 text-gray-400">لا توجد عيادات مسجلة</div>
        )}
      </div>

      {clinics.length > 0 && (
        <section className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-rose-100">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">منطقة الخطر</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">إجراءات الحذف الشامل محفوظة هنا حتى لا تضغطها بالخطأ.</p>
            </div>
            <button
              onClick={() => { setShowDeleteAll(true); setDeleteAllConfirm(""); setError(""); }}
              className="rounded-2xl bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
            >
              حذف كل العيادات
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
