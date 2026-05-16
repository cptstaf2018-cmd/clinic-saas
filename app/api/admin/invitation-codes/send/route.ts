import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

function isSuperAdmin(session: any) {
  return session?.user?.role === "superadmin" && !session?.user?.clinicId;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { codeId, phone } = await req.json();

  if (!codeId || !phone?.trim())
    return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });

  if (!/^07\d{8,9}$/.test(phone.trim()))
    return NextResponse.json({ error: "رقم الهاتف غير صحيح" }, { status: 400 });

  const record = await db.invitationCode.findUnique({ where: { id: codeId } });
  if (!record)
    return NextResponse.json({ error: "الكود غير موجود" }, { status: 404 });
  if (record.used)
    return NextResponse.json({ error: "الكود مستخدم مسبقاً" }, { status: 400 });

  const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
  if (!settings?.adminWasenderKey)
    return NextResponse.json({ error: "مفتاح واتساب النظام غير مفعّل — افتح الإعدادات وأضفه أولاً" }, { status: 400 });

  await sendWhatsApp(
    phone.trim(),
    `مرحباً 👋\n\nكود تسجيلك في منصة عيادتي:\n\n*${record.code}*\n\nسجّل عيادتك على:\nwww.clinic-ai-pro.com/register\n\nفريق عيادتي`,
    settings.adminWasenderKey
  );

  return NextResponse.json({ success: true });
}
