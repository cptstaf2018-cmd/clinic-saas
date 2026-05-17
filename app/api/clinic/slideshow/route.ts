import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_SLIDES = 5;
const MAX_SIZE = 1024 * 1024; // 1MB per image

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { slideshowImages: true },
  });

  return NextResponse.json({ images: clinic?.slideshowImages ?? [] });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { slideshowImages: true },
  });

  if ((clinic?.slideshowImages ?? []).length >= MAX_SLIDES) {
    return NextResponse.json({ error: `الحد الأقصى ${MAX_SLIDES} صور` }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "لم يتم إرفاق صورة" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "JPG, PNG, WEBP فقط" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "الحجم الأقصى 1MB لكل صورة" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const current = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { slideshowImages: true },
  });

  const updated = await db.clinic.update({
    where: { id: session.user.clinicId },
    data: { slideshowImages: [...(current?.slideshowImages ?? []), dataUrl] },
    select: { slideshowImages: true },
  });

  return NextResponse.json({ images: updated.slideshowImages });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { index } = await req.json();
  if (typeof index !== "number") return NextResponse.json({ error: "index مطلوب" }, { status: 400 });

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { slideshowImages: true },
  });

  const images = [...(clinic?.slideshowImages ?? [])];
  if (index < 0 || index >= images.length) {
    return NextResponse.json({ error: "index غير صحيح" }, { status: 400 });
  }

  images.splice(index, 1);

  const updated = await db.clinic.update({
    where: { id: session.user.clinicId },
    data: { slideshowImages: images },
    select: { slideshowImages: true },
  });

  return NextResponse.json({ images: updated.slideshowImages });
}
