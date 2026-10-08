"use client";

import type { ImportRow, RowStatus } from "@/lib/pharmacy/import";

/** What the server said about a line, with the name of the line it was merged into. */
export type LineStatus = { kind: RowStatus["kind"] | "invalid"; matchedName?: string; intoName?: string; message?: string };

/** One editable line in the preview. Numbers stay text while typing. */
export type Line = {
  id: number;
  /** Row number in the source sheet, when there is one. */
  sheetRow?: number;
  name: string;
  price: string;
  cost: string;
  stock: string;
  barcode: string;
  expiresAt: string;
  /** Fields the table does not edit but must carry through. */
  rest: Pick<ImportRow, "genericName" | "category" | "form" | "minStock" | "requiresRx">;
};

const CELL = "h-10 w-full rounded-lg border border-brand-border bg-white px-2 text-sm text-brand-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-soft";

export function lineFromRow(row: ImportRow, id: number, sheetRow?: number): Line {
  return {
    id,
    sheetRow,
    name: row.name,
    price: row.price === undefined ? "" : String(row.price),
    cost: row.cost === undefined ? "" : String(row.cost),
    stock: row.stock === undefined ? "" : String(row.stock),
    barcode: row.barcode ?? "",
    expiresAt: row.expiresAt ?? "",
    rest: { genericName: row.genericName, category: row.category, form: row.form, minStock: row.minStock, requiresRx: row.requiresRx },
  };
}

export function lineToRow(line: Line): ImportRow {
  const row: ImportRow = { name: line.name };
  if (line.price !== "") row.price = Number(line.price);
  if (line.cost !== "") row.cost = Number(line.cost);
  if (line.stock !== "") row.stock = Number(line.stock);
  if (line.barcode !== "") row.barcode = line.barcode;
  if (line.expiresAt !== "") row.expiresAt = line.expiresAt;
  for (const [key, value] of Object.entries(line.rest)) {
    if (value !== undefined) (row as Record<string, unknown>)[key] = value;
  }
  return row;
}

function StatusChip({ status }: { status: LineStatus | undefined }) {
  if (!status) return <span className="text-xs text-brand-muted">…</span>;
  switch (status.kind) {
    case "create":
      return <span className="rounded-lg bg-brand-mint-soft px-2 py-1 text-xs font-bold text-brand-mint-text">دواء جديد</span>;
    case "update":
      return <span title={status.matchedName} className="block max-w-[10rem] truncate rounded-lg bg-brand-soft px-2 py-1 text-xs font-bold text-brand-on-soft">موجود · تحديث</span>;
    case "needsPrice":
      return <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800">أدخل سعر البيع</span>;
    case "merged":
      return <span className="rounded-lg bg-brand-line px-2 py-1 text-xs font-semibold text-brand-muted">مدموج مع {status.intoName ? `"${status.intoName.slice(0, 14)}"` : "سطر آخر"}</span>;
    case "invalid":
      return <span title={status.message} className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700">بيانات ناقصة</span>;
    default:
      return <span className="rounded-lg bg-brand-line px-2 py-1 text-xs font-semibold text-brand-muted">بلا تغيير</span>;
  }
}

type Props = {
  lines: Line[];
  statuses: Record<number, LineStatus>;
  onChange: (id: number, patch: Partial<Line>) => void;
  onRemove: (id: number) => void;
};

export default function ImportTable({ lines, statuses, onChange, onRemove }: Props) {
  const digits = (value: string) => value.replace(/\D/g, "");

  return (
    <div className="overflow-x-auto rounded-3xl border border-brand-border bg-white">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-brand-bg text-xs text-brand-muted">
          <tr>
            <th className="w-12 px-3 py-3 text-right font-semibold">#</th>
            <th className="px-3 py-3 text-right font-semibold">الدواء</th>
            <th className="w-28 px-3 py-3 text-right font-semibold">سعر الشراء</th>
            <th className="w-28 px-3 py-3 text-right font-semibold">سعر البيع</th>
            <th className="w-24 px-3 py-3 text-right font-semibold">الكمية</th>
            <th className="w-40 px-3 py-3 text-right font-semibold">الانتهاء</th>
            <th className="w-40 px-3 py-3 text-right font-semibold">الحالة</th>
            <th className="w-12 px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line">
          {lines.map((line, index) => {
            const status = statuses[line.id];
            return (
              <tr key={line.id} className={status?.kind === "needsPrice" ? "bg-amber-50/40" : status?.kind === "merged" ? "opacity-70" : ""}>
                <td className="px-3 py-2 text-xs text-brand-muted">{(line.sheetRow ?? index + 1).toLocaleString("ar-IQ")}</td>
                <td className="px-3 py-2">
                  <input aria-label="اسم الدواء" className={CELL} value={line.name} onChange={(e) => onChange(line.id, { name: e.target.value })} />
                  {line.barcode && <span className="mt-0.5 block text-[11px] text-brand-muted" dir="ltr">{line.barcode}</span>}
                </td>
                <td className="px-3 py-2"><input aria-label="سعر الشراء" className={CELL} inputMode="numeric" dir="ltr" value={line.cost} onChange={(e) => onChange(line.id, { cost: digits(e.target.value) })} /></td>
                <td className="px-3 py-2"><input aria-label="سعر البيع" className={`${CELL} ${status?.kind === "needsPrice" ? "border-amber-400" : ""}`} inputMode="numeric" dir="ltr" value={line.price} onChange={(e) => onChange(line.id, { price: digits(e.target.value) })} /></td>
                <td className="px-3 py-2"><input aria-label="الكمية" className={CELL} inputMode="numeric" dir="ltr" value={line.stock} onChange={(e) => onChange(line.id, { stock: digits(e.target.value) })} /></td>
                <td className="px-3 py-2"><input aria-label="تاريخ الانتهاء" type="date" className={CELL} dir="ltr" value={line.expiresAt} onChange={(e) => onChange(line.id, { expiresAt: e.target.value })} /></td>
                <td className="px-3 py-2"><StatusChip status={status} /></td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => onRemove(line.id)} aria-label={`حذف ${line.name}`} className="h-9 w-9 rounded-lg text-lg text-brand-muted transition hover:bg-red-50 hover:text-red-700">×</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
