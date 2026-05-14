"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/admin",
    label: "العيادات",
    description: "الحسابات والتشغيل",
    color: "bg-blue-500/20 text-blue-400",
    activeColor: "bg-blue-500 text-white shadow-blue-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    href: "/admin/payments",
    label: "المدفوعات",
    description: "الفواتير والتحصيل",
    color: "bg-emerald-500/20 text-emerald-400",
    activeColor: "bg-emerald-500 text-white shadow-emerald-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/admin/codes",
    label: "كودات التسجيل",
    description: "الدعوات والتفعيل",
    color: "bg-violet-500/20 text-violet-400",
    activeColor: "bg-violet-500 text-white shadow-violet-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M8 10h8" /><path d="M8 14h5" />
      </svg>
    ),
  },
  {
    href: "/admin/monitoring",
    label: "مراقبة النظام",
    description: "الأعطال والتنبيهات",
    color: "bg-amber-500/20 text-amber-400",
    activeColor: "bg-amber-500 text-white shadow-amber-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M3 3v18h18" /><path d="M7 15l3-3 3 2 5-7" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "الإعدادات",
    description: "هوية المنصة",
    color: "bg-slate-500/20 text-slate-400",
    activeColor: "bg-slate-500 text-white shadow-slate-500/30",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              active
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-lg transition-all ${
              active ? item.activeColor : item.color
            }`}>
              {item.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black">{item.label}</span>
              <span className={`mt-0.5 block text-[11px] font-bold ${active ? "text-slate-300" : "text-slate-500"}`}>
                {item.description}
              </span>
            </span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
          </Link>
        );
      })}
    </nav>
  );
}
