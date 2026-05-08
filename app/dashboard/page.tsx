import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import TodayAppointmentsClient from "./TodayAppointmentsClient";

const ARABIC_DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function arabicDate(d: Date) {
  const toAr = (n: number) => String(n).replace(/\d/g, x => "٠١٢٣٤٥٦٧٨٩"[+x]);
  return `${ARABIC_DAYS[d.getDay()]}، ${toAr(d.getDate())} ${ARABIC_MONTHS[d.getMonth()]} ${toAr(d.getFullYear())}`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId as string;
  const today = new Date();
  const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay   = new Date(today); endOfDay.setHours(23, 59, 59, 999);

  const [appointments, totalPatients] = await Promise.all([
    db.appointment.findMany({
      where: { clinicId, date: { gte: startOfDay, lte: endOfDay } },
      include: { patient: true },
      orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
    }),
    db.patient.count({ where: { clinicId } }),
  ]);

  const completed = appointments.filter(a => a.status === "completed").length;
  const waiting   = appointments.filter(a => a.queueStatus === "waiting").length;
  const current   = appointments.find(a => a.queueStatus === "current");
  const nextWaiting = appointments.find(a => a.queueStatus === "waiting");

  const serialized = appointments.map((a: any) => ({
    id: a.id,
    patientId: a.patientId,
    patientName: a.patient.name,
    patientPhone: a.patient.whatsappPhone,
    date: a.date.toISOString(),
    status: a.status,
    queueNumber: a.queueNumber,
    queueStatus: a.queueStatus,
  }));

  const stats = [
    {
      label: "مواعيد اليوم",
      value: appointments.length,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/>
        </svg>
      ),
      color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
    },
    {
      label: "مكتمل",
      value: completed,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
    },
    {
      label: "في الانتظار",
      value: waiting,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: "#d97706", bg: "#fffbeb", border: "#fde68a",
    },
    {
      label: "إجمالي المرضى",
      value: totalPatients,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">مواعيد اليوم</h1>
          <p className="text-sm text-gray-400 mt-0.5">{arabicDate(today)}</p>
        </div>
        {current && (
          <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs font-bold text-purple-700">حالياً: {current.patient.name}</span>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label}
            className="rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Call next banner */}
      {nextWaiting && (
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", boxShadow: "0 8px 32px rgba(37,99,235,0.3)" }}>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-lg">#{nextWaiting.queueNumber}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 text-xs font-semibold">المريض التالي في القائمة</p>
            <p className="text-white font-black text-lg truncate">{nextWaiting.patient.name}</p>
          </div>
          <div className="shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} className="w-6 h-6">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      )}

      {/* Appointments list */}
      <TodayAppointmentsClient appointments={serialized} />
    </div>
  );
}
