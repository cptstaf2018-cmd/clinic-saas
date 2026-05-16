import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBackupEmail } from "@/lib/email";
import { canUseFeature } from "@/lib/feature-gates";

export const maxDuration = 60;

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h] ?? "";
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
      }).join(",")
    ),
  ];
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinics = await db.clinic.findMany({
    where: { backupEmail: { not: null } },
    select: { id: true, name: true, backupEmail: true, subscription: { select: { plan: true, status: true } } },
  });

  const eligibleClinics = clinics.filter((c) =>
    canUseFeature(c.subscription?.plan, "backupRestore")
  );

  if (eligibleClinics.length === 0) {
    return NextResponse.json({ sent: 0, message: "no eligible clinics" });
  }

  const month = new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long" });
  let sent = 0;

  for (const clinic of eligibleClinics) {
    try {
      const [patients, appointments, records] = await Promise.all([
        db.patient.findMany({ where: { clinicId: clinic.id }, select: { name: true, whatsappPhone: true, createdAt: true } }),
        db.appointment.findMany({ where: { clinicId: clinic.id }, select: { date: true, status: true }, orderBy: { date: "desc" }, take: 1000 }),
        db.medicalRecord.findMany({ where: { clinicId: clinic.id }, select: { date: true, complaint: true, diagnosis: true, prescription: true }, orderBy: { date: "desc" }, take: 1000 }),
      ]);

      // بناء CSV موحد بثلاثة أقسام
      const sections = [
        "=== المرضى ===",
        toCSV(patients.map((p) => ({ الاسم: p.name, الهاتف: p.whatsappPhone, تاريخ_التسجيل: p.createdAt.toISOString().slice(0, 10) }))),
        "",
        "=== المواعيد ===",
        toCSV(appointments.map((a) => ({ التاريخ: new Date(a.date).toISOString().slice(0, 10), الحالة: a.status }))),
        "",
        "=== السجلات الطبية ===",
        toCSV(records.map((r) => ({ التاريخ: new Date(r.date).toISOString().slice(0, 10), الشكوى: r.complaint, التشخيص: r.diagnosis ?? "", الوصفة: r.prescription ?? "" }))),
      ].join("\n");

      await sendBackupEmail({
        to: clinic.backupEmail!,
        clinicName: clinic.name,
        month,
        csvContent: sections,
        stats: { patients: patients.length, appointments: appointments.length, records: records.length },
      });

      sent++;
    } catch (err) {
      console.error(`[Backup] Failed for clinic ${clinic.id}:`, err);
    }
  }

  // ── تنظيف شهري تلقائي بعد إرسال النسخ الاحتياطية ──────────────────────
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [deletedAppointments, deletedMessages, deletedEvents, deletedOtp] = await Promise.all([
    // المواعيد المكتملة أو الملغاة من الشهر الماضي
    db.appointment.deleteMany({
      where: {
        status: { in: ["completed", "cancelled"] },
        date: { lt: oneMonthAgo },
      },
    }),
    // رسائل الواتساب أقدم من شهر
    db.incomingMessage.deleteMany({
      where: { createdAt: { lt: oneMonthAgo } },
    }),
    // أحداث النظام المحلولة أقدم من شهر
    db.systemEvent.deleteMany({
      where: {
        resolved: true,
        createdAt: { lt: oneMonthAgo },
      },
    }),
    // OTP codes المنتهية الصلاحية
    db.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
  ]);

  await db.systemEvent.create({
    data: {
      type: "monthly_cleanup_completed",
      severity: "success",
      source: "cron_backup",
      title: "تنظيف شهري اكتمل",
      message: `حُذف: ${deletedAppointments.count} موعد، ${deletedMessages.count} رسالة واتساب، ${deletedEvents.count} حدث نظام، ${deletedOtp.count} OTP منتهي.`,
      metadata: {
        deletedAppointments: deletedAppointments.count,
        deletedMessages: deletedMessages.count,
        deletedEvents: deletedEvents.count,
        deletedOtp: deletedOtp.count,
      },
    },
  });

  return NextResponse.json({
    sent,
    total: eligibleClinics.length,
    cleanup: {
      appointments: deletedAppointments.count,
      messages: deletedMessages.count,
      systemEvents: deletedEvents.count,
      otpCodes: deletedOtp.count,
    },
  });
}
