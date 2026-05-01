"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  patientName: string;
  patientPhone: string;
  date: string;
  status: string;
  queueNumber: number | null;
  queueStatus: string;
};

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: "معلق", cls: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "مؤكد", cls: "bg-blue-100 text-blue-800" },
  completed: { label: "مكتمل", cls: "bg-green-100 text-green-800" },
  cancelled: { label: "ملغي", cls: "bg-red-100 text-red-800" },
};

const queueLabels: Record<string, { label: string; cls: string }> = {
  waiting: { label: "انتظار", cls: "bg-gray-100 text-gray-600" },
  current: { label: "حالي", cls: "bg-purple-100 text-purple-700" },
  done: { label: "منتهي", cls: "bg-green-100 text-green-700" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TodayAppointmentsClient({
  appointments: initial,
}: {
  appointments: Appointment[];
}) {
  const [appointments, setAppointments] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());
  const router = useRouter();

  async function patchAppointment(
    id: string,
    body: { status?: string; queueStatus?: string }
  ) {
    setLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("فشل التحديث");
      const updated = await res.json();
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: updated.status ?? a.status,
                queueStatus: updated.queueStatus ?? a.queueStatus,
              }
            : a
        )
      );
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
      const res = await fetch("/api/appointments/next-queue", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "لا يوجد موعد انتظار");
        return;
      }
      const updated = await res.json();
      setAppointments((prev) =>
        prev.map((a) => {
          if (a.queueStatus === "current") return { ...a, queueStatus: "done" };
          if (a.id === updated.id) return { ...a, queueStatus: "current" };
          return a;
        })
      );
    } catch {
      alert("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  const active = appointments.filter((a) => a.status !== "cancelled");

  return (
    <div>
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
            return (
              <div
                key={apt.id}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                  isCurrent ? "border-purple-300 ring-1 ring-purple-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {apt.queueNumber !== null && (
                        <span className="text-xs text-gray-400">
                          #{apt.queueNumber}
                        </span>
                      )}
                      <p className="font-semibold text-gray-900 text-sm">
                        {apt.patientName}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {apt.patientPhone}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatTime(apt.date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${sl.cls}`}
                    >
                      {sl.label}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${ql.cls}`}
                    >
                      {ql.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {apt.status === "pending" && (
                    <button
                      onClick={() =>
                        patchAppointment(apt.id, { status: "confirmed" })
                      }
                      disabled={loading === apt.id}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      تأكيد
                    </button>
                  )}
                  {apt.status !== "completed" && apt.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        patchAppointment(apt.id, { status: "completed" })
                      }
                      disabled={loading === apt.id}
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      مكتمل
                    </button>
                  )}
                  {apt.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        patchAppointment(apt.id, { status: "cancelled" })
                      }
                      disabled={loading === apt.id}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                  )}
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <button
                      onClick={() => sendReminder(apt.id)}
                      disabled={loading === apt.id + "_remind" || reminded.has(apt.id)}
                      className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {reminded.has(apt.id) ? "تم التذكير ✓" : "تذكير"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
