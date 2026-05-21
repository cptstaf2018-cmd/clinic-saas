import type { SpecialtyConfig } from "./types";

export const dermatologyConfig: SpecialtyConfig = {
  code: "dermatology",
  nameAr: "جلدية",
  nameEn: "Dermatology",
  encounterSections: [
    { id: "chief_complaint",  labelAr: "الشكوى الرئيسية",    labelEn: "Chief complaint",    kind: "text",     required: true },
    { id: "lesion_location",  labelAr: "مكان الإصابة",        labelEn: "Lesion location",    kind: "text",     placeholderAr: "الوجه، اليدين، الظهر..." },
    { id: "lesion_type",      labelAr: "نوع الآفة",           labelEn: "Lesion type",        kind: "select",   options: ["Macule", "Papule", "Vesicle", "Pustule", "Plaque", "Nodule", "Ulcer", "Wheal", "أخرى"] },
    { id: "lesion_size",      labelAr: "حجم الآفة",           labelEn: "Lesion size",        kind: "text",     placeholderAr: "مثال: 2×3 سم" },
    { id: "lesion_color",     labelAr: "لون الآفة",           labelEn: "Lesion color",       kind: "text",     placeholderAr: "أحمر، بني، أبيض، داكن..." },
    { id: "fitzpatrick",      labelAr: "نوع البشرة Fitzpatrick", labelEn: "Fitzpatrick type", kind: "select",  options: ["Type I", "Type II", "Type III", "Type IV", "Type V", "Type VI"] },
    { id: "lesion_duration",  labelAr: "مدة الحالة",          labelEn: "Duration",           kind: "text",     placeholderAr: "أسابيع، أشهر..." },
    { id: "itching",          labelAr: "الحكة",               labelEn: "Itching",            kind: "select",   options: ["لا توجد", "خفيفة", "متوسطة", "شديدة"] },
    { id: "distribution",     labelAr: "توزيع الإصابة",       labelEn: "Distribution",       kind: "select",   options: ["موضعي", "متناظر", "منتشر", "خطي"] },
    { id: "progress",         labelAr: "تطور الحالة",         labelEn: "Progress",           kind: "textarea", placeholderAr: "تحسن، ثبات، تفاقم..." },
  ],
  documentTypes: [
    { id: "prescription",        labelAr: "وصفة طبية",       labelEn: "Prescription" },
    { id: "skin_report",         labelAr: "تقرير جلدية",     labelEn: "Skin report" },
    { id: "before_after_report", labelAr: "تقرير قبل/بعد",  labelEn: "Before/after report" },
    { id: "biopsy_request",      labelAr: "طلب خزعة",        labelEn: "Biopsy request" },
  ],
  quickDiagnoses: ["Acne Vulgaris", "Eczema/Atopic Dermatitis", "Urticaria", "Psoriasis", "Tinea Corporis", "Contact Dermatitis", "Rosacea"],
  favoriteMedications: ["Topical corticosteroid", "Cetirizine 10mg", "Benzoyl peroxide gel", "Tretinoin 0.025%", "Clotrimazole cream", "Tacrolimus 0.1%"],
  dashboardWidgets: [
    { id: "photo_followup", labelAr: "متابعة الصور",   labelEn: "Photo follow-up" },
    { id: "skin_progress",  labelAr: "تطور الحالات",   labelEn: "Case progress" },
  ],
};
