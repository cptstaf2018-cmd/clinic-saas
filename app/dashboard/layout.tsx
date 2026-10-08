import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardNav from "./DashboardNav";
import { getAssistantAccess } from "@/lib/assistant-access";
import DashboardAssistantFloating from "./DashboardAssistantFloating";
import MobileDrawer from "./MobileDrawer";
import SubscriptionNotice from "./SubscriptionNotice";
import { FREE_PERIOD_END, FREE_PERIOD_LABEL, isFreePeriodOpen } from "@/lib/free-period";
import { getSubscriptionNotice, isSubscriptionHardLocked, subscriptionDaysLeft } from "@/lib/subscription-status";
import { PLAN_LABELS, isPlanId } from "@/lib/plans";
import Link from "next/link";
import OfflineStatus from "./OfflineStatus";
import BrandLogo, { BrandMark } from "@/components/BrandLogo";

async function getClinicData(clinicId: string) {
  return db.clinic.findUnique({
    where: { id: clinicId },
    include: { subscription: true },
  });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  trial:    { label: "تجريبي", cls: "bg-amber-400/20 text-amber-200 border-amber-400/30" },
  active:   { label: "نشط",    cls: "bg-emerald-300/15 text-emerald-300 border-emerald-300/30" },
  inactive: { label: "منتهي",  cls: "bg-red-400/20 text-red-300 border-red-400/30" },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "superadmin") redirect("/admin");
  const clinicId = session.user.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await getClinicData(clinicId);
  if (!clinic) redirect("/login");
  if (clinic.specialtyOnboardingRequired && !clinic.specialty) {
    redirect("/onboarding/specialty");
  }

  if (isSubscriptionHardLocked(clinic?.subscription ?? null)) {
    redirect("/subscription-expired");
  }

  const name = clinic?.name ?? "العيادة";
  const subStatus = clinic?.subscription?.status ?? "trial";
  const badge = STATUS_BADGE[subStatus] ?? STATUS_BADGE.inactive;
  const assistantAccess = await getAssistantAccess(clinicId, clinic?.subscription ?? null, false);
  // Launch offer: no payment screens, prices or expiry warnings are shown while everything is free.
  const freePeriod = isFreePeriodOpen();
  const subscriptionNotice = freePeriod ? null : getSubscriptionNotice(clinic?.subscription ?? null);
  const daysLeft = Math.max(0, subscriptionDaysLeft(clinic?.subscription ?? null));
  const isTrial = subStatus === "trial";
  const trialProgress = isTrial ? Math.min(100, Math.max(4, Math.round(((14 - daysLeft) / 14) * 100))) : 0;
  const planId = clinic?.subscription?.plan;
  const planLabel = planId && isPlanId(planId) ? PLAN_LABELS[planId] : PLAN_LABELS.trial;

  const signOutForm = (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        تسجيل الخروج
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex bg-brand-bg" dir="rtl">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 min-h-screen sticky top-0 h-screen shrink-0 p-4">
        <div className="flex min-h-full flex-col rounded-[28px] bg-brand-navy shadow-[0_24px_60px_-20px_rgba(14,36,64,0.55)] overflow-y-auto">

          {/* Logo */}
          <div className="px-5 py-6 border-b border-white/10">
            {/* The platform brand is always visible; the facility's own logo and name sit under it */}
            <BrandLogo tone="dark" size={40} stacked={false} />
            <div className="mt-5 flex items-center gap-3">
              {clinic?.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinic.logoUrl} alt={name} className="w-11 h-11 object-contain rounded-2xl shrink-0 bg-white/95 p-1" />
              )}
              <div className="min-w-0">
                <p className="text-white font-bold text-base leading-tight truncate">{name}</p>
                <span className={`inline-flex mt-2 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <DashboardNav role={session.user.role} facilityType={clinic.facilityType} />

          {/* Subscription card, or the launch offer while everything is free */}
          {freePeriod ? (
            <div className="mx-3 mb-3 rounded-2xl border border-brand-navy-line bg-brand-navy-3 p-4">
              <p className="text-xs text-brand-gold">عرض الإطلاق</p>
              <p className="mt-1 text-lg font-bold text-white">{FREE_PERIOD_LABEL}</p>
              <p className="mt-1 text-xs leading-6 text-brand-side-muted">
                كل المزايا مفتوحة حتى {FREE_PERIOD_END.toLocaleDateString("ar-IQ", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baghdad" })}.
              </p>
              <Link href="/dashboard/subscription" className="mt-3 flex min-h-10 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-white transition hover:bg-white/15">تفاصيل العرض</Link>
            </div>
          ) : (
            <>
          <div className="mx-3 mb-3 rounded-2xl border border-brand-navy-line bg-brand-navy-3 p-4">
            {isTrial ? (
              <>
                <p className="text-xs text-brand-side-muted">الفترة التجريبية المجانية</p>
                <p className="mt-1 text-xl font-bold text-white">باقي {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-navy">
                  <div className="h-1.5 rounded-full bg-brand-gold" style={{ width: `${trialProgress}%` }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-brand-side-muted">باقتك الحالية</p>
                <p className="mt-1 text-lg font-bold text-white">{planLabel}</p>
                <p className="mt-1 text-xs text-brand-side-muted">متبقي {daysLeft} يوم</p>
              </>
            )}
            <Link
              href="/dashboard/subscription"
              className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-brand-gold text-sm font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover"
            >
              {isTrial ? "اشترك الآن" : "إدارة الاشتراك"}
            </Link>
          </div>

            </>
          )}

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/10">
            {signOutForm}
          </div>
        </div>
      </aside>

      {/* ── Mobile ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile Header */}
        <header className="md:hidden bg-brand-navy px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
          <div className="flex items-center gap-2">

            {/* زر ☰ + الدرج */}
            <MobileDrawer signOutForm={signOutForm} role={session.user.role} facilityType={clinic.facilityType} />

            <BrandMark size={32} />
            <span className="text-white font-bold text-sm truncate max-w-[140px]">{name}</span>
          </div>

          <span className={`text-[10px] font-bold border rounded-full px-2.5 py-1 ${badge.cls}`}>
            {badge.label}
          </span>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto pb-6">
          <SubscriptionNotice notice={subscriptionNotice} />
          {children}
        </main>
        <OfflineStatus />
        <DashboardAssistantFloating initialAccess={assistantAccess} />
      </div>
    </div>
  );
}
