import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/system-events";
import { dateAfterDays, PAID_SUBSCRIPTION_DAYS, TRIAL_PERIOD_DAYS } from "@/lib/subscription-durations";

type AdminSession = {
  user?: {
    role?: string | null;
    clinicId?: string | null;
  };
} | null;

function isSuperAdmin(session: AdminSession) {
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

    await logSystemEvent({
      clinicId: id,
      type: "clinic_updated",
      severity: "info",
      source: "super_admin",
      title: "تعديل بيانات عيادة",
      message: "تم تعديل بيانات العيادة أو الاشتراك من السوبر أدمن.",
      metadata: { changedFields: Object.keys(body) },
    });

    return NextResponse.json({ success: true });
  }

  // ── Activate ──────────────────────────────────────────────────────────────
  if (body.action === "activate") {
    const plan = body.plan ?? "basic";
    const isTrialPlan = plan === "trial";
    const expiresAt = dateAfterDays(isTrialPlan ? TRIAL_PERIOD_DAYS : PAID_SUBSCRIPTION_DAYS);
    const status = isTrialPlan ? "trial" : "active";
    await db.subscription.upsert({
      where: { clinicId: id },
      update: { status, plan, expiresAt },
      create: { clinicId: id, status, plan, expiresAt },
    });
    await logSystemEvent({
      clinicId: id,
      type: "clinic_activated",
      severity: "success",
      source: "super_admin",
      title: "تفعيل عيادة",
      message: `تم تفعيل العيادة على باقة ${plan}.`,
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
    await logSystemEvent({
      clinicId: id,
      type: "clinic_deactivated",
      severity: "warning",
      source: "super_admin",
      title: "إيقاف عيادة",
      message: "تم إيقاف اشتراك العيادة من السوبر أدمن.",
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

  await logSystemEvent({
    clinicId: id,
    type: "clinic_deleted",
    severity: "warning",
    source: "super_admin",
    title: "حذف عيادة",
    message: `تم حذف العيادة: ${clinic.name}`,
  });

  // Delete all related data in correct order
  await db.$transaction([
    db.systemEvent.deleteMany({ where: { clinicId: id } }),
    db.clinicFeatureTrial.deleteMany({ where: { clinicId: id } }),
    db.whatsappSession.deleteMany({ where: { clinicId: id } }),
    db.incomingMessage.deleteMany({ where: { clinicId: id } }),
    db.medicalRecord.deleteMany({ where: { clinicId: id } }),
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
