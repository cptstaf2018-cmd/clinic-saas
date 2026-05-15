/**
 * Simulate production load: add 15 new clinics + 100 patients each.
 *
 * Usage:
 *   DIRECT_URL='postgresql://...' node scripts/simulate-15-clinics.mjs
 */

import { createRequire } from "module";
import bcrypt from "bcryptjs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const NEW_CLINICS = 15;
const PATIENTS_PER_CLINIC = 100;
const SEED_TAG = "SIMULATION_2026_05";

const DOCTORS = [
  "د. أحمد العزاوي", "د. سارة الكاظمي", "د. محمد الحسيني", "د. ليلى البصري",
  "د. عمر التميمي", "د. نور السامرائي", "د. حسين الجبوري", "د. زينب الربيعي",
  "د. كريم الدوري", "د. مريم الناصري", "د. باسم الخالدي", "د. آية الشمري",
  "د. وليد العبيدي", "د. هدى الزيدي", "د. طارق الهاشمي",
];

const SPECIALTIES = ["general", "dental", "pediatrics", "dermatology", "cardiology"];
const CITIES = ["بغداد", "تكريت", "الموصل", "البصرة", "أربيل", "النجف", "كركوك", "السليمانية"];

const FIRST_NAMES = [
  "محمد", "أحمد", "علي", "حسن", "حسين", "عمر", "يوسف", "مصطفى", "كرار", "سجاد",
  "فاطمة", "زينب", "مريم", "نور", "سارة", "هدى", "رنا", "لينا", "دينا", "آية",
  "عبدالله", "إبراهيم", "طارق", "كريم", "وليد", "نبيل", "رائد", "سامر", "باسم", "ماجد",
  "خديجة", "أمل", "غادة", "سحر", "إسراء", "بتول", "روان", "ضحى", "إيمان", "سلمى",
];

const LAST_NAMES = [
  "التميمي", "الجبوري", "الشمري", "العبيدي", "الربيعي", "الزيدي", "التكريتي", "الدوري",
  "السامرائي", "العزاوي", "الحسيني", "الخالدي", "السالمي", "الناصري", "الهاشمي",
];

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genPatientPhone(clinicIdx, patientIdx) {
  // Format: 077 + clinic prefix + sequential => guaranteed unique
  const prefix = String(20 + clinicIdx).padStart(2, "0"); // 20..34
  const suffix = String(patientIdx).padStart(5, "0");
  return `077${prefix}${suffix}`;
}

function genClinicPhone(clinicIdx) {
  return `07700${String(900 + clinicIdx).padStart(4, "0")}`;
}

function genCuid() {
  // Lightweight cuid-like id (not cryptographic, just unique for seeding)
  return "c" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-8);
}

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DIRECT_URL or DATABASE_URL env var is required");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

console.log("🚀 Starting simulation seed: 15 clinics × 100 patients = 1500 records");
console.log("━".repeat(60));

const passwordHash = await bcrypt.hash("Test1234", 10);
const trialExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

let createdClinics = 0;
let createdPatients = 0;
let skippedClinics = 0;

const start = Date.now();

for (let i = 0; i < NEW_CLINICS; i++) {
  const clinicId = genCuid();
  const userId = genCuid();
  const subId = genCuid();
  const name = `${DOCTORS[i]} — ${randPick(CITIES)}`;
  const whatsappNumber = genClinicPhone(i);
  const specialty = randPick(SPECIALTIES);

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO "Clinic" (id, name, "whatsappNumber", specialty, "createdAt", "botEnabled")
       VALUES ($1, $2, $3, $4, NOW(), true)`,
      [clinicId, name, whatsappNumber, specialty]
    );

    await client.query(
      `INSERT INTO "User" (id, "clinicId", "passwordHash", role, "createdAt")
       VALUES ($1, $2, $3, 'doctor', NOW())`,
      [userId, clinicId, passwordHash]
    );

    await client.query(
      `INSERT INTO "Subscription" (id, "clinicId", plan, status, "startDate", "expiresAt", "createdAt")
       VALUES ($1, $2, 'trial', 'trial', NOW(), $3, NOW())`,
      [subId, clinicId, trialExpiresAt]
    );

    // Build bulk-insert values for 100 patients
    const values = [];
    const params = [];
    let p = 1;
    for (let j = 0; j < PATIENTS_PER_CLINIC; j++) {
      const pid = genCuid();
      const pname = `${randPick(FIRST_NAMES)} ${randPick(LAST_NAMES)}`;
      const pphone = genPatientPhone(i, j);
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(pid, clinicId, pname, pphone, createdAt);
    }

    await client.query(
      `INSERT INTO "Patient" (id, "clinicId", name, "whatsappPhone", "createdAt")
       VALUES ${values.join(", ")}`,
      params
    );

    await client.query("COMMIT");
    createdClinics++;
    createdPatients += PATIENTS_PER_CLINIC;
    console.log(`✅ [${i + 1}/${NEW_CLINICS}] ${name} (${whatsappNumber}) — 100 مرضى`);
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") {
      skippedClinics++;
      console.log(`⏭️  [${i + 1}/${NEW_CLINICS}] ${whatsappNumber} موجود مسبقاً — تخطّي`);
    } else {
      console.error(`❌ [${i + 1}/${NEW_CLINICS}] ${name}: ${e.message}`);
      throw e;
    }
  }
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log("━".repeat(60));

// Final stats
const stats = await client.query(`
  SELECT
    (SELECT COUNT(*) FROM "Clinic") AS total_clinics,
    (SELECT COUNT(*) FROM "Clinic" WHERE id IN (SELECT "clinicId" FROM "Subscription" WHERE status IN ('active', 'trial') AND "expiresAt" > NOW())) AS active_clinics,
    (SELECT COUNT(*) FROM "Patient") AS total_patients,
    (SELECT ROUND(AVG(cnt), 1) FROM (SELECT COUNT(*) AS cnt FROM "Patient" GROUP BY "clinicId") t) AS avg_patients
`);

console.log("📊 ملخّص الحالة في القاعدة:");
console.log(`   إجمالي العيادات     : ${stats.rows[0].total_clinics}`);
console.log(`   العيادات الفعّالة   : ${stats.rows[0].active_clinics}`);
console.log(`   إجمالي المرضى      : ${stats.rows[0].total_patients}`);
console.log(`   متوسط مرضى/عيادة  : ${stats.rows[0].avg_patients}`);
console.log("━".repeat(60));
console.log(`✅ تم إنشاء ${createdClinics} عيادة + ${createdPatients} مريض في ${elapsed}s`);
if (skippedClinics) console.log(`⏭️  تخطّي ${skippedClinics} عيادة موجودة`);

await client.end();
