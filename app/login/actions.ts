"use server";

import { signIn } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error: any) {
    // NextAuth throws a redirect - let it through
    if (error?.message?.includes("NEXT_REDIRECT")) throw error;
    if (error?.type === "CallbackRouteError") {
      return "الإيميل أو كلمة المرور غير صحيحة";
    }
    return "الإيميل أو كلمة المرور غير صحيحة";
  }
}
