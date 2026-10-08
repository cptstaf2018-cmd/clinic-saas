import BrandLogo from "@/components/BrandLogo";
import { FacilityArt } from "@/components/FacilityArt";

const FACILITIES = [
  { type: "clinic", name: "عيادة", line: "مواعيد ومراجعون وسجلات طبية" },
  { type: "lab", name: "مختبر", line: "نتائج تصل المراجع على واتساب" },
  { type: "pharmacy", name: "صيدلية", line: "بيع ومخزون وأرباح يومية" },
] as const;

const STEPS = [
  { title: "سجّل بحساب Google", desc: "ضغطة واحدة، بدون كلمة مرور ولا رموز تحقق." },
  { title: "اختر نوع منشأتك", desc: "عيادة بكل الاختصاصات، أو مختبر، أو صيدلية." },
  { title: "جهّز بياناتك", desc: "اختصاص العيادة، أو تحاليل المختبر، أو أدوية الصيدلية." },
  { title: "ابدأ العمل", desc: "١٤ يوماً تجربة مجانية كاملة، بدون بطاقة ائتمان." },
] as const;

/** The navy side of the sign-in and sign-up pages. It speaks for clinics, labs and pharmacies alike. */
export default function AuthBrandPanel({ variant }: { variant: "login" | "register" }) {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-navy p-10 text-white lg:flex lg:w-[54%] xl:p-14">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full border-[56px] border-white/[0.04]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 h-[26rem] w-[26rem] rounded-full border-[56px] border-brand-gold/[0.08]" />

      <div className="relative">
        <BrandLogo tone="dark" size={72} />
      </div>

      <div className="relative space-y-9">
        <div>
          <h1 className="text-4xl font-bold leading-[1.25] xl:text-5xl">
            {variant === "login" ? "منشأتك الطبية" : "من التسجيل إلى"}
            <br />
            <span className="text-brand-gold">{variant === "login" ? "في نظام واحد ذكي." : "أول يوم عمل، في دقائق."}</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-side-muted">
            {variant === "login"
              ? "عيادة أو مختبر أو صيدلية: كل ما تحتاجه لإدارة عملك ومراجعيك من مكان واحد، وعلى واتساب الذي يستخدمونه أصلاً."
              : "لا حاجة لتحميل شيء ولا لحفظ كلمة مرور جديدة. سجّل بحساب Google وجهّز منشأتك."}
          </p>
        </div>

        {variant === "login" ? (
          <ul className="grid grid-cols-3 gap-4">
            {FACILITIES.map((facility) => (
              <li key={facility.type} className="rounded-3xl border border-white/10 bg-white/[0.06] p-3">
                <span className="relative block h-28 overflow-hidden rounded-2xl bg-gradient-to-b from-[#EAF1FD] to-[#F7F1E1]">
                  <span className="relative mx-auto block h-full w-36">
                    <FacilityArt type={facility.type} />
                  </span>
                </span>
                <p className="mt-3 text-lg font-bold">{facility.name}</p>
                <p className="mt-0.5 text-xs leading-5 text-brand-side-muted">{facility.line}</p>
              </li>
            ))}
          </ul>
        ) : (
          <ol className="relative space-y-5">
            <span aria-hidden className="absolute bottom-3 right-[15px] top-3 w-px bg-brand-navy-line" />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-4">
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? "bg-brand-gold text-brand-gold-ink" : "border border-brand-navy-line bg-brand-navy-3 text-brand-side-muted"
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
        )}
      </div>

      <p className="relative text-sm text-brand-side-muted">١٤ يوماً تجربة مجانية كاملة · بدون بطاقة ائتمان</p>
    </div>
  );
}
