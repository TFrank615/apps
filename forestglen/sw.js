const CACHE_NAME = 'fg-map-cache-v1';

// List all files, including your new map image
const urlsToCache = [
    './',
    './index.html',
    './fgmap.png',
    './fglogo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});