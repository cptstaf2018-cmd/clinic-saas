import { auth } from "@/lib/auth";
import { uploadFile, isStorageConfigured } from "@/lib/storage";
import { NextResponse } from "next/server";
import path from "path";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// Check actual file content via magic bytes — not the browser-supplied MIME
function detectFileType(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return "image/webp";
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "التخزين غير مفعّل" }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "لم يُرسل ملف" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "حجم الملف أكبر من 10MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify actual file content — not the browser-supplied MIME type
  const detectedType = detectFileType(buffer);
  if (!detectedType) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم — يُسمح بـ JPG, PNG, WebP, PDF فقط" }, { status: 400 });
  }

  const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = session.user.clinicId;
  const url = await uploadFile(buffer, safeName, detectedType, folder);

  if (!url) {
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
  }

  const fileType = detectedType.startsWith("image/") ? "image" : "pdf";
  return NextResponse.json({ url, fileType, fileName: file.name });
}
