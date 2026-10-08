import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ResultSheet from "@/components/lab/ResultSheet";

export const dynamic = "force-dynamic";

// A result link is private: keep it out of search engines and out of Referer headers.
export const metadata: Metadata = {
  title: "نتيجة التحليل",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token.length < 16 || token.length > 64) notFound();

  const order = await db.labOrder.findUnique({
    where: { publicToken: token },
    include: { items: { orderBy: { name: "asc" } }, clinic: { select: { name: true, logoUrl: true, address: true } } },
  });
  if (!order || order.status !== "done") notFound();

  return <ResultSheet order={{ ...order, completedAt: order.completedAt ?? order.createdAt }} />;
}
