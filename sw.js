const CACHE_NAME = 'dune-v2';
const assets = [
  'index.html',
  'admin.html',
  'base.html',
  'css/main.css',
  'css/admin.css',
  'css/base.css',
  'js/db.js',
  'js/calculadora.js',
  'js/admin.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});