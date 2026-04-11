// public/sw.js

const CACHE_NAME = 'exam-bank-push-v1';

// ── Push event ────────────────────────────────────────────────
// Fired when the browser receives a push message from the server.
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Exam Bank', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    requireInteraction: false,
  };

  const broadcastPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'EXAM_BANK_PUSH_RECEIVED',
          payload: {
            title: data.title || 'Exam Bank',
            body: data.body || '',
            url: data.url || '/',
            tag: data.tag || 'default',
          },
          receivedAt: Date.now(),
        });
      }
    });

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Exam Bank', options),
      broadcastPromise,
    ])
  );
});

// ── Notification click ─────────────────────────────────────────
// Fired when user clicks a shown notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    // Try to focus an existing window/tab with the same URL
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.endsWith(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Install / Activate ─────────────────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
