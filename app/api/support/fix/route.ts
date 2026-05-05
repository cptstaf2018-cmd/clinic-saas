import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const clinicId = session.user.clinicId as string;
  const { action } = await req.json();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  switch (action) {
    case "clear-sessions": {
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const result = await db.whatsappSession.deleteMany({
        where: { clinicId, updatedAt: { lt: cutoff } },
      });
      return NextResponse.json({
        success: true,
        message: `تم مسح ${result.count} محادثة معلقة`,
      });
    }

    case "fix-pending": {
      const result = await db.appointment.updateMany({
        where: { clinicId, status: "pending", date: { lt: todayStart } },
        data: { status: "completed", queueStatus: "done" },
      });
      return NextResponse.json({
        success: true,
        message: `تم إكمال ${result.count} موعد معلق من أيام سابقة`,
      });
    }

    case "reset-queue": {
      await db.appointment.updateMany({
        where: { clinicId, queueStatus: "current" },
        data: { queueStatus: "waiting" },
      });
      return NextResponse.json({
        success: true,
        message: "تم إعادة تعيين الطابور — المريض الحالي عاد إلى الانتظار",
      });
    }

    default:
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
}
