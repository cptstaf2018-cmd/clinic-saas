export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#eef6f5] p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-28 animate-pulse rounded-[32px] bg-white/80 ring-1 ring-slate-200" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-[26px] bg-white ring-1 ring-slate-200" />
          <div className="h-28 animate-pulse rounded-[26px] bg-white ring-1 ring-slate-200" />
          <div className="h-28 animate-pulse rounded-[26px] bg-white ring-1 ring-slate-200" />
        </div>
        <div className="h-96 animate-pulse rounded-[32px] bg-white ring-1 ring-slate-200" />
      </div>
    </main>
  );
}
