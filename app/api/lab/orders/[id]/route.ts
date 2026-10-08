import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";
import { allResultsEntered, canTransition } from "@/lib/lab/order";
import { classifyResult, parseResultInput, type Sex } from "@/lib/lab/result";

type Body = { status?: unknown; paid?: unknown; results?: unknown };

/**
 * One endpoint for everything that happens to an order after it is created:
 * entering results, moving it between stages, and marking it paid.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const order = await db.labOrder.findFirst({ where: { id, clinicId: access.clinicId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  if (typeof body.paid === "boolean") {
    await db.labOrder.update({ where: { id }, data: { paid: body.paid } });
  }

  if (body.results !== undefined) {
    if (order.status === "done" || order.status === "cancelled") {
      return NextResponse.json({ error: "لا يمكن تعديل نتائج طلب مغلق" }, { status: 409 });
    }
    if (!Array.isArray(body.results)) return NextResponse.json({ error: "نتائج غير صحيحة" }, { status: 400 });

    const byId = new Map(order.items.map((item) => [item.id, item]));
    const updates: { id: string; result: number | null; flag: string | null; enteredAt: Date | null }[] = [];
    for (const entry of body.results as { itemId?: unknown; value?: unknown }[]) {
      const item = typeof entry?.itemId === "string" ? byId.get(entry.itemId) : undefined;
      if (!item) return NextResponse.json({ error: "بند غير موجود في هذا الطلب" }, { status: 400 });

      if (entry.value === "" || entry.value === null) {
        updates.push({ id: item.id, result: null, flag: null, enteredAt: null });
        continue;
      }
      const parsed = parseResultInput(entry.value);
      if (!parsed.ok) return NextResponse.json({ error: `${item.name}: ${parsed.error}` }, { status: 400 });
      updates.push({ id: item.id, result: parsed.value, flag: classifyResult(parsed.value, item, order.sex as Sex), enteredAt: new Date() });
    }
    await db.$transaction(updates.map((u) => db.labOrderItem.update({ where: { id: u.id }, data: { result: u.result, flag: u.flag, enteredAt: u.enteredAt } })));
  }

  if (typeof body.status === "string") {
    if (!canTransition(order.status, body.status)) {
      return NextResponse.json({ error: "لا يمكن نقل الطلب إلى هذه المرحلة" }, { status: 409 });
    }
    if (body.status === "review" || body.status === "done") {
      const fresh = await db.labOrderItem.findMany({ where: { orderId: id }, select: { result: true } });
      if (!allResultsEntered(fresh)) return NextResponse.json({ error: "أدخل نتائج كل التحاليل أولاً" }, { status: 400 });
    }
    await db.labOrder.update({ where: { id }, data: { status: body.status, ...(body.status === "done" ? { completedAt: new Date() } : {}) } });
  }

  const updated = await db.labOrder.findFirst({ where: { id, clinicId: access.clinicId }, include: { items: { orderBy: { name: "asc" } } } });
  return NextResponse.json(updated);
}
