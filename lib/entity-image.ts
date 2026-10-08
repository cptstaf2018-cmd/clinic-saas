import { NextResponse } from "next/server";
import { detectImageType } from "@/lib/image-type";
import { deleteFile, downloadFile, isStorageConfigured, uploadFile } from "@/lib/storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const BROWSER_CACHE_SECONDS = 86_400;

/**
 * Shared image handling for products and lab tests. Each caller has already
 * proven the clinic owns the record; these helpers only deal with the file.
 */
export async function receiveImage(req: Request, folder: string): Promise<{ path: string } | NextResponse> {
  if (!isStorageConfigured()) return NextResponse.json({ error: "التخزين غير مفعّل" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "لم يُرسل ملف" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "حجم الصورة أكبر من 5MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = detectImageType(buffer);
  if (!type) return NextResponse.json({ error: "الصورة يجب أن تكون JPG أو PNG أو WebP" }, { status: 400 });

  // The stored name is generated here; nothing from the uploaded file name is used.
  const path = await uploadFile(buffer, `image.${type.ext}`, type.mime, folder);
  if (!path) return NextResponse.json({ error: "تعذر حفظ الصورة، حاول مجدداً" }, { status: 502 });
  return { path };
}

export async function sendImage(path: string | null): Promise<Response> {
  if (!path) return new NextResponse(null, { status: 404 });
  const buffer = await downloadFile(path);
  const type = buffer ? detectImageType(buffer) : null;
  if (!buffer || !type) return new NextResponse(null, { status: 404 });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": type.mime,
      "Cache-Control": `private, max-age=${BROWSER_CACHE_SECONDS}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function discardImage(path: string | null): Promise<void> {
  if (path) await deleteFile(path).catch(() => undefined);
}
