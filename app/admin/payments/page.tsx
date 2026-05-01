"use client";

import { useEffect, useState } from "react";

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  reference: string | null;
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
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    const res = await fetch("/api/admin/payments");
    if (res.ok) setPayments(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchPayments();
  };

  if (loading) {
    return <p className="text-gray-500">جاري التحميل...</p>;
  }

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
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">التاريخ</th>
              <th className="px-4 py-3 text-right">المرجع</th>
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
                  {payment.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(payment.id, "approve")}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                      >
                        موافقة
                      </button>
                      <button
                        onClick={() => handleAction(payment.id, "reject")}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                      >
                        رفض
                      </button>
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
