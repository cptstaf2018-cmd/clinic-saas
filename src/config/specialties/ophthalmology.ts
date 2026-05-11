import type { SpecialtyConfig } from "./types";

export const ophthalmologyConfig: SpecialtyConfig = {
  code: "ophthalmology",
  nameAr: "عيون",
  nameEn: "Ophthalmology",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "visual_acuity", labelAr: "حدة البصر", labelEn: "Visual acuity", kind: "text" },
    { id: "eye_pressure", labelAr: "ضغط العين", labelEn: "Eye pressure", kind: "text" },
    { id: "slit_lamp_exam", labelAr: "فحص المصباح", labelEn: "Slit lamp exam", kind: "textarea" },
    { id: "fundus_exam", labelAr: "فحص قاع العين", labelEn: "Fundus exam", kind: "textarea" },
    { id: "glasses_prescription", labelAr: "وصفة النظارات", labelEn: "Glasses prescription", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "vision_report", labelAr: "تقرير نظر", labelEn: "Vision report" },
    { id: "glasses_prescription", labelAr: "وصفة نظارات", labelEn: "Glasses prescription" },
  ],
  quickDiagnoses: ["Conjunctivitis", "Dry Eye", "Refractive Error"],
  favoriteMedications: ["Artificial tears", "Moxifloxacin drops", "Olopatadine drops"],
  dashboardWidgets: [
    { id: "vision_followup", labelAr: "متابعة النظر", labelEn: "Vision follow-up" },
    { id: "iop_trend", labelAr: "ضغط العين", labelEn: "IOP trend" },
  ],
};
