import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";

const MAX_SUGGESTIONS = 6;
const MIN_QUERY = 2;

/** Previous patients of this lab matching a name or phone fragment, newest first. */
export async function GET(req: NextRequest) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < MIN_QUERY) return NextResponse.json([]);

  const rows = await db.labOrder.findMany({
    where: {
      clinicId: access.clinicId,
      OR: [{ patientName: { contains: q, mode: "insensitive" } }, { patientPhone: { contains: q } }],
    },
    distinct: ["patientName", "patientPhone"],
    orderBy: { createdAt: "desc" },
    take: MAX_SUGGESTIONS,
    select: { patientName: true, patientPhone: true, sex: true, age: true, doctorName: true },
  });
  return NextResponse.json(rows);
}
