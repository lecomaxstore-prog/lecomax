// Service worker — L'ecomax
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([self.clients.claim(), flushPushRenewals().catch(() => undefined)]));
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

  event.waitUntil(Promise.all([
    self.registration.showNotification(payload.title, options),
    flushPushRenewals().catch(() => undefined),
  ]));
});

// ── Notification click ──────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  let target;
  try { target = new URL(event.notification.data?.url || '/', self.location.origin); }
  catch { target = new URL('/', self.location.origin); }
  if (target.origin !== self.location.origin) target = new URL('/', self.location.origin);
  const url = target.href;
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
  if (!event.oldSubscription) return;
  event.waitUntil((async () => {
    const subscription = event.newSubscription || await self.registration.pushManager.subscribe(event.oldSubscription.options);
    await renewalStore('readwrite', store => store.put({
      id: event.oldSubscription.endpoint,
      created: Date.now(),
      body: { oldSubscription: event.oldSubscription.toJSON(), subscription: subscription.toJSON() },
    }));
    await flushPushRenewals();
  })());
});

// Persist rotations before networking: offline renewal must not lose admin status.
function renewalStore(mode, operation) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lecomax-push-renewals', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pending', { keyPath: 'id' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('pending', mode);
      const result = operation(transaction.objectStore('pending'));
      transaction.oncomplete = () => { db.close(); resolve(result.result); };
      transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  });
}

let renewalFlush;
function flushPushRenewals() {
  if (renewalFlush) return renewalFlush;
  renewalFlush = (async () => {
    const pending = await renewalStore('readonly', store => store.getAll());
    for (const item of pending.sort((a, b) => a.created - b.created)) {
      try {
        const response = await fetch('/api/push/renew', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body), signal: AbortSignal.timeout(15000),
        });
        if (!response.ok && response.status !== 403 && response.status !== 400) throw new Error('Renewal pending');
        await renewalStore('readwrite', store => store.delete(item.id));
      } catch {
        if (self.registration.sync) await self.registration.sync.register('push-renewal').catch(() => undefined);
        break;
      }
    }
  })().finally(() => { renewalFlush = undefined; });
  return renewalFlush;
}
self.addEventListener('sync', event => {
  if (event.tag === 'push-renewal') event.waitUntil(flushPushRenewals());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'RETRY_PUSH_RENEWAL') event.waitUntil(flushPushRenewals());
});
