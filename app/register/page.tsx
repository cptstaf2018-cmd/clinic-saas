"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";

type VerificationType = "phone" | "email";

const inputClass =
  "w-full rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFD] px-4 py-3.5 text-sm font-semibold text-[#0f1f3d] outline-none transition focus:border-[#2563EB] focus:bg-white placeholder:text-[#94A3B8]";

const labelClass = "mb-1.5 block text-xs font-extrabold text-[#475569]";

function HealthIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 34s-14-9-14-19a8 8 0 0 1 14-5.3A8 8 0 0 1 34 15c0 10-14 19-14 19z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M8 20h4l2-5 3 10 3-8 2 3h10"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2f80ed] text-white shadow-[0_16px_34px_rgba(47,128,237,0.35)]">
        <Plus className="h-7 w-7 stroke-[3]" />
      </div>
      <span className="text-2xl font-black text-white">عيادتي</span>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-300">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function AppointmentRow({
  name,
  time,
  status,
}: {
  name: string;
  time: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f80ed]/20 text-[#9dccff]">
          <UsersRound className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-white">{name}</p>
          <p className="text-xs font-bold text-slate-400">{time}</p>
        </div>
      </div>
      <span className="rounded-lg bg-emerald-400/10 px-3 py-1 text-xs font-extrabold text-emerald-200">
        {status}
      </span>
    </div>
  );
}

function ProductPreview() {
  return (
    <div dir="ltr" className="relative hidden min-h-screen flex-1 overflow-hidden bg-[#071a34] px-10 py-10 lg:flex">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_24%,rgba(47,128,237,0.26),transparent_34%),linear-gradient(135deg,rgba(12,31,63,0.98),rgba(7,26,52,0.94)_44%,rgba(5,18,39,1))]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1060px] flex-col">
        <div className="flex justify-end">
          <div dir="rtl">
            <BrandMark />
          </div>
        </div>

        <div className="grid flex-1 grid-cols-[440px_1fr] items-center gap-12">
          <section dir="rtl" className="order-2 max-w-[430px] justify-self-end text-right">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-extrabold text-[#b9d8ff] backdrop-blur">
              <Sparkles className="h-4 w-4" />
              تجربة مجانية 14 يوم بدون بطاقة ائتمان
            </div>

            <h1 className="text-5xl font-black leading-tight text-white">
              منصة عيادتك
              <span className="mt-2 block text-[#9dccff]">تعمل قبل وصولك</span>
            </h1>

            <p className="mt-5 text-base font-semibold leading-8 text-slate-300">
              إدارة المواعيد، غرفة الانتظار، التذكيرات، وبوت واتساب ذكي في تجربة واحدة تبدو جاهزة للتوسع من أول يوم.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "حجز تلقائي عبر واتساب",
                "تذكيرات تقلل غياب المرضى",
                "متابعة يومية للمواعيد والمدفوعات",
                "إدارة كاملة من الجوال والكمبيوتر",
              ].map((item) => (
                <div key={item} className="flex items-center justify-end gap-3 text-sm font-bold text-slate-200">
                  {item}
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2f80ed]/20 text-[#9dccff]">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section dir="rtl" className="order-1 relative w-[440px] justify-self-start">
            <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4 shadow-[0_36px_110px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-white">لوحة عيادة اليوم</p>
                  <p className="text-xs font-bold text-slate-400">تحديث مباشر للمواعيد والرسائل</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-200">
                  <Activity className="h-5 w-5" />
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MetricTile icon={CalendarCheck} label="مواعيد اليوم" value="24" tone="bg-[#2f80ed]/20 text-[#9dccff]" />
                <MetricTile icon={MessageCircle} label="رسائل واتساب" value="18" tone="bg-emerald-400/15 text-emerald-200" />
                <MetricTile icon={Clock3} label="الانتظار" value="07" tone="bg-cyan-300/15 text-cyan-100" />
              </div>

              <div className="mt-4 grid grid-cols-[1.05fr_0.95fr] gap-4">
                <div className="space-y-3">
                  <AppointmentRow name="علي حسن" time="09:30 صباحاً" status="تم التأكيد" />
                  <AppointmentRow name="زهراء كريم" time="10:00 صباحاً" status="بالطريق" />
                  <AppointmentRow name="مصطفى أحمد" time="10:30 صباحاً" status="ينتظر" />
                </div>

                <div className="rounded-lg border border-white/10 bg-[#06162d]/70 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-black text-white">بوت واتساب</p>
                    <span className="rounded-lg bg-emerald-400/15 px-2.5 py-1 text-xs font-black text-emerald-200">
                      نشط
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-white/[0.08] p-3 text-xs font-bold leading-6 text-slate-200">
                      تم تثبيت موعدك غداً الساعة 10:00 صباحاً. هل تريد تذكيراً قبل الموعد؟
                    </div>
                    <div className="mr-auto w-fit rounded-lg bg-[#2f80ed] px-3 py-2 text-xs font-black text-white">
                      نعم، ذكرني
                    </div>
                  </div>
                  <div className="mt-5 h-2 rounded-lg bg-white/10">
                    <div className="h-2 w-[72%] rounded-lg bg-[#2f80ed]" />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-400">72% من حجوزات اليوم مؤكدة تلقائياً</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <p className="text-left text-xs font-bold text-slate-500">© 2026 عيادتي، تكريت، العراق</p>
      </div>
    </div>
  );
}

type RegisterFormProps = {
  regType: VerificationType;
  setRegType: (v: VerificationType) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  sendingCode: boolean;
  codeMsg: { ok: boolean; text: string } | null;
  sendingEmail: boolean;
  emailMsg: { ok: boolean; text: string } | null;
  handleRequestPhoneCode: () => void;
  handleRequestEmailCode: () => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string;
};

function RegisterForm({
  regType,
  setRegType,
  phone,
  setPhone,
  email,
  setEmail,
  sendingCode,
  codeMsg,
  sendingEmail,
  emailMsg,
  handleRequestPhoneCode,
  handleRequestEmailCode,
  handleSubmit,
  loading,
  error,
}: RegisterFormProps) {
  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-3">
      <div>
        <label className={labelClass}>اسم العيادة</label>
        <div className="relative">
          <Stethoscope className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c91ad]" />
          <input name="clinicName" type="text" required className={`${inputClass} pr-11`} placeholder="عيادة د. أحمد محمد" />
        </div>
      </div>

      <div>
        <label className={labelClass}>اختر طريقة التحقق</label>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#dbe6f3] bg-[#edf3fb] p-1">
          <button
            type="button"
            onClick={() => {
              setRegType("phone");
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-black transition ${
              regType === "phone" ? "bg-white text-[#2f6fe4] shadow-sm" : "text-[#667891] hover:text-[#0f1f3d]"
            }`}
          >
            <Phone className="h-4 w-4" />
            رقم هاتف
          </button>
          <button
            type="button"
            onClick={() => {
              setRegType("email");
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-black transition ${
              regType === "email" ? "bg-white text-[#2f6fe4] shadow-sm" : "text-[#667891] hover:text-[#0f1f3d]"
            }`}
          >
            <Mail className="h-4 w-4" />
            إيميل
          </button>
        </div>
      </div>

      {regType === "phone" && (
        <div>
          <label className={labelClass}>رقم الهاتف</label>
          <div className="relative">
            <MessageCircle className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c91ad]" />
            <input
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
              }}
              className={`${inputClass} pr-11`}
              placeholder="07701234567"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={handleRequestPhoneCode}
            disabled={sendingCode}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#10b981] py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(16,185,129,0.24)] transition hover:bg-[#0ea371] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sendingCode ? "جاري الإرسال..." : "إرسال الكود"}
          </button>
          {codeMsg && <p className={`mt-2 text-xs font-bold ${codeMsg.ok ? "text-emerald-600" : "text-red-500"}`}>{codeMsg.text}</p>}
        </div>
      )}

      {regType === "email" && (
        <div>
          <label className={labelClass}>البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c91ad]" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className={`${inputClass} pr-11`}
              placeholder="clinic@example.com"
              dir="ltr"
            />
          </div>
          <button
            type="button"
            onClick={handleRequestEmailCode}
            disabled={sendingEmail}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f80ed] py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(47,128,237,0.28)] transition hover:bg-[#256bd0] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sendingEmail ? "جاري الإرسال..." : "إرسال الكود"}
          </button>
          {emailMsg && <p className={`mt-2 text-xs font-bold ${emailMsg.ok ? "text-emerald-600" : "text-red-500"}`}>{emailMsg.text}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>كود التحقق</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c91ad]" />
            <input
              name="otp"
              type="text"
              required
              className={`${inputClass} pr-11 text-center font-black`}
              placeholder={regType === "phone" ? "TIKRIT-0000" : "123456"}
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>كلمة المرور</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c91ad]" />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className={`${inputClass} pr-11`}
              placeholder="6 أحرف على الأقل"
            />
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] py-3.5 text-base font-black text-white shadow-[0_18px_34px_rgba(37,99,235,0.32)] transition hover:bg-[#1d4ed8] hover:shadow-[0_22px_42px_rgba(37,99,235,0.38)] disabled:opacity-60"
      >
        {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
        <ArrowLeft className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regType, setRegType] = useState<VerificationType>("phone");

  const [phone, setPhone] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleRequestPhoneCode() {
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
      setCodeMsg({ ok: true, text: "تم إرسال الكود على واتساب" });
    } catch (err) {
      setCodeMsg({ ok: false, text: err instanceof Error ? err.message : "تعذر إرسال الكود" });
    } finally {
      setSendingCode(false);
    }
  }

  async function handleRequestEmailCode() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailMsg({ ok: false, text: "أدخل إيميلاً صحيحاً أولاً" });
      return;
    }
    setSendingEmail(true);
    setEmailMsg(null);
    try {
      const res = await fetch("/api/register/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmailMsg({ ok: true, text: "تم إرسال الكود على إيميلك" });
    } catch (err) {
      setEmailMsg({ ok: false, text: err instanceof Error ? err.message : "تعذر إرسال الكود" });
    } finally {
      setSendingEmail(false);
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
          clinicName: form.get("clinicName"),
          registrationType: regType,
          phone: regType === "phone" ? phone.trim() : undefined,
          email: regType === "email" ? email.trim() : undefined,
          otp: (form.get("otp") as string)?.trim(),
          password: form.get("password"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        setLoading(false);
        return;
      }
      window.location.href = "/login?registered=1";
    } catch {
      setError("حدث خطأ في الاتصال، حاول مجدداً");
      setLoading(false);
    }
  }

  const formProps = {
    regType,
    setRegType: (value: VerificationType) => {
      setRegType(value);
      setCodeMsg(null);
      setEmailMsg(null);
    },
    phone,
    setPhone: (value: string) => {
      setPhone(value);
      setCodeMsg(null);
    },
    email,
    setEmail: (value: string) => {
      setEmail(value);
      setEmailMsg(null);
    },
    sendingCode,
    codeMsg,
    sendingEmail,
    emailMsg,
    handleRequestPhoneCode,
    handleRequestEmailCode,
    handleSubmit,
    loading,
    error,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071a34]" dir="rtl">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <ProductPreview />

        <section className="w-full min-w-0 lg:w-[44%] lg:bg-[#EEF2F9] lg:px-8 lg:py-8">
          <div
            className="flex min-h-screen w-full flex-col lg:hidden"
            style={{ background: "linear-gradient(160deg,#0c1f3f 0%,#1a3a6b 40%,#1e4080 100%)" }}
          >
            <div className="flex flex-col items-center px-6 pb-8 pt-14 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg">
                <HealthIcon className="h-9 w-9" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">عيادتي</h1>
              <p className="mt-1.5 text-sm font-medium text-blue-200/80">نظام إدارة العيادات الذكي</p>

              <div className="mt-4 flex items-center gap-3">
                {[
                  { icon: "🏥", text: "13+ عيادة" },
                  { icon: "🤖", text: "بوت واتساب" },
                  { icon: "🔒", text: "بيانات آمنة" },
                ].map((badge) => (
                  <div key={badge.text} className="flex items-center gap-1 rounded-full border border-white/12 bg-white/8 px-2.5 py-1">
                    <span className="text-xs">{badge.icon}</span>
                    <span className="text-[11px] font-bold text-blue-100">{badge.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-t-[32px] bg-white px-6 pb-10 pt-8 shadow-[0_-8px_40px_rgba(0,0,0,0.25)]">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-[#0C1F3F]">تسجيل عيادة جديدة</h2>
                <p className="mt-1 text-sm text-[#64748B]">برقم الواتساب أو الإيميل</p>
              </div>

              <RegisterForm {...formProps} />

              <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-[#64748B]">
                  لديك حساب؟{" "}
                  <Link href="/login" className="font-black text-[#2563EB] hover:underline">
                    دخول العيادة
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="relative hidden min-h-screen items-center justify-center lg:flex">
            <div className="w-full max-w-[520px]">
              <div className="rounded-2xl bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_48px_rgba(37,99,235,0.08)]">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-[#0C1F3F]">تسجيل عيادة جديدة</h2>
                  <p className="mt-1 text-sm font-bold text-[#64748B]">
                    اختر رقم الهاتف أو البريد الإلكتروني، أرسل الكود، ثم فعّل حسابك.
                  </p>
                </div>

                <RegisterForm {...formProps} />
              </div>

              <p className="mt-5 text-center text-sm font-bold text-[#64748B]">
                لديك حساب؟{" "}
                <Link href="/login" className="font-black text-[#2563EB] hover:underline">
                  دخول العيادة
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
