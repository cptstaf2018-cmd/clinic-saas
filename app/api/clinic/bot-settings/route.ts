import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET current bot status
export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const clinic = await db.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { botEnabled: true },
  });

  return NextResponse.json({ botEnabled: clinic?.botEnabled ?? true });
}

// PATCH to toggle bot
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { botEnabled }: { botEnabled: boolean } = await req.json();

  const updated = await db.clinic.update({
    where: { id: session.user.clinicId },
    data: { botEnabled },
    select: { botEnabled: true },
  });

  return NextResponse.json({ success: true, botEnabled: updated.botEnabled });
}
