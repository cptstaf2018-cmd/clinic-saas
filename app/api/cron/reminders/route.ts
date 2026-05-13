import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { canUseFeature } from "@/lib/feature-gates";
import { logSystemEvent } from "@/lib/system-events";

export const maxDuration = 60;

const BATCH_SIZE = 50;

type ReminderAppointment = {
  id: string;
  clinicId: string;
  patientId: string;
  date: Date;
  patient: { whatsappPhone: string };
  clinic: { name: string; whatsappAccessToken: string | null };
};

async function processBatch(
  appointments: ReminderAppointment[],
  kind: "24h" | "1h",
  reminderField: "reminder24hSent" | "reminder1hSent"
) {
  const results = await Promise.allSettled(
    appointments.map(async (appt) => {
      const dateStr = new Date(appt.date).toLocaleDateString("ar-IQ", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const timeStr = new Date(appt.date).toLocaleTimeString("ar-IQ", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const message =
        kind === "24h"
          ? `تذكير بموعدك 🔔\nعيادة: ${appt.clinic.name}\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nنراك غداً! 🏥`
          : `موعدك بعد ساعة ⏰\nعيادة: ${appt.clinic.name}\nالوقت: ${timeStr}\nلا تتأخر! 😊`;

      try {
        await sendWhatsApp(
          appt.patient.whatsappPhone,
          message,
          appt.clinic.whatsappAccessToken ?? undefined,
          { clinicId: appt.clinicId, source: "cron_reminders", appointmentId: appt.id }
        );
        await db.appointment.update({
          where: { id: appt.id },
          data: { [reminderField]: true },
        });
        return { ok: true };
      } catch (error) {
        await logSystemEvent({
          clinicId: appt.clinicId,
          type: kind === "24h" ? "reminder_24h_failed" : "reminder_1h_failed",
          severity: "error",
          source: "cron_reminders",
          title: kind === "24h" ? "فشل تذكير موعد قبل 24 ساعة" : "فشل تذكير موعد قبل ساعة",
          message: error instanceof Error ? error.message : "Unknown reminder error",
          metadata: { appointmentId: appt.id, patientId: appt.patientId },
        });
        return { ok: false };
      }
    })
  );

  return results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const activeSubscriptions = await db.subscription.findMany({
    where: { status: { in: ["active", "trial"] } },
    select: { clinicId: true, plan: true },
  });

  const clinicIds = activeSubscriptions
    .filter((s) => canUseFeature(s.plan, "autoReminders"))
    .map((s) => s.clinicId);

  if (clinicIds.length === 0) {
    return NextResponse.json({ sent24h: 0, sent1h: 0, message: "no eligible clinics" });
  }

  let sent24h = 0;
  let sent1h = 0;
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  // 24h reminders — paginated by id
  let cursor: string | undefined = undefined;
  while (true) {
    const batch: ReminderAppointment[] = await db.appointment.findMany({
      where: {
        clinicId: { in: clinicIds },
        status: { in: ["pending", "confirmed"] },
        reminder24hSent: false,
        date: { gte: now, lte: in24h },
      },
      include: {
        patient: { select: { whatsappPhone: true } },
        clinic: { select: { name: true, whatsappAccessToken: true } },
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (batch.length === 0) break;
    sent24h += await processBatch(batch, "24h", "reminder24hSent");
    cursor = batch[batch.length - 1].id;
    if (batch.length < BATCH_SIZE) break;
  }

  // 1h reminders — paginated by id
  cursor = undefined;
  while (true) {
    const batch: ReminderAppointment[] = await db.appointment.findMany({
      where: {
        clinicId: { in: clinicIds },
        status: { in: ["pending", "confirmed"] },
        reminder1hSent: false,
        date: { gte: now, lte: in1h },
      },
      include: {
        patient: { select: { whatsappPhone: true } },
        clinic: { select: { name: true, whatsappAccessToken: true } },
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (batch.length === 0) break;
    sent1h += await processBatch(batch, "1h", "reminder1hSent");
    cursor = batch[batch.length - 1].id;
    if (batch.length < BATCH_SIZE) break;
  }

  return NextResponse.json({ sent24h, sent1h, clinics: clinicIds.length });
}
