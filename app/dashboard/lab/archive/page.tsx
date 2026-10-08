import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ArchiveRow from "./ArchiveRow";

const PAGE_SIZE = 30;

export default async function LabArchivePage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const session = await auth();
  const clinicId = session?.user?.clinicId;
  if (!clinicId) redirect("/login");

  const clinic = await db.clinic.findUnique({ where: { id: clinicId }, select: { facilityType: true } });
  if (clinic?.facilityType !== "lab") redirect("/dashboard");

  const { q = "", page = "1" } = await searchParams;
  const term = q.trim().slice(0, 40);
  const pageNumber = Math.max(1, Math.min(1000, parseInt(page) || 1));
  const numeric = /^\d{1,9}$/.test(term) ? Number(term) : null;

  const where = {
    clinicId,
    status: "done",
    ...(term
      ? { OR: [{ patientName: { contains: term, mode: "insensitive" as const } }, { patientPhone: { contains: term } }, ...(numeric !== null ? [{ number: numeric }] : [])] }
      : {}),
  };

  const [total, orders] = await Promise.all([
    db.labOrder.count({ where }),
    db.labOrder.findMany({
      where,
      orderBy: { completedAt: "desc" },
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, number: true, patientName: true, patientPhone: true, completedAt: true, createdAt: true, sentAt: true, publicToken: true, items: { select: { name: true, flag: true } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (target: number) => `/dashboard/lab/archive?${new URLSearchParams({ ...(term ? { q: term } : {}), page: String(target) })}`;

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-5">
        <header>
          <h1 className="text-3xl font-bold text-brand-ink">أرشيف النتائج</h1>
          <p className="mt-1 text-sm text-brand-muted">نسخة محفوظة من كل نتيجة صدرت، باسم المراجع. {total.toLocaleString("ar-IQ")} نتيجة.</p>
        </header>

        <form action="/dashboard/lab/archive" className="flex gap-2">
          <input name="q" defaultValue={term} type="search" placeholder="ابحث باسم المراجع أو رقم هاتفه أو رقم الطلب" aria-label="بحث في الأرشيف" className="h-12 min-w-0 flex-1 rounded-2xl border border-brand-border bg-white px-4 text-sm outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-soft" />
          <button className="min-h-12 rounded-2xl bg-brand-gold px-6 font-bold text-brand-gold-ink transition hover:bg-brand-gold-hover">بحث</button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-brand-border bg-white">
          {orders.length === 0 ? (
            <p className="p-10 text-center text-sm text-brand-muted">{term ? "لا توجد نتائج لهذا البحث." : "لا توجد نتائج صادرة بعد."}</p>
          ) : (
            <ul className="divide-y divide-brand-line">
              {orders.map((order) => (
                <ArchiveRow
                  key={order.id}
                  order={{
                    id: order.id,
                    number: order.number,
                    patientName: order.patientName,
                    patientPhone: order.patientPhone,
                    date: (order.completedAt ?? order.createdAt).toISOString(),
                    sentAt: order.sentAt ? order.sentAt.toISOString() : null,
                    token: order.publicToken,
                    tests: order.items.map((item) => item.name),
                    abnormal: order.items.some((item) => item.flag && item.flag !== "normal" && item.flag !== "none"),
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        {pages > 1 && (
          <nav className="flex items-center justify-between text-sm" aria-label="الصفحات">
            {pageNumber > 1 ? <Link href={link(pageNumber - 1)} className="rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-brand-border">→ السابقة</Link> : <span />}
            <span className="text-brand-muted">صفحة {pageNumber.toLocaleString("ar-IQ")} من {pages.toLocaleString("ar-IQ")}</span>
            {pageNumber < pages ? <Link href={link(pageNumber + 1)} className="rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-brand-border">التالية ←</Link> : <span />}
          </nav>
        )}
      </div>
    </div>
  );
}
