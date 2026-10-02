// Service Worker for XINDIA Admin Web Push Notifications
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || '⚡ XINDIA Admin Alert';
    const options = {
      body: data.body || '',
      icon: '/icon-192x192.png',
      badge: '/favicon-32x32.png',
      data: { url: data.url || '/admin/alerts' },
      tag: 'xindia-admin-alert-' + (data.timestamp || Date.now()),
      renotify: true,
      requireInteraction: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[Admin SW] Failed to show push notification:', err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/admin/alerts';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
