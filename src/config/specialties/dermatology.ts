import type { SpecialtyConfig } from "./types";

export const dermatologyConfig: SpecialtyConfig = {
  code: "dermatology",
  nameAr: "جلدية",
  nameEn: "Dermatology",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "lesion_location", labelAr: "مكان الإصابة", labelEn: "Lesion location", kind: "text" },
    { id: "lesion_duration", labelAr: "مدة الحالة", labelEn: "Duration", kind: "text" },
    { id: "itching", labelAr: "الحكة", labelEn: "Itching", kind: "select", options: ["لا توجد", "خفيفة", "متوسطة", "شديدة"] },
    { id: "skin_images", labelAr: "الصور", labelEn: "Images", kind: "textarea", placeholderAr: "وصف الصور أو روابطها" },
    { id: "progress", labelAr: "تطور الحالة", labelEn: "Progress", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "skin_report", labelAr: "تقرير جلدية", labelEn: "Skin report" },
    { id: "before_after_report", labelAr: "تقرير قبل/بعد", labelEn: "Before/after report" },
  ],
  quickDiagnoses: ["Acne Vulgaris", "Eczema", "Urticaria"],
  favoriteMedications: ["Topical corticosteroid", "Cetirizine 10mg", "Benzoyl peroxide gel"],
  dashboardWidgets: [
    { id: "photo_followup", labelAr: "متابعة الصور", labelEn: "Photo follow-up" },
    { id: "skin_progress", labelAr: "تطور الحالات", labelEn: "Case progress" },
  ],
};
