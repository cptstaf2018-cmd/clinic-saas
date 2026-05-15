import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") redirect("/login");

  const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
  const logoUrl = settings?.logoUrl ?? null;
  const userEmail = session.user?.email ?? "Super Admin";

  const signOutForm = (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
      <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-rose-50 hover:text-rose-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        تسجيل الخروج
      </button>
    </form>
  );

  return (
    <AdminShell logoUrl={logoUrl} userEmail={userEmail} signOutForm={signOutForm}>
      {children}
    </AdminShell>
  );
}
