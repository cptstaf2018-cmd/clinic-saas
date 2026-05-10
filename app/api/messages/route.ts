import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const clinicId = session.user.clinicId as string;

  const messages = await db.incomingMessage.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Attach patient name if phone is registered
  const phones = [...new Set(messages.map((m) => m.phone))];
  const patients = await db.patient.findMany({
    where: { clinicId, whatsappPhone: { in: phones } },
    select: { id: true, whatsappPhone: true, name: true },
  });
  const patientMap = Object.fromEntries(patients.map((p) => [p.whatsappPhone, p]));

  return NextResponse.json(
    messages.map((m) => ({
      ...m,
      patientId: patientMap[m.phone]?.id ?? null,
      patientName: patientMap[m.phone]?.name ?? null,
    }))
  );
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const clinicId = session.user.clinicId as string;

  const { id, phone } = await req.json();

  if (phone) {
    await db.incomingMessage.updateMany({
      where: { phone, clinicId },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  await db.incomingMessage.updateMany({
    where: { id, clinicId },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const clinicId = session.user.clinicId as string;

  const body: { phone?: string; message?: string } = await req.json().catch(() => ({}));
  const phone = body.phone?.trim();
  const message = body.message?.trim();

  if (!phone || !message) {
    return NextResponse.json({ error: "رقم المراجع ونص الرسالة مطلوبان" }, { status: 400 });
  }

  if (message.length > 1200) {
    return NextResponse.json({ error: "الرسالة طويلة جداً" }, { status: 400 });
  }

  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    select: { whatsappAccessToken: true },
  });

  const outgoing = await db.incomingMessage.create({
    data: {
      clinicId,
      phone,
      body: message,
      read: true,
      direction: "outbound",
      status: "pending",
    },
  });

  try {
    await sendWhatsApp(phone, message, clinic?.whatsappAccessToken ?? undefined, {
      clinicId,
      source: "manual_reply",
    });

    const sent = await db.incomingMessage.update({
      where: { id: outgoing.id },
      data: { status: "sent" },
    });

    return NextResponse.json(sent, { status: 201 });
  } catch (error) {
    const failed = await db.incomingMessage.update({
      where: { id: outgoing.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "فشل إرسال الرسالة",
      },
    });

    return NextResponse.json(
      { ...failed, error: "فشل إرسال واتساب. تم حفظ الرسالة كفاشلة في المحادثة." },
      { status: 502 }
    );
  }
}
