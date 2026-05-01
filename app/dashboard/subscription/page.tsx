"use client";

import { useEffect, useState } from "react";

const PLANS = [
  {
    id: "basic",
    name: "أساسية",
    price: 35000,
    color: "border-blue-200 bg-blue-50",
    selectedColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-400",
    badge: "bg-blue-100 text-blue-700",
    features: [
      "إدارة المواعيد",
      "قائمة المرضى",
      "بوت واتساب للحجز",
      "شاشة غرفة الانتظار",
    ],
    notIncluded: ["تذكيرات تلقائية", "تقارير متقدمة", "دعم أولوية"],
  },
  {
    id: "standard",
    name: "متوسطة",
    price: 45000,
    color: "border-purple-200 bg-purple-50",
    selectedColor: "border-purple-500 bg-purple-50 ring-2 ring-purple-400",
    badge: "bg-purple-100 text-purple-700",
    popular: true,
    features: [
      "إدارة المواعيد",
      "قائمة المرضى",
      "بوت واتساب للحجز",
      "شاشة غرفة الانتظار",
      "تذكيرات تلقائية (24h + 1h)",
      "السجلات الطبية",
    ],
    notIncluded: ["تقارير متقدمة", "دعم أولوية"],
  },
  {
    id: "premium",
    name: "مميزة",
    price: 55000,
    color: "border-yellow-200 bg-yellow-50",
    selectedColor: "border-yellow-500 bg-yellow-50 ring-2 ring-yellow-400",
    badge: "bg-yellow-100 text-yellow-700",
    features: [
      "إدارة المواعيد",
      "قائمة المرضى",
      "بوت واتساب للحجز",
      "شاشة غرفة الانتظار",
      "تذكيرات تلقائية (24h + 1h)",
      "السجلات الطبية",
      "تقارير متقدمة",
      "دعم أولوية",
    ],
    notIncluded: [],
  },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; bg: string }> = {
  trial:    { label: "تجريبي", cls: "text-yellow-700", bg: "bg-yellow-50 border-yellow-300" },
  active:   { label: "نشط",    cls: "text-green-700",  bg: "bg-green-50 border-green-300"  },
  inactive: { label: "منتهي",  cls: "text-red-700",    bg: "bg-red-50 border-red-300"      },
};

const PLAN_LABELS: Record<string, string> = {
  trial: "تجريبي", basic: "أساسية", standard: "متوسطة", premium: "مميزة",
};

interface Subscription {
  plan: string;
  status: string;
  startDate: string;
  expiresAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });
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
    !subscription ||
    subscription === null ||
    (subscription !== "loading" &&
      (subscription.status === "inactive" || subscription.status === "trial"));

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

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ، حاول مرة أخرى");
    }
    setSubmitting(false);
  }

  if (subscription === "loading") {
    return <div className="p-6 text-gray-400 text-sm text-center">جاري التحميل...</div>;
  }

  const sc = subscription ? (STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG.inactive) : null;
  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الاشتراك</h1>
        <p className="text-sm text-gray-500 mt-1">اختر الباقة المناسبة لعيادتك</p>
      </div>

      {/* Current subscription status */}
      {subscription && sc && (
        <div className={`rounded-xl border p-4 mb-6 ${sc.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${sc.cls}`}>{sc.label}</span>
              <span className="text-gray-500 text-sm">—</span>
              <span className="text-sm text-gray-700 font-medium">
                باقة {PLAN_LABELS[subscription.plan] ?? subscription.plan}
              </span>
            </div>
            <div className="text-left">
              <span
                className={`text-sm font-bold ${
                  daysLeft <= 3 ? "text-red-600" : daysLeft <= 7 ? "text-yellow-600" : "text-green-600"
                }`}
              >
                {daysLeft} يوم متبقي
              </span>
            </div>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-500">
            <span>البدء: {formatDate(subscription.startDate)}</span>
            <span>الانتهاء: {formatDate(subscription.expiresAt)}</span>
          </div>
        </div>
      )}

      {/* Payment flow */}
      {showPaymentForm && (
        submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="font-bold text-green-800 text-lg mb-1">تم إرسال طلب الدفع</h2>
            <p className="text-green-700 text-sm">
              سيتم مراجعة طلبك من قبل الإدارة وتفعيل الاشتراك خلال وقت قصير
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Plan cards */}
            <p className="text-sm font-semibold text-gray-700 mb-3">اختر الباقة</p>
            <div className="space-y-3 mb-6">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-right rounded-xl border-2 p-4 transition-all cursor-pointer ${
                      isSelected ? plan.selectedColor : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? plan.badge : "bg-gray-100 text-gray-600"
                          }`}>
                            {plan.name}
                          </span>
                          {plan.popular && (
                            <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                              الأكثر طلباً
                            </span>
                          )}
                        </div>
                        <ul className="space-y-1">
                          {plan.features.map((f) => (
                            <li key={f} className="text-xs text-gray-700 flex items-center gap-1.5">
                              <span className="text-green-500 font-bold">✓</span> {f}
                            </li>
                          ))}
                          {plan.notIncluded.map((f) => (
                            <li key={f} className="text-xs text-gray-400 flex items-center gap-1.5">
                              <span className="text-gray-300">✗</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-extrabold text-gray-900 text-lg leading-tight">
                          {plan.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">د.ع / شهر</p>
                        <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        }`}>
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Payment instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">خطوات الدفع</p>
              <ol className="space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
                <li>افتح تطبيق SuperKey على هاتفك</li>
                <li>
                  أرسل مبلغ{" "}
                  <span className="font-bold text-gray-900">
                    {PLANS.find((p) => p.id === selectedPlan)?.price.toLocaleString()} د.ع
                  </span>{" "}
                  إلى حساب الدعم
                </li>
                <li>انسخ رقم العملية من التطبيق وأدخله أدناه</li>
              </ol>
            </div>

            {/* Reference input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                رقم العملية من SuperKey
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: TXN-2026-XXXXXXXX"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {submitting
                ? "جاري الإرسال..."
                : `إرسال طلب الدفع — ${PLANS.find((p) => p.id === selectedPlan)?.price.toLocaleString()} د.ع`}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              سيتم تفعيل الاشتراك بعد مراجعة الإدارة
            </p>
          </form>
        )
      )}

      {/* Active subscription — no payment form needed */}
      {subscription && subscription.status === "active" && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
          <p className="text-sm text-gray-500">
            اشتراكك نشط حتى{" "}
            <span className="font-semibold text-gray-800">
              {formatDate(subscription.expiresAt)}
            </span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            للتجديد أو الترقية، تواصل مع الدعم
          </p>
        </div>
      )}
    </div>
  );
}
