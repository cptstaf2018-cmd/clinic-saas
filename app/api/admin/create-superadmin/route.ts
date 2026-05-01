import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * 🔒 SECURITY: Create SUPERADMIN only once
 * This endpoint should NOT be exposed in production
 * Delete after use or protect with special token
 */
export async function POST(req: NextRequest) {
  // 🔐 Security check - change this token in production
  const token = req.headers.get("X-ADMIN-TOKEN");
  if (token !== process.env.ADMIN_CREATION_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "email و password مطلوبان" },
      { status: 400 }
    );
  }

  // Check if superadmin already exists
  const existing = await db.user.findFirst({
    where: { role: "superadmin" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "superadmin موجود بالفعل" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "superadmin",
      clinicId: null, // 🔒 CRITICAL: superadmin must NOT have clinicId
    },
  });

  return NextResponse.json({
    success: true,
    message: "superadmin تم إنشاؤه بنجاح",
    admin: { id: admin.id, email: admin.email },
  });
}
