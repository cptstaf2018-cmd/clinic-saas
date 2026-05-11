import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/feature-gates";
import { getClinicSpecialtyConfig } from "@/lib/clinic-settings";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReportActions from "./ReportActions";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatMoney(value: number) {
  return value.toLocaleString("ar-IQ");
}

function formatDate(value: Date) {
  return value.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId;
  const [subscription, specialtyConfig] = await Promise.all([
    db.subscription.findUnique({ where: { clinicId } }),
    getClinicSpecialtyConfig(clinicId),
  ]);
  const canViewReports = canUseFeature(subscription?.plan, "dailyReports");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

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

  const summary = [
    `تقرير العيادة - ${formatDate(today)}`,
    `الاختصاص: ${specialtyConfig.nameAr}`,
    `حجوزات اليوم: ${appointments.length}`,
    `زيارات مكتملة: ${completed}`,
    `سجلات طبية اليوم: ${medicalRecordsToday}`,
    `إيراد اليوم: ${formatMoney(todayRevenue)} د.ع`,
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
        { label: "فتح ملفات المرضى", href: "/dashboard/patients" },
        { label: "تقرير مريض PDF", href: "/dashboard/patients" },
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
        { label: "فتح الاشتراك", href: "/dashboard/subscription" },
        { label: "طباعة مالي", href: "#print" },
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
        { label: "فتح الحجوزات", href: "/dashboard/appointments" },
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
        { label: "فتح الرسائل", href: "/dashboard/messages" },
        { label: "فتح المراجعين", href: "/dashboard/patients" },
      ],
    },
  ];

  return (
    <div className="p-4 print:bg-white md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-emerald-700">مركز التقارير</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">كل تقارير العيادة</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
                مركز واحد للتقارير الطبية، المالية، المواعيد، المرضى، واتساب مع الطباعة والمشاركة.
              </p>
            </div>
            {canViewReports ? <ReportActions summary={summary} /> : null}
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.actions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href === "#print" ? "/dashboard/reports" : action.href}
                        target={action.href.startsWith("/display/") ? "_blank" : undefined}
                        className="rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-950 hover:text-white"
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
              <h2 className="text-2xl font-black text-slate-950">مستندات {specialtyConfig.nameAr}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-500">
                تظهر هنا أنواع المستندات التي تخص الاختصاص المختار، وتستخدم داخل السجل الطبي وملف المريض.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {specialtyConfig.documentTypes.map((documentType) => (
                  <Link
                    key={documentType.id}
                    href="/dashboard/patients"
                    className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-600 hover:text-white"
                  >
                    {documentType.labelAr}
                  </Link>
                ))}
              </div>
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
