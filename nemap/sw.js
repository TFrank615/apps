const CACHE_NAME = 'ne-map-cache-v5';

// List all files, including your new map image
const urlsToCache = [
    './',
    './index.html',
    './ne1st.png',
    './ne2nd.png', // Added second image
    './nelogo.png'
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