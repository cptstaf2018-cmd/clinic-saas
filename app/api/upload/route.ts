import { auth } from "@/lib/auth";
import { uploadFile, isStorageConfigured } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

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

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم — يُسمح بـ JPG, PNG, PDF فقط" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "حجم الملف أكبر من 10MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = session.user.clinicId;
  const url = await uploadFile(buffer, file.name, file.type, folder);

  if (!url) {
    return NextResponse.json({ error: "فشل رفع الملف" }, { status: 500 });
  }

  const fileType = file.type.startsWith("image/") ? "image" : "pdf";
  return NextResponse.json({ url, fileType, fileName: file.name });
}
