import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Pharmacy APIs serve only clinics whose facility type is "pharmacy".
 * The clinicId always comes from the session, never from the request.
 */
export async function requirePharmacy(): Promise<{ clinicId: string } | NextResponse> {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "pharmacy") {
    return NextResponse.json({ error: "هذه الخدمة للصيدليات فقط" }, { status: 403 });
  }
  return { clinicId };
}
