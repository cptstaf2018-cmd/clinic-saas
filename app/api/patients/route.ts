import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName: "https:" === req.nextUrl.protocol
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  if (!token?.clinicId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search") ?? "";

  const patients = await db.patient.findMany({
    where: {
      clinicId: token.clinicId as string,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { whatsappPhone: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
      },
      _count: { select: { appointments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(patients);
}
