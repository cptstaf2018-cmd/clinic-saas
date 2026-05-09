import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyImpersonateToken } from "@/lib/impersonate";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";

function appUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return new URL(path, base);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.redirect(appUrl("/login"));

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(appUrl("/login"));

  const payload = verifyImpersonateToken(token);
  if (!payload) return NextResponse.redirect(appUrl("/login"));

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.clinicId) return NextResponse.redirect(appUrl("/login"));

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

  const res = NextResponse.redirect(appUrl("/dashboard"));
  res.cookies.set(cookieName, jwt, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return res;
}
