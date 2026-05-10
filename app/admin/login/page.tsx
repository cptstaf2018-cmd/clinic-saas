"use client";

import { useState } from "react";
import { loginAction } from "@/app/login/actions";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const result = await loginAction(form);
      if (result) {
        setError(result);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT")
      ) {
        return;
      }
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#F5F8FB] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.10)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="order-2 border-t border-slate-200 bg-slate-50 p-5 sm:p-8 lg:order-1 lg:border-r lg:border-t-0">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-5 w-5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black">عيادتي</p>
                    <p className="text-[11px] font-bold text-slate-400">منصة إدارة العيادات</p>
                  </div>
                </div>

                <p className="text-xs font-black text-blue-600">نظام متكامل للعيادات الحديثة</p>
                <h1 className="mt-3 max-w-sm text-4xl font-black leading-tight tracking-tight text-slate-950">
                  إدارة عيادتك تصبح أسهل وأسرع
                </h1>
                <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-slate-500">
                  عيادتي يساعدك على تنظيم الحجوزات، ملفات المرضى، المدفوعات، والتذكيرات التلقائية من شاشة واحدة واضحة.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  ["حجوزات", "تنظيم المواعيد"],
                  ["مرضى", "ملفات وسجل كامل"],
                  ["تذكير", "رسائل تلقائية"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xl font-black text-slate-950">{value}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 flex items-center justify-center p-5 sm:p-8 lg:order-2 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-7">
                <span className="inline-flex rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                  دخول إدارة المنصة
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950">مرحباً بك</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">أدخل بياناتك للوصول إلى لوحة التحكم.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black text-slate-500">الإيميل أو المعرّف</span>
                  <input
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
                    placeholder="admin@clinic.com"
                    dir="ltr"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-black text-slate-500">كلمة المرور</span>
                  <input
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "جاري الدخول..." : "دخول إلى اللوحة"}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>اتصال آمن ومشفّر</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
