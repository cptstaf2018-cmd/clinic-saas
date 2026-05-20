/**
 * Seed: 15 appointments per clinic with specialty-specific medical records
 * Run: node prisma/seed-specialty-demo.mjs
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, "../.env");
try {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch { console.warn("No .env — using environment variables"); }

const require = createRequire(import.meta.url);
const { PrismaClient } = await import("../app/generated/prisma/index.js");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ── Patient names pool ────────────────────────────────────────────────────────
const PATIENT_NAMES = [
  "محمد علي حسن",   "أحمد خالد عمر",   "فاطمة محمد علي",  "زينب أحمد حسن",
  "عمر إبراهيم",    "يوسف كريم سالم",  "مريم نور الدين",  "سارة عبدالله",
  "علي حسين جاسم",  "هدى طارق وليد",   "ريم خالد فارس",  "ليلى عمر سامر",
  "حسن محمود باسم", "نور رياض ماجد",   "أمل فؤاد جلال",
];

// ── Specialty-specific medical record data ────────────────────────────────────
const SPECIALTY_RECORDS = {
  dentistry: [
    {
      complaint: "ألم حاد في الضرس السفلي الأيسر",
      diagnosis: "Dental Caries (Grade III)",
      prescription: "Amoxicillin 500mg — 3 مرات يومياً لمدة 5 أيام\nIbuprofen 400mg — عند الحاجة",
      contentJson: {
        chief_complaint: "ألم حاد في الضرس السفلي الأيسر",
        tooth_chart: "36 MOD — حشوة عميقة",
        gum_exam: "التهاب لثة معتدل في المنطقة السفلية اليسرى",
        xray: "تسوس عميق يصل قريباً من العصب، لا كسر",
        treatment_plan: "حشوة مركبة + متابعة بعد أسبوعين",
        diagnosis: "Dental Caries (Grade III)",
        prescription: "Amoxicillin 500mg — 3 مرات يومياً\nIbuprofen 400mg عند الحاجة",
      }
    },
    {
      complaint: "تنظيف جير وفحص دوري",
      diagnosis: "Gingivitis",
      prescription: "Chlorhexidine mouthwash — مرتين يومياً",
      contentJson: {
        chief_complaint: "تنظيف جير وفحص دوري",
        tooth_chart: "حالة عامة جيدة — بعض الجير على الأسنان الأمامية",
        gum_exam: "احمرار خفيف في اللثة، نزف عند التنظيف",
        xray: "لا تسوس — عظم سليم",
        treatment_plan: "تنظيف جير كامل + تعليم نظافة فموية",
        diagnosis: "Gingivitis",
        prescription: "Chlorhexidine mouthwash — مرتين يومياً لأسبوعين",
      }
    },
    {
      complaint: "ألم شديد جداً في الضرس العلوي الأيمن منذ يومين",
      diagnosis: "Acute Pulpitis — يستدعي علاج عصب",
      prescription: "Amoxicillin 500mg ثلاثاً\nIbuprofen 400mg كل 6 ساعات\nParacetamol 1000mg عند الحاجة",
      contentJson: {
        chief_complaint: "ألم شديد جداً في الضرس العلوي الأيمن",
        tooth_chart: "16 — تسوس واسع يصل العصب",
        gum_exam: "لا التهاب لثوي — السن المسبب محدد",
        xray: "تسوس يصل غرفة اللب — ظل حول الذروة",
        treatment_plan: "علاج قناة الجذر (3 جلسات) + تلبيس نهائي",
        diagnosis: "Acute Pulpitis",
        prescription: "Amoxicillin 500mg ثلاثاً\nIbuprofen 400mg كل 6 ساعات",
      }
    },
  ],
  dermatology: [
    {
      complaint: "طفح جلدي على الوجه والصدر منذ أسبوع",
      diagnosis: "Acne Vulgaris (Grade II)",
      prescription: "Benzoyl Peroxide 2.5% gel — مرة مساءً\nClindamycin lotion — صباحاً",
      contentJson: {
        chief_complaint: "طفح جلدي على الوجه والصدر",
        lesion_location: "الوجه (الخدين والجبهة) والصدر العلوي",
        lesion_duration: "أسبوع — تفاقمت خلال 3 أيام",
        itching: "خفيفة",
        skin_images: "صور التوثيق: صورة الوجه + صورة الصدر",
        progress: "جديدة — لم تُعالج سابقاً",
        diagnosis: "Acne Vulgaris (Grade II)",
        prescription: "Benzoyl Peroxide 2.5% — مساءً\nClindamycin lotion — صباحاً",
      }
    },
    {
      complaint: "حكة شديدة وجلد جاف منتشر على الذراعين والساقين",
      diagnosis: "Atopic Dermatitis (Eczema)",
      prescription: "Hydrocortisone 1% cream — مرتين يومياً أسبوع\nCetirizine 10mg — مرة يومياً\nMoisturizer كثيف — عدة مرات",
      contentJson: {
        chief_complaint: "حكة شديدة وجلد جاف على الذراعين والساقين",
        lesion_location: "الذراعان (الداخل) والساقان (الركبتان وخلف الكوعين)",
        lesion_duration: "3 أسابيع — موسمية متكررة",
        itching: "شديدة",
        skin_images: "توثيق مناطق الإكزيما قبل العلاج",
        progress: "تفاقمت في فصل الشتاء — تاريخ مزمن",
        diagnosis: "Atopic Dermatitis",
        prescription: "Hydrocortisone 1% cream\nCetirizine 10mg يومياً\nMoisturizer كثيف",
      }
    },
    {
      complaint: "بقع بيضاء متعددة على الجلد",
      diagnosis: "Vitiligo — مراحل مبكرة",
      prescription: "Tacrolimus 0.1% ointment — مرتين يومياً\nواقي شمس SPF 50+",
      contentJson: {
        chief_complaint: "بقع بيضاء على الرسغين والرقبة",
        lesion_location: "الرسغان — الرقبة — مؤخرة اليدين",
        lesion_duration: "شهرين — تتوسع ببطء",
        itching: "لا توجد",
        skin_images: "توثيق البقع البيضاء — مقاس وموقع",
        progress: "بدأت صغيرة وتوسعت — لا ألم",
        diagnosis: "Vitiligo (early stage)",
        prescription: "Tacrolimus 0.1% ointment\nواقي شمس SPF 50+",
      }
    },
  ],
  pediatrics: [
    {
      complaint: "حمى مستمرة منذ يومين + سعال",
      diagnosis: "Upper Respiratory Tract Infection (URTI)",
      prescription: "Paracetamol syrup 250mg/5ml — 10ml كل 6 ساعات\nNasal saline drops — 3 مرات",
      contentJson: {
        chief_complaint: "حمى منذ يومين وسعال جاف",
        weight: "18",
        height: "112",
        temperature: "38.7",
        vaccination_status: "مكتملة للعمر — آخر تطعيم MMR قبل شهرين",
        growth_chart: "وزن ضمن المعدل الطبيعي للعمر 6 سنوات",
        diagnosis: "URTI",
        prescription: "Paracetamol syrup — 10ml كل 6 ساعات\nSaline nasal drops",
      }
    },
    {
      complaint: "إسهال وقيء منذ أمس — الطفل خامل",
      diagnosis: "Acute Gastroenteritis",
      prescription: "ORS sachets — بعد كل إسهال\nZinc syrup 10mg — مرة يومياً 10 أيام",
      contentJson: {
        chief_complaint: "إسهال وقيء منذ أمس — خمول",
        weight: "12",
        height: "95",
        temperature: "37.9",
        vaccination_status: "متأخرة في Rotavirus — يُنصح باللحاق",
        growth_chart: "وزن منخفض قليلاً — يحتاج متابعة تغذية",
        diagnosis: "Acute Gastroenteritis",
        prescription: "ORS بعد كل إسهال\nZinc 10mg يومياً 10 أيام",
      }
    },
    {
      complaint: "فحص نمو دوري + استفسار عن التطعيمات",
      diagnosis: "Well-Child Visit — Normal",
      prescription: "Vitamin D drops 400 IU — يومياً",
      contentJson: {
        chief_complaint: "فحص نمو دوري — الطفل بصحة جيدة",
        weight: "8.5",
        height: "71",
        temperature: "36.8",
        vaccination_status: "DTP الثالثة قبل أسبوع — الجرعة القادمة في 12 شهراً",
        growth_chart: "وزن وطول ضمن النسبة المئوية 50 للعمر 8 أشهر",
        diagnosis: "Well-Child Visit — Normal Growth",
        prescription: "Vitamin D drops 400 IU يومياً",
      }
    },
  ],
  gynecology: [
    {
      complaint: "متابعة حمل — أسبوع 28",
      diagnosis: "Pregnancy Follow-up — Third Trimester",
      prescription: "Ferrous sulfate 200mg — مرة يومياً\nFolic acid 5mg — يومياً\nCalcium 500mg — مرتين",
      contentJson: {
        chief_complaint: "متابعة حمل منتظمة — أسبوع 28",
        lmp: new Date(Date.now() - 196 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        pregnancy_status: "حامل",
        gestational_age: "28 أسبوع + 0 أيام",
        ultrasound: "جنين حي واحد — وضع مقعدي — وزن تقديري 1050غ — السائل الأمنيوسي طبيعي — المشيمة خلفية",
        followup_plan: "زيارة بعد 4 أسابيع — اختبار GBS أسبوع 36",
        diagnosis: "Pregnancy Follow-up (28w)",
        prescription: "Ferrous sulfate 200mg\nFolic acid 5mg\nCalcium 500mg مرتين",
      }
    },
    {
      complaint: "آلام دورة شهرية شديدة",
      diagnosis: "Primary Dysmenorrhea",
      prescription: "Ibuprofen 400mg — كل 8 ساعات أيام الدورة\nNaproxen 250mg بديل",
      contentJson: {
        chief_complaint: "آلام شديدة مع الدورة الشهرية منذ سنتين",
        lmp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        pregnancy_status: "غير حامل",
        gestational_age: "",
        ultrasound: "رحم وملاحق طبيعية — لا أكياس — لا ليفية",
        followup_plan: "متابعة بعد 3 أشهر — تقييم استجابة العلاج",
        diagnosis: "Primary Dysmenorrhea",
        prescription: "Ibuprofen 400mg كل 8 ساعات\nNaproxen 250mg بديل",
      }
    },
    {
      complaint: "تأكيد حمل + أول زيارة",
      diagnosis: "Pregnancy — First Trimester (8 weeks)",
      prescription: "Folic acid 5mg — يومياً\nVitamin B6 25mg للغثيان\nFerrous sulfate 200mg",
      contentJson: {
        chief_complaint: "تأكيد حمل — غثيان صباحي",
        lmp: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        pregnancy_status: "حامل",
        gestational_age: "8 أسابيع",
        ultrasound: "كيس حملي داخل الرحم — نبض جنين إيجابي 168 npm — CRL 17mm",
        followup_plan: "مسح NT أسبوع 12 — تحاليل شاملة",
        diagnosis: "Early Pregnancy (8w) — Normal",
        prescription: "Folic acid 5mg\nVitamin B6 25mg صباحاً\nFerrous sulfate 200mg",
      }
    },
  ],
  ophthalmology: [
    {
      complaint: "ضعف في النظر عن بعد — صعوبة في رؤية السبورة",
      diagnosis: "Myopia (قصر النظر)",
      prescription: "Artificial tears — 4 مرات يومياً",
      contentJson: {
        chief_complaint: "ضعف رؤية عن بعد — صعوبة رؤية السبورة",
        visual_acuity: "6/18 OD — 6/24 OS",
        eye_pressure: "14 mmHg OD / 13 mmHg OS",
        slit_lamp_exam: "قرنية وعدسة سليمتان — لا التهاب",
        fundus_exam: "قاع عين طبيعي — حليمة بصرية سليمة",
        glasses_prescription: "OD: SPH -1.75 CYL -0.50 AXIS 180\nOS: SPH -2.25 CYL -0.75 AXIS 175\nVA with Rx: 6/6 bilateral",
        diagnosis: "Myopia OU",
        prescription: "وصفة نظارات\nArtificial tears 4 مرات يومياً",
      }
    },
    {
      complaint: "احمرار وحرقة في العينين منذ أسبوع",
      diagnosis: "Bacterial Conjunctivitis",
      prescription: "Moxifloxacin 0.5% drops — قطرة كل 4 ساعات 5 أيام",
      contentJson: {
        chief_complaint: "احمرار وإفراز أصفر في العينين",
        visual_acuity: "6/6 OD — 6/6 OS (مع إفراز)",
        eye_pressure: "13 mmHg OD / 14 mmHg OS",
        slit_lamp_exam: "احمرار ملتحمة واضح — إفراز مخاطي قيحي — لا تأثر للقرنية",
        fundus_exam: "طبيعي",
        glasses_prescription: "",
        diagnosis: "Bacterial Conjunctivitis — Bilateral",
        prescription: "Moxifloxacin 0.5% drops كل 4 ساعات 5 أيام",
      }
    },
    {
      complaint: "فحص دوري + ارتفاع ضغط العين في السابق",
      diagnosis: "Ocular Hypertension — متابعة جلوكوما",
      prescription: "Timolol 0.5% drops — مرة مساءً (مستمر)",
      contentJson: {
        chief_complaint: "فحص دوري — تاريخ ارتفاع ضغط العين",
        visual_acuity: "6/9 OD — 6/6 OS",
        eye_pressure: "24 mmHg OD / 19 mmHg OS",
        slit_lamp_exam: "طبيعي — لا التهاب — قرنية صافية",
        fundus_exam: "حليمة بصرية يمنى: C/D ratio 0.6 — حافة عصبية منقوصة قليلاً",
        glasses_prescription: "OD: SPH +0.50\nOS: PLANO",
        diagnosis: "Ocular Hypertension OD — Glaucoma Suspect",
        prescription: "Timolol 0.5% drops مساءً (مستمر)\nمتابعة ميدان بصري كل 6 أشهر",
      }
    },
  ],
  orthopedics: [
    {
      complaint: "ألم أسفل الظهر مزمن يمتد للساق اليسرى",
      diagnosis: "Lumbar Disc Herniation (L4-L5)",
      prescription: "Diclofenac 50mg — مرتين يومياً مع الطعام\nMethocarbamol 750mg — مرة ليلاً\nCalcium + Vitamin D",
      contentJson: {
        chief_complaint: "ألم أسفل الظهر مزمن يمتد للساق اليسرى",
        pain_location: "أسفل الظهر (قطني) — يمتد عبر الأرداف للساق اليسرى (L4-L5 distribution)",
        range_of_motion: "ثني الجذع محدود — امتداد مؤلم — Straight Leg Raise إيجابي 45° يسار",
        xray: "MRI قطني: انزلاق غضروفي L4-L5 مع ضغط على جذر العصب الأيسر",
        procedure_plan: "علاج محافظ 6 أسابيع — إذا لم يستجب: حقن epidural",
        rehab_plan: "علاج طبيعي: تمارين تقوية العمود الفقري — 3 جلسات أسبوعياً",
        diagnosis: "Lumbar Disc Herniation L4-L5",
        prescription: "Diclofenac 50mg مرتين\nMethocarbamol 750mg ليلاً",
      }
    },
    {
      complaint: "ألم حاد في الركبة اليمنى بعد إصابة رياضية",
      diagnosis: "ACL Tear (Partial) — Knee Right",
      prescription: "Ibuprofen 400mg — كل 8 ساعات\nجل ديكلوفيناك — موضعي\nرباط داعم للركبة",
      contentJson: {
        chief_complaint: "إصابة ركبة يمنى أثناء كرة القدم — ألم حاد وتورم",
        pain_location: "الركبة اليمنى — الجانب الداخلي — مؤلمة عند الحمل",
        range_of_motion: "ثني 90° (مؤلم) — امتداد كامل — Lachman test إيجابي — Drawer test مشكوك",
        xray: "MRI ركبة: تمزق جزئي في الرباط الصليبي الأمامي (ACL) — لا تمزق كامل",
        procedure_plan: "تثبيت + تحميل محمي 3 أسابيع — إعادة تقييم بعد الالتهاب",
        rehab_plan: "علاج طبيعي مكثف: تقوية عضلة الفخذ + تمارين توازن — 8 أسابيع",
        diagnosis: "Partial ACL Tear — Right Knee",
        prescription: "Ibuprofen 400mg كل 8 ساعات\nجل ديكلوفيناك موضعي",
      }
    },
    {
      complaint: "ألم مزمن في الكتف الأيمن — صعوبة الرفع",
      diagnosis: "Rotator Cuff Syndrome",
      prescription: "Diclofenac 50mg مرتين\nCorticosteroid injection موضعي (اليوم)",
      contentJson: {
        chief_complaint: "ألم مزمن كتف أيمن يمنع رفع الذراع فوق الرأس",
        pain_location: "الكتف الأيمن — يمتد للذراع — يزداد ليلاً",
        range_of_motion: "رفع أمامي 120° (مؤلم) — تبعيد 90° (مؤلم) — دوران داخلي محدود",
        xray: "أشعة سينية: لا كسر — بعض التكلسات — MRI: تمزق جزئي في الوتر الفوق شوكي",
        procedure_plan: "حقن corticosteroid داخل المفصل + فيزيوثيرابيا — إعادة تقييم 6 أسابيع",
        rehab_plan: "تمارين تقوية مكسة الدوران — تمديد المحفظة — 12 جلسة",
        diagnosis: "Rotator Cuff Syndrome — Partial Supraspinatus Tear",
        prescription: "Diclofenac 50mg مرتين مع الطعام\nCorticosteroid injection",
      }
    },
  ],
  cardiology: [
    {
      complaint: "ارتفاع ضغط الدم — متابعة دورية",
      diagnosis: "Hypertension Stage 2 — Controlled",
      prescription: "Amlodipine 10mg — مرة صباحاً\nPerindopril 5mg — مرة صباحاً\nAtorvastatin 20mg — مساءً",
      contentJson: {
        chief_complaint: "متابعة ضغط الدم — دوخة خفيفة أحياناً",
        blood_pressure: "148/94",
        pulse: "78",
        ecg: "إيقاع جيبي طبيعي — لا تغييرات جديدة",
        echo: "وظيفة بطين أيسر محفوظة — EF 62% — لا اعتلال صمامي",
        cardiac_plan: "مواصلة الدواء الحالي — متابعة بعد شهر — قياس BP يومي في المنزل",
        diagnosis: "Hypertension Stage 2",
        prescription: "Amlodipine 10mg صباحاً\nPerindopril 5mg صباحاً\nAtorvastatin 20mg مساءً",
      }
    },
    {
      complaint: "خفقان قلب متكرر",
      diagnosis: "Paroxysmal Atrial Fibrillation",
      prescription: "Bisoprolol 5mg — مرة صباحاً\nRivaroxaban 20mg — مساءً مع الطعام",
      contentJson: {
        chief_complaint: "خفقان قلب متكرر منذ أسبوعين — يستمر دقائق",
        blood_pressure: "132/82",
        pulse: "94",
        ecg: "رجفان أذيني متقطع — معدل بطيني 92 npm — لا موجة P — QRS ضيق",
        echo: "EF 58% — لا خثرة في الأذين الأيسر — لا اعتلال صمامي شديد",
        cardiac_plan: "مراقبة Holter 48 ساعة — كومادين أو Rivaroxaban — تقييم لتحريق",
        diagnosis: "Paroxysmal Atrial Fibrillation",
        prescription: "Bisoprolol 5mg صباحاً\nRivaroxaban 20mg مساءً مع الطعام",
      }
    },
    {
      complaint: "ضيق تنفس عند المجهود + ألم صدر",
      diagnosis: "Stable Angina Pectoris",
      prescription: "Aspirin 100mg — مرة صباحاً\nAtorvastatin 40mg — مساءً\nNitroglycerine SL — عند الحاجة",
      contentJson: {
        chief_complaint: "ضيق تنفس عند المشي السريع + ضغط خفيف في الصدر",
        blood_pressure: "136/86",
        pulse: "72",
        ecg: "ST depression خفيف في V4-V6 — بدون ألم حالياً — موجة T معكوسة",
        echo: "EF 55% — اضطراب حركة جدار بطيني أيسر خفيف",
        cardiac_plan: "تحويل لقسطرة قلب — تمارين خفيفة فقط — متابعة أسبوعية",
        diagnosis: "Stable Angina — CAD Suspected",
        prescription: "Aspirin 100mg صباحاً\nAtorvastatin 40mg مساءً\nNitroglycerine SL عند الألم",
      }
    },
  ],
  internal_medicine: [
    {
      complaint: "متابعة سكري + ضغط دم مرتفع",
      diagnosis: "Type 2 Diabetes + Hypertension",
      prescription: "Metformin 1000mg — مرتين يومياً\nGliclazide MR 60mg — صباحاً\nRamipril 5mg — صباحاً",
      contentJson: {
        chief_complaint: "متابعة دورية — سكري وضغط دم — مستقر",
        vitals: "ضغط: 142/88 — نبض: 76 — حرارة: 36.6 — وزن: 84 كغم",
        chronic_conditions: "داء السكري من النوع الثاني، ارتفاع ضغط الدم",
        lab_summary: "HbA1c: 7.8%\nFasting glucose: 148 mg/dL\nCreatinine: 1.1 mg/dL\nCholesterol: 218 mg/dL\nALT: 32 U/L\nHemoglobin: 13.2 g/dL",
        assessment: "سكري غير متحكم به — ضغط دم مرتفع قليلاً — كلى سليمة",
        treatment_plan: "زيادة جرعة Gliclazide — حمية غذائية — مشي 30 دقيقة يومياً",
        diagnosis: "T2DM + HTN — Suboptimal control",
        prescription: "Metformin 1000mg مرتين\nGliclazide MR 60mg صباحاً\nRamipril 5mg صباحاً",
      }
    },
    {
      complaint: "إرهاق شديد وشحوب",
      diagnosis: "Iron Deficiency Anemia",
      prescription: "Ferrous sulfate 200mg — مرتين يومياً\nVitamin C 500mg مع الحديد\nFolic acid 5mg",
      contentJson: {
        chief_complaint: "إرهاق شديد وشحوب وضيق تنفس خفيف عند المجهود",
        vitals: "ضغط: 108/68 — نبض: 96 — حرارة: 37.0 — وزن: 62 كغم",
        chronic_conditions: "فقر دم بالحديد",
        lab_summary: "Hemoglobin: 8.4 g/dL\nMCV: 68 fL (microcytic)\nSerum Ferritin: 4 ng/mL\nIron: 32 mcg/dL\nTIBC: 480 mcg/dL\nWBC: 6.2 ×10³",
        assessment: "فقر دم بالحديد شديد — يستدعي علاج فوري + بحث عن مصدر النزيف",
        treatment_plan: "حديد فموي 3 أشهر — تنظير هضمي إن استمر — فحص دوري كل شهر",
        diagnosis: "Iron Deficiency Anemia (Hgb 8.4)",
        prescription: "Ferrous sulfate 200mg مرتين\nVitamin C 500mg مع الحديد\nFolic acid 5mg",
      }
    },
    {
      complaint: "ألم في الغدة الدرقية + تعب",
      diagnosis: "Hypothyroidism",
      prescription: "Levothyroxine 50mcg — صباحاً على معدة فارغة",
      contentJson: {
        chief_complaint: "تعب مزمن + زيادة وزن + إمساك + برود",
        vitals: "ضغط: 118/74 — نبض: 58 — حرارة: 36.3 — وزن: 78 كغم",
        chronic_conditions: "قصور الغدة الدرقية",
        lab_summary: "TSH: 12.4 mIU/L (مرتفع)\nFree T4: 0.6 ng/dL (منخفض)\nAnti-TPO: إيجابي\nCholesterol: 242 mg/dL\nHemoglobin: 11.8 g/dL",
        assessment: "قصور درقية وظيفي مع تأثير على الكوليسترول والدم",
        treatment_plan: "Levothyroxine — مراجعة TSH بعد 6 أسابيع — رفع الجرعة تدريجياً",
        diagnosis: "Hypothyroidism — Hashimoto's Thyroiditis",
        prescription: "Levothyroxine 50mcg صباحاً على معدة فارغة",
      }
    },
  ],
};

// Fallback for unknown specialties
const DEFAULT_RECORDS = SPECIALTY_RECORDS.internal_medicine;

function getRecordsForSpecialty(code) {
  return SPECIALTY_RECORDS[code] ?? DEFAULT_RECORDS;
}

function randomDate(offsetDays, spread = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays + Math.floor(Math.random() * spread));
  d.setHours(8 + Math.floor(Math.random() * 9), Math.random() < 0.5 ? 0 : 30, 0, 0);
  return d;
}

async function seed() {
  console.log("🌱 بدء إضافة البيانات التجريبية...\n");

  const clinics = await db.clinic.findMany({
    include: { settings: true, subscription: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`📋 وُجد ${clinics.length} عيادات\n`);

  let totalAppts = 0;
  let totalRecords = 0;

  for (const clinic of clinics) {
    const specialtyCode = clinic.settings?.specialtyCode ?? clinic.specialty ?? "internal_medicine";
    const planName = clinic.subscription?.plan ?? "trial";
    console.log(`\n🏥 ${clinic.name} — تخصص: ${specialtyCode} — باقة: ${planName}`);

    // جلب مرضى موجودين أو إنشاء جدد
    let patients = await db.patient.findMany({
      where: { clinicId: clinic.id },
      take: 15,
    });

    if (patients.length < 15) {
      const needed = 15 - patients.length;
      const existingPhones = new Set(patients.map((p) => p.whatsappPhone));
      for (let j = 0; j < needed; j++) {
        const name = PATIENT_NAMES[j % PATIENT_NAMES.length];
        let phone = `079${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
        while (existingPhones.has(phone)) {
          phone = `079${String(Math.floor(Math.random() * 9000000) + 1000000)}`;
        }
        existingPhones.add(phone);
        try {
          const p = await db.patient.create({
            data: { clinicId: clinic.id, name, whatsappPhone: phone },
          });
          patients.push(p);
        } catch {
          // skip duplicate
        }
      }
    }

    if (patients.length === 0) {
      console.log(`   ⚠️  لا يوجد مرضى — تخطي`);
      continue;
    }

    const records = getRecordsForSpecialty(specialtyCode);

    // 15 حجز موزعة: 5 ماضية مكتملة، 3 اليوم، 7 مستقبلية
    const apptSlots = [
      // ماضية مكتملة (مع سجلات طبية)
      { offset: -14, status: "completed" },
      { offset: -10, status: "completed" },
      { offset: -7,  status: "completed" },
      { offset: -4,  status: "completed" },
      { offset: -2,  status: "completed" },
      // اليوم
      { offset: 0,   status: "confirmed" },
      { offset: 0,   status: "confirmed" },
      { offset: 0,   status: "pending" },
      // مستقبلية
      { offset: 2,   status: "confirmed" },
      { offset: 4,   status: "pending" },
      { offset: 7,   status: "pending" },
      { offset: 10,  status: "pending" },
      { offset: 14,  status: "pending" },
      { offset: 18,  status: "pending" },
      { offset: 21,  status: "pending" },
    ];

    let clinicAppts = 0;
    let clinicRecords = 0;

    for (let i = 0; i < apptSlots.length; i++) {
      const slot = apptSlots[i];
      const patient = patients[i % patients.length];
      const date = randomDate(slot.offset);

      try {
        const appt = await db.appointment.create({
          data: {
            clinicId: clinic.id,
            patientId: patient.id,
            date,
            status: slot.status,
            queueNumber: slot.offset === 0 ? i + 1 : null,
            queueStatus: slot.offset === 0 ? (i === 0 ? "current" : "waiting") : "waiting",
          },
        });
        clinicAppts++;

        // سجل طبي للحجوزات المكتملة والمؤكدة
        if (slot.status === "completed") {
          const rec = records[i % records.length];
          await db.medicalRecord.create({
            data: {
              clinicId: clinic.id,
              patientId: patient.id,
              date,
              complaint: rec.complaint,
              diagnosis: rec.diagnosis,
              prescription: rec.prescription,
              specialtyCode,
              contentJson: rec.contentJson,
            },
          });
          clinicRecords++;
        }
      } catch (err) {
        // skip conflicts
      }
    }

    console.log(`   ✅ ${clinicAppts} حجز + ${clinicRecords} سجل طبي`);
    totalAppts += clinicAppts;
    totalRecords += clinicRecords;
  }

  console.log(`\n✅ اكتمل:\n   ${totalAppts} حجز في ${clinics.length} عيادات\n   ${totalRecords} سجل طبي بيانات حقيقية`);
  await db.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
