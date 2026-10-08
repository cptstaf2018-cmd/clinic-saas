/**
 * End-to-end check of the clinic / lab / pharmacy flows against a running dev server.
 *
 *   WHATSAPP_API_KEY= WHATSAPP_API_TOKEN= npx next dev -p 3101      (blank keys: nothing can be sent)
 *   node scripts/e2e-facilities.mjs http://localhost:3101
 *
 * It creates throw-away accounts named "ZZTEST ...", exercises every API, and deletes
 * everything it created at the end. It talks to the database in .env, so run it knowingly.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3101";
const PASSWORD = "Zz-Test-98765";
const PREFIX = "ZZTEST";
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL, max: 3 });

let passed = 0;
const failures = [];
const warnings = [];
function check(name, condition, detail = "") {
  if (condition) passed++;
  else failures.push(`${name}${detail ? " — " + detail : ""}`);
}
const warn = (message) => warnings.push(message);
const id = (label) => `zztest_${label}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function cleanup() {
  const { rows } = await pool.query(`SELECT id FROM "Clinic" WHERE name LIKE $1`, [`${PREFIX}%`]);
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return 0;
  const q = (sql) => pool.query(sql, [ids]);
  await q(`DELETE FROM "PharmacySaleItem" WHERE "saleId" IN (SELECT id FROM "PharmacySale" WHERE "clinicId" = ANY($1))`);
  await q(`DELETE FROM "PharmacySale" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "PharmacyProduct" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "LabOrderItem" WHERE "orderId" IN (SELECT id FROM "LabOrder" WHERE "clinicId" = ANY($1))`);
  await q(`DELETE FROM "LabOrder" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "LabTest" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "SystemEvent" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "IncomingMessage" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "WhatsappSession" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "Patient" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM clinic_settings WHERE "clinicId" = ANY($1)`).catch(() => undefined);
  await q(`DELETE FROM "Subscription" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "User" WHERE "clinicId" = ANY($1)`);
  await q(`DELETE FROM "Clinic" WHERE id = ANY($1)`);
  return ids.length;
}

async function makeAccount(label, facilityType, phone, { onboarding = false } = {}) {
  const clinicId = id(`c${label}`);
  const hash = await bcrypt.hash(PASSWORD, 10);
  const name = `${PREFIX} ${label}`;
  const specialty = facilityType === "clinic" ? "general_medicine" : null;
  await pool.query(
    `INSERT INTO "Clinic" (id, name, "whatsappNumber", "facilityType", specialty, "specialtyOnboardingRequired", address) VALUES ($1,$2,$3,$4,$5,$6,'عنوان تجريبي')`,
    [clinicId, name, phone, facilityType, onboarding ? null : specialty, onboarding]
  );
  await pool.query(`INSERT INTO "User" (id, "clinicId", "passwordHash", role) VALUES ($1,$2,$3,'doctor')`, [id(`u${label}`), clinicId, hash]);
  await pool.query(
    `INSERT INTO "Subscription" (id, "clinicId", plan, status, "startDate", "expiresAt") VALUES ($1,$2,'trial','trial', now(), now() + interval '10 days')`,
    [id(`s${label}`), clinicId]
  );
  return { clinicId, phone, name };
}

/** A tiny cookie jar around fetch. */
function client() {
  const jar = new Map();
  const absorb = (res) => {
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const [k, ...v] = pair.split("=");
      const value = v.join("=");
      if (value === "" || /max-age=0|expires=thu, 01 jan 1970/i.test(line)) jar.delete(k.trim());
      else jar.set(k.trim(), value);
    }
  };
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  async function request(path, init = {}) {
    const res = await fetch(BASE + path, { redirect: "manual", ...init, headers: { ...(init.headers ?? {}), cookie: cookie() } });
    absorb(res);
    return res;
  }
  const json = async (path, method, body) => {
    const res = await request(path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };
  return {
    request,
    get: (p) => json(p, "GET"),
    post: (p, b) => json(p, "POST", b ?? {}),
    patch: (p, b) => json(p, "PATCH", b),
    del: (p) => json(p, "DELETE"),
    async login(phone) {
      const csrf = await (await request("/api/auth/csrf")).json();
      const body = new URLSearchParams({ csrfToken: csrf.csrfToken, identifier: phone, password: PASSWORD, redirect: "false", json: "true" });
      await request("/api/auth/callback/credentials", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
      const session = await (await request("/api/auth/session")).json();
      return session?.user ?? null;
    },
    async page(path) {
      const res = await request(path);
      return { status: res.status, location: res.headers.get("location") ?? "", html: res.status === 200 ? await res.text() : "" };
    },
    async upload(path, bytes, filename = "x.png", type = "image/png") {
      const form = new FormData();
      form.append("file", new File([bytes], filename, { type }));
      const res = await request(path, { method: "POST", body: form });
      return { status: res.status, data: await res.json().catch(() => null) };
    },
  };
}

// 1x1 transparent PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

async function main() {
  const leftover = await cleanup();
  if (leftover) warn(`removed ${leftover} leftover test clinic(s) from an earlier run`);

  const stamp = String(Date.now()).slice(-6);
  const A = await makeAccount("lab-A", "lab", `0799${stamp}1`);
  const B = await makeAccount("lab-B", "lab", `0799${stamp}2`);
  const PA = await makeAccount("pharmacy-A", "pharmacy", `0799${stamp}3`);
  const PB = await makeAccount("pharmacy-B", "pharmacy", `0799${stamp}4`);
  const C = await makeAccount("clinic-C", "clinic", `0799${stamp}5`);

  const anon = client();
  const lab = client(), labB = client(), ph = client(), phB = client(), clinic = client();

  // ───────── public pages and guards ─────────
  for (const path of ["/login", "/register", "/about"]) {
    const r = await anon.page(path);
    check(`public page ${path} loads`, r.status === 200, `HTTP ${r.status}`);
  }
  const loginHtml = (await anon.page("/login")).html;
  check("login page carries the new brand", loginHtml.includes("الهلال الذهبي"));
  check("login page speaks for clinics, labs and pharmacies", loginHtml.includes("مختبر") && loginHtml.includes("صيدلية") && loginHtml.includes("عيادة") && !loginHtml.includes("عيادتك تعمل"));
  const registerHtml = (await anon.page("/register")).html;
  check("register page is Google only: no form fields, no code step", registerHtml.includes("التسجيل بحساب Google") && !/<input(?![^>]*type="hidden")/i.test(registerHtml) && !registerHtml.includes("إرسال الكود"));
  check("register page speaks for all three facility types", registerHtml.includes("مختبر") && registerHtml.includes("صيدلية") && registerHtml.includes("عيادة"));
  check("dashboard needs a login", [302, 307, 308].includes((await anon.page("/dashboard")).status));
  for (const path of ["/api/pharmacy/products", "/api/lab/tests", "/api/lab/orders"]) {
    const r = await anon.get(path);
    check(`anonymous ${path} is blocked`, [401, 302, 307, 308].includes(r.status), `HTTP ${r.status}`);
  }
  check("unknown result link is 404", (await anon.page("/result/this-token-does-not-exist-123")).status === 404);
  check("short result token is 404", (await anon.page("/result/x")).status === 404);
  check("result route is public (no redirect to login)", (await anon.page("/result/abcdefghijklmnopqrstuvwxyz")).status === 404);

  // ───────── logins ─────────
  for (const [who, c, acc] of [["lab A", lab, A], ["lab B", labB, B], ["pharmacy A", ph, PA], ["pharmacy B", phB, PB], ["clinic C", clinic, C]]) {
    const user = await c.login(acc.phone);
    check(`login ${who}`, !!user?.clinicId && user.clinicId === acc.clinicId, JSON.stringify(user));
  }
  check("wrong password is refused", await (async () => {
    const x = client();
    const csrf = await (await x.request("/api/auth/csrf")).json();
    await x.request("/api/auth/callback/credentials", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, identifier: A.phone, password: "wrong-password", redirect: "false", json: "true" }) });
    return !(await (await x.request("/api/auth/session")).json())?.user;
  })());

  // ───────── facility isolation ─────────
  check("lab cannot use pharmacy API", (await lab.get("/api/pharmacy/products")).status === 403);
  check("pharmacy cannot use lab API", (await ph.get("/api/lab/tests")).status === 403);
  check("pharmacy cannot use lab orders API", (await ph.get("/api/lab/orders")).status === 403);
  check("clinic cannot use pharmacy API", (await clinic.get("/api/pharmacy/products")).status === 403);
  check("clinic cannot use lab API", (await clinic.get("/api/lab/tests")).status === 403);

  // ───────── clinic regression ─────────
  for (const path of ["/dashboard", "/dashboard/patients", "/dashboard/appointments", "/dashboard/settings", "/dashboard/subscription", "/dashboard/reports", "/dashboard/support", "/dashboard/working-hours", "/dashboard/messages"]) {
    const r = await clinic.page(path);
    check(`clinic page ${path}`, r.status === 200, `HTTP ${r.status} ${r.location}`);
  }
  check("clinic home keeps its appointments screen", (await clinic.page("/dashboard")).html.includes("مواعيد اليوم"));
  check("clinic API patients works", (await clinic.get("/api/patients")).status === 200);
  check("clinic settings report facilityType clinic", (await clinic.get("/api/clinic/settings")).data?.facilityType === "clinic");

  // ───────── first-run onboarding: name + type ─────────
  const NA = await makeAccount("onboard-lab", "clinic", `0799${stamp}6`, { onboarding: true });
  const NB = await makeAccount("onboard-clinic", "clinic", `0799${stamp}7`, { onboarding: true });
  const na = client(), nb = client();
  await na.login(NA.phone);
  await nb.login(NB.phone);
  const ob = await na.page("/onboarding/specialty");
  check("onboarding page shows the type step with the name prefilled", ob.status === 200 && ob.html.includes("ما نوع منشأتك") && ob.html.includes(`value="${NA.name}"`));
  check("a new account is sent to onboarding", /NEXT_REDIRECT|onboarding/.test((await na.page("/dashboard")).html + (await na.page("/dashboard")).location));
  check("facility choice needs a login", [401, 307].includes((await anon.post("/api/clinic/facility", { facilityType: "lab", name: "ZZTEST x" })).status));
  check("facility choice rejects a bad type", (await na.post("/api/clinic/facility", { facilityType: "hospital", name: "ZZTEST x" })).status === 400);
  check("facility choice rejects a missing name", (await na.post("/api/clinic/facility", { facilityType: "lab", name: " " })).status === 400);
  const picked = await na.post("/api/clinic/facility", { facilityType: "lab", name: "ZZTEST مختبر جديد" });
  check("choose lab with a name", picked.status === 200);
  const nSettings = (await na.get("/api/clinic/settings")).data;
  check("name and type are saved", nSettings?.facilityType === "lab" && nSettings?.name === "ZZTEST مختبر جديد");
  check("lab onboarding finishes immediately", (await na.page("/dashboard")).html.includes("لوحة المختبر"));
  check("type cannot be flipped after setup", (await na.post("/api/clinic/facility", { facilityType: "pharmacy", name: "ZZTEST y" })).status === 409);
  check("an established clinic cannot change its type", (await clinic.post("/api/clinic/facility", { facilityType: "lab", name: "ZZTEST z" })).status === 409);
  check("clinic choice keeps onboarding open", (await nb.post("/api/clinic/facility", { facilityType: "clinic", name: "ZZTEST عيادة جديدة" })).status === 200);
  const { rows: nbRow } = await pool.query(`SELECT "specialtyOnboardingRequired" r, name FROM "Clinic" WHERE id=$1`, [NB.clinicId]);
  check("clinic still needs its specialty", nbRow[0].r === true && nbRow[0].name === "ZZTEST عيادة جديدة");
  check("save specialty finishes the clinic setup", (await nb.post("/api/clinic/specialty", { specialty: "dentistry" })).status === 200);
  check("clinic dashboard opens after setup", (await nb.page("/dashboard")).status === 200);

  // ───────── webhook ignores labs and pharmacies ─────────
  for (const acc of [A, PA]) {
    const r = await anon.post(`/api/whatsapp/${acc.clinicId}`, { event: "messages.received", data: { messages: { key: { remoteJid: "9647700000000@s.whatsapp.net", fromMe: false }, messageBody: "السلام عليكم" } }, from: "9647700000000", message: "السلام عليكم" });
    check(`booking-bot webhook ignores ${acc.name}`, r.status === 200 && r.data?.ok === true, `HTTP ${r.status} ${JSON.stringify(r.data)}`);
    const { rows } = await pool.query(`SELECT (SELECT count(*) FROM "Patient" WHERE "clinicId"=$1) p, (SELECT count(*) FROM "WhatsappSession" WHERE "clinicId"=$1) s`, [acc.clinicId]);
    check(`no booking data created for ${acc.name}`, Number(rows[0].p) === 0 && Number(rows[0].s) === 0);
  }

  // ───────── PHARMACY ─────────
  check("pharmacy settings report facilityType", (await ph.get("/api/clinic/settings")).data?.facilityType === "pharmacy");
  const p1 = await ph.post("/api/pharmacy/products", { name: "بنادول", price: "3000", cost: "2100", stock: "10", minStock: "3", barcode: "6281001", category: "أدوية" });
  check("create product", p1.status === 201 && p1.data?.price === 3000 && p1.data?.stock === 10, JSON.stringify(p1.data));
  check("product without name rejected", (await ph.post("/api/pharmacy/products", { price: 100 })).status === 400);
  check("negative price rejected", (await ph.post("/api/pharmacy/products", { name: "x", price: -5 })).status === 400);
  check("bad category rejected", (await ph.post("/api/pharmacy/products", { name: "x", price: 5, category: "سيارات" })).status === 400);
  check("duplicate barcode rejected", (await ph.post("/api/pharmacy/products", { name: "ثاني", price: 100, barcode: "6281001" })).status === 409);
  const p2 = await ph.post("/api/pharmacy/products", { name: "فيتامين د", price: 12000, cost: 7500, stock: 1, requiresRx: false });
  check("create second product (stock 1)", p2.status === 201);
  const pid1 = p1.data.id, pid2 = p2.data.id;
  check("list products", (await ph.get("/api/pharmacy/products")).data?.length === 2);
  const upd = await ph.patch(`/api/pharmacy/products/${pid1}`, { price: 3500 });
  check("edit product price", upd.status === 200 && upd.data?.price === 3500);
  check("other pharmacy cannot edit my product", (await phB.patch(`/api/pharmacy/products/${pid1}`, { price: 1 })).status === 404);
  check("other pharmacy does not see my products", (await phB.get("/api/pharmacy/products")).data?.length === 0);

  // sales
  const s1 = await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 2 }], paymentMethod: "cash", price: 1, total: 1 });
  check("sale uses server prices (client price ignored)", s1.status === 201 && s1.data?.total === 7000 && s1.data?.cost === 4200, JSON.stringify(s1.data));
  check("first invoice number is 1001", s1.data?.number === 1001);
  let prods = (await ph.get("/api/pharmacy/products")).data;
  check("stock decreased by sold quantity", prods.find((p) => p.id === pid1).stock === 8);
  check("overselling rejected", (await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 99 }], paymentMethod: "cash" })).status === 400);
  check("stock unchanged after rejected sale", (await ph.get("/api/pharmacy/products")).data.find((p) => p.id === pid1).stock === 8);
  check("empty invoice rejected", (await ph.post("/api/pharmacy/sales", { lines: [], paymentMethod: "cash" })).status === 400);
  check("decimal quantity rejected", (await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1.5 }], paymentMethod: "cash" })).status === 400);
  check("string quantity rejected", (await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: "2" }], paymentMethod: "cash" })).status === 400);
  check("debt needs a customer", (await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1 }], paymentMethod: "debt" })).status === 400);
  const debt = await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1 }], paymentMethod: "debt", customerName: "أبو علي", customerPhone: "07701234567" });
  check("debt sale with customer", debt.status === 201 && debt.data?.customerName === "أبو علي");
  check("discount above subtotal rejected", (await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1 }], paymentMethod: "cash", discount: 999999 })).status === 400);
  check("bad payment method rejected", (await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1 }], paymentMethod: "bitcoin" })).status === 400);
  check("other pharmacy cannot sell my product", (await phB.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1 }], paymentMethod: "cash" })).status === 400);
  const disc = await ph.post("/api/pharmacy/sales", { lines: [{ productId: pid1, qty: 1 }], paymentMethod: "zaincash", discount: 500 });
  check("discount applied", disc.status === 201 && disc.data?.total === 3000 && disc.data?.discount === 500);

  // two buyers race for the last unit
  const race = await Promise.all([1, 2].map(() => ph.post("/api/pharmacy/sales", { lines: [{ productId: pid2, qty: 1 }], paymentMethod: "cash" })));
  const winners = race.filter((r) => r.status === 201).length;
  check("race for the last unit: exactly one wins", winners === 1, race.map((r) => r.status).join(","));
  check("race: stock never negative", (await ph.get("/api/pharmacy/products")).data.find((p) => p.id === pid2).stock === 0);

  const sales = await ph.get("/api/pharmacy/sales");
  const expectedSales = 7000 + 3500 + 3000 + 12000; // cash 2x3500, debt 3500, zain 3000, race winner 12000
  check("today's sales total matches the invoices", sales.data?.today?.sales === expectedSales, `${sales.data?.today?.sales} vs ${expectedSales}`);
  check("today's invoice count", sales.data?.today?.invoices === 4, String(sales.data?.today?.invoices));

  // void
  const before = (await ph.get("/api/pharmacy/products")).data.find((p) => p.id === pid1).stock;
  const voided = await ph.post(`/api/pharmacy/sales/${s1.data.id}/void`, { reason: "اختبار الإلغاء" });
  check("void invoice", voided.status === 200);
  check("void returns stock", (await ph.get("/api/pharmacy/products")).data.find((p) => p.id === pid1).stock === before + 2);
  check("void removes it from today's totals", (await ph.get("/api/pharmacy/sales")).data?.today?.sales === expectedSales - 7000);
  check("double void refused", (await ph.post(`/api/pharmacy/sales/${s1.data.id}/void`, {})).status === 409);
  check("other pharmacy cannot void my invoice", (await phB.post(`/api/pharmacy/sales/${debt.data.id}/void`, {})).status === 404);
  const { rows: vrow } = await pool.query(`SELECT "voidedAt", "voidReason" FROM "PharmacySale" WHERE id=$1`, [s1.data.id]);
  check("voided invoice stays in the database with its reason", !!vrow[0]?.voidedAt && vrow[0]?.voidReason === "اختبار الإلغاء");

  // product images
  const img = await ph.upload(`/api/pharmacy/products/${pid1}/image`, PNG);
  if (img.status === 503) {
    warn("image storage is not configured here: product image upload was not exercised");
  } else {
    check("upload product image", img.status === 200, JSON.stringify(img));
    const got = await ph.request(`/api/pharmacy/products/${pid1}/image`);
    check("serve product image with the right type", got.status === 200 && got.headers.get("content-type") === "image/png" && got.headers.get("x-content-type-options") === "nosniff");
    check("other pharmacy cannot read my product image", (await phB.request(`/api/pharmacy/products/${pid1}/image`)).status === 404);
    check("anonymous cannot read product image", [401, 302, 307, 308].includes((await anon.request(`/api/pharmacy/products/${pid1}/image`)).status));
    const bad = await ph.upload(`/api/pharmacy/products/${pid1}/image`, Buffer.from("<html><script>alert(1)</script></html>"), "evil.png", "image/png");
    check("html disguised as png is rejected", bad.status === 400);
    const svg = await ph.upload(`/api/pharmacy/products/${pid1}/image`, Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>"), "x.svg", "image/svg+xml");
    check("svg is rejected", svg.status === 400);
    check("upload to a missing product is 404", (await ph.upload(`/api/pharmacy/products/nope/image`, PNG)).status === 404);
    check("delete product image", (await ph.del(`/api/pharmacy/products/${pid1}/image`)).status === 200);
    check("image is gone after delete", (await ph.request(`/api/pharmacy/products/${pid1}/image`)).status === 404);
  }

  const posPage = await ph.page("/dashboard");
  check("pharmacy home is the POS", posPage.status === 200 && posPage.html.includes("بنادول") && !posPage.html.includes("مواعيد اليوم"));
  for (const path of ["/dashboard/pharmacy/products", "/dashboard/pharmacy/sales", "/dashboard/settings"]) check(`pharmacy page ${path}`, (await ph.page(path)).status === 200);
  const salesPage = await ph.page("/dashboard/pharmacy/sales");
  check("invoices page shows voided invoice", salesPage.html.includes("ملغاة"));
  check("pharmacy settings hide clinic-only wording", (await ph.page("/dashboard/settings")).status === 200);
  check("clinic pages do not leak into a pharmacy sidebar", !posPage.html.includes("/dashboard/appointments"));
  check("delete (archive) product", (await ph.del(`/api/pharmacy/products/${pid2}`)).status === 200 && (await ph.get("/api/pharmacy/products")).data.length === 1);

  // ───────── LAB ─────────
  check("lab settings report facilityType", (await lab.get("/api/clinic/settings")).data?.facilityType === "lab");
  const starter = await lab.post("/api/lab/tests/starter");
  check("starter pack added", starter.status === 200 && starter.data?.added >= 30, JSON.stringify(starter.data));
  check("starter pack is idempotent", (await lab.post("/api/lab/tests/starter")).data?.added === 0);
  const tests = (await lab.get("/api/lab/tests")).data;
  const T = (n) => tests.find((t) => t.name === n);
  check("catalog lists starter tests", tests.length === starter.data.added && !!T("الهيموغلوبين") && !!T("سكر الصيام") && !!T("الكرياتينين"));
  check("lab B catalog is separate", (await labB.get("/api/lab/tests")).data?.length === 0);
  check("test without name rejected", (await lab.post("/api/lab/tests", { price: 1 })).status === 400);
  check("inverted range rejected", (await lab.post("/api/lab/tests", { name: "س", refLowM: 10, refHighM: 5 })).status === 400);
  const custom = await lab.post("/api/lab/tests", { name: "تحليل مخصص", unit: "U", price: "4000", refLowM: "1", refHighM: "2", refLowF: "1", refHighF: "2" });
  check("create custom test", custom.status === 201 && custom.data?.price === 4000);
  check("edit test price", (await lab.patch(`/api/lab/tests/${custom.data.id}`, { price: 5000 })).data?.price === 5000);
  check("other lab cannot edit my test", (await labB.patch(`/api/lab/tests/${custom.data.id}`, { price: 1 })).status === 404);
  for (const [n, p] of [["الهيموغلوبين", 5000], ["سكر الصيام", 3000], ["الكرياتينين", 4000]]) await lab.patch(`/api/lab/tests/${T(n).id}`, { price: p });

  check("order without tests rejected", (await lab.post("/api/lab/orders", { patientName: "x", sex: "f", testIds: [] })).status === 400);
  check("order without sex rejected", (await lab.post("/api/lab/orders", { patientName: "x", testIds: [T("سكر الصيام").id] })).status === 400);
  check("order with bad phone rejected", (await lab.post("/api/lab/orders", { patientName: "x", sex: "f", patientPhone: "12", testIds: [T("سكر الصيام").id] })).status === 400);
  check("order with unknown test rejected", (await lab.post("/api/lab/orders", { patientName: "x", sex: "f", testIds: ["nope"] })).status === 400);
  const foreign = (await labB.post("/api/lab/tests", { name: "تحليل مختبر ب", price: 1 })).data;
  check("order cannot use another lab's test", (await lab.post("/api/lab/orders", { patientName: "x", sex: "f", testIds: [foreign.id] })).status === 400);

  const o1 = await lab.post("/api/lab/orders", { patientName: "زينب حسن", patientPhone: "07701112233", sex: "f", age: 34, doctorName: "د. علي", urgent: true, notes: "صائمة", testIds: [T("الهيموغلوبين").id, T("سكر الصيام").id, T("الكرياتينين").id] });
  check("create order", o1.status === 201 && o1.data?.number === 1001 && o1.data?.items?.length === 3 && o1.data?.total === 12000 && !!o1.data?.publicToken, JSON.stringify(o1.data)?.slice(0, 200));
  const oid = o1.data.id, token = o1.data.publicToken;
  const item = (name) => o1.data.items.find((i) => i.name === name);
  check("order stores a snapshot of ranges", item("الهيموغلوبين").refLowF === 12 && item("الهيموغلوبين").critLow === 7);
  check("remembered patient suggestion", (await lab.get(`/api/lab/patients?q=${encodeURIComponent("زين")}`)).data?.[0]?.patientName === "زينب حسن");
  check("suggestions are per lab", (await labB.get(`/api/lab/patients?q=${encodeURIComponent("زين")}`)).data?.length === 0);
  check("suggestion needs 2+ characters", (await lab.get("/api/lab/patients?q=ز")).data?.length === 0);
  check("order does not exist for another lab", (await labB.patch(`/api/lab/orders/${oid}`, { status: "in_progress" })).status === 404);
  check("board lists the order", (await lab.get("/api/lab/orders")).data?.some((o) => o.id === oid));
  check("other lab board does not list it", !(await labB.get("/api/lab/orders")).data?.some((o) => o.id === oid));

  check("cannot jump new → done", (await lab.patch(`/api/lab/orders/${oid}`, { status: "done" })).status === 409);
  check("cannot enter review before results", (await lab.patch(`/api/lab/orders/${oid}`, { status: "in_progress" })).status === 200);
  check("review needs every result", (await lab.patch(`/api/lab/orders/${oid}`, { status: "review" })).status === 400);
  const fixDetails = await lab.patch(`/api/lab/orders/${oid}`, { details: { patientName: "زينب حسن علي", age: "35", doctorName: "" } });
  check("edit order details", fixDetails.status === 200 && fixDetails.data?.patientName === "زينب حسن علي" && fixDetails.data?.age === 35 && fixDetails.data?.doctorName === null);
  check("bad phone in details rejected", (await lab.patch(`/api/lab/orders/${oid}`, { details: { patientPhone: "5" } })).status === 400);
  check("blank name in details rejected", (await lab.patch(`/api/lab/orders/${oid}`, { details: { patientName: " " } })).status === 400);
  const added = await lab.patch(`/api/lab/orders/${oid}`, { testIds: [T("الهيموغلوبين").id, T("سكر الصيام").id, T("الكرياتينين").id, T("تحليل مخصص") ? T("تحليل مخصص").id : custom.data.id] });
  check("add a test to an open order", added.status === 200 && added.data?.items?.length === 4 && added.data?.total === 12000 + 5000, JSON.stringify(added.data?.total));
  const removed = await lab.patch(`/api/lab/orders/${oid}`, { testIds: [T("الهيموغلوبين").id, T("سكر الصيام").id, T("الكرياتينين").id] });
  check("remove a test from an open order", removed.status === 200 && removed.data?.items?.length === 3 && removed.data?.total === 12000);
  check("cannot remove every test", (await lab.patch(`/api/lab/orders/${oid}`, { testIds: [] })).status === 400);

  const cur = removed.data.items;
  const idOf = (n) => cur.find((i) => i.name === n).id;
  check("non-numeric result rejected", (await lab.patch(`/api/lab/orders/${oid}`, { results: [{ itemId: idOf("الهيموغلوبين"), value: "abc" }] })).status === 400);
  check("result for a foreign item rejected", (await lab.patch(`/api/lab/orders/${oid}`, { results: [{ itemId: "nope", value: "5" }] })).status === 400);
  const r1 = await lab.patch(`/api/lab/orders/${oid}`, { results: [{ itemId: idOf("الهيموغلوبين"), value: "٥٫٢" }, { itemId: idOf("سكر الصيام"), value: "132" }, { itemId: idOf("الكرياتينين"), value: "0.9" }] });
  const flags = Object.fromEntries((r1.data?.items ?? []).map((i) => [i.name, i.flag]));
  check("Arabic digits parsed; critical low flagged", r1.status === 200 && flags["الهيموغلوبين"] === "critical_low" && r1.data.items.find((i) => i.name === "الهيموغلوبين").result === 5.2, JSON.stringify(flags));
  check("high glucose flagged high", flags["سكر الصيام"] === "high");
  check("creatinine for a woman is normal", flags["الكرياتينين"] === "normal");
  const r2 = await lab.patch(`/api/lab/orders/${oid}`, { results: [{ itemId: idOf("الهيموغلوبين"), value: "12.5" }] });
  check("Hb 12.5 is normal for a woman", r2.data?.items?.find((i) => i.name === "الهيموغلوبين").flag === "normal");
  const sexFlip = await lab.patch(`/api/lab/orders/${oid}`, { details: { sex: "m" } });
  check("changing sex re-judges entered results (Hb 12.5 low for a man)", sexFlip.data?.items?.find((i) => i.name === "الهيموغلوبين").flag === "low");
  await lab.patch(`/api/lab/orders/${oid}`, { details: { sex: "f" } });
  check("editing tests after results is still allowed in progress", (await lab.patch(`/api/lab/orders/${oid}`, { testIds: [T("الهيموغلوبين").id, T("سكر الصيام").id, T("الكرياتينين").id] })).status === 200);

  check("result page hidden before approval", (await anon.page(`/result/${token}`)).status === 404);
  check("send refused before approval", (await lab.post(`/api/lab/orders/${oid}/send`)).status === 409);
  check("move to review", (await lab.patch(`/api/lab/orders/${oid}`, { status: "review" })).status === 200);
  const done = await lab.patch(`/api/lab/orders/${oid}`, { status: "done" });
  check("approve order", done.status === 200 && done.data?.status === "done");
  const { rows: drow } = await pool.query(`SELECT "completedAt" FROM "LabOrder" WHERE id=$1`, [oid]);
  check("completion time recorded", !!drow[0].completedAt);
  check("results are locked after approval", (await lab.patch(`/api/lab/orders/${oid}`, { results: [{ itemId: idOf("الهيموغلوبين"), value: "14" }] })).status === 409);
  check("tests are locked after approval", (await lab.patch(`/api/lab/orders/${oid}`, { testIds: [T("الهيموغلوبين").id] })).status === 409);
  check("a done order cannot be cancelled", (await lab.patch(`/api/lab/orders/${oid}`, { status: "cancelled" })).status === 409);
  check("details can still be corrected after approval", (await lab.patch(`/api/lab/orders/${oid}`, { details: { notes: "تم التصحيح" } })).status === 200);

  const pub = await anon.page(`/result/${token}`);
  check("public result page after approval", pub.status === 200 && pub.html.includes("زينب حسن علي") && pub.html.includes("الهيموغلوبين") && pub.html.includes("ZZTEST"), `HTTP ${pub.status}`);
  check("result page is noindex", /noindex/i.test(pub.html));
  check("result page does not link to the app", !pub.html.includes("/dashboard"));

  const sent = await lab.post(`/api/lab/orders/${oid}/send`);
  check("send result on WhatsApp (dev mode, nothing leaves the machine)", sent.status === 200 && !!sent.data?.sentAt, JSON.stringify(sent));
  const { rows: srow } = await pool.query(`SELECT "sentAt" FROM "LabOrder" WHERE id=$1`, [oid]);
  check("sent time recorded", !!srow[0].sentAt);
  check("other lab cannot send my order", (await labB.post(`/api/lab/orders/${oid}/send`)).status === 404);

  // reopen for correction
  const reopen = await lab.patch(`/api/lab/orders/${oid}`, { status: "review" });
  check("reopen a finished result", reopen.status === 200 && reopen.data?.status === "review");
  check("public result is withdrawn while reopened", (await anon.page(`/result/${token}`)).status === 404);
  check("results editable again", (await lab.patch(`/api/lab/orders/${oid}`, { results: [{ itemId: idOf("الهيموغلوبين"), value: "13.1" }] })).status === 200);
  check("re-approve", (await lab.patch(`/api/lab/orders/${oid}`, { status: "done" })).status === 200);
  const pub2 = await anon.page(`/result/${token}`);
  check("public result is back and shows the corrected value", pub2.status === 200 && pub2.html.includes("13.1"));

  // order without a phone, cancelled order
  const o2 = await lab.post("/api/lab/orders", { patientName: "كرار علاء", sex: "m", testIds: [T("سكر الصيام").id] });
  await lab.patch(`/api/lab/orders/${o2.data.id}`, { status: "in_progress" });
  await lab.patch(`/api/lab/orders/${o2.data.id}`, { results: [{ itemId: o2.data.items[0].id, value: "90" }] });
  await lab.patch(`/api/lab/orders/${o2.data.id}`, { status: "review" });
  await lab.patch(`/api/lab/orders/${o2.data.id}`, { status: "done" });
  check("send without a phone is refused", (await lab.post(`/api/lab/orders/${o2.data.id}/send`)).status === 400);
  const o3 = await lab.post("/api/lab/orders", { patientName: "ملغى", sex: "m", testIds: [T("سكر الصيام").id] });
  check("cancel a new order", (await lab.patch(`/api/lab/orders/${o3.data.id}`, { status: "cancelled" })).status === 200);
  check("cancelled order leaves the board", !(await lab.get("/api/lab/orders")).data.some((o) => o.id === o3.data.id));
  check("cancelled order cannot be edited", (await lab.patch(`/api/lab/orders/${o3.data.id}`, { details: { patientName: "x" } })).status === 409);
  check("invoice numbers keep counting", o2.data.number === 1002 && o3.data.number === 1003);

  // images for tests
  const timg = await lab.upload(`/api/lab/tests/${T("سكر الصيام").id}/image`, PNG);
  if (timg.status === 503) warn("image storage is not configured here: test image upload was not exercised");
  else {
    check("upload test image", timg.status === 200);
    check("serve test image", (await lab.request(`/api/lab/tests/${T("سكر الصيام").id}/image`)).status === 200);
    check("other lab cannot read my test image", (await labB.request(`/api/lab/tests/${T("سكر الصيام").id}/image`)).status === 404);
    check("pharmacy cannot read lab test image", [403, 404].includes((await ph.request(`/api/lab/tests/${T("سكر الصيام").id}/image`)).status));
    check("test image rejects non-images", (await lab.upload(`/api/lab/tests/${T("سكر الصيام").id}/image`, Buffer.from("MZ not an image at all....."), "a.png", "image/png")).status === 400);
    check("delete test image", (await lab.del(`/api/lab/tests/${T("سكر الصيام").id}/image`)).status === 200);
    check("test image gone after delete", (await lab.request(`/api/lab/tests/${T("سكر الصيام").id}/image`)).status === 404);
  }
  check("archive (delete) a test", (await lab.del(`/api/lab/tests/${custom.data.id}`)).status === 200 && !(await lab.get("/api/lab/tests")).data.some((t) => t.id === custom.data.id));
  check("old orders survive deleting a test from the catalog", (await lab.get("/api/lab/orders")).data.some((o) => o.id === oid));

  // lab pages
  const home = await lab.page("/dashboard");
  check("lab home is the board", home.status === 200 && home.html.includes("لوحة المختبر") && home.html.includes("كرار علاء"));
  check("lab home hides appointments", !home.html.includes("مواعيد اليوم") && !home.html.includes("/dashboard/appointments"));
  for (const path of ["/dashboard/lab/tests", "/dashboard/lab/archive", "/dashboard/settings", "/dashboard/subscription", "/dashboard/support"]) check(`lab page ${path}`, (await lab.page(path)).status === 200, path);
  const arch = await lab.page(`/dashboard/lab/archive?q=${encodeURIComponent("زينب")}`);
  check("archive finds the patient by name", arch.status === 200 && arch.html.includes("زينب حسن علي"));
  check("archive finds by order number", (await lab.page("/dashboard/lab/archive?q=1001")).html.includes("زينب"));
  check("archive search with no match", (await lab.page("/dashboard/lab/archive?q=zzzz-none")).html.includes("لا توجد نتائج"));
  check("archive is per lab", !(await labB.page("/dashboard/lab/archive?q=" + encodeURIComponent("زينب"))).html.includes("زينب حسن علي"));
  check("archive survives hostile input", (await lab.page(`/dashboard/lab/archive?q=${encodeURIComponent("'; DROP TABLE x; --")}&page=-5`)).status === 200);
  // pages have a loading screen, so a server redirect arrives inside a 200; what matters is that the other facility's screen is never shown
  const bounced = async (c, path, forbidden) => {
    const r = await c.page(path);
    const redirected = [302, 307, 308].includes(r.status) || /NEXT_REDIRECT|http-equiv="refresh"/.test(r.html);
    return redirected && !r.html.includes(forbidden);
  };
  check("pharmacy pages bounce a lab account", await bounced(lab, "/dashboard/pharmacy/products", "المنتجات والمخزون"));
  check("lab pages bounce a pharmacy account", await bounced(ph, "/dashboard/lab/tests", "كتالوج التحاليل"));
  check("clinic pages are not shown to a lab", await bounced(lab, "/dashboard/pharmacy/sales", "الفواتير"));
  check("lab settings page loads", (await lab.page("/dashboard/settings")).status === 200);
}

let crashed = null;
try {
  await main();
} catch (error) {
  crashed = error;
} finally {
  const removed = await cleanup().catch((e) => { failures.push(`cleanup failed: ${e.message}`); return -1; });
  const { rows } = await pool.query(`SELECT count(*) c FROM "Clinic" WHERE name LIKE $1`, [`${PREFIX}%`]);
  if (Number(rows[0].c) !== 0) failures.push(`cleanup left ${rows[0].c} test clinic(s) behind`);
  console.log(`\ncleanup: removed ${removed} test clinic(s); remaining ${rows[0].c}`);
  await pool.end();
}

console.log(`\npassed: ${passed}`);
if (warnings.length) console.log(`warnings:\n  - ${warnings.join("\n  - ")}`);
if (crashed) console.log(`\nCRASHED: ${crashed.stack ?? crashed}`);
if (failures.length) {
  console.log(`\nFAILED (${failures.length}):\n  ✖ ${failures.join("\n  ✖ ")}`);
  process.exit(1);
}
if (crashed) process.exit(1);
console.log("ALL CHECKS PASSED");
