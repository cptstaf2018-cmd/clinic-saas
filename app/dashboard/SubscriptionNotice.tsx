import Link from "next/link";

type Notice = {
  tone: "warning" | "expiredGrace";
  title: string;
  message: string;
};

export default function SubscriptionNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;

  const isExpired = notice.tone === "expiredGrace";
  return (
    <div className={`mx-4 mt-4 rounded-2xl px-4 py-3 ring-1 md:mx-8 ${
      isExpired
        ? "bg-rose-50 text-rose-900 ring-rose-100"
        : "bg-amber-50 text-amber-900 ring-amber-100"
    }`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black">{notice.title}</p>
          <p className={`mt-1 text-xs font-bold leading-6 ${isExpired ? "text-rose-700" : "text-amber-700"}`}>
            {notice.message}
          </p>
        </div>
        <Link
          href="/dashboard/subscription"
          className={`shrink-0 rounded-xl px-4 py-2 text-center text-xs font-black text-white ${
            isExpired ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"
          }`}
        >
          تجديد الاشتراك
        </Link>
      </div>
    </div>
  );
}
