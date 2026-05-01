import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { clinicId: session.user.clinicId },
  });

  if (!subscription) {
    return NextResponse.json(null);
  }

  return NextResponse.json(subscription);
}
