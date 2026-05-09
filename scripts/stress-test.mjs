/**
 * Stress test: simulate WhatsApp messages across 3 clinics simultaneously
 * Run: node scripts/stress-test.mjs
 */

const BASE = "http://localhost:3000";

const CLINICS = [
  { id: "cmor4l2kv000304jo3csj5gdy", name: "dr.saad" },
  { id: "cmoozg6ww000804ju1on9sklb", name: "عيادة د. خالد" },
  { id: "cmor5fdf1000204jvdcxvno9f", name: "dr.saadjjj" },
];

// New patients (phones not in DB)
const NEW_PATIENTS = [
  { phone: "07901000001", name: "سعد التجريبي" },
  { phone: "07901000002", name: "نور الاختبار" },
  { phone: "07901000003", name: "محمد الضغط" },
  { phone: "07901000004", name: "فاطمة النظام" },
  { phone: "07901000005", name: "علي التحقق" },
  { phone: "07901000006", name: "زينب الكود" },
];

// Existing patients (phones ARE in DB from seed)
const EXISTING_PATIENTS = [
  "07700000000", // عيادة 0, مريض 0
  "07700000001", // عيادة 0, مريض 1
  "07701000000", // عيادة 1, مريض 0
  "07702000000", // عيادة 2, مريض 0
];

let passed = 0;
let failed = 0;
let bugs = [];

async function send(clinicId, phone, message, label) {
  const url = `${BASE}/api/whatsapp/${clinicId}`;
  const payload = {
    event: "messages.received",
    data: {
      messages: {
        key: { fromMe: false, cleanedSenderPn: phone },
        messageBody: message,
      },
    },
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    const ok = res.status < 400;
    if (ok) passed++;
    else { failed++; bugs.push(`[FAIL] ${label} → HTTP ${res.status}`); }
    return { ok, status: res.status, data };
  } catch (e) {
    failed++;
    bugs.push(`[ERROR] ${label} → ${e.message}`);
    return { ok: false, error: e.message };
  }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runScenario(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    const result = await fn();
    console.log(`✅ ${result ?? "ok"}`);
    return true;
  } catch (e) {
    console.log(`❌ ${e.message}`);
    bugs.push(`[EXCEPTION] ${name}: ${e.message}`);
    failed++;
    return false;
  }
}

// ── PHASE 1: New patients — first contact ─────────────────────────────────────
async function phase1_newPatients() {
  console.log("\n🧪 PHASE 1 — New patients first contact (3 clinics × 2 simultaneous)");

  // Fire 6 simultaneous first messages across all 3 clinics
  const tasks = CLINICS.flatMap((clinic, ci) =>
    NEW_PATIENTS.slice(ci * 2, ci * 2 + 2).map(p =>
      send(clinic.id, p.phone, "مرحبا", `P1 ${clinic.name}/${p.phone}`)
    )
  );
  await Promise.all(tasks);
  console.log(`  → ${tasks.length} simultaneous first messages sent`);

  // Wait 500ms then each patient sends their name
  await delay(500);
  const nameTasks = CLINICS.flatMap((clinic, ci) =>
    NEW_PATIENTS.slice(ci * 2, ci * 2 + 2).map(p =>
      send(clinic.id, p.phone, p.name, `P1-name ${clinic.name}/${p.name}`)
    )
  );
  await Promise.all(nameTasks);
  console.log(`  → ${nameTasks.length} names sent`);
}

// ── PHASE 2: Slot selection — pick slot 1 ────────────────────────────────────
async function phase2_pickSlots() {
  console.log("\n🧪 PHASE 2 — Pick slot (send '1' to each clinic)");

  const tasks = CLINICS.flatMap((clinic, ci) =>
    NEW_PATIENTS.slice(ci * 2, ci * 2 + 2).map(p =>
      send(clinic.id, p.phone, "1", `P2-slot ${clinic.name}/${p.phone}`)
    )
  );
  await Promise.all(tasks);
  console.log(`  → ${tasks.length} slot selections sent`);
}

// ── PHASE 3: Race condition — two patients pick SAME slot simultaneously ──────
async function phase3_raceCondition() {
  console.log("\n🧪 PHASE 3 — RACE CONDITION (2 new patients, same clinic, same slot)");

  const clinic = CLINICS[0];
  const raceA = { phone: "07901000010", name: "سباق أول" };
  const raceB = { phone: "07901000011", name: "سباق ثاني" };

  // Both start sessions
  await Promise.all([
    send(clinic.id, raceA.phone, "مرحبا", "race-init-A"),
    send(clinic.id, raceB.phone, "مرحبا", "race-init-B"),
  ]);
  await delay(300);

  // Both send names simultaneously
  await Promise.all([
    send(clinic.id, raceA.phone, raceA.name, "race-name-A"),
    send(clinic.id, raceB.phone, raceB.name, "race-name-B"),
  ]);
  await delay(300);

  // Both pick slot 1 AT THE EXACT SAME TIME
  console.log("  ⚡ Firing both slot picks simultaneously...");
  const [rA, rB] = await Promise.all([
    send(clinic.id, raceA.phone, "1", "race-slot-A"),
    send(clinic.id, raceB.phone, "1", "race-slot-B"),
  ]);

  // Check DB for duplicates
  const { Client } = (await import("pg")).default
    ? (await import("pg")).default
    : await import("pg");

  console.log(`  → Race A: HTTP ${rA.status}, Race B: HTTP ${rB.status}`);
  console.log("  → Checking DB for duplicate appointments at same slot...");
}

// ── PHASE 4: Returning patients ────────────────────────────────────────────────
async function phase4_returningPatients() {
  console.log("\n🧪 PHASE 4 — Returning patients (existing phones)");

  const tasks = EXISTING_PATIENTS.map((phone, i) => {
    const clinic = CLINICS[Math.floor(i / 2) % 3];
    return send(clinic.id, phone, "مرحبا", `P4-return ${clinic.name}/${phone}`);
  });
  await Promise.all(tasks);
  console.log(`  → ${tasks.length} returning patient messages sent`);
}

// ── PHASE 5: Invalid inputs mid-session ────────────────────────────────────────
async function phase5_invalidInputs() {
  console.log("\n🧪 PHASE 5 — Invalid inputs & edge cases");

  const clinic = CLINICS[1];

  await runScenario("Send empty-ish message (spaces)", async () => {
    const r = await send(clinic.id, "07901000020", "   ", "P5-empty");
    return `HTTP ${r.status}`;
  });

  await runScenario("Send number > 8 as slot choice", async () => {
    // First initiate session
    await send(clinic.id, "07901000021", "مرحبا", "P5-init");
    await delay(200);
    await send(clinic.id, "07901000021", "اسم تجريبي", "P5-name");
    await delay(200);
    const r = await send(clinic.id, "07901000021", "99", "P5-invalid-slot");
    return `HTTP ${r.status}`;
  });

  await runScenario("Send Arabic text when slot number expected", async () => {
    await send(clinic.id, "07901000022", "مرحبا", "P5-init2");
    await delay(200);
    await send(clinic.id, "07901000022", "اسم آخر", "P5-name2");
    await delay(200);
    const r = await send(clinic.id, "07901000022", "أريد الساعة العاشرة", "P5-text-slot");
    return `HTTP ${r.status}`;
  });

  await runScenario("Booking keyword as name (security)", async () => {
    await send(clinic.id, "07901000023", "مرحبا", "P5-kw-init");
    await delay(200);
    const r = await send(clinic.id, "07901000023", "حجز", "P5-kw-as-name");
    return `HTTP ${r.status} — should NOT save 'حجز' as patient name`;
  });
}

// ── PHASE 6: Concurrent multi-clinic load ─────────────────────────────────────
async function phase6_concurrentLoad() {
  console.log("\n🧪 PHASE 6 — Concurrent load: 30 messages across 3 clinics simultaneously");

  const phones = Array.from({ length: 30 }, (_, i) => `0790200${String(i).padStart(4, "0")}`);
  const tasks = phones.map((phone, i) => {
    const clinic = CLINICS[i % 3];
    return send(clinic.id, phone, "مرحبا", `P6-load ${clinic.name}/${phone}`);
  });

  const start = Date.now();
  await Promise.all(tasks);
  const elapsed = Date.now() - start;

  console.log(`  → 30 simultaneous messages processed in ${elapsed}ms (${(elapsed/30).toFixed(0)}ms avg)`);
  if (elapsed > 10000) bugs.push(`[PERF] Phase 6 took ${elapsed}ms for 30 requests — too slow`);
}

// ── PHASE 7: Check DB integrity ────────────────────────────────────────────────
async function phase7_dbIntegrity() {
  console.log("\n🧪 PHASE 7 — DB integrity check");

  const { Client } = await import("pg");
  const client = new Client({
    connectionString: "postgresql://postgres.huhxtphajlafmsqtygtf:Saad.20261981@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
  });
  await client.connect();

  // Check for duplicate appointments at same slot
  const dupes = await client.query(`
    SELECT "clinicId", date, COUNT(*) as cnt
    FROM "Appointment"
    WHERE status NOT IN ('cancelled')
    GROUP BY "clinicId", date
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 10
  `);

  if (dupes.rows.length > 0) {
    console.log(`  ⚠️  Found ${dupes.rows.length} duplicate time slots:`);
    dupes.rows.forEach(r => {
      const ts = new Date(r.date).toLocaleString("ar-IQ");
      console.log(`     ${r.clinicId.slice(-8)} | ${ts} | ${r.cnt} مواعيد`);
      bugs.push(`[BUG] Double booking: clinic ${r.clinicId.slice(-8)} at ${ts} has ${r.cnt} active appointments`);
    });
  } else {
    console.log("  ✅ No duplicate time slots");
    passed++;
  }

  // Check patient counts
  const counts = await client.query(`
    SELECT "clinicId", COUNT(*) as cnt FROM "Patient" GROUP BY "clinicId"
  `);
  console.log("  📊 Patient counts per clinic:");
  counts.rows.forEach(r => {
    const name = CLINICS.find(c => c.id === r.clinicId)?.name ?? r.clinicId.slice(-8);
    console.log(`     ${name}: ${r.cnt} مرضى`);
  });

  // Check for sessions stuck > 5 min
  const stuck = await client.query(`
    SELECT COUNT(*) as cnt FROM "WhatsappSession"
    WHERE "updatedAt" < NOW() - INTERVAL '5 minutes'
  `);
  const stuckCount = parseInt(stuck.rows[0].cnt);
  if (stuckCount > 0) {
    console.log(`  ⚠️  ${stuckCount} sessions stuck > 5 min (expected for abandoned flows)`);
  }

  // Check booking keyword as name
  const badNames = await client.query(`
    SELECT COUNT(*) as cnt FROM "Patient"
    WHERE name IN ('حجز', 'موعد', 'نعم', '1', '2', '3', '4', '5', '6', '7', '8')
  `);
  const badCount = parseInt(badNames.rows[0].cnt);
  if (badCount > 0) {
    bugs.push(`[BUG] ${badCount} patients saved with booking keyword as name!`);
    console.log(`  ❌ ${badCount} patients have booking keywords as names!`);
  } else {
    console.log("  ✅ No booking keywords saved as patient names");
    passed++;
  }

  await client.end();
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
console.log("🚀 Clinic Stress Test — 3 clinics × all scenarios");
console.log("═══════════════════════════════════════════════════");

await phase1_newPatients();
await delay(1000);
await phase2_pickSlots();
await delay(1000);
await phase3_raceCondition();
await delay(1000);
await phase4_returningPatients();
await delay(500);
await phase5_invalidInputs();
await delay(500);
await phase6_concurrentLoad();
await delay(2000);
await phase7_dbIntegrity();

// ── Summary ────────────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════════");
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
if (bugs.length > 0) {
  console.log(`\n🐛 Bugs found (${bugs.length}):`);
  bugs.forEach(b => console.log(`   ${b}`));
} else {
  console.log("\n🎉 No bugs detected!");
}
console.log("═══════════════════════════════════════════════════");
