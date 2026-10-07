// Run with: node --test lib/pharmacy/sale.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSale, validatePayment } from "./sale.ts";

const products = [
  { id: "p1", name: "بنادول", price: 3000, cost: 2100, stock: 10, active: true },
  { id: "p2", name: "فيتامين د", price: 12000, cost: 7500, stock: 2, active: true },
  { id: "p3", name: "منتج موقوف", price: 5000, cost: 3000, stock: 50, active: false },
];

test("computes totals, cost and profit from server prices", () => {
  const r = computeSale([{ productId: "p1", qty: 2 }, { productId: "p2", qty: 1 }], products);
  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 18000);
  assert.equal(r.discount, 0);
  assert.equal(r.total, 18000);
  assert.equal(r.cost, 11700);
  assert.equal(r.profit, 6300);
  assert.deepEqual(r.items.map((i) => [i.productId, i.qty, i.lineTotal]), [["p1", 2, 6000], ["p2", 1, 12000]]);
});

test("merges duplicate lines of the same product", () => {
  const r = computeSale([{ productId: "p1", qty: 1 }, { productId: "p1", qty: 2 }], products);
  assert.equal(r.ok, true);
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].qty, 3);
});

test("applies a valid discount", () => {
  const r = computeSale([{ productId: "p2", qty: 2 }], products, 4000);
  assert.equal(r.ok, true);
  assert.equal(r.total, 20000);
  assert.equal(r.profit, 5000);
});

test("rejects discount larger than subtotal or negative", () => {
  assert.equal(computeSale([{ productId: "p1", qty: 1 }], products, 3001).ok, false);
  assert.equal(computeSale([{ productId: "p1", qty: 1 }], products, -1).ok, false);
  assert.equal(computeSale([{ productId: "p1", qty: 1 }], products, 1.5).ok, false);
});

test("rejects quantity above available stock", () => {
  const r = computeSale([{ productId: "p2", qty: 3 }], products);
  assert.equal(r.ok, false);
  assert.match(r.error, /فيتامين د/);
});

test("rejects merged quantity above stock", () => {
  assert.equal(computeSale([{ productId: "p2", qty: 1 }, { productId: "p2", qty: 2 }], products).ok, false);
});

test("rejects unknown, inactive, empty and invalid quantities", () => {
  assert.equal(computeSale([], products).ok, false);
  assert.equal(computeSale([{ productId: "nope", qty: 1 }], products).ok, false);
  assert.equal(computeSale([{ productId: "p3", qty: 1 }], products).ok, false);
  assert.equal(computeSale([{ productId: "p1", qty: 0 }], products).ok, false);
  assert.equal(computeSale([{ productId: "p1", qty: 1.5 }], products).ok, false);
  assert.equal(computeSale([{ productId: "p1", qty: "2" }], products).ok, false);
});

test("payment: accepts cash and zaincash without customer", () => {
  assert.equal(validatePayment("cash", {}).ok, true);
  assert.equal(validatePayment("zaincash", {}).ok, true);
});

test("payment: debt requires a customer name or phone", () => {
  assert.equal(validatePayment("debt", {}).ok, false);
  assert.equal(validatePayment("debt", { customerName: "  " }).ok, false);
  assert.equal(validatePayment("debt", { customerName: "أبو علي" }).ok, true);
  assert.equal(validatePayment("debt", { customerPhone: "07701234567" }).ok, true);
});

test("payment: rejects unknown method", () => {
  assert.equal(validatePayment("card", {}).ok, false);
});
