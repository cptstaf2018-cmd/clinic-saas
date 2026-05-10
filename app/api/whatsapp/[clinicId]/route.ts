// WasenderAPI Webhook Handler
// Each clinic configures: https://clinicplt.vercel.app/api/whatsapp/[clinicId]

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

const EMOJI_NUMBERS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
const MENU_WORDS = ["قائمة", "القائمة", "مساعدة", "help", "menu", "رجوع", "ابدأ", "ابدا", "0"];
const HANDOFF_WORDS = ["موظف", "دعم", "ادمن", "إنسان", "انسان", "تواصل", "مساعدة موظف"];
const WORKING_HOURS_WORDS = ["دوام", "اوقات الدوام", "اوقات", "وقت", "متى تفتح", "متى تغلق"];
const LOCATION_WORDS = ["موقع", "عنوان", "وين", "اين", "خريطة", "لوكيشن"];
const MEDICAL_WORDS = ["الم", "وجع", "علاج", "دواء", "تشخيص", "اعراض", "جرعة", "نزف", "حرارة", "صداع", "وصفة", "مريض"];
const OUT_OF_SCOPE_WORDS = ["طقس", "سياسة", "كرة", "سعر الدولار", "اخبار", "اغنية", "نكتة", "طبخ", "دراسة", "ترجمة"];
const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type BotIntent = "menu" | "book" | "my_appointment" | "change_or_cancel" | "handoff" | "working_hours" | "location" | "unknown";

type BotClinic = {
  name: string;
  address?: string | null;
  locationUrl?: string | null;
  botOutOfScopeMessage?: string | null;
  botMedicalDisclaimer?: string | null;
  botHandoffMessage?: string | null;
  botShowWorkingHours?: boolean | null;
  botShowLocation?: boolean | null;
};

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("964")) return `0${digits.slice(3)}`;
  if (digits.startsWith("07")) return digits;
  return digits;
}

const IRAQ_OFFSET = 3 * 60; // UTC+3 in minutes

function toIraqMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes() + IRAQ_OFFSET;
}

function generateSlots(
  startTime: string,
  endTime: string,
  takenTimes: Date[],
  isToday: boolean,
  nowUtc: Date
): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  // Current Iraq time in minutes (to skip past slots for today)
  const nowIraqMin = isToday
    ? nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes() + IRAQ_OFFSET
    : 0;

  // Taken slots in Iraq local time
  const takenSet = new Set(
    takenTimes.map((d) => {
      const iraqMin = toIraqMinutes(d);
      const h = Math.floor(iraqMin / 60) % 24;
      const m = iraqMin % 60;
      return `${h}:${String(m).padStart(2, "0")}`;
    })
  );

  const slots: string[] = [];
  for (let m = startMin; m < endMin && slots.length < 8; m += 20) {
    if (isToday && m <= nowIraqMin) continue; // skip past slots
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

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

function parseArabicNumber(value: string) {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/\D/g, "");
  return parseInt(normalized, 10);
}

function detectIntent(message: string): BotIntent {
  const text = normalizeText(message);
  if (MENU_WORDS.map(normalizeText).includes(text)) return "menu";
  if (HANDOFF_WORDS.map(normalizeText).some((word) => text === word || text.includes(word))) return "handoff";
  if (["1", "حجز", "احجز", "اريد حجز", "موعد جديد", "حجز موعد"].some((word) => text === normalizeText(word) || text.includes(normalizeText(word)))) return "book";
  if (["2", "موعدي", "موعدي القادم", "عندي موعد", "مواعيدي"].some((word) => text === normalizeText(word) || text.includes(normalizeText(word)))) return "my_appointment";
  if (["3", "الغاء", "الغاء موعد", "تغيير", "تغيير موعد", "تاجيل", "اجل"].some((word) => text === normalizeText(word) || text.includes(normalizeText(word)))) return "change_or_cancel";
  if (text === "4") return "handoff";
  if (text === "5" || WORKING_HOURS_WORDS.map(normalizeText).some((word) => text === word || text.includes(word))) return "working_hours";
  if (text === "6" || LOCATION_WORDS.map(normalizeText).some((word) => text === word || text.includes(word))) return "location";
  return "unknown";
}

function mainMenuMessage(clinic: BotClinic, patientName?: string | null) {
  const greeting = patientName ? `مرحباً ${patientName}` : `مرحباً بك في ${clinic.name}`;
  const options = [
    "1. حجز موعد",
    "2. عرض موعدي القادم",
    "3. تعديل أو إلغاء موعد",
    "4. التحدث مع موظف",
  ];

  if (clinic.botShowWorkingHours !== false) options.push("5. أوقات الدوام");
  if (clinic.botShowLocation && (clinic.address || clinic.locationUrl)) options.push("6. موقع العيادة");

  return `${greeting}\nكيف يمكننا مساعدتك؟\n\n${options.join("\n")}\n\nأرسل رقم الخيار فقط.`;
}

function isMedicalQuestion(message: string) {
  const text = normalizeText(message);
  return MEDICAL_WORDS.map(normalizeText).some((word) => text.includes(word));
}

function isOutOfScope(message: string) {
  const text = normalizeText(message);
  return OUT_OF_SCOPE_WORDS.map(normalizeText).some((word) => text.includes(word));
}

function medicalDisclaimerMessage(clinic: BotClinic) {
  return clinic.botMedicalDisclaimer?.trim() ||
    `أنا مساعد ${clinic.name} للحجز والمتابعة فقط، ولا أستطيع تقديم تشخيص أو وصف علاج عبر الرسائل.\n\nللحجز أرسل 1، أو للتحدث مع موظف العيادة أرسل 4.`;
}

function outOfScopeMessage(clinic: BotClinic) {
  return clinic.botOutOfScopeMessage?.trim() ||
    `أنا مساعد ${clinic.name}، أستطيع مساعدتك في الحجز، موعدك القادم، تعديل الموعد، أوقات الدوام، أو التواصل مع موظف العيادة فقط.\n\nأرسل 0 لعرض القائمة.`;
}

function handoffMessage(clinic: BotClinic) {
  return clinic.botHandoffMessage?.trim() ||
    "تم تحويل طلبك إلى موظف العيادة.\nسنرد عليك قريباً عبر واتساب.\n\nللعودة إلى الخدمات الآلية أرسل 0.";
}

function clinicLocationMessage(clinic: BotClinic) {
  if (!clinic.address && !clinic.locationUrl) {
    return `لم يتم إضافة موقع ${clinic.name} بعد.\nللتواصل مع موظف العيادة أرسل 4.`;
  }

  const lines = [`موقع ${clinic.name}:`];
  if (clinic.address) lines.push(`العنوان: ${clinic.address}`);
  if (clinic.locationUrl) lines.push(`الخريطة: ${clinic.locationUrl}`);
  lines.push("\nللحجز أرسل 1، وللعودة إلى القائمة أرسل 0.");
  return lines.join("\n");
}

async function workingHoursMessage(clinicId: string, clinicName: string) {
  const hours = await db.workingHours.findMany({
    where: { clinicId },
    orderBy: { dayOfWeek: "asc" },
  });

  if (!hours.length) {
    return `لم يتم ضبط أوقات دوام ${clinicName} بعد.\nللتواصل مع موظف العيادة أرسل 4.`;
  }

  const lines = hours.map((day) => {
    const name = DAY_NAMES[day.dayOfWeek] ?? "يوم غير محدد";
    if (!day.isOpen) return `${name}: مغلق`;
    return `${name}: ${formatSlot(day.startTime)} - ${formatSlot(day.endTime)}`;
  });

  return `أوقات دوام ${clinicName}:\n${lines.join("\n")}\n\nللحجز أرسل 1، وللعودة إلى القائمة أرسل 0.`;
}

function formatUpcomingAppointment(clinicName: string, patientName: string, date: Date) {
  const dateStr = date.toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Baghdad" });
  const timeStr = date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baghdad" });
  return `مرحباً ${patientName}\nموعدك القادم في ${clinicName}:\n\n📅 ${dateStr}\n⏰ ${timeStr}\n\nللعودة إلى الخدمات أرسل 0.`;
}

function noUpcomingMessage(patientName?: string | null) {
  const greeting = patientName ? `مرحباً ${patientName}` : "مرحباً";
  return `${greeting}\nلا يوجد لديك موعد قادم حالياً.\n\nللحجز أرسل 1\nوللتحدث مع موظف أرسل 4`;
}

// Looks ahead up to 7 days for the next available day with open slots
async function getNextSlotsMessage(
  clinicId: string
): Promise<{ message: string; slots: string[]; datePrefix: string }> {
  const nowUtc = new Date();
  // Shift to Iraq time (UTC+3) so getUTC* methods return Iraq date/time
  const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;
  const nowIraq = new Date(nowUtc.getTime() + IRAQ_OFFSET_MS);

  for (let daysAhead = 0; daysAhead < 7; daysAhead++) {
    // Iraq calendar date for this iteration
    const iraqTarget = new Date(nowIraq.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const iraqY = iraqTarget.getUTCFullYear();
    const iraqMo = iraqTarget.getUTCMonth();
    const iraqD = iraqTarget.getUTCDate();
    const dayOfWeek = iraqTarget.getUTCDay();

    // UTC window covering this Iraq calendar day (Iraq 00:00 = UTC 21:00 prev day)
    const utcStart = new Date(Date.UTC(iraqY, iraqMo, iraqD, -3, 0, 0, 0));
    const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const wh = await db.workingHours.findUnique({
      where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
    });
    if (!wh?.isOpen) continue;

    const taken = await db.appointment.findMany({
      where: { clinicId, date: { gte: utcStart, lte: utcEnd }, status: { not: "cancelled" } },
      select: { date: true },
    });

    const slots = generateSlots(wh.startTime, wh.endTime, taken.map((a: { date: Date }) => a.date), daysAhead === 0, nowUtc);
    if (!slots.length) continue;

    const isToday = daysAhead === 0;
    const isTomorrow = daysAhead === 1;
    const dayLabel = isToday
      ? "اليوم"
      : isTomorrow
      ? "غداً"
      : iraqTarget.toLocaleDateString("ar-IQ", { weekday: "long", timeZone: "UTC" });

    const dateStr = `${iraqY}-${String(iraqMo + 1).padStart(2, "0")}-${String(iraqD).padStart(2, "0")}`;

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

  const botClinic = clinic;
  const apiKey = clinic.whatsappAccessToken ?? undefined;
  const clinicName = clinic.name;

  async function reply(msg: string) {
    let status = "sent";
    let error: string | null = null;
    try {
      await sendWhatsApp(phone, msg, apiKey, { clinicId, source: "bot_reply" });
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : "فشل إرسال رد البوت";
    }

    await db.incomingMessage.create({
      data: {
        clinicId,
        phone,
        body: msg,
        read: true,
        direction: "outbound",
        status,
        error,
      },
    });
  }

  async function transferToStaff() {
    await db.whatsappSession.upsert({
      where: { clinicId_phone: { clinicId, phone } },
      update: { step: "handoff" },
      create: { clinicId, phone, step: "handoff" },
    });
    await reply(handoffMessage(botClinic));
  }

  async function startBooking(patientId: string, patientName: string, sessionId?: string) {
    const { message, slots, datePrefix } = await getNextSlotsMessage(clinicId);
    const nextStep = slots.length ? `awaiting_slot|${datePrefix}|${slots.join(",")}|${patientId}` : "done";

    if (sessionId) {
      await db.whatsappSession.update({ where: { id: sessionId }, data: { step: nextStep } });
    } else {
      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: nextStep },
        create: { clinicId, phone, step: nextStep },
      });
    }

    if (slots.length) {
      await reply(`${patientName}، هذه أقرب المواعيد المتاحة في ${clinicName}:\n\n${message}\n\nأرسل رقم الوقت المناسب، أو أرسل 0 للرجوع.`);
    } else {
      await reply(`مرحباً ${patientName}\nلا توجد مواعيد متاحة حالياً في ${clinicName}.\nتم تحويل طلبك للعيادة للمتابعة.`);
      await transferToStaff();
    }
  }

  // Save every incoming message regardless of bot state
  await db.incomingMessage.create({
    data: { clinicId, phone, body: messageBody },
  });

  if (!clinic.botEnabled) {
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
  const intent = detectIntent(messageBody);

  if (isMedicalQuestion(messageBody)) {
    await reply(medicalDisclaimerMessage(botClinic));
    return NextResponse.json({ ok: true });
  }

  if (isOutOfScope(messageBody)) {
    await reply(outOfScopeMessage(botClinic));
    return NextResponse.json({ ok: true });
  }

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

    if (intent === "handoff" || intent === "change_or_cancel") {
      await transferToStaff();
      return NextResponse.json({ ok: true });
    }

    if (intent === "working_hours") {
      await reply(await workingHoursMessage(clinicId, clinic.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "location") {
      await reply(clinicLocationMessage(botClinic));
      return NextResponse.json({ ok: true });
    }

    if (patient) {
      if (intent === "book") {
        await startBooking(patient.id, patient.name);
      } else if (intent === "my_appointment") {
        const upcoming = patient.appointments[0];
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "main_menu" },
          create: { clinicId, phone, step: "main_menu" },
        });
        await reply(upcoming ? formatUpcomingAppointment(clinic.name, patient.name, upcoming.date) : noUpcomingMessage(patient.name));
      } else {
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "main_menu" },
          create: { clinicId, phone, step: "main_menu" },
        });
        await reply(mainMenuMessage(botClinic, patient.name));
      }
    } else {
      if (intent === "book") {
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "awaiting_name" },
          create: { clinicId, phone, step: "awaiting_name" },
        });
        await reply(`لحجز موعد في ${clinic.name}، أرسل اسمك الكامل من فضلك.\nمثال: أحمد محمد`);
        return NextResponse.json({ ok: true });
      }

      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: "main_menu" },
        create: { clinicId, phone, step: "main_menu" },
      });
      const customWelcome = clinic.whatsappWelcomeMessage?.trim();
      await reply(customWelcome ? `${customWelcome}\n\n${mainMenuMessage(botClinic)}` : mainMenuMessage(botClinic));
    }
    return NextResponse.json({ ok: true });
  }

  const step = session.step;

  if (step === "handoff") {
    if (intent === "menu") {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "main_menu" } });
      const patient = await db.patient.findUnique({ where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } }, select: { name: true } });
      await reply(mainMenuMessage(botClinic, patient?.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "book") {
      const patient = await db.patient.findUnique({ where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } } });
      if (patient) {
        await startBooking(patient.id, patient.name, session.id);
      } else {
        await db.whatsappSession.update({ where: { id: session.id }, data: { step: "awaiting_name" } });
        await reply(`لحجز موعد في ${clinic.name}، أرسل اسمك الكامل من فضلك.\nمثال: أحمد محمد`);
      }
      return NextResponse.json({ ok: true });
    }

    if (intent === "my_appointment") {
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
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "main_menu" } });
      await reply(patient?.appointments[0] ? formatUpcomingAppointment(clinic.name, patient.name, patient.appointments[0].date) : noUpcomingMessage(patient?.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "working_hours") {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "main_menu" } });
      await reply(await workingHoursMessage(clinicId, clinic.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "location") {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "main_menu" } });
      await reply(clinicLocationMessage(botClinic));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  }

  if (step === "main_menu") {
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

    if (intent === "book") {
      if (!patient) {
        await db.whatsappSession.update({ where: { id: session.id }, data: { step: "awaiting_name" } });
        await reply(`لحجز موعد في ${clinic.name}، أرسل اسمك الكامل من فضلك.\nمثال: أحمد محمد`);
      } else {
        await startBooking(patient.id, patient.name, session.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (intent === "my_appointment") {
      await reply(patient?.appointments[0] ? formatUpcomingAppointment(clinic.name, patient.name, patient.appointments[0].date) : noUpcomingMessage(patient?.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "change_or_cancel" || intent === "handoff") {
      await transferToStaff();
      return NextResponse.json({ ok: true });
    }

    if (intent === "working_hours") {
      await reply(await workingHoursMessage(clinicId, clinic.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "location") {
      await reply(clinicLocationMessage(botClinic));
      return NextResponse.json({ ok: true });
    }

    await reply(outOfScopeMessage(botClinic));
    return NextResponse.json({ ok: true });
  }

  // ── Awaiting patient name ─────────────────────────────────────────────────
  if (step === "awaiting_name") {
    if (intent === "menu") {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "main_menu" } });
      await reply(mainMenuMessage(botClinic));
      return NextResponse.json({ ok: true });
    }

    if (intent === "handoff") {
      await transferToStaff();
      return NextResponse.json({ ok: true });
    }

    const NON_NAME_WORDS = ["حجز", "موعد", "اريد", "أريد", "ابغى", "ابي", "بغيت", "هلا", "مرحبا", "مرحباً", "السلام", "هاي", "hi", "hello", "مساء", "صباح", "طيب", "اهلا", "أهلا", "كيف", "وين", "ايش", "شنو"];
    const normalized = messageBody.trim().toLowerCase();
    const looksLikeName = messageBody.trim().length >= 2 && !NON_NAME_WORDS.some(w => normalized === w || normalized === `أريد ${w}` || normalized.startsWith(`${w} `));

    if (!looksLikeName) {
      await reply(`أرسل *اسمك الكريم فقط* من فضلك 🙏\n✍️ مثال: أحمد محمد`);
      return NextResponse.json({ ok: true });
    }

    const newPatient = await db.patient.upsert({
      where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      update: { name: messageBody.trim() },
      create: { clinicId, name: messageBody.trim(), whatsappPhone: phone },
    });
    await startBooking(newPatient.id, newPatient.name, session.id);
    return NextResponse.json({ ok: true });
  }

  // ── Awaiting slot selection ───────────────────────────────────────────────
  if (step.startsWith("awaiting_slot|")) {
    // format: awaiting_slot|YYYY-MM-DD|HH:mm,HH:mm,...|patientId
    const parts = step.split("|");
    const datePrefix = parts[1]; // YYYY-MM-DD
    const slots = parts[2].split(","); // ["15:00","15:20",...]
    const patientId = parts[3];
    const choice = parseArabicNumber(messageBody);

    if (intent === "menu") {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "main_menu" } });
      const patient = await db.patient.findUnique({ where: { id: patientId }, select: { name: true } });
      await reply(mainMenuMessage(botClinic, patient?.name));
      return NextResponse.json({ ok: true });
    }

    if (intent === "handoff" || intent === "change_or_cancel") {
      await transferToStaff();
      return NextResponse.json({ ok: true });
    }

    // Greeting/restart words → reset session and start fresh
    const RESTART_WORDS = ["مرحبا", "مرحباً", "هلا", "السلام", "اهلا", "أهلا", "hi", "hello", "هاي", "ابدأ", "ابدا"];
    if (RESTART_WORDS.some(w => messageBody.trim().toLowerCase() === w)) {
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });
      const { message, slots: newSlots, datePrefix: newPrefix } = await getNextSlotsMessage(clinicId);
      const patient = await db.patient.findUnique({ where: { id: patientId }, select: { name: true } });
      const nextStep = newSlots.length ? `awaiting_slot|${newPrefix}|${newSlots.join(",")}|${patientId}` : "done";
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: nextStep } });
      await reply(`${patient?.name ? `${patient.name}، ` : ""}${message}\n\nأرسل رقم الوقت المناسب، أو أرسل 0 للرجوع.`);
      return NextResponse.json({ ok: true });
    }

    if (isNaN(choice) || choice < 1 || choice > slots.length) {
      const lines = slots.map((s, i) => `${EMOJI_NUMBERS[i]} ${formatSlot(s)}`);
      await reply(`أرسل رقماً من 1 إلى ${slots.length} لاختيار الموعد:\n${lines.join("\n")}\n\nأو أرسل 0 للرجوع.`);
      return NextResponse.json({ ok: true });
    }

    const [year, month, day] = datePrefix.split("-").map(Number);
    const [h, m] = slots[choice - 1].split(":").map(Number);
    // datePrefix and slots are in Iraq time (UTC+3); convert to UTC for storage
    const date = new Date(Date.UTC(year, month - 1, day, h - 3, m, 0, 0));

    // Iraq day bounds in UTC (Iraq 00:00 = UTC 21:00 prev day)
    const dayStart = new Date(Date.UTC(year, month - 1, day, -3, 0, 0, 0));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const bookedPatient = await db.patient.findUnique({ where: { id: patientId }, select: { name: true } });

    // Atomic check-and-book inside a serializable transaction to prevent double booking
    let slotTaken = false;
    try {
      await db.$transaction(async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: { clinicId, date, status: { not: "cancelled" } },
        });
        if (conflict) { slotTaken = true; return; }

        const last = await tx.appointment.findFirst({
          where: { clinicId, date: { gte: dayStart, lte: dayEnd }, queueNumber: { not: null } },
          orderBy: { queueNumber: "desc" },
        });
        await tx.appointment.create({
          data: { clinicId, patientId, date, queueNumber: (last?.queueNumber ?? 0) + 1 },
        });
      }, { isolationLevel: "Serializable" });
    } catch {
      // Serialization failure = another transaction won — treat as slot taken
      slotTaken = true;
    }

    if (slotTaken) {
      const { message: newMsg, slots: newSlots, datePrefix: newPrefix } = await getNextSlotsMessage(clinicId);
      const nextStep = newSlots.length ? `awaiting_slot|${newPrefix}|${newSlots.join(",")}|${patientId}` : "done";
      await db.whatsappSession.update({ where: { id: session.id }, data: { step: nextStep } });
      await reply(`عذراً، هذا الوقت محجوز للتو. ${newMsg}`);
      return NextResponse.json({ ok: true });
    }

    await db.whatsappSession.update({ where: { id: session.id }, data: { step: "done" } });

    const dateStr = date.toLocaleDateString("ar-IQ", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Baghdad" });
    const timeStr = date.toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baghdad" });
    await reply(`✅ أهلاً ${bookedPatient?.name ?? ""}!\nتم تأكيد حجز موعدك في ${clinic.name}:\n\n📅 ${dateStr}\n⏰ ${timeStr}\n\nنراك قريباً، بالشفاء والعافية 🌟`);
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
