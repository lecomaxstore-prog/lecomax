self.addEventListener('push', event => {
  if (!event.data) return;
  event.waitUntil((async () => {
    const payload = event.data.json();
    await self.registration.showNotification(payload.title || "L’ecomax", {
      body: payload.body || '',
      tag: payload.campaignId,
      data: { url: payload.url || '/notifications' },
    });
    const windows = await self.clients.matchAll({ type: 'window' });
    windows.forEach(client => client.postMessage({ type: 'LECOMAX_NOTIFICATION' }));
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/notifications', self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('navigate' in client) { await client.navigate(url.href); return client.focus(); }
    }
    return self.clients.openWindow(url.href);
  })());
});
