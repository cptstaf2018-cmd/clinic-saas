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

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "معلق",   color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  confirmed: { label: "مؤكد",   color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  completed: { label: "مكتمل", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  cancelled: { label: "ملغي",   color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
};
const QUEUE: Record<string, { label: string; color: string; dot: string }> = {
  waiting: { label: "انتظار", color: "#64748b", dot: "#94a3b8" },
  current: { label: "حالي",   color: "#7c3aed", dot: "#a855f7" },
  done:    { label: "منتهي",  color: "#16a34a", dot: "#4ade80" },
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

  function removeAppt(id: string, name: string, patientId: string) {
    setRemoving(p => new Set(p).add(id));
    setTimeout(() => {
      setAppointments(p => p.filter(a => a.id !== id));
      setRemoving(p => { const s = new Set(p); s.delete(id); return s; });
      showToast(name, patientId);
    }, 400);
  }

  async function patch(id: string, body: object) {
    setLoading(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const apt = appointments.find(a => a.id === id)!;
      if ((body as any).status === "completed" || (body as any).status === "cancelled") {
        removeAppt(id, apt.patientName, apt.patientId);
      } else {
        const updated = await res.json();
        setAppointments(p => p.map(a => a.id === id ? { ...a, ...updated } : a));
      }
    } catch { alert("حدث خطأ"); }
    finally { setLoading(null); }
  }

  async function callNext() {
    setLoading("next");
    try {
      const res = await fetch("/api/appointments/next-queue", { method: "POST" });
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "لا يوجد مريض في الانتظار"); return; }
      const updated = await res.json();
      const prev = appointments.find(a => a.queueStatus === "current");
      if (prev) removeAppt(prev.id, prev.patientName, prev.patientId);
      setAppointments(p => p.map(a => a.id === updated.id ? { ...a, queueStatus: "current" } : a));
    } catch { alert("حدث خطأ"); }
    finally { setLoading(null); }
  }

  async function remind(id: string) {
    setLoading(id + "_r");
    try {
      await fetch("/api/appointments/remind", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      });
      setReminded(p => new Set(p).add(id));
    } catch { alert("فشل إرسال التذكير"); }
    finally { setLoading(null); }
  }

  const active = appointments.filter(a => a.status !== "cancelled" && a.status !== "completed");

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3"
          style={{ animation: "fadeIn .3s ease" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 shrink-0">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          تم حفظ موعد {toast.name} في ملف المريض
          <Link href={`/dashboard/patients/${toast.patientId}`} className="underline hover:text-green-100">عرض</Link>
        </div>
      )}

      {/* Call next button */}
      <div className="mb-5">
        <button onClick={callNext} disabled={loading === "next"}
          className="flex items-center gap-3 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          {loading === "next" ? "جاري..." : "استدعِ التالي"}
        </button>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-8 h-8">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-gray-400 font-semibold">لا توجد مواعيد اليوم</p>
          <p className="text-gray-300 text-sm mt-1">ستظهر المواعيد هنا عند إضافتها</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map((apt) => {
            const st = STATUS[apt.status] ?? STATUS.pending;
            const qu = QUEUE[apt.queueStatus] ?? QUEUE.waiting;
            const isCurrent = apt.queueStatus === "current";
            const isRemoving = removing.has(apt.id);

            return (
              <div key={apt.id}
                style={{
                  transition: "opacity .4s, transform .4s",
                  opacity: isRemoving ? 0 : 1,
                  transform: isRemoving ? "translateX(30px)" : "none",
                  background: isCurrent ? "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)" : "white",
                  border: isCurrent ? "1.5px solid #c4b5fd" : "1.5px solid #f1f5f9",
                  boxShadow: isCurrent
                    ? "0 4px 20px rgba(124,58,237,0.12)"
                    : "0 1px 6px rgba(0,0,0,0.04)",
                }}
                className="rounded-2xl p-4">

                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Queue number */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
                      style={{
                        background: isCurrent ? "#7c3aed" : "#f1f5f9",
                        color: isCurrent ? "white" : "#64748b",
                      }}>
                      {apt.queueNumber ?? "—"}
                    </div>
                    <div className="min-w-0">
                      <Link href={`/dashboard/patients/${apt.patientId}`}
                        className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-sm truncate block">
                        {apt.patientName}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5 dir-ltr">{apt.patientPhone}</p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: qu.dot }} />
                      <span className="text-[11px] font-semibold" style={{ color: qu.color }}>{qu.label}</span>
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 mt-2.5 mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-xs text-gray-400 font-medium">{formatTime(apt.date)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  {apt.status === "pending" && (
                    <button onClick={() => patch(apt.id, { status: "confirmed" })}
                      disabled={loading === apt.id}
                      className="flex-1 text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
                      تأكيد
                    </button>
                  )}
                  {apt.status !== "completed" && apt.status !== "cancelled" && (
                    <button onClick={() => patch(apt.id, { status: "completed" })}
                      disabled={loading === apt.id}
                      className="flex-1 text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                      مكتمل ✓
                    </button>
                  )}
                  {apt.status !== "cancelled" && (
                    <button onClick={() => patch(apt.id, { status: "cancelled" })}
                      disabled={loading === apt.id}
                      className="flex-1 text-xs font-bold py-2 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }}>
                      إلغاء
                    </button>
                  )}
                  {apt.status !== "cancelled" && apt.status !== "completed" && (
                    <button onClick={() => remind(apt.id)}
                      disabled={loading === apt.id + "_r" || reminded.has(apt.id)}
                      className="text-xs font-bold py-2 px-3 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
                      {reminded.has(apt.id) ? "✓ أُرسل" : "تذكير"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
