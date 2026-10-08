import { db } from "@/lib/db";

const BOARD_LIMIT = 300;
const DONE_VISIBLE_HOURS = 24;

/** Orders shown on the lab board: everything open, plus what was finished in the last day. */
export function listBoardOrders(clinicId: string) {
  const since = new Date(Date.now() - DONE_VISIBLE_HOURS * 3_600_000);
  return db.labOrder.findMany({
    where: {
      clinicId,
      OR: [{ status: { in: ["new", "in_progress", "review"] } }, { status: "done", completedAt: { gte: since } }],
    },
    orderBy: { createdAt: "asc" },
    take: BOARD_LIMIT,
    include: { items: { orderBy: { name: "asc" } } },
  });
}
