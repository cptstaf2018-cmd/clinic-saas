import { getPlanDurationPrice, PLAN_PRICES, SUBSCRIPTION_DURATIONS, type PlanId, type SubscriptionDurationId } from "@/lib/plans";

const SPECIALTY_SUBSCRIPTION_RULES: Record<string, {
  title: string;
  description: string;
  allowedPlans: PlanId[];
  monthlyPrice: number;
  badge: string;
}> = {
  dentistry: {
    title: "باقة الأسنان",
    description: "يشمل خريطة الأسنان، تسجيل الزيارة، الأشعة والملاحظات، الوصفات، وملفات المراجع.",
    allowedPlans: ["vip"],
    monthlyPrice: 65000,
    badge: "طب الأسنان",
  },
  aesthetic: {
    title: "باقة التجميل",
    description: "يشمل خريطة وجه وجسم، صور قبل/بعد، جلسات ومتابعات، مرفقات، ووصفات.",
    allowedPlans: ["vip"],
    monthlyPrice: 95000,
    badge: "التجميل",
  },
};

const DEFAULT_ALLOWED_PLANS: PlanId[] = ["basic", "standard", "premium", "vip"];

export function getSubscriptionRuleForSpecialty(specialty?: string | null) {
  return specialty ? SPECIALTY_SUBSCRIPTION_RULES[specialty] ?? null : null;
}

export function getAllowedPlansForSpecialty(specialty?: string | null): PlanId[] {
  return getSubscriptionRuleForSpecialty(specialty)?.allowedPlans ?? DEFAULT_ALLOWED_PLANS;
}

export function getSpecialtyPlanMonthlyPrice(plan: PlanId, specialty?: string | null) {
  const rule = getSubscriptionRuleForSpecialty(specialty);
  return rule?.allowedPlans.includes(plan) ? rule.monthlyPrice : PLAN_PRICES[plan];
}

export function getSpecialtyPlanDurationPrice(
  plan: PlanId,
  duration: SubscriptionDurationId,
  specialty?: string | null
) {
  const rule = getSubscriptionRuleForSpecialty(specialty);
  if (!rule?.allowedPlans.includes(plan)) return getPlanDurationPrice(plan, duration);
  const durationMeta = SUBSCRIPTION_DURATIONS[duration];
  const base = rule.monthlyPrice * durationMeta.months;
  const discount = Math.round(base * durationMeta.discountPercent / 100);
  return base - discount;
}
