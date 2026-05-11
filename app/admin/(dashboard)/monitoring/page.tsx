import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import MonitoringClient from "./MonitoringClient";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default async function AdminMonitoringPage() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") redirect("/login");

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

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
    whatsappFailures,
    reminderFailures,
    maintenanceStats,
    recentEvents,
    activeClinics,
    expiringClinics,
  ] = await Promise.all([
    db.systemEvent.count(),
    db.systemEvent.count({ where: { severity: "error", resolved: false } }),
    db.systemEvent.count({ where: { severity: "error", resolved: false } }),
    db.systemEvent.count({
      where: {
        type: {
          in: [
            "whatsapp_send_failed",
            "whatsapp_bot_reply_failed",
            "whatsapp_api_key_missing",
            "whatsapp_inbound_without_reply",
            "whatsapp_bot_subscription_inactive",
          ],
        },
        resolved: false,
      },
    }),
    db.systemEvent.count({ where: { type: { in: ["reminder_24h_failed", "reminder_1h_failed"] }, resolved: false } }),
    Promise.all([
      db.whatsappSession.count({ where: { updatedAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
      db.appointment.count({ where: { status: "pending", date: { lt: dayStart } } }),
    ]),
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
    { label: "أخطاء مفتوحة", value: arabicNumber(todayErrors), detail: "أحداث بدرجة خطأ غير معالجة", tone: todayErrors > 0 ? "error" : "success" },
    { label: "غير معالجة", value: arabicNumber(unresolvedErrors), detail: "أخطاء تحتاج مراجعة", tone: unresolvedErrors > 0 ? "warning" : "success" },
    { label: "فشل واتساب", value: arabicNumber(whatsappFailures), detail: "أخطاء مفتوحة", tone: whatsappFailures > 0 ? "error" : "success" },
    { label: "فشل التذكيرات", value: arabicNumber(reminderFailures), detail: "أخطاء مفتوحة", tone: reminderFailures > 0 ? "warning" : "success" },
    { label: "عيادات نشطة", value: arabicNumber(activeClinics), detail: `${arabicNumber(expiringClinics)} تنتهي قريباً`, tone: expiringClinics > 0 ? "warning" : "info" },
  ];

  const serializedEvents = recentEvents.map((event) => ({
    id: event.id,
    clinicId: event.clinicId,
    type: event.type,
    severity: event.severity,
    source: event.source,
    title: event.title,
    message: event.message,
    resolved: event.resolved,
    createdAt: event.createdAt.toISOString(),
    clinic: event.clinic,
  }));

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

      <MonitoringClient
        events={serializedEvents}
        totalEvents={totalEvents}
        maintenanceStats={{
          stuckSessions: maintenanceStats[0],
          oldPendingAppointments: maintenanceStats[1],
        }}
      />
    </div>
  );
}
