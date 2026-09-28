// Chanda service worker: makes the app installable and lets it open without internet.
// Bump VERSION whenever you change any file, so phones pick up the update.
const VERSION = 'chanda-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './moon.jpg', './crescent.png', './favicon.png',
  './chanda-avatar.png', './chuza-avatar.png',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Only handle our own files. API calls (Groq, Anthropic, proxy) and fonts go straight to the network.
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // The page itself: network first so updates show up, cached copy when offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Images and other static files: cache first.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return res;
    }))
  );
});
