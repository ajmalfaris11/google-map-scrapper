self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch event listener is required for PWA installability by most browsers.
// We just pass the request to the network (no offline caching).
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
  }
});
