let utilsPromise = null;

const ENV = {
    origin: window.location.origin,
    host: `//${window.location.host.replace('www.', '')}/`,
    baseURL: `${window.location.origin}/`,
    domain: '//mapotechnology.com/',
    apiURL: '//api.mapotechnology.com/v1/',
    debug: window.location.search.includes('version'),
    PLATFORM_MAP: {
        'wlidfiremap.org': 'wildfiremap',
        'fireweatheravalanche.org': 'fireweatheravalanche'
    }/*,
    originalConsole: {},
    consoleMsgs: []*/
};

const mfFonts = `${ENV.baseURL}data/maps/fonts/{fontstack}/{range}.pbf`,
    debugMode = ENV.debug,
    API_KEYS = {
        'fireweatheravalanche': '191eab18c50c8f5653bdeba13f219bed',
        'wildfiremap': '85f58fa255efe0f779e0dfcd62d87e6d',
        'mapofire': '50e2c43f8f63ff0ed20127ee2487f15e'
    };

const $ = (sel, scope = document) => scope.querySelector(sel);

const getPlatform = () => {
    return ENV.PLATFORM_MAP[ENV.host] || 'mapofire';
};

const getFont = (type) => {
    const mapType = settings.getBasemap();
    const fontMap = {
        din: {
            dark: ['Noto Sans Regular'],
            voyager: ['Noto Sans Regular'],
            satellite: ['Noto Sans Bold'],
            default: ['DIN Pro Medium']
        },
        source: {
            dark: ['Noto Sans Regular'],
            voyager: ['Noto Sans Regular'],
            satellite: ['Noto Sans Bold'],
            osm: ['Source Sans Pro SemiBold'],
            default: ['Source Sans Pro SemiBold']
        },
        roboto: {
            dark: ['Montserrat Medium'],
            voyager: ['Montserrat Medium'],
            satellite: ['Noto Sans Bold'],
            default: ['Roboto Medium']
        }
    };

    return fontMap[type][mapType] || fontMap[type].default;
};

const loadArcgis = async () => {
    await import(`${ENV.baseURL}${(debugMode ? `v${version}/arcgis.js` : `src/js/arcgis-${version}.js`)}`);
};

const loadUtils = async () => {
    if (!window.ArcGISFeature) loadArcgis();
    if (utilsPromise) return utilsPromise;

    try {
        utilsPromise = await import(`${ENV.baseURL}${(debugMode ? `v${version}/mf.utils.js` : `src/js/mf.utils-${version}.js`)}`);
        return utilsPromise;
    } catch (e) {
        console.error('Failed to load utils', e);
        utilsPromise = null;
        throw e;
    }
};

const config = {
    productName: 'Map of Fire',
    company: 'MAPO LLC',
    apiKey: () => API_KEYS[getPlatform()],
    disableClicks: false,
    clusterFires: true,
    RADAR_OPACITY: 0.7,
    ANIMATION_DELAY_MS: 500,
    wildfire: null,
    layersHandler: null,
    layersMenu: null,
    listOfLayers: [],
    fuelsData: null,
    defaultAttr: '',
    months: ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
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
        LICENSEE: 'LICENSEE',
        PREMIUM: 'PREMIUM',
        PRO: 'PRO'
    },
    RANKS: {
        PREMIUM: 1,
        PRO: 2,
        LICENSEE: 3,
        ADMIN: 4
    },
    modisZoomLevel: 7,
    firemedZoomLevel: 9,
    toolsInstance: null,
    workers: {
        incident: null,
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
        din: () => getFont('din'),
        source: () => getFont('source'),
        roboto: () => getFont('roboto')
    }
};

const osm = {
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
                tiles: [`${ENV.domain}assets/images/tiles/6/{z}/{x}/{y}.png`],
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
                tiles: [`${ENV.domain}assets/images/tiles/2/{z}/{x}/{y}.png`],
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
                tiles: [`${ENV.domain}assets/images/tiles/3/{z}/{x}/{y}.png`],
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
    };

const activeIncidents = new Map(),
    loadingImages = new Set(),
    modal = $('#modal'),
    impact = $('#impact'),
    searchResults = $('#search-results'),
    disclaimer = 'This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.',
    impactHeader = `<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" data-action="close-impact" title="Close window">
    <i class="far fa-xmark" data-action="close-impact"></i></div></header>`,
    noneTracked = '<p class="message error">You aren\'t following any wildfires yet. Click on a fire to start following an incident.</p>',
    mapControls = [],
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
    fireIcons = ['', 'out', 'big', 'controlled', 'contained', 'large', 'large-inactive', 'complex', 'new', 'new-big', 'rx', 'smoke'],
    risk = {
        'whp': [
            ['N/A', '#fff'],
            ['Very Low', '#38a800'],
            ['Low', '#d1ff73'],
            ['Moderate', '#ffff00'],
            ['High', '#ffaa00'],
            ['Very High', '#ff0000']
        ]
    };

let map,
    marker,
    chart;

let conversion,
    settings,
    dispatchCenters;

let inits = {
    trending: false,
    highchartsLoad: false,
    evacuations: null,
    clickListener: null,
    controlsAtBottom: null,
    trackedDone: false
};

let dataView = {
    newFires: [],
    topFires: [],
    trackedFires: [],
    airQualityStns: null
};

let radar = {
    mapFrames: [],
    animationPosition: 0,
    animationTimer: false,
    currentLayerId: null,
    isLoading: false,
    loadedPositions: new Set()
};

let hrrrSmokeTime = {
    init: gmtime(-3600),
    fcst: gmtime(+3600)
};

let selected = {
    caperim: null,
    ausperim: null,
    perim: null,
    evac: null,
    nri: null,
    erc: null
};

let touchTimer,
    radarAnim;

const layerActions = {
    // wildfire related
    'newFires': { layers: ['new_fires', 'new_fires_title'] },
    'allFires': { layers: ['all_fires', 'all_fires_title', 'ca_fires', 'ca_fire_title'] },
    'smokeChecks': { layers: ['smk_fires', 'smk_fires_title'] },
    'rxBurns': { layers: ['rx_fires', 'rx_fires_title'] },
    'perimeters': {
        layers: ['perimeters_outline', 'perimeters_fill', 'perimeters_title', 'ca_perimeters_outline',
            'ca_perimeters_fill', 'ca_perimeters_title', 'aus_perimeters_outline', 'aus_perimeters_fill', 'aus_perimeters_title']
    },

    // modis
    'modis24': { layers: ['modis24'], exe: () => { config.layersHandler.modis(1); } },
    'modis48': { layers: ['modis48'], exe: () => { config.layersHandler.modis(2); } },
    'modis72': { layers: ['modis72'], exe: () => { config.layersHandler.modis(3); } },

    // evacuations & firemed
    'evac': { layers: ['evac', 'evac_outline', 'evac_title'] },
    'firemed': { layers: ['firemed'], exe: () => { config.layersHandler.firemed(); } },
    'tfrs': { layers: ['tfrs', 'tfrs_outline', 'tfrs_title'], exe: () => { config.layersHandler.tfrs(); } },

    // weather
    'lightning1': { layers: ['lightning1'] },
    'lightning24': { layers: ['lightning24'] },
    'wwas': { layers: ['wwas_fill', 'wwas_outline', 'wwas_title'], exe: async () => { new (await loadUtils()).NWS().get(); } },
    'stns': { layers: ['stns', 'stns_text'], exe: () => { new Weather().raws(); } },
    'visSatellite': { layers: ['satellite1'], exe: async () => { new (await loadUtils()).NWS().satellite(1); } },
    'irSatellite': { layers: ['satellite2'], exe: async () => { new (await loadUtils()).NWS().satellite(2); } },
    'wvSatellite': { layers: ['satellite3'], exe: async () => { new (await loadUtils()).NWS().satellite(3); } },
    'airq': { layers: ['airQuality', 'airQuality_text'], exe: () => { config.layersHandler.airQuality(); } },
    'spc': {
        run: async (checked) => {
            if (impact.style.display == 'flex' && impact.dataset.display == 'layers') {
                $('#otlkType').disabled = !checked;
                $('#otlkDay').disabled = !checked;
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
                $('.radar').remove();

                for (let i = 0; i < radar.mapFrames.length; i++) {
                    if (map.getLayer(`radar-layer-${i}`)) map.removeLayer(`radar-layer-${i}`);
                    if (map.getSource(`radar-${i}`)) map.removeSource(`radar-${i}`);
                }

                radar = {
                    mapFrames: [],
                    animationPosition: 0,
                    animationTimer: false,
                    currentLayerId: null,
                    isLoading: false,
                    loadedPositions: new Set()
                };
            }
        }
    },
    'ndfd': {
        run: async (checked) => {
            const visibility = checked ? 'visible' : 'none';

            if (impact.style.display == 'flex') {
                $('#forecastModel').disabled = !checked;
                $('#fcstTime').disabled = !checked;
            }

            if (map.getSource('ndfd')) {
                map.setLayoutProperty('ndfd', 'visibility', visibility);

                if (!checked) $('.ndfdLegend')?.remove();
            } else if (checked) {
                new (await loadUtils()).NWS().ndfd();
            }
        }
    },
    'erc': {
        run: (checked) => {
            if (impact.style.display == 'flex') $('#erc_time').disabled = !checked;

            if (map.getSource('erc')) {
                ['erc_fill', 'erc_outline'].forEach(n => map.setLayoutProperty(n, 'visibility', checked ? 'visible' : 'none'));
            } else if (checked) {
                config.layersHandler.erc();
            }
        }
    },

    // planning, hazard & vunerability
    'ev': { layers: ['ev'], exe: () => { config.layersHandler.pnwVulnerability(); } },
    'spcClimo': {
        run: (checked) => {
            if (checked) {
                config.layersHandler.spcClimo();
            } else {
                ['spc_climo_fill', 'spc_climo_outline', 'spc_climo_prob'].forEach(a => map.removeLayer(a));
                map.removeSource('spc_climo');
                $('.spcTimeline').remove();
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
    'sfp': {
        run: (checked) => {
            if (impact.style.display == 'flex') $('#sfpDateSelect').disabled = !checked;

            if (map.getSource('sfp')) {
                map.setLayoutProperty('sfp', 'visibility', checked ? 'visible' : 'none');
            } else if (checked) {
                config.layersHandler.sfp();
            }
        }
    },

    // administrative bounds
    'nwsCWAs': { layers: ['nwsCWAs'], exe: () => { config.layersHandler.nwsCWAs(); } },
    'roads': { layers: ['roads'], exe: () => { config.layersHandler.roads(); } },
    'lands': { layers: ['lands'], exe: () => { config.layersHandler.lands(); } },
    'plss': { layers: ['plss'], exe: () => { config.layersHandler.plss(); } },
    'dispatch': { layers: ['dispatch_outline', 'dispatch_title'], exe: () => { config.layersHandler.dispatch(); } },
    'gaccBounds': { layers: ['gaccBounds', 'gaccBounds_title'], exe: () => { config.layersHandler.gaccBounds(); } },
    'countyBounds': { layers: ['countyBounds'], exe: () => { config.layersHandler.countyBounds(); } },

    // smoke
    'hms': { layers: ['hms', 'hms_title'], exe: () => { config.layersHandler.hms(); } },
    'smokeFcst': { layers: ['smokeFcst'], exe: () => { config.layersHandler.smokeFcst(); } },
    'sfcSmoke': {
        run: async (checked) => {
            if (impact.style.display == 'flex' && impact.dataset.display == 'layers') {
                $('#sfc_smoke_time').disabled = !checked;
            }

            if (map.getSource('sfcSmoke')) {
                map.setLayoutProperty('sfcSmoke', 'visibility', checked ? 'visible' : 'none');
            } else if (checked) {
                config.layersHandler.sfcSmoke();
            }
        }
    },
    'viSmoke': {
        run: async (checked) => {
            if (impact.style.display == 'flex' && impact.dataset.display == 'layers') {
                $('#vi_smoke_time').disabled = !checked;
            }

            if (map.getSource('viSmoke')) {
                map.setLayoutProperty('viSmoke', 'visibility', checked ? 'visible' : 'none');
            } else if (checked) {
                config.layersHandler.viSmoke();
            }
        }
    },

    // state-specific
    'odfFDR': { layers: ['odfFDR', 'odfFDR_outline', 'odfFDR_title'], exe: () => { config.layersHandler.odfFDR(); } },
    'calfireUnits': { layers: ['calfireUnits', 'calfireUnits_title'], exe: () => { config.layersHandler.calfireUnits(); } },
    'cdfFHSZ': { layers: ['cdfFHSZ', 'cdfFHSZ_title'], exe: () => { config.layersHandler.cdfFHSZ(); } },
    'calfireAircraft': { layers: ['calfireAircraft', 'calfireAircraft_title'], exe: () => { config.layersHandler.calfireAircraft(); } }
};

Object.freeze(layerActions);
Object.freeze(config.PERMISSION_LEVELS);

config.tiles = {
    outdoors: `${ENV.apiURL}maps/style/terrain?key=${config.apiKey()}`,
    //outdoors: `${ENV.host}data/maps/terrain.json`,
    //outdoors: 'https://tiles.openfreemap.org/styles/liberty',
    satellite: `${ENV.apiURL}maps/style/satellite?key=${config.apiKey()}`,
    osm: osm,
    //fs16: fs16,
    fs16: `${ENV.apiURL}maps/style/usfs?key=${config.apiKey()}`,
    //fs16: `${ENV.host}data/maps/usfs.json`,
    caltopo: caltopo,
    terrain: terrain,
    topofire: topofire,
    voyager: `${ENV.apiURL}maps/style/voyager?key=${config.apiKey()}`,
    dark: `${ENV.apiURL}maps/style/dark?key=${config.apiKey()}`
    //dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

function storage(key, data = null) {
    return data ? localStorage.setItem(key, data) : localStorage.getItem(key);
}

function getWorker(name) {
    if (!config.workers[name]) {
        const path = `${ENV.baseURL}${(debugMode ? `v${version}/${name}.js` : `src/js/${name}-${version}.js`)}`;
        config.workers[name] = new Worker(path);
    }
    return config.workers[name];
}

async function api(uri, fields = null, v2 = false, forAuth = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu') || url.includes('rainviewer.com'),
        isInternal = url.includes(ENV.apiURL) || url.includes(ENV.apiURL.replace('v1', 'v2')) || url.includes(ENV.host),
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

    if (forAuth) ops['credentials'] = 'include';
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

function getbbox() {
    var b = map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast();

    return (b ? JSON.stringify({
        xmin: sw.lng,
        ymin: sw.lat,
        xmax: ne.lng,
        ymax: ne.lat,
        spatialReference: {
            wkid: 4326
        }
    }) : false);
}

function toggleLayer(e) {
    const { id: layerId, checked } = e,
        action = layerActions[layerId],
        getLayer = config.listOfLayers.find(layer => layer.id === layerId),
        layerPerms = getLayer ? getLayer.perms : false;

    const executeToggle = (sourceId, action, checked) => {
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
    if (!map.getSource('us_counties')) {
        new ArcGISFeature('us_counties', map, {
            //url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized_Boundaries/FeatureServer/0',
            url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0',
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

    /*if (!map.getLayer('county-boundaries')) {
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
    }*/

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
    let evacBtn = $('.evacBtn');

    if (!evacBtn) {
        evacBtn = document.createElement('button');
        evacBtn.className = 'control evacBtn ttip';
        evacBtn.dataset.action = 'evac_list';
        evacBtn.dataset.tooltip = 'Evacuations';
    }

    if (useBottom === inits.controlsAtBottom) return;
    inits.controlsAtBottom = useBottom;

    const list = useBottom ? [...mapControls].reverse() : mapControls;
    mapControls.filter(c => map.hasControl(c)).forEach(c => map.removeControl(c));
    list.forEach(c => map.addControl(c, useBottom ? 'bottom-right' : 'top-right'));

    const c = ['fullscreen', 'zoom-in', 'zoom-out', 'compass', 'geolocate'],
        t = ['Enter fullscreen', 'Zoom in', 'Zoom out', 'Reset bearing to north', 'Find my location'];

    for (let i = 0; i < c.length; i++) {
        const it = $(`.maplibregl-ctrl-${c[i]}`);
        if (!it) continue;

        it.classList.add('ttip');
        it.dataset.tooltip = t[i];
    }

    evacBtn.remove();

    if (useBottom) {
        const parent = $('.maplibregl-ctrl-bottom-right');
        let container = parent.querySelector('.custom-ctrl');

        if (!container) {
            container = document.createElement('div');
            container.className = 'maplibregl-ctrl maplibregl-ctrl-group custom-ctrl';
        }

        container.prepend(evacBtn);
        parent.prepend(container);
    } else {
        $('.filter-controls').appendChild(evacBtn);
    }

    const to = setInterval(() => {
        if (inits.evacuations?.evacsLoaded) {
            inits.evacuations?.evacHelper();
            clearInterval(to);
        }
    }, 500);
}

async function loadMapIcons() {
    const queue = [
        ...fireIcons.map(i => ({ id: `fire-icon${i ? `-${i}` : ''}`, path: `fire/fire-icon${i ? `-${i}` : ''}.png` })),
        ...['helicopter', 'plane_tactical', 'plane_large', 'plane_small'].map(i => ({ id: i, path: `fire/${i}.png` })),
        ...[1, 2, 3].map(i => ({ id: `modis${i}`, path: `fire/modis${i}.png` }))
    ];

    await Promise.all(queue.map(async ({ id, path }) => { // changed: use Promise.all instead of forEach
        if (map.hasImage(id) || loadingImages.has(id)) return; // added: prevent duplicate loads

        loadingImages.add(id); // added

        try {
            const img = await map.loadImage(`${ENV.domain}assets/images/icons/${path}`);
            if (!map.hasImage(id)) map.addImage(id, img.data);
        } catch (e) {
            console.error(`Failed to load image: ${id}`, e); // added
        } finally {
            loadingImages.delete(id); // added
        }
    }));
}

async function init() {
    conversion = new (await loadUtils()).Convert();

    const utils = await loadUtils();
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
        new utils.MFAttribControl({
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

    // add map controls
    map.once('load', async () => {
        map.getCanvas().setAttribute('role', 'region');
        map.getCanvas().ariaLabel = $('meta[name=description]').content;
    });

    map.once('styledata', () => {
        const loading = $('.loading');

        // preload sample images of the basemaps
        tileConfig.forEach((item, index) => {
            if (!item.imgs) return;

            const img = new Image();
            img.src = `${ENV.domain}assets/images/icons/fire/basemaps/${item.imgs}.png`;
            tileConfig[index].cache = img;
        });

        // hide loading div once map is rendered
        if (loading) {
            loading.remove();
            $('.filter-controls .search').style.display = 'inline-flex';
        }
    });

    // handle on map style loaded event
    map.on('style.load', async () => {
        // add banner for archived maps to let the user know
        if (settings.archive) {
            const b = document.createElement('div');
            b.classList.add('message', 'banner');
            b.innerHTML = `<a href="#" title="Return to current fires" data-action="close-historical"><i class="fas fa-xmark"></i></a>
            <span>You are viewing a historical wildfire map for <b><u>${settings.archive}</u></b></span>`;

            document.body.appendChild(b);
        }

        map.setSky(config.fog);

        // add fire icons
        loadMapIcons();

        // overlay counties
        getCounties();

        // add terrain on contour lines
        new utils.Layers().addTerrain();

        // if user has settings saved, go to their saved location...not the mapbox hash location
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

        // function to provide a popup soliciting donations, subscriptions, etc.
        if (!settings.subscriptions().valid()) setTimeout(async () => { utils.marketing(); }, 3000);

        // zoom to that country if URL contains country/{theCountry}
        if (country) {
            const bounds = {
                'austrailia': { c: [133.7751, -25.2744], z: 3.5 },
                'canada': { c: [-106.3468, 56.1304], z: 4.2 }
            }[country.toLowerCase()];

            map.easeTo({ center: bounds.c, zoom: bounds.z, duration: 1000 });
        }

        // zoom to that state if URL contains state/{theState}
        if (state) {
            Object.keys(utils.stateLabels).forEach(async (e) => {
                if (utils.stateLabels[e].name == state) {
                    map.easeTo({ center: utils.stateLabels[e].center, zoom: 5.8, duration: 1000 });
                }
            });
        }

        // attach the layers handler
        config.layersHandler = new utils.Layers();

        // processing layers on startup
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

    // handle on map error event
    map.on('error', (e) => {
        //console.error(e.error.message);
        if (e && e.error.status != 500) { }
    });

    // re-load map icons if they're missing on initialize load
    map.on('styleimagemissing', () => loadMapIcons());

    // handle on map zoom end event
    map.on('zoomend', () => {
        // if a layer requires a minimum zoom, and the layers menu is open, toggle opacity
        if (impact.style.display != 'none' && impact.dataset.display == 'layers') {
            impact.querySelectorAll('.content li').forEach(li => {
                const isLow = map.getZoom() < li.dataset.minZoom;

                li.classList.toggle('more-zoom', isLow);
                li.title = isLow ? 'You must be zoomed in more' : li.querySelector('label').innerText;
            });
        }

        // control whether FS roads show on the map based on the zoom level
        if (settings.isEnabled('roads')) {
            if (!map.getLayer('roads')) config.layersHandler.roads();

            if (map.getLayer('roads')) map.setLayoutProperty('roads', 'visibility', map.getZoom() <= 11 ? 'none' : 'visible');
        }

        // control whether modis hotspots show on the map based on the zoom level
        [{ n: '24', w: 1 }, { n: '48', w: 2 }, { n: '72', w: 3 }].forEach(item => {
            const name = `modis${item.n}`,
                vis = map.getLayer(name) ? 'visible' : 'visible';

            if (settings.isEnabled(name)) {
                if (!map.getLayer(name)) config.layersHandler.modis(item.w);

                map.setLayoutProperty(name, 'visibility', map.getZoom() < config.modisZoomLevel ? 'none' : vis);
            }
        });
    });

    // handle on map click events
    map.on('click', async (e) => {
        utils.mapClick(e);
    });

    map.on('contextmenu', async (e) => {
        e.preventDefault();
        utils.contextMenu(e);
    });

    /*map.getContainer().addEventListener('touchstart', async (e) => {
        touchTimer = setTimeout(async () => {
            e.preventDefault();
            e.stopPropagation();

            utils.contextMenu(e, true);
        }, 1000);
    });*/

    map.getContainer().addEventListener('touchend', () => clearTimeout(touchTimer));
    map.getContainer().addEventListener('touchmove', () => clearTimeout(touchTimer));

    // handle on start map move event
    map.on('movestart', () => {
        async function clearRadarCache() {
            new (await loadUtils()).ClickListener().radarStop();
            radar.loadedPositions.forEach(pos => {
                if (pos !== radar.animationPosition) {
                    var layerId = `radar-layer-${pos}`;
                    var sourceId = `radar-${pos}`;

                    if (map.getLayer(layerId)) map.removeLayer(layerId);
                    if (map.getSource(sourceId)) map.removeSource(sourceId);
                }
            });
            radar.loadedPositions.clear();
            radar.loadedPositions.add(radar.animationPosition);
        }

        if (settings.checkboxes().includes('radar')) clearRadarCache();

        map.getCanvas().style.cursor = 'grabbing';
        startLat = map.getCenter().lat;
        startLon = map.getCenter().lng;
    });

    // handle on end map move event
    map.on('moveend', async () => {


        map.getCanvas().style.cursor = 'auto';
        utils.moveEnd();
    });
}

function upgrade() {
    const items = ['dispatch', 'dispatch_time', 'impactScroll', 'marketing', 'version', 'clicks', 'tracked'];

    items.forEach(item => {
        const v = storage(item);

        if (v != null) {
            storage(`mapofire.${item}`, v);
            localStorage.removeItem(item);
        }
    });
}

async function popstate() {
    const utils = await loadUtils();
    const pathName = window.location.pathname;
    const pathParts = pathName.split('/').filter(Boolean);
    const getPathPart = (index) => pathParts[index] ?? null;

    async function goToPerimeter(incId) {
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query', [
            ['where', `attr_UniqueFireIdentifier = '${incId}'`],
            ['returnCentroid', true],
            ['returnGeometry', false],
            ['f', 'json']
        ]);

        const coords = data?.features?.[0]?.centroid;

        if (coords) {
            map.easeTo({
                center: [coords.x, coords.y],
                zoom: 9.5,
                duration: 0
            });
        }
    }

    // if user is trying to view historical fires without a subscription
    if (!settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) && window.location.href.match(/archive\/([0-9]+)/g) != null) {
        utils.notify('info', 'You must upgrade to view historical fires. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="archive_snackbar">Get access</a>', 6);
    }

    // if loggedOut=1 is a query parameter
    if (/loggedOut=1/.test(window.location.href)) {
        utils.notify('success', 'You were successfully logged out.');
    }

    const category = pathParts[0];

    if (category === 'fires') {
        const id = getPathPart(1);
        if (id) config.wildfire.incident(id, false);
    } else if (category === 'perimeter') {
        const incId = getPathPart(1);
        if (incId) goToPerimeter(incId);
    } else if (category === 'weather') {
        const id = getPathPart(2);

        switch (pathParts[1]) {
            case 'alert': {
                if (id) new utils.NWS().readWWA(id, false);
                break;
            }
            case 'current': {
                if (id) new Weather().findWXStn(id);
                break;
            }
            case 'outlook': {
                const day = getPathPart(3);
                if (id && day) new utils.NWS().getOutlookText(id, day, false);
                break;
            }
            case 'forecast': {
                if (!id) return;

                const [lat, lon] = id.split(',').map(Number);
                const isValid = lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

                if (isValid && settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
                    new Weather(lat, lon).fireWxFcst();
                } else {
                    unsetHeaders();
                }
                break;
            }
        }
    }

    if (window.location.search && window.location.search.search('loggedOut') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', window.location.href.replace(window.location.search, ''));
    }
}

class Mapolytics {
    // ADDED: centralized storage key
    static STORAGE_KEY = 'client_logger_pending';

    constructor(options = {}) {
        this.apiUrl = `${ENV.apiURL}mapolytics`;

        this.maxLogs = options.maxLogs ?? 250;
        this.batchSize = options.batchSize ?? 25;
        this.flushInterval = options.flushInterval ?? 60000;

        // ADDED: prevents overlapping uploads
        this.isFlushing = false;

        // ADDED: unique session id
        this.sessionId = crypto.randomUUID();

        this.logs = [];

        // ADDED: preserve original console methods
        this.originalConsole = {
            log: console.log.bind(console),
            info: console.info.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console)
        };

        this.restoreLogs();
        this.init();
    }

    // ADDED: initialization
    init() {
        this.hookConsole();
        this.hookErrors();
        this.hookFetch();
        this.hookUnload();

        // ADDED: retry any unsent logs from previous session
        if (this.logs.length > 0) setTimeout(() => this.flush(), 5000);

        // ADDED: periodic uploads
        setInterval(() => this.flush(), this.flushInterval);
    }

    // ADDED: load pending logs
    restoreLogs() {
        try {
            const saved = localStorage.getItem(ClientLogger.STORAGE_KEY);

            if (saved) this.logs = JSON.parse(saved) || [];
        } catch (e) {
            this.logs = [];
        }
    }

    // ADDED: persist pending logs
    persistLogs() {
        try {
            localStorage.setItem(
                ClientLogger.STORAGE_KEY,
                JSON.stringify(this.logs)
            );
        } catch (e) { }
    }

    // ADDED: hook console methods
    hookConsole() {
        ['log', 'info', 'warn', 'error'].forEach(level => {
            console[level] = (...args) => {
                this.addLog(level, {
                    message: args.map(arg => this.serialize(arg)).join(' ')
                });

                this.originalConsole[level](...args);

                if (this.logs.length >= this.batchSize) this.flush();
            };
        });
    }

    // ADDED: uncaught exception and promise monitoring
    hookErrors() {
        window.addEventListener('error', event => {
            this.addLog('exception', {
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack ?? null
            });

            this.flush();
        });

        window.addEventListener('unhandledrejection', event => {
            this.addLog('promise', {
                reason: this.serialize(event.reason),
                stack: event.reason?.stack ?? null
            });

            this.flush();
        });
    }

    // ADDED: fetch monitoring
    hookFetch() {
        const originalFetch = window.fetch;

        window.fetch = async (...args) => {
            const url = String(args[0] || '');

            // ADDED: ignore logger requests
            if (url.includes(this.apiUrl)) return originalFetch.apply(window, args);

            try {
                const response = await originalFetch.apply(window, args);

                if (!response.ok) {
                    this.addLog('fetch', {
                        url,
                        status: response.status,
                        statusText: response.statusText
                    });
                }

                return response;
            } catch (error) {
                this.addLog('fetch', {
                    url,
                    error: error.message
                });

                throw error;
            }
        };
    }

    // ADDED: unload handling
    hookUnload() {
        const sendLogs = () => {
            if (!this.logs.length) return;

            try {
                navigator.sendBeacon(
                    this.apiUrl,
                    new Blob(
                        [JSON.stringify(this.buildPayload())],
                        { type: 'application/json' }
                    )
                );
            } catch (e) { }
        };

        window.addEventListener('pagehide', sendLogs);
        window.addEventListener('beforeunload', sendLogs);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') sendLogs();
        });
    }

    // ADDED: unified log insertion
    addLog(level, data) {
        this.logs.push({
            level,
            timestamp: Date.now(),
            ...data
        });

        // ADDED: trim old logs
        if (this.logs.length > this.maxLogs) {
            this.logs.splice(0, this.logs.length - this.maxLogs);
        }

        this.persistLogs();
    }

    // ADDED: upload logs
    async flush() {
        if (this.isFlushing || !this.logs.length) return;

        this.isFlushing = true;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.buildPayload()),
                keepalive: true
            });

            if (!response.ok) throw new Error(`Logger API returned ${response.status}`);

            this.logs = [];
            localStorage.removeItem(ClientLogger.STORAGE_KEY);
        } catch (e) {
            // ADDED: keep logs for future retry
            this.persistLogs();
        } finally {
            this.isFlushing = false;
        }
    }

    // ADDED: payload builder
    buildPayload() {
        return {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height
            },
            logs: this.logs
        };
    }

    // ADDED: safe serializer
    serialize(value) {
        try {
            if (value instanceof Error) {
                return JSON.stringify({
                    message: value.message,
                    stack: value.stack
                });
            }

            if (typeof value === 'object' && value !== null) return JSON.stringify(value);

            return String(value);
        } catch (e) {
            return '[unserializable]';
        }
    }
}

document.onreadystatechange = async () => {
    const preload = async () => {
        let usr;
        const versioning = () => {
            const sv = storage('mapofire.version'),
                lv = storage('mapofire.layers_version');

            if (sv == null || sv != version) storage('mapofire.version', version);
            if (lv == null || lv != layers.build) storage('mapofire.layers_version', layers.build);
        };

        versioning();

        // create a list of layers
        config.listOfLayers.push(...Object.keys(layers.categories).flatMap(id => layers.layers[id]));

        // get the user's IP address and UUID from the server (DONT BLOCK UI THREAD)
        if (!sessionStorage.getItem('mapofire.user_session')) {
            api(`${ENV.host}api/v1/session/get`).then(sess => {
                delete sess.metadata;
                sessionStorage.setItem('mapofire.user_session', JSON.stringify(sess));
            });
        }

        if (window.isAuthUser) {
            const getAcct = await api(`${ENV.host}api/v1/user/get/mapofire`, null, false, true);

            if (getAcct?.response) {
                const loginURL = `${ENV.domain.replace('//', '//auth.')}login?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}`;
                (await loadUtils()).notify('info', `Your session has expired. Please <a href="${loginURL}">login again</a>.`, 3.25);
            } else {
                usr = getAcct?.user;
            }

            // change menu button
            if (usr) $('#account span').textContent = 'Account';
        } else {
            $('#save').remove();
        }

        // show the nav menu
        $('nav ul').style.display = 'flex';

        // show the "close navbar" menu when screen width > 600px
        if (window.innerWidth > 600) $('#close-navbar').classList.add('show');

        // create settings class based on user profile and settings
        settings = new (await loadUtils()).Settings(usr);

        // get top clicked fires
        const getTopFires = await api(`${ENV.apiURL}events?test=1`, [['limit', 6]], (settings.getUser().uid() == 1 ? true : false));
        if (top) dataView.topFires = getTopFires.top;

        /* * * * 
        // if user is admin, load the tools functions
        if (settings.hasPermissions(config.PERMISSION_LEVELS.ADMIN)) {
            setTimeout(() => {
                (await loadUtils()).loadScript(ENV.baseURL + (debugMode ? 'v' + version + '/mf.tools.js' : 'src/js/mf.tools-' + version + '.js')).then(() => {
                    config.toolsInstance = new Tools();
                    config.toolsInstance.use();
                });
            }, 1500);
        }
        * * * */

        if (settings.getUser().role() !== config.PERMISSION_LEVELS.ADMIN) {
            $('.filter-controls').addEventListener('contextmenu', (e) => e.preventDefault());
        }

        // add fire weather and historical menu options (disabled them if user doesn't have correct perms)
        const makeItem = ({ id, icon, span, insert, ttip }) => {
            const el = Object.assign(document.createElement('li'), {
                id,
                className: 'ttip light',
                innerHTML: `<i class="far fa-${icon}"></i><span>${span}</span>`
            });
            Object.assign(el.dataset, { action: id, tooltip: ttip });

            document.getElementById(insert).insertAdjacentElement('afterend', el);
        };

        makeItem({ id: 'fwf', icon: 'cloud-bolt', span: 'Fire WX', insert: 'my-fire', ttip: 'Fire Weather Forecast' });
        makeItem({ id: 'archive', icon: 'calendars', span: 'Historical', insert: 'layers', ttip: 'Historical Fires' });

        // 1) start a wildfire class 2) get user's currently tracked wildfires 3) get austrailian bush fires
        config.wildfire = new (await loadUtils()).Wildfires();
        ['getTrackedFires', 'getBushfireNames'].forEach(fn => config.wildfire[fn]());

        // initialize map
        (window.requestIdleCallback || (cb => setTimeout(cb, 1)))(async () => {
            if (typeof maplibregl === 'undefined') return;
            (await loadUtils()).loadDispatchCenters();
            init();
            popstate();
        }, { timeout: 3250 });
    };

    const complete = async () => {
        const q = document.querySelector('#q');

        // if the user is on an Android device, show the download app banner
        const recommendPlay = localStorage.getItem('recommend_google_play');
        if (/android/.test(navigator.userAgent.toLowerCase()) && (!recommendPlay || config.curTime.getTime() - recommendPlay > 259200000)) {
            $('.android-banner').style.display = 'flex';
        }

        impact.addEventListener('scroll', () => {
            storage('mapofire.impactScroll', impact.scrollTop);
        });

        q.disabled = false;
        q.addEventListener('blur', () => inits.trending = false);
        q.addEventListener('focus', async () => {
            if (q.value == '' && !inits.trending && searchResults.querySelectorAll('li.trending').length == 0) {
                (await loadUtils()).addTrending();
            }
        });

        // attach tooltip binders to class
        const tooltip = new (await loadUtils()).Tooltips({ followMouse: false });
        tooltip.attach('.ttip', (el) => el.dataset.tooltip);

        // add incident worker
        getWorker('incident');
    };

    if (document.readyState != 'complete') {
        inits.clickListener = new (await loadUtils()).ClickListener();
        preload();
    } else {
        complete();
    }
};

window.onload = async () => {
    // keep a log of all console messages during the session
    /*window.logger = new Mapolytics({
        batchSize: 25,
        maxLogs: 250,
        flushInterval: 60000
    });*/

    // save settings automatically after the first 10 seconds, then every 5 minutes, whether to the session or user account
    setTimeout(function () {
        saveSession(true, false);

        setInterval(() => {
            if (document.visibilityState === 'visible') {
                saveSession(true, false);
            }
        }, settings.get().saveFreq());
    }, 90000);

    // send fire click data to server for processing every 20 secs
    setInterval(() => {
        config.wildfire.commitLog();
    }, 20000);

    upgrade();
    //storage('mapofire.refresh', new Date().getTime());

    // reload the map automatically every 5 minutes
    setInterval(() => {
        window.location.href = window.location.href;
    }, 60 * 5 * 1000);

    // add service worker to handle additional js execution
    if ('serviceWorker' in navigator && !debugMode) {
        navigator.serviceWorker.register(
            `${ENV.baseURL}${(debugMode ? `v${version}/service-worker.js` : `src/js/service-worker-${version}.js`)}`
            + `?h=${encodeURIComponent(ENV.baseURL)}&v=${version}&m=${mbVersion}`
        ).catch(err => console.error('Service worker registration failed:', err));
    }
};

// click event listener
window.addEventListener('click', async (e) => {
    const utils = await loadUtils(),
        target = e.target,
        contextMenu = $('.context-menu'),
        actionsThatOpenImpact = ['account', 'basemap', 'layers', 'legend', 'myfires', 'tools', 'back-my-content'],
        actionElement = target.closest('[data-action]'),
        action = actionElement ? actionElement.dataset.action : null,
        canUse = settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM);
    //canUse = settings.subscriptions().valid() || settings.getUser().role() == config.PERMISSION_LEVELS.ADMIN;

    const clicks = new (await loadUtils()).ClickListener(target, searchResults);

    const actionHandlers = {
        //'close-modal': () => clicks.closeModal(),
        'copy': () => clicks.copy(),
        'tools': () => clicks.tools(),
        'blazeboard': () => window.open(`${ENV.host}blazeboard?utm_campaign=blazeboard&utm_medium=mapofire.com&utm_source=menu`),
        'close-android': () => clicks.android(),
        'back-my-content': () => clicks.myContent(),
        'close-historical': () => clicks.closeArchive(),
        'close-popup': () => clicks.closePopup(),
        'clear-search': () => clicks.clearSearch(),
        'close-data-form': () => clicks.closeDataForm(),
        'close-impact': () => clicks.closeImpact(),
        'sr-onclick': () => clicks.searchResultClick(),
        'close-navbar': () => clicks.closeNavbar(),
        'clear-layer-search': () => clicks.clearLayerSearch(),
        'dropdown-nav': () => $('nav').classList.toggle('open'),
        'new-fires': () => clicks.newFire(),
        'readSPC': async () => {
            const ds = target.dataset;
            new utils.NWS().getOutlookText(ds.type, ds.day);
        },
        'marketing-cta': () => clicks.mcta(),
        /*'upgrade-subscription': async () => {
            gtag('event', 'subscription_cta_click', {
                'event_category': 'Subscription',
                'event_label': e.target.dataset.medium,
                'source': e.target.dataset.medium
            });

            window.location.href = utils.purchaseLink(e.target.dataset.medium);
        },*/
        'incident_wx-fwf': () => new Weather(e.target.dataset.lat, e.target.dataset.lon).fireWxFcst(),
        'sharer': () => clicks.sharer(),
        'radar-control': () => clicks.radarPausePlay(),
        'trackFire': () => clicks.follow(),
        'readWWA': async () => new utils.NWS().readWWA(target.dataset.id),
        'account': () => clicks.account(),
        'new_fires': () => newFiresReport(),
        'evac_list': () => inits.evacuations?.clickListener(),
        'goToEvacPoly': () => inits.evacuations?.zoomTo(target),
        'basemap': () => clicks.basemaps(),
        'layers': () => clicks.showLayers(),
        'legend': () => clicks.legend(),
        'spc-climo': () => clicks.spcClimo(),
        'changeSPCDate': () => clicks.changeSPCDate(),
        'fwf': async () => {
            if (canUse) {
                $('li#fwf').dataset.active = '1';
                map.getCanvas().style.cursor = 'crosshair';
                utils.notify('info', 'Click anywhere on get the fire weather forecast.');
            } else {
                utils.marketing(true, 'nav_fwf');
            }
        },
        'myfires': () => clicks.myfires(),
        'refresh': () => location.reload(),
        'archive': async () => {
            if (canUse) clicks.archive();
            else utils.marketing(true, 'nav_archive');
        },
        'report': async () => {
            $('li#report').dataset.active = '1';
            map.getCanvas().style.cursor = 'crosshair';
            utils.notify('info', 'Click anywhere on the map to report a <b>NEW</b> fire incident.');
        },
        'measure': () => new Tools().startMeasure(),
        'save': () => saveSession(false, true)
    };

    // run default handlers for on click
    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }

    if ($('body nav .nav-wrapper ul').contains(target)) {
        if (target.closest('li')) $('nav').classList.toggle('open');
    }

    if (contextMenu && !target.contains(contextMenu) && e.target !== contextMenu) {
        contextMenu.remove();
    }

    // hide search results if outside search result container
    if (!target.contains(searchResults) && (target.parentElement && !target.parentElement.contains(searchResults)) && !target.contains($('#q'))) {
        searchResults.style.display = 'none';
        $('#q').value = '';

        searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
    }

    // hide impact panel if outside of container
    if (impact != null && impact.style.display == 'flex' && !impact.contains(e.target) && e.target !== impact && impact.dataset.display !== 'my-content') {
        if (!actionsThatOpenImpact.includes(action) && !$('nav').contains(e.target)) clicks.closeImpact();
    }
});

window.addEventListener('resize', async () => {
    const nav = $('nav'),
        nb = $('#close-navbar');

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
        searchBox = $('#q');

    config.runSearch = false;

    // if the user presses the esc key
    if (e.code == 'Escape') {
        if (isVisible('#modal')) inits.clickListener.closeModal();

        if (isVisible('.popup')) {
            marker?.remove();
            $('.popup')?.remove();
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
            $('#clearSearch').style.display = e.target.value == '' ? 'none' : 'block';
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