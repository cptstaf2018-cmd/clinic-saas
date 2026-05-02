"use client";

import { useState } from "react";
import Link from "next/link";

function MedicalCross() {
  return (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="15" y="4" width="10" height="32" rx="3" fill="white" fillOpacity="0.9"/>
      <rect x="4" y="15" width="32" height="10" rx="3" fill="white" fillOpacity="0.9"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [clinicName, setClinicName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  async function sendOtp() {
    if (!clinicName.trim()) { setError("أدخل اسم العيادة"); return; }
    if (!phone.trim())      { setError("أدخل رقم الواتساب"); return; }
    if (!password.trim() || password.length < 6) { setError("كلمة المرور 6 أحرف على الأقل"); return; }

    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setSending(false); return; }

      setStep(2);
      // Countdown 60s for resend
      setCountdown(60);
      const t = setInterval(() => {
        setCountdown((c) => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; });
      }, 1000);
    } catch {
      setError("حدث خطأ في الاتصال، حاول مجدداً");
    }
    setSending(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) { setError("أدخل الكود المكون من 6 أرقام"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicName, phone: phone.trim(), password, otp: otp.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setLoading(false); return; }

      // Redirect to login — avoids session conflicts with existing sessions
      window.location.href = "/login?registered=1";
    } catch {
      setError("حدث خطأ في الاتصال، حاول مجدداً");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" dir="rtl">

      {/* Decorative panel */}
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
              ابدأ تجربتك<br/>
              <span className="text-blue-300">المجانية الآن</span>
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
              3 أيام مجانية — سجّل برقم واتساب العيادة فقط.
            </p>
            <div className="mt-10 space-y-4">
              {[
                "بوت واتساب يحجز المواعيد تلقائياً",
                "شاشة غرفة الانتظار الذكية",
                "تذكيرات تلقائية للمرضى",
                "إدارة كاملة من موبايلك",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">✓</span>
                  <span className="text-blue-100/80 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-blue-300/60 text-sm">© 2026 كلينيك — تكريت، العراق</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 bg-[#EEF2F9]">
        <div className="w-full max-w-sm fade-in">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <MedicalCross />
            </div>
            <span className="text-[#0C1F3F] text-xl font-bold">كلينيك</span>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(37,99,235,0.08)] p-8">

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${step === 1 ? "bg-[#2563EB] text-white" : "bg-green-500 text-white"}`}>
                {step === 1 ? "1" : "✓"}
              </div>
              <div className={`flex-1 h-0.5 transition-all ${step === 2 ? "bg-[#2563EB]" : "bg-gray-200"}`} />
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${step === 2 ? "bg-[#2563EB] text-white" : "bg-gray-200 text-gray-400"}`}>
                2
              </div>
            </div>

            {/* ── Step 1 ── */}
            {step === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-[#0C1F3F]">تسجيل عيادة جديدة</h2>
                  <p className="text-[#64748B] text-sm mt-1">3 أيام تجريبية مجانية</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">اسم العيادة</label>
                    <input
                      value={clinicName} onChange={(e) => setClinicName(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      placeholder="عيادة د. أحمد محمد"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">رقم واتساب العيادة</label>
                    <input
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      placeholder="07701234567" dir="ltr"
                    />
                    <p className="text-xs text-[#94A3B8] mt-1">سيُرسل كود التحقق على هذا الرقم</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">كلمة المرور</label>
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                      placeholder="6 أحرف على الأقل"
                    />
                  </div>

                  {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

                  <button
                    onClick={sendOtp} disabled={sending}
                    className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:-translate-y-0.5"
                  >
                    {sending ? "جاري الإرسال..." : "📱 أرسل كود التحقق"}
                  </button>
                </div>
              </>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-[#0C1F3F]">أدخل كود التحقق</h2>
                  <p className="text-[#64748B] text-sm mt-1">
                    أُرسل كود إلى <span className="font-bold text-[#0C1F3F]" dir="ltr">{phone}</span>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 text-center">
                  <p className="text-xs text-blue-600 font-medium">تحقق من واتساب الرقم المدخل</p>
                  <p className="text-xs text-blue-400 mt-0.5">الكود صالح 5 دقائق</p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">كود التحقق (6 أرقام)</label>
                  <input
                    value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full border-2 border-[#E2E8F0] focus:border-[#2563EB] rounded-xl px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] bg-[#F8FAFD] focus:outline-none transition-all"
                    placeholder="• • • • • •" dir="ltr" maxLength={6}
                  />
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

                <button
                  type="submit" disabled={loading || otp.length !== 6}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 mb-3"
                >
                  {loading ? "جاري التسجيل..." : "✓ تأكيد وإنشاء الحساب"}
                </button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); }} className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors">
                    ← تعديل البيانات
                  </button>
                  <button
                    type="button" onClick={sendOtp}
                    disabled={countdown > 0 || sending}
                    className="text-sm text-[#2563EB] disabled:text-[#94A3B8] hover:underline transition-colors"
                  >
                    {countdown > 0 ? `إعادة الإرسال (${countdown}s)` : "إعادة إرسال الكود"}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-[#64748B] mt-5">
            لديك حساب؟{" "}
            <Link href="/login" className="text-[#2563EB] font-semibold hover:underline">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
