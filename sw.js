// CampulseHub Service Worker — Push Notifications
const CACHE_NAME = 'campulse-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Recibir notificación push
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'campulse',
    renotify: true,
    data: { url: data.url || 'https://www.campulsehub.com' },
    actions: [
      { action: 'open', title: '▶ Ver en vivo' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  e.waitUntil(
    self.registration.showNotification(data.title || 'CampulseHub', options)
  );
});

// Clic en notificación
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  const url = e.notification.data?.url || 'https://www.campulsehub.com';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('campulsehub.com') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
