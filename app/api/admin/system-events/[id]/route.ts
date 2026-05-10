import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/system-events";

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
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id } = await params;
  const body: { action?: string } = await req.json().catch(() => ({}));

  if (body.action !== "resolve" && body.action !== "reopen") {
    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }

  const resolved = body.action === "resolve";
  const event = await db.systemEvent.update({
    where: { id },
    data: { resolved, resolvedAt: resolved ? new Date() : null },
    select: { id: true, clinicId: true, title: true },
  });

  await logSystemEvent({
    clinicId: event.clinicId,
    type: resolved ? "event_resolved" : "event_reopened",
    severity: "info",
    source: "super_admin",
    title: resolved ? "تمت معالجة حدث" : "إعادة فتح حدث",
    message: event.title,
    metadata: { eventId: event.id },
  });

  return NextResponse.json({ success: true, resolved });
}
