"use client";

import { useEffect, useState } from "react";

type DayHours = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
};

const DAY_NAMES: Record<number, string> = {
  0: "الأحد",
  1: "الاثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت",
};

const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

const DEFAULT_HOURS: DayHours[] = DAY_ORDER.map((day) => ({
  dayOfWeek: day,
  startTime: "16:00",
  endTime: "21:00",
  isOpen: day !== 5,
}));

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default function WorkingHoursPage() {
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/working-hours")
      .then((response) => response.json())
      .then((data: DayHours[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const map = Object.fromEntries(data.map((day) => [day.dayOfWeek, day]));
          setHours(
            DAY_ORDER.map(
              (day) =>
                map[day] ?? {
                  dayOfWeek: day,
                  startTime: "16:00",
                  endTime: "21:00",
                  isOpen: day !== 5,
                }
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<DayHours>) {
    setHours((prev) => prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/working-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hours),
      });
      if (!res.ok) throw new Error("فشل الحفظ");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  const openDays = hours.filter((day) => day.isOpen).length;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-7">
        <section className="rounded-[32px] bg-gradient-to-br from-white via-emerald-50 to-sky-50 p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,99,235,0.10)] ring-1 ring-emerald-100">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-700">تنظيم الاستقبال</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">أوقات العمل</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                اضبط الأيام والساعات التي تظهر للمراجعين عند الحجز عبر واتساب.
              </p>
            </div>
            <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-emerald-100">
              <p className="text-xs font-black text-emerald-700">أيام مفتوحة</p>
              <p className="mt-1 text-4xl font-black text-slate-900">{arabicNumber(openDays)}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(15,23,42,0.09)] ring-1 ring-slate-200/70">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-slate-950">جدول الأسبوع</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">فعّل اليوم وحدد بداية ونهاية الدوام.</p>
            </div>
          </div>

          <div className="grid gap-3">
            {hours.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`rounded-[26px] p-4 ring-1 transition ${
                  day.isOpen ? "bg-white ring-slate-200 shadow-sm" : "bg-slate-50 ring-slate-100"
                }`}
              >
                <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={day.isOpen}
                        onChange={(event) => updateDay(day.dayOfWeek, { isOpen: event.target.checked })}
                        className="peer sr-only"
                      />
                      <div className="h-7 w-12 rounded-full bg-slate-200 transition peer-checked:bg-blue-600" />
                      <div className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:-translate-x-5" />
                    </label>
                    <div>
                      <p className="text-base font-black text-slate-950">{DAY_NAMES[day.dayOfWeek]}</p>
                      <p className={`mt-0.5 text-xs font-black ${day.isOpen ? "text-emerald-600" : "text-slate-400"}`}>
                        {day.isOpen ? "متاح للحجز" : "مغلق"}
                      </p>
                    </div>
                  </div>

                  {day.isOpen ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-black text-slate-500">من</span>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(event) => updateDay(day.dayOfWeek, { startTime: event.target.value })}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-black text-slate-500">إلى</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(event) => updateDay(day.dayOfWeek, { endTime: event.target.value })}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-400 ring-1 ring-slate-100">
                      هذا اليوم لن يظهر ضمن خيارات الحجز.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-[24px] bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">جاهز لحفظ الجدول؟</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">التغييرات ستنعكس على حجوزات واتساب الجديدة.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {saved && <span className="text-sm font-black text-emerald-600">تم الحفظ بنجاح</span>}
              {error && <span className="text-sm font-black text-red-600">{error}</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "جاري الحفظ..." : "حفظ أوقات العمل"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
