const CACHE_NAME = 'ne-2nd-cache-v1';

// List all the files you want cached
const urlsToCache = [
    './',
    './index.html',
    './ne2nd.png',
    './nelogo.png'
];

// Install the service worker and open the cache
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Intercept network requests and serve from cache if offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If the file is in the cache, return it. Otherwise, fetch it from the network.
                return response || fetch(event.request);
            })
    );
});