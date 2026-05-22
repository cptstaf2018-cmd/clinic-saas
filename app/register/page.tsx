"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
} from "lucide-react";

type VerificationType = "phone" | "email";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#0f1f3d] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition focus:border-[#2f80ed] focus:bg-white focus:ring-4 focus:ring-[#2f80ed]/15 placeholder:text-[#8da0ba]";

const labelClass = "mb-1.5 block text-xs font-extrabold text-[#334763]";

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

function TrustBadge({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-[#d8e4f3] bg-white/70 px-3 py-2 text-xs font-extrabold text-[#415673]">
      <Icon className="h-4 w-4 text-[#2f80ed]" />
      {text}
    </span>
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
        <label className={labelClass}>طريقة التحقق</label>
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
          <label className={labelClass}>رقم واتساب العيادة</label>
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
            {sendingCode ? "جاري الإرسال..." : "أرسل الكود على واتساب"}
          </button>
          {codeMsg && <p className={`mt-2 text-xs font-bold ${codeMsg.ok ? "text-emerald-600" : "text-red-500"}`}>{codeMsg.text}</p>}
        </div>
      )}

      {regType === "email" && (
        <div>
          <label className={labelClass}>إيميل العيادة</label>
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
          <p className="mt-1.5 text-xs font-bold text-[#7c91ad]">سيستخدم للدخول واستلام التنبيهات المهمة.</p>
          <button
            type="button"
            onClick={handleRequestEmailCode}
            disabled={sendingEmail}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f80ed] py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(47,128,237,0.28)] transition hover:bg-[#256bd0] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {sendingEmail ? "جاري الإرسال..." : "أرسل الكود على الإيميل"}
          </button>
          {emailMsg && <p className={`mt-2 text-xs font-bold ${emailMsg.ok ? "text-emerald-600" : "text-red-500"}`}>{emailMsg.text}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>{regType === "phone" ? "كود التحقق من واتساب" : "كود التحقق من الإيميل"}</label>
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#071a34]" dir="rtl">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <ProductPreview />

        <section className="relative flex w-full min-w-0 items-start justify-center overflow-hidden bg-[#eaf1f9] px-4 py-8 lg:w-[44%] lg:px-8">
          <div
            className="absolute inset-0 opacity-60 lg:hidden"
            style={{
              backgroundImage:
                "linear-gradient(rgba(47,128,237,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(47,128,237,0.08) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(234,241,249,0.94))]" />

          <div className="relative z-10 w-full max-w-[calc(100vw-32px)] min-w-0 sm:max-w-[520px]">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2f80ed] text-white">
                  <Plus className="h-6 w-6 stroke-[3]" />
                </div>
                <span className="text-xl font-black text-[#0f1f3d]">عيادتي</span>
              </div>
              <span className="rounded-lg bg-white/80 px-3 py-2 text-xs font-black text-[#2f6fe4] shadow-sm">
                14 يوم مجاناً
              </span>
            </div>

            <div className="rounded-lg border border-white/70 bg-white/75 p-5 shadow-[0_26px_90px_rgba(28,52,92,0.18)] backdrop-blur-2xl sm:p-6">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0f1f3d] text-white shadow-[0_16px_34px_rgba(15,31,61,0.18)]">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#e8f2ff] px-3 py-1.5 text-xs font-black text-[#2f6fe4]">
                    <CheckCircle2 className="h-4 w-4" />
                    التسجيل الرسمي للعيادات
                  </p>
                  <h1 className="max-w-full text-2xl font-black leading-tight text-[#0f1f3d] sm:text-3xl">
                    ابدأ تجربتك المجانية
                  </h1>
                  <p className="mt-2 max-w-sm text-sm font-bold leading-6 text-[#61728a]">
                    أنشئ حساب عيادتك الآن وشاهد نظام المواعيد والواتساب من الداخل خلال دقيقة.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <TrustBadge icon={ShieldCheck} text="بدون بطاقة ائتمان" />
                <TrustBadge icon={Clock3} text="إعداد خلال دقيقة" />
                <TrustBadge icon={CheckCircle2} text="14 يوم تجربة" />
              </div>

              <RegisterForm
                regType={regType}
                setRegType={(value) => {
                  setRegType(value);
                  setCodeMsg(null);
                  setEmailMsg(null);
                }}
                phone={phone}
                setPhone={(value) => {
                  setPhone(value);
                  setCodeMsg(null);
                }}
                email={email}
                setEmail={(value) => {
                  setEmail(value);
                  setEmailMsg(null);
                }}
                sendingCode={sendingCode}
                codeMsg={codeMsg}
                sendingEmail={sendingEmail}
                emailMsg={emailMsg}
                handleRequestPhoneCode={handleRequestPhoneCode}
                handleRequestEmailCode={handleRequestEmailCode}
                handleSubmit={handleSubmit}
                loading={loading}
                error={error}
              />
            </div>

            <p className="mt-5 text-center text-sm font-bold text-[#61728a]">
              لديك حساب؟{" "}
              <Link href="/login" className="font-black text-[#2563eb] hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
