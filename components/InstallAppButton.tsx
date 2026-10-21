"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { installMode, promptInstall, subscribeInstall, type InstallMode } from "@/lib/install-prompt";

const serverMode = (): InstallMode => "hidden";

function DownloadIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
    </svg>
  );
}

/**
 * "Install the app" for the sidebar card or the phone header. Hidden once the app runs installed.
 * Chrome / Edge / Android open their install dialog; iPhone and other browsers get short steps instead.
 */
export default function InstallAppButton({ variant }: { variant: "card" | "compact" }) {
  const mode = useSyncExternalStore(subscribeInstall, installMode, serverMode);
  const [help, setHelp] = useState(false);

  if (mode === "hidden") return null;

  async function install() {
    if (!(await promptInstall())) setHelp(true);
  }

  return (
    <>
      {variant === "card" ? (
        <div className="mx-3 mb-3 rounded-2xl bg-brand-gold p-4 text-brand-gold-ink">
          <p className="flex items-center gap-2 font-bold"><DownloadIcon className="h-5 w-5" />ثبّت التطبيق على جهازك</p>
          <p className="mt-1 text-xs leading-5 opacity-80">افتحه من الشاشة الرئيسية بضغطة واحدة، مثل أي تطبيق.</p>
          <button type="button" onClick={install} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-navy text-sm font-bold text-white transition hover:bg-brand-navy-2">
            تثبيت التطبيق
          </button>
        </div>
      ) : (
        <button type="button" onClick={install} className="flex min-h-9 items-center gap-1.5 rounded-full bg-brand-gold px-3 text-xs font-bold text-brand-gold-ink" aria-label="تثبيت التطبيق">
          <DownloadIcon className="h-4 w-4" />
          تثبيت
        </button>
      )}

      {help && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-brand-navy/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="طريقة تثبيت التطبيق" onClick={() => setHelp(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-brand-ink" dir="rtl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-bold">تثبيت التطبيق</h3>
            {mode === "ios" ? (
              <ol className="mt-4 space-y-3 text-sm leading-6">
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-on-soft">1</span><span>افتح الموقع من متصفح <b>سفاري</b>.</span></li>
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-on-soft">2</span><span>اضغط زر المشاركة <span aria-hidden>⬆️</span> أسفل الشاشة.</span></li>
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-on-soft">3</span><span>اختر <b>«إضافة إلى الشاشة الرئيسية»</b> ثم <b>«إضافة»</b>.</span></li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-sm leading-6">
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-on-soft">1</span><span>افتح الموقع من متصفح <b>كروم</b> أو <b>إيدج</b>.</span></li>
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-on-soft">2</span><span>اضغط قائمة المتصفح <b>⋮</b> في الأعلى.</span></li>
                <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-on-soft">3</span><span>اختر <b>«تثبيت التطبيق»</b> أو <b>«إضافة إلى الشاشة الرئيسية»</b>.</span></li>
              </ol>
            )}
            <button type="button" onClick={() => setHelp(false)} autoFocus className="mt-6 min-h-12 w-full rounded-2xl bg-brand-navy font-bold text-white">فهمت</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
