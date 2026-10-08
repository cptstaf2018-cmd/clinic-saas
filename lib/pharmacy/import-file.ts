import { readSheet } from "read-excel-file/node";
import { parseCsv } from "@/lib/pharmacy/import";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

type Read = { ok: true; rows: unknown[][] } | { ok: false; error: string; status: number };

/** Reads an uploaded spreadsheet (.xlsx) or text table (.csv) into rows of cells. */
export async function readUploadedTable(file: File): Promise<Read> {
  if (file.size === 0) return { ok: false, error: "الملف فارغ", status: 400 };
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, error: "حجم الملف أكبر من 5 ميغابايت", status: 413 };

  const name = file.name.toLowerCase();
  let rows: unknown[][];
  try {
    if (name.endsWith(".xlsx")) {
      rows = await readSheet(Buffer.from(await file.arrayBuffer()));
    } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
      rows = parseCsv(await file.text());
    } else if (name.endsWith(".xls")) {
      return { ok: false, error: "صيغة xls القديمة غير مدعومة. افتح الملف في Excel واحفظه بصيغة xlsx ثم ارفعه.", status: 415 };
    } else {
      return { ok: false, error: "ارفع ملف Excel بصيغة xlsx أو ملف csv", status: 415 };
    }
  } catch {
    return { ok: false, error: "تعذر قراءة الملف. تأكد أنه ملف Excel سليم وغير محمي بكلمة مرور.", status: 422 };
  }

  if (rows.length > MAX_IMPORT_ROWS + 20) {
    return { ok: false, error: `الملف يحتوي أكثر من ${MAX_IMPORT_ROWS} سطر. قسّمه إلى ملفات أصغر.`, status: 413 };
  }
  return { ok: true, rows };
}
