'use strict';

const CACHE_NAME = 'gmv-proto-cache-v8';
const CORE_FILES = [
    './',
    './index.html',
    './pdfjs/web/viewer.html',
    './pdfjs/web/viewer.css',
    './pdfjs/web/viewer.mjs',
    './pdfjs/web/locale/locale.json',
    './pdfjs/web/locale/en-US/viewer.ftl',
    './pdfjs/build/pdf.mjs',
    './pdfjs/build/pdf.worker.mjs',
    './2025protocol.pdf',
    './gmvlogo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CORE_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

function isSameOrigin(url) {
    return url.origin === self.location.origin;
}

async function cacheSuccessfulResponse(request, response) {
    if (
        request.method !== 'GET' ||
        !response ||
        response.status !== 200 ||
        !isSameOrigin(new URL(request.url))
    ) {
        return;
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
}

async function handleRangeRequest(request) {
    const rangeHeader = request.headers.get('range');
    const plainRequest = new Request(request.url, {
        method: 'GET',
        headers: new Headers(),
        credentials: request.credentials,
        mode: request.mode,
        redirect: request.redirect
    });

    let response = await caches.match(plainRequest);

    if (!response) {
        response = await fetch(plainRequest);
        await cacheSuccessfulResponse(plainRequest, response);
    }

    if (!response || !response.ok || !rangeHeader) {
        return response;
    }

    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader.trim());
    if (!match) {
        return response;
    }

    const buffer = await response.arrayBuffer();
    const total = buffer.byteLength;
    const start = Number.parseInt(match[1], 10);
    const requestedEnd = match[2] ? Number.parseInt(match[2], 10) : total - 1;
    const end = Math.min(requestedEnd, total - 1);

    if (!Number.isFinite(start) || start < 0 || start >= total || end < start) {
        return new Response(null, {
            status: 416,
            headers: {
                'Content-Range': `bytes */${total}`
            }
        });
    }

    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
    headers.set('Content-Length', String(end - start + 1));

    return new Response(buffer.slice(start, end + 1), {
        status: 206,
        statusText: 'Partial Content',
        headers
    });
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        await cacheSuccessfulResponse(request, response);
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }

    const response = await fetch(request);
    await cacheSuccessfulResponse(request, response);
    return response;
}

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (!isSameOrigin(url)) {
        return;
    }

    if (request.headers.has('range')) {
        event.respondWith(handleRangeRequest(request));
        return;
    }

    if (request.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // The viewer URL contains the PDF filename in its query string. Serve the
    // newly precached viewer shell regardless of that query so iPad standalone
    // mode cannot revive an older copy of viewer.html.
    if (url.pathname.endsWith('/pdfjs/web/viewer.html')) {
        event.respondWith(
            caches.open(CACHE_NAME)
                .then(cache => cache.match('./pdfjs/web/viewer.html'))
                .then(cached => cached || fetch(request))
        );
        return;
    }

    event.respondWith(cacheFirst(request));
});
