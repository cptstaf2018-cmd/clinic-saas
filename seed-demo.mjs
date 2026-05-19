/**
 * seed-demo.mjs
 * 10 عيادات تجريبية — 4 أسنان + 6 تخصصات — 25 مريض لكل عيادة = 250 مريض
 *
 * تشغيل: node seed-demo.mjs
 *
 * بيانات الدخول:
 *   dental1@demo.com  … dental4@demo.com   ← أطباء الأسنان
 *   clinic5@demo.com  … clinic10@demo.com  ← بقية التخصصات
 *   كلمة المرور لجميعهم: Demo1234!
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// تحميل .env
for (const envFile of [".env.production", ".env"]) {
  try {
    const content = readFileSync(join(__dirname, envFile), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
    break;
  } catch {}
}

const require = createRequire(import.meta.url);
const bcrypt  = require("bcryptjs");
const { Client } = require("pg");

const db = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await db.connect();
console.log("✅ متصل بقاعدة البيانات\n");

// ── مساعدات ──────────────────────────────────────────────────
function cuid() {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPast(daysBack = 90) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack) - 1);
  d.setHours(9 + Math.floor(Math.random() * 8), pick([0, 15, 30, 45]), 0, 0);
  return d;
}
function randomFuture(daysAhead = 14) {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  d.setHours(9 + Math.floor(Math.random() * 8), pick([0, 15, 30, 45]), 0, 0);
  return d;
}
function todayAt(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}
// مواعيد اليوم — 8 مرضى لكل عيادة لاختبار الطابور
const TODAY_SLOTS = [
  todayAt(9, 0), todayAt(9, 30), todayAt(10, 0), todayAt(10, 30),
  todayAt(11, 0), todayAt(11, 30), todayAt(14, 0), todayAt(14, 30),
];

// ── العيادات ─────────────────────────────────────────────────
const CLINICS = [
  // 4 عيادات أسنان
  { name: "عيادة أسنان د. أحمد الجبوري",    email: "dental1@demo.com",  phone: "07800000001", specialty: "dentistry",        degree: "دكتوراه طب الأسنان",      address: "تكريت — حي الزهور"        },
  { name: "عيادة أسنان د. سارة العبيدي",     email: "dental2@demo.com",  phone: "07800000002", specialty: "dentistry",        degree: "بكالوريوس طب الأسنان",    address: "تكريت — المنصور"          },
  { name: "عيادة أسنان د. كريم الحسيني",     email: "dental3@demo.com",  phone: "07800000003", specialty: "dentistry",        degree: "ماجستير تقويم الأسنان",   address: "تكريت — الشرقية"          },
  { name: "عيادة أسنان د. محمود التكريتي",   email: "dental4@demo.com",  phone: "07800000004", specialty: "dentistry",        degree: "دكتوراه جراحة الفم",      address: "تكريت — الضباط"           },
  // 6 تخصصات أخرى
  { name: "عيادة نسائية د. ليلى الشمري",     email: "clinic5@demo.com",  phone: "07800000005", specialty: "gynecology",       degree: "بورد نسائية وتوليد",      address: "بيجي — الرشيد"            },
  { name: "عيادة أطفال د. نور الدليمي",      email: "clinic6@demo.com",  phone: "07800000006", specialty: "pediatrics",       degree: "بورد طب الأطفال",         address: "تكريت — الملعب"           },
  { name: "عيادة جلدية د. علي العزاوي",      email: "clinic7@demo.com",  phone: "07800000007", specialty: "dermatology",      degree: "ماجستير الجلدية",         address: "تكريت — شارع الحرية"      },
  { name: "عيادة قلبية د. ريم الراوي",       email: "clinic8@demo.com",  phone: "07800000008", specialty: "cardiology",       degree: "بورد القلب والأوعية",     address: "تكريت — المستشفى الجديد"  },
  { name: "عيادة عيون د. حسن المشهداني",     email: "clinic9@demo.com",  phone: "07800000009", specialty: "ophthalmology",    degree: "ماجستير طب العيون",       address: "صلاح الدين — المركز"      },
  { name: "عيادة باطنية د. فاطمة الكربلائي", email: "clinic10@demo.com", phone: "07800000010", specialty: "internal_medicine",degree: "بورد الطب الباطني",       address: "تكريت — التعليم الطبي"   },
];

// ── أسماء المرضى ──────────────────────────────────────────────
const MALE_NAMES = [
  "أحمد محمد","علي حسن","محمد عبدالله","عمر خالد","يوسف إبراهيم",
  "حسين علي","كريم سعد","زيد عمر","باسم طاهر","سامر نزار",
  "مصطفى جاسم","وليد ناصر","رامي صالح","تامر حسين","ماهر رشيد",
];
const FEMALE_NAMES = [
  "زينب علي","فاطمة حسن","نور محمد","سارة أحمد","مريم عبدالله",
  "هدى خالد","رنا إبراهيم","لمى حسين","دنيا سعد","ريم عمر",
  "هناء طاهر","سلمى نزار","ميساء جاسم","وسن ناصر","شروق صالح",
];
const ALL_NAMES = [...MALE_NAMES, ...FEMALE_NAMES];

// ── بيانات طبية حسب التخصص ────────────────────────────────────
const MEDICAL = {
  dentistry:         { complaints: ["ألم في الأسنان","تسوس","نزيف اللثة","كسر في السن","حساسية الأسنان"],        diagnoses: ["تسوس السن","التهاب اللثة","قلع السن","علاج عصب","تلبيس"],            treatments: ["Amoxicillin 500mg × 7 أيام","Ibuprofen 400mg","Metronidazole 250mg","Chlorhexidine Mouthwash"] },
  gynecology:        { complaints: ["آلام دورة شهرية","متابعة حمل","إفرازات غير طبيعية","فحص دوري","غثيان"],     diagnoses: ["متابعة حمل طبيعي","التهاب الحوض","كيس مبيض","فقر الدم","التهاب المسالك"],  treatments: ["Folic Acid 5mg","Iron Supplement","Amoxicillin 500mg","Progesterone 200mg"] },
  pediatrics:        { complaints: ["حرارة","سعال","قيء وإسهال","بكاء مستمر","التهاب اللوزتين"],               diagnoses: ["التهاب البلعوم","إنفلونزا","التهاب الأذن الوسطى","تطعيم دوري","التهاب المعدة"], treatments: ["Paracetamol Syrup","Amoxicillin Suspension","ORS","Azithromycin"] },
  dermatology:       { complaints: ["حكة جلدية","بثور","احمرار الجلد","تساقط الشعر","جفاف الجلد"],              diagnoses: ["حساسية جلدية","التهاب جلدي","صدفية","فطريات","حب الشباب"],               treatments: ["Hydrocortisone Cream","Clotrimazole Cream","Doxycycline 100mg","Cetirizine 10mg"] },
  cardiology:        { complaints: ["ألم الصدر","خفقان","ضيق تنفس","دوخة","ارتفاع ضغط"],                      diagnoses: ["ارتفاع ضغط الدم","اضطراب نبض","قصور قلبي","ذبحة صدرية","انتفاخ الأوردة"],    treatments: ["Amlodipine 5mg","Metoprolol 50mg","Aspirin 81mg","Atorvastatin 20mg"] },
  ophthalmology:     { complaints: ["ضعف البصر","احمرار العين","دموع مستمرة","ألم في العين","حساسية للضوء"],     diagnoses: ["قصر نظر","التهاب الملتحمة","جلوكوما","كتاراكت","جفاف العين"],              treatments: ["قطرة Tobramycin","Artificial Tears","قطرة Timolol","نظارات طبية"] },
  orthopedics:       { complaints: ["ألم الظهر","ألم الركبة","تورم المفاصل","صعوبة المشي","إصابة رياضية"],       diagnoses: ["انزلاق غضروفي","خشونة الركبة","التهاب المفاصل","كسر","تمزق رباط"],          treatments: ["Ibuprofen 600mg","Diclofenac Gel","Calcium + Vit D","Methocarbamol 750mg"] },
  internal_medicine: { complaints: ["تعب عام","سكر مرتفع","ضغط مرتفع","آلام بطن","فقدان وزن"],                 diagnoses: ["داء السكري النوع 2","ارتفاع ضغط الدم","التهاب المعدة","فقر الدم","قصور الغدة"], treatments: ["Metformin 500mg","Omeprazole 20mg","Enalapril 5mg","Ferrous Sulfate"] },
};

// ── علاجات الأسنان للخريطة ──────────────────────────────────────
const TOOTH_TREATMENTS = ["filling","extraction","rootCanal","crown","cleaning"];
const TOOTH_NUMBERS = [11,12,13,14,15,16,21,22,23,24,25,26,31,32,33,34,35,36,41,42,43,44,45,46];

const passwordHash = await bcrypt.hash("Demo1234!", 10);
const trialExpiry  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

// ── إنشاء العيادات ────────────────────────────────────────────
for (const [i, c] of CLINICS.entries()) {
  const num = i + 1;
  console.log(`[${num}/10] ${c.name}`);

  // تحقق من وجود مسبق
  const ex = await db.query('SELECT id FROM "Clinic" WHERE "whatsappNumber"=$1', [c.phone]);
  if (ex.rows.length) {
    console.log("  ⏭  موجودة — تخطي\n");
    continue;
  }

  const clinicId = cuid();
  const userId   = cuid();
  const subId    = cuid();

  // إنشاء العيادة
  await db.query(
    `INSERT INTO "Clinic"(id,name,"whatsappNumber",specialty,"specialtyOnboardingRequired","botEnabled",address,"doctorDegree","createdAt")
     VALUES($1,$2,$3,$4,false,true,$5,$6,NOW())`,
    [clinicId, c.name, c.phone, c.specialty, c.address, c.degree]
  );

  // المستخدم (طبيب) مع email
  await db.query(
    `INSERT INTO "User"(id,"clinicId",email,"passwordHash",role,"createdAt")
     VALUES($1,$2,$3,$4,'doctor',NOW())`,
    [userId, clinicId, c.email, passwordHash]
  );

  // الاشتراك التجريبي
  await db.query(
    `INSERT INTO "Subscription"(id,"clinicId",plan,status,"startDate","expiresAt","createdAt")
     VALUES($1,$2,'trial','trial',NOW(),$3,NOW())`,
    [subId, clinicId, trialExpiry]
  );

  // إعدادات التخصص
  await db.query(
    `INSERT INTO clinic_settings(clinic_id,specialty_code,setup_completed,updated_at)
     VALUES($1,$2,true,NOW()) ON CONFLICT(clinic_id) DO UPDATE SET specialty_code=$2`,
    [clinicId, c.specialty]
  );

  // ساعات العمل (السبت-الأربعاء + الجمعة)
  for (const day of [0, 1, 2, 3, 4, 6]) {
    const start = pick(["09:00","10:00"]);
    const end   = pick(["17:00","18:00","19:00"]);
    await db.query(
      `INSERT INTO "WorkingHours"(id,"clinicId","dayOfWeek","startTime","endTime","isOpen")
       VALUES($1,$2,$3,$4,$5,true)`,
      [cuid(), clinicId, day, start, end]
    );
  }

  // ── 25 مريض ──────────────────────────────────────────────
  const med = MEDICAL[c.specialty] || MEDICAL.internal_medicine;

  for (let p = 0; p < 25; p++) {
    const patientId   = cuid();
    const patientName = ALL_NAMES[p % ALL_NAMES.length];
    const patientPhone = `0780${String(i).padStart(2,"0")}${String(p + 1).padStart(4,"0")}`;

    await db.query(
      `INSERT INTO "Patient"(id,"clinicId",name,"whatsappPhone","createdAt")
       VALUES($1,$2,$3,$4,NOW()) ON CONFLICT DO NOTHING`,
      [patientId, clinicId, patientName, patientPhone]
    );

    // 2-3 مواعيد سابقة مكتملة
    const pastCount = 2 + Math.floor(Math.random() * 2);
    for (let a = 0; a < pastCount; a++) {
      const apptId = cuid();
      const date   = randomPast(120);
      await db.query(
        `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
         VALUES($1,$2,$3,$4,'completed',$5,'done',NOW())`,
        [apptId, clinicId, patientId, date, p + 1]
      );
      // سجل طبي لكل موعد مكتمل
      await db.query(
        `INSERT INTO "MedicalRecord"(id,"clinicId","patientId",date,complaint,diagnosis,prescription,notes,"specialtyCode","createdAt")
         VALUES($1,$2,$3,$4,$5,$6,$7,'مراجعة منتظمة',$8,NOW())`,
        [cuid(), clinicId, patientId, date,
         pick(med.complaints), pick(med.diagnoses),
         pick(med.treatments), c.specialty]
      );
    }

    // موعد قادم لـ 70% من المرضى
    if (Math.random() < 0.7) {
      await db.query(
        `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
         VALUES($1,$2,$3,$4,'confirmed',$5,'waiting',NOW())`,
        [cuid(), clinicId, patientId, randomFuture(20), p + 101]
      );
    }

    // خريطة أسنان للعيادات السنية (50% من المرضى)
    if (c.specialty === "dentistry" && Math.random() < 0.5) {
      const toothCount = 2 + Math.floor(Math.random() * 4);
      const usedTeeth  = new Set();
      for (let t = 0; t < toothCount; t++) {
        let tooth;
        do { tooth = pick(TOOTH_NUMBERS); } while (usedTeeth.has(tooth));
        usedTeeth.add(tooth);
        await db.query(
          `INSERT INTO "ToothTreatment"(id,"clinicId","patientId","toothNumber",treatment,notes,"createdAt")
           VALUES($1,$2,$3,$4,$5,$6,NOW())`,
          [cuid(), clinicId, patientId, tooth, pick(TOOTH_TREATMENTS),
           Math.random() < 0.4 ? pick(["تم بنجاح","يحتاج متابعة","مكتمل"]) : null]
        );
      }
    }
  }

  // ── مواعيد اليوم (8 مرضى) لاختبار الطابور ──────────────────
  const todayPatients = await db.query(
    `SELECT id FROM "Patient" WHERE "clinicId"=$1 ORDER BY "createdAt" LIMIT 8`,
    [clinicId]
  );
  for (const [ti, row] of todayPatients.rows.entries()) {
    const slot   = TODAY_SLOTS[ti];
    const status = ti < 2 ? "completed" : ti === 2 ? "confirmed" : "confirmed";
    const qStatus = ti < 2 ? "done" : ti === 2 ? "current" : "waiting";
    await db.query(
      `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
       VALUES($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT DO NOTHING`,
      [cuid(), clinicId, row.id, slot, status, ti + 1, qStatus]
    );
  }

  console.log(`  ✅ 25 مريض + 8 حجوزات اليوم + سجلات طبية${c.specialty === "dentistry" ? " + خريطة أسنان" : ""}\n`);
}

await db.end();

console.log("═══════════════════════════════════════════");
console.log("🎉 اكتمل إنشاء البيانات التجريبية");
console.log("═══════════════════════════════════════════");
console.log("");
console.log("📋 بيانات الدخول:");
console.log("──────────────────────────────────────────");
console.log("🦷 عيادات الأسنان (4 عيادات):");
console.log("   dental1@demo.com → عيادة أسنان د. أحمد الجبوري");
console.log("   dental2@demo.com → عيادة أسنان د. سارة العبيدي");
console.log("   dental3@demo.com → عيادة أسنان د. كريم الحسيني");
console.log("   dental4@demo.com → عيادة أسنان د. محمود التكريتي");
console.log("");
console.log("🏥 تخصصات أخرى (6 عيادات):");
console.log("   clinic5@demo.com  → عيادة نسائية د. ليلى الشمري");
console.log("   clinic6@demo.com  → عيادة أطفال د. نور الدليمي");
console.log("   clinic7@demo.com  → عيادة جلدية د. علي العزاوي");
console.log("   clinic8@demo.com  → عيادة قلبية د. ريم الراوي");
console.log("   clinic9@demo.com  → عيادة عيون د. حسن المشهداني");
console.log("   clinic10@demo.com → عيادة باطنية د. فاطمة الكربلائي");
console.log("");
console.log("🔑 كلمة المرور لجميعهم: Demo1234!");
console.log("──────────────────────────────────────────");
console.log("📊 الإجمالي: 10 عيادات × 25 مريض = 250 مريض");
console.log("📅 مواعيد اليوم: 8 لكل عيادة = 80 حجز جاهز للاختبار");
console.log("   المريض 1-2: مكتمل ✅  |  المريض 3: حالي 🔵  |  4-8: انتظار ⏳");
