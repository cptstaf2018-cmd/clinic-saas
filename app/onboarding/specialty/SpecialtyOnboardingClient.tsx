"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MEDICAL_SPECIALTIES } from "@/lib/medical-specialties";
import type { MedicalSpecialtyKey } from "@/lib/medical-specialties";

const FILTERS = ["الكل", "الأكثر استخداماً", "اختصاصات سريرية", "إجراءات ومراكز", "عام"] as const;
type Filter = (typeof FILTERS)[number];

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

function countFor(filter: Filter): number {
  return filter === "الكل" ? MEDICAL_SPECIALTIES.length : MEDICAL_SPECIALTIES.filter((s) => s.category === filter).length;
}

export default function SpecialtyOnboardingClient() {
  const [selected, setSelected] = useState<MedicalSpecialtyKey>(MEDICAL_SPECIALTIES[0].key);
  const [filter, setFilter] = useState<Filter>("الكل");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredSpecialties = useMemo(
    () => (filter === "الكل" ? MEDICAL_SPECIALTIES : MEDICAL_SPECIALTIES.filter((s) => s.category === filter)),
    [filter]
  );
  const visibleFilters = FILTERS.filter((item) => countFor(item) > 0);

  function changeFilter(newFilter: Filter) {
    setFilter(newFilter);
    const next = newFilter === "الكل" ? MEDICAL_SPECIALTIES : MEDICAL_SPECIALTIES.filter((s) => s.category === newFilter);
    if (!next.some((s) => s.key === selected) && next.length > 0) setSelected(next[0].key);
  }

  const selectedSpecialty = MEDICAL_SPECIALTIES.find((s) => s.key === selected) ?? MEDICAL_SPECIALTIES[0];

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
    <div className="min-h-screen bg-brand-bg pb-28" dir="rtl">
      <header className="relative overflow-hidden bg-brand-navy px-5 py-10 text-white md:px-10 md:py-14">
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-80 w-80 rounded-full border-[48px] border-white/[0.05]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-10 h-72 w-72 rounded-full border-[48px] border-brand-mint/[0.07]" />
        <div className="relative mx-auto max-w-6xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-mint/15 px-3.5 py-1.5 text-xs font-semibold text-brand-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-mint" />
            الخطوة الأخيرة قبل البدء
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">ما اختصاص عيادتك؟</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-brand-side-muted md:text-base">
            نجهّز لك القوالب والخرائط المناسبة داخل ملف المراجع. يمكنك تغييره لاحقاً من الإعدادات.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 md:px-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="الاختصاصات">
          <div className="flex flex-wrap gap-2" role="tablist">
            {visibleFilters.map((item) => {
              const isActive = filter === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => changeFilter(item)}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                    isActive ? "bg-brand-navy text-white" : "bg-white text-brand-muted ring-1 ring-brand-border hover:text-brand-ink"
                  }`}
                >
                  {item}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-white/15" : "bg-brand-line"}`}>{countFor(item)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filteredSpecialties.map((specialty) => {
              const active = selected === specialty.key;
              return (
                <button
                  key={specialty.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(specialty.key)}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white text-center ring-2 transition hover:-translate-y-0.5 ${
                    active ? "ring-brand-mint shadow-[0_18px_40px_-22px_rgba(14,36,64,0.5)]" : "ring-transparent shadow-[0_1px_0_rgba(14,36,64,0.06)] hover:ring-brand-border"
                  }`}
                >
                  {active && (
                    <span className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-mint text-xs font-bold text-brand-mint-ink">✓</span>
                  )}
                  <div className="p-4 pb-2">
                    <Image
                      src={specialtyIconSrc[specialty.key]}
                      alt=""
                      width={200}
                      height={200}
                      className="mx-auto h-auto w-full max-w-[120px] object-contain"
                      sizes="(max-width: 640px) 40vw, 160px"
                    />
                  </div>
                  <span className={`px-3 pb-4 text-sm font-bold ${active ? "text-brand-navy" : "text-brand-ink"}`}>{specialty.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start" aria-live="polite">
          <div className="overflow-hidden rounded-3xl bg-brand-navy text-white">
            <div className="flex items-center gap-4 p-5">
              <div className="shrink-0 rounded-2xl bg-white p-2">
                <Image src={specialtyIconSrc[selectedSpecialty.key]} alt="" width={160} height={160} className="h-20 w-20 object-contain" />
              </div>
              <div>
                <p className="text-xs text-brand-mint">اخترت</p>
                <h2 className="text-2xl font-bold">{selectedSpecialty.name}</h2>
              </div>
            </div>
            <p className="px-5 pb-5 text-sm leading-7 text-brand-side-muted">{selectedSpecialty.description}</p>
            <div className="bg-brand-navy-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-brand-side-muted">القالب الجاهز</p>
                  <p className="mt-0.5 font-bold">{selectedSpecialty.map}</p>
                </div>
                <span className="rounded-full bg-brand-mint/20 px-3 py-1 text-xs font-semibold text-brand-mint">جاهز</span>
              </div>
              <p className="mt-5 text-xs text-brand-side-muted">سيظهر داخل ملف كل مراجع</p>
              <ul className="mt-2 space-y-2">
                {selectedSpecialty.modules.map((module) => (
                  <li key={module} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm font-medium">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-mint" />
                    {module}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-10">
          <div className="min-w-0">
            {error ? (
              <p role="alert" className="truncate text-sm font-semibold text-red-700">{error}</p>
            ) : (
              <>
                <p className="text-xs text-brand-muted">الاختصاص المختار</p>
                <p className="truncate font-bold text-brand-ink">{selectedSpecialty.name}</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!selected || loading}
            className="min-h-12 shrink-0 rounded-2xl bg-brand-navy px-6 text-[15px] font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-navy-2 active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 md:px-8"
          >
            {loading ? "جاري الحفظ..." : "متابعة إلى لوحة العيادة"}
          </button>
        </div>
      </div>
    </div>
  );
}
