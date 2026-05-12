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

type StatusFilter = "all" | "active" | "trial" | "inactive" | "expiring";

const STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  inactive: "متوقف",
  trial: "تجريبي",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  inactive: "bg-rose-50 text-rose-700 ring-rose-100",
  trial: "bg-amber-50 text-amber-700 ring-amber-100",
};

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبي",
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
};

const PLAN_OPTIONS = [
  { value: "trial", label: "تجريبي" },
  { value: "basic", label: "أساسية" },
  { value: "standard", label: "متوسطة" },
  { value: "premium", label: "مميزة" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "فعال" },
  { value: "trial", label: "تجريبي" },
  { value: "inactive", label: "متوقف" },
];

function toDateInput(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function formatDate(iso: string | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ar-IQ");
}

export default function AdminClinicsClient({
  initialClinics,
  publicBaseUrl,
}: {
  initialClinics: Clinic[];
  publicBaseUrl: string;
}) {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editPlan, setEditPlan] = useState("basic");
  const [editStatus, setEditStatus] = useState("active");
  const [editExpires, setEditExpires] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  const activeCount = clinics.filter((clinic) => clinic.subscription?.status === "active").length;
  const trialCount = clinics.filter((clinic) => clinic.subscription?.status === "trial").length;
  const inactiveCount = clinics.filter((clinic) => clinic.subscription?.status !== "active").length;
  const expiringCount = clinics.filter((clinic) => {
    if (!clinic.subscription?.expiresAt) return false;
    const diff = new Date(clinic.subscription.expiresAt).getTime() - now;
    return diff > 0 && diff <= 7 * 86400000;
  }).length;

  const filteredClinics = clinics.filter((clinic) => {
    const term = query.trim();
    const matchesQuery = !term || clinic.name.includes(term) || clinic.whatsappNumber.includes(term);
    if (!matchesQuery) return false;

    const status = clinic.subscription?.status ?? "inactive";
    if (statusFilter === "all") return true;
    if (statusFilter === "expiring") {
      if (!clinic.subscription?.expiresAt) return false;
      const diff = new Date(clinic.subscription.expiresAt).getTime() - now;
      return diff > 0 && diff <= 7 * 86400000;
    }
    return status === statusFilter;
  });

  const filterTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "الكل", count: clinics.length },
    { value: "active", label: "نشطة", count: activeCount },
    { value: "trial", label: "تجريبية", count: trialCount },
    { value: "inactive", label: "متوقفة", count: inactiveCount },
    { value: "expiring", label: "تنتهي قريباً", count: expiringCount },
  ];

  function enterClinic(clinicId: string) {
    const origin = publicBaseUrl || window.location.origin;
    window.open(new URL(`/api/admin/enter/${clinicId}`, origin).toString(), "_blank", "noopener,noreferrer");
  }

  function startEdit(clinic: Clinic) {
    setEditId(clinic.id);
    setEditName(clinic.name);
    setEditWhatsapp(clinic.whatsappNumber);
    setEditPlan(clinic.subscription?.plan ?? "basic");
    setEditStatus(clinic.subscription?.status ?? "active");
    setEditExpires(toDateInput(clinic.subscription?.expiresAt));
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
        setClinics((prev) =>
          prev.map((clinic) =>
            clinic.id === editId
              ? {
                  ...clinic,
                  name: editName,
                  whatsappNumber: editWhatsapp,
                  subscription: {
                    plan: editPlan,
                    status: editStatus,
                    expiresAt: editExpires
                      ? new Date(editExpires).toISOString()
                      : clinic.subscription?.expiresAt ?? "",
                  },
                }
              : clinic
          )
        );
        setEditId(null);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setActionLoading(null);
  }

  async function toggleStatus(clinic: Clinic) {
    const action = clinic.subscription?.status === "active" ? "deactivate" : "activate";
    const newStatus = action === "activate" ? "active" : "inactive";
    setActionLoading(clinic.id + "_toggle");
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setClinics((prev) =>
          prev.map((item) =>
            item.id === clinic.id
              ? { ...item, subscription: item.subscription ? { ...item.subscription, status: newStatus } : null }
              : item
          )
        );
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
        setClinics((prev) => prev.filter((clinic) => clinic.id !== id));
        setDeleteId(null);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
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
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setDeletingAll(false);
  }

  return (
    <div dir="rtl" className="space-y-5">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(90deg,#ffffff,#eef6ff,#f6fffb)] px-5 py-5 lg:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Clinics Operations</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">إدارة العيادات</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                متابعة الاشتراكات، الحالات، والدخول التشغيلي للعيادات من شاشة واحدة.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                {filteredClinics.length} نتيجة
              </span>
              <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 ring-1 ring-rose-100">
                {inactiveCount} تحتاج متابعة
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "إجمالي العيادات", value: clinics.length, accent: "text-slate-950", sub: "كل الحسابات" },
            { label: "العيادات النشطة", value: activeCount, accent: "text-emerald-700", sub: "تعمل حالياً" },
            { label: "تنتهي قريباً", value: expiringCount, accent: "text-amber-700", sub: "خلال 7 أيام" },
            { label: "تحتاج متابعة", value: inactiveCount, accent: "text-rose-700", sub: "متوقفة أو معلقة" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-5 py-4 transition hover:bg-slate-50">
              <p className="text-xs font-black text-slate-400">{stat.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className={`text-3xl font-black ${stat.accent}`}>{stat.value}</p>
                <p className="pb-1 text-[11px] font-bold text-slate-400">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث باسم العيادة أو رقم الهاتف"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50 xl:w-[420px]"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ring-1 transition ${
                    active
                      ? "bg-blue-600 text-white ring-blue-600"
                      : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                  <span className={`mr-2 rounded-full px-2 py-0.5 ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {showDeleteAll && (
        <DeleteAllModal
          clinicsCount={clinics.length}
          confirmText={deleteAllConfirm}
          setConfirmText={setDeleteAllConfirm}
          error={error}
          deleting={deletingAll}
          onConfirm={deleteAll}
          onCancel={() => setShowDeleteAll(false)}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_50px_rgba(15,23,42,0.05)]">
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full border-separate border-spacing-0 text-right">
            <thead className="border-b border-slate-200 bg-slate-100">
              <tr className="text-[11px] font-black text-slate-400">
                <th className="px-5 py-3">العيادة</th>
                <th className="px-5 py-3">الهاتف</th>
                <th className="px-5 py-3">الخطة</th>
                <th className="px-5 py-3">الحالة</th>
                <th className="px-5 py-3">انتهاء الاشتراك</th>
                <th className="px-5 py-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClinics.map((clinic) => (
                <ClinicTableRow
                  key={clinic.id}
                  clinic={clinic}
                  editId={editId}
                  deleteId={deleteId}
                  actionLoading={actionLoading}
                  enterClinic={enterClinic}
                  toggleStatus={toggleStatus}
                  startEdit={startEdit}
                  requestDelete={(id) => {
                    setDeleteId(id);
                    setEditId(null);
                    setError("");
                  }}
                  deleteClinic={deleteClinic}
                  cancelDelete={() => setDeleteId(null)}
                  editProps={{
                    editName,
                    editWhatsapp,
                    editPlan,
                    editStatus,
                    editExpires,
                    setEditName,
                    setEditWhatsapp,
                    setEditPlan,
                    setEditStatus,
                    setEditExpires,
                    saveEdit,
                    cancelEdit: () => setEditId(null),
                    saving: actionLoading === editId + "_edit",
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 lg:hidden">
          {filteredClinics.map((clinic) => (
            <ClinicCard
              key={clinic.id}
              clinic={clinic}
              editId={editId}
              deleteId={deleteId}
              actionLoading={actionLoading}
              enterClinic={enterClinic}
              toggleStatus={toggleStatus}
              startEdit={startEdit}
              requestDelete={(id) => {
                setDeleteId(id);
                setEditId(null);
                setError("");
              }}
              deleteClinic={deleteClinic}
              cancelDelete={() => setDeleteId(null)}
              editProps={{
                editName,
                editWhatsapp,
                editPlan,
                editStatus,
                editExpires,
                setEditName,
                setEditWhatsapp,
                setEditPlan,
                setEditStatus,
                setEditExpires,
                saveEdit,
                cancelEdit: () => setEditId(null),
                saving: actionLoading === editId + "_edit",
              }}
            />
          ))}
        </div>

        {filteredClinics.length === 0 && (
          <div className="border-t border-slate-100 py-16 text-center text-sm font-bold text-slate-400">
            لا توجد عيادات مطابقة
          </div>
        )}
      </section>

      {clinics.length > 0 && (
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-rose-100">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">منطقة الخطر</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                إجراءات الحذف الشامل محفوظة هنا حتى لا تضغطها بالخطأ.
              </p>
            </div>
            <button
              onClick={() => {
                setShowDeleteAll(true);
                setDeleteAllConfirm("");
                setError("");
              }}
              className="rounded-lg bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
            >
              حذف كل العيادات
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

type EditPanelProps = {
  editName: string;
  editWhatsapp: string;
  editPlan: string;
  editStatus: string;
  editExpires: string;
  setEditName: (value: string) => void;
  setEditWhatsapp: (value: string) => void;
  setEditPlan: (value: string) => void;
  setEditStatus: (value: string) => void;
  setEditExpires: (value: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  saving: boolean;
};

function ClinicTableRow({
  clinic,
  editId,
  deleteId,
  actionLoading,
  enterClinic,
  toggleStatus,
  startEdit,
  requestDelete,
  deleteClinic,
  cancelDelete,
  editProps,
}: {
  clinic: Clinic;
  editId: string | null;
  deleteId: string | null;
  actionLoading: string | null;
  enterClinic: (id: string) => void;
  toggleStatus: (clinic: Clinic) => void;
  startEdit: (clinic: Clinic) => void;
  requestDelete: (id: string) => void;
  deleteClinic: (id: string) => void;
  cancelDelete: () => void;
  editProps: EditPanelProps;
}) {
  const status = clinic.subscription?.status ?? "inactive";
  const plan = clinic.subscription?.plan ?? "-";
  const isEdit = editId === clinic.id;
  const isDelete = deleteId === clinic.id;

  return (
    <tr className={isEdit || isDelete ? "bg-blue-50/40 align-top" : "bg-white align-middle hover:bg-slate-50/70"}>
      {!isEdit && !isDelete && (
        <>
          <td className="max-w-[260px] px-5 py-4">
            <p className="truncate text-sm font-black text-slate-950">{clinic.name}</p>
            <p className="mt-1 text-[11px] font-bold text-slate-400">ID: {clinic.id.slice(0, 8)}</p>
          </td>
          <td className="px-5 py-4 text-sm font-bold text-slate-500" dir="ltr">{clinic.whatsappNumber}</td>
          <td className="px-5 py-4">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{PLAN_LABELS[plan] ?? plan}</span>
          </td>
          <td className="px-5 py-4">
            <StatusBadge status={status} />
          </td>
          <td className="px-5 py-4 text-sm font-bold text-slate-500">{formatDate(clinic.subscription?.expiresAt)}</td>
          <td className="px-5 py-4">
            <RowActions
              status={status}
              loading={actionLoading}
              clinic={clinic}
              enterClinic={enterClinic}
              toggleStatus={toggleStatus}
              startEdit={startEdit}
              requestDelete={requestDelete}
            />
          </td>
        </>
      )}

      {isEdit && (
        <td colSpan={6} className="px-5 py-4">
          <EditPanel {...editProps} />
        </td>
      )}

      {isDelete && (
        <td colSpan={6} className="px-5 py-4">
          <DeletePanel
            clinicName={clinic.name}
            deleting={actionLoading === clinic.id + "_delete"}
            confirm={() => deleteClinic(clinic.id)}
            cancel={cancelDelete}
          />
        </td>
      )}
    </tr>
  );
}

function ClinicCard({
  clinic,
  editId,
  deleteId,
  actionLoading,
  enterClinic,
  toggleStatus,
  startEdit,
  requestDelete,
  deleteClinic,
  cancelDelete,
  editProps,
}: {
  clinic: Clinic;
  editId: string | null;
  deleteId: string | null;
  actionLoading: string | null;
  enterClinic: (id: string) => void;
  toggleStatus: (clinic: Clinic) => void;
  startEdit: (clinic: Clinic) => void;
  requestDelete: (id: string) => void;
  deleteClinic: (id: string) => void;
  cancelDelete: () => void;
  editProps: EditPanelProps;
}) {
  const status = clinic.subscription?.status ?? "inactive";
  const plan = clinic.subscription?.plan ?? "-";
  const isEdit = editId === clinic.id;
  const isDelete = deleteId === clinic.id;

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${isEdit ? "border-blue-200 ring-1 ring-blue-100" : isDelete ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"}`}>
      {!isEdit && !isDelete && (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">{clinic.name}</p>
              <p className="mt-1 text-xs font-bold text-slate-400" dir="ltr">{clinic.whatsappNumber}</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
            <div className="rounded-lg bg-slate-50 p-3">الخطة: <span className="text-slate-900">{PLAN_LABELS[plan] ?? plan}</span></div>
            <div className="rounded-lg bg-slate-50 p-3">الانتهاء: <span className="text-slate-900">{formatDate(clinic.subscription?.expiresAt)}</span></div>
          </div>
          <div className="mt-4">
            <RowActions
              status={status}
              loading={actionLoading}
              clinic={clinic}
              enterClinic={enterClinic}
              toggleStatus={toggleStatus}
              startEdit={startEdit}
              requestDelete={requestDelete}
              compact
            />
          </div>
        </>
      )}

      {isEdit && <EditPanel {...editProps} />}
      {isDelete && (
        <DeletePanel
          clinicName={clinic.name}
          deleting={actionLoading === clinic.id + "_delete"}
          confirm={() => deleteClinic(clinic.id)}
          cancel={cancelDelete}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function RowActions({
  status,
  loading,
  clinic,
  enterClinic,
  toggleStatus,
  startEdit,
  requestDelete,
  compact = false,
}: {
  status: string;
  loading: string | null;
  clinic: Clinic;
  enterClinic: (id: string) => void;
  toggleStatus: (clinic: Clinic) => void;
  startEdit: (clinic: Clinic) => void;
  requestDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${compact ? "flex-wrap" : "justify-end"}`}>
      <button onClick={() => enterClinic(clinic.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white transition hover:bg-blue-700">دخول</button>
      <button
        onClick={() => toggleStatus(clinic)}
        disabled={loading === clinic.id + "_toggle"}
        className={`rounded-lg px-3 py-2 text-xs font-black ring-1 transition disabled:opacity-50 ${
          status === "active"
            ? "bg-amber-50 text-amber-700 ring-amber-100 hover:bg-amber-100"
            : "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100"
        }`}
      >
        {status === "active" ? "إيقاف" : "تفعيل"}
      </button>
      <button onClick={() => startEdit(clinic)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50">تعديل</button>
      <button onClick={() => requestDelete(clinic.id)} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700">حذف</button>
    </div>
  );
}

function EditPanel({
  editName,
  editWhatsapp,
  editPlan,
  editStatus,
  editExpires,
  setEditName,
  setEditWhatsapp,
  setEditPlan,
  setEditStatus,
  setEditExpires,
  saveEdit,
  cancelEdit,
  saving,
}: EditPanelProps) {
  return (
    <div className="space-y-3" dir="rtl">
      <div>
        <p className="text-sm font-black text-blue-700">تعديل بيانات العيادة</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">حدّث الاشتراك والمعلومات الأساسية ثم احفظ التغيير.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-bold text-slate-500">اسم العيادة</span>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-500">رقم الواتساب</span>
          <input value={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50" dir="ltr" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-500">الباقة</span>
          <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50">
            {PLAN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-500">الحالة</span>
          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50">
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-bold text-slate-500">الانتهاء</span>
          <input type="date" value={editExpires} onChange={(e) => setEditExpires(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50" dir="ltr" />
        </label>
      </div>
      <div className="flex gap-2">
        <button onClick={saveEdit} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50">
          {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
        <button onClick={cancelEdit} className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-200">
          إلغاء
        </button>
      </div>
    </div>
  );
}

function DeletePanel({
  clinicName,
  deleting,
  confirm,
  cancel,
}: {
  clinicName: string;
  deleting: boolean;
  confirm: () => void;
  cancel: () => void;
}) {
  return (
    <div dir="rtl">
      <p className="font-black text-red-700">حذف {clinicName}؟</p>
      <p className="mb-4 mt-1 text-xs font-semibold text-gray-500">سيتم حذف العيادة والمستخدمين والمرضى والمواعيد والمدفوعات نهائياً. لا يمكن التراجع.</p>
      <div className="flex gap-2">
        <button onClick={confirm} disabled={deleting} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50">
          {deleting ? "جاري الحذف..." : "نعم، احذف نهائياً"}
        </button>
        <button onClick={cancel} className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-black text-gray-700 transition hover:bg-gray-200">
          إلغاء
        </button>
      </div>
    </div>
  );
}

function DeleteAllModal({
  clinicsCount,
  confirmText,
  setConfirmText,
  error,
  deleting,
  onConfirm,
  onCancel,
}: {
  clinicsCount: number;
  confirmText: string;
  setConfirmText: (value: string) => void;
  error: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl" dir="rtl">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} className="h-7 w-7">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">حذف جميع العيادات</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            سيتم حذف <strong className="text-red-600">{clinicsCount} عيادة</strong> مع جميع المرضى والمواعيد والمدفوعات نهائياً.
            <br/>هذا الإجراء <strong>لا يمكن التراجع عنه</strong>.
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-gray-600">
            اكتب <span className="font-bold text-red-600">حذف الكل</span> للتأكيد
          </label>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="حذف الكل"
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-red-400 focus:outline-none"
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={confirmText !== "حذف الكل" || deleting}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            {deleting ? "جاري الحذف..." : "نعم، احذف الكل نهائياً"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
