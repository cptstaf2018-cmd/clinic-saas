import type { SpecialtyConfig } from "./types";

export const ophthalmologyConfig: SpecialtyConfig = {
  code: "ophthalmology",
  nameAr: "عيون",
  nameEn: "Ophthalmology",
  encounterSections: [
    { id: "chief_complaint",  labelAr: "الشكوى الرئيسية",            labelEn: "Chief complaint",        kind: "text",     required: true },
    { id: "va_right",         labelAr: "حدة البصر — يمين (unaided)", labelEn: "VA right unaided",        kind: "text",     placeholderAr: "6/6، 6/12..." },
    { id: "va_left",          labelAr: "حدة البصر — يسار (unaided)", labelEn: "VA left unaided",         kind: "text",     placeholderAr: "6/6، 6/12..." },
    { id: "va_right_cc",      labelAr: "حدة البصر — يمين (بتصحيح)", labelEn: "VA right with correction", kind: "text",   placeholderAr: "6/6..." },
    { id: "va_left_cc",       labelAr: "حدة البصر — يسار (بتصحيح)", labelEn: "VA left with correction",  kind: "text",   placeholderAr: "6/6..." },
    { id: "iop_right",        labelAr: "ضغط العين يمين (mmHg)",      labelEn: "IOP right",               kind: "number",   placeholderAr: "14" },
    { id: "iop_left",         labelAr: "ضغط العين يسار (mmHg)",      labelEn: "IOP left",                kind: "number",   placeholderAr: "14" },
    { id: "refraction",       labelAr: "الانكسار (Sphere/Cyl/Axis)", labelEn: "Refraction",              kind: "textarea", placeholderAr: "R: -2.00/-0.50×180\nL: -1.75/-0.25×170" },
    { id: "slit_lamp_exam",   labelAr: "فحص المصباح الشقي",         labelEn: "Slit lamp exam",          kind: "textarea", placeholderAr: "Cornea، Iris، Lens..." },
    { id: "fundus_exam",      labelAr: "فحص قاع العين",             labelEn: "Fundus exam",             kind: "textarea", placeholderAr: "Disc، Macula، Vessels..." },
    { id: "glasses_rx",       labelAr: "وصفة النظارات",             labelEn: "Glasses prescription",    kind: "textarea", placeholderAr: "R: +1.00/-0.50×90 Add +2.00\nL: ..." },
  ],
  documentTypes: [
    { id: "prescription",       labelAr: "وصفة طبية",       labelEn: "Prescription" },
    { id: "vision_report",      labelAr: "تقرير نظر",        labelEn: "Vision report" },
    { id: "glasses_prescription", labelAr: "وصفة نظارات",  labelEn: "Glasses prescription" },
    { id: "referral",           labelAr: "تحويل مستشفى",    labelEn: "Hospital referral" },
  ],
  quickDiagnoses: ["Conjunctivitis", "Dry Eye", "Refractive Error", "Glaucoma", "Cataract", "Diabetic Retinopathy", "AMD"],
  favoriteMedications: ["Artificial tears 4x/day", "Moxifloxacin drops", "Olopatadine drops", "Timolol 0.5%", "Latanoprost drops", "Prednisolone drops"],
  dashboardWidgets: [
    { id: "vision_followup", labelAr: "متابعة النظر",  labelEn: "Vision follow-up" },
    { id: "iop_trend",       labelAr: "ضغط العين",      labelEn: "IOP trend" },
  ],
};
