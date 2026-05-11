import type { SpecialtyConfig } from "./types";

export const orthopedicsConfig: SpecialtyConfig = {
  code: "orthopedics",
  nameAr: "عظام",
  nameEn: "Orthopedics",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "pain_location", labelAr: "مكان الألم", labelEn: "Pain location", kind: "text" },
    { id: "range_of_motion", labelAr: "مدى الحركة", labelEn: "Range of motion", kind: "textarea" },
    { id: "xray", labelAr: "الأشعة", labelEn: "X-ray", kind: "textarea" },
    { id: "procedure_plan", labelAr: "خطة الإجراء", labelEn: "Procedure plan", kind: "textarea" },
    { id: "rehab_plan", labelAr: "خطة التأهيل", labelEn: "Rehab plan", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "xray_report", labelAr: "تقرير أشعة", labelEn: "X-ray report" },
    { id: "physio_referral", labelAr: "تحويل علاج طبيعي", labelEn: "Physio referral" },
  ],
  quickDiagnoses: ["Low Back Pain", "Knee Osteoarthritis", "Ankle Sprain"],
  favoriteMedications: ["Diclofenac 50mg", "Paracetamol 500mg", "Calcium + Vitamin D"],
  dashboardWidgets: [
    { id: "procedure_followup", labelAr: "متابعة الإجراءات", labelEn: "Procedure follow-up" },
    { id: "rehab_tracking", labelAr: "متابعة التأهيل", labelEn: "Rehab tracking" },
  ],
};
