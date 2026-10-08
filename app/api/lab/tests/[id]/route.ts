import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";
import { parseTestInput } from "@/lib/lab/order";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const parsed = parseTestInput(body as Record<string, unknown>, true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  // Orders keep their own snapshot of ranges, so editing the catalog never rewrites past results.
  const result = await db.labTest.updateMany({ where: { id, clinicId: access.clinicId, active: true }, data: parsed.value });
  if (result.count === 0) return NextResponse.json({ error: "التحليل غير موجود" }, { status: 404 });

  return NextResponse.json(await db.labTest.findFirst({ where: { id, clinicId: access.clinicId } }));
}

/** Tests are archived, not deleted, so old orders keep their link. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const result = await db.labTest.updateMany({ where: { id, clinicId: access.clinicId, active: true }, data: { active: false } });
  if (result.count === 0) return NextResponse.json({ error: "التحليل غير موجود" }, { status: 404 });
  return NextResponse.json({ success: true });
}
