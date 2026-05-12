import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAssistantAccess } from "@/lib/assistant-access";

const GUIDE = [
  {
    keys: ["موعد", "حجز", "حجوزات", "مواعيد"],
    answer:
      "لإدارة الحجوزات افتح صفحة الحجوزات من القائمة الجانبية. يمكنك رؤية مواعيد اليوم، البحث، وتغيير حالة الموعد. الحجز القادم من واتساب ينشئ ملف المراجع تلقائياً.",
  },
  {
    keys: ["مريض", "مراجع", "المراجعين", "مرضى"],
    answer:
      "افتح صفحة المراجعين للبحث عن أي مراجع بالاسم أو الرقم. عند فتح ملف المراجع ستجد بياناته، مواعيده، والسجل الطبي الخاص به.",
  },
  {
    keys: ["سجل", "طبي", "وصفة", "تشخيص"],
    answer:
      "من ملف المراجع افتح قسم السجل الطبي. يمكنك إضافة شكوى، تشخيص، وصفة، ملاحظات، وموعد مراجعة. هذه الميزة مرتبطة بملف المريض داخل العيادة فقط.",
  },
  {
    keys: ["دوام", "اوقات", "أوقات", "عمل", "ساعات"],
    answer:
      "لتعديل أوقات العمل افتح صفحة أوقات العمل، فعّل الأيام المفتوحة، وحدد بداية ونهاية الدوام. بوت واتساب يستخدم هذه الأوقات لعرض المواعيد المتاحة.",
  },
  {
    keys: ["موقع", "عنوان", "خريطة", "خرائط"],
    answer:
      "لتعديل موقع العيادة افتح الإعدادات ثم ملف العيادة. أدخل العنوان، وإذا لديك رابط خرائط قصير ضعه في حقل رابط خرائط Google. إذا وضعت كود موقع فقط سيظهر كنص واضح للمريض.",
  },
  {
    keys: ["اشتراك", "باقة", "دفع", "ترقية"],
    answer:
      "افتح صفحة الاشتراك لمعرفة حالة الباقة والأيام المتبقية. من هناك يمكنك اختيار باقة، إرسال رقم العملية، ثم ينتظر الطلب موافقة السوبر أدمن.",
  },
  {
    keys: ["رسائل", "واتساب", "بوت"],
    answer:
      "صفحة الرسائل تعرض محادثات واتساب المسجلة داخل العيادة. إعدادات واتساب بزنس موجودة في صفحة الإعدادات، ومنها تشغيل أو إيقاف الرد التلقائي.",
  },
  {
    keys: ["تقرير", "تقارير", "يومي"],
    answer:
      "افتح صفحة التقارير لرؤية ملخص يومي عن الحجوزات، المراجعين الجدد، السجلات الطبية، والرسائل. بعض تفاصيل التقارير تعتمد على الباقة.",
  },
  {
    keys: ["انتظار", "شاشة", "طابور", "نداء"],
    answer:
      "شاشة الانتظار تظهر الطابور للمرضى. رابط الشاشة موجود في الإعدادات، ويمكن فتحه على تلفزيون أو جهاز منفصل داخل العيادة.",
  },
  {
    keys: ["كلمة", "مرور", "أمان", "حماية"],
    answer:
      "لتغيير كلمة المرور افتح الإعدادات ثم تبويب الأمان. استخدم كلمة مرور قوية ولا تشاركها مع أي شخص خارج فريق العيادة.",
  },
];

const DEFAULT_ANSWER =
  "أنا مساعد إرشادي لا أعدل البيانات ولا أقرأ ملفات المرضى. اسألني عن طريقة استخدام التطبيق مثل: كيف أعدل الدوام؟ كيف أبحث عن مريض؟ أين أجد الاشتراك؟";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

function answerQuestion(message: string) {
  const text = normalize(message);
  const matched = GUIDE.find((item) => item.keys.some((key) => text.includes(normalize(key))));
  return matched?.answer ?? DEFAULT_ANSWER;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { clinicId: session.user.clinicId },
  });
  const access = await getAssistantAccess(session.user.clinicId, subscription, false);
  return NextResponse.json({ access });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.clinicId) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body: { message?: string } = await req.json().catch(() => ({}));
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "اكتب سؤالاً عن استخدام التطبيق" }, { status: 400 });
  }

  const subscription = await db.subscription.findUnique({
    where: { clinicId: session.user.clinicId },
  });
  const access = await getAssistantAccess(session.user.clinicId, subscription, true);
  if (!access.allowed) {
    return NextResponse.json(
      {
        access,
        error: "انتهت تجربة مساعد العيادة. هذه الميزة متاحة في باقة متوسطة فما فوق.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    access,
    answer: answerQuestion(message),
  });
}
