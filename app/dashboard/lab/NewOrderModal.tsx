"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LabOrderView, LabTestView } from "@/lib/lab/types";

const INPUT = "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";

export default function NewOrderModal({ tests, onClose, onCreated }: { tests: LabTestView[]; onClose: () => void; onCreated: (order: LabOrderView) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sex, setSex] = useState<"m" | "f" | "">("");
  const [age, setAge] = useState("");
  const [doctor, setDoctor] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => ["الكل", ...new Set(tests.map((test) => test.category))], [tests]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((test) => (category === "الكل" || test.category === category) && (!q || test.name.toLowerCase().includes(q) || test.nameEn?.toLowerCase().includes(q)));
  }, [tests, query, category]);
  const total = tests.filter((test) => picked.has(test.id)).reduce((sum, test) => sum + test.price, 0);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/lab/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientName: name, patientPhone: phone, sex, age, doctorName: doctor, urgent, testIds: [...picked] }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    if (!res?.ok) {
      setError(data.error ?? "تعذر إنشاء الطلب، تحقق من الاتصال");
      return;
    }
    onCreated(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/55 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="طلب جديد" dir="rtl">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
          <h2 className="text-xl font-bold text-brand-ink">طلب تحليل جديد</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="h-9 w-9 rounded-xl bg-brand-line text-lg">×</button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">اسم المراجع *</span><input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">رقم واتساب لإرسال النتيجة</span><input className={INPUT} value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" inputMode="tel" placeholder="07701234567" /></label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1 block text-xs font-semibold text-brand-muted">الجنس *</span>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-brand-line p-1" role="group" aria-label="الجنس">
                  {([["m", "ذكر"], ["f", "أنثى"]] as const).map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={sex === value} onClick={() => setSex(value)} className={`min-h-9 rounded-lg text-sm font-semibold transition ${sex === value ? "bg-white text-brand-navy shadow-sm" : "text-brand-muted"}`}>{label}</button>
                  ))}
                </div>
              </div>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">العمر</span><input className={INPUT} value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} inputMode="numeric" dir="ltr" /></label>
            </div>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">الطبيب الطالب</span><input className={INPUT} value={doctor} onChange={(e) => setDoctor(e.target.value)} /></label>
            <label className="flex items-center gap-3 rounded-xl bg-brand-bg px-3 py-3 text-sm font-semibold text-brand-ink">
              <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="h-5 w-5 accent-[#0E2440]" />
              طلب مستعجل
            </label>
          </div>

          <div className="flex min-h-0 flex-col">
            <span className="mb-1 block text-xs font-semibold text-brand-muted">التحاليل * ({picked.size})</span>
            {tests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-border bg-brand-bg p-6 text-center">
                <p className="text-sm font-semibold text-brand-ink">كتالوج التحاليل فارغ</p>
                <Link href="/dashboard/lab/tests" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-brand-gold px-5 text-sm font-bold text-brand-gold-ink">إضافة التحاليل</Link>
              </div>
            ) : (
              <>
                <input className={INPUT} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن تحليل" aria-label="بحث عن تحليل" />
                <div className="my-2 flex flex-wrap gap-1.5">
                  {categories.map((item) => (
                    <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`rounded-full px-3 py-1 text-xs font-semibold ${category === item ? "bg-brand-navy text-white" : "bg-brand-line text-brand-muted"}`}>{item}</button>
                  ))}
                </div>
                <ul className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-brand-border p-1.5">
                  {visible.map((test) => (
                    <li key={test.id}>
                      <label className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${picked.has(test.id) ? "bg-brand-gold/15" : "hover:bg-brand-bg"}`}>
                        <input type="checkbox" checked={picked.has(test.id)} onChange={() => toggle(test.id)} className="h-4 w-4 accent-[#0E2440]" />
                        <span className="flex-1 font-semibold text-brand-ink">{test.name}</span>
                        <span className="text-xs text-brand-muted">{test.price ? test.price.toLocaleString("ar-IQ") : "—"}</span>
                      </label>
                    </li>
                  ))}
                  {visible.length === 0 && <li className="p-4 text-center text-sm text-brand-muted">لا توجد نتائج.</li>}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-brand-line bg-brand-bg/60 px-6 py-4">
          <div>
            <p className="text-xs text-brand-muted">المجموع</p>
            <p className="text-xl font-bold text-brand-ink">{total.toLocaleString("ar-IQ")} <span className="text-xs font-medium text-brand-muted">د.ع</span></p>
          </div>
          {error && <p role="alert" className="flex-1 text-sm font-semibold text-red-700">{error}</p>}
          <button type="button" onClick={save} disabled={saving} className="min-h-12 rounded-2xl bg-brand-gold px-8 font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "إنشاء الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
