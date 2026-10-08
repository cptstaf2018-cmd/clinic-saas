"use client";

import { useMemo, useState } from "react";
import { TEST_CATEGORIES } from "@/lib/lab/order";
import { STARTER_TESTS } from "@/lib/lab/starter-tests";
import { uploadEntityImage } from "@/lib/client-image";
import { usePendingImage } from "@/lib/use-pending-image";
import type { LabTestView } from "@/lib/lab/types";

type Draft = { name: string; nameEn: string; category: string; unit: string; price: string; refLowM: string; refHighM: string; refLowF: string; refHighF: string; critLow: string; critHigh: string };

const EMPTY: Draft = { name: "", nameEn: "", category: "أخرى", unit: "", price: "", refLowM: "", refHighM: "", refLowF: "", refHighF: "", critLow: "", critHigh: "" };
const INPUT = "h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-soft";
const REF_FIELDS = [
  ["refLowM", "الطبيعي الأدنى (ذكر)"],
  ["refHighM", "الطبيعي الأعلى (ذكر)"],
  ["refLowF", "الطبيعي الأدنى (أنثى)"],
  ["refHighF", "الطبيعي الأعلى (أنثى)"],
  ["critLow", "حرج: أقل من أو يساوي"],
  ["critHigh", "حرج: أكثر من أو يساوي"],
] as const;

const SUGGESTION_LIMIT = 6;

function numStr(value: number | null) {
  return value === null ? "" : String(value);
}

function suggestionDraft(test: (typeof STARTER_TESTS)[number], price: string): Draft {
  return { name: test.name, nameEn: test.nameEn ?? "", category: test.category, unit: test.unit ?? "", price, refLowM: numStr(test.refLowM), refHighM: numStr(test.refHighM), refLowF: numStr(test.refLowF), refHighF: numStr(test.refHighF), critLow: numStr(test.critLow), critHigh: numStr(test.critHigh) };
}

function toDraft(test: LabTestView): Draft {
  const str = (value: number | null) => (value === null ? "" : String(value));
  return { name: test.name, nameEn: test.nameEn ?? "", category: test.category, unit: test.unit ?? "", price: String(test.price), refLowM: str(test.refLowM), refHighM: str(test.refHighM), refLowF: str(test.refLowF), refHighF: str(test.refHighF), critLow: str(test.critLow), critHigh: str(test.critHigh) };
}

export default function TestsClient({ initialTests }: { initialTests: LabTestView[] }) {
  const [tests, setTests] = useState(initialTests);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [suggestionPicked, setSuggestionPicked] = useState(false);
  const picked = usePendingImage();
  const pendingImage = picked.file;
  const setPendingImage = picked.choose;
  const [imageBusy, setImageBusy] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tests.filter((test) => test.name.toLowerCase().includes(q) || test.nameEn?.toLowerCase().includes(q)) : tests;
  }, [tests, query]);
  const unpriced = tests.filter((test) => test.price === 0).length;

  async function reload() {
    const res = await fetch("/api/lab/tests").catch(() => null);
    if (res?.ok) setTests(await res.json());
  }

  async function importStarter() {
    setImporting(true);
    setNotice("");
    const res = await fetch("/api/lab/tests/starter", { method: "POST" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setImporting(false);
    if (!res?.ok) { setNotice(data.error ?? "تعذر إضافة التحاليل"); return; }
    setNotice(data.added ? `أُضيف ${data.added} تحليل. حدّد أسعارها وراجع القيم المرجعية.` : "كل التحاليل الشائعة موجودة عندك.");
    await reload();
  }

  async function save() {
    if (!editing || saving) return;
    setSaving(true);
    setError("");
    const res = await fetch(editing.id ? `/api/lab/tests/${editing.id}` : "/api/lab/tests", {
      method: editing.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing.draft),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    if (!res?.ok) { setError(data.error ?? "تعذر الحفظ، تحقق من الاتصال"); return; }
    let imageError: string | null = null;
    if (pendingImage && data.id) imageError = await uploadEntityImage(`/api/lab/tests/${data.id}/image`, pendingImage);
    setPendingImage(null);
    await reload();
    if (imageError && data.id) {
      // keep the dialog open on the saved test so the picture can be retried
      setEditing({ id: data.id, draft: editing.draft });
      setError(`حُفظ التحليل لكن الصورة لم تُرفع: ${imageError}`);
      return;
    }
    setEditing(null);
  }

  async function removeImage(testId: string) {
    setImageBusy(true);
    const res = await fetch(`/api/lab/tests/${testId}/image`, { method: "DELETE" }).catch(() => null);
    setImageBusy(false);
    if (!res?.ok) { setError("تعذر حذف الصورة"); return; }
    await reload();
  }

  async function archive(test: LabTestView) {
    if (!confirm(`إزالة "${test.name}" من الكتالوج؟ الطلبات السابقة تبقى كما هي.`)) return;
    const res = await fetch(`/api/lab/tests/${test.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) { alert("تعذر الحذف"); return; }
    setEditing(null);
    await reload();
  }

  // Common tests the lab does not have yet, matched against what is being typed in the name field.
  const suggestions = useMemo(() => {
    if (!editing || editing.id || suggestionPicked) return [];
    const q = editing.draft.name.trim().toLowerCase();
    if (q.length < 1) return [];
    const have = new Set(tests.map((test) => test.name));
    return STARTER_TESTS.filter((test) => !have.has(test.name) && (test.name.toLowerCase().includes(q) || test.nameEn?.toLowerCase().includes(q))).slice(0, SUGGESTION_LIMIT);
  }, [editing, tests, suggestionPicked]);

  const currentTest = editing?.id ? tests.find((test) => test.id === editing.id) : undefined;
  const previewUrl = picked.previewUrl ?? currentTest?.imageUrl ?? null;

  const set = (key: keyof Draft, value: string) => setEditing((prev) => (prev ? { ...prev, draft: { ...prev.draft, [key]: value } } : prev));

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-ink">كتالوج التحاليل</h1>
            <p className="mt-1 text-sm text-brand-muted">{tests.length.toLocaleString("ar-IQ")} تحليل · القيم المرجعية هنا هي ما يُحكم به على كل نتيجة.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={importStarter} disabled={importing} className="min-h-12 rounded-2xl bg-white px-5 text-sm font-semibold text-brand-ink ring-1 ring-brand-border disabled:opacity-50">{importing ? "جاري الإضافة..." : "إضافة التحاليل الشائعة"}</button>
            <button type="button" onClick={() => { setError(""); setSuggestionPicked(false); setPendingImage(null); setEditing({ id: null, draft: EMPTY }); }} className="min-h-12 rounded-2xl bg-brand-gold px-5 font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">+ تحليل جديد</button>
          </div>
        </header>

        <div role="note" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
          القيم المرجعية المضافة تلقائياً <b>عامة للبالغين</b>. راجعها وعدّلها حسب أجهزة مختبرك ونشرات الكواشف قبل الاعتماد عليها في النتائج.
        </div>
        {notice && <p role="status" className="rounded-2xl bg-brand-mint-soft px-4 py-3 text-sm font-semibold text-brand-mint-text">{notice}</p>}
        {unpriced > 0 && tests.length > 0 && <p className="text-sm text-amber-800">{unpriced.toLocaleString("ar-IQ")} تحليل بدون سعر.</p>}

        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن تحليل" aria-label="بحث" className="h-12 w-full rounded-2xl border border-brand-border bg-white px-4 text-sm outline-none focus:border-brand-blue md:max-w-sm" />

        <div className="overflow-hidden rounded-3xl border border-brand-border bg-white">
          {visible.length === 0 ? (
            <p className="p-10 text-center text-sm text-brand-muted">{tests.length === 0 ? "الكتالوج فارغ. اضغط \"إضافة التحاليل الشائعة\" للبدء بسرعة." : "لا توجد نتائج."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-brand-bg text-xs text-brand-muted">
                  <tr>{["التحليل", "التصنيف", "الطبيعي (ذكر)", "الطبيعي (أنثى)", "السعر"].map((h) => <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-brand-line">
                  {visible.map((test) => (
                    <tr key={test.id} onClick={() => { setError(""); setPendingImage(null); setEditing({ id: test.id, draft: toDraft(test) }); }} className="cursor-pointer transition hover:bg-brand-bg">
                      <td className="px-4 py-3"><div className="flex items-center gap-3">{test.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={test.imageUrl} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-xl bg-brand-bg object-cover" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-bg text-sm font-bold text-brand-muted">{test.name.trim().charAt(0)}</span>
                      )}<div><p className="font-bold text-brand-ink">{test.name}</p><p className="text-xs text-brand-muted" dir="ltr" style={{ textAlign: "right" }}>{test.nameEn} {test.unit && `· ${test.unit}`}</p></div></div></td>
                      <td className="px-4 py-3 text-brand-muted">{test.category}</td>
                      <td className="px-4 py-3" dir="ltr" style={{ textAlign: "right" }}>{test.refLowM ?? "—"} – {test.refHighM ?? "—"}</td>
                      <td className="px-4 py-3" dir="ltr" style={{ textAlign: "right" }}>{test.refLowF ?? "—"} – {test.refHighF ?? "—"}</td>
                      <td className={`px-4 py-3 font-semibold ${test.price === 0 ? "text-amber-700" : "text-brand-ink"}`}>{test.price === 0 ? "حدّد السعر" : test.price.toLocaleString("ar-IQ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-brand-navy/55 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={editing.id ? "تعديل تحليل" : "تحليل جديد"}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-brand-ink">{editing.id ? "تعديل تحليل" : "تحليل جديد"}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label="إغلاق" className="h-9 w-9 rounded-xl bg-brand-line text-lg">×</button>
            </div>
            <div className="mb-4 flex items-center gap-4 rounded-2xl bg-brand-bg p-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="صورة التحليل" className="h-20 w-20 shrink-0 rounded-2xl bg-white object-cover" />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-xs text-brand-muted">بدون صورة</span>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="flex min-h-10 cursor-pointer items-center rounded-xl bg-white px-4 text-sm font-semibold text-brand-ink ring-1 ring-brand-border hover:bg-brand-soft">
                  {previewUrl ? "تغيير الصورة" : "إضافة صورة"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { setPendingImage(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                </label>
                {(pendingImage || currentTest?.imageUrl) && (
                  <button type="button" disabled={imageBusy} onClick={() => (pendingImage ? setPendingImage(null) : currentTest && removeImage(currentTest.id))} className="min-h-10 rounded-xl bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-50">حذف الصورة</button>
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">اسم التحليل *</span><input className={INPUT} value={editing.draft.name} onChange={(e) => { setSuggestionPicked(false); set("name", e.target.value); }} autoFocus autoComplete="off" placeholder="ابدأ بالكتابة: هيموغلوبين، سكر، TSH..." /></label>
                {suggestions.length > 0 && (
                  <ul role="listbox" aria-label="اقتراحات التحاليل" className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-2xl border border-brand-border bg-white p-1 shadow-[0_18px_40px_-20px_rgba(14,36,64,0.45)]">
                    {suggestions.map((test) => (
                      <li key={test.name} role="option" aria-selected={false}>
                        <button type="button" onClick={() => { setSuggestionPicked(true); setEditing((prev) => (prev ? { ...prev, draft: suggestionDraft(test, prev.draft.price) } : prev)); }} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right hover:bg-brand-bg">
                          <span className="font-semibold text-brand-ink">{test.name}</span>
                          <span className="text-xs text-brand-muted" dir="ltr">{test.nameEn} · {test.unit}</span>
                        </button>
                      </li>
                    ))}
                    <li className="px-3 py-1.5 text-[11px] text-brand-muted">اختر اسماً لتُملأ الوحدة والقيم المرجعية تلقائياً، ثم عدّلها إن لزم.</li>
                  </ul>
                )}
              </div>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">الاسم بالإنجليزية</span><input className={INPUT} dir="ltr" value={editing.draft.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">الوحدة</span><input className={INPUT} dir="ltr" value={editing.draft.unit} onChange={(e) => set("unit", e.target.value)} placeholder="mg/dL" /></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">التصنيف</span><select className={INPUT} value={editing.draft.category} onChange={(e) => set("category", e.target.value)}>{TEST_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">السعر (د.ع)</span><input className={INPUT} dir="ltr" inputMode="numeric" value={editing.draft.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} /></label>
              {REF_FIELDS.map(([key, label]) => (
                <label key={key} className="block"><span className="mb-1 block text-xs font-semibold text-brand-muted">{label}</span><input className={INPUT} dir="ltr" inputMode="decimal" value={editing.draft[key]} onChange={(e) => set(key, e.target.value)} /></label>
              ))}
            </div>
            <p className="mt-3 text-xs text-brand-muted">اترك الحقل فارغاً إذا لا يوجد حد. الحدود الحرجة تنبّهك لإبلاغ الطبيب فوراً.</p>
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={save} disabled={saving} className="min-h-12 flex-1 rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:opacity-50">{saving ? "جاري الحفظ..." : "حفظ"}</button>
              {editing.id && <button type="button" onClick={() => { const test = tests.find((item) => item.id === editing.id); if (test) archive(test); }} className="min-h-12 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700">إزالة</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
