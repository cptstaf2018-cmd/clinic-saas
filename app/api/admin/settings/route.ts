import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function requireSuperAdmin() {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin") return null;
  return session;
}

export async function GET() {
  if (!(await requireSuperAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.platformSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json({
    logoUrl: settings?.logoUrl ?? null,
    hasWasenderKey: !!settings?.adminWasenderKey,
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireSuperAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.type === "logo") {
    await db.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", logoUrl: body.logoUrl || null },
      update: { logoUrl: body.logoUrl || null },
    });
    return NextResponse.json({ success: true });
  }

  if (body.type === "password") {
    const { currentPassword, newPassword } = body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "البيانات غير مكتملة" }, { status: 400 });

    if (newPassword.length < 6)
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );

    const admin = await db.user.findFirst({ where: { role: "superadmin" } });
    if (!admin)
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid)
      return NextResponse.json(
        { error: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: admin.id }, data: { passwordHash } });

    return NextResponse.json({ success: true });
  }

  if (body.type === "wasender") {
    const { key } = body as { key: string };
    if (!key?.trim())
      return NextResponse.json({ error: "المفتاح مطلوب" }, { status: 400 });

    await db.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", adminWasenderKey: key.trim() },
      update: { adminWasenderKey: key.trim() },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "نوع غير معروف" }, { status: 400 });
}
