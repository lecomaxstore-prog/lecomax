// Service worker — L'ecomax
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// ── Push notification received ──────────────────────────────
self.addEventListener('push', event => {
  let payload = { title: "L'ecomax", body: "Vous avez un nouveau message.", icon: '/favicon.png?v=4', badge: '/icons/icon-192.png?v=4', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: !payload.icon || payload.icon === '/favicon.png' ? '/favicon.png?v=4' : payload.icon,
    badge: payload.badge || '/icons/icon-192.png?v=4',
    image: payload.image || undefined,
    tag: payload.tag || 'lecomax-push',
    renotify: true,
    requireInteraction: payload.requireInteraction || false,
    data: { url: payload.url || '/' },
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// ── Notification click ──────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// ── Push subscription changed ───────────────────────────────
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(sub => fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      }))
  );
});
