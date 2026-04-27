const CACHE_NAME = 'caresentinel-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/facilities_offline.json',
  '/serviceWorker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
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

  // Cache-first for huggingface.co (model files)
  if (url.hostname === 'huggingface.co') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) return response;
        return fetch(event.request).then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // network failed, just resolve to cached if exists
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for background sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'mesh-gossip') {
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'TRIGGER_MESH_GOSSIP' });
        });
      })
    );
  }

  if (event.tag === 'satellite-upload') {
    event.waitUntil(
      // For satellite upload, we can attempt to fetch from our own endpoint
      // Since we're simulating, we'll just make a POST request to our own site
      fetch('/api/satellite-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // In a real implementation, we would get the data from IndexedDB
        // For now, we'll send empty data as this is a simulation
        body: JSON.stringify({
          facilities: [],
          searches: {},
          timestamp: new Date().toISOString()
        })
      }).then(response => {
        console.log('Satellite upload completed via background sync:', response.status);
        return response;
      }).catch(error => {
        console.error('Satellite upload failed in background sync:', error);
        throw error;
      })
    );
  }
});

// Handle push notifications for alerts
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || 'CareSentinel Alert';
  const options = {
    body: data.body || 'A new care match has been found for your registered need.',
    icon: '/placeholder.svg', // We have a placeholder.svg in public
    badge: '/placeholder.svg',
    data: {
      url: data.url || '/' // URL to open when notification is clicked
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Determine the URL to open
  const url = event.notification.data.url || '/';

  // Open the URL in a new window/tab
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});