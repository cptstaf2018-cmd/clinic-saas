"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";
import GoogleButton from "./GoogleButton";

type ForgotStep = "input" | "otp" | "password" | "done";

const INPUT_CLASS =
  "w-full min-h-12 rounded-2xl border border-brand-border bg-white px-4 text-[15px] text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";
const PRIMARY_BTN =
  "flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-navy text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-navy-2 active:translate-y-0 disabled:translate-y-0 disabled:opacity-60";
const GHOST_BTN =
  "flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-brand-muted transition hover:bg-brand-line hover:text-brand-ink";

const DAY_SEGMENTS = 16;
const CURRENT_SEGMENT = 6;

function Field({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-semibold text-brand-ink">
        {label}
        {aside}
      </span>
      {children}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

function BrandMark({ tone }: { tone: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="h-5 w-5 text-brand-mint-ink" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <span className={`text-xl font-bold tracking-tight ${tone === "dark" ? "text-white" : "text-brand-navy"}`}>Clinic AI Pro</span>
    </div>
  );
}

/** قرص يوم العيادة: كل قطعة موعد، والنعناعي المنتهي، والمتوهّج هو الحالي */
function DayDial() {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const segment = circumference / DAY_SEGMENTS;
  return (
    <div className="relative mx-auto aspect-square w-[min(300px,100%)]" aria-hidden>
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
        {Array.from({ length: DAY_SEGMENTS }, (_, i) => {
          const done = i < CURRENT_SEGMENT;
          const current = i === CURRENT_SEGMENT;
          return (
            <circle
              key={i}
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              strokeWidth={current ? 26 : 18}
              stroke={done ? "#7CE0C3" : current ? "#FFFFFF" : "#2A4B78"}
              strokeDasharray={`${segment - 5} ${circumference}`}
              transform={`rotate(${-90 + (i * 360) / DAY_SEGMENTS} 150 150)`}
              className={current ? "dial-current" : undefined}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs tracking-widest text-brand-side-muted">الدور الآن</span>
        <span className="text-7xl font-bold leading-none text-white">٠٧</span>
        <span className="mt-1 text-sm text-brand-mint">زينب حسن</span>
      </div>
    </div>
  );
}

function BotChat() {
  const bubbles = [
    { mine: true, text: "السلام عليكم، أريد موعد" },
    { mine: false, text: "أهلاً بك، اكتب اسمك الكريم" },
    { mine: false, text: "تم حجزك الأربعاء 11:40 ✓" },
  ];
  return (
    <div className="space-y-2 rounded-3xl border border-white/10 bg-white/[0.06] p-4" aria-hidden>
      <div className="mb-1 flex items-center gap-2 text-xs text-brand-side-muted">
        <span className="h-2 w-2 rounded-full bg-brand-mint" />
        البوت يرد على المرضى وأنت في الكشف
      </div>
      {bubbles.map((b) => (
        <div key={b.text} className={`flex ${b.mine ? "justify-start" : "justify-end"}`}>
          <span
            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
              b.mine ? "bg-white/10 text-white" : "bg-brand-mint text-brand-mint-ink font-semibold"
            }`}
          >
            {b.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-10 text-white lg:flex lg:w-[54%] xl:p-14">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full border-[56px] border-white/[0.04]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-[26rem] w-[26rem] rounded-full border-[56px] border-brand-mint/[0.07]" />

      <div className="relative">
        <BrandMark tone="dark" />
      </div>

      <div className="relative space-y-8">
        <div>
          <h1 className="text-4xl font-bold leading-[1.25] xl:text-5xl">
            عيادتك تعمل
            <br />
            <span className="text-brand-mint">حتى وأنت في الكشف.</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-side-muted">
            المريض يحجز عبر واتساب، وأنت تنادي التالي بضغطة واحدة، وشاشة الانتظار تنطق اسمه. كل شيء في مكان واحد.
          </p>
        </div>
        <div className="grid items-center gap-6 xl:grid-cols-[auto_1fr]">
          <DayDial />
          <BotChat />
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-side-muted">
        <span>٤ باقات تبدأ من ٣٥٬٠٠٠ دينار</span>
        <span aria-hidden className="h-1 w-1 rounded-full bg-brand-side-dot" />
        <span>١٤ يوماً تجربة مجانية كاملة</span>
      </div>
    </div>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("input");
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotMasked, setForgotMasked] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAction(new FormData(e.currentTarget));
      if (result) { setError(result); setLoading(false); }
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT")
      ) return;
      setError("حدث خطأ في الاتصال، حاول مجدداً");
      setLoading(false);
    }
  }

  function openForgotMode() {
    setError("");
    setForgotStep("input");
    setForgotIdentifier("");
    setForgotOtp("");
    setForgotPassword("");
    setForgotConfirm("");
    setForgotMasked("");
    setForgotMode(true);
  }

  function closeForgotMode() {
    setError("");
    setForgotStep("input");
    setForgotMode(false);
  }

  async function handleForgotSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: forgotIdentifier }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "حدث خطأ، حاول مجدداً"); return; }
    setForgotMasked(data.masked);
    setForgotStep("otp");
  }

  function handleForgotOtpNext(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.length < 6) { setError("أدخل الكود المكون من 6 أرقام"); return; }
    setError("");
    setForgotStep("password");
  }

  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault();
    if (forgotPassword !== forgotConfirm) { setError("كلمتا المرور غير متطابقتين"); return; }
    if (forgotPassword.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/forgot-password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: forgotIdentifier, otp: forgotOtp, newPassword: forgotPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "حدث خطأ، حاول مجدداً"); return; }
    setForgotStep("done");
  }

  const title = forgotMode ? "نسيت كلمة المرور؟" : "أهلاً بعودتك";
  const subtitle = forgotMode
    ? forgotStep === "otp" ? `أُرسل كود إلى ${forgotMasked}`
      : forgotStep === "password" ? "أدخل كلمة المرور الجديدة"
      : forgotStep === "done" ? "تمت العملية بنجاح"
      : "أدخل رقم الواتساب أو الإيميل المسجل"
    : "سجّل دخولك برقم الواتساب أو الإيميل";

  return (
    <div className="flex min-h-screen bg-brand-bg" dir="rtl">
      <style>{`
        @keyframes dial-glow { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
        .dial-current { animation: dial-glow 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .dial-current { animation: none; } }
      `}</style>

      <BrandPanel />

      <main className="flex flex-1 flex-col">
        {/* شريط الهوية للموبايل */}
        <div className="flex items-center justify-between bg-brand-navy px-5 py-4 lg:hidden">
          <BrandMark tone="dark" />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-side-muted">١٤ يوماً مجاناً</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 lg:px-10">
          <div className="w-full max-w-[420px]">
            <h2 className="text-3xl font-bold text-brand-ink">{title}</h2>
            <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>

            {params.get("registered") && (
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-brand-mint-soft px-4 py-3 text-sm font-semibold text-brand-mint-text">
                ✓ تم تسجيل العيادة بنجاح! سجّل دخولك الآن.
              </div>
            )}

            <div className="mt-7">
              {forgotMode ? (
                <>
                  {forgotStep === "input" && (
                    <form onSubmit={handleForgotSend} className="space-y-4">
                      <Field label="رقم الواتساب أو الإيميل">
                        <input type="text" required value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)}
                          className={INPUT_CLASS} placeholder="07701234567 أو email@example.com" dir="ltr" />
                      </Field>
                      <ErrorBox message={error} />
                      <button type="submit" disabled={loading} className={PRIMARY_BTN}>{loading ? "جاري الإرسال..." : "إرسال الكود"}</button>
                      <button type="button" onClick={closeForgotMode} className={GHOST_BTN}>رجوع لتسجيل الدخول</button>
                    </form>
                  )}
                  {forgotStep === "otp" && (
                    <form onSubmit={handleForgotOtpNext} className="space-y-4">
                      <div className="rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand-on-soft">
                        أُرسل كود التحقق إلى <span className="font-bold" dir="ltr">{forgotMasked}</span>
                      </div>
                      <Field label="كود التحقق (6 أرقام)">
                        <input type="text" inputMode="numeric" maxLength={6} required value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          className={`${INPUT_CLASS} text-center font-mono text-xl tracking-[0.5em]`} dir="ltr" placeholder="------" />
                      </Field>
                      <ErrorBox message={error} />
                      <button type="submit" className={PRIMARY_BTN}>التالي</button>
                      <button type="button" onClick={() => setForgotStep("input")} className={GHOST_BTN}>تغيير رقم الواتساب / الإيميل</button>
                    </form>
                  )}
                  {forgotStep === "password" && (
                    <form onSubmit={handleForgotReset} className="space-y-4">
                      <Field label="كلمة المرور الجديدة">
                        <input type="password" required value={forgotPassword} onChange={(e) => setForgotPassword(e.target.value)} className={INPUT_CLASS} />
                      </Field>
                      <Field label="تأكيد كلمة المرور">
                        <input type="password" required value={forgotConfirm} onChange={(e) => setForgotConfirm(e.target.value)} className={INPUT_CLASS} />
                      </Field>
                      <ErrorBox message={error} />
                      <button type="submit" disabled={loading} className={PRIMARY_BTN}>{loading ? "جاري التغيير..." : "تغيير كلمة المرور"}</button>
                    </form>
                  )}
                  {forgotStep === "done" && (
                    <div className="space-y-5 py-4 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-mint-soft">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-8 w-8 text-brand-mint-text" aria-hidden>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="text-lg font-bold text-brand-ink">تم تغيير كلمة المرور!</p>
                      <p className="text-sm text-brand-muted">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
                      <button type="button" onClick={closeForgotMode} className={PRIMARY_BTN}>تسجيل الدخول</button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="رقم الواتساب أو الإيميل">
                      <input name="identifier" type="text" required className={INPUT_CLASS} placeholder="07701234567 أو email@example.com" dir="ltr" autoComplete="username" />
                    </Field>
                    <Field
                      label="كلمة المرور"
                      aside={
                        <button type="button" onClick={openForgotMode} className="text-xs font-semibold text-brand-blue hover:underline">
                          نسيت كلمة المرور؟
                        </button>
                      }
                    >
                      <input name="password" type="password" required className={INPUT_CLASS} autoComplete="current-password" />
                    </Field>
                    <ErrorBox message={error} />
                    <button type="submit" disabled={loading} className={PRIMARY_BTN}>{loading ? "جاري الدخول..." : "تسجيل الدخول"}</button>
                  </form>
                  <GoogleButton />
                </>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-brand-muted">
              عيادة جديدة؟{" "}
              <Link href="/register" className="font-bold text-brand-blue hover:underline">ابدأ تجربتك المجانية</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
