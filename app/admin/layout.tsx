import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    redirect("/login");
  }

  return (
    <div dir="rtl" className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col py-8 px-4 gap-2 shrink-0">
        <p className="text-lg font-bold mb-6 text-center text-yellow-400">
          لوحة الإدارة
        </p>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          العيادات
        </Link>
        <Link
          href="/admin/payments"
          className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          المدفوعات
        </Link>
        <form action="/api/auth/signout" method="POST" className="mt-auto">
          <button
            type="submit"
            className="w-full text-right px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-red-400 hover:text-white"
          >
            تسجيل الخروج
          </button>
        </form>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
