import { ENV, config, tileConfig, getPlatform } from '../app/config.js';
import { global, appLayers, impactHeader } from '../app/state.js';
import { storage } from '../utils/helpers.js';
import maplibregl from '../map/maplibre.js';
import { createPopup, fitBounds } from '../map/mapping.js';

export class ClickListener {
    constructor(target) {
        this.target = target;
        this.sr = document.querySelector('#search-results');
    }

    impact() {
        return document.querySelector('#impact');
    }

    account() {
        if (!config.settings.user) {
            const guid = document.cookie.split('; ').find(row => row.startsWith('guid='))?.split('=')[1] || null,
                url = `${ENV.domain.replace('//', '//auth.')}login?service=${getPlatform()}&next=${encodeURIComponent(window.location.href)}${(guid ? `&guid=${guid}` : '')}`;

            window.location.href = url;
            return;
        }

        // todo: otherwise...
    }

    basemaps() {
        const impact = this.impact();

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content';

        const basemapListUl = document.createElement('ul');
        basemapListUl.className = 'layers-list bm';

        tileConfig.forEach(tile => {
            if (!config.settings?.hasPermissions(tile.permissions)) return;

            const isChecked = tile.id === config.settings?.getBasemap(),
                listItem = document.createElement('li'),
                radioDiv = document.createElement('div'),
                descDiv = document.createElement('div');

            // Create the list item for the basemap
            listItem.dataset.tile = tile.id;

            // Create the radio and description containers
            radioDiv.className = 'radio';
            descDiv.className = 'desc';

            // Add the radio button or premium feature
            ////if (hasPerms) {
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
            ////} else {
            ////radioDiv.innerHTML = premFeature;
            ////radioDiv.addEventListener('click', () => {
            ////const tier = tile.permissions.includes('PREMIUM') ? 'premium' : 'pro';
            ////notify('info', `This is a ${tier} baseglobal.map. <a href="#" onclick="return false" data-action="marketing-cta" data-utm="basemaps_snackbar">Get access</a>`, 4);
            ////});
            ////}

            // Add the icon and label
            const img = document.createElement('img');
            if (tile.imgs) {
                img.src = `${ENV.domain}assets/images/icons/fire/basemaps/${tile.imgs}.png`;
                ////if (!hasPerms) img.style.opacity = '0.5';
            }

            const label = document.createElement('label');
            label.innerHTML = tile.name;

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

    createLayers() {
        const content = appLayers.map(layer => `<li class="layer" data-id="${layer.id}" title="${layer.name}">
            <div class="checkbox">
                <input type="checkbox" id="${layer.id}" class="layChkBx" data-action="toggle-layer">
            </div>
            <div class="desc">
                <label for="${layer.id}">${layer.name}</label>
                <span>${layer.desc}</span>
            </div>
        </li>`);

        config.layersMenu = `<div class="content">
            <ul class="layers-list">
                ${content.join('')}
            </ul>
        </div>`;
    }

    layers() {
        const impact = this.impact();
        const scrollPosition = storage('mapofire.impactScroll');

        // if layers menu doesn't exist...create it first
        if (config.layersMenu == null) this.createLayers();

        impact.innerHTML = impactHeader + config.layersMenu;
        impact.querySelector('#a').innerHTML = 'Layers';

        appLayers.forEach(layer => {
            const li = impact.querySelector(`li.layer[data-id="${layer.id}"]`);
            const isChecked = (layer.default && !config.settings.checkboxes()) || (config.settings.checkboxes() && config.settings.isEnabled(layer.id));

            li.querySelector('input[type=checkbox]').checked = isChecked;
        });

        impact.dataset.display = 'layers';
        impact.style.display = 'flex';

        if (scrollPosition !== null && scrollPosition !== '0') impact.scrollTop = scrollPosition;
    }

    closeImpact() {
        const impact = this.impact();
        if (!impact) return;

        impact.removeAttribute('data-display');
        impact.style.display = 'none';
        impact.innerHTML = '';
    }

    async searchResultClick() {
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

                createPopup(
                    'City',
                    `${name[0]}, ${p.dataset.county} County, ${name[1]}`,
                    { type: 'Point', coordinates: [lon, lat] },
                    { edit: false }
                );

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

                createPopup(
                    geoType,
                    `${name[0]}, ${county} County, ${name[1]}`,
                    { type: 'Point', coordinates: [lon, lat] },
                    { edit: false }
                );

                global.map.easeTo({
                    center: new maplibregl.LngLat(lon, lat),
                    zoom: 11.25
                });
            }
            // zoom to boundaries of a state or a county
            else if (type == 'state' || type == 'county') {
                const bbox = JSON.parse(p.dataset.bbox);

                fitBounds([
                    [bbox.x.min, bbox.y.min],
                    [bbox.x.max, bbox.y.max]
                ]);
            }
            // zoom in on coordinates
            else if (type == 'coordinates') {
                global.marker = new maplibregl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(global.map);

                createPopup(
                    'Coordinates',
                    `<p style="font-size:17px;color:#fff">${lat},&nbsp;${lon}</p>
                    <span style="display:block;padding-bottom:4px;font-size:14px">
                        ${String(`${global.conversion.convertToDms(lat, false)}&nbsp;${global.conversion.convertToDms(lon, true)}`).replace(/\s/g, '')}
                    </span>`,
                    { type: 'Point', coordinates: [lon, lat] },
                    { edit: false }
                );

                global.map.easeTo({
                    center: [lon, lat],
                    zoom: 10
                });
            }
            // zoom to a trail
            else {
                const tid = Number(p.dataset.tid);
                const trail = global.trails.findTrail(tid);

                global.trails.displayTrail(tid);

                if (!trail) return;

                const stats = trail.properties.stats;

                if (!stats) return;

                const bounds = [
                    stats.bounds.sw,
                    stats.bounds.ne
                ];

                if (!bounds.length) return;

                global.selected = tid;

                global.map.setFeatureState({
                    source: 'trailData',
                    sourceLayer: 'mapotrails',
                    id: tid
                }, { click: true });


                fitBounds(bounds);
            }
        }

        this.sr.innerHTML = '<li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third" aria-hidden="true"></i><span>Searching...</span></li>';
        this.sr.style.display = 'none';

        return this;
    }
}

export class ChangeListener {
    constructor(target) {
        this.target = target;
    }

    changeBasemap() {
        console.log(this.target.dataset);
        const tile = this.target.dataset.tile ?? 'outdoors';

        config.settings.settings.tile = tile;
        global.map.setStyle(config.tiles[tile]);

        global.map.once('styledata', () => {
            global.trails.refresh();
        });
    }

    toggleLayer() {
        const { id, checked } = this.target;
        const layer = appLayers.find(layer => layer.id === id);

        if (!layer) return;

        config.settings.updateLayers(id, checked);

        const visibility = checked ? 'visible' : 'none';

        if (!global.map.getSource(layer.source)) {
            layer.init();
        } else {
            layer.mapLayers.forEach(mapLayer => global.map.setLayoutProperty(mapLayer, 'visibility', visibility));
        }
    }
}