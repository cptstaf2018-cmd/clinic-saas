import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * ONE_DAY_MS;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expired = await db.subscription.updateMany({
    where: { expiresAt: { lt: now }, status: { not: "inactive" } },
    data: { status: "inactive" },
  });

  const otpCleaned = await db.otpCode.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  // Clean abandoned WhatsApp sessions older than 24 hours (no activity)
  const oneDayAgo = new Date(now.getTime() - ONE_DAY_MS);
  const sessionsCleaned = await db.whatsappSession.deleteMany({
    where: { updatedAt: { lt: oneDayAgo } },
  });

  // Archive incoming messages older than 90 days to keep the table small
  const ninetyDaysAgo = new Date(now.getTime() - NINETY_DAYS_MS);
  const messagesCleaned = await db.incomingMessage.deleteMany({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });

  // Clean resolved system events older than 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * ONE_DAY_MS);
  const eventsCleaned = await db.systemEvent.deleteMany({
    where: { resolved: true, resolvedAt: { lt: thirtyDaysAgo } },
  });

  return NextResponse.json({
    expired: expired.count,
    otpCleaned: otpCleaned.count,
    sessionsCleaned: sessionsCleaned.count,
    messagesCleaned: messagesCleaned.count,
    eventsCleaned: eventsCleaned.count,
  });
}
