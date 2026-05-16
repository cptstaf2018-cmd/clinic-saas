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
  pending: { label: "معلق", cls: "bg-amber-50 text-amber-700 ring-amber-100" },
  confirmed: { label: "مؤكد", cls: "bg-blue-50 text-blue-700 ring-blue-100" },
  completed: { label: "مكتمل", cls: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  cancelled: { label: "ملغي", cls: "bg-red-50 text-red-700 ring-red-100" },
};

const QUEUE: Record<string, { label: string; cls: string }> = {
  waiting: { label: "انتظار", cls: "bg-slate-100 text-slate-600" },
  current: { label: "داخل", cls: "bg-violet-600 text-white" },
  done: { label: "منتهي", cls: "bg-emerald-100 text-emerald-700" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

type PatchBody = { status?: string; queueStatus?: string };

export default function TodayAppointmentsClient({ appointments: initial, canCheer = false }: { appointments: Appointment[]; canCheer?: boolean }) {
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

  return (
    <div>
      {/* مودال تسجيل الدفع */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" dir="rtl">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-1">إكمال الموعد</h3>
            <p className="text-sm text-slate-500 mb-5">كم دفع {paymentModal.patientName}؟ (اختياري)</p>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0 د.ع"
              min="0"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
              dir="ltr"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={completeWithPayment}
                disabled={loading === paymentModal.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition"
              >
                {loading === paymentModal.id ? "جاري..." : "إكمال"}
              </button>
              <button
                onClick={() => setPaymentModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-xl">
          تم حفظ موعد {toast.name}
          <Link href={`/dashboard/patients/${toast.patientId}`} className="underline">
            الملف
          </Link>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          onClick={callNext}
          disabled={loading === "next"}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.20)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
        >
          {loading === "next" ? "جاري..." : "استدعاء التالي"}
        </button>
      </div>

      {active.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
          <p className="text-lg font-black text-slate-400">لا توجد مواعيد اليوم</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {active.map((appointment) => {
            const status = STATUS[appointment.status] ?? STATUS.pending;
            const queue = QUEUE[appointment.queueStatus] ?? QUEUE.waiting;
            const isCurrent = appointment.queueStatus === "current";
            const isRemoving = removing.has(appointment.id);

            return (
              <div
                key={appointment.id}
                className={`rounded-[24px] p-4 ring-1 transition ${
                  isCurrent
                    ? "bg-violet-50 ring-violet-100 shadow-[0_12px_32px_rgba(124,58,237,0.10)]"
                    : "bg-white ring-slate-200 shadow-sm hover:shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
                }`}
                style={{
                  opacity: isRemoving ? 0 : 1,
                  transform: isRemoving ? "translateX(24px)" : "none",
                }}
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${isCurrent ? "bg-violet-600 text-white" : "bg-blue-50 text-blue-700 ring-1 ring-blue-100"}`}>
                      #{appointment.queueNumber ? arabicNumber(appointment.queueNumber) : "-"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/dashboard/patients/${appointment.patientId}`} className="truncate text-base font-black text-slate-950 hover:text-blue-700">
                          {appointment.patientName}
                        </Link>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${status.cls}`}>{status.label}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${queue.cls}`}>{queue.label}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                        <span>رقم الانتظار {appointment.queueNumber ? arabicNumber(appointment.queueNumber) : "-"}</span>
                        <span dir="ltr">{appointment.patientPhone}</span>
                        <span>{formatTime(appointment.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 lg:flex">
                    {appointment.status === "pending" && (
                      <button onClick={() => patch(appointment.id, { status: "confirmed" })} disabled={loading === appointment.id} className="rounded-2xl bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 disabled:opacity-50">
                        تأكيد
                      </button>
                    )}
                    <button onClick={() => { setPaymentModal(appointment); setPaymentAmount(""); }} disabled={loading === appointment.id} className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:opacity-50">
                      إكمال
                    </button>
                    <button onClick={() => remind(appointment.id)} disabled={loading === `${appointment.id}_remind` || reminded.has(appointment.id)} className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:opacity-50">
                      {reminded.has(appointment.id) ? "أُرسل" : "تذكير"}
                    </button>
                    <button onClick={() => patch(appointment.id, { status: "cancelled" })} disabled={loading === appointment.id} className="rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:opacity-50">
                      إلغاء
                    </button>
                    {canCheer && (
                      <button
                        onClick={() => cheer(appointment.id)}
                        disabled={loading === `${appointment.id}_cheer` || cheered.has(appointment.id)}
                        title="إرسال رسالة اطمئنان للمريض عبر واتساب"
                        className={`rounded-2xl px-4 py-2.5 text-xs font-black ring-1 transition disabled:opacity-50 ${
                          cheered.has(appointment.id)
                            ? "bg-emerald-100 text-emerald-700 ring-emerald-200 cursor-default"
                            : "bg-pink-50 text-pink-700 ring-pink-100 hover:bg-pink-100"
                        }`}
                      >
                        {cheered.has(appointment.id) ? "✓ مجدول" : "💚 اطمئنان"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
