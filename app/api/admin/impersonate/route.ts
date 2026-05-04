import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createImpersonateToken } from "@/lib/impersonate";

export async function POST(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { clinicId } = await req.json();
  if (!clinicId) return NextResponse.json({ error: "clinicId مطلوب" }, { status: 400 });

  const user = await db.user.findFirst({ where: { clinicId } });
  if (!user) return NextResponse.json({ error: "لا يوجد مستخدم لهذه العيادة" }, { status: 404 });

  const token = createImpersonateToken(user.id, clinicId);
  return NextResponse.json({ token });
}
