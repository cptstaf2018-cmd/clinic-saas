"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/login/actions";

function MedicalCross() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="15" y="4" width="10" height="32" rx="3" fill="white" fillOpacity="0.9"/>
      <rect x="4" y="15" width="32" height="10" rx="3" fill="white" fillOpacity="0.9"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email    = form.get("email") as string;
    const password = form.get("password") as string;

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicName: form.get("clinicName"),
        whatsappNumber: form.get("whatsappNumber"),
        email, password,
      }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error); setLoading(false); return; }

    const loginData = new FormData();
    loginData.append("email", email);
    loginData.append("password", password);
    const loginErr = await loginAction(loginData);
    if (loginErr) { window.location.href = "/login?registered=1"; return; }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">

      {/* ── Decorative panel ── */}
      <div className="hidden lg:flex lg:w-[58%] pattern-medical relative overflow-hidden flex-col">
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-blue-500/10" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-blue-400/8" />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <MedicalCross />
            </div>
            <span className="text-white text-2xl font-bold tracking-wide">كلينيك</span>
          </div>

          <div>
            <h1 className="text-white text-4xl font-extrabold leading-tight mb-4">
              ابدأ تجربتك<br />
              <span className="text-blue-300">المجانية الآن</span>
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
              3 أيام مجانية بدون بطاقة ائتمان. جرّب كل الميزات قبل الاشتراك.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: "✓", text: "بوت واتساب يحجز المواعيد تلقائياً" },
                { icon: "✓", text: "شاشة غرفة الانتظار الذكية" },
                { icon: "✓", text: "تذكيرات تلقائية للمرضى" },
                { icon: "✓", text: "إدارة كاملة من موبايلك" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-blue-100/80 text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-300/60 text-sm">© 2026 كلينيك — تكريت، العراق</p>
        </div>
      </div>

      {/* ── Form panel ── */}
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
              <h2 className="text-2xl font-extrabold text-[#0C1F3F]">تسجيل عيادة جديدة</h2>
              <p className="text-[#64748B] text-sm mt-1">3 أيام تجريبية مجانية</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { name: "clinicName",      label: "اسم العيادة",         type: "text",  placeholder: "عيادة د. أحمد محمد" },
                { name: "whatsappNumber",  label: "رقم واتساب العيادة",  type: "text",  placeholder: "07701234567" },
                { name: "email",           label: "الإيميل",              type: "email", placeholder: "doctor@clinic.com" },
                { name: "password",        label: "كلمة المرور",          type: "password", placeholder: "6 أحرف على الأقل" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 tracking-wide uppercase">
                    {f.label}
                  </label>
                  <input
                    name={f.name} type={f.type} required
                    minLength={f.name === "password" ? 6 : undefined}
                    placeholder={f.placeholder}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                  />
                </div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? "جاري التسجيل..." : "إنشاء الحساب مجاناً"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-[#64748B] mt-5">
            لديك حساب؟{" "}
            <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
