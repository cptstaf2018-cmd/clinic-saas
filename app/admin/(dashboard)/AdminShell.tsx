"use client";

import { useState } from "react";
import AdminNav from "./AdminNav";

interface Props {
  logoUrl: string | null;
  userEmail: string;
  children: React.ReactNode;
  signOutForm: React.ReactNode;
}

export default function AdminShell({ logoUrl, userEmail, children, signOutForm }: Props) {
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="الشعار" className="h-11 w-11 shrink-0 rounded-lg object-contain ring-1 ring-slate-200" />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-5 w-5">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-950">Ayadti Cloud</p>
            <p className="mt-0.5 text-[11px] font-bold text-slate-400">Super Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Workspace</p>
        <AdminNav onNavigate={() => setOpen(false)} />
      </div>

      {/* Status + Logout */}
      <div className="space-y-3 border-t border-slate-200 px-3 py-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black text-emerald-800">Production</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
          </div>
          <p className="mt-1 text-[11px] font-bold text-emerald-700/75">VPS متصل وشهادة HTTPS فعالة</p>
        </div>
        {signOutForm}
      </div>
    </>
  );

  return (
    <div dir="rtl" className="flex min-h-screen bg-[#EEF3F8] text-slate-950">

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-l border-slate-200 bg-white/95 shadow-[0_20px_80px_rgba(15,23,42,0.06)] md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute left-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-auto bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF3F8_38%,#F6F8FB_100%)]">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-7">
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
                aria-label="القائمة"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Platform Command</p>
                <h1 className="mt-1 truncate text-lg font-black text-slate-950">مركز تشغيل المنصة</h1>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left sm:block" dir="ltr">
                <p className="truncate text-xs font-black text-slate-700">{userEmail}</p>
                <p className="text-[10px] font-bold text-slate-400">Super Admin</p>
              </div>
              <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm">Secure</span>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-5 lg:p-7">{children}</div>
      </main>
    </div>
  );
}
