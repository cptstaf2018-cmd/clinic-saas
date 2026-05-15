/**
 * load-test.mjs — API Performance Load Test
 *
 * يقيس زمن الاستجابة وأداء كل endpoint.
 *
 * Usage:
 *   BASE_URL=https://ayadti.duckdns.org node scripts/load-test.mjs
 *   BASE_URL=http://localhost:3000 REQUESTS=50 node scripts/load-test.mjs
 *   BASE_URL=https://ayadti.duckdns.org ENDPOINT=clinics node scripts/load-test.mjs
 *
 * متغيرات البيئة:
 *   BASE_URL          عنوان السيرفر   (default: http://localhost:3000)
 *   REQUESTS          عدد الطلبات لكل endpoint (default: 30)
 *   CONCURRENCY       طلبات متزامنة   (default: 5)
 *   COOKIE            cookie الجلسة  (اختياري — للـ endpoints المحمية)
 *   CRON_SECRET       سر الـ cron    (اختياري)
 *   CLINIC_ID         معرف عيادة     (لاختبار appointments/patients)
 *   ENDPOINT          اختبار endpoint واحد فقط (اختياري)
 */

import { readFileSync, existsSync } from "fs";

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

const BASE_URL    = (process.env.BASE_URL    ?? "http://localhost:3000").replace(/\/$/, "");
const REQUESTS    = parseInt(process.env.REQUESTS    ?? "30");
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? "5");
const COOKIE      = process.env.COOKIE       ?? "";
const CRON_SECRET = process.env.CRON_SECRET  ?? "";
const CLINIC_ID   = process.env.CLINIC_ID    ?? "";
const ONLY_EP     = process.env.ENDPOINT     ?? "";

// ─── تعريف الـ endpoints ──────────────────────────────────────────────────────
const ENDPOINTS = [
  {
    key:     "health",
    label:   "Health Check",
    path:    "/api/display/health",
    method:  "GET",
    headers: {},
    public:  true,
  },
  {
    key:     "clinics",
    label:   "/api/admin/clinics",
    path:    "/api/admin/clinics",
    method:  "GET",
    headers: { cookie: COOKIE },
    public:  false,
    note:    "يجلب كل العيادات — بدون pagination ⚠️",
  },
  {
    key:     "appointments",
    label:   "/api/appointments",
    path:    `/api/appointments${CLINIC_ID ? `?clinicId=${CLINIC_ID}` : ""}`,
    method:  "GET",
    headers: { cookie: COOKIE },
    public:  false,
  },
  {
    key:     "patients",
    label:   "/api/patients",
    path:    `/api/patients${CLINIC_ID ? `?clinicId=${CLINIC_ID}` : ""}`,
    method:  "GET",
    headers: { cookie: COOKIE },
    public:  false,
  },
  {
    key:     "appointments_all",
    label:   "/api/appointments/all",
    path:    "/api/appointments/all",
    method:  "GET",
    headers: { cookie: COOKIE },
    public:  false,
  },
  {
    key:     "cron_reminders",
    label:   "/api/cron/reminders",
    path:    "/api/cron/reminders",
    method:  "GET",
    headers: { authorization: `Bearer ${CRON_SECRET}` },
    public:  true,
    note:    "maxDuration=60s — يُرسل تذكيرات فعلية إذا كان الـ secret صحيحاً!",
    heavy:   true,
  },
  {
    key:     "cron_expire",
    label:   "/api/cron/expire-subscriptions",
    path:    "/api/cron/expire-subscriptions",
    method:  "GET",
    headers: { authorization: `Bearer ${CRON_SECRET}` },
    public:  true,
    heavy:   true,
  },
  {
    key:     "display",
    label:   "/api/display/[clinicId]",
    path:    `/api/display/${CLINIC_ID || "test"}`,
    method:  "GET",
    headers: {},
    public:  true,
    note:    "الـ endpoint الأكثر استخداماً — شاشة الانتظار تستدعيه كل 5 ثواني",
  },
  {
    key:     "analytics",
    label:   "/api/admin/analytics",
    path:    "/api/admin/analytics?days=30",
    method:  "GET",
    headers: { cookie: COOKIE },
    public:  false,
    note:    "يحسب إجماليات عبر كل العيادات",
  },
];

// ─── مساعدات ─────────────────────────────────────────────────────────────────
function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function formatMs(ms) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

function ratingMs(avg) {
  if (avg <  200) return "🟢 ممتاز";
  if (avg <  500) return "🟡 جيد";
  if (avg < 1000) return "🟠 مقبول";
  if (avg < 3000) return "🔴 بطيء";
  return "💀 بطيء جداً";
}

// ─── تشغيل endpoint ───────────────────────────────────────────────────────────
async function runEndpoint(ep) {
  const url = `${BASE_URL}${ep.path}`;
  const durations = [];
  const statuses  = {};
  let errors      = 0;

  // تشغيل REQUESTS طلبات بتزامن CONCURRENCY
  for (let sent = 0; sent < REQUESTS; sent += CONCURRENCY) {
    const batch = Math.min(CONCURRENCY, REQUESTS - sent);
    const promises = Array.from({ length: batch }, async () => {
      const t0 = performance.now();
      try {
        const res = await fetch(url, {
          method:  ep.method,
          headers: { "Accept": "application/json", ...ep.headers },
          signal:  AbortSignal.timeout(30000),
        });
        const ms = performance.now() - t0;
        durations.push(ms);
        statuses[res.status] = (statuses[res.status] ?? 0) + 1;
      } catch (e) {
        errors++;
        durations.push(30000); // timeout = 30s
      }
    });
    await Promise.all(promises);
  }

  durations.sort((a, b) => a - b);
  const avg    = durations.reduce((s, v) => s + v, 0) / durations.length;
  const p50    = percentile(durations, 50);
  const p95    = percentile(durations, 95);
  const p99    = percentile(durations, 99);
  const minMs  = durations[0];
  const maxMs  = durations[durations.length - 1];
  const errRate= ((errors / REQUESTS) * 100).toFixed(1);
  const tput   = (REQUESTS / (durations.reduce((s,v)=>s+v,0) / 1000)).toFixed(2);

  return { avg, p50, p95, p99, minMs, maxMs, errRate, statuses, tput, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log(`
╔══════════════════════════════════════════════════════════════╗
║            API LOAD TEST — اختبار أداء الـ API             ║
╠══════════════════════════════════════════════════════════════╣
║  السيرفر    : ${BASE_URL.padEnd(44)} ║
║  طلبات/endpoint: ${String(REQUESTS).padEnd(41)} ║
║  تزامن      : ${String(CONCURRENCY).padEnd(44)} ║
╚══════════════════════════════════════════════════════════════╝
`);

const endpoints = ONLY_EP
  ? ENDPOINTS.filter(e => e.key === ONLY_EP)
  : ENDPOINTS;

if (endpoints.length === 0) {
  console.error(`❌ لم يُوجد endpoint بالاسم: ${ONLY_EP}`);
  console.log("الأسماء المتاحة:", ENDPOINTS.map(e => e.key).join(", "));
  process.exit(1);
}

const results = [];

for (const ep of endpoints) {
  process.stdout.write(`⏳ ${ep.label}...`);
  if (ep.heavy && !CRON_SECRET) {
    console.log(" ⏭️  تخطي (CRON_SECRET غير موجود)");
    continue;
  }

  const r = await runEndpoint(ep);
  results.push({ ep, r });

  console.log(` ${ratingMs(r.avg)}`);
  console.log(`   avg=${formatMs(r.avg)}  p50=${formatMs(r.p50)}  p95=${formatMs(r.p95)}  p99=${formatMs(r.p99)}`);
  console.log(`   min=${formatMs(r.minMs)}  max=${formatMs(r.maxMs)}  tput=${r.tput} req/s  err=${r.errRate}%`);
  console.log(`   statuses: ${JSON.stringify(r.statuses)}`);
  if (ep.note) console.log(`   📌 ${ep.note}`);
  console.log();
}

// ─── جدول ملخص ───────────────────────────────────────────────────────────────
if (results.length > 1) {
  console.log("═".repeat(80));
  console.log("SUMMARY TABLE — جدول الملخص");
  console.log("═".repeat(80));
  console.log(
    "Endpoint".padEnd(35) +
    "avg".padStart(8) +
    "p95".padStart(8) +
    "p99".padStart(8) +
    "tput".padStart(10) +
    "err%".padStart(7) +
    "  تقييم"
  );
  console.log("─".repeat(80));
  for (const { ep, r } of results) {
    console.log(
      ep.label.padEnd(35) +
      formatMs(r.avg).padStart(8) +
      formatMs(r.p95).padStart(8) +
      formatMs(r.p99).padStart(8) +
      `${r.tput}/s`.padStart(10) +
      `${r.errRate}%`.padStart(7) +
      `  ${ratingMs(r.avg)}`
    );
  }
  console.log("═".repeat(80));

  // ─── التوصيات ──────────────────────────────────────────────────────────────
  const slowEndpoints = results.filter(({ r }) => r.avg > 1000);
  const highError     = results.filter(({ r }) => parseFloat(r.errRate) > 5);

  if (slowEndpoints.length > 0) {
    console.log("\n⚠️  نقاط اختناق مكتشفة:");
    for (const { ep, r } of slowEndpoints) {
      console.log(`   - ${ep.label}: avg ${formatMs(r.avg)} — يحتاج تحسين`);
    }
  }
  if (highError.length > 0) {
    console.log("\n❌ endpoints بها أخطاء عالية:");
    for (const { ep, r } of highError) {
      console.log(`   - ${ep.label}: ${r.errRate}% خطأ`);
    }
  }
  if (slowEndpoints.length === 0 && highError.length === 0) {
    console.log("\n✅ جميع الـ endpoints تعمل بشكل جيد!");
  }
}

console.log(`\n📝 لحفظ النتائج:\n   node scripts/load-test.mjs > docs/load-test-results.txt 2>&1\n`);
