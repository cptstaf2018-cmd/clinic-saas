"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AdminNav from "./AdminNav";

export default function AdminMobileDrawer({
  logoUrl,
  userEmail,
  signOutForm,
}: {
  logoUrl: string | null;
  userEmail: string;
  signOutForm: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const drawer = (
    <div dir="rtl" className="md:hidden">
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* الدرج — نفس تصميم الـ Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-[9999] flex w-72 flex-col bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* زر الإغلاق */}
        <button
          onClick={() => setOpen(false)}
          className="absolute left-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Logo */}
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="الشعار" className="h-11 w-11 shrink-0 rounded-xl object-contain ring-1 ring-white/20" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-5 w-5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">Ayadti Cloud</p>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">Super Admin Console</p>
            </div>
          </div>
        </div>

        {/* User badge */}
        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
              {userEmail[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-white">{userEmail}</p>
              <p className="text-[10px] font-bold text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <AdminNav onNavigate={() => setOpen(false)} />
        </div>

        {/* Status + Logout */}
        <div className="space-y-2 border-t border-white/10 px-3 py-4">
          <div className="rounded-xl bg-emerald-500/10 px-3 py-2.5 ring-1 ring-emerald-500/20">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black text-emerald-400">Production</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
            </div>
            <p className="mt-0.5 text-[11px] font-bold text-emerald-500/70">VPS متصل وشهادة HTTPS فعالة</p>
          </div>
          {signOutForm}
        </div>
      </aside>
    </div>
  );

  return (
    <>
      {/* زر ☰ */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
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
