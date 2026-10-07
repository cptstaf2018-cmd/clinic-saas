/**
 * Pure sale math for the pharmacy POS. Prices always come from the product
 * records on the server, never from the client, so a tampered request cannot
 * change what a sale costs.
 */

export const PAYMENT_METHODS = ["cash", "zaincash", "debt"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const MAX_SALE_LINES = 100;
export const MAX_LINE_QTY = 1000;

export type SaleProduct = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  active: boolean;
};

export type SaleLineInput = { productId: unknown; qty: unknown };

export type SaleItem = {
  productId: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  lineTotal: number;
};

type Fail = { ok: false; error: string };

export type SaleResult =
  | { ok: true; items: SaleItem[]; subtotal: number; discount: number; total: number; cost: number; profit: number }
  | Fail;

function isPositiveInt(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= max;
}

export function computeSale(lines: SaleLineInput[], products: SaleProduct[], discount: unknown = 0): SaleResult {
  if (!Array.isArray(lines) || lines.length === 0) return { ok: false, error: "الفاتورة فارغة" };
  if (lines.length > MAX_SALE_LINES) return { ok: false, error: "عدد المنتجات في الفاتورة كبير جداً" };

  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (typeof line?.productId !== "string" || !isPositiveInt(line.qty, MAX_LINE_QTY)) {
      return { ok: false, error: "كمية غير صحيحة" };
    }
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.qty);
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  const items: SaleItem[] = [];
  for (const [productId, qty] of quantities) {
    const product = byId.get(productId);
    if (!product || !product.active) return { ok: false, error: "منتج غير موجود في الصيدلية" };
    if (qty > product.stock) {
      return { ok: false, error: `الكمية المطلوبة من ${product.name} غير متوفرة (المتوفر ${product.stock})` };
    }
    items.push({ productId, name: product.name, qty, price: product.price, cost: product.cost, lineTotal: product.price * qty });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const cost = items.reduce((sum, item) => sum + item.cost * item.qty, 0);
  if (typeof discount !== "number" || !Number.isInteger(discount) || discount < 0 || discount > subtotal) {
    return { ok: false, error: "الخصم غير صحيح" };
  }

  const total = subtotal - discount;
  return { ok: true, items, subtotal, discount, total, cost, profit: total - cost };
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function validatePayment(
  method: unknown,
  customer: { customerName?: unknown; customerPhone?: unknown }
): { ok: true; method: PaymentMethod } | Fail {
  if (!isPaymentMethod(method)) return { ok: false, error: "طريقة الدفع غير صحيحة" };
  if (method === "debt") {
    const name = typeof customer.customerName === "string" ? customer.customerName.trim() : "";
    const phone = typeof customer.customerPhone === "string" ? customer.customerPhone.trim() : "";
    if (!name && !phone) return { ok: false, error: "البيع بالدين يحتاج اسم الزبون أو رقمه" };
  }
  return { ok: true, method };
}
