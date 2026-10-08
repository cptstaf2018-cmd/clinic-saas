"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LabOrderView, LabTestView } from "@/lib/lab/types";

type KnownPatient = { patientName: string; patientPhone: string | null; sex: string; age: number | null; doctorName: string | null };
const SUGGEST_DELAY_MS = 250;

const INPUT = "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";

/** Creates a new order, or corrects an existing one when `order` is given. */
export default function NewOrderModal({ tests, order, onClose, onCreated }: { tests: LabTestView[]; order?: LabOrderView; onClose: () => void; onCreated: (order: LabOrderView) => void }) {
  const editing = order !== undefined;
  const testsLocked = editing && order.status !== "new" && order.status !== "in_progress";
  const [name, setName] = useState(order?.patientName ?? "");
  const [phone, setPhone] = useState(order?.patientPhone ?? "");
  const [sex, setSex] = useState<"m" | "f" | "">(order?.sex ?? "");
  const [age, setAge] = useState(order?.age != null ? String(order.age) : "");
  const [doctor, setDoctor] = useState(order?.doctorName ?? "");
  const [urgent, setUrgent] = useState(order?.urgent ?? false);
  const [picked, setPicked] = useState<Set<string>>(() => new Set((order?.items ?? []).map((item) => item.testId).filter((id): id is string => id !== null)));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [known, setKnown] = useState<KnownPatient[]>([]);

  // Suggest earlier patients while the name or phone is typed, so repeat visitors are one tap.
  useEffect(() => {
    const q = (name.trim().length >= phone.trim().length ? name : phone).trim();
    if (editing || q.length < 2) return;
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/lab/patients?q=${encodeURIComponent(q)}`).catch(() => null);
      setKnown(res?.ok ? await res.json() : []);
    }, SUGGEST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [name, phone, editing]);

  const categories = useMemo(() => ["الكل", ...new Set(tests.map((test) => test.category))], [tests]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((test) => (category === "الكل" || test.category === category) && (!q || test.name.toLowerCase().includes(q) || test.nameEn?.toLowerCase().includes(q)));
  }, [tests, query, category]);
  // Items whose catalog test was removed stay on the order and cannot be unticked here.
  const orphanItems = (order?.items ?? []).filter((item) => item.testId === null);
  const total = tests.filter((test) => picked.has(test.id)).reduce((sum, test) => sum + test.price, 0) + orphanItems.reduce((sum, item) => sum + item.price, 0);

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
    const fields = { patientName: name, patientPhone: phone, sex, age, doctorName: doctor, urgent };
    const res = await fetch(editing ? `/api/lab/orders/${order.id}` : "/api/lab/orders", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { details: fields, ...(testsLocked ? {} : { testIds: [...picked] }) } : { ...fields, testIds: [...picked] }),
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/55 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={editing ? "تعديل الطلب" : "طلب جديد"} dir="rtl">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-brand-line px-6 py-4">
          <h2 className="text-xl font-bold text-brand-ink">{editing ? `تعديل الطلب #${order.number}` : "طلب تحليل جديد"}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="h-9 w-9 rounded-xl bg-brand-line text-lg">×</button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="relative">
              <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">اسم المراجع *</span><input className={INPUT} value={name} onChange={(e) => { setName(e.target.value); if (e.target.value.trim().length < 2) setKnown([]); }} autoFocus autoComplete="off" /></label>
              {known.length > 0 && name.trim().length >= 2 && (
                <ul role="listbox" aria-label="مراجعون سابقون" className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-2xl border border-brand-border bg-white p-1 shadow-[0_18px_40px_-20px_rgba(14,36,64,0.45)]">
                  {known.map((patient) => (
                    <li key={`${patient.patientName}-${patient.patientPhone}`} role="option" aria-selected={false}>
                      <button type="button" className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-brand-bg" onClick={() => {
                        setName(patient.patientName);
                        setPhone(patient.patientPhone ?? "");
                        setSex(patient.sex === "f" ? "f" : "m");
                        setAge(patient.age === null ? "" : String(patient.age));
                        if (patient.doctorName) setDoctor(patient.doctorName);
                        setKnown([]);
                      }}>
                        <span className="font-semibold text-brand-ink">{patient.patientName}</span>
                        <span className="text-xs text-brand-muted" dir="ltr">{patient.patientPhone ?? "بدون رقم"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
            <span className="mb-1 block text-xs font-semibold text-brand-muted">التحاليل * ({picked.size + orphanItems.length})</span>
            {testsLocked && <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">لا يمكن تغيير التحاليل بعد إدخال النتائج. أعد فتح الطلب أو أنشئ طلباً جديداً.</p>}
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
                        <input type="checkbox" checked={picked.has(test.id)} disabled={testsLocked} onChange={() => toggle(test.id)} className="h-4 w-4 accent-[#0E2440]" />
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
            {saving ? "جاري الحفظ..." : editing ? "حفظ التعديلات" : "إنشاء الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
