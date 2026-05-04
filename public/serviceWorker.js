// public/serviceWorker.js
// VitaChain Service Worker – offline support, AI model pre-caching, and background sync

const CACHE_NAME = 'vitachain-cache-v4'; // Bumped version
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/avatars/vita-default.png',
  '/avatars/vita-error.png',
  '/avatars/vita-success.png',
  '/avatars/vita-loading.png',
  '/avatars/vita-empty.png',
  '/avatars/vita-alert.png',
  '/avatars/vita-offline.png',
  // TinyLlama ONNX model — GitHub Releases (uncomment when URL is live)
  // 'https://github.com/Panther0508/care-connect/releases/download/v1.0.0-model/decoder_model_merged_quantized.onnx',
];

  // HuggingFace CDN URLs for models (@huggingface/transformers v4)
  const HF_CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers';
  
  // VitaChain AI models hosted on GitHub Releases
  const VITACHAIN_MODELS_URL = 'https://github.com/vitachain-ai/models/releases/download/v1.0';
  
  // Model files we expect to cache
  const MODEL_PATTERNS = [
    (path) => path.includes('Xenova/TinyLlama-1.1B-Chat-v1.0'),
    (path) => path.includes('Xenova/all-MiniLM-L6-v2'),
    (path) => path.includes('Xenova/whisper-tiny'),
    (path) => path.includes('facebook/nllb-200-distilled-600M'),
    (path) => path.includes('Xenova/clip-vit-base-patch32'),
    (path) => path.includes('@huggingface/transformers'),
    (path) => path.includes('huggingface.co') && (path.includes('.json') || path.includes('.bin') || path.includes('.onnx') || path.includes('.msgpack')),
    // VitaChain GitHub Releases models — user-requested host
    (path) => path.includes('Panther0508/care-connect/releases/download'),
    (path) => path.includes('decoder_model_merged_quantized.onnx'),
    (path) => path.includes('tinyllama-1.1b-chat.onnx'),
    // Gemma 4 E2B browser model (stretch goal)
    (path) => path.includes('gemma-4-e2b-it') || path.includes('gemma-4'),
    (path) => path.includes('MediaPipe') && path.includes('gemma')
  ];

  // Also cache embedding model specific patterns
  const EMBEDDING_PATTERNS = [
    (path) => path.includes('Xenova/all-MiniLM-L6-v2'),
  ];

// Pending reminders queue (stored in IndexedDB and memory)
let pendingReminders = {
  medication: [],
  appointment: []
};

self.addEventListener('install', (event) => {
  // Pre-cache static assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isHuggingFace = url.hostname.includes('huggingface.co') || url.hostname.includes('cdn.jsdelivr.net');

  // Cache-first for static assets
  if (ASSETS_TO_CACHE.some(p => url.pathname.endsWith(p) || url.pathname === '/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Pre-cache Gemma 4 E2B (stretch goal)
  if (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('@mediapipe')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => null);
      })
    );
    return;
  }

  // HuggingFace model files — cache only successful responses
  if (isHuggingFace && url.pathname.includes('huggingface.co')) {
    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        // Check if cached response is valid
        if (cached) {
          // BUG 2 FIX: Check status code first
          if (cached.status >= 400) {
            // Cached response is an error — delete and retry network
            console.log('🗑️ Deleting stale HF error response (status=' + cached.status + '):', url.href);
            caches.open(CACHE_NAME).then(cache => cache.delete(event.request));
            // Fall through to network request below
          } else {
            // Valid cached response
            return cached;
          }
        }

        // Fetch from network
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          } else {
            console.warn(`⚠️ HuggingFace HTTP ${networkResponse.status} — not caching`);
          }
          return networkResponse;
        } catch (err) {
          // Network failed, return cached if any
          return cached || new Response('Network error', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        }
      })
    );
    return;
  }

  // GitHub Releases model files — cache for offline use
  if (url.hostname.includes('github.com') && url.pathname.includes('/releases/')) {
    event.respondWith(
      caches.match(event.request).then(async (cached) => {
        if (cached && cached.status === 200) return cached;
        
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return networkResponse;
        } catch (err) {
          return cached || new Response('Model download failed', { status: 503 });
        }
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }))
  );
});

// ==================== BACKGROUND SYNC & REMINDERS ====================

self.addEventListener('message', (event) => {
  const { type, reminder, appointment, appointmentId, medId, triggerAt, data } = event.data || {};

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    return;
  }

  // Medication reminder scheduling from client
  if (type === 'SCHEDULE_MEDICATION_REMINDER') {
    handleScheduleMedicationReminder(reminder);
    return;
  }

  // Cancel medication reminder from client
  if (type === 'CANCEL_MEDICATION_REMINDER') {
    handleCancelMedicationReminder(reminder);
    return;
  }

  // Appointment reminder scheduling from client
  if (type === 'SCHEDULE_APPOINTMENT_REMINDER') {
    handleScheduleAppointmentReminder(reminder);
    return;
  }

  // Cancel appointment reminders from client
  if (type === 'CANCEL_APPOINTMENT_REMINDERS') {
    handleCancelAppointmentReminders(appointmentId);
    return;
  }

  // Periodic sync registration (for background sync when app is closed)
  if (type === 'REGISTER_PERIODIC_SYNC') {
    registerPeriodicSync();
    return;
  }
});

/**
 * Handle medication reminder scheduling
 */
function handleScheduleMedicationReminder(reminder) {
  if (!reminder || !reminder.id) {
    console.warn('Invalid medication reminder:', reminder);
    return;
  }

  // Store in pending queue
  pendingReminders.medication = pendingReminders.medication.filter(r => r.id !== reminder.id);
  pendingReminders.medication.push(reminder);

  // Schedule notification
  scheduleMedicationNotification(reminder);
}

/**
 * Schedule medication notification
 */
function scheduleMedicationNotification(reminder) {
  const triggerAt = new Date(reminder.triggerAt);
  const now = new Date();
  const delay = triggerAt.getTime() - now.getTime();

  if (delay < 0) {
    console.warn('Reminder time is in the past:', reminder);
    return;
  }

  // Use setTimeout for immediate scheduling (in-memory)
  // For persistent scheduling across service worker restarts, we'd use
  // periodic sync or background fetch
  setTimeout(() => {
    showMedicationNotification(reminder);
  }, Math.min(delay, 2147483647)); // Max timeout

  // Also try to use Alarms API if available (Chrome with appropriate permissions)
  if (self.registration.periodicSync) {
    // Could use this for more persistent scheduling
  }
}

/**
 * Show medication notification
 */
function showMedicationNotification(reminder) {
  const title = 'Medication Reminder';
  const options = {
    body: `${reminder.medicationName}\nTime: ${reminder.time}`,
    icon: '/avatars/vita-alert.png',
    badge: '/avatars/vita-alert.png',
    tag: `med-${reminder.medId}-${reminder.time}`,
    requireInteraction: true,
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      type: 'medication',
      medId: reminder.medId,
      medicationName: reminder.medicationName,
      triggerAt: reminder.triggerAt
    }
  };

  self.registration.showNotification(title, options);
}

/**
 * Handle medication reminder cancellation
 */
function handleCancelMedicationReminder(reminderId) {
  pendingReminders.medication = pendingReminders.medication.filter(r => r.id !== reminderId);
  // Note: We can't cancel setTimeout once scheduled without storing the timer ID
  // In production, consider using a map of timer IDs
}

/**
 * Handle appointment reminder scheduling
 */
function handleScheduleAppointmentReminder(reminder) {
  if (!reminder || !reminder.id) {
    console.warn('Invalid appointment reminder:', reminder);
    return;
  }

  pendingReminders.appointment = pendingReminders.appointment.filter(r => r.id !== reminder.id);
  pendingReminders.appointment.push(reminder);

  scheduleAppointmentNotification(reminder);
}

/**
 * Schedule appointment notification
 */
function scheduleAppointmentNotification(reminder) {
  const triggerAt = new Date(reminder.triggerAt);
  const now = new Date();
  const delay = triggerAt.getTime() - now.getTime();

  if (delay < 0) {
    console.warn('Appointment reminder time is in the past:', reminder);
    return;
  }

  setTimeout(() => {
    showAppointmentNotification(reminder.appointment);
  }, Math.min(delay, 2147483647));
}

/**
 * Show appointment notification
 */
function showAppointmentNotification(appointment) {
  const title = 'Upcoming Appointment';
  const options = {
    body: `${appointment.title || appointment.specialistType}\n${appointment.date} at ${appointment.time}`,
    icon: '/avatars/vita-alert.png',
    badge: '/avatars/vita-alert.png',
    tag: `apt-${appointment.id}`,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      type: 'appointment',
      appointmentId: appointment.id
    }
  };

  self.registration.showNotification(title, options);
}

/**
 * Handle appointment reminder cancellation
 */
function handleCancelAppointmentReminders(appointmentId) {
  pendingReminders.appointment = pendingReminders.appointment.filter(r => r.appointmentId !== appointmentId);
}

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  if (data.type === 'medication-reminder') {
    event.waitUntil(
      self.registration.showNotification('Medication Reminder', {
        body: data.message,
        icon: '/avatars/vita-alert.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
      })
    );
  } else if (data.type === 'appointment-reminder') {
    event.waitUntil(
      self.registration.showNotification('Appointment Reminder', {
        body: data.message,
        icon: '/avatars/vita-alert.png',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true
      })
    );
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing client if available
      for (const client of clientList) {
        if (client.visibilityState === 'visible') {
          client.focus();

          // Send message to client about notification click
          if (notificationData) {
            client.postMessage({
              type: 'notification-clicked',
              ...notificationData
            });
          }
          return;
        }
      }

      // Open new client if none found
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

/**
 * Periodic sync for persistent reminder scheduling
 */
async function registerPeriodicSync() {
  if ('periodicSync' in self.registration) {
    try {
      await self.registration.periodicSync.register('reminder-check', {
        minInterval: 60 * 60 * 1000 // Check every hour
      });
    } catch (err) {
      console.warn('Periodic sync registration failed:', err);
    }
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reminder-check') {
    event.waitUntil(checkAndRescheduleReminders());
  }
});

/**
 * Check and reschedule pending reminders
 */
async function checkAndRescheduleReminders() {
  // Reschedule all pending medication reminders that are in the future
  const now = new Date();
  for (const reminder of pendingReminders.medication) {
    const triggerAt = new Date(reminder.triggerAt);
    if (triggerAt > now) {
      scheduleMedicationNotification(reminder);
    }
  }
  for (const reminder of pendingReminders.appointment) {
    const triggerAt = new Date(reminder.triggerAt);
    if (triggerAt > now) {
      scheduleAppointmentNotification(reminder);
    }
  }
}

// Optional: message handler to clear cache or force update
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
});