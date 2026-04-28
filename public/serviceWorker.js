const CACHE_NAME = 'vitachain-v3';

// Files that can be cached permanently (no content hash in name)
const STATIC_ASSETS = [
  '/manifest.json',
  '/facilities_offline.json',
  '/serviceWorker.js',
  // Vite assets with content hash are safe to cache (fingerprinted)
];

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

  // Skip caching for non-HTTP/HTTPS requests (chrome-extension://, data:, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // For API calls and external resources, use network-first
  if (url.pathname.includes('/api/') || url.hostname !== location.hostname) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // For HTML pages — always network-first to get fresh index.html
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // For Vite-built JS/CSS/assets with content hash — cache-first with network fallback
  if (event.request.url.match(/[-](\w{8,})\./)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // For static assets without hash — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cached = await caches.match(request);
    if (cached) return cached;
    // If it's a navigation request, return offline fallback
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Validate content type — don't serve HTML for JS module requests
    const contentType = cached.headers.get('content-type');
    if (contentType && (contentType.includes('application/javascript') || contentType.includes('application/wasm') || contentType.includes('text/css'))) {
      return cached;
    }
    // Cached response is wrong type (e.g., HTML), skip it
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If network fails and we have a cached response (even wrong type), return it as last resort
    if (cached) return cached;
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      const contentType = networkResponse.headers.get('content-type');
      // Only cache correct MIME types
      if (contentType && !contentType.includes('text/html')) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
      }
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached regardless of type (best effort)
    return cached;
  });

  return cached || fetchPromise;
}
