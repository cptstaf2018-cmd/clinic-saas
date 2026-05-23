import type { PlanId } from "@/lib/plans";

const SPECIALTY_SUBSCRIPTION_RULES: Record<string, {
  title: string;
  description: string;
  allowedPlans: PlanId[];
  badge: string;
}> = {
  dentistry: {
    title: "اشتراك الأسنان الخاص",
    description: "يشمل خريطة الأسنان، تسجيل الزيارة، الأشعة والملاحظات، الوصفات، وملفات المراجع.",
    allowedPlans: ["vip"],
    badge: "خاص بطب الأسنان",
  },
  aesthetic: {
    title: "اشتراك التجميل الخاص",
    description: "يشمل خريطة وجه وجسم، صور قبل/بعد، جلسات ومتابعات، مرفقات، ووصفات.",
    allowedPlans: ["vip"],
    badge: "خاص بالتجميل",
  },
};

const DEFAULT_ALLOWED_PLANS: PlanId[] = ["basic", "standard", "premium", "vip"];

export function getSubscriptionRuleForSpecialty(specialty?: string | null) {
  return specialty ? SPECIALTY_SUBSCRIPTION_RULES[specialty] ?? null : null;
}

export function getAllowedPlansForSpecialty(specialty?: string | null): PlanId[] {
  return getSubscriptionRuleForSpecialty(specialty)?.allowedPlans ?? DEFAULT_ALLOWED_PLANS;
}
