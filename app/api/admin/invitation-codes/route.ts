import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function isSuperAdmin(session: any) {
  return session?.user?.role === "superadmin" && !session?.user?.clinicId;
}

function generateCode(): string {
  const words = ["TIKRIT", "CLINIC", "SAAD", "CARE", "DOC", "MED", "HEAL"];
  const word = words[Math.floor(Math.random() * words.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
}

export async function GET() {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const codes = await db.invitationCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const note = body.note?.trim() ?? "";

  // Generate unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.invitationCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const record = await db.invitationCode.create({ data: { code, note } });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!isSuperAdmin(session))
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  const { id } = await req.json();
  const record = await db.invitationCode.findUnique({ where: { id } });
  if (!record)
    return NextResponse.json({ error: "الكود غير موجود" }, { status: 404 });
  if (record.used)
    return NextResponse.json({ error: "الكود مستخدم ولا يمكن حذفه" }, { status: 400 });

  await db.invitationCode.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
