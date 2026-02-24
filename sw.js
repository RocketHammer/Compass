const CACHE_NAME = 'compass-v16';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// Pre-cache the app shell on install so the app works fully offline.
// skipWaiting() activates the new SW immediately instead of waiting for
// all tabs using the old SW to close.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// On activation, delete old caches and immediately take control of all
// open tabs so they serve fresh assets on the next fetch.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cache-first strategy: serve from cache if available, otherwise fetch
// from the network.  This is ideal for a fully offline-capable app where
// all assets are pre-cached during install.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
