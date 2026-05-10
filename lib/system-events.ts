import { db } from "@/lib/db";
import { Prisma } from "@/app/generated/prisma";

type EventSeverity = "info" | "success" | "warning" | "error";

type EventInput = {
  clinicId?: string | null;
  type: string;
  severity?: EventSeverity;
  source: string;
  title: string;
  message?: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logSystemEvent(event: EventInput) {
  try {
    await db.systemEvent.create({
      data: {
        clinicId: event.clinicId ?? null,
        type: event.type,
        severity: event.severity ?? "info",
        source: event.source,
        title: event.title,
        message: event.message,
        metadata: event.metadata,
      },
    });
  } catch (error) {
    console.error("[SystemEvent] Failed to write event", error);
  }
}
