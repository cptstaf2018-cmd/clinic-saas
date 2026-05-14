/**
 * seed-large.mjs — Capacity Testing Seed Script
 *
 * يُنشئ بيانات ضخمة لاختبار الطاقة الاستيعابية.
 *
 * Usage:
 *   node scripts/seed-large.mjs
 *   CLINICS=500 node scripts/seed-large.mjs
 *   CLINICS=1000 PATIENTS_PER_CLINIC=1000 node scripts/seed-large.mjs
 *   DRY_RUN=true node scripts/seed-large.mjs       ← يعرض الأرقام بدون إدخال
 *   CLEANUP=true node scripts/seed-large.mjs        ← يحذف بيانات الاختبار فقط
 *
 * متغيرات البيئة:
 *   CLINICS                عدد العيادات          (default: 100)
 *   USERS_PER_CLINIC       مستخدمون لكل عيادة    (default: 5)
 *   PATIENTS_PER_CLINIC    مرضى لكل عيادة        (default: 10000)
 *   APPOINTMENTS_PER_CLINIC مواعيد لكل عيادة     (default: 2000)
 *   MESSAGES_PER_CLINIC    رسائل WhatsApp         (default: 500)
 *   EVENTS_PER_CLINIC      أحداث Audit Log        (default: 1000)
 *   BATCH_SIZE             حجم كل insert          (default: 500)
 *   DRY_RUN                true = لا تدخل بيانات
 *   CLEANUP                true = احذف بيانات الاختبار
 */

import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";

// ─── تحميل .env ──────────────────────────────────────────────────────────────
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    process.env[key] ??= val;
  }
}

const require = createRequire(import.meta.url);
const { Client } = require("pg");

// ─── إعدادات قابلة للتعديل ───────────────────────────────────────────────────
const CLINICS                = parseInt(process.env.CLINICS                ?? "100");
const USERS_PER_CLINIC       = parseInt(process.env.USERS_PER_CLINIC       ?? "5");
const PATIENTS_PER_CLINIC    = parseInt(process.env.PATIENTS_PER_CLINIC    ?? "10000");
const APPOINTMENTS_PER_CLINIC= parseInt(process.env.APPOINTMENTS_PER_CLINIC?? "2000");
const MESSAGES_PER_CLINIC    = parseInt(process.env.MESSAGES_PER_CLINIC    ?? "500");
const EVENTS_PER_CLINIC      = parseInt(process.env.EVENTS_PER_CLINIC      ?? "1000");
const BATCH_SIZE             = parseInt(process.env.BATCH_SIZE             ?? "500");
const DRY_RUN                = process.env.DRY_RUN === "true";
const CLEANUP                = process.env.CLEANUP === "true";
const SEED_TAG               = "CAPACITY_TEST_2026";

// ─── بيانات عشوائية ──────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "محمد","أحمد","علي","حسن","حسين","عمر","يوسف","مصطفى","كرار","سجاد",
  "فاطمة","زينب","مريم","نور","سارة","هدى","رنا","لينا","دينا","آية",
  "عبدالله","إبراهيم","طارق","كريم","وليد","نبيل","رائد","سامر","باسم","ماجد",
  "خديجة","أمل","غادة","سحر","إسراء","بتول","روان","ضحى","إيمان","سلمى",
];
const LAST_NAMES = [
  "التميمي","الجبوري","الشمري","العبيدي","الربيعي","الزيدي","التكريتي","الدوري",
  "السامرائي","العزاوي","الحسيني","الخالدي","السالمي","الناصري","الهاشمي",
  "الراوي","الكاظمي","البصري","الموصلي","الكردي","الطائي","العاني","الفلاحي",
];
const SPECIALTIES  = ["general","dental","pediatrics","dermatology","cardiology","orthopedics","ophthalmology"];
const PLANS        = ["trial","basic","standard","premium"];
const STATUS_LIST  = ["pending","confirmed","completed","cancelled"];
const COMPLAINTS   = [
  "صداع متكرر","ألم في البطن","ارتفاع حرارة","سعال","ضغط دم",
  "متابعة تحاليل","ألم مفاصل","حساسية","فحص دوري","دوخة",
  "وجع أذن","احتقان","متابعة علاج","إرهاق عام","ألم ظهر",
];
const DIAGNOSES    = [
  "التهاب حلق","ضغط دم مرتفع","التهاب اللوزتين","فقر الدم","سكري نوع 2",
  "التهاب قصبات","حساسية موسمية","آلام عضلية","إرهاق وضغط نفسي","التهاب الأذن",
];
const EVENT_TYPES  = [
  "appointment_created","appointment_cancelled","patient_registered",
  "reminder_sent","payment_received","login","logout","settings_changed",
];
const SEVERITIES   = ["info","info","info","warning","error"];

// ─── مساعدات ─────────────────────────────────────────────────────────────────
function cuid() {
  return "c" + Math.random().toString(36).slice(2,13) + Date.now().toString(36).slice(-6);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function patientPhone(ci, pi) {
  // clinicIdx 0-4999, patientIdx 0-9999 → guaranteed unique within clinic
  return `079${String(ci).padStart(4,"0")}${String(pi).padStart(5,"0")}`;
}
function clinicWhatsapp(ci) {
  return `077${String(70000 + ci).padStart(7,"0")}`;
}
function userEmail(ci, ui) {
  return `cap_test_c${ci}_u${ui}@test.local`;
}
function randomDate(daysBack, daysForward = 30) {
  const ms = Date.now()
    + (Math.random() * (daysBack + daysForward) - daysBack) * 86400000;
  return new Date(ms);
}
function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
function eta(done, total, elapsedMs) {
  if (done === 0) return "--";
  const rate = done / elapsedMs;
  const remaining = (total - done) / rate;
  const s = Math.round(remaining / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s/60)}m ${s%60}s`;
}

// ─── batch insert ─────────────────────────────────────────────────────────────
async function batchInsert(client, table, columns, rows) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const slice = rows.slice(i, i + BATCH_SIZE);
    const placeholders = slice.map((_, ri) =>
      `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(",")})`
    ).join(",");
    const values = slice.flatMap(r => r);
    await client.query(
      `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(",")}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
      values
    );
  }
}

// ─── الحذف ───────────────────────────────────────────────────────────────────
async function cleanup(client) {
  console.log("\n🗑️  حذف بيانات الاختبار...");
  const t = Date.now();

  // نجد معرفات العيادات التجريبية أولاً
  const { rows } = await client.query(
    `SELECT id FROM "Clinic" WHERE "whatsappNumber" LIKE '07970%'`
  );
  const ids = rows.map(r => r.id);
  if (ids.length === 0) { console.log("لا توجد بيانات اختبار."); return; }

  const list = `(${ids.map((_,i)=>`$${i+1}`).join(",")})`;

  await client.query(`DELETE FROM "SystemEvent"      WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "IncomingMessage"  WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "MedicalRecord"    WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "Appointment"      WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "WhatsappSession"  WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "WorkingHours"     WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "Patient"          WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "Payment"          WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "Subscription"     WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "ClinicSettings"   WHERE "clinic_id" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "User"             WHERE "clinicId" = ANY($1::text[])`, [ids]);
  await client.query(`DELETE FROM "Clinic"           WHERE id = ANY($1::text[])`, [ids]);

  console.log(`✅ حُذفت ${ids.length} عيادة تجريبية في ${((Date.now()-t)/1000).toFixed(1)}s`);
}

// ─── الإحصائيات ──────────────────────────────────────────────────────────────
function printPlan() {
  const totalRows =
    CLINICS +
    CLINICS * USERS_PER_CLINIC +
    CLINICS * 7 + // WorkingHours
    CLINICS * PATIENTS_PER_CLINIC +
    CLINICS * APPOINTMENTS_PER_CLINIC +
    CLINICS * MESSAGES_PER_CLINIC +
    CLINICS * EVENTS_PER_CLINIC;

  const estimatedMB = totalRows * 0.5 / 1024; // ~0.5 KB per row avg

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           CAPACITY TEST SEED — خطة الإدخال                 ║
╠══════════════════════════════════════════════════════════════╣
║  العيادات              : ${String(CLINICS).padStart(10)} عيادة              ║
║  مستخدمون/عيادة        : ${String(USERS_PER_CLINIC).padStart(10)} مستخدمين           ║
║  مرضى/عيادة           : ${String(PATIENTS_PER_CLINIC).padStart(10)} مريض               ║
║  مواعيد/عيادة          : ${String(APPOINTMENTS_PER_CLINIC).padStart(10)} موعد               ║
║  رسائل WhatsApp/عيادة  : ${String(MESSAGES_PER_CLINIC).padStart(10)} رسالة              ║
║  أحداث Audit/عيادة     : ${String(EVENTS_PER_CLINIC).padStart(10)} حدث                ║
╠══════════════════════════════════════════════════════════════╣
║  إجمالي المرضى        : ${String(CLINICS * PATIENTS_PER_CLINIC).padStart(10)}                    ║
║  إجمالي المواعيد       : ${String(CLINICS * APPOINTMENTS_PER_CLINIC).padStart(10)}                    ║
║  إجمالي الصفوف        : ${String(totalRows).padStart(10)}                    ║
║  حجم تقديري           : ${String(estimatedMB.toFixed(0) + " MB").padStart(10)}                    ║
║  حجم batch            : ${String(BATCH_SIZE).padStart(10)} صف/insert          ║
╚══════════════════════════════════════════════════════════════╝`);

  if (DRY_RUN) {
    console.log("\n⚠️  DRY_RUN=true — لن يتم إدخال أي بيانات.\n");
    process.exit(0);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const DB_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ ERROR: DIRECT_URL أو DATABASE_URL مطلوب");
  process.exit(1);
}

const client = new Client({ connectionString: DB_URL });
await client.connect();
console.log("✅ متصل بقاعدة البيانات");

if (CLEANUP) {
  await cleanup(client);
  await client.end();
  process.exit(0);
}

printPlan();

const startTotal = Date.now();
let totalInserted = 0;

console.log("\n🚀 بدء الإدخال...\n");

// ──────────────────────────────────────────────────────────────────────────────
// 1. العيادات + اشتراكات + ساعات عمل + إعدادات
// ──────────────────────────────────────────────────────────────────────────────
console.log(`[1/6] إنشاء ${CLINICS} عيادة...`);
let t0 = Date.now();

const clinicRows   = [];
const subRows      = [];
const hoursRows    = [];
const settingsRows = [];
const clinicIds    = [];

for (let ci = 0; ci < CLINICS; ci++) {
  const id        = cuid();
  const plan      = pick(PLANS);
  const specialty = pick(SPECIALTIES);
  const expiresAt = randomDate(-90, 365);

  clinicIds.push(id);

  clinicRows.push([
    id,
    `${SEED_TAG} عيادة ${ci + 1} — ${specialty}`,
    clinicWhatsapp(ci),
    new Date(),
    specialty,
    false,
  ]);

  subRows.push([
    cuid(), id, plan,
    plan === "trial" ? "trial" : "active",
    new Date(), expiresAt, new Date(),
  ]);

  for (let day = 0; day < 7; day++) {
    hoursRows.push([cuid(), id, day, "08:00", "17:00", day !== 5]); // جمعة مغلق
  }

  settingsRows.push([id, specialty, true, new Date()]);
}

if (!DRY_RUN) {
  await batchInsert(client, "Clinic",
    ["id","name","whatsappNumber","createdAt","specialty","specialtyOnboardingRequired"],
    clinicRows);
  await batchInsert(client, "Subscription",
    ["id","clinicId","plan","status","startDate","expiresAt","createdAt"],
    subRows);
  await batchInsert(client, "WorkingHours",
    ["id","clinicId","dayOfWeek","startTime","endTime","isOpen"],
    hoursRows);
  await batchInsert(client, "clinic_settings",
    ["clinic_id","specialty_code","setup_completed","updated_at"],
    settingsRows);
}

totalInserted += clinicRows.length + subRows.length + hoursRows.length;
console.log(`   ✓ ${clinicRows.length} عيادة | ${((Date.now()-t0)/1000).toFixed(1)}s`);

// ──────────────────────────────────────────────────────────────────────────────
// 2. المستخدمون
// ──────────────────────────────────────────────────────────────────────────────
console.log(`[2/6] إنشاء ${CLINICS * USERS_PER_CLINIC} مستخدم...`);
t0 = Date.now();

const userRows = [];
for (let ci = 0; ci < CLINICS; ci++) {
  for (let ui = 0; ui < USERS_PER_CLINIC; ui++) {
    userRows.push([
      cuid(), clinicIds[ci], userEmail(ci, ui),
      "$2b$10$dummyhashforloadtesting0000000000000000000000000000000",
      ui === 0 ? "doctor" : "staff", new Date(),
    ]);
  }
}

if (!DRY_RUN) {
  await batchInsert(client, "User",
    ["id","clinicId","email","passwordHash","role","createdAt"],
    userRows);
}
totalInserted += userRows.length;
console.log(`   ✓ ${userRows.length} مستخدم | ${((Date.now()-t0)/1000).toFixed(1)}s`);

// ──────────────────────────────────────────────────────────────────────────────
// 3. المرضى
// ──────────────────────────────────────────────────────────────────────────────
console.log(`[3/6] إنشاء ${CLINICS * PATIENTS_PER_CLINIC} مريض (بشكل متسلسل لتجنب نفاد الذاكرة)...`);
t0 = Date.now();
const startPat = Date.now();

// نحفظ patient IDs لربطها بالمواعيد (أول 2000 فقط لكل عيادة)
const patientIdsByClinic = new Array(CLINICS).fill(null).map(() => []);

for (let ci = 0; ci < CLINICS; ci++) {
  const rows = [];
  for (let pi = 0; pi < PATIENTS_PER_CLINIC; pi++) {
    const id    = cuid();
    const fname = pick(FIRST_NAMES);
    const lname = pick(LAST_NAMES);
    if (pi < APPOINTMENTS_PER_CLINIC) patientIdsByClinic[ci].push(id);
    rows.push([
      id, clinicIds[ci],
      `${fname} ${lname}`,
      patientPhone(ci, pi),
      randomDate(365, 0),
    ]);
  }
  if (!DRY_RUN) {
    await batchInsert(client, "Patient",
      ["id","clinicId","name","whatsappPhone","createdAt"],
      rows);
  }
  totalInserted += rows.length;

  if ((ci + 1) % 10 === 0 || ci === CLINICS - 1) {
    const mem = process.memoryUsage();
    process.stdout.write(
      `\r   ✓ عيادة ${ci+1}/${CLINICS} | `+
      `المرضى: ${(ci+1)*PATIENTS_PER_CLINIC} | `+
      `RAM: ${formatBytes(mem.heapUsed)} | `+
      `ETA: ${eta((ci+1)*PATIENTS_PER_CLINIC, CLINICS*PATIENTS_PER_CLINIC, Date.now()-startPat)}`
    );
  }
}
console.log(`\n   ✓ ${CLINICS * PATIENTS_PER_CLINIC} مريض | ${((Date.now()-t0)/1000).toFixed(1)}s`);

// ──────────────────────────────────────────────────────────────────────────────
// 4. المواعيد
// ──────────────────────────────────────────────────────────────────────────────
console.log(`[4/6] إنشاء ${CLINICS * APPOINTMENTS_PER_CLINIC} موعد...`);
t0 = Date.now();

for (let ci = 0; ci < CLINICS; ci++) {
  const rows = [];
  const pids = patientIdsByClinic[ci];
  for (let ai = 0; ai < APPOINTMENTS_PER_CLINIC; ai++) {
    const date     = randomDate(180, 60);
    const isPast   = date < new Date();
    const status   = isPast ? pick(["completed","cancelled","confirmed"]) : pick(["pending","confirmed"]);
    rows.push([
      cuid(), clinicIds[ci], pids[ai % pids.length],
      date, status,
      ai + 1,
      status === "completed" ? "done" : "waiting",
      isPast, isPast && Math.random() > 0.5,
      randomDate(180, 0),
    ]);
  }
  if (!DRY_RUN) {
    await batchInsert(client, "Appointment",
      ["id","clinicId","patientId","date","status","queueNumber",
       "queueStatus","reminder24hSent","reminder1hSent","createdAt"],
      rows);
  }
  totalInserted += rows.length;
}
console.log(`   ✓ ${CLINICS * APPOINTMENTS_PER_CLINIC} موعد | ${((Date.now()-t0)/1000).toFixed(1)}s`);

// ──────────────────────────────────────────────────────────────────────────────
// 5. رسائل WhatsApp
// ──────────────────────────────────────────────────────────────────────────────
console.log(`[5/6] إنشاء ${CLINICS * MESSAGES_PER_CLINIC} رسالة WhatsApp...`);
t0 = Date.now();

for (let ci = 0; ci < CLINICS; ci++) {
  const rows = [];
  for (let mi = 0; mi < MESSAGES_PER_CLINIC; mi++) {
    const pids    = patientIdsByClinic[ci];
    const phone   = patientPhone(ci, mi % PATIENTS_PER_CLINIC);
    const inbound = Math.random() > 0.4;
    rows.push([
      cuid(), clinicIds[ci], phone,
      inbound ? pick(COMPLAINTS) : `تذكير بموعدك في ${randomDate(-7,0).toLocaleDateString("ar-IQ")}`,
      true,
      inbound ? "inbound" : "outbound",
      "received",
      null,
      randomDate(90, 0),
    ]);
  }
  if (!DRY_RUN) {
    await batchInsert(client, "IncomingMessage",
      ["id","clinicId","phone","body","read","direction","status","error","createdAt"],
      rows);
  }
  totalInserted += rows.length;
}
console.log(`   ✓ ${CLINICS * MESSAGES_PER_CLINIC} رسالة | ${((Date.now()-t0)/1000).toFixed(1)}s`);

// ──────────────────────────────────────────────────────────────────────────────
// 6. أحداث Audit Log
// ──────────────────────────────────────────────────────────────────────────────
console.log(`[6/6] إنشاء ${CLINICS * EVENTS_PER_CLINIC} حدث Audit Log...`);
t0 = Date.now();

for (let ci = 0; ci < CLINICS; ci++) {
  const rows = [];
  for (let ei = 0; ei < EVENTS_PER_CLINIC; ei++) {
    const sev  = pick(SEVERITIES);
    const type = pick(EVENT_TYPES);
    rows.push([
      cuid(), clinicIds[ci], type, sev,
      "seed_large",
      `[SEED] ${type}`,
      `حدث تجريبي رقم ${ei + 1}`,
      JSON.stringify({ seedTag: SEED_TAG, index: ei }),
      sev === "info",
      randomDate(180, 0),
      sev === "info" ? randomDate(90, 0) : null,
    ]);
  }
  if (!DRY_RUN) {
    await batchInsert(client, "SystemEvent",
      ["id","clinicId","type","severity","source","title","message",
       "metadata","resolved","createdAt","resolvedAt"],
      rows);
  }
  totalInserted += rows.length;
}
console.log(`   ✓ ${CLINICS * EVENTS_PER_CLINIC} حدث | ${((Date.now()-t0)/1000).toFixed(1)}s`);

// ──────────────────────────────────────────────────────────────────────────────
// ملخص إجمالي
// ──────────────────────────────────────────────────────────────────────────────
const totalSec = ((Date.now() - startTotal) / 1000).toFixed(1);
const mem      = process.memoryUsage();

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   ✅ اكتمل الإدخال                          ║
╠══════════════════════════════════════════════════════════════╣
║  إجمالي الصفوف المُدخلة : ${String(totalInserted).padStart(12)}                ║
║  الوقت الكلي           : ${String(totalSec + "s").padStart(12)}                ║
║  معدل الإدخال          : ${String(Math.round(totalInserted/totalSec)+"/s").padStart(12)}                ║
║  ذاكرة مستخدمة         : ${String(formatBytes(mem.heapUsed)).padStart(12)}                ║
╠══════════════════════════════════════════════════════════════╣
║  لحذف هذه البيانات:                                         ║
║  CLEANUP=true node scripts/seed-large.mjs                    ║
╚══════════════════════════════════════════════════════════════╝`);

await client.end();
