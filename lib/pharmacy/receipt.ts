import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { parseExpiry, type ImportRow } from "@/lib/pharmacy/import";

const MODEL = "claude-opus-5-5";
const MAX_OUTPUT_TOKENS = 16_000;

const ReceiptSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe("Product name exactly as printed, in its original language and spelling"),
      quantity: z.number().describe("Units received on this line"),
      bonusQuantity: z.number().nullable().describe("Free/bonus units on this line, or null"),
      unitCost: z.number().nullable().describe("Purchase price of ONE unit in IQD, or null when not readable"),
      barcode: z.string().nullable().describe("Barcode digits if printed on the line, else null"),
      expiry: z.string().nullable().describe("Expiry date if printed (as written), else null"),
    })
  ),
});

const PROMPT = `هذا وصل شراء (فاتورة مورّد) لصيدلية في العراق، وقد يكون بالعربية أو الإنجليزية أو كليهما، مطبوعاً أو بخط اليد.
This is a supplier purchase receipt for a pharmacy in Iraq.

Extract ONE entry per medicine/product line.
- name: exactly as printed. Do not translate, correct or complete it.
- quantity: units received on that line (digits only).
- bonusQuantity: free/bonus units if the line shows them, otherwise null.
- unitCost: the purchase price of a single unit in IQD. If only a line total is printed, divide it by the quantity. If you cannot read it, null.
- barcode / expiry: only if printed on that line, otherwise null.
Ignore totals, discounts, taxes, delivery, headers and payment lines. Never invent a line or a number that is not visible. If the image is not a purchase receipt, return an empty list.`;

export type ReceiptSource = { kind: "image"; mime: "image/jpeg" | "image/png" | "image/webp" } | { kind: "pdf" };

export class ReceiptNotConfigured extends Error {}

/** Reads a purchase receipt (photo or PDF) into product lines with Claude. Throws ReceiptNotConfigured without an API key. */
export async function readReceipt(data: Buffer, source: ReceiptSource): Promise<ImportRow[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new ReceiptNotConfigured();

  const client = new Anthropic({ apiKey });
  const base64 = data.toString("base64");
  const document =
    source.kind === "pdf"
      ? ({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as const)
      : ({ type: "image", source: { type: "base64", media_type: source.mime, data: base64 } } as const);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(ReceiptSchema) },
    messages: [{ role: "user", content: [document, { type: "text", text: PROMPT }] }],
  });

  const items = response.parsed_output?.items ?? [];
  const rows: ImportRow[] = [];
  for (const item of items) {
    const name = item.name.replace(/\s+/g, " ").trim().slice(0, 120);
    if (!name) continue;
    const row: ImportRow = { name };
    const units = Math.round(item.quantity + (item.bonusQuantity ?? 0));
    if (Number.isFinite(units) && units >= 0) row.stock = units;
    if (item.unitCost !== null && Number.isFinite(item.unitCost) && item.unitCost >= 0) row.cost = Math.round(item.unitCost);
    const barcode = item.barcode?.replace(/\s+/g, "").slice(0, 64);
    if (barcode) row.barcode = barcode;
    const expiry = item.expiry ? parseExpiry(item.expiry) : null;
    if (expiry) row.expiresAt = expiry;
    rows.push(row);
  }
  return rows;
}
