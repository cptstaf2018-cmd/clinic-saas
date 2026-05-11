import { db } from "@/lib/db";

export const ASSISTANT_FEATURE = "clinicAssistant";
export const ASSISTANT_TRIAL_DAYS = 3;

type SubscriptionLike = {
  plan?: string | null;
  status?: string | null;
  expiresAt?: Date | string | null;
} | null | undefined;

export type AssistantAccess =
  | { allowed: true; source: "plan"; daysLeft: null; trialEndsAt: null }
  | { allowed: true; source: "trial"; daysLeft: number; trialEndsAt: string }
  | { allowed: false; source: "locked"; daysLeft: 0; trialEndsAt: string | null };

function isPaidAssistantPlan(subscription: SubscriptionLike) {
  if (!subscription) return false;
  const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
  return (
    subscription.status === "active" &&
    (subscription.plan === "standard" || subscription.plan === "premium") &&
    !!expiresAt &&
    expiresAt > new Date()
  );
}

function trialEndsAt(startedAt: Date) {
  const date = new Date(startedAt);
  date.setDate(date.getDate() + ASSISTANT_TRIAL_DAYS);
  return date;
}

export async function getAssistantAccess(clinicId: string, subscription: SubscriptionLike, startTrial: boolean): Promise<AssistantAccess> {
  if (isPaidAssistantPlan(subscription)) {
    return { allowed: true, source: "plan", daysLeft: null, trialEndsAt: null };
  }

  let trial = await db.clinicFeatureTrial.findUnique({
    where: { clinicId_feature: { clinicId, feature: ASSISTANT_FEATURE } },
  });

  if (!trial && startTrial) {
    trial = await db.clinicFeatureTrial.create({
      data: { clinicId, feature: ASSISTANT_FEATURE },
    });
  }

  if (!trial) {
    return { allowed: false, source: "locked", daysLeft: 0, trialEndsAt: null };
  }

  const endsAt = trialEndsAt(trial.startedAt);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000));
  if (endsAt > new Date()) {
    return { allowed: true, source: "trial", daysLeft, trialEndsAt: endsAt.toISOString() };
  }

  return { allowed: false, source: "locked", daysLeft: 0, trialEndsAt: endsAt.toISOString() };
}
