/* Titanium Sport · service worker: solo avisos (sin caché) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Titanium Sport', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag, renotify: !!d.tag,
    data: { url: new URL(d.url || './alumno.html', self.registration.scope).href }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || new URL('./alumno.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) if (c.url.includes('alumno.html') && 'focus' in c) { c.postMessage({ ev: url }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
