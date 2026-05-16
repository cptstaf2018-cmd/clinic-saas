import { isPlanId, PlanId } from "@/lib/plans";

export type FeatureKey =
  | "appointments"
  | "queueDisplay"
  | "medicalRecords"
  | "followUpTracking"
  | "autoReminders"
  | "dailyReports"
  | "patientPdfExport"
  | "patientImages"
  | "advancedWhatsApp"
  | "clinicAssistant"
  | "prioritySupport"
  | "auditLog"
  | "backupRestore"
  | "cheerMessages"
  | "fullMedicalFile";

type PlanWithTrial = PlanId | "trial";

export const PLAN_DISPLAY: Record<PlanWithTrial, { name: string; shortName: string; rank: number }> = {
  trial:   { name: "تجريبي",     shortName: "تجريبي", rank: 0 },
  basic:   { name: "أساسية",     shortName: "أساسية",  rank: 1 },
  standard:{ name: "متوسطة",     shortName: "متوسطة",  rank: 2 },
  premium: { name: "مميزة",      shortName: "مميزة",   rank: 3 },
  vip:     { name: "مميزة VIP",  shortName: "VIP",     rank: 4 },
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  appointments: "الحجوزات وإدارة المواعيد",
  queueDisplay: "شاشة الانتظار ونداء المرضى",
  medicalRecords: "السجل الطبي والوصفات",
  followUpTracking: "تتبع حالة المريض والمراجعات",
  autoReminders: "تذكيرات واتساب التلقائية",
  dailyReports: "التقارير اليومية",
  patientPdfExport: "تصدير تقارير المرضى PDF",
  patientImages: "رفع صور وتحاليل المرضى",
  advancedWhatsApp: "متابعة وردود واتساب متقدمة",
  clinicAssistant: "مساعد استخدام العيادة",
  prioritySupport: "دعم أولوية",
  auditLog: "سجل التدقيق",
  backupRestore: "نسخ احتياطي مع استرجاع",
  cheerMessages: "رسائل اطمئنان تلقائية للمرضى",
  fullMedicalFile: "الملف الطبي الكامل — تحاليل وأشعة ووصفات",
};

const ALL_FEATURES: FeatureKey[] = [
  "appointments",
  "queueDisplay",
  "medicalRecords",
  "followUpTracking",
  "autoReminders",
  "dailyReports",
  "patientPdfExport",
  "patientImages",
  "advancedWhatsApp",
  "clinicAssistant",
  "prioritySupport",
  "auditLog",
  "backupRestore",
  "cheerMessages",
];

const PLAN_FEATURES: Record<PlanWithTrial, FeatureKey[]> = {
  // Trial: full access to evaluate every feature
  trial: [...ALL_FEATURES, "fullMedicalFile"],
  // أساسية — المرضى والحجوزات + شاشة الانتظار + السجل الطبي + تقرير يومي
  basic: [
    "appointments",
    "queueDisplay",
    "medicalRecords",
    "dailyReports",
  ],
  // متوسطة — يضيف: تذكيرات واتساب + متابعة مراجعات + تقارير PDF
  standard: [
    "appointments",
    "queueDisplay",
    "medicalRecords",
    "dailyReports",
    "autoReminders",
    "followUpTracking",
    "patientPdfExport",
  ],
  // مميزة — يضيف: واتساب متقدم + دعم أولوية + نسخ احتياطي + مساعد ذكي
  premium: [
    "appointments",
    "queueDisplay",
    "medicalRecords",
    "dailyReports",
    "autoReminders",
    "followUpTracking",
    "patientPdfExport",
    "advancedWhatsApp",
    "prioritySupport",
    "backupRestore",
    "auditLog",
    "clinicAssistant",
  ],
  // مميزة VIP — يضيف: تحاليل وأشعة + رفع ملفات + رسائل اطمئنان + الملف الطبي الكامل
  vip: [...ALL_FEATURES, "fullMedicalFile"],
};

export const PLAN_LIMITS: Record<PlanWithTrial, { users: number; whatsappMessages: number; storageGb: number }> = {
  trial:   { users: 1,  whatsappMessages: 150,   storageGb: 1   },
  basic:   { users: 2,  whatsappMessages: 500,   storageGb: 2   },
  standard:{ users: 6,  whatsappMessages: 2500,  storageGb: 20  },
  premium: { users: 25, whatsappMessages: 10000, storageGb: 100 },
  vip:     { users: 50, whatsappMessages: 25000, storageGb: 500 },
};

export function normalizePlan(plan: string | null | undefined): PlanWithTrial {
  if (plan === "trial") return "trial";
  if (plan === "vip") return "vip";
  return isPlanId(plan) ? plan : "basic";
}

export function getPlanFeatures(plan: string | null | undefined) {
  return PLAN_FEATURES[normalizePlan(plan)];
}

export function canUseFeature(plan: string | null | undefined, feature: FeatureKey) {
  return getPlanFeatures(plan).includes(feature);
}

export function getUpgradePlanForFeature(feature: FeatureKey): PlanId {
  if (["patientImages", "cheerMessages", "fullMedicalFile"].includes(feature)) {
    return "vip";
  }
  if (["advancedWhatsApp", "prioritySupport", "backupRestore", "auditLog", "clinicAssistant"].includes(feature)) {
    return "premium";
  }
  return "standard";
}

export function upgradeMessage(feature: FeatureKey) {
  const targetPlan = getUpgradePlanForFeature(feature);
  return `${FEATURE_LABELS[feature]} متاح في باقة ${PLAN_DISPLAY[targetPlan].name}.`;
}

export function getEntitlements(plan: string | null | undefined) {
  const normalized = normalizePlan(plan);
  return {
    plan: normalized,
    display: PLAN_DISPLAY[normalized],
    features: PLAN_FEATURES[normalized],
    limits: PLAN_LIMITS[normalized],
  };
}
