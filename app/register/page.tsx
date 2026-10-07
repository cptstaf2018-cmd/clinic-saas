"use client";

import GoogleButton from "../login/GoogleButton";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, LockKeyhole, Mail, MessageCircle, Phone, Send, Stethoscope } from "lucide-react";

type VerificationType = "phone" | "email";
type CodeMessage = { ok: boolean; text: string } | null;

const INPUT_CLASS =
  "w-full min-h-12 rounded-2xl border border-brand-border bg-white pr-11 pl-4 text-[15px] text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";
const ICON_CLASS = "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted";
const SEND_BTN =
  "mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand-mint text-sm font-bold text-brand-mint-ink transition hover:-translate-y-0.5 hover:bg-brand-mint-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-60";

const JOURNEY = [
  { title: "تسجّل عيادتك", desc: "اسم العيادة ورمز تحقق، بدون بطاقة ائتمان." },
  { title: "تحدد أوقات الدوام", desc: "يعرض البوت للمرضى الأوقات الفارغة فقط." },
  { title: "تشارك رقم الواتساب", desc: "المريض يكتب اسمه ويختار موعده بنفسه." },
  { title: "تنادي التالي", desc: "الاسم يُنطق بالصوت على شاشة الانتظار." },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="h-5 w-5 text-brand-mint-ink" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <span className="text-xl font-bold tracking-tight text-white">Clinic AI Pro</span>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-10 text-white lg:flex lg:w-[48%] xl:p-14">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full border-[56px] border-white/[0.04]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-[26rem] w-[26rem] rounded-full border-[56px] border-brand-mint/[0.07]" />

      <div className="relative">
        <BrandMark />
      </div>

      <div className="relative space-y-9">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-mint/15 px-3.5 py-1.5 text-xs font-semibold text-brand-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-mint" />
            ١٤ يوماً تجربة مجانية كاملة
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.25] xl:text-5xl">
            من التسجيل إلى
            <br />
            <span className="text-brand-mint">أول حجز عبر واتساب.</span>
          </h1>
        </div>

        <ol className="relative space-y-5">
          <span aria-hidden className="absolute bottom-3 right-[15px] top-3 w-px bg-brand-navy-line" />
          {JOURNEY.map((step, index) => (
            <li key={step.title} className="relative flex gap-4">
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  index === 0 ? "bg-brand-mint text-brand-mint-ink" : "border border-brand-navy-line bg-brand-navy-3 text-brand-side-muted"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-white">{step.title}</p>
                <p className="mt-0.5 text-sm text-brand-side-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="relative text-sm text-brand-side-muted">بعد التجربة: ٤ باقات تبدأ من ٣٥٬٠٠٠ دينار شهرياً، وبياناتك تبقى محفوظة.</p>
    </div>
  );
}

function IconField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-brand-ink">{label}</span>
      <span className="relative block">
        {icon}
        {children}
      </span>
    </label>
  );
}

function StatusLine({ message }: { message: CodeMessage }) {
  if (!message) return null;
  return <p className={`mt-2 text-xs font-semibold ${message.ok ? "text-brand-mint-text" : "text-red-600"}`}>{message.text}</p>;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regType, setRegType] = useState<VerificationType>("phone");

  const [phone, setPhone] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeMsg, setCodeMsg] = useState<CodeMessage>(null);

  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailMsg, setEmailMsg] = useState<CodeMessage>(null);

  function chooseType(value: VerificationType) {
    setRegType(value);
    setCodeMsg(null);
    setEmailMsg(null);
  }

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
    <div className="flex min-h-screen bg-brand-bg" dir="rtl">
      <BrandPanel />

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between bg-brand-navy px-5 py-4 lg:hidden">
          <BrandMark />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-side-muted">١٤ يوماً مجاناً</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 lg:px-10">
          <div className="w-full max-w-[460px]">
            <h2 className="text-3xl font-bold text-brand-ink">سجّل عيادتك</h2>
            <p className="mt-2 text-sm text-brand-muted">اختر الهاتف أو الإيميل، أرسل الكود، ثم فعّل حسابك.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <IconField label="اسم العيادة" icon={<Stethoscope className={ICON_CLASS} />}>
                <input name="clinicName" type="text" required className={INPUT_CLASS} placeholder="عيادة د. أحمد محمد" />
              </IconField>

              <div>
                <span className="mb-1.5 block text-sm font-semibold text-brand-ink">طريقة التحقق</span>
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-brand-line p-1" role="tablist">
                  {([
                    { id: "phone", label: "رقم هاتف", Icon: Phone },
                    { id: "email", label: "إيميل", Icon: Mail },
                  ] as const).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={regType === id}
                      onClick={() => chooseType(id)}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
                        regType === id ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted hover:text-brand-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {regType === "phone" && (
                <div>
                  <IconField label="رقم الواتساب" icon={<MessageCircle className={ICON_CLASS} />}>
                    <input type="text" value={phone} onChange={(e) => { setPhone(e.target.value); setCodeMsg(null); }}
                      className={INPUT_CLASS} placeholder="07701234567" dir="ltr" inputMode="tel" />
                  </IconField>
                  <button type="button" onClick={handleRequestPhoneCode} disabled={sendingCode} className={SEND_BTN}>
                    <Send className="h-4 w-4" />
                    {sendingCode ? "جاري الإرسال..." : "إرسال الكود"}
                  </button>
                  <StatusLine message={codeMsg} />
                </div>
              )}

              {regType === "email" && (
                <div>
                  <IconField label="البريد الإلكتروني" icon={<Mail className={ICON_CLASS} />}>
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailMsg(null); }}
                      className={INPUT_CLASS} placeholder="clinic@example.com" dir="ltr" />
                  </IconField>
                  <button type="button" onClick={handleRequestEmailCode} disabled={sendingEmail} className={SEND_BTN}>
                    <Send className="h-4 w-4" />
                    {sendingEmail ? "جاري الإرسال..." : "إرسال الكود"}
                  </button>
                  <StatusLine message={emailMsg} />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <IconField label="كود التحقق" icon={<KeyRound className={ICON_CLASS} />}>
                  <input name="otp" type="text" required className={`${INPUT_CLASS} text-center font-bold`}
                    placeholder={regType === "phone" ? "TIKRIT-0000" : "123456"} dir="ltr" autoComplete="one-time-code" />
                </IconField>
                <IconField label="كلمة المرور" icon={<LockKeyhole className={ICON_CLASS} />}>
                  <input name="password" type="password" required minLength={6} className={INPUT_CLASS}
                    placeholder="6 أحرف على الأقل" autoComplete="new-password" />
                </IconField>
              </div>

              {error && (
                <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-navy text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-navy-2 active:translate-y-0 disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? "جاري التسجيل..." : "ابدأ تجربتي المجانية"}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </form>

            <GoogleButton label="التسجيل بحساب Google" />

            <p className="mt-8 text-center text-sm text-brand-muted">
              لديك حساب؟{" "}
              <Link href="/login" className="font-bold text-brand-blue hover:underline">دخول العيادة</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
