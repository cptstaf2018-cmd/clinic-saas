import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature } from "@/lib/feature-gates";
import { redirect } from "next/navigation";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatMoney(value: number) {
  return value.toLocaleString("ar-IQ");
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const clinicId = session.user.clinicId;
  const subscription = await db.subscription.findUnique({ where: { clinicId } });
  const canViewReports = canUseFeature(subscription?.plan, "dailyReports");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [appointments, newPatients, medicalRecords, incomingMessages, payments] = canViewReports
    ? await Promise.all([
        db.appointment.findMany({
          where: { clinicId, date: { gte: today, lt: tomorrow } },
          select: { status: true },
        }),
        db.patient.count({ where: { clinicId, createdAt: { gte: today, lt: tomorrow } } }),
        db.medicalRecord.count({ where: { clinicId, createdAt: { gte: today, lt: tomorrow } } }),
        db.incomingMessage.count({ where: { clinicId, createdAt: { gte: today, lt: tomorrow } } }),
        db.payment.findMany({
          where: { clinicId, createdAt: { gte: today, lt: tomorrow } },
          select: { amount: true, status: true },
        }),
      ])
    : [[], 0, 0, 0, []];

  const completed = appointments.filter((appointment) => appointment.status === "completed").length;
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled").length;
  const active = appointments.length - completed - cancelled;
  const revenue = payments
    .filter((payment) => payment.status === "approved")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <p className="text-sm font-black text-emerald-700">تقارير التشغيل</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">التقرير اليومي</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
            ملخص سريع لحركة العيادة اليوم: الحجوزات، المراجعين الجدد، السجلات، الرسائل، والمدفوعات.
          </p>
        </section>

        {!canViewReports ? (
          <section className="rounded-[30px] border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-2xl font-black text-amber-900">التقارير اليومية غير متاحة</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm font-bold leading-7 text-amber-800/80">
              هذه الميزة تحتاج اشتراكاً فعالاً. افتح صفحة الاشتراك لتجديد أو ترقية الباقة.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {[
                { label: "حجوزات اليوم", value: appointments.length, hint: `${arabicNumber(active)} قيد المتابعة`, tone: "bg-blue-600 text-white" },
                { label: "مراجعون جدد", value: newPatients, hint: "أضيفوا اليوم", tone: "bg-emerald-600 text-white" },
                { label: "سجلات طبية", value: medicalRecords, hint: "سجلت اليوم", tone: "bg-indigo-600 text-white" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[28px] bg-white p-5 shadow-[0_14px_38px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black ${stat.tone}`}>
                    {arabicNumber(stat.value)}
                  </div>
                  <p className="mt-4 text-base font-black text-slate-950">{stat.label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-400">{stat.hint}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
                <h2 className="text-2xl font-black text-slate-950">تفاصيل الحجوزات</h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <ReportCell label="مكتملة" value={completed} />
                  <ReportCell label="ملغاة" value={cancelled} />
                  <ReportCell label="نشطة" value={active} />
                </div>
              </div>
              <div className="rounded-[30px] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
                <h2 className="text-2xl font-black text-slate-950">واتساب والمدفوعات</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <ReportCell label="رسائل واردة" value={incomingMessages} />
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black text-slate-400">إيراد مؤكد</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{formatMoney(revenue)} د.ع</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ReportCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{arabicNumber(value)}</p>
    </div>
  );
}
