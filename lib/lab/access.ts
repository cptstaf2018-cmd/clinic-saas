import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Lab APIs serve only clinics whose facility type is "lab".
 * The clinicId always comes from the session, never from the request.
 */
export async function requireLab(): Promise<{ clinicId: string } | NextResponse> {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "lab") {
    return NextResponse.json({ error: "هذه الخدمة للمختبرات فقط" }, { status: 403 });
  }
  return { clinicId };
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
