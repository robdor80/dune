const CACHE_NAME = 'dune-v1';
const assets = [
  './',
  './index.html',
  './admin.html',
  './base.html',
  './css/main.css',
  './css/admin.css',
  './css/base.css',
  './js/db.js',
  './js/calculadora.js',
  './js/admin.js'
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Responder con caché o red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});