/**
 * Seed: 20 clinics + 380 patients + appointments + payments
 * Run: node prisma/seed.js
 */

"use strict";

const path = require("path");
const fs = require("fs");

// ── Load .env ─────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env");
try {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  console.warn("No .env file found, using existing environment variables");
}

const { PrismaClient } = require("../app/generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ── Clinic names ──────────────────────────────────────────────────────────────
const CLINIC_NAMES = [
  "عيادة الأمل",          "عيادة النور",         "مركز الشفاء الطبي",
  "عيادة الحياة",          "عيادة الرعاية",       "المركز الصحي الحديث",
  "عيادة د. أحمد سالم",   "عيادة السلامة",       "عيادة الهدى",
  "مركز الرافدين الطبي",  "عيادة الأطباء",       "عيادة الإخاء",
  "عيادة الوفاء",          "عيادة المستقبل",      "مركز الخليج الطبي",
  "عيادة الأندلس",         "عيادة الفرات",        "عيادة دجلة",
  "عيادة البصرة الطبية",  "عيادة الموصل",
];

const PATIENT_NAMES = [
  "محمد علي", "أحمد حسن", "عمر خالد", "يوسف إبراهيم", "علي حسين",
  "حسن محمود", "كريم عبدالله", "طارق سالم", "زياد نور", "فارس جاسم",
  "سامر عدنان", "باسم وليد", "نضال رياض", "ماجد فؤاد", "رامي جلال",
  "وسيم لؤي", "تامر حازم", "بلال صلاح", "نبيل ثامر", "جلال أنور",
  "فاطمة أحمد", "زينب محمد", "مريم حسن", "نور علي", "سارة خالد",
  "هدى إبراهيم", "ريم جاسم", "ليلى عمر", "أمل حسين", "دينا طارق",
  "رنا سالم", "لينا وليد", "سنا كريم", "دعاء رامي", "أسماء باسم",
  "شيماء سامر", "رشا نضال", "ميسون فارس", "حنان ماجد", "وفاء زياد",
  "عبدالله محمد", "إبراهيم علي", "صالح حسن", "منصور أحمد", "حمزة عمر",
  "يحيى خالد", "سعد حسين", "معاذ فارس", "حازم طارق", "نزار جاسم",
  "راما وليد", "دانا كريم", "لارا سالم", "تارا نور", "كارين زياد",
  "نادية رياض", "سهام فؤاد", "إيمان جلال", "رباب لؤي", "غادة صلاح",
  "عصام ثامر", "نزيه أنور", "شاكر باسم", "ماهر رامي", "واثق سامر",
  "ضياء نضال", "لقمان ماجد", "أياد فارس", "علاء زياد", "فتح الله جاسم",
  "وردة طارق", "بيان كريم", "ندى وليد", "لمى سالم", "هيفاء نور",
  "عهد رياض", "وسن فؤاد", "ثناء جلال", "جمانة لؤي", "روضة صلاح",
  "مصطفى أحمد", "بلقيس علي", "ذكاء حسن", "فرات عمر", "دانيال خالد",
  "لؤي حسين", "نداء فارس", "شكر طارق", "تيسير جاسم", "نشوان وليد",
  "مهند كريم", "سجاد سالم", "عماد نور", "رافد رياض", "هيثم فؤاد",
  "رشيد جلال", "وائل لؤي", "إياد صلاح", "فائز ثامر", "نشأت أنور",
];

function randomPhone(i, j) {
  const base = 770000000 + i * 1000000 + j * 100;
  return `0${base}`;
}

function randomDate(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const hour = 8 + Math.floor(Math.random() * 9);
  d.setHours(hour, Math.random() < 0.5 ? 0 : 30, 0, 0);
  return d;
}

// Distribute 380 patients: realistic clinic sizes
const PATIENT_COUNTS = [
  35, 30, 27, 25, 22, 22, 21, 20, 19, 18,
  18, 17, 16, 15, 14, 14, 14, 12, 11, 10
];
// Verify sum = 380
const totalCheck = PATIENT_COUNTS.reduce((a, b) => a + b, 0);
if (totalCheck !== 380) throw new Error(`Patient count mismatch: ${totalCheck} !== 380`);

const PLANS = ["trial", "basic", "standard", "premium"];
const SUB_STATUSES = ["trial", "active", "active", "active", "inactive"];
const APPT_STATUSES = ["pending", "confirmed", "completed", "completed", "completed", "cancelled"];
const PAYMENT_METHODS = ["manual", "superkey"];
const PAYMENT_STATUSES = ["approved", "approved", "approved", "pending", "rejected"];
const AMOUNTS = [35000, 45000, 55000];

async function seed() {
  console.log("🌱 Starting seed — 20 clinics, 380 patients\n");

  // ── Clear existing clinics ─────────────────────────────────────────────────
  const existingClinics = await db.clinic.findMany({ select: { id: true } });
  if (existingClinics.length > 0) {
    const ids = existingClinics.map((c) => c.id);
    console.log(`🧹 Clearing ${ids.length} existing clinics...`);
    await db.$transaction([
      db.whatsappSession.deleteMany({ where: { clinicId: { in: ids } } }),
      db.appointment.deleteMany({ where: { clinicId: { in: ids } } }),
      db.patient.deleteMany({ where: { clinicId: { in: ids } } }),
      db.workingHours.deleteMany({ where: { clinicId: { in: ids } } }),
      db.payment.deleteMany({ where: { clinicId: { in: ids } } }),
      db.subscription.deleteMany({ where: { clinicId: { in: ids } } }),
      db.user.deleteMany({ where: { clinicId: { in: ids } } }),
      db.clinic.deleteMany({ where: { id: { in: ids } } }),
    ]);
    console.log(`   Done.\n`);
  }

  const passwordHash = await bcrypt.hash("clinic123", 10);
  let totalPatients = 0;
  let totalAppointments = 0;
  let totalPayments = 0;
  const clinicLoginMap = [];

  for (let i = 0; i < 20; i++) {
    const clinicName = CLINIC_NAMES[i];
    const phone = `0770${String(1000000 + i).slice(1)}`;
    const plan = PLANS[i % PLANS.length];
    const status = SUB_STATUSES[i % SUB_STATUSES.length];

    const expiresAt = new Date();
    if (status === "trial") {
      expiresAt.setDate(expiresAt.getDate() + 2);
    } else if (status === "active") {
      expiresAt.setDate(expiresAt.getDate() + 20 + (i * 3));
    } else {
      expiresAt.setDate(expiresAt.getDate() - 2);
    }

    // Create clinic with user + subscription
    const clinic = await db.clinic.create({
      data: {
        name: clinicName,
        whatsappNumber: phone,
        botEnabled: i !== 14, // one clinic has bot disabled
        users: {
          create: { passwordHash, role: "doctor" },
        },
        subscription: {
          create: { plan, status, expiresAt },
        },
      },
    });

    clinicLoginMap.push({ name: clinicName, phone, plan, status });

    // Working hours: Sunday–Thursday open 09:00–17:00, Friday closed, Saturday 09:00–13:00
    await db.workingHours.createMany({
      data: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        clinicId: clinic.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: day === 6 ? "13:00" : "17:00",
        isOpen: day !== 5, // Friday off
      })),
    });

    // Payments (1–3 per clinic)
    const numPayments = 1 + (i % 3);
    for (let p = 0; p < numPayments; p++) {
      await db.payment.create({
        data: {
          clinicId: clinic.id,
          amount: AMOUNTS[(i + p) % AMOUNTS.length],
          method: PAYMENT_METHODS[(i + p) % PAYMENT_METHODS.length],
          status: PAYMENT_STATUSES[(i + p) % PAYMENT_STATUSES.length],
          reference: p % 2 === 0 ? `TXN${Date.now()}${i}${p}` : null,
        },
      });
      totalPayments++;
    }

    // Patients + appointments
    const numPatients = PATIENT_COUNTS[i];
    let todayQueueCounter = 1;

    for (let j = 0; j < numPatients; j++) {
      const patient = await db.patient.create({
        data: {
          clinicId: clinic.id,
          name: PATIENT_NAMES[(i * 19 + j) % PATIENT_NAMES.length],
          whatsappPhone: randomPhone(i, j),
        },
      });
      totalPatients++;

      // Each patient has 1–3 appointments spread across past/present/future
      const numAppts = 1 + (j % 3);
      for (let a = 0; a < numAppts; a++) {
        // Spread: past (-30 to -1), today (0), future (+1 to +30)
        let daysOffset;
        if (a === 0) daysOffset = -15 + (j % 20);      // mostly past
        else if (a === 1) daysOffset = 1 + (j % 14);    // near future
        else daysOffset = 0;                             // some today

        const isToday = daysOffset === 0;
        const isPast = daysOffset < 0;
        const apptStatus = isPast
          ? (["completed", "completed", "cancelled"][a % 3])
          : (isToday ? "confirmed" : APPT_STATUSES[a % APPT_STATUSES.length]);

        await db.appointment.create({
          data: {
            clinicId: clinic.id,
            patientId: patient.id,
            date: randomDate(daysOffset),
            status: apptStatus,
            queueNumber: isToday ? todayQueueCounter++ : null,
            queueStatus: isToday
              ? (todayQueueCounter <= 2 ? "done" : todayQueueCounter <= 4 ? "current" : "waiting")
              : "waiting",
            reminder24hSent: isPast,
            reminder1hSent: isPast || daysOffset === 0,
          },
        });
        totalAppointments++;
      }
    }

    const statusIcon = status === "active" ? "🟢" : status === "trial" ? "🟡" : "🔴";
    console.log(
      `${statusIcon} [${String(i + 1).padStart(2, "0")}/20] ${clinicName.padEnd(24)} | ` +
      `${String(numPatients).padStart(3)} مريض | ${plan.padEnd(8)} | ${phone}`
    );
  }

  // ── Final summary ──────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║           نتائج الـ Seed                 ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  🏥 عيادات:      20                       ║`);
  console.log(`║  👤 مرضى:        ${String(totalPatients).padEnd(6)} (مستهدف: 380)       ║`);
  console.log(`║  📅 مواعيد:      ${String(totalAppointments).padEnd(6)}                     ║`);
  console.log(`║  💳 مدفوعات:     ${String(totalPayments).padEnd(6)}                     ║`);
  console.log("╚══════════════════════════════════════════╝");

  console.log("\n📋 بيانات الدخول:");
  console.log("   كلمة المرور لجميع العيادات: clinic123");
  console.log("   أرقام الهواتف:");
  clinicLoginMap.forEach((c, i) => {
    const statusMark = c.status === "active" ? "✅" : c.status === "trial" ? "🔔" : "❌";
    console.log(
      `   ${statusMark} ${c.phone}  →  ${c.name} (${c.plan}/${c.status})`
    );
  });

  await db.$disconnect();
  console.log("\n✅ Seed completed!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message || err);
  console.error(err.stack);
  process.exit(1);
});
