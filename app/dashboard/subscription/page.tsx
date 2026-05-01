"use client";

import { useEffect, useState } from "react";

const planLabels: Record<string, string> = {
  trial: "تجريبي",
  basic: "أساسي — 35,000 د.ع / شهر",
  standard: "قياسي — 45,000 د.ع / شهر",
  premium: "مميز — 55,000 د.ع / شهر",
};

const statusConfig: Record<string, { label: string; cls: string; bg: string }> = {
  trial: { label: "تجريبي", cls: "text-yellow-800", bg: "bg-yellow-50 border-yellow-200" },
  active: { label: "نشط", cls: "text-green-800", bg: "bg-green-50 border-green-200" },
  inactive: { label: "منتهي", cls: "text-red-800", bg: "bg-red-50 border-red-200" },
};

const PLAN_PRICES: Record<string, number> = {
  basic: 35000,
  standard: 45000,
  premium: 55000,
};

interface Subscription {
  plan: string;
  status: string;
  startDate: string;
  expiresAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null | "loading">("loading");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [method, setMethod] = useState<"manual" | "superkey">("manual");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSubscription(data))
      .catch(() => setSubscription(null));
  }, []);

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: PLAN_PRICES[selectedPlan],
        method,
        reference: reference.trim() || undefined,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "حدث خطأ");
    }
    setSubmitting(false);
  }

  if (subscription === "loading") {
    return <div className="p-6 text-gray-400 text-sm">جاري التحميل...</div>;
  }

  const sc = subscription
    ? (statusConfig[subscription.status] ?? statusConfig.inactive)
    : null;

  const daysLeft = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const showPaymentForm =
    !subscription ||
    subscription.status === "inactive" ||
    subscription.status === "trial";

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الاشتراك</h1>
        <p className="text-sm text-gray-500 mt-1">تفاصيل اشتراك العيادة</p>
      </div>

      {subscription && sc ? (
        <div className={`rounded-xl border p-5 shadow-sm mb-4 ${sc.bg}`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`font-bold text-base ${sc.cls}`}>{sc.label}</span>
            <span className="text-sm text-gray-600 font-medium">
              {planLabels[subscription.plan] ?? subscription.plan}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">تاريخ البدء</span>
              <span className="text-gray-800 font-medium">
                {formatDate(subscription.startDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">تاريخ الانتهاء</span>
              <span className="text-gray-800 font-medium">
                {formatDate(subscription.expiresAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الأيام المتبقية</span>
              <span
                className={`font-bold ${
                  daysLeft <= 7
                    ? "text-red-600"
                    : daysLeft <= 30
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {daysLeft} يوم
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-4 text-center">
          <p className="text-gray-500 text-sm">لا يوجد اشتراك مسجل</p>
        </div>
      )}

      {showPaymentForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4 text-base">
            {subscription?.status === "trial" ? "ترقية الاشتراك" : "تجديد الاشتراك"}
          </h2>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium text-sm">
                تم إرسال طلب الدفع بنجاح ✓
              </p>
              <p className="text-green-700 text-xs mt-1">
                سيتم تفعيل الاشتراك بعد مراجعة الإدارة
              </p>
            </div>
          ) : (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الباقة
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="basic">أساسية — 35,000 د.ع / شهر</option>
                  <option value="standard">متوسطة — 45,000 د.ع / شهر</option>
                  <option value="premium">مميزة — 55,000 د.ع / شهر</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  طريقة الدفع
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="manual"
                      checked={method === "manual"}
                      onChange={() => setMethod("manual")}
                    />
                    <span className="text-sm">يدوي (كاش / حوالة)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="superkey"
                      checked={method === "superkey"}
                      onChange={() => setMethod("superkey")}
                    />
                    <span className="text-sm">SuperKey</span>
                  </label>
                </div>
              </div>

              {method === "superkey" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  رقم SuperKey: <span className="font-bold">07706688044</span>
                  <br />
                  أرسل المبلغ ثم أدخل رقم العملية أدناه
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {method === "superkey" ? "رقم العملية" : "ملاحظة (اختياري)"}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={
                    method === "superkey"
                      ? "أدخل رقم العملية من SuperKey"
                      : "مثال: تم الدفع نقداً"
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting
                  ? "جاري الإرسال..."
                  : `إرسال طلب الدفع — ${PLAN_PRICES[selectedPlan].toLocaleString()} د.ع`}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
