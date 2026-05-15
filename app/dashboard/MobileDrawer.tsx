"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "الرئيسية", exact: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2" fill="currentColor" stroke="none"/></svg> },
  { href: "/dashboard/appointments", label: "الحجوزات", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="13" y2="18"/></svg> },
  { href: "/dashboard/patients", label: "المراجعين", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="19" cy="11" r="2"/><path d="M23 21v-1a2 2 0 0 0-2-2h-1"/></svg> },
  { href: "/dashboard/messages", label: "الرسائل", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { href: "/dashboard/reports", label: "التقارير", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 3v18h18"/><path d="M7 14l3-3 3 2 5-6"/></svg> },
  { href: "/dashboard/working-hours", label: "أوقات العمل", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg> },
  { href: "/dashboard/settings", label: "الإعدادات", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { href: "/dashboard/subscription", label: "الاشتراك", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { href: "/dashboard/support", label: "الدعم", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
];

export function HamburgerButton() {
  return null; // placeholder — state managed in MobileDrawer
}

export default function MobileDrawer({ signOutForm }: { signOutForm: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const drawer = (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* الدرج */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 flex flex-col bg-gradient-to-b from-[#0f766e] via-[#2563eb] to-[#1d4ed8] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* زر الإغلاق */}
        <button
          onClick={() => setOpen(false)}
          className="absolute left-3 top-3 rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* القائمة */}
        <nav className="flex-1 px-3 pt-14 pb-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active ? "bg-white/12 text-white" : "text-blue-100/70 hover:text-white hover:bg-white/8"
                }`}
              >
                <span className={`transition-colors ${active ? "text-blue-300" : "text-blue-300/60 group-hover:text-blue-300"}`}>
                  {item.icon}
                </span>
                {item.label}
                {active && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* تسجيل الخروج */}
        <div className="px-3 py-4 border-t border-white/10">
          {signOutForm}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* زر ☰ */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="القائمة"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
