"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type EventItem = {
  id: string;
  clinicId: string | null;
  type: string;
  severity: string;
  source: string;
  title: string;
  message: string | null;
  resolved: boolean;
  createdAt: string;
  clinic: { name: string; whatsappNumber: string } | null;
};

type MaintenanceStats = {
  stuckSessions: number;
  oldPendingAppointments: number;
};

type SubscriptionInfo = {
  clinicName: string;
  plan: string;
  status: string;
  daysLeft: number;
  expiresAt: string;
};

const SEVERITY_LABELS: Record<string, string> = {
  success: "نجاح",
  info: "معلومة",
  warning: "تحذير",
  error: "خطأ",
};

const SEVERITY_STYLES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  info: "bg-blue-50 text-blue-700 ring-blue-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  error: "bg-rose-50 text-rose-700 ring-rose-100",
};

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ar-IQ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FilterTab = "alerts" | "all";

const NOISE_TYPES = ["maintenance_scan_completed", "super_admin_fix", "billing"];

export default function MonitoringClient({
  events,
  totalEvents,
  maintenanceStats,
  subscriptions,
}: {
  events: EventItem[];
  totalEvents: number;
  maintenanceStats: MaintenanceStats;
  subscriptions: SubscriptionInfo[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [tab, setTab] = useState<FilterTab>("alerts");

  useEffect(() => {
    const t = setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(t);
  }, [router]);

  async function runAction(key: string, request: () => Promise<Response>) {
    setBusy(key);
    setToast(null);
    try {
      const res = await request();
      const data = await res.json().catch(() => ({}));
      setToast({ ok: res.ok, text: data.message ?? data.error ?? "تم تنفيذ الإجراء" });
      if (res.ok) router.refresh();
    } catch {
      setToast({ ok: false, text: "تعذر الاتصال بالخادم" });
    }
    setBusy(null);
  }

  async function scanSystem() {
    setBusy("scan");
    setToast(null);
    try {
      // فحص النظام
      const res = await fetch("/api/admin/maintenance/scan", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // بعد الفحص: مسح الأخطاء القديمة تلقائياً
        await fetch("/api/admin/maintenance/fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resolve-old-errors" }),
        });
        setToast({ ok: true, text: "✅ اكتمل الفحص — تم تنظيف الصفحة" });
        router.refresh();
      } else {
        setToast({ ok: false, text: data.error ?? "فشل الفحص" });
      }
    } catch {
      setToast({ ok: false, text: "تعذر الاتصال بالخادم" });
    }
    setBusy(null);
  }

  type FixAction = "clear-stuck-sessions" | "close-old-pending" | "reset-whatsapp-sessions" | "resolve-whatsapp-errors" | "resolve-old-errors";

  function fixAll(action: FixAction) {
    return runAction(action, () =>
      fetch("/api/admin/maintenance/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
    );
  }

  function fixClinic(action: FixAction, clinicId: string) {
    return runAction(`${action}:${clinicId}`, () =>
      fetch("/api/admin/maintenance/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, clinicId }),
      })
    );
  }

  function resolveEvent(id: string) {
    return runAction(`resolve:${id}`, () =>
      fetch(`/api/admin/system-events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      })
    );
  }

  // تصفية الأحداث
  const alertEvents = events.filter(e =>
    !e.resolved &&
    (e.severity === "error" || e.severity === "warning") &&
    !NOISE_TYPES.includes(e.type)
  );

  const allEvents = events.filter(e => !NOISE_TYPES.includes(e.type));
  const displayed = tab === "alerts" ? alertEvents : allEvents;

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">آخر الأحداث</h2>
              <p className="mt-0.5 text-xs font-bold text-slate-400">{arabicNumber(totalEvents)} حدث مسجل</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={scanSystem}
                disabled={busy === "scan"}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {busy === "scan" ? (
                  <><span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />جاري الفحص...</>
                ) : "🔍 فحص النظام"}
              </button>
              <span className="text-xs font-bold text-slate-400">
                {lastRefresh.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Tabs + مسح */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("alerts")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${tab === "alerts" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                تحتاج انتباه
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === "alerts" ? "bg-white/20" : "bg-rose-100 text-rose-700"}`}>
                  {alertEvents.length}
                </span>
              </button>
              <button
                onClick={() => setTab("all")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${tab === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                كل الأحداث
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === "all" ? "bg-white/20" : "bg-slate-200 text-slate-600"}`}>
                  {allEvents.length}
                </span>
              </button>
            </div>
            <button
              onClick={() => fixAll("resolve-old-errors" as FixAction)}
              disabled={busy === "resolve-old-errors"}
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {busy === "resolve-old-errors" ? "جاري المسح..." : "✅ مسح الأخطاء التاريخية"}
            </button>
          </div>
        </div>

        {toast && (
          <div className={`border-b px-5 py-3 text-sm font-black ${toast.ok ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
            {toast.ok ? "✅" : "❌"} {toast.text}
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {displayed.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-3">✅</div>
              <p className="text-sm font-black text-emerald-600">لا توجد أخطاء مفتوحة</p>
              <p className="mt-1 text-xs font-bold text-slate-400">النظام يعمل بشكل طبيعي</p>
            </div>
          ) : (
            displayed.map((event) => (
              <article key={event.id} className={`px-5 py-4 transition ${
                event.resolved
                  ? "bg-emerald-50/60 hover:bg-emerald-50"
                  : event.severity === "error"
                  ? "bg-rose-50/40 hover:bg-rose-50"
                  : event.severity === "warning"
                  ? "bg-amber-50/40 hover:bg-amber-50"
                  : "bg-white hover:bg-slate-50"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      event.resolved ? "bg-emerald-500" :
                      event.severity === "error" ? "bg-rose-500" :
                      event.severity === "warning" ? "bg-amber-500" :
                      event.severity === "success" ? "bg-emerald-500" : "bg-blue-500"
                    }`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ring-1 ${
                          event.resolved
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                            : SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.info
                        }`}>
                          {event.resolved ? "✓ تمت المعالجة" : (SEVERITY_LABELS[event.severity] ?? event.severity)}
                        </span>
                        <h3 className={`text-sm font-black ${event.resolved ? "text-emerald-800" : "text-slate-950"}`}>{event.title}</h3>
                      </div>
                      {event.message && <p className="mt-1 text-xs font-bold text-slate-500 leading-5">{event.message}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-400">{formatDate(event.createdAt)}</span>
                        {event.clinic && (
                          <span className="text-[11px] font-bold text-blue-600">{event.clinic.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <EventActions event={event} busy={busy} resolveEvent={resolveEvent} fixClinic={fixClinic} />
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <aside className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">أدوات الإصلاح السريع</h2>
          <div className="mt-4 space-y-3">
            <button
              onClick={() => fixAll("clear-stuck-sessions")}
              disabled={busy === "clear-stuck-sessions"}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <span>تنظيف جلسات واتساب العالقة</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">{arabicNumber(maintenanceStats.stuckSessions)}</span>
            </button>
            <button
              onClick={() => fixAll("close-old-pending")}
              disabled={busy === "close-old-pending"}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <span>إغلاق المواعيد القديمة المعلقة</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">{arabicNumber(maintenanceStats.oldPendingAppointments)}</span>
            </button>
            <button
              onClick={() => fixAll("resolve-whatsapp-errors")}
              disabled={busy === "resolve-whatsapp-errors"}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <span>إغلاق أخطاء واتساب بعد المراجعة</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">يدوي</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">كيف تصلح الخلل؟</h2>
          <div className="mt-4 space-y-3 text-sm font-bold leading-7 text-slate-500">
            <p>ابدأ بـ “إعادة الفحص” حتى تظهر المشاكل الحالية.</p>
            <p>استخدم زر الإصلاح المقترح بجانب الحدث إذا كان متاحاً.</p>
            <p>بعد المراجعة اليدوية اضغط “تمت المعالجة” حتى يخرج من الأخطاء المفتوحة.</p>
          </div>
        </div>

        {/* widget الاشتراكات */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">اشتراكات العيادات</h2>
          <p className="mt-1 text-xs font-bold text-slate-400">الأيام المتبقية لكل عيادة</p>
          <div className="mt-4 space-y-3">
            {subscriptions.map((s, i) => {
              const pct = Math.min(100, Math.round((s.daysLeft / 30) * 100));
              const color = s.daysLeft <= 7 ? "bg-rose-500" : s.daysLeft <= 15 ? "bg-amber-400" : "bg-emerald-500";
              const textColor = s.daysLeft <= 7 ? "text-rose-600" : s.daysLeft <= 15 ? "text-amber-600" : "text-emerald-600";
              return (
                <div key={i}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700 truncate">{s.clinicName}</span>
                    <span className={`text-xs font-black ${textColor}`}>{arabicNumber(s.daysLeft)} يوم</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </section>
  );
}

function EventActions({
  event,
  busy,
  resolveEvent,
  fixClinic,
}: {
  event: EventItem;
  busy: string | null;
  resolveEvent: (id: string) => void;
  fixClinic: (action: "clear-stuck-sessions" | "close-old-pending" | "reset-whatsapp-sessions" | "resolve-whatsapp-errors", clinicId: string) => void;
}) {
  const canFixStuck = event.type === "stuck_whatsapp_sessions" && event.clinicId;
  const canFixPending = event.type === "old_pending_appointments" && event.clinicId;
  const canResetWhatsapp = event.type === "whatsapp_inbound_without_reply" && event.clinicId;
  const canReviewWhatsapp = ["whatsapp_send_failed", "whatsapp_bot_reply_failed", "whatsapp_bot_subscription_inactive"].includes(event.type) && event.clinicId;

  return (
    <div className="flex flex-wrap items-start gap-2 lg:justify-end">
      {canFixStuck ? (
        <button
          onClick={() => fixClinic("clear-stuck-sessions", event.clinicId as string)}
          disabled={busy === `clear-stuck-sessions:${event.clinicId}`}
          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:opacity-50"
        >
          تنظيف
        </button>
      ) : null}
      {canFixPending ? (
        <button
          onClick={() => fixClinic("close-old-pending", event.clinicId as string)}
          disabled={busy === `close-old-pending:${event.clinicId}`}
          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:opacity-50"
        >
          إغلاق
        </button>
      ) : null}
      {canResetWhatsapp ? (
        <button
          onClick={() => fixClinic("reset-whatsapp-sessions", event.clinicId as string)}
          disabled={busy === `reset-whatsapp-sessions:${event.clinicId}`}
          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 disabled:opacity-50"
        >
          إعادة تشغيل البوت
        </button>
      ) : null}
      {canReviewWhatsapp ? (
        <button
          onClick={() => fixClinic("resolve-whatsapp-errors", event.clinicId as string)}
          disabled={busy === `resolve-whatsapp-errors:${event.clinicId}`}
          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 disabled:opacity-50"
        >
          إغلاق واتساب
        </button>
      ) : null}
      {!event.resolved ? (
        <button
          onClick={() => resolveEvent(event.id)}
          disabled={busy === `resolve:${event.id}`}
          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          تمت المعالجة
        </button>
      ) : null}
    </div>
  );
}
