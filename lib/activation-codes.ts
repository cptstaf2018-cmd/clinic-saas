import { db } from "@/lib/db";
import { PLAN_LABELS, PlanId } from "@/lib/plans";
import { sendWhatsApp } from "@/lib/whatsapp";

function generateActivationCode() {
  return `ACT-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function createPaymentActivationCode({
  paymentId,
  clinicId,
  clinicName,
  whatsappNumber,
  plan,
  days,
  notify = true,
}: {
  paymentId: string;
  clinicId: string;
  clinicName: string;
  whatsappNumber: string;
  plan: PlanId;
  days: number;
  notify?: boolean;
}) {
  const existing = await db.invitationCode.findFirst({
    where: {
      clinicId,
      note: { contains: `PAYMENT:${paymentId}` },
    },
  });
  if (existing) return { code: existing.code, created: false };

  let code = generateActivationCode();
  for (let attempt = 0; attempt < 10; attempt++) {
    const duplicate = await db.invitationCode.findUnique({ where: { code } });
    if (!duplicate) break;
    code = generateActivationCode();
  }

  const record = await db.invitationCode.create({
    data: {
      code,
      clinicId,
      used: true,
      usedAt: new Date(),
      note: `PAYMENT:${paymentId} | ${clinicName} | ${plan} | ${days}d`,
    },
  });

  if (notify) {
    await sendWhatsApp(
      whatsappNumber,
      [
        "تم تأكيد الدفع وتفعيل اشتراك عيادتك.",
        `الباقة: ${PLAN_LABELS[plan]}`,
        `مدة التفعيل: ${days} يوم`,
        `كود التفعيل الخاص بك: ${record.code}`,
      ].join("\n")
    );
  }

  return { code: record.code, created: true };
}
