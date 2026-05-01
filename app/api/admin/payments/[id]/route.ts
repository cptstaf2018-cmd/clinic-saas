import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body: { action: "approve" | "reject" } = await req.json();

  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) {
    return NextResponse.json({ error: "الدفعة غير موجودة" }, { status: 404 });
  }

  if (body.action === "approve") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.$transaction([
      db.payment.update({ where: { id }, data: { status: "approved" } }),
      db.subscription.upsert({
        where: { clinicId: payment.clinicId },
        update: { status: "active", expiresAt },
        create: {
          clinicId: payment.clinicId,
          status: "active",
          plan: "basic",
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  }

  if (body.action === "reject") {
    await db.payment.update({ where: { id }, data: { status: "rejected" } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });
}
