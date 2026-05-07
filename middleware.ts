import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    "/login",
    "/register",
    "/impersonate",
    "/admin/login",
    "/display",
    "/api/auth",
    "/api/register",
    "/api/whatsapp",
    "/api/payments/superkey-webhook",
    "/api/display",
    "/api/cron",
    "/api/tts",
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

  // 🔒 CRITICAL: Enforce role-based routing
  const userRole = token.role as string;
  const clinicId = token.clinicId as string | null;

  // SUPERADMIN checks
  if (userRole === "superadmin") {
    // ✅ superadmin MUST NOT have clinicId
    if (clinicId) {
      console.warn(`[SECURITY] Superadmin has clinicId: ${clinicId}`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // ✅ Only /admin is allowed
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // CLINIC STAFF checks
  if (userRole === "doctor" || userRole === "staff") {
    // ✅ MUST have clinicId
    if (!clinicId) {
      console.warn(`[SECURITY] Clinic staff missing clinicId: ${token.email}`);
      return NextResponse.redirect(new URL("/login", req.url));
    }
    // ✅ /admin is FORBIDDEN
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      console.warn(
        `[SECURITY] Clinic staff tried to access /admin: ${token.email}`
      );
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // ✅ Only /dashboard is allowed
    if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Unknown role - deny access
  console.warn(`[SECURITY] Unknown role: ${userRole}`);
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    "/((?!api/cron|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|icon|apple-icon).*)",
  ],
};
