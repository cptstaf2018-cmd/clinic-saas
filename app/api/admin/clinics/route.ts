import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function isSuperAdmin(session: any) {
  return session?.user?.role === "superadmin" && !session?.user?.clinicId;
}

export async function GET() {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const clinics = await db.clinic.findMany({
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clinics);
}

export async function DELETE() {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  // Fetch all clinic IDs
  const clinics = await db.clinic.findMany({ select: { id: true } });
  const ids = clinics.map((c: { id: string }) => c.id);

  if (ids.length === 0) return NextResponse.json({ deleted: 0 });

  // Delete all data for all clinics in one transaction
  await db.$transaction([
    db.whatsappSession.deleteMany({ where: { clinicId: { in: ids } } }),
    db.incomingMessage.deleteMany({ where: { clinicId: { in: ids } } }),
    db.medicalRecord.deleteMany({ where: { clinicId: { in: ids } } }),
    db.appointment.deleteMany({ where: { clinicId: { in: ids } } }),
    db.patient.deleteMany({ where: { clinicId: { in: ids } } }),
    db.workingHours.deleteMany({ where: { clinicId: { in: ids } } }),
    db.payment.deleteMany({ where: { clinicId: { in: ids } } }),
    db.subscription.deleteMany({ where: { clinicId: { in: ids } } }),
    db.user.deleteMany({ where: { clinicId: { in: ids } } }),
    db.clinic.deleteMany({ where: { id: { in: ids } } }),
  ]);

  return NextResponse.json({ deleted: ids.length });
}
