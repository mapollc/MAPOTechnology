import { global, metro, constants, layersList, basemaps } from './global.js';
import { ENV, config, getPlatform, disclaimer, siteTitle } from './config.js';
import { Modal } from '../ui/modal.js';
import { geojsonExtent } from '../map/geometry.js';

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

function removeHash() {
    const newUrl = window.location.origin + '/oregonroads' + (window.location.search.search('version') ? window.location.search : '') + window.location.hash;
    window.history.pushState({}, siteTitle, newUrl);
    document.title = siteTitle;
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

    const ready = {
        'road-segment': () =>
            config.dataStatus.rwRetrieved && config.dataStatus.rwisRetrieved && config.dataStatus.incidentsRetrieved &&
            config.dataStatus.roadWorkRetrieved && config.dataStatus.dmsRetrieved && config.dataStatus.webcamsRetrieved,

        'road-report': () => config.dataStatus.rwRetrieved,
        'rwis': () => config.dataStatus.rwisRetrieved,
        'incident': () => config.dataStatus.incidentsRetrieved && global.globalData.incidents.length,
        'construction': () => config.dataStatus.roadWorkRetrieved,
        'dms': () => config.dataStatus.dmsRetrieved,
        'camera': () => config.dataStatus.webcamsRetrieved,
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

    const { ClickListener } = await import('../map/clickListener.js');
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
    if (helpers.storage('layers') == null || JSON.parse(helpers.storage('layers').length != layersList.length)) {
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

window.addEventListener('change', async (e) => {
    const target = e.target;

    // change basemap
    if (target.type == 'radio' && target.name == 'basemap') {
        const bm = target.value;

        global.map.setStyle(bm == 'light' ? basemaps.light : basemaps.dark, {
            diff: false
        });

        helpers.storage('basemap', bm);
    }

    // show or hide layers
    if (target && target.className == 'toggle') {
        const customLayers = [];
        const name = target.dataset.layer;
        const isVisible = target.checked ? 'visible' : 'none';

        const layerGroups = {
            roads: ['roads_path', 'roads_point', 'roads_text', 'roads_point_text'],
            webcams: ['webcams', 'webcams_count'],
            rwis: ['rwis', 'rwis_text'],
            incidents: ['incidents_point', 'incidents_line_bg', 'incidents_line', 'incidents_text'],
            vms: ['dms'],
            construction: ['roadWork_point'],
            wwas: ['wwas_outline', 'wwas_fill'],
            traffic: ['traffic']
        };

        if (layerGroups[name]) {
            layerGroups[name].forEach(l => global.map.setLayoutProperty(l, 'visibility', isVisible));
        }

        if (name === 'radar') {
            if (target.checked) {
                const { Radar } = await import('../data/radar.js');
                new Radar().init();
            } else {
                global.radarPlay = true;

                document.querySelector('.radar')?.remove();
                clearInterval(global.radarAnim);

                global.radarImgs.forEach((_, i) => {
                    global.map.removeLayer(`radar-layer-${i}`).removeSource(`radar-${i}`);
                });
            }
        }

        // Save all toggled layers to localStorage
        document.querySelectorAll('#menu .toggle').forEach(chk => {
            customLayers.push({
                layer: chk.dataset.layer,
                show: chk.checked
            });
        });

        helpers.storage('layers', JSON.stringify(customLayers));
    }

    if (target.id == 'changeRW') {
        const sel = document.querySelector('#changeRW');
        const ops = sel.options[sel.selectedIndex];

        new Modal(helpers.compileReports(ops.text))
            .roadReport(ops.text, ops.value);
    }
});

window.addEventListener('click', async (e) => {
    const target = e.target,
        menu = document.querySelector('#menu');

    // close modal and/or menu
    if (target.id === 'close' && target.parentElement && target.parentElement.id == 'modal') {
        global.modal.style.display = 'none';
        global.modal.innerHTML = '';
        global.modal.classList.remove('full', 'disclaimer');

        removeHash();
    }

    if (target.id === 'close' && target.parentElement && target.parentElement.id == 'menu') {
        menu.style.display = 'none';
    }

    // click on positive CTA button in dialog
    if (target.id == 'pos' && target.classList.contains('cta')) {
        const d = document.querySelector('.dialog');
        if (d?.classList.contains('disclaimer')) {
            helpers.storage('disclaimer', new Date().getTime() / 1000);
        }

        d?.remove();
        document.querySelector('.backdrop').style.display = 'none';
        history.replaceState(null, null, ' ');
    }

    // Toggle favorite status
    if (target.id === 'fav') {
        const isUnfavorite = target.classList.contains('unfavorite');

        target.classList.toggle('favorite', isUnfavorite);
        target.classList.toggle('unfavorite', !isUnfavorite);
        target.setAttribute('title', isUnfavorite ? 'Remove from favorites' : 'Add to favorites');

        config.settings.doFavorites(
            isUnfavorite ? 'add' : 'remove',
            target.dataset.category,
            target.dataset.id,
            target.dataset.title
        );
    }

    /* on search result click */
    if (target.id == 'result') {
        const s = document.querySelector('.search');
        const sr = document.querySelector('.search-results');

        document.querySelector('#search').value = '';
        s.classList.remove('open');
        s.style.display = 'none';
        sr.style.display = 'none';
        sr.innerHTML = constants.noRes;

        if (target.dataset.report) {
            global.map.fitBounds(geojsonExtent(global.roadsArray[target.dataset.pos].geometry), {
                padding: 60
            });
        } else {
            global.map.flyTo({
                center: [target.dataset.lon, target.dataset.lat],
                zoom: 12
            });
        }
    }

    // on area link click
    if (target.id == 'areaLink') {
        const data = target.dataset,
            name = target.innerHTML;

        new Modal(null).updateURI('area', name.toLowerCase().replace('/', '-').replaceAll(' ', '-'), `${name} Area Road Conditions`);

        global.map.flyTo({
            center: [data.lon, data.lat],
            zoom: data.zoom
        });

        document.querySelector('.dialog').remove();
        document.querySelector('.backdrop').style.display = 'none';
    }

    // open webcams from RWIS modal
    if (target.classList.contains('rwisCam')) {
        let geo = null;
        const cams = [];

        global.globalData.webcams.forEach(w => {
            w.properties.cameras
                .filter(c => c.id == target.dataset.id)
                .forEach(camera => {
                    geo = w.geometry.coordinates;
                    cams.push(camera);
                });
        });

        new Modal(cams).webcam(geo);
    }

    if (target.id == 'aboutDialog') {
        const geoEnabled = async () => {
            if (!('permissions' in navigator)) return false;

            try {
                const status = await navigator.permissions.query({ name: 'geolocation' });
                return status.state === 'granted';
            } catch (err) {
                console.error(err);
                return false;
            }
        };
        const geoEnable = await geoEnabled();

        helpers.createDialog('About OregonRoads', `<span style="display:block;color:#555;padding-bottom:0.5em">&copy; ${new Date().getFullYear()} MAPO LLC</span>
            <p style="font-size:15px;margin:1em 0"><b>Version:</b> ${VERISON}<br>
            <b>Build Date:</b> ${helpers.storage('buildDate')}<br>
            <b>Location Enabled:</b> ${geoEnable ? 'Yes' : 'No'}<br>
            <b>Logged In:</b> ${config.settings.user == null ? 'No' : 'Yes'}<br>
            <b>Device:</b> ${navigator.userAgent}</p>
            <span style="display:block;padding-top:0.5em">
                <a href="${config.host}oregonroads?utm_campaign=oregonroads&utm_medium=app&utm_source=user_menu">Learn More</a> &middot;&nbsp;
                <a href="${config.host}about/legal/terms">Terms of Service</a> &middot;&nbsp;
                <a href="${config.host}about/legal/privacy">Privacy Policy</a>
            </span>`);
    }
});

window.addEventListener('mousedown', (e) => {
    const target = e.target;
    const user = document.querySelector('#user');
    const search = document.querySelector('.search');
    const results = document.querySelector('.search-results');
    const dia = document.querySelector('.dialog');
    const menu = document.querySelector('#menu');

    if (e.button !== 0) return;

    // Only close modal if no dialog is open
    if (dia == null) {
        if (!global.modal?.contains(target)) {
            if (helpers.isVisible(global.modal)) {
                global.modal.style.display = 'none';
                global.modal.classList.remove('full', 'disclaimer');
                removeHash();
            }
        }

        if (!menu?.contains(target)) {
            if (helpers.isVisible(menu)) {
                menu.style.display = 'none';
            }
        }
    }

    if (!user.contains(target) && target.closest('#userMenu') === null) {
        document.querySelector('#userMenu')?.remove();
    }

    if (!search.contains(target) && !results.contains(target) && search.style.display === 'flex') {
        search.style.display = 'none';
        results.style.display = 'none';
        results.innerHTML = constants.noRes;
    }
});

window.addEventListener('keyup', (e) => {
    const target = e.target;
    const sr = document.querySelector('.search-results');
    const dia = document.querySelector('.dialog');
    const searchEl = document.querySelector('#search');

    /* close dialog when enter key is pressed */
    if (helpers.isVisible(dia) && (e.code == 'Enter' || e.code == 'Escape')) {
        dia.remove();
        document.querySelector('.backdrop').style.display = 'none';
    } else if (helpers.isVisible(global.modal) && e.code == 'Escape') {
        global.modal.style.display = 'none';
        global.modal.classList.remove('full', 'disclaimer');
        removeHash();
    }

    if (target.id == 'search') {
        const query = searchEl.value.trim().toLowerCase();

        if (query.length >= 2) {
            document.querySelector('.search').classList.add('open');
            sr.style.display = 'block';

            let res = '';

            /* search through all 12-37 reporting stations */
            global.roadsArray.forEach((e, n) => {
                if (e.properties.name.toLowerCase().includes(query)) {
                    res += `<div id="result" data-report="${e.properties.name}" data-pos="${n}">
                        ${e.properties.name}
                        <span>Road Report</span>
                    </div>`;
                }
            });

            /* search through Oregon cities */
            global.cities.forEach((c) => {
                if (c.city.toLowerCase().includes(query)) {
                    res += `<div id="result" data-city="${c.city}" data-lat="${c.lat}" data-lon="${c.lon}">
                        ${c.city}, OR
                        <span>City</span>
                    </div>`;
                }
            });

            sr.innerHTML = res || constants.noRes;
        } else {
            sr.innerHTML = constants.noRes;
        }
    }

    const filterTabular = (tab, cardClass) => {
        const query = target.value.trim().toLowerCase();
        const items = document.querySelectorAll(`.content[data-tab="${tab}"] .${cardClass}-card`);

        items.forEach(item => {
            const text = item.querySelector('h2')?.textContent.toLowerCase();
            const show = query.length === 0 || text.replace(/([a-zA-Z]+)-([0-9]+)?/g, '$1$2').includes(query) || text.includes(query);
            item.style.display = show ? 'flex' : 'none';
        });
    };

    // filter RWIS in tabular report
    if (target.id == 'filterRWIS') {
        filterTabular('rwis', 'rwis');
    }

    // filter road reports in tabular report
    if (target.id == 'filterRW') {
        filterTabular('roads', 'inc');
    }
});