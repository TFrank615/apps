const CACHE_NAME = 'gmv-proto-cache-v1'; // Bumped version

// Core files to cache immediately on install
const urlsToCache = [
    './',
    './index.html',
    './2025protocol.pdf',
    './gmvlogo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// Dynamic Caching Magic
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 1. If we have it in the cache, serve it immediately
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. If not, fetch it from the network
            return fetch(event.request).then(networkResponse => {
                // Ensure the response is valid before caching
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Clone the response because it can only be consumed once
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    // Cache the new file (ignores browser extensions/weird schemes)
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, responseToCache);
                    }
                });

                return networkResponse;
            });
        })
    );
});