import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PatientSearchClient from "./PatientSearchClient";

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  const clinicId = session.user.clinicId as string;

  const patients = await db.patient.findMany({
    where: { clinicId },
    include: { appointments: { select: { id: true, date: true, status: true }, orderBy: { date: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = (patients as any[]).map((p) => {
    const completed = p.appointments.filter((a: any) => a.status === "completed");
    const upcoming  = p.appointments.filter((a: any) => new Date(a.date) > new Date() && a.status !== "cancelled");
    return {
      id: p.id, name: p.name, phone: p.whatsappPhone,
      totalVisits: completed.length,
      lastVisit: completed.length > 0 ? completed[0].date.toISOString() : null,
      hasUpcoming: upcoming.length > 0,
    };
  });

  const withUpcoming = serialized.filter(p => p.hasUpcoming).length;
  const newThisMonth = (patients as any[]).filter(p => {
    const created = new Date(p.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">المرضى</h1>
        <p className="text-sm text-gray-400 mt-0.5">إدارة ملفات جميع مرضى العيادة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "إجمالي المرضى", value: patients.length, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
          { label: "لديهم موعد قادم", value: withUpcoming, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label: "جديد هذا الشهر", value: newThisMonth, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 flex flex-col gap-2 shadow-sm"
            style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <PatientSearchClient patients={serialized} />
    </div>
  );
}
