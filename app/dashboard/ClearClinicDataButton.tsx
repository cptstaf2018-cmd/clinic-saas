"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  tone?: "light" | "danger";
};

export default function ClearClinicDataButton({ tone = "light" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function clearAllData() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/clinic/clear-data", { method: "DELETE" });

    if (res.ok) {
      const data = await res.json();
      setResult(`تم التصفير: ${data.deleted.patients} مراجع، ${data.deleted.appointments} حجز`);
      setOpen(false);
      setConfirm("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "تعذر تصفير البيانات");
    }
    setLoading(false);
  }

  const buttonClass =
    tone === "danger"
      ? "rounded-2xl bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700"
      : "rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700";

  return (
    <>
      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError("");
            setResult("");
            setConfirm("");
          }}
          className={buttonClass}
        >
          تصفير البيانات
        </button>
        {result && <p className="text-xs font-bold text-emerald-700">{result}</p>}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-7 w-7">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h2 className="mt-5 text-center text-xl font-black text-slate-950">تصفير بيانات التشغيل؟</h2>
            <p className="mt-2 text-center text-sm font-semibold leading-7 text-slate-500">
              سيتم حذف كل المراجعين والحجوزات وجلسات واتساب. الحساب، الاشتراك، الإعدادات، وأوقات العمل تبقى كما هي.
            </p>

            <label className="mt-5 block">
              <span className="text-xs font-black text-slate-500">اكتب مسح الكل للتأكيد</span>
              <input
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="مسح الكل"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100"
              />
            </label>

            {error && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={clearAllData}
                disabled={confirm !== "مسح الكل" || loading}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {loading ? "جاري التصفير..." : "نعم، صفّر"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
