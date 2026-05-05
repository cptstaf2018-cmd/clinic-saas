import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الدعم والصيانة</h1>
        <p className="text-sm text-gray-500 mt-1">
          فحص حالة النظام وإصلاح المشاكل الشائعة بضغطة واحدة
        </p>
      </div>
      <SupportClient />
    </div>
  );
}
