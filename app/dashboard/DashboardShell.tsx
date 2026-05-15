"use client";

import { useState } from "react";
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

interface Props {
  clinicName: string;
  logoUrl: string | null;
  badgeLabel: string;
  badgeCls: string;
  signOutForm: React.ReactNode;
  assistantFloating: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardShell({
  clinicName, logoUrl, badgeLabel, badgeCls,
  signOutForm, assistantFloating, children,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const SidebarContent = () => (
    <div className="flex min-h-full flex-col rounded-none md:rounded-[28px] bg-gradient-to-b from-[#0f766e] via-[#2563eb] to-[#1d4ed8] overflow-hidden h-full">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={clinicName} className="w-11 h-11 object-contain rounded-2xl shrink-0 bg-white/95 p-1" />
          ) : (
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
              <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5">
                <rect x="15" y="4" width="10" height="32" rx="2" fill="#065f46"/>
                <rect x="4" y="15" width="32" height="10" rx="2" fill="#2563eb"/>
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-black text-base leading-tight truncate">{clinicName}</p>
            <p className="text-blue-100/60 text-xs mt-1">لوحة تشغيل العيادة</p>
            <span className={`inline-flex mt-2 text-[10px] font-semibold border rounded-full px-2 py-0.5 ${badgeCls}`}>
              {badgeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
              <span className={`transition-colors duration-200 ${active ? "text-blue-300" : "text-blue-300/60 group-hover:text-blue-300"}`}>
                {item.icon}
              </span>
              {item.label}
              {active && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        {signOutForm}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#eef7f4]" dir="rtl">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 min-h-screen sticky top-0 h-screen shrink-0 p-4">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 md:hidden transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute left-3 top-3 z-10 rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Mobile Header */}
        <header className="md:hidden bg-[#0C1F3F] px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>

            {/* Logo + Name */}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={clinicName} className="w-7 h-7 object-contain rounded-lg shrink-0" />
            ) : (
              <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center shrink-0">
                <svg viewBox="0 0 40 40" fill="none" className="w-4 h-4">
                  <rect x="15" y="4" width="10" height="32" rx="2" fill="white"/>
                  <rect x="4" y="15" width="32" height="10" rx="2" fill="white"/>
                </svg>
              </div>
            )}
            <span className="text-white font-bold text-sm truncate max-w-[150px]">{clinicName}</span>
          </div>

          <span className={`text-[10px] font-bold border rounded-full px-2.5 py-1 ${badgeCls}`}>
            {badgeLabel}
          </span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-6">
          {children}
        </main>

        {assistantFloating}
      </div>
    </div>
  );
}
