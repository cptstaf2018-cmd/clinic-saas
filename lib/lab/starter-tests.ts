import type { TestInput } from "./order";

/**
 * Common adult tests with GENERAL reference ranges, so a new lab does not start
 * from an empty catalog. Every lab must review these against its own analyzers
 * and reagent inserts; prices are left at 0 for the lab to set.
 */
type Starter = Pick<TestInput, "name" | "nameEn" | "category" | "unit" | "refLowM" | "refHighM" | "refLowF" | "refHighF" | "critLow" | "critHigh">;

const both = (low: number | null, high: number | null) => ({ refLowM: low, refHighM: high, refLowF: low, refHighF: high });

export const STARTER_TESTS: Starter[] = [
  { name: "الهيموغلوبين", nameEn: "Hemoglobin", category: "دم", unit: "g/dL", refLowM: 13.5, refHighM: 17.5, refLowF: 12, refHighF: 15.5, critLow: 7, critHigh: 20 },
  { name: "كريات الدم البيضاء", nameEn: "WBC", category: "دم", unit: "×10³/µL", ...both(4, 11), critLow: 2, critHigh: 30 },
  { name: "الصفائح الدموية", nameEn: "Platelets", category: "دم", unit: "×10³/µL", ...both(150, 450), critLow: 50, critHigh: 1000 },
  { name: "الهيماتوكريت", nameEn: "HCT", category: "دم", unit: "%", refLowM: 41, refHighM: 50, refLowF: 36, refHighF: 44, critLow: 20, critHigh: 60 },
  { name: "كريات الدم الحمراء", nameEn: "RBC", category: "دم", unit: "×10⁶/µL", refLowM: 4.5, refHighM: 5.9, refLowF: 4.1, refHighF: 5.1, critLow: null, critHigh: null },
  { name: "سرعة الترسيب", nameEn: "ESR", category: "دم", unit: "mm/hr", refLowM: 0, refHighM: 15, refLowF: 0, refHighF: 20, critLow: null, critHigh: null },
  { name: "سكر الصيام", nameEn: "FBS", category: "كيمياء حيوية", unit: "mg/dL", ...both(70, 99), critLow: 40, critHigh: 400 },
  { name: "سكر عشوائي", nameEn: "RBS", category: "كيمياء حيوية", unit: "mg/dL", ...both(70, 140), critLow: 40, critHigh: 400 },
  { name: "السكر التراكمي", nameEn: "HbA1c", category: "كيمياء حيوية", unit: "%", ...both(null, 5.6), critLow: null, critHigh: null },
  { name: "الكرياتينين", nameEn: "Creatinine", category: "كيمياء حيوية", unit: "mg/dL", refLowM: 0.7, refHighM: 1.3, refLowF: 0.6, refHighF: 1.1, critLow: null, critHigh: 6 },
  { name: "اليوريا", nameEn: "Urea", category: "كيمياء حيوية", unit: "mg/dL", ...both(15, 45), critLow: null, critHigh: null },
  { name: "حمض اليوريك", nameEn: "Uric acid", category: "كيمياء حيوية", unit: "mg/dL", refLowM: 3.4, refHighM: 7, refLowF: 2.4, refHighF: 6, critLow: null, critHigh: null },
  { name: "إنزيم الكبد ALT", nameEn: "ALT", category: "كيمياء حيوية", unit: "U/L", ...both(7, 56), critLow: null, critHigh: null },
  { name: "إنزيم الكبد AST", nameEn: "AST", category: "كيمياء حيوية", unit: "U/L", ...both(8, 48), critLow: null, critHigh: null },
  { name: "الفوسفاتاز القلوي", nameEn: "ALP", category: "كيمياء حيوية", unit: "U/L", ...both(40, 129), critLow: null, critHigh: null },
  { name: "البيليروبين الكلي", nameEn: "Total bilirubin", category: "كيمياء حيوية", unit: "mg/dL", ...both(0.1, 1.2), critLow: null, critHigh: null },
  { name: "الكوليسترول الكلي", nameEn: "Cholesterol", category: "كيمياء حيوية", unit: "mg/dL", ...both(null, 199), critLow: null, critHigh: null },
  { name: "الدهون الثلاثية", nameEn: "Triglycerides", category: "كيمياء حيوية", unit: "mg/dL", ...both(null, 149), critLow: null, critHigh: null },
  { name: "الكوليسترول الجيد HDL", nameEn: "HDL", category: "كيمياء حيوية", unit: "mg/dL", refLowM: 40, refHighM: null, refLowF: 50, refHighF: null, critLow: null, critHigh: null },
  { name: "الكوليسترول الضار LDL", nameEn: "LDL", category: "كيمياء حيوية", unit: "mg/dL", ...both(null, 129), critLow: null, critHigh: null },
  { name: "الصوديوم", nameEn: "Sodium", category: "كيمياء حيوية", unit: "mmol/L", ...both(135, 145), critLow: 120, critHigh: 160 },
  { name: "البوتاسيوم", nameEn: "Potassium", category: "كيمياء حيوية", unit: "mmol/L", ...both(3.5, 5.1), critLow: 2.5, critHigh: 6.5 },
  { name: "الكالسيوم", nameEn: "Calcium", category: "كيمياء حيوية", unit: "mg/dL", ...both(8.6, 10.2), critLow: 6.5, critHigh: 13 },
  { name: "الهرمون الدرقي TSH", nameEn: "TSH", category: "هرمونات", unit: "mIU/L", ...both(0.4, 4), critLow: null, critHigh: null },
  { name: "فيتامين د", nameEn: "Vitamin D", category: "فيتامينات", unit: "ng/mL", ...both(30, 100), critLow: null, critHigh: null },
  { name: "فيتامين B12", nameEn: "Vitamin B12", category: "فيتامينات", unit: "pg/mL", ...both(200, 900), critLow: null, critHigh: null },
  { name: "الفيريتين", nameEn: "Ferritin", category: "فيتامينات", unit: "ng/mL", refLowM: 24, refHighM: 336, refLowF: 11, refHighF: 307, critLow: null, critHigh: null },
  { name: "بروتين سي التفاعلي", nameEn: "CRP", category: "مناعة", unit: "mg/L", ...both(null, 5), critLow: null, critHigh: null },
];
