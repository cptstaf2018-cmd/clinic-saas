import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";
import { STARTER_TESTS } from "@/lib/lab/starter-tests";

/** Adds the common-tests starter pack, skipping names the lab already has. */
export async function POST() {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;

  const existing = await db.labTest.findMany({ where: { clinicId: access.clinicId, active: true }, select: { name: true } });
  const have = new Set(existing.map((test) => test.name));
  const fresh = STARTER_TESTS.filter((test) => !have.has(test.name));
  if (fresh.length > 0) {
    await db.labTest.createMany({ data: fresh.map((test) => ({ ...test, clinicId: access.clinicId, price: 0 })) });
  }
  return NextResponse.json({ added: fresh.length });
}
