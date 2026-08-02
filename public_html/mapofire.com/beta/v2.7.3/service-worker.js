const urlParams = new URL(self.location).searchParams;
const VERSION = urlParams.get('v');
const MB_VERSION = urlParams.get('m');
const HOST = decodeURIComponent(urlParams.get('h'));

const CACHE_NAME = `mapofire-v${VERSION}`;

// Core files to cache
const CACHE_URLS = [
    `${HOST}src/js/mf.app-${VERSION}.js`,
    `${HOST}src/js/mf.supp-${VERSION}.js`,
    `${HOST}src/js/mf.utils-${VERSION}.js`,
    `${HOST}src/js/incident-${VERSION}.js`,
    `${HOST}src/js/wwas-${VERSION}.js`,
    `${HOST}src/js/fwf-${VERSION}.js`,
    // `${HOST}src/js/mf.tools-${VERSION}.js`, // optional
    `${HOST}src/js/arcgis-${VERSION}.js`,
    'https://kit.fontawesome.com/aa68e0c9b6.js',
    'https://code.highcharts.com/highcharts.js',
    'https://code.highcharts.com/modules/exporting.js',
    `https://cdn.jsdelivr.net/npm/maplibre-gl@${MB_VERSION}/dist/maplibre-gl.min.css`,
    `https://cdn.jsdelivr.net/npm/maplibre-gl@${MB_VERSION}/dist/maplibre-gl.min.js`,
    'https://unpkg.com/maplibre-contour@0.1.0/dist/index.min.js'
];

// Install: cache core assets
self.addEventListener('install', event => {
    self.skipWaiting(); // activate immediately

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(CACHE_URLS.map(url => cache.add(url)))
        )
    );
});

// Activate: clean up old caches and claim clients
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: cache-first with network update
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => {
            const fetchPromise = fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => cached || new Response('Offline', { status: 503, statusText: 'Offline' }));

            return cached || fetchPromise;
        })
    );
});