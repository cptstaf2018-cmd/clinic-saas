import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { isSecretaryRole } from "@/lib/clinic-roles";
import { iraqMobileVariants, normalizeIraqMobile } from "@/lib/phone";

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

  if (isSecretaryRole(token.role as string | null | undefined)) {
    return NextResponse.json(patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      whatsappPhone: patient.whatsappPhone,
      createdAt: patient.createdAt,
      appointments: patient.appointments,
      _count: patient._count,
    })));
  }

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
  const whatsappPhone = normalizeIraqMobile(body.whatsappPhone ?? body.phone ?? "");

  if (!name || !whatsappPhone) {
    return NextResponse.json({ error: "اسم المراجع ورقم الهاتف مطلوبان" }, { status: 400 });
  }

  const clinicId = token.clinicId as string;
  const existingPatient = await db.patient.findFirst({
    where: { clinicId, whatsappPhone: { in: iraqMobileVariants(whatsappPhone) } },
    orderBy: { createdAt: "asc" },
  });

  const patient = existingPatient
    ? await db.patient.update({
        where: { id: existingPatient.id },
        data: { name },
      })
    : await db.patient.upsert({
        where: { clinicId_whatsappPhone: { clinicId, whatsappPhone } },
        update: { name },
        create: { clinicId, name, whatsappPhone },
      });

  return NextResponse.json(patient, { status: 201 });
}
