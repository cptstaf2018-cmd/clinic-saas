import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getClinicData(clinicId: string) {
  return db.clinic.findUnique({
    where: { id: clinicId },
    include: { subscription: true },
  });
}

const NAV = [
  {
    href: "/dashboard",
    label: "اليوم",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/appointments",
    label: "الحجوزات",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="13" y2="18"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/patients",
    label: "المرضى",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="11" r="2"/><path d="M23 21v-1a2 2 0 0 0-2-2h-1"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/working-hours",
    label: "أوقات العمل",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "الإعدادات",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/subscription",
    label: "الاشتراك",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  trial:    { label: "تجريبي", cls: "bg-amber-400/20 text-amber-300 border-amber-400/30" },
  active:   { label: "نشط",    cls: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30" },
  inactive: { label: "منتهي",  cls: "bg-red-400/20 text-red-300 border-red-400/30" },
};

// Mobile icons only (compact)
const MOBILE_NAV = NAV.slice(0, 5);

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "superadmin") redirect("/admin");
  const clinicId = session.user.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await getClinicData(clinicId);
  const name = clinic?.name ?? "العيادة";
  const subStatus = clinic?.subscription?.status ?? "trial";
  const badge = STATUS_BADGE[subStatus] ?? STATUS_BADGE.inactive;

  return (
    <div className="min-h-screen flex bg-[#EEF2F9]" dir="rtl">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0C1F3F] min-h-screen sticky top-0 h-screen shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/40">
              <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5">
                <rect x="15" y="4" width="10" height="32" rx="2" fill="white"/>
                <rect x="4" y="15" width="32" height="10" rx="2" fill="white"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{name}</p>
              <span className={`text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-100/70 hover:text-white hover:bg-white/8 transition-all text-sm font-medium group"
            >
              <span className="text-blue-300/70 group-hover:text-blue-300 transition-colors">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-300/70 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden bg-[#0C1F3F] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" className="w-4 h-4">
                <rect x="15" y="4" width="10" height="32" rx="2" fill="white"/>
                <rect x="4" y="15" width="32" height="10" rx="2" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-bold text-sm truncate max-w-[160px]">{name}</span>
          </div>
          <span className={`text-[10px] font-bold border rounded-full px-2.5 py-1 ${badge.cls}`}>
            {badge.label}
          </span>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0C1F3F] border-t border-white/10 flex z-20">
          {MOBILE_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-blue-200/60 hover:text-blue-300 transition-colors gap-1"
            >
              <span className="[&_svg]:w-5 [&_svg]:h-5">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          <form className="flex-1" action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="w-full h-full flex flex-col items-center justify-center py-2.5 text-red-300/60 hover:text-red-300 transition-colors gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="text-[10px] font-medium">خروج</span>
            </button>
          </form>
        </nav>
      </div>
    </div>
  );
}
