const CACHE_NAME = 'tati-toust-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/hero_panther.png',
  './assets/hero_rat.png',
  './assets/punk_spikes.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentar cachear pero tolerar fallos si algún archivo falta
      return cache.addAll(ASSETS).catch(err => console.warn('Cache install warning:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Ignorar peticiones de Firebase, Firestore, OpenStreetMap u otras APIs de terceros para evitar fallos de CORS
  if (
    e.request.url.includes('firestore.googleapis.com') || 
    e.request.url.includes('firebase') ||
    e.request.url.includes('nominatim') ||
    e.request.url.includes('basemaps.cartocdn.com')
  ) {
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Guardar dinámicamente recursos del mismo dominio
        if (e.request.url.startsWith(self.location.origin) && e.request.method === 'GET') {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback fuera de línea para la navegación principal
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
