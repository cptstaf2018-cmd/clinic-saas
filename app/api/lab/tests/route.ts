import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";
import { parseTestInput, type TestInput } from "@/lib/lab/order";

const MAX_TESTS = 1000;

export async function GET() {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;

  const tests = await db.labTest.findMany({
    where: { clinicId: access.clinicId, active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: MAX_TESTS,
  });
  return NextResponse.json(tests);
}

export async function POST(req: Request) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const parsed = parseTestInput(body as Record<string, unknown>);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const count = await db.labTest.count({ where: { clinicId: access.clinicId, active: true } });
  if (count >= MAX_TESTS) return NextResponse.json({ error: "وصلت للحد الأقصى من التحاليل" }, { status: 400 });

  const test = await db.labTest.create({ data: { ...(parsed.value as TestInput), clinicId: access.clinicId } });
  return NextResponse.json(test, { status: 201 });
}
