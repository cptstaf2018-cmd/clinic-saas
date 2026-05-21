"use server";

import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";

export async function loginAction(formData: FormData) {
  const identifier = ((formData.get("identifier") ?? formData.get("email")) as string)?.trim();
  const password   = formData.get("password") as string;

  const isPhone = /^07\d{7,}$/.test(identifier ?? "") || /^\+964/.test(identifier ?? "");

  let redirectTo = "/dashboard";

  if (!isPhone && identifier?.includes("@")) {
    // Check if this is a superadmin email — everything else goes to /dashboard
    const adminUser = await db.user.findUnique({
      where: { email: identifier },
      select: { role: true },
    });
    if (adminUser?.role === "superadmin") redirectTo = "/admin";
  }

  try {
    await signIn("credentials", { identifier, password, redirectTo });
  } catch (error: any) {
    if (error?.message?.includes("NEXT_REDIRECT")) throw error;
    return isPhone
      ? "رقم الواتساب أو كلمة المرور غير صحيحة"
      : "الإيميل أو كلمة المرور غير صحيحة";
  }
}
