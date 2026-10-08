import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireLab } from "@/lib/lab/access";
import { buildResultMessage, type Flag } from "@/lib/lab/result";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireLab();
  if (access instanceof NextResponse) return access;
  const { id } = await params;

  const order = await db.labOrder.findFirst({
    where: { id, clinicId: access.clinicId },
    include: { items: { orderBy: { name: "asc" } }, clinic: { select: { name: true, whatsappAccessToken: true } } },
  });
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (order.status !== "done") return NextResponse.json({ error: "اعتمد النتيجة قبل إرسالها" }, { status: 409 });
  if (!order.patientPhone) return NextResponse.json({ error: "لا يوجد رقم هاتف لهذا المراجع" }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const message = buildResultMessage({
    labName: order.clinic.name,
    patientName: order.patientName,
    link: `${origin.replace(/\/$/, "")}/result/${order.publicToken}`,
    items: order.items
      .filter((item) => item.result !== null)
      .map((item) => ({ name: item.name, value: item.result as number, unit: item.unit, flag: (item.flag ?? "none") as Flag })),
  });

  try {
    await sendWhatsApp(order.patientPhone, message, order.clinic.whatsappAccessToken ?? undefined, { clinicId: access.clinicId, source: "lab-result" });
  } catch {
    return NextResponse.json({ error: "تعذر إرسال الرسالة على واتساب. تحقق من ربط واتساب في الإعدادات." }, { status: 502 });
  }

  const sentAt = new Date();
  await db.labOrder.update({ where: { id }, data: { sentAt } });
  return NextResponse.json({ success: true, sentAt });
}
