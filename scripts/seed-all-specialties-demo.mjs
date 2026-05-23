/**
 * Demo simulation seed for all specialties.
 *
 * Creates:
 * - 11 demo clinics, one per specialty
 * - 20 patients per clinic
 * - past, today's, and upcoming appointments
 * - specialty medical records
 * - patient attachments: labs, x-rays, prescriptions, other
 * - specialty annotations / dental tooth treatments where relevant
 *
 * Run:
 *   node scripts/seed-all-specialties-demo.mjs
 *
 * Login:
 *   demo.<specialty>@clinicplt.test
 *   password: Demo1234!
 */

import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

for (const envFile of [".env.production", ".env"]) {
  try {
    const content = readFileSync(join(rootDir, envFile), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
    break;
  } catch {}
}

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { Client } = require("pg");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const db = new Client({ connectionString });
await db.connect();

const PASSWORD = "Demo1234!";
const passwordHash = await bcrypt.hash(PASSWORD, 10);

function cuid() {
  return `c${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function dateAt(dayOffset, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function isoDate(dayOffset) {
  return dateAt(dayOffset, 9).toISOString().slice(0, 10);
}

const CLINICS = [
  {
    code: "general_medicine",
    slug: "general",
    name: "عيادة طب عام د. عمر السامرائي",
    doctorDegree: "بورد طب الأسرة",
    doctorUniversity: "كلية الطب - جامعة بغداد",
    doctorBoard: "اختصاص طب الأسرة والطب العام",
    address: "بغداد - المنصور - شارع 14 رمضان",
    phone: "07770100001",
  },
  {
    code: "dentistry",
    slug: "dentistry",
    name: "عيادة أسنان د. أحمد الجبوري",
    doctorDegree: "دكتوراه طب الأسنان",
    doctorUniversity: "كلية طب الأسنان - جامعة بغداد",
    doctorBoard: "اختصاص علاج الأسنان التحفظي",
    address: "بغداد - الكرادة - قرب مستشفى الراهبات",
    phone: "07770100002",
  },
  {
    code: "gynecology",
    slug: "gynecology",
    name: "عيادة نسائية وتوليد د. ليلى الشمري",
    doctorDegree: "بورد نسائية وتوليد",
    doctorUniversity: "كلية الطب - الجامعة المستنصرية",
    doctorBoard: "اختصاص نسائية وتوليد وعقم",
    address: "بغداد - الحارثية - شارع الكندي",
    phone: "07770100003",
  },
  {
    code: "pediatrics",
    slug: "pediatrics",
    name: "عيادة أطفال د. نور الدليمي",
    doctorDegree: "بورد طب الأطفال",
    doctorUniversity: "كلية الطب - جامعة النهرين",
    doctorBoard: "اختصاص نمو وتغذية الأطفال",
    address: "بغداد - زيونة - قرب مول الربيعي",
    phone: "07770100004",
  },
  {
    code: "dermatology",
    slug: "dermatology",
    name: "عيادة جلدية د. علي العزاوي",
    doctorDegree: "ماجستير أمراض جلدية",
    doctorUniversity: "كلية الطب - جامعة الموصل",
    doctorBoard: "اختصاص الجلدية والحساسية",
    address: "بغداد - الأعظمية - شارع الضباط",
    phone: "07770100005",
  },
  {
    code: "aesthetic",
    slug: "aesthetic",
    name: "عيادة تجميل د. مريم الراوي",
    doctorDegree: "دبلوم طب تجميلي",
    doctorUniversity: "كلية الطب - جامعة بغداد",
    doctorBoard: "اختصاص الليزر والحقن التجميلي",
    address: "أربيل - عنكاوا - شارع 100",
    phone: "07770100006",
  },
  {
    code: "cardiology",
    slug: "cardiology",
    name: "عيادة قلب د. ريم التكريتي",
    doctorDegree: "بورد أمراض القلب",
    doctorUniversity: "كلية الطب - جامعة تكريت",
    doctorBoard: "اختصاص القلب والأوعية الدموية",
    address: "تكريت - حي القادسية - قرب المستشفى",
    phone: "07770100007",
  },
  {
    code: "ophthalmology",
    slug: "ophthalmology",
    name: "عيادة عيون د. حسن المشهداني",
    doctorDegree: "ماجستير طب العيون",
    doctorUniversity: "كلية الطب - جامعة بغداد",
    doctorBoard: "اختصاص الشبكية وتصحيح النظر",
    address: "بغداد - اليرموك - شارع الأربع شوارع",
    phone: "07770100008",
  },
  {
    code: "orthopedics",
    slug: "orthopedics",
    name: "عيادة عظام د. قاسم الحيالي",
    doctorDegree: "بورد جراحة العظام والكسور",
    doctorUniversity: "كلية الطب - جامعة الموصل",
    doctorBoard: "اختصاص المفاصل والإصابات الرياضية",
    address: "الموصل - حي الجامعة - قرب مستشفى السلام",
    phone: "07770100009",
  },
  {
    code: "internal_medicine",
    slug: "internal",
    name: "عيادة باطنية د. فاطمة الكربلائي",
    doctorDegree: "بورد الطب الباطني",
    doctorUniversity: "كلية الطب - جامعة كربلاء",
    doctorBoard: "اختصاص السكري والضغط والأمراض المزمنة",
    address: "كربلاء - حي الحسين - شارع المستشفى",
    phone: "07770100010",
  },
  {
    code: "surgery",
    slug: "surgery",
    name: "عيادة جراحة عامة د. سعد العبيدي",
    doctorDegree: "بورد الجراحة العامة",
    doctorUniversity: "كلية الطب - جامعة الأنبار",
    doctorBoard: "اختصاص جراحة عامة وناظورية",
    address: "الرمادي - شارع الأطباء",
    phone: "07770100011",
  },
];

const PATIENT_NAMES = [
  "أحمد محمد علي", "سارة عبد الله حسن", "مصطفى كريم جاسم", "زينب علي حسين", "عمر خالد ناصر",
  "مريم سامي طارق", "حسين فاضل عباس", "نور هيثم وليد", "يوسف صباح محمود", "هدى قاسم جلال",
  "علي مازن صالح", "رنا إياد حامد", "كرار نزار مهدي", "لمى فراس عادل", "باسم حيدر رشيد",
  "دنيا مؤيد كاظم", "محمد سلام داود", "ريم أنور خليل", "حسن رائد عبد", "شروق حامد ياسين",
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "O+", "O-"];
const ALLERGIES = ["لا توجد", "حساسية بنسلين", "حساسية أسبرين", "حساسية أطعمة بحرية", "غبار وموسمية"];
const CHRONIC = ["لا توجد", "سكري", "ضغط", "ربو", "قصور درقية", "قولون عصبي"];

const RECORDS = {
  general_medicine: {
    complaints: ["حمى وسعال", "ألم بطن", "صداع متكرر", "تعب عام", "ألم حلق"],
    diagnoses: ["التهاب تنفسي علوي", "التهاب معدة", "صداع توتري", "فقر دم خفيف", "التهاب بلعوم"],
    prescriptions: ["Paracetamol 500mg عند الحاجة", "Omeprazole 20mg صباحاً", "ORS عند الحاجة", "Amoxicillin 500mg ثلاث مرات"],
    content: () => ({
      duration: "3 أيام",
      vital_signs: "ضغط 120/80، حرارة 37.8، نبض 82",
      physical_exam: "فحص عام مستقر، لا علامات خطورة",
      treatment_plan: "راحة وسوائل ومراجعة خلال أسبوع عند استمرار الأعراض",
      referral: "لا يحتاج تحويل حالياً",
    }),
  },
  dentistry: {
    complaints: ["ألم ضرس", "نزيف لثة", "كسر سن", "حساسية أسنان", "تنظيف جير"],
    diagnoses: ["تسوس عميق", "التهاب لثة", "كسر تاج السن", "حساسية عنقية", "جير والتهاب بسيط"],
    prescriptions: ["Amoxicillin 500mg ثلاث مرات", "Ibuprofen 400mg عند الألم", "Chlorhexidine mouthwash مرتين"],
    content: () => ({
      tooth_chart: "36 MOD، 16 caries",
      gum_exam: "احمرار ونزف بسيط عند الفحص",
      xray: "أشعة بانوراما: تسوس عميق دون كسر جذري",
      treatment_plan: "تنظيف + حشوة ضوئية + مراجعة بعد أسبوعين",
    }),
  },
  gynecology: {
    complaints: ["متابعة حمل", "آلام دورة", "إفرازات", "سونار دوري", "تأخر دورة"],
    diagnoses: ["حمل طبيعي", "عسر طمث", "التهاب مهبلي", "كيس مبيض بسيط", "متابعة تبويض"],
    prescriptions: ["Folic acid 5mg يومياً", "Iron supplement يومياً", "Progesterone 200mg حسب الحاجة"],
    content: () => ({
      lmp: isoDate(-70),
      pregnancy_status: "حامل",
      gestational_age: "10 أسابيع",
      ultrasound: "جنين حي داخل الرحم، نبض جيد، السائل طبيعي",
      followup_plan: "زيارة متابعة بعد 4 أسابيع مع تحاليل روتينية",
    }),
  },
  pediatrics: {
    complaints: ["حمى", "سعال", "إسهال", "متابعة نمو", "تطعيمات"],
    diagnoses: ["التهاب تنفسي علوي", "نزلة معوية", "متابعة نمو طبيعي", "التهاب أذن", "تطعيم دوري"],
    prescriptions: ["Paracetamol syrup حسب الوزن", "ORS بعد كل إسهال", "Vitamin D drops يومياً"],
    content: () => ({
      weight: "14",
      height: "96",
      temperature: "38.2",
      vaccination_status: "مكتملة حسب العمر، الجرعة القادمة بعد شهرين",
      growth_notes: "الوزن والطول ضمن المجال الطبيعي",
    }),
  },
  dermatology: {
    complaints: ["حكة جلدية", "حب شباب", "طفح جلدي", "بقع بيضاء", "تساقط شعر"],
    diagnoses: ["أكزيما", "حب شباب درجة ثانية", "التهاب جلد تماسي", "فطريات جلدية", "ثعلبة موضعية"],
    prescriptions: ["Cetirizine 10mg مساءً", "Clotrimazole cream مرتين", "Benzoyl peroxide gel مساءً"],
    content: () => ({
      lesion_location: "الوجه والذراعين",
      lesion_type: "Papule",
      lesion_size: "2x3 سم",
      itching: "متوسطة",
      progress: "تحسن جزئي بعد العلاج الموضعي",
    }),
  },
  aesthetic: {
    complaints: ["تجاعيد الجبهة", "فيلر شفاه", "ليزر إزالة شعر", "نضارة بشرة", "جلسة متابعة"],
    diagnoses: ["Dynamic wrinkles", "Lip augmentation", "Laser hair reduction", "Skin booster", "Post-procedure follow-up"],
    prescriptions: ["Sunscreen SPF 50 يومياً", "Cold compress عند الحاجة", "Gentle cleanser مرتين يومياً"],
    content: () => ({
      procedure_type: "Botulinum toxin",
      treatment_area: "الجبهة",
      product_used: "Botox 50 units",
      consent: "تم شرح الفوائد والمخاطر ووقّع",
      review_plan: "مراجعة بعد أسبوعين مع صور بعد الإجراء",
    }),
  },
  cardiology: {
    complaints: ["خفقان", "ألم صدر", "ارتفاع ضغط", "ضيق نفس", "متابعة قلب"],
    diagnoses: ["Hypertension", "Arrhythmia", "Stable Angina", "Heart Failure follow-up", "Palpitation"],
    prescriptions: ["Amlodipine 5mg صباحاً", "Bisoprolol 5mg صباحاً", "Aspirin 81mg يومياً"],
    content: () => ({
      blood_pressure: "145/90",
      pulse: "88",
      ecg: "إيقاع جيبي، لا تغيرات حادة",
      echo: "EF 60%، الصمامات ضمن الطبيعي",
      cardiac_plan: "متابعة الضغط يومياً وإعادة ECG بعد شهر",
    }),
  },
  ophthalmology: {
    complaints: ["ضعف نظر", "احمرار العين", "ألم عين", "فحص ضغط العين", "وصفة نظارات"],
    diagnoses: ["Myopia", "Conjunctivitis", "Dry eye", "Ocular hypertension", "Refractive error"],
    prescriptions: ["Artificial tears أربع مرات", "Moxifloxacin drops كل 6 ساعات", "Timolol 0.5% مساءً"],
    content: () => ({
      va_right: "6/12",
      va_left: "6/9",
      iop_right: "17",
      iop_left: "16",
      glasses_rx: "OD -1.25 / OS -1.00",
    }),
  },
  orthopedics: {
    complaints: ["ألم ركبة", "ألم أسفل الظهر", "التواء كاحل", "ألم كتف", "متابعة كسر"],
    diagnoses: ["خشونة ركبة", "Low Back Pain", "Ankle sprain", "Rotator cuff syndrome", "Fracture follow-up"],
    prescriptions: ["Diclofenac 50mg مرتين", "Calcium + Vitamin D", "Methocarbamol 750mg ليلاً"],
    content: () => ({
      pain_location: "الركبة اليمنى",
      range_of_motion: "ثني محدود مع ألم متوسط",
      xray: "لا كسر حاد، خشونة خفيفة",
      procedure_plan: "علاج محافظ ومتابعة",
      rehab_plan: "تمارين تقوية وعلاج طبيعي 6 جلسات",
    }),
  },
  internal_medicine: {
    complaints: ["سكر مرتفع", "ضغط مرتفع", "تعب عام", "آلام معدة", "متابعة مزمنة"],
    diagnoses: ["Type 2 Diabetes", "Hypertension", "GERD", "Anemia", "Hypothyroidism"],
    prescriptions: ["Metformin 500mg مرتين", "Amlodipine 5mg صباحاً", "Omeprazole 20mg صباحاً"],
    content: () => ({
      chronic_conditions: "سكري وضغط",
      hba1c: "7.4",
      fasting_glucose: "145",
      lab_summary: "HbA1c 7.4، Creatinine 0.9، CBC مستقر",
      treatment_plan: "تنظيم السكر والضغط ومراجعة بعد شهر",
    }),
  },
  surgery: {
    complaints: ["جرح بعد عملية", "خراج", "فتق", "ألم بعد إجراء", "متابعة غيار"],
    diagnoses: ["Post-op wound follow-up", "Abscess", "Inguinal hernia", "Wound infection", "Minor procedure"],
    prescriptions: ["Ceftriaxone 1g حسب الحاجة", "Metronidazole 500mg", "Paracetamol عند الألم"],
    content: () => ({
      procedure: "فتح وتنظيف خراج بسيط",
      wound_exam: "جرح نظيف، لا نزف، إفراز بسيط",
      anesthesia_notes: "تخدير موضعي دون مضاعفات",
      post_op_plan: "غيار يومي ومراجعة بعد 3 أيام",
    }),
  },
};

const ANNOTATIONS = {
  dermatology: [
    ["chest", "آفة جلدية", "#ef4444"],
    ["abdomen", "حكة", "#f97316"],
  ],
  aesthetic: [
    ["forehead", "بوتوكس", "#8b5cf6"],
    ["lips", "فيلر", "#ec4899"],
  ],
  cardiology: [
    ["left_ventricle", "متابعة", "#1d4ed8"],
    ["aortic_valve", "صمام", "#f97316"],
  ],
  ophthalmology: [
    ["OD_post_tr", "ضغط عين", "#475569"],
    ["OS_post_tl", "متابعة", "#0891b2"],
  ],
  orthopedics: [
    ["right_knee", "ألم", "#ef4444"],
    ["lumbar_spine", "حركة محدودة", "#f97316"],
  ],
  internal_medicine: [
    ["liver", "متابعة تحاليل", "#eab308"],
    ["heart", "ضغط", "#ef4444"],
  ],
  gynecology: [
    ["uterus", "متابعة حمل", "#10b981"],
    ["r_ovary", "سونار", "#8b5cf6"],
  ],
  pediatrics: [
    ["head", "حرارة", "#f97316"],
    ["abdomen", "ألم", "#ef4444"],
  ],
  general_medicine: [
    ["chest", "شكوى", "#ef4444"],
    ["abdomen", "ألم", "#f97316"],
  ],
  surgery: [
    ["abdomen", "موضع إجراء", "#dc2626"],
    ["r_arm", "جرح", "#f97316"],
  ],
};

const ATTACHMENTS = [
  ["lab", "تحليل CBC", "Hb 13.4، WBC 7.2، Platelets 245"],
  ["xray", "أشعة/صورة تشخيصية", "ملاحظة تجريبية للملف الشعاعي"],
  ["prescription", "وصفة محفوظة", "نسخة من الوصفة الطبية داخل ملف المريض"],
  ["other", "مستند آخر", "موافقة أو تقرير مختصر مرفق بالملف"],
];

const TOOTH_TREATMENTS = ["filling", "extraction", "rootCanal", "crown", "cleaning", "implant"];
const TOOTH_NUMBERS = [11, 12, 16, 21, 24, 31, 36, 41, 44, 46];

async function query(sql, params = []) {
  return db.query(sql, params);
}

async function ensureClinic(clinic) {
  const existing = await query('SELECT id FROM "Clinic" WHERE "whatsappNumber"=$1', [clinic.phone]);
  let clinicId = existing.rows[0]?.id;
  if (!clinicId) {
    clinicId = cuid();
    await query(
      `INSERT INTO "Clinic"(id,name,"whatsappNumber",specialty,"specialtyOnboardingRequired","botEnabled",address,"doctorDegree","doctorUniversity","doctorBoard","createdAt")
       VALUES($1,$2,$3,$4,false,true,$5,$6,$7,$8,NOW())`,
      [clinicId, clinic.name, clinic.phone, clinic.code, clinic.address, clinic.doctorDegree, clinic.doctorUniversity, clinic.doctorBoard]
    );
  } else {
    await query(
      `UPDATE "Clinic"
       SET name=$2, specialty=$3, "specialtyOnboardingRequired"=false, address=$4, "doctorDegree"=$5, "doctorUniversity"=$6, "doctorBoard"=$7
       WHERE id=$1`,
      [clinicId, clinic.name, clinic.code, clinic.address, clinic.doctorDegree, clinic.doctorUniversity, clinic.doctorBoard]
    );
  }

  await query(
    `INSERT INTO clinic_settings(clinic_id,specialty_code,setup_completed,updated_at)
     VALUES($1,$2,true,NOW())
     ON CONFLICT(clinic_id) DO UPDATE SET specialty_code=$2, setup_completed=true, updated_at=NOW()`,
    [clinicId, clinic.code]
  );

  await query(
    `INSERT INTO "Subscription"(id,"clinicId",plan,status,"startDate","expiresAt","createdAt")
     VALUES($1,$2,'vip','active',NOW(),$3,NOW())
     ON CONFLICT("clinicId") DO UPDATE SET plan='vip', status='active', "expiresAt"=$3`,
    [cuid(), clinicId, dateAt(365, 23, 59)]
  );

  const email = `demo.${clinic.slug}@clinicplt.test`;
  await query(
    `INSERT INTO "User"(id,"clinicId",email,"passwordHash",role,"createdAt")
     VALUES($1,$2,$3,$4,'doctor',NOW())
     ON CONFLICT(email) DO UPDATE SET "clinicId"=$2, "passwordHash"=$4, role='doctor'`,
    [cuid(), clinicId, email, passwordHash]
  );

  for (const day of [0, 1, 2, 3, 4, 6]) {
    await query(
      `INSERT INTO "WorkingHours"(id,"clinicId","dayOfWeek","startTime","endTime","isOpen")
       VALUES($1,$2,$3,'09:00','17:00',true)
       ON CONFLICT("clinicId","dayOfWeek") DO UPDATE SET "startTime"='09:00', "endTime"='17:00', "isOpen"=true`,
      [cuid(), clinicId, day]
    );
  }

  return clinicId;
}

async function resetDemoPatientData(clinicId, clinicIndex) {
  const phonePrefix = `0777${String(clinicIndex + 1).padStart(2, "0")}`;
  const patients = await query(
    `SELECT id FROM "Patient" WHERE "clinicId"=$1 AND "whatsappPhone" LIKE $2`,
    [clinicId, `${phonePrefix}%`]
  );
  const ids = patients.rows.map((row) => row.id);
  if (!ids.length) return;
  await query('DELETE FROM "Appointment" WHERE "patientId" = ANY($1)', [ids]);
  await query('DELETE FROM "PatientPayment" WHERE "patientId" = ANY($1)', [ids]);
  await query('DELETE FROM "MedicalRecord" WHERE "patientId" = ANY($1)', [ids]);
  await query('DELETE FROM "PatientAttachment" WHERE "patientId" = ANY($1)', [ids]);
  await query('DELETE FROM "ToothTreatment" WHERE "patientId" = ANY($1)', [ids]);
  await query('DELETE FROM "SpecialtyAnnotation" WHERE "patientId" = ANY($1)', [ids]);
}

async function createPatient(clinicId, clinicIndex, patientIndex) {
  const phone = `0777${String(clinicIndex + 1).padStart(2, "0")}${String(patientIndex + 1).padStart(4, "0")}`;
  const existing = await query(
    `SELECT id FROM "Patient" WHERE "clinicId"=$1 AND "whatsappPhone"=$2`,
    [clinicId, phone]
  );
  const name = PATIENT_NAMES[patientIndex % PATIENT_NAMES.length];
  const bloodType = pick(BLOOD_TYPES);
  const allergy = pick(ALLERGIES);
  const chronic = pick(CHRONIC);

  if (existing.rows[0]?.id) {
    await query(
      `UPDATE "Patient"
       SET name=$3, "bloodType"=$4, allergies=$5, "chronicConditions"=$6, "currentMedications"=$7, "surgicalHistory"=$8, "smokingStatus"=$9
       WHERE id=$1 AND "clinicId"=$2`,
      [
        existing.rows[0].id,
        clinicId,
        name,
        bloodType,
        allergy === "لا توجد" ? [] : [allergy],
        chronic === "لا توجد" ? [] : [chronic],
        chronic === "ضغط" ? ["Amlodipine 5mg"] : chronic === "سكري" ? ["Metformin 500mg"] : [],
        patientIndex % 5 === 0 ? "عملية زائدة دودية سابقة" : null,
        patientIndex % 3 === 0 ? "غير مدخن" : "غير معروف",
      ]
    );
    return existing.rows[0].id;
  }

  const patientId = cuid();
  await query(
    `INSERT INTO "Patient"(id,"clinicId",name,"whatsappPhone","bloodType",allergies,"chronicConditions","currentMedications","surgicalHistory","smokingStatus","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
    [
      patientId,
      clinicId,
      name,
      phone,
      bloodType,
      allergy === "لا توجد" ? [] : [allergy],
      chronic === "لا توجد" ? [] : [chronic],
      chronic === "ضغط" ? ["Amlodipine 5mg"] : chronic === "سكري" ? ["Metformin 500mg"] : [],
      patientIndex % 5 === 0 ? "عملية زائدة دودية سابقة" : null,
      patientIndex % 3 === 0 ? "غير مدخن" : "غير معروف",
    ]
  );
  return patientId;
}

async function createAppointmentsAndFiles(clinic, clinicId, patientId, patientIndex) {
  const data = RECORDS[clinic.code] ?? RECORDS.general_medicine;
  const complaint = pick(data.complaints);
  const diagnosis = pick(data.diagnoses);
  const prescription = pick(data.prescriptions);
  const contentJson = {
    chief_complaint: complaint,
    diagnosis,
    prescription,
    notes: "بيانات تجريبية لمحاكاة تشغيل العيادة",
    ...data.content(),
  };

  const pastDate = dateAt(-((patientIndex % 15) + 1), 9 + (patientIndex % 7), patientIndex % 2 ? 30 : 0);
  const todayDate = dateAt(0, 9 + (patientIndex % 8), patientIndex % 2 ? 30 : 0);
  const futureDate = dateAt((patientIndex % 14) + 1, 10 + (patientIndex % 6), patientIndex % 2 ? 15 : 45);

  await query(
    `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
     VALUES($1,$2,$3,$4,'completed',$5,'done',NOW())`,
    [cuid(), clinicId, patientId, pastDate, patientIndex + 1]
  );
  await query(
    `INSERT INTO "MedicalRecord"(id,"clinicId","patientId",date,complaint,diagnosis,prescription,notes,"followUpDate","specialtyCode","contentJson","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
    [
      cuid(),
      clinicId,
      patientId,
      pastDate,
      complaint,
      diagnosis,
      prescription,
      "ملف تجريبي يحتوي على تفاصيل حسب الاختصاص.",
      futureDate,
      clinic.code,
      JSON.stringify(contentJson),
    ]
  );

  if (patientIndex < 10) {
    await query(
      `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
       VALUES($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [
        cuid(),
        clinicId,
        patientId,
        todayDate,
        patientIndex < 2 ? "completed" : "confirmed",
        patientIndex + 1,
        patientIndex < 2 ? "done" : patientIndex === 2 ? "current" : "waiting",
      ]
    );
  }

  await query(
    `INSERT INTO "Appointment"(id,"clinicId","patientId",date,status,"queueNumber","queueStatus","createdAt")
     VALUES($1,$2,$3,$4,'confirmed',NULL,'waiting',NOW())`,
    [cuid(), clinicId, patientId, futureDate]
  );

  for (const [type, title, notes] of ATTACHMENTS) {
    await query(
      `INSERT INTO "PatientAttachment"(id,"clinicId","patientId",type,title,notes,"fileUrl","fileName","fileType",date,"createdAt")
       VALUES($1,$2,$3,$4,$5,$6,NULL,NULL,NULL,$7,NOW())`,
      [cuid(), clinicId, patientId, type, title, notes, pastDate]
    );
  }

  await query(
    `INSERT INTO "PatientPayment"(id,"clinicId","patientId",amount,note,"createdAt")
     VALUES($1,$2,$3,$4,$5,NOW())`,
    [cuid(), clinicId, patientId, 25000 + (patientIndex % 5) * 5000, "دفعة تجريبية"]
  );
}

async function createSpecialtyExtras(clinic, clinicId, patientId, patientIndex) {
  if (clinic.code === "dentistry") {
    for (let i = 0; i < 3; i++) {
      await query(
        `INSERT INTO "ToothTreatment"(id,"clinicId","patientId","toothNumber",treatment,notes,"createdAt")
         VALUES($1,$2,$3,$4,$5,$6,NOW())`,
        [
          cuid(),
          clinicId,
          patientId,
          TOOTH_NUMBERS[(patientIndex + i) % TOOTH_NUMBERS.length],
          TOOTH_TREATMENTS[(patientIndex + i) % TOOTH_TREATMENTS.length],
          "علاج تجريبي على خريطة الأسنان",
        ]
      );
    }
    return;
  }

  const annotations = ANNOTATIONS[clinic.code] ?? [];
  for (const [regionId, label, color] of annotations) {
    await query(
      `INSERT INTO "SpecialtyAnnotation"(id,"clinicId","patientId","specialtyCode","regionId",label,color,notes,"createdAt")
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT("clinicId","patientId","specialtyCode","regionId")
       DO UPDATE SET label=$6, color=$7, notes=$8`,
      [cuid(), clinicId, patientId, clinic.code, regionId, label, color, "ملاحظة تجريبية على الخريطة"]
    );
  }
}

console.log("بدء إنشاء بيانات المحاكاة لكل الاختصاصات...");
console.log(`كلمة المرور لكل الأطباء: ${PASSWORD}\n`);

let totalPatients = 0;
let totalAppointments = 0;

for (const [clinicIndex, clinic] of CLINICS.entries()) {
  await query("BEGIN");
  try {
    const clinicId = await ensureClinic(clinic);
    await resetDemoPatientData(clinicId, clinicIndex);

    for (let patientIndex = 0; patientIndex < 20; patientIndex++) {
      const patientId = await createPatient(clinicId, clinicIndex, patientIndex);
      await createAppointmentsAndFiles(clinic, clinicId, patientId, patientIndex);
      await createSpecialtyExtras(clinic, clinicId, patientId, patientIndex);
      totalPatients++;
      totalAppointments += patientIndex < 10 ? 3 : 2;
    }

    await query("COMMIT");
    console.log(`تم: ${clinic.name} — 20 مريض — ${clinic.code}`);
  } catch (error) {
    await query("ROLLBACK");
    console.error(`فشل إنشاء بيانات ${clinic.name}`);
    throw error;
  }
}

await db.end();

console.log("\nاكتملت المحاكاة.");
console.log(`العيادات: ${CLINICS.length}`);
console.log(`المرضى: ${totalPatients}`);
console.log(`الحجوزات: ${totalAppointments}`);
console.log(`المرفقات: ${totalPatients * ATTACHMENTS.length}`);
console.log("\nبيانات الدخول:");
for (const clinic of CLINICS) {
  console.log(`demo.${clinic.slug}@clinicplt.test  |  ${clinic.name}`);
}
console.log(`\nكلمة المرور: ${PASSWORD}`);
