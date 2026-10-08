import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discardImage, receiveImage, sendImage } from "@/lib/entity-image";
import { requireLab } from "@/lib/lab/access";

type Ctx = { params: Promise<{ id: string }> };

const findTest = (id: string, clinicId: string) =>
  db.labTest.findFirst({ where: { id, clinicId, active: true }, select: { id: true, imagePath: true } });

export async function GET(_req: Request, { params }: Ctx) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const test = await findTest((await params).id, access.clinicId);
  return sendImage(test?.imagePath ?? null);
}

export async function POST(req: Request, { params }: Ctx) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const test = await findTest((await params).id, access.clinicId);
  if (!test) return NextResponse.json({ error: "التحليل غير موجود" }, { status: 404 });

  const saved = await receiveImage(req, `lab/${access.clinicId}`);
  if (saved instanceof NextResponse) return saved;

  await db.labTest.updateMany({ where: { id: test.id, clinicId: access.clinicId }, data: { imagePath: saved.path } });
  await discardImage(test.imagePath);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const test = await findTest((await params).id, access.clinicId);
  if (!test) return NextResponse.json({ error: "التحليل غير موجود" }, { status: 404 });

  await db.labTest.updateMany({ where: { id: test.id, clinicId: access.clinicId }, data: { imagePath: null } });
  await discardImage(test.imagePath);
  return NextResponse.json({ success: true });
}
