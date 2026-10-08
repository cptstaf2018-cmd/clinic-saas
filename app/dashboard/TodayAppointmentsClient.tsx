"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  status: string;
  queueNumber: number | null;
  queueStatus: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "بانتظار التأكيد", cls: "bg-amber-50 text-amber-800" },
  confirmed: { label: "مؤكد", cls: "bg-brand-soft text-brand-on-soft" },
  completed: { label: "مكتمل", cls: "bg-brand-mint-soft text-brand-mint-text" },
  cancelled: { label: "ملغي", cls: "bg-red-50 text-red-700" },
};

type Stats = { total: number; waiting: number; completed: number; pending: number };
type RecentMessage = { id: string; from: string; body: string; time: string };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

type PatchBody = { status?: string; queueStatus?: string };

export default function TodayAppointmentsClient({
  appointments: initial,
  canCheer = false,
  clinicId,
  stats,
  messages,
  unreadCount,
}: {
  appointments: Appointment[];
  canCheer?: boolean;
  clinicId: string;
  stats: Stats;
  messages: RecentMessage[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [appointments, setAppointments] = useState(initial);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [cheered, setCheered] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ name: string; patientId: string } | null>(null);
  const [paymentModal, setPaymentModal] = useState<Appointment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  function showToast(name: string, patientId: string) {
    setToast({ name, patientId });
    setTimeout(() => setToast(null), 3500);
  }

  function removeAppt(id: string, name: string, patientId: string) {
    setRemoving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setAppointments((prev) => prev.filter((appointment) => appointment.id !== id));
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(name, patientId);
    }, 300);
  }

  async function patch(id: string, body: PatchBody) {
    setLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const appointment = appointments.find((item) => item.id === id);
      if (!appointment) return;

      if (body.status === "completed" || body.status === "cancelled") {
        removeAppt(id, appointment.patientName, appointment.patientId);
        router.refresh();
      } else {
        const updated = await res.json();
        setAppointments((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
        router.refresh();
      }
    } catch {
      alert("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  async function callNext() {
    setLoading("next");
    try {
      const res = await fetch("/api/appointments/next-queue", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "لا يوجد مراجع في الانتظار");
        return;
      }
      const updated = await res.json();
      const previous = appointments.find((appointment) => appointment.queueStatus === "current");
      if (previous) removeAppt(previous.id, previous.patientName, previous.patientId);
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === updated.id ? { ...appointment, ...updated, queueStatus: "current" } : appointment
        )
      );
      router.refresh();
    } catch {
      alert("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  async function cheer(id: string) {
    setLoading(`${id}_cheer`);
    try {
      const res = await fetch("/api/appointments/cheer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      });
      if (!res.ok) throw new Error();
      setCheered((prev) => new Set(prev).add(id));
    } catch {
      alert("فشل إرسال رسالة الاطمئنان");
    } finally {
      setLoading(null);
    }
  }

  async function completeWithPayment() {
    if (!paymentModal) return;
    setLoading(paymentModal.id);
    try {
      const amount = parseInt(paymentAmount);
      if (amount > 0) {
        await fetch("/api/patient-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: paymentModal.patientId, appointmentId: paymentModal.id, amount }),
        });
      }
      await patch(paymentModal.id, { status: "completed" });
    } finally {
      setPaymentModal(null);
      setPaymentAmount("");
      setLoading(null);
    }
  }

  async function remind(id: string) {
    setLoading(`${id}_remind`);
    try {
      await fetch("/api/appointments/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      });
      setReminded((prev) => new Set(prev).add(id));
    } catch {
      alert("فشل إرسال التذكير");
    } finally {
      setLoading(null);
    }
  }


  const active = appointments.filter(
    (appointment) =>
      appointment.status !== "cancelled" &&
      appointment.status !== "completed" &&
      appointment.queueStatus !== "done"
  );
  const current = active.find((appointment) => appointment.queueStatus === "current");
  const nextUp = active
    .filter((appointment) => appointment.queueStatus === "waiting")
    .sort((a, b) => (a.queueNumber ?? Number.MAX_SAFE_INTEGER) - (b.queueNumber ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);
  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const statCards = [
    { label: "مواعيد اليوم", value: stats.total, note: "كل حجوزات اليوم", dot: "bg-brand-blue" },
    { label: "في الانتظار", value: stats.waiting, note: "داخل الصالة الآن", dot: "bg-brand-gold" },
    { label: "أُنجزت", value: stats.completed, note: `من أصل ${arabicNumber(stats.total)}`, dot: "bg-emerald-600" },
    { label: "بانتظار التأكيد", value: stats.pending, note: "تحتاج تأكيداً منك", dot: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6">
      {/* مودال تسجيل الدفع */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/50 px-4" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold text-brand-ink">إكمال الموعد</h3>
            <p className="mb-5 text-sm text-brand-muted">كم دفع {paymentModal.patientName}؟ (اختياري)</p>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0 د.ع"
              min="0"
              aria-label="المبلغ المدفوع"
              className="mb-4 w-full rounded-2xl border border-brand-border px-4 py-3 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue"
              dir="ltr"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={completeWithPayment}
                disabled={loading === paymentModal.id}
                className="min-h-12 flex-1 rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:opacity-50"
              >
                {loading === paymentModal.id ? "جاري..." : "إكمال"}
              </button>
              <button
                onClick={() => setPaymentModal(null)}
                className="min-h-12 flex-1 rounded-2xl bg-brand-line font-bold text-brand-ink transition hover:bg-brand-border"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white shadow-xl">
          تم حفظ موعد {toast.name}
          <Link href={`/dashboard/patients/${toast.patientId}`} className="text-brand-gold underline">
            الملف
          </Link>
        </div>
      )}

      {/* المريض الحالي + التالي في الدور */}
      <section aria-label="المريض الحالي" className="grid gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-3xl bg-brand-blue p-6 text-white shadow-[0_22px_44px_-26px_rgba(31,95,209,0.75)] md:p-7 lg:col-span-2">
          <div aria-hidden className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full border-[40px] border-white/[0.06]" />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            {current ? (
              <div className="flex min-w-0 items-center gap-5">
                <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-3xl bg-white text-brand-blue">
                  <span className="text-xs font-semibold">الدور</span>
                  <span className="text-4xl font-bold leading-none">{current.queueNumber ? arabicNumber(current.queueNumber) : "-"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white/75">في غرفة الكشف الآن</p>
                  <Link href={`/dashboard/patients/${current.patientId}`} className="mt-1 block truncate text-2xl font-bold hover:underline md:text-3xl">
                    {current.patientName}
                  </Link>
                  <p className="mt-1 text-sm text-white/75">
                    موعده {formatTime(current.date)} · <span dir="ltr">{current.patientPhone}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-white/75">غرفة الكشف فارغة</p>
                <p className="mt-1 text-2xl font-bold md:text-3xl">
                  {nextUp.length > 0 ? `${nextUp[0].patientName} ينتظر دوره` : "لا يوجد مراجعون في الانتظار"}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={callNext}
                disabled={loading === "next"}
                className="min-h-14 rounded-2xl bg-brand-gold px-8 text-lg font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover active:translate-y-0 disabled:opacity-60"
              >
                {loading === "next" ? "جاري..." : current ? "التالي ←" : "استدعاء أول مراجع"}
              </button>
              <Link
                href={`/display/${clinicId}`}
                target="_blank"
                className="flex min-h-14 items-center rounded-2xl border border-white/35 px-5 text-sm font-semibold transition hover:bg-white/10"
              >
                شاشة الانتظار
              </Link>
            </div>
          </div>
          <div className="relative mt-6">
            <div className="mb-2 flex justify-between text-xs text-white/75">
              <span>تقدّم اليوم</span>
              <span>{arabicNumber(stats.completed)} من {arabicNumber(stats.total)} مراجع</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-brand-gold transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-brand-border bg-white p-5">
          <p className="text-sm font-semibold text-brand-muted">التالي في الدور</p>
          {nextUp.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">لا أحد في الانتظار</p>
          ) : (
            nextUp.map((appointment, index) => (
              <Link
                key={appointment.id}
                href={`/dashboard/patients/${appointment.patientId}`}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-brand-line ${index === 0 ? "bg-brand-bg" : ""}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-brand-on-soft">
                  {appointment.queueNumber ? arabicNumber(appointment.queueNumber) : "-"}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-brand-ink">{appointment.patientName}</span>
                <span className="text-xs text-brand-muted">{formatTime(appointment.date)}</span>
              </Link>
            ))
          )}
          <p className="mt-auto text-xs leading-6 text-brand-muted">يُنادى الاسم بالصوت على شاشة الانتظار عند ضغط &quot;التالي&quot;.</p>
        </div>
      </section>

      {/* أرقام اليوم */}
      <section aria-label="أرقام اليوم" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-brand-border bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-brand-muted">{card.label}</p>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${card.dot}`} />
            </div>
            <p className="mt-2 text-4xl font-bold leading-none text-brand-ink">{arabicNumber(card.value)}</p>
            <p className="mt-2 text-xs text-brand-muted">{card.note}</p>
          </div>
        ))}
      </section>

      {/* قائمة اليوم + رسائل واتساب */}
      <section className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="rounded-3xl border border-brand-border bg-white p-5 md:p-6 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-ink">مواعيد اليوم</h2>
            <Link href="/dashboard/appointments" className="text-sm font-semibold text-brand-on-soft hover:underline">
              كل الحجوزات
            </Link>
          </div>

          {active.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-border bg-brand-bg py-12 text-center">
              <p className="text-base font-semibold text-brand-muted">لا توجد مواعيد متبقية اليوم</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-line">
              {active.map((appointment) => {
                const status = STATUS[appointment.status] ?? STATUS.pending;
                const isCurrent = appointment.queueStatus === "current";
                const isRemoving = removing.has(appointment.id);

                return (
                  <div
                    key={appointment.id}
                    className={`grid gap-3 rounded-2xl px-3 py-3.5 transition lg:grid-cols-[1fr_auto] lg:items-center ${isCurrent ? "bg-brand-mint-soft/60" : "hover:bg-brand-bg"}`}
                    style={{
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? "translateX(24px)" : "none",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="w-14 shrink-0 text-sm font-semibold text-brand-on-soft">{formatTime(appointment.date)}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/dashboard/patients/${appointment.patientId}`} className="truncate text-base font-semibold text-brand-ink hover:text-brand-blue">
                            {appointment.patientName}
                          </Link>
                          {isCurrent ? (
                            <span className="rounded-full bg-brand-mint-soft px-3 py-1 text-xs font-semibold text-brand-mint-text">في الداخل</span>
                          ) : (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
                          <span>الدور {appointment.queueNumber ? arabicNumber(appointment.queueNumber) : "-"}</span>
                          <span dir="ltr">{appointment.patientPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {appointment.status === "pending" && (
                        <button onClick={() => patch(appointment.id, { status: "confirmed" })} disabled={loading === appointment.id} className="min-h-10 rounded-xl bg-brand-soft px-4 text-xs font-semibold text-brand-on-soft transition hover:bg-brand-soft/70 disabled:opacity-50">
                          تأكيد
                        </button>
                      )}
                      <button onClick={() => { setPaymentModal(appointment); setPaymentAmount(""); }} disabled={loading === appointment.id} className="min-h-10 rounded-xl bg-brand-mint-soft px-4 text-xs font-semibold text-brand-mint-text transition hover:bg-brand-gold/40 disabled:opacity-50">
                        إكمال
                      </button>
                      <button onClick={() => remind(appointment.id)} disabled={loading === `${appointment.id}_remind` || reminded.has(appointment.id)} className="min-h-10 rounded-xl bg-amber-50 px-4 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50">
                        {reminded.has(appointment.id) ? "أُرسل" : "تذكير"}
                      </button>
                      <button onClick={() => patch(appointment.id, { status: "cancelled" })} disabled={loading === appointment.id} className="min-h-10 rounded-xl bg-red-50 px-4 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
                        إلغاء
                      </button>
                      {canCheer && (
                        <button
                          onClick={() => cheer(appointment.id)}
                          disabled={loading === `${appointment.id}_cheer` || cheered.has(appointment.id)}
                          title="إرسال رسالة اطمئنان للمريض عبر واتساب"
                          className={`min-h-10 rounded-xl px-4 text-xs font-semibold transition disabled:opacity-50 ${
                            cheered.has(appointment.id)
                              ? "cursor-default bg-brand-mint-soft text-brand-mint-text"
                              : "bg-pink-50 text-pink-700 hover:bg-pink-100"
                          }`}
                        >
                          {cheered.has(appointment.id) ? "✓ مجدول" : "رسالة اطمئنان"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-brand-border bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 shadow-[0_0_0_4px_rgba(5,150,105,0.18)]" />
              <h2 className="text-lg font-bold text-brand-ink">رسائل واتساب</h2>
            </div>
            {unreadCount > 0 && (
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-on-soft">{arabicNumber(unreadCount)} جديدة</span>
            )}
          </div>
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-muted">لا توجد رسائل بعد. البوت يستقبل الحجوزات تلقائياً.</p>
          ) : (
            <div className="mt-4 divide-y divide-brand-line">
              {messages.map((message) => (
                <div key={message.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-brand-ink" dir="auto">{message.from}</span>
                    <span className="shrink-0 text-xs text-brand-muted">{message.time}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-brand-muted">{message.body}</p>
                </div>
              ))}
            </div>
          )}
          <Link href="/dashboard/messages" className="mt-3 flex min-h-11 items-center justify-center rounded-2xl bg-brand-bg text-sm font-semibold text-brand-on-soft transition hover:bg-brand-line">
            فتح الرسائل
          </Link>
        </div>
      </section>
    </div>
  );
}
