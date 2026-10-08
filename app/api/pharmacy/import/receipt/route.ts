import { NextResponse } from "next/server";
import { requirePharmacy } from "@/lib/pharmacy/access";
import { detectImageType } from "@/lib/image-type";
import { ReceiptNotConfigured, readReceipt, type ReceiptSource } from "@/lib/pharmacy/receipt";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

function sourceOf(data: Buffer): ReceiptSource | null {
  if (data.subarray(0, 5).toString("ascii") === "%PDF-") return { kind: "pdf" };
  const image = detectImageType(data);
  return image ? { kind: "image", mime: image.mime } : null;
}

/** Reads a purchase receipt (photo or PDF) and returns the product lines found, for the owner to review. */
export async function POST(req: Request) {
  const access = await requirePharmacy();
  if (access instanceof NextResponse) return access;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "اختر صورة الوصل أو ملف PDF" }, { status: 400 });

  const data = Buffer.from(await file.arrayBuffer());
  const source = sourceOf(data);
  if (!source) return NextResponse.json({ error: "ارفع صورة (JPG أو PNG أو WebP) أو ملف PDF" }, { status: 415 });
  if (data.length > (source.kind === "pdf" ? MAX_PDF_BYTES : MAX_IMAGE_BYTES)) {
    return NextResponse.json({ error: "الملف كبير جداً. صوّر الوصل بدقة أقل أو قصّه." }, { status: 413 });
  }

  try {
    const rows = await readReceipt(data, source);
    return NextResponse.json({ rows });
  } catch (error: unknown) {
    if (error instanceof ReceiptNotConfigured) {
      return NextResponse.json({ error: "قراءة الوصل التلقائية غير مفعّلة بعد. يمكنك الآن رفع ملف Excel أو استخدام الباركود." }, { status: 503 });
    }
    console.error("receipt reading failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "تعذرت قراءة الوصل. جرّب صورة أوضح أو أضف الأدوية من ملف Excel." }, { status: 502 });
  }
}
