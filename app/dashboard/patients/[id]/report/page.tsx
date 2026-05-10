import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canUseFeature, FEATURE_LABELS, PLAN_DISPLAY, upgradeMessage } from "@/lib/feature-gates";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PrintButton from "./PrintButton";

const STATUS_LABEL: Record<string, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("ar-IQ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textOrDash(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : "غير مسجل";
}

export default async function PatientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const { id } = await params;
  const clinicId = session.user.clinicId as string;

  const [clinic, patient] = await Promise.all([
    db.clinic.findUnique({
      where: { id: clinicId },
      include: { subscription: true },
    }),
    db.patient.findFirst({
      where: { id, clinicId },
      include: {
        appointments: { orderBy: { date: "desc" }, take: 50 },
        medicalRecords: { orderBy: { date: "desc" } },
      },
    }),
  ]);

  if (!clinic || !patient) notFound();

  const canExport = canUseFeature(clinic.subscription?.plan, "patientPdfExport");
  const planKey = clinic.subscription?.plan === "trial" || clinic.subscription?.plan === "basic" || clinic.subscription?.plan === "standard" || clinic.subscription?.plan === "premium"
    ? clinic.subscription.plan
    : "basic";

  if (!canExport) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 md:p-10" dir="rtl">
        <div className="mx-auto max-w-3xl rounded-[28px] bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <Link href={`/dashboard/patients/${patient.id}`} className="text-sm font-black text-blue-700">
            العودة إلى ملف المراجع
          </Link>
          <div className="mt-8 rounded-[26px] bg-amber-50 p-6 ring-1 ring-amber-100">
            <p className="text-sm font-black text-amber-700">ميزة مقفلة</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{FEATURE_LABELS.patientPdfExport}</h1>
            <p className="mt-3 text-base font-bold leading-8 text-slate-600">{upgradeMessage("patientPdfExport")}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">
              باقتك الحالية: {PLAN_DISPLAY[planKey].name}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const completedVisits = patient.appointments.filter((appointment) => appointment.status === "completed").length;
  const reportDate = new Date();

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 print:bg-white print:p-0" dir="rtl">
      <div className="mx-auto max-w-5xl rounded-[30px] bg-white p-6 shadow-sm ring-1 ring-slate-200 print:max-w-none print:rounded-none print:p-0 print:shadow-none print:ring-0 md:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href={`/dashboard/patients/${patient.id}`} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200">
            العودة إلى ملف المراجع
          </Link>
          <PrintButton />
        </div>

        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-sm font-black text-blue-700">{clinic.name}</p>
              <h1 className="mt-2 text-4xl font-black tracking-normal text-slate-950">تقرير المراجع</h1>
              <p className="mt-2 text-sm font-bold text-slate-500">تاريخ التقرير: {formatDateTime(reportDate)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5 text-left ring-1 ring-slate-200" dir="ltr">
              <p className="text-xs font-black uppercase text-slate-400">Clinic Platform</p>
              <p className="mt-2 text-lg font-black text-slate-950">{clinic.whatsappNumber}</p>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200 md:col-span-2">
            <p className="text-xs font-black text-slate-400">اسم المراجع</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{patient.name}</h2>
            <p className="mt-2 text-sm font-bold text-slate-500" dir="ltr">{patient.whatsappPhone}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs font-black text-slate-400">عدد الزيارات</p>
            <p className="mt-3 text-4xl font-black text-slate-950">{arabicNumber(completedVisits)}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
            <p className="text-xs font-black text-slate-400">السجلات الطبية</p>
            <p className="mt-3 text-4xl font-black text-slate-950">{arabicNumber(patient.medicalRecords.length)}</p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-slate-950">السجل الطبي</h2>
          {patient.medicalRecords.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-200 p-8 text-center text-sm font-black text-slate-400">
              لا توجد سجلات طبية لهذا المراجع.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {patient.medicalRecords.map((record) => (
                <article key={record.id} className="rounded-3xl border border-slate-200 p-5 break-inside-avoid">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-black text-slate-950">{formatDate(record.date)}</h3>
                    {record.followUpDate ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        متابعة: {formatDate(record.followUpDate)}
                      </span>
                    ) : null}
                  </div>
                  <dl className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <dt className="text-xs font-black text-slate-400">الشكوى</dt>
                      <dd className="mt-1 text-sm font-bold leading-7 text-slate-800">{record.complaint}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-black text-slate-400">التشخيص</dt>
                      <dd className="mt-1 text-sm font-bold leading-7 text-slate-800">{textOrDash(record.diagnosis)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-black text-slate-400">الوصفة</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-800">{textOrDash(record.prescription)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-black text-slate-400">ملاحظات</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm font-bold leading-7 text-slate-800">{textOrDash(record.notes)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-black text-slate-950">آخر الحجوزات</h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3 text-right font-black">التاريخ</th>
                  <th className="p-3 text-right font-black">الحالة</th>
                  <th className="p-3 text-right font-black">رقم الدور</th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center font-black text-slate-400">لا توجد حجوزات</td>
                  </tr>
                ) : (
                  patient.appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-t border-slate-100">
                      <td className="p-3 font-bold text-slate-800">{formatDateTime(appointment.date)}</td>
                      <td className="p-3 font-bold text-slate-800">{STATUS_LABEL[appointment.status] ?? appointment.status}</td>
                      <td className="p-3 font-bold text-slate-800">{appointment.queueNumber ? arabicNumber(appointment.queueNumber) : "غير محدد"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-5 text-xs font-bold leading-6 text-slate-400">
          هذا التقرير صادر من نظام العيادة ويعتمد على البيانات المسجلة داخل حساب العيادة وقت إنشاء التقرير.
        </footer>
      </div>
    </main>
  );
}
