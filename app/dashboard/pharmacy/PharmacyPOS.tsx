"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/pharmacy/product";

export type PosProduct = {
  id: string;
  name: string;
  genericName: string | null;
  category: string;
  form: string | null;
  barcode: string | null;
  price: number;
  stock: number;
  minStock: number;
  requiresRx: boolean;
  imageUrl: string | null;
};

type Today = { sales: number; invoices: number; profit: number };
type CartLine = { productId: string; qty: number };
type Payment = "cash" | "zaincash" | "debt";
type Receipt = { number: number; total: number; discount: number; paymentMethod: Payment; customerPhone: string | null; items: { name: string; qty: number; price: number }[] };

const PAYMENTS: { id: Payment; label: string }[] = [
  { id: "cash", label: "نقداً" },
  { id: "zaincash", label: "زين كاش" },
  { id: "debt", label: "دين" },
];

const CATEGORY_TONE: Record<string, string> = {
  "أدوية": "bg-brand-soft text-brand-on-soft",
  "فيتامينات": "bg-amber-50 text-amber-800",
  "عناية بالبشرة": "bg-pink-50 text-pink-700",
  "أطفال": "bg-brand-mint-soft text-brand-mint-text",
  "مستلزمات طبية": "bg-brand-line text-brand-ink",
  "أخرى": "bg-brand-line text-brand-muted",
};

function money(value: number) {
  return value.toLocaleString("ar-IQ");
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("964") ? digits : digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

function StockTag({ product }: { product: PosProduct }) {
  if (product.stock <= 0) return <span className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">نفد</span>;
  if (product.stock <= product.minStock) return <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">باقي {money(product.stock)}</span>;
  return <span className="rounded-lg bg-brand-mint-soft px-2 py-0.5 text-xs font-semibold text-brand-mint-text">{money(product.stock)} متوفر</span>;
}

export default function PharmacyPOS({ initialProducts, initialToday }: { initialProducts: PosProduct[]; initialToday: Today }) {
  const [products, setProducts] = useState(initialProducts);
  const [today, setToday] = useState(initialToday);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState("");
  const [payment, setPayment] = useState<Payment>("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomer, setShowCustomer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) =>
      (category === "الكل" || product.category === category) &&
      (!q || product.name.toLowerCase().includes(q) || product.genericName?.toLowerCase().includes(q) || product.barcode === query.trim())
    );
  }, [products, query, category]);

  const subtotal = cart.reduce((sum, line) => sum + (byId.get(line.productId)?.price ?? 0) * line.qty, 0);
  const discountValue = Math.max(0, Math.min(subtotal, parseInt(discount) || 0));
  const total = subtotal - discountValue;
  const lowCount = products.filter((product) => product.stock <= product.minStock).length;

  function add(product: PosProduct) {
    setError("");
    setCart((prev) => {
      const line = prev.find((item) => item.productId === product.id);
      const inCart = line?.qty ?? 0;
      if (inCart >= product.stock) return prev;
      return line
        ? prev.map((item) => (item.productId === product.id ? { ...item, qty: item.qty + 1 } : item))
        : [...prev, { productId: product.id, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    const stock = byId.get(productId)?.stock ?? 0;
    setCart((prev) =>
      prev
        .map((item) => (item.productId === productId ? { ...item, qty: Math.min(stock, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  }

  /** A barcode scanner types the code then Enter: add the exact match directly. */
  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    const code = query.trim();
    const match = products.find((product) => product.barcode && product.barcode === code) ?? (visible.length === 1 ? visible[0] : null);
    if (match) {
      add(match);
      setQuery("");
    }
  }

  async function checkout() {
    if (!cart.length || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/pharmacy/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: cart, discount: discountValue, paymentMethod: payment, customerName, customerPhone }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setError(data.error ?? "تعذر إتمام البيع، تحقق من الاتصال");
      return;
    }

    const sold = new Map(cart.map((line) => [line.productId, line.qty]));
    setProducts((prev) => prev.map((product) => (sold.has(product.id) ? { ...product, stock: product.stock - (sold.get(product.id) ?? 0) } : product)));
    setToday((prev) => ({ sales: prev.sales + data.total, invoices: prev.invoices + 1, profit: prev.profit + data.total - data.cost }));
    setReceipt({ number: data.number, total: data.total, discount: data.discount, paymentMethod: data.paymentMethod, customerPhone: data.customerPhone, items: data.items });
    setCart([]);
    setDiscount("");
    setCustomerName("");
    setCustomerPhone("");
    setPayment("cash");
    setShowCustomer(false);
  }

  function closeReceipt() {
    setReceipt(null);
    searchRef.current?.focus();
  }

  const receiptText = receipt
    ? [`فاتورة رقم ${receipt.number}`, ...receipt.items.map((item) => `${item.name} × ${item.qty} = ${money(item.price * item.qty)}`), receipt.discount ? `خصم: ${money(receipt.discount)}` : "", `الإجمالي: ${money(receipt.total)} د.ع`, "شكراً لزيارتكم"].filter(Boolean).join("\n")
    : "";

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_380px]" dir="rtl">
      <section className="min-w-0 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-3xl bg-brand-navy p-4 text-white">
            <p className="text-xs text-brand-side-muted">مبيعات اليوم</p>
            <p className="mt-1 text-2xl font-bold">{money(today.sales)} <span className="text-xs font-medium text-brand-side-muted">د.ع</span></p>
          </div>
          <div className="rounded-3xl border border-brand-border bg-white p-4">
            <p className="text-xs text-brand-muted">عدد الفواتير</p>
            <p className="mt-1 text-2xl font-bold text-brand-ink">{money(today.invoices)}</p>
          </div>
          <div className="rounded-3xl border border-brand-border bg-white p-4">
            <p className="text-xs text-brand-muted">ربح اليوم</p>
            <p className="mt-1 text-2xl font-bold text-brand-ink">{money(today.profit)} <span className="text-xs font-medium text-brand-muted">د.ع</span></p>
          </div>
          <Link href="/dashboard/pharmacy/products?filter=low" className="rounded-3xl border border-brand-border bg-white p-4 transition hover:border-brand-blue">
            <p className="text-xs text-brand-muted">قاربت على النفاد</p>
            <p className={`mt-1 text-2xl font-bold ${lowCount ? "text-amber-700" : "text-brand-ink"}`}>{money(lowCount)}</p>
          </Link>
        </div>

        <label className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl border-2 border-brand-border bg-white px-4 transition focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-soft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5 shrink-0 text-brand-muted" aria-hidden><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKey}
            autoFocus
            placeholder="اكتب اسم المنتج أو المادة الفعالة، أو امسح الباركود"
            aria-label="بحث عن منتج أو مسح الباركود"
            className="w-full bg-transparent text-base text-brand-ink outline-none placeholder:text-brand-muted/70"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {["الكل", ...PRODUCT_CATEGORIES].map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${category === item ? "bg-brand-navy text-white" : "bg-white text-brand-muted ring-1 ring-brand-border hover:text-brand-ink"}`}
            >
              {item}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-brand-border bg-white p-10 text-center">
            <p className="text-lg font-bold text-brand-ink">لا توجد منتجات بعد</p>
            <p className="mt-1 text-sm text-brand-muted">أضف منتجات صيدليتك لتبدأ البيع.</p>
            <Link href="/dashboard/pharmacy/products" className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-brand-navy px-6 font-bold text-white">إضافة منتجات</Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => {
              const out = product.stock <= 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={out}
                  onClick={() => add(product)}
                  className="relative flex flex-col gap-2 rounded-3xl border border-brand-border bg-white p-3 text-right transition hover:-translate-y-0.5 hover:border-brand-gold active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {product.requiresRx && <span className="absolute left-3 top-3 rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-on-soft">بوصفة</span>}
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt="" loading="lazy" className="h-20 w-full rounded-2xl bg-brand-bg object-cover" />
                  ) : (
                    <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold ${CATEGORY_TONE[product.category] ?? CATEGORY_TONE["أخرى"]}`}>
                      {product.name.trim().charAt(0)}
                    </span>
                  )}
                  <span className="font-bold leading-snug text-brand-ink">{product.name}</span>
                  <span className="text-xs text-brand-muted">{[product.form, product.genericName].filter(Boolean).join(" · ") || product.category}</span>
                  <span className="mt-auto flex items-center justify-between gap-2">
                    <span className="font-bold text-brand-ink">{money(product.price)}</span>
                    <StockTag product={product} />
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && <p className="col-span-full py-8 text-center text-sm text-brand-muted">لا يوجد منتج بهذا الاسم.</p>}
          </div>
        )}
      </section>

      <aside className="flex flex-col border-t border-brand-border bg-white lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-t-0" aria-label="الفاتورة">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-xl font-bold text-brand-ink">الفاتورة</h2>
          {cart.length > 0 && (
            <button type="button" onClick={() => setCart([])} className="text-sm font-semibold text-red-700 hover:underline">إفراغ</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <p className="py-12 text-center text-sm leading-7 text-brand-muted">اضغط على منتج أو امسح الباركود<br />لإضافته إلى الفاتورة</p>
          ) : (
            cart.map((line) => {
              const product = byId.get(line.productId);
              if (!product) return null;
              return (
                <div key={line.productId} className="border-b border-brand-line py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-brand-ink">{product.name}</p>
                      <p className="text-xs text-brand-muted">{money(product.price)} × {money(line.qty)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="font-bold text-brand-ink">{money(product.price * line.qty)}</span>
                      <span className="flex items-center gap-1 rounded-xl bg-brand-bg p-1">
                        <button type="button" onClick={() => changeQty(line.productId, 1)} aria-label="زيادة" className="h-8 w-8 rounded-lg bg-white font-bold">+</button>
                        <span className="min-w-6 text-center font-bold">{money(line.qty)}</span>
                        <button type="button" onClick={() => changeQty(line.productId, -1)} aria-label="إنقاص" className="h-8 w-8 rounded-lg bg-white font-bold">−</button>
                      </span>
                    </div>
                  </div>
                  {product.requiresRx && <p className="mt-2 rounded-lg bg-brand-soft px-2 py-1 text-xs text-brand-on-soft">يُصرف بوصفة طبية. تأكد من الوصفة قبل البيع.</p>}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3 border-t border-brand-border bg-brand-bg/60 p-5">
          <div className="flex items-center justify-between text-sm text-brand-muted">
            <span>المجموع</span>
            <span>{money(subtotal)}</span>
          </div>
          <label className="flex items-center justify-between gap-3 text-sm text-brand-muted">
            <span>خصم</span>
            <input value={discount} onChange={(event) => setDiscount(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="0" dir="ltr" aria-label="الخصم بالدينار"
              className="h-10 w-28 rounded-xl border border-brand-border bg-white px-3 text-center font-bold text-brand-ink outline-none focus:border-brand-blue" />
          </label>
          <div className="flex items-baseline justify-between">
            <span className="text-brand-muted">الإجمالي</span>
            <span className="text-3xl font-bold text-brand-ink">{money(total)} <span className="text-sm font-medium text-brand-muted">د.ع</span></span>
          </div>

          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="طريقة الدفع">
            {PAYMENTS.map((item) => (
              <button key={item.id} type="button" aria-pressed={payment === item.id} onClick={() => setPayment(item.id)}
                className={`min-h-11 rounded-xl text-sm font-semibold transition ${payment === item.id ? "bg-brand-navy text-white" : "bg-white text-brand-muted ring-1 ring-brand-border"}`}>
                {item.label}
              </button>
            ))}
          </div>

          {(payment === "debt" || showCustomer) && (
            <div className="grid grid-cols-2 gap-2">
              <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="اسم الزبون" aria-label="اسم الزبون"
                className="h-11 rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-blue" />
              <input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" inputMode="tel" aria-label="رقم الزبون"
                className="h-11 rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-blue" />
            </div>
          )}
          {payment !== "debt" && !showCustomer && (
            <button type="button" onClick={() => setShowCustomer(true)} className="text-xs font-semibold text-brand-blue hover:underline">
              + إرسال الإيصال للزبون على واتساب
            </button>
          )}

          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <button type="button" onClick={checkout} disabled={!cart.length || busy}
            className="min-h-14 w-full rounded-2xl bg-brand-gold text-lg font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">
            {busy ? "جاري الحفظ..." : "إتمام البيع"}
          </button>
        </div>
      </aside>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/55 p-4" role="dialog" aria-modal="true" aria-label="إيصال البيع">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-gold-ink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" className="h-7 w-7" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h3 className="mt-3 text-center text-xl font-bold text-brand-ink">تم البيع</h3>
            <p className="text-center text-xs text-brand-muted">فاتورة رقم {receipt.number} · {PAYMENTS.find((item) => item.id === receipt.paymentMethod)?.label}</p>
            <div className="mt-4 divide-y divide-dashed divide-brand-border text-sm">
              {receipt.items.map((item) => (
                <div key={item.name} className="flex justify-between py-1.5"><span>{item.name} × {money(item.qty)}</span><span>{money(item.price * item.qty)}</span></div>
              ))}
              {receipt.discount > 0 && <div className="flex justify-between py-1.5"><span>خصم</span><span>− {money(receipt.discount)}</span></div>}
            </div>
            <div className="mt-3 flex justify-between text-lg font-bold"><span>الإجمالي</span><span>{money(receipt.total)} د.ع</span></div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => window.print()} className="min-h-11 rounded-xl bg-brand-line text-sm font-semibold text-brand-ink">طباعة</button>
              {receipt.customerPhone ? (
                <a href={waLink(receipt.customerPhone, receiptText)} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-xl bg-[#075E54] text-sm font-semibold text-white">واتساب</a>
              ) : (
                <span className="flex min-h-11 items-center justify-center rounded-xl bg-brand-bg text-xs text-brand-muted">بلا رقم زبون</span>
              )}
            </div>
            <button type="button" onClick={closeReceipt} autoFocus className="mt-3 min-h-12 w-full rounded-2xl bg-brand-gold font-bold text-brand-gold-ink">فاتورة جديدة</button>
          </div>
        </div>
      )}
    </div>
  );
}
