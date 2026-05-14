import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinicId = session.user.clinicId;
  const { id } = await params;

  let body: { status?: string; queueStatus?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
  }

  // Verify ownership
  const existing = await db.appointment.findFirst({
    where: { id, clinicId },
  });

  if (!existing) {
    return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
  }

  const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
  const validQueueStatuses = ["waiting", "current", "done"];

  const data: { status?: string; queueStatus?: string; cheerAt?: Date } = {};

  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
    }
    data.status = body.status;
    // جدولة رسالة الاطمئنان بعد يومين عند إكمال الموعد
    if (body.status === "completed") {
      const cheerAt = new Date();
      cheerAt.setDate(cheerAt.getDate() + 2);
      data.cheerAt = cheerAt;
    }
  }

  if (body.queueStatus !== undefined) {
    if (!validQueueStatuses.includes(body.queueStatus)) {
      return NextResponse.json(
        { error: "حالة الطابور غير صالحة" },
        { status: 400 }
      );
    }
    data.queueStatus = body.queueStatus;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const updated = await db.appointment.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
