import { global, metro, layersList, basemaps } from './global.js';
import { ENV, config, getPlatform, disclaimer, siteTitle } from './config.js';
import { Modal } from '../ui/modal.js';

import maplibregl from '../map/maplibre.js';

import * as helpers from '../utils/helpers.js';

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

async function preload() {
    await import('../utils/eventListeners.js');

    let usr;
    const versioning = () => {
        if (helpers.storage('version') == null || helpers.storage('version') != VERSION) {
            console.info('Changing web app versions...');
            helpers.storage('version', VERSION);
        }

        if (helpers.storage('buildDate') == null || new Date(helpers.storage('buildDate')).getTime() < new Date(BUILD_DATE).getTime()) {
            helpers.storage('buildDate', BUILD_DATE);
        }
    };

    versioning();

    /*if (!sessionStorage.getItem('user_session')) {
        helpers.api(`${ENV.host}api/v1/session/get`).then(sess => {
            if (!sess) return;

            delete sess.metadata;
            sessionStorage.setItem('user_session', JSON.stringify(sess));
        });
    }*/

    if (window.isAuthUser) {
        const getAcct = await helpers.api(`${ENV.apiURL}user/get/oreroads`, null, false, true);

        if (getAcct?.response) {
            const loginURL = `${ENV.host.replace('//', '//auth.')}login?service=apps&prod=${getPlatform()}&next=${encodeURIComponent(window.location.href)}`;
            helpers.notify('info', `Your session has expired. Please <a href="${loginURL}">login again</a>.`, 3.25);
        } else {
            usr = getAcct?.user;
        }

        // change menu button
        ////if (usr) document.querySelector('#account span').textContent = 'Account';
    } else {
        ////document.querySelector('#save').remove();
    }

    // create settings class based on user profile and settings
    try {
        const { Settings } = await import('./settings.js');
        config.settings = new Settings(usr);
    } catch (err) {
        console.error(err);
    }
}

class Geo {
    constructor(lat, lon, zoom) {
        this.lat = lat;
        this.lon = lon;
        this.zoom = zoom;
    }

    saveLocation() {
        helpers.storage('map_lat', this.lat);
        helpers.storage('map_lon', this.lon);
        helpers.storage('map_zoom', this.zoom);
    }

    getLocation() {
        return [
            helpers.storage('map_lat'),
            helpers.storage('map_lon'),
            helpers.storage('map_zoom')
        ];
    }
}

function saveLoc() {
    new Geo(global.map.getCenter().lat, global.map.getCenter().lng, global.map.getZoom()).saveLocation();
}

async function handleURIIntents() {
    if (!config.queryParams) {
        if (global.modal?.style.display === 'flex') {
            global.modal.style.display = 'none';
            global.modal.classList.remove('full', 'disclaimer');
        }
        return;
    }

    const flyTo = (center, zoom = null) => {
        global.map.flyTo({
            center,
            zoom: zoom ?? global.map.getZoom() + 2.5
        });
    };

    const updateURI = (title = '') => {
        if (title) document.title = `${title} | ${siteTitle}`;
    };

    const { Router } = await import('../data/router.js');
    const router = new Router(config.queryParams);
    const type = router.type();
    const theID = router.id();

    const buildLocationTitle = (p) =>
        `${p.type} @ ${p.location.hwy} MP ${p.location.milepost.start}` +
        (p.location.milepost.end ? `-${p.location.milepost.end}` : '') +
        (p.location.direction ? ` ${p.location.direction}` : '');

    const s = config.dataStatus;

    const ready = {
        'road-segment': () =>
            s.rwRetrieved && s.rwisRetrieved && s.incidentsRetrieved &&
            s.roadWorkRetrieved && s.dmsRetrieved && s.webcamsRetrieved,
        'road-report': () => s.rwRetrieved,
        'rwis': () => s.rwisRetrieved,
        'incident': () => s.incidentsRetrieved && global.globalData.incidents.length,
        'construction': () => s.roadWorkRetrieved,
        'dms': () => s.dmsRetrieved,
        'camera': () => s.webcamsRetrieved,
        'area': () => true,
        'wwa': () => true
    };

    const handlers = {
        'road-segment': async () => {
            const data = JSON.parse(atob(theID));
            const report = helpers.compileReports(data.name);

            const { RoadNetwork } = await import('../data/roads.js');

            new RoadNetwork(
                data.lat,
                data.lon,
                data.hwy
            ).getRange(
                report,
                data.name,
                false
            );
        },
        'road-report': () => {
            const report = global.roads.features.find(r => r.properties.id == theID);
            if (!report) return;

            const name = report.properties.name;
            new Modal(helpers.compileReports(name)).roadReport(name);
        },

        'rwis': () => {
            const f = helpers.fetchRWIS(theID);
            if (!f) return;

            const cams = global.globalData.webcams.filter(cam =>
                global.calculate.distance(
                    f.geometry.coordinates[1],
                    f.geometry.coordinates[0],
                    cam.geometry.coordinates[1],
                    cam.geometry.coordinates[0]
                ) <= 1
            );

            updateURI(`Current Weather: ${f.properties.station.name}`);
            new Modal(f.properties).rwis(cams);
        },

        'incident': () => {
            const inc = helpers.getIncident(theID);

            if (!inc) {
                helpers.createDialog(
                    'Incident Not Found',
                    `We are unable to locate incident #${theID}. It may already be resolved or it doesn't exist.`
                );
                return;
            }

            updateURI(buildLocationTitle(inc.properties));
            new Modal(inc.properties).incident();
        },

        'construction': () => {
            const match = helpers.getIncident(theID, true);
            if (!match) return;

            if (match.geometry.type === 'Point') {
                flyTo(match.geometry.coordinates);
            } else {
                global.map.fitBounds(match.geometry.coordinates);
            }

            updateURI(buildLocationTitle(match.properties));
            new Modal(match.properties).incident();
        },

        'dms': () => {
            if (!global.globalData.varMsgSigns.length) return;

            const sign = global.globalData.varMsgSigns.features.find(s => s.properties.id == theID);
            if (!sign) return;

            flyTo(sign.geometry.coordinates);
            updateURI(sign.properties.name);
            new Modal(sign.properties).vms();
        },

        'camera': () => {
            let geo = null;
            let firstName = '';
            const cams = [];

            global.globalData.webcams.forEach(w => {
                w.properties.cameras.forEach(cam => {
                    if (cam.id == theID) {
                        firstName = cam.name;
                        geo = w.geometry.coordinates;
                        cams.push(cam);
                    }
                });
            });

            if (!geo) return;

            flyTo(geo);
            updateURI(firstName);
            new Modal(cams).webcam(geo);
        },

        'area': () => {
            let area = theID
                .replaceAll('-', ' ')
                .split(' ')
                .map(w => (w === 'to' ? w : w[0].toUpperCase() + w.slice(1)))
                .join(' ');

            if (!theID.includes('to')) area = area.replace(' ', '/');

            const match = metro.find(m => m.name === area);
            if (!match) return;

            global.map.flyTo({
                center: [match.center[1], match.center[0]],
                zoom: match.zoom
            });

            updateURI(`${match.name} Area Road Conditions`);
        },

        'wwa': () => {
            new Modal().wxAlert(theID);
        }
    };

    const intvl = setInterval(() => {
        if (!ready[type]?.()) return;

        handlers[type]?.();
        clearInterval(intvl);
    }, 200);
}

function addMapControls() {
    // add controls
    global.map.addControl(new maplibregl.FullscreenControl({
        container: document.body
    }));

    global.map.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
    }));

    global.map.addControl(new maplibregl.ScaleControl({
        unit: 'imperial'
    }));

    global.map.addControl(
        new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        })
    );
}

async function initializeMap() {
    config.userBaseMap = helpers.storage('basemap') ?? null;
    let mc, mz;

    if (helpers.storage('map_lat') != null) {
        mc = [helpers.storage('map_lon'), helpers.storage('map_lat')];
        mz = helpers.storage('map_zoom');
    } else {
        mc = [-120.5542, 44.10337];
        mz = 6;
    }

    global.map = new maplibregl.Map({
        container: 'map',
        zoom: mz,
        center: mc,
        style: basemaps.light,
        projection: 'mercator',
        hash: true,
        maxPitch: 85,
        pitch: 0,
        bearing: 0,
        attributionControl: true
    });

    addMapControls();

    const { ClickListener } = await import('../map/mapListeners.js');
    const cl = new ClickListener();

    global.map.on('zoomstart', () => {
        global.moving = true;
    });

    global.map.on('movestart', () => {
        global.map.getCanvas().style.cursor = 'grabbing';
        global.moving = true;
    });

    global.map.on('moveend', () => {
        global.map.getCanvas().style.cursor = 'auto';
        saveLoc();
        global.moving = false;
    });

    global.map.on('zoomend', () => {
        saveLoc();
        global.moving = false;
    });

    global.map.on('load', async () => {
        global.map.touchPitch.disable();
        const { Data } = await import('../data/data.js');
        new Data().init();

        await handleURIIntents();
    });

    global.map.on('style.load', async () => {
        const { Style } = await import('../map/style.js');
        new Style(true)
    });

    global.map.on('click', (e) => cl.onMapClickListener(e));
}

function setup() {
    const clearPreviousVersions = () => {
        const currentVersion = VERSION.replaceAll('.', '_');
        const prefix = 'oreroads_';

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);

            if (key?.startsWith(prefix) && !key.includes(currentVersion)) {
                localStorage.removeItem(key);
            }
        }
    };

    // save favorites every 5 minutes
    setInterval(() => {
        config.settings.syncFavorites();
    }, 1000 * 60 * 5);

    // refresh the app every 15 minutes
    setInterval(() => {
        window.location.reload();
    }, 1000 * 60 * 15);

    // log the user's first time on the map
    if (!helpers.storage('firstLoad')) {
        helpers.storage('firstLoad', new Date().getTime() / 1000);
    }

    // show the disclaimer if user hasn't read it before
    if (!helpers.storage('disclaimer')) {
        let t = setInterval(() => {
            if (global.globalData.roadReports.length > 0) {
                clearInterval(t);

                setTimeout(() => {
                    helpers.createDialog('Disclaimer', disclaimer, false, 'I agree');
                    document.querySelector('.dialog').classList.add('disclaimer');
                }, 1000);
            }
        }, 500);
    }

    // clear existing localStorage items if on a new version
    clearPreviousVersions();

    // set default layers for the map for first time user */
    if (helpers.storage('layers') == null || JSON.parse(helpers.storage('layers')).length != layersList.length) {
        const defaultLayers = [];

        layersList.forEach(e => {
            defaultLayers.push({
                layer: e.layer,
                show: e.default
            });
        });

        helpers.storage('layers', JSON.stringify(defaultLayers));
    }
}

export async function startup() {
    const { Calculate } = await import('../utils/calculate.js');
    global.calculate = new Calculate();

    await preload();

    setup();

    await initializeMap();
}