import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const clinics = await db.clinic.findMany({
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clinics);
}
