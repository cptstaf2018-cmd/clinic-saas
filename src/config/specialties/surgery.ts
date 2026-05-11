import type { SpecialtyConfig } from "./types";

export const surgeryConfig: SpecialtyConfig = {
  code: "surgery",
  nameAr: "جراحة عامة",
  nameEn: "General Surgery",
  encounterSections: [
    { id: "chief_complaint", labelAr: "الشكوى الرئيسية", labelEn: "Chief complaint", kind: "text", required: true },
    { id: "procedure", labelAr: "الإجراء", labelEn: "Procedure", kind: "textarea" },
    { id: "wound_exam", labelAr: "فحص الجرح", labelEn: "Wound exam", kind: "textarea" },
    { id: "anesthesia_notes", labelAr: "ملاحظات التخدير", labelEn: "Anesthesia notes", kind: "textarea" },
    { id: "post_op_plan", labelAr: "خطة ما بعد العملية", labelEn: "Post-op plan", kind: "textarea" },
  ],
  documentTypes: [
    { id: "prescription", labelAr: "وصفة طبية", labelEn: "Prescription" },
    { id: "operation_note", labelAr: "ملاحظة عملية", labelEn: "Operation note" },
    { id: "surgical_report", labelAr: "تقرير جراحي", labelEn: "Surgical report" },
  ],
  quickDiagnoses: ["Appendicitis", "Abscess", "Hernia"],
  favoriteMedications: ["Ceftriaxone 1g", "Paracetamol IV", "Metronidazole 500mg"],
  dashboardWidgets: [
    { id: "post_op_followups", labelAr: "متابعة ما بعد العملية", labelEn: "Post-op follow-ups" },
    { id: "procedure_schedule", labelAr: "جدول الإجراءات", labelEn: "Procedure schedule" },
  ],
};
