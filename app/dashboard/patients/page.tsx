import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PatientSearchClient from "./PatientSearchClient";
import ClearClinicDataButton from "../ClearClinicDataButton";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  const clinicId = session.user.clinicId as string;

  const patients = await db.patient.findMany({
    where: { clinicId },
    include: {
      appointments: {
        select: { id: true, date: true, status: true },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const serialized = patients.map((patient) => {
    const completed = patient.appointments.filter((appointment) => appointment.status === "completed");
    const upcoming = patient.appointments.filter(
      (appointment) => new Date(appointment.date) > now && appointment.status !== "cancelled"
    );

    return {
      id: patient.id,
      name: patient.name,
      phone: patient.whatsappPhone,
      totalVisits: completed.length,
      lastVisit: completed.length > 0 ? completed[0].date.toISOString() : null,
      hasUpcoming: upcoming.length > 0,
    };
  });

  const withUpcoming = serialized.filter((patient) => patient.hasUpcoming).length;
  const newThisMonth = patients.filter((patient) => {
    const created = new Date(patient.createdAt);
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <p className="text-sm font-black text-sky-700">ملفات العيادة</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">المراجعين</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            قائمة مرتبة لكل مراجع تعامل مع العيادة عبر واتساب أو من داخل لوحة التشغيل.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "إجمالي المراجعين", value: patients.length, bar: "bg-slate-800" },
            { label: "لديهم موعد قادم", value: withUpcoming, bar: "bg-sky-500" },
            { label: "جديد هذا الشهر", value: newThisMonth, bar: "bg-slate-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[22px] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70">
              <div className={`h-1.5 w-16 rounded-full ${stat.bar}`} />
              <p className="mt-5 text-sm font-black text-slate-500">{stat.label}</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{arabicNumber(stat.value)}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[30px] bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
          <div className="mb-4 flex justify-end">
            <ClearClinicDataButton />
          </div>
          <PatientSearchClient patients={serialized} />
        </section>
      </div>
    </div>
  );
}
