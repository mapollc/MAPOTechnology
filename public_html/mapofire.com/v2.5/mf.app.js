const specificURL = window.location.origin + '/',
    mfFonts = specificURL + 'data/maps/fonts/{fontstack}/{range}.pbf',
    debugMode = window.location.search.search('version') >= 0,
    getPlatform = () => {
        const h = window.location.host;
        if (h.includes('wildfiremap.org')) return 'wildfiremap';
        if (h.includes('fireweatheravalanche.org')) return 'fireweatheravalanche';
        return 'mapofire';
    },
    config = {
        host: `https://${window.location.host}/`/*'https://www.mapofire.com/'*/,
        domain: 'https://www.mapotechnology.com/',
        apiURL: 'https://api.mapotechnology.com/v1/',
        productName: 'Map of Fire',
        company: 'MAPO LLC',
        /*sub_id: 'price_1MgxhSIpCdpJm6cTaKp2dqf5',*/
        apiKey: () => {
            const keys = {
                'fireweatheravalanche': '191eab18c50c8f5653bdeba13f219bed',
                'wildfiremap': '85f58fa255efe0f779e0dfcd62d87e6d',
                'mapofire': '50e2c43f8f63ff0ed20127ee2487f15e'
            };

            return keys[getPlatform()];
        },
        disableClicks: false,
        wildfire: null,
        layersHandler: null,
        layersMenu: null,
        listOfLayers: [],
        fuelsData: null,
        specificURL: specificURL,
        donateLink: 'https://mapofire.com/donate',
        mapboxToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
        //defaultAttr: '&copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a> ',
        defaultAttr: '',
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
        longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        curTime: new Date(),
        daysInYear: (y = null) => { const year = y ?? config.curTime.getFullYear(); return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365; },
        runSearch: false,
        TIERS: {
            'ignite_monthly': 'PREMIUM',
            'ignite_annual': 'PREMIUM',
            'hotshot_monthly': 'PRO',
            'hotshot_annual': 'PRO'
        },
        PERMISSION_LEVELS: {
            ADMIN: 'ADMIN',
            PREMIUM: 'PREMIUM',
            PRO: 'PRO'
        },
        RANKS: {
            PREMIUM: 1,
            PRO: 2,
            ADMIN: 3
        },
        modisZoomLevel: 7,
        firemedZoomLevel: 9,
        toolsInstance: null,
        workers: {
            incident: new Worker(specificURL + (debugMode ? 'v' + version + '/incident.js' : 'src/js/incident-' + version + '.js')),
            fwf: null,
            wwas: null
        },
        fog: {
            'sky-color': '#33bbff',
            'sky-horizon-blend': +0.5,
            'horizon-color': '#b1ddec',
            'horizon-fog-blend': +0.5,
            'fog-color': '#c7c7c7',
            'fog-ground-blend': +0.1
        },
        tiles: null,
        fonts: {
            din: () => {
                const fontMap = {
                    'dark': ['Noto Sans Regular'],
                    'voyager': ['Noto Sans Regular'],
                    'satellite': ['Noto Sans Bold'],
                    'default': ['DIN Pro Medium']
                };
                return fontMap[settings.getBasemap()] || fontMap['default'];
            },
            source: () => {
                const fontMap = {
                    'dark': ['Noto Sans Regular'],
                    'voyager': ['Noto Sans Regular'],
                    'satellite': ['Noto Sans Bold'],
                    'osm': ['Source Sans Pro SemiBold'],
                    'default': ['Source Sans Pro SemiBold']
                };
                return fontMap[settings.getBasemap()] || fontMap['default'];
            },
            roboto: () => {
                const fontMap = {
                    'dark': ['Montserrat Medium'],
                    'voyager': ['Montserrat Medium'],
                    'satellite': ['Noto Sans Bold'],
                    'default': ['Roboto Medium']
                };
                return fontMap[settings.getBasemap()] || fontMap['default'];
            }
        }
    },
    layerActions = {
        'newFires': { layers: ['new_fires_layer', 'new_fire_title'] },
        'allFires': { layers: ['all_fires_layer', 'all_fire_title', 'ca_fires', 'ca_fire_title'] },
        'smokeChecks': { layers: ['smk_fires_layer', 'smk_fire_title'] },
        'rxBurns': { layers: ['rx_fires_layer', 'rx_fire_title'] },
        'perimeters': {
            layers: ['perimeters_outline', 'perimeters_fill', 'perimeters_title', 'ca_perimeters_outline',
                'ca_perimeters_fill', 'ca_perimeters_title', 'aus_perimeters_outline', 'aus_perimeters_fill', 'aus_perimeters_title']
        },
        'modis24': { layers: ['modis24'], exe: () => { config.layersHandler.modis(1); } },
        'modis48': { layers: ['modis48'], exe: () => { config.layersHandler.modis(2); } },
        'modis72': { layers: ['modis72'], exe: () => { config.layersHandler.modis(3); } },

        'evac': { layers: ['evac', 'evac_outline', 'evac_title'] },
        'firemed': { layers: ['firemed'], exe: () => { config.layersHandler.firemed(); } },

        'lightning1': { layers: ['lightning1'] },
        'lightning24': { layers: ['lightning24'] },
        'wwas': { layers: ['wwas_fill', 'wwas_outline', 'wwas_title'], exe: async () => { new (await loadUtils()).NWS().get(); } },
        'stns': { layers: ['stns', 'stns_text'], exe: () => { new Weather().raws(); } },
        'visSatellite': { layers: ['satellite1'], exe: async () => { new (await loadUtils()).NWS().satellite(1); } },
        'irSatellite': { layers: ['satellite2'], exe: async () => { new (await loadUtils()).NWS().satellite(2); } },
        'wvSatellite': { layers: ['satellite3'], exe: async () => { new (await loadUtils()).NWS().satellite(3); } },

        'ev': { layers: ['ev'], exe: () => { config.layersHandler.pnwVulnerability(); } },
        'spcClimo': {
            run: (checked) => {
                if (checked) {
                    config.layersHandler.spcClimo();
                } else {
                    map.removeLayer('spc_climo_fill');
                    map.removeLayer('spc_climo_outline');
                    map.removeLayer('spc_climo_prob');
                    map.removeSource('spc_climo');
                    document.querySelector('.spcTimeline').remove();
                }
            }
        },
        'nri': { layers: ['nri_outline', 'nri_fill'], exe: () => { config.layersHandler.nri(); } },
        'rth': { layers: ['rth'], exe: () => { config.layersHandler.rth(); } },
        'bp': { layers: ['bp'], exe: () => { config.layersHandler.bp(); } },
        'whp': { layers: ['whp'], exe: () => { config.layersHandler.whp(); } },
        'wet': { layers: ['wet'], exe: () => { config.layersHandler.wet(); } },
        'drought': { layers: ['drought', 'drought_outline', 'drought_title'], exe: () => { config.layersHandler.drought(); } },
        'power': { layers: ['power'], exe: () => { config.layersHandler.power(); } },
        'fuels': { layers: ['fuels', 'fuelsAK'], exe: () => { config.layersHandler.fuels(); } },

        'nwsCWAs': { layers: ['nwsCWAs'], exe: () => { config.layersHandler.nwsCWAs(); } },
        'roads': { layers: ['roads'], exe: () => { config.layersHandler.roads(); } },
        'lands': { layers: ['lands'], exe: () => { config.layersHandler.lands(); } },
        'plss': { layers: ['plss'], exe: () => { config.layersHandler.plss(); } },
        'dispatch': { layers: ['dispatch_outline', 'dispatch_title'], exe: () => { config.layersHandler.dispatch(); } },
        'gaccBounds': { layers: ['gaccBounds', 'gaccBounds_title'], exe: () => { config.layersHandler.gaccBounds(); } },

        'hms': { layers: ['hms', 'hms_title'], exe: () => { config.layersHandler.hms(); } },
        'smokeFcst': { layers: ['smokeFcst'], exe: () => { config.layersHandler.smokeFcst(); } },
        'sfcSmoke': { layers: ['sfcSmoke'], exe: () => { config.layersHandler.sfcSmoke(); } },
        'viSmoke': { layers: ['viSmoke'], exe: () => { config.layersHandler.viSmoke(); } },

        'countyBounds': { layers: ['countyBounds'], exe: () => { config.layersHandler.countyBounds(); } },
        'odfFDR': { layers: ['odfFDR', 'odfFDR_outline', 'odfFDR_title'], exe: () => { config.layersHandler.odfFDR(); } },
        'calfireUnits': { layers: ['calfireUnits', 'calfireUnits_title'], exe: () => { config.layersHandler.calfireUnits(); } },
        'cdfFHSZ': { layers: ['cdfFHSZ', 'cdfFHSZ_title'], exe: () => { config.layersHandler.cdfFHSZ(); } },
        'calfireAircraft': { layers: ['calfireAircraft', 'calfireAircraft_title'], exe: () => { config.layersHandler.calfireAircraft(); } },

        'airq': {
            run: (checked) => {
                const i = setInterval(() => {
                    if (map.getSource('airq')) {
                        clearInterval(i);
                        ['airQuality', 'airQuality_text'].forEach(n => map.setLayoutProperty(n, 'visibility', checked ? 'visible' : 'none'));
                    }
                }, 500);
            }
        },
        'spc': {
            run: async (checked) => {
                if (impact.style.display == 'flex' && impact.dataset.content == 'layers') {
                    document.querySelector('#otlkType').disabled = !checked;
                    document.querySelector('#otlkDay').disabled = !checked;
                }

                if (map.getSource('outlook')) {
                    ['outlook_fill', 'outlook_outline', 'outlook_title'].forEach(n => map.setLayoutProperty(n, 'visibility', checked ? 'visible' : 'none'));
                } else if (checked) {
                    new (await loadUtils()).NWS().spc();
                }
            }
        },
        'radar': {
            run: (checked) => {
                if (checked) {
                    config.layersHandler.radarInit();
                } else {
                    radarPlay = true;
                    document.querySelector('.radar').remove();
                    clearInterval(radarAnim);

                    for (let i = 0; i < radarImgs.length; i++) {
                        map.removeLayer('radar-layer-' + i);
                        map.removeSource('radar-' + i);
                    }
                }
            }
        },
        'ndfd': {
            run: async (checked) => {
                const visibility = checked ? 'visible' : 'none';

                if (impact.style.display == 'flex') {
                    document.querySelector('#forecastModel').disabled = !checked;
                    document.querySelector('#fcstTime').disabled = !checked;
                }

                if (map.getSource('ndfd')) {
                    map.setLayoutProperty('ndfd', 'visibility', visibility);

                    if (!checked) document.querySelector('.ndfdLegend')?.remove();
                } else if (checked) {
                    new (await loadUtils()).NWS().ndfd();
                }
            }
        },
        'erc': {
            run: (checked) => {
                if (impact.style.display == 'flex') document.querySelector('#erc_time').disabled = !checked;

                if (map.getSource('erc')) {
                    ['erc_fill', 'erc_outline'].forEach(n => map.setLayoutProperty(n, 'visibility', checked ? 'visible' : 'none'));
                } else if (checked) {
                    config.layersHandler.erc();
                }
            }
        },
        'sfp': {
            run: (checked) => {
                if (impact.style.display == 'flex') document.querySelector('#sfpDateSelect').disabled = !checked;

                if (map.getSource('sfp')) {
                    map.setLayoutProperty('sfp', 'visibility', checked ? 'visible' : 'none');
                } else if (checked) {
                    config.layersHandler.sfp();
                }
            }
        }
    },
    osm = {
        version: 8,
        glyphs: mfFonts,
        sources: {
            'openstreetmap': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        },
        layers: [{
            id: 'osm',
            type: 'raster',
            source: 'openstreetmap',
            minzoom: 0,
            maxzoom: 19
        }]
    },
    topofire = {
        version: 8,
        glyphs: mfFonts,
        sources: {
            'topofire': {
                type: 'raster',
                tiles: [config.domain + 'assets/images/tiles/6/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; <a href="umt.edu">UMT</a>, USFS, NOAA, NIDIS, NASA'
            }
        },
        layers: [{
            id: 'topofire',
            type: 'raster',
            source: 'topofire',
            minzoom: 0,
            maxzoom: 13
        }]
    },
    terrain = {
        version: 8,
        glyphs: mfFonts,
        sources: {
            'esri': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: '&copy; <a href="https://www.arcgis.com">ESRI</a>'
            }
        },
        layers: [{
            id: 'terrain',
            type: 'raster',
            source: 'esri',
            minzoom: 3,
            maxzoom: 18
        }]
    },
    caltopo = {
        version: 8,
        glyphs: mfFonts,
        sources: {
            'ct': {
                type: 'raster',
                tiles: [config.domain + 'assets/images/tiles/2/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '&copy; <a href="https://caltopo.com">CalTopo</a>'
            }
        },
        layers: [{
            id: 'caltopo',
            type: 'raster',
            source: 'ct',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    fs16 = {
        version: 8,
        glyphs: mfFonts,
        sources: {
            'usfs2016': {
                type: 'raster',
                tiles: [config.domain + 'assets/images/tiles/3/{z}/{x}/{y}.png'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'fs16',
            type: 'raster',
            source: 'usfs2016',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    activeIncidents = new Map(),
    modal = document.querySelector('#modal'),
    impact = document.querySelector('#impact'),
    searchResults = document.querySelector('#search-results'),
    disclaimer = 'This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.',
    impactHeader = `<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" data-action="close-impact" title="Close window">
    <i class="far fa-xmark" data-action="close-impact"></i></div></header>`,
    noneTracked = '<p class="message error">You aren\'t following any wildfires yet. Click on a fire to start following an incident.</p>',
    risk = {
        'whp': [
            ['N/A', '#fff'],
            ['Very Low', '#38a800'],
            ['Low', '#d1ff73'],
            ['Moderate', '#ffff00'],
            ['High', '#ffaa00'],
            ['Very High', '#ff0000']
        ]
    },
    loadUtils = async () => {
        if (lu) return lu;

        try {
            lu = await import(config.specificURL + (debugMode ? 'v' + version + '/mf.utils.js' : 'src/js/mf.utils-' + version + '.js'));
            return lu;
        } catch (e) {
            console.error('Failed to load utils', e);
            lu = null;
            throw e;
        }
    },
    mapControls = [];

let map,
    conversion,
    settings,
    lu,
    trending = false,
    newFires = [],
    CLUSTER_FIRES = true,
    highchartsLoad = false,
    chart,
    hrrrSmokeTime = {
        'init': gmtime(-3600),
        'fcst': gmtime(+3600)
    },
    dispatchCenters,
    selected = {
        caperim: null,
        ausperim: null,
        perim: null,
        evac: null,
        nri: null,
        erc: null
    },
    marker,
    topFires = [],
    clicks = [],
    radarImgs = [],
    radarAnim,
    RADAR_INT = 500,
    radarPlay = true,
    tracked = [],
    trackedDone = false,
    airQualityStns = [],
    activeEvacuations = null,
    evacsLoaded = false,
    controlsAtBottom = null,
    premFeature = '<i class="fas fa-lock" style="color:#a1d5e9" title="Subscribe to Map of Fire to gain access to this feature"></i>',
    tileConfig = [
        {
            id: 'outdoors',
            name: 'MAPO Outdoors',
            imgs: 'mapo_outdoors',
            permissions: []
        },
        {
            id: 'satellite',
            name: 'Satellite',
            imgs: 'satellite',
            permissions: []
        },
        {
            id: 'fs16',
            name: 'USFS 2016',
            imgs: 'fs_topo',
            permissions: ['PRO']
        },
        {
            id: 'dark',
            name: 'Dark',
            imgs: 'dark',
            permissions: []
        },
        {
            id: 'osm',
            name: 'OpenStreetMap',
            imgs: 'osm',
            permissions: []
        },
        {
            id: 'topofire',
            name: 'Topofire',
            imgs: 'topofire',
            permissions: ['PRO']
        },
        {
            id: 'terrain',
            name: 'Terrain',
            imgs: 'terrain',
            permissions: ['PREMIUM', 'PRO']
        },
        {
            id: 'voyager',
            name: 'Carto Voyager',
            imgs: 'voyager',
            permissions: ['PREMIUM', 'PRO']
        }
    ],
    icons = ['', 'out', 'big', 'controlled', 'contained', 'large', 'complex', 'new', 'new-big', 'rx', 'smoke'];

Object.freeze(config.PERMISSION_LEVELS);

config.tiles = {
    //outdoors: 'https://api.maptiler.com/maps/0198ce67-b3a9-7754-9811-60e2bf25e13a/style.json?key=ZeQEIVoqyieC6wk8qxJH',
    outdoors: config.host + 'data/maps/terrain.json',
    //outdoors: 'https://tiles.openfreemap.org/styles/liberty',
    satellite: config.host + 'data/maps/satellite.json',
    osm: osm,
    //fs16: fs16,
    fs16: config.host + 'data/maps/usfs.json',
    caltopo: caltopo,
    terrain: terrain,
    topofire: topofire,
    voyager: config.host + 'data/maps/voyager.json',
    dark: config.host + 'data/maps/dark.json'
    //dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

async function api(uri, fields = null, v2 = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu'),
        isInternal = url.includes(config.apiURL) || url.includes(config.apiURL.replace('v1', 'v2')) || url.includes(config.host),
        ops = {
            method: isExternal ? 'GET' : 'POST'
        },
        fd = new FormData();

    if (isInternal) fd.append('key', config.apiKey());

    if (fields && Array.isArray(fields)) {
        for (const [k, v] of fields) {
            fd.append(k, v);
        }
    }

    if (!isExternal) ops['body'] = fd;

    try {
        const resp = await fetch(url, ops);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`HTTP error! Status: ${resp.status}, URL: ${url}, Response: ${errorText}`);

            return null;
        }

        // Attempt to parse JSON
        result = await resp.json();
    } catch (e) {
        console.error(`Fetch or JSON parsing error for URL: ${url}`, e.message);
        result = null
    }

    return result;
}

function gmtime(s) {
    const d = new Date(Date.now() + s * 1000),
        pad = (n) => n.toString().padStart(2, '0'),
        year = d.getUTCFullYear(),
        month = pad(d.getUTCMonth() + 1),
        day = pad(d.getUTCDate()),
        hours = pad(d.getUTCHours());

    return `${year}-${month}-${day}T${hours}:00:00`;
}

function sfpTimes() {
    return Array.from({ length: 7 }, (_, z) => {
        const t = new Date();
        t.setDate(t.getDate() + z);

        const y = t.getFullYear(),
            m = String(t.getMonth() + 1).padStart(2, '0'),
            d = String(t.getDate()).padStart(2, '0'),
            dayLabel = z === 0 ? ' (Today)' : (z === 1 ? ' (Tomorrow)' : '');

        return {
            key: `${y}-${m}-${d}T00:00:00.0Z`,
            value: `${config.days[t.getDay()]}, ${config.months[t.getMonth()]} ${t.getDate()}${dayLabel}`
        };
    });
}

function getbbox() {
    var b = map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast();

    return (b ? JSON.stringify({
        xmin: ne.lng,
        ymin: sw.lat,
        xmax: sw.lng,
        ymax: ne.lat,
        spatialReference: {
            wkid: 4326
        }
    }) : false);
}

class UTM {
    constructor() {
        this.a = 6378137;         // WGS84 Major Axis
        this.f = 1 / 298.257223563; // Flattening
        this.k0 = 0.9996;        // Scale factor
        this.e2 = 2 * this.f - Math.pow(this.f, 2); // Eccentricity squared (e^2)
        this.e2prime = this.e2 / (1 - this.e2);      // e'2
    }

    toUTM(lat, lon) {
        const letters = 'CDEFGHJKLMNPQRSTUVWXX',
            latRad = conversion.deg2rad(lat),
            lonRad = conversion.deg2rad(lon);

        let zone = Math.floor((lon + 180) / 6) + 1;
        // Handle Svalbard/Norway exceptions
        if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
        if (lat >= 72 && lat < 84) {
            if (lon >= 0 && lon < 9) zone = 31;
            else if (lon >= 9 && lon < 21) zone = 33;
            else if (lon >= 21 && lon < 33) zone = 35;
            else if (lon >= 33 && lon < 42) zone = 37;
        }

        const lonOriginRad = conversion.deg2rad((zone - 1) * 6 - 180 + 3);

        const N = this.a / Math.sqrt(1 - this.e2 * Math.pow(Math.sin(latRad), 2)),
            T = Math.pow(Math.tan(latRad), 2),
            C = this.e2prime * Math.pow(Math.cos(latRad), 2),
            A = Math.cos(latRad) * (lonRad - lonOriginRad);

        const M = this.a * (
            (1 - this.e2 / 4 - 3 * Math.pow(this.e2, 2) / 64 - 5 * Math.pow(this.e2, 3) / 256) * latRad -
            (3 * this.e2 / 8 + 3 * Math.pow(this.e2, 2) / 32 + 45 * Math.pow(this.e2, 3) / 1024) * Math.sin(2 * latRad) +
            (15 * Math.pow(this.e2, 2) / 256 + 45 * Math.pow(this.e2, 3) / 1024) * Math.sin(4 * latRad) -
            (35 * Math.pow(this.e2, 3) / 3072) * Math.sin(6 * latRad)
        );

        let easting = this.k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + Math.pow(T, 2) + 72 * C - 58 * this.e2prime) * Math.pow(A, 5) / 120) + 500000,
            northing = this.k0 * (M + N * Math.tan(latRad) * (Math.pow(A, 2) / 2 + (5 - T + 9 * C + 4 * Math.pow(C, 2)) * Math.pow(A, 4) / 24 + (61 - 58 * T + Math.pow(T, 2) + 600 * C - 330 * this.e2prime) * Math.pow(A, 6) / 720));

        if (lat < 0) northing += 10000000;

        return `${zone}${letters[Math.floor((lat + 80) / 8)] || 'X'} ${easting.toFixed(1)}E ${northing.toFixed(1)}N`;
    }
}

class Convert {
    coords(a, b) {
        if (!settings.get().coordsDisplay() || settings.get().coordsDisplay() == 'dec') {
            return parseFloat(a).toFixed(4) + ',&nbsp;' + parseFloat(b).toFixed(4);
        } else if (settings.get().coordsDisplay() == 'dms') {
            return this.convertToDms(a, false) + ',&nbsp;' + this.convertToDms(b, true);
        } else if (settings.get().coordsDisplay() == 'utm') {
            return this.utm(a, b);
        }
    }

    utm(a, b) {
        const lat = parseFloat(a),
            lon = parseFloat(b);

        return new UTM().toUTM(lat, lon);
    }

    convertToDms(dd, isLng) {
        var dir = dd < 0 ? isLng ? 'W' : 'S' : isLng ? 'E' : 'N';

        var absDd = Math.abs(dd),
            deg = absDd | 0,
            frac = absDd - deg,
            min = (frac * 60) | 0,
            sec = Math.round((frac * 3600 - min * 60) * 100) / 100;

        return deg + "&deg; " + min + "' " + sec + '" ' + dir;
    }

    rad2deg(r) {
        return r / (Math.PI * 180);
    }

    deg2rad(d) {
        return d * (Math.PI / 180);
    }

    speed(spd, u) {
        if (!spd) return;
        const v = parseFloat(spd);

        if (u == 'km/h') {
            return Math.round(v * 1.609);
        } else {
            return (u == 'mph' ? v : Math.round(v / (u == 'm/s' ? 2.237 : (u == 'kts' ? 1.151 : 1))));
        }
    }

    sizeUnit(customUnit = null) {
        return customUnit != null ? customUnit : (settings.get().acres() ? settings.get().acres() : 'acres');
    }

    sizeFormat(size, returnSize = true, returnUnit = true, customUnit = null) {
        let displayUnit = 'acre';
        const unit = this.sizeUnit(customUnit);

        if (size.toString().toLowerCase() === 'unknown' || size.toString() == '') {
            return returnSize ? '0' : (returnUnit ? unit : '');
        } else if (size !== null && size !== '') {
            let v = parseFloat(size);

            switch (unit) {
                case 'hectares':
                    v /= 2.471;
                    displayUnit = 'hectare';
                    break;
                case 'sqmi':
                    v /= 640;
                    displayUnit = 'square mile';
                    break;
                case 'sqkm':
                    v /= 247.1;
                    displayUnit = 'square km.';
                    break;
            }

            if ((unit === 'acre' || unit === 'hectares') && v > 100000) {
                v = Math.floor(v);
            } else if ((unit === 'sqmi' || unit === 'sqkm') && v > 100000) {
                v = Math.floor(v * 10) / 10;
            }

            const formattedSize = v.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: (unit === 'acre' || unit === 'hectares') && v > 100000 ? 0 : 2,
            });

            // Use the original number 'v' to check for pluralization
            const isOne = (v >= 0.995 && v < 1.005);
            const unitPlural = (isOne || unit === 'sqkm') ? displayUnit : displayUnit + 's';

            return (returnSize ? formattedSize : '') + (returnUnit ? ` ${unitPlural}` : '');
        } else {
            return '';
        }
    }

    heatIndex(t, rh) {
        var hi;

        if (t > 80) {
            hi = -42.379 + (2.04901523 * t) + (10.14333127 * rh) - (0.22475541 * t * rh) - (0.00683783 * Math.pow(t, 2)) -
                (0.05481717 * Math.pow(rh, 2)) + (0.00122874 * Math.pow(t, 2) * rh) + (0.00085282 * t * Math.pow(rh, 2)) -
                (0.00000199 * Math.pow(t, 2) * Math.pow(rh, 2));

            if (rh < 13 && (t > 80 && t < 112)) {
                hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
            } else if (rh > 85 && (t > 80 && t < 87)) {
                hi += ((rh - 85) / 10) * ((87 - t) / 5);
            }
        } else {
            hi = 0.5 * (t + 61 + ((t - 68) * 1.2) + (rh * 0.094));
        }

        return Math.round(hi);
    }

    windChill(t, w) {
        if (t >= 60 || !w) return null;

        return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(w, 0.16)) + (0.4275 * t * Math.pow(w, 0.16)));
    }

    wetBulb(it, hum) {
        if (it == null || hum == null) return null;

        const t = this.FtoC(it),
            rh = Number(hum),
            wetC = t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
                Math.atan(t + rh) -
                Math.atan(rh - 1.676331) +
                0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
                4.686035;

        return Number(settings.weather()?.temp() == 'f' ? this.CtoF(wetC) : wetC);
    }

    FtoC(t) {
        return Number((t - 32) * 5 / 9);
    }

    CtoF(t) {
        return Number((t * 1.8) + 32);
    }

    distance(lat1, lon1, lat2, lon2, metric = false) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            km = R * c,
            dist = metric ? km : km / 1.60934;

        return dist;
    }

    getCompassDirection(bearing) {
        const dir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return dir[Math.round(bearing / 22.5) % 16];
    }

    async getRasterColor(coords, layerId) {
        if (!map.getLayer(layerId)) return null;

        const source = map.getSource(map.getLayer(layerId).source),
            z = Math.floor(map.getZoom()),
            tileX = Math.floor((coords.lng + 180) / 360 * Math.pow(2, z)),
            tileY = Math.floor((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z)),
            getBBox = (tx, ty, z) => {
                const s = 20037508.34 * 2;
                const res = s / Math.pow(2, z);
                const minX = -20037508.34 + tx * res;
                const maxY = 20037508.34 - ty * res;
                return `${minX},${maxY - res},${minX + res},${maxY}`;
            };

        const url = source.tiles[0].replace('{bbox-epsg-3857}', getBBox(tileX, tileY, z)),
            img = new Image();

        img.crossOrigin = "Anonymous";
        await new Promise(res => { img.onload = res; img.src = url; });

        const canvas = new OffscreenCanvas(1, 1),
            ctx = canvas.getContext('2d'),
            px = Math.floor(((coords.lng + 180) / 360 * Math.pow(2, z) % 1) * 256),
            py = Math.floor(((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z) % 1) * 256);

        ctx.drawImage(img, px, py, 1, 1, 0, 0, 1, 1);

        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
}

class ClickListener {
    constructor(target, sr) {
        this.target = target;
        this.sr = sr;
    }

    android() {
        sessionStorage.setItem('recommend_google_play', 1);
        document.querySelector('.android-banner').remove();
    }

    tools() {
        config.toolsInstance.clickListener(this.target);
    }

    myContent() {
        config.toolsInstance.myContent();
    }

    async mcta() {
        (await loadUtils()).marketing(true, this.target.dataset.utm);
    }

    async copy() {
        await navigator.clipboard.writeText(this.target.innerText);
        (await loadUtils()).notify('info', 'Coordinates copied to clipboard');
    }

    closeDataForm() {
        const r = document.querySelector('li#report'),
            fw = document.querySelector('li#fwf');

        document.querySelector('#data-form')?.remove();
        document.querySelector('.shadow')?.remove();

        if (r?.dataset.active === '1') r.removeAttribute('data-active');
        if (fw.dataset.active === '1') fw.removeAttribute('data-active');
    }

    closeArchive() {
        window.location.href = window.location.href.replace(/archive\/([0-9]+)/g, '');
    }

    async clearSearch() {
        const q = document.querySelector('#q');
        if (!q) return;

        q.value = '';
        document.querySelector('#clearSearch')?.style.setProperty('display', 'none');
        new (await loadUtils()).Search('').do();
        q.focus();
    }

    clearLayerSearch() {
        document.querySelectorAll('.layers-list li.layer').forEach(layer => layer.style.display = 'flex');
        impact.querySelector('#layerSearch').setProperty('value', '');
    }

    closeImpact() {
        if (map.getSource('user-features')) {
            map.removeSource('user-features');
            map.removeLayer('user-features-markers');
        }

        impact.removeAttribute('data-display');
        impact.style.display = 'none';
        impact.innerHTML = '';
    }

    openModal(aClass) {
        if (modal.hasAttribute('open')) return;

        modal.className = aClass || '';
        modal.querySelector('.content').innerHTML = '<div class="loading"><div class="s"></div></div>';

        const onTransitionEnd = (e) => {
            if (e.propertyName === 'top') {
                modal.removeEventListener('transitionend', onTransitionEnd);

                const event = new CustomEvent('modalOpened', { detail: { top: openPosition } });
                modal.dispatchEvent(event);
            }
        };

        const handle = modal.querySelector('.close'),
            viewportHeight = window.innerHeight,
            openPosition = viewportHeight * 0.3,    // 30 vh from top
            minTop = viewportHeight * 0.1,       // 10vh
            closedPosition = viewportHeight,     // 100%
            snapVelocity = 0.25,                 // px/ms
            throwStartThreshold = viewportHeight * 0.9; // only throw if near bottom

        let isDragging = false, startY = 0, startTop = 0, lastY = 0, lastTime = 0;

        modal.onModalChanged = function (callback, { once = true } = {}) {
            if (!this) return;

            const observer = new MutationObserver((mutations, obs) => {
                if (once) obs.disconnect();

                requestAnimationFrame(() => {
                    try {
                        callback();
                    } catch (err) {
                        console.error('onModalChanged error', err);
                    }
                });
            });

            observer.observe(this, {
                childList: true,
                subtree: true,
                characterData: true
            });

            return observer;
        };

        modal.onModalChanged(() => {
            const content = modal.querySelector('.content');

            requestAnimationFrame(() => {
                if (content.scrollHeight > content.clientHeight) {
                    content.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
        modal.setAttribute('open', '');
        modal.style.top = `${closedPosition}px`;
        modal.style.transition = 'top 0.85s ease';

        // add event listener for when modal has finished opening
        modal.addEventListener('transitionend', onTransitionEnd);

        requestAnimationFrame(() => {
            modal.style.top = `${openPosition}px`;
        });

        if (handle) {
            handle.addEventListener('dblclick', () => {
                this.closeModal();
            });

            handle.addEventListener('pointerdown', (e) => {
                isDragging = true;
                startY = e.clientY;
                startTop = parseFloat(modal.style.top) || openPosition;
                lastY = startY;
                lastTime = performance.now();
                modal.style.transition = '';
                handle.setPointerCapture(e.pointerId);
            });

            handle.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                let deltaY = e.clientY - startY;
                let newTop = startTop + deltaY;

                newTop = Math.max(minTop, Math.min(closedPosition, newTop));
                modal.style.top = `${newTop}px`;

                lastY = e.clientY;
                lastTime = performance.now();
            });

            handle.addEventListener('pointerup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                handle.releasePointerCapture(e.pointerId);

                const currentTop = parseFloat(modal.style.top);
                const deltaY = e.clientY - startY;
                const deltaTime = performance.now() - lastTime;
                const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;

                modal.style.transition = 'top 0.2s ease';

                // 1. Fast downward flick AND dragged past threshold → close
                if (velocity > snapVelocity && currentTop > throwStartThreshold) {
                    modal.style.top = `${closedPosition}px`;
                    setTimeout(() => { this.closeModal(); }, 200);
                    return;
                }

                if (velocity < -snapVelocity) {
                    modal.style.top = `${minTop}px`;
                    return;
                }

                if (currentTop > viewportHeight * 0.7) {
                    modal.style.top = `${closedPosition}px`;
                    setTimeout(() => { this.closeModal(); }, 200);
                } else if (currentTop < viewportHeight * 0.3) {
                    modal.style.top = `${minTop}px`;
                } else {
                    modal.style.top = `${openPosition}px`;
                }

                setTimeout(() => (modal.style.transition = ''), 200);
            });
        }
    }

    closeModal() {
        modal.style.top = '100%';
        setTimeout(() => {
            modal.removeAttribute('open');
            modal.className = '';
            modal.innerHTML = '<div class="close" data-action="close-modal"><div class="handle"></div></div><div class="content"></div>';
        }, 200);

        unsetHeaders();
    }

    closePopup() {
        if (marker) marker.remove();
        if (!settings.isEnabled('stns') && map.getSource('stns')) {
            map.removeLayer('stns');
            map.removeLayer('stns_text');
            map.removeSource('stns');
        }

        document.querySelector('.popup')?.remove();

        unsetHeaders();

        ['caperim', 'ausperim', 'perim', 'evac', 'nri', 'erc'].forEach(key => {
            const source = key === 'caperim' ? 'ca_perimeters' : (key === 'ausperim' ? 'aus_perimeters' : key);
            if (selected[key] && map.getSource(source)) {
                map.removeFeatureState({ source, id: selected[key] });
            }
        });
    }

    closeNavbar() {
        if (!this.target) return;
        const nav = document.querySelector('nav'),
            isOpen = this.target.dataset.open === 'true',
            left = 'fa-chevron-left',
            right = 'fa-chevron-right';

        this.target.dataset.open = (!isOpen).toString();
        this.target.classList.replace(isOpen ? left : right, isOpen ? right : left);

        document.documentElement.style.setProperty('--nav-width', isOpen ? '40px' : '89px');
        nav?.classList.toggle('hide', isOpen);
    }

    newFire() {
        const dataset = this.target?.closest('li')?.dataset;
        if (!dataset) return;

        this.closeDataForm();

        map.easeTo({
            center: [dataset.lon, dataset.lat],
            zoom: 12,
            duration: 0
        });
    }

    sharer() {
        if (!navigator.share) return;

        navigator.share({
            title: (this.target.getAttribute('title') ? this.target.getAttribute('title') : document.title),
            text: "",
            url: (this.target.dataset.href ? this.target.dataset.href.split('#')[0] : window.location.href.split('#')[0])
        }).catch(console.error);
    }

    createLayers() {
        const zoom = map.getZoom();
        let content = '<div class="content"><div class="dark-input"><input type="text" id="layerSearch" placeholder="Filter through layers..."><i data-action="clear-layer-search" class="fat fa-xmark clearSearch"></i></div>';

        // Loop through layer categories
        Object.entries(layers.categories).forEach(([categoryId, categoryTitle]) => {
            content += `<div class="group"><h3 class="group-title">${categoryTitle}</h3><ul class="layers-list">`;

            // Loop through layers in each category
            layers.layers[categoryId].filter(lay => !lay.testing || (lay.testing && debugMode)).forEach(layer => {
                content += `<li class="layer${layer.minZoom && layer.minZoom > zoom ? ' more-zoom' : ''}"${layer.minZoom ? ' data-min-zoom="' + layer.minZoom + '"' : ''} data-p="${layer.perms}" data-id="${layer.id}" title="${layer.minZoom && layer.minZoom > zoom ? 'You must be zoomed in more' : layer.name}">
                    <div class="checkbox">
                        <input type="checkbox" id="${layer.id}" class="layChkBx" data-action="toggle-layer">
                    </div>
                    <div class="desc">
                        <label for="${layer.id}">${layer.name}</label>
                        <span>${layer.desc}</span>
                        ${this.layerExtras(layer)}
                    </div>
                </li>`;
            });

            content += '</ul></div>';
        });

        content += '</div>';
        config.layersMenu = content;
    }

    // show/open layers menu
    showLayers() {
        const scrollPosition = localStorage.getItem('mapofire.impactScroll');

        if (config.layersMenu == null) this.createLayers();

        impact.innerHTML = impactHeader + config.layersMenu;
        impact.querySelector('#a').innerHTML = 'Layers';

        config.listOfLayers.filter(lay => !lay.testing || (lay.testing && debugMode)).forEach(layer => {
            const hasPermissions = settings.hasPermissions(layer.perms),
                isChecked = (layer.default && !settings.checkboxes()) || (settings.checkboxes() && settings.isEnabled(layer.id)),
                item = impact.querySelector('li.layer[data-id="' + layer.id + '"]'),
                filter = item.querySelector('.data-filter'),
                box = item.querySelector('.checkbox');

            if (box) box.querySelector('input[type=checkbox]').checked = isChecked;

            if (layer.minZoom) {
                if (map.getZoom() >= item.dataset.minZoom) {
                    item.classList.remove('more-zoom');
                    item.setAttribute('title', String(item.querySelector('label').innerHTML));
                } else {
                    item.classList.add('more-zoom');
                    item.setAttribute('title', 'You must be zoomed in more');
                }
            }

            if (!hasPermissions) {
                item.classList.add('locked');

                if (filter) filter.style.display = 'none';

                box.innerHTML = premFeature;
                item.addEventListener('click', () => {
                    notify('info', `This is a ${layer.perms.includes('PREMIUM') ? 'premium' : 'pro'} layer. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="layers_snackbar">Get access</a>`, 4);
                });
            } else {
                if (filter) {
                    const adjust = {
                        spc: [{
                            q: 'otlkType',
                            v: settings.special().otlkType()
                        }, {
                            q: 'otlkDay',
                            v: settings.special().otlkDay()
                        }],
                        erc: [{
                            q: 'erc_time',
                            v: settings.special().erc()
                        }],
                        sfp: [{
                            q: 'sfpDateSelect',
                            v: settings.special().sfpDate()
                        }],
                        ndfd: [{
                            q: 'forecastModel',
                            v: settings.special().forecastModel()
                        }/*, {
                            q: 'fcstTime',
                            v: settings.special().fcstTime()
                        }*/]
                    };

                    if (isChecked) filter.querySelectorAll('select').forEach(select => select.disabled = false);

                    const filterLayer = adjust[layer.id];

                    if (filterLayer) {
                        for (let i = 0; i < filterLayer.length; i++) {
                            const s = filter.querySelector(`#${filterLayer[i].q}`);
                            s.value = filterLayer[i].v;

                            if (!s.value) s.selectedIndex = 1;
                        }
                    }
                }
            }
        });

        impact.setAttribute('data-display', 'layers');
        impact.style.display = 'flex';

        if (scrollPosition !== null && scrollPosition !== '0') impact.scrollTop = scrollPosition;
    }

    // creates dropdowns for some layers
    layerExtras(l) {
        const spec = settings.special?.() || {},
            icon = (cls) => `<i class="${cls}" style="color:#9caab3"></i>`,
            wrap = (id, content) => `<div class="data-filter" id="${id}">${icon('far fa-filter-list')}<div>${content}</div></div>`,
            sel = (val, target) => val === target ? 'selected' : '',
            smokeOptions = () => Array.from({ length: 15 }, (_, i) => {
                const timeVal = gmtime(++i * 3600),
                    date = new Date(timeVal + '+00:00'),
                    hrs = date.getHours(),
                    isMid = hrs === 0,
                    day = date.getDate() === config.curTime.getDate() + 1 ? 'Tomorrow' : 'Today',
                    label = isMid ? 'Midnight' : `${day} at ${hrs % 12 || 12} ${hrs >= 12 ? 'PM' : 'AM'}`;

                return `<option value="${timeVal}">${label}</option>`;
            }).join('');

        const filters = {
            perimeters: () => {
                const size = settings.perimeters().minSize();

                return `<div class="data-filter" id="perimeterSize" data-action="change-perim-size">
                    ${icon('fad fa-filters')}
                    <input type="range" class="slider" min="0" max="1000" step="25" value="${size}">
                    <div id="pSize" style="width:69.11px">${size} acres</div>
                </div>`;
            },

            ndfd: () => {
                const model = spec.forecastModel || 'air_temperature',
                    opts = [
                        ['air_temperature', 'Temperature'],
                        ['relative_humidity', 'Humidity'],
                        ['wind_speed', 'Wind Speed'],
                        ['total_sky_cover', 'Cloud Cover'],
                        ['12hr_precipitation_probability', '12-hr POPs']
                    ].map(([v, n]) => `<option ${sel(v, model)} value="${v}">${n}</option>`).join('');

                return wrap('models', `<select id="forecastModel" data-action="ndfd" style="min-width:170px" disabled>${opts}</select>
                <select id="fcstTime" data-action="ndfd" data-type="reg" style="min-width:100px;max-width:35%" disabled>${initNDFDTimes().join('')}</select>`);
            },

            sfp: () => wrap('sfpDate', `<select id="sfpDateSelect" data-action="sfp-date" disabled>
                ${sfpTimes().map(i => `<option value="${i.key}">${i.value}</option>`).join('')}</select>`
            ),

            spc: () => {
                const type = spec.otlkType?.() || 'fire', day = spec.otlkDay?.() || 1;

                return wrap('otlks', `<select id="otlkType" data-action="spc-outlook" style="min-width:170px" disabled>
                    <option ${sel('fire', type)} value="fire">Fire Weather</option>
                    <option ${sel('severe', type)} value="severe">Severe/Convective</option></select>
                    <select id="otlkDay" data-action="spc-outlook" style="min-width:100px" disabled>
                    <option ${sel(1, day)} value="1">Day 1</option><option ${sel(2, day)} value="2">Day 2</option>
                    ${type !== 'fire' ? `<option ${sel(3, day)} value="3">Day 3</option>` : ''}</select>`
                );
            },

            erc: () => wrap('ercs', `<select id="erc_time" data-action="erc_time" style="min-width:197px" disabled>
                <option ${sel('obs', spec.erc?.())} value="obs">Observed (Today)</option>
                <option ${sel('fcst', spec.erc?.())} value="fcst">Forecasted (Tomorrow)</option></select>`
            ),

            viSmoke: () => wrap('viSmokes', `<select id="vi_smoke_time" data-action="vi_smoke_time" style="min-width:160px" disabled>${smokeOptions()}</select>`),

            sfcSmoke: () => wrap('sfcSmokes', `<select id="sfc_smoke_time" data-action="sfc_smoke_time" style="min-width:160px" disabled>${smokeOptions()}</select>`)
        };

        return filters[l.id]?.() || '';
    }

    basemaps() {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        const basemapListUl = document.createElement('ul');
        basemapListUl.className = 'layers-list bm';

        tileConfig.forEach(tile => {
            const hasPerms = settings.hasPermissions(tile.permissions),
                isChecked = tile.id === settings.getBasemap(),
                listItem = document.createElement('li'),
                radioDiv = document.createElement('div'),
                descDiv = document.createElement('div');

            // Create the list item for the basemap
            listItem.dataset.tile = tile.id;

            // Create the radio and description containers
            radioDiv.className = 'radio';
            descDiv.className = 'desc';

            // Add the radio button or premium feature
            if (hasPerms) {
                const radioInput = document.createElement('input');
                Object.assign(radioInput, {
                    type: 'radio',
                    className: 'basemap-option',
                    name: 'bsmo',
                    checked: isChecked
                });
                radioInput.setAttribute('data-action', 'change-basemap');
                radioInput.setAttribute('data-tile', tile.id);
                radioDiv.appendChild(radioInput);
            } else {
                radioDiv.innerHTML = premFeature;

                radioDiv.addEventListener('click', () => {
                    const tier = tile.permissions.includes('PREMIUM') ? 'premium' : 'pro';
                    notify('info', `This is a ${tier} basemap. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="basemaps_snackbar">Get access</a>`, 4);
                });
            }

            // Add the icon and label
            const img = document.createElement('img');
            img.src = `${config.domain}assets/images/icons/fire/basemaps/${tile.imgs}.png`;
            if (!hasPerms) img.style.opacity = '0.5';

            const label = document.createElement('label');
            label.innerHTML = tile.name + (tile.permissions.length ? '<p>' + tile.permissions[0] + '</p>' : '');

            // Assemble the list item
            descDiv.appendChild(img);
            descDiv.appendChild(label);
            listItem.appendChild(radioDiv);
            listItem.appendChild(descDiv);
            basemapListUl.appendChild(listItem);
        });

        // Update the DOM in a single, efficient operation
        impact.innerHTML = impactHeader;
        contentDiv.appendChild(basemapListUl);
        impact.appendChild(contentDiv);
        impact.style.display = 'flex';
        impact.querySelector('#a').innerHTML = 'Basemaps';

        // Use event delegation on the parent element
        basemapListUl.addEventListener('click', e => {
            const listItem = e.target.closest('li');
            if (!listItem) return;

            const radio = listItem.querySelector('input.basemap-option');
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    acctSettings() {
        let content = '';
        const settings = [
            {
                t: 'Save Frequency',
                i: 'saveFreq',
                o: { 60000: '1 min', 300000: '5 mins', 600000: '10 mins', 900000: '15 mins', 1800000: '30 mins' }
            },
            {
                t: 'Perimeter Color',
                i: 'perimColor',
                o: { 'default': 'Default', 'red': 'Red', 'blue': 'Blue', 'orange': 'Orange', 'green': 'Green', 'purple': 'Purple', 'brown': 'Brown', 'black': 'Black' }
            },
            {
                t: 'Perimeter Tooltip',
                i: 'perimTtip',
                o: { 1: 'Yes', 0: 'No' }
            },
            {
                t: 'Perimeter Zoom',
                i: 'perimZoom',
                o: { 1: 'Yes', 0: 'No' }
            },
            {
                t: 'Coordinates',
                i: 'coordsDisplay',
                o: { 'dec': 'Decimal', 'dms': 'Degs, Mins, Secs', 'utm': 'UTM' }
            },
            {
                t: 'Temperature Unit',
                i: 'tempUnit',
                o: { 'f': '&deg;F', 'c': '&deg;C' }
            },
            {
                t: 'Wind Speed Unit',
                i: 'windUnit',
                o: { 'mph': 'mph', 'm/s': 'm/s', 'kts': 'kts', 'km/h': 'km/h' }
            },
            {
                t: 'Fire Size Unit',
                i: 'acresUnit',
                o: { 'acres': 'acres', 'hectares': 'hectares', 'sqmi': 'sq. mi.', 'sqkm': 'sq. km.' }
            },
            {
                t: 'Cache Fire Data',
                i: 'locallySave',
                o: { 'y': 'Yes', 'n': 'No' }
            }
        ];

        settings.forEach(setting => {
            const options = Object.entries(setting.o)
                .map(([val, label]) => `<option value="${val}">${label}</option>`)
                .join('');
            content += `<div class="r"><div class="var">${setting.t}</div><div class="input"><select id="${setting.i}" data-action="user-setting">${options}</select></div></div>`;
        });

        return content;
    }

    async account() {
        if (!settings.user) {
            const guid = document.cookie.split('; ').find(row => row.startsWith('guid='))?.split('=')[1] || null,
                url = config.domain.replace('www', 'auth') + 'login?service=' + getPlatform() + '&next=' + encodeURIComponent(window.location.href) + (guid ? '&guid=' + guid : '');
            ////console.log(url);
            window.location.href = url;
            return;
        }

        let ms = '';
        const userProfile = `<div class="content">
            <div id="sync">
                <i class="fa-regular fa-arrow-down-to-line" aria-hidden="true"></i>
                <span title="${dateTime(settings.getUser().synced(), true, true, true).toString()}">Account last synced ${timeAgo(settings.user.settings.synced)}</span>
            </div>
            <div class="btn-group centered">
                <a target="blank" class="btn btn-blue" style="width:100%" href="${config.domain}account/settings">Manage account</a>
            </div>
            <div id="settings">
                <div class="my-subs">
                    <h2 style="margin:0">My Subscriptions</h2>
                    <div id="subs"></div>
                </div>
                <h2>Map Settings</h2>
                ${this.acctSettings()}
                <div style="margin-top:5em;font-size:12px;text-align:center;color:var(--blue-gray);line-height:1.3">
                    &copy; ${new Date().getFullYear()} ${config.company}<br>Version ${version}<br>
                    <a class="footer-link" href="${config.specificURL}logout?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}">Logout</a>&nbsp;&middot;&nbsp;
                    <a class="footer-link" href="${config.host}release-notes" target="blank">Change Log</a>&nbsp;&middot;&nbsp;
                    <a class="footer-link" href="${config.domain}about/legal/terms" target="blank">Terms</a>&nbsp;&middot;&nbsp;
                    <a class="footer-link" href="${config.domain}about/legal/privacy" target="blank">Privacy</a>
                </div>
            </div>
        </div>`;

        impact.innerHTML = impactHeader + userProfile;
        impact.style.display = 'flex';
        impact.querySelector('#a').innerHTML = 'Hello, ' + settings.getUser().getName().first();

        const prefs = {
            'saveFreq': settings.get().saveFreq(),
            'perimColor': settings.perimeters().color() ?? 'default',
            'perimTtip': settings.perimeters().ttip() ?? 1,
            'perimZoom': settings.perimeters().zoom() ? 1 : 0,
            'coordsDisplay': settings.get().coordsDisplay() ?? 'dec',
            'tempUnit': settings.weather().temp() ?? 'f',
            'windSpeedUnit': settings.weather().wind() ?? 'mph',
            'acresUnit': settings.get().acres() ?? 'acres',
            'locallySave': settings.get().locallySave() ?? 'n'
        };

        Object.entries(prefs).forEach(([id, val]) => {
            const el = document.querySelector(`select#${id}`);
            if (el) el.value = val;
        });

        if (!settings.subscriptions().valid()) {
            ms = '<p style="color:#bdbdbd;font-size:15px">You don\'t have a subscription to Map of Fire. <a class="btn btn-green" style="width:100%;margin:1em 0 0 0" href="' + (await loadUtils()).purchaseLink('account', encodeURIComponent(window.location.href)) + '">Try it out!</a>';
        } else {
            let theEnd = 'Your subscription will automatically renew';

            if (settings.subscriptions().isTrial()) {
                theEnd = 'Your free trial ends ';
            }

            ms = `<div style="display:inline-flex;width:100%;justify-content:space-between;gap:1em">
                <div style="display:inline-flex;flex-direction:column;gap:0.45em">
                    <span>${settings.subscriptions().name()}</span>
                    <small style="line-height:1.1;color:#999">${theEnd} on ${settings.subscriptions().expires()}.</small>
                </div>
                <a class="btn btn-sm btn-black" style="margin:0;height:fit-content" target="blank" href="${config.domain}account/billing#cid=${settings.subscriptions().customerID()}">Manage</a>
            </div>`;
        }

        document.querySelector('#subs').innerHTML = ms;
    }

    radarPausePlay() {
        const c = document.querySelector('.radarControl');

        if (radarPlay) {
            clearInterval(radarAnim);
            c.classList.remove('fa-pause');
            c.classList.add('fa-play');
            c.title = 'Start radar';
            radarPlay = false;
        } else {
            let counter = document.querySelector('.radar input[type=range]').value,
                ra = () => {
                    radarImgs.forEach((e, n) => {
                        map.setLayoutProperty('radar-layer-' + n, 'visibility', (n == counter ? 'visible' : 'none'));
                        document.querySelector('.radar input[type=range]').value = counter;
                    });

                    if (counter == radarImgs.length - 1) {
                        counter = 0;
                        clearInterval(radarAnim);

                        setTimeout(() => {
                            radarAnim = setInterval(ra, RADAR_INT);
                        }, RADAR_INT);
                    } else {
                        counter++;
                    }
                };

            radarAnim = setInterval(ra, RADAR_INT);

            c.classList.add('fa-pause');
            c.classList.remove('fa-play');
            c.title = 'Pause radar';
            radarPlay = true;
        }
    }

    spcClimo() {
        if (this.target.classList.contains('disabled')) return;

        const select = document.querySelector('.spcTimeline #spcDates');
        let newIndex = select.selectedIndex;

        if (this.target.dataset.dir === 'back') newIndex -= 1;
        if (this.target.dataset.dir === 'next') newIndex += 1;

        newIndex = Math.max(0, Math.min(364, newIndex));

        config.layersHandler.spcClimo(newIndex, true, true);
    }

    async follow() {
        let id = parseInt(this.target.dataset.id),
            fire = config.wildfire.findFire(id),
            name = fire.properties.name.replace(' Fire', '') + (fire.properties.type != 'Smoke Check' ? ' Fire' : '');

        if (fire != null) {
            const isRemove = this.target.dataset.mode == 'unfollow' && tracked.includes(id),
                tf = document.querySelector('#trackFire');

            // remove, otherwise add
            const m = isRemove ? 'remove' : 'add';
            if (isRemove) tracked.splice(tracked.indexOf(id), 1); else tracked.push(id);

            if (m == 'add') {
                tf.setAttribute('data-mode', 'unfollow');
                tf.setAttribute('title', 'You\'re following this incident');
                tf.classList.add('btn-black');
                tf.classList.remove('btn-yellow');
                tf.innerHTML = '<i class="far fa-check"></i>Following this incident';
            } else {
                tf.setAttribute('data-mode', 'follow');
                tf.setAttribute('title', 'Start following this incident');
                tf.classList.remove('btn-black');
                tf.classList.add('btn-yellow');
                tf.innerHTML = '<i class="far fa-plus"></i>Follow this incident';
            }

            /* if user is logged in, save to account, otherwise store in local storage */
            if (settings.user) {
                await api(config.host + 'api/v1/trackFires/' + m, [['wfid', id]]);
            } else {
                localStorage.setItem('mapofire.tracked', JSON.stringify(tracked));
            }

            notify('success', (m == 'add' ? 'You\'re now following the ' : 'You\'re no longer following the ') + name + '.');
        }
    }

    async unfollow() {
        const id = this.target.dataset.wfid,
            name = this.target.dataset.name,
            myf = document.querySelector('ul.my-fires');

        this.target.parentElement.parentElement.remove();

        if (settings.user) {
            await api(config.host + 'api/v1/trackFires/remove', [['wfid', id]]);
        } else {
            const t = JSON.parse(localStorage.getItem('mapofire.tracked')),
                n = t.splice(t.indexOf(id), 1);

            localStorage.setItem('mapofire.tracked', JSON.stringify(n));
        }

        tracked.splice(tracked.indexOf(id), 1);

        if (myf.querySelectorAll('li').length == 0) myf.parentElement.innerHTML = noneTracked;

        notify('success', 'You\'re no longer following the ' + name + '.');
    }

    archive() {
        if (settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
            const yrs = Array.from({ length: config.curTime.getFullYear() - 2014 }, (_, idx) => {
                const year = config.curTime.getFullYear() - idx;
                return `<option ${year === config.curTime.getFullYear() ? 'disabled ' : ''}value="${year}">${year}</option>`;
            }).join('');

            new Popup('Historical Wildfires').create('<p style="font-size:14px;line-height:1.2">See historical wildfires by selecting a year in our archive.</p>' +
                '<select id="archive_years" data-action="archive_years" style="border:1px solid #cfcfcf;margin-top:1em"><option>- Choose a year -</option>' + yrs + '</select>' +
                '<div class="btn-group centered"><input type="button" class="btn btn-sm btn-gray" value="Cancel" onclick="this.parentElement.parentElement.parentElement.remove()"></div>');
        }
    }

    async legend() {
        const { legend } = await loadUtils();

        if (!legend || !legend.categories || !legend.items) return;

        let legCont = '';

        legend.categories.forEach(cat => {
            const key = Object.keys(cat)[0];
            legCont += `<div class="group"><h3 class="group-title">${cat[key]}</h3>`;

            const items = legend.items[key];
            if (items && items.length) {
                items.forEach(item => {
                    const icon = item[0] === 'icon' ? item[1] : `<div class="color" style="background-color:${item[2]}">${item[1] ?? ''}</div>`;

                    legCont += `<div class="row"><div class="ic">${icon}</div><div class="desc">${item[3] ?? ''}</div></div>`;
                });
            }

            legCont += '</div>';
        });

        impact.innerHTML = impactHeader + `<div class="content"><div class="legend">${legCont}</div></div>`;
        impact.setAttribute('data-display', 'legend');
        impact.style.display = 'flex';
        const aEl = impact.querySelector('#a');
        if (aEl) aEl.innerHTML = 'Legend';
    }

    async myfires() {
        impact.innerHTML = impactHeader + '<div class="content"><div id="spinner" class="centered"></div></div>';
        impact.style.display = 'flex';
        impact.querySelector('#a').innerHTML = 'My Fires';

        await new Promise(resolve => {
            const check = setInterval(() => {
                if (trackedDone) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });

        const content = impact.querySelector('.content'),
            myFires = tracked.map(id => config.wildfire.findFire(id)).filter(fire => fire != null);

        if (myFires.length === 0) {
            content.innerHTML = tracked.length > 0 ? '<div class="message error">The wildfires you were following are no longer available.</div>' : noneTracked;
            return;
        }

        // build the list of "my fires"
        const ul = document.createElement('ul');
        ul.className = 'my-fires';

        myFires.forEach(fire => {
            const { properties: p, geometry } = fire,
                name = p.name,
                size = conversion.sizeFormat(p.acres),
                fstat = p.status,
                st = p.time.year < config.curTime.getFullYear() ? 'out' : config.wildfire.getStatus(fstat, p.notes) || 'active',
                state = p.near/*,
                up = timeAgo(p.time.updated)*/;

            const li = document.createElement('li');
            li.id = 'my-fire-incident';
            li.dataset.coords = JSON.stringify(geometry.coordinates);

            li.innerHTML = `<div class="header">
                <h3>${name}</h3>
                <i class="fas fa-circle-check" data-action="my-fire-unfollow" title="Unfollow this incident" data-name="${name}" data-wfid="${p.wfid}"></i>
            </div>
            <span class="state">${state}</span>
            <div class="inf">
                <p style="color:#fff;font-size:18px">${size}</p>
                <span class="status ${st}">${st.toUpperCase()}</span>
            </div>`;

            ul.appendChild(li);
        });

        // Use event delegation for clicks
        ul.addEventListener('click', event => {
            const li = event.target.closest('li#my-fire-incident');
            if (!li) return;

            const coords = JSON.parse(li.dataset.coords);
            if (coords) map.flyTo({ center: coords, zoom: 11.5 });
        });

        // Replace spinner with list
        content.innerHTML = '';
        content.appendChild(ul);
    }

    searchResultClick() {
        const p = this.target.closest('li'),
            type = p.dataset.type;

        if (marker) marker.remove();

        if (!p.classList.contains('standby')) {
            const lat = p.dataset.lat,
                lon = p.dataset.lon;

            // zoom to a marker of a city location
            if (type == 'city') {
                const name = p.dataset.name.split(', ');

                marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(map);

                new Popup('City').create(`<p style="margin-bottom:6px;color:#fff">${name[0]}, ${p.dataset.county} County, ${name[1]}</p>
                    <span style="display:block;font-size:14px">${lat}, ${lon}</span>`);

                map.easeTo({
                    center: new maplibregl.LngLat(lon, lat),
                    zoom: 10
                });
            }
            // zoom to marker of a GIS feature (POI)
            else if (type == 'gis') {
                const name = p.dataset.name.split(', '),
                    county = p.dataset.county,
                    geoType = p.dataset.geotype;

                marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(map);

                new Popup(geoType).create(name[0] + ', ' + county + ' County, ' + name[1]);

                map.easeTo({
                    center: new maplibregl.LngLat(lon, lat),
                    zoom: 11.25
                });
            }
            // zoom to boundaries of a state or a county
            else if (type == 'state' || type == 'county') {
                const bbox = JSON.parse(p.dataset.bbox);

                map.fitBounds([
                    [bbox.x.min, bbox.y.min],
                    [bbox.x.max, bbox.y.max]
                ], {
                    padding: 50
                });
            }
            // zoom in on coordinates
            else if (type == 'coordinates') {
                marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(map);

                new Popup('Coordinates').create(`<p style="padding-bottom:8px;color:#fff">${lat},&nbsp;${lon}</p>
                    <span style="display:block;padding-bottom:4px;font-size:14px">${String(conversion.convertToDms(lat, false) + '&nbsp;' + conversion.convertToDms(lon, true)).replace(/\s/g, '')}</span>
                    <span style="display:block;font-size:14px">${conversion.utm(lat, lon)}</span>`);

                map.easeTo({
                    center: [lon, lat],
                    zoom: 10
                });
            }
            // zoom to a wildfire
            else {
                const wfid = parseInt(p.dataset.wfid);
                if (config.wildfire.findFire(wfid)) config.wildfire.incident(wfid, true);
            }
        }

        this.sr.innerHTML = '<li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third" aria-hidden="true"></i><span>Searching...</span></li>';
        this.sr.style.display = 'none';

        return this;
    }
}

function toggleLayer(e) {
    const { id: layerId, checked } = e,
        action = layerActions[layerId],
        getLayer = config.listOfLayers.find(layer => layer.id === layerId),
        layerPerms = getLayer ? getLayer.perms : false,
        executeToggle = (sourceId, action, checked) => {
            const visibility = checked ? 'visible' : 'none';

            if (sourceId == 'visSatellite') sourceId = 'satellite1';
            else if (sourceId == 'irSatellite') sourceId = 'satellite2';
            else if (sourceId == 'wvSatellite') sourceId = 'satellite3';

            if (map.getSource(sourceId)) {
                action.layers.forEach(id => map.setLayoutProperty(id, 'visibility', visibility));
            } else if (checked) {
                action.exe();
            }
        };

    if (!action || !settings.hasPermissions(layerPerms)) return;

    if (action.run) {
        action.run(checked);
    } else if (action.exe) {
        executeToggle(layerId, action, checked);
    } else {
        action.layers.forEach(id => map.setLayoutProperty(id, 'visibility', checked ? 'visible' : 'none'));
    }
}

async function getCounties() {
    const ArcGISFeatureSource = window[""]["arcgis-featureserver"];

    if (!map.getSource('us_counties')) {
        new ArcGISFeatureSource('us_counties', map, {
            url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized_Boundaries/FeatureServer/0',
            precision: 6,
            where: '1=1',
            outFields: 'NAME,STATE_ABBR AS STATE,FIPS,POPULATION,SQMI'
        });
    }

    if (!map.getLayer('us_counties')) {
        map.addLayer({
            id: 'us_counties',
            source: 'us_counties',
            type: 'fill',
            paint: {
                'fill-opacity': 0,
                'fill-color': '#fff'
            },
            layout: {
                visibility: 'visible'
            }
        });
    }

    if (!map.getLayer('county-boundaries')) {
        map.addLayer({
            id: 'county-boundaries',
            source: 'us_counties',
            type: 'line',
            minzoom: 6,
            paint: {
                'line-dasharray': [
                    'step',
                    ['zoom'],
                    ['literal', [2, 0]],
                    7,
                    ['literal', [3, 4]],
                    12,
                    ['literal', [2, 3, 3, 4]]
                ],
                'line-opacity': [
                    'step',
                    ['zoom'],
                    0,
                    6.5,
                    0.15,
                    7,
                    0.3,
                    9.5,
                    0.5,
                    16,
                    0.8
                ],
                'line-color': [
                    'step',
                    ['zoom'],
                    '#484932',
                    13,
                    '#22221b',
                    15,
                    '#6e3066'
                ],
                'line-width': [
                    'step',
                    ['zoom'],
                    1,
                    12,
                    2,
                    16,
                    1.5
                ]
            }
        });
    }

    /*map.addSource('property_lines', {
        type: 'raster',
        minzoom: 15,
        tiles: ['https://tiles.arcgis.com/tiles/KzeiCaQsMoeCfoCq/arcgis/rest/services/Regrid_Nationwide_Parcel_Boundaries_v1/MapServer/tile/{z}/{y}/{x}'],
        attribution: '&copy; Regrid'
    });

    map.addLayer({
        id: 'property_lines',
        type: 'raster',
        source: 'property_lines',
        paint: {
            'raster-opacity': 1
        }
    });*/
}

function addDynamicControls() {
    const useBottom = window.innerWidth <= 500;

    if (useBottom === controlsAtBottom) return;
    controlsAtBottom = useBottom;

    const list = useBottom ? [...mapControls].reverse() : mapControls;
    mapControls.filter(c => map.hasControl(c)).forEach(c => map.removeControl(c));
    list.forEach(c => map.addControl(c, useBottom ? 'bottom-right' : 'top-right'));
}

async function init() {
    let ctr_lat = settings.map().lat,
        ctr_lon = settings.map().lon;

    map = new maplibregl.Map({
        container: 'map',
        zoom: settings.map().zoom,
        center: [ctr_lon, ctr_lat],
        style: config.tiles[settings.getBasemap()],
        projection: 'mercator',
        hash: true,
        maxPitch: 85,
        pitch: (settings.map().pitch ? settings.map().pitch : 0),
        bearing: (settings.map().bearing ? settings.map().bearing : 0),
        attributionControl: false
    });

    /* add map controls */
    map.once('load', async () => {
        map.getCanvas().setAttribute('role', 'region');
        map.getCanvas().ariaLabel = document.querySelector('meta[name=description]').content;
        mapControls.push(new maplibregl.FullscreenControl({
            container: document.body
        }));
        mapControls.push(new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        }));
        mapControls.push(new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            fitBoundsOptions: {
                maxZoom: 10.16
            },
            trackUserLocation: true,
            showUserHeading: true
        }));

        map.addControl(
            new (await loadUtils()).MFAttribControl({
                compact: true,
                collapseBelow: 920
            }),
            'bottom-right'
        );

        map.addControl(
            new maplibregl.ScaleControl({
                unit: 'imperial'
            }),
            'bottom-left'
        );

        addDynamicControls();
    });

    map.once('styledata', () => {
        const loading = document.querySelector('.loading');

        /* preload sample images of the basemaps */
        tileConfig.forEach((item, index) => {
            const img = new Image();
            img.src = config.domain + 'assets/images/icons/fire/basemaps/' + item.imgs + '.png';
            tileConfig[index].cache = img;
        });

        /* hide loading div once map is rendered */
        if (loading) {
            loading.remove();
            document.querySelector('.filter-controls .search').style.display = 'inline-flex';
        }
    });

    /* handle on map style loaded event */
    map.on('style.load', async () => {
        /* add banner for archived maps to let the user know */
        if (settings.archive) {
            const b = document.createElement('div');
            b.classList.add('message', 'banner');
            b.innerHTML = '<a href="#" title="Return to current fires" data-action="close-historical"><i class="fas fa-xmark"></i></a><span>You are viewing a historical wildfire map for <b><u>' + settings.archive + '</u></b></span>';
            document.body.appendChild(b);
        }

        getCounties();

        map.setSky(config.fog);

        /* add fire icons */
        const loadMapIcons = () => {
            const queue = [
                ...icons.map(i => ({ id: `fire-icon${i ? '-' + i : ''}`, path: `fire/fire-icon${i ? '-' + i : ''}.png` })),
                ...['helicopter', 'plane_tactical', 'plane_large', 'plane_small'].map(i => ({ id: i, path: `fire/${i}.png` })),
                ...[1, 2, 3].map(i => ({ id: `modis${i}`, path: `fire/modis${i}.png` }))
            ];

            queue.forEach(async ({ id, path }) => {
                if (!map.hasImage(id)) {
                    const img = await map.loadImage(`${config.domain}assets/images/icons/${path}`);
                    map.addImage(id, img.data);
                }
            });
        };

        loadMapIcons();

        // add terrain on contour lines
        new (await loadUtils()).Layers().addTerrain();

        /* if user has settings saved, go to their saved location...not the mapbox hash location */
        if (window.location.hash) {
            const h = window.location.hash.replace('#', '').split('/');

            if (settings.map().lat == h[1] && settings.map().lon == h[2] && settings.map().zoom == h[0]) {
                map.easeTo({
                    center: [settings.map().lon, settings.map().lat],
                    zoom: settings.map().zoom,
                    duration: 1000
                });
            }
        }

        /* function to provide a popup soliciting donations, subscriptions, etc. */
        if (!settings.subscriptions().valid()) {
            setTimeout(async () => { (await loadUtils()).marketing(); }, 3000);
        }

        /* zoom to that country if URL contains country/{theCountry} */
        if (country) {
            const bounds = {
                'austrailia': { c: [133.7751, -25.2744], z: 3.5 },
                'canada': { c: [-106.3468, 56.1304], z: 4.2 }
            }[country.toLowerCase()];

            map.easeTo({ center: bounds.c, zoom: bounds.z, duration: 1000 });
        }

        /* zoom to that state if URL contains state/{theState} */
        if (state) {
            Object.keys((await loadUtils()).stateLabels).forEach(async (e) => {
                if ((await loadUtils()).stateLabels[e].name == state) {
                    map.easeTo({ center: (await loadUtils()).stateLabels[e].center, zoom: 5.8, duration: 1000 });
                }
            });
        }

        // attach the layers handler
        config.layersHandler = new (await loadUtils()).Layers();

        /* processing layers on startup */
        config.layersHandler.init();
        config.wildfire.getWildfires();
        config.wildfire.perimeters();

        const excludeTheseLayers = ['newFires', 'allFires', 'smokeChecks', 'rxBurns', 'perimeters'];

        if (settings.checkboxes()) {
            settings.checkboxes()
                .filter(c => !excludeTheseLayers.includes(c))
                .forEach(c => toggleLayer({ id: c, checked: true }));
        }
    });

    /* handle on map error event */
    map.on('error', (e) => {
        if (e && e.error.status != 500) { }
    });

    /* handle on map zoom end event */
    map.on('zoomend', () => {
        // if a layer requires a minimum zoom, and the layers menu is open, toggle opacity
        if (impact.style.display != 'none') {
            impact.querySelectorAll('.content li').forEach(li => {
                const isLow = map.getZoom() < li.dataset.minZoom;

                li.classList.toggle('more-zoom', isLow);
                li.title = isLow ? 'You must be zoomed in more' : li.querySelector('label').innerText;
            });
        }

        /* control whether FS roads show on the map based on the zoom level */
        if (settings.isEnabled('roads')) {
            if (!map.getLayer('roads')) config.layersHandler.roads();

            if (map.getLayer('roads')) map.setLayoutProperty('roads', 'visibility', map.getZoom() <= 11 ? 'none' : 'visible');
        }

        /* control whether modis hotspots show on the map based on the zoom level */
        [{ n: '24', w: 1 }, { n: '48', w: 2 }, { n: '72', w: 3 }].forEach(item => {
            const name = 'modis' + item.n,
                vis = map.getLayer(name) ? 'visible' : 'visible';

            if (settings.isEnabled(name)) {
                if (!map.getLayer(name)) config.layersHandler.modis(item.w);

                map.setLayoutProperty(name, 'visibility', map.getZoom() < config.modisZoomLevel ? 'none' : vis);
            }
        });
    });

    /* handle on map click events */
    map.on('click', async (e) => {
        (await loadUtils()).mapClick(e);
    });

    /* handle on start map move event */
    map.on('movestart', () => {
        map.getCanvas().style.cursor = 'grabbing';
        startLat = map.getCenter().lat;
        startLon = map.getCenter().lng;
    });

    /* handle on end map move event */
    map.on('moveend', async () => {
        map.getCanvas().style.cursor = 'auto';
        (await loadUtils()).moveEnd();
    });
}

function upgrade() {
    const items = ['dispatch', 'dispatch_time', 'impactScroll', 'marketing', 'version', 'clicks', 'tracked'];

    items.forEach(item => {
        const v = localStorage.getItem(item);

        if (v != null) {
            localStorage.setItem(`mapofire.${item}`, v);
            localStorage.removeItem(item);
        }
    });
}

async function popstate() {
    // if user is trying to view historical fires without a subscription
    if (!settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) && window.location.href.match(/archive=([0-9]+)/g) != null) {
        (await loadUtils()).notify('info', 'You must upgrade to view historical fires. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="archive_snackbar">Get access</a>', 6);
    }

    if (/loggedOut=1/.test(window.location.href)) {
        (await loadUtils()).notify('success', 'You were successfully logged out.');
    }

    /* if URL is supposed to open an incident */
    if (window.location.pathname.search('/fires') >= 0) {
        let id = window.location.pathname.split('/')[2];
        config.wildfire.incident(id, false);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/alert') >= 0) {
        const id = window.location.pathname.split('/')[3];
        new (await loadUtils()).NWS().readWWA(id, false);
    }

    /* if URL is supposed to open current weather conditions at a wx stn */
    if (window.location.pathname.search('/weather/current') >= 0) {
        const stnid = window.location.pathname.split('/')[3];
        new Weather().findWXStn(stnid);
    }

    /* if URL is supposed to open a SPC outlook */
    if (window.location.pathname.search('/weather/outlook') >= 0) {
        const p = window.location.pathname.split('/'),
            type = p[3],
            day = p[4];

        new (await loadUtils()).NWS().getOutlookText(type, day, false);
    }

    /* if URL is supposed to open a fire weather forecast */
    if (window.location.pathname.search('/weather/forecast') >= 0) {
        const loc = window.location.pathname.split('/')[3].split(','),
            lat = parseFloat(loc[0]),
            lon = parseFloat(loc[1]),
            isValid = (lat >= -90 && lat <= 90) && (lon >= -180 && lon <= 180);

        if (isValid && settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
            new Weather(lat, lon).fireWxFcst();
        } else {
            unsetHeaders();
        }
    }

    if (window.location.search && window.location.search.search('loggedOut') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', window.location.href.replace(window.location.search, ''));
    }
}

document.onreadystatechange = async () => {
    const preload = async () => {
        conversion = new Convert();

        let usr = null,
            set,
            token = (/\btoken=(.*?)(?=;|$)/gm).exec(document.cookie),
            versioning = () => {
                const sv = localStorage.getItem('mapofire.version'),
                    lv = localStorage.getItem('mapofire.version');

                if (sv == null || sv != version) localStorage.setItem('mapofire.version', version);
                if (lv == null || lv != layers.build) localStorage.setItem('mapofire.layers_version', layers.build);
            };

        versioning();

        // create a list of layers
        Object.entries(layers.categories).forEach(([id, _]) => {
            layers.layers[id].forEach(each => config.listOfLayers.push(each));
        });

        // get the user's IP address and UUID from the server (DONT BLOCK UI THREAD)
        if (sessionStorage.getItem('mapofire.user_session') == null) {
            api(config.host + 'api/v1/session/get').then(sess => {
                delete sess.metadata;
                sessionStorage.setItem('mapofire.user_session', JSON.stringify(sess));
            });
        }

        if (token != null) {
            const acct = document.querySelector('#account'),
                get = await api(config.apiURL + 'user/get/mapofire', [['token', token[1]]]);

            usr = get.user;

            /* change menu button */
            if (usr != null) acct.querySelector('span').innerHTML = 'Account';
        } else {
            document.querySelector('#save').remove();
        }

        // show the nav menu
        document.querySelector('nav ul').style.display = 'flex';

        // show the "close navbar" menu when screen width > 600px
        if (window.innerWidth > 600) document.querySelector('#close-navbar').classList.add('show');

        // create settings class based on user profile and settings
        settings = new (await loadUtils()).Settings(usr);

        /* * * * 
        // if user is admin, load the tools functions
        if (settings.hasPermissions(config.PERMISSION_LEVELS.ADMIN)) {
            setTimeout(() => {
                (await loadUtils()).loadScript(config.specificURL + (debugMode ? 'v' + version + '/mf.tools.js' : 'src/js/mf.tools-' + version + '.js')).then(() => {
                    config.toolsInstance = new Tools();
                    config.toolsInstance.use();
                });
            }, 1500);
        }
        * * * */

        // add fire weather and historical menu options (disabled them if user doesn't have correct perms)
        const makeItem = (opts) => {
            const el = document.createElement('li');
            el.id = opts.id;
            //if (!settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) el.classList.add('disabled');
            el.dataset.action = opts.id;
            el.innerHTML = '<i class="far fa-' + opts.icon + '"></i><span>' + opts.span + '</span>';
            document.querySelector('#' + opts.insert)?.insertAdjacentElement('afterend', el);
        };

        makeItem({ id: 'fwf', icon: 'cloud-bolt', span: 'Fire WX', insert: 'my-fire' });
        makeItem({ id: 'archive', icon: 'calendars', span: 'Historical', insert: 'layers' });

        // 1) start a wildfire class 2) get user's currently tracked wildfires 3) get austrailian bush fires
        config.wildfire = new (await loadUtils()).Wildfires();
        config.wildfire.getTrackedFires();
        config.wildfire.getBushfireNames();

        // initialize map
        const idle = window.requestIdleCallback ? window.requestIdleCallback : (cb) => setTimeout(cb, 1);

        idle(async () => {
            if (typeof maplibregl === 'undefined') return;

            (await loadUtils()).loadDispatchCenters();
            init();
            popstate();
        }, { timeout: 3250 });
    };

    const complete = async () => {
        const q = document.querySelector('#q');

        /* if the user is on an Android device, show the download app banner */
        if (/android/.test(navigator.userAgent.toLowerCase()) && !sessionStorage.getItem('recommend_google_play')) {
            document.querySelector('.android-banner').style.display = 'flex';
        }

        impact.addEventListener('scroll', () => {
            localStorage.setItem('mapofire.impactScroll', impact.scrollTop);
        });

        q.addEventListener('blur', () => {
            trending = false;
        });

        q.addEventListener('focus', async () => {
            if (q.value == '' && !trending && searchResults.querySelectorAll('li.trending').length == 0) {
                (await loadUtils()).addTrending();
            }
        });
    };

    if (document.readyState != 'complete') {
        preload();
    } else {
        complete();
    }
};

window.onload = async () => {
    /* get top clicked fires */
    const top = await api(config.apiURL + 'events?test=1', [['limit', 6]]);
    topFires = top.top;

    /* save settings automatically after the first 10 seconds, then every 5 minutes, whether to the session or user account */
    setTimeout(function () {
        saveSession(true, false);

        setInterval(() => {
            if (document.visibilityState === 'visible') {
                saveSession(true, false);
            }
        }, settings.get().saveFreq());
    }, 90000);

    /* send fire click data to server for processing every 20 secs */
    setInterval(() => {
        config.wildfire.commitLog();
    }, 20000);

    upgrade();
    //localStorage.setItem('mapofire.refresh', new Date().getTime());

    /* reload the map automatically every 5 minutes */
    setInterval(() => {
        window.location.href = window.location.href;
    }, 60 * 5 * 1000);

    /* add service worker to handle additional js execution */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(config.specificURL + (debugMode ? 'v' + version + '/service-worker.js' : 'src/js/service-worker-' + version + '.js'))
            .then(registration => {
                if (registration.active) {
                    registration.active.postMessage({
                        'version': version,
                        'mbVersion': mbVersion,
                        'host': config.specificURL
                    });
                }
            })
            .catch(error => console.error('Service worker registration failed:', error));
    }
};

/* click event listener */
window.addEventListener('click', async (e) => {
    const target = e.target,
        actionsThatOpenImpact = ['account', 'basemap', 'layers', 'legend', 'myfires', 'tools', 'back-my-content'],
        actionElement = target.closest('[data-action]'),
        action = actionElement ? actionElement.dataset.action : null,
        clickListener = new ClickListener(target, searchResults),
        actionHandlers = {
            //'close-modal': () => clickListener.closeModal(),
            'copy': () => clickListener.copy(),
            'tools': () => clickListener.tools(),
            'blazeboard': () => window.open(config.host + 'blazeboard?utm_campaign=blazeboard&utm_medium=mapofire.com&utm_source=menu'),
            'close-android': () => clickListener.android(),
            'back-my-content': () => clickListener.myContent(),
            'close-historical': () => clickListener.closeArchive(),
            'close-popup': () => clickListener.closePopup(),
            'clear-search': () => clickListener.clearSearch(),
            'close-data-form': () => clickListener.closeDataForm(),
            'close-impact': () => clickListener.closeImpact(),
            'sr-onclick': () => clickListener.searchResultClick(),
            'close-navbar': () => clickListener.closeNavbar(),
            'clear-layer-search': () => clickListener.clearLayerSearch(),
            'dropdown-nav': () => document.querySelector('nav').classList.toggle('open'),
            'new-fires': () => clickListener.newFire(),
            'readSPC': async () => {
                const ds = target.dataset;
                new (await loadUtils()).NWS().getOutlookText(ds.type, ds.day);
            },
            'marketing-cta': () => clickListener.mcta(),
            /*'upgrade-subscription': async () => {
                gtag('event', 'subscription_cta_click', {
                    'event_category': 'Subscription',
                    'event_label': e.target.dataset.medium,
                    'source': e.target.dataset.medium
                });

                window.location.href = (await loadUtils()).purchaseLink(e.target.dataset.medium);
            },*/
            'incident_wx-fwf': () => {
                new Weather(e.target.dataset.lat, e.target.dataset.lon).fireWxFcst();
            },
            'sharer': () => clickListener.sharer(),
            'radar-control': () => clickListener.radarPausePlay(),
            'trackFire': () => clickListener.follow(),
            'readWWA': async () => new (await loadUtils()).NWS().readWWA(target.dataset.id),
            'my-fire-unfollow': () => clickListener.unfollow(),
            'account': () => clickListener.account(),
            'new_fires': () => newFiresReport(),
            'basemap': () => clickListener.basemaps(),
            'layers': () => clickListener.showLayers(),
            'legend': () => clickListener.legend(),
            'spc-climo': () => clickListener.spcClimo(),
            'changeSPCDate': () => clickListener.changeSPCDate(),
            'fwf': async () => {
                if (!settings.subscriptions().valid()) {
                    (await loadUtils()).marketing(true, 'nav_fwf');
                } else {
                    document.querySelector('li#fwf').setAttribute('data-active', '1');
                    map.getCanvas().style.cursor = 'crosshair';
                    (await loadUtils()).notify('info', 'Click anywhere on get the fire weather forecast.');
                }
            },
            'myfires': () => clickListener.myfires(),
            'refresh': () => location.reload(),
            'archive': async () => {
                if (!settings.subscriptions().valid()) {
                    (await loadUtils()).marketing(true, 'nav_archive');
                } else {
                    clickListener.archive();
                }
            },
            'report': async () => {
                document.querySelector('li#report').setAttribute('data-active', '1');
                map.getCanvas().style.cursor = 'crosshair';
                (await loadUtils()).notify('info', 'Click anywhere on the map to report a <b>NEW</b> fire incident.');
            },
            'measure': () => new Tools().startMeasure(),
            'save': () => saveSession(false, true)
        };

    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }

    if (document.querySelector('body nav .nav-wrapper ul').contains(target)) {
        if (target.closest('li')) {
            document.querySelector('nav').classList.toggle('open');
        }
    }

    /* hide search results if outside search result container */
    if (!target.contains(searchResults) && (target.parentElement && !target.parentElement.contains(searchResults)) && !target.contains(document.querySelector('#q'))) {
        searchResults.style.display = 'none';
        document.querySelector('#q').value = '';

        searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
    }

    /* hide impact panel if outside of container */
    if (impact != null && impact.style.display == 'flex' && !impact.contains(e.target) && e.target !== impact && impact.dataset.display !== 'my-content') {
        if (!actionsThatOpenImpact.includes(action) && !document.querySelector('nav').contains(e.target)) {
            clickListener.closeImpact();
        }
    }
});

window.addEventListener('resize', () => {
    const nav = document.querySelector('nav'),
        nb = document.querySelector('#close-navbar');

    if (window.innerWidth < 600) {
        if (nav.classList.contains('hide')) {
            document.documentElement.style.setProperty('--nav-width', '100px');
            nav.classList.remove('hide');
        }

        nb.classList.remove('show');
    } else {
        nb.classList.add('show');
    }

    debounce(addDynamicControls(), 150);
});

window.addEventListener('keydown', (e) => {
    const isPasteAction = (e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V'),
        isSystemKey = e.altKey || e.key === 'Enter' || e.key === 'Shift' || e.key === 'Escape',
        isFindShortcut = (e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F'),
        isTypingKey = !e.ctrlKey && !e.metaKey && !e.altKey && !isSystemKey,
        searchBox = document.querySelector('#q');

    config.runSearch = false;

    // if the user presses the esc key
    if (e.code == 'Escape') {
        if (isVisible('#modal')) new ClickListener().closeModal();

        if (isVisible('.popup')) {
            marker?.remove();
            document.querySelector('.popup')?.remove();
        }

        // clear/close search features
        if (e.target === searchBox) {
            searchBox.value = '';
            searchBox.blur();
            searchResults.style.display = 'none';

            searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
        }
    }

    // if the user pressed ctrl + f, focus the search box
    if (isFindShortcut) {
        e.preventDefault();
        searchBox.focus();
        return;
    }

    // onkeydown in the search box
    if (e.target?.id == 'q') {
        if (/^(Arrow|Shift|Control|Alt|Tab|CapsLock|Escape)/.test(e.key)) return;

        const searchVisible = searchResults.style.display !== 'none' && searchResults.style.display !== '',
            standby = searchResults.querySelector('.standby');

        if (isTypingKey || isPasteAction) {
            config.runSearch = true;
            if (!searchVisible) searchResults.style.display = 'flex';

            standby.innerHTML = '<i class="fa-duotone fa-spinner-third"></i><span>Searching...</span>';
            if (standby.style.display != 'inline-flex') {
                searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
                standby.style.display = 'inline-flex';
            }

            standby.querySelector('i').style.display = 'block';
            standby.querySelector('span').textContent = 'Searching...';
        }
    }
});

// user search fires cities etc
window.addEventListener('keyup', debounce((e) => {
    (async () => {
        if (/^(Arrow|Shift|Control|Alt|Tab|CapsLock|Escape)/.test(e.key)) return;

        if (e.target.id == 'q' && config.runSearch) {
            document.querySelector('#clearSearch').style.display = e.target.value == '' ? 'none' : 'block';
            new (await loadUtils()).Search(e.target.value).do();

            config.runSearch = false;
        }

        if (e.target.id == 'layerSearch') {
            const query = e.target.value.toLowerCase();

            impact.querySelectorAll('.layers-list li.layer').forEach(layer => {
                const matches = layer.dataset.id.toLowerCase().includes(query) ||
                    layer.title.toLowerCase().includes(query);

                layer.style.display = matches || query == '' ? 'flex' : 'none';
            });
        }
    })();
}, 500));

window.addEventListener('popstate', () => popstate());

window.addEventListener('focus', e => { if (e.target?.id == 'q') searchResults.style.display = 'flex'; });