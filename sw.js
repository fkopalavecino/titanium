/* Titanium Sport · service worker: avisos + siempre la última versión de la app (sin caché) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
// páginas y scripts propios: se piden siempre frescos para que cada cambio se vea al abrir la app
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== self.location.origin) return;
  if (r.mode === 'navigate' || /\.(html|js|json)$/.test(u.pathname) || u.pathname.endsWith('/'))
    e.respondWith(fresca(r));
});
// siempre intenta la versión nueva; si no hay señal (o tarda mucho), abre la última copia guardada en vez del error de Safari
const CACHE = 'tl-app';
const llave = r => { const u = new URL(r.url); u.search = ''; return u.href; };
async function fresca(r) {
  const c = await caches.open(CACHE);
  try {
    const res = await Promise.race([fetch(r.url, { cache: 'no-store', credentials: 'same-origin' }),
      new Promise((_, no) => setTimeout(() => no(new Error('lento')), 8000))]);
    if (res && res.ok) c.put(llave(r), res.clone()).catch(() => {});
    return res;
  } catch (_) {
    const g = await c.match(llave(r));
    if (g) return g;
    if (r.mode === 'navigate') return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0e0c0f;color:#fff;font:600 18px system-ui;text-align:center;padding:24px"><div><p>Sin conexión a internet 📶</p><p style="color:#a69ea3;font-size:15px">Revisa tu wifi o datos y vuelve a intentar.</p><button onclick="location.reload()" style="margin-top:8px;height:52px;padding:0 28px;border:0;border-radius:14px;background:#d71f30;color:#fff;font:800 18px system-ui">Reintentar</button></div></body>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    throw _;
  }
}
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  const op = {
    body: d.body || '', icon: 'icon-192.png', badge: 'badge-96.png', tag: d.tag, renotify: !!d.tag,
    data: { url: new URL(d.url || './alumno.html', self.registration.scope).href, clase: d.clase || null }
  };
  // recordatorio de clase: botones directos (Android; en iPhone se confirma al abrir la app)
  if (d.clase) op.actions = [{ action: 'voy', title: '✅ Voy' }, { action: 'no', title: '❌ No puedo ir' }];
  e.waitUntil(self.registration.showNotification(d.title || 'Titanium Sport', op));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const nd = e.notification.data || {};
  let url = nd.url || new URL('./alumno.html', self.registration.scope).href;
  const r = e.action === 'voy' ? 'voy' : e.action === 'no' ? 'no' : '';
  if (nd.clase && r) { const u = new URL(url); u.searchParams.set('r', r); url = u.href; }
  const sp = new URL(url).searchParams;
  const ev = sp.get('ev') || (sp.get('clase') ? 'clase|' + sp.get('clase') + '|' + r : null) || (sp.get('nutri') ? 'nutri' : null);
  e.waitUntil((async () => {
    // deja anotado a qué ir: la app lo lee al abrirse o al volver a primer plano
    if (ev) { const c = await caches.open('tl-push'); await c.put('pending', new Response(JSON.stringify({ ev, t: Date.now() }))); }
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const ruta = u => new URL(u).pathname.replace(/index\.html$/, '');
    const esAlumno = ruta(url).endsWith('alumno.html');
    const c = cs.find(x => ruta(x.url) === ruta(url)) || (esAlumno ? cs.find(x => x.url.includes('alumno.html')) || cs[0] : null);
    if (c) { if (esAlumno) c.postMessage({ ev: url }); else if (new URL(url).hash) c.postMessage({ go: url }); try { await c.focus(); } catch (_) {} return; }
    await self.clients.openWindow(url);
  })());
});
