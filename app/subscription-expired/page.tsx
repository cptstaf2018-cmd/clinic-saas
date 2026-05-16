"use client";

import { signOut } from "next-auth/react";

export default function SubscriptionExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF2F9] px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-6">

        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-[#0C1F3F]">انتهى اشتراكك</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            تم إيقاف حسابك مؤقتاً بسبب انتهاء الاشتراك.
            بياناتك محفوظة بالكامل.
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-[#0C1F3F]">لتجديد اشتراكك</p>
          <p className="text-xs text-gray-500">تواصل معنا عبر واتساب وسنفعّل حسابك فوراً</p>
          <a
            href="https://wa.me/9647806688044"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 px-5 rounded-xl text-sm transition w-full"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.529 5.843L.057 23.571l5.9-1.548A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.359-.214-3.502.919.935-3.416-.234-.371A9.818 9.818 0 1 1 12 21.818z"/>
            </svg>
            تواصل معنا على واتساب
          </a>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
        >
          تسجيل الخروج
        </button>

      </div>
    </div>
  );
}
