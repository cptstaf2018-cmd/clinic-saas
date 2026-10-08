/** Pharmacy accounts see these instead of the clinic's appointments/patients sections. */
const PHARMACY_NAV = [
  {
    href: "/dashboard",
    label: "البيع",
    exact: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>,
  },
  {
    href: "/dashboard/pharmacy/products",
    label: "المنتجات والمخزون",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>,
  },
  {
    href: "/dashboard/pharmacy/sales",
    label: "الفواتير",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-1 .7-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  },
];

const LAB_NAV = [
  {
    href: "/dashboard",
    label: "لوحة المختبر",
    exact: true,
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 3h6M10 3v6.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.5 15h9"/></svg>,
  },
  {
    href: "/dashboard/lab/tests",
    label: "كتالوج التحاليل",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  },  {
    href: "/dashboard/lab/archive",
    label: "أرشيف النتائج",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/></svg>,
  },
];

/** Clinic sections that pharmacy and lab accounts keep. */
const SHARED_HREFS = new Set(["/dashboard/settings", "/dashboard/subscription", "/dashboard/support"]);

type NavItem = { href: string; label: string; exact?: boolean; icon: React.ReactNode };

/** Navigation for a facility type, or null for a clinic (which keeps its own full menu). */
export function facilityNav(facilityType: string | undefined, clinicNav: NavItem[]): NavItem[] | null {
  const own = facilityType === "pharmacy" ? PHARMACY_NAV : facilityType === "lab" ? LAB_NAV : null;
  return own ? [...own, ...clinicNav.filter((item) => SHARED_HREFS.has(item.href))] : null;
}
