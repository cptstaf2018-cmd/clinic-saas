export const PLAN_PRICES = {
  basic: 35000,
  standard: 45000,
  premium: 55000,
  vip: 75000,
} as const;

export type PlanId = keyof typeof PLAN_PRICES;
export type SubscriptionDurationId = "monthly" | "quarterly" | "semiannual" | "annual";

export const SUBSCRIPTION_DURATIONS: Record<SubscriptionDurationId, {
  label: string;
  shortLabel: string;
  months: number;
  days: number;
  discountPercent: number;
  badge?: string;
}> = {
  monthly: {
    label: "شهري",
    shortLabel: "شهر",
    months: 1,
    days: 30,
    discountPercent: 0,
  },
  quarterly: {
    label: "3 أشهر",
    shortLabel: "3 أشهر",
    months: 3,
    days: 90,
    discountPercent: 5,
  },
  semiannual: {
    label: "6 أشهر",
    shortLabel: "6 أشهر",
    months: 6,
    days: 180,
    discountPercent: 10,
    badge: "الأكثر اختياراً",
  },
  annual: {
    label: "سنوي",
    shortLabel: "سنة",
    months: 12,
    days: 365,
    discountPercent: 20,
    badge: "أفضل قيمة",
  },
};

export const PLAN_LABELS: Record<PlanId | "trial", string> = {
  trial: "تجريبي",
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
  vip: "مميزة VIP",
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "basic" || value === "standard" || value === "premium" || value === "vip";
}

export function planFromAmount(amount: number): PlanId | null {
  const entry = Object.entries(PLAN_PRICES).find(([, price]) => price === amount);
  return entry ? (entry[0] as PlanId) : null;
}

export function isSubscriptionDurationId(value: unknown): value is SubscriptionDurationId {
  return value === "monthly" || value === "quarterly" || value === "semiannual" || value === "annual";
}

export function getPlanDurationPrice(plan: PlanId, duration: SubscriptionDurationId) {
  const base = PLAN_PRICES[plan] * SUBSCRIPTION_DURATIONS[duration].months;
  const discount = Math.round(base * SUBSCRIPTION_DURATIONS[duration].discountPercent / 100);
  return base - discount;
}

export function encodePaymentReference(plan: PlanId, reference: string, duration: SubscriptionDurationId = "monthly") {
  return `[plan:${plan}] [duration:${duration}] ${reference.trim()}`;
}

export function extractPlanFromReference(reference?: string | null): PlanId | null {
  const match = reference?.match(/\[plan:(basic|standard|premium|vip)\]/);
  return match ? (match[1] as PlanId) : null;
}

export function extractDurationFromReference(reference?: string | null): SubscriptionDurationId {
  const match = reference?.match(/\[duration:(monthly|quarterly|semiannual|annual)\]/);
  return match && isSubscriptionDurationId(match[1]) ? match[1] : "monthly";
}

export function cleanPaymentReference(reference?: string | null) {
  return reference
    ?.replace(/\[plan:(basic|standard|premium|vip)\]\s*/, "")
    .replace(/\[duration:(monthly|quarterly|semiannual|annual)\]\s*/, "")
    .trim() || null;
}
