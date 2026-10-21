"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/pharmacy/product";
import { money } from "@/lib/format";

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
type Receipt = { id: string; number: number; total: number; discount: number; paymentMethod: Payment; customerPhone: string | null; items: { name: string; qty: number; price: number }[] };

const PAYMENTS: { id: Payment; label: string }[] = [
  { id: "cash", label: "نقداً" },
  { id: "zaincash", label: "زين كاش" },
  { id: "debt", label: "دين" },
];

const CATEGORY_DOT: Record<string, string> = {
  "أدوية": "bg-brand-blue",
  "فيتامينات": "bg-amber-500",
  "عناية بالبشرة": "bg-pink-500",
  "أطفال": "bg-emerald-500",
  "مستلزمات طبية": "bg-slate-500",
  "أخرى": "bg-slate-300",
};

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("964") ? digits : digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

function StockTag({ product }: { product: PosProduct }) {
  if (product.stock <= 0) return <span className="whitespace-nowrap rounded-lg bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">نفد</span>;
  if (product.stock <= product.minStock) return <span className="whitespace-nowrap rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">باقي {money(product.stock)}</span>;
  return <span className="whitespace-nowrap rounded-lg bg-brand-mint-soft px-2 py-0.5 text-xs font-semibold text-brand-mint-text">{money(product.stock)} متوفر</span>;
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
  const invoiceRef = useRef<HTMLElement>(null);

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
    setReceipt({ id: data.id, number: data.number, total: data.total, discount: data.discount, paymentMethod: data.paymentMethod, customerPhone: data.customerPhone, items: data.items });
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

  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const inCart = new Map(cart.map((line) => [line.productId, line.qty]));

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]" dir="rtl">
      <section className="min-w-0 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-2xl bg-brand-navy px-4 py-3.5 text-white">
            <p className="text-xs text-brand-side-muted">مبيعات اليوم</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{money(today.sales)} <span className="text-xs font-medium text-brand-side-muted">د.ع</span></p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-white px-4 py-3.5">
            <p className="text-xs text-brand-muted">عدد الفواتير</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink">{money(today.invoices)}</p>
          </div>
          <div className="rounded-2xl border border-brand-border bg-white px-4 py-3.5">
            <p className="text-xs text-brand-muted">ربح اليوم</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-brand-ink">{money(today.profit)} <span className="text-xs font-medium text-brand-muted">د.ع</span></p>
          </div>
          <Link href="/dashboard/pharmacy/products?filter=low" className="group rounded-2xl border border-brand-border bg-white px-4 py-3.5 transition hover:border-amber-300">
            <p className="flex items-center justify-between text-xs text-brand-muted">قاربت على النفاد <span className="text-brand-muted/60 transition group-hover:-translate-x-0.5 group-hover:text-amber-700" aria-hidden>←</span></p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${lowCount ? "text-amber-700" : "text-brand-ink"}`}>{money(lowCount)} <span className="text-xs font-medium text-brand-muted">صنف</span></p>
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
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${category === item ? "bg-brand-navy text-white" : "bg-white text-brand-muted ring-1 ring-brand-border hover:text-brand-ink"}`}
            >
              {item !== "الكل" && <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[item] ?? CATEGORY_DOT["أخرى"]}`} aria-hidden />}
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
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visible.map((product) => {
              const out = product.stock <= 0;
              const qty = inCart.get(product.id) ?? 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={out}
                  onClick={() => add(product)}
                  className={`relative flex min-h-40 flex-col rounded-2xl border bg-white p-3.5 text-right transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55 ${qty ? "border-brand-gold ring-2 ring-brand-gold/35" : "border-brand-border hover:border-brand-navy/25 hover:shadow-[0_8px_24px_-12px_rgba(14,36,64,0.25)]"}`}
                >
                  {qty > 0 && (
                    <span className="absolute -top-2.5 left-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-gold px-1.5 text-sm font-bold tabular-nums text-brand-gold-ink shadow" aria-label={`${qty} في الفاتورة`}>{money(qty)}</span>
                  )}
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-muted">
                      <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[product.category] ?? CATEGORY_DOT["أخرى"]}`} aria-hidden />
                      {product.form ?? product.category}
                    </span>
                    {product.requiresRx && <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-on-soft">بوصفة</span>}
                  </span>
                  {product.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt="" loading="lazy" className="mt-2 h-16 w-full rounded-xl bg-brand-bg object-contain" />
                  )}
                  <span className="mt-2 line-clamp-2 font-bold leading-snug text-brand-ink">{product.name}</span>
                  {product.genericName && <span className="mt-0.5 truncate text-xs text-brand-muted" dir="auto">{product.genericName}</span>}
                  <span className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5 pt-3">
                    <span className="whitespace-nowrap text-lg font-bold leading-none tabular-nums text-brand-ink">{money(product.price)} <span className="text-[11px] font-medium text-brand-muted">د.ع</span></span>
                    <StockTag product={product} />
                  </span>
                </button>
              );
            })}
            {visible.length === 0 && <p className="col-span-full py-8 text-center text-sm text-brand-muted">لا يوجد منتج بهذا الاسم.</p>}
          </div>
        )}
      </section>

      <aside ref={invoiceRef} className="flex min-w-0 scroll-mt-4 flex-col border-t border-brand-border bg-white lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-t-0" aria-label="الفاتورة">
        <div className="flex items-center justify-between border-b border-brand-line px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-brand-ink">الفاتورة الحالية</h2>
            {itemCount > 0 && <span className="rounded-full bg-brand-bg px-2.5 py-0.5 text-xs font-bold tabular-nums text-brand-muted">{money(itemCount)} قطعة</span>}
          </div>
          {cart.length > 0 && (
            <button type="button" onClick={() => setCart([])} className="rounded-lg px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50">إفراغ</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-bg text-brand-muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>
              </span>
              <p className="text-sm leading-7 text-brand-muted">اضغط على منتج أو امسح الباركود<br />لإضافته إلى الفاتورة</p>
            </div>
          ) : (
            cart.map((line) => {
              const product = byId.get(line.productId);
              if (!product) return null;
              return (
                <div key={line.productId} className="border-b border-brand-line py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-brand-ink">{product.name}</p>
                      <p className="text-xs tabular-nums text-brand-muted">{money(product.price)} د.ع للقطعة</p>
                    </div>
                    <span className="flex items-center rounded-xl border border-brand-border">
                      <button type="button" onClick={() => changeQty(line.productId, 1)} aria-label="زيادة" className="h-9 w-9 rounded-r-xl text-lg font-bold text-brand-ink hover:bg-brand-bg">+</button>
                      <span className="min-w-8 text-center font-bold tabular-nums">{money(line.qty)}</span>
                      <button type="button" onClick={() => changeQty(line.productId, -1)} aria-label="إنقاص" className="h-9 w-9 rounded-l-xl text-lg font-bold text-brand-ink hover:bg-brand-bg">−</button>
                    </span>
                    <span className="w-20 text-left font-bold tabular-nums text-brand-ink">{money(product.price * line.qty)}</span>
                  </div>
                  {product.requiresRx && <p className="mt-2 rounded-lg bg-brand-soft px-2 py-1 text-xs text-brand-on-soft">يُصرف بوصفة طبية. تأكد من الوصفة قبل البيع.</p>}
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3 border-t border-brand-border p-5 pb-40 lg:pb-5">
          <div className="space-y-2 text-sm tabular-nums">
            <div className="flex items-center justify-between text-brand-muted">
              <span>المجموع</span>
              <span>{money(subtotal)} د.ع</span>
            </div>
            <label className="flex items-center justify-between gap-3 text-brand-muted">
              <span>الخصم</span>
              <span className="flex h-10 w-32 items-center gap-2 rounded-xl border border-brand-border bg-white px-3 focus-within:border-brand-blue">
                <input value={discount} onChange={(event) => setDiscount(event.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="0" dir="ltr" aria-label="الخصم بالدينار"
                  className="w-full bg-transparent text-left font-bold text-brand-ink outline-none" />
                <span className="text-xs">د.ع</span>
              </span>
            </label>
          </div>
          <div className="flex items-baseline justify-between border-t border-dashed border-brand-border pt-3">
            <span className="font-semibold text-brand-ink">الإجمالي</span>
            <span className="text-3xl font-bold tabular-nums text-brand-ink">{money(total)} <span className="text-sm font-medium text-brand-muted">د.ع</span></span>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-brand-bg p-1" role="group" aria-label="طريقة الدفع">
            {PAYMENTS.map((item) => (
              <button key={item.id} type="button" aria-pressed={payment === item.id} onClick={() => setPayment(item.id)}
                className={`min-h-10 rounded-xl text-sm font-semibold transition ${payment === item.id ? "bg-white text-brand-ink shadow-sm ring-1 ring-brand-border" : "text-brand-muted hover:text-brand-ink"}`}>
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
            className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-brand-gold px-5 text-lg font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:cursor-not-allowed disabled:opacity-45">
            <span>{busy ? "جاري الحفظ..." : "إتمام البيع"}</span>
            {cart.length > 0 && <span className="tabular-nums">{money(total)} د.ع</span>}
          </button>
        </div>
      </aside>

      {cart.length > 0 && (
        <button type="button" onClick={() => invoiceRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="fixed inset-x-3 bottom-3 z-30 flex min-h-14 items-center justify-between rounded-2xl bg-brand-navy px-5 font-bold text-white shadow-[0_12px_32px_-8px_rgba(14,36,64,0.5)] lg:hidden">
          <span>الفاتورة · {money(itemCount)} قطعة</span>
          <span className="tabular-nums">{money(total)} د.ع</span>
        </button>
      )}

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/60 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="إيصال البيع">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-brand-navy px-6 py-6 text-center text-white">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-mint text-brand-mint-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <h3 className="mt-3 text-lg font-bold">تم البيع بنجاح</h3>
              <p className="mt-0.5 text-sm tabular-nums text-brand-side-muted">فاتورة رقم {receipt.number} · {PAYMENTS.find((item) => item.id === receipt.paymentMethod)?.label}</p>
              <p className="mt-4 text-4xl font-bold tabular-nums">{money(receipt.total)} <span className="text-base font-medium text-brand-side-muted">د.ع</span></p>
            </div>

            <ul className="max-h-60 divide-y divide-brand-line overflow-y-auto px-6 py-2 text-sm tabular-nums">
              {receipt.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-brand-ink">{item.name}</span>
                    <span className="text-xs text-brand-muted">{money(item.qty)} × {money(item.price)}</span>
                  </span>
                  <span className="font-bold text-brand-ink">{money(item.price * item.qty)}</span>
                </li>
              ))}
              {receipt.discount > 0 && (
                <li className="flex justify-between py-2.5 text-brand-muted"><span>الخصم</span><span>− {money(receipt.discount)}</span></li>
              )}
            </ul>

            <div className="space-y-2 border-t border-brand-line bg-brand-bg/60 px-6 py-4">
              <button type="button" onClick={closeReceipt} autoFocus className="min-h-12 w-full rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">فاتورة جديدة</button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`/invoice/pharmacy/${receipt.id}?print=1&format=thermal`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-brand-ink ring-1 ring-brand-border transition hover:ring-brand-navy/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z" /><path d="M10 8h4M10 12h4" /></svg>
                  إيصال صغير
                </a>
                <a href={`/invoice/pharmacy/${receipt.id}?print=1`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-brand-ink ring-1 ring-brand-border transition hover:ring-brand-navy/30">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z" /></svg>
                  فاتورة A4
                </a>
                {receipt.customerPhone && (
                  <a href={waLink(receipt.customerPhone, receiptText)} target="_blank" rel="noreferrer" className="col-span-2 flex min-h-11 items-center justify-center rounded-xl bg-[#075E54] text-sm font-semibold text-white">إرسال على واتساب</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
