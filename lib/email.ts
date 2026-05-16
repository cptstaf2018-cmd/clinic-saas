import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBackupEmail({
  to,
  clinicName,
  month,
  csvContent,
  stats,
}: {
  to: string;
  clinicName: string;
  month: string;
  csvContent: string;
  stats: { patients: number; appointments: number; records: number };
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping backup email");
    return;
  }

  const fileName = `backup-${clinicName.replace(/\s+/g, "-")}-${month}.csv`;

  await resend.emails.send({
    from: "عيادتي <backup@clinic-ai-pro.com>",
    to,
    subject: `📦 نسخة احتياطية — ${clinicName} — ${month}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b;">📦 نسخة احتياطية شهرية</h2>
        <p style="color: #475569;">مرحباً، هذه نسختك الاحتياطية الشهرية لبيانات <strong>${clinicName}</strong>.</p>
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #334155;">👥 المرضى: <strong>${stats.patients}</strong></p>
          <p style="margin: 4px 0; color: #334155;">📅 المواعيد: <strong>${stats.appointments}</strong></p>
          <p style="margin: 4px 0; color: #334155;">📋 السجلات الطبية: <strong>${stats.records}</strong></p>
        </div>
        <p style="color: #64748b; font-size: 14px;">الملف المرفق يحتوي على كل بيانات العيادة بصيغة CSV يمكن فتحها بـ Excel.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">نظام عيادتي — النسخة الاحتياطية تُرسل تلقائياً كل أول الشهر.</p>
      </div>
    `,
    attachments: [
      {
        filename: fileName,
        content: Buffer.from(csvContent, "utf-8"),
      },
    ],
  });
}
