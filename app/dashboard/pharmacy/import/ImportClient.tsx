"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { shrinkImage } from "@/lib/client-image";
import { FIELD_LABELS, IMPORT_FIELDS, suggestPrice, type ColumnMapping, type ImportRow, type StockMode } from "@/lib/pharmacy/import";
import ImportTable, { lineFromRow, lineToRow, type Line, type LineStatus } from "./ImportTable";

type Source = "excel" | "receipt";
type Summary = { creates: number; updates: number; needsPrice: number; unchanged: number; merged: number; rejected: number };
type Sheet = { file: File; headers: string[]; mapping: ColumnMapping; problems: { line: number; messages: string[] }[] };

const PREVIEW_DELAY_MS = 450;
const RECEIPT_MAX_SIDE = 2000;
const DEFAULT_MARGIN = "25";
const MAX_PROBLEMS_SHOWN = 20;

const BUTTON_PRIMARY = "min-h-12 rounded-2xl bg-brand-gold px-6 font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover disabled:opacity-50 disabled:hover:translate-y-0";
const BUTTON_SECONDARY = "min-h-12 rounded-2xl bg-white px-5 text-sm font-semibold text-brand-ink ring-1 ring-brand-border transition hover:bg-brand-soft";

const n = (value: number) => value.toLocaleString("ar-IQ");

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const data = res ? await res.json().catch(() => ({})) : {};
  return { ok: Boolean(res?.ok), data };
}

function DropZone({ accept, capture, title, hint, disabled, onFile }: { accept: string; capture?: "environment"; title: string; hint: string; disabled?: boolean; onFile: (file: File) => void }) {
  return (
    <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-brand-border bg-white px-6 py-12 text-center transition focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-soft ${disabled ? "pointer-events-none opacity-50" : "hover:border-brand-gold hover:bg-brand-bg"}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-2xl text-brand-on-soft" aria-hidden>↑</span>
      <span className="text-lg font-bold text-brand-ink">{title}</span>
      <span className="max-w-md text-sm text-brand-muted">{hint}</span>
      <input
        type="file"
        accept={accept}
        capture={capture}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

export default function ImportClient({ receiptEnabled }: { receiptEnabled: boolean }) {
  const [source, setSource] = useState<Source>("excel");
  const [lines, setLines] = useState<Line[]>([]);
  const [statuses, setStatuses] = useState<Record<number, LineStatus>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [stockMode, setStockMode] = useState<StockMode>("add");
  const [busy, setBusy] = useState<"reading" | "saving" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Summary | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const nextId = useRef(1);
  const ticket = useRef(0);

  function loadRows(items: { row: ImportRow; line?: number }[]) {
    setLines(items.map(({ row, line }) => lineFromRow(row, nextId.current++, line)));
    setStatuses({});
    setSummary(null);
  }

  async function readSheetFile(file: File, mapping?: ColumnMapping) {
    setBusy("reading");
    setError("");
    const body = new FormData();
    body.append("file", file);
    if (mapping) body.append("mapping", JSON.stringify(mapping));
    const res = await fetch("/api/pharmacy/import/parse", { method: "POST", body }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    if (!res?.ok) {
      setError(data.error ?? "تعذر رفع الملف، تحقق من الاتصال");
      return;
    }
    setSheet({ file, headers: data.headers, mapping: data.mapping, problems: data.problems });
    loadRows(data.items);
    if (data.needsMapping) {
      setShowMapping(true);
      setError("لم أجد عمود اسم الدواء تلقائياً. اختر العمود الصحيح من القائمة أدناه.");
    } else if (data.items.length === 0) setError("لم أجد أي دواء في الملف.");
  }

  async function readReceiptFile(file: File) {
    setBusy("reading");
    setError("");
    const body = new FormData();
    body.append("file", file.type.startsWith("image/") ? await shrinkImage(file, RECEIPT_MAX_SIDE) : file);
    const res = await fetch("/api/pharmacy/import/receipt", { method: "POST", body }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(null);
    if (!res?.ok) {
      setError(data.error ?? "تعذر رفع الوصل، تحقق من الاتصال");
      return;
    }
    setSheet(null);
    loadRows((data.rows as ImportRow[]).map((row) => ({ row })));
    if (data.rows.length === 0) setError("لم أجد أدوية في الصورة. جرّب صورة أوضح تظهر فيها الأسطر كاملة.");
  }

  // Ask the server what each line would do, after a short pause in typing.
  useEffect(() => {
    if (lines.length === 0) return;
    const timer = window.setTimeout(async () => {
      const mine = ++ticket.current;
      const sent = lines;
      const { ok, data } = await postJson("/api/pharmacy/import/commit", { rows: sent.map(lineToRow), stockMode, dryRun: true });
      if (mine !== ticket.current) return;
      if (!ok) {
        setError(data.error ?? "تعذر فحص الأدوية");
        return;
      }
      const next: Record<number, LineStatus> = {};
      (data.statuses as ({ kind: LineStatus["kind"]; matchedName?: string; into?: number } | null)[]).forEach((status, index) => {
        const line = sent[index];
        if (status) next[line.id] = { kind: status.kind, matchedName: status.matchedName, intoName: status.into !== undefined ? sent[status.into]?.name : undefined };
        else next[line.id] = { kind: "invalid" };
      });
      setStatuses(next);
      setSummary(data.summary);
      setError("");
    }, PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [lines, stockMode]);

  function changeLine(id: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function removeLine(id: number) {
    setLines((prev) => prev.filter((line) => line.id !== id));
  }

  function suggestPrices() {
    const percent = Number(margin) || 0;
    setLines((prev) =>
      prev.map((line) => {
        if (statuses[line.id]?.kind !== "needsPrice") return line;
        const price = suggestPrice(Number(line.cost), percent);
        return price === null ? line : { ...line, price: String(price) };
      })
    );
  }

  function reset() {
    ticket.current += 1;
    setLines([]);
    setStatuses({});
    setSummary(null);
    setSheet(null);
    setShowMapping(false);
    setError("");
    setDone(null);
  }

  async function commit() {
    setBusy("saving");
    setError("");
    ticket.current += 1;
    const { ok, data } = await postJson("/api/pharmacy/import/commit", { rows: lines.filter((line) => line.name.trim()).map(lineToRow), stockMode, dryRun: false });
    setBusy(null);
    if (!ok) {
      setError(data.error ?? "تعذر الحفظ، تحقق من الاتصال");
      return;
    }
    setDone(data.summary);
    setLines([]);
    setStatuses({});
    setSheet(null);
  }

  const total = summary ? summary.creates + summary.updates : 0;
  const missingPrices = summary?.needsPrice ?? 0;
  const costOnlyMissing = lines.some((line) => statuses[line.id]?.kind === "needsPrice" && line.cost);

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard/pharmacy/products" className="text-sm font-semibold text-brand-blue hover:underline">← المنتجات والمخزون</Link>
            <h1 className="mt-1 text-3xl font-bold text-brand-ink">إضافة أدوية دفعة واحدة</h1>
            <p className="mt-1 text-sm text-brand-muted">ارفع ملف Excel أو صوّر وصل الشراء، راجع الأدوية ثم أضفها كلها بضغطة واحدة.</p>
          </div>
        </header>

        {done ? (
          <section className="rounded-3xl border border-brand-border bg-white p-8 text-center" aria-live="polite">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-mint-soft text-3xl text-brand-mint-text" aria-hidden>✓</span>
            <h2 className="mt-4 text-2xl font-bold text-brand-ink">تمت الإضافة</h2>
            <p className="mt-2 text-brand-muted">
              {n(done.creates)} دواء جديد · {n(done.updates)} تم تحديثه{done.unchanged > 0 ? ` · ${n(done.unchanged)} بلا تغيير` : ""}{done.needsPrice > 0 ? ` · ${n(done.needsPrice)} تم تخطيه لعدم وجود سعر` : ""}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard/pharmacy/products" className={`${BUTTON_PRIMARY} flex items-center`}>عرض المنتجات</Link>
              <button type="button" onClick={reset} className={BUTTON_SECONDARY}>إضافة ملف آخر</button>
            </div>
          </section>
        ) : (
          <>
            {lines.length === 0 && (
              <>
                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 ring-1 ring-brand-border sm:max-w-md" role="group" aria-label="طريقة الإضافة">
                  {([["excel", "ملف Excel"], ["receipt", "وصل شراء"]] as const).map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={source === value} onClick={() => { setSource(value); setError(""); }}
                      className={`min-h-11 rounded-xl text-sm font-semibold transition ${source === value ? "bg-brand-navy text-white" : "text-brand-muted"}`}>{label}</button>
                  ))}
                </div>

                {source === "excel" ? (
                  <div className="space-y-3">
                    <DropZone accept=".xlsx,.csv,.txt" title={busy === "reading" ? "جاري قراءة الملف..." : "اختر ملف Excel أو CSV"} hint="يتعرف النظام على الأعمدة تلقائياً: اسم الدواء، السعر، الكمية، الباركود، تاريخ الانتهاء. بدون تعديل على ملفك." disabled={busy === "reading"} onFile={(file) => readSheetFile(file)} />
                    <p className="text-sm text-brand-muted">
                      ليس لديك ملف جاهز؟ <a href="/api/pharmacy/import/template" className="font-semibold text-brand-blue hover:underline">حمّل نموذجاً جاهزاً</a> وعبّئه. إذا كان ملفك بصيغة xls القديمة فافتحه في Excel واحفظه بصيغة xlsx.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!receiptEnabled && (
                      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">قراءة الوصل التلقائية قيد التفعيل ولم تعمل بعد. استخدم ملف Excel أو الباركود في الوقت الحالي.</p>
                    )}
                    <DropZone accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" title={busy === "reading" ? "جاري قراءة الوصل..." : "صوّر وصل الشراء أو اختر صورة / PDF"} hint="يقرأ النظام الأسماء والكميات وسعر الشراء من الوصل. صوّر الوصل مستوياً وفي ضوء جيد، ثم راجع الأرقام قبل الإضافة." disabled={!receiptEnabled || busy === "reading"} onFile={readReceiptFile} />
                  </div>
                )}
              </>
            )}

            {sheet && (
              <section className="rounded-3xl border border-brand-border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-brand-muted">الملف: <span className="font-semibold text-brand-ink">{sheet.file.name}</span></p>
                  <button type="button" onClick={() => setShowMapping((value) => !value)} aria-expanded={showMapping} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-brand-blue hover:bg-brand-soft">
                    {showMapping ? "إخفاء الأعمدة" : "تعديل الأعمدة"}
                  </button>
                </div>
                {showMapping && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {IMPORT_FIELDS.map((field) => (
                      <label key={field} className="block">
                        <span className="mb-1 block text-xs font-semibold text-brand-muted">{FIELD_LABELS[field]}{field === "name" ? " *" : ""}</span>
                        <select
                          className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 text-sm outline-none focus:border-brand-blue"
                          value={sheet.mapping[field] ?? ""}
                          disabled={busy === "reading"}
                          onChange={(event) => readSheetFile(sheet.file, { ...sheet.mapping, [field]: event.target.value === "" ? null : Number(event.target.value) })}
                        >
                          <option value="">— لا يوجد —</option>
                          {sheet.headers.map((header, index) => <option key={index} value={index}>{`${index + 1}. ${header || "(بدون عنوان)"}`}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                {sheet.problems.length > 0 && (
                  <details className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <summary className="cursor-pointer font-semibold">{n(sheet.problems.length)} سطر فيه خانات غير مقروءة (تم تجاهل الخانة فقط)</summary>
                    <ul className="mt-2 space-y-1">
                      {sheet.problems.slice(0, MAX_PROBLEMS_SHOWN).map((problem) => <li key={problem.line}>سطر {n(problem.line)}: {problem.messages.join("، ")}</li>)}
                    </ul>
                  </details>
                )}
              </section>
            )}

            {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            {lines.length > 0 && (
              <>
                <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-brand-border bg-white p-4" aria-live="polite">
                  <p className="text-sm text-brand-muted">
                    <span className="font-bold text-brand-ink">{n(lines.length)}</span> سطر ·{" "}
                    <span className="font-bold text-brand-mint-text">{n(summary?.creates ?? 0)}</span> جديد ·{" "}
                    <span className="font-bold text-brand-on-soft">{n(summary?.updates ?? 0)}</span> تحديث
                    {missingPrices > 0 && <> · <span className="font-bold text-amber-800">{n(missingPrices)} بحاجة لسعر بيع</span></>}
                  </p>
                  <fieldset className="flex items-center gap-3 text-sm">
                    <legend className="sr-only">الأدوية الموجودة مسبقاً</legend>
                    <span className="text-brand-muted">الموجود مسبقاً:</span>
                    {([["add", "أضف للكمية الحالية"], ["replace", "استبدل الكمية"]] as const).map(([value, label]) => (
                      <label key={value} className="flex cursor-pointer items-center gap-1.5 font-semibold text-brand-ink">
                        <input type="radio" name="stockMode" checked={stockMode === value} onChange={() => setStockMode(value)} className="h-4 w-4 accent-[#0E2440]" />
                        {label}
                      </label>
                    ))}
                  </fieldset>
                  {costOnlyMissing && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-brand-muted">اقتراح سعر البيع: سعر الشراء +</span>
                      <input aria-label="نسبة الربح" value={margin} onChange={(event) => setMargin(event.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" dir="ltr" className="h-10 w-16 rounded-lg border border-brand-border px-2 text-center outline-none focus:border-brand-blue" />
                      <span className="text-brand-muted">%</span>
                      <button type="button" onClick={suggestPrices} className="min-h-10 rounded-xl bg-brand-soft px-4 font-semibold text-brand-on-soft transition hover:bg-brand-line">طبّق</button>
                    </div>
                  )}
                </section>

                <ImportTable lines={lines} statuses={statuses} onChange={changeLine} onRemove={removeLine} />

                <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-brand-navy p-4 text-white shadow-lg">
                  <p className="text-sm">
                    {total > 0 ? <>سيتم إضافة أو تحديث <span className="font-bold">{n(total)}</span> دواء</> : "لا يوجد ما يُضاف بعد"}
                    {missingPrices > 0 && <span className="mr-2 text-amber-200">· {n(missingPrices)} بدون سعر سيتم تخطيها</span>}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={reset} className="min-h-12 rounded-2xl bg-white/10 px-5 text-sm font-semibold transition hover:bg-white/20">إلغاء</button>
                    <button type="button" onClick={commit} disabled={busy === "saving" || total === 0} className={BUTTON_PRIMARY}>{busy === "saving" ? "جاري الحفظ..." : `تأكيد وإضافة ${total > 0 ? n(total) : ""}`}</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
