import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

const SEVERITY_LABELS: Record<string, string> = {
  success: "نجاح",
  info: "معلومة",
  warning: "تحذير",
  error: "خطأ",
};

const SEVERITY_STYLES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  info: "bg-blue-50 text-blue-700 ring-blue-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  error: "bg-rose-50 text-rose-700 ring-rose-100",
};

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function formatDate(value: Date) {
  return value.toLocaleString("ar-IQ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminMonitoringPage() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") redirect("/login");

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  let dbOk = false;
  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const [
    totalEvents,
    todayErrors,
    unresolvedErrors,
    lastHourWarnings,
    whatsappFailures,
    reminderFailures,
    recentEvents,
    activeClinics,
    expiringClinics,
  ] = await Promise.all([
    db.systemEvent.count(),
    db.systemEvent.count({ where: { severity: "error", createdAt: { gte: dayStart } } }),
    db.systemEvent.count({ where: { severity: "error", resolved: false } }),
    db.systemEvent.count({ where: { severity: "warning", createdAt: { gte: hourAgo } } }),
    db.systemEvent.count({ where: { type: "whatsapp_send_failed", createdAt: { gte: dayStart } } }),
    db.systemEvent.count({ where: { type: { in: ["reminder_24h_failed", "reminder_1h_failed"] }, createdAt: { gte: dayStart } } }),
    db.systemEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { clinic: { select: { name: true, whatsappNumber: true } } },
    }),
    db.subscription.count({ where: { status: { in: ["active", "trial"] } } }),
    db.subscription.count({
      where: {
        status: "active",
        expiresAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const healthCards = [
    { label: "قاعدة البيانات", value: dbOk ? "تعمل" : "خطأ", detail: dbOk ? "الاتصال مستقر" : "فشل الاتصال", tone: dbOk ? "success" : "error" },
    { label: "أخطاء اليوم", value: arabicNumber(todayErrors), detail: "أحداث بدرجة خطأ", tone: todayErrors > 0 ? "error" : "success" },
    { label: "غير معالجة", value: arabicNumber(unresolvedErrors), detail: "أخطاء تحتاج مراجعة", tone: unresolvedErrors > 0 ? "warning" : "success" },
    { label: "فشل واتساب", value: arabicNumber(whatsappFailures), detail: "خلال اليوم", tone: whatsappFailures > 0 ? "error" : "success" },
    { label: "فشل التذكيرات", value: arabicNumber(reminderFailures), detail: "خلال اليوم", tone: reminderFailures > 0 ? "warning" : "success" },
    { label: "عيادات نشطة", value: arabicNumber(activeClinics), detail: `${arabicNumber(expiringClinics)} تنتهي قريباً`, tone: expiringClinics > 0 ? "warning" : "info" },
  ];

  return (
    <div className="space-y-5" dir="rtl">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(90deg,#ffffff,#f2f7ff,#f7fdfb)] px-5 py-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">System Monitoring</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">مراقبة النظام</h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            مركز واحد لمتابعة الأعطال، واتساب، التذكيرات، وأحداث السوبر أدمن.
          </p>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-6">
          {healthCards.map((card) => (
            <div key={card.label} className="bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black text-slate-400">{card.label}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${
                  card.tone === "error" ? "bg-rose-500" : card.tone === "warning" ? "bg-amber-500" : card.tone === "success" ? "bg-emerald-500" : "bg-blue-500"
                }`} />
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{card.value}</p>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">آخر الأحداث</h2>
              <p className="mt-1 text-xs font-bold text-slate-400">{arabicNumber(totalEvents)} حدث مسجل في النظام</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
              آخر 30
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEvents.length === 0 ? (
              <div className="p-10 text-center text-sm font-black text-slate-400">لا توجد أحداث مسجلة بعد.</div>
            ) : (
              recentEvents.map((event) => (
                <article key={event.id} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[150px_130px_1fr]">
                  <div className="text-xs font-bold text-slate-400">{formatDate(event.createdAt)}</div>
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${SEVERITY_STYLES[event.severity] ?? SEVERITY_STYLES.info}`}>
                      {SEVERITY_LABELS[event.severity] ?? event.severity}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-slate-950">{event.title}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">{event.source}</span>
                    </div>
                    {event.message ? <p className="mt-1 text-xs font-bold leading-6 text-slate-500">{event.message}</p> : null}
                    <p className="mt-1 text-[11px] font-bold text-slate-400">
                      {event.clinic ? `${event.clinic.name} · ${event.clinic.whatsappNumber}` : "حدث عام على المنصة"}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">كيف تستخدمها؟</h2>
            <div className="mt-4 space-y-3 text-sm font-bold leading-7 text-slate-500">
              <p>إذا ظهر خطأ أحمر، افتح تفاصيل الحدث وافحص العيادة والوقت والمصدر.</p>
              <p>فشل واتساب يعني غالباً توكن غير صحيح، رصيد/ربط WasenderAPI، أو رقم غير صالح.</p>
              <p>فشل التذكيرات يعني أن الرسالة لم تؤشر كمرسلة، وسيبقى الموعد قابلاً للمراجعة.</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs font-black text-amber-700">ملاحظة تشغيلية</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">النسخ الاحتياطي</h3>
            <p className="mt-2 text-sm font-bold leading-7 text-amber-800/80">
              هذه الصفحة تجهز مركز المراقبة. الخطوة التالية هي ربط سجل النسخ الاحتياطي اليومي والتنبيه عند فشل النسخة.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black text-slate-400">آخر ساعة</p>
            <p className="mt-3 text-4xl font-black text-slate-950">{arabicNumber(lastHourWarnings)}</p>
            <p className="mt-1 text-sm font-bold text-slate-500">تحذيرات مسجلة</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
