import type { SpecialtyConfig } from "./types";

export const obgynConfig: SpecialtyConfig = {
  code: "gynecology",
  nameAr: "نسائية",
  nameEn: "OB-GYN",
  encounterSections: [
    { id: "chief_complaint",   labelAr: "الشكوى الرئيسية",    labelEn: "Chief complaint",      kind: "text",     required: true },
    { id: "lmp",               labelAr: "آخر دورة (LMP)",      labelEn: "LMP",                  kind: "date" },
    { id: "cycle_regularity",  labelAr: "انتظام الدورة",       labelEn: "Cycle regularity",     kind: "select",   options: ["منتظمة", "غير منتظمة", "غائبة", "منقطعة"] },
    { id: "gravida_para",      labelAr: "الحمل / الولادة (G/P)", labelEn: "Gravida/Para",       kind: "text",     placeholderAr: "مثال: G3P2" },
    { id: "cs_history",        labelAr: "عمليات قيصرية سابقة", labelEn: "Previous C-sections",  kind: "number",   placeholderAr: "العدد" },
    { id: "pregnancy_status",  labelAr: "حالة الحمل",          labelEn: "Pregnancy status",     kind: "select",   options: ["غير حامل", "حامل", "بعد الولادة", "رضاعة", "غير معروف"] },
    { id: "gestational_age",   labelAr: "عمر الحمل",           labelEn: "Gestational age",      kind: "text",     placeholderAr: "أسابيع + أيام" },
    { id: "fundal_height",     labelAr: "ارتفاع الرحم (سم)",   labelEn: "Fundal height",        kind: "number",   placeholderAr: "سم" },
    { id: "fetal_heart_rate",  labelAr: "نبض الجنين (bpm)",    labelEn: "Fetal heart rate",     kind: "number",   placeholderAr: "140" },
    { id: "blood_group",       labelAr: "فصيلة الدم + Rh",     labelEn: "Blood group + Rh",     kind: "select",   options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    { id: "ultrasound",        labelAr: "السونار",             labelEn: "Ultrasound",           kind: "textarea", placeholderAr: "موضع المشيمة، حجم الجنين، السائل..." },
    { id: "followup_plan",     labelAr: "خطة المتابعة",        labelEn: "Follow-up plan",       kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription",      labelAr: "وصفة طبية",        labelEn: "Prescription" },
    { id: "pregnancy_report",  labelAr: "تقرير حمل",         labelEn: "Pregnancy report" },
    { id: "ultrasound_report", labelAr: "تقرير سونار",        labelEn: "Ultrasound report" },
    { id: "delivery_summary",  labelAr: "ملخص الولادة",      labelEn: "Delivery summary" },
  ],
  quickDiagnoses: ["Pregnancy Follow-up", "Vaginitis", "Dysmenorrhea", "PCOS", "Threatened Miscarriage", "UTI in Pregnancy", "GDM"],
  favoriteMedications: ["Folic acid 5mg", "Iron supplement", "Progesterone 200mg", "Calcium 500mg", "Vitamin D 1000IU", "Metformin 500mg"],
  dashboardWidgets: [
    { id: "pregnancy_followups", labelAr: "متابعات الحمل", labelEn: "Pregnancy follow-ups" },
    { id: "ultrasound_due",      labelAr: "سونار مستحق",    labelEn: "Due ultrasound" },
  ],
};
