import type { SpecialtyConfig } from "./types";

export const dentalConfig: SpecialtyConfig = {
  code: "dentistry",
  nameAr: "أسنان",
  nameEn: "Dental",
  encounterSections: [
    { id: "chief_complaint",  labelAr: "الشكوى الرئيسية",    labelEn: "Chief complaint",    kind: "text",     placeholderAr: "ألم، حساسية، نزف...", required: true },
    { id: "tooth_chart",      labelAr: "الأسنان المعنية",     labelEn: "Teeth involved",     kind: "text",     placeholderAr: "مثال: 16 MOD، 36 Ext" },
    { id: "gum_exam",         labelAr: "فحص اللثة",           labelEn: "Gum exam",           kind: "textarea", placeholderAr: "نزف، جيوب، التهاب، انحسار..." },
    { id: "pocket_depth",     labelAr: "عمق الجيوب اللثوية",  labelEn: "Pocket depth",       kind: "text",     placeholderAr: "مثال: 3-4-5mm" },
    { id: "occlusion",        labelAr: "الإطباق",             labelEn: "Occlusion",          kind: "select",   options: ["طبيعي", "Class I", "Class II", "Class III", "مفتوح", "عميق"] },
    { id: "tmj_exam",         labelAr: "فحص TMJ",             labelEn: "TMJ exam",           kind: "text",     placeholderAr: "ألم، صرير، تحديد حركة..." },
    { id: "xray",             labelAr: "الأشعة",              labelEn: "X-ray",              kind: "textarea", placeholderAr: "ملاحظات أشعة البانوراما أو البيريابيكال" },
    { id: "treatment_plan",   labelAr: "خطة العلاج",          labelEn: "Treatment plan",     kind: "textarea", placeholderAr: "حشوة، تنظيف، علاج عصب، تاج، خلع..." },
    { id: "oral_hygiene",     labelAr: "نظافة الفم",          labelEn: "Oral hygiene",       kind: "select",   options: ["جيدة", "مقبولة", "ضعيفة"] },
  ],
  documentTypes: [
    { id: "prescription",       labelAr: "وصفة طبية",          labelEn: "Prescription" },
    { id: "treatment_report",   labelAr: "تقرير علاج أسنان",   labelEn: "Treatment report" },
    { id: "dental_certificate", labelAr: "شهادة أسنان",        labelEn: "Dental certificate" },
    { id: "referral",           labelAr: "تحويل إلى أخصائي",   labelEn: "Referral" },
  ],
  quickDiagnoses: ["Dental Caries", "Gingivitis", "Periodontitis", "Pulpitis", "Dental Abscess", "Fractured Tooth", "Impacted Wisdom Tooth"],
  favoriteMedications: ["Amoxicillin 500mg", "Metronidazole 500mg", "Ibuprofen 400mg", "Paracetamol 500mg", "Chlorhexidine mouthwash", "Dexamethasone 4mg"],
  dashboardWidgets: [
    { id: "treatment_plan",  labelAr: "خطط العلاج المفتوحة", labelEn: "Open treatment plans" },
    { id: "xray_followup",   labelAr: "متابعة الأشعة",        labelEn: "X-ray follow-up" },
  ],
};
