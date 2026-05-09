export const PLAN_PRICES = {
  basic: 35000,
  standard: 45000,
  premium: 55000,
} as const;

export type PlanId = keyof typeof PLAN_PRICES;

export const PLAN_LABELS: Record<PlanId | "trial", string> = {
  trial: "تجريبي",
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "basic" || value === "standard" || value === "premium";
}

export function planFromAmount(amount: number): PlanId | null {
  const entry = Object.entries(PLAN_PRICES).find(([, price]) => price === amount);
  return entry ? (entry[0] as PlanId) : null;
}

export function encodePaymentReference(plan: PlanId, reference: string) {
  return `[plan:${plan}] ${reference.trim()}`;
}

export function extractPlanFromReference(reference?: string | null): PlanId | null {
  const match = reference?.match(/\[plan:(basic|standard|premium)\]/);
  return match ? (match[1] as PlanId) : null;
}

export function cleanPaymentReference(reference?: string | null) {
  return reference?.replace(/\[plan:(basic|standard|premium)\]\s*/, "").trim() || null;
}
