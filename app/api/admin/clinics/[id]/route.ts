import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function isSuperAdmin(session: any) {
  return session?.user?.role === "superadmin" && !session?.user?.clinicId;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // ── Edit clinic details ───────────────────────────────────────────────────
  if (body.action === "edit") {
    const clinicData: Record<string, string> = {};
    if (body.name?.trim())           clinicData.name           = body.name.trim();
    if (body.whatsappNumber?.trim()) clinicData.whatsappNumber = body.whatsappNumber.trim();

    if (Object.keys(clinicData).length > 0) {
      await db.clinic.update({ where: { id }, data: clinicData });
    }

    if (body.plan || body.status || body.expiresAt) {
      const subData: Record<string, unknown> = {};
      if (body.plan)      subData.plan      = body.plan;
      if (body.status)    subData.status    = body.status;
      if (body.expiresAt) subData.expiresAt = new Date(body.expiresAt);

      await db.subscription.upsert({
        where: { clinicId: id },
        update: subData,
        create: {
          clinicId: id,
          plan: body.plan ?? "basic",
          status: body.status ?? "active",
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  }

  // ── Activate ──────────────────────────────────────────────────────────────
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

  // ── Deactivate ────────────────────────────────────────────────────────────
  if (body.action === "deactivate") {
    await db.subscription.upsert({
      where: { clinicId: id },
      update: { status: "inactive" },
      create: { clinicId: id, status: "inactive", plan: "basic", expiresAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "action غير صحيح" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { id } = await params;

  const clinic = await db.clinic.findUnique({ where: { id } });
  if (!clinic)
    return NextResponse.json({ error: "العيادة غير موجودة" }, { status: 404 });

  // Delete all related data in correct order
  await db.$transaction([
    db.whatsappSession.deleteMany({ where: { clinicId: id } }),
    db.appointment.deleteMany({ where: { clinicId: id } }),
    db.patient.deleteMany({ where: { clinicId: id } }),
    db.workingHours.deleteMany({ where: { clinicId: id } }),
    db.payment.deleteMany({ where: { clinicId: id } }),
    db.subscription.deleteMany({ where: { clinicId: id } }),
    db.user.deleteMany({ where: { clinicId: id } }),
    db.clinic.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
