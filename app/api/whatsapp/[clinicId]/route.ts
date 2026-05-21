// WhatsApp Bot — Simple & Direct
// States: awaiting_name | awaiting_slot|DATE|SLOTS|PATIENT_ID | done
//
// Returning patient (phone in DB):
//   any message → slots immediately (no menus, no questions)
//
// New patient (first contact):
//   any message → ask name once → slots

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { logSystemEvent } from "@/lib/system-events";

// ── Constants ──────────────────────────────────────────────────────────────────
const EMOJI = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];
const DAY_NAMES = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;

// Keywords that trigger special actions regardless of state
const HANDOFF_KW   = ["موظف","دعم","ادمن","إنسان","انسان","تواصل","الغاء","الغاء موعد","تغيير موعد"];
const HOURS_KW     = ["دوام","اوقات","متى تفتح","متى تغلق","ساعات العمل"];
const LOCATION_KW  = ["موقع","عنوان","مكان","وين","اين","خريطة","لوكيشن","google","maps"];
const APPT_KW      = ["موعدي","موعدي القادم","عندي موعد","مواعيدي","حجزي"];
const MEDICAL_KW   = ["الم","وجع","علاج","دواء","تشخيص","اعراض","جرعة","نزف","حرارة","صداع","وصفة"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function verifySignature(received: string | null, expected: string | null): boolean {
  if (!received || !expected) return false;
  const r = Buffer.from(received), e = Buffer.from(expected);
  if (r.length !== e.length) return false;
  return timingSafeEqual(r, e);
}

/** Normalizes Iraqi phone to 07XXXXXXXXX format */
function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("964")) return `0${d.slice(3)}`;
  if (d.startsWith("07"))  return d;
  return d;
}

/** Converts Arabic/Farsi/Western digits and returns an integer */
function parseNum(text: string): number {
  const s = text.trim()
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");
  return parseInt(s, 10);
}

function norm(text: string): string {
  return text.trim().toLowerCase()
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");
}

function contains(text: string, words: string[]): boolean {
  const t = norm(text);
  return words.some(w => t === norm(w) || t.includes(norm(w)));
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "صباحاً" : "مساءً";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(dh).padStart(2,"0")}:${String(m).padStart(2,"0")} ${period}`;
}

// ── Find patient — tries 07... and 964... formats ──────────────────────────────
async function findPatient(clinicId: string, phone: string) {
  const alt = phone.startsWith("07")
    ? `964${phone.slice(1)}`
    : phone.startsWith("964") ? `0${phone.slice(3)}` : null;

  return db.patient.findFirst({
    where: {
      clinicId,
      whatsappPhone: { in: [phone, ...(alt ? [alt] : [])] },
    },
    include: {
      appointments: {
        where: { date: { gte: new Date() }, status: { not: "cancelled" } },
        orderBy: { date: "asc" },
        take: 1,
      },
    },
  });
}

// ── Slot generation ────────────────────────────────────────────────────────────
function generateSlots(startTime: string, endTime: string, taken: Date[], isToday: boolean, nowUtc: Date): string[] {
  const toMin = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const iraqMin = (d: Date) => (d.getUTCHours()*60 + d.getUTCMinutes() + 3*60);

  const start = toMin(startTime), end = toMin(endTime);
  const nowMin = isToday ? iraqMin(nowUtc) : 0;
  const takenSet = new Set(taken.map(d => {
    const im = iraqMin(d); const h = Math.floor(im/60)%24; const m = im%60;
    return `${h}:${String(m).padStart(2,"0")}`;
  }));

  const slots: string[] = [];
  for (let m = start; m < end && slots.length < 8; m += 20) {
    if (isToday && m <= nowMin) continue;
    const h = Math.floor(m/60), min = m%60;
    const key = `${h}:${String(min).padStart(2,"0")}`;
    if (!takenSet.has(key)) slots.push(`${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`);
  }
  return slots;
}

// ── Next available slots (looks up to 7 days ahead) ───────────────────────────
async function getSlots(clinicId: string): Promise<{ msg: string; slots: string[]; date: string }> {
  const nowUtc  = new Date();
  const nowIraq = new Date(nowUtc.getTime() + IRAQ_OFFSET_MS);

  for (let ahead = 0; ahead < 7; ahead++) {
    const target = new Date(nowIraq.getTime() + ahead * 86400000);
    const Y = target.getUTCFullYear(), Mo = target.getUTCMonth(), D = target.getUTCDate();
    const dow = target.getUTCDay();

    const wh = await db.workingHours.findUnique({ where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: dow } } });
    if (!wh?.isOpen) continue;

    const utcStart = new Date(Date.UTC(Y, Mo, D, -3, 0, 0));
    const utcEnd   = new Date(utcStart.getTime() + 86400000 - 1);
    const taken = await db.appointment.findMany({
      where: { clinicId, date: { gte: utcStart, lte: utcEnd }, status: { not: "cancelled" } },
      select: { date: true },
    });

    const slots = generateSlots(wh.startTime, wh.endTime, taken.map(a => a.date), ahead === 0, nowUtc);
    if (!slots.length) continue;

    const label = ahead === 0 ? "اليوم" : ahead === 1 ? "غداً"
      : target.toLocaleDateString("ar-IQ", { weekday: "long", timeZone: "UTC" });

    return {
      msg: `المواعيد المتاحة ${label}:\n${slots.map((s,i) => `${EMOJI[i]} ${formatTime(s)}`).join("\n")}`,
      slots,
      date: `${Y}-${String(Mo+1).padStart(2,"0")}-${String(D).padStart(2,"0")}`,
    };
  }
  return { msg: "لا تتوفر مواعيد خلال الأسبوع القادم 😔", slots: [], date: "" };
}

// ── Working hours message ──────────────────────────────────────────────────────
async function hoursMsg(clinicId: string, clinicName: string): Promise<string> {
  const rows = await db.workingHours.findMany({ where: { clinicId }, orderBy: { dayOfWeek: "asc" } });
  if (!rows.length) return `لم تُضبط أوقات دوام ${clinicName} بعد.`;
  const lines = rows.map(r => r.isOpen ? `${DAY_NAMES[r.dayOfWeek]}: ${formatTime(r.startTime)} - ${formatTime(r.endTime)}` : `${DAY_NAMES[r.dayOfWeek]}: مغلق`);
  return `أوقات دوام ${clinicName}:\n${lines.join("\n")}`;
}

// ── Location message ───────────────────────────────────────────────────────────
function locationMsg(name: string, address?: string|null, url?: string|null): string {
  if (!address && !url) return `لم يتم إضافة موقع ${name} بعد.`;
  const lines = [`موقع ${name}`];
  if (address) lines.push(`العنوان: ${address}`);
  if (url) lines.push(/^https?:\/\//.test(url.trim()) ? `رابط الخريطة:\n${url.trim()}` : url.trim());
  return lines.join("\n");
}

// ── Upcoming appointment message ───────────────────────────────────────────────
function upcomingMsg(clinicName: string, patientName: string, date: Date): string {
  const d = date.toLocaleDateString("ar-IQ", { weekday:"long", year:"numeric", month:"long", day:"numeric", timeZone:"Asia/Baghdad" });
  const t = date.toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Baghdad" });
  return `${patientName}، موعدك في ${clinicName}:\n📅 ${d}\n⏰ ${t}`;
}

// ── Handoff message ────────────────────────────────────────────────────────────
function handoffMsg(custom?: string|null): string {
  return custom?.trim() || "تم تحويل طلبك لموظف العيادة.\nسنرد عليك قريباً.";
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest, { params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  if (body["event"] !== "messages.received") return NextResponse.json({ ok: true });

  const messages = (body["data"] as Record<string,unknown>)?.["messages"] as Record<string,unknown>;
  if (!messages) return NextResponse.json({ ok: true });

  const key         = messages["key"] as Record<string,unknown>;
  const msgBody     = ((messages["messageBody"] as string) ?? "").trim();
  const fromMe      = key?.["fromMe"] as boolean;

  if (fromMe || !msgBody) return NextResponse.json({ ok: true });

  const phone = normalizePhone(key?.["cleanedSenderPn"] as string ?? "");
  if (!phone || phone.length < 7) return NextResponse.json({ ok: true });

  // ── Load clinic ──────────────────────────────────────────────────────────────
  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, include: { subscription: true } });
  if (!clinic) return NextResponse.json({ ok: false }, { status: 404 });

  // ── Verify webhook signature ─────────────────────────────────────────────────
  if (clinic.whatsappWebhookSecret) {
    if (!verifySignature(req.headers.get("x-webhook-signature"), clinic.whatsappWebhookSecret)) {
      await logSystemEvent({ clinicId, type:"whatsapp_webhook_unauthorized", severity:"warning", source:"whatsapp_bot",
        title:"توقيع webhook غير صحيح", message:"وصل طلب بتوقيع غير صحيح.", metadata:{ phone } });
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  // ── Save inbound message ─────────────────────────────────────────────────────
  await db.incomingMessage.create({ data: { clinicId, phone, body: msgBody } });

  // ── Bot disabled ─────────────────────────────────────────────────────────────
  if (!clinic.botEnabled) return NextResponse.json({ ok: true });

  // ── Subscription check ───────────────────────────────────────────────────────
  const sub = clinic.subscription;
  const active = sub && (sub.status === "active" || sub.status === "trial") && sub.expiresAt > new Date();
  if (!active) {
    await send(phone, "العيادة غير متاحة حالياً 🔴", clinic.whatsappAccessToken, clinicId);
    return NextResponse.json({ ok: true });
  }

  // ── Helper: send + log ───────────────────────────────────────────────────────
  async function reply(msg: string) {
    let status = "sent", error: string|null = null;
    try { await send(phone, msg, clinic!.whatsappAccessToken, clinicId); }
    catch (e) { status = "failed"; error = e instanceof Error ? e.message : "فشل الإرسال"; }
    await db.incomingMessage.create({ data: { clinicId, phone, body: msg, read: true, direction: "outbound", status, error } });
  }

  // ── Global keywords (work in any state) ─────────────────────────────────────
  if (contains(msgBody, HANDOFF_KW)) {
    await db.whatsappSession.upsert({
      where: { clinicId_phone: { clinicId, phone } },
      update: { step: "handoff" }, create: { clinicId, phone, step: "handoff" },
    });
    await reply(handoffMsg(clinic.botHandoffMessage));
    return NextResponse.json({ ok: true });
  }

  if (contains(msgBody, MEDICAL_KW)) {
    const msg = clinic.botMedicalDisclaimer?.trim() ||
      `أنا مساعد ${clinic.name} للحجز فقط، لا أستطيع تقديم تشخيص طبي.\nللحجز أرسل أي رسالة.`;
    await reply(msg);
    return NextResponse.json({ ok: true });
  }

  if (contains(msgBody, HOURS_KW)) {
    await reply(await hoursMsg(clinicId, clinic.name));
    return NextResponse.json({ ok: true });
  }

  if (contains(msgBody, LOCATION_KW) && clinic.botShowLocation) {
    await reply(locationMsg(clinic.name, clinic.address, clinic.locationUrl));
    return NextResponse.json({ ok: true });
  }

  // ── Load session + patient ───────────────────────────────────────────────────
  const session = await db.whatsappSession.findUnique({ where: { clinicId_phone: { clinicId, phone } } });
  const patient = await findPatient(clinicId, phone);

  const step = session?.step ?? "done";

  // ══════════════════════════════════════════════════════════════════════════════
  // STATE: awaiting_slot — patient is choosing a time slot
  // ══════════════════════════════════════════════════════════════════════════════
  if (step.startsWith("awaiting_slot|")) {
    const [, dateStr, slotsRaw, patientId] = step.split("|");
    const slots  = slotsRaw.split(",");
    const choice = parseNum(msgBody);

    // "0" or back keyword → go back to slot list refresh
    if (msgBody.trim() === "0" || norm(msgBody) === norm("رجوع")) {
      const r = await getSlots(clinicId);
      if (r.slots.length) {
        const nextStep = `awaiting_slot|${r.date}|${r.slots.join(",")}|${patientId}`;
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: nextStep }, create: { clinicId, phone, step: nextStep },
        });
        await reply(`${r.msg}\n\nأرسل رقم الوقت للحجز.`);
      } else {
        await reply(r.msg);
      }
      return NextResponse.json({ ok: true });
    }

    // Valid slot number → book it
    if (!isNaN(choice) && choice >= 1 && choice <= slots.length) {
      const [Y, Mo, D] = dateStr.split("-").map(Number);
      const [h, m]     = slots[choice - 1].split(":").map(Number);
      const date       = new Date(Date.UTC(Y, Mo-1, D, h-3, m, 0, 0));
      const dayStart   = new Date(Date.UTC(Y, Mo-1, D, -3, 0, 0, 0));
      const dayEnd     = new Date(dayStart.getTime() + 86400000 - 1);

      const pName = patient?.name ?? (await db.patient.findUnique({ where: { id: patientId }, select: { name: true } }))?.name ?? "";

      let slotTaken = false;
      try {
        await db.$transaction(async tx => {
          const conflict = await tx.appointment.findFirst({ where: { clinicId, date, status: { not: "cancelled" } } });
          if (conflict) { slotTaken = true; return; }
          const last = await tx.appointment.findFirst({
            where: { clinicId, date: { gte: dayStart, lte: dayEnd }, queueNumber: { not: null } },
            orderBy: { queueNumber: "desc" },
          });
          await tx.appointment.create({ data: { clinicId, patientId, date, queueNumber: (last?.queueNumber ?? 0) + 1 } });
        }, { isolationLevel: "Serializable" });
      } catch { slotTaken = true; }

      if (slotTaken) {
        const r = await getSlots(clinicId);
        if (r.slots.length) {
          const nextStep = `awaiting_slot|${r.date}|${r.slots.join(",")}|${patientId}`;
          await db.whatsappSession.upsert({
            where: { clinicId_phone: { clinicId, phone } },
            update: { step: nextStep }, create: { clinicId, phone, step: nextStep },
          });
          await reply(`هذا الوقت محجوز للتو، إليك الأوقات المتاحة:\n${r.msg}\n\nأرسل رقم الوقت.`);
        } else {
          await reply("لا تتوفر مواعيد حالياً.");
        }
        return NextResponse.json({ ok: true });
      }

      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: "done" }, create: { clinicId, phone, step: "done" },
      });
      const dStr = date.toLocaleDateString("ar-IQ", { weekday:"long", year:"numeric", month:"long", day:"numeric", timeZone:"Asia/Baghdad" });
      const tStr = date.toLocaleTimeString("ar-IQ", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Baghdad" });
      await reply(`✅ تم حجز موعدك ${pName ? `يا ${pName}` : ""} في ${clinic.name}\n📅 ${dStr}\n⏰ ${tStr}`);
      return NextResponse.json({ ok: true });
    }

    // Not a valid number — remind
    await reply(`أرسل رقماً من 1 إلى ${slots.length}:\n${slots.map((s,i) => `${EMOJI[i]} ${formatTime(s)}`).join("\n")}`);
    return NextResponse.json({ ok: true });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STATE: awaiting_name — collecting name for a new patient
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === "awaiting_name") {
    // If patient already exists (race condition or re-registered via dashboard)
    if (patient) {
      await showSlots(patient.id, patient.name);
      return NextResponse.json({ ok: true });
    }

    // Reject non-name inputs
    const NON_NAME = ["حجز","موعد","اريد","أريد","ابغى","هلا","مرحبا","السلام","هاي","hi","hello","كيف","وين","شنو"];
    if (msgBody.trim().length < 2 || contains(msgBody, NON_NAME)) {
      await reply(`أرسل اسمك الكريم فقط 🙏\nمثال: أحمد محمد`);
      return NextResponse.json({ ok: true });
    }

    const newPatient = await db.patient.upsert({
      where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: phone } },
      update: { name: msgBody.trim() },
      create: { clinicId, name: msgBody.trim(), whatsappPhone: phone },
    });
    await showSlots(newPatient.id, newPatient.name);
    return NextResponse.json({ ok: true });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STATE: handoff — transferred to staff, waiting for "0" to return
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === "handoff") {
    if (msgBody.trim() === "0" || norm(msgBody) === norm("رجوع")) {
      // Return to bot
      if (patient) {
        await showSlots(patient.id, patient.name);
      } else {
        await db.whatsappSession.upsert({
          where: { clinicId_phone: { clinicId, phone } },
          update: { step: "awaiting_name" }, create: { clinicId, phone, step: "awaiting_name" },
        });
        await reply(`أرسل اسمك الكريم لحجز موعد 🙏`);
      }
    }
    // Any other message while in handoff → ignore (staff is handling it)
    return NextResponse.json({ ok: true });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STATE: done / no session — fresh start
  // ══════════════════════════════════════════════════════════════════════════════

  // "موعدي" keyword
  if (contains(msgBody, APPT_KW)) {
    const upcoming = patient?.appointments[0];
    if (upcoming) {
      await reply(upcomingMsg(clinic.name, patient!.name, upcoming.date));
    } else if (patient) {
      await showSlots(patient.id, patient.name);
    } else {
      await db.whatsappSession.upsert({
        where: { clinicId_phone: { clinicId, phone } },
        update: { step: "awaiting_name" }, create: { clinicId, phone, step: "awaiting_name" },
      });
      await reply(`أرسل اسمك الكريم لحجز موعد 🙏`);
    }
    return NextResponse.json({ ok: true });
  }

  // Returning patient → slots immediately
  if (patient) {
    await showSlots(patient.id, patient.name);
    return NextResponse.json({ ok: true });
  }

  // New patient → ask for name once
  await db.whatsappSession.upsert({
    where: { clinicId_phone: { clinicId, phone } },
    update: { step: "awaiting_name" }, create: { clinicId, phone, step: "awaiting_name" },
  });
  const welcome = clinic.whatsappWelcomeMessage?.trim();
  await reply(welcome ? `${welcome}\n\nأرسل اسمك الكريم للحجز 🙏` : `أهلاً بك في ${clinic.name}!\nأرسل اسمك الكريم لحجز موعد 🙏`);
  return NextResponse.json({ ok: true });

  // ── showSlots helper ─────────────────────────────────────────────────────────
  async function showSlots(patientId: string, patientName: string) {
    const r = await getSlots(clinicId);
    if (!r.slots.length) {
      await reply(`${patientName}، لا تتوفر مواعيد حالياً في ${clinic!.name} 😔\nسنرد عليك عند توفر موعد.`);
      return;
    }
    const nextStep = `awaiting_slot|${r.date}|${r.slots.join(",")}|${patientId}`;
    await db.whatsappSession.upsert({
      where: { clinicId_phone: { clinicId, phone } },
      update: { step: nextStep }, create: { clinicId, phone, step: nextStep },
    });
    await reply(`${patientName}، ${r.msg}\n\nأرسل رقم الوقت للحجز، أو 0 للرجوع.`);
  }
}

// ── sendWhatsApp wrapper ───────────────────────────────────────────────────────
async function send(phone: string, msg: string, apiKey: string|null|undefined, clinicId: string) {
  await sendWhatsApp(phone, msg, apiKey ?? undefined, { clinicId, source: "bot_reply" });
}
