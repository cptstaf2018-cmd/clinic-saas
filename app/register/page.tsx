"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      clinicName: form.get("clinicName"),
      whatsappNumber: form.get("whatsappNumber"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل عيادة جديدة</h1>
        <p className="text-gray-500 text-sm mb-6">تجربة مجانية 3 أيام — لا حاجة لبطاقة ائتمان</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العيادة</label>
            <input name="clinicName" type="text" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="عيادة د. أحمد محمد" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم واتساب العيادة</label>
            <input name="whatsappNumber" type="text" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="07701234567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الإيميل</label>
            <input name="email" type="email" required className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="doctor@clinic.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input name="password" type="password" required minLength={6} className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          لديك حساب؟{" "}
          <Link href="/login" className="text-blue-600 hover:underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
