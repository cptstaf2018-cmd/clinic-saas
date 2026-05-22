import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { isSecretaryRole } from "@/lib/clinic-roles";

function requestIsSecure(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto === "https" || req.nextUrl.protocol === "https:";
}

function shouldRedirectToHttps(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  const localHost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
  return process.env.NODE_ENV === "production" && !localHost && !requestIsSecure(req);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (shouldRedirectToHttps(req)) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    return NextResponse.redirect(url, 308);
  }

  const publicPaths = [
    "/login",
    "/register",
    "/about",
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
    "/api/ping",
  ];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const isSecure = requestIsSecure(req);
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
  if (userRole === "doctor" || userRole === "staff" || isSecretaryRole(userRole)) {
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
    if (isSecretaryRole(userRole)) {
      const allowedDashboardPaths = [
        "/dashboard",
        "/dashboard/appointments",
        "/dashboard/patients",
        "/dashboard/support",
      ];
      const allowedApiPaths = [
        "/api/appointments",
        "/api/patients",
        "/api/support/health",
      ];
      const canUseDashboard = allowedDashboardPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
      const canUseApi = allowedApiPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
      const isSensitivePatientPage =
        pathname.startsWith("/dashboard/patients/") &&
        (pathname.endsWith("/report") || pathname.endsWith("/prescription"));

      if (pathname.startsWith("/api/")) {
        if (!canUseApi) {
          return NextResponse.json({ error: "غير مصرح لحساب السكرتير" }, { status: 403 });
        }
        return NextResponse.next();
      }

      if (!canUseDashboard || isSensitivePatientPage) {
        return NextResponse.redirect(new URL("/dashboard/appointments", req.url));
      }
    }
    // ✅ Clinic staff can use dashboard, onboarding, and clinic APIs
    if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/onboarding") && !pathname.startsWith("/api/")) {
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
    "/((?!api/cron|_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.webmanifest|icon|apple-icon|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.ico).*)",
  ],
};
