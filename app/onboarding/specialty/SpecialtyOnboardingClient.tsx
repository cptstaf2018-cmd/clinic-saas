"use client";

import { useMemo, useState } from "react";
import { MEDICAL_SPECIALTIES } from "@/lib/medical-specialties";
import type { MedicalSpecialtyKey } from "@/lib/medical-specialties";

const FILTERS = ["الكل", "الأكثر استخداماً", "اختصاصات سريرية", "إجراءات ومراكز", "عام"] as const;

const PREVIEW_POINTS: Record<string, string[]> = {
  aesthetic: ["صور قبل/بعد", "موافقات الإجراء", "خطة جلسات ومتابعات"],
  dermatology: ["آفات جلدية", "صور وملاحظات", "خزعات ومتابعة"],
  dentistry: ["مخطط الأسنان", "خطة علاج", "أشعة وملاحظات"],
  gynecology: ["متابعة حمل", "سونار", "جدول زيارات"],
  pediatrics: ["نمو وتطعيمات", "جرعات", "متابعة حرارة ووزن"],
  cardiology: ["ضغط ونبض", "ECG", "متابعة زمنية"],
  ophthalmology: ["حدة البصر", "ضغط العين", "وصفة نظارات"],
  orthopedics: ["خريطة هيكل", "ألم وحركة", "أشعة وتأهيل"],
  internal_medicine: ["تحاليل", "أمراض مزمنة", "خطة علاج"],
  general_medicine: ["فحص عام", "وصفات طبية", "تحويلات لأخصائي"],
  surgery: ["ملاحظة العملية", "فحص الجرح", "خطة ما بعد العملية"],
};

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
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeFilter(item)}
                  className={`h-10 rounded-lg border px-4 text-sm font-black transition ${
                    filter === item
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {filteredSpecialties.map((specialty) => {
                const active = selected === specialty.key;
                return (
                  <button
                    key={specialty.key}
                    type="button"
                    onClick={() => setSelected(specialty.key)}
                    className={`rounded-lg border p-4 text-right transition ${
                      active
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black ${
                          active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {specialty.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-lg font-black text-slate-950">{specialty.name}</span>
                        <span className="mt-1 block text-sm font-bold leading-6 text-slate-500">
                          {specialty.description}
                        </span>
                      </span>
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
                <h2 className="mt-2 text-3xl font-black text-slate-950">{selectedSpecialty.name}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-500">{selectedSpecialty.description}</p>
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
                    {(PREVIEW_POINTS[selectedSpecialty.key] ?? selectedSpecialty.modules).map((point) => (
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
