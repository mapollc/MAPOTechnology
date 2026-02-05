let CACHE_NAME, VERSION, HOST, MB_VERSION;

self.addEventListener('message', (event) => {
    if (event.data) {
        if (event.data.hasOwnProperty('host')) HOST = event.data.host;
        if (event.data.hasOwnProperty('mbVersion')) MB_VERSION = event.data.mbVersion;
        if (event.data.hasOwnProperty('version')) VERSION = event.data.version;
    }
});

self.addEventListener('install', (event) => {
    if (!VERSION && !MB_VERSION && !HOST) {
        return;
    }

    CACHE_NAME = `mapofire-v${self.VERSION}`;

    const CACHE_URLS = [
        `${HOST}src/js/incident-${self.VERSION}.js`,
        `${HOST}src/js/wwas-${self.VERSION}.js`,
        `${HOST}src/js/fwf-${self.VERSION}.js`,
        //`${HOST}src/js/mf.tools-${self.VERSION}.js`,
        `${HOST}src/js/arcgis-${self.VERSION}.js`,
        'https://kit.fontawesome.com/aa68e0c9b6.js',
        'https://code.highcharts.com/highcharts.js',
        'https://code.highcharts.com/modules/exporting.js',
        `https://cdn.jsdelivr.net/npm/maplibre-gl@${self.MB_VERSION}/dist/maplibre-gl.min.css`,
        `https://cdn.jsdelivr.net/npm/maplibre-gl@${self.MB_VERSION}/dist/maplibre-gl.min.js`
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