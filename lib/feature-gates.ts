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
  | "multiBranch"
  | "prioritySupport"
  | "auditLog"
  | "backupRestore";

type PlanWithTrial = PlanId | "trial";

export const PLAN_DISPLAY: Record<PlanWithTrial, { name: string; shortName: string; rank: number }> = {
  trial: { name: "تجريبي", shortName: "Trial", rank: 0 },
  basic: { name: "Basic", shortName: "Basic", rank: 1 },
  standard: { name: "Pro", shortName: "Pro", rank: 2 },
  premium: { name: "Enterprise", shortName: "Enterprise", rank: 3 },
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
  multiBranch: "إدارة الفروع",
  prioritySupport: "دعم أولوية",
  auditLog: "سجل التدقيق",
  backupRestore: "نسخ احتياطي مع استرجاع",
};

const PLAN_FEATURES: Record<PlanWithTrial, FeatureKey[]> = {
  trial: ["appointments", "queueDisplay", "medicalRecords", "autoReminders", "dailyReports"],
  basic: ["appointments", "queueDisplay", "medicalRecords", "dailyReports"],
  standard: [
    "appointments",
    "queueDisplay",
    "medicalRecords",
    "followUpTracking",
    "autoReminders",
    "dailyReports",
    "patientPdfExport",
    "patientImages",
    "advancedWhatsApp",
  ],
  premium: [
    "appointments",
    "queueDisplay",
    "medicalRecords",
    "followUpTracking",
    "autoReminders",
    "dailyReports",
    "patientPdfExport",
    "patientImages",
    "advancedWhatsApp",
    "multiBranch",
    "prioritySupport",
    "auditLog",
    "backupRestore",
  ],
};

export const PLAN_LIMITS: Record<PlanWithTrial, { users: number; whatsappMessages: number; storageGb: number; branches: number }> = {
  trial: { users: 1, whatsappMessages: 150, storageGb: 1, branches: 1 },
  basic: { users: 2, whatsappMessages: 500, storageGb: 2, branches: 1 },
  standard: { users: 6, whatsappMessages: 2500, storageGb: 20, branches: 1 },
  premium: { users: 25, whatsappMessages: 10000, storageGb: 100, branches: 5 },
};

export function normalizePlan(plan: string | null | undefined): PlanWithTrial {
  if (plan === "trial") return "trial";
  return isPlanId(plan) ? plan : "basic";
}

export function getPlanFeatures(plan: string | null | undefined) {
  return PLAN_FEATURES[normalizePlan(plan)];
}

export function canUseFeature(plan: string | null | undefined, feature: FeatureKey) {
  return getPlanFeatures(plan).includes(feature);
}

export function getUpgradePlanForFeature(feature: FeatureKey): PlanId {
  if (["multiBranch", "prioritySupport", "auditLog", "backupRestore"].includes(feature)) {
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
