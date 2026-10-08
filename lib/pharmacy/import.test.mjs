// Run with: node --test lib/pharmacy/import.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  IMPORT_CATEGORIES,
  guessMapping,
  mapCategory,
  normalizeText,
  parseBool,
  parseCount,
  parseExpiry,
  parseMoney,
  planImport,
  rowToImportRow,
  sanitizeImportRow,
  suggestPrice,
} from "./import.ts";
import { PRODUCT_CATEGORIES } from "./product.ts";

test("the import categories stay in step with the product categories", () => {
  assert.deepEqual([...IMPORT_CATEGORIES], [...PRODUCT_CATEGORIES]);
});

// ───────── headers ─────────
test("guesses Arabic headers", () => {
  const m = guessMapping(["اسم الدواء", "المادة الفعالة", "سعر البيع", "سعر الشراء", "الكمية", "الباركود", "تاريخ الانتهاء", "التصنيف"]);
  assert.deepEqual(m, { name: 0, genericName: 1, price: 2, cost: 3, stock: 4, barcode: 5, expiresAt: 6, category: 7, form: null, minStock: null, requiresRx: null });
});

test("guesses English headers, any case and spacing", () => {
  const m = guessMapping(["Item Name", "SELLING PRICE", "Cost", "Qty", "Barcode", "EXP", "Min Stock"]);
  assert.equal(m.name, 0);
  assert.equal(m.price, 1);
  assert.equal(m.cost, 2);
  assert.equal(m.stock, 3);
  assert.equal(m.barcode, 4);
  assert.equal(m.expiresAt, 5);
  assert.equal(m.minStock, 6);
});

test("a plain 'السعر' column is the selling price, and a column maps to one field only", () => {
  const m = guessMapping(["الدواء", "السعر", "العدد"]);
  assert.equal(m.name, 0);
  assert.equal(m.price, 1);
  assert.equal(m.stock, 2);
  assert.equal(new Set(Object.values(m).filter((v) => v !== null)).size, Object.values(m).filter((v) => v !== null).length);
});

test("unknown headers map to nothing", () => {
  const m = guessMapping(["ملاحظات", "xyz"]);
  assert.ok(Object.values(m).every((v) => v === null));
});

// ───────── cells ─────────
test("money and counts: plain, Arabic digits, separators, currency text", () => {
  assert.equal(parseMoney(3500), 3500);
  assert.equal(parseMoney("3500"), 3500);
  assert.equal(parseMoney("٣٥٠٠"), 3500);
  assert.equal(parseMoney("3,500"), 3500);
  assert.equal(parseMoney("3٬500"), 3500);
  assert.equal(parseMoney("3 500 د.ع"), 3500);
  assert.equal(parseMoney("1250.6"), 1251);
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney(-5), null);
  assert.equal(parseMoney(null), null);
});

test("counts are whole non-negative numbers", () => {
  assert.equal(parseCount("12"), 12);
  assert.equal(parseCount("١٢"), 12);
  assert.equal(parseCount(12.4), 12);
  assert.equal(parseCount("-3"), null);
  assert.equal(parseCount("many"), null);
  assert.equal(parseCount(undefined), null);
});

test("expiry dates from Date objects, ISO, d/m/y, m/y and Arabic digits", () => {
  assert.equal(parseExpiry(new Date(Date.UTC(2027, 5, 15))), "2027-06-15");
  assert.equal(parseExpiry("2027-06-15"), "2027-06-15");
  assert.equal(parseExpiry("15/06/2027"), "2027-06-15");
  assert.equal(parseExpiry("15-6-2027"), "2027-06-15");
  assert.equal(parseExpiry("06/2027"), "2027-06-30");
  assert.equal(parseExpiry("2/2028"), "2028-02-29");
  assert.equal(parseExpiry("2027-06"), "2027-06-30");
  assert.equal(parseExpiry("١٥/٠٦/٢٠٢٧"), "2027-06-15");
  assert.equal(parseExpiry("12/27"), "2027-12-31");
  assert.equal(parseExpiry("soon"), null);
  assert.equal(parseExpiry("31/02/2027"), null);
  assert.equal(parseExpiry(""), null);
});

test("yes/no cells", () => {
  for (const yes of ["نعم", "yes", "Y", "1", "بوصفة", "true", true]) assert.equal(parseBool(yes), true, String(yes));
  for (const no of ["لا", "no", "0", "", "false", false, null, undefined]) assert.equal(parseBool(no), false, String(no));
});

test("category words map to the known categories", () => {
  assert.equal(mapCategory("فيتامين"), "فيتامينات");
  assert.equal(mapCategory("عناية بالبشرة"), "عناية بالبشرة");
  assert.equal(mapCategory("اطفال"), "أطفال");
  assert.equal(mapCategory("مستلزمات"), "مستلزمات طبية");
  assert.equal(mapCategory("دواء"), "أدوية");
  assert.equal(mapCategory(""), "أدوية");
  assert.equal(mapCategory("سيارات"), "أخرى");
});

test("normalizeText unifies spelling so names match", () => {
  assert.equal(normalizeText("  أُوغمنتين   ٦٢٥ "), normalizeText("اوغمنتين 625"));
  assert.equal(normalizeText("بنادول"), normalizeText("بنادُول"));
  assert.equal(normalizeText("Panadol  Extra"), "panadol extra");
});

// ───────── rows ─────────
const M = { name: 0, genericName: 1, price: 2, cost: 3, stock: 4, barcode: 5, expiresAt: 6, category: 7, form: 8, minStock: 9, requiresRx: 10 };

test("a row becomes a clean import row", () => {
  const r = rowToImportRow(["  بنادول إكسترا ", "باراسيتامول", "3,500", "٢٥٠٠", "40", "6281001", "06/2027", "أدوية", "24 قرص", "10", "لا"], M);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.row, { name: "بنادول إكسترا", genericName: "باراسيتامول", price: 3500, cost: 2500, stock: 40, barcode: "6281001", expiresAt: "2027-06-30", category: "أدوية", form: "24 قرص", minStock: 10, requiresRx: false });
});

test("a barcode that Excel turned into a number loses no digits", () => {
  const r = rowToImportRow(["x", null, 100, null, null, 6281001234567, null, null, null, null, null], M);
  assert.equal(r.row.barcode, "6281001234567");
});

test("empty rows are skipped and a missing name is reported", () => {
  assert.equal(rowToImportRow([null, "", "  "], M).row, null);
  const r = rowToImportRow([null, "مادة", 500], M);
  assert.deepEqual(r.row, null);
  assert.ok(r.issues.length > 0);
});

test("unreadable numbers are reported but the rest of the row survives", () => {
  const r = rowToImportRow(["دواء", null, "غالي", null, "كثير"], M);
  assert.equal(r.row.name, "دواء");
  assert.equal(r.row.price, undefined);
  assert.equal(r.row.stock, undefined);
  assert.equal(r.issues.length, 2);
});

test("suggested price adds a margin and rounds up to 250", () => {
  assert.equal(suggestPrice(2000, 25), 2500);
  assert.equal(suggestPrice(2100, 25), 2750);
  assert.equal(suggestPrice(0, 25), null);
  assert.equal(suggestPrice(null, 25), null);
});

// ───────── planning ─────────
const existing = [
  { id: "a", name: "بنادول إكسترا", barcode: "6281001", stock: 10 },
  { id: "b", name: "فيتامين د", barcode: null, stock: 4 },
];

test("matches by barcode first, then by normalised name; the rest are created", () => {
  const plan = planImport(
    [
      { name: "اسم مختلف", barcode: "6281001", stock: 5, price: 3600 },
      { name: "فيتامين  د", stock: 6 },
      { name: "منتج جديد", price: 1000, stock: 3 },
    ],
    existing,
    "add"
  );
  assert.equal(plan.updates.length, 2);
  assert.equal(plan.updates[0].id, "a");
  assert.equal(plan.updates[0].matchedBy, "barcode");
  assert.equal(plan.updates[0].patch.stock, 15);
  assert.equal(plan.updates[0].patch.price, 3600);
  assert.equal(plan.updates[1].id, "b");
  assert.equal(plan.updates[1].matchedBy, "name");
  assert.equal(plan.updates[1].patch.stock, 10);
  assert.equal(plan.creates.length, 1);
  assert.equal(plan.creates[0].name, "منتج جديد");
});

test("replace mode sets the stock instead of adding", () => {
  const plan = planImport([{ name: "بنادول إكسترا", stock: 7 }], existing, "replace");
  assert.equal(plan.updates[0].patch.stock, 7);
});

test("an update never touches fields the file did not provide", () => {
  const plan = planImport([{ name: "بنادول إكسترا", price: 4000 }], existing, "add");
  assert.deepEqual(plan.updates[0].patch, { price: 4000 });
});

test("an update never changes the name, and fills a barcode only when the product has none", () => {
  const p1 = planImport([{ name: "فيتامين د", barcode: "999" }], existing, "add");
  assert.equal(p1.updates[0].patch.barcode, "999");
  assert.equal("name" in p1.updates[0].patch, false);
  const p2 = planImport([{ name: "بنادول إكسترا", barcode: "123" }], existing, "add");
  assert.equal(p2.updates.length, 0);
  assert.equal(p2.unchanged, 1);
});

test("the same product twice in the file is merged, quantities added up", () => {
  const plan = planImport([{ name: "جديد", price: 100, stock: 2, barcode: "5" }, { name: "جديد آخر", barcode: "5", stock: 3 }], [], "add");
  assert.equal(plan.creates.length, 1);
  assert.equal(plan.creates[0].stock, 5);
  assert.equal(plan.merged, 1);
});

test("a new product without a selling price cannot be created", () => {
  const plan = planImport([{ name: "بلا سعر", stock: 5 }], [], "add");
  assert.equal(plan.creates.length, 0);
  assert.equal(plan.needsPrice.length, 1);
  assert.equal(plan.needsPrice[0].name, "بلا سعر");
});

test("a stock-only line for an existing product needs no price", () => {
  const plan = planImport([{ name: "فيتامين د", stock: 3 }], existing, "add");
  assert.equal(plan.needsPrice.length, 0);
  assert.equal(plan.updates.length, 1);
});

test("add mode reports the quantity as a delta; replace mode does not", () => {
  const add = planImport([{ name: "بنادول إكسترا", stock: 5 }], existing, "add");
  assert.equal(add.updates[0].stockDelta, 5);
  assert.equal(add.updates[0].patch.stock, 15);
  const replace = planImport([{ name: "بنادول إكسترا", stock: 5 }], existing, "replace");
  assert.equal("stockDelta" in replace.updates[0], false);
  const priceOnly = planImport([{ name: "بنادول إكسترا", price: 1 }], existing, "add");
  assert.equal("stockDelta" in priceOnly.updates[0], false);
});

// ───────── server-side re-validation ─────────
test("sanitizeImportRow keeps a clean row and cleans a dirty one", () => {
  const clean = { name: "دواء", price: 1000, stock: 3, expiresAt: "2027-06-30", requiresRx: false, category: "أدوية" };
  assert.deepEqual(sanitizeImportRow(clean).row, clean);
  const dirty = sanitizeImportRow({ name: "  x  ", price: "-5", stock: 1.6, junk: "ignored", expiresAt: "nope" });
  assert.equal(dirty.row.name, "x");
  assert.equal(dirty.row.stock, 2);
  assert.equal("price" in dirty.row, false);
  assert.equal("junk" in dirty.row, false);
  assert.equal(dirty.issues.length, 2);
});

test("sanitizeImportRow rejects non-objects and rows without a name", () => {
  assert.equal(sanitizeImportRow(null).row, null);
  assert.equal(sanitizeImportRow("text").row, null);
  assert.equal(sanitizeImportRow({ price: 5 }).row, null);
});

// ───────── files ─────────
import { detectTable, parseCsv } from "./import.ts";

test("csv: BOM, CRLF, quoted commas and doubled quotes", () => {
  const text = '﻿الاسم,السعر\r\n"بنادول, إكسترا",3500\r\n"قطرة ""خاصة""",1000\r\n';
  assert.deepEqual(parseCsv(text), [["الاسم", "السعر"], ["بنادول, إكسترا", "3500"], ['قطرة "خاصة"', "1000"]]);
});

test("csv: semicolon and tab delimiters are detected", () => {
  assert.deepEqual(parseCsv("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCsv("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
});

test("csv: blank trailing lines are dropped", () => {
  assert.deepEqual(parseCsv("a,b\n1,2\n\n\n"), [["a", "b"], ["1", "2"]]);
});

test("detectTable skips title rows above the header", () => {
  const rows = [["جرد صيدلية النور"], [], ["اسم الدواء", "السعر", "الكمية"], ["بنادول", 3500, 4], ["بروفين", 2000, 9]];
  const table = detectTable(rows);
  assert.equal(table.headerIndex, 2);
  assert.deepEqual(table.mapping.name, 0);
  assert.equal(table.mapping.price, 1);
  assert.equal(table.mapping.stock, 2);
  assert.equal(table.dataRows.length, 2);
});

test("detectTable reports no table when no name column exists", () => {
  const table = detectTable([["x", "y"], [1, 2]]);
  assert.equal(table.mapping.name, null);
});

test("detectTable with a header-less sheet falls back to the first row", () => {
  const table = detectTable([["بنادول", 3500]]);
  assert.equal(table.headerIndex, 0);
  assert.equal(table.mapping.name, null);
});

test("every input line gets a status, in input order", () => {
  const plan = planImport(
    [
      { name: "بنادول إكسترا", stock: 1 },
      { name: "جديد", price: 100 },
      { name: "جديد", stock: 2 },
      { name: "بلا سعر" },
      { name: "فيتامين د" },
    ],
    existing,
    "add"
  );
  assert.deepEqual(plan.statuses.map((s) => s.kind), ["update", "create", "merged", "needsPrice", "unchanged"]);
  assert.equal(plan.statuses[0].matchedName, "بنادول إكسترا");
  assert.equal(plan.statuses[2].into, 1);
});

test("detectTable never mistakes a data row for the header, even if the name contains a header word", () => {
  for (const price of [500, "500", "٥٠٠"]) {
    const table = detectTable([["x", "y"], ["دواء أ", price]]);
    assert.equal(table.headerIndex, 0);
    assert.equal(table.mapping.name, null);
    assert.equal(table.dataRows.length, 1);
  }
});

test("detectTable still finds a real header that has a year or number in a label", () => {
  const table = detectTable([["اسم الدواء", "السعر", "الكمية"], ["بنادول", 3500, 4]]);
  assert.equal(table.headerIndex, 0);
  assert.equal(table.mapping.name, 0);
});
