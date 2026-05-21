import type { SpecialtyConfig } from "./types";

export const internalMedicineConfig: SpecialtyConfig = {
  code: "internal_medicine",
  nameAr: "باطنية",
  nameEn: "Internal Medicine",
  encounterSections: [
    { id: "chief_complaint",    labelAr: "الشكوى الرئيسية",      labelEn: "Chief complaint",      kind: "text",     required: true },
    { id: "chronic_conditions", labelAr: "الأمراض المزمنة",       labelEn: "Chronic conditions",   kind: "textarea", placeholderAr: "سكري، ضغط، قصور كلوي..." },
    { id: "hba1c",              labelAr: "HbA1c (%)",            labelEn: "HbA1c",                kind: "number",   placeholderAr: "مثال: 7.2" },
    { id: "fasting_glucose",    labelAr: "سكر الصيام (mg/dL)",   labelEn: "Fasting glucose",      kind: "number",   placeholderAr: "100" },
    { id: "creatinine",         labelAr: "الكرياتينين (mg/dL)",  labelEn: "Creatinine",           kind: "number",   placeholderAr: "0.9" },
    { id: "liver_enzymes",      labelAr: "إنزيمات الكبد",        labelEn: "Liver enzymes",        kind: "text",     placeholderAr: "ALT/AST مثال: 35/28" },
    { id: "cbc_summary",        labelAr: "صورة الدم CBC",        labelEn: "CBC summary",          kind: "textarea", placeholderAr: "Hb، WBC، Platelets..." },
    { id: "lab_summary",        labelAr: "تحاليل أخرى",          labelEn: "Other labs",           kind: "textarea", placeholderAr: "TSH، Lipids، Uric acid..." },
    { id: "assessment",         labelAr: "التقييم السريري",       labelEn: "Clinical assessment",  kind: "textarea" },
    { id: "treatment_plan",     labelAr: "خطة العلاج",           labelEn: "Treatment plan",       kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription",  labelAr: "وصفة طبية",    labelEn: "Prescription" },
    { id: "lab_request",   labelAr: "طلب تحاليل",   labelEn: "Lab request" },
    { id: "medical_report", labelAr: "تقرير طبي",   labelEn: "Medical report" },
    { id: "referral",      labelAr: "تحويل أخصائي", labelEn: "Specialist referral" },
  ],
  quickDiagnoses: ["Type 2 Diabetes", "Hypertension", "Gastroenteritis", "Anemia", "Hypothyroidism", "UTI", "GERD", "Dyslipidemia"],
  favoriteMedications: ["Metformin 500mg", "Omeprazole 20mg", "Amlodipine 5mg", "Levothyroxine 50mcg", "Atorvastatin 20mg", "Ferrous sulfate 200mg", "ORS sachets"],
  dashboardWidgets: [
    { id: "chronic_followup", labelAr: "متابعة الأمراض المزمنة", labelEn: "Chronic follow-up" },
    { id: "lab_results",      labelAr: "نتائج التحاليل",          labelEn: "Lab results" },
  ],
};
