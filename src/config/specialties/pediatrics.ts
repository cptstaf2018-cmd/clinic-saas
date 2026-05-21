import type { SpecialtyConfig } from "./types";

export const pediatricsConfig: SpecialtyConfig = {
  code: "pediatrics",
  nameAr: "أطفال",
  nameEn: "Pediatrics",
  encounterSections: [
    { id: "chief_complaint",    labelAr: "الشكوى الرئيسية",     labelEn: "Chief complaint",    kind: "text",     placeholderAr: "حمى، سعال، ألم...", required: true },
    { id: "weight",             labelAr: "الوزن (كغم)",         labelEn: "Weight",             kind: "number",   placeholderAr: "كغم" },
    { id: "height",             labelAr: "الطول (سم)",          labelEn: "Height",             kind: "number",   placeholderAr: "سم" },
    { id: "head_circumference", labelAr: "محيط الرأس (سم)",     labelEn: "Head circumference", kind: "number",   placeholderAr: "سم" },
    { id: "temperature",        labelAr: "الحرارة (°C)",        labelEn: "Temperature",        kind: "number",   placeholderAr: "°C" },
    { id: "developmental_milestone", labelAr: "مراحل النمو",   labelEn: "Developmental milestones", kind: "textarea", placeholderAr: "يمشي، يتكلم، يجلس بمساعدة..." },
    { id: "feeding",            labelAr: "التغذية",             labelEn: "Feeding",            kind: "select",   options: ["رضاعة طبيعية", "رضاعة صناعية", "مختلط", "وجبات عادية"] },
    { id: "vaccination_status", labelAr: "حالة التطعيم",       labelEn: "Vaccination status", kind: "textarea", placeholderAr: "آخر تطعيم، المتأخرات، التالي..." },
    { id: "growth_notes",       labelAr: "ملاحظات النمو",       labelEn: "Growth notes",       kind: "textarea", placeholderAr: "مقارنة بمنحنى النمو الطبيعي" },
  ],
  documentTypes: [
    { id: "prescription",            labelAr: "وصفة طبية",        labelEn: "Prescription" },
    { id: "growth_report",           labelAr: "تقرير نمو",         labelEn: "Growth report" },
    { id: "vaccination_certificate", labelAr: "شهادة تطعيم",       labelEn: "Vaccination certificate" },
    { id: "school_fitness",          labelAr: "شهادة لياقة مدرسية", labelEn: "School fitness certificate" },
  ],
  quickDiagnoses: ["Upper Respiratory Infection", "Otitis Media", "Fever", "Gastroenteritis", "Tonsillitis", "Bronchiolitis", "Chicken Pox"],
  favoriteMedications: ["Paracetamol syrup 120mg/5ml", "Ibuprofen syrup 100mg/5ml", "ORS sachets", "Amoxicillin suspension", "Cetirizine syrup", "Salbutamol nebulizer"],
  dashboardWidgets: [
    { id: "growth_chart",     labelAr: "منحنى النمو",       labelEn: "Growth chart" },
    { id: "vaccinations_due", labelAr: "التطعيمات القادمة", labelEn: "Due vaccinations" },
  ],
};
