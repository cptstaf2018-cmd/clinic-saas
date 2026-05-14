"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SectionHeader,
  StatsGrid,
  SearchBar,
  FilterTab,
  ActionButton,
  EmptyState,
  Badge,
  Panel,
} from "@/components/shared-ui";
import { LABELS } from "@/lib/design-system";

type Subscription = {
  plan: string;
  status: string;
  expiresAt: string;
};

type Clinic = {
  id: string;
  name: string;
  whatsappNumber: string;
  patientCount: number;
  appointmentCount: number;
  subscription: Subscription | null;
};

type StatusFilter = "all" | "active" | "trial" | "inactive" | "expiring";

// Preserved labels from original design
const STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  inactive: "متوقف",
  trial: "تجريبي",
};

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبي",
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
};

function formatDate(iso: string | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ar-IQ");
}

function toDateInput(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export default function AdminClinicsClientPremium({
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

  // ── Action handlers ────────────────────────────────────────────────────────
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
          prev.map((c) =>
            c.id === editId
              ? { ...c, name: editName, whatsappNumber: editWhatsapp,
                  subscription: { plan: editPlan, status: editStatus,
                    expiresAt: editExpires ? new Date(editExpires).toISOString() : c.subscription?.expiresAt ?? "" } }
              : c
          )
        );
        setEditId(null);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
      }
    } catch { setError("حدث خطأ في الاتصال"); }
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
        const data = await res.json();
        setError(data.error ?? "حدث خطأ");
      }
    } catch { setError("حدث خطأ في الاتصال"); }
    setActionLoading(null);
  }

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

  async function deleteAllClinics() {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/admin/clinics", { method: "DELETE" });
      if (res.ok) {
        setClinics([]);
        setShowDeleteAll(false);
        setDeleteAllConfirm("");
      } else {
        const data = await res.json();
        setError(data.error ?? LABELS.error);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    }
    setDeletingAll(false);
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Section */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
        <SectionHeader
          superLabel={LABELS.clinicsOperations}
          title={LABELS.adminClinics}
          subtitle="متابعة الاشتراكات، الحالات، والدخول التشغيلي للعيادات من شاشة واحدة."
          badge={[
            { text: `${filteredClinics.length} نتيجة`, color: "blue" },
            { text: `${inactiveCount} تحتاج متابعة`, color: "rose" },
          ]}
        />

        {/* Stats Grid */}
        <StatsGrid
          stats={[
            { label: LABELS.totalClinics, value: clinics.length, accent: "slate", sub: "كل الحسابات" },
            { label: LABELS.activeClinicsTab, value: activeCount, accent: "emerald", sub: "تعمل حالياً" },
            { label: LABELS.expiringTab, value: expiringCount, accent: "amber", sub: "خلال 7 أيام" },
            { label: LABELS.needsReview, value: inactiveCount, accent: "rose", sub: "متوقفة أو معلقة" },
          ]}
        />
      </section>

      {/* Search & Filter Section */}
      <Panel title="">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={LABELS.searchByName}
          />
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {[
              { value: "all" as const, label: LABELS.allClinics, count: clinics.length },
              { value: "active" as const, label: LABELS.activeClinicsTab, count: activeCount },
              { value: "trial" as const, label: LABELS.trialClinicsTab, count: trialCount },
              { value: "inactive" as const, label: LABELS.inactiveClinicsTab, count: inactiveCount },
              { value: "expiring" as const, label: LABELS.expiringTab, count: expiringCount },
            ].map((tab) => (
              <FilterTab
                key={tab.value}
                active={statusFilter === tab.value}
                label={tab.label}
                count={tab.count}
                onClick={() => setStatusFilter(tab.value)}
              />
            ))}
          </div>
        </div>
      </Panel>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Clinics Table */}
      {filteredClinics.length === 0 ? (
        <Panel title="">
          <EmptyState
            title="لا توجد عيادات مطابقة"
            description="لم نجد عيادات تطابق بحثك"
          />
        </Panel>
      ) : (
        <Panel title="">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-right text-[11px] font-black text-slate-400">
                  <th className="px-4 py-3">الإجراءات</th>
                  <th className="px-4 py-3">العيادة</th>
                  <th className="px-4 py-3 text-center">المراجعون</th>
                  <th className="px-4 py-3">الهاتف</th>
                  <th className="px-4 py-3">الخطة</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">انتهاء الاشتراك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => enterClinic(clinic.id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-blue-700"
                        >دخول</button>
                        <button
                          onClick={() => startEdit(clinic)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                        >تعديل</button>
                        <button
                          onClick={() => { setDeleteId(clinic.id); setError(""); }}
                          className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 transition hover:bg-red-100"
                        >حذف</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-slate-950">{clinic.name}</p>
                      <p className="mt-0.5 text-[11px] font-bold text-slate-400">ID: {clinic.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className={`text-lg font-black ${clinic.patientCount > 50 ? "text-rose-600" : clinic.patientCount > 20 ? "text-amber-600" : "text-emerald-600"}`}>
                        {clinic.patientCount}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">{clinic.appointmentCount} حجز</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-500" dir="ltr">
                      {clinic.whatsappNumber}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={PLAN_LABELS[clinic.subscription?.plan ?? "-"] ?? clinic.subscription?.plan ?? "-"}
                        color="slate"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={STATUS_LABELS[clinic.subscription?.status ?? "inactive"] ?? clinic.subscription?.status ?? "inactive"}
                        color={clinic.subscription?.status === "active" ? "emerald" : clinic.subscription?.status === "trial" ? "amber" : "rose"}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-500">
                      {formatDate(clinic.subscription?.expiresAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
            <h2 className="mb-4 text-xl font-black text-slate-900">تعديل العيادة</h2>
            {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">اسم العيادة</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">رقم الواتساب</label>
                <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} dir="ltr"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500">الخطة</label>
                  <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
                    {[{v:"trial",l:"تجريبي"},{v:"basic",l:"أساسية"},{v:"standard",l:"متوسطة"},{v:"premium",l:"مميزة"}].map(o=>(
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-500">الحالة</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400">
                    {[{v:"active",l:"فعال"},{v:"trial",l:"تجريبي"},{v:"inactive",l:"متوقف"}].map(o=>(
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">تاريخ الانتهاء</label>
                <input type="date" value={editExpires} onChange={e => setEditExpires(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={saveEdit} disabled={actionLoading === editId + "_edit"}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60">
                {actionLoading === editId + "_edit" ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button onClick={() => { setEditId(null); setError(""); }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" dir="rtl">
            <h2 className="mb-2 text-xl font-black text-slate-900">حذف العيادة</h2>
            <p className="mb-5 text-sm text-slate-500">هل أنت متأكد من حذف هذه العيادة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => deleteClinic(deleteId)} disabled={actionLoading === deleteId + "_delete"}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60">
                {actionLoading === deleteId + "_delete" ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button onClick={() => { setDeleteId(null); setError(""); }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {clinics.length > 0 && (
        <Panel variant="danger" title={LABELS.dangerZone} description="إجراءات الحذف الشامل محفوظة هنا حتى لا تضغطها بالخطأ.">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div />
            <ActionButton
              label={LABELS.deleteAllClinics}
              onClick={() => {
                setShowDeleteAll(true);
                setDeleteAllConfirm("");
                setError("");
              }}
              variant="danger"
            />
          </div>
        </Panel>
      )}

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl" dir="rtl">
            <div className="mb-5 text-center">
              <h2 className="text-xl font-extrabold text-gray-900">{LABELS.deleteAllClinics}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                سيتم حذف <strong className="text-red-600">{clinics.length} عيادة</strong> مع جميع المرضى والمواعيد والمدفوعات نهائياً.
                <br />
                هذا الإجراء <strong>لا يمكن التراجع عنه</strong>.
              </p>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold text-gray-600">
                اكتب <span className="font-bold text-red-600">حذف الكل</span> للتأكيد
              </label>
              <input
                value={deleteAllConfirm}
                onChange={(e) => setDeleteAllConfirm(e.target.value)}
                placeholder="حذف الكل"
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm transition-colors focus:border-red-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <ActionButton
                label={deletingAll ? "جاري الحذف..." : "نعم، احذف الكل نهائياً"}
                onClick={deleteAllClinics}
                variant="danger"
                disabled={deleteAllConfirm !== "حذف الكل" || deletingAll}
              />
              <ActionButton
                label={LABELS.cancel}
                onClick={() => setShowDeleteAll(false)}
                variant="secondary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
