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
    try {
      const result = await loginAction(new FormData(e.currentTarget));
      if (result) { setError(result); setLoading(false); }
    } catch (err: any) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) return;
      setError("حدث خطأ في الاتصال، حاول مجدداً");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">

      {/* ── Hero Panel ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col"
        style={{ background: "linear-gradient(135deg, #060f24 0%, #0c1f3f 45%, #0f2a54 100%)" }}>

        {/* Animated background blobs */}
        <div className="absolute top-[-120px] right-[-120px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", animation: "pulse 8s ease-in-out infinite" }} />
        <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", animation: "pulse 10s ease-in-out infinite reverse" }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)", animation: "pulse 12s ease-in-out infinite 2s" }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 flex flex-col h-full p-12">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
              <MedicalCross />
            </div>
            <span className="text-white text-2xl font-extrabold tracking-wide">كلينيك</span>
            <span className="text-[10px] text-blue-300/70 border border-blue-400/30 rounded-full px-2 py-0.5 font-semibold mr-1">PRO</span>
          </div>

          {/* Main headline */}
          <div className="mt-12 mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/25 rounded-full px-3 py-1.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-blue-200 text-xs font-semibold">نظام إدارة العيادات #1 في العراق</span>
            </div>
            <h1 className="text-white text-5xl font-black leading-tight mb-4">
              إدارة عيادتك<br/>
              <span style={{ background: "linear-gradient(90deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                بذكاء وسهولة
              </span>
            </h1>
            <p className="text-blue-200/70 text-base leading-relaxed max-w-md">
              كل ما تحتاجه لإدارة عيادتك في نظام واحد — من حجز المريض عبر واتساب حتى استدعائه بالصوت في غرفة الانتظار.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-2 gap-3 flex-1">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                ),
                color: "#3b82f6",
                title: "سجلات طبية كاملة",
                desc: "تشخيص، وصفة، ومتابعة لكل مريض",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                ),
                color: "#22c55e",
                title: "بوت واتساب ذكي",
                desc: "يستقبل الحجوزات تلقائياً 24/7",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/>
                  </svg>
                ),
                color: "#a78bfa",
                title: "إدارة المواعيد",
                desc: "جدولة وتأكيد وإلغاء بضغطة واحدة",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                  </svg>
                ),
                color: "#f59e0b",
                title: "شاشة انتظار بالصوت",
                desc: "ينادي المريض باسمه على التلفزيون",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                ),
                color: "#ec4899",
                title: "تذكيرات تلقائية",
                desc: "رسائل واتساب قبل الموعد بـ 24 ساعة",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                ),
                color: "#06b6d4",
                title: "ملفات المرضى",
                desc: "تاريخ كامل ومواعيد مراجعة للمتابعة",
              },
            ].map((f) => (
              <div key={f.title}
                className="rounded-2xl p-4 flex gap-3 items-start transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}22`, color: f.color, border: `1px solid ${f.color}33` }}>
                  {f.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-bold leading-tight">{f.title}</p>
                  <p className="text-blue-200/55 text-xs mt-0.5 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-8 flex items-center gap-6 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { num: "13+", label: "عيادة تثق بنا" },
              { num: "24/7", label: "بوت واتساب" },
              { num: "100%", label: "آمان البيانات" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white text-xl font-black">{s.num}</p>
                <p className="text-blue-300/60 text-xs">{s.label}</p>
              </div>
            ))}
            <div className="mr-auto text-blue-300/40 text-xs">© 2026 كلينيك</div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 bg-[#EEF2F9]">
        <div className="w-full max-w-sm fade-in">

          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <MedicalCross />
            </div>
            <span className="text-[#0C1F3F] text-xl font-bold">كلينيك</span>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(37,99,235,0.08)] p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-[#0C1F3F]">أهلاً بك</h2>
              <p className="text-[#64748B] text-sm mt-1">ادخل برقم واتساب العيادة</p>
            </div>

            {params.get("registered") && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm mb-5 flex items-center gap-2">
                <span>✓</span> تم تسجيل العيادة بنجاح! سجّل دخولك الآن.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">
                  رقم الواتساب
                </label>
                <input
                  name="identifier" type="text" required
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                  placeholder="07701234567" dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">
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
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5"
              >
                {loading ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            {/* Hint for superadmin */}
            <p className="text-center text-xs text-[#94A3B8] mt-4">
              للإدارة: استخدم الإيميل بدلاً من الرقم
            </p>
          </div>

          <p className="text-center text-sm text-[#64748B] mt-5">
            عيادة جديدة؟{" "}
            <Link href="/register" className="text-[#2563EB] font-semibold hover:underline">سجّل مجاناً</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
