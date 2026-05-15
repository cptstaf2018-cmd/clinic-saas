"use client";

import { useCallback, useEffect, useState } from "react";
import AppointmentsCalendarPremium from "@/components/AppointmentsCalendarPremium";

type Appt = {
  id: string;
  date: string;
  status: string;
  queueNumber: number | null;
  queueStatus: string;
  patient: { name: string; whatsappPhone: string };
};

const STATUS_MAP: Record<string, { label: string; badge: string; dot: string }> = {
  pending: { label: "معلق", badge: "bg-amber-50 text-amber-700 ring-amber-100", dot: "bg-amber-400" },
  confirmed: { label: "مؤكد", badge: "bg-blue-50 text-blue-700 ring-blue-100", dot: "bg-blue-500" },
  completed: { label: "مكتمل", badge: "bg-emerald-50 text-emerald-700 ring-emerald-100", dot: "bg-emerald-500" },
  cancelled: { label: "ملغي", badge: "bg-red-50 text-red-700 ring-red-100", dot: "bg-red-500" },
};

const RANGE_TABS = [
  { id: "today", label: "اليوم" },
  { id: "week", label: "الأسبوع" },
  { id: "upcoming", label: "القادمة" },
  { id: "past", label: "السابقة" },
  { id: "all", label: "الكل" },
];

const STATUS_FILTERS = [
  { id: "all", label: "كل الحالات" },
  { id: "pending", label: "معلق" },
  { id: "confirmed", label: "مؤكد" },
  { id: "completed", label: "مكتمل" },
  { id: "cancelled", label: "ملغي" },
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

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((word) => word[0]).join("") || "م";
}

type PatientOption = { id: string; name: string; whatsappPhone: string };

export default function AppointmentsPage() {
  const [range, setRange] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reminded, setReminded] = useState<Set<string>>(new Set());

  const [showBooking, setShowBooking] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ range, status: statusFilter, search });
    const res = await fetch(`/api/appointments/all?${params}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [range, statusFilter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAppointments();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAppointments]);

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

  useEffect(() => {
    if (patientSearch.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}`);
      if (res.ok) setPatientResults(await res.json());
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  async function handleBooking() {
    if (!selectedPatient || !bookingDate || !bookingTime) {
      setBookingError("اختر المريض والتاريخ والوقت");
      return;
    }
    setBookingLoading(true);
    setBookingError("");
    const dateTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatient.id, date: dateTime }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setBookingError(data?.error || "حدث خطأ");
    } else {
      setShowBooking(false);
      setSelectedPatient(null);
      setPatientSearch("");
      setBookingDate("");
      setBookingTime("");
      fetchAppointments();
    }
    setBookingLoading(false);
  }

  const total = appointments.length;
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;
  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <div className="absolute inset-0 opacity-10 pattern-medical" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black text-cyan-700">تشغيل اليوم</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">الحجوزات</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                جدول عملي للحجوزات، التأكيدات، التذكيرات، وإنهاء الزيارات بدون ازدحام.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBooking(true)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
              >
                + حجز جديد
              </button>
              <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-cyan-100">
                <p className="text-xs font-black text-cyan-700">حجوزات ظاهرة</p>
                <p className="mt-1 text-4xl font-black text-slate-900">{arabicNumber(total)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "الإجمالي", value: total, color: "bg-blue-600" },
            { label: "معلق", value: pending, color: "bg-amber-500" },
            { label: "مؤكد", value: confirmed, color: "bg-blue-600" },
            { label: "مكتمل", value: completed, color: "bg-emerald-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[26px] bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
              <div className={`h-2 w-14 rounded-full ${stat.color}`} />
              <p className="mt-5 text-sm font-black text-slate-500">{stat.label}</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{arabicNumber(stat.value)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[30px] bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto rounded-[22px] bg-slate-100 p-1.5 lg:flex-1">
              {RANGE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRange(tab.id)}
                  className={`min-w-max flex-1 rounded-2xl px-4 py-2.5 text-sm font-black transition ${
                    range === tab.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم المراجع أو رقم الهاتف"
                className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`min-w-max rounded-2xl px-4 py-2.5 text-xs font-black ring-1 transition ${
                    statusFilter === filter.id
                      ? "bg-blue-600 text-white ring-blue-600"
                      : "bg-white text-slate-500 ring-slate-200 hover:text-slate-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-[26px] bg-slate-100" />
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <p className="text-lg font-black text-slate-400">لا توجد حجوزات</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">غيّر الفلتر أو انتظر الحجوزات القادمة من واتساب.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {appointments.map((appointment) => {
                const status = STATUS_MAP[appointment.status] ?? STATUS_MAP.pending;
                const isToday = new Date(appointment.date).toDateString() === new Date().toDateString();

                return (
                  <div
                    key={appointment.id}
                    className={`rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] ${
                      appointment.status === "cancelled" ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-base font-black text-white">
                          {appointment.queueNumber ? arabicNumber(appointment.queueNumber) : initials(appointment.patient.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-black text-slate-950">{appointment.patient.name}</p>
                            {isToday && <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700 ring-1 ring-cyan-100">اليوم</span>}
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1 ${status.badge}`}>
                              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-bold text-slate-400" dir="ltr">{appointment.patient.whatsappPhone}</p>
                          <p className="mt-1 text-xs font-black text-slate-500">
                            {formatDate(appointment.date)}
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="text-blue-700">{formatTime(appointment.date)}</span>
                          </p>
                        </div>
                      </div>

                      {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                        <div className="grid grid-cols-2 gap-2 md:flex md:justify-end">
                          {appointment.status === "pending" && (
                            <button onClick={() => updateStatus(appointment.id, "confirmed")} disabled={actionLoading === appointment.id + "confirmed"} className="rounded-2xl bg-blue-50 px-4 py-2.5 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 disabled:opacity-50">
                              تأكيد
                            </button>
                          )}
                          <button onClick={() => updateStatus(appointment.id, "completed")} disabled={actionLoading === appointment.id + "completed"} className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:opacity-50">
                            مكتمل
                          </button>
                          <button onClick={() => sendReminder(appointment.id)} disabled={actionLoading === appointment.id + "remind" || reminded.has(appointment.id)} className="rounded-2xl bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-700 ring-1 ring-amber-100 transition hover:bg-amber-100 disabled:opacity-50">
                            {reminded.has(appointment.id) ? "تم التذكير" : "تذكير"}
                          </button>
                          <button onClick={() => updateStatus(appointment.id, "cancelled")} disabled={actionLoading === appointment.id + "cancelled"} className="rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:opacity-50">
                            إلغاء
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {showBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowBooking(false)}>
            <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" dir="rtl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-black text-slate-950">حجز جديد</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">اختر المريض وحدد الموعد</p>

              <div className="mt-5 space-y-4">
                {!selectedPatient ? (
                  <div>
                    <label className="text-sm font-black text-slate-700">البحث عن مريض</label>
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="اكتب اسم المريض أو رقم الهاتف"
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    />
                    {patientResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientSearch(""); setPatientResults([]); }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-right transition hover:bg-slate-50"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                              {p.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">{p.name}</p>
                              <p className="text-xs font-bold text-slate-400" dir="ltr">{p.whatsappPhone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
                      {selectedPatient.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900">{selectedPatient.name}</p>
                      <p className="text-xs font-bold text-slate-400" dir="ltr">{selectedPatient.whatsappPhone}</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="text-xs font-black text-red-500 hover:text-red-700">تغيير</button>
                  </div>
                )}

                <div>
                  <label className="text-sm font-black text-slate-700">التاريخ</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">الوقت</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {bookingError && <p className="text-sm font-black text-red-600">{bookingError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {bookingLoading ? "جاري الحجز..." : "تأكيد الحجز"}
                  </button>
                  <button
                    onClick={() => setShowBooking(false)}
                    className="rounded-2xl px-5 py-3 text-sm font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
