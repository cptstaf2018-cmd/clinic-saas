import { FREE_PERIOD_LABEL } from "@/lib/free-period";
import Link from "next/link";
import AuthBrandPanel from "@/components/AuthBrandPanel";
import BrandLogo from "@/components/BrandLogo";
import GoogleButton from "../login/GoogleButton";

const BENEFITS = [
  "بدون كلمة مرور جديدة تحفظها",
  `${FREE_PERIOD_LABEL}، بكل المزايا`,
  "تختار نوع منشأتك بعد الدخول مباشرة",
] as const;

/** Sign-up is Google only: one tap, nothing to type, no codes to wait for. */
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-brand-bg" dir="rtl">
      <AuthBrandPanel variant="register" />

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between bg-brand-navy px-5 py-4 lg:hidden">
          <BrandLogo tone="dark" size={34} stacked={false} />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-side-muted">{FREE_PERIOD_LABEL}</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 lg:px-10">
          <div className="w-full max-w-[440px]">
            <h2 className="text-3xl font-bold text-brand-ink">ابدأ مجاناً</h2>
            <p className="mt-2 text-sm text-brand-muted">لعيادتك أو مختبرك أو صيدليتك. دقيقتان وتبدأ العمل.</p>

            <div className="mt-8">
              <GoogleButton divider={false} size="large" />
              <p className="mt-3 text-center text-xs font-medium text-brand-muted">
                إذا لم يكن لديك حساب، سننشئه تلقائياً عند المتابعة.
              </p>
            </div>

            <ul className="mt-8 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm font-medium text-brand-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-brand-gold-ink">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            <p className="mt-10 text-center text-sm text-brand-muted">
              لديك حساب؟{" "}
              <Link href="/login" className="font-bold text-brand-blue hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
