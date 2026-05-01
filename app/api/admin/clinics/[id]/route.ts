import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const body: { action: "activate" | "deactivate"; plan?: string; durationDays?: number } =
    await req.json();

  if (body.action === "activate") {
    const plan = body.plan ?? "basic";
    const days = body.durationDays ?? 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await db.subscription.upsert({
      where: { clinicId: id },
      update: { status: "active", plan, expiresAt },
      create: { clinicId: id, status: "active", plan, expiresAt },
    });

    return NextResponse.json({ success: true });
  }

  if (body.action === "deactivate") {
    await db.subscription.upsert({
      where: { clinicId: id },
      update: { status: "inactive" },
      create: {
        clinicId: id,
        status: "inactive",
        plan: "basic",
        expiresAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });
}
