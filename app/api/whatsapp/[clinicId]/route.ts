// WasenderAPI Webhook Handler
// Each clinic configures: https://clinicplt.vercel.app/api/whatsapp/[clinicId]

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

const EMOJI_NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("964")) return `0${digits.slice(3)}`;
  if (digits.startsWith("07")) return digits;
  return digits;
}

function generateSlots(startTime: string, endTime: string, takenTimes: Date[]): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

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

// Looks ahead up to 7 days for the next available day with open slots
async function getNextSlotsMessage(
  clinicId: string
): Promise<{ message: string; slots: string[]; datePrefix: string }> {
  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(0, 0, 0, 0);

    const wh = await db.workingHours.findUnique({
      where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: target.getDay() } },
    });
    if (!wh?.isOpen) continue;

    const dayEnd = new Date(target);
    dayEnd.setHours(23, 59, 59, 999);

    const taken = await db.appointment.findMany({
      where: { clinicId, date: { gte: target, lte: dayEnd }, status: { not: "cancelled" } },
      select: { date: true },
    });

    const slots = generateSlots(wh.startTime, wh.endTime, taken.map((a: { date: Date }) => a.date));
    if (!slots.length) continue;

    const isToday = daysAhead === 0;
    const isTomorrow = daysAhead === 1;
    const dayLabel = isToday
      ? "اليوم"
      : isTomorrow
      ? "غداً"
      : target.toLocaleDateString("ar-IQ", { weekday: "long" });

    const dateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;

    const lines = slots.map((s, i) => `${EMOJI_NUMBERS[i]} ${formatSlot(s)}`);
    return {
      message: `المواعيد المتاحة ${dayLabel}:\n${lines.join("\n")}`,
      slots,
      datePrefix: dateStr,
    };
  }

  return {
    message: "عذراً، لا تتوفر مواعيد متاحة خلال الأسبوع القادم 😔",
    slots: [],
    datePrefix: "",
  };
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

  const event = body["event"] as string;
  if (event !== "messages.received") {
    return NextResponse.json({ ok: true });
  }

  const messages = (body["data"] as Record<string, unknown>)?.["messages"] as Record<string, unknown>;
  if (!messages) return NextResponse.json({ ok: true });

  const key = messages["key"] as Record<string, unknown>;
  const messageBody = (messages["messageBody"] as string ?? "").trim();
  const fromMe = key?.["fromMe"] as boolean;

  if (fromMe || !messageBody) return NextResponse.json({ ok: true });

  const phone = normalizePhone(key?.["cleanedSenderPn"] as string ?? "");
  if (!phone || phone.length < 7) return NextResponse.json({ ok: true });

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

  const session = await db.whatsappSession.findUnique({
    where: { clinicId_phone: { clinicId, phone } },
  });

  // ── No active session → start conversation ────────────────────────────────
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
        const dateStr = upcoming.date.toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const timeStr = upcoming.date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "confirm_new" },
          create: { clinicId, phone, step: "confirm_new" },
        });
        await reply(`أهلاً ${patient.name}! 👋\nلديك موعد ${dateStr} الساعة ${timeStr} ✅\nهل تريد حجز موعد جديد؟ (نعم / لا)`);
      } else {
        const { message, slots, datePrefix } = await getNextSlotsMessage(clinicId);
        const step = slots.length ? `awaiting_slot|${datePrefix}|${slots.join(",")}|${patient.id}` : "done";
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step },
          create: { clinicId, phone, step },
        });
        await reply(`أهلاً ${patient.name}! 👋\n${message}`);
      }
    } else {
      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: "awaiting_name" },
        create: { clinicId, phone, step: "awaiting_name" },
      });
      const welcome = clinic.whatsappWelcomeMessage || "أهلاً بك! 👋\nاكتب اسمك الكريم لتسجيلك في النظام 📝";
      await reply(welcome);
    }
    return NextResponse.json({ ok: true });
  }

  const step = session.step;

  // ── Awaiting patient name ─────────────────────────────────────────────────
  if (step === "awaiting_name") {
    const newPatient = await db.patient.upsert({
      where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      update: { name: messageBody },
      create: { clinicId, name: messageBody, whatsappPhone: phone },
    });
    const { message, slots, datePrefix } = await getNextSlotsMessage(clinicId);
    const nextStep = slots.length ? `awaiting_slot|${datePrefix}|${slots.join(",")}|${newPatient.id}` : "done";
    await db.whatsappSession.update({
      where: { id: session.id },
      data: { step: nextStep },
    });
    if (slots.length) {
      await reply(`تم تسجيلك ${messageBody}! 🎉\n${message}`);
    } else {
      await reply(`تم تسجيلك ${messageBody}! 🎉\nعذراً، لا تتوفر مواعيد حالياً. سنعلمك عند توفر مواعيد جديدة.`);
    }
    return NextResponse.json({ ok: true });
  }

  // ── Awaiting slot selection ───────────────────────────────────────────────
  if (step.startsWith("awaiting_slot|")) {
    // format: awaiting_slot|YYYY-MM-DD|HH:mm,HH:mm,...|patientId
    const parts = step.split("|");
    const datePrefix = parts[1]; // YYYY-MM-DD
    const slots = parts[2].split(","); // ["09:00","09:30",...]
    const patientId = parts[3];
    const choice = parseInt(messageBody, 10);

    if (isNaN(choice) || choice < 1 || choice > slots.length) {
      const lines = slots.map((s, i) => `${EMOJI_NUMBERS[i]} ${formatSlot(s)}`);
      await reply(`يرجى إرسال رقم من 1 إلى ${slots.length} لاختيار الموعد:\n${lines.join("\n")}`);
      return NextResponse.json({ ok: true });
    }

    const [year, month, day] = datePrefix.split("-").map(Number);
    const [h, m] = slots[choice - 1].split(":").map(Number);
    const date = new Date(year, month - 1, day, h, m, 0, 0);

    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
    const last = await db.appointment.findFirst({
      where: { clinicId, date: { gte: dayStart, lte: dayEnd }, queueNumber: { not: null } },
      orderBy: { queueNumber: "desc" },
    });

    // Check if slot is still available (race condition guard)
    const conflict = await db.appointment.findFirst({
      where: { clinicId, date, status: { not: "cancelled" } },
    });
    if (conflict) {
      const { message: newMsg, slots: newSlots, datePrefix: newPrefix } = await getNextSlotsMessage(clinicId);
      const nextStep = newSlots.length ? `awaiting_slot|${newPrefix}|${newSlots.join(",")}|${patientId}` : "done";
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: nextStep } });
      await reply(`عذراً، هذا الوقت محجوز. ${newMsg}`);
      return NextResponse.json({ ok: true });
    }

    await db.appointment.create({
      data: { clinicId, patientId, date, queueNumber: (last?.queueNumber ?? 0) + 1 },
    });
    await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });

    const dateStr = date.toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit" });
    await reply(`✅ تم حجز موعدك بنجاح!\n📅 ${dateStr}\n⏰ ${timeStr}\nنراك قريباً 🏥`);
    return NextResponse.json({ ok: true });
  }

  // ── Confirm new booking ───────────────────────────────────────────────────
  if (step === "confirm_new") {
    const normalized = messageBody.toLowerCase().trim();
    if (normalized === "نعم" || normalized === "yes" || normalized === "1") {
      const patient = await db.patient.findUnique({
        where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      });
      if (patient) {
        const { message, slots, datePrefix } = await getNextSlotsMessage(clinicId);
        const nextStep = slots.length ? `awaiting_slot|${datePrefix}|${slots.join(",")}|${patient.id}` : "done";
        await db.whatsappSession.update({ where: { id: session.id }, data: { step: nextStep } });
        await reply(message);
      }
    } else {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });
      await reply("حسناً، إذا احتجت شيئاً نحن هنا! 😊");
    }
    return NextResponse.json({ ok: true });
  }

  // ── Unknown step → reset ──────────────────────────────────────────────────
  await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });
  await reply("أهلاً! أرسل أي رسالة للبدء من جديد.");
  return NextResponse.json({ ok: true });
}
