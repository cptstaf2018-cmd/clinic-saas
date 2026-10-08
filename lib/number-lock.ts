import type { Prisma } from "@/app/generated/prisma";

/**
 * Invoice and order numbers are "last number + 1" per facility. Two requests at the same moment
 * would read the same last number, so each takes this lock first: the second waits until the
 * first has committed (the lock is released automatically at commit or rollback).
 */
export async function lockNumbering(tx: Prisma.TransactionClient, scope: string, clinicId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${scope}:${clinicId}`}))`;
}

/** Time a request may wait for the lock and for the whole transaction, in milliseconds. */
export const NUMBERED_TRANSACTION = { maxWait: 10_000, timeout: 20_000 } as const;
