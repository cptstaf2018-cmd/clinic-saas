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
      if (result) { setError(result); setLoading(false); }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) return;
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0C1F3F] flex items-center justify-center p-4 pattern-medical" dir="rtl">

      {/* Floating circles */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-blue-500/8 pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-blue-400/6 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-2xl shadow-2xl shadow-amber-500/40 mb-4">
            <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
              <path d="M20 34s-14-9-14-19a8 8 0 0 1 14-5.3A8 8 0 0 1 34 15c0 10-14 19-14 19z"
                fill="white" fillOpacity="0.9"/>
              <path d="M8 20h4l2-5 3 10 3-8 2 3h10"
                stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="text-white text-2xl font-extrabold">لوحة الإدارة</h1>
          <p className="text-blue-300/60 text-sm mt-1">Super Admin</p>
        </div>

        {/* Card */}
        <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 uppercase tracking-widest">
                الإيميل
              </label>
              <input
                name="identifier" type="email" required
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all placeholder:text-blue-300/40"
                placeholder="admin@clinic.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 uppercase tracking-widest">
                كلمة المرور
              </label>
              <input
                name="password" type="password" required
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-400/40 text-xs mt-6">
          عيادتي — نظام إدارة العيادات
        </p>
      </div>
    </div>
  );
}
