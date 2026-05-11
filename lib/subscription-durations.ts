export const TRIAL_PERIOD_DAYS = 14;
export const PAID_SUBSCRIPTION_DAYS = 30;

export function dateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
