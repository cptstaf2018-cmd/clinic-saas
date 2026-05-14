import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import TodayAppointmentsClient from "./TodayAppointmentsClient";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";
import ClinicDashboardPremium from "@/components/ClinicDashboardPremium";

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
      <div className="mx-auto max-w-7xl">
        <ClinicDashboardPremium specialty={specialtyConfig.code} stats={{ appointmentsToday: active.length, waitingCount: waiting.length, completedCount: completed, specialty: specialtyConfig.code }} />
        <TodayAppointmentsClient appointments={serialized} />
      </div>
    </div>
  );
}
