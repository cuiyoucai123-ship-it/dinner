// The scope is exactly ./magic-button.html, so dinner keeps its own worker.
const CACHE = 'magic-button-github-v4';
const ASSETS = [
  './magic-button.html',
  './magic-button-assets/manifest.webmanifest',
  './magic-button-assets/magic-icon-v3-64.png',
  './magic-button-assets/magic-icon-v3-180.png',
  './magic-button-assets/magic-icon-v3-192.png',
  './magic-button-assets/magic-icon-v3-512.png'
];
const urls = new Set(ASSETS.map(path => new URL(path, self.location.href).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('magic-button-github-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !urls.has(url.pathname)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && !response.redirected) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(event.request, { ignoreSearch: true }) || Response.error();
  }));
});
