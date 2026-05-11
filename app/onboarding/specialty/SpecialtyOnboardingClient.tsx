"use client";

import { useState } from "react";
import { MEDICAL_SPECIALTIES } from "@/lib/medical-specialties";

export default function SpecialtyOnboardingClient() {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-[#eef7f4] p-4 md:p-8" dir="rtl">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-6 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-sky-100 md:p-8">
          <p className="text-sm font-black text-blue-700">إعداد العيادة لأول مرة</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-5xl">اختر اختصاصك</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
            سنجهز لك القوالب الطبية المناسبة لطبيعة عملك. يمكنك تعديل التفاصيل لاحقاً من الإعدادات.
          </p>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {MEDICAL_SPECIALTIES.map((specialty) => {
            const active = selected === specialty.key;
            return (
              <button
                key={specialty.key}
                type="button"
                onClick={() => setSelected(specialty.key)}
                className={`min-h-40 rounded-[26px] bg-white p-5 text-right shadow-sm ring-1 transition ${
                  active
                    ? "ring-4 ring-blue-200 shadow-[0_18px_45px_rgba(37,99,235,0.16)]"
                    : "ring-slate-200 hover:-translate-y-0.5 hover:ring-blue-200"
                }`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl text-sm font-black ${
                  active ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
                }`}>
                  {specialty.icon}
                </span>
                <h2 className="mt-4 text-xl font-black text-slate-950">{specialty.name}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{specialty.description}</p>
              </button>
            );
          })}
        </section>

        <div className="mt-6 flex flex-col items-stretch gap-3 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">بعد الاختيار</p>
            <p className="mt-1 text-xs font-bold text-slate-500">ستدخل لوحة العيادة وتبدأ القوالب المناسبة بالظهور في الزيارات الطبية.</p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!selected || loading}
            className="rounded-2xl bg-blue-600 px-8 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جاري الحفظ..." : "متابعة إلى لوحة العيادة"}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700 ring-1 ring-rose-100">{error}</p>
        )}
      </main>
    </div>
  );
}
