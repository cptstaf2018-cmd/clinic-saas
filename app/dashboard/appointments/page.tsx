"use client";

import { useEffect, useState, useCallback } from "react";

type Appt = {
  id: string;
  date: string;
  status: string;
  queueNumber: number | null;
  queueStatus: string;
  patient: { name: string; whatsappPhone: string };
};

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "معلق",  color: "bg-yellow-100 text-yellow-800 border-yellow-200",  dot: "bg-yellow-400" },
  confirmed: { label: "مؤكد",  color: "bg-blue-100 text-blue-800 border-blue-200",        dot: "bg-blue-400"   },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-800 border-green-200",     dot: "bg-green-400"  },
  cancelled: { label: "ملغي",  color: "bg-red-100 text-red-800 border-red-200",           dot: "bg-red-400"    },
};

const RANGE_TABS = [
  { id: "today",    label: "اليوم" },
  { id: "week",     label: "هذا الأسبوع" },
  { id: "upcoming", label: "القادمة" },
  { id: "past",     label: "السابقة" },
  { id: "all",      label: "الكل" },
];

const STATUS_FILTERS = [
  { id: "all",       label: "الكل" },
  { id: "pending",   label: "معلق" },
  { id: "confirmed", label: "مؤكد" },
  { id: "completed", label: "مكتمل" },
  { id: "cancelled", label: "ملغي" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-IQ", { weekday: "short", day: "numeric", month: "short" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

export default function AppointmentsPage() {
  const [range, setRange] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ range, status: statusFilter, search });
    const res = await fetch(`/api/appointments/all?${params}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [range, statusFilter, search]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function updateStatus(id: string, status: string) {
    setActionLoading(id + status);
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    fetchAppointments();
  }

  async function sendReminder(id: string) {
    setActionLoading(id + "remind");
    await fetch("/api/appointments/remind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id }),
    });
    setReminded((prev) => new Set(prev).add(id));
    setActionLoading(null);
  }

  // Stats
  const total = appointments.length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">الحجوزات</h1>
        <p className="text-sm text-gray-400 mt-0.5">إدارة جميع مواعيد العيادة</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "الإجمالي", value: total,     color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
          { label: "معلق",     value: pending,   color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
          { label: "مؤكد",     value: confirmed, color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "مكتمل",    value: completed, color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 shadow-sm text-center"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Range tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 mb-4 overflow-x-auto">
        {RANGE_TABS.map((t) => (
          <button key={t.id} onClick={() => setRange(t.id)}
            className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              range === t.id ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute right-3 top-2.5 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم المريض أو رقم الهاتف..."
            className="w-full border border-gray-200 rounded-xl pr-8 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        {/* Status filter */}
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                statusFilter === f.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments list */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-20 animate-pulse" />)}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} className="w-8 h-8">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-gray-400 font-semibold">لا توجد حجوزات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {appointments.map((apt) => {
            const sm = STATUS_MAP[apt.status] ?? STATUS_MAP.pending;
            const isToday = new Date(apt.date).toDateString() === new Date().toDateString();
            return (
              <div
                key={apt.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  apt.status === "cancelled" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Queue number */}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                    {apt.queueNumber ?? "—"}
                  </div>

                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{apt.patient.name}</p>
                      {isToday && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">اليوم</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{apt.patient.whatsappPhone}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600 font-medium">{formatDate(apt.date)}</span>
                      <span className="text-xs text-blue-600 font-bold">{formatTime(apt.date)}</span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${sm.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                      {sm.label}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {apt.status !== "cancelled" && apt.status !== "completed" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 flex-wrap">
                    {apt.status === "pending" && (
                      <button
                        onClick={() => updateStatus(apt.id, "confirmed")}
                        disabled={actionLoading === apt.id + "confirmed"}
                        className="flex-1 sm:flex-none text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        ✓ تأكيد
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(apt.id, "completed")}
                      disabled={actionLoading === apt.id + "completed"}
                      className="flex-1 sm:flex-none text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      ✓ مكتمل
                    </button>
                    <button
                      onClick={() => sendReminder(apt.id)}
                      disabled={actionLoading === apt.id + "remind" || reminded.has(apt.id)}
                      className="flex-1 sm:flex-none text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {reminded.has(apt.id) ? "✓ تم التذكير" : "🔔 تذكير"}
                    </button>
                    <button
                      onClick={() => updateStatus(apt.id, "cancelled")}
                      disabled={actionLoading === apt.id + "cancelled"}
                      className="flex-1 sm:flex-none text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      ✕ إلغاء
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
