/**
 * Full demo seed: clinics for every specialty + 15 appointments each
 * Run: node prisma/seed-full-demo.mjs
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
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
} catch { console.warn("لا يوجد .env — نستخدم المتغيرات الموجودة"); }

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { PrismaClient } = await import("../app/generated/prisma/index.js");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

// ── Clinic definitions — one per specialty ────────────────────────────────────
const CLINICS = [
  { name: "عيادة الأسنان التخصصية",        phone: "07701000001", specialty: "dentistry",        plan: "vip",      email: "dental@demo.clinic" },
  { name: "عيادة الجلدية والتجميل",          phone: "07701000002", specialty: "dermatology",      plan: "premium",  email: "derm@demo.clinic" },
  { name: "عيادة طب الأطفال",               phone: "07701000003", specialty: "pediatrics",       plan: "premium",  email: "peds@demo.clinic" },
  { name: "عيادة النسائية والتوليد",          phone: "07701000004", specialty: "gynecology",       plan: "vip",      email: "obgyn@demo.clinic" },
  { name: "عيادة العظام والمفاصل",           phone: "07701000005", specialty: "orthopedics",      plan: "premium",  email: "ortho@demo.clinic" },
  { name: "عيادة طب العيون",                phone: "07701000006", specialty: "ophthalmology",    plan: "premium",  email: "eye@demo.clinic" },
  { name: "عيادة القلب والأوعية",            phone: "07701000007", specialty: "cardiology",       plan: "vip",      email: "cardio@demo.clinic" },
  { name: "عيادة الباطنية والأمراض العامة",  phone: "07701000008", specialty: "internal_medicine",plan: "standard", email: "internal@demo.clinic" },
  { name: "عيادة الجراحة العامة",            phone: "07701000009", specialty: "surgery",          plan: "premium",  email: "surgery@demo.clinic" },
  { name: "مركز الرعاية الصحية",            phone: "07701000010", specialty: "internal_medicine",plan: "basic",    email: "general@demo.clinic" },
];

// ── Patient names ─────────────────────────────────────────────────────────────
const PATIENT_NAMES = [
  "محمد علي حسن",    "أحمد خالد عمر",   "فاطمة محمد علي",  "زينب أحمد حسن",
  "عمر إبراهيم سالم","يوسف كريم جاسم",  "مريم نور الدين",  "سارة عبدالله طارق",
  "علي حسين محمود",  "هدى طارق وليد",   "ريم خالد فارس",   "ليلى عمر سامر",
  "حسن محمود باسم",  "نور رياض ماجد",   "أمل فؤاد جلال",
];

// ── Medical records per specialty ─────────────────────────────────────────────
const SPECIALTY_RECORDS = {
  dentistry: [
    {
      complaint: "ألم حاد في الضرس السفلي الأيسر منذ يومين",
      diagnosis: "Acute Pulpitis — يستدعي علاج عصب",
      prescription: "Amoxicillin 500mg ثلاثاً × 5 أيام\nIbuprofen 400mg كل 6 ساعات",
      contentJson: { chief_complaint: "ألم حاد ضرس 36", tooth_chart: "36 — تسوس عميق يصل العصب", gum_exam: "لثة طبيعية — لا التهاب", xray: "ظل حول الذروة — لب مفتوح", treatment_plan: "علاج قناة الجذر 3 جلسات + تلبيس نهائي", diagnosis: "Acute Pulpitis", prescription: "Amoxicillin 500mg ثلاثاً\nIbuprofen 400mg كل 6 ساعات" }
    },
    {
      complaint: "تنظيف جير دوري + فحص الأسنان",
      diagnosis: "Chronic Gingivitis",
      prescription: "Chlorhexidine mouthwash مرتين يومياً × أسبوعين",
      contentJson: { chief_complaint: "تنظيف جير دوري", tooth_chart: "حالة عامة جيدة — جير متراكم أمامي", gum_exam: "احمرار خفيف لثة — نزف تلقائي", xray: "لا تسوس — عظم سليم", treatment_plan: "تنظيف كامل + تعليم نظافة فموية", diagnosis: "Chronic Gingivitis", prescription: "Chlorhexidine mouthwash مرتين × أسبوعين" }
    },
    {
      complaint: "ألم في منطقة الأرحاء العليا اليمنى",
      diagnosis: "Dental Caries Grade III — Tooth 16",
      prescription: "Ibuprofen 400mg عند الحاجة\nClove oil موضعي",
      contentJson: { chief_complaint: "ألم ضرس 16 عند العض", tooth_chart: "16 MOD — تسوس واسع", gum_exam: "طبيعية", xray: "تسوس يقترب من اللب — لا كسر", treatment_plan: "حشوة مركبة عميقة + متابعة شهر", diagnosis: "Dental Caries III (16)", prescription: "Ibuprofen 400mg عند الحاجة" }
    },
    {
      complaint: "حساسية شديدة للأطعمة الباردة والساخنة",
      diagnosis: "Dentin Hypersensitivity — Multiple Teeth",
      prescription: "Sensodyne toothpaste مرتين يومياً\nFluoride varnish تطبيق موضعي",
      contentJson: { chief_complaint: "حساسية شديدة للبرد والحرارة", tooth_chart: "أسنان أمامية علوية وسفلية — انحسار لثة", gum_exam: "انحسار لثة درجة I-II أمامي", xray: "لا تسوس — جذور مكشوفة جزئياً", treatment_plan: "فلورايد موضعي + Sensodyne + تعديل فرشاة الأسنان", diagnosis: "Dentin Hypersensitivity", prescription: "Sensodyne مرتين يومياً\nFluoride varnish" }
    },
    {
      complaint: "فقدان حشوة قديمة في الضرس السفلي الأيمن",
      diagnosis: "Lost Restoration — Tooth 46",
      prescription: "Clove oil موضعي ريثما الإصلاح\nParacetamol 500mg عند الحاجة",
      contentJson: { chief_complaint: "سقطت الحشوة القديمة من ضرس 46", tooth_chart: "46 — فراغ حشوة MOD + بقايا", gum_exam: "طبيعية حول 46", xray: "جدران سليمة — لا تسوس جديد", treatment_plan: "إزالة البقايا + حشوة مركبة جديدة", diagnosis: "Lost Restoration (46)", prescription: "Clove oil موضعي\nParacetamol 500mg عند الحاجة" }
    },
  ],
  dermatology: [
    {
      complaint: "طفح جلدي وحكة على الوجه والصدر منذ أسبوع",
      diagnosis: "Acne Vulgaris Grade II",
      prescription: "Benzoyl Peroxide 2.5% gel مساءً\nClindamycin lotion صباحاً",
      contentJson: { chief_complaint: "طفح أكني على الوجه والصدر", lesion_location: "الوجه (الخدان والجبهة) والصدر العلوي", lesion_duration: "أسبوع — تفاقمت خلال 3 أيام", itching: "خفيفة", skin_images: "توثيق: صورة وجه + صورة صدر", progress: "جديدة — لم تُعالج سابقاً", diagnosis: "Acne Vulgaris II", prescription: "Benzoyl Peroxide 2.5% مساءً\nClindamycin lotion صباحاً" }
    },
    {
      complaint: "حكة شديدة وجلد جاف على الذراعين والساقين",
      diagnosis: "Atopic Dermatitis (Eczema)",
      prescription: "Hydrocortisone 1% cream مرتين × أسبوع\nCetirizine 10mg يومياً\nMoisturizer كثيف",
      contentJson: { chief_complaint: "حكة شديدة وجلد جاف", lesion_location: "داخل الذراعين — خلف الركبتين", lesion_duration: "3 أسابيع — موسمية", itching: "شديدة", skin_images: "توثيق مناطق الإكزيما قبل العلاج", progress: "تفاقمت في الشتاء — تاريخ مزمن", diagnosis: "Atopic Dermatitis", prescription: "Hydrocortisone 1% مرتين\nCetirizine 10mg يومياً\nMoisturizer" }
    },
    {
      complaint: "بقع بيضاء على الرسغين والرقبة منذ شهرين",
      diagnosis: "Vitiligo — Early Stage",
      prescription: "Tacrolimus 0.1% ointment مرتين يومياً\nواقي شمس SPF 50+",
      contentJson: { chief_complaint: "بقع بيضاء تتوسع", lesion_location: "الرسغان — الرقبة — ظهر اليدين", lesion_duration: "شهران — تتوسع ببطء", itching: "لا توجد", skin_images: "توثيق البقع — قياس وموقع", progress: "بدأت صغيرة وانتشرت — لا ألم", diagnosis: "Vitiligo (Early)", prescription: "Tacrolimus 0.1% مرتين\nواقي شمس SPF 50+" }
    },
    {
      complaint: "حروق شمس شديدة على الكتفين والظهر",
      diagnosis: "Sunburn — Grade II",
      prescription: "Aloe vera gel مبرّد × 4 مرات\nIbuprofen 400mg كل 8 ساعات",
      contentJson: { chief_complaint: "احمرار وألم وتقشر بعد التعرض للشمس", lesion_location: "الكتفان — أعلى الظهر — الوجه", lesion_duration: "يومان", itching: "متوسطة", skin_images: "احمرار واضح مع فقاعات صغيرة", progress: "حادة — تحسن تدريجي متوقع خلال أسبوع", diagnosis: "Sunburn Grade II", prescription: "Aloe vera gel مبرّد\nIbuprofen 400mg كل 8 ساعات" }
    },
    {
      complaint: "نمش وتصبغات داكنة على الوجه والرقبة",
      diagnosis: "Melasma — Hormonal",
      prescription: "Hydroquinone 4% cream ليلاً × 3 أشهر\nSPF 50+ نهاراً",
      contentJson: { chief_complaint: "بقع داكنة وتصبغ على الوجه", lesion_location: "الخدان — الجبهة — الرقبة", lesion_duration: "6 أشهر — تفاقمت بعد الحمل", itching: "لا توجد", skin_images: "توثيق التصبغ قبل العلاج", progress: "مزمنة — مرتبطة بالحمل والشمس", diagnosis: "Melasma (Hormonal)", prescription: "Hydroquinone 4% ليلاً × 3 أشهر\nSPF 50+ نهاراً" }
    },
  ],
  pediatrics: [
    {
      complaint: "حمى مستمرة وسعال جاف منذ يومين",
      diagnosis: "Upper Respiratory Tract Infection",
      prescription: "Paracetamol syrup 250mg/5ml — 10ml كل 6 ساعات\nSaline nasal drops 3 مرات",
      contentJson: { chief_complaint: "حمى وسعال منذ يومين", weight: "18", height: "112", temperature: "38.7", vaccination_status: "مكتملة للعمر — آخر تطعيم MMR قبل شهرين", growth_chart: "وزن وطول ضمن النسبة 50 للعمر 6 سنوات", diagnosis: "URTI", prescription: "Paracetamol syrup 10ml كل 6 ساعات\nSaline nasal drops" }
    },
    {
      complaint: "إسهال وقيء منذ أمس — خمول وعطش",
      diagnosis: "Acute Gastroenteritis",
      prescription: "ORS بعد كل إسهال\nZinc syrup 10mg يومياً × 10 أيام",
      contentJson: { chief_complaint: "إسهال وقيء وخمول", weight: "12", height: "95", temperature: "37.9", vaccination_status: "متأخرة Rotavirus — يُنصح باللحاق", growth_chart: "وزن منخفض قليلاً — متابعة تغذية", diagnosis: "Acute Gastroenteritis", prescription: "ORS بعد كل إسهال\nZinc 10mg × 10 أيام" }
    },
    {
      complaint: "فحص نمو دوري — صحة جيدة",
      diagnosis: "Well-Child Visit — Normal",
      prescription: "Vitamin D drops 400 IU يومياً",
      contentJson: { chief_complaint: "فحص نمو دوري — طفل بصحة جيدة", weight: "8.5", height: "71", temperature: "36.8", vaccination_status: "DTP الثالثة قبل أسبوع — القادمة عند 12 شهراً", growth_chart: "وزن وطول ضمن النسبة 50 للعمر 8 أشهر", diagnosis: "Well-Child — Normal Growth", prescription: "Vitamin D drops 400 IU يومياً" }
    },
    {
      complaint: "طفح جلدي بعد أخذ مضاد حيوي",
      diagnosis: "Drug Allergy — Urticaria",
      prescription: "وقف المضاد الحيوي فوراً\nCetirizine syrup 5mg/5ml — 5ml يومياً\nHydrocortisone 1% موضعياً",
      contentJson: { chief_complaint: "طفح جلدي أحمر بعد Amoxicillin", weight: "20", height: "118", temperature: "37.1", vaccination_status: "مكتملة للعمر", growth_chart: "نمو طبيعي", diagnosis: "Drug Allergy — Urticaria (Penicillin)", prescription: "وقف Amoxicillin\nCetirizine syrup 5ml يومياً\nHydrocortisone موضعي" }
    },
    {
      complaint: "ألم أذن وحمى منذ يوم واحد",
      diagnosis: "Acute Otitis Media — Right Ear",
      prescription: "Amoxicillin syrup 250mg/5ml — 10ml ثلاثاً × 7 أيام\nParacetamol 10ml كل 6 ساعات",
      contentJson: { chief_complaint: "ألم أذن يمنى وحمى — يبكي كثيراً", weight: "15", height: "100", temperature: "39.2", vaccination_status: "مكتملة — لقاح PCV خُذ قبل 4 أشهر", growth_chart: "نمو طبيعي", diagnosis: "Acute Otitis Media — Right", prescription: "Amoxicillin syrup 10ml ثلاثاً × 7 أيام\nParacetamol كل 6 ساعات" }
    },
  ],
  gynecology: [
    {
      complaint: "متابعة حمل — أسبوع 28",
      diagnosis: "Normal Pregnancy — 28 Weeks",
      prescription: "Ferrous sulfate 200mg يومياً\nFolic acid 5mg يومياً\nCalcium 500mg مرتين",
      contentJson: { chief_complaint: "متابعة حمل منتظمة أسبوع 28", lmp: new Date(Date.now() - 196*86400000).toISOString().slice(0,10), pregnancy_status: "حامل", gestational_age: "28 أسبوع", ultrasound: "جنين حي — وضع رأسي — وزن تقديري 1050غ — سائل أمنيوسي طبيعي — مشيمة خلفية", followup_plan: "زيارة بعد 4 أسابيع — GBS أسبوع 36", diagnosis: "Normal Pregnancy 28w", prescription: "Ferrous sulfate 200mg\nFolic acid 5mg\nCalcium 500mg مرتين" }
    },
    {
      complaint: "آلام دورة شهرية شديدة",
      diagnosis: "Primary Dysmenorrhea",
      prescription: "Ibuprofen 400mg كل 8 ساعات أيام الدورة\nNaproxen 250mg بديل",
      contentJson: { chief_complaint: "آلام شديدة مع الدورة منذ سنتين", lmp: new Date(Date.now() - 14*86400000).toISOString().slice(0,10), pregnancy_status: "غير حامل", gestational_age: "", ultrasound: "رحم وملاحق طبيعية — لا أكياس — لا ليفية", followup_plan: "متابعة 3 أشهر — تقييم استجابة", diagnosis: "Primary Dysmenorrhea", prescription: "Ibuprofen 400mg كل 8 ساعات\nNaproxen 250mg بديل" }
    },
    {
      complaint: "تأكيد حمل + أول زيارة — غثيان صباحي",
      diagnosis: "Early Pregnancy — 8 Weeks",
      prescription: "Folic acid 5mg يومياً\nVitamin B6 25mg للغثيان\nFerrous sulfate 200mg",
      contentJson: { chief_complaint: "تأكيد حمل — غثيان صباحي شديد", lmp: new Date(Date.now() - 56*86400000).toISOString().slice(0,10), pregnancy_status: "حامل", gestational_age: "8 أسابيع", ultrasound: "كيس حملي داخل الرحم — نبض جنين 168 npm — CRL 17mm", followup_plan: "مسح NT أسبوع 12 — تحاليل شاملة", diagnosis: "Early Pregnancy 8w — Normal", prescription: "Folic acid 5mg\nVitamin B6 25mg صباحاً\nFerrous sulfate 200mg" }
    },
    {
      complaint: "كيس مبيض يميني مكتشف عبر السونار",
      diagnosis: "Right Ovarian Cyst — Functional",
      prescription: "Oral contraceptive (Yasmin) × 3 دورات للإذابة\nIbuprofen 400mg عند الحاجة",
      contentJson: { chief_complaint: "ألم خفيف أسفل البطن — كيس مبيض اكتُشف بالسونار", lmp: new Date(Date.now() - 21*86400000).toISOString().slice(0,10), pregnancy_status: "غير حامل", gestational_age: "", ultrasound: "كيس مبيض أيمن 4.5×3.8 سم — حدود واضحة — بسيط — لا حاجز", followup_plan: "إعادة سونار بعد 3 أشهر — إذا تضخم مراجعة جراح", diagnosis: "Functional Ovarian Cyst (Right)", prescription: "OCP Yasmin × 3 دورات\nIbuprofen 400mg عند الحاجة" }
    },
    {
      complaint: "انتظام الدورة الشهرية + طلب وسيلة منع حمل",
      diagnosis: "Family Planning Consultation",
      prescription: "OCP Yasmin — مرة يومياً من اليوم الأول للدورة",
      contentJson: { chief_complaint: "استشارة وسيلة منع حمل", lmp: new Date(Date.now() - 10*86400000).toISOString().slice(0,10), pregnancy_status: "غير حامل", gestational_age: "", ultrasound: "رحم طبيعي — مبيضان طبيعيان — لا أكياس", followup_plan: "متابعة بعد 3 أشهر للتقييم", diagnosis: "Family Planning — OCP", prescription: "OCP Yasmin يومياً من اليوم الأول" }
    },
  ],
  ophthalmology: [
    {
      complaint: "ضعف نظر عن بعد — صعوبة رؤية السبورة",
      diagnosis: "Myopia OU",
      prescription: "Artificial tears 4 مرات يومياً",
      contentJson: { chief_complaint: "ضعف رؤية عن بعد", visual_acuity: "6/18 OD — 6/24 OS", eye_pressure: "14 OD / 13 OS", slit_lamp_exam: "قرنية وعدسة سليمتان — لا التهاب", fundus_exam: "قاع عين طبيعي", glasses_prescription: "OD: SPH -1.75 CYL -0.50 AXIS 180\nOS: SPH -2.25 CYL -0.75 AXIS 175\nVA with Rx: 6/6", diagnosis: "Myopia OU", prescription: "وصفة نظارات\nArtificial tears 4 مرات" }
    },
    {
      complaint: "احمرار وحرقة وإفراز في العينين",
      diagnosis: "Bacterial Conjunctivitis",
      prescription: "Moxifloxacin 0.5% drops كل 4 ساعات × 5 أيام",
      contentJson: { chief_complaint: "احمرار وإفراز أصفر في العينين", visual_acuity: "6/6 OD — 6/6 OS", eye_pressure: "13 / 14", slit_lamp_exam: "احمرار ملتحمة — إفراز مخاطي قيحي — قرنية سليمة", fundus_exam: "طبيعي", glasses_prescription: "", diagnosis: "Bacterial Conjunctivitis Bilateral", prescription: "Moxifloxacin 0.5% كل 4 ساعات × 5 أيام" }
    },
    {
      complaint: "ارتفاع ضغط العين — متابعة جلوكوما",
      diagnosis: "Ocular Hypertension — Glaucoma Suspect",
      prescription: "Timolol 0.5% drops مساءً (مستمر)",
      contentJson: { chief_complaint: "فحص دوري — تاريخ ارتفاع ضغط العين", visual_acuity: "6/9 OD — 6/6 OS", eye_pressure: "24 OD / 19 OS", slit_lamp_exam: "طبيعي — لا التهاب", fundus_exam: "C/D ratio 0.6 OD — حافة عصبية منقوصة قليلاً", glasses_prescription: "OD: SPH +0.50\nOS: PLANO", diagnosis: "Ocular HTN — Glaucoma Suspect OD", prescription: "Timolol 0.5% مساءً (مستمر)\nمتابعة ميدان بصري كل 6 أشهر" }
    },
    {
      complaint: "ألم في العين اليمنى مع رهاب ضوء",
      diagnosis: "Anterior Uveitis — Right Eye",
      prescription: "Prednisolone drops كل ساعتين × أسبوع\nAtropine 1% drop مرتين × 5 أيام",
      contentJson: { chief_complaint: "ألم عين يمنى ورهاب ضوء منذ يومين", visual_acuity: "6/24 OD — 6/6 OS", eye_pressure: "8 OD / 15 OS", slit_lamp_exam: "خلايا في الغرفة الأمامية +++ — راشح — حدقة صغيرة", fundus_exam: "قاع عين يمنى مع احمرار قرصي خفيف", glasses_prescription: "", diagnosis: "Anterior Uveitis — Right Eye", prescription: "Prednisolone drops كل ساعتين × أسبوع\nAtropine 1% مرتين × 5 أيام" }
    },
    {
      complaint: "جفاف شديد في العينين — حرقة مستمرة",
      diagnosis: "Dry Eye Syndrome",
      prescription: "Hyaluronate 0.1% drops كل 4 ساعات\nNight gel عند النوم",
      contentJson: { chief_complaint: "جفاف وحرقة مستمرة في العينين", visual_acuity: "6/9 OD — 6/9 OS", eye_pressure: "12 / 12", slit_lamp_exam: "نقص طبقة الدموع — BUT 4 ثواني — تلطيخ ببطاء Bengal Rose", fundus_exam: "طبيعي", glasses_prescription: "", diagnosis: "Dry Eye Syndrome — Moderate", prescription: "Hyaluronate 0.1% كل 4 ساعات\nNight gel عند النوم" }
    },
  ],
  orthopedics: [
    {
      complaint: "ألم أسفل الظهر مزمن يمتد للساق اليسرى",
      diagnosis: "Lumbar Disc Herniation L4-L5",
      prescription: "Diclofenac 50mg مرتين مع الطعام\nMethocarbamol 750mg ليلاً\nCalcium + Vitamin D",
      contentJson: { chief_complaint: "ألم قطني يمتد للساق اليسرى", pain_location: "أسفل الظهر (L4-L5) — يمتد الساق اليسرى", range_of_motion: "ثني محدود — SLR+ 45° يسار", xray: "MRI: انزلاق غضروفي L4-L5 مع ضغط جذر عصبي أيسر", procedure_plan: "علاج محافظ 6 أسابيع — حقن epidural إن لم يستجب", rehab_plan: "فيزيوثيرابيا: تمارين تقوية عمود فقري 3 جلسات/أسبوع", diagnosis: "Lumbar Disc Herniation L4-L5", prescription: "Diclofenac 50mg مرتين\nMethocarbamol 750mg ليلاً" }
    },
    {
      complaint: "ألم حاد ركبة يمنى بعد إصابة رياضية",
      diagnosis: "Partial ACL Tear — Right Knee",
      prescription: "Ibuprofen 400mg كل 8 ساعات\nجل ديكلوفيناك موضعياً\nرباط داعم للركبة",
      contentJson: { chief_complaint: "إصابة ركبة يمنى أثناء كرة قدم", pain_location: "الركبة اليمنى — الجانب الداخلي", range_of_motion: "ثني 90° مؤلم — Lachman+ — Drawer مشكوك", xray: "MRI ركبة: تمزق جزئي ACL — لا تمزق كامل", procedure_plan: "تثبيت + تحميل محمي 3 أسابيع — إعادة تقييم", rehab_plan: "فيزيوثيرابيا: تقوية فخذ + توازن × 8 أسابيع", diagnosis: "Partial ACL Tear Right Knee", prescription: "Ibuprofen 400mg كل 8 ساعات\nجل ديكلوفيناك موضعياً" }
    },
    {
      complaint: "ألم مزمن كتف أيمن — صعوبة الرفع",
      diagnosis: "Rotator Cuff Syndrome",
      prescription: "Diclofenac 50mg مرتين\nحقن corticosteroid موضعي",
      contentJson: { chief_complaint: "ألم كتف أيمن مزمن — صعوبة الرفع", pain_location: "الكتف الأيمن — يمتد للذراع — يزداد ليلاً", range_of_motion: "رفع أمامي 120° مؤلم — تبعيد 90° مؤلم — دوران محدود", xray: "MRI: تمزق جزئي الوتر الفوق شوكي — تكلسات", procedure_plan: "حقن corticosteroid + فيزيوثيرابيا — تقييم 6 أسابيع", rehab_plan: "تمارين تقوية مكسة الدوران — تمديد محفظة — 12 جلسة", diagnosis: "Rotator Cuff Syndrome — Partial Supraspinatus Tear", prescription: "Diclofenac 50mg مرتين\nCorticosteroid injection" }
    },
    {
      complaint: "كسر في الكوع الأيسر بعد سقوط",
      diagnosis: "Radial Head Fracture — Left Elbow",
      prescription: "Ibuprofen 400mg كل 8 ساعات\nجبيرة جبس 3 أسابيع",
      contentJson: { chief_complaint: "سقوط على اليد المبسوطة — ألم كوع أيسر", pain_location: "الكوع الأيسر — رأس الكعبرة", range_of_motion: "محدود تماماً — مؤلم جداً", xray: "أشعة سينية: كسر رأس الكعبرة غير نازح (Mason Type I)", procedure_plan: "جبيرة خلفية 3 أسابيع — بدء حركة مبكرة بعد الألم", rehab_plan: "فيزيوثيرابيا بعد نزع الجبيرة: تمارين مرونة الكوع", diagnosis: "Radial Head Fracture Left (Mason I)", prescription: "Ibuprofen 400mg كل 8 ساعات\nجبيرة 3 أسابيع" }
    },
    {
      complaint: "ألم مفاصل أصابع اليدين — تصلب صباحي",
      diagnosis: "Rheumatoid Arthritis — Early",
      prescription: "Methotrexate 10mg أسبوعياً\nFolic acid 5mg يومياً (ما عدا يوم MTX)\nHydroxychloroquine 200mg مرتين",
      contentJson: { chief_complaint: "ألم وتورم أصابع — تصلب صباحي > ساعة", pain_location: "مفاصل أصابع اليدين (MCP/PIP) — معصمان — قدمان", range_of_motion: "تقييد خفيف — تورم مفاصل واضح", xray: "أشعة يدين: تضيق فراغات مفصلية خفيف — لا تآكل", procedure_plan: "تحاليل: RF — Anti-CCP — ESR — CRP — بدء DMARD", rehab_plan: "علاج طبيعي: تمارين مرونة يومية — حمامات ماء دافئ", diagnosis: "Early Rheumatoid Arthritis", prescription: "Methotrexate 10mg أسبوعياً\nFolic acid 5mg يومياً\nHydroxychloroquine 200mg مرتين" }
    },
  ],
  cardiology: [
    {
      complaint: "متابعة ارتفاع ضغط الدم — دوخة خفيفة",
      diagnosis: "Hypertension Stage 2 — Partially Controlled",
      prescription: "Amlodipine 10mg صباحاً\nPerindopril 5mg صباحاً\nAtorvastatin 20mg مساءً",
      contentJson: { chief_complaint: "متابعة ضغط دم — دوخة خفيفة أحياناً", blood_pressure: "148/94", pulse: "78", ecg: "إيقاع جيبي طبيعي — لا تغييرات جديدة", echo: "EF 62% — لا اعتلال صمامي", cardiac_plan: "مواصلة الدواء — متابعة شهر — قياس BP منزلي يومياً", diagnosis: "HTN Stage 2", prescription: "Amlodipine 10mg صباحاً\nPerindopril 5mg صباحاً\nAtorvastatin 20mg مساءً" }
    },
    {
      complaint: "خفقان قلب متكرر منذ أسبوعين",
      diagnosis: "Paroxysmal Atrial Fibrillation",
      prescription: "Bisoprolol 5mg صباحاً\nRivaroxaban 20mg مساءً مع الطعام",
      contentJson: { chief_complaint: "خفقان متكرر يستمر دقائق", blood_pressure: "132/82", pulse: "94", ecg: "رجفان أذيني متقطع — معدل بطيني 92 — QRS ضيق", echo: "EF 58% — لا خثرة أذين أيسر", cardiac_plan: "Holter 48 ساعة — تقييم تحريق", diagnosis: "Paroxysmal AF", prescription: "Bisoprolol 5mg صباحاً\nRivaroxaban 20mg مساءً" }
    },
    {
      complaint: "ضيق تنفس عند المجهود وألم صدر",
      diagnosis: "Stable Angina — CAD Suspected",
      prescription: "Aspirin 100mg صباحاً\nAtorvastatin 40mg مساءً\nNitroglycerine SL عند الحاجة",
      contentJson: { chief_complaint: "ضيق تنفس وضغط صدر عند المشي السريع", blood_pressure: "136/86", pulse: "72", ecg: "ST depression خفيف V4-V6 — موجة T معكوسة", echo: "EF 55% — اضطراب حركة جدار خفيف", cardiac_plan: "قسطرة قلب — تمارين خفيفة فقط — متابعة أسبوعية", diagnosis: "Stable Angina — CAD Suspected", prescription: "Aspirin 100mg\nAtorvastatin 40mg مساءً\nNitroglycerine SL عند الألم" }
    },
    {
      complaint: "متابعة قصور قلب مزمن",
      diagnosis: "Heart Failure with Reduced EF (HFrEF)",
      prescription: "Furosemide 40mg صباحاً\nSacubitril/Valsartan 24/26mg مرتين\nCarvedilol 6.25mg مرتين",
      contentJson: { chief_complaint: "ضيق تنفس عند الاستلقاء — تورم ساقين", blood_pressure: "118/74", pulse: "68", ecg: "LBBB — QRS 140ms — لا تغييرات جديدة", echo: "EF 32% — توسع بطين أيسر — قلس تاجي خفيف", cardiac_plan: "زيادة Furosemide — متابعة أسبوعية — وزن يومي", diagnosis: "HFrEF — EF 32%", prescription: "Furosemide 40mg صباحاً\nSacubitril/Valsartan 24/26mg مرتين\nCarvedilol 6.25mg مرتين" }
    },
    {
      complaint: "فحص دوري بعد جراحة قلب مفتوح",
      diagnosis: "Post CABG — Stable",
      prescription: "Aspirin 100mg + Clopidogrel 75mg\nAtorvastatin 40mg مساءً\nRamipril 10mg صباحاً",
      contentJson: { chief_complaint: "فحص دوري بعد عملية CABG قبل 8 أشهر", blood_pressure: "122/76", pulse: "64", ecg: "إيقاع جيبي — تغييرات قديمة ما بعد الجراحة", echo: "EF 52% — تحسن عن قبل الجراحة — صمامات سليمة", cardiac_plan: "مواصلة الأدوية — تمارين قلبية منظمة — متابعة 3 أشهر", diagnosis: "Post CABG — Stable Recovery", prescription: "Aspirin 100mg + Clopidogrel 75mg\nAtorvastatin 40mg مساءً\nRamipril 10mg صباحاً" }
    },
  ],
  internal_medicine: [
    {
      complaint: "متابعة سكري وضغط دم مرتفع",
      diagnosis: "Type 2 Diabetes + Hypertension — Suboptimal Control",
      prescription: "Metformin 1000mg مرتين\nGliclazide MR 60mg صباحاً\nRamipril 5mg صباحاً",
      contentJson: { chief_complaint: "متابعة دورية — سكري وضغط — مستقر نسبياً", vitals: "ضغط: 142/88 — نبض: 76 — حرارة: 36.6 — وزن: 84كغم", chronic_conditions: "داء السكري من النوع الثاني، ارتفاع ضغط الدم", lab_summary: "HbA1c: 7.8%\nFasting glucose: 148 mg/dL\nCreatinine: 1.1 mg/dL\nCholesterol: 218 mg/dL\nALT: 32 U/L\nHemoglobin: 13.2 g/dL", assessment: "سكري غير متحكم — ضغط مرتفع قليلاً — كلى سليمة", treatment_plan: "زيادة Gliclazide — حمية — مشي 30 دقيقة يومياً", diagnosis: "T2DM + HTN — Suboptimal", prescription: "Metformin 1000mg مرتين\nGliclazide MR 60mg صباحاً\nRamipril 5mg صباحاً" }
    },
    {
      complaint: "إرهاق شديد وشحوب وضيق تنفس",
      diagnosis: "Iron Deficiency Anemia (Severe)",
      prescription: "Ferrous sulfate 200mg مرتين\nVitamin C 500mg مع الحديد\nFolic acid 5mg",
      contentJson: { chief_complaint: "إرهاق وشحوب وضيق تنفس خفيف", vitals: "ضغط: 108/68 — نبض: 96 — وزن: 62كغم", chronic_conditions: "فقر دم بالحديد", lab_summary: "Hemoglobin: 8.4 g/dL\nMCV: 68 fL\nFerritin: 4 ng/mL\nIron: 32 mcg/dL\nWBC: 6.2 ×10³\nPlatelets: 280 ×10³", assessment: "فقر دم حديد شديد — بحث عن مصدر نزيف", treatment_plan: "حديد فموي 3 أشهر — تنظير هضمي — فحص شهري", diagnosis: "Iron Deficiency Anemia (Hgb 8.4)", prescription: "Ferrous sulfate 200mg مرتين\nVitamin C 500mg\nFolic acid 5mg" }
    },
    {
      complaint: "تعب مزمن وزيادة وزن وإمساك",
      diagnosis: "Hypothyroidism — Hashimoto's",
      prescription: "Levothyroxine 50mcg صباحاً على معدة فارغة",
      contentJson: { chief_complaint: "تعب مزمن + زيادة وزن + إمساك + برود", vitals: "ضغط: 118/74 — نبض: 58 — وزن: 78كغم", chronic_conditions: "قصور الغدة الدرقية", lab_summary: "TSH: 12.4 mIU/L (مرتفع)\nFree T4: 0.6 ng/dL (منخفض)\nAnti-TPO: إيجابي\nCholesterol: 242 mg/dL\nHemoglobin: 11.8 g/dL", assessment: "قصور درقية وظيفي مناعي — يؤثر على الكوليسترول والدم", treatment_plan: "Levothyroxine — TSH بعد 6 أسابيع — رفع الجرعة تدريجياً", diagnosis: "Hypothyroidism — Hashimoto's", prescription: "Levothyroxine 50mcg صباحاً على معدة فارغة" }
    },
    {
      complaint: "حرقة معدة مستمرة وقيء متكرر",
      diagnosis: "GERD — Moderate",
      prescription: "Omeprazole 40mg صباحاً على معدة فارغة\nGaviscon بعد الوجبات",
      contentJson: { chief_complaint: "حرقة معدة يومية وارتداد حمضي ليلاً", vitals: "ضغط: 124/80 — نبض: 74 — وزن: 91كغم", chronic_conditions: "GERD، السمنة", lab_summary: "H.pylori: إيجابي (stool antigen)\nHemoglobin: 14.1 g/dL\nALT: 28 U/L\nCreatinine: 0.9 mg/dL", assessment: "GERD + H.pylori — يحتاج استئصال", treatment_plan: "Triple therapy: Amoxicillin + Clarithromycin + PPI × 14 يوم — تنظير هضمي علوي", diagnosis: "GERD + H.pylori Infection", prescription: "Omeprazole 40mg صباحاً\nAmoxicillin 1g مرتين\nClarithromycin 500mg مرتين × 14 يوم" }
    },
    {
      complaint: "ألم مفاصل وحمى منخفضة متكررة",
      diagnosis: "Systemic Lupus — Early Presentation",
      prescription: "Hydroxychloroquine 200mg مرتين\nPrednisolone 10mg صباحاً × شهر",
      contentJson: { chief_complaint: "ألم مفاصل + طفح وجنتين + حمى متكررة", vitals: "ضغط: 112/70 — نبض: 88 — حرارة: 37.6 — وزن: 58كغم", chronic_conditions: "الذئبة الحمامية الجهازية (مشتبه)", lab_summary: "ANA: إيجابي 1:320\nAnti-dsDNA: إيجابي\nComplement C3: منخفض\nESR: 64 mm/hr\nCRP: 18 mg/L\nCBC: قلة خلايا", assessment: "SLE مرحلة مبكرة — يحتاج تحويل روماتولوجيا", treatment_plan: "Hydroxychloroquine + Prednisolone — تقييم كلوي — مراجعة روماتولوجيا", diagnosis: "Early SLE — Active", prescription: "Hydroxychloroquine 200mg مرتين\nPrednisolone 10mg صباحاً" }
    },
  ],
  surgery: [
    {
      complaint: "ألم حاد أسفل البطن الأيمن + حمى",
      diagnosis: "Acute Appendicitis",
      prescription: "Cefazolin 2g IV قبل العملية\nMetronidazole 500mg IV",
      contentJson: { chief_complaint: "ألم حاد أسفل البطن الأيمن + حمى + قيء", vitals: "ضغط: 118/76 — نبض: 102 — حرارة: 38.8", chronic_conditions: "لا يوجد", lab_summary: "WBC: 16.4 ×10³ (مرتفع)\nCRP: 48 mg/L\nUS: التهاب زائدة دودية — قطر 8mm", assessment: "زائدة دودية ملتهبة — مؤشر عملية استئصال فوري", treatment_plan: "استئصال زائدة دودية بالمنظار + مضادات حيوية", diagnosis: "Acute Appendicitis", prescription: "Cefazolin 2g IV\nMetronidazole 500mg IV قبل العملية" }
    },
    {
      complaint: "كتلة في الغدة الدرقية + صعوبة في البلع",
      diagnosis: "Thyroid Nodule — Evaluation",
      prescription: "Levothyroxine 50mcg صباحاً مؤقتاً",
      contentJson: { chief_complaint: "كتلة في الرقبة + صعوبة بلع خفيفة", vitals: "ضغط: 128/82 — نبض: 74 — وزن: 70كغم", chronic_conditions: "لا يوجد", lab_summary: "TSH: 2.1 mIU/L (طبيعي)\nT4 Free: طبيعي\nCalcitonin: طبيعي\nUS درقية: عقدة صلبة 2.5cm — TIRADS 4", assessment: "عقدة درقية مشبوهة — FNAC مطلوبة", treatment_plan: "خزعة إبرة دقيقة (FNAC) — استشارة هرمونية — قرار جراحي بعد النتيجة", diagnosis: "Thyroid Nodule TIRADS 4 — Biopsy Pending", prescription: "Levothyroxine 50mcg مؤقتاً" }
    },
    {
      complaint: "فتق إربي أيمن مؤلم",
      diagnosis: "Right Inguinal Hernia — Symptomatic",
      prescription: "Ibuprofen 400mg عند الحاجة — تجنب الثقل",
      contentJson: { chief_complaint: "انتفاخ إربي أيمن مؤلم — يزداد بالوقوف", vitals: "ضغط: 132/84 — نبض: 72 — وزن: 82كغم", chronic_conditions: "لا يوجد", lab_summary: "CBC طبيعي — تخثر طبيعي — US: فتق إربي غير مختنق", assessment: "فتق إربي أيمن — مؤشر جراحي انتخابي", treatment_plan: "إصلاح جراحي بالمنظار Laparoscopic TEP — حجز موعد عملية", diagnosis: "Right Inguinal Hernia (Indirect)", prescription: "Ibuprofen 400mg عند الحاجة\nتجنب رفع الثقل" }
    },
    {
      complaint: "مرارة متحصية + نوبات مغص متكررة",
      diagnosis: "Cholelithiasis — Symptomatic",
      prescription: "Hyoscine 10mg عند المغص\nOmeprazole 20mg صباحاً",
      contentJson: { chief_complaint: "مغص مراري متكرر بعد الوجبات الدسمة", vitals: "ضغط: 126/80 — نبض: 76 — وزن: 88كغم", chronic_conditions: "لا يوجد", lab_summary: "WBC: 8.2 ×10³\nALT: 42 U/L\nAST: 38 U/L\nBili Total: 1.4\nUS: حصوات مرارة متعددة — أكبرها 1.8cm", assessment: "مرارة متحصية عرضية — مؤشر استئصال", treatment_plan: "استئصال مرارة بالمنظار — تجنب الدهون حتى العملية", diagnosis: "Symptomatic Cholelithiasis", prescription: "Hyoscine 10mg عند المغص\nOmeprazole 20mg صباحاً" }
    },
    {
      complaint: "جرح ما بعد العملية لا يلتئم",
      diagnosis: "Wound Dehiscence — Post-operative",
      prescription: "Amoxicillin-Clavulanate 875mg مرتين × 7 أيام\nتضميد يومي",
      contentJson: { chief_complaint: "جرح عملية استئصال مرارة لم يلتئم — إفراز", vitals: "ضغط: 122/78 — نبض: 80 — حرارة: 37.4", chronic_conditions: "سكري خفيف", lab_summary: "WBC: 11.2 ×10³\nCRP: 22 mg/L\nSugar: 142 mg/dL\nHbA1c: 7.2%", assessment: "تفتح جرح مع علامات التهاب خفيف — ليس منتاناً", treatment_plan: "تنظيف الجرح + تضميد رطب يومي + مضاد حيوي — تحكم بالسكر", diagnosis: "Wound Dehiscence — Superficial Infection", prescription: "Amoxicillin-Clavulanate 875mg مرتين × 7 أيام\nتضميد يومي بالمركز الصحي" }
    },
  ],
};

function randomDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(8 + Math.floor(Math.random() * 9), Math.random() < 0.5 ? 0 : 30, 0, 0);
  return d;
}

async function seed() {
  console.log("🌱 بدء الـ seed الشامل...\n");

  // مسح بيانات demo سابقة إن وجدت
  const existingDemo = await db.clinic.findMany({
    where: { whatsappNumber: { startsWith: "07701000" } },
    select: { id: true },
  });
  if (existingDemo.length > 0) {
    const ids = existingDemo.map((c) => c.id);
    console.log(`🧹 مسح ${ids.length} عيادات demo سابقة...`);
    await db.$transaction([
      db.specialtyAnnotation.deleteMany({ where: { clinicId: { in: ids } } }),
      db.medicalRecord.deleteMany({ where: { clinicId: { in: ids } } }),
      db.appointment.deleteMany({ where: { clinicId: { in: ids } } }),
      db.patient.deleteMany({ where: { clinicId: { in: ids } } }),
      db.workingHours.deleteMany({ where: { clinicId: { in: ids } } }),
      db.payment.deleteMany({ where: { clinicId: { in: ids } } }),
      db.subscription.deleteMany({ where: { clinicId: { in: ids } } }),
      db.clinicSettings.deleteMany({ where: { clinicId: { in: ids } } }),
      db.user.deleteMany({ where: { clinicId: { in: ids } } }),
      db.clinic.deleteMany({ where: { id: { in: ids } } }),
    ]);
    console.log("   تم المسح.\n");
  }

  const passwordHash = await bcrypt.hash("clinic123", 10);
  let totalAppts = 0;
  let totalRecords = 0;

  for (const def of CLINICS) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // إنشاء العيادة
    const clinic = await db.clinic.create({
      data: {
        name: def.name,
        whatsappNumber: def.phone,
        specialty: def.specialty,
        botEnabled: true,
        users: { create: { email: def.email, passwordHash, role: "doctor" } },
        subscription: { create: { plan: def.plan, status: def.plan === "basic" ? "active" : "active", expiresAt } },
        settings: { create: { specialtyCode: def.specialty, setupCompleted: true } },
      },
    });

    // ساعات العمل
    await db.workingHours.createMany({
      data: [0,1,2,3,4,5,6].map((day) => ({
        clinicId: clinic.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isOpen: day !== 5,
      })),
    });

    // إنشاء 15 مريض
    const patients = [];
    for (let j = 0; j < 15; j++) {
      const name = PATIENT_NAMES[j];
      const phone = `079${String(10000000 + CLINICS.indexOf(def) * 100 + j).slice(1)}`;
      try {
        const p = await db.patient.create({
          data: { clinicId: clinic.id, name, whatsappPhone: phone },
        });
        patients.push(p);
      } catch { /* skip */ }
    }

    console.log(`\n🏥 ${def.name} — ${def.specialty} — ${def.plan}`);
    console.log(`   👥 ${patients.length} مريض`);

    if (patients.length === 0) continue;

    const recTemplate = SPECIALTY_RECORDS[def.specialty] ?? SPECIALTY_RECORDS.internal_medicine;

    // 15 حجز موزعة
    const slots = [
      { offset: -21, status: "completed" },
      { offset: -14, status: "completed" },
      { offset: -10, status: "completed" },
      { offset: -7,  status: "completed" },
      { offset: -3,  status: "completed" },
      { offset: 0,   status: "confirmed", queue: 1 },
      { offset: 0,   status: "confirmed", queue: 2 },
      { offset: 0,   status: "pending",   queue: 3 },
      { offset: 0,   status: "waiting",   queue: 4 },
      { offset: 2,   status: "confirmed" },
      { offset: 5,   status: "pending" },
      { offset: 7,   status: "pending" },
      { offset: 10,  status: "pending" },
      { offset: 14,  status: "pending" },
      { offset: 21,  status: "pending" },
    ];

    let clinicAppts = 0;
    let clinicRecs = 0;

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const patient = patients[i % patients.length];

      try {
        await db.appointment.create({
          data: {
            clinicId: clinic.id,
            patientId: patient.id,
            date: randomDate(s.offset),
            status: s.status === "waiting" ? "confirmed" : s.status,
            queueNumber: s.queue ?? null,
            queueStatus: s.queue ? (s.queue === 1 ? "current" : "waiting") : "waiting",
          },
        });
        clinicAppts++;

        // سجل طبي للحجوزات المكتملة
        if (s.status === "completed") {
          const rec = recTemplate[i % recTemplate.length];
          await db.medicalRecord.create({
            data: {
              clinicId: clinic.id,
              patientId: patient.id,
              date: randomDate(s.offset),
              complaint: rec.complaint,
              diagnosis: rec.diagnosis,
              prescription: rec.prescription,
              specialtyCode: def.specialty,
              contentJson: rec.contentJson,
            },
          });
          clinicRecs++;
        }
      } catch { /* skip */ }
    }

    console.log(`   📅 ${clinicAppts} حجز + 📋 ${clinicRecs} سجل طبي`);
    totalAppts += clinicAppts;
    totalRecords += clinicRecs;
  }

  console.log(`\n✅ اكتمل بنجاح!`);
  console.log(`   🏥 ${CLINICS.length} عيادات بكل التخصصات`);
  console.log(`   📅 ${totalAppts} حجز إجمالي`);
  console.log(`   📋 ${totalRecords} سجل طبي بيانات حقيقية`);
  console.log(`\n🔑 بيانات دخول كل عيادة:`);
  CLINICS.forEach((c) => console.log(`   ${c.email} / clinic123`));

  await db.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
