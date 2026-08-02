import './styles/main.css';
import "./styles/app.css";
import "./styles/supp.css";

import { ENV, config, debugMode, tileConfig, fireIcons, loadDispatchCenters } from './app/config.js';
import { global, searchResults, impact } from './app/state.js';

import { stateLabels } from './utils/constants.js';
import * as helper from './utils/helpers.js';
import { ClickListener, ChangeListener } from './utils/listeners.js';

import maplibregl from './map/maplibre.js';
import { ArcGISFeature } from './map/arcgis.js';
import { osm, topofire, terrain, caltopo, Layers } from './map/layers.js';
import * as mapping from './map/mapping.js';
import { toggleLayer } from './map/controls.js';

import { NWS, Weather } from './data/weather.js';
import { Wildfires } from './data/wildfires.js';

import * as components from './ui/components.js';

if (__DEBUG__) {
    Object.defineProperty(window, 'map', {
        get() {
            return global.map;
        }
    });
}

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

//let touchTimer;

String.prototype.ucfirst = function () {
    return `${this.charAt(0).toUpperCase()}${this.slice(1)}`;
};

String.prototype.ucwords = function () {
    const smallWords = new Set(['a', 'an', 'the', 'is', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'with']);
    return this.split(' ').map((word, i) => i === 0 || !smallWords.has(word.toLowerCase()) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(' ');
};

class MFAttribControl extends maplibregl.AttributionControl {
    constructor(options) {
        super(options);

        this._collapseBelow = options.collapseBelow ?? 500;
    }

    onAdd(map) {
        const container = super.onAdd(map);
        map.on('resize', this._applyViewportRule);
        this._applyViewportRule();
        return container;
    }

    onRemove() {
        if (this._map) this._map.off('resize', this._applyViewportRule);
        super.onRemove();
    }

    _applyViewportRule = () => {
        if (!this._map || !this._container) return;

        const width = this._map.getCanvasContainer().offsetWidth;
        const shouldShow = width > this._collapseBelow;

        // Explicitly NOT compact → always open
        if (this.options?.compact === false) {
            this._container.classList.remove('maplibregl-compact', 'maplibregl-compact-show');
            this._container.setAttribute('open', '');
            return;
        }

        // Compact mode is ON (default MapLibre behavior)
        this._container.classList.add('maplibregl-compact');

        if (shouldShow) {
            // Expanded compact attribution
            this._container.classList.add('maplibregl-compact-show');
            this._container.setAttribute('open', '');
        } else {
            // Collapsed compact attribution
            this._container.classList.remove('maplibregl-compact-show');
            this._container.removeAttribute('open');
        }
    };

    _updateAttributions() {
        ////super._updateAttributions();
        this._innerContainer.innerHTML = `<a target="blank" href="https://maplibre.org/">MapLibre</a> | ` +
            `© <a target="blank" href="https://www.esri.com">Esri</a>, ` +
            `© <a target="blank" href="https://mapterhorn.com">Mapterhorn</a>, ` +
            `© <a target="blank" href="https://carto.com/about-carto/" rel="noopener">CARTO</a>, ` +
            `© <a target="blank" href="http://www.openstreetmap.org/about/">OpenStreetMap</a> contributors`;
    }
}

async function getCounties() {
    if (!global.map.getSource('counties')) {
        new ArcGISFeature('counties', global.map, {
            //url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized_Boundaries/FeatureServer/0',
            url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0',
            precision: 6,
            where: '1=1',
            outFields: 'NAME,STATE_ABBR AS STATE,FIPS,POPULATION,SQMI'
        });
    }

    if (!global.map.getLayer('counties')) {
        global.map.addLayer({
            id: 'counties',
            source: 'counties',
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

    /*if (!global.map.getLayer('county-boundaries')) {
        global.map.addLayer({
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

    /*global.map.addSource('property_lines', {
        type: 'raster',
        minzoom: 15,
        tiles: ['https://tiles.arcgis.com/tiles/KzeiCaQsMoeCfoCq/arcgis/rest/services/Regrid_Nationwide_Parcel_Boundaries_v1/MapServer/tile/{z}/{y}/{x}'],
        attribution: '&copy; Regrid'
    });

    global.map.addLayer({
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
    let evacBtn = document.querySelector('.evacBtn');

    if (!evacBtn) {
        evacBtn = document.createElement('button');
        evacBtn.className = 'control evacBtn ttip';
        evacBtn.dataset.action = 'evac_list';
        evacBtn.dataset.tooltip = 'Evacuations';
    }

    if (useBottom === global.inits.controlsAtBottom) return;
    global.inits.controlsAtBottom = useBottom;

    const list = useBottom ? [...global.mapControls].reverse() : global.mapControls;
    global.mapControls.filter(c => global.map.hasControl(c)).forEach(c => global.map.removeControl(c));
    list.forEach(c => global.map.addControl(c, useBottom ? 'bottom-right' : 'top-right'));

    const c = ['fullscreen', 'zoom-in', 'zoom-out', 'compass', 'geolocate'],
        t = ['Enter fullscreen', 'Zoom in', 'Zoom out', 'Reset bearing to north', 'Find my location'];

    for (let i = 0; i < c.length; i++) {
        const it = document.querySelector(`.maplibregl-ctrl-${c[i]}`);
        if (!it) continue;

        it.classList.add('ttip');
        it.dataset.tooltip = t[i];
    }

    evacBtn.remove();

    if (useBottom) {
        const parent = document.querySelector('.maplibregl-ctrl-bottom-right');
        let container = parent.querySelector('.custom-ctrl');

        if (!container) {
            container = document.createElement('div');
            container.className = 'maplibregl-ctrl maplibregl-ctrl-group custom-ctrl';
        }

        container.prepend(evacBtn);
        parent.prepend(container);
    } else {
        document.querySelector('.filter-controls').appendChild(evacBtn);
    }

    const to = setInterval(() => {
        if (global.inits.evacuations?.evacsLoaded) {
            global.inits.evacuations?.evacHelper();
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
        if (global.map.hasImage(id) || global.loadingImages.has(id)) return; // added: prevent duplicate loads

        global.loadingImages.add(id); // added

        try {
            const img = await global.map.loadImage(`${ENV.domain}assets/images/icons/${path}`);
            if (!global.map.hasImage(id)) global.map.addImage(id, img.data);
        } catch (e) {
            console.error(`Failed to load image: ${id}`, e); // added
        } finally {
            global.loadingImages.delete(id); // added
        }
    }));
}

function newFiresReport() {
    let content = document.createElement('ul');
    content.classList.add('new_fires');

    global.dataView.newFires
        .sort((a, b) => Number(b.properties.acres ?? 0) - Number(a.properties.acres ?? 0))
        .forEach(fire => {
            const li = document.createElement('li'),
                name = `${fire.properties.name.replace(' Fire', '')}${(fire.properties.type == 'Wildfire' ? ' Fire' : '')}`,
                near = fire.properties.near,
                size = global.conversion.sizeFormat(fire.properties.acres);

            li.dataset.action = 'new-fires';
            li.dataset.lat = fire.geometry.coordinates[1];
            li.dataset.lon = fire.geometry.coordinates[0];
            li.innerHTML = `<div class="pert"><h3>${name}</h3><span class="near">${near}</div></div><span class="disc">${size}</span>`;
            content.appendChild(li);
        });

    helper.createDataForm('New, Fast Growing Fires', content.outerHTML);
}

async function initializeMap() {
    // initialize the layers manager
    const [{ Layers }, { Convert }] = await Promise.all([
        import('./map/layerManager.js'),
        import('./utils/convert.js')
    ]);

    config.layersHandler = new Layers();
    global.conversion = Convert;

    const mapConfig = config.settings.map(),
        startLat = mapConfig.lat,
        startLon = mapConfig.lon;

    global.map = new maplibregl.Map({
        container: 'map',
        zoom: mapConfig.zoom,
        center: [startLon, startLat],
        style: config.tiles[config.settings.getBasemap()],
        projection: 'mercator',
        hash: true,
        maxPitch: 85,
        pitch: mapConfig.pitch ?? 0,
        bearing: mapConfig.bearing ?? 0,
        attributionControl: false
    });

    global.mapControls.push(new maplibregl.FullscreenControl({
        container: document.body
    }));

    global.mapControls.push(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    }));

    global.mapControls.push(new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        fitBoundsOptions: {
            maxZoom: 10.16
        },
        trackUserLocation: true,
        showUserHeading: true
    }));

    global.map.addControl(
        new MFAttribControl({
            compact: true,
            collapseBelow: 920
        }),
        'bottom-right'
    );

    global.map.addControl(
        new maplibregl.ScaleControl({
            unit: 'imperial'
        }),
        'bottom-left'
    );

    addDynamicControls();

    // add map controls
    global.map.once('load', async () => {
        global.map.getCanvas().setAttribute('role', 'region');
        global.map.getCanvas().ariaLabel = document.querySelector('meta[name=description]').content;
    });

    global.map.once('styledata', () => {
        const loading = document.querySelector('.loading');

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
            document.querySelector('.filter-controls .search').style.display = 'inline-flex';
        }

        if (global.map.getLayer('evac') && global.map.getLayer('perimeters_fill')) {
            global.map.moveLayer('evac', 'perimeters_fill');
        }
    });

    // handle on map style loaded event
    global.map.on('style.load', async () => {
        // add banner for archived maps to let the user know
        if (config.settings.archive) {
            const b = document.createElement('div');
            b.classList.add('message', 'banner');
            b.innerHTML = `<a href="#" title="Return to current fires" data-action="close-historical"><i class="fas fa-xmark"></i></a>
            <span>You are viewing a historical wildfire map for <b><u>${config.settings.archive}</u></b></span>`;

            document.body.appendChild(b);
        }

        global.map.setSky(config.fog);

        // add fire icons
        loadMapIcons();

        // overlay counties
        getCounties();

        // add terrain on contour lines
        config.layersHandler.addTerrain();

        // if user has settings saved, go to their saved location...not the mapbox hash location
        if (window.location.hash) {
            const h = window.location.hash.replace('#', '').split('/');

            if (config.settings.map().lat == h[1] && config.settings.map().lon == h[2] && config.settings.map().zoom == h[0]) {
                global.map.easeTo({
                    center: [config.settings.map().lon, config.settings.map().lat],
                    zoom: config.settings.map().zoom,
                    duration: 1000
                });
            }
        }

        // ?marker in the URL indicates that the user wants a marker on the map at the location specified by the url hash
        if (window.location.search.includes('marker')) {
            global.marker = new maplibregl.Marker()
                .setLngLat(global.map.getCenter())
                .addTo(global.map);

            global.marker.getElement().addEventListener('click', (e) => {
                global.marker?.remove();
                e.stopPropagation();
            });
        }

        // function to provide a popup soliciting donations, subscriptions, etc.
        if (!config.settings.subscriptions().valid()) setTimeout(async () => { components.marketing(); }, 3000);

        // zoom to that country if URL contains country/{theCountry}
        if (country) {
            const bounds = {
                'austrailia': { c: [133.7751, -25.2744], z: 3.5 },
                'canada': { c: [-106.3468, 56.1304], z: 4.2 }
            }[country.toLowerCase()];

            global.map.easeTo({ center: bounds.c, zoom: bounds.z, duration: 1000 });
        }

        // zoom to that state if URL contains state/{theState}
        if (state) {
            Object.keys(stateLabels).forEach(e => {
                if (stateLabels[e].name == state) {
                    global.map.easeTo({
                        center: stateLabels[e].center,
                        zoom: 5.8,
                        duration: 1000
                    });
                }
            });
        }

        // processing layers on startup
        config.layersHandler.init();
        config.wildfire.getWildfires();
        config.wildfire.perimeters();

        const excludeTheseLayers = ['newFires', 'allFires', 'smokeChecks', 'rxBurns', 'perimeters'];
        const cbox = config.settings.checkboxes();

        if (cbox) {
            cbox.filter(c => !excludeTheseLayers.includes(c))
                .forEach(c => toggleLayer({ id: c, checked: true }));
        }
    });

    // handle on map error event
    global.map.on('error', (e) => {
        console.error('MapLibre error:', e.error);
        //if (e && e.error.status != 500) { }
    });

    // re-load map icons if they're missing on initialize load
    global.map.setMissingStyleImageResolver(_ => loadMapIcons());

    // handle on map zoom end event
    global.map.on('zoomend', () => {
        // if a layer requires a minimum zoom, and the layers menu is open, toggle opacity
        if (impact.style.display != 'none' && impact.dataset.display == 'layers') {
            impact.querySelectorAll('.content li').forEach(li => {
                const isLow = global.map.getZoom() < li.dataset.minZoom;

                li.classList.toggle('more-zoom', isLow);
                li.title = isLow ? 'You must be zoomed in more' : li.querySelector('label').innerText;
            });
        }

        // control whether FS roads show on the map based on the zoom level
        if (config.settings.isEnabled('roads')) {
            if (!global.map.getLayer('roads')) config.layersHandler.roads();

            if (global.map.getLayer('roads')) global.map.setLayoutProperty('roads', 'visibility', global.map.getZoom() <= 11 ? 'none' : 'visible');
        }

        // control whether modis hotspots show on the map based on the zoom level
        [{ n: '24', w: 1 }, { n: '48', w: 2 }, { n: '72', w: 3 }].forEach(item => {
            const name = `modis${item.n}`,
                vis = global.map.getLayer(name) ? 'visible' : 'visible';

            if (config.settings.isEnabled(name)) {
                if (!global.map.getLayer(name)) config.layersHandler.modis(item.w);

                global.map.setLayoutProperty(name, 'visibility', global.map.getZoom() < config.modisZoomLevel ? 'none' : vis);
            }
        });
    });

    // handle on map click events
    global.map.on('click', async (e) => {
        const crds = e.lngLat;

        // open new incident report form
        if (document.querySelector('li#report').dataset.active == 1) {
            config.disableClicks = true;

            global.map.getCanvas().style.cursor = 'auto';
            global.map.panTo([crds.lng, crds.lat]);

            components.startReportProcess(e);
        }

        // get fire weather forecast
        if (document.querySelector('li#fwf')) {
            if (document.querySelector('li#fwf').dataset.active == 1) {
                config.disableClicks = true;
                document.querySelector('li#fwf').dataset.active = '0';

                global.map.getCanvas().style.cursor = 'auto';

                new Weather(crds.lat, crds.lng).fireWxFcst();
            }
        }

        // click listener for when the user isn't submitting a report or getting a fwf
        if (!config.disableClicks) mapping.onMapClick(e);
    });

    global.map.on('contextmenu', async (e) => {
        e.preventDefault();
        mapping.contextMenu(e);
    });

    /*global.map.getContainer().addEventListener('touchstart', async (e) => {
        touchTimer = setTimeout(async () => {
            e.preventDefault();
            e.stopPropagation();

            mapping.contextMenu(e, true);
        }, 1000);
    });

    global.map.getContainer().addEventListener('touchend', () => clearTimeout(touchTimer));
    global.map.getContainer().addEventListener('touchmove', () => clearTimeout(touchTimer));*/

    // handle on start map move event
    global.map.on('movestart', () => {
        async function clearRadarCache() {
            new ClickListener().radarStop();

            global.radar.loadedPositions.forEach(pos => {
                if (pos !== global.radar.animationPosition) {
                    var layerId = `radar-layer-${pos}`;
                    var sourceId = `radar-${pos}`;

                    if (global.map.getLayer(layerId)) global.map.removeLayer(layerId);
                    if (global.map.getSource(sourceId)) global.map.removeSource(sourceId);
                }
            });
            global.radar.loadedPositions.clear();
            global.radar.loadedPositions.add(global.radar.animationPosition);
        }

        if (config.settings.checkboxes().includes('radar')) clearRadarCache();

        global.map.getCanvas().style.cursor = 'grabbing';
        /*startLat = global.map.getCenter().lat;
        startLon = global.map.getCenter().lng;*/
    });

    // handle on end map move event
    global.map.on('moveend', async () => {
        global.map.getCanvas().style.cursor = 'auto';
        mapping.moveEnd();
    });
}

function upgrade() {
    const items = ['dispatch', 'dispatch_time', 'impactScroll', 'marketing', 'version', 'clicks', 'tracked'];

    items.forEach(item => {
        const v = helper.storage(item);

        if (v != null) {
            helper.storage(`mapofire.${item}`, v);
            localStorage.removeItem(item);
        }
    });
}

async function restoreState() {
    const pathName = window.location.pathname.replace('/beta', '');
    const pathParts = pathName.split('/').filter(Boolean);
    const getPathPart = (index) => pathParts[index] ?? null;

    async function goToPerimeter(incId) {
        const data = await helper.api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query', [
            ['where', `attr_UniqueFireIdentifier = '${incId}'`],
            ['returnCentroid', true],
            ['returnGeometry', false],
            ['f', 'json']
        ]);

        const coords = data?.features?.[0]?.centroid;

        if (coords) {
            global.map.easeTo({
                center: [coords.x, coords.y],
                zoom: 9.5,
                duration: 0
            });
        }
    }

    // if user is trying to view historical fires without a subscription
    if (!config.settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM) && window.location.href.match(/archive\/([0-9]+)/g) != null) {
        components.notify('info', 'You must upgrade to view historical fires. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="archive_snackbar">Get access</a>', 6);
    }

    // if loggedOut=1 is a query parameter
    if (/loggedOut=1/.test(window.location.href)) {
        components.notify('success', 'You were successfully logged out.');
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
                if (id) new NWS().readWWA(id, false);
                break;
            }
            case 'current': {
                if (id) new Weather().findWXStn(id);
                break;
            }
            case 'outlook': {
                const day = getPathPart(3);
                if (id && day) new NWS().getOutlookText(id, day, false);
                break;
            }
            case 'forecast': {
                if (!id) return;

                const [lat, lon] = id.split(',').map(Number);
                const isValid = lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

                if (isValid && config.settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
                    new Weather(lat, lon).fireWxFcst();
                } else {
                    helper.unsetHeaders();
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

async function preload() {
    let usr;
    const versioning = () => {
        const sv = helper.storage('mapofire.version'),
            lv = helper.storage('mapofire.layers_version');

        if (sv == null || sv != VERSION) helper.storage('mapofire.version', VERSION);
        if (lv == null || lv != layers.build) helper.storage('mapofire.layers_version', layers.build);
    };

    versioning();

    // create a list of layers
    config.listOfLayers.push(...Object.keys(layers.categories).flatMap(id => layers.layers[id]));

    // get the user's IP address and UUID from the server (DONT BLOCK UI THREAD)
    if (!sessionStorage.getItem('mapofire.user_session')) {
        helper.api(`${ENV.host}api/v1/session/get`).then(sess => {
            delete sess.metadata;
            sessionStorage.setItem('mapofire.user_session', JSON.stringify(sess));
        });
    }

    if (window.isAuthUser) {
        const getAcct = await helper.api(`${ENV.host}api/v1/user/get/mapofire`, null, false, true);

        if (getAcct?.response) {
            const loginURL = `${ENV.domain.replace('//', '//auth.')}login?service=${config.getPlatform()}&next=${encodeURIComponent(window.location.href)}`;
            components.notify('info', `Your session has expired. Please <a href="${loginURL}">login again</a>.`, 3.25);
        } else {
            usr = getAcct?.user;
        }

        // change menu button
        if (usr) document.querySelector('#account span').textContent = 'Account';
    } else {
        document.querySelector('#save').remove();
    }

    // show the nav menu
    document.querySelector('nav ul').style.display = 'flex';

    // show the "close navbar" menu when screen width > 600px
    if (window.innerWidth > 600) document.querySelector('#close-navbar').classList.add('show');

    // create settings class based on user profile and settings
    try {
        const { Settings } = await import('./app/settings.js');
        config.settings = new Settings(usr);
    } catch (err) {
        console.error(err);
    }

    // get top clicked fires
    helper.api(`${ENV.apiURL}events?test=1`, [['limit', 6]], (config.settings.getUser().uid() == 1 ? true : false))
        .then(data => {
            if (data.top) {
                global.dataView.topFires = data.top;
            }
        });

    // todo: uuuhhhhhh idk
    if (config.settings.getUser().role() !== config.PERMISSION_LEVELS.ADMIN) {
        document.querySelector('.filter-controls').addEventListener('contextmenu', (e) => e.preventDefault());
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
    config.wildfire = new Wildfires();
    ['getTrackedFires', 'getBushfireNames'].forEach(fn => config.wildfire[fn]());
}

async function initializeUI() {
    const q = document.querySelector('#q');

    // if the user is on an Android device, show the download app banner
    const recommendPlay = localStorage.getItem('recommend_google_play');
    if (/android/.test(navigator.userAgent.toLowerCase()) && (!recommendPlay || config.curTime.getTime() - recommendPlay > 259200000)) {
        document.querySelector('.android-banner').style.display = 'flex';
    }

    impact.addEventListener('scroll', () => {
        helper.storage('mapofire.impactScroll', impact.scrollTop);
    });

    q.disabled = false;
    q.addEventListener('blur', () => global.inits.trending = false);
    q.addEventListener('focus', async () => {
        if (q.value == '' && !global.inits.trending && searchResults.querySelectorAll('li.trending').length == 0) {
            const { addTrending } = await import('./ui/search.js');
            addTrending();
        }
    });

    // attach tooltip binders to class
    const tooltip = new components.Tooltips({ followMouse: false });
    tooltip.attach('.ttip', (el) => el.dataset.tooltip);

    // add incident worker
    ////getWorker('incident');
}

export async function startup() {
    global.inits.clickListener = new ClickListener();

    // preload app info
    await preload();

    // get dispatch centers then initialize map & check pop state
    await loadDispatchCenters();
    await initializeMap();
    await restoreState();

    // finish startup
    await initializeUI();

    startBackgroundServices();
}

async function startBackgroundServices() {
    upgrade();

    //// keep a log of all console messages during the session
    /////window.logger = new Mapolytics({ batchSize: 25, maxLogs: 250, flushInterval: 60000 });

    // save settings automatically after the first 10 seconds, 
    // then every 5 minutes, whether to the session or user account
    setTimeout(function () {
        helper.saveSession(true, false);

        setInterval(() => {
            if (document.visibilityState === 'visible') helper.saveSession(true, false);
        }, config.settings.get().saveFreq());
    }, 90000);

    // send fire click data to server for processing every 20 secs
    setInterval(() => {
        config.wildfire?.commitLog();
    }, 20000);

    // reload the map automatically every 5 minutes
    setInterval(() => {
        location.reload();
    }, 300000);

    // add service worker to handle additional js execution
    if (!__DEBUG__ && 'serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register(`/dist/${VERSION}/service-worker.js`, {
                type: 'module'
            });
        } catch (err) {
            console.error('Service worker registration failed:', err);
        }
    }
};

// click event listener
window.addEventListener('click', async (e) => {
    const target = e.target,
        contextMenu = document.querySelector('.context-menu'),
        actionsThatOpenImpact = ['account', 'basemap', 'layers', 'legend', 'myfires', 'tools', 'back-my-content'],
        actionElement = target.closest('[data-action]'),
        action = actionElement ? actionElement.dataset.action : null,
        canUse = config.settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM);
    //canUse = config.settings.subscriptions().valid() || config.settings.getUser().role() == config.PERMISSION_LEVELS.ADMIN;

    const clicks = new ClickListener(target, searchResults);

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
        'popupToInc': () => config.wildfire.incident(target.dataset?.wfid, false),
        'close-navbar': () => clicks.closeNavbar(),
        'clear-layer-search': () => clicks.clearLayerSearch(),
        'dropdown-nav': () => document.querySelector('nav').classList.toggle('open'),
        'new-fires': () => clicks.newFire(),
        'readSPC': async () => {
            const ds = target.dataset;
            new NWS().getOutlookText(ds.type, ds.day);
        },
        'marketing-cta': () => clicks.mcta(),
        /*'upgrade-subscription': async () => {
            gtag('event', 'subscription_cta_click', {
                'event_category': 'Subscription',
                'event_label': e.target.dataset.medium,
                'source': e.target.dataset.medium
            });
 
            window.location.href = components.purchaseLink(e.target.dataset.medium);
        },*/
        'incident_wx-fwf': () => new Weather(e.target.dataset.lat, e.target.dataset.lon).fireWxFcst(),
        'sharer': () => clicks.sharer(),
        'radar-control': () => clicks.radarPausePlay(),
        'trackFire': () => clicks.follow(),
        'readWWA': async () => new NWS().readWWA(target.dataset.id),
        'account': () => clicks.account(),
        'new_fires': () => newFiresReport(),
        'evac_list': () => global.inits.evacuations?.clickListener(),
        'goToEvacPoly': () => global.inits.evacuations?.zoomTo(target),
        'basemap': () => clicks.basemaps(),
        'layers': () => clicks.showLayers(),
        'legend': () => clicks.legend(),
        'spc-climo': () => clicks.spcClimo(),
        'changeSPCDate': () => clicks.changeSPCDate(),
        'fwf': async () => {
            if (canUse) {
                document.querySelector('li#fwf').dataset.active = '1';
                global.map.getCanvas().style.cursor = 'crosshair';
                components.notify('info', 'Click anywhere on get the fire weather forecast.');
            } else {
                components.marketing(true, 'nav_fwf');
            }
        },
        'myfires': () => clicks.myfires(),
        'refresh': () => location.reload(),
        'archive': async () => {
            if (canUse) clicks.archive();
            else components.marketing(true, 'nav_archive');
        },
        'report': async () => {
            document.querySelector('li#report').dataset.active = '1';
            global.map.getCanvas().style.cursor = 'crosshair';
            components.notify('info', 'Click anywhere on the map to report a <b>NEW</b> fire incident.');
        },
        'save': () => helper.saveSession(false, true),
        'socialShare': () => clicks.socialShare(target.dataset.social)
    };

    // run default handlers for on click
    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }

    if (document.querySelector('body nav .nav-wrapper ul').contains(target)) {
        if (target.closest('li')) document.querySelector('nav').classList.toggle('open');
    }

    if (contextMenu && !target.contains(contextMenu) && e.target !== contextMenu) {
        contextMenu.remove();
    }

    // hide search results if outside search result container
    if (!target.contains(searchResults) && (target.parentElement && !target.parentElement.contains(searchResults)) && !target.contains(document.querySelector('#q'))) {
        searchResults.style.display = 'none';
        document.querySelector('#q').value = '';

        searchResults.querySelectorAll('li:not(.standby)').forEach(li => li.remove());
    }

    // hide impact panel if outside of container
    if (impact != null && impact.style.display == 'flex' && !impact.contains(e.target) && e.target !== impact && impact.dataset.display !== 'my-content') {
        if (!actionsThatOpenImpact.includes(action) && !document.querySelector('nav').contains(e.target)) clicks.closeImpact();
    }
});

// on form submission
window.addEventListener('submit', async (e) => {
    // submit user NEW INCIDENT form
    if (e.target.id == 'newReport') {
        e.preventDefault();

        const form = document.querySelector('form#newReport');
        let error = false,
            errorMsg = '';

        document.querySelector('#nrerrors')?.remove();

        // error checking
        if (form.querySelector('select[name=type]').options[form.querySelector('select[name=type]').selectedIndex].value == '- Choose -') {
            error = true;
            errorMsg += '<li>Please choose an incident type</li>';
        }

        if (form.querySelector('input[name=size]').value == '') {
            error = true;
            errorMsg += '<li>Please estimate the size of the fire (even if it\'s 0)</li>';
        } else if (!form.querySelector('input[name=size]').value.match(/([0-9.]+)/)) {
            error = true;
            errorMsg += '<li>Your incident size cannot contain non-numeric characters</li>'
        }

        if (form.querySelector('textarea[name=notes]').value == '') {
            error = true;
            errorMsg += '<li>Please provide some details about this incident</li>';
        }

        if (error === true) {
            form.insertAdjacentHTML('afterbegin', `<ul id="nrerrors" style="margin: 0 0 1em 1em;font-size:14px;color:var(--red)">${errorMsg}</ul>`);
        } else {
            if (confirm('Are you sure this is a new incident? If so, click "OK." Otherwise, please click "Cancel."')) {
                const sub = form.querySelector('input[type=submit]'),
                    canc = form.querySelector('.btn-group a'),
                    fd = [],
                    ent = new URLSearchParams(new FormData(form).entries());

                let type, state;

                document.querySelector('li#report').dataset.active = '0';
                sub.disabled = true;
                sub.value = 'Submitting...';
                canc.style.display = 'none';

                for (const [key, value] of ent) {
                    fd.push([key, value]);
                    if (key == 'type') type = value;
                    if (key == 'state') state = value;
                }

                const send = await helper.api(`${ENV.apiURL}newReport`, fd);

                if (send.success == 1) {
                    gtag('event', 'submit_report', {
                        type: type,
                        state: state.split(' / ')[1],
                        platform: 'web'
                    });

                    setTimeout(async () => {
                        document.querySelector('#data-form').remove();
                        components.notify('success', 'Your report was sent to us for review before it may be added to the map.');
                    }, 500);
                } else {
                    sub.disabled = false;
                    sub.value = 'Submit Report';
                    canc.style.display = 'block';

                    components.notify('error', 'There was an error submitting your report. Please try again.');
                }
            }
        }
    }
});

// on input change
window.addEventListener('input', (e) => {
    // perimeter min size change text
    if (e.target.parentElement.id == 'perimeterSize' && e.target.classList.contains('slider')) {
        document.querySelector('#pSize').innerHTML = `${e.target.value} acres`;
    }
});

// on change listener
window.addEventListener('change', async (e) => {
    const target = e.target,
        changeListener = new ChangeListener(target);

    const actionElement = target.closest('[data-action]'),
        action = actionElement ? actionElement.dataset.action : null,
        actionHandlers = {
            'change-basemap': () => changeListener.changeBasemap(),
            'change-perim-size': () => changeListener.minPerimSize(),
            'toggle-layer': () => changeListener.toggle(),
            'erc_time': () => {
                config.settings.updateSpecial();
                config.layersHandler.erc(false, true);
            },
            'sfc_smoke_time': () => changeListener.smoke(true),
            'vi_smoke_time': () => changeListener.smoke(false),
            'spc-outlook': () => changeListener.spc(),
            'ndfd': async () => {
                config.settings.updateSpecial();
                new NWS().ndfd(true, target.id);
            },
            'spcDates': () => changeListener.spcClimo(),
            'sfp-date': () => {
                config.settings.updateSpecial();
                config.layersHandler.sfp(true);
            },
            'user-setting': () => changeListener.personalize(),
            'archive_years': () => changeListener.archive()
        };

    if (action != null && actionHandlers[action]) {
        actionHandlers[action]();
    }
});

window.addEventListener('resize', async () => {
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

    helper.debounce(addDynamicControls, 150)();
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
        if (helper.isVisible('#modal')) global.inits.clickListener.closeModal();

        if (helper.isVisible('.popup')) {
            global.marker?.remove();
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
window.addEventListener('keyup', helper.debounce((e) => {
    (async () => {
        if (/^(Arrow|Shift|Control|Alt|Tab|CapsLock|Escape)/.test(e.key)) return;

        if (e.target.id == 'q' && config.runSearch) {
            document.querySelector('#clearSearch').style.display = e.target.value == '' ? 'none' : 'block';
            const { Search } = await import('./ui/search.js');

            new Search(e.target.value).do();

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

window.addEventListener('popstate', () => restoreState());

window.addEventListener('focus', e => { if (e.target?.id == 'q') searchResults.style.display = 'flex'; });