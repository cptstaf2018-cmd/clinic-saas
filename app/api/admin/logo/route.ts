import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) return NextResponse.json({ error: "لم يتم إرفاق صورة" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم (JPG, PNG, WEBP, SVG)" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الصورة يجب أن يكون أقل من 2MB" }, { status: 400 });
  }

  const ext = file.type.split("/")[1].replace("svg+xml", "svg");
  const blob = await put(`platform/logo-${Date.now()}.${ext}`, file, { access: "public" });

  await db.platformSettings.upsert({
    where: { id: "singleton" },
    update: { logoUrl: blob.url },
    create: { id: "singleton", logoUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
