"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getOfflineQueue,
  removeOfflineAction,
  subscribeOfflineQueue,
  syncOfflineAction,
  updateOfflineAction,
  type OfflineAction,
} from "@/lib/offline-queue";

function arabicNumber(value: number) {
  return String(value).replace(/\d/g, (x) => "٠١٢٣٤٥٦٧٨٩"[+x]);
}

export default function OfflineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [queue, setQueue] = useState<OfflineAction[]>(() =>
    typeof window === "undefined" ? [] : getOfflineQueue()
  );
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState("");

  const failedCount = useMemo(() => queue.filter((item) => item.lastError).length, [queue]);

  const refresh = useCallback(() => {
    setQueue(getOfflineQueue());
    setOnline(navigator.onLine);
  }, []);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    const items = getOfflineQueue();
    if (items.length === 0) return;

    setSyncing(true);
    let synced = 0;

    for (const item of items) {
      try {
        await syncOfflineAction(item);
        removeOfflineAction(item.id);
        synced += 1;
      } catch (error) {
        updateOfflineAction(item.id, {
          attempts: item.attempts + 1,
          lastError: error instanceof Error ? error.message : "تعذر الرفع الآن",
        });
      }
    }

    setSyncing(false);
    refresh();
    if (synced > 0) {
      setNotice(`تم رفع ${arabicNumber(synced)} عملية محفوظة`);
      window.setTimeout(() => setNotice(""), 3500);
    }
  }, [refresh, syncing]);

  useEffect(() => {
    const unsub = subscribeOfflineQueue(refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("online", syncQueue);
    const timer = window.setInterval(syncQueue, 30000);

    return () => {
      unsub();
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("online", syncQueue);
      window.clearInterval(timer);
    };
  }, [refresh, syncQueue]);

  useEffect(() => {
    if (!online) return;
    const timer = window.setTimeout(() => void syncQueue(), 0);
    return () => window.clearTimeout(timer);
  }, [online, syncQueue]);

  if (online && queue.length === 0 && !notice) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-[calc(100vw-2.5rem)]" dir="rtl">
      <div
        className={`rounded-2xl px-4 py-3 text-sm font-black shadow-xl ring-1 ${
          online
            ? failedCount
              ? "bg-amber-50 text-amber-800 ring-amber-200"
              : "bg-emerald-50 text-emerald-800 ring-emerald-200"
            : "bg-slate-950 text-white ring-white/10"
        }`}
      >
        {!online ? (
          <p>أوفلاين: الحفظ المحلي يعمل</p>
        ) : syncing ? (
          <p>جاري رفع العمليات المحفوظة...</p>
        ) : notice ? (
          <p>{notice}</p>
        ) : failedCount ? (
          <p>توجد عمليات تحتاج مراجعة قبل الرفع</p>
        ) : (
          <p>بانتظار رفع {arabicNumber(queue.length)} عملية</p>
        )}

        {queue.length > 0 && (
          <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold opacity-80">
            <span>{arabicNumber(queue.length)} محفوظة على هذا الجهاز</span>
            {online && (
              <button
                onClick={() => void syncQueue()}
                disabled={syncing}
                className="rounded-xl bg-white/80 px-3 py-1 text-slate-800 ring-1 ring-black/5 disabled:opacity-50"
              >
                رفع الآن
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
