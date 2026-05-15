"use client";

import { useEffect, useState } from "react";
import { isPlanId, PLAN_LABELS, PLAN_PRICES, PlanId } from "@/lib/plans";
import { validatePaymentReference } from "@/lib/payment-reference";

type PaymentMethodId = "superkey" | "zaincash" | "crypto";
type PurchaseMode = "renew" | "upgrade";

const PAYMENT_METHODS: Array<{
  id: PaymentMethodId;
  label: string;
  scope: string;
  destinationLabel: string;
  destination: string;
  referenceLabel: string;
  referencePlaceholder: string;
}> = [
  {
    id: "superkey",
    label: "SuperKey",
    scope: "داخل العراق",
    destinationLabel: "رقم المحفظة",
    destination: "07706688044",
    referenceLabel: "رقم العملية",
    referencePlaceholder: "مثال: SK-123456",
  },
  {
    id: "zaincash",
    label: "Zain Cash",
    scope: "داخل العراق",
    destinationLabel: "رقم المحفظة",
    destination: "07706688044",
    referenceLabel: "رقم العملية",
    referencePlaceholder: "مثال: ZC-123456",
  },
  {
    id: "crypto",
    label: "Binance / Crypto",
    scope: "خارج العراق",
    destinationLabel: "عنوان المحفظة",
    destination: "TERnca1u35msfXDroSNPuu4UAZsr1YBcrR",
    referenceLabel: "Hash / TXID",
    referencePlaceholder: "ألصق Hash أو TXID هنا",
  },
];

const PLANS: Array<{
  id: PlanId;
  name: string;
  title: string;
  price: number;
  color: string;
  badge?: string;
  features: string[];
}> = [
  {
    id: "basic",
    name: "أساسية",
    title: "للعيادات الصغيرة",
    price: PLAN_PRICES.basic,
    color: "border-slate-200 bg-white",
    features: ["المرضى والحجوزات", "شاشة الانتظار", "السجل الطبي", "تقرير يومي"],
  },
  {
    id: "standard",
    name: "متوسطة",
    title: "للعيادات النشطة",
    price: PLAN_PRICES.standard,
    color: "border-emerald-300 bg-emerald-50",
    badge: "الأكثر اختياراً",
    features: ["كل أساسية", "تذكيرات واتساب", "متابعة مراجعات", "تقارير PDF"],
  },
  {
    id: "premium",
    name: "مميزة",
    title: "للمراكز الكبيرة",
    price: PLAN_PRICES.premium,
    color: "border-blue-300 bg-blue-50",
    features: ["كل متوسطة", "واتساب متقدم", "دعم أولوية", "نسخ احتياطي متقدم"],
  },
  {
    id: "vip",
    name: "مميزة VIP",
    title: "للمراكز المتميزة",
    price: PLAN_PRICES.vip,
    color: "border-violet-300 bg-violet-50",
    badge: "الأقوى",
    features: ["كل مميزة", "🧪 تحاليل وأشعة", "💊 وصفات مرضى", "📎 رفع ملفات", "💚 رسائل اطمئنان"],
  },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  trial:    { label: "تجريبي", cls: "bg-amber-50 text-amber-700 ring-amber-200",   dot: "bg-amber-500"  },
  active:   { label: "نشط",    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  inactive: { label: "منتهي", cls: "bg-red-50 text-red-700 ring-red-200",          dot: "bg-red-500"    },
};

const PLAN_RANK: Record<PlanId, number> = { basic: 1, standard: 2, premium: 3, vip: 4 };

interface Subscription { plan: string; status: string; startDate: string; expiresAt: string; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });
}
function formatMoney(v: number) { return v.toLocaleString("ar-IQ"); }
function arabicNumber(v: number) { return String(v).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]); }

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null | "loading">("loading");
  const [step, setStep] = useState<"plans" | "payment">("plans");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("standard");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("superkey");
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode | null>(null);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSubscription)
      .catch(() => setSubscription(null));
  }, []);

  useEffect(() => {
    if (!submitted) return;
    const check = async () => {
      const res = await fetch("/api/subscription", { cache: "no-store" });
      if (!res.ok) return;
      const latest = (await res.json()) as Subscription | null;
      setSubscription(latest);
      if (latest?.status === "active" && latest.plan === selectedPlan) {
        setSubmitted(false); setReference(""); setStep("plans");
      }
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [selectedPlan, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod)!;
    const check = validatePaymentReference(method.id, reference);
    if (!check.ok) { setError(check.error); return; }
    setSubmitting(true); setError("");
    const plan = PLANS.find((p) => p.id === selectedPlan)!;
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: plan.price, method: method.id, plan: plan.id, reference: check.reference }),
    });
    if (res.ok) { setSubmitted(true); }
    else { const d = await res.json(); setError(d.error ?? "تعذر إرسال طلب الدفع"); }
    setSubmitting(false);
  }

  if (subscription === "loading") {
    return <div className="p-6 text-center text-sm text-slate-400">جاري تحميل الاشتراك...</div>;
  }

  const status = subscription ? STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.inactive : null;
  const daysLeft = subscription ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - now) / 86400000)) : 0;
  const activePlan = subscription && isPlanId(subscription.plan) ? subscription.plan : "basic";
  const isActive = subscription?.status === "active" && daysLeft > 0;
  const selectedPaymentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod)!;
  const selected = PLANS.find((p) => p.id === selectedPlan)!;
  const selectablePlans = isActive
    ? purchaseMode === "renew" ? PLANS.filter((p) => p.id === activePlan)
    : purchaseMode === "upgrade" ? PLANS.filter((p) => PLAN_RANK[p.id] > PLAN_RANK[activePlan])
    : [] : PLANS;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <section className="rounded-[30px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.09)] ring-1 ring-sky-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-emerald-700">إدارة الاشتراك</p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">باقات تشغيل العيادة</h1>
            </div>
            {subscription && status && (
              <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-100 text-center min-w-[160px]">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${status.cls}`}>
                  <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <p className="mt-2 text-2xl font-black text-slate-950">{arabicNumber(daysLeft)}</p>
                <p className="text-xs font-bold text-slate-400">يوم متبقي</p>
                <p className="mt-1 text-xs font-black text-slate-600">
                  {PLAN_LABELS[subscription.plan as keyof typeof PLAN_LABELS] ?? subscription.plan}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Active subscription actions */}
        {isActive && (
          <section className="rounded-[26px] bg-white p-5 shadow-sm ring-1 ring-emerald-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">اشتراكك نشط ✅</h2>
                <p className="text-sm font-semibold text-slate-500">ينتهي {formatDate(subscription!.expiresAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setPurchaseMode("renew"); setSelectedPlan(activePlan); setStep("plans"); setError(""); }}
                  className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700">
                  تجديد الباقة
                </button>
                {activePlan !== "vip" && (
                  <button onClick={() => { setPurchaseMode("upgrade"); setSelectedPlan(activePlan === "basic" ? "standard" : activePlan === "standard" ? "premium" : "vip"); setStep("plans"); setError(""); }}
                    className="rounded-2xl bg-emerald-50 px-5 py-2.5 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100">
                    ترقية الاشتراك
                  </button>
                )}
                {purchaseMode && (
                  <button onClick={() => { setPurchaseMode(null); setStep("plans"); }}
                    className="rounded-2xl bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-200">
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* STEP 1 — Plan cards */}
        {(!isActive || purchaseMode) && step === "plans" && !submitted && (
          <section>
            <p className="mb-4 text-sm font-black text-slate-500">اختر الباقة المناسبة لعيادتك</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {selectablePlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative cursor-pointer rounded-[26px] border-2 p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${plan.color} ${
                      isSelected ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]" : ""
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 right-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow">
                        {plan.badge}
                      </span>
                    )}
                    <p className="text-xs font-bold text-slate-400">{plan.title}</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{plan.name}</h2>
                    <p className="mt-3 text-3xl font-black text-slate-950">
                      {formatMoney(plan.price)}
                      <span className="text-sm font-bold text-slate-400 mr-1">د.ع / شهر</span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <span className="text-emerald-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <div className={`mt-5 w-full rounded-2xl py-2.5 text-center text-sm font-black transition ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {isSelected ? "✓ مختارة" : "اختيار"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex justify-center">
              <button
                onClick={() => { setStep("payment"); setError(""); }}
                className="rounded-2xl bg-blue-600 px-10 py-3.5 text-base font-black text-white shadow-[0_12px_28px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                متابعة الدفع ← {selected.name} · {formatMoney(selected.price)} د.ع
              </button>
            </div>
          </section>
        )}

        {/* STEP 2 — Payment form */}
        {(!isActive || purchaseMode) && step === "payment" && !submitted && (
          <form onSubmit={handleSubmit} className="rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-slate-200">
            <div className="mb-5 flex items-center gap-3">
              <button type="button" onClick={() => setStep("plans")}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 hover:bg-slate-200">
                ← تغيير الباقة
              </button>
              <div className="rounded-2xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200">
                <span className="text-sm font-black text-slate-950">{selected.name}</span>
                <span className="mr-2 text-sm font-bold text-emerald-700">{formatMoney(selected.price)} د.ع / شهر</span>
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-950">طريقة الدفع</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((method) => {
                const isSel = selectedMethod === method.id;
                return (
                  <button key={method.id} type="button"
                    onClick={() => { setSelectedMethod(method.id); setReference(""); }}
                    className={`rounded-2xl p-3 text-right ring-1 transition ${
                      isSel ? "bg-blue-600 text-white ring-blue-600" : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-blue-50"
                    }`}>
                    <p className="font-black">{method.label}</p>
                    <p className={`text-xs mt-0.5 ${isSel ? "text-blue-100" : "text-slate-400"}`}>{method.scope}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <p className="text-xs font-black text-emerald-700">{selectedPaymentMethod.destinationLabel}</p>
              <p className="mt-1 text-xl font-black tracking-wide text-emerald-950" dir="ltr">{selectedPaymentMethod.destination}</p>
            </div>

            <div className="mt-4 space-y-2">
              {[`أكمل الدفع عبر ${selectedPaymentMethod.label}.`,
                selectedMethod === "crypto" ? "انسخ Hash أو TXID من منصة التحويل." : "انسخ رقم العملية من تطبيق الدفع.",
                "أدخل رقم العملية هنا للتحقق والتفعيل.",
              ].map((step, i) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    {arabicNumber(i + 1)}
                  </span>
                  <p className="pt-0.5 text-sm font-semibold text-slate-600">{step}</p>
                </div>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-black text-slate-500">{selectedPaymentMethod.referenceLabel}</span>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                placeholder={selectedPaymentMethod.referencePlaceholder}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                dir={selectedMethod === "crypto" ? "ltr" : "rtl"} />
            </label>

            {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">{error}</p>}

            <button type="submit" disabled={submitting}
              className="mt-4 w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? "جاري الإرسال..." : "إرسال للتحقق والتفعيل ✓"}
            </button>

            <a href="/dashboard/support"
              className="mt-3 block rounded-2xl bg-slate-50 py-3 text-center text-sm font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100">
              التواصل مع الدعم
            </a>
          </form>
        )}

        {/* Success */}
        {submitted && (
          <section className="rounded-[30px] bg-emerald-50 p-10 text-center ring-1 ring-emerald-100">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-3xl text-white">✓</div>
            <h2 className="text-2xl font-black text-emerald-900">تم إرسال طلب الدفع</h2>
            <p className="mt-2 text-sm font-semibold text-emerald-700">بعد التحقق من العملية سيتم تفعيل الباقة تلقائياً.</p>
          </section>
        )}

      </div>
    </div>
  );
}
