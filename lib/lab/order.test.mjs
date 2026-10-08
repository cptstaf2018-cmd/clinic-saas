// Run with: node --test lib/lab/order.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { canTransition, allResultsEntered, parseOrderInput, parseTestInput } from "./order.ts";

test("order moves forward one stage at a time", () => {
  assert.equal(canTransition("new", "in_progress"), true);
  assert.equal(canTransition("in_progress", "review"), true);
  assert.equal(canTransition("review", "done"), true);
});

test("order cannot skip or go backwards, and done is final", () => {
  assert.equal(canTransition("new", "done"), false);
  assert.equal(canTransition("new", "review"), false);
  assert.equal(canTransition("review", "new"), false);
  assert.equal(canTransition("done", "in_progress"), false);
  assert.equal(canTransition("done", "cancelled"), false);
  assert.equal(canTransition("cancelled", "new"), false);
});

test("an open order can be cancelled", () => {
  for (const from of ["new", "in_progress", "review"]) assert.equal(canTransition(from, "cancelled"), true, from);
});

test("unknown statuses are rejected", () => {
  assert.equal(canTransition("new", "banana"), false);
  assert.equal(canTransition("banana", "new"), false);
});

test("results are complete only when every item has one", () => {
  assert.equal(allResultsEntered([{ result: 5 }, { result: 0 }]), true);
  assert.equal(allResultsEntered([{ result: 5 }, { result: null }]), false);
  assert.equal(allResultsEntered([]), false);
});

test("parses a valid order", () => {
  const r = parseOrderInput({ patientName: "  زينب حسن ", patientPhone: "07701234567", sex: "f", age: "34", doctorName: "د. علي", urgent: true, testIds: ["a", "b", "a"] });
  assert.equal(r.ok, true);
  assert.equal(r.value.patientName, "زينب حسن");
  assert.equal(r.value.sex, "f");
  assert.equal(r.value.age, 34);
  assert.equal(r.value.urgent, true);
  assert.deepEqual(r.value.testIds, ["a", "b"]);
});

test("order requires name, sex and at least one test", () => {
  assert.equal(parseOrderInput({ sex: "f", testIds: ["a"] }).ok, false);
  assert.equal(parseOrderInput({ patientName: "x", sex: "z", testIds: ["a"] }).ok, false);
  assert.equal(parseOrderInput({ patientName: "x", sex: "m", testIds: [] }).ok, false);
  assert.equal(parseOrderInput({ patientName: "x", sex: "m" }).ok, false);
});

test("order rejects bad age, bad phone and too many tests", () => {
  assert.equal(parseOrderInput({ patientName: "x", sex: "m", testIds: ["a"], age: 200 }).ok, false);
  assert.equal(parseOrderInput({ patientName: "x", sex: "m", testIds: ["a"], patientPhone: "123" }).ok, false);
  assert.equal(parseOrderInput({ patientName: "x", sex: "m", testIds: Array.from({ length: 61 }, (_, i) => `t${i}`) }).ok, false);
});

test("phone and age are optional", () => {
  const r = parseOrderInput({ patientName: "x", sex: "m", testIds: ["a"] });
  assert.equal(r.ok, true);
  assert.equal(r.value.patientPhone, null);
  assert.equal(r.value.age, null);
});

test("parses a test with ranges and defaults", () => {
  const r = parseTestInput({ name: "الهيموغلوبين", unit: "g/dL", price: "5000", refLowM: "13.5", refHighM: 17.5, refLowF: 12, refHighF: 15.5, critLow: 7, critHigh: 20 });
  assert.equal(r.ok, true);
  assert.equal(r.value.price, 5000);
  assert.equal(r.value.refLowM, 13.5);
  assert.equal(r.value.category, "أخرى");
});

test("blank range fields become null", () => {
  const r = parseTestInput({ name: "x", refLowM: "", refHighM: "5.6" });
  assert.equal(r.ok, true);
  assert.equal(r.value.refLowM, null);
  assert.equal(r.value.refHighM, 5.6);
});

test("test needs a name; ranges must make sense", () => {
  assert.equal(parseTestInput({}).ok, false);
  assert.equal(parseTestInput({ name: "x", refLowM: 10, refHighM: 5 }).ok, false);
  assert.equal(parseTestInput({ name: "x", critLow: 10, critHigh: 5 }).ok, false);
  assert.equal(parseTestInput({ name: "x", refLowM: "abc" }).ok, false);
  assert.equal(parseTestInput({ name: "x", price: -1 }).ok, false);
});

test("partial test update only touches given fields", () => {
  const r = parseTestInput({ price: 8000 }, true);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { price: 8000 });
  assert.equal(parseTestInput({}, true).ok, false);
});
