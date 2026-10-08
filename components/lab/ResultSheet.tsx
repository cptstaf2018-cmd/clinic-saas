import RangeBar from "@/components/lab/RangeBar";
import { BRAND_NAME, BrandMark } from "@/components/BrandLogo";
import { FLAG_LABEL, rangeFor, type Flag } from "@/lib/lab/result";
import PrintButton from "@/app/result/[token]/PrintButton";

const FLAG_STYLE: Record<Flag, string> = {
  normal: "bg-brand-mint-soft text-brand-mint-text",
  low: "bg-amber-50 text-amber-800",
  high: "bg-amber-50 text-amber-800",
  critical_low: "bg-red-600 text-white",
  critical_high: "bg-red-600 text-white",
  none: "bg-brand-line text-brand-muted",
};

export type ResultSheetData = {
  number: number;
  patientName: string;
  sex: string;
  age: number | null;
  doctorName: string | null;
  completedAt: Date;
  clinic: { name: string; logoUrl: string | null; address: string | null };
  items: {
    id: string;
    name: string;
    unit: string | null;
    result: number | null;
    flag: string | null;
    refLowM: number | null;
    refHighM: number | null;
    refLowF: number | null;
    refHighF: number | null;
    critLow: number | null;
    critHigh: number | null;
  }[];
};

export default function ResultSheet({ order }: { order: ResultSheetData }) {
  const date = order.completedAt.toLocaleDateString("ar-IQ", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baghdad" });
  const abnormal = order.items.some((item) => item.flag && item.flag !== "normal" && item.flag !== "none");

  return (
    <main className="min-h-screen bg-brand-bg p-4 print:bg-white print:p-0 md:p-8" dir="rtl">
      <article className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_1px_0_rgba(14,36,64,0.06)] print:rounded-none print:shadow-none">
        <header className="flex items-center justify-between gap-4 bg-brand-navy p-6 text-white print:bg-white print:text-brand-navy print:ring-1 print:ring-brand-border">
          <div className="min-w-0">
            <p className="text-xs text-brand-side-muted print:text-brand-muted">نتيجة تحليل</p>
            <h1 className="mt-1 truncate text-2xl font-bold">{order.clinic.name}</h1>
            {order.clinic.address && <p className="mt-1 text-xs text-brand-side-muted print:text-brand-muted">{order.clinic.address}</p>}
          </div>
          {order.clinic.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.clinic.logoUrl} alt={order.clinic.name} className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain p-1" />
          )}
        </header>

        <section className="grid grid-cols-2 gap-3 border-b border-brand-line p-6 text-sm sm:grid-cols-4">
          <div><p className="text-xs text-brand-muted">المراجع</p><p className="mt-0.5 font-bold text-brand-ink">{order.patientName}</p></div>
          <div><p className="text-xs text-brand-muted">الجنس / العمر</p><p className="mt-0.5 font-bold text-brand-ink">{order.sex === "f" ? "أنثى" : "ذكر"}{order.age !== null && ` · ${order.age} سنة`}</p></div>
          <div><p className="text-xs text-brand-muted">التاريخ</p><p className="mt-0.5 font-bold text-brand-ink">{date}</p></div>
          <div><p className="text-xs text-brand-muted">رقم الطلب</p><p className="mt-0.5 font-bold text-brand-ink" dir="ltr" style={{ textAlign: "right" }}>#{order.number}</p></div>
          {order.doctorName && <div className="col-span-2"><p className="text-xs text-brand-muted">الطبيب الطالب</p><p className="mt-0.5 font-bold text-brand-ink">{order.doctorName}</p></div>}
        </section>

        <section className="px-6 py-2">
          {order.items.map((item) => {
            const range = rangeFor(item, order.sex === "f" ? "f" : "m");
            const flag = (item.flag ?? "none") as Flag;
            return (
              <div key={item.id} className="break-inside-avoid border-b border-brand-line py-4 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-brand-ink">{item.name}</p>
                    <p className="text-xs text-brand-muted">المرجع: <span dir="ltr">{range.low ?? "—"} – {range.high ?? "—"} {item.unit ?? ""}</span></p>
                  </div>
                  <p className="text-xl font-bold text-brand-ink" dir="ltr">{item.result} <span className="text-xs font-medium text-brand-muted">{item.unit}</span></p>
                  <span className={`w-20 rounded-lg px-1 py-1 text-center text-xs font-bold ${FLAG_STYLE[flag]}`}>{FLAG_LABEL[flag]}</span>
                </div>
                <div className="mt-3 px-1"><RangeBar value={item.result} low={range.low} high={range.high} critLow={item.critLow} critHigh={item.critHigh} /></div>
              </div>
            );
          })}
        </section>

        <footer className="space-y-3 bg-brand-bg/70 p-6 text-sm leading-7 text-brand-muted print:bg-white">
          {abnormal && <p className="rounded-2xl bg-amber-50 px-4 py-3 font-semibold text-amber-900">بعض القيم خارج النطاق المرجعي. راجع طبيبك لتفسيرها.</p>}
          <p>هذه النتيجة تُقارن القيم بالنطاقات المرجعية للمختبر فقط، وليست تشخيصاً. التفسير الطبي من اختصاص طبيبك.</p>
          <div className="flex items-center justify-between gap-3 pt-2 print:hidden">
            <PrintButton />
            <span className="flex items-center gap-2 text-xs"><BrandMark size={22} />{BRAND_NAME}</span>
          </div>
        </footer>
      </article>
    </main>
  );
}
