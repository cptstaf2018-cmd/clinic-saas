"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
  activationCode: string | null;
  requestedPlan: string | null;
  createdAt: string;
  clinic: { name: string };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الموافقة",
  approved: "مقبول",
  rejected: "مرفوض",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const METHOD_LABELS: Record<string, string> = {
  manual: "يدوي",
  superkey: "SuperKey",
  zaincash: "Zain Cash",
  crypto: "Binance / Crypto",
};

const PLAN_OPTIONS = [
  { value: "basic", label: "أساسية — 35,000 د.ع" },
  { value: "standard", label: "متوسطة — 45,000 د.ع" },
  { value: "premium", label: "مميزة — 55,000 د.ع" },
];

const PLAN_NAMES: Record<string, string> = {
  basic: "أساسية",
  standard: "متوسطة",
  premium: "مميزة",
};

export default function PaymentsClient({
  initialPayments,
}: {
  initialPayments: Payment[];
}) {
  const router = useRouter();
  const [payments] = useState<Payment[]>(initialPayments);
  const [approving, setApproving] = useState<string | null>(null);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [duration, setDuration] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    setApproving(id);
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        plan: plan[id] ?? payments.find((p) => p.id === id)?.requestedPlan ?? "basic",
        durationDays: parseInt(duration[id] ?? "30", 10),
      }),
    });
    setApproving(null);
    router.refresh();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    router.refresh();
  };

  return (
    <div dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">المدفوعات</h1>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-right">العيادة</th>
              <th className="px-4 py-3 text-right">المبلغ</th>
              <th className="px-4 py-3 text-right">الطريقة</th>
              <th className="px-4 py-3 text-right">الباقة</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المرجع</th>
              <th className="px-4 py-3 text-right">كود التفعيل</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{payment.clinic.name}</td>
                <td className="px-4 py-3">{payment.amount.toLocaleString()} د.ع</td>
                <td className="px-4 py-3">
                  {METHOD_LABELS[payment.method] ?? payment.method}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-700">
                  {payment.requestedPlan ? PLAN_NAMES[payment.requestedPlan] : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[payment.status] ?? payment.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(payment.createdAt).toLocaleDateString("ar-IQ")}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {payment.reference ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {payment.activationCode ? (
                    <span className="font-mono text-xs font-extrabold tracking-widest text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
                      {payment.activationCode}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {payment.status === "pending" && (
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <select
                        value={plan[payment.id] ?? payment.requestedPlan ?? "basic"}
                        onChange={(e) =>
                          setPlan((p) => ({ ...p, [payment.id]: e.target.value }))
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        {PLAN_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={duration[payment.id] ?? "30"}
                          onChange={(e) =>
                            setDuration((d) => ({ ...d, [payment.id]: e.target.value }))
                          }
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                        <span className="text-xs text-gray-500">يوم</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(payment.id)}
                          disabled={approving === payment.id}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {approving === payment.id ? "..." : "موافقة"}
                        </button>
                        <button
                          onClick={() => handleReject(payment.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  لا توجد مدفوعات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
