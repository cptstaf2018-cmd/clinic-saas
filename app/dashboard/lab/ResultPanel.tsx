"use client";

import { useMemo, useState } from "react";
import RangeBar from "@/components/lab/RangeBar";
import { STATUS_LABEL } from "@/lib/lab/order";
import { classifyResult, FLAG_LABEL, parseResultInput, rangeFor, type Flag } from "@/lib/lab/result";
import type { LabItemView, LabOrderView } from "@/lib/lab/types";

const FLAG_STYLE: Record<Flag, string> = {
  normal: "bg-brand-mint-soft text-brand-mint-text",
  low: "bg-amber-50 text-amber-800",
  high: "bg-amber-50 text-amber-800",
  critical_low: "bg-red-600 text-white",
  critical_high: "bg-red-600 text-white",
  none: "bg-brand-line text-brand-muted",
};

function liveFlag(item: LabItemView, raw: string, sex: "m" | "f"): { flag: Flag | "bad" | null; value: number | null } {
  if (raw.trim() === "") return { flag: null, value: null };
  const parsed = parseResultInput(raw);
  if (!parsed.ok) return { flag: "bad", value: null };
  return { flag: classifyResult(parsed.value, item, sex), value: parsed.value };
}

type Props = {
  order: LabOrderView;
  busy: boolean;
  error: string;
  onSave: (values: Record<string, string>) => Promise<boolean>;
  onStatus: (status: string) => Promise<boolean>;
  onSend: () => Promise<void>;
  onPaid: (paid: boolean) => void;
  onClose: () => void;
};

export default function ResultPanel({ order, busy, error, onSave, onStatus, onSend, onPaid, onClose }: Props) {
  const editable = order.status === "in_progress" || order.status === "review";
  // The parent keys this panel by order id, so the draft is re-initialised per order.
  const [autoSend, setAutoSend] = useState(true);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(order.items.map((item) => [item.id, item.result === null ? "" : String(item.result)]))
  );

  const live = useMemo(() => order.items.map((item) => ({ item, ...liveFlag(item, values[item.id] ?? "", order.sex) })), [order, values]);
  const critical = live.filter((row) => row.flag === "critical_low" || row.flag === "critical_high");
  const hasBad = live.some((row) => row.flag === "bad");
  const allFilled = live.length > 0 && live.every((row) => row.value !== null);
  const filled = live.filter((row) => row.value !== null).length;

  // Critical values are never sent automatically: the doctor must hear about them first.
  const willAutoSend = autoSend && !!order.patientPhone && critical.length === 0;

  async function finish(target: "review" | "done") {
    if (!(await onSave(values))) return;
    if (order.status === "in_progress" && !(await onStatus("review"))) return;
    if (target === "done" && (await onStatus("done")) && willAutoSend) await onSend();
  }

  return (
    <aside className="overflow-hidden rounded-3xl border border-brand-border bg-white lg:sticky lg:top-4" aria-label="نتائج الطلب">
      <div className="bg-brand-navy p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-brand-side-muted">
              طلب <span dir="ltr">#{order.number}</span> · {STATUS_LABEL[order.status]}
            </p>
            <h2 className="mt-1 truncate text-2xl font-bold">{order.patientName}</h2>
            <p className="mt-1 text-xs text-brand-side-muted">
              {order.sex === "f" ? "أنثى" : "ذكر"}
              {order.age !== null && ` · ${order.age} سنة`}
              {order.doctorName && ` · ${order.doctorName}`}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="h-9 w-9 shrink-0 rounded-xl bg-white/10 text-lg lg:hidden">×</button>
        </div>
        {order.urgent && <span className="mt-3 inline-block rounded-full bg-red-500/90 px-3 py-0.5 text-xs font-semibold">مستعجل</span>}
        {order.notes && <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-xs text-brand-side-muted">{order.notes}</p>}
      </div>

      {critical.length > 0 && (
        <div role="alert" className="m-4 mb-0 rounded-2xl bg-red-600 px-4 py-3 text-sm text-white">
          <b>قيمة حرجة:</b> {critical.map((row) => row.item.name).join("، ")}. أبلغ الطبيب فوراً قبل إصدار النتيجة.
        </div>
      )}

      <div className="px-4 py-2">
        {order.status === "new" ? (
          <ul className="divide-y divide-brand-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-semibold text-brand-ink">{item.name}</span>
                <span className="text-brand-muted">{item.price.toLocaleString("ar-IQ")}</span>
              </li>
            ))}
          </ul>
        ) : (
          live.map(({ item, flag, value }) => {
            const range = rangeFor(item, order.sex);
            const shown = editable ? value : item.result;
            const shownFlag = editable ? flag : item.flag;
            return (
              <div key={item.id} className="border-b border-brand-line py-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-brand-ink">{item.name}</p>
                    <p className="text-[11px] text-brand-muted" dir="ltr" style={{ textAlign: "right" }}>
                      {range.low ?? "—"} – {range.high ?? "—"} {item.unit ?? ""}
                    </p>
                  </div>
                  {editable ? (
                    <input
                      value={values[item.id] ?? ""}
                      onChange={(event) => setValues((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      inputMode="decimal"
                      dir="ltr"
                      aria-label={`نتيجة ${item.name}`}
                      className="h-11 w-24 rounded-xl border border-brand-border bg-white text-center text-base font-bold text-brand-ink outline-none transition focus:border-brand-blue focus:ring-4 focus:ring-brand-soft"
                    />
                  ) : (
                    <span className="w-24 text-center text-base font-bold text-brand-ink" dir="ltr">{item.result ?? "—"}</span>
                  )}
                  <span className={`w-[72px] rounded-lg px-1 py-1 text-center text-[11px] font-bold ${shownFlag === "bad" ? "bg-red-50 text-red-700" : FLAG_STYLE[(shownFlag as Flag) ?? "none"]}`}>
                    {shownFlag === "bad" ? "غير رقم" : shownFlag ? FLAG_LABEL[shownFlag as Flag] : "—"}
                  </span>
                </div>
                {shown !== null && (
                  <div className="mt-2.5 px-1">
                    <RangeBar value={shown} low={range.low} high={range.high} critLow={item.critLow} critHigh={item.critHigh} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {error && <p role="alert" className="mx-4 mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="space-y-2 border-t border-brand-border bg-brand-bg/60 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-muted">المبلغ</span>
          <label className="flex items-center gap-2 font-bold text-brand-ink">
            {order.total.toLocaleString("ar-IQ")} د.ع
            <button type="button" onClick={() => onPaid(!order.paid)} className={`rounded-full px-3 py-1 text-xs font-semibold ${order.paid ? "bg-brand-mint-soft text-brand-mint-text" : "bg-amber-50 text-amber-800"}`}>
              {order.paid ? "مدفوع ✓" : "غير مدفوع"}
            </button>
          </label>
        </div>

        {order.status === "new" && (
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => onStatus("in_progress")} className="min-h-12 flex-1 rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:opacity-50">
              استلام العينة
            </button>
            <button type="button" disabled={busy} onClick={() => confirm("إلغاء هذا الطلب؟") && onStatus("cancelled")} className="min-h-12 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:opacity-50">
              إلغاء
            </button>
          </div>
        )}

        {editable && (
          <>
            <p className="text-center text-xs text-brand-muted">{filled} من {live.length} نتيجة مُدخلة</p>
            {order.patientPhone ? (
              <label className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 text-xs leading-6 text-brand-ink ring-1 ring-brand-border">
                <input type="checkbox" checked={autoSend && critical.length === 0} disabled={critical.length > 0} onChange={(e) => setAutoSend(e.target.checked)} className="mt-1 h-4 w-4 accent-[#0E2440]" />
                <span>
                  أرسل النتيجة للمراجع على واتساب فور الاعتماد
                  {critical.length > 0 && <b className="block text-red-700">توجد قيمة حرجة: أبلغ الطبيب ثم أرسل يدوياً بعد الإصدار.</b>}
                </span>
              </label>
            ) : (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">لا يوجد رقم واتساب لهذا المراجع، لن تُرسل النتيجة تلقائياً.</p>
            )}
            <button type="button" disabled={busy || !allFilled || hasBad} onClick={() => finish("done")} className="min-h-12 w-full rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:cursor-not-allowed disabled:opacity-45">
              {busy ? "جاري الحفظ..." : `${order.status === "review" ? "اعتماد وإصدار النتيجة" : "اعتماد وإصدار مباشرة"}${willAutoSend ? " وإرسالها" : ""}`}
            </button>
            <div className="flex gap-2">
              <button type="button" disabled={busy || hasBad} onClick={() => onSave(values)} className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-semibold text-brand-ink ring-1 ring-brand-border disabled:opacity-50">حفظ مسودة</button>
              {order.status === "in_progress" && (
                <button type="button" disabled={busy || !allFilled || hasBad} onClick={() => finish("review")} className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-semibold text-brand-ink ring-1 ring-brand-border disabled:opacity-50">للاعتماد لاحقاً</button>
              )}
            </div>
          </>
        )}

        {order.status === "done" && (
          <>
            <button type="button" disabled={busy || !order.patientPhone} onClick={onSend} className="min-h-12 w-full rounded-2xl bg-brand-gold font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover disabled:cursor-not-allowed disabled:opacity-50">
              {order.sentAt ? "إعادة إرسال على واتساب" : "إرسال النتيجة على واتساب"}
            </button>
            {!order.patientPhone && <p className="text-center text-xs text-amber-800">لا يوجد رقم هاتف. افتح صفحة النتيجة وسلّمها مطبوعة.</p>}
            {order.sentAt && <p className="text-center text-xs text-brand-mint-text">أُرسلت {new Date(order.sentAt).toLocaleString("ar-IQ", { timeZone: "Asia/Baghdad", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}</p>}
            <a href={`/result/${order.publicToken}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-brand-ink ring-1 ring-brand-border">
              فتح صفحة النتيجة للطباعة
            </a>
          </>
        )}
      </div>
    </aside>
  );
}
