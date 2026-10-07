import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import TodayAppointmentsClient from "./TodayAppointmentsClient";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";
import { canUseFeature } from "@/lib/feature-gates";
import PharmacyPOS from "./pharmacy/PharmacyPOS";
import { getPharmacyToday, listPosProducts } from "@/lib/pharmacy/queries";

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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
      { label: "سجل المراجعين", href: "/dashboard/patients", tone: "bg-slate-950 text-white" },
      { label: "الحجوزات", href: "/dashboard/appointments", tone: "bg-white text-brand-blue ring-1 ring-brand-border" },
      { label: "شاشة الانتظار", href: "#display", tone: "bg-brand-mint-soft text-brand-mint-text ring-1 ring-brand-border" },
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
  const facility = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (facility?.facilityType === "pharmacy") {
    const [products, today] = await Promise.all([listPosProducts(clinicId), getPharmacyToday(clinicId)]);
    return <PharmacyPOS initialProducts={products} initialToday={today} />;
  }

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
  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const pending = appointments.filter((appointment) => appointment.status === "pending").length;
  const nextWaiting = waiting[0];
  const currentQueue = current?.queueNumber ?? null;
  const nextQueue = nextWaiting?.queueNumber ?? null;
  const specialtyConfig = await getClinicSpecialtyConfig(clinicId);
  const blueprint = dashboardBlueprint(specialtyConfig.code);
  const subscription = await db.subscription.findUnique({ where: { clinicId }, select: { plan: true } });
  const canCheer = canUseFeature(subscription?.plan, "cheerMessages");
  const metricValue = {
    appointments: appointments.length,
    waiting: waiting.length,
    completed,
  };
  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { name: true } });
  const recentInbound = await db.incomingMessage.findMany({
    where: { clinicId, direction: "inbound", archived: false },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, phone: true, body: true, createdAt: true },
  });
  const senders = await db.patient.findMany({
    where: { clinicId, whatsappPhone: { in: recentInbound.map((message) => message.phone) } },
    select: { whatsappPhone: true, name: true },
  });
  const senderName = new Map(senders.map((patient) => [patient.whatsappPhone, patient.name]));
  const unreadCount = await db.incomingMessage.count({ where: { clinicId, direction: "inbound", read: false, archived: false } });
  const recentMessages = recentInbound.map((message) => ({
    id: message.id,
    from: senderName.get(message.phone) ?? message.phone,
    body: message.body,
    time: formatTime(message.createdAt),
  }));
  const baghdadHour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Baghdad" }).format(today));
  const greeting = baghdadHour < 12 ? "صباح الخير" : "مساء الخير";
  const todayLabel = today.toLocaleDateString("ar-IQ", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Baghdad" });

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
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-brand-muted">{todayLabel} · {specialtyConfig.nameAr}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight text-brand-ink md:text-[34px]">
              {greeting}، {clinic?.name ?? "العيادة"}
            </h1>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <form action="/dashboard/patients" className="flex min-h-12 flex-1 items-center gap-2 rounded-2xl border border-brand-border bg-white px-4 focus-within:border-brand-blue md:w-72 md:flex-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-[18px] w-[18px] shrink-0 text-brand-muted"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
              <input name="q" type="search" placeholder="ابحث عن مراجع بالاسم أو الرقم" aria-label="بحث عن مراجع" className="w-full bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted/80" />
            </form>
            <Link href="/dashboard/appointments" className="flex min-h-12 items-center gap-2 rounded-2xl bg-brand-blue px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-blue-dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="h-[18px] w-[18px]"><path d="M12 5v14M5 12h14"/></svg>
              حجز جديد
            </Link>
          </div>
        </header>
        <TodayAppointmentsClient
          appointments={serialized}
          canCheer={canCheer}
          clinicId={clinicId}
          stats={{ total: appointments.length, waiting: waiting.length, completed, pending }}
          messages={recentMessages}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
}
