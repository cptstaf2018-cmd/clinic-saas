import type { SpecialtyConfig } from "./types";

export const cardiologyConfig: SpecialtyConfig = {
  code: "cardiology",
  nameAr: "قلب",
  nameEn: "Cardiology",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية",    labelEn: "Chief complaint",    kind: "text",     required: true },
    { id: "blood_pressure",  labelAr: "ضغط الدم (sys/dia)", labelEn: "Blood pressure",     kind: "text",     placeholderAr: "مثال: 130/85" },
    { id: "pulse",           labelAr: "النبض (bpm)",        labelEn: "Pulse",              kind: "number",   placeholderAr: "72" },
    { id: "heart_rhythm",    labelAr: "إيقاع القلب",        labelEn: "Heart rhythm",       kind: "select",   options: ["منتظم", "رجفان أذيني", "تسارع", "بطء", "غير منتظم"] },
    { id: "ejection_fraction", labelAr: "الكسر الانبساطي EF", labelEn: "Ejection fraction", kind: "text",  placeholderAr: "مثال: 55%" },
    { id: "ecg",             labelAr: "تخطيط القلب ECG",    labelEn: "ECG findings",       kind: "textarea", placeholderAr: "NSR، ST تغيرات، حصار..." },
    { id: "echo",            labelAr: "الإيكو",             labelEn: "Echo",               kind: "textarea", placeholderAr: "LV، valves، effusion..." },
    { id: "lipid_profile",   labelAr: "الدهون",             labelEn: "Lipid profile",      kind: "text",     placeholderAr: "LDL / HDL / TG" },
    { id: "cardiac_plan",    labelAr: "خطة العلاج",         labelEn: "Treatment plan",     kind: "textarea", placeholderAr: "أدوية، تحويل، قسطرة..." },
  ],
  documentTypes: [
    { id: "prescription",    labelAr: "وصفة طبية",    labelEn: "Prescription" },
    { id: "ecg_report",      labelAr: "تقرير ECG",    labelEn: "ECG report" },
    { id: "cardiac_report",  labelAr: "تقرير قلب",    labelEn: "Cardiac report" },
    { id: "referral",        labelAr: "تحويل قسطرة",  labelEn: "Cath referral" },
  ],
  quickDiagnoses: ["Hypertension", "Stable Angina", "Arrhythmia", "Heart Failure", "ACS", "Valvular Disease", "Pericarditis"],
  favoriteMedications: ["Aspirin 81mg", "Atorvastatin 40mg", "Amlodipine 5mg", "Bisoprolol 5mg", "Ramipril 5mg", "Furosemide 40mg", "Warfarin 5mg"],
  dashboardWidgets: [
    { id: "bp_trend",     labelAr: "اتجاه ضغط الدم", labelEn: "BP trend" },
    { id: "ecg_followup", labelAr: "متابعة ECG",      labelEn: "ECG follow-up" },
  ],
};
