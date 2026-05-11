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

const SPECIALTY_DASHBOARD: Record<string, {
  headline: string;
  description: string;
  focusMetrics: { label: string; hint: string; source: "appointments" | "waiting" | "completed" }[];
  actions: { label: string; href: string; tone: string }[];
  followups: string[];
}> = {
  dentistry: {
    headline: "تشغيل عيادة الأسنان",
    description: "متابعة الحجوزات، خطط العلاج، والأشعة من لوحة هادئة ومباشرة.",
    focusMetrics: [
      { label: "حجوزات اليوم", hint: "كل مواعيد الأسنان", source: "appointments" },
      { label: "قائمة الانتظار", hint: "جاهزون للدخول", source: "waiting" },
      { label: "زيارات منتهية", hint: "تم إغلاقها اليوم", source: "completed" },
    ],
    actions: [
      { label: "فتح ملفات المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقرير علاج أسنان", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["خطط علاج مفتوحة", "أشعة تحتاج مراجعة", "تنظيف وحشوات", "مراجعات ألم حاد"],
  },
  pediatrics: {
    headline: "تشغيل عيادة الأطفال",
    description: "متابعة مراجعات الأطفال، النمو، الحرارة، والتطعيمات من مكان واحد.",
    focusMetrics: [
      { label: "حجوزات الأطفال", hint: "كل مواعيد اليوم", source: "appointments" },
      { label: "ينتظرون الدور", hint: "داخل الانتظار", source: "waiting" },
      { label: "زيارات مكتملة", hint: "أغلقت اليوم", source: "completed" },
    ],
    actions: [
      { label: "ملفات الأطفال", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير نمو وتطعيم", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["تطعيمات قادمة", "متابعة وزن وطول", "حالات حرارة", "مراجعات نمو"],
  },
  dermatology: {
    headline: "تشغيل عيادة الجلدية",
    description: "تنظيم الجلسات، صور المتابعة، وتقارير تطور الحالة.",
    focusMetrics: [
      { label: "مواعيد اليوم", hint: "جلسات ومراجعات", source: "appointments" },
      { label: "بانتظار الدخول", hint: "في العيادة", source: "waiting" },
      { label: "جلسات منتهية", hint: "تمت اليوم", source: "completed" },
    ],
    actions: [
      { label: "ملفات الحالات", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير قبل/بعد", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["صور قبل/بعد", "متابعة تطور الحالة", "جلسات علاج", "مراجعة وصفات"],
  },
  cardiology: {
    headline: "تشغيل عيادة القلب",
    description: "مراقبة مواعيد القلب، الضغط، ECG، والتقارير الطبية الحساسة.",
    focusMetrics: [
      { label: "مواعيد القلب", hint: "مراجعات اليوم", source: "appointments" },
      { label: "في الانتظار", hint: "بانتظار الفحص", source: "waiting" },
      { label: "فحوص منتهية", hint: "أغلقت اليوم", source: "completed" },
    ],
    actions: [
      { label: "ملفات المرضى", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير ECG وضغط", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["ضغط غير مضبوط", "ECG للمراجعة", "إيكو مطلوب", "متابعة أدوية"],
  },
  gynecology: {
    headline: "تشغيل عيادة النسائية",
    description: "تنظيم مراجعات الحمل، السونار، والمتابعة النسائية اليومية.",
    focusMetrics: [
      { label: "مواعيد اليوم", hint: "متابعات وفحوص", source: "appointments" },
      { label: "في الانتظار", hint: "بانتظار الدخول", source: "waiting" },
      { label: "زيارات مكتملة", hint: "أغلقت اليوم", source: "completed" },
    ],
    actions: [
      { label: "ملفات المراجعات", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير حمل وسونار", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["متابعة حمل", "سونار مطلوب", "مراجعة تحاليل", "خطة متابعة"],
  },
  ophthalmology: {
    headline: "تشغيل عيادة العيون",
    description: "متابعة فحوص النظر، ضغط العين، والوصفات البصرية.",
    focusMetrics: [
      { label: "فحوص اليوم", hint: "مواعيد العيون", source: "appointments" },
      { label: "في الانتظار", hint: "بانتظار الفحص", source: "waiting" },
      { label: "فحوص مكتملة", hint: "أنجزت اليوم", source: "completed" },
    ],
    actions: [
      { label: "ملفات المرضى", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير نظر ونظارات", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["ضغط العين", "وصفة نظارات", "فحص قاع العين", "متابعة نظر"],
  },
  orthopedics: {
    headline: "تشغيل عيادة العظام",
    description: "تنظيم مراجعات الألم، الحركة، الأشعة، وخطط التأهيل.",
    focusMetrics: [
      { label: "مواعيد العظام", hint: "حالات اليوم", source: "appointments" },
      { label: "في الانتظار", hint: "بانتظار الفحص", source: "waiting" },
      { label: "زيارات مكتملة", hint: "أنجزت اليوم", source: "completed" },
    ],
    actions: [
      { label: "ملفات الحالات", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير أشعة وتأهيل", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["أشعة للمراجعة", "مدى الحركة", "خطة تأهيل", "إجراء قادم"],
  },
  internal_medicine: {
    headline: "تشغيل العيادة الباطنية",
    description: "متابعة المواعيد، الأمراض المزمنة، التحاليل، وخطط العلاج.",
    focusMetrics: [
      { label: "حجوزات اليوم", hint: "كل المواعيد", source: "appointments" },
      { label: "ينتظرون الدور", hint: "داخل الانتظار", source: "waiting" },
      { label: "زيارات مكتملة", hint: "تم إنهاؤها اليوم", source: "completed" },
    ],
    actions: [
      { label: "فتح المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "تقارير طبية ومالية", href: "/dashboard/reports", tone: "bg-white text-blue-700 ring-1 ring-blue-100" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
    ],
    followups: ["أمراض مزمنة", "تحاليل للمراجعة", "متابعة ضغط وسكر", "خطط علاج"],
  },
};

function dashboardBlueprint(code: string) {
  return SPECIALTY_DASHBOARD[code] ?? SPECIALTY_DASHBOARD.internal_medicine;
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
  const blueprint = dashboardBlueprint(specialtyConfig.code);
  const metricValue = {
    appointments: appointments.length,
    waiting: waiting.length,
    completed,
  };

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
                <h1 className="mt-2 text-3xl font-black md:text-4xl">{blueprint.headline}</h1>
                <p className="mt-2 max-w-xl text-sm font-bold leading-7 text-slate-500">
                  {blueprint.description}
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
              {blueprint.focusMetrics.map((stat, index) => (
                <div key={stat.label} className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
                  <div className={`h-2 w-12 rounded-full ${index === 0 ? "bg-blue-500" : index === 1 ? "bg-amber-400" : "bg-emerald-500"}`} />
                  <p className="mt-4 text-sm font-black text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{stat.hint}</p>
                  <p className="mt-1 text-4xl font-black text-slate-900">{arabicNumber(metricValue[stat.source])}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[26px] bg-white/85 p-4 ring-1 ring-sky-100">
                <div>
                  <p className="text-xs font-black text-blue-700">إجراءات سريعة</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">ابدأ العمل اليومي</h2>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {blueprint.actions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href === "#display" ? `/display/${clinicId}` : action.href}
                      target={action.href === "#display" ? "_blank" : undefined}
                      className={`rounded-2xl px-4 py-2.5 text-xs font-black transition hover:-translate-y-0.5 ${action.tone}`}
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-[26px] bg-white/85 p-4 ring-1 ring-sky-100">
                <p className="text-xs font-black text-emerald-700">متابعة {specialtyConfig.nameAr}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {blueprint.followups.map((item) => (
                    <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-100">
                      {item}
                    </div>
                  ))}
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
