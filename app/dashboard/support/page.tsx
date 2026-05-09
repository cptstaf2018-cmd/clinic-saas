import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-7">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black text-blue-700">صيانة وتشخيص</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">الدعم</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                افحص حالة النظام وشغّل الإصلاحات السريعة من مكان واحد بدون تعقيد.
              </p>
            </div>
            <a
              href="https://wa.me/9647706688044"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              تواصل مع الدعم
            </a>
          </div>
        </section>

        <SupportClient />
      </div>
    </div>
  );
}
