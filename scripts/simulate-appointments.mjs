/**
 * Seed 15 appointments per clinic across the 15 simulation clinics.
 * Mix of statuses and dates: past completed, today scheduled, future pending.
 *
 * Usage:
 *   DIRECT_URL='postgresql://...' node scripts/simulate-appointments.mjs
 */

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const APPOINTMENTS_PER_CLINIC = 15;
const COMPLAINTS = [
  "صداع متكرر", "ألم في البطن", "ارتفاع حرارة", "سعال", "ضغط دم",
  "متابعة تحاليل", "ألم مفاصل", "حساسية", "فحص دوري", "ألم ظهر",
  "دوخة", "اضطراب نوم", "وجع أذن", "احتقان", "متابعة علاج",
];

function genCuid() {
  return "c" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-8);
}

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DIRECT_URL or DATABASE_URL required");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

console.log(`🚀 Adding ${APPOINTMENTS_PER_CLINIC} appointments per simulation clinic`);
console.log("━".repeat(60));

// Get the 15 simulation clinics (created earlier with phones 077000900..914)
const clinicsResult = await client.query(`
  SELECT id, name FROM "Clinic"
  WHERE "whatsappNumber" LIKE '07700090%' OR "whatsappNumber" LIKE '07700091%'
  ORDER BY "whatsappNumber"
`);

if (clinicsResult.rows.length === 0) {
  console.error("❌ No simulation clinics found. Run simulate-15-clinics.mjs first.");
  process.exit(1);
}

console.log(`📋 Found ${clinicsResult.rows.length} clinics to seed`);

let totalAppointments = 0;
const start = Date.now();

for (const clinic of clinicsResult.rows) {
  // Get patients for this clinic
  const patients = await client.query(
    `SELECT id, name FROM "Patient" WHERE "clinicId" = $1 ORDER BY RANDOM() LIMIT $2`,
    [clinic.id, APPOINTMENTS_PER_CLINIC]
  );

  if (patients.rows.length === 0) {
    console.log(`⚠️  ${clinic.name}: no patients, skipping`);
    continue;
  }

  // Mix of dates and statuses:
  // - 5 past appointments (completed)
  // - 5 today's appointments (waiting/current in queue)
  // - 5 future appointments (confirmed)
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(9, 0, 0, 0);

  const values = [];
  const params = [];
  let p = 1;
  let queueNumber = 1;

  for (let i = 0; i < patients.rows.length; i++) {
    const patient = patients.rows[i];
    let date, status, qNum;

    if (i < 5) {
      // Past completed (1-15 days ago)
      const daysAgo = Math.floor(Math.random() * 15) + 1;
      date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      date.setHours(10 + Math.floor(Math.random() * 6), Math.random() < 0.5 ? 0 : 30, 0, 0);
      status = "completed";
      qNum = null;
    } else if (i < 10) {
      // Today's queue
      date = new Date(todayStart);
      date.setMinutes(date.getMinutes() + (i - 5) * 20);
      status = i === 5 ? "confirmed" : "pending";
      qNum = queueNumber++;
    } else {
      // Future confirmed (1-7 days ahead)
      const daysAhead = Math.floor(Math.random() * 7) + 1;
      date = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      date.setHours(10 + Math.floor(Math.random() * 6), Math.random() < 0.5 ? 0 : 30, 0, 0);
      status = "confirmed";
      qNum = null;
    }

    const apptId = genCuid();
    values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, false, false, NOW())`);
    params.push(apptId, clinic.id, patient.id, date, status, qNum, "waiting");
  }

  await client.query(
    `INSERT INTO "Appointment" (id, "clinicId", "patientId", date, status, "queueNumber", "queueStatus", "reminder24hSent", "reminder1hSent", "createdAt")
     VALUES ${values.join(", ")}`,
    params
  );

  // Add 3 medical records for completed visits
  const completedPatients = patients.rows.slice(0, 3);
  if (completedPatients.length) {
    const mrValues = [];
    const mrParams = [];
    let mp = 1;
    for (const pt of completedPatients) {
      mrValues.push(`($${mp++}, $${mp++}, $${mp++}, NOW() - INTERVAL '${Math.floor(Math.random() * 10) + 1} days', $${mp++}, $${mp++}, $${mp++}, NOW())`);
      mrParams.push(genCuid(), clinic.id, pt.id, randPick(COMPLAINTS), "بحاجة للمتابعة", "علاج عرضي وراحة");
    }
    await client.query(
      `INSERT INTO "MedicalRecord" (id, "clinicId", "patientId", date, complaint, diagnosis, prescription, "createdAt")
       VALUES ${mrValues.join(", ")}`,
      mrParams
    );
  }

  totalAppointments += patients.rows.length;
  console.log(`✅ ${clinic.name} — ${patients.rows.length} موعد + 3 سجلات`);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log("━".repeat(60));

const stats = await client.query(`
  SELECT
    (SELECT COUNT(*) FROM "Appointment") AS total_appts,
    (SELECT COUNT(*) FROM "Appointment" WHERE status='completed') AS completed,
    (SELECT COUNT(*) FROM "Appointment" WHERE date::date = CURRENT_DATE) AS today,
    (SELECT COUNT(*) FROM "Appointment" WHERE date > NOW() AND status='confirmed') AS upcoming,
    (SELECT COUNT(*) FROM "MedicalRecord") AS records
`);

console.log("📊 الحالة بعد الضخ:");
console.log(`   إجمالي الحجوزات   : ${stats.rows[0].total_appts}`);
console.log(`   المكتملة          : ${stats.rows[0].completed}`);
console.log(`   حجوزات اليوم      : ${stats.rows[0].today}`);
console.log(`   القادمة المؤكدة   : ${stats.rows[0].upcoming}`);
console.log(`   السجلات الطبية    : ${stats.rows[0].records}`);
console.log("━".repeat(60));
console.log(`✅ ${totalAppointments} موعد + ${clinicsResult.rows.length * 3} سجل طبي في ${elapsed}s`);

await client.end();
