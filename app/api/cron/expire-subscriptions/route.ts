import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expired = await db.subscription.updateMany({
    where: {
      expiresAt: { lt: now },
      status: { not: "inactive" },
    },
    data: { status: "inactive" },
  });

  // حذف رموز OTP القديمة المنتهية الصلاحية
  const otpCleaned = await db.otpCode.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  return NextResponse.json({ expired: expired.count, otpCleaned: otpCleaned.count });
}
