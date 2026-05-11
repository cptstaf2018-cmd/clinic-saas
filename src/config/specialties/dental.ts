import type { SpecialtyConfig } from "./types";

export const dentalConfig: SpecialtyConfig = {
  code: "dentistry",
  nameAr: "أسنان",
  nameEn: "Dental",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", placeholderAr: "ألم، حساسية، نزف...", required: true },
    { id: "tooth_chart", labelAr: "مخطط الأسنان", labelEn: "Tooth chart", kind: "text", placeholderAr: "مثال: 16 MOD، 36 extraction" },
    { id: "gum_exam", labelAr: "فحص اللثة", labelEn: "Gum exam", kind: "textarea", placeholderAr: "نزف، جيوب، التهاب..." },
    { id: "xray", labelAr: "الأشعة", labelEn: "X-ray", kind: "textarea", placeholderAr: "ملاحظات الأشعة أو رقم الصورة" },
    { id: "treatment_plan", labelAr: "خطة العلاج", labelEn: "Treatment plan", kind: "textarea", placeholderAr: "حشوة، تنظيف، علاج عصب..." },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "treatment_report", labelAr: "تقرير علاج أسنان", labelEn: "Treatment report" },
    { id: "dental_certificate", labelAr: "شهادة أسنان", labelEn: "Dental certificate" },
  ],
  quickDiagnoses: ["Dental Caries", "Gingivitis", "Periodontitis"],
  favoriteMedications: ["Amoxicillin 500mg", "Ibuprofen 400mg", "Chlorhexidine mouthwash"],
  dashboardWidgets: [
    { id: "treatment_plan", labelAr: "خطط العلاج المفتوحة", labelEn: "Open treatment plans" },
    { id: "xray_followup", labelAr: "متابعة الأشعة", labelEn: "X-ray follow-up" },
  ],
};
