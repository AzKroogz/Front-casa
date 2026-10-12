var CACHE_NAME = 'casa-shell-v1';
var APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './legacy.css',
  './tablet-portrait.css',
  './app.js',
  './legacy-domain.js',
  './legacy-render.js',
  './legacy-api.js',
  './legacy-app.js',
  './pwa.js',
  './manifest.webmanifest',
  './src/idle.js',
  './src/quick-date.js',
  './src/supabase-client.js',
  './src/supabase-task-repository.js',
  './src/task-domain.js',
  './src/task-icons.js',
  './src/task-repository.js',
  './src/task-templates.js',
  './src/task-view-model.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(APP_SHELL);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (key) {
      if (key !== CACHE_NAME) return caches.delete(key);
      return Promise.resolve(false);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/\/config\.js$/.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put('./index.html', copy); });
      return response;
    }).catch(function () {
      return caches.match('./index.html');
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    var networkFetch = fetch(request).then(function (response) {
      if (!response || response.status !== 200) return response;
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      return response;
    }).catch(function () {
      return cached;
    });
    return cached || networkFetch;
  }));
});
