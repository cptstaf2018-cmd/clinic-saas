"use client";

import { useState } from "react";
import Link from "next/link";

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

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending:   { label: "معلق",   cls: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "مؤكد",   cls: "bg-blue-100 text-blue-800" },
  completed: { label: "مكتمل", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "ملغي",   cls: "bg-red-100 text-red-800" },
};

const queueLabels: Record<string, { label: string; cls: string }> = {
  waiting: { label: "انتظار", cls: "bg-gray-100 text-gray-600" },
  current: { label: "حالي",   cls: "bg-purple-100 text-purple-700" },
  done:    { label: "منتهي",  cls: "bg-green-100 text-green-700" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export default function TodayAppointmentsClient({ appointments: initial }: { appointments: Appointment[] }) {
  const [appointments, setAppointments] = useState(initial);
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ name: string; patientId: string } | null>(null);

  function showToast(name: string, patientId: string) {
    setToast({ name, patientId });
    setTimeout(() => setToast(null), 4000);
  }

  function removeAppointment(id: string, patientName: string, patientId: string) {
    setRemoving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setRemoving((prev) => { const s = new Set(prev); s.delete(id); return s; });
      showToast(patientName, patientId);
    }, 400);
  }

  async function patchAppointment(id: string, body: { status?: string; queueStatus?: string }) {
    setLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const apt = appointments.find((a) => a.id === id);
      // إذا أصبح مكتملاً أو ملغياً → أخفِه من القائمة
      if (body.status === "completed" || body.status === "cancelled") {
        removeAppointment(id, apt?.patientName ?? "", apt?.patientId ?? "");
      } else {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, ...updated } : a));
      }
    } catch {
      alert("حدث خطأ أثناء التحديث");
    } finally {
      setLoading(null);
    }
  }

  async function sendReminder(id: string) {
    setLoading(id + "_remind");
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

  async function callNext() {
    setLoading("next");
    try {
      const res = await fetch("/api/appointments/next-queue", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "لا يوجد مريض في الانتظار");
        return;
      }
      const updated = await res.json();
      // المريض الحالي السابق → أخفِه (انتهى دوره)
      const prev = appointments.find((a) => a.queueStatus === "current");
      if (prev) removeAppointment(prev.id, prev.patientName, prev.patientId);
      // المريض الجديد → حالي
      setAppointments((prev) => prev.map((a) => a.id === updated.id ? { ...a, queueStatus: "current" } : a));
    } catch {
      alert("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  const active = appointments.filter((a) => a.status !== "cancelled" && a.status !== "completed");

  return (
    <div>
      {/* إشعار الحفظ */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 shrink-0">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>تم حفظ موعد {toast.name} في ملف المريض</span>
          <Link href={`/dashboard/patients/${toast.patientId}`}
            className="underline underline-offset-2 hover:text-green-100 transition-colors">
            عرض الملف
          </Link>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={callNext}
          disabled={loading === "next"}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading === "next" ? "جاري..." : "استدعِ التالي"}
        </button>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          لا توجد مواعيد اليوم
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((apt) => {
            const sl = statusLabels[apt.status] ?? statusLabels.pending;
            const ql = queueLabels[apt.queueStatus] ?? queueLabels.waiting;
            const isCurrent = apt.queueStatus === "current";
            const isRemoving = removing.has(apt.id);
            return (
              <div
                key={apt.id}
                style={{ transition: "opacity 0.4s, transform 0.4s", opacity: isRemoving ? 0 : 1, transform: isRemoving ? "translateX(40px)" : "none" }}
                className={`bg-white rounded-xl border p-4 shadow-sm ${isCurrent ? "border-purple-300 ring-1 ring-purple-200" : "border-gray-200"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {apt.queueNumber !== null && <span className="text-xs text-gray-400">#{apt.queueNumber}</span>}
                      <Link href={`/dashboard/patients/${apt.patientId}`}
                        className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors">
                        {apt.patientName}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{apt.patientPhone}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatTime(apt.date)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sl.cls}`}>{sl.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ql.cls}`}>{ql.label}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {apt.status === "pending" && (
                    <button onClick={() => patchAppointment(apt.id, { status: "confirmed" })}
                      disabled={loading === apt.id}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                      تأكيد
                    </button>
                  )}
                  {apt.status !== "completed" && apt.status !== "cancelled" && (
                    <button onClick={() => patchAppointment(apt.id, { status: "completed" })}
                      disabled={loading === apt.id}
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                      مكتمل
                    </button>
                  )}
                  {apt.status !== "cancelled" && (
                    <button onClick={() => patchAppointment(apt.id, { status: "cancelled" })}
                      disabled={loading === apt.id}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                      إلغاء
                    </button>
                  )}
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <button onClick={() => sendReminder(apt.id)}
                      disabled={loading === apt.id + "_remind" || reminded.has(apt.id)}
                      className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                      {reminded.has(apt.id) ? "تم التذكير ✓" : "تذكير"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes fade-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}.animate-fade-in{animation:fade-in .3s ease}`}</style>
    </div>
  );
}
