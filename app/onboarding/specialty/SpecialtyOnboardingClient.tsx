"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { MEDICAL_SPECIALTIES } from "@/lib/medical-specialties";
import type { MedicalSpecialtyKey } from "@/lib/medical-specialties";

const FILTERS = ["الكل", "الأكثر استخداماً", "اختصاصات سريرية", "إجراءات ومراكز", "عام"] as const;

type SpecialtyIconProps = {
  specialty: MedicalSpecialtyKey;
  active?: boolean;
  className?: string;
};

const filterIcons: Record<(typeof FILTERS)[number], string> = {
  "الكل": "grid",
  "الأكثر استخداماً": "user",
  "اختصاصات سريرية": "brain",
  "إجراءات ومراكز": "clipboard",
  "عام": "shield",
};

const specialtyIconSrc: Record<MedicalSpecialtyKey, string> = {
  general_medicine: "/specialty-icons-v2/general-medicine.png",
  dentistry: "/specialty-icons-v2/dentistry.png",
  gynecology: "/specialty-icons-v2/gynecology.png",
  pediatrics: "/specialty-icons-v2/pediatrics.png",
  dermatology: "/specialty-icons-v2/dermatology.png",
  aesthetic: "/specialty-icons-v2/aesthetic.png",
  cardiology: "/specialty-icons-v2/cardiology.png",
  ophthalmology: "/specialty-icons-v2/ophthalmology.png",
  orthopedics: "/specialty-icons-v2/orthopedics.png",
  internal_medicine: "/specialty-icons-v2/internal-medicine.png",
  surgery: "/specialty-icons-v2/surgery.png",
};

function IconShell({
  children,
  active = false,
  className = "",
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative grid place-items-center rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_12px_26px_rgba(15,23,42,0.13)] ring-1 ring-slate-200/80 transition ${className} ${
        active ? "scale-105 ring-blue-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_18px_34px_rgba(37,99,235,0.22)]" : ""
      }`}
    >
      <span className="pointer-events-none absolute inset-x-3 top-2 h-4 rounded-full bg-white/80 blur-[2px]" />
      {children}
    </span>
  );
}

function SpecialtyIcon({ specialty, active = false, className = "h-20 w-20" }: SpecialtyIconProps) {
  return (
    <span
      className={`relative grid place-items-center rounded-2xl transition ${className} ${
        active ? "scale-105" : ""
      }`}
    >
      <Image
        src={specialtyIconSrc[specialty]}
        alt=""
        width={512}
        height={512}
        className="h-full w-full object-contain drop-shadow-[0_8px_12px_rgba(15,23,42,0.14)]"
        sizes="(max-width: 768px) 72px, 88px"
        priority={active}
      />
    </span>
  );
}

function FilterIcon({ type, active }: { type: string; active: boolean }) {
  const fill = active ? "#FFFFFF" : "#2563EB";

  return (
    <IconShell active={active} className="h-11 w-11 rounded-xl">
      <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden>
        {type === "grid" && (
          <>
            {[8, 26].map((x) => [8, 26].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="14" height="14" rx="3" fill={fill} opacity={x === 8 && y === 8 ? ".85" : "1"} />))}
          </>
        )}
        {type === "user" && (
          <>
            <circle cx="24" cy="17" r="9" fill={fill} />
            <path d="M10 40c2-10 10-15 24-15 8 0 13 5 14 15Z" fill={fill} opacity=".9" />
          </>
        )}
        {type === "brain" && (
          <path d="M18 11c-7 1-10 7-8 13-4 3-4 11 2 14 3 6 12 5 15 0 4 5 14 4 16-3 5-3 5-12 0-16 1-7-6-12-13-9-4-5-11-4-12 1Z" fill={fill} />
        )}
        {type === "clipboard" && (
          <>
            <rect x="12" y="9" width="24" height="34" rx="5" fill={fill} opacity=".9" />
            <rect x="18" y="5" width="12" height="8" rx="3" fill={active ? "#DBEAFE" : "#93C5FD"} />
            <path d="M18 21h12M18 29h12M18 37h8" stroke={active ? "#2563EB" : "#FFFFFF"} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {type === "shield" && (
          <path d="M24 44C14 39 9 31 9 12l15-6 15 6c0 19-5 27-15 32Z" fill={fill} />
        )}
      </svg>
    </IconShell>
  );
}

export default function SpecialtyOnboardingClient() {
  const [selected, setSelected] = useState<MedicalSpecialtyKey>(MEDICAL_SPECIALTIES[0].key);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("الكل");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredSpecialties = useMemo(() => {
    if (filter === "الكل") return MEDICAL_SPECIALTIES;
    return MEDICAL_SPECIALTIES.filter((specialty) => specialty.category === filter);
  }, [filter]);

  function changeFilter(newFilter: (typeof FILTERS)[number]) {
    setFilter(newFilter);
    // Auto-select first specialty in new filter if current selection won't be visible
    const filtered = newFilter === "الكل"
      ? MEDICAL_SPECIALTIES
      : MEDICAL_SPECIALTIES.filter((s) => s.category === newFilter);
    if (!filtered.some((s) => s.key === selected) && filtered.length > 0) {
      setSelected(filtered[0].key);
    }
  }

  const selectedSpecialty =
    MEDICAL_SPECIALTIES.find((specialty) => specialty.key === selected) ?? MEDICAL_SPECIALTIES[0];

  async function submit() {
    if (!selected || loading) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/clinic/specialty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialty: selected }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "تعذر حفظ الاختصاص");
      setLoading(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <p className="text-sm font-black text-blue-700">إعداد العيادة لأول مرة</p>
          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-950 md:text-5xl">اختر اختصاص العيادة</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-500">
                الاختيار يجهز القوالب والخرائط المناسبة داخل ملف المراجع. يمكن تغييره لاحقاً من الإعدادات.
              </p>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!selected || loading}
              className="h-12 rounded-lg bg-blue-600 px-7 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "جاري الحفظ..." : "متابعة إلى لوحة العيادة"}
            </button>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeFilter(item)}
                  className={`group flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-black transition ${
                    filter === item
                      ? "border-blue-600 bg-blue-600 text-white shadow-[0_16px_30px_rgba(37,99,235,0.18)]"
                      : "border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  <FilterIcon type={filterIcons[item]} active={filter === item} />
                  <span className="leading-5">{item}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
              {filteredSpecialties.map((specialty) => {
                const active = selected === specialty.key;
                return (
                  <button
                    key={specialty.key}
                    type="button"
                    onClick={() => setSelected(specialty.key)}
                    className={`group flex flex-col overflow-hidden rounded-xl border transition ${
                      active
                        ? "border-blue-500 shadow-[0_6px_18px_rgba(37,99,235,0.20)]"
                        : "border-slate-200 shadow-[0_2px_8px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_6px_16px_rgba(15,23,42,0.10)]"
                    }`}
                  >
                    <div className={`flex items-center justify-center p-2.5 ${active ? "bg-blue-50" : "bg-white"}`}>
                      <Image
                        src={specialtyIconSrc[specialty.key]}
                        alt={specialty.name}
                        width={200}
                        height={200}
                        className="h-auto w-full object-contain drop-shadow-sm"
                        sizes="(max-width: 640px) 25vw, 15vw"
                      />
                    </div>
                    <div className={`border-t px-2 py-1.5 text-center text-xs font-black leading-4 ${active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-100 bg-slate-50 text-slate-700"}`}>
                      {specialty.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSpecialty && (
            <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <p className="text-xs font-black text-slate-400">المعاينة بعد الاختيار</p>
                <div className="mt-3 flex items-center gap-4">
                  <SpecialtyIcon specialty={selectedSpecialty.key} active className="h-24 w-24" />
                  <div>
                    <h2 className="text-3xl font-black text-slate-950">{selectedSpecialty.name}</h2>
                    <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{selectedSpecialty.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-400">الخريطة أو القالب</p>
                      <p className="mt-1 text-lg font-black text-slate-950">{selectedSpecialty.map}</p>
                    </div>
                    <span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">
                      جاهز
                    </span>
                  </div>

                  <div className="mt-5 grid gap-2">
                    {selectedSpecialty.modules.map((point) => (
                      <div key={point} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                        <span className="text-sm font-black text-slate-700">{point}</span>
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-black text-slate-400">سيظهر داخل ملف المراجع</p>
                  <div className="mt-3 space-y-2">
                    {selectedSpecialty.modules.map((module) => (
                      <div key={module} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                        {module}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </section>

        {error && (
          <p className="rounded-lg bg-rose-50 p-4 text-sm font-bold text-rose-700 ring-1 ring-rose-100">{error}</p>
        )}
      </main>
    </div>
  );
}
