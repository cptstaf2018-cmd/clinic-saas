"use client";

import { useEffect, useState } from "react";

interface Subscription {
  plan: string;
  status: string;
  expiresAt: string;
}

interface Clinic {
  id: string;
  name: string;
  whatsappNumber: string;
  subscription: Subscription | null;
}

const STATUS_LABELS: Record<string, string> = {
  active: "فعّال",
  inactive: "متوقف",
  trial: "تجريبي",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
  trial: "bg-yellow-100 text-yellow-800",
};

export default function AdminClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClinics = async () => {
    const res = await fetch("/api/admin/clinics");
    if (res.ok) setClinics(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const toggleStatus = async (
    clinic: Clinic,
    action: "activate" | "deactivate"
  ) => {
    await fetch(`/api/admin/clinics/${clinic.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchClinics();
  };

  if (loading) {
    return <p className="text-gray-500">جاري التحميل...</p>;
  }

  return (
    <div dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">العيادات</h1>
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-right">اسم العيادة</th>
              <th className="px-4 py-3 text-right">رقم الواتساب</th>
              <th className="px-4 py-3 text-right">الباقة</th>
              <th className="px-4 py-3 text-right">الحالة</th>
              <th className="px-4 py-3 text-right">تاريخ الانتهاء</th>
              <th className="px-4 py-3 text-right">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((clinic) => {
              const status = clinic.subscription?.status ?? "inactive";
              const plan = clinic.subscription?.plan ?? "—";
              const expiresAt = clinic.subscription?.expiresAt
                ? new Date(clinic.subscription.expiresAt).toLocaleDateString(
                    "ar-IQ"
                  )
                : "—";

              return (
                <tr key={clinic.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium">{clinic.name}</td>
                  <td className="px-4 py-3 text-gray-500 dir-ltr text-left">
                    {clinic.whatsappNumber}
                  </td>
                  <td className="px-4 py-3">{plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[status] ?? status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{expiresAt}</td>
                  <td className="px-4 py-3 flex gap-2">
                    {status !== "active" ? (
                      <button
                        onClick={() => toggleStatus(clinic, "activate")}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                      >
                        تفعيل
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus(clinic, "deactivate")}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                      >
                        إيقاف
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {clinics.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  لا توجد عيادات مسجلة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
