// Run with: node --test lib/free-period.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { FREE_PERIOD_END, isFreePeriodOpen, trialEndsAt } from "./free-period.ts";

const DAY = 86_400_000;

test("the free period ends at the very end of 31 December 2026, Baghdad time", () => {
  // 23:59:59 in Baghdad (UTC+3) is 20:59:59 UTC
  assert.equal(FREE_PERIOD_END.toISOString(), "2026-12-31T20:59:59.000Z");
});

test("the free period is open before the end and closed after it", () => {
  assert.equal(isFreePeriodOpen(new Date("2026-10-08T00:00:00Z")), true);
  assert.equal(isFreePeriodOpen(new Date("2026-12-31T20:59:58Z")), true);
  assert.equal(isFreePeriodOpen(new Date("2026-12-31T21:00:00Z")), false);
  assert.equal(isFreePeriodOpen(new Date("2027-03-01T00:00:00Z")), false);
});

test("while the period is open, a new trial lasts until its end", () => {
  assert.equal(trialEndsAt(new Date("2026-10-08T12:00:00Z")).getTime(), FREE_PERIOD_END.getTime());
});

test("a trial is never shorter than the normal 14 days", () => {
  // two days before the end: the regular 14-day trial is longer, so it wins
  const now = new Date("2026-12-29T12:00:00Z");
  assert.equal(trialEndsAt(now).getTime(), now.getTime() + 14 * DAY);
});

test("after the period, trials go back to 14 days", () => {
  const now = new Date("2027-02-01T00:00:00Z");
  assert.equal(trialEndsAt(now).getTime(), now.getTime() + 14 * DAY);
});

import { freePeriodDaysLeft } from "./free-period.ts";

test("days left counts down to zero and never goes negative", () => {
  assert.equal(freePeriodDaysLeft(new Date("2026-12-30T20:59:59Z")), 1);
  assert.equal(freePeriodDaysLeft(new Date("2026-12-31T20:59:59Z")), 0);
  assert.equal(freePeriodDaysLeft(new Date("2027-06-01T00:00:00Z")), 0);
  assert.ok(freePeriodDaysLeft(new Date("2026-10-08T00:00:00Z")) > 80);
});
