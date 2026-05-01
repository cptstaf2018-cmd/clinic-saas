import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getClinicData(clinicId: string) {
  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    include: { subscription: true },
  });
  return clinic;
}

function SubscriptionBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    trial: { label: "تجريبي", cls: "bg-yellow-100 text-yellow-800" },
    active: { label: "نشط", cls: "bg-green-100 text-green-800" },
    inactive: { label: "منتهي", cls: "bg-red-100 text-red-800" },
  };
  const { label, cls } = map[status] ?? map.inactive;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Prevent superadmin from accessing clinic dashboard
  if (session.user.role === "superadmin") redirect("/admin");

  const clinicId = session.user.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await getClinicData(clinicId);
  const clinicName = clinic?.name ?? "العيادة";
  const subStatus = clinic?.subscription?.status ?? "trial";

  const navItems = [
    { href: "/dashboard", label: "مواعيد اليوم" },
    { href: "/dashboard/patients", label: "المرضى" },
    { href: "/dashboard/working-hours", label: "أوقات العمل" },
    { href: "/dashboard/bot-settings", label: "إعدادات البوت" },
    { href: "/dashboard/subscription", label: "الاشتراك" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Mobile top bar */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-gray-800 text-lg">{clinicName}</span>
        <SubscriptionBadge status={subStatus} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-60 bg-white border-l border-gray-200 min-h-screen sticky top-0 h-screen">
          <div className="p-5 border-b border-gray-100">
            <p className="text-xs text-gray-400 mb-1">عيادتي</p>
            <p className="font-bold text-gray-800 text-base leading-tight">
              {clinicName}
            </p>
            <div className="mt-2">
              <SubscriptionBadge status={subStatus} />
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="w-full text-right px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
              >
                تسجيل الخروج
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex z-10">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-3 text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            {item.label}
          </Link>
        ))}
        <form
          className="flex-1"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full h-full flex flex-col items-center justify-center py-3 text-xs text-red-500"
          >
            خروج
          </button>
        </form>
      </nav>
    </div>
  );
}
