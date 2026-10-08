const REGULAR_TRIAL_DAYS = 14; // keep equal to TRIAL_PERIOD_DAYS in subscription-durations.ts

/**
 * Launch offer: every account is free, with every feature, until the end of 2026
 * (Baghdad time, UTC+3). While it is open, customers see no prices, no payment
 * methods and no subscription screens. When it ends, everything comes back on its own.
 */
export const FREE_PERIOD_END = new Date("2026-12-31T20:59:59.000Z");

/** Shown on public pages. Update before the end date, together with the plans. */
export const FREE_PERIOD_LABEL = "مجاناً حتى نهاية ٢٠٢٦";

export function isFreePeriodOpen(now: Date = new Date()): boolean {
  return now.getTime() <= FREE_PERIOD_END.getTime();
}

/** Where a new trial ends: the end of the free period, but never sooner than the regular trial. */
export function trialEndsAt(now: Date = new Date()): Date {
  const regular = new Date(now.getTime());
  regular.setDate(regular.getDate() + REGULAR_TRIAL_DAYS);
  return isFreePeriodOpen(now) && FREE_PERIOD_END.getTime() > regular.getTime() ? new Date(FREE_PERIOD_END.getTime()) : regular;
}

/** Whole days left in the free period, never negative. */
export function freePeriodDaysLeft(now: Date = new Date()): number {
  return Math.max(0, Math.ceil((FREE_PERIOD_END.getTime() - now.getTime()) / 86_400_000));
}
