"use client";

import { FREE_PERIOD_LABEL } from "@/lib/free-period";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";
import GoogleButton from "./GoogleButton";
import BrandLogo from "@/components/BrandLogo";
import AuthBrandPanel from "@/components/AuthBrandPanel";

type ForgotStep = "input" | "otp" | "password" | "done";

const INPUT_CLASS =
  "w-full min-h-12 rounded-2xl border border-brand-border bg-white px-4 text-[15px] text-brand-ink outline-none transition placeholder:text-brand-muted/60 focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";
const PRIMARY_BTN =
  "flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand-gold text-[15px] font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-60";
const GHOST_BTN =
  "flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-brand-muted transition hover:bg-brand-line hover:text-brand-ink";

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
      : "أدخل الإيميل المسجل"
    : "سجّل دخولك بالإيميل";

  return (
    <div className="flex min-h-screen bg-brand-bg" dir="rtl">
      <AuthBrandPanel variant="login" />

      <main className="flex flex-1 flex-col">
        {/* شريط الهوية للموبايل */}
        <div className="flex items-center justify-between bg-brand-navy px-5 py-4 lg:hidden">
          <BrandLogo tone="dark" size={34} stacked={false} />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-side-muted">{FREE_PERIOD_LABEL}</span>
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

            {params.get("error") && !forgotMode && (
              <div role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                تعذّر الدخول بحساب Google. جرّب الدخول بالإيميل وكلمة المرور، أو استخدم حساب Google آخر.
              </div>
            )}

            <div className="mt-7">
              {forgotMode ? (
                <>
                  {forgotStep === "input" && (
                    <form onSubmit={handleForgotSend} className="space-y-4">
                      <Field label="الإيميل">
                        <input type="text" required value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)}
                          className={INPUT_CLASS} placeholder="email@example.com" dir="ltr" />
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
                    <Field label="الإيميل">
                      <input name="identifier" type="text" required className={INPUT_CLASS} placeholder="email@example.com" dir="ltr" autoComplete="username" />
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
                  <p className="mt-3 text-center text-xs font-medium text-brand-muted">
                    يدخل لحسابك الموجود أو ينشئ حساباً جديداً عند الحاجة.
                  </p>
                </>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-brand-muted">
              منشأة جديدة؟{" "}
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
