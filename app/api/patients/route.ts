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
    take: 200,
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
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

  const body: { name?: string; whatsappPhone?: string; phone?: string } = await req.json().catch(() => ({}));
  const name = body.name?.trim();
  const whatsappPhone = (body.whatsappPhone ?? body.phone ?? "").trim();

  if (!name || !whatsappPhone) {
    return NextResponse.json({ error: "اسم المراجع ورقم الهاتف مطلوبان" }, { status: 400 });
  }

  const patient = await db.patient.upsert({
    where: {
      clinicId_whatsappPhone: {
        clinicId: token.clinicId as string,
        whatsappPhone,
      },
    },
    update: { name },
    create: {
      clinicId: token.clinicId as string,
      name,
      whatsappPhone,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
