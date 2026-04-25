/*
 * CareSentinel service worker (boilerplate).
 * Offline-first PWA caching scaffolding — extend later.
 *
 * NOTE: This file is NOT auto-registered by the app. Registering a service
 * worker inside Lovable's preview iframe causes stale content issues.
 * Register it manually from src/main.tsx in production only when ready.
 */

const CACHE_NAME = "caresentinel-v1";
const PRECACHE_URLS = ["/", "/index.html", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Stale-while-revalidate for navigation + GET requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    }),
  );
});
