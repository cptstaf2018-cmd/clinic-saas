import type { SpecialtyConfig } from "./types";

export const cardiologyConfig: SpecialtyConfig = {
  code: "cardiology",
  nameAr: "قلب",
  nameEn: "Cardiology",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "blood_pressure", labelAr: "ضغط الدم", labelEn: "Blood pressure", kind: "text", placeholderAr: "120/80" },
    { id: "pulse", labelAr: "النبض", labelEn: "Pulse", kind: "number" },
    { id: "ecg", labelAr: "ECG", labelEn: "ECG", kind: "textarea" },
    { id: "echo", labelAr: "الإيكو", labelEn: "Echo", kind: "textarea" },
    { id: "cardiac_plan", labelAr: "خطة القلب", labelEn: "Cardiac plan", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "ecg_report", labelAr: "تقرير ECG", labelEn: "ECG report" },
    { id: "cardiac_report", labelAr: "تقرير قلب", labelEn: "Cardiac report" },
  ],
  quickDiagnoses: ["Hypertension", "Stable Angina", "Arrhythmia"],
  favoriteMedications: ["Aspirin 81mg", "Atorvastatin 20mg", "Amlodipine 5mg"],
  dashboardWidgets: [
    { id: "bp_trend", labelAr: "اتجاه ضغط الدم", labelEn: "Blood pressure trend" },
    { id: "ecg_followup", labelAr: "متابعة ECG", labelEn: "ECG follow-up" },
  ],
};
