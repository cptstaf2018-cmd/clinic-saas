import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import TodayAppointmentsClient from "./TodayAppointmentsClient";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const ARABIC_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function arabicDate(date: Date) {
  return `${ARABIC_DAYS[date.getDay()]} ${arabicNumber(date.getDate())} ${ARABIC_MONTHS[date.getMonth()]}`;
}

function formatTime(date?: Date) {
  if (!date) return "لا يوجد";
  return date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId as string;
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: { clinicId, date: { gte: startOfDay, lte: endOfDay } },
    include: { patient: true },
    orderBy: [{ queueNumber: "asc" }, { date: "asc" }],
  });

  const current = appointments.find((appointment) => appointment.queueStatus === "current");
  const waiting = appointments.filter((appointment) => appointment.queueStatus === "waiting");
  const active = appointments.filter((appointment) => appointment.status !== "completed" && appointment.status !== "cancelled");
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;
  const nextWaiting = waiting[0];
  const currentQueue = current?.queueNumber ?? null;
  const nextQueue = nextWaiting?.queueNumber ?? null;
  const specialtyConfig = await getClinicSpecialtyConfig(clinicId);

  const serialized = appointments.map((appointment) => ({
    id: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patient.name,
    patientPhone: appointment.patient.whatsappPhone,
    date: appointment.date.toISOString(),
    status: appointment.status,
    queueNumber: appointment.queueNumber,
    queueStatus: appointment.queueStatus,
  }));

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-5 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-black text-sky-700">
                  {arabicDate(today)} | {specialtyConfig.nameAr}
                </p>
                <h1 className="mt-2 text-3xl font-black md:text-4xl">
                  لوحة {specialtyConfig.nameAr}
                </h1>
                <p className="mt-2 max-w-xl text-sm font-bold leading-7 text-slate-500">
                  نظرة سريعة على الحجوزات، الدور الحالي، وقوالب {specialtyConfig.nameAr} الجاهزة.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/appointments" className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-blue-700">
                  الحجوزات
                </Link>
                <Link href="/dashboard/patients" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-slate-700 ring-1 ring-sky-100 transition hover:bg-sky-50">
                  المراجعين
                </Link>
                <Link href={`/display/${clinicId}`} target="_blank" className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-50">
                  شاشة الانتظار
                </Link>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: "حجوزات اليوم", hint: "كل المواعيد المسجلة", value: appointments.length, tone: "bg-blue-500" },
                { label: "ينتظرون الدور", hint: "داخل قائمة الانتظار", value: waiting.length, tone: "bg-amber-400" },
                { label: "زيارات مكتملة", hint: "تم إنهاؤها اليوم", value: completed, tone: "bg-emerald-500" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className={`h-2 w-12 rounded-full ${stat.tone}`} />
                  <p className="mt-4 text-sm font-black text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{stat.hint}</p>
                  <p className="mt-1 text-4xl font-black text-slate-900">{arabicNumber(stat.value)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[26px] bg-white/80 p-4 ring-1 ring-sky-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-blue-700">التجربة السريرية لهذا الاختصاص</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">قوالب {specialtyConfig.nameAr} فعالة</h2>
                </div>
                <Link href="/dashboard/patients" className="rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800">
                  فتح ملفات المراجعين
                </Link>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-blue-50 p-3 ring-1 ring-blue-100">
                  <p className="text-xs font-black text-blue-700">حقول الزيارة</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {specialtyConfig.encounterSections.slice(0, 5).map((section) => (
                      <Link key={section.id} href="/dashboard/patients" className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white hover:ring-blue-600">
                        {section.labelAr}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                  <p className="text-xs font-black text-emerald-700">تشخيصات سريعة</p>
                  <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
                    {specialtyConfig.quickDiagnoses.slice(0, 3).map((diagnosis) => (
                      <Link key={diagnosis} href={`/dashboard/patients?q=${encodeURIComponent(diagnosis)}`} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-emerald-100 transition hover:bg-emerald-600 hover:text-white hover:ring-emerald-600">
                        {diagnosis}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
                  <p className="text-xs font-black text-amber-700">مستندات الاختصاص</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {specialtyConfig.documentTypes.map((documentType) => (
                      <Link key={documentType.id} href={`/dashboard/patients?q=${encodeURIComponent(documentType.labelAr)}`} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-amber-100 transition hover:bg-amber-500 hover:text-white hover:ring-amber-500">
                        {documentType.labelAr}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
            <p className="text-sm font-black text-slate-500">الدور الآن</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-blue-600 text-xl font-black text-white">
                {currentQueue ? `#${arabicNumber(currentQueue)}` : "-"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-2xl font-black text-slate-950">{current?.patient.name ?? "لا يوجد مراجع حالي"}</p>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  {current ? `${formatTime(current.date)} | مطابق لشاشة الانتظار` : "جاهز لاستدعاء التالي"}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-400">التالي</p>
                <p className="mt-1 text-xl font-black text-slate-900">{nextQueue ? `#${arabicNumber(nextQueue)}` : "لا يوجد"}</p>
                {nextWaiting && <p className="mt-1 truncate text-xs font-black text-slate-500">{nextWaiting.patient.name}</p>}
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-400">معلق</p>
                <p className="mt-1 text-sm font-black text-slate-900">{arabicNumber(pending)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">مواعيد اليوم</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">{arabicNumber(active.length)} قيد المتابعة</p>
            </div>
          </div>
          <TodayAppointmentsClient appointments={serialized} />
        </section>
      </div>
    </div>
  );
}
