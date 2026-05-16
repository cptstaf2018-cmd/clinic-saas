import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardNav from "./DashboardNav";
import { getAssistantAccess } from "@/lib/assistant-access";
import DashboardAssistantFloating from "./DashboardAssistantFloating";
import MobileDrawer from "./MobileDrawer";

async function getClinicData(clinicId: string) {
  return db.clinic.findUnique({
    where: { id: clinicId },
    include: { subscription: true },
  });
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  trial:    { label: "تجريبي", cls: "bg-amber-400/20 text-amber-300 border-amber-400/30" },
  active:   { label: "نشط",    cls: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30" },
  inactive: { label: "منتهي",  cls: "bg-red-400/20 text-red-300 border-red-400/30" },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "superadmin") redirect("/admin");
  const clinicId = session.user.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await getClinicData(clinicId);
  if (clinic?.specialtyOnboardingRequired && !clinic.specialty) {
    redirect("/onboarding/specialty");
  }

  if (clinic?.subscription?.status === "inactive") {
    redirect("/subscription-expired");
  }

  const name = clinic?.name ?? "العيادة";
  const subStatus = clinic?.subscription?.status ?? "trial";
  const badge = STATUS_BADGE[subStatus] ?? STATUS_BADGE.inactive;
  const assistantAccess = await getAssistantAccess(clinicId, clinic?.subscription ?? null, false);

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
    <div className="min-h-screen flex bg-[#eef7f4]" dir="rtl">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 min-h-screen sticky top-0 h-screen shrink-0 p-4">
        <div className="flex min-h-full flex-col rounded-[28px] bg-gradient-to-b from-[#0f766e] via-[#2563eb] to-[#1d4ed8] shadow-[0_20px_50px_rgba(37,99,235,0.18)] overflow-hidden">

          {/* Logo */}
          <div className="px-5 py-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              {clinic?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={clinic.logoUrl} alt={name} className="w-11 h-11 object-contain rounded-2xl shrink-0 bg-white/95 p-1" />
              ) : (
                <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-950/20">
                  <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5">
                    <rect x="15" y="4" width="10" height="32" rx="2" fill="#065f46"/>
                    <rect x="4" y="15" width="32" height="10" rx="2" fill="#2563eb"/>
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white font-black text-base leading-tight truncate">{name}</p>
                <p className="text-blue-100/60 text-xs mt-1">لوحة تشغيل العيادة</p>
                <span className={`inline-flex mt-2 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <DashboardNav />

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/10">
            {signOutForm}
          </div>
        </div>
      </aside>

      {/* ── Mobile ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile Header */}
        <header className="md:hidden bg-[#0C1F3F] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
          <div className="flex items-center gap-2">

            {/* زر ☰ + الدرج */}
            <MobileDrawer signOutForm={signOutForm} />

            {clinic?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinic.logoUrl} alt={name} className="w-8 h-8 object-contain rounded-lg shrink-0" />
            ) : (
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 40 40" fill="none" className="w-4 h-4">
                  <rect x="15" y="4" width="10" height="32" rx="2" fill="white"/>
                  <rect x="4" y="15" width="32" height="10" rx="2" fill="white"/>
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
          {children}
        </main>
        <DashboardAssistantFloating initialAccess={assistantAccess} />
      </div>
    </div>
  );
}
