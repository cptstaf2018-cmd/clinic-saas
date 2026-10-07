// Run with: node --test lib/pharmacy/product.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseProduct } from "./product.ts";

test("parses a full product with defaults", () => {
  const r = parseProduct({ name: "  بنادول  ", price: "3000" });
  assert.equal(r.ok, true);
  assert.equal(r.value.name, "بنادول");
  assert.equal(r.value.price, 3000);
  assert.equal(r.value.cost, 0);
  assert.equal(r.value.stock, 0);
  assert.equal(r.value.category, "أدوية");
  assert.equal(r.value.requiresRx, false);
  assert.equal(r.value.expiresAt, null);
});

test("requires name and a valid price on create", () => {
  assert.equal(parseProduct({ price: 1000 }).ok, false);
  assert.equal(parseProduct({ name: "x" }).ok, false);
  assert.equal(parseProduct({ name: "x", price: -5 }).ok, false);
  assert.equal(parseProduct({ name: "x", price: 10.5 }).ok, false);
});

test("rejects unknown category and bad expiry", () => {
  assert.equal(parseProduct({ name: "x", price: 1, category: "سيارات" }).ok, false);
  assert.equal(parseProduct({ name: "x", price: 1, expiresAt: "not-a-date" }).ok, false);
});

test("partial update only touches given fields", () => {
  const r = parseProduct({ stock: 25 }, true);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { stock: 25 });
});

test("partial update with nothing to change fails", () => {
  assert.equal(parseProduct({ unknown: 1 }, true).ok, false);
});
