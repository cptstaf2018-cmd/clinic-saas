import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import MedicalRecordsClient from "./MedicalRecordsClient";
import PatientAttachmentsClient from "./PatientAttachmentsClient";
import { getEntitlements } from "@/lib/feature-gates";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";

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
  const specialtyConfig = await getClinicSpecialtyConfig(clinicId);

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
    specialtyCode: record.specialtyCode,
    contentJson: record.contentJson,
  }));

  const waNumber = patient.whatsappPhone.replace(/^0/, "964").replace(/\D/g, "");

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ═══ Patient Banner ═══ */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
            <Link href="/dashboard/patients" className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900">
              ← قائمة المرضى
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700"
              >
                💬 واتساب
              </a>
              <Link
                href={`/dashboard/patients/${patient.id}/report`}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-700"
              >
                📄 تقرير PDF
              </Link>
            </div>
          </div>

          {/* Patient info */}
          <div className="flex flex-wrap items-center gap-5 px-5 py-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white">
              {initials(patient.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-slate-950">{patient.name}</h1>
              <p className="mt-0.5 text-sm font-bold text-slate-400" dir="ltr">{patient.whatsappPhone}</p>
            </div>
            <div className="flex flex-wrap gap-4 text-center">
              {[
                { label: "مواعيد", value: patient.appointments.length, color: "text-blue-600" },
                { label: "زيارات مكتملة", value: completedCount, color: "text-emerald-600" },
                { label: "سجلات طبية", value: patient.medicalRecords.length, color: "text-purple-600" },
              ].map((s) => (
                <div key={s.label} className="min-w-[64px]">
                  <p className={`text-2xl font-black ${s.color}`}>{arabicNumber(s.value)}</p>
                  <p className="text-xs font-bold text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info bar */}
          <div className="flex flex-wrap gap-0 border-t border-slate-100">
            <div className="flex-1 px-5 py-3">
              <p className="text-xs font-bold text-slate-400">آخر زيارة</p>
              <p className="mt-0.5 text-sm font-black text-slate-800">
                {lastVisit ? `${formatDate(lastVisit.date)} — ${formatTime(lastVisit.date)}` : "لا توجد زيارات"}
              </p>
            </div>
            <div className="flex-1 border-r border-slate-100 px-5 py-3">
              <p className="text-xs font-bold text-slate-400">الموعد القادم</p>
              <p className="mt-0.5 text-sm font-black text-slate-800">
                {upcoming
                  ? `${formatDate(upcoming.date)} — ${formatTime(upcoming.date)}`
                  : "لا يوجد موعد قادم"}
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Attachments ═══ */}
        {entitlements.features.includes("fullMedicalFile") && (
          <section>
            <PatientAttachmentsClient patientId={patient.id} />
          </section>
        )}

        {/* ═══ Medical Records + Visits ═══ */}
        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <MedicalRecordsClient
            patientId={patient.id}
            initialRecords={serializedRecords}
            canUseFollowUp={entitlements.features.includes("followUpTracking")}
            specialtyConfig={specialtyConfig}
          />

          {/* Visits */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-base font-black text-slate-950">سجل الزيارات</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">
                {arabicNumber(patient.appointments.length)}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {patient.appointments.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-black text-slate-400">لا توجد زيارات</p>
                </div>
              ) : (
                patient.appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{formatDate(appointment.date)}</p>
                      <p className="text-xs font-bold text-slate-400">
                        {formatTime(appointment.date)}
                        {appointment.queueNumber ? ` · رقم ${arabicNumber(appointment.queueNumber)}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${STATUS_COLOR[appointment.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                      {STATUS_LABEL[appointment.status] ?? appointment.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
