/**
 * Fast launch load seed: 10 active Premium clinics x 150 patients = 1500 patients.
 * Resets only operational data for the selected Premium clinics.
 *
 * Run: node scripts/seed-launch-load-fast.mjs
 */

import { createRequire } from "module";
import { readFileSync } from "fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] ??= value;
}

const require = createRequire(import.meta.url);
const { Client } = require("pg");

const TARGET_CLINICS = 10;
const PATIENTS_PER_CLINIC = 150;
const LOAD_TAG = "LAUNCH_LOAD_1500";

const FIRST_NAMES = [
  "محمد", "أحمد", "علي", "حسن", "حسين", "عمر", "يوسف", "مصطفى", "كرار", "سجاد",
  "فاطمة", "زينب", "مريم", "نور", "سارة", "هدى", "رنا", "لينا", "دينا", "آية",
  "عبدالله", "إبراهيم", "طارق", "كريم", "وليد", "نبيل", "رائد", "سامر", "باسم", "ماجد",
];

const LAST_NAMES = [
  "التميمي", "الجبوري", "الشمري", "العبيدي", "الربيعي", "الزيدي", "التكريتي", "الدوري",
  "السامرائي", "العزاوي", "الحسيني", "الخالد", "السالم", "الناصر", "الهاشمي",
];

const COMPLAINTS = [
  "صداع متكرر مع إرهاق",
  "ألم في البطن",
  "ارتفاع حرارة",
  "سعال واحتقان",
  "مراجعة ضغط الدم",
  "متابعة تحليل سابق",
  "ألم مفاصل",
  "حساسية موسمية",
];

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 11);
}

function startOfDay(offset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
}

function atSlot(dayOffset, slotIndex) {
  const date = startOfDay(dayOffset);
  date.setHours(8, slotIndex * 10, 0, 0);
  return date;
}

function spreadCreatedAt(index, total) {
  const date = new Date();
  date.setDate(date.getDate() - (index % 21));
  date.setMinutes(date.getMinutes() - Math.floor((index / total) * 480));
  return date;
}

function patientPhone(clinicIndex, patientIndex) {
  return `079${String(510000000 + clinicIndex * 100000 + patientIndex)}`;
}

function q(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

async function bulkInsert(db, table, columns, rows, chunkSize = 500) {
  if (rows.length === 0) return;

  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values = [];
    const placeholders = chunk.map((row, rowIndex) => {
      const fields = row.map((value, colIndex) => {
        values.push(value);
        return `$${rowIndex * columns.length + colIndex + 1}`;
      });
      return `(${fields.join(", ")})`;
    });

    await db.query(
      `INSERT INTO ${q(table)} (${columns.map(q).join(", ")}) VALUES ${placeholders.join(", ")}`,
      values
    );
  }
}

async function main() {
  if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is missing in .env");

  const db = new Client({ connectionString: process.env.DIRECT_URL });
  await db.connect();

  const clinicsResult = await db.query(`
    SELECT c.id, c.name
    FROM "Clinic" c
    JOIN "Subscription" s ON s."clinicId" = c.id
    WHERE s.status = 'active' AND s.plan = 'premium'
    ORDER BY c."createdAt" ASC
    LIMIT $1
  `, [TARGET_CLINICS]);

  if (clinicsResult.rowCount !== TARGET_CLINICS) {
    throw new Error(`Expected ${TARGET_CLINICS} active Premium clinics, found ${clinicsResult.rowCount}`);
  }

  const clinics = clinicsResult.rows;
  const clinicIds = clinics.map((clinic) => clinic.id);
  const patients = [];
  const appointments = [];
  const records = [];
  const messages = [];
  const sessions = [];
  const workingHours = [];
  const systemEvents = [];

  for (let ci = 0; ci < clinics.length; ci++) {
    const clinic = clinics[ci];

    for (let day = 0; day <= 6; day++) {
      workingHours.push([cuid(), clinic.id, day, "08:00", "18:00", day !== 5]);
    }

    for (let pi = 0; pi < PATIENTS_PER_CLINIC; pi++) {
      const patientId = cuid();
      const phone = patientPhone(ci, pi);
      const name = `${FIRST_NAMES[(pi + ci) % FIRST_NAMES.length]} ${LAST_NAMES[(pi * 2 + ci) % LAST_NAMES.length]}`;
      patients.push([patientId, clinic.id, name, phone, spreadCreatedAt(pi, PATIENTS_PER_CLINIC)]);

      if (pi < 60) {
        const queueStatus = pi < 18 ? "done" : pi === 18 ? "current" : "waiting";
        const status = pi < 18 ? "completed" : "confirmed";
        appointments.push([cuid(), clinic.id, patientId, atSlot(0, pi), status, pi + 1, queueStatus, true, pi < 25, spreadCreatedAt(pi, 60)]);
      } else if (pi < 95) {
        appointments.push([cuid(), clinic.id, patientId, atSlot(1, pi - 60), "pending", null, "waiting", false, false, spreadCreatedAt(pi, 35)]);
      } else if (pi < 120) {
        appointments.push([cuid(), clinic.id, patientId, atSlot(3 + ((pi - 95) % 5), pi - 95), "pending", null, "waiting", false, false, spreadCreatedAt(pi, 25)]);
      } else if (pi < 140) {
        appointments.push([cuid(), clinic.id, patientId, atSlot(-1 - ((pi - 120) % 8), pi - 120), "completed", null, "done", true, true, spreadCreatedAt(pi, 20)]);
      } else {
        appointments.push([cuid(), clinic.id, patientId, atSlot(-2, pi - 140), "cancelled", null, "waiting", false, false, spreadCreatedAt(pi, 10)]);
      }

      if (pi < 100) {
        records.push([
          cuid(),
          clinic.id,
          patientId,
          spreadCreatedAt(pi, 100),
          COMPLAINTS[(pi + ci) % COMPLAINTS.length],
          pi % 4 === 0 ? "يحتاج متابعة خلال أسبوع" : "حالة مستقرة",
          pi % 3 === 0 ? "علاج لمدة 5 أيام حسب تقدير الطبيب" : null,
          `${LOAD_TAG} record ${pi + 1}`,
          pi % 5 === 0 ? atSlot(7, pi % 30) : null,
          spreadCreatedAt(pi, 100),
        ]);
      }

      if (pi < 80) {
        const msgCount = pi < 30 ? 4 : pi < 55 ? 3 : 2;
        for (let mi = 0; mi < msgCount; mi++) {
          const direction = mi % 2 === 0 ? "inbound" : "outbound";
          messages.push([
            cuid(),
            clinic.id,
            phone,
            direction === "inbound" ? "مرحبا اريد حجز موعد" : "تم تسجيل طلبك، هذه المواعيد المتاحة.",
            mi > 1,
            direction,
            "received",
            new Date(Date.now() - (pi * 90 + mi * 7) * 60 * 1000),
          ]);
        }
      }

      if (pi >= 145) {
        sessions.push([cuid(), clinic.id, phone, pi % 2 === 0 ? "awaiting_name" : "awaiting_slot", new Date()]);
      }
    }

    systemEvents.push([
      cuid(),
      clinic.id,
      "load_seed_completed",
      "info",
      "stress_seed",
      "حقن بيانات اختبار الضغط",
      `تم حقن ${PATIENTS_PER_CLINIC} مريض وبيانات تشغيل يومي. ${LOAD_TAG}`,
      JSON.stringify({ tag: LOAD_TAG, patients: PATIENTS_PER_CLINIC }),
      new Date(),
    ]);
  }

  console.log("🚀 Fast launch load seed");
  console.log(`   Target clinics: ${clinics.length}`);
  console.log(`   Patients: ${patients.length}`);
  console.log(`   Appointments: ${appointments.length}`);
  console.log(`   Medical records: ${records.length}`);
  console.log(`   Messages: ${messages.length}`);
  console.log(`   Sessions: ${sessions.length}`);

  try {
    console.log("\n🧹 Resetting target operational data...");
    await db.query("BEGIN");
    await db.query(`DELETE FROM "WhatsappSession" WHERE "clinicId" = ANY($1::text[])`, [clinicIds]);
    await db.query(`DELETE FROM "IncomingMessage" WHERE "clinicId" = ANY($1::text[])`, [clinicIds]);
    await db.query(`DELETE FROM "MedicalRecord" WHERE "clinicId" = ANY($1::text[])`, [clinicIds]);
    await db.query(`DELETE FROM "Appointment" WHERE "clinicId" = ANY($1::text[])`, [clinicIds]);
    await db.query(`DELETE FROM "Patient" WHERE "clinicId" = ANY($1::text[])`, [clinicIds]);
    await db.query(`DELETE FROM "WorkingHours" WHERE "clinicId" = ANY($1::text[])`, [clinicIds]);
    await db.query("COMMIT");

    console.log("📥 Bulk inserting...");
    await db.query("BEGIN");
    await bulkInsert(db, "WorkingHours", ["id", "clinicId", "dayOfWeek", "startTime", "endTime", "isOpen"], workingHours);
    await bulkInsert(db, "Patient", ["id", "clinicId", "name", "whatsappPhone", "createdAt"], patients);
    await bulkInsert(
      db,
      "Appointment",
      ["id", "clinicId", "patientId", "date", "status", "queueNumber", "queueStatus", "reminder24hSent", "reminder1hSent", "createdAt"],
      appointments
    );
    await bulkInsert(
      db,
      "MedicalRecord",
      ["id", "clinicId", "patientId", "date", "complaint", "diagnosis", "prescription", "notes", "followUpDate", "createdAt"],
      records
    );
    await bulkInsert(db, "IncomingMessage", ["id", "clinicId", "phone", "body", "read", "direction", "status", "createdAt"], messages);
    await bulkInsert(db, "WhatsappSession", ["id", "clinicId", "phone", "step", "updatedAt"], sessions);
    await bulkInsert(db, "SystemEvent", ["id", "clinicId", "type", "severity", "source", "title", "message", "metadata", "createdAt"], systemEvents);

    await db.query("COMMIT");
  } catch (error) {
    try {
      await db.query("ROLLBACK");
    } catch {}
    throw error;
  }

  const summary = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM "Patient" WHERE "clinicId" = ANY($1::text[])) patients,
      (SELECT COUNT(*)::int FROM "Appointment" WHERE "clinicId" = ANY($1::text[])) appointments,
      (SELECT COUNT(*)::int FROM "MedicalRecord" WHERE "clinicId" = ANY($1::text[])) records,
      (SELECT COUNT(*)::int FROM "IncomingMessage" WHERE "clinicId" = ANY($1::text[])) messages,
      (SELECT COUNT(*)::int FROM "WhatsappSession" WHERE "clinicId" = ANY($1::text[])) sessions
  `, [clinicIds]);

  const perClinic = await db.query(`
    SELECT c.name, COUNT(p.id)::int AS patients
    FROM "Clinic" c
    LEFT JOIN "Patient" p ON p."clinicId" = c.id
    WHERE c.id = ANY($1::text[])
    GROUP BY c.id, c.name, c."createdAt"
    ORDER BY c."createdAt" ASC
  `, [clinicIds]);

  console.log("\n📊 Summary");
  console.table(summary.rows);
  console.table(perClinic.rows);

  await db.end();
  console.log("\n🎉 Fast launch load seed completed.");
}

await main().catch((error) => {
  console.error("\n❌ Fast launch load seed failed:");
  console.error(error);
  process.exit(1);
});
