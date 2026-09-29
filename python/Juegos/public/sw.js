const CACHE_NAME = 'tosito-games-v3';
const ASSETS = [
  '/',
  '/hub_main.html',
  '/plata_o_plomo.html',
  '/js/app_v80.js',
  '/assets/img/tosito_games_logo.png',
  '/assets/img/plata_o_plomo_icon.png',
  '/favicon.ico',
  '/plata_o_plomo_manifest.json',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching system assets');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean http/https (ej: extensiones de Chrome, analytics externos problemáticos)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retornar caché si existe
      if (response) return response;

      // Si no está en caché, intentar red
      return fetch(event.request).catch((err) => {
        // Fallback si falla el fetch y es una navegación (offline)
        if (event.request.mode === 'navigate') {
          return caches.match('/plata_o_plomo.html') || caches.match('/hub_main.html');
        }
        
        // NO retornar null ni atrapar el error de forma que devuelva algo inválido a respondWith.
        // Al lanzar el error, el navegador lo manejará como un error de red estándar.
        console.warn('[SW] Fetch failed for:', event.request.url);
        throw err;
      });
    })
  );
});
