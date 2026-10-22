import { global, constants, basemaps } from '../app/global.js';
import { config, siteTitle } from '../app/config.js';
import { Modal } from '../ui/modal.js';
import { geojsonExtent } from '../map/geometry.js';

import * as helpers from '../utils/helpers.js';

function removeHash() {
    const newUrl = window.location.origin + '/oregonroads' + (window.location.search.search('version') ? window.location.search : '') + window.location.hash;
    window.history.pushState({}, siteTitle, newUrl);
    document.title = siteTitle;
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
            roads: ['roads_path', 'roads_point', 'roas_text', 'roads_point_text'],
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

    if (target.closest('li') === 'userSync') {
        config.settings.syncFavorites(true);
        return true;
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
                padding: 60,
                duration: 2000
            });
        } else {
            global.map.flyTo({
                center: [target.dataset.lon, target.dataset.lat],
                zoom: 12
            });
        }
    }

    // weather forecast from RWIS/webcams
    if (target.id === 'getwxf') {
        window.open(`https://www.windy.com/${target.dataset.lat}/${target.dataset.lon}`);
    }

    // zoom into an incident
    if (target.id === 'zoomToInc') {
        const find = helpers.getIncident(target.dataset.id);

        if (!find) return;

        global.map.fitBounds(geojsonExtent(find.geometry), {
            padding: 60,
            duration: 2000
        });
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