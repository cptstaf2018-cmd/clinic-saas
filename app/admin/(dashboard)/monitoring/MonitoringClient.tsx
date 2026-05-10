"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

export default function MonitoringClient({
  events,
  totalEvents,
  maintenanceStats,
}: {
  events: EventItem[];
  totalEvents: number;
  maintenanceStats: MaintenanceStats;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

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

  function scanSystem() {
    return runAction("scan", () => fetch("/api/admin/maintenance/scan", { method: "POST" }));
  }

  function fixAll(action: "clear-stuck-sessions" | "close-old-pending" | "reset-whatsapp-sessions") {
    return runAction(action, () =>
      fetch("/api/admin/maintenance/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
    );
  }

  function fixClinic(action: "clear-stuck-sessions" | "close-old-pending" | "reset-whatsapp-sessions", clinicId: string) {
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

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">آخر الأحداث</h2>
            <p className="mt-1 text-xs font-bold text-slate-400">{arabicNumber(totalEvents)} حدث مسجل في النظام</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={scanSystem}
              disabled={busy === "scan"}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {busy === "scan" ? "جاري الفحص..." : "إعادة الفحص"}
            </button>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              آخر 30
            </span>
          </div>
        </div>

        {toast ? (
          <div className={`border-b px-5 py-3 text-sm font-black ${toast.ok ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
            {toast.text}
          </div>
        ) : null}

        <div className="divide-y divide-slate-100">
          {events.length === 0 ? (
            <div className="p-10 text-center text-sm font-black text-slate-400">لا توجد أحداث مسجلة بعد.</div>
          ) : (
            events.map((event) => (
              <article key={event.id} className={`grid gap-3 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[145px_120px_1fr_170px] ${event.resolved ? "bg-slate-50/60 opacity-70" : "bg-white"}`}>
                <div className="text-xs font-bold text-slate-400">{formatDate(event.createdAt)}</div>
                <div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.info}`}>
                    {SEVERITY_LABELS[event.severity] ?? event.severity}
                  </span>
                  {event.resolved ? (
                    <span className="mt-2 block rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
                      محلول
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-950">{event.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{event.source}</span>
                  </div>
                  {event.message ? <p className="mt-1 text-xs font-bold leading-6 text-slate-500">{event.message}</p> : null}
                  <p className="mt-1 text-[11px] font-bold text-slate-400">
                    {event.clinic ? `${event.clinic.name} · ${event.clinic.whatsappNumber}` : "حدث عام على المنصة"}
                  </p>
                </div>
                <EventActions
                  event={event}
                  busy={busy}
                  resolveEvent={resolveEvent}
                  fixClinic={fixClinic}
                />
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

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black text-amber-700">قادم لاحقاً</p>
          <h3 className="mt-2 text-lg font-black text-slate-950">إعادة إرسال واتساب</h3>
          <p className="mt-2 text-sm font-bold leading-7 text-amber-800/80">
            الخطوة التالية ستكون زر إعادة إرسال رسالة محددة بعد حفظ رقم الموعد ونوع الرسالة داخل الحدث.
          </p>
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
  fixClinic: (action: "clear-stuck-sessions" | "close-old-pending" | "reset-whatsapp-sessions", clinicId: string) => void;
}) {
  const canFixStuck = event.type === "stuck_whatsapp_sessions" && event.clinicId;
  const canFixPending = event.type === "old_pending_appointments" && event.clinicId;
  const canResetWhatsapp = event.type === "whatsapp_inbound_without_reply" && event.clinicId;

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
