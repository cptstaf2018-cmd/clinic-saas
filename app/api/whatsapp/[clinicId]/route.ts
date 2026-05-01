// WasenderAPI Webhook Handler
// Each clinic configures: https://clinicplt.vercel.app/api/whatsapp/[clinicId]
// Payload: { event: "messages.received", data: { messages: { key: { cleanedSenderPn }, messageBody } } }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

const EMOJI_NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

function generateSlots(startTime: string, endTime: string, takenTimes: Date[]): string[] {
  const [startH] = startTime.split(":").map(Number);
  const [endH] = endTime.split(":").map(Number);
  const startMin = startH * 60 + Number(startTime.split(":")[1]);
  const endMin = endH * 60 + Number(endTime.split(":")[1]);

  const takenSet = new Set(
    takenTimes.map((d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`)
  );

  const slots: string[] = [];
  for (let m = startMin; m < endMin && slots.length < 6; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const key = `${h}:${String(min).padStart(2, "0")}`;
    if (!takenSet.has(key)) {
      slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
  }
  return slots;
}

function formatSlot(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "صباحاً" : "مساءً";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(dh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

async function getSlotsMessage(clinicId: string): Promise<{ message: string; slots: string[] }> {
  const today = new Date();
  const wh = await db.workingHours.findUnique({
    where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: today.getDay() } },
  });

  if (!wh?.isOpen) return { message: "عذراً، العيادة مغلقة اليوم 🚫", slots: [] };

  const start = new Date(today); start.setHours(0, 0, 0, 0);
  const end = new Date(today); end.setHours(23, 59, 59, 999);

  const taken = await db.appointment.findMany({
    where: { clinicId, date: { gte: start, lte: end }, status: { not: "cancelled" } },
    select: { date: true },
  });

  const slots = generateSlots(wh.startTime, wh.endTime, taken.map((a: { date: Date }) => a.date));
  if (!slots.length) return { message: "عذراً، لا تتوفر مواعيد متاحة اليوم 😔", slots: [] };

  const lines = slots.map((s, i) => `${EMOJI_NUMBERS[i]} ${formatSlot(s)}`);
  return { message: `اختر الوقت المناسب:\n${lines.join("\n")}`, slots };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const { clinicId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Only handle incoming messages
  const event = body["event"] as string;
  if (event !== "messages.received") {
    return NextResponse.json({ ok: true });
  }

  // Extract message data
  const messages = (body["data"] as Record<string, unknown>)?.["messages"] as Record<string, unknown>;
  if (!messages) return NextResponse.json({ ok: true });

  const key = messages["key"] as Record<string, unknown>;
  const messageBody = (messages["messageBody"] as string ?? "").trim();
  const fromMe = key?.["fromMe"] as boolean;

  if (fromMe || !messageBody) return NextResponse.json({ ok: true });

  // Phone number from cleanedSenderPn
  const rawPhone = (key?.["cleanedSenderPn"] as string ?? "").replace(/\D/g, "");
  const phone = rawPhone.startsWith("964") ? `0${rawPhone.slice(3)}` : rawPhone;

  if (!phone) return NextResponse.json({ ok: true });

  // Load clinic with its API key
  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    include: { subscription: true },
  });

  if (!clinic) return NextResponse.json({ ok: false, error: "Clinic not found" }, { status: 404 });

  const apiKey = clinic.whatsappAccessToken ?? undefined;

  async function reply(msg: string) {
    await sendWhatsApp(phone, msg, apiKey);
  }

  if (!clinic.botEnabled) {
    await reply("عذراً، خدمة البوت معطلة حالياً. تواصل مع العيادة مباشرة.");
    return NextResponse.json({ ok: true });
  }

  const sub = clinic.subscription;
  const isActive = sub && (sub.status === "active" || sub.status === "trial") && sub.expiresAt > new Date();
  if (!isActive) {
    await reply("العيادة غير متاحة حالياً 🔴");
    return NextResponse.json({ ok: true });
  }

  // Session management
  let session = await db.whatsappSession.findUnique({
    where: { clinicId_phone: { clinicId, phone } },
  });

  if (!session || session.step === "done") {
    const patient = await db.patient.findUnique({
      where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      include: {
        appointments: {
          where: { date: { gte: new Date() }, status: { not: "cancelled" } },
          orderBy: { date: "asc" },
          take: 1,
        },
      },
    });

    if (patient) {
      const upcoming = patient.appointments[0];
      if (upcoming) {
        const dateStr = upcoming.date.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
        const timeStr = upcoming.date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "confirm_new" },
          create: { clinicId, phone, step: "confirm_new" },
        });
        await reply(`أهلاً ${patient.name}! 👋\nلديك موعد بتاريخ ${dateStr} الساعة ${timeStr} ✅\nهل تريد حجز موعد جديد؟ أرسل (نعم)`);
      } else {
        const { message, slots } = await getSlotsMessage(clinicId);
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: slots.length ? `awaiting_slot:${slots.join(",")}:${patient.id}` : "done" },
          create: { clinicId, phone, step: slots.length ? `awaiting_slot:${slots.join(",")}:${patient.id}` : "done" },
        });
        await reply(`أهلاً ${patient.name}! 👋\n${message}`);
      }
    } else {
      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: "awaiting_name" },
        create: { clinicId, phone, step: "awaiting_name" },
      });
      const welcome = clinic.whatsappWelcomeMessage || "أهلاً! اكتب اسمك الكريم لتسجيلك في النظام 📝";
      await reply(welcome);
    }
    return NextResponse.json({ ok: true });
  }

  const step = session.step;

  if (step === "awaiting_name") {
    const newPatient = await db.patient.create({ data: { clinicId, name: messageBody, whatsappPhone: phone } });
    const { message, slots } = await getSlotsMessage(clinicId);
    await db.whatsappSession.update({
      where: { id: session.id },
      data: { step: slots.length ? `awaiting_slot:${slots.join(",")}:${newPatient.id}` : "done" },
    });
    await reply(slots.length ? message : `تم تسجيلك ${messageBody}! 🎉\n${message}`);
    return NextResponse.json({ ok: true });
  }

  if (step.startsWith("awaiting_slot:")) {
    const parts = step.split(":");
    const patientId = parts[parts.length - 1];
    const slots = parts.slice(1, parts.length - 1).join(":").split(",");
    const choice = parseInt(messageBody, 10);

    if (isNaN(choice) || choice < 1 || choice > slots.length) {
      await reply(`يرجى إرسال رقم من 1 إلى ${slots.length} لاختيار الموعد.`);
      return NextResponse.json({ ok: true });
    }

    const [h, m] = slots[choice - 1].split(":").map(Number);
    const date = new Date(); date.setHours(h, m, 0, 0);

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const last = await db.appointment.findFirst({
      where: { clinicId, date: { gte: start, lte: end }, queueNumber: { not: null } },
      orderBy: { queueNumber: "desc" },
    });

    await db.appointment.create({
      data: { clinicId, patientId, date, queueNumber: (last?.queueNumber ?? 0) + 1 },
    });
    await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });

    const dateStr = date.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
    await reply(`✅ تم حجز موعدك بنجاح!\nالتاريخ: ${dateStr}\nالوقت: ${timeStr}\nنراك قريباً 🏥`);
    return NextResponse.json({ ok: true });
  }

  if (step === "confirm_new") {
    if (messageBody === "نعم") {
      const patient = await db.patient.findUnique({
        where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      });
      if (patient) {
        const { message, slots } = await getSlotsMessage(clinicId);
        await db.whatsappSession.update({
          where: { id: session.id },
          data: { step: slots.length ? `awaiting_slot:${slots.join(",")}:${patient.id}` : "done" },
        });
        await reply(message);
      }
    } else {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });
      await reply("حسناً، إذا احتجت شيئاً نحن هنا! 😊");
    }
    return NextResponse.json({ ok: true });
  }

  await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });
  await reply("أهلاً! أرسل أي رسالة للبدء.");
  return NextResponse.json({ ok: true });
}
