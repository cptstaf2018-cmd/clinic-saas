const DAY_MS = 24 * 60 * 60 * 1000;

export const SUBSCRIPTION_WARNING_DAYS = 7;
export const SUBSCRIPTION_GRACE_DAYS = 7;

type SubscriptionLike = {
  status?: string | null;
  expiresAt?: Date | string | null;
} | null | undefined;

export function subscriptionDaysLeft(subscription: SubscriptionLike, now = new Date()) {
  if (!subscription?.expiresAt) return 0;
  return Math.ceil((new Date(subscription.expiresAt).getTime() - now.getTime()) / DAY_MS);
}

export function subscriptionGraceDaysLeft(subscription: SubscriptionLike, now = new Date()) {
  const daysLeft = subscriptionDaysLeft(subscription, now);
  if (daysLeft >= 0) return 0;
  return Math.max(0, SUBSCRIPTION_GRACE_DAYS + daysLeft);
}

export function isSubscriptionHardLocked(subscription: SubscriptionLike, now = new Date()) {
  if (!subscription) return false;
  const daysLeft = subscriptionDaysLeft(subscription, now);
  return subscription.status === "inactive" && daysLeft < -SUBSCRIPTION_GRACE_DAYS;
}

export function getSubscriptionNotice(subscription: SubscriptionLike, now = new Date()) {
  if (!subscription?.expiresAt) return null;
  const daysLeft = subscriptionDaysLeft(subscription, now);
  if (subscription.status === "inactive" || daysLeft < 0) {
    const graceDaysLeft = subscriptionGraceDaysLeft(subscription, now);
    if (graceDaysLeft > 0) {
      return {
        tone: "expiredGrace" as const,
        title: "انتهت مدة تشغيل العيادة",
        message: `يمكنك الاطلاع على بياناتك مؤقتاً لمدة ${graceDaysLeft} يوم. جدّد الاشتراك لإعادة تشغيل الإضافات والواتساب بالكامل.`,
      };
    }
    return null;
  }
  if (daysLeft <= SUBSCRIPTION_WARNING_DAYS) {
    return {
      tone: "warning" as const,
      title: "اشتراكك ينتهي قريباً",
      message: `متبقي ${daysLeft} يوم على انتهاء الاشتراك. يمكنك التجديد الآن بدون إيقاف العمل.`,
    };
  }
  return null;
}
