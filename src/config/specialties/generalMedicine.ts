import type { SpecialtyConfig } from "./types";

export const generalMedicineConfig: SpecialtyConfig = {
  code: "general_medicine",
  nameAr: "طب عام",
  nameEn: "General Medicine",
  encounterSections: [
    { id: "chief_complaint",  labelAr: "الشكوى الرئيسية",   labelEn: "Chief complaint",   kind: "text",     required: true, placeholderAr: "ألم، حرارة، وهن، سعال..." },
    { id: "duration",         labelAr: "مدة الأعراض",        labelEn: "Duration",           kind: "text",     placeholderAr: "منذ 3 أيام، أسبوع..." },
    { id: "vital_signs",      labelAr: "العلامات الحيوية",   labelEn: "Vital signs",        kind: "text",     placeholderAr: "ضغط / نبض / حرارة / تشبع" },
    { id: "physical_exam",    labelAr: "الفحص السريري",      labelEn: "Physical exam",      kind: "textarea", placeholderAr: "نتائج الفحص..." },
    { id: "assessment",       labelAr: "التشخيص",            labelEn: "Assessment",         kind: "textarea", placeholderAr: "التشخيص الأولي أو المحتمل" },
    { id: "treatment_plan",   labelAr: "خطة العلاج",         labelEn: "Treatment plan",     kind: "textarea", placeholderAr: "أدوية، راحة، تحاليل، تحويل..." },
    { id: "referral",         labelAr: "التحويل",            labelEn: "Referral",           kind: "text",     placeholderAr: "تحويل إلى أخصائي (إن وجد)" },
  ],
  documentTypes: [
    { id: "prescription",    labelAr: "وصفة طبية",     labelEn: "Prescription" },
    { id: "medical_report",  labelAr: "تقرير طبي",     labelEn: "Medical report" },
    { id: "lab_request",     labelAr: "طلب تحاليل",    labelEn: "Lab request" },
    { id: "referral",        labelAr: "تحويل أخصائي",  labelEn: "Specialist referral" },
    { id: "sick_leave",      labelAr: "إجازة مرضية",   labelEn: "Sick leave" },
  ],
  quickDiagnoses: ["Upper respiratory infection", "Gastroenteritis", "Hypertension follow-up", "Fever", "Diabetes follow-up", "UTI", "Anemia", "Headache"],
  favoriteMedications: ["Paracetamol 500mg", "Ibuprofen 400mg", "Amoxicillin 500mg", "Omeprazole 20mg", "ORS sachets", "Metformin 500mg", "Amlodipine 5mg"],
  dashboardWidgets: [
    { id: "today_visits",     labelAr: "زيارات اليوم",   labelEn: "Today's visits" },
    { id: "chronic_followup", labelAr: "متابعة مزمنة",   labelEn: "Chronic follow-up" },
  ],
};
