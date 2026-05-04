import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
  if (file.size > 512 * 1024) {
    return NextResponse.json({ error: "حجم الصورة يجب أن يكون أقل من 512KB" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  await db.platformSettings.upsert({
    where: { id: "singleton" },
    update: { logoUrl: dataUrl },
    create: { id: "singleton", logoUrl: dataUrl },
  });

  return NextResponse.json({ url: dataUrl });
}
