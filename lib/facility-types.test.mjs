// Run with: node --test lib/facility-types.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFacilityChoice, isFacilityType } from "./facility-types.ts";

test("accepts each facility type with a trimmed name", () => {
  for (const type of ["clinic", "lab", "pharmacy"]) {
    const r = parseFacilityChoice({ facilityType: type, name: "  مختبر النور  " });
    assert.equal(r.ok, true);
    assert.deepEqual(r.value, { facilityType: type, name: "مختبر النور" });
  }
});

test("rejects unknown types and non-objects", () => {
  assert.equal(parseFacilityChoice({ facilityType: "hospital", name: "x y" }).ok, false);
  assert.equal(parseFacilityChoice({ name: "مختبر النور" }).ok, false);
  assert.equal(parseFacilityChoice(null).ok, false);
  assert.equal(parseFacilityChoice("lab").ok, false);
});

test("the facility name is required, 2-80 characters", () => {
  assert.equal(parseFacilityChoice({ facilityType: "lab" }).ok, false);
  assert.equal(parseFacilityChoice({ facilityType: "lab", name: "   " }).ok, false);
  assert.equal(parseFacilityChoice({ facilityType: "lab", name: "ب" }).ok, false);
  assert.equal(parseFacilityChoice({ facilityType: "lab", name: "ب".repeat(81) }).ok, false);
  assert.equal(parseFacilityChoice({ facilityType: "lab", name: "ب".repeat(80) }).ok, true);
  assert.equal(parseFacilityChoice({ facilityType: "lab", name: 12345 }).ok, false);
});

test("isFacilityType only trusts the three known keys", () => {
  assert.equal(isFacilityType("clinic"), true);
  assert.equal(isFacilityType("Lab"), false);
  assert.equal(isFacilityType(undefined), false);
});
