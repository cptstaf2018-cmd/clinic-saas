// Run with: node --test lib/lab/result.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyResult, parseResultInput, summarizeFlags, buildResultMessage, orderTotal } from "./result.ts";

const hb = { refLowM: 13.5, refHighM: 17.5, refLowF: 12, refHighF: 15.5, critLow: 7, critHigh: 20 };

test("uses the female range for females and the male range for males", () => {
  assert.equal(classifyResult(12.5, hb, "f"), "normal");
  assert.equal(classifyResult(12.5, hb, "m"), "low");
  assert.equal(classifyResult(16, hb, "f"), "high");
  assert.equal(classifyResult(16, hb, "m"), "normal");
});

test("range edges are normal", () => {
  assert.equal(classifyResult(12, hb, "f"), "normal");
  assert.equal(classifyResult(15.5, hb, "f"), "normal");
});

test("critical limits override low/high and include the limit itself", () => {
  assert.equal(classifyResult(7, hb, "f"), "critical_low");
  assert.equal(classifyResult(5, hb, "m"), "critical_low");
  assert.equal(classifyResult(20, hb, "m"), "critical_high");
  assert.equal(classifyResult(6.9, hb, "f"), "critical_low");
});

test("one-sided ranges work (e.g. HbA1c only has an upper limit)", () => {
  const a1c = { refLowM: null, refHighM: 5.7, refLowF: null, refHighF: 5.7, critLow: null, critHigh: null };
  assert.equal(classifyResult(4.2, a1c, "f"), "normal");
  assert.equal(classifyResult(6.1, a1c, "f"), "high");
});

test("no reference range for the sex means no verdict", () => {
  const none = { refLowM: null, refHighM: null, refLowF: null, refHighF: null, critLow: null, critHigh: null };
  assert.equal(classifyResult(10, none, "m"), "none");
});

test("parses plain, decimal, comma and Arabic-Indic numbers", () => {
  assert.deepEqual(parseResultInput("132"), { ok: true, value: 132 });
  assert.deepEqual(parseResultInput(" 5.4 "), { ok: true, value: 5.4 });
  assert.deepEqual(parseResultInput("5,4"), { ok: true, value: 5.4 });
  assert.deepEqual(parseResultInput("٥٫٤"), { ok: true, value: 5.4 });
  assert.deepEqual(parseResultInput("١٣٢"), { ok: true, value: 132 });
});

test("rejects empty, text, negative and absurd values", () => {
  for (const bad of ["", "   ", "abc", "-3", "1e5", "12.3.4", "1000000000"]) {
    assert.equal(parseResultInput(bad).ok, false, bad);
  }
  assert.equal(parseResultInput(null).ok, false);
  assert.equal(parseResultInput(5).ok, true);
});

test("summarizes flags", () => {
  assert.deepEqual(summarizeFlags(["normal", "high", "critical_low", "normal", "none"]), { normal: 2, abnormal: 2, critical: 1 });
});

test("order total sums prices", () => {
  assert.equal(orderTotal([{ price: 5000 }, { price: 7500 }]), 12500);
  assert.equal(orderTotal([]), 0);
});

test("result message lists values, flags abnormal ones and never interprets", () => {
  const msg = buildResultMessage({
    labName: "مختبر النور",
    patientName: "زينب",
    link: "https://example.com/result/abc",
    items: [
      { name: "الهيموغلوبين", value: 11.2, unit: "g/dL", flag: "low" },
      { name: "سكر الصيام", value: 90, unit: "mg/dL", flag: "normal" },
    ],
  });
  assert.match(msg, /مختبر النور/);
  assert.match(msg, /زينب/);
  assert.match(msg, /الهيموغلوبين: 11\.2 g\/dL/);
  assert.match(msg, /منخفض/);
  assert.match(msg, /طبيعي/);
  assert.match(msg, /https:\/\/example\.com\/result\/abc/);
  assert.match(msg, /طبيبك/);
});

test("critical results add an urgent line", () => {
  const msg = buildResultMessage({
    labName: "م",
    patientName: "ع",
    link: "l",
    items: [{ name: "x", value: 1, unit: "u", flag: "critical_low" }],
  });
  assert.match(msg, /عاجل|فوراً/);
});

import { barGeometry } from "./result.ts";

test("range bar places the marker and zones inside 0-100", () => {
  const g = barGeometry({ low: 12, high: 15.5, critLow: 7, critHigh: 20, value: 11.2 });
  for (const n of [g.marker, g.normalFrom, g.normalTo]) assert.ok(n >= 0 && n <= 100, String(n));
  assert.ok(g.normalFrom < g.normalTo);
  assert.ok(g.marker < g.normalFrom, "a low value sits left of the normal zone");
  assert.ok(g.critFrom !== null && g.critTo !== null && g.critFrom < g.normalFrom && g.critTo > g.normalTo);
});

test("range bar clamps values far outside the scale", () => {
  const g = barGeometry({ low: 70, high: 99, critLow: 40, critHigh: 400, value: 9999 });
  assert.equal(g.marker, 100);
});

test("range bar handles a one-sided range", () => {
  const g = barGeometry({ low: null, high: 5.6, critLow: null, critHigh: null, value: 6.4 });
  assert.equal(g.normalFrom, 0);
  assert.ok(g.normalTo > 0 && g.normalTo < g.marker);
  assert.equal(g.critFrom, null);
});

test("range bar handles no range at all", () => {
  const g = barGeometry({ low: null, high: null, critLow: null, critHigh: null, value: 10 });
  assert.ok(g.marker >= 0 && g.marker <= 100);
});
