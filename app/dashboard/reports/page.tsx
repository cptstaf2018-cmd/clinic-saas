import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/feature-gates";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReportActions from "./ReportActions";
import FinancialActions from "./FinancialActions";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatMoney(value: number) {
  return value.toLocaleString("ar-IQ");
}

function formatDate(value: Date) {
  return value.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId;
  const { date: dateParam } = await searchParams;

  const [subscription, specialtyConfig, clinic] = await Promise.all([
    db.subscription.findUnique({ where: { clinicId } }),
    getClinicSpecialtyConfig(clinicId),
    db.clinic.findUnique({ where: { id: clinicId }, select: { name: true, logoUrl: true, whatsappNumber: true } }),
  ]);
  const canViewReports = canUseFeature(subscription?.plan, "dailyReports");

  const today = dateParam ? new Date(dateParam) : new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayIso = today.toISOString().slice(0, 10);

  const [appointments, newPatients, totalPatients, medicalRecordsToday, medicalRecordsMonth, incomingMessages, paymentsToday, paymentsMonth] = canViewReports
    ? await Promise.all([
        db.appointment.findMany({
          where: { clinicId, date: { gte: today, lt: tomorrow } },
          select: { status: true },
        }),
        db.patient.count({ where: { clinicId, createdAt: { gte: today, lt: tomorrow } } }),
        db.patient.count({ where: { clinicId } }),
        db.medicalRecord.count({ where: { clinicId, createdAt: { gte: today, lt: tomorrow } } }),
        db.medicalRecord.count({ where: { clinicId, createdAt: { gte: monthStart } } }),
        db.incomingMessage.count({ where: { clinicId, createdAt: { gte: today, lt: tomorrow } } }),
        db.payment.findMany({
          where: { clinicId, createdAt: { gte: today, lt: tomorrow } },
          select: { amount: true, status: true },
        }),
        db.payment.findMany({
          where: { clinicId, createdAt: { gte: monthStart } },
          select: { amount: true, status: true },
        }),
      ])
    : [[], 0, 0, 0, 0, 0, [], []];

  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled").length;
  const active = appointments.length - completed - cancelled;
  const todayRevenue = paymentsToday
    .filter((payment) => payment.status === "approved")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const monthRevenue = paymentsMonth
    .filter((payment) => payment.status === "approved")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const now = new Date();
  const reportTime = now.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
  const reportNumber = `RPT-${String(now.getHours()).padStart(2,"0")}${String(now.getMinutes()).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}${String(now.getMonth()+1).padStart(2,"0")}`;

  const summary = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 تقرير العيادة اليومي الرسمي`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🏥 ${clinic?.name ?? "العيادة"}`,
    `⚕️ الاختصاص: ${specialtyConfig.nameAr}`,
    `📅 التاريخ: ${formatDate(today)}`,
    `🕐 الوقت: ${reportTime}`,
    `🔢 رقم التقرير: ${reportNumber}`,
    ``,
    `📊 الإحصائيات:`,
    `• حجوزات اليوم: ${appointments.length}`,
    `• زيارات مكتملة: ${completed}`,
    `• زيارات ملغاة: ${cancelled}`,
    `• مراجعون جدد: ${newPatients}`,
    `• سجلات طبية: ${medicalRecordsToday}`,
    ``,
    `💰 المالية:`,
    `• إيراد اليوم: ${formatMoney(todayRevenue)} د.ع`,
    `• إيراد الشهر: ${formatMoney(monthRevenue)} د.ع`,
    ``,
    `💬 واتساب: ${incomingMessages} رسالة`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `وزارة الصحة العراقية | Iraqi Ministry of Health`,
  ].join("\n");

  const reportGroups = [
    {
      title: "التقارير الطبية",
      description: `تقارير ${specialtyConfig.nameAr}، ملفات المرضى، الوصفات، والمستندات الطبية.`,
      tone: "bg-blue-50 ring-blue-100",
      items: [
        { label: "سجلات اليوم", value: medicalRecordsToday, hint: "زيارات موثقة" },
        { label: "سجلات الشهر", value: medicalRecordsMonth, hint: "نشاط طبي" },
        { label: "أنواع المستندات", value: specialtyConfig.documentTypes.length, hint: specialtyConfig.nameAr },
      ],
      actions: [
        { label: "ملفات المرضى", href: "/dashboard/patients" },
      ],
    },
    {
      title: "التقارير المالية",
      description: "الإيرادات، المدفوعات، الذمم، والملخصات المالية حسب الفترة.",
      tone: "bg-emerald-50 ring-emerald-100",
      items: [
        { label: "إيراد اليوم", value: `${formatMoney(todayRevenue)} د.ع`, hint: "مدفوعات مؤكدة" },
        { label: "إيراد الشهر", value: `${formatMoney(monthRevenue)} د.ع`, hint: "من بداية الشهر" },
        { label: "مدفوعات اليوم", value: paymentsToday.length, hint: "كل الحالات" },
      ],
      actions: [
        { label: "طباعة التقرير المالي", href: "#print" },
        { label: "إرسال عبر واتساب", href: "#whatsapp" },
      ],
    },
    {
      title: "تقارير المواعيد والازدحام",
      description: "حالة الحجوزات، الانتظار، الإلغاء، والإنتاجية اليومية.",
      tone: "bg-amber-50 ring-amber-100",
      items: [
        { label: "حجوزات اليوم", value: appointments.length, hint: `${arabicNumber(active)} قيد المتابعة` },
        { label: "مكتملة", value: completed, hint: "انتهت اليوم" },
        { label: "ملغاة", value: cancelled, hint: "إلغاء اليوم" },
      ],
      actions: [
        { label: "إدارة الحجوزات", href: "/dashboard/appointments" },
        { label: "شاشة الانتظار", href: `/display/${clinicId}` },
      ],
    },
    {
      title: "تقارير المرضى والتواصل",
      description: "المراجعين الجدد، إجمالي الملفات، رسائل واتساب والتنبيهات.",
      tone: "bg-slate-50 ring-slate-200",
      items: [
        { label: "مراجعون جدد", value: newPatients, hint: "أضيفوا اليوم" },
        { label: "إجمالي المرضى", value: totalPatients, hint: "ملفات العيادة" },
        { label: "رسائل اليوم", value: incomingMessages, hint: "واتساب" },
      ],
      actions: [
        { label: "صندوق الرسائل", href: "/dashboard/messages" },
        { label: "قائمة المراجعين", href: "/dashboard/patients" },
      ],
    },
  ];

  return (
    <div className="p-4 print:p-0 print:bg-white md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6 print:max-w-none print:space-y-4" data-report-container>

        {/* ═══════════════════════════════════════════════════════
            رأس الطباعة الرسمي — يظهر فقط عند الطباعة
        ═══════════════════════════════════════════════════════ */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-4" data-print-header>
          <div className="flex items-center justify-between gap-4">

            {/* يمين — شعار العيادة + الاسم */}
            <div className="flex items-center gap-3 min-w-0">
              {clinic?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinic.logoUrl} alt="شعار العيادة" className="h-16 w-16 rounded-full object-cover border border-slate-300" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-black border border-blue-200">
                  {clinic?.name?.slice(0, 1) ?? "ع"}
                </div>
              )}
              <div>
                <p className="text-base font-black text-slate-900">{clinic?.name ?? "العيادة"}</p>
                <p className="text-sm font-bold text-blue-700">اختصاص {specialtyConfig.nameAr}</p>
                <p className="text-xs text-slate-500">{clinic?.whatsappNumber}</p>
              </div>
            </div>

            {/* وسط — شعار وزارة الصحة العراقية */}
            <div className="flex flex-col items-center gap-1 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/moh-iraq.webp" alt="وزارة الصحة العراقية" className="h-20 w-20 object-contain" />
              <p className="text-xs font-black text-slate-700">جمهورية العراق</p>
              <p className="text-xs font-black text-red-700">وزارة الصحة العراقية</p>
              <p className="text-[10px] text-slate-500">Iraqi Ministry of Health</p>
            </div>

            {/* يسار — التاريخ والوقت ورقم التقرير */}
            <div className="text-left min-w-0 space-y-1">
              <div className="rounded-lg bg-slate-100 px-3 py-1">
                <p className="text-[10px] text-slate-500">التاريخ</p>
                <p className="text-sm font-black text-slate-900">{formatDate(today)}</p>
              </div>
              <div className="rounded-lg bg-slate-100 px-3 py-1">
                <p className="text-[10px] text-slate-500">الوقت</p>
                <p className="text-sm font-black text-slate-900">{reportTime}</p>
              </div>
              <div className="rounded-lg bg-blue-50 px-3 py-1 border border-blue-200">
                <p className="text-[10px] text-blue-600">رقم التقرير</p>
                <p className="text-xs font-black text-blue-800" dir="ltr">{reportNumber}</p>
              </div>
            </div>
          </div>

          {/* عنوان التقرير */}
          <div className="mt-4 text-center border-t border-slate-300 pt-3">
            <h1 className="text-xl font-black text-slate-900">التقرير اليومي الرسمي للعيادة</h1>
            <p className="text-sm text-slate-500">وثيقة رسمية صادرة عن نظام إدارة عيادتي</p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            رأس الويب العادي — يختفي عند الطباعة
        ═══════════════════════════════════════════════════════ */}
        <section className="print:hidden rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-emerald-700">مركز التقارير</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">كل تقارير العيادة</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
                مركز واحد للتقارير الطبية، المالية، المواعيد، المرضى، واتساب مع الطباعة والمشاركة.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* منتقي التاريخ */}
              <form method="GET" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 ring-1 ring-slate-200">
                <label className="text-xs font-black text-slate-500">التاريخ</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={todayIso}
                  max={new Date().toISOString().slice(0, 10)}
                  className="text-sm font-bold text-slate-800 outline-none"
                  onChange={undefined}
                />
                <button type="submit" className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-black text-white hover:bg-blue-700">
                  عرض
                </button>
              </form>
              {canViewReports ? (
                <ReportActions
                  summary={summary}
                  clinicName={clinic?.name ?? ""}
                  specialty={specialtyConfig.nameAr}
                />
              ) : null}
            </div>
          </div>
        </section>

        {!canViewReports ? (
          <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-2xl font-black text-amber-900">التقارير غير متاحة</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm font-bold leading-7 text-amber-800/80">
              هذه الميزة تحتاج اشتراكاً فعالاً. افتح صفحة الاشتراك لتجديد أو ترقية الباقة.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <SummaryCard label="حجوزات اليوم" value={appointments.length} hint={`${arabicNumber(active)} نشطة`} />
              <SummaryCard label="سجلات طبية" value={medicalRecordsToday} hint="اليوم" />
              <SummaryCard label="إيراد اليوم" value={`${formatMoney(todayRevenue)} د.ع`} hint="مؤكد" />
              <SummaryCard label="رسائل واتساب" value={incomingMessages} hint="اليوم" />
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              {reportGroups.map((group) => (
                <article key={group.title} className={`rounded-[30px] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ${group.tone}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-black text-slate-950">{group.title}</h2>
                      <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{group.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {group.items.map((item) => (
                      <ReportCell key={item.label} label={item.label} value={item.value} hint={item.hint} />
                    ))}
                  </div>
                  {group.title === "التقارير المالية" ? (
                    <FinancialActions summary={summary} whatsappNumber={clinic?.whatsappNumber ?? ""} />
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.actions.map((action) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          target={action.href.startsWith("/display/") ? "_blank" : undefined}
                          className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-950 hover:text-white"
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
              <h2 className="text-2xl font-black text-slate-950">مستندات {specialtyConfig.nameAr}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-500">
                اختر نوع المستند لإنشائه — ستنتقل لملفات المرضى لاختيار مريض معين.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {specialtyConfig.documentTypes.map((documentType) => (
                  <Link
                    key={documentType.id}
                    href={`/dashboard/patients?doc=${documentType.id}`}
                    title={`إنشاء ${documentType.labelAr} لمريض`}
                    className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white"
                  >
                    <span>📄</span>
                    {documentType.labelAr}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-[11px] font-bold text-slate-400">
                💡 بعد اختيار المريض، افتح ملفه ثم اضغط &quot;سجل طبي جديد&quot; لإنشاء المستند
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  const display = typeof value === "number" ? arabicNumber(value) : value;
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{display}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{hint}</p>
    </div>
  );
}

function ReportCell({ label, value, hint }: { label: string; value: number | string; hint: string }) {
  const display = typeof value === "number" ? arabicNumber(value) : value;
  return (
    <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-white/70">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{display}</p>
      <p className="mt-1 text-[11px] font-bold text-slate-400">{hint}</p>
    </div>
  );
}
