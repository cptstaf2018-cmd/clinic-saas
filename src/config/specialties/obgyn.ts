import type { SpecialtyConfig } from "./types";

export const obgynConfig: SpecialtyConfig = {
  code: "gynecology",
  nameAr: "نسائية",
  nameEn: "OB-GYN",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "lmp", labelAr: "آخر دورة", labelEn: "LMP", kind: "date" },
    { id: "pregnancy_status", labelAr: "حالة الحمل", labelEn: "Pregnancy status", kind: "select", options: ["غير حامل", "حامل", "بعد الولادة", "غير معروف"] },
    { id: "gestational_age", labelAr: "عمر الحمل", labelEn: "Gestational age", kind: "text", placeholderAr: "أسابيع + أيام" },
    { id: "ultrasound", labelAr: "السونار", labelEn: "Ultrasound", kind: "textarea" },
    { id: "followup_plan", labelAr: "خطة المتابعة", labelEn: "Follow-up plan", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "pregnancy_report", labelAr: "تقرير حمل", labelEn: "Pregnancy report" },
    { id: "ultrasound_report", labelAr: "تقرير سونار", labelEn: "Ultrasound report" },
  ],
  quickDiagnoses: ["Pregnancy Follow-up", "Vaginitis", "Dysmenorrhea"],
  favoriteMedications: ["Folic acid 5mg", "Iron supplement", "Progesterone"],
  dashboardWidgets: [
    { id: "pregnancy_followups", labelAr: "متابعات الحمل", labelEn: "Pregnancy follow-ups" },
    { id: "ultrasound_due", labelAr: "سونار مستحق", labelEn: "Due ultrasound" },
  ],
};
