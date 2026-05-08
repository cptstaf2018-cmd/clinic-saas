import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SupportClient from "./SupportClient";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user?.clinicId) redirect("/login");
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">الدعم والصيانة</h1>
        <p className="text-sm text-gray-400 mt-0.5">فحص حالة النظام وإصلاح المشاكل بضغطة واحدة</p>
      </div>

      {/* Contact card */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #0c1f3f 0%, #1e3a8a 100%)", boxShadow: "0 8px 32px rgba(12,31,63,0.25)" }}>
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-6 h-6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">تواصل مع فريق الدعم</p>
          <p className="text-blue-200/70 text-xs mt-0.5">متاح على واتساب 24/7</p>
        </div>
        <a href="https://wa.me/9647706688044" target="_blank" rel="noreferrer"
          className="text-xs font-bold px-4 py-2.5 rounded-xl transition-all bg-white text-blue-900 hover:bg-blue-50 shrink-0">
          تواصل معنا
        </a>
      </div>

      <SupportClient />
    </div>
  );
}
