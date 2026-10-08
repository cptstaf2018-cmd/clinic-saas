import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePharmacy } from "@/lib/pharmacy/access";
import {
  planImport,
  sanitizeImportRow,
  type ImportRow,
  type ImportUpdate,
  type StockMode,
} from "@/lib/pharmacy/import";
import { MAX_IMPORT_ROWS } from "@/lib/pharmacy/import-file";

const MAX_PRODUCTS = 5000;
const CREATE_CHUNK = 500;
const TRANSACTION_MS = 120_000;

const toDate = (iso: string | undefined) => (iso ? new Date(iso) : null);

function createData(clinicId: string, row: ImportRow) {
  return {
    clinicId,
    name: row.name,
    genericName: row.genericName ?? null,
    category: row.category ?? "أدوية",
    form: row.form ?? null,
    barcode: row.barcode ?? null,
    price: row.price ?? 0,
    cost: row.cost ?? 0,
    stock: row.stock ?? 0,
    minStock: row.minStock ?? 0,
    requiresRx: row.requiresRx ?? false,
    expiresAt: toDate(row.expiresAt),
  };
}

function updateData(update: ImportUpdate, stockMode: StockMode) {
  const { stock, expiresAt, ...rest } = update.patch;
  return {
    ...rest,
    ...(expiresAt !== undefined ? { expiresAt: toDate(expiresAt) } : {}),
    ...(stock !== undefined ? { stock: stockMode === "add" && update.stockDelta !== undefined ? { increment: update.stockDelta } : stock } : {}),
  };
}

/**
 * Previews (dryRun) or applies a bulk add / update of medicines.
 * Rows are re-validated here: the browser's cleaning is never trusted.
 */
export async function POST(req: Request) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;
  const { clinicId } = access;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });
  }
  if (body.rows.length === 0) return NextResponse.json({ error: "لا توجد أدوية للإضافة" }, { status: 400 });
  if (body.rows.length > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: `الحد الأقصى ${MAX_IMPORT_ROWS} دواء في المرة الواحدة` }, { status: 413 });
  }
  const stockMode: StockMode = body.stockMode === "replace" ? "replace" : "add";
  const dryRun = body.dryRun === true;

  // Keep a map from the cleaned rows back to the rows the browser sent, so statuses line up.
  const cleaned: ImportRow[] = [];
  const sourceIndex: number[] = [];
  const rejected: { index: number; messages: string[] }[] = [];
  body.rows.forEach((raw: unknown, index: number) => {
    const { row, issues } = sanitizeImportRow(raw);
    if (row) {
      cleaned.push(row);
      sourceIndex.push(index);
    } else rejected.push({ index, messages: issues });
  });

  const existing = await db.pharmacyProduct.findMany({
    where: { clinicId, active: true },
    select: { id: true, name: true, barcode: true, stock: true },
  });
  const plan = planImport(cleaned, existing, stockMode);

  if (existing.length + plan.creates.length > MAX_PRODUCTS) {
    return NextResponse.json({ error: `لا يمكن تجاوز ${MAX_PRODUCTS} منتج في الصيدلية الواحدة` }, { status: 400 });
  }

  const statuses = new Array(body.rows.length).fill(null) as (typeof plan.statuses[number] | null)[];
  plan.statuses.forEach((status, i) => {
    statuses[sourceIndex[i]] = status.into !== undefined ? { ...status, into: sourceIndex[status.into] } : status;
  });

  const summary = {
    creates: plan.creates.length,
    updates: plan.updates.length,
    needsPrice: plan.needsPrice.length,
    unchanged: plan.unchanged,
    merged: plan.merged,
    rejected: rejected.length,
  };
  if (dryRun) return NextResponse.json({ summary, statuses, rejected });

  try {
    await db.$transaction(
      async (tx) => {
        for (let i = 0; i < plan.creates.length; i += CREATE_CHUNK) {
          await tx.pharmacyProduct.createMany({
            data: plan.creates.slice(i, i + CREATE_CHUNK).map((row) => createData(clinicId, row)),
          });
        }
        for (const update of plan.updates) {
          // scoped by clinicId, so an id from another pharmacy updates nothing
          await tx.pharmacyProduct.updateMany({
            where: { id: update.id, clinicId, active: true },
            data: updateData(update, stockMode),
          });
        }
      },
      { timeout: TRANSACTION_MS, maxWait: 10_000 }
    );
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "يوجد دواء آخر بنفس الباركود. راجع الباركودات المكررة." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ summary, statuses, rejected });
}
