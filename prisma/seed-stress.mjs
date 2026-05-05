/**
 * Stress-test seed: 3 existing clinics × 34 patients = 102 total
 * Covers ALL booking scenarios: same-day, 2-days-ahead, returning patients,
 * mid-session abandons, double-booking attempts, invalid slots, etc.
 *
 * Run: node prisma/seed-stress.mjs
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, "../.env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* ignore */ }

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const db = new Client({ connectionString: process.env.DIRECT_URL });
await db.connect();

// ── Clinics (existing IDs) ────────────────────────────────────────────────────
const CLINICS = [
  {
    id:    "cmor4l2kv000304jo3csj5gdy",
    name:  "dr.saad",
    email: "saad@clinic.test",
    userId: "cmor4l2qy000404jox75h578w",
  },
  {
    id:    "cmoozg6ww000804ju1on9sklb",
    name:  "عيادة د. خالد التميمي",
    email: "khalid@clinic.test",
    userId: "cmoozg730000904jub4tuke0s",
  },
  {
    id:    "cmor5fdf1000204jvdcxvno9f",
    name:  "dr.saadjjj",
    email: "saad3@clinic.test",
    userId: "cmor5fdl1000304jvvoog6g2a",
  },
];

// ── 34 Arabic patient names ───────────────────────────────────────────────────
const NAMES = [
  "محمد علي",    "أحمد حسن",    "عمر خالد",    "يوسف إبراهيم", "علي حسين",
  "حسن محمود",   "كريم عبدالله","طارق سالم",   "زياد نور",     "فارس جاسم",
  "سامر عدنان",  "باسم وليد",   "نضال رياض",   "ماجد فؤاد",    "رامي جلال",
  "فاطمة أحمد",  "زينب محمد",   "مريم حسن",    "نور علي",      "سارة خالد",
  "هدى إبراهيم", "ريم جاسم",    "ليلى عمر",    "أمل حسين",     "دينا طارق",
  "عبدالله محمد","إبراهيم علي", "صالح حسن",    "منصور أحمد",   "حمزة عمر",
  "رنا سالم",    "لينا وليد",   "سنا كريم",    "دعاء رامي",
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function cuid() {
  return "c" + Math.random().toString(36).slice(2, 15) +
              Math.random().toString(36).slice(2, 8);
}

function phone(clinicIdx, patientIdx) {
  const base = 7700000000 + clinicIdx * 1000000 + patientIdx;
  return "0" + base.toString();
}

function dateOffset(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function query(sql, params = []) {
  return db.query(sql, params);
}

// ── Step 1: Fix user emails & passwords ───────────────────────────────────────
console.log("\n🔧 Step 1: Fixing user credentials...");
const passwordHash = await bcrypt.hash("clinic123", 10);

for (const clinic of CLINICS) {
  await query(
    `UPDATE "User" SET email=$1, "passwordHash"=$2 WHERE id=$3`,
    [clinic.email, passwordHash, clinic.userId]
  );
  console.log(`   ✅ ${clinic.name} → email: ${clinic.email} / pass: clinic123`);
}

// ── Step 2: Add working hours to clinics that need it ─────────────────────────
console.log("\n🕐 Step 2: Setting working hours...");

for (const clinic of CLINICS) {
  // Clear existing
  await query(`DELETE FROM "WorkingHours" WHERE "clinicId"=$1`, [clinic.id]);

  // 9am–5pm Sat–Thu, Friday off
  for (let day = 0; day <= 6; day++) {
    const isOpen = day !== 5; // Friday = day 5 = off
    await query(
      `INSERT INTO "WorkingHours" (id, "clinicId", "dayOfWeek", "startTime", "endTime", "isOpen")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [cuid(), clinic.id, day, "09:00", "17:00", isOpen]
    );
  }
  console.log(`   ✅ ${clinic.name} → 7 days set (Friday off)`);
}

// ── Step 3: Clean old patients/appointments/sessions ──────────────────────────
console.log("\n🧹 Step 3: Clearing old patient data...");
for (const clinic of CLINICS) {
  await query(`DELETE FROM "WhatsappSession" WHERE "clinicId"=$1`, [clinic.id]);
  await query(`DELETE FROM "Appointment"    WHERE "clinicId"=$1`, [clinic.id]);
  await query(`DELETE FROM "Patient"        WHERE "clinicId"=$1`, [clinic.id]);
}
console.log("   ✅ Cleared");

// ── Step 4: Seed 34 patients per clinic with full scenarios ───────────────────
console.log("\n👥 Step 4: Seeding 34 patients × 3 clinics...\n");

const today = new Date();
const todayDow = today.getDay(); // 0=Sun...6=Sat

for (let ci = 0; ci < CLINICS.length; ci++) {
  const clinic = CLINICS[ci];
  console.log(`📋 ${clinic.name}`);

  const patients = [];

  for (let pi = 0; pi < 34; pi++) {
    const patientId = cuid();
    const patientPhone = phone(ci, pi);
    const patientName = NAMES[pi];

    await query(
      `INSERT INTO "Patient" (id, "clinicId", name, "whatsappPhone", "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [patientId, clinic.id, patientName, patientPhone]
    );
    patients.push({ id: patientId, name: patientName, phone: patientPhone });
  }

  // ── SCENARIO GROUPS ─────────────────────────────────────────────────────────

  let apptCount = 0;

  // GROUP A (0–5): محجوزون قبل يومين — pending (مستقبل)
  for (let i = 0; i <= 5; i++) {
    const hour = 9 + i;
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'pending', 'waiting', NOW())`,
      [cuid(), clinic.id, patients[i].id, dateOffset(2, hour, 0)]
    );
    apptCount++;
  }
  console.log(`   ✅ [A] 6 مرضى — حجز بعد يومين`);

  // GROUP B (6–10): حجوزات نفس اليوم — pending
  const todayHours = [9, 10, 11, 13, 14];
  for (let i = 0; i < 5; i++) {
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueNumber", "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'confirmed', $5, 'waiting', NOW())`,
      [cuid(), clinic.id, patients[6 + i].id, dateOffset(0, todayHours[i], 0), i + 1]
    );
    apptCount++;
  }
  console.log(`   ✅ [B] 5 مرضى — حجز اليوم (confirmed)`);

  // GROUP C (11–13): مرضى عائدون — لديهم موعد سابق + موعد جديد
  for (let i = 0; i < 3; i++) {
    // Past appointment
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "reminder24hSent", "reminder1hSent", "createdAt")
       VALUES ($1, $2, $3, $4, 'completed', 'done', true, true, NOW())`,
      [cuid(), clinic.id, patients[11 + i].id, dateOffset(-7, 10, 0)]
    );
    // New upcoming appointment
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'pending', 'waiting', NOW())`,
      [cuid(), clinic.id, patients[11 + i].id, dateOffset(1, 10 + i, 30)]
    );
    apptCount += 2;
  }
  console.log(`   ✅ [C] 3 مرضى عائدون — موعد سابق + موعد جديد`);

  // GROUP D (14–16): مرضى عائدون لديهم موعد قادم فقط (النظام يُذكّرهم)
  for (let i = 0; i < 3; i++) {
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "reminder24hSent", "createdAt")
       VALUES ($1, $2, $3, $4, 'confirmed', 'waiting', false, NOW())`,
      [cuid(), clinic.id, patients[14 + i].id, dateOffset(1, 15, i * 30)]
    );
    apptCount++;
  }
  console.log(`   ✅ [D] 3 مرضى — موعد غداً (لم يُرسل تذكير بعد)`);

  // GROUP E (17–18): RACE CONDITION — نفس الوقت بالضبط (اثنان يحاولون نفس الموعد)
  const raceTime = dateOffset(2, 10, 0);
  for (let i = 0; i < 2; i++) {
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'pending', 'waiting', NOW())`,
      [cuid(), clinic.id, patients[17 + i].id, raceTime]
    );
    apptCount++;
  }
  console.log(`   ⚠️  [E] 2 مرضى — نفس الموعد بالضبط (race condition)`);

  // GROUP F (19–21): مواعيد ملغاة (cancelled)
  for (let i = 0; i < 3; i++) {
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'cancelled', 'waiting', NOW())`,
      [cuid(), clinic.id, patients[19 + i].id, dateOffset(-2, 11, i * 30)]
    );
    apptCount++;
  }
  console.log(`   ✅ [F] 3 مرضى — مواعيد ملغاة`);

  // GROUP G (22–23): جلسات WhatsApp متوقفة في المنتصف (awaiting_slot)
  for (let i = 0; i < 2; i++) {
    await query(
      `INSERT INTO "WhatsappSession" (id, "clinicId", phone, step, "updatedAt")
       VALUES ($1, $2, $3, 'awaiting_slot', NOW())`,
      [cuid(), clinic.id, patients[22 + i].phone]
    );
  }
  console.log(`   ✅ [G] 2 مرضى — جلسة متوقفة عند اختيار الموعد`);

  // GROUP H (24): جلسة متوقفة عند إدخال الاسم (awaiting_name)
  await query(
    `INSERT INTO "WhatsappSession" (id, "clinicId", phone, step, "updatedAt")
     VALUES ($1, $2, $3, 'awaiting_name', NOW())`,
    [cuid(), clinic.id, patients[24].phone]
  );
  console.log(`   ✅ [H] 1 مريض — جلسة متوقفة عند الاسم`);

  // GROUP I (25–27): مواعيد اليوم — current/done (طابور انتظار نشط)
  const queueStatuses = ["done", "done", "current"];
  for (let i = 0; i < 3; i++) {
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueNumber", "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'completed', $5, $6, NOW())`,
      [cuid(), clinic.id, patients[25 + i].id, dateOffset(0, 8 + i, 0), i + 6, queueStatuses[i]]
    );
    apptCount++;
  }
  console.log(`   ✅ [I] 3 مرضى — طابور اليوم (done × 2 + current × 1)`);

  // GROUP J (28–30): مواعيد بعد أسبوع
  for (let i = 0; i < 3; i++) {
    await query(
      `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueStatus", "createdAt")
       VALUES ($1, $2, $3, $4, 'pending', 'waiting', NOW())`,
      [cuid(), clinic.id, patients[28 + i].id, dateOffset(7, 10 + i, 0)]
    );
    apptCount++;
  }
  console.log(`   ✅ [J] 3 مرضى — حجز بعد أسبوع`);

  // GROUP K (31–33): بدون مواعيد أصلاً (مرضى مسجلون فقط، لم يحجزوا بعد)
  console.log(`   ✅ [K] 3 مرضى — مسجلون بدون مواعيد`);

  console.log(`   📊 إجمالي المواعيد: ${apptCount}\n`);
}

// ── Step 5: Summary ───────────────────────────────────────────────────────────
console.log("─────────────────────────────────────────────────────");
console.log("✅  عيادات: 3");
console.log("✅  مرضى:   102 (34 لكل عيادة)");
console.log("✅  سيناريوات: حجز مستقبلي + نفس اليوم + عائدون + race condition + ملغاة + جلسات ناقصة + طابور");
console.log("─────────────────────────────────────────────────────");
console.log("\n📋 بيانات الدخول:");
console.log("   dr.saad              → saad@clinic.test   / clinic123");
console.log("   عيادة د. خالد        → khalid@clinic.test / clinic123");
console.log("   dr.saadjjj           → saad3@clinic.test  / clinic123");
console.log("\n🔑 السوبر ادمن: cptstaf2018@gmail.com");

await db.end();
console.log("\n🎉 Seed completed!");
