const CACHE_NAME = 'beltrech19-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/image/bel.jpg',
  '/image/logo.png',
  '/mentions-legales.html',
  // Ajoutez ici toutes les autres ressources importantes
];

self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});