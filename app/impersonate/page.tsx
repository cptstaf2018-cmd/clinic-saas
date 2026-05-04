"use client";

import { Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

function ImpersonateContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setError("رابط غير صالح"); return; }

    signIn("credentials", { impersonateToken: token, redirect: false }).then((res) => {
      if (res?.ok) router.replace("/dashboard");
      else setError("انتهت صلاحية الرابط أو حدث خطأ");
    });
  }, [params, router]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center">
        <p className="text-red-500 font-bold text-lg mb-2">خطأ</p>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400 text-sm">جاري الدخول...</p>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">جاري التحميل...</p>
      </div>
    }>
      <ImpersonateContent />
    </Suspense>
  );
}
