"use client";

import { useEffect, useRef, useState } from "react";

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const SCAN_INTERVAL_MS = 250;
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"];

function detectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return ctor ?? null;
}

/** True where the browser can read barcodes from the camera (Chrome on Android and desktop; not Safari). */
export function cameraScanSupported(): boolean {
  return detectorCtor() !== null && typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export default function BarcodeCamera({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const [error, setError] = useState("");

  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    const Detector = detectorCtor();
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;

    async function start() {
      if (!Detector) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = videoRef.current;
        if (stopped || !video) return;
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: FORMATS });
        const tick = async () => {
          if (stopped) return;
          const found = await detector.detect(video).catch(() => []);
          const code = found[0]?.rawValue;
          if (code) {
            onCodeRef.current(code);
            return;
          }
          timer = window.setTimeout(tick, SCAN_INTERVAL_MS);
        };
        tick();
      } catch {
        setError("تعذر تشغيل الكاميرا. اسمح للموقع باستخدام الكاميرا من إعدادات المتصفح.");
      }
    }
    start();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-brand-navy/90 p-4" role="dialog" aria-modal="true" aria-label="مسح الباركود بالكاميرا">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-black">
        <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
        <span aria-hidden className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-brand-gold shadow-[0_0_12px_rgba(201,164,92,0.9)]" />
      </div>
      <p className="text-center text-sm text-white" aria-live="polite">{error || "وجّه الكاميرا نحو الباركود"}</p>
      <button type="button" onClick={onClose} className="min-h-12 rounded-2xl bg-white px-8 font-bold text-brand-ink">إغلاق</button>
    </div>
  );
}
