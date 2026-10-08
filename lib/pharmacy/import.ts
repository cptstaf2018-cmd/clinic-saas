/**
 * Pure logic for bulk-adding medicines (Excel / CSV / purchase receipt).
 * No imports from the app, so it can be unit-tested directly with node --test.
 *
 * Flow: a sheet's header row → guessMapping → each row → rowToImportRow
 * → planImport (decides what is created, what is updated and what is stuck).
 */

export const IMPORT_CATEGORIES = ["أدوية", "فيتامينات", "عناية بالبشرة", "أطفال", "مستلزمات طبية", "أخرى"] as const;

const MAX_MONEY = 100_000_000;
const MAX_STOCK = 1_000_000;

export type ImportField =
  | "name"
  | "genericName"
  | "price"
  | "cost"
  | "stock"
  | "minStock"
  | "barcode"
  | "expiresAt"
  | "category"
  | "form"
  | "requiresRx";

export const IMPORT_FIELDS: readonly ImportField[] = [
  "name",
  "genericName",
  "price",
  "cost",
  "stock",
  "minStock",
  "barcode",
  "expiresAt",
  "category",
  "form",
  "requiresRx",
];

export const FIELD_LABELS: Record<ImportField, string> = {
  name: "اسم الدواء",
  genericName: "المادة الفعالة",
  price: "سعر البيع",
  cost: "سعر الشراء",
  stock: "الكمية",
  minStock: "الحد الأدنى",
  barcode: "الباركود",
  expiresAt: "تاريخ الانتهاء",
  category: "التصنيف",
  form: "الشكل / العبوة",
  requiresRx: "بوصفة طبية",
};

/** Column index per field, or null when the sheet has no such column. */
export type ColumnMapping = Record<ImportField, number | null>;

/** One product line, with only the fields the source actually provided. */
export type ImportRow = {
  name: string;
  genericName?: string;
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  barcode?: string;
  /** YYYY-MM-DD */
  expiresAt?: string;
  category?: string;
  form?: string;
  requiresRx?: boolean;
};

export type ExistingProduct = { id: string; name: string; barcode: string | null; stock: number };
export type StockMode = "add" | "replace";
export type ProductPatch = Partial<Omit<ImportRow, "name">>;
export type ImportUpdate = {
  id: string;
  name: string;
  matchedBy: "barcode" | "name";
  patch: ProductPatch;
  /** In "add" mode: how many units to add. Applied atomically so sales made meanwhile are not overwritten. */
  stockDelta?: number;
};
/** What happens to each input line, in input order. */
export type RowStatus = { kind: "create" | "update" | "unchanged" | "needsPrice" | "merged"; matchedName?: string; into?: number };

export type ImportPlan = {
  creates: ImportRow[];
  updates: ImportUpdate[];
  /** New products the file gave no selling price for. */
  needsPrice: ImportRow[];
  /** Matched products where the file changed nothing. */
  unchanged: number;
  /** Lines folded into another line of the same product. */
  merged: number;
  statuses: RowStatus[];
};

// ───────── text ─────────

function digitsToAscii(value: string): string {
  return value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
}

/** Unifies spelling (alef forms, ya, ta marbuta, diacritics, digits, case, spaces) so names compare reliably. */
export function normalizeText(value: unknown): string {
  return digitsToAscii(String(value ?? "").toLowerCase())
    .replace(/[ً-ٰٟـ‎‏]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function cleanText(value: unknown, max: number): string | undefined {
  if (isBlank(value) || value instanceof Date) return undefined;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : undefined;
}

// ───────── headers ─────────

const SYNONYMS: Record<ImportField, string[]> = {
  name: ["اسم", "اسم الدواء", "اسم المنتج", "اسم الصنف", "الصنف", "الدواء", "المنتج", "العلاج", "البند", "الاسم", "اسم المادة", "الاسم التجاري", "name", "item", "item name", "product", "product name", "drug", "drug name", "medicine", "medicine name"],
  genericName: ["المادة الفعالة", "مادة فعالة", "الاسم العلمي", "اسم علمي", "generic", "generic name", "scientific name", "active ingredient", "ingredient"],
  price: ["سعر البيع", "سعر المفرد", "سعر المستهلك", "السعر", "سعر", "بيع", "price", "selling price", "sale price", "sell price", "retail price", "unit price", "mrp"],
  cost: ["سعر الشراء", "سعر التكلفة", "التكلفة", "تكلفة", "سعر الجملة", "كلفة", "الكلفة", "شراء", "cost", "cost price", "purchase price", "buying price", "wholesale", "wholesale price"],
  stock: ["الكمية", "كمية", "العدد", "عدد", "الرصيد", "رصيد", "المخزون", "مخزون", "المتوفر", "qty", "quantity", "stock", "count", "on hand", "balance"],
  minStock: ["الحد الأدنى", "حد أدنى", "حد الطلب", "حد اعادة الطلب", "min", "min stock", "minimum", "min qty", "reorder level", "reorder"],
  barcode: ["باركود", "الباركود", "بار كود", "رقم الباركود", "كود", "رمز", "barcode", "bar code", "ean", "upc", "sku", "code"],
  expiresAt: ["تاريخ الانتهاء", "تاريخ انتهاء الصلاحية", "تاريخ الصلاحية", "الانتهاء", "انتهاء", "الصلاحية", "صلاحية", "expiry", "expiry date", "expiration", "expiration date", "exp", "exp date", "expire", "expires"],
  category: ["التصنيف", "تصنيف", "الفئة", "فئة", "النوع", "نوع", "القسم", "قسم", "category", "type", "group"],
  form: ["الشكل", "شكل", "الشكل الدوائي", "العبوة", "عبوة", "التعبئة", "form", "dosage form", "pack", "packaging", "size"],
  requiresRx: ["بوصفة", "يحتاج وصفة", "وصفة", "وصفة طبية", "rx", "prescription", "requires rx", "needs prescription"],
};

/** Contains-match order: the more specific fields first, so "سعر الشراء" is never read as a plain price. */
const CONTAINS_PRIORITY: readonly ImportField[] = ["cost", "minStock", "genericName", "expiresAt", "price", "stock", "barcode", "form", "category", "requiresRx", "name"];

function headerTokens(header: unknown): string[] {
  return normalizeText(header)
    .replace(/[()[\]{}:;,./\\_\-–—*#]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((token) => (token.startsWith("ال") && token.length > 3 ? token.slice(2) : token));
}

const SYNONYM_TOKENS: Record<ImportField, string[][]> = Object.fromEntries(
  IMPORT_FIELDS.map((field) => [field, SYNONYMS[field].map((synonym) => headerTokens(synonym))])
) as Record<ImportField, string[][]>;

function sameTokens(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((token, i) => token === b[i]);
}

function containsTokens(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let start = 0; start + needle.length <= haystack.length; start++) {
    if (needle.every((token, i) => haystack[start + i] === token)) return true;
  }
  return false;
}

/** Best guess of which column holds which field. A column is used for one field only. */
export function guessMapping(headers: unknown[]): ColumnMapping {
  const mapping = Object.fromEntries(IMPORT_FIELDS.map((field) => [field, null])) as ColumnMapping;
  const taken = new Set<number>();
  const tokens = headers.map(headerTokens);

  const assign = (field: ImportField, column: number) => {
    mapping[field] = column;
    taken.add(column);
  };

  tokens.forEach((cellTokens, column) => {
    if (taken.has(column) || cellTokens.length === 0) return;
    const field = IMPORT_FIELDS.find((f) => mapping[f] === null && SYNONYM_TOKENS[f].some((s) => sameTokens(s, cellTokens)));
    if (field) assign(field, column);
  });

  tokens.forEach((cellTokens, column) => {
    if (taken.has(column) || cellTokens.length === 0) return;
    const field = CONTAINS_PRIORITY.find((f) => mapping[f] === null && SYNONYM_TOKENS[f].some((s) => containsTokens(cellTokens, s)));
    if (field) assign(field, column);
  });

  return mapping;
}

// ───────── cells ─────────

function parseWhole(value: unknown, max: number): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0 || value > max) return null;
    return Math.round(value);
  }
  if (typeof value !== "string") return null;
  const cleaned = digitsToAscii(value)
    .replace(/[٬,\s]/g, "")
    .replace(/٫/g, ".")
    .replace(/[^\d.-]/g, "")
    .replace(/^\.+|\.+$/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n > max) return null;
  return Math.round(n);
}

/** Money in IQD: tolerates Arabic digits, separators and currency text ("3 500 د.ع"). */
export function parseMoney(value: unknown): number | null {
  return parseWhole(value, MAX_MONEY);
}

/** A whole, non-negative quantity. */
export function parseCount(value: unknown): number | null {
  return parseWhole(value, MAX_STOCK);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isoDate(year: number, month: number, day: number | "end"): string | null {
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  const last = daysInMonth(year, month);
  const d = day === "end" ? last : day;
  if (d < 1 || d > last) return null;
  return `${year}-${pad(month)}-${pad(d)}`;
}

const EXCEL_EPOCH = Date.UTC(1899, 11, 30);

/** Returns YYYY-MM-DD. A month-only date ("06/2027") means the last day of that month. */
export function parseExpiry(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return isoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  if (typeof value === "number") {
    if (value < 20000 || value > 80000) return null;
    return parseExpiry(new Date(EXCEL_EPOCH + Math.floor(value) * 86_400_000));
  }
  if (typeof value !== "string") return null;
  const s = digitsToAscii(value).trim();
  if (!s) return null;

  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{4})[-/.](\d{1,2})$/.exec(s);
  if (m) return isoDate(Number(m[1]), Number(m[2]), "end");
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
  if (m) return isoDate(Number(m[3]), Number(m[2]), Number(m[1]));
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/.exec(s);
  if (m) return isoDate(2000 + Number(m[3]), Number(m[2]), Number(m[1]));
  m = /^(\d{1,2})[-/.](\d{4})$/.exec(s);
  if (m) return isoDate(Number(m[2]), Number(m[1]), "end");
  m = /^(\d{1,2})[-/.](\d{2})$/.exec(s);
  if (m) return isoDate(2000 + Number(m[2]), Number(m[1]), "end");
  return null;
}

const YES = new Set(["نعم", "yes", "y", "1", "true", "بوصفه", "صح", "x", "rx", "وصفه"].map(normalizeText));

export function parseBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return YES.has(normalizeText(value));
}

const CATEGORY_RULES: { category: (typeof IMPORT_CATEGORIES)[number]; words: string[] }[] = [
  { category: "فيتامينات", words: ["فيتامين", "vitamin", "مكمل", "supplement"] },
  { category: "عناية بالبشرة", words: ["بشره", "skin", "تجميل", "cosmetic", "عنايه"] },
  { category: "أطفال", words: ["اطفال", "طفل", "baby", "kids", "child"] },
  { category: "مستلزمات طبية", words: ["مستلزم", "supplies", "device", "جهاز", "equipment", "consumable"] },
  { category: "أدوية", words: ["دواء", "ادويه", "drug", "medicine", "tablet", "capsule", "syrup", "حبوب", "شراب", "حقن", "antibiotic", "مضاد"] },
];

/** Maps free text onto one of the app's categories. Empty means a regular medicine. */
export function mapCategory(value: unknown): string {
  const text = normalizeText(value);
  if (!text) return "أدوية";
  const exact = IMPORT_CATEGORIES.find((category) => normalizeText(category) === text);
  if (exact) return exact;
  const rule = CATEGORY_RULES.find(({ words }) => words.some((word) => text.includes(word)));
  return rule ? rule.category : "أخرى";
}

// ───────── rows ─────────

function cleanBarcode(value: unknown): string | undefined {
  if (isBlank(value) || value instanceof Date) return undefined;
  const text = typeof value === "number" && Number.isInteger(value) ? String(value) : digitsToAscii(String(value)).trim().replace(/\.0+$/, "");
  const compact = text.replace(/\s+/g, "");
  return compact ? compact.slice(0, 64) : undefined;
}

/** Turns one sheet row into a clean ImportRow. Fields that cannot be read are reported, not guessed. */
export function rowToImportRow(cells: unknown[], mapping: ColumnMapping): { row: ImportRow | null; issues: string[] } {
  const cell = (field: ImportField): unknown => {
    const column = mapping[field];
    return column === null ? undefined : cells[column];
  };

  if (IMPORT_FIELDS.every((field) => isBlank(cell(field)))) return { row: null, issues: [] };

  const issues: string[] = [];
  const name = cleanText(cell("name"), 120);
  if (!name) return { row: null, issues: ["اسم الدواء مفقود"] };

  const row: ImportRow = { name };
  const number = (field: "price" | "cost" | "stock" | "minStock", parse: (v: unknown) => number | null) => {
    const raw = cell(field);
    if (isBlank(raw)) return;
    const parsed = parse(raw);
    if (parsed === null) issues.push(`${FIELD_LABELS[field]} غير مقروء: "${String(raw).slice(0, 20)}"`);
    else row[field] = parsed;
  };
  number("price", parseMoney);
  number("cost", parseMoney);
  number("stock", parseCount);
  number("minStock", parseCount);

  const expiryRaw = cell("expiresAt");
  if (!isBlank(expiryRaw)) {
    const expiry = parseExpiry(expiryRaw);
    if (expiry === null) issues.push(`تاريخ الانتهاء غير مقروء: "${String(expiryRaw).slice(0, 20)}"`);
    else row.expiresAt = expiry;
  }

  const genericName = cleanText(cell("genericName"), 120);
  if (genericName) row.genericName = genericName;
  const form = cleanText(cell("form"), 60);
  if (form) row.form = form;
  const barcode = cleanBarcode(cell("barcode"));
  if (barcode) row.barcode = barcode;
  if (!isBlank(cell("category"))) row.category = mapCategory(cell("category"));
  if (!isBlank(cell("requiresRx"))) row.requiresRx = parseBool(cell("requiresRx"));

  return { row, issues };
}

const IDENTITY_MAPPING = Object.fromEntries(IMPORT_FIELDS.map((field, index) => [field, index])) as ColumnMapping;

/** Re-validates a row that came back from the browser, so the server never trusts the client's cleaning. */
export function sanitizeImportRow(input: unknown): { row: ImportRow | null; issues: string[] } {
  if (typeof input !== "object" || input === null) return { row: null, issues: ["سطر غير صحيح"] };
  const record = input as Record<string, unknown>;
  return rowToImportRow(
    IMPORT_FIELDS.map((field) => record[field]),
    IDENTITY_MAPPING
  );
}

/** A selling price from the purchase cost plus a margin, rounded up to the next 250 IQD. */
export function suggestPrice(cost: number | null | undefined, marginPercent: number): number | null {
  if (!cost || cost <= 0) return null;
  return Math.ceil((cost * (1 + marginPercent / 100)) / 250) * 250;
}

// ───────── planning ─────────

type Group = { existing: ExistingProduct | null; matchedBy: "barcode" | "name" | null; row: ImportRow; indexes: number[] };

function mergeRows(first: ImportRow, next: ImportRow): ImportRow {
  const stock = first.stock === undefined && next.stock === undefined ? undefined : (first.stock ?? 0) + (next.stock ?? 0);
  const merged: ImportRow = { ...next, ...first };
  if (stock !== undefined) merged.stock = stock;
  return merged;
}

function barcodesConflict(a: string | undefined, b: string | undefined | null): boolean {
  return Boolean(a) && Boolean(b) && a !== b;
}

/**
 * Decides what to do with each line. Lines for the same product are folded
 * together (quantities add up); lines for a product the pharmacy already has
 * become updates that touch only the fields the file provided.
 */
export function planImport(rows: ImportRow[], existing: ExistingProduct[], stockMode: StockMode): ImportPlan {
  const byBarcode = new Map<string, ExistingProduct>();
  const byName = new Map<string, ExistingProduct>();
  for (const product of existing) {
    if (product.barcode) byBarcode.set(product.barcode, product);
    const key = normalizeText(product.name);
    if (!byName.has(key)) byName.set(key, product);
  }

  const groups: Group[] = [];
  let merged = 0;

  rows.forEach((row, index) => {
    const nameKey = normalizeText(row.name);
    const byBc = row.barcode ? byBarcode.get(row.barcode) : undefined;
    const byNm = byBc ? undefined : byName.get(nameKey);
    const match = byBc ?? byNm ?? null;
    const matchedBy = byBc ? "barcode" : byNm ? "name" : null;

    const group = groups.find((g) => {
      if (match) return g.existing?.id === match.id;
      if (g.existing) return false;
      if (row.barcode && g.row.barcode === row.barcode) return true;
      return normalizeText(g.row.name) === nameKey && !barcodesConflict(row.barcode, g.row.barcode);
    });

    if (group) {
      group.row = mergeRows(group.row, row);
      group.indexes.push(index);
      merged += 1;
    } else {
      groups.push({ existing: match, matchedBy, row, indexes: [index] });
    }
  });

  const creates: ImportRow[] = [];
  const updates: ImportUpdate[] = [];
  const needsPrice: ImportRow[] = [];
  let unchanged = 0;
  const statuses: RowStatus[] = rows.map(() => ({ kind: "unchanged" }));

  for (const group of groups) {
    const { row, existing: match, indexes } = group;
    const [first, ...rest] = indexes;
    for (const index of rest) statuses[index] = { kind: "merged", into: first };

    if (!match || !group.matchedBy) {
      if (row.price === undefined) {
        needsPrice.push(row);
        statuses[first] = { kind: "needsPrice" };
      } else {
        creates.push(row);
        statuses[first] = { kind: "create" };
      }
      continue;
    }

    const patch: ProductPatch = {};
    if (row.price !== undefined) patch.price = row.price;
    if (row.cost !== undefined) patch.cost = row.cost;
    if (row.stock !== undefined) patch.stock = stockMode === "add" ? match.stock + row.stock : row.stock;
    if (row.minStock !== undefined) patch.minStock = row.minStock;
    if (row.genericName !== undefined) patch.genericName = row.genericName;
    if (row.expiresAt !== undefined) patch.expiresAt = row.expiresAt;
    if (row.category !== undefined) patch.category = row.category;
    if (row.form !== undefined) patch.form = row.form;
    if (row.requiresRx !== undefined) patch.requiresRx = row.requiresRx;
    if (row.barcode !== undefined && !match.barcode) patch.barcode = row.barcode;

    statuses[first] = { kind: Object.keys(patch).length === 0 ? "unchanged" : "update", matchedName: match.name };
    if (Object.keys(patch).length === 0) unchanged += 1;
    else {
      const stockDelta = stockMode === "add" && row.stock !== undefined ? row.stock : undefined;
      updates.push({ id: match.id, name: match.name, matchedBy: group.matchedBy, patch, ...(stockDelta !== undefined ? { stockDelta } : {}) });
    }
  }

  return { creates, updates, needsPrice, unchanged, merged, statuses };
}

// ───────── files ─────────

/** Parses CSV text: UTF-8 BOM, quotes, CRLF, and comma / semicolon / tab delimiters (Excel in Arabic locales exports ";"). */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ",");

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  while (rows.length > 0 && rows[rows.length - 1].every((cell) => cell.trim() === "")) rows.pop();
  return rows;
}

const HEADER_SCAN_ROWS = 15;

/** Labels are words; a row holding numbers is data, even when a medicine name happens to contain a header word. */
function looksLikeData(row: unknown[]): boolean {
  return row.some((cell) => typeof cell === "number" || (typeof cell === "string" && /^[\d٠-٩\s.,٬٫-]+$/.test(cell.trim()) && /[\d٠-٩]/.test(cell)));
}

/**
 * Finds the header row (sheets often start with a title or blank rows) and the column mapping.
 * `mapping.name === null` means no usable table was found.
 */
export function detectTable(rows: unknown[][]): { headerIndex: number; headers: string[]; mapping: ColumnMapping; dataRows: unknown[][] } {
  let best = { index: 0, mapping: guessMapping(rows[0] ?? []), score: -1 };
  for (let i = 0; i < Math.min(rows.length, HEADER_SCAN_ROWS); i++) {
    if (looksLikeData(rows[i])) continue;
    const mapping = guessMapping(rows[i]);
    if (mapping.name === null) continue;
    const score = IMPORT_FIELDS.filter((field) => mapping[field] !== null).length;
    if (score > best.score) best = { index: i, mapping, score };
  }
  const headers = (rows[best.index] ?? []).map((cell) => (isBlank(cell) ? "" : String(cell).trim()));
  return { headerIndex: best.index, headers, mapping: best.mapping, dataRows: rows.slice(best.index + 1) };
}
