import { NextResponse } from "next/server";
import { requirePharmacy } from "@/lib/pharmacy/access";
import {
  IMPORT_FIELDS,
  detectTable,
  rowToImportRow,
  type ColumnMapping,
  type ImportRow,
} from "@/lib/pharmacy/import";
import { MAX_IMPORT_ROWS, readUploadedTable } from "@/lib/pharmacy/import-file";

/** A mapping sent back by the browser after the owner fixed a column by hand. */
function parseMappingOverride(raw: FormDataEntryValue | null, columns: number): ColumnMapping | null {
  if (typeof raw !== "string" || !raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;
  const mapping = {} as ColumnMapping;
  for (const field of IMPORT_FIELDS) {
    const value = record[field];
    mapping[field] = typeof value === "number" && Number.isInteger(value) && value >= 0 && value < columns ? value : null;
  }
  return mapping;
}

export async function POST(req: Request) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return NextResponse.json({ error: "اختر ملفاً أولاً" }, { status: 400 });

  const read = await readUploadedTable(file);
  if (!read.ok) return NextResponse.json({ error: read.error }, { status: read.status });

  const table = detectTable(read.rows);
  const columns = Math.max(table.headers.length, ...table.dataRows.slice(0, 50).map((row) => row.length));
  const mapping = parseMappingOverride(form.get("mapping"), columns) ?? table.mapping;

  const items: { line: number; row: ImportRow }[] = [];
  const problems: { line: number; messages: string[] }[] = [];
  if (mapping.name !== null) {
    table.dataRows.forEach((cells, offset) => {
      const line = table.headerIndex + offset + 2; // 1-based sheet row
      const { row, issues } = rowToImportRow(cells, mapping);
      if (row) items.push({ line, row });
      if (issues.length > 0) problems.push({ line, messages: issues });
    });
  }

  if (items.length > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: `الملف يحتوي أكثر من ${MAX_IMPORT_ROWS} دواء. قسّمه إلى ملفات أصغر.` }, { status: 413 });
  }

  return NextResponse.json({
    headers: table.headers,
    columns,
    mapping,
    needsMapping: mapping.name === null,
    items,
    problems,
  });
}
