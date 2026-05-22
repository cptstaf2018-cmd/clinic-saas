import type { SpecialtyConfig } from "./types";

export const aestheticConfig: SpecialtyConfig = {
  code: "aesthetic",
  nameAr: "تجميل",
  nameEn: "Aesthetic Medicine",
  encounterSections: [
    { id: "chief_complaint", labelAr: "سبب الزيارة", labelEn: "Visit reason", kind: "text", required: true, placeholderAr: "بوتوكس، فيلر، ليزر، متابعة..." },
    { id: "procedure_type", labelAr: "نوع الإجراء", labelEn: "Procedure type", kind: "select", options: ["بوتوكس", "فيلر", "ليزر", "PRP", "ميزوثيرابي", "تقشير", "تنظيف بشرة", "أخرى"] },
    { id: "treatment_area", labelAr: "منطقة العلاج", labelEn: "Treatment area", kind: "text", placeholderAr: "الجبهة، حول العين، الشفاه، الخدود..." },
    { id: "product_used", labelAr: "المادة المستخدمة", labelEn: "Product used", kind: "text", placeholderAr: "اسم المادة أو الجهاز" },
    { id: "quantity", labelAr: "الكمية / الجرعة", labelEn: "Quantity / dose", kind: "text", placeholderAr: "مثال: 1ml، 20 units" },
    { id: "batch_number", labelAr: "رقم التشغيلة", labelEn: "Batch number", kind: "text", placeholderAr: "Batch / Lot" },
    { id: "pre_photos", labelAr: "صور قبل الإجراء", labelEn: "Before photos", kind: "textarea", placeholderAr: "ملاحظات الصور أو روابطها" },
    { id: "aftercare", labelAr: "تعليمات بعد الإجراء", labelEn: "Aftercare", kind: "textarea", placeholderAr: "تجنب الحرارة، المساج، الرياضة..." },
    { id: "consent", labelAr: "الموافقة العلاجية", labelEn: "Consent", kind: "select", options: ["تمت الموافقة", "بانتظار التوقيع", "غير مطلوب"] },
    { id: "session_plan", labelAr: "خطة الجلسات", labelEn: "Session plan", kind: "textarea", placeholderAr: "عدد الجلسات، الفاصل الزمني، المتابعة..." },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "procedure_consent", labelAr: "موافقة إجراء", labelEn: "Procedure consent" },
    { id: "before_after_report", labelAr: "تقرير قبل/بعد", labelEn: "Before/after report" },
    { id: "session_plan", labelAr: "خطة جلسات", labelEn: "Session plan" },
  ],
  quickDiagnoses: ["Botox session", "Dermal filler", "Laser hair removal", "PRP", "Chemical peel", "Acne scar treatment", "Skin rejuvenation"],
  favoriteMedications: ["Topical antibiotic cream", "Sunscreen SPF 50", "Hyaluronic acid serum", "Gentle cleanser", "Paracetamol 500mg", "Cold compress instructions"],
  dashboardWidgets: [
    { id: "sessions_due", labelAr: "الجلسات القادمة", labelEn: "Upcoming sessions" },
    { id: "before_after", labelAr: "صور قبل/بعد", labelEn: "Before/after photos" },
  ],
};
