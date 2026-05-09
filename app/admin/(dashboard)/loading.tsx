export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="h-36 animate-pulse rounded-[30px] bg-white ring-1 ring-slate-200" />
        <div className="h-20 animate-pulse rounded-[26px] bg-white ring-1 ring-slate-200" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-[24px] bg-white ring-1 ring-slate-200" />
          <div className="h-20 animate-pulse rounded-[24px] bg-white ring-1 ring-slate-200" />
          <div className="h-20 animate-pulse rounded-[24px] bg-white ring-1 ring-slate-200" />
        </div>
      </div>
    </main>
  );
}
