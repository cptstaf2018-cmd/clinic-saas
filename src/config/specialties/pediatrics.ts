import type { SpecialtyConfig } from "./types";

export const pediatricsConfig: SpecialtyConfig = {
  code: "pediatrics",
  nameAr: "أطفال",
  nameEn: "Pediatrics",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", placeholderAr: "حمى، سعال، ألم..." , required: true },
    { id: "weight", labelAr: "الوزن", labelEn: "Weight", kind: "number", placeholderAr: "كغم" },
    { id: "height", labelAr: "الطول", labelEn: "Height", kind: "number", placeholderAr: "سم" },
    { id: "temperature", labelAr: "الحرارة", labelEn: "Temperature", kind: "number", placeholderAr: "درجة الحرارة" },
    { id: "vaccination_status", labelAr: "حالة التطعيم", labelEn: "Vaccination status", kind: "textarea", placeholderAr: "آخر تطعيم، المتأخرات..." },
    { id: "growth_chart", labelAr: "منحنى النمو", labelEn: "Growth chart", kind: "textarea", placeholderAr: "ملاحظات النمو والمتابعة" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "growth_report", labelAr: "تقرير نمو", labelEn: "Growth report" },
    { id: "vaccination_certificate", labelAr: "شهادة تطعيم", labelEn: "Vaccination certificate" },
  ],
  quickDiagnoses: ["Upper Respiratory Infection", "Otitis Media", "Fever"],
  favoriteMedications: ["Paracetamol syrup", "Ibuprofen syrup", "ORS sachets"],
  dashboardWidgets: [
    { id: "growth_chart", labelAr: "منحنى النمو", labelEn: "Growth chart" },
    { id: "vaccinations_due", labelAr: "التطعيمات القادمة", labelEn: "Due vaccinations" },
  ],
};
