"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/pharmacy/product";
import { uploadEntityImage } from "@/lib/client-image";
import { usePendingImage } from "@/lib/use-pending-image";
import BarcodeCamera, { cameraScanSupported } from "./BarcodeCamera";

type Product = {
  id: string;
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
  expiresAt: string | null;
  imageUrl?: string | null;
};

type Draft = Omit<Product, "id" | "price" | "cost" | "stock" | "minStock" | "imageUrl"> & { price: string; cost: string; stock: string; minStock: string };

type Receive = { product: Product; qty: string; cost: string };

const EXPIRY_WARNING_DAYS = 180;
const DAY_MS = 86_400_000;

const EMPTY: Draft = { name: "", genericName: "", category: "أدوية", form: "", barcode: "", price: "", cost: "", stock: "", minStock: "", requiresRx: false, expiresAt: "" };

const INPUT = "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";

function money(value: number) {
  return value.toLocaleString("ar-IQ");
}

function daysUntil(date: string | null) {
  return date ? Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS) : null;
}

function toDraft(product: Product): Draft {
  return {
    ...product,
    genericName: product.genericName ?? "",
    form: product.form ?? "",
    barcode: product.barcode ?? "",
    expiresAt: product.expiresAt ?? "",
    price: String(product.price),
    cost: String(product.cost),
    stock: String(product.stock),
    minStock: String(product.minStock),
  };
}

/** A number that can be fixed right in the table: type, press Enter or leave the box, and it saves. */
function QuickNumber({ initial, label, className, onSave }: { initial: number; label: string; className: string; onSave: (next: number) => Promise<boolean> }) {
  const [text, setText] = useState(String(initial));
  async function commit() {
    if (text === String(initial)) return;
    if (text === "" || !(await onSave(Number(text)))) setText(String(initial));
  }
  return (
    <input
      aria-label={label}
      value={text}
      inputMode="numeric"
      dir="ltr"
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setText(event.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      className={`h-9 w-24 rounded-lg border border-transparent bg-transparent px-2 text-right outline-none transition hover:border-brand-border focus:border-brand-blue focus:bg-white focus:ring-2 focus:ring-brand-soft ${className}`}
    />
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-brand-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-brand-muted">{hint}</span>}
    </label>
  );
}

export default function ProductsClient({ initialProducts, initialFilter }: { initialProducts: Product[]; initialFilter: "all" | "low" }) {
  const [products, setProducts] = useState(initialProducts);
  const [filter, setFilter] = useState<"all" | "low" | "expiring">(initialFilter);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const picked = usePendingImage();
  const pendingImage = picked.file;
  const setPendingImage = picked.choose;
  const [imageBusy, setImageBusy] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanValue, setScanValue] = useState("");
  const [scanNotice, setScanNotice] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [receive, setReceive] = useState<Receive | null>(null);
  const [receiveBusy, setReceiveBusy] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const scanRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => ({
    low: products.filter((product) => product.stock <= product.minStock).length,
    expiring: products.filter((product) => { const days = daysUntil(product.expiresAt); return days !== null && days <= EXPIRY_WARNING_DAYS; }).length,
    value: products.reduce((sum, product) => sum + product.cost * product.stock, 0),
  }), [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === "low" && product.stock > product.minStock) return false;
      if (filter === "expiring") { const days = daysUntil(product.expiresAt); if (days === null || days > EXPIRY_WARNING_DAYS) return false; }
      return !q || product.name.toLowerCase().includes(q) || product.genericName?.toLowerCase().includes(q) || product.barcode === query.trim();
    });
  }, [products, filter, query]);

  function setDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setEditing((prev) => (prev ? { ...prev, draft: { ...prev.draft, [key]: value } } : prev));
  }

  function handleScan(raw: string) {
    const code = raw.trim();
    setScanValue("");
    setCameraOpen(false);
    if (!code) return;
    const found = products.find((product) => product.barcode === code);
    setScanNotice("");
    setError("");
    if (found) {
      setReceive({ product: found, qty: "1", cost: "" });
      return;
    }
    setPendingImage(null);
    setScanNotice("باركود جديد: أكمل بيانات الدواء");
    setEditing({ id: null, draft: { ...EMPTY, barcode: code } });
  }

  async function submitReceive() {
    if (!receive || receiveBusy) return;
    const qty = Number(receive.qty);
    if (!Number.isInteger(qty) || qty < 1) {
      setError("اكتب كمية صحيحة");
      return;
    }
    setReceiveBusy(true);
    setError("");
    const res = await fetch(`/api/pharmacy/products/${receive.product.id}/receive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty, ...(receive.cost !== "" ? { cost: Number(receive.cost) } : {}) }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setReceiveBusy(false);
    if (!res?.ok) {
      setError(data.error ?? "تعذر الحفظ، تحقق من الاتصال");
      return;
    }
    setProducts((prev) => prev.map((product) => (product.id === data.id ? { ...product, stock: data.stock, cost: data.cost } : product)));
    setScanNotice(`أُضيف ${qty.toLocaleString("ar-IQ")} إلى "${receive.product.name}" · الرصيد الآن ${money(data.stock)}`);
    setReceive(null);
    scanRef.current?.focus();
  }

  async function quickSave(product: Product, patch: { price?: number; stock?: number }): Promise<boolean> {
    const res = await fetch(`/api/pharmacy/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      alert(data.error ?? "تعذر الحفظ، تحقق من الاتصال");
      return false;
    }
    setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, ...patch } : item)));
    return true;
  }

  async function save(again = false) {
    if (!editing || saving) return;
    setSaving(true);
    setError("");
    const { id, draft } = editing;
    const res = await fetch(id ? `/api/pharmacy/products/${id}` : "/api/pharmacy/products", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    if (!res?.ok) {
      setError(data.error ?? "تعذر الحفظ، تحقق من الاتصال");
      return;
    }
    const saved: Product = {
      ...data,
      expiresAt: data.expiresAt ? String(data.expiresAt).slice(0, 10) : null,
      imageUrl: id ? products.find((product) => product.id === id)?.imageUrl ?? null : null,
    };
    let imageError: string | null = null;
    if (pendingImage) {
      imageError = await uploadEntityImage(`/api/pharmacy/products/${saved.id}/image`, pendingImage);
      if (!imageError) saved.imageUrl = `/api/pharmacy/products/${saved.id}/image?v=${Date.now()}`;
    }
    setProducts((prev) => (prev.some((product) => product.id === saved.id) ? prev.map((product) => (product.id === saved.id ? saved : product)) : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name, "ar"))));
    setPendingImage(null);
    if (imageError) {
      // keep the dialog open on the saved product so the picture can be retried
      setEditing({ id: saved.id, draft: editing.draft });
      setError(`حُفظ المنتج لكن الصورة لم تُرفع: ${imageError}`);
      return;
    }
    if (again && !id) {
      setEditing({ id: null, draft: { ...EMPTY, category: draft.category } });
      setFormKey((key) => key + 1);
      return;
    }
    if (scanMode && !id) setScanNotice(`أُضيف "${saved.name}" إلى المنتجات`);
    setEditing(null);
    if (scanMode) scanRef.current?.focus();
  }

  async function archive(product: Product) {
    if (!confirm(`إزالة "${product.name}" من قائمة البيع؟ الفواتير السابقة تبقى محفوظة.`)) return;
    const res = await fetch(`/api/pharmacy/products/${product.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) { alert("تعذر الحذف"); return; }
    setProducts((prev) => prev.filter((item) => item.id !== product.id));
    setEditing(null);
  }

  async function removeImage(productId: string) {
    setImageBusy(true);
    const res = await fetch(`/api/pharmacy/products/${productId}/image`, { method: "DELETE" }).catch(() => null);
    setImageBusy(false);
    if (!res?.ok) {
      setError("تعذر حذف الصورة");
      return;
    }
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, imageUrl: null } : product)));
  }

  const current = editing?.id ? products.find((product) => product.id === editing.id) : undefined;
  const previewUrl = picked.previewUrl ?? current?.imageUrl ?? null;

  const margin = editing ? (parseInt(editing.draft.price) || 0) - (parseInt(editing.draft.cost) || 0) : 0;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-ink">المنتجات والمخزون</h1>
            <p className="mt-1 text-sm text-brand-muted">{money(products.length)} منتج · قيمة المخزون بسعر الشراء {money(counts.value)} د.ع</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/pharmacy/import" className="flex min-h-12 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-brand-ink ring-1 ring-brand-border transition hover:bg-brand-soft">استيراد من Excel أو وصل</Link>
            <button type="button" aria-pressed={scanMode} onClick={() => { setScanMode((on) => !on); setScanNotice(""); }}
              className={`min-h-12 rounded-2xl px-4 text-sm font-semibold ring-1 transition ${scanMode ? "bg-brand-navy text-white ring-brand-navy" : "bg-white text-brand-ink ring-brand-border hover:bg-brand-soft"}`}>
              مسح الباركود
            </button>
            <a href="/invoice/pharmacy-list" target="_blank" rel="noreferrer" className="flex min-h-12 items-center rounded-2xl bg-white px-4 text-sm font-semibold text-brand-ink ring-1 ring-brand-border transition hover:bg-brand-soft">طباعة القائمة</a>
            <button type="button" onClick={() => { setError(""); setPendingImage(null); setEditing({ id: null, draft: EMPTY }); }}
              className="flex min-h-12 items-center gap-2 rounded-2xl bg-brand-gold px-5 font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover">
              + منتج جديد
            </button>
          </div>
        </header>

        {scanMode && (
          <section className="space-y-2 rounded-3xl border border-brand-border bg-white p-4" aria-label="مسح الباركود">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={scanRef}
                autoFocus
                value={scanValue}
                onChange={(event) => setScanValue(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleScan(scanValue); } }}
                placeholder="امسح الباركود بالجهاز أو اكتبه ثم Enter"
                aria-label="الباركود"
                dir="ltr"
                className="h-12 min-w-0 flex-1 rounded-2xl border border-brand-border bg-brand-bg px-4 text-base outline-none focus:border-brand-blue focus:bg-white focus:ring-4 focus:ring-brand-soft"
              />
              {cameraScanSupported() && (
                <button type="button" onClick={() => setCameraOpen(true)} className="min-h-12 rounded-2xl bg-brand-soft px-5 text-sm font-semibold text-brand-on-soft transition hover:bg-brand-line">الكاميرا</button>
              )}
            </div>
            <p className="text-xs text-brand-muted">دواء موجود: يُسأل عن الكمية فقط لإضافتها للمخزون. باركود جديد: تُفتح بطاقة الدواء وفيها الباركود جاهز.</p>
            {scanNotice && <p role="status" className="rounded-xl bg-brand-mint-soft px-3 py-2 text-sm font-semibold text-brand-mint-text">{scanNotice}</p>}
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: "all", label: "الكل", count: products.length },
            { id: "low", label: "قاربت على النفاد", count: counts.low },
            { id: "expiring", label: "تنتهي خلال ٦ أشهر", count: counts.expiring },
          ] as const).map((item) => (
            <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}
              className={`flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${filter === item.id ? "bg-brand-navy text-white" : "bg-white text-brand-muted ring-1 ring-brand-border"}`}>
              {item.label}
              <span className={`rounded-full px-2 text-xs ${filter === item.id ? "bg-white/15" : "bg-brand-line"}`}>{money(item.count)}</span>
            </button>
          ))}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث بالاسم أو الباركود" aria-label="بحث"
            className="h-10 min-w-0 flex-1 rounded-full border border-brand-border bg-white px-4 text-sm outline-none focus:border-brand-blue md:max-w-xs md:flex-none" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-border bg-white">
          {visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-brand-muted">{products.length === 0 ? "لا توجد منتجات بعد. أضف أول منتج، أو استورد قائمتك كاملة من Excel أو من وصل الشراء." : "لا توجد نتائج."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-brand-bg text-xs text-brand-muted">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold">المنتج</th>
                    <th className="px-4 py-3 text-right font-semibold">التصنيف</th>
                    <th className="px-4 py-3 text-right font-semibold">سعر البيع</th>
                    <th className="px-4 py-3 text-right font-semibold">الربح للقطعة</th>
                    <th className="px-4 py-3 text-right font-semibold">المخزون</th>
                    <th className="px-4 py-3 text-right font-semibold">الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {visible.map((product) => {
                    const days = daysUntil(product.expiresAt);
                    const low = product.stock <= product.minStock;
                    return (
                      <tr key={product.id} onClick={() => { setError(""); setPendingImage(null); setEditing({ id: product.id, draft: toDraft(product) }); }} className="cursor-pointer transition hover:bg-brand-bg">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-xl bg-brand-bg object-cover" />
                          ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-sm font-bold text-brand-muted">{product.name.trim().charAt(0)}</span>
                          )}
                          <div>
                          <p className="font-bold text-brand-ink">{product.name} {product.requiresRx && <span className="mr-1 rounded bg-brand-soft px-1.5 text-[10px] text-brand-on-soft">بوصفة</span>}</p>
                          <p className="text-xs text-brand-muted">{[product.form, product.genericName].filter(Boolean).join(" · ")}</p>
                          </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{product.category}</td>
                        <td className="px-2 py-2"><QuickNumber key={`${product.id}-p-${product.price}`} initial={product.price} label={`سعر ${product.name}`} className="font-semibold" onSave={(next) => quickSave(product, { price: next })} /></td>
                        <td className="px-4 py-3 text-brand-mint-text">{money(product.price - product.cost)}</td>
                        <td className="px-2 py-2">
                          <QuickNumber key={`${product.id}-s-${product.stock}`} initial={product.stock} label={`كمية ${product.name}`} className={`font-semibold ${product.stock <= 0 ? "!bg-red-50 text-red-700" : low ? "!bg-amber-50 text-amber-800" : "text-brand-ink"}`} onSave={(next) => quickSave(product, { stock: next })} />
                        </td>
                        <td className="px-4 py-3">
                          {days === null ? <span className="text-brand-muted">—</span> : (
                            <span className={days <= 0 ? "font-semibold text-red-700" : days <= 60 ? "font-semibold text-red-700" : days <= EXPIRY_WARNING_DAYS ? "text-amber-700" : "text-brand-muted"}>
                              {days <= 0 ? "منتهي" : `${money(days)} يوماً`}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {cameraOpen && <BarcodeCamera onCode={handleScan} onClose={() => setCameraOpen(false)} />}

      {receive && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/55 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="إضافة كمية للمخزون">
          <form
            onSubmit={(event) => { event.preventDefault(); submitReceive(); }}
            className="w-full max-w-sm rounded-t-3xl bg-white p-6 sm:rounded-3xl"
          >
            <h2 className="text-xl font-bold text-brand-ink">{receive.product.name}</h2>
            <p className="mt-1 text-sm text-brand-muted">الرصيد الحالي: {money(receive.product.stock)}</p>
            <div className="mt-4 grid gap-3">
              <Field label="الكمية المستلمة *">
                <input className={INPUT} autoFocus onFocus={(event) => event.currentTarget.select()} value={receive.qty} onChange={(e) => setReceive({ ...receive, qty: e.target.value.replace(/\D/g, "") })} inputMode="numeric" dir="ltr" />
              </Field>
              <Field label="سعر الشراء الجديد (اختياري)" hint={`الحالي: ${money(receive.product.cost)} د.ع`}>
                <input className={INPUT} value={receive.cost} onChange={(e) => setReceive({ ...receive, cost: e.target.value.replace(/\D/g, "") })} inputMode="numeric" dir="ltr" />
              </Field>
            </div>
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button type="submit" disabled={receiveBusy} className="min-h-12 flex-1 rounded-2xl bg-brand-navy font-bold text-white disabled:opacity-50">{receiveBusy ? "جاري الحفظ..." : "إضافة للمخزون"}</button>
              <button type="button" onClick={() => { setReceive(null); setError(""); scanRef.current?.focus(); }} className="min-h-12 rounded-2xl bg-brand-line px-5 text-sm font-semibold text-brand-ink">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/55 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={editing.id ? "تعديل منتج" : "منتج جديد"}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-ink">{editing.id ? "تعديل منتج" : "منتج جديد"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="إغلاق" className="h-9 w-9 rounded-xl bg-brand-line text-lg">×</button>
            </div>
            <div className="mb-4 flex items-center gap-4 rounded-2xl bg-brand-bg p-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="صورة المنتج" className="h-20 w-20 shrink-0 rounded-2xl bg-white object-cover" />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-xs text-brand-muted">بدون صورة</span>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="flex min-h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-sm font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-brand-soft">
                  {previewUrl ? "تغيير الصورة" : "إضافة صورة"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { setPendingImage(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                </label>
                {(pendingImage || current?.imageUrl) && (
                  <button type="button" disabled={imageBusy} onClick={() => (pendingImage ? setPendingImage(null) : current && removeImage(current.id))} className="min-h-10 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-50">حذف الصورة</button>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="اسم المنتج *"><input key={formKey} className={INPUT} value={editing.draft.name} onChange={(e) => setDraft("name", e.target.value)} autoFocus /></Field></div>
              <Field label="المادة الفعالة"><input className={INPUT} value={editing.draft.genericName ?? ""} onChange={(e) => setDraft("genericName", e.target.value)} placeholder="باراسيتامول" /></Field>
              <Field label="الشكل والعبوة"><input className={INPUT} value={editing.draft.form ?? ""} onChange={(e) => setDraft("form", e.target.value)} placeholder="٢٤ قرص" /></Field>
              <Field label="التصنيف">
                <select className={INPUT} value={editing.draft.category} onChange={(e) => setDraft("category", e.target.value)}>
                  {PRODUCT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="الباركود"><input className={INPUT} value={editing.draft.barcode ?? ""} onChange={(e) => setDraft("barcode", e.target.value)} dir="ltr" placeholder="امسحه هنا" /></Field>
              <Field label="سعر البيع (د.ع) *"><input className={INPUT} value={editing.draft.price} onChange={(e) => setDraft("price", e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" /></Field>
              <Field label="سعر الشراء (د.ع)" hint={margin > 0 ? `ربحك في القطعة: ${money(margin)} د.ع` : undefined}><input className={INPUT} value={editing.draft.cost} onChange={(e) => setDraft("cost", e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" /></Field>
              <Field label="الكمية في المخزون"><input className={INPUT} value={editing.draft.stock} onChange={(e) => setDraft("stock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" /></Field>
              <Field label="نبّهني إذا قلّت عن"><input className={INPUT} value={editing.draft.minStock} onChange={(e) => setDraft("minStock", e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" /></Field>
              <Field label="تاريخ انتهاء الصلاحية"><input type="date" className={INPUT} value={editing.draft.expiresAt ?? ""} onChange={(e) => setDraft("expiresAt", e.target.value)} dir="ltr" /></Field>
              <label className="flex items-center gap-3 self-end rounded-xl bg-brand-bg px-3 py-3 text-sm font-semibold text-brand-ink">
                <input type="checkbox" checked={editing.draft.requiresRx} onChange={(e) => setDraft("requiresRx", e.target.checked)} className="h-5 w-5 accent-[#0E2440]" />
                يُصرف بوصفة طبية
              </label>
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => save()} disabled={saving} className="min-h-12 flex-1 rounded-2xl bg-brand-navy font-bold text-white disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ"}</button>
              {!editing.id && (
                <button type="button" onClick={() => save(true)} disabled={saving} className="min-h-12 flex-1 rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:opacity-50">حفظ وإضافة آخر</button>
              )}
              {editing.id && (
                <button type="button" onClick={() => { const product = products.find((item) => item.id === editing.id); if (product) archive(product); }}
                  className="min-h-12 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700">إزالة</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
