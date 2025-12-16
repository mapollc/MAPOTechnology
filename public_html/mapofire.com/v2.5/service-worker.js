let CACHE_NAME, version, host, mbVersion;

self.addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.hasOwnProperty('host')) {
            host = event.data.host;
        }

        if (event.data.hasOwnProperty('mbVersion')) {
            mbVersion = event.data.mbVersion;
        }

        if (event.data.hasOwnProperty('version')) {
            version = event.data.version;
        }
    }
});

self.addEventListener('install', (event) => {
    if (!version && !mbVersion && !host) {
        return;
    }

    CACHE_NAME = `mapofire-v${self.version}`;

    const CACHE_URLS = [
        `${host}src/js/incident-${self.version}.js`,
        `${host}src/js/wwas-${self.version}.js`,
        `${host}src/js/fwf-${self.version}.js`,
        `${host}src/js/mf.tools-${self.version}.js`,
        'https://kit.fontawesome.com/aa68e0c9b6.js',
        'https://code.highcharts.com/highcharts.js',
        'https://code.highcharts.com/modules/exporting.js',
        `https://cdn.jsdelivr.net/npm/maplibre-gl@${self.mbVersion}/dist/maplibre-gl.min.css`,
        `https://cdn.jsdelivr.net/npm/maplibre-gl@${self.mbVersion}/dist/maplibre-gl.min.js`
        /*`https://api.mapbox.com/mapbox-gl-js/${self.mbVersion}/mapbox-gl.js`,
        `https://api.mapbox.com/mapbox-gl-js/${self.mbVersion}/mapbox-gl.css`*/
    ];

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(CACHE_URLS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});