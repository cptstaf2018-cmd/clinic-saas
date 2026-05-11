import type { SpecialtyConfig } from "./types";

export const internalMedicineConfig: SpecialtyConfig = {
  code: "internal_medicine",
  nameAr: "باطنية",
  nameEn: "Internal Medicine",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "vitals", labelAr: "العلامات الحيوية", labelEn: "Vitals", kind: "textarea", placeholderAr: "ضغط، نبض، حرارة..." },
    { id: "chronic_conditions", labelAr: "الأمراض المزمنة", labelEn: "Chronic conditions", kind: "textarea" },
    { id: "lab_summary", labelAr: "ملخص التحاليل", labelEn: "Lab summary", kind: "textarea" },
    { id: "assessment", labelAr: "التقييم", labelEn: "Assessment", kind: "textarea" },
    { id: "treatment_plan", labelAr: "خطة العلاج", labelEn: "Treatment plan", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "lab_request", labelAr: "طلب تحاليل", labelEn: "Lab request" },
    { id: "medical_report", labelAr: "تقرير طبي", labelEn: "Medical report" },
  ],
  quickDiagnoses: ["Diabetes Mellitus", "Hypertension", "Gastroenteritis"],
  favoriteMedications: ["Metformin 500mg", "Omeprazole 20mg", "ORS sachets"],
  dashboardWidgets: [
    { id: "chronic_followup", labelAr: "متابعة الأمراض المزمنة", labelEn: "Chronic follow-up" },
    { id: "lab_results", labelAr: "نتائج التحاليل", labelEn: "Lab results" },
  ],
};
