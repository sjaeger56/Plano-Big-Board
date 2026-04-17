// Service Worker for Big Board PWA
// Caches the app shell for faster loads and basic offline support.
// Data from the Apps Script API is always fetched fresh (network-first).

var CACHE_NAME = 'bigboard-v1';
var SHELL_URLS = [
  '/Plano-Big-Board/bigboard.html',
  '/Plano-Big-Board/icon-192x192.png',
  '/Plano-Big-Board/icon-512x512.png',
  '/Plano-Big-Board/manifest.json'
];

// Install — pre-cache the app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network-first for API calls, cache-first for app shell
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Always go to network for API data (Apps Script)
  if (url.indexOf('script.google.com') !== -1 ||
      url.indexOf('googleapis.com') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for everything else (app shell, fonts, icons)
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // Cache successful responses for future use
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
