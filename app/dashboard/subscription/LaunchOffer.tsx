import Link from "next/link";
import { FREE_PERIOD_END, FREE_PERIOD_LABEL, freePeriodDaysLeft } from "@/lib/free-period";

const POINTS = [
  { title: "كل المزايا مفتوحة", text: "تستخدم النظام بكامل إمكانياته دون أي قيد أو باقة محدودة." },
  { title: "بياناتك محفوظة دائماً", text: "كل ما تدخله يبقى لك ومتاحاً في أي وقت، قبل العرض وبعده." },
  { title: "لن يتوقف عملك فجأة", text: "نبلغك قبل نهاية العرض بوقت كافٍ، ونعرض عليك ما يناسب حجم عملك." },
] as const;

/**
 * Shown in place of the payment screen while the launch offer is open.
 * The real subscription page stays in the code and returns on its own after the end date.
 */
export default function LaunchOffer() {
  const daysLeft = freePeriodDaysLeft();
  const endDate = FREE_PERIOD_END.toLocaleDateString("ar-IQ", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baghdad" });

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-brand-navy p-7 text-white md:p-10">
          <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full border-[48px] border-white/[0.05]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-28 right-10 h-64 w-64 rounded-full border-[48px] border-brand-gold/[0.10]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-gold/15 px-3.5 py-1.5 text-xs font-semibold text-brand-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
              عرض الإطلاق
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
              النظام مجاني لك
              <br />
              <span className="text-brand-gold">حتى نهاية ٢٠٢٦.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-brand-side-muted">
              نطلق معك الهلال الذهبي، ونريدك أن تعمل به أولاً وتتعوّد عليه في عملك اليومي. لا بطاقة ائتمان، ولا باقات، ولا أي دفع الآن.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="rounded-2xl bg-white/10 px-5 py-3 text-sm">
                ينتهي العرض في <b className="text-white">{endDate}</b>
              </span>
              <span className="rounded-2xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-gold-ink">باقي {daysLeft.toLocaleString("ar-IQ")} يوماً</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3" aria-label="ما يعنيه العرض لك">
          {POINTS.map((point) => (
            <div key={point.title} className="rounded-3xl border border-brand-border bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gold text-sm font-bold text-brand-gold-ink">✓</span>
              <h2 className="mt-4 text-lg font-bold text-brand-ink">{point.title}</h2>
              <p className="mt-1.5 text-sm leading-7 text-brand-muted">{point.text}</p>
            </div>
          ))}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-brand-border bg-white p-6">
          <div>
            <p className="font-bold text-brand-ink">{FREE_PERIOD_LABEL}</p>
            <p className="mt-1 text-sm text-brand-muted">عندك سؤال أو اقتراح؟ رأيك هو ما يصنع النظام الذي تريده.</p>
          </div>
          <Link href="/dashboard/support" className="flex min-h-12 items-center rounded-2xl bg-brand-gold px-6 font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover">
            تواصل مع الدعم
          </Link>
        </section>
      </div>
    </div>
  );
}
