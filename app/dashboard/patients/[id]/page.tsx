import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import MedicalRecordsClient from "./MedicalRecordsClient";
import { getEntitlements } from "@/lib/feature-gates";

const STATUS_LABEL: Record<string, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-100",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-100",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  cancelled: "bg-red-50 text-red-700 ring-red-100",
};

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatDate(iso: Date | string) {
  return new Date(iso).toLocaleDateString("ar-IQ", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: Date | string) {
  return new Date(iso).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string) {
  return name.trim().split(" ").slice(0, 2).map((word) => word[0]).join("") || "م";
}

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const patient = await db.patient.findFirst({
    where: { id, clinicId },
    include: {
      appointments: { orderBy: { date: "desc" }, take: 30 },
      medicalRecords: { orderBy: { date: "desc" } },
    },
  });

  if (!patient) notFound();

  const subscription = await db.subscription.findUnique({ where: { clinicId } });
  const entitlements = getEntitlements(subscription?.plan);

  const now = new Date();
  const completedCount = patient.appointments.filter((appointment) => appointment.status === "completed").length;
  const upcoming = patient.appointments
    .filter((appointment) => new Date(appointment.date) > now && appointment.status !== "cancelled" && appointment.status !== "completed")
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
  const lastVisit = patient.appointments.find((appointment) => appointment.status === "completed") ?? patient.appointments[0];

  const serializedRecords = patient.medicalRecords.map((record) => ({
    id: record.id,
    date: record.date.toISOString(),
    complaint: record.complaint,
    diagnosis: record.diagnosis,
    prescription: record.prescription,
    notes: record.notes,
    followUpDate: record.followUpDate ? record.followUpDate.toISOString() : null,
  }));

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <Link href="/dashboard/patients" className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-950">
          قائمة المراجعين
        </Link>

        <section className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <div className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] bg-blue-600 text-2xl font-black text-white">
                {initials(patient.name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-sky-700">ملف مراجع</p>
                <h1 className="mt-1 truncate text-3xl font-black">{patient.name}</h1>
                <p className="mt-1 text-sm font-bold text-slate-500" dir="ltr">{patient.whatsappPhone}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "مواعيد", value: patient.appointments.length },
                { label: "زيارات", value: completedCount },
                { label: "سجلات", value: patient.medicalRecords.length },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[22px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-100">
                  <p className="text-3xl font-black text-slate-900">{arabicNumber(stat.value)}</p>
                  <p className="mt-1 text-xs font-black text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-black text-slate-400">آخر نشاط</p>
              <p className="mt-1 text-sm font-black text-slate-900">
                {lastVisit ? `${formatDate(lastVisit.date)} | ${formatTime(lastVisit.date)}` : "لا توجد زيارات"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
              <p className="text-sm font-black text-slate-500">الموعد القادم</p>
              {upcoming ? (
                <>
                  <p className="mt-3 text-2xl font-black text-slate-950">{formatDate(upcoming.date)}</p>
                  <p className="mt-1 text-sm font-bold text-blue-700">
                    {formatTime(upcoming.date)}
                    {upcoming.queueNumber ? ` | رقم ${arabicNumber(upcoming.queueNumber)}` : ""}
                  </p>
                </>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-lg font-black text-slate-400">لا يوجد موعد قادم</p>
                </div>
              )}
            </div>

            <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
              <p className="text-sm font-black text-slate-500">ملخص طبي</p>
              <p className="mt-3 text-2xl font-black text-slate-950">{arabicNumber(patient.medicalRecords.length)}</p>
              <p className="mt-1 text-sm font-bold text-slate-400">سجل محفوظ</p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <MedicalRecordsClient patientId={patient.id} initialRecords={serializedRecords} canUseFollowUp={entitlements.features.includes("followUpTracking")} />

          <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-950">الزيارات</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                {arabicNumber(patient.appointments.length)}
              </span>
            </div>
            {patient.appointments.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
                <p className="text-sm font-black text-slate-400">لا توجد زيارات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {patient.appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-[24px] bg-slate-50 p-4 ring-1 ring-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{formatDate(appointment.date)}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {formatTime(appointment.date)}
                          {appointment.queueNumber ? ` | رقم ${arabicNumber(appointment.queueNumber)}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${STATUS_COLOR[appointment.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                        {STATUS_LABEL[appointment.status] ?? appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
