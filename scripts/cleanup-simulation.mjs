/**
 * Cleanup simulation data — deletes the 15 test clinics and all their data
 * Test clinic phones: 077000900 → 077000914
 *
 * Usage:
 *   DIRECT_URL='postgresql://...' node scripts/cleanup-simulation.mjs
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg");

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DIRECT_URL or DATABASE_URL env var is required");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();

// Find the test clinic IDs
const { rows: testClinics } = await client.query(`
  SELECT id, name, "whatsappNumber"
  FROM "Clinic"
  WHERE "whatsappNumber" ~ '^07700090[0-9]{2}$'
     OR "whatsappNumber" ~ '^07700091[0-4]$'
`);

if (testClinics.length === 0) {
  console.log("✅ لا توجد بيانات تجريبية للحذف");
  await client.end();
  process.exit(0);
}

console.log(`🗑️  سيتم حذف ${testClinics.length} عيادة تجريبية...`);
testClinics.forEach(c => console.log(`   - ${c.name} (${c.whatsappNumber})`));

const ids = testClinics.map(c => c.id);
const placeholder = ids.map((_, i) => `$${i + 1}`).join(", ");

// Delete in order (foreign key constraints)
const steps = [
  ["WhatsappSession",   `"clinicId" IN (${placeholder})`],
  ["IncomingMessage",  `"clinicId" IN (${placeholder})`],
  ["SystemEvent",      `"clinicId" IN (${placeholder})`],
  ["ClinicFeatureTrial",`"clinicId" IN (${placeholder})`],
  ["MedicalRecord",    `"clinicId" IN (${placeholder})`],
  ["Appointment",      `"clinicId" IN (${placeholder})`],
  ["Patient",          `"clinicId" IN (${placeholder})`],
  ["Payment",          `"clinicId" IN (${placeholder})`],
  ["WorkingHours",     `"clinicId" IN (${placeholder})`],
  ["Subscription",     `"clinicId" IN (${placeholder})`],
  ["clinic_settings",  `"clinic_id" IN (${placeholder})`],
  ["User",             `"clinicId" IN (${placeholder})`],
  ["Clinic",           `id IN (${placeholder})`],
];

for (const [table, where] of steps) {
  const res = await client.query(`DELETE FROM "${table}" WHERE ${where}`, ids);
  if (res.rowCount > 0) console.log(`   ✓ ${table}: حُذف ${res.rowCount} سجل`);
}

console.log("\n✅ تم حذف كل البيانات التجريبية بنجاح");
await client.end();
