import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  
  // 🔒 CRITICAL: Check role is exactly superadmin
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  // 🔒 CRITICAL: Superadmin MUST NOT have clinicId
  if ((session.user as any).clinicId) {
    console.warn(
      `[SECURITY] Superadmin has clinicId: ${(session.user as any).clinicId}`
    );
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const payments = await db.payment.findMany({
    include: { clinic: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}
