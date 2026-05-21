import type { SpecialtyConfig } from "./types";

export const orthopedicsConfig: SpecialtyConfig = {
  code: "orthopedics",
  nameAr: "عظام",
  nameEn: "Orthopedics",
  encounterSections: [
    { id: "chief_complaint",    labelAr: "الشكوى الرئيسية",     labelEn: "Chief complaint",     kind: "text",     required: true },
    { id: "pain_location",      labelAr: "مكان الألم",           labelEn: "Pain location",       kind: "text",     placeholderAr: "ركبة يسرى، أسفل الظهر..." },
    { id: "pain_onset",         labelAr: "بداية الألم",          labelEn: "Pain onset",          kind: "select",   options: ["حاد (< 6 أسابيع)", "تحت حاد (6-12 أسبوع)", "مزمن (> 3 أشهر)"] },
    { id: "range_of_motion",    labelAr: "مدى الحركة",           labelEn: "Range of motion",     kind: "textarea", placeholderAr: "Flexion/Extension بالدرجات" },
    { id: "neurological_exam",  labelAr: "الفحص العصبي",         labelEn: "Neurological exam",   kind: "textarea", placeholderAr: "خدر، وخز، قوة العضلات..." },
    { id: "special_tests",      labelAr: "الاختبارات الخاصة",   labelEn: "Special tests",       kind: "textarea", placeholderAr: "Lachman، McMurray، SLR..." },
    { id: "xray",               labelAr: "الأشعة السينية",       labelEn: "X-ray",               kind: "textarea", placeholderAr: "فجوة المفصل، كسر، تدهور..." },
    { id: "mri_findings",       labelAr: "نتائج MRI",            labelEn: "MRI findings",        kind: "textarea", placeholderAr: "إذا متوفر" },
    { id: "procedure_plan",     labelAr: "خطة الإجراء",          labelEn: "Procedure plan",      kind: "textarea" },
    { id: "rehab_plan",         labelAr: "خطة التأهيل",          labelEn: "Rehab plan",          kind: "textarea", placeholderAr: "جلسات علاج طبيعي، تمارين..." },
  ],
  documentTypes: [
    { id: "prescription",    labelAr: "وصفة طبية",          labelEn: "Prescription" },
    { id: "xray_report",     labelAr: "تقرير أشعة",          labelEn: "X-ray report" },
    { id: "physio_referral", labelAr: "تحويل علاج طبيعي",   labelEn: "Physio referral" },
    { id: "fitness_report",  labelAr: "تقرير لياقة عمل",    labelEn: "Work fitness report" },
  ],
  quickDiagnoses: ["Low Back Pain", "Knee Osteoarthritis", "Ankle Sprain", "Rotator Cuff Injury", "Disc Herniation", "Fracture", "Carpal Tunnel"],
  favoriteMedications: ["Diclofenac 50mg", "Paracetamol 500mg", "Calcium + Vitamin D", "Celecoxib 200mg", "Methocarbamol 750mg", "Prednisolone 5mg"],
  dashboardWidgets: [
    { id: "procedure_followup", labelAr: "متابعة الإجراءات", labelEn: "Procedure follow-up" },
    { id: "rehab_tracking",     labelAr: "متابعة التأهيل",    labelEn: "Rehab tracking" },
  ],
};
