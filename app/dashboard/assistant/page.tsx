import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getAssistantAccess } from "@/lib/assistant-access";
import AssistantClient from "./AssistantClient";

export default async function AssistantPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  const subscription = await db.subscription.findUnique({
    where: { clinicId: session.user.clinicId },
  });
  const access = await getAssistantAccess(session.user.clinicId, subscription, false);

  return (
    <div className="p-4 md:p-8 bg-[#eef7f4]" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-7">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <p className="text-sm font-black text-blue-700">مساعد استخدام التطبيق</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">مساعد العيادة الإرشادي</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
            اسأل عن طريقة استخدام النظام. المساعد لا يقرأ بيانات المرضى ولا يغير أي إعدادات.
          </p>
        </section>

        <AssistantClient initialAccess={access} />
      </div>
    </div>
  );
}
