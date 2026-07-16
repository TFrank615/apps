const CACHE_NAME = 'ses-map-cache-v1';

// List all files, including your new map image
const urlsToCache = [
    './',
    './index.html',
    './ses1st.png',
    './ses2nd.png', // Added second image
    './shslogo.png'
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