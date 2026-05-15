import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getAssistantAccess } from "@/lib/assistant-access";
import DashboardAssistantFloating from "./DashboardAssistantFloating";
import DashboardShell from "./DashboardShell";

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

  const name      = clinic?.name ?? "العيادة";
  const subStatus = clinic?.subscription?.status ?? "trial";
  const badge     = STATUS_BADGE[subStatus] ?? STATUS_BADGE.inactive;
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
    <DashboardShell
      clinicName={name}
      logoUrl={clinic?.logoUrl ?? null}
      badgeLabel={badge.label}
      badgeCls={badge.cls}
      signOutForm={signOutForm}
      assistantFloating={<DashboardAssistantFloating initialAccess={assistantAccess} />}
    >
      {children}
    </DashboardShell>
  );
}
