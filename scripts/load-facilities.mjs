/**
 * Concurrency + load check for the lab and pharmacy APIs.
 *   E2E_HTTPS=1 node scripts/load-facilities.mjs http://localhost:3101
 * Creates two throw-away "ZZLOAD" accounts, hammers them, deletes them. Uses the database in .env.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3101";
const HTTPS = process.env.E2E_HTTPS === "1";
// Concurrent writers per facility: 25 is a stress case, 2-4 is a realistic busy pharmacy or lab.
const WRITERS = Number(process.env.WRITERS ?? 25);
const PASSWORD = "Zz-Load-98765";
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL, max: 2 });
const rid = (label) => `zzload_${label}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const emailOf = (phone) => `zz${phone}@zzload.test`;

async function cleanup() {
  const { rows } = await pool.query(`SELECT id FROM "Clinic" WHERE name LIKE 'ZZLOAD%'`);
  const ids = rows.map((r) => r.id);
  if (!ids.length) return 0;
  const q = (sql) => pool.query(sql, [ids]);
  await q(`DELETE FROM "PharmacySaleItem" WHERE "saleId" IN (SELECT id FROM "PharmacySale" WHERE "clinicId" = ANY($1))`);
  for (const t of ["PharmacySale", "PharmacyProduct"]) await q(`DELETE FROM "${t}" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "LabOrderItem" WHERE "orderId" IN (SELECT id FROM "LabOrder" WHERE "clinicId" = ANY($1))`);
  for (const t of ["LabOrder", "LabTest", "SystemEvent", "IncomingMessage", "Subscription", "User"]) await q(`DELETE FROM "${t}" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM clinic_settings WHERE "clinicId" = ANY($1)`).catch(() => undefined);
  await q(`DELETE FROM "Clinic" WHERE id = ANY($1)`);
  return ids.length;
}

async function account(label, type, phone) {
  const id = rid(label);
  await pool.query(
    `INSERT INTO "Clinic" (id,name,"whatsappNumber","facilityType","specialtyOnboardingRequired",address,"backupEmail") VALUES ($1,$2,$3,$4,false,'x',$5)`,
    [id, `ZZLOAD ${label}`, phone, type, emailOf(phone)]
  );
  await pool.query(`INSERT INTO "User" (id,"clinicId","passwordHash",role) VALUES ($1,$2,$3,'doctor')`, [rid("u"), id, await bcrypt.hash(PASSWORD, 10)]);
  await pool.query(
    `INSERT INTO "Subscription" (id,"clinicId",plan,status,"startDate","expiresAt") VALUES ($1,$2,'trial','trial',now(),now()+interval '10 days')`,
    [rid("s"), id]
  );
  return { id, phone };
}

function client() {
  const jar = new Map();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  async function request(path, init = {}) {
    const res = await fetch(BASE + path, {
      redirect: "manual",
      ...init,
      headers: { ...(HTTPS ? { "x-forwarded-proto": "https" } : {}), ...(init.headers ?? {}), cookie: cookie() },
    });
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const [k, ...v] = pair.split("=");
      jar.set(k.trim(), v.join("="));
    }
    return res;
  }
  const json = async (path, method, body) => {
    const t = performance.now();
    const res = await request(path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    return { status: res.status, data, ms: performance.now() - t };
  };
  return {
    get: (p) => json(p, "GET"),
    post: (p, b) => json(p, "POST", b ?? {}),
    async login(phone, password = PASSWORD) {
      const csrf = await (await request("/api/auth/csrf")).json();
      await request("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken: csrf.csrfToken, identifier: emailOf(phone), password, redirect: "false", json: "true" }),
      });
      return (await (await request("/api/auth/session")).json())?.user ?? null;
    },
  };
}

/** Runs `total` calls of fn(i), `concurrency` at a time, and prints latency stats. */
async function run(label, total, concurrency, fn) {
  const lat = [];
  const statuses = {};
  let next = 0;
  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < total) {
        const i = next++;
        const r = await fn(i).catch((e) => ({ status: "ERR:" + String(e.message).slice(0, 30), ms: 0 }));
        lat.push(r.ms);
        statuses[r.status] = (statuses[r.status] ?? 0) + 1;
      }
    })
  );
  const secs = (performance.now() - t0) / 1000;
  lat.sort((a, b) => a - b);
  const pct = (p) => Math.round(lat[Math.min(lat.length - 1, Math.floor(lat.length * p))]);
  console.log(
    `${label.padEnd(36)} n=${String(total).padStart(4)} c=${String(concurrency).padStart(3)} ${(total / secs).toFixed(1).padStart(6)} req/s  p50=${pct(0.5)}ms p95=${pct(0.95)}ms max=${pct(1)}ms ${JSON.stringify(statuses)}`
  );
  return { statuses };
}

try {
  await cleanup();
  const stamp = String(Date.now()).slice(-6);
  const ph = await account("pharmacy", "pharmacy", `0788${stamp}1`);
  const lb = await account("lab", "lab", `0788${stamp}2`);
  const p = client();
  const l = client();
  console.log("login pharmacy:", !!(await p.login(ph.phone)), " login lab:", !!(await l.login(lb.phone)));

  // Pharmacy: can concurrent sales oversell?
  const STOCK = 100;
  const prod = (await p.post("/api/pharmacy/products", { name: "ZZ دواء", price: "1000", cost: "500", stock: String(STOCK), minStock: "1" })).data;
  const sales = await run("pharmacy: 200 sales, stock=100", 200, WRITERS, () =>
    p.post("/api/pharmacy/sales", { lines: [{ productId: prod.id, qty: 1 }], paymentMethod: "cash" })
  );
  const { rows: [after] } = await pool.query(`SELECT stock FROM "PharmacyProduct" WHERE id=$1`, [prod.id]);
  const { rows: [agg] } = await pool.query(`SELECT count(*)::int n, count(distinct number)::int uniq FROM "PharmacySale" WHERE "clinicId"=$1`, [ph.id]);
  const ok = sales.statuses[201] ?? 0;
  console.log(`  -> sold OK=${ok}, final stock=${after.stock}, invoices=${agg.n}, unique numbers=${agg.uniq}`);
  console.log(`  -> no oversell: ${after.stock >= 0 && ok <= STOCK ? "PASS" : "FAIL"} | no duplicate numbers: ${agg.n === agg.uniq ? "PASS" : "FAIL"} | stock matches sales: ${STOCK - ok === after.stock ? "PASS" : "FAIL"}`);

  await run("pharmacy: read products", 100, 20, () => p.get("/api/pharmacy/products"));
  await run("pharmacy: read sales + today", 100, 20, () => p.get("/api/pharmacy/sales"));

  // Lab: concurrent order creation
  await l.post("/api/lab/tests/starter");
  const tests = (await l.get("/api/lab/tests")).data;
  const ids = tests.slice(0, 3).map((t) => t.id);
  const orders = await run("lab: create 100 orders", 100, WRITERS, (i) =>
    l.post("/api/lab/orders", { patientName: `مراجع ${i}`, sex: i % 2 ? "f" : "m", age: 30, patientPhone: "07700000000", testIds: ids })
  );
  const { rows: [lagg] } = await pool.query(`SELECT count(*)::int n, count(distinct number)::int uniq FROM "LabOrder" WHERE "clinicId"=$1`, [lb.id]);
  console.log(`  -> orders stored=${lagg.n}, unique numbers=${lagg.uniq}, created(201)=${orders.statuses[201] ?? 0}, rejected 409/500=${(orders.statuses[409] ?? 0) + (orders.statuses[500] ?? 0)}`);
  await run("lab: read board", 100, 20, () => l.get("/api/lab/orders"));
  await run("lab: patient autocomplete", 100, 20, () => l.get("/api/lab/patients?q=مراجع"));

  // Login brute force: is there any lockout?
  const b = client();
  await run("login: 30 wrong passwords, one user", 30, 5, async () => {
    const t = performance.now();
    await b.login(ph.phone, "wrong-pass");
    return { status: "tried", ms: performance.now() - t };
  });
  console.log(`  -> correct password after 30 failures: ${(await client().login(ph.phone)) ? "STILL WORKS (no lockout)" : "BLOCKED (lockout works)"}`);
} finally {
  console.log("cleanup: removed", await cleanup(), "load-test clinic(s)");
  await pool.end();
}
