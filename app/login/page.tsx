"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";

function MedicalCross() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="15" y="4" width="10" height="32" rx="3" fill="white" fillOpacity="0.9"/>
      <rect x="4" y="15" width="32" height="10" rx="3" fill="white" fillOpacity="0.9"/>
    </svg>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginAction(new FormData(e.currentTarget));
    if (result) { setError(result); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">

      {/* ── Decorative panel (right / RTL start) ── */}
      <div className="hidden lg:flex lg:w-[58%] pattern-medical relative overflow-hidden flex-col">

        {/* Floating circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-blue-500/10" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-blue-400/8" />
        <div className="absolute top-1/2 left-[10%] w-[180px] h-[180px] rounded-full bg-white/3" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <MedicalCross />
            </div>
            <span className="text-white text-2xl font-bold tracking-wide">كلينيك</span>
          </div>

          {/* Center content */}
          <div>
            <h1 className="text-white text-4xl font-extrabold leading-tight mb-4">
              إدارة عيادتك<br />
              <span className="text-blue-300">بكل سهولة</span>
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
              نظام متكامل للمواعيد والمرضى وبوت واتساب ذكي يعمل على مدار الساعة.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {["بوت واتساب تلقائي", "إدارة المواعيد", "شاشة غرفة الانتظار", "تذكيرات ذكية"].map((f) => (
                <span key={f} className="text-xs text-blue-200 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-blue-300/60 text-sm">
            © 2026 كلينيك — تكريت، العراق
          </p>
        </div>
      </div>

      {/* ── Form panel (left / RTL end) ── */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 bg-[#EEF2F9]">
        <div className="w-full max-w-sm fade-in">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <MedicalCross />
            </div>
            <span className="text-[#0C1F3F] text-xl font-bold">كلينيك</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(37,99,235,0.08)] p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-[#0C1F3F]">أهلاً بك</h2>
              <p className="text-[#64748B] text-sm mt-1">سجّل دخولك للمتابعة</p>
            </div>

            {params.get("registered") && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2">
                <span>✓</span> تم تسجيل العيادة بنجاح!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 tracking-wide uppercase">
                  الإيميل
                </label>
                <input
                  name="email" type="email" required
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                  placeholder="doctor@clinic.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 tracking-wide uppercase">
                  كلمة المرور
                </label>
                <input
                  name="password" type="password" required
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#64748B] mt-5">
            عيادة جديدة؟{" "}
            <Link href="/register" className="text-[#2563EB] font-semibold hover:underline">
              سجّل مجاناً
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
