import { createHash } from "crypto";
import { db } from "@/lib/db";
import { logSystemEvent } from "@/lib/system-events";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_ACCOUNT = 8;
const MAX_FAILURES_PER_IP = 40;
const EVENT_TYPE = "login_failed";

/**
 * Failed sign-ins are kept in the database (not in server memory), so the limit holds across every
 * serverless instance. Only a short hash of the e-mail and of the IP is stored, never the values.
 */
const fingerprint = (kind: "account" | "ip", value: string) =>
  `${kind}:${createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24)}`;

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}

async function recentFailures(fp: string): Promise<number> {
  return db.systemEvent.count({
    where: { type: EVENT_TYPE, createdAt: { gte: new Date(Date.now() - WINDOW_MS) }, message: { contains: fp } },
  });
}

export async function isLoginBlocked(identifier: string, ip: string): Promise<boolean> {
  const [account, byIp] = await Promise.all([recentFailures(fingerprint("account", identifier)), recentFailures(fingerprint("ip", ip))]);
  return account >= MAX_FAILURES_PER_ACCOUNT || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordLoginFailure(identifier: string, ip: string): Promise<void> {
  await logSystemEvent({
    type: EVENT_TYPE,
    severity: "info",
    source: "auth",
    title: "محاولة دخول فاشلة",
    message: `${fingerprint("account", identifier)} ${fingerprint("ip", ip)}`,
  });
}
