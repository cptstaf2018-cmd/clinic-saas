import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/login",
    "/register",
    "/display",
    "/api/auth",
    "/api/whatsapp",
    "/api/payments/superkey-webhook",
    "/api/display",
    "/api/test",
  ];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const isSecure = req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    cookieName: isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token",
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token.role === "superadmin" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (token.role !== "superadmin" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/cron|_next/static|_next/image|favicon.ico).*)"],
};
