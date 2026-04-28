const CACHE_NAME = 'vitachain-v4';
const OFFLINE_FALLBACK = '/index.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always bypass cache for HTML navigation requests — force network
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If completely offline, show homepage
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For API calls and external domains — network-first, no cache
  if (url.pathname.includes('/api/') || url.hostname !== location.hostname) {
    event.respondWith(fetch(event.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // For static assets (JS, CSS, images) — cache-first but always revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request, { cache: 'no-cache' }).then((response) => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached);

      // Return cached immediately if available, else wait for network
      return cached || networkFetch;
    })
  );
});
