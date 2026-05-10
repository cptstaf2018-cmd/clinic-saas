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
  pitch: string;
  outcome: string;
  price: number;
  tone: string;
  dot: string;
  highlight?: string;
  bestFor: string;
  features: string[];
}> = [
  {
    id: "basic",
    name: "Basic",
    title: "للعيادات الصغيرة",
    pitch: "تشغيل أساسي للمرضى والحجوزات وشاشة الانتظار.",
    outcome: "تنظيم يومي واضح بدون تعقيد.",
    price: PLAN_PRICES.basic,
    tone: "from-sky-50 via-[#f8fbf8] to-[#f3faf6] ring-sky-100",
    dot: "bg-sky-600",
    bestFor: "عيادة صغيرة",
    features: ["المرضى والحجوزات", "شاشة الانتظار", "السجل الطبي", "تقرير يومي مختصر"],
  },
  {
    id: "standard",
    name: "Pro",
    title: "للعيادات المتوسطة",
    pitch: "متابعة المرضى والتذكيرات والتقارير للعيادة النشطة.",
    outcome: "متابعة أفضل للمراجعين وتقليل الغياب.",
    price: PLAN_PRICES.standard,
    tone: "from-emerald-50 via-[#f8fbf8] to-[#f2faf5] ring-emerald-100",
    dot: "bg-emerald-600",
    highlight: "الأكثر مناسبة",
    bestFor: "عيادة نشطة",
    features: ["كل Basic", "تذكيرات واتساب", "متابعة مراجعات", "تقارير و PDF"],
  },
  {
    id: "premium",
    name: "Enterprise",
    title: "للمراكز الكبيرة",
    pitch: "تشغيل متقدم ودعم أولوية وتجهيز للتوسع والفروع.",
    outcome: "تحكم أعلى وتجربة أقوى للمراكز الكبيرة.",
    price: PLAN_PRICES.premium,
    tone: "from-indigo-50 via-[#f8fbf8] to-[#f2f8fb] ring-indigo-100",
    dot: "bg-indigo-600",
    bestFor: "مركز كبير",
    features: ["كل Pro", "دعم أولوية", "نسخ احتياطي متقدم", "جاهز للفروع"],
  },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  trial: { label: "تجريبي", cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  active: { label: "نشط", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  inactive: { label: "منتهي", cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
};

const PLAN_RANK: Record<PlanId, number> = {
  basic: 1,
  standard: 2,
  premium: 3,
};

interface Subscription {
  plan: string;
  status: string;
  startDate: string;
  expiresAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMoney(value: number) {
  return value.toLocaleString("ar-IQ");
}

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-4 w-4">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null | "loading">("loading");
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

    const checkSubscription = async () => {
      try {
        const res = await fetch("/api/subscription", { cache: "no-store" });
        if (!res.ok) return;
        const latest = (await res.json()) as Subscription | null;
        setSubscription(latest);
        if (latest?.status === "active" && latest.plan === selectedPlan) {
          setSubmitted(false);
          setReference("");
        }
      } catch {}
    };

    checkSubscription();
    const timer = setInterval(checkSubscription, 5000);
    return () => clearInterval(timer);
  }, [selectedPlan, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const method = PAYMENT_METHODS.find((item) => item.id === selectedMethod)!;
    const referenceCheck = validatePaymentReference(method.id, reference);

    if (!referenceCheck.ok) {
      setError(referenceCheck.error);
      return;
    }

    setSubmitting(true);
    setError("");

    const plan = PLANS.find((p) => p.id === selectedPlan)!;
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: plan.price,
        method: method.id,
        plan: plan.id,
        reference: referenceCheck.reference,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "تعذر إرسال طلب الدفع");
    }

    setSubmitting(false);
  }

  if (subscription === "loading") {
    return (
      <div className="p-6 text-center text-sm font-semibold text-slate-400">
        جاري تحميل الاشتراك...
      </div>
    );
  }

  const selected = PLANS.find((p) => p.id === selectedPlan)!;
  const selectedPaymentMethod = PAYMENT_METHODS.find((method) => method.id === selectedMethod)!;
  const status = subscription ? STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.inactive : null;
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - now) / 86400000))
    : 0;
  const activePlan = subscription && isPlanId(subscription.plan) ? subscription.plan : "basic";
  const isActiveSubscription = subscription?.status === "active" && daysLeft > 0;
  const selectablePlans = isActiveSubscription
    ? purchaseMode === "renew"
      ? PLANS.filter((plan) => plan.id === activePlan)
      : purchaseMode === "upgrade"
        ? PLANS.filter((plan) => PLAN_RANK[plan.id] > PLAN_RANK[activePlan])
        : []
    : PLANS;
  const showPaymentForm = !isActiveSubscription || purchaseMode !== null;

  return (
    <div className="p-4 md:p-8 bg-[#eef7f4]" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="rounded-[30px] bg-gradient-to-br from-[#f9fcf8] via-sky-50 to-emerald-50 p-5 md:p-7 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.09)] ring-1 ring-sky-100">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <p className="text-sm font-bold text-emerald-700">إدارة الاشتراك والدفع</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">باقات تشغيل العيادة</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                اختر الباقة المناسبة وطريقة الدفع، ثم أدخل رقم العملية. بعد التحقق من الدفع يتم تفعيل الحساب أو ترقيته تلقائياً.
              </p>
            </div>

            <div className="rounded-[24px] bg-[#fbfdf9] p-5 shadow-sm ring-1 ring-emerald-100">
              <p className="text-sm font-bold text-slate-500">الاشتراك الحالي</p>
              {subscription && status ? (
                <>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${status.cls}`}>
                      <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <span className="text-sm font-black">
                      {PLAN_LABELS[subscription.plan as keyof typeof PLAN_LABELS] ?? subscription.plan}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-black">{arabicNumber(daysLeft)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    يوم متبقي، ينتهي {formatDate(subscription.expiresAt)}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm font-semibold text-slate-500">لا يوجد اشتراك مسجل لهذه العيادة.</p>
              )}
            </div>
          </div>
        </section>

        {isActiveSubscription && (
          <section className="rounded-[26px] bg-[#fbfdf9] p-5 shadow-[0_14px_38px_rgba(15,23,42,0.06)] ring-1 ring-emerald-100/80">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">اشتراكك نشط</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  كروت الباقات مخفية لأن الاشتراك مفعل. اختر تجديد الباقة الحالية أو ترقية فقط عند الحاجة.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseMode("renew");
                    setSelectedPlan(activePlan);
                    setReference("");
                    setError("");
                  }}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  تجديد الباقة
                </button>
                {activePlan !== "premium" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode("upgrade");
                      setSelectedPlan(activePlan === "basic" ? "standard" : "premium");
                      setReference("");
                      setError("");
                    }}
                    className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                  >
                    ترقية الاشتراك
                  </button>
                )}
                {purchaseMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode(null);
                      setReference("");
                      setError("");
                    }}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {showPaymentForm && !submitted && (
          <form onSubmit={handleSubmit} className="grid gap-7 xl:grid-cols-[1fr_380px]">
            <section className="grid gap-4 md:grid-cols-3">
              {selectablePlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative rounded-[26px] bg-gradient-to-br ${plan.tone} p-5 text-right shadow-[0_14px_38px_rgba(15,23,42,0.07)] ring-1 transition hover:-translate-y-0.5 ${
                      isSelected ? "outline outline-2 outline-offset-2 outline-blue-600" : ""
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute left-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                        {plan.highlight}
                      </span>
                    )}
                    <div className={`h-2 w-14 rounded-full ${plan.dot}`} />
                    <div className="mt-6">
                      <p className="text-xs font-black text-slate-500">{plan.title}</p>
                      <div className="mt-1 flex items-end justify-between gap-3">
                        <h2 className="text-2xl font-black text-slate-950">{plan.name}</h2>
                        <span className="rounded-full bg-[#f7fbf8] px-3 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                          {plan.bestFor}
                        </span>
                      </div>
                    </div>
                    <div className="mt-5">
                      <span className="text-4xl font-black text-slate-950">{formatMoney(plan.price)}</span>
                      <span className="mr-1 text-xs font-bold text-slate-400">د.ع / شهر</span>
                    </div>
                    <p className="mt-3 min-h-12 text-sm font-bold leading-6 text-slate-600">{plan.outcome}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {plan.features.map((feature) => (
                        <span key={feature} className="rounded-full bg-[#fbfdf9] px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200/70">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className={`mt-6 flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ${
                      isSelected ? "bg-blue-600 text-white ring-blue-600" : "bg-[#f7fbf8] text-slate-700 ring-slate-200"
                    }`}>
                      <span className="text-sm font-black">{isSelected ? "الباقة المختارة" : "اختيار الباقة"}</span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-300"}`}>
                        <CheckIcon />
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>

            <section className="rounded-[30px] bg-[#fbfdf9] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] ring-1 ring-emerald-100/80">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">إرسال طلب الدفع</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">بعد التحقق من العملية يتم تفعيل الباقة تلقائياً.</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                  {selectedPaymentMethod.label}
                </span>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-black text-slate-500">الباقة المختارة</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-2xl font-black text-slate-950">{selected.name}</p>
                  <p className="text-lg font-black text-emerald-700">{formatMoney(selected.price)} د.ع</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-black text-slate-500">طريقة الدفع</p>
                <div className="mt-2 grid gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(method.id);
                          setReference("");
                        }}
                        className={`rounded-2xl p-3 text-right ring-1 transition ${
                          isSelected
                            ? "bg-blue-600 text-white ring-blue-600"
                            : "bg-[#f8fbf8] text-slate-700 ring-slate-200 hover:bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black">{method.label}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                            {method.scope}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="text-xs font-black text-emerald-700">{selectedPaymentMethod.destinationLabel}</p>
                <p className="mt-2 break-all text-lg font-black tracking-wide text-emerald-950" dir="ltr">
                  {selectedPaymentMethod.destination}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  `أكمل الدفع عبر ${selectedPaymentMethod.label}.`,
                  selectedMethod === "crypto" ? "انسخ Hash أو TXID من منصة التحويل." : "انسخ رقم العملية من تطبيق الدفع.",
                  "أدخل بيانات العملية هنا ليبدأ التحقق والتفعيل.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl bg-[#f8fbf8] p-3 ring-1 ring-slate-200">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                      {arabicNumber(index + 1)}
                    </span>
                    <p className="pt-1 text-sm font-semibold leading-6 text-slate-600">{step}</p>
                  </div>
                ))}
              </div>

              <a
                href="/dashboard/support"
                className="mt-5 block rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-emerald-700"
              >
                التواصل مع الدعم عند الحاجة
              </a>

              <label className="mt-5 block">
                <span className="text-xs font-black text-slate-500">{selectedPaymentMethod.referenceLabel}</span>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={selectedPaymentMethod.referencePlaceholder}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-[#f8fbf8] px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  dir={selectedMethod === "crypto" ? "ltr" : "rtl"}
                />
              </label>

              {error && (
                <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "جاري إرسال الطلب..." : "إرسال للتحقق والتفعيل"}
              </button>
            </section>
          </form>
        )}

        {submitted && (
          <section className="rounded-[30px] bg-emerald-50 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] ring-1 ring-emerald-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <CheckIcon />
            </div>
            <h2 className="mt-5 text-2xl font-black text-emerald-900">تم إرسال طلب الدفع</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-7 text-emerald-800/75">
              تم حفظ الباقة ورقم العملية. عند وصول تأكيد الدفع من الخلفية سيتم تحديث الاشتراك هنا تلقائياً.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
