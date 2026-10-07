import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardNav from "./DashboardNav";
import { getAssistantAccess } from "@/lib/assistant-access";
import DashboardAssistantFloating from "./DashboardAssistantFloating";
import MobileDrawer from "./MobileDrawer";
import SubscriptionNotice from "./SubscriptionNotice";
import { getSubscriptionNotice, isSubscriptionHardLocked, subscriptionDaysLeft } from "@/lib/subscription-status";
import { PLAN_LABELS, isPlanId } from "@/lib/plans";
import Link from "next/link";
import OfflineStatus from "./OfflineStatus";

async function getClinicData(clinicId: string) {
  return db.clinic.findUnique({
    where: { id: clinicId },
    include: { subscription: true },
  });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  trial:    { label: "تجريبي", cls: "bg-amber-400/20 text-amber-200 border-amber-400/30" },
  active:   { label: "نشط",    cls: "bg-brand-mint/15 text-brand-mint border-brand-mint/30" },
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
  const subscriptionNotice = getSubscriptionNotice(clinic?.subscription ?? null);
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
            <div className="flex items-center gap-3">
              {clinic?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinic.logoUrl} alt={name} className="w-11 h-11 object-contain rounded-2xl shrink-0 bg-white/95 p-1" />
              ) : (
                <div className="w-11 h-11 bg-brand-mint rounded-2xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="w-5 h-5 text-brand-mint-ink">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-bold text-base leading-tight truncate">{name}</p>
                <p className="text-brand-side-muted text-xs mt-1">Clinic AI Pro</p>
                <span className={`inline-flex mt-2 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <DashboardNav role={session.user.role} />

          {/* Subscription card */}
          <div className="mx-3 mb-3 rounded-2xl border border-brand-navy-line bg-brand-navy-3 p-4">
            {isTrial ? (
              <>
                <p className="text-xs text-brand-side-muted">الفترة التجريبية المجانية</p>
                <p className="mt-1 text-xl font-bold text-white">باقي {daysLeft} {daysLeft === 1 ? "يوم" : "أيام"}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-navy">
                  <div className="h-1.5 rounded-full bg-brand-mint" style={{ width: `${trialProgress}%` }} />
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
              className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-brand-mint text-sm font-bold text-brand-mint-ink transition hover:-translate-y-0.5 hover:bg-brand-mint-hover"
            >
              {isTrial ? "اشترك الآن" : "إدارة الاشتراك"}
            </Link>
          </div>

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
            <MobileDrawer signOutForm={signOutForm} role={session.user.role} />

            {clinic?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinic.logoUrl} alt={name} className="w-8 h-8 object-contain rounded-lg shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-brand-mint rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" className="w-4 h-4 text-brand-mint-ink">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
            )}
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
