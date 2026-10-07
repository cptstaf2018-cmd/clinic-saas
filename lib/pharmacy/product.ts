export const PRODUCT_CATEGORIES = ["أدوية", "فيتامينات", "عناية بالبشرة", "أطفال", "مستلزمات طبية", "أخرى"] as const;

const MAX_MONEY = 100_000_000;
const MAX_STOCK = 1_000_000;

export type ProductInput = {
  name: string;
  genericName: string | null;
  category: string;
  form: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  requiresRx: boolean;
  expiresAt: Date | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function int(value: unknown, max: number): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= max ? n : null;
}

/**
 * Validates a full product (create) or only the provided fields (update,
 * `partial = true`). Unknown keys are ignored.
 */
export function parseProduct(body: Record<string, unknown>, partial = false): Result<Partial<ProductInput>> {
  const out: Partial<ProductInput> = {};
  const has = (key: string) => !partial || key in body;

  if (has("name")) {
    const name = text(body.name, 120);
    if (!name) return { ok: false, error: "اسم المنتج مطلوب" };
    out.name = name;
  }
  if (has("price")) {
    const price = int(body.price, MAX_MONEY);
    if (price === null) return { ok: false, error: "سعر البيع غير صحيح" };
    out.price = price;
  }
  if (has("cost")) {
    const cost = body.cost === undefined || body.cost === "" ? 0 : int(body.cost, MAX_MONEY);
    if (cost === null) return { ok: false, error: "سعر الشراء غير صحيح" };
    out.cost = cost;
  }
  if (has("stock")) {
    const stock = body.stock === undefined || body.stock === "" ? 0 : int(body.stock, MAX_STOCK);
    if (stock === null) return { ok: false, error: "الكمية غير صحيحة" };
    out.stock = stock;
  }
  if (has("minStock")) {
    const minStock = body.minStock === undefined || body.minStock === "" ? 0 : int(body.minStock, MAX_STOCK);
    if (minStock === null) return { ok: false, error: "الحد الأدنى غير صحيح" };
    out.minStock = minStock;
  }
  if (has("category")) {
    const category = text(body.category, 40) ?? "أدوية";
    if (!(PRODUCT_CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: "التصنيف غير صحيح" };
    out.category = category;
  }
  if (has("genericName")) out.genericName = text(body.genericName, 120);
  if (has("form")) out.form = text(body.form, 60);
  if (has("barcode")) out.barcode = text(body.barcode, 64);
  if (has("requiresRx")) out.requiresRx = body.requiresRx === true;
  if (has("expiresAt")) {
    const raw = text(body.expiresAt, 30);
    const date = raw ? new Date(raw) : null;
    if (date && Number.isNaN(date.getTime())) return { ok: false, error: "تاريخ الانتهاء غير صحيح" };
    out.expiresAt = date;
  }

  if (partial && Object.keys(out).length === 0) return { ok: false, error: "لا توجد تعديلات" };
  return { ok: true, value: out };
}
