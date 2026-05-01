"use client";

import { useEffect, useState } from "react";

const PLANS = [
  {
    id: "basic",
    name: "أساسية",
    price: 35000,
    accent: "#3B82F6",
    accentLight: "#EFF6FF",
    accentBorder: "#BFDBFE",
    features: [
      "إدارة المواعيد",
      "قائمة المرضى",
      "بوت واتساب للحجز",
      "شاشة غرفة الانتظار",
    ],
    missing: ["تذكيرات تلقائية", "تقارير متقدمة", "دعم أولوية"],
  },
  {
    id: "standard",
    name: "متوسطة",
    price: 45000,
    accent: "#7C3AED",
    accentLight: "#F5F3FF",
    accentBorder: "#DDD6FE",
    popular: true,
    features: [
      "إدارة المواعيد",
      "قائمة المرضى",
      "بوت واتساب للحجز",
      "شاشة غرفة الانتظار",
      "تذكيرات تلقائية",
      "السجلات الطبية",
    ],
    missing: ["تقارير متقدمة", "دعم أولوية"],
  },
  {
    id: "premium",
    name: "مميزة",
    price: 55000,
    accent: "#D97706",
    accentLight: "#FFFBEB",
    accentBorder: "#FDE68A",
    features: [
      "إدارة المواعيد",
      "قائمة المرضى",
      "بوت واتساب للحجز",
      "شاشة غرفة الانتظار",
      "تذكيرات تلقائية",
      "السجلات الطبية",
      "تقارير متقدمة",
      "دعم أولوية",
    ],
    missing: [],
  },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; border: string }> = {
  trial:    { label: "تجريبي", dot: "bg-yellow-400", bg: "bg-yellow-50",  border: "border-yellow-200" },
  active:   { label: "نشط",    dot: "bg-green-400",  bg: "bg-green-50",   border: "border-green-200"  },
  inactive: { label: "منتهي",  dot: "bg-red-400",    bg: "bg-red-50",     border: "border-red-200"    },
};

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبي", basic: "أساسية", standard: "متوسطة", premium: "مميزة",
};

interface Subscription {
  plan: string; status: string; startDate: string; expiresAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null | "loading">("loading");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSubscription)
      .catch(() => setSubscription(null));
  }, []);

  const showPaymentForm =
    subscription !== "loading" &&
    (!subscription || subscription.status === "inactive" || subscription.status === "trial");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) { setError("رقم العملية مطلوب"); return; }
    setSubmitting(true);
    setError("");
    const plan = PLANS.find((p) => p.id === selectedPlan)!;
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: plan.price, method: "superkey", reference: reference.trim() }),
    });
    if (res.ok) { setSubmitted(true); }
    else { const d = await res.json(); setError(d.error ?? "حدث خطأ"); }
    setSubmitting(false);
  }

  if (subscription === "loading") {
    return <div className="p-6 text-gray-400 text-sm text-center">جاري التحميل...</div>;
  }

  const sc = subscription ? (STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.inactive) : null;
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  const activePlan = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900">باقات الاشتراك</h1>
        <p className="text-sm text-gray-500 mt-1">اختر الباقة الأنسب لعيادتك — ادفع شهرياً بدون التزام</p>
      </div>

      {/* Current subscription bar */}
      {subscription && sc && (
        <div className={`rounded-2xl border ${sc.border} ${sc.bg} px-5 py-4 mb-8 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${sc.dot} inline-block`} />
            <span className="text-sm font-semibold text-gray-800">
              {sc.label} — باقة {PLAN_LABELS[subscription.plan] ?? subscription.plan}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline">
              ينتهي {formatDate(subscription.expiresAt)}
            </span>
          </div>
          <span className={`text-sm font-extrabold ${daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-green-600"}`}>
            {daysLeft} يوم متبقي
          </span>
        </div>
      )}

      {/* Active — no payment needed */}
      {subscription?.status === "active" && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm mb-8">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-gray-700 font-medium text-sm">اشتراكك نشط حتى {formatDate(subscription.expiresAt)}</p>
          <p className="text-xs text-gray-400 mt-1">للتجديد أو الترقية تواصل مع الدعم</p>
        </div>
      )}

      {/* Plan cards — horizontal grid */}
      {showPaymentForm && !submitted && (
        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className="relative text-right rounded-2xl border-2 p-5 transition-all cursor-pointer focus:outline-none"
                  style={{
                    borderColor: isSelected ? plan.accent : "#E5E7EB",
                    backgroundColor: isSelected ? plan.accentLight : "#FFFFFF",
                    boxShadow: isSelected ? `0 0 0 3px ${plan.accent}22` : "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <span
                      className="absolute -top-3 right-1/2 translate-x-1/2 text-xs font-bold text-white px-3 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: plan.accent }}
                    >
                      الأكثر طلباً
                    </span>
                  )}

                  {/* Plan name + radio */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: isSelected ? plan.accent : "#F3F4F6",
                        color: isSelected ? "#fff" : "#6B7280",
                      }}
                    >
                      {plan.name}
                    </span>
                    <span
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isSelected ? plan.accent : "#D1D5DB",
                        backgroundColor: isSelected ? plan.accent : "transparent",
                      }}
                    >
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {plan.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 mr-1">د.ع / شهر</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 mb-3" />

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-700">
                        <span className="text-green-500 font-bold text-sm">✓</span> {f}
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-300">
                        <span className="text-gray-200 text-sm">✗</span> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Payment box */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-base">إتمام الدفع</h2>
              <span className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-600 font-medium">
                SuperKey
              </span>
            </div>

            {/* Steps */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {[
                { n: "١", text: "افتح تطبيق SuperKey" },
                { n: "٢", text: `أرسل ${activePlan.price.toLocaleString()} د.ع إلى حساب الدعم` },
                { n: "٣", text: "أدخل رقم العملية أدناه" },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {s.n}
                  </span>
                  <span className="text-xs text-gray-600">{s.text}</span>
                </div>
              ))}
            </div>

            {/* Reference input */}
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="أدخل رقم العملية من تطبيق SuperKey"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent mb-3 bg-white"
            />

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full text-white font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50"
              style={{ backgroundColor: activePlan.accent }}
            >
              {submitting ? "جاري الإرسال..." : `إرسال طلب اشتراك ${activePlan.name} — ${activePlan.price.toLocaleString()} د.ع`}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              سيتم تفعيل الاشتراك خلال دقائق بعد مراجعة الإدارة
            </p>
          </div>
        </form>
      )}

      {/* Success */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-extrabold text-green-800 text-xl mb-2">تم إرسال طلب الدفع</h2>
          <p className="text-green-700 text-sm max-w-sm mx-auto">
            تم استلام طلبك بنجاح، سيتم مراجعته وتفعيل اشتراكك خلال وقت قصير
          </p>
        </div>
      )}

    </div>
  );
}
