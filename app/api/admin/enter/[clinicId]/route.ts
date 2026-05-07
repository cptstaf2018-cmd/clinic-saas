import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.redirect(new URL("/login", req.url));

  const { clinicId } = await params;

  const user = await db.user.findFirst({ where: { clinicId } });
  if (!user || !user.clinicId)
    return NextResponse.redirect(new URL("/admin", req.url));

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

  const jwt = await encode({
    token: {
      sub: user.id,
      email: user.email ?? "",
      name: user.role,
      role: user.role,
      clinicId: user.clinicId,
    },
    secret,
    salt: cookieName,
  });

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(cookieName, jwt, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
