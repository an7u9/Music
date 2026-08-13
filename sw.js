// Minimal service worker.
// Its main job here is NOT offline caching of songs — it's to satisfy the
// installability requirement so iOS/Android will let you "Add to Home
// Screen" as a standalone app. Standalone/installed apps get much more
// reliable background audio than a normal browser tab, especially on iOS
// Safari, which aggressively suspends regular background tabs.

const CACHE_NAME = 'pink-beats-shell-v1';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/responsive.css',
  '/lrics.css',
  '/script.js',
  '/lyrics.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GET requests for the app shell.
  // Audio files (Cloudinary, cross-origin) are intentionally left
  // untouched — they go straight to the network so we don't try to
  // cache large media files or interfere with range requests that
  // <audio> relies on for seeking.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});