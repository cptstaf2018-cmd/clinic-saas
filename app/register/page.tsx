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
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [sendingCode, setSendingCode] = useState(false);
  const [codeMsg, setCodeMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const [phone, setPhone]             = useState("");

  async function handleRequestCode() {
    if (!/^07\d{8,9}$/.test(phone.trim())) {
      setCodeMsg({ ok: false, text: "أدخل رقم الواتساب أولاً بشكل صحيح" });
      return;
    }
    setSendingCode(true);
    setCodeMsg(null);
    try {
      const res = await fetch("/api/register/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodeMsg({ ok: true, text: "تم إرسال الكود على واتساب ✓" });
    } catch (err: any) {
      setCodeMsg({ ok: false, text: err.message });
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName:     form.get("clinicName"),
          phone:          form.get("phone"),
          password:       form.get("password"),
          invitationCode: (form.get("invitationCode") as string)?.trim().toUpperCase(),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setLoading(false); return; }
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
            <span className="text-white text-2xl font-bold tracking-wide">عيادتي</span>
          </div>
          <div>
            <h1 className="text-white text-4xl font-extrabold leading-tight mb-4">
              ابدأ مع<br/>
              <span className="text-blue-300">عيادتك الآن</span>
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed max-w-sm">
              نظام متكامل للمواعيد والمرضى وبوت واتساب ذكي.
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
          <p className="text-blue-300/60 text-sm">© 2026 عيادتي — تكريت، العراق</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 bg-[#EEF2F9]">
        <div className="w-full max-w-sm fade-in">

          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <MedicalCross />
            </div>
            <span className="text-[#0C1F3F] text-xl font-bold">عيادتي</span>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(37,99,235,0.08)] p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-[#0C1F3F]">تسجيل عيادة جديدة</h2>
              <p className="text-[#64748B] text-sm mt-1">أدخل كود الدعوة الخاص بك</p>
              <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                يتضمن الحساب فترة تجريبية لمدة 14 يوم.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">اسم العيادة</label>
                <input name="clinicName" type="text" required
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                  placeholder="عيادة د. أحمد محمد" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">رقم واتساب العيادة</label>
                <input name="phone" type="text" required
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setCodeMsg(null); }}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all placeholder:text-[#94A3B8]"
                  placeholder="07701234567" dir="ltr" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">كلمة المرور</label>
                <input name="password" type="password" required minLength={6}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm bg-[#F8FAFD] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] transition-all"
                  placeholder="6 أحرف على الأقل" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0C1F3F] mb-1.5 uppercase tracking-wide">كود الدعوة</label>
                <input name="invitationCode" type="text" required
                  className="w-full border-2 border-[#E2E8F0] focus:border-[#2563EB] rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest bg-[#F8FAFD] focus:outline-none transition-all uppercase placeholder:text-[#94A3B8] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                  placeholder="TIKRIT-0000" dir="ltr"
                  onChange={(e) => e.target.value = e.target.value.toUpperCase()}
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={sendingCode}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.529 5.843L.057 23.571l5.9-1.548A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.359-.214-3.502.919.935-3.416-.234-.371A9.818 9.818 0 1 1 12 21.818z"/>
                  </svg>
                  {sendingCode ? "جاري الإرسال..." : "أرسل الكود على واتساب"}
                </button>
                {codeMsg && (
                  <p className={`text-xs font-semibold mt-1.5 ${codeMsg.ok ? "text-green-600" : "text-red-500"}`}>
                    {codeMsg.text}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 text-sm transition-all shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 mt-2">
                {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
              </button>
            </form>
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
