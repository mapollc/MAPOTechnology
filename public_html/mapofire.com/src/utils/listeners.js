import maplibregl from '../map/maplibre.js';

import { ENV, config, debugMode, getPlatform, tileConfig } from '../app/config.js';
import { global, impactHeader, noneTracked, premFeature, impact, modal } from '../app/state.js';

import { initNDFDTimes, sfpTimes } from '../data/index.js';
import { NWS } from '../data/weather.js';

import * as helper from './helpers.js';

import { legend } from '../utils/constants.js';

import { marketing, notify, purchaseLink } from '../ui/components.js';

import { toggleLayer } from '../map/controls.js';

const { Popup } = helper;

export class ChangeListener {
    constructor(target) {
        this.target = target;
    }

    changeBasemap(tile = null) {
        if (tile == null) tile = this.target.dataset.tile;

        config.settings.settings.tile = tile;

        global.map.setStyle(config.tiles[tile]);

        global.map.once('styledata', () => {
            config.layersHandler.addTerrain();
            config.layersHandler.init();
            config.wildfire.getWildfires();
            config.perimeters.get();

            const cbox = config.settings.checkboxes();

            if (cbox) {
                cbox.filter(c => !['newFires', 'allFires', 'smokeChecks', 'rxBurns', 'perimeters'].includes(c))
                    .forEach(c => toggleLayer({ id: c, checked: true }));
            }
        });
    }

    minPerimSize() {
        const v = this.target.value;

        config.settings.updatePSize(v);
        document.querySelector('#pSize').innerHTML = `${v} acres`;

        ['perimeters_outline', 'perimeters_fill', 'perimeters_title'].forEach(lay => global.map.removeLayer(lay));
        global.map.removeSource('perimeters');

        config.perimeters.get();
    }

    toggle() {
        const layers = [];

        document.querySelectorAll('.layChkBx').forEach(e => { if (e.checked) layers.push(e.id); });

        // update settings to reflect anytime a checkbox is selected or not
        config.settings.updateLayers(layers);

        // toggle the layer on or off
        const id = this.target.id,
            checked = this.target.checked;

        toggleLayer({ id, checked });
    }

    smoke(sfc) {
        const handler = sfc ? config.layersHandler.sfcSmoke : config.layersHandler.viSmoke;
        handler(this.target.options[this.target.selectedIndex].value);
    }

    async spc() {
        const type = document.querySelector('#otlkType'),
            days = document.querySelector('#otlkDay'),
            day3 = days.querySelector('option[value="3"]');

        // add or remove day 3 depending on if the user is looking at severe or fire wx outlooks
        if (type.value == 'severe') {
            if (!day3) {
                const opt = document.createElement('option');
                opt.value = 3;
                opt.text = 'Day 3';
                days.appendChild(opt);
            }
        } else {
            if (day3) day3.remove();
        }

        config.settings.updateSpecial();
        new NWS().spc(true);
    }

    personalize() {
        if (document.querySelector('#impact #settings') != null) {
            document.querySelectorAll('#impact #settings select').forEach(s => config.settings.updatePersonal(s));

            helper.saveSession(true);
        }
    }

    archive() {
        const ay = document.querySelector('#archive_years'),
            s = ay.options[ay.selectedIndex].value,
            win = window.location;

        if (s != '- Choose a year -') win.href = `${ENV.host}archive/${s}${(win.search ? win.search : '')}${(win.hash ? win.hash : '')}`;
    }

    spcClimo() {
        const offset = parseInt(this.target.value, 10);
        config.layersHandler.spcClimo(offset, true, true);
    }
}

export class ClickListener {
    constructor(target, sr) {
        this.target = target;
        this.modalHeightFromTop = 0.3;
        this.sr = sr;
    }

    android() {
        localStorage.setItem('recommend_google_play', Date.now());
        document.querySelector('.android-banner').remove();
    }

    tools() {
        config.toolsInstance.clickListener(this.target);
    }

    myContent() {
        config.toolsInstance.myContent();
    }

    async mcta() {
        marketing(true, this.target.dataset.utm);
    }

    async copy(text = null, msg = null) {
        await navigator.clipboard.writeText(text != null ? text : this.target.innerText);
        notify('info', msg ? msg : 'Coordinates copied to clipboard');
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
        const { Search } = await import('../ui/search.js');
        const q = document.querySelector('#q');
        if (!q) return;

        q.value = '';
        document.querySelector('#clearSearch')?.style.setProperty('display', 'none');
        new Search('').do();
        q.focus();
    }

    clearLayerSearch() {
        document.querySelectorAll('.layers-list li.layer').forEach(layer => layer.style.display = 'flex');
        impact.querySelector('#layerSearch').setProperty('value', '');
    }

    closeImpact() {
        if (global.map.getSource('user-features')) {
            global.map.removeSource('user-features')
                .removeLayer('user-features-markers');
        }

        impact.removeAttribute('data-display');
        impact.style.display = 'none';
        impact.innerHTML = '';
    }

    openModal(aClass) {
        modal.className = aClass || '';
        if (modal.hasAttribute('open')) return;

        modal.querySelector('.content').innerHTML = '<div class="loading" style="margin:0"><div class="s"></div></div>';

        const onTransitionEnd = (e) => {
            if (e.propertyName === 'top') {
                modal.removeEventListener('transitionend', onTransitionEnd);

                const event = new CustomEvent('modalOpened', { detail: { top: openPosition } });
                modal.dispatchEvent(event);
            }
        };

        const handle = modal.querySelector('.close'),
            viewportHeight = window.innerHeight,
            openPosition = viewportHeight * this.modalHeightFromTop,    // 30 vh from top
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

        helper.unsetHeaders();
    }

    closePopup() {
        if (global.marker) global.marker.remove();
        if (!config.settings.isEnabled('stns') && global.map.getSource('stns')) {
            global.map.removeLayer('stns')
                .removeLayer('stns_text')
                .removeSource('stns');
        }

        document.querySelector('.popup')?.remove();

        helper.unsetHeaders();

        const sourceMap = {
            caperim: 'ca_perimeters',
            ausperim: 'aus_perimeters',
            perim: 'perimeters'
        };

        ['caperim', 'ausperim', 'perim', 'evac', 'nri', 'erc'].forEach(key => {
            const source = sourceMap[key] || key;

            if (global.selected[key] && global.map.getSource(source)) {
                global.map.removeFeatureState({
                    source,
                    id: global.selected[key],
                    ...(key === 'perim' && { sourceLayer: 'perimeters' }),
                    ...(key === 'evac' && { sourceLayer: 'evacuations' })
                });
                global.selected[key] = null;
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

        if (dataset.wfid) {
            config.wildfire.incident(dataset.wfid);
            return;
        }

        global.map.easeTo({
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

    renderLayerItem(layer, zoom) {
        return `<li class="layer${layer.minZoom && layer.minZoom > zoom ? ' more-zoom' : ''}"${layer.minZoom ? ` data-min-zoom="${layer.minZoom}"` : ''} data-p="${layer.perms}" data-id="${layer.id}" title="${layer.minZoom && layer.minZoom > zoom ? 'You must be zoomed in more' : layer.name}">
            <div class="checkbox">
                <input type="checkbox" id="${layer.id}" class="layChkBx" data-action="toggle-layer">
            </div>
            <div class="desc">
                <label for="${layer.id}">${layer.name}</label>
                <span>${layer.desc}</span>
                ${this.layerExtras(layer)}
            </div>
        </li>`;
    }

    createLayers() {
        const zoom = global.map.getZoom();
        let content = ['<div class="content"><div class="dark-input"><input type="text" id="layerSearch" placeholder="Filter through layers..."><i data-action="clear-layer-search" class="fat fa-xmark clearSearch"></i></div>'];

        // Loop through layer categories
        Object.entries(layers.categories).forEach(([categoryId, categoryTitle]) => {
            content.push(`<div class="group"><h3 class="group-title">${categoryTitle}</h3><ul class="layers-list">`);

            // Loop through layers in each category
            layers.layers[categoryId].filter(lay => !lay.testing || (lay.testing && debugMode)).forEach(layer => {
                content.push(this.renderLayerItem(layer, zoom));
            });

            content.push('</ul></div>');
        });

        config.layersMenu = `${content.join('')}</div>`;
    }

    // show/open layers menu
    showLayers() {
        const scrollPosition = helper.storage('mapofire.impactScroll');

        if (config.layersMenu == null) this.createLayers();

        impact.innerHTML = impactHeader + config.layersMenu;
        impact.querySelector('#a').innerHTML = 'Layers';

        config.listOfLayers.filter(lay => !lay.testing || (lay.testing && debugMode)).forEach(layer => {
            const hasPermissions = config.settings?.hasPermissions(layer.perms),
                isChecked = (layer.default && !config.settings.checkboxes()) || (config.settings.checkboxes() && config.settings.isEnabled(layer.id)),
                item = impact.querySelector(`li.layer[data-id="${layer.id}"]`),
                filter = item.querySelector('.data-filter'),
                box = item.querySelector('.checkbox');

            if (box) box.querySelector('input[type=checkbox]').checked = isChecked;

            if (layer.minZoom) {
                if (global.map.getZoom() >= item.dataset.minZoom) {
                    item.classList.remove('more-zoom');
                    item.title = String(item.querySelector('label').innerHTML);
                } else {
                    item.classList.add('more-zoom');
                    item.title = 'You must be zoomed in more';
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
                            v: config.settings.special().otlkType()
                        }, {
                            q: 'otlkDay',
                            v: config.settings.special().otlkDay()
                        }],
                        erc: [{
                            q: 'erc_time',
                            v: config.settings.special().erc()
                        }],
                        sfp: [{
                            q: 'sfpDateSelect',
                            v: config.settings.special().sfpDate()
                        }],
                        ndfd: [{
                            q: 'forecastModel',
                            v: config.settings.special().forecastModel()
                        }/*, {
                            q: 'fcstTime',
                            v: config.settings.special().fcstTime()
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

        impact.dataset.display = 'layers';
        impact.style.display = 'flex';

        if (scrollPosition !== null && scrollPosition !== '0') impact.scrollTop = scrollPosition;
    }

    // creates dropdowns for some layers
    layerExtras(l) {
        const spec = config.settings.special?.() || {},
            icon = (cls) => `<i class="${cls}" style="color:#9caab3"></i>`,
            wrap = (id, content) => `<div class="data-filter" id="${id}">${icon('far fa-filter-list')}<div>${content}</div></div>`,
            sel = (val, target) => val === target ? 'selected' : '',
            smokeOptions = () => Array.from({ length: 15 }, (_, i) => {
                const timeVal = helper.gmtime(++i * 3600),
                    date = new Date(`${timeVal}+00:00`),
                    hrs = date.getHours(),
                    isMid = hrs === 0,
                    day = date.getDate() === config.curTime.getDate() + 1 ? 'Tomorrow' : 'Today',
                    label = isMid ? 'Midnight' : `${day} at ${hrs % 12 || 12} ${hrs >= 12 ? 'PM' : 'AM'}`;

                return `<option value="${timeVal}">${label}</option>`;
            }).join('');

        const filters = {
            perimeters: () => {
                const size = config.settings.perimeters().minSize();

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
            const hasPerms = config.settings?.hasPermissions(tile.permissions),
                isChecked = tile.id === config.settings.getBasemap(),
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
                radioInput.dataset.action = 'change-basemap';
                radioInput.dataset.tile = tile.id;
                radioDiv.appendChild(radioInput);
            } else {
                radioDiv.innerHTML = premFeature;

                radioDiv.addEventListener('click', () => {
                    const tier = tile.permissions.includes('PREMIUM') ? 'premium' : 'pro';
                    notify('info', `This is a ${tier} baseglobal.map. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="basemaps_snackbar">Get access</a>`, 4);
                });
            }

            // Add the icon and label
            const img = document.createElement('img');
            if (tile.imgs) {
                img.src = `${ENV.domain}assets/images/icons/fire/basemaps/${tile.imgs}.png`;
                if (!hasPerms) img.style.opacity = '0.5';
            }

            const label = document.createElement('label');
            label.innerHTML = `${tile.name}${(tile.permissions.length ? `<p>${tile.permissions[0]}</p>` : '')}`;

            // Assemble the list item
            if (tile.imgs) descDiv.appendChild(img);
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
        if (!config.settings.user) {
            const guid = document.cookie.split('; ').find(row => row.startsWith('guid='))?.split('=')[1] || null,
                url = `${ENV.domain.replace('//', '//auth.')}login?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}${(guid ? `&guid=${guid}` : '')}`;
            ////console.log(url);
            window.location.href = url;
            return;
        }

        let ms = '';
        const userProfile = `<div class="content">
            <div id="sync">
                <i class="fa-regular fa-arrow-down-to-line" aria-hidden="true"></i>
                <span title="${helper.dateTime(config.settings.getUser().synced(), true, true, true).toString()}">Account last synced ${helper.timeAgo(config.settings.user.synced)}</span>
            </div>
            <div id="settings">
                <div class="my-subs">
                    <h2>My Subscriptions</h2>
                    <div id="subs"></div>
                </div>
                <h2>Map Settings</h2>
                ${this.acctSettings()}
                <div class="btn-group centered" style="margin:var(--spacing) 0 0">
                    <a target="blank" class="btn btn-black" style="width:100%" href="${ENV.domain}account/settings">Manage account</a>
                </div>
                <div style="margin-top:5em;font-size:12px;text-align:center;color:var(--blue-gray);line-height:1.3">
                    &copy; ${new Date().getFullYear()} ${config.company}<br>Version ${VERSION}<br>
                    <a class="footer-link" href="${ENV.baseURL}logout?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}">Logout</a>&nbsp;&middot;&nbsp;
                    <a class="footer-link" href="${ENV.host}release-notes" target="blank">Change Log</a>&nbsp;&middot;&nbsp;
                    <a class="footer-link" href="${ENV.domain}about/legal/terms" target="blank">Terms</a>&nbsp;&middot;&nbsp;
                    <a class="footer-link" href="${ENV.domain}about/legal/privacy" target="blank">Privacy</a>
                </div>
            </div>
        </div>`;

        impact.innerHTML = impactHeader + userProfile;
        impact.style.display = 'flex';
        impact.querySelector('#a').innerHTML = `Hello, ${config.settings.getUser().getName().first()}`;

        const prefs = {
            'saveFreq': config.settings.get().saveFreq(),
            'perimColor': config.settings.perimeters().color() ?? 'default',
            'perimTtip': config.settings.perimeters().ttip() ?? 1,
            'perimZoom': config.settings.perimeters().zoom() ? 1 : 0,
            'coordsDisplay': config.settings.get().coordsDisplay() ?? 'dec',
            'tempUnit': config.settings.weather().temp() ?? 'f',
            'windSpeedUnit': config.settings.weather().wind() ?? 'mph',
            'acresUnit': config.settings.get().acres() ?? 'acres',
            'locallySave': config.settings.get().locallySave() ?? 'n'
        };

        Object.entries(prefs).forEach(([id, val]) => {
            const el = document.querySelector(`select#${id}`);
            if (el) el.value = val;
        });

        if (!config.settings.subscriptions().valid()) {
            if (config.settings.getUser().role() == config.PERMISSION_LEVELS.LICENSEE) {
                ms = '<p class="message success">Your account is part of a group organization. You have access to all premium and pro features.</p>';
            } else {
                const buy = purchaseLink('account', encodeURIComponent(window.location.href));
                ms = `<p style="color:var(--box-text-color)">
                    You don't have a subscription to Map of Fire.
                    <a class="btn btn-yellow" style="width:100%;margin:1em 0 0 0" href="${buy}">Try it for free!</a>
                </p>`;
            }
        } else {
            let theEnd = 'Your subscription will automatically renew';

            if (config.settings.subscriptions().isTrial()) {
                theEnd = 'Your free trial ends ';
            }

            ms = `<div style="display:inline-flex;width:100%;justify-content:space-between;gap:1em">
                <div style="display:inline-flex;flex-direction:column;gap:0.45em">
                    <span>${config.settings.subscriptions().name()}</span>
                    <small style="line-height:1.1;color:#999">${theEnd} on ${config.settings.subscriptions().expires()}.</small>
                </div>
                <a class="btn btn-sm btn-black" style="margin:0;height:fit-content" target="blank" href="${ENV.domain}account/billing#cid=${config.settings.subscriptions().customerID()}">Manage</a>
            </div>`;
        }

        document.querySelector('#subs').innerHTML = ms;
    }

    radarStop() {
        if (global.radar.animationTimer) {
            clearTimeout(global.radar.animationTimer);
            global.radar.animationTimer = false;
            return true;
        }
        return false;
    }

    radarPlay() {
        global.radar.animationTimer = true;
        config.layersHandler.showRadarFrame(global.radar.animationPosition + 1);
        const range = document.querySelector('.radar input[type=range]');
        range.value = global.radar.animationPosition;

        const percent = (range.value - range.min) / (range.max - range.min) * 100;
        range.style.setProperty('--val', percent + '%');
    }

    radarPausePlay() {
        const c = document.querySelector('.radarControl');

        c.classList.toggle('fa-play');
        c.classList.toggle('fa-pause');
        c.dataset.tooltip = c.classList.contains('fa-play') ? 'Start radar' : 'Pause radar';

        if (!this.radarStop()) this.radarPlay();
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
        const tf = this.target.closest('#trackFire');

        if (!tf) {
            notify('error', 'An unknown error has occurred.');
            return;
        }

        const id = Number(tf.dataset.id);
        const isFollowing = global.dataView.trackedFires.includes(id);

        if (isFollowing) {
            global.dataView.trackedFires = global.dataView.trackedFires.filter(wfid => wfid !== id);

            tf.dataset.mode = 'follow';
            tf.title = 'Start following this incident';
            tf.classList.remove('btn-black');
            tf.classList.add('btn-yellow');
            tf.innerHTML = '<i class="far fa-plus"></i>Follow this incident';

            notify('success', `You're no longer following this fire.`);
        } else {
            const fire = config.wildfire.findFire(id);

            if (!fire) {
                notify('error', 'This fire is considered out and can no longer be followed.');
                return;
            }

            const { name, type } = fire.properties;
            const fireName = config.wildfire.fireName(name, type, fire.properties.incidentId);

            global.dataView.trackedFires.push(id);

            tf.dataset.mode = 'unfollow';
            tf.title = "You're following this incident";
            tf.classList.add('btn-black');
            tf.classList.remove('btn-yellow');
            tf.innerHTML = '<i class="far fa-check"></i>Following this incident';

            notify('success', `You're now following the ${fireName}.`);
        }

        // if user is logged in, save to account, otherwise store in local storage
        if (config.settings?.user) {
            await helper.api(
                `${ENV.host}api/v1/trackFires/${isFollowing ? 'remove' : 'add'}`,
                [['wfid', id]],
                false,
                true
            );
        } else {
            helper.storage(
                'mapofire.tracked',
                JSON.stringify(global.dataView.trackedFires)
            );
        }
    }

    async unfollow(tar) {
        const id = Number(tar.dataset.wfid),
            name = tar.dataset.name,
            myf = document.querySelector('ul.my-fires');

        tar.closest('li')?.remove();

        const index = global.dataView.trackedFires.indexOf(id); console.log(index);
        if (index > -1) global.dataView.trackedFires.splice(index, 1);

        if (config.settings.user) {
            await helper.api(`${ENV.host}api/v1/trackFires/remove`, [['wfid', id]], false, true);
        } else {
            const stored = JSON.parse(helper.storage('mapofire.tracked') || '[]');
            stored.splice(stored.indexOf(id), 1);
            helper.storage('mapofire.tracked', JSON.stringify(stored));
        }

        if (myf?.querySelectorAll('li').length == 0) myf.parentElement.innerHTML = noneTracked;

        notify('success', `You're no longer following the ${name}.`);
    }

    archive() {
        if (!config.settings?.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) return;

        const yrs = Array.from({ length: config.curTime.getFullYear() - 2014 }, (_, idx) => {
            const year = config.curTime.getFullYear() - idx;
            return `<option ${year === config.curTime.getFullYear() ? 'disabled ' : ''}value="${year}">${year}</option>`;
        }).join('');

        new Popup('Historical Wildfires').create(
            null,
            `<p style="font-size:14px;line-height:1.2">See historical wildfires by selecting a year in our archive.</p>
                <select id="archive_years" data-action="archive_years" style="border:1px solid #cfcfcf;margin-top:1em">
                    <option>- Choose a year -</option>
                    ${yrs}
                </select>
                <div class="btn-group centered">
                    <input type="button" class="btn btn-sm btn-gray" value="Cancel" onclick="this.parentElement.parentElement.parentElement.remove()">
                </div>`
        );
    }

    async legend() {
        if (!legend?.categories?.length || !legend?.items) return;

        let legCont = legend.categories.map(cat => {
            const key = Object.keys(cat)[0];

            const itemsHtml = (legend.items[key] || []).map(item => {
                let icon = '';

                if (item[0] == 'img') {
                    icon = `<img loading="lazy" src="https://mapotechnology.com/assets/images/icons/fire/fire-icon${item[1] ? `-${item[1]}` : ''}.png" style="width:${item[4]}px" alt="${item[3]}" title="${item[3]}">`;
                } else if (item[0] == 'icon') {
                    icon = item[1];
                } else {
                    icon = `<div class="color" style="background-color:${item[2]}">${item[1] ?? ''}</div>`;
                }

                return `<div class="row">
                    <div class="ic">${icon}</div>
                    <div class="desc">${item[3] ?? ''}</div>
                </div>`;
            }).join('');

            return `<div class="group"><h3 class="group-title">${cat[key]}</h3>${itemsHtml}</div>`;
        }).join('');

        impact.innerHTML = `${impactHeader}<div class="content"><div class="legend">${legCont}</div></div>`;
        impact.dataset.display = 'legend';
        impact.style.display = 'flex';

        const aEl = impact.querySelector('#a');
        if (aEl) aEl.innerHTML = 'Legend';
    }

    async myfires() {
        impact.innerHTML = `${impactHeader}<div class="content"><div id="spinner" class="centered"></div></div>`;
        impact.style.display = 'flex';
        impact.querySelector('#a').innerHTML = 'My Fires';

        await new Promise(resolve => {
            const check = setInterval(() => {
                if (global.inits.trackedDone) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });

        const content = impact.querySelector('.content'),
            myFires = global.dataView.trackedFires.map(id => config.wildfire.findFire(id)).filter(fire => fire != null);

        if (myFires.length === 0) {
            content.innerHTML = global.dataView.trackedFires.length > 0 ? '<div class="message error">The wildfires you were following are no longer available.</div>' : noneTracked;
            return;
        }

        // build the list of "my fires"
        const ul = document.createElement('ul');
        ul.className = 'my-fires';

        myFires.forEach(fire => {
            const { properties: p, geometry } = fire,
                name = p.name,
                size = global.conversion.sizeFormat(p.acres),
                fstat = p.status,
                st = p.time.year < config.curTime.getFullYear() ? 'out' : config.wildfire.getStatus(fstat, p.notes) || 'active',
                state = p.near/*,
                up = helper.timeAgo(p.time.updated)*/;

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
        ul.addEventListener('click', (event) => {
            const unfollowBtn = event.target.closest('[data-action="my-fire-unfollow"]');

            if (unfollowBtn) {
                event.stopPropagation();
                this.unfollow(unfollowBtn);
                return;
            }

            const li = event.target.closest('li#my-fire-incident');
            if (!li) return;

            const coords = JSON.parse(li.dataset.coords);
            if (coords) global.map.flyTo({ center: coords, zoom: 11.5 });
        });

        // Replace spinner with list
        content.innerHTML = '';
        content.appendChild(ul);
    }

    searchResultClick() {
        const p = this.target.closest('li');
        const type = p.dataset.type;

        if (global.marker) global.marker.remove();

        if (!p.classList.contains('standby')) {
            const lat = p.dataset.lat,
                lon = p.dataset.lon;

            // zoom to a marker of a city location
            if (type == 'city') {
                const name = p.dataset.name.split(', ');

                global.marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(global.map);

                new Popup('City').create(`<p style="margin-bottom:6px;color:#fff">${name[0]}, ${p.dataset.county} County, ${name[1]}</p>
                    <span style="display:block;font-size:14px">${lat}, ${lon}</span>`);

                global.map.easeTo({
                    center: new maplibregl.LngLat(lon, lat),
                    zoom: 10
                });
            }
            // zoom to marker of a GIS feature (POI)
            else if (type == 'gis') {
                const name = p.dataset.name.split(', '),
                    county = p.dataset.county,
                    geoType = p.dataset.geotype;

                global.marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(global.map);

                new Popup(geoType).create(`${name[0]}, ${county} County, ${name[1]}`);

                global.map.easeTo({
                    center: new maplibregl.LngLat(lon, lat),
                    zoom: 11.25
                });
            }
            // zoom to boundaries of a state or a county
            else if (type == 'state' || type == 'county') {
                const bbox = JSON.parse(p.dataset.bbox);

                global.map.fitBounds([
                    [bbox.x.min, bbox.y.min],
                    [bbox.x.max, bbox.y.max]
                ], {
                    padding: 50
                });
            }
            // zoom in on coordinates
            else if (type == 'coordinates') {
                global.marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(global.map);

                new Popup('Coordinates').create(`<p style="padding-bottom:8px;color:#fff">${lat},&nbsp;${lon}</p>
                    <span style="display:block;padding-bottom:4px;font-size:14px">${String(`${global.conversion.convertToDms(lat, false)}&nbsp;${global.conversion.convertToDms(lon, true)}`).replace(/\s/g, '')}</span>
                    <span style="display:block;font-size:14px">${global.conversion.utm(lat, lon)}</span>`);

                global.map.easeTo({
                    center: [lon, lat],
                    zoom: 10
                });
            }
            // zoom to a wildfire
            else {
                const wfid = parseInt(p.dataset.wfid);
                const inc = config.wildfire.findFire(wfid, null, true);

                if (inc != null) {
                    config.wildfire.logFire(wfid, inc);
                    config.wildfire.incident(wfid, true);
                }
            }
        }

        this.sr.innerHTML = '<li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third" aria-hidden="true"></i><span>Searching...</span></li>';
        this.sr.style.display = 'none';

        return this;
    }

    socialShare(se) {
        const p = window.location.pathname,
            s = p.split('/'),
            clean = v => String(v).replaceAll('-', ' ').ucwords().replaceAll(' ', '');

        if (se == 'tt') {
            window.open(`https://tiktok.com/search?q=${s[4].replaceAll('-', '%20').toLowerCase()}`);
        } else {
            let url = '';
            const ref = `//${window.location.host.substring(0, ENV.host.length - 1).replace('www.', '')}${p}`;

            if (se == 'fb') {
                url = `https://www.facebook.com/sharer/sharer.php?u=${ref}&src=sdkpreparse`;
            } else {
                const hashtags = `${clean(s[3])},${clean(s[4])}`;
                url = `https://x.com/intent/post?hashtags=${hashtags}&original_referer=${ref}&url=${ref}&ref_src=twsrc%5Etfw&tw_p=tweetbutton`;
            }

            const h = 425, w = 700,
                t = (window.innerHeight - h) / 2,
                l = (window.innerWidth - w) / 2;

            window.open(url, 'social', `location=no,menubar=no,status=no,resizable=no,top=${t},left=${l},width=${w},height=${h}`);
        }
    }
}