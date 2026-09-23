import { ENV, config, getPlatform, tileConfig } from './config.js';
import { global } from './state.js';

import * as helper from '../utils/helpers.js';

import maplibregl from '../map/maplibre.js';
import * as mapBasemaps from '../map/layers.js';
import { MFAttribControl, TerrainControl, updateTaxonomy } from '../map/controls.js';

if (__DEBUG__) {
    Object.defineProperty(window, 'map', {
        get() {
            return global.map;
        }
    });

    Object.defineProperty(window, 'global', {
        get() {
            return global;
        }
    });

    Object.defineProperty(window, 'config', {
        get() {
            return config;
        }
    });
}

config.tiles = {
    outdoors: `${ENV.apiURL}maps/style/terrain?key=${config.apiKey()}`,
    satellite: `${ENV.apiURL}maps/style/satellite?key=${config.apiKey()}`,
    osm: mapBasemaps.osm,
    fs16: `${ENV.apiURL}maps/style/usfs?key=${config.apiKey()}`,
    caltopo: mapBasemaps.caltopo,
    terrain: mapBasemaps.terrain,
    topofire: mapBasemaps.topofire,
    voyager: `${ENV.apiURL}maps/style/voyager?key=${config.apiKey()}`,
    dark: `${ENV.apiURL}maps/style/dark?key=${config.apiKey()}`
};

async function loadMapIcons() {
    const queue = [
        ...mapBasemaps.icons.map(i => ({ id: `icon-${i}`, path: i }))
    ];

    await Promise.all(queue.map(async ({ id, path }) => {
        if (global.map.hasImage(id) || global.loadingImages.has(id)) return;

        global.loadingImages.add(id);

        try {
            const img = await global.map.loadImage(`${ENV.cdn}icons/${path}.png`);
            if (!global.map.hasImage(id)) global.map.addImage(id, img.data);
        } catch (e) {
            console.error(`Failed to load image: ${id}`, e);
        } finally {
            global.loadingImages.delete(id);
        }
    }));
}

export async function addDynamicControls() {
    const useBottom = window.innerWidth <= 500;

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
}

function addFilterDropdowns() {
    const w = document.createElement('div');
    const b = document.createElement('button');
    const u = document.createElement('ul');

    w.classList.add('dropdown-button');

    u.classList.add('list', 'control');
    u.dataset.dd = 'activities';

    ['All Activities', ...config.activities.trail, ...config.activities.snow]
        .sort()
        .forEach((value, index) => {
            const isTrail = config.activities.trail.includes(value);
            const li = document.createElement('li');

            li.textContent = value;
            if (index === 0) li.classList.add('active');

            li.addEventListener('click', (e) => {
                e.stopPropagation();

                u.querySelectorAll('li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');

                b.querySelector('.label').textContent = value;

                updateTaxonomy(isTrail, index, value);

                b.classList.remove('expand');
            });

            u.appendChild(li);
        });

    b.classList.add('dd', 'control');
    b.dataset.dd = 'activities';

    b.innerHTML = `<i class="fas fa-filter-list" style="color:#3e3e3e"></i>
        <span class="label">All Activities</span>
        <span class="arrow" style="z-index:0"></span>`;

    b.addEventListener('click', () => b.classList.toggle('expand'));
    b.appendChild(u);
    w.appendChild(b);

    document.querySelector('.filter-controls').appendChild(w);
}

async function initializeMap() {
    const [{ Layers }, { Convert }] = await Promise.all([
        import('../map/layerManager.js'),
        import('../utils/convert.js')
    ]);

    global.conversion = Convert;
    config.layersHandler = new Layers();

    const mapConfig = config.settings.map(),
        startLat = mapConfig.lat,
        startLon = mapConfig.lon;

    global.map = new maplibregl.Map({
        container: 'map',
        zoom: mapConfig.zoom,
        center: [startLon, startLat],
        style: config.tiles[config.settings.map().basemap],
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

    global.mapControls.push(new TerrainControl());

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

        // add any icons
        loadMapIcons();
    });

    global.map.once('styledata', async () => {
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

        // initialize trails
        const { Trails } = await import('../data/trails.js');
        global.trails = new Trails();
    });

    // handle on map style loaded event
    global.map.on('style.load', async () => {
        global.map.setSky(config.fog);

        // overlay counties
        config.layersHandler.getCounties();

        // add terrain on contour lines
        if (config.settings.map().is3D) config.layersHandler.addTerrain();

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

        addFilterDropdowns();
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

    });

    // handle on map click events
    global.map.on('click', async (e) => {
        const mapping = await import('../map/mapping.js');
        mapping.onMapClick(e);
    });

    // handle on end map move event
    global.map.on('moveend', async () => {
        global.map.getCanvas().style.cursor = 'auto';
    });
}

async function preload() {
    let usr;
    const versioning = () => {
        const sv = helper.storage('mapotrails.version');

        if (sv == null || sv != VERSION) helper.storage('mapotrails.version', VERSION);
    };

    versioning();

    if (!sessionStorage.getItem('mapotrails.user_session')) {
        helper.api(`${ENV.host}api/v1/session/get`).then(sess => {
            if (!sess) return;

            delete sess.metadata;
            sessionStorage.setItem('mapotrails.user_session', JSON.stringify(sess));
        });
    }

    if (window.isAuthUser) {
        const getAcct = await helper.api(`${ENV.host}api/v1/user/get/mapotrails`, null, false, true);

        if (getAcct?.response) {
            const loginURL = `${ENV.domain.replace('//', '//auth.')}login?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}`;
            helper.notify('info', `Your session has expired. Please <a href="${loginURL}">login again</a>.`, 3.25);
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
        const { Settings } = await import('./settings.js');
        config.settings = new Settings(usr);
    } catch (err) {
        console.error(err);
    }
}

export async function startup() {
    await preload();

    await initializeMap();

    await import('./events.js');

    setTimeout(() => {
        helper.saveSession(true, false);

        setInterval(() => {
            if (document.visibilityState === 'visible') helper.saveSession(true, false);
        }, 60 * 5 * 1000);
    }, 90000);
}