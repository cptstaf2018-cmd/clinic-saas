"use client";

import { useState, useEffect } from "react";

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

// Display order: Saturday=6 through Friday=5
const DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

const DEFAULT_HOURS: DayHours[] = DAY_ORDER.map((d) => ({
  dayOfWeek: d,
  startTime: "16:00",
  endTime: "21:00",
  isOpen: d !== 5, // Friday closed by default
}));

export default function WorkingHoursPage() {
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/working-hours")
      .then((r) => r.json())
      .then((data: DayHours[]) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge fetched data preserving display order
          const map = Object.fromEntries(data.map((d) => [d.dayOfWeek, d]));
          setHours(
            DAY_ORDER.map(
              (d) =>
                map[d] ?? {
                  dayOfWeek: d,
                  startTime: "16:00",
                  endTime: "21:00",
                  isOpen: d !== 5,
                }
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  function updateDay(dayOfWeek: number, patch: Partial<DayHours>) {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h))
    );
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

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">أوقات العمل</h1>
        <p className="text-sm text-gray-500 mt-1">
          حدد أوقات عمل العيادة لكل يوم
        </p>
      </div>

      <div className="space-y-3">
        {hours.map((day) => (
          <div
            key={day.dayOfWeek}
            className={`bg-white rounded-xl border p-4 shadow-sm transition-opacity ${
              !day.isOpen ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-[90px]">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { isOpen: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                </label>
                <span className="font-semibold text-gray-800 text-sm">
                  {DAY_NAMES[day.dayOfWeek]}
                </span>
              </div>

              {day.isOpen ? (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500">من</label>
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        updateDay(day.dayOfWeek, { startTime: e.target.value })
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-500">إلى</label>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        updateDay(day.dayOfWeek, { endTime: e.target.value })
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">مغلق</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? "جاري الحفظ..." : "حفظ أوقات العمل"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            تم الحفظ بنجاح
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600 font-medium">{error}</span>
        )}
      </div>
    </div>
  );
}
