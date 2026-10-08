"use client";

import { useMemo, useState } from "react";
import NewOrderModal from "./NewOrderModal";
import ResultPanel from "./ResultPanel";
import type { OrderStatus } from "@/lib/lab/order";
import type { LabOrderView, LabTestView } from "@/lib/lab/types";

const COLUMNS: { status: OrderStatus; label: string; tone: string }[] = [
  { status: "new", label: "طلبات جديدة", tone: "bg-brand-blue" },
  { status: "in_progress", label: "قيد العمل", tone: "bg-brand-gold" },
  { status: "review", label: "بانتظار الاعتماد", tone: "bg-amber-500" },
  { status: "done", label: "صدرت", tone: "bg-emerald-300" },
];

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baghdad" });
}

export default function LabBoard({ initialOrders, tests }: { initialOrders: LabOrderView[]; tests: LabTestView[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const selected = orders.find((order) => order.id === selectedId) ?? null;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? orders.filter((order) => order.patientName.toLowerCase().includes(q) || order.patientPhone?.includes(q) || String(order.number) === q) : orders;
  }, [orders, query]);
  const counts = (status: OrderStatus) => orders.filter((order) => order.status === status).length;
  const criticalCount = orders.filter((order) => order.items.some((item) => item.flag === "critical_low" || item.flag === "critical_high")).length;

  function replace(updated: LabOrderView) {
    setOrders((prev) => {
      const keep = updated.status === "cancelled" ? prev.filter((order) => order.id !== updated.id) : prev.map((order) => (order.id === updated.id ? updated : order));
      return keep;
    });
    if (updated.status === "cancelled") setSelectedId(null);
  }

  async function call(url: string, init: RequestInit): Promise<{ ok: boolean; data: Record<string, unknown> & { error?: string } }> {
    setBusy(true);
    setError("");
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setError(data.error ?? "تعذر تنفيذ العملية، تحقق من الاتصال");
      return { ok: false, data };
    }
    return { ok: true, data };
  }

  const patch = async (body: Record<string, unknown>) => {
    if (!selected) return false;
    const { ok, data } = await call(`/api/lab/orders/${selected.id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (ok) replace(data as unknown as LabOrderView);
    return ok;
  };

  return (
    <div className="p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-[1400px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-brand-ink">لوحة المختبر</h1>
            <p className="mt-1 text-sm text-brand-muted">كل عينة تمر من الاستلام إلى الإصدار، والنتيجة تصل المراجع على واتساب.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="ابحث بالاسم أو الرقم" aria-label="بحث" className="h-12 min-w-0 flex-1 rounded-2xl border border-brand-border bg-white px-4 text-sm outline-none focus:border-brand-blue md:w-64 md:flex-none" />
            <button type="button" onClick={() => setCreating(true)} className="min-h-12 rounded-2xl bg-brand-gold px-6 font-bold text-brand-gold-ink transition hover:-translate-y-0.5 hover:bg-brand-gold-hover">+ طلب جديد</button>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="أرقام اليوم">
          {COLUMNS.map((column) => (
            <div key={column.status} className="rounded-3xl border border-brand-border bg-white p-4">
              <p className="flex items-center justify-between text-sm text-brand-muted">{column.label}<span className={`h-2.5 w-2.5 rounded-full ${column.tone}`} /></p>
              <p className="mt-1 text-3xl font-bold text-brand-ink">{counts(column.status).toLocaleString("ar-IQ")}</p>
            </div>
          ))}
          <div className={`rounded-3xl border p-4 ${criticalCount ? "border-red-200 bg-red-50" : "border-brand-border bg-white"}`}>
            <p className="text-sm text-brand-muted">قيم حرجة</p>
            <p className={`mt-1 text-3xl font-bold ${criticalCount ? "text-red-700" : "text-brand-ink"}`}>{criticalCount.toLocaleString("ar-IQ")}</p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => {
              const list = visible.filter((order) => order.status === column.status);
              return (
                <div key={column.status} className="min-h-40 rounded-3xl bg-[#E9EEF5] p-2.5">
                  <h3 className="flex items-center justify-between px-2 pb-2 pt-1 text-sm font-semibold text-brand-muted">{column.label}<span>{list.length.toLocaleString("ar-IQ")}</span></h3>
                  <div className="space-y-2">
                    {list.map((order) => (
                      <button key={order.id} type="button" onClick={() => { setSelectedId(order.id); setError(""); }} aria-pressed={selectedId === order.id}
                        className={`block w-full rounded-2xl border-2 bg-white p-3 text-right transition hover:-translate-y-0.5 ${selectedId === order.id ? "border-brand-gold" : "border-transparent"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate font-bold text-brand-ink">{order.patientName}</span>
                          {order.urgent && <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">مستعجل</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-brand-muted"><span dir="ltr">#{order.number}</span> · {timeOf(order.createdAt)}{order.doctorName ? ` · ${order.doctorName}` : ""}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {order.items.slice(0, 3).map((item) => <span key={item.id} className="rounded-md bg-brand-line px-1.5 py-0.5 text-[11px] text-brand-ink">{item.name}</span>)}
                          {order.items.length > 3 && <span className="rounded-md bg-brand-line px-1.5 py-0.5 text-[11px] text-brand-muted">+{(order.items.length - 3).toLocaleString("ar-IQ")}</span>}
                        </div>
                        {order.status === "done" && <p className={`mt-2 text-[11px] font-semibold ${order.sentAt ? "text-brand-mint-text" : "text-amber-700"}`}>{order.sentAt ? "أُرسلت للمراجع ✓" : "لم تُرسل بعد"}</p>}
                      </button>
                    ))}
                    {list.length === 0 && <p className="px-2 py-6 text-center text-xs text-brand-muted/80">لا يوجد</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {selected ? (
            <ResultPanel
              key={selected.id}
              order={selected}
              busy={busy}
              error={error}
              onClose={() => setSelectedId(null)}
              onPaid={(paid) => patch({ paid })}
              onStatus={(status) => patch({ status })}
              onSave={(values) => patch({ results: Object.entries(values).map(([itemId, value]) => ({ itemId, value })) })}
              onSend={async () => {
                const { ok, data } = await call(`/api/lab/orders/${selected.id}/send`, { method: "POST" });
                if (ok) setOrders((prev) => prev.map((order) => (order.id === selected.id ? { ...order, sentAt: String(data.sentAt) } : order)));
              }}
            />
          ) : (
            <div className="hidden rounded-3xl border border-dashed border-brand-border bg-white p-10 text-center lg:block">
              <p className="font-bold text-brand-ink">اختر طلباً لعرض نتائجه</p>
              <p className="mt-1 text-sm text-brand-muted">أو أنشئ طلباً جديداً من الزر أعلى الصفحة.</p>
            </div>
          )}
        </div>
      </div>

      {creating && (
        <NewOrderModal
          tests={tests}
          onClose={() => setCreating(false)}
          onCreated={(order) => {
            setOrders((prev) => [...prev, order]);
            setSelectedId(order.id);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
