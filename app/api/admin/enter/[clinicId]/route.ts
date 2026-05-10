import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encode, decode } from "next-auth/jwt";

function appUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  return new URL(path, base);
}

function requestIsSecure(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProto === "https" || req.nextUrl.protocol === "https:";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const isSecure = requestIsSecure(req);
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const backupName = "sa-backup";

  // ── 1. تحقق من صلاحية السوبر أدمن ──────────────────────────────────────
  // أولاً: الـ cookie الرئيسي
  let isAdmin = false;
  let adminJwt: string | undefined;

  const mainCookie = req.cookies.get(cookieName)?.value;
  if (mainCookie) {
    const decoded = await decode({ token: mainCookie, secret, salt: cookieName });
    if ((decoded as any)?.role === "superadmin") {
      isAdmin = true;
      adminJwt = mainCookie;
    }
  }

  // ثانياً: الـ cookie الاحتياطي (في حال دخل عيادة سابقاً)
  if (!isAdmin) {
    const backupCookie = req.cookies.get(backupName)?.value;
    if (backupCookie) {
      const decoded = await decode({ token: backupCookie, secret, salt: cookieName });
      if ((decoded as any)?.role === "superadmin") {
        isAdmin = true;
        adminJwt = backupCookie;
      }
    }
  }

  if (!isAdmin) return NextResponse.redirect(appUrl("/admin/login"));

  // ── 2. جلب مستخدم العيادة ───────────────────────────────────────────────
  const { clinicId } = await params;
  const user = await db.user.findFirst({ where: { clinicId } });
  if (!user || !user.clinicId)
    return NextResponse.redirect(appUrl("/admin"));

  // ── 3. إنشاء JWT للعيادة ────────────────────────────────────────────────
  const clinicJwt = await encode({
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

  // ── 4. الاستجابة: احفظ الـ backup + ضع جلسة العيادة ────────────────────
  const res = NextResponse.redirect(appUrl("/dashboard"));

  // احفظ جلسة السوبر أدمن كاحتياط (8 ساعات)
  res.cookies.set(backupName, adminJwt!, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  // ضع جلسة العيادة كجلسة رئيسية
  res.cookies.set(cookieName, clinicJwt, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return res;
}
