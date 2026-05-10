import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { canUseFeature } from "@/lib/feature-gates";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const activeSubscriptions = await db.subscription.findMany({
    where: {
      status: { in: ["active", "trial"] },
    },
    select: { clinicId: true, plan: true },
  });

  const clinicIds = activeSubscriptions
    .filter((subscription) => canUseFeature(subscription.plan, "autoReminders"))
    .map((subscription) => subscription.clinicId);

  // 24h reminders
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const appointments24h = await db.appointment.findMany({
    where: {
      clinicId: { in: clinicIds },
      status: { in: ["pending", "confirmed"] },
      reminder24hSent: false,
      date: { gte: now, lte: in24h },
    },
    include: { patient: true, clinic: { select: { name: true, whatsappAccessToken: true } } },
  });

  for (const appt of appointments24h) {
    const dateStr = new Date(appt.date).toLocaleDateString("ar-IQ", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeStr = new Date(appt.date).toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendWhatsApp(
      appt.patient.whatsappPhone,
      `تذكير بموعدك 🔔\nعيادة: ${appt.clinic.name}\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nنراك غداً! 🏥`,
      appt.clinic.whatsappAccessToken ?? undefined
    );

    await db.appointment.update({
      where: { id: appt.id },
      data: { reminder24hSent: true },
    });
  }

  // 1h reminders
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  const appointments1h = await db.appointment.findMany({
    where: {
      clinicId: { in: clinicIds },
      status: { in: ["pending", "confirmed"] },
      reminder1hSent: false,
      date: { gte: now, lte: in1h },
    },
    include: { patient: true, clinic: { select: { name: true, whatsappAccessToken: true } } },
  });

  for (const appt of appointments1h) {
    const timeStr = new Date(appt.date).toLocaleTimeString("ar-IQ", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendWhatsApp(
      appt.patient.whatsappPhone,
      `موعدك بعد ساعة ⏰\nعيادة: ${appt.clinic.name}\nالوقت: ${timeStr}\nلا تتأخر! 😊`,
      appt.clinic.whatsappAccessToken ?? undefined
    );

    await db.appointment.update({
      where: { id: appt.id },
      data: { reminder1hSent: true },
    });
  }

  return NextResponse.json({
    sent24h: appointments24h.length,
    sent1h: appointments1h.length,
  });
}
