const CACHE_NAME = "clinicplt-static-v2";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/body-map.png",
  "/dental-chart.jpg",
  "/heart-map.svg",
  "/organs-map.svg",
  "/gynecology-map.png",
  "/skeleton-front.png",
  "/skeleton-back.png",
  "/eye-map.jpg",
  "/face-map.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (request.destination === "document") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(
            `<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>أوفلاين</title><body style="font-family:Arial,sans-serif;background:#eef7f4;color:#0f172a;padding:32px;text-align:center"><h1>أنت أوفلاين الآن</h1><p>افتح صفحة كانت محملة سابقًا أو انتظر رجوع الإنترنت. الحجوزات والسجلات الجديدة داخل اللوحة تُحفظ محليًا عند الانقطاع.</p></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fresh;
    })
  );
});
