import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSecretaryRole } from "@/lib/clinic-roles";

const DISABLED_SECRETARY_ROLE = "secretary_disabled";

function canManageTeam(role: string | null | undefined) {
  return role === "doctor" || role === "staff";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!canManageTeam(session.user.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const users = await db.user.findMany({
    where: {
      clinicId: session.user.clinicId,
      role: { in: ["secretary", DISABLED_SECRETARY_ROLE] },
    },
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      active: isSecretaryRole(user.role),
      createdAt: user.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!canManageTeam(session.user.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body: { email?: string; password?: string } = await req.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "أدخل بريد السكرتير بشكل صحيح" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
  }

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "هذا البريد مستخدم مسبقاً" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      clinicId: session.user.clinicId,
      email,
      passwordHash,
      role: "secretary",
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    user: { id: user.id, email: user.email, active: true, createdAt: user.createdAt },
  }, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  if (!canManageTeam(session.user.role)) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body: { id?: string; active?: boolean } = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "المستخدم مطلوب" }, { status: 400 });

  const user = await db.user.findFirst({
    where: {
      id: body.id,
      clinicId: session.user.clinicId,
      role: { in: ["secretary", DISABLED_SECRETARY_ROLE] },
    },
  });
  if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

  const updated = await db.user.update({
    where: { id: user.id },
    data: { role: body.active === false ? DISABLED_SECRETARY_ROLE : "secretary" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      active: isSecretaryRole(updated.role),
      createdAt: updated.createdAt,
    },
  });
}
