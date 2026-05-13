"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionHeader, SearchBar, FilterTab, EmptyState, Panel, Badge } from "@/components/shared-ui";
import { LABELS } from "@/lib/design-system";

type Appt = {
  id: string;
  date: string;
  status: string;
  queueNumber: number | null;
  queueStatus: string;
  patient: { name: string; whatsappPhone: string };
};

// Preserved status labels from original design
const STATUS_MAP: Record<string, { label: string; color: "blue" | "emerald" | "amber" | "rose" }> = {
  pending: { label: LABELS.pending, color: "amber" },
  confirmed: { label: LABELS.confirmed, color: "blue" },
  completed: { label: LABELS.completed, color: "emerald" },
  cancelled: { label: LABELS.cancelled, color: "rose" },
};

const RANGE_TABS = [
  { id: "today", label: LABELS.today },
  { id: "week", label: LABELS.week },
  { id: "upcoming", label: LABELS.upcoming },
  { id: "past", label: LABELS.past },
  { id: "all", label: LABELS.all },
];

const STATUS_FILTERS = [
  { id: "all", label: LABELS.allStatuses },
  { id: "pending", label: LABELS.pending },
  { id: "confirmed", label: LABELS.confirmed },
  { id: "completed", label: LABELS.completed },
  { id: "cancelled", label: LABELS.cancelled },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-IQ", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default function AppointmentsCalendarPremium() {
  const [range, setRange] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ range, status: statusFilter, search });
    try {
      const res = await fetch(`/api/appointments/all?${params}`);
      if (res.ok) setAppointments(await res.json());
    } catch {
      setAppointments([]);
    }
    setLoading(false);
  }, [range, statusFilter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAppointments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAppointments]);

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  async function updateStatus(id: string, newStatus: string) {
    setActionLoading(id + newStatus);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((appt) => (appt.id === id ? { ...appt, status: newStatus } : appt))
        );
      }
    } catch {
      console.error("Failed to update appointment");
    }
    setActionLoading(null);
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
        <SectionHeader
          title={LABELS.appointmentsCalendar}
          subtitle="إدارة وتنظيم جميع المواعيد والحجوزات"
          badge={[
            { text: `${arabicNumber(appointments.length)} موعد`, color: "blue" },
            {
              text: `${arabicNumber(appointments.filter((a) => a.status === "pending").length)} معلق`,
              color: "rose",
            },
          ]}
        />
      </section>

      {/* Range & Status Filters */}
      <Panel title="">
        <div className="space-y-4">
          {/* Date Range Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {RANGE_TABS.map((tab) => (
              <FilterTab
                key={tab.id}
                active={range === tab.id}
                label={tab.label}
                count={
                  tab.id === "today"
                    ? appointments.filter((a) => {
                        const apptDate = new Date(a.date).toDateString();
                        const today = new Date().toDateString();
                        return apptDate === today;
                      }).length
                    : appointments.length
                }
                onClick={() => setRange(tab.id)}
              />
            ))}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STATUS_FILTERS.map((filter) => (
              <FilterTab
                key={filter.id}
                active={statusFilter === filter.id}
                label={filter.label}
                count={statusCounts[filter.id as keyof typeof statusCounts] || 0}
                onClick={() => setStatusFilter(filter.id)}
              />
            ))}
          </div>

          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={`ابحث عن اسم المريض أو الهاتف`}
          />
        </div>
      </Panel>

      {/* Appointments List */}
      {loading ? (
        <Panel title="">
          <div className="text-center py-8">
            <p className="text-sm font-bold text-slate-500">{LABELS.loading}</p>
          </div>
        </Panel>
      ) : appointments.length === 0 ? (
        <Panel title="">
          <EmptyState
            title="لا توجد مواعيد"
            description="لا توجد مواعيد تطابق المرشحات المحددة"
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Appointment Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-base font-black text-slate-950">{appointment.patient.name}</p>
                      <p className="text-sm font-bold text-slate-500" dir="ltr">
                        {appointment.patient.whatsappPhone}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs font-bold">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-400">التاريخ</span>
                      <p className="text-slate-900">{formatDate(appointment.date)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-400">الوقت</span>
                      <p className="text-slate-900" dir="ltr">
                        {formatTime(appointment.date)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-400">القائمة</span>
                      <p className="text-slate-900">
                        {appointment.queueNumber ? `#${arabicNumber(appointment.queueNumber)}` : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col gap-2 md:items-end">
                  <Badge label={STATUS_MAP[appointment.status]?.label || appointment.status} color={STATUS_MAP[appointment.status]?.color || "slate"} />

                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(STATUS_MAP).map(([status, { label, color }]) => (
                      <button
                        key={status}
                        onClick={() => updateStatus(appointment.id, status)}
                        disabled={actionLoading === appointment.id + status || appointment.status === status}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 ${
                          appointment.status === status
                            ? `text-white`
                            : color === "blue"
                              ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100 hover:bg-blue-100"
                              : color === "emerald"
                                ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 hover:bg-emerald-100"
                                : color === "amber"
                                  ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100 hover:bg-amber-100"
                                  : "bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
