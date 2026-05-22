// WhatsApp Webhook — awaiting instructions
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";
import { logSystemEvent } from "@/lib/system-events";

const IRAQ_OFFSET_MS = 3 * 60 * 60 * 1000;
const EMOJI = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];

// ── Utilities ──────────────────────────────────────────────────────────────────

function verifySignature(received: string | null, expected: string | null): boolean {
  if (!received || !expected) return false;
  const r = Buffer.from(received), e = Buffer.from(expected);
  if (r.length !== e.length) return false;
  return timingSafeEqual(r, e);
}

function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("964")) return `0${d.slice(3)}`;
  if (d.startsWith("07"))  return d;
  return d;
}

function parseNum(text: string): number {
  return parseInt(
    text.trim()
      .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/\D/g, ""),
    10
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h < 12 ? "صباحاً" : "مساءً";
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(dh).padStart(2,"0")}:${String(m).padStart(2,"0")} ${period}`;
}

function norm(text: string): string {
  return text.trim().toLowerCase()
    .replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[إأآا]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ");
}

function matches(text: string, words: string[]): boolean {
  const t = norm(text);
  return words.some(w => t === norm(w) || t.includes(norm(w)));
}

function extractIraqPhone(text: string): string | null {
  const compact = text.replace(/\s/g, "");
  const match = compact.match(/(?:\+?964|0)7[3-9]\d{8}/);
  return match ? normalizePhone(match[0]) : null;
}

function extractPatientName(text: string, phone: string | null): string {
  const withoutPhone = phone
    ? text.replace(phone, "").replace(phone.replace(/^0/, "964"), "").replace(`+${phone.replace(/^0/, "964")}`, "")
    : text;
  return withoutPhone
    .replace(/(?:\+?964|0)7[3-9]\d{8}/g, "")
    .replace(/[0-9٠-٩۰-۹+]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Find patient by phone (tries 07... and 964... formats) ────────────────────

async function findPatient(clinicId: string, phone: string) {
  const alt = phone.startsWith("07") ? `964${phone.slice(1)}`
    : phone.startsWith("964") ? `0${phone.slice(3)}` : null;
  return db.patient.findFirst({
    where: { clinicId, whatsappPhone: { in: [phone, ...(alt ? [alt] : [])] } },
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

function generateSlots(start: string, end: string, taken: Date[], isToday: boolean, nowUtc: Date): string[] {
  const toMin = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const iraqMin = (d: Date) => d.getUTCHours()*60 + d.getUTCMinutes() + 3*60;
  const startMin = toMin(start), endMin = toMin(end);
  const nowMin = isToday ? iraqMin(nowUtc) : 0;
  const takenSet = new Set(taken.map(d => {
    const im = iraqMin(d); return `${Math.floor(im/60)%24}:${String(im%60).padStart(2,"0")}`;
  }));
  const slots: string[] = [];
  for (let m = startMin; m < endMin && slots.length < 8; m += 20) {
    if (isToday && m <= nowMin) continue;
    const h = Math.floor(m/60), min = m%60;
    if (!takenSet.has(`${h}:${String(min).padStart(2,"0")}`))
      slots.push(`${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`);
  }
  return slots;
}

async function getSlots(clinicId: string): Promise<{ msg: string; slots: string[]; date: string }> {
  const nowUtc = new Date();
  const nowIraq = new Date(nowUtc.getTime() + IRAQ_OFFSET_MS);
  for (let ahead = 0; ahead < 7; ahead++) {
    const t = new Date(nowIraq.getTime() + ahead * 86400000);
    const [Y, Mo, D, dow] = [t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate(), t.getUTCDay()];
    const wh = await db.workingHours.findUnique({ where: { clinicId_dayOfWeek: { clinicId, dayOfWeek: dow } } });
    if (!wh?.isOpen) continue;
    const utcStart = new Date(Date.UTC(Y, Mo, D, -3, 0, 0));
    const taken = await db.appointment.findMany({
      where: { clinicId, date: { gte: utcStart, lte: new Date(utcStart.getTime()+86400000-1) }, status: { not: "cancelled" } },
      select: { date: true },
    });
    const slots = generateSlots(wh.startTime, wh.endTime, taken.map(a=>a.date), ahead===0, nowUtc);
    if (!slots.length) continue;
    const label = ahead===0?"اليوم":ahead===1?"غداً":t.toLocaleDateString("ar-IQ",{weekday:"long",timeZone:"UTC"});
    return {
      msg: `المواعيد المتاحة ${label}:\n${slots.map((s,i)=>`${EMOJI[i]} ${formatTime(s)}`).join("\n")}`,
      slots,
      date: `${Y}-${String(Mo+1).padStart(2,"0")}-${String(D).padStart(2,"0")}`,
    };
  }
  return { msg: "لا تتوفر مواعيد خلال الأسبوع القادم 😔", slots: [], date: "" };
}

async function bookSlot(
  clinicId: string, patientId: string, dateStr: string, slotTime: string
): Promise<"ok" | "taken"> {
  const [Y,Mo,D] = dateStr.split("-").map(Number);
  const [h,m] = slotTime.split(":").map(Number);
  const date     = new Date(Date.UTC(Y,Mo-1,D,h-3,m,0,0));
  const dayStart = new Date(Date.UTC(Y,Mo-1,D,-3,0,0,0));
  const dayEnd   = new Date(dayStart.getTime()+86400000-1);
  let taken = false;
  try {
    await db.$transaction(async tx => {
      const c = await tx.appointment.findFirst({ where: { clinicId, date, status: { not:"cancelled" } } });
      if (c) { taken = true; return; }
      const last = await tx.appointment.findFirst({
        where: { clinicId, date: { gte:dayStart, lte:dayEnd }, queueNumber: { not:null } },
        orderBy: { queueNumber:"desc" },
      });
      await tx.appointment.create({ data: { clinicId, patientId, date, queueNumber:(last?.queueNumber??0)+1 } });
    }, { isolationLevel:"Serializable" });
  } catch { taken = true; }
  return taken ? "taken" : "ok";
}

// ══════════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest, { params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;

  let body: Record<string,unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok:false }, { status:400 }); }

  if (body["event"] !== "messages.received") return NextResponse.json({ ok:true });

  const messages  = (body["data"] as Record<string,unknown>)?.["messages"] as Record<string,unknown>;
  if (!messages) return NextResponse.json({ ok:true });

  const key     = messages["key"] as Record<string,unknown>;
  const msgBody = ((messages["messageBody"] as string)??"").trim();
  const fromMe  = key?.["fromMe"] as boolean;

  if (fromMe || !msgBody) return NextResponse.json({ ok:true });

  const phone = normalizePhone(key?.["cleanedSenderPn"] as string ?? "");
  if (!phone || phone.length < 7) return NextResponse.json({ ok:true });

  const clinic = await db.clinic.findUnique({ where: { id:clinicId }, include: { subscription:true } });
  if (!clinic) return NextResponse.json({ ok:false }, { status:404 });

  if (clinic.whatsappWebhookSecret) {
    if (!verifySignature(req.headers.get("x-webhook-signature"), clinic.whatsappWebhookSecret)) {
      await logSystemEvent({ clinicId, type:"whatsapp_webhook_unauthorized", severity:"warning",
        source:"whatsapp_bot", title:"توقيع غير صحيح", message:"", metadata:{ phone } });
      return NextResponse.json({ ok:false }, { status:401 });
    }
  }

  await db.incomingMessage.create({ data: { clinicId, phone, body: msgBody } });

  if (!clinic.botEnabled) return NextResponse.json({ ok:true });

  const sub = clinic.subscription;
  if (!sub || sub.expiresAt <= new Date() || (sub.status !== "active" && sub.status !== "trial")) {
    await reply("العيادة غير متاحة حالياً 🔴");
    return NextResponse.json({ ok:true });
  }

  const session = await db.whatsappSession.findUnique({ where: { clinicId_phone: { clinicId, phone } } });
  const patient = await findPatient(clinicId, phone);
  const step    = session?.step ?? "done";

  async function reply(msg: string) {
    let status = "sent", error: string|null = null;
    try { await sendWhatsApp(phone, msg, clinic!.whatsappAccessToken??undefined, { clinicId, source:"bot_reply" }); }
    catch(e) { status="failed"; error = e instanceof Error ? e.message : "فشل"; }
    await db.incomingMessage.create({ data:{ clinicId, phone, body:msg, read:true, direction:"outbound", status, error } });
  }

  async function upsertStep(newStep: string) {
    await db.whatsappSession.upsert({
      where:  { clinicId_phone: { clinicId, phone } },
      update: { step: newStep },
      create: { clinicId, phone, step: newStep },
    });
  }

  async function showSlots(patientId: string, patientName: string) {
    const r = await getSlots(clinicId);
    if (!r.slots.length) {
      await reply(`لا تتوفر مواعيد حالياً في ${clinic!.name} 😔`);
      return;
    }
    await upsertStep(`awaiting_slot|${r.date}|${r.slots.join(",")}|${patientId}`);
    const list = r.slots.map((s, i) => `${i + 1}- ${formatTime(s)}`).join("\n");
    await reply(`أهلاً ${patientName}\nهذه الأوقات المتاحة:\n${list}\n\nأرسل رقم الوقت للحجز`);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BOT LOGIC
  // ════════════════════════════════════════════════════════════════════════════

  // الاسم + رقم الهاتف يبدأ أو يعيد ضبط الحجز من أي مرحلة، حتى لو كانت هناك جلسة قديمة.
  const typedPhone = extractIraqPhone(msgBody);
  const typedName = extractPatientName(msgBody, typedPhone);
  if (typedName && typedPhone) {
    const resolvedPatient = await db.patient.upsert({
      where: { clinicId_whatsappPhone: { clinicId, whatsappPhone: typedPhone } },
      update: { name: typedName },
      create: { clinicId, name: typedName, whatsappPhone: typedPhone },
      include: { appointments: { where: { date: { gte: new Date() }, status: { not:"cancelled" } }, orderBy: { date:"asc" }, take:1 } },
    });

    await showSlots(resolvedPatient.id, resolvedPatient.name);
    return NextResponse.json({ ok:true });
  }

  // ── حالة: اختيار موعد ──────────────────────────────────────────────────────
  if (step.startsWith("awaiting_slot|")) {
    const [, dateStr, slotsRaw, patientId] = step.split("|");
    const slots  = slotsRaw.split(",");
    const choice = parseNum(msgBody);

    if (!isNaN(choice) && choice >= 1 && choice <= slots.length) {
      const result = await bookSlot(clinicId, patientId, dateStr, slots[choice - 1]);

      if (result === "taken") {
        const r = await getSlots(clinicId);
        if (r.slots.length) {
          await upsertStep(`awaiting_slot|${r.date}|${r.slots.join(",")}|${patientId}`);
          await reply(`هذا الوقت محجوز، إليك المواعيد المتاحة:\n${r.slots.map((s,i) => `${i+1}- ${formatTime(s)}`).join("\n")}`);
        } else {
          await reply("لا تتوفر مواعيد حالياً.");
        }
      } else {
        await upsertStep("done");
        await reply("✅ تم الحجز بنجاح");
      }
    } else {
      await reply(`أرسل رقماً من 1 إلى ${slots.length}`);
    }
    return NextResponse.json({ ok:true });
  }

  // ── حالة: انتظار الاسم أو رقم الهاتف (مريض جديد) ──────────────────────────
  if (step === "awaiting_identity") {
    await reply("للحجز أرسل الاسم ورقم الهاتف في رسالة واحدة\nمثال:\nأحمد علي 07700000000");
    return NextResponse.json({ ok:true });
  }

  // ── طلب الموقع أو العنوان ──────────────────────────────────────────────────
  const LOCATION_KW = ["موقع","عنوان","مكان","وين","اين","أين","خريطة","لوكيشن","maps","google","كوكل","قوقل"];
  if (matches(msgBody, LOCATION_KW)) {
    const addr = clinic.address?.trim();
    const url  = clinic.locationUrl?.trim();
    if (!addr && !url) {
      await reply("لم يتم إضافة موقع العيادة بعد.");
    } else {
      const lines: string[] = [`موقع ${clinic.name}`];
      if (addr) lines.push(`العنوان: ${addr}`);
      if (url)  lines.push(/^https?:\/\//.test(url) ? `رابط الخريطة:\n${url}` : url);
      await reply(lines.join("\n"));
    }
    return NextResponse.json({ ok:true });
  }

  // ── بداية جديدة (لا يوجد session أو step = done) ───────────────────────────
  if (patient) {
    // مريض معروف → مواعيد مباشرة
    await showSlots(patient.id, patient.name);
  } else {
    // مريض جديد → اطلب التعريف
    await upsertStep("awaiting_identity");
    await reply(`مرحباً بك في ${clinic.name}\nللحجز أرسل الاسم ورقم الهاتف في رسالة واحدة\nمثال:\nأحمد علي 07700000000`);
  }

  return NextResponse.json({ ok:true });
}
