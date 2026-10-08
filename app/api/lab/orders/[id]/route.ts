import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";
import { allResultsEntered, canTransition, parseOrderDetails, planTestChanges } from "@/lib/lab/order";
import { classifyResult, orderTotal, parseResultInput, type Sex } from "@/lib/lab/result";

type Body = {
  status?: unknown;
  paid?: unknown;
  results?: unknown;
  details?: unknown;
  testIds?: unknown;
};

const isClosed = (status: string) => status === "done" || status === "cancelled";

/**
 * One endpoint for everything that happens to an order after it is created:
 * correcting its details, changing its tests, entering results, moving it
 * between stages (including reopening a finished one) and marking it paid.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "طلب غير صحيح" }, { status: 400 });

  const order = await db.labOrder.findFirst({ where: { id, clinicId: access.clinicId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

  // Validate everything before writing anything, so a bad request changes nothing.
  let details: ReturnType<typeof parseOrderDetails> | null = null;
  if (body.details !== undefined) {
    if (order.status === "cancelled") return NextResponse.json({ error: "الطلب ملغى" }, { status: 409 });
    if (typeof body.details !== "object" || body.details === null) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    details = parseOrderDetails(body.details as Record<string, unknown>);
    if (!details.ok) return NextResponse.json({ error: details.error }, { status: 400 });
  }

  let changes: ReturnType<typeof planTestChanges> | null = null;
  let toAdd: Awaited<ReturnType<typeof db.labTest.findMany>> = [];
  if (body.testIds !== undefined) {
    if (order.status !== "new" && order.status !== "in_progress") return NextResponse.json({ error: "لا يمكن تغيير التحاليل في هذه المرحلة" }, { status: 409 });
    if (!Array.isArray(body.testIds) || !body.testIds.every((value) => typeof value === "string")) return NextResponse.json({ error: "تحاليل غير صحيحة" }, { status: 400 });
    changes = planTestChanges(order.items, body.testIds as string[]);
    if (changes.add.length > 0) {
      toAdd = await db.labTest.findMany({ where: { clinicId: access.clinicId, active: true, id: { in: changes.add } } });
      if (toAdd.length !== changes.add.length) return NextResponse.json({ error: "أحد التحاليل غير موجود في الكتالوج" }, { status: 400 });
    }
    if (order.items.length - changes.removeItemIds.length + toAdd.length < 1) return NextResponse.json({ error: "يجب أن يبقى تحليل واحد على الأقل" }, { status: 400 });
  }

  const resultUpdates: { id: string; result: number | null; flag: string | null; enteredAt: Date | null }[] = [];
  if (body.results !== undefined) {
    if (isClosed(order.status)) return NextResponse.json({ error: "لا يمكن تعديل نتائج طلب مغلق" }, { status: 409 });
    if (!Array.isArray(body.results)) return NextResponse.json({ error: "نتائج غير صحيحة" }, { status: 400 });

    const byId = new Map(order.items.map((item) => [item.id, item]));
    const sex = (details?.ok && details.value.sex ? details.value.sex : order.sex) as Sex;
    for (const entry of body.results as { itemId?: unknown; value?: unknown }[]) {
      const item = typeof entry?.itemId === "string" ? byId.get(entry.itemId) : undefined;
      if (!item) return NextResponse.json({ error: "بند غير موجود في هذا الطلب" }, { status: 400 });

      if (entry.value === "" || entry.value === null) {
        resultUpdates.push({ id: item.id, result: null, flag: null, enteredAt: null });
        continue;
      }
      const parsed = parseResultInput(entry.value);
      if (!parsed.ok) return NextResponse.json({ error: `${item.name}: ${parsed.error}` }, { status: 400 });
      resultUpdates.push({ id: item.id, result: parsed.value, flag: classifyResult(parsed.value, item, sex), enteredAt: new Date() });
    }
  }

  if (typeof body.status === "string" && !canTransition(order.status, body.status)) {
    return NextResponse.json({ error: "لا يمكن نقل الطلب إلى هذه المرحلة" }, { status: 409 });
  }

  // ── writes ──
  if (typeof body.paid === "boolean") await db.labOrder.update({ where: { id }, data: { paid: body.paid } });

  if (details?.ok) {
    await db.labOrder.update({ where: { id }, data: details.value });
    // A different sex means different normal ranges: re-judge results already entered.
    if (details.value.sex && details.value.sex !== order.sex) {
      const entered = order.items.filter((item) => item.result !== null);
      await db.$transaction(entered.map((item) => db.labOrderItem.update({ where: { id: item.id }, data: { flag: classifyResult(item.result as number, item, details.value.sex as Sex) } })));
    }
  }

  if (changes) {
    await db.$transaction([
      ...(changes.removeItemIds.length ? [db.labOrderItem.deleteMany({ where: { orderId: id, id: { in: changes.removeItemIds } } })] : []),
      ...toAdd.map((test) =>
        db.labOrderItem.create({
          data: {
            orderId: id, testId: test.id, name: test.name, unit: test.unit, price: test.price,
            refLowM: test.refLowM, refHighM: test.refHighM, refLowF: test.refLowF, refHighF: test.refHighF, critLow: test.critLow, critHigh: test.critHigh,
          },
        })
      ),
    ]);
    const fresh = await db.labOrderItem.findMany({ where: { orderId: id }, select: { price: true } });
    await db.labOrder.update({ where: { id }, data: { total: orderTotal(fresh) } });
  }

  if (resultUpdates.length > 0) {
    await db.$transaction(resultUpdates.map((u) => db.labOrderItem.update({ where: { id: u.id }, data: { result: u.result, flag: u.flag, enteredAt: u.enteredAt } })));
  }

  if (typeof body.status === "string") {
    if (body.status === "review" || body.status === "done") {
      const fresh = await db.labOrderItem.findMany({ where: { orderId: id }, select: { result: true } });
      if (!allResultsEntered(fresh)) return NextResponse.json({ error: "أدخل نتائج كل التحاليل أولاً" }, { status: 400 });
    }
    await db.labOrder.update({
      where: { id },
      data: { status: body.status, ...(body.status === "done" ? { completedAt: new Date() } : order.status === "done" ? { completedAt: null } : {}) },
    });
  }

  const updated = await db.labOrder.findFirst({ where: { id, clinicId: access.clinicId }, include: { items: { orderBy: { name: "asc" } } } });
  return NextResponse.json(updated);
}
