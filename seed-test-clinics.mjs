import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, ".env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch {}

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const db = new Client({ connectionString: process.env.DIRECT_URL });
await db.connect();
console.log("✅ متصل بقاعدة البيانات");

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomDate(daysBack = 90) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function randomFuture(daysAhead = 14) {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  d.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
  return d;
}

const CLINICS = [
  { name: "عيادة د. أحمد الجبوري",     phone: "07901000001", specialty: "dentistry"         },
  { name: "عيادة د. سارة العبيدي",      phone: "07901000002", specialty: "gynecology"        },
  { name: "عيادة د. محمود التكريتي",    phone: "07901000003", specialty: "pediatrics"        },
  { name: "عيادة د. ليلى الشمري",       phone: "07901000004", specialty: "dermatology"       },
  { name: "عيادة د. كريم الحسيني",      phone: "07901000005", specialty: "cardiology"        },
  { name: "عيادة د. نور الدليمي",       phone: "07901000006", specialty: "ophthalmology"     },
  { name: "عيادة د. علي العزاوي",       phone: "07901000007", specialty: "orthopedics"       },
  { name: "عيادة د. ريم الراوي",        phone: "07901000008", specialty: "internal_medicine" },
  { name: "عيادة د. حسن المشهداني",     phone: "07901000009", specialty: "dentistry"         },
  { name: "عيادة د. فاطمة الكربلائي",  phone: "07901000010", specialty: "pediatrics"        },
];

const MALE_NAMES   = ["أحمد محمد","علي حسن","محمد عبدالله","عمر خالد","يوسف إبراهيم","حسين علي","كريم سعد","زيد عمر","باسم طاهر","سامر نزار","مصطفى جاسم","وليد ناصر","رامي صالح","تامر حسين","ماهر رشيد","فراس حامد","لؤي عادل","ياسر فاضل","منتظر كاظم","قاسم هادي","حيدر صادق","عباس موسى","جعفر رضا","ميثم محسن","علاء جواد","سجاد أمير","نصير بهاء","بلال عصام","رياض سمير","طارق نبيل"];
const FEMALE_NAMES = ["زينب علي","فاطمة حسن","نور محمد","سارة أحمد","مريم عبدالله","هدى خالد","رنا إبراهيم","لمى حسين","دنيا سعد","ريم عمر","هناء طاهر","سلمى نزار","ميساء جاسم","وسن ناصر","شروق صالح","رولا حسين","يسرى رشيد","ندى حامد","آمال عادل","سوسن فاضل","أمل كاظم","وفاء هادي","غادة صادق","إيمان موسى","نادية رضا","حنان محسن","رانيا جواد","سمر أمير","لينا بهاء","منى عصام"];

const DIAGNOSES = {
  dentistry:        ["Dental Caries","Gingivitis","Periodontitis","Tooth Extraction","Root Canal"],
  gynecology:       ["Normal Pregnancy","PCOS","UTI","Dysmenorrhea","Prenatal Visit"],
  pediatrics:       ["Upper Respiratory Infection","Fever","Gastroenteritis","Otitis Media","Vaccination"],
  dermatology:      ["Acne Vulgaris","Eczema","Psoriasis","Dermatitis","Fungal Infection"],
  cardiology:       ["Hypertension","Arrhythmia","Heart Failure","Chest Pain","Palpitations"],
  ophthalmology:    ["Myopia","Conjunctivitis","Glaucoma","Cataract","Dry Eye"],
  orthopedics:      ["Lumbar Disc","Knee Osteoarthritis","Fracture","Tendinitis","Scoliosis"],
  internal_medicine:["Diabetes Mellitus","Hypertension","Gastroenteritis","Anemia","Thyroid Disorder"],
};

const MEDICATIONS = ["Amoxicillin 500mg","Ibuprofen 400mg","Metformin 500mg","Omeprazole 20mg","Paracetamol 500mg","Amlodipine 5mg"];

const passwordHash = await bcrypt.hash("Test1234!", 10);
const trialExpiry  = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

for (const [i, c] of CLINICS.entries()) {
  console.log(`\n[${i+1}/10] ${c.name}...`);

  // Check if exists
  const ex = await db.query('SELECT id FROM "Clinic" WHERE "whatsappNumber"=$1', [c.phone]);
  if (ex.rows.length) { console.log("  موجودة — تخطي"); continue; }

  const clinicId = cuid();
  const userId   = cuid();
  const subId    = cuid();

  // Clinic
  await db.query(
    `INSERT INTO "Clinic"(id,name,"whatsappNumber",specialty,"specialtyOnboardingRequired","botEnabled","createdAt")
     VALUES($1,$2,$3,$4,false,true,NOW())`,
    [clinicId, c.name, c.phone, c.specialty]
  );

  // User
  await db.query(
    `INSERT INTO "User"(id,"clinicId","passwordHash",role,"createdAt") VALUES($1,$2,$3,'doctor',NOW())`,
    [userId, clinicId, passwordHash]
  );

  // Subscription (trial)
  await db.query(
    `INSERT INTO "Subscription"(id,"clinicId",plan,status,"startDate","expiresAt","createdAt")
     VALUES($1,$2,'trial','trial',NOW(),$3,NOW())`,
    [subId, clinicId, trialExpiry]
  );

  // ClinicSettings
  await db.query(
    `INSERT INTO clinic_settings(clinic_id, specialty_code, setup_completed, updated_at)
     VALUES($1,$2,true,NOW())
     ON CONFLICT(clinic_id) DO UPDATE SET specialty_code=$2`,
    [clinicId, c.specialty]
  );

  // WorkingHours (Sat=6,Sun=0,Mon=1,Tue=2,Wed=3,Thu=4)
  for (const day of [0,1,2,3,4,6]) {
    await db.query(
      `INSERT INTO "WorkingHours"(id,"clinicId","dayOfWeek","startTime","endTime","isOpen")
       VALUES($1,$2,$3,'09:00','17:00',true)`,
      [cuid(), clinicId, day]
    );
  }

  // 100 patients
  const allNames   = [...MALE_NAMES, ...FEMALE_NAMES];
  const diagnoses  = DIAGNOSES[c.specialty] || DIAGNOSES.internal_medicine;

  for (let p = 0; p < 100; p++) {
    const patientId    = cuid();
    const patientName  = allNames[p % allNames.length] + ` ${i+1}${p+1}`;
    const patientPhone = `079${String(i).padStart(2,'0')}${String(p+1).padStart(5,'0')}`;

    await db.query(
      `INSERT INTO "Patient"(id,"clinicId",name,"whatsappPhone","createdAt")
       VALUES($1,$2,$3,$4,NOW())
       ON CONFLICT DO NOTHING`,
      [patientId, clinicId, patientName, patientPhone]
    );

    // 2–4 past appointments
    const apptCount = 2 + Math.floor(Math.random() * 3);
    for (let a = 0; a < apptCount; a++) {
      const apptId = cuid();
      const date   = randomDate(120);
      const status = a < apptCount - 1
        ? pick(["completed","completed","cancelled"])
        : "pending";

      await db.query(
        `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
         VALUES($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [apptId, clinicId, patientId, date, status, p+1, status==="completed"?"done":"waiting"]
      );

      if (status === "completed") {
        await db.query(
          `INSERT INTO "MedicalRecord"(id,"clinicId","patientId",date,complaint,diagnosis,prescription,notes,"specialtyCode","contentJson","createdAt")
           VALUES($1,$2,$3,$4,$5,$6,$7,'مراجعة دورية',$8,$9,NOW())`,
          [cuid(), clinicId, patientId, date, `شكوى ${pick(diagnoses)}`, pick(diagnoses), pick(MEDICATIONS), c.specialty, JSON.stringify({ chief_complaint: `شكوى المريض` })]
        );
      }
    }

    // Future appointment for 60%
    if (Math.random() < 0.6) {
      await db.query(
        `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
         VALUES($1,$2,$3,$4,'confirmed',$5,'waiting',NOW())`,
        [cuid(), clinicId, patientId, randomFuture(30), p+101]
      );
    }
  }

  console.log(`  ✅ 100 مريض + مواعيد + سجلات`);
}

await db.end();
console.log("\n🎉 اكتمل! 10 عيادات × 100 مريض = 1000 مريض");
