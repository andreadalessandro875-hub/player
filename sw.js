// Service worker: l'app funziona anche offline.
// Strategia "prima la rete": quando c'è connessione si caricano sempre i file aggiornati, tutti della stessa
// versione (evita di mescolare un index.html vecchio con un app.js nuovo). La cache serve solo offline.
// A ogni rilascio cambia VERSION qui e il parametro ?v= in index.html.
const VERSION = 'v12';
const CACHE = 'loop-player-' + VERSION;
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const withTimeout = (p, ms) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error('timeout')), ms);
  p.then(r => { clearTimeout(t); res(r); }, err => { clearTimeout(t); rej(err); });
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await withTimeout(fetch(req), 5000);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      const hit = await cache.match(req, { ignoreSearch: true }) ||
        (req.mode === 'navigate' ? await cache.match('index.html') : undefined);
      return hit || Response.error();
    }
  })());
});
