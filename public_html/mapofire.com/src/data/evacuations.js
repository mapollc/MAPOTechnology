import { ENV, config } from '../app/config.js';
import { global } from '../app/state.js';

import { api, timeAgo, mapMouseOver, geojsonExtent, createDataForm } from '../utils/helpers.js';
import { stateLabels } from '../utils/constants.js';

export class Evacuations {
    constructor() {
        this.activeEvacuations = null;
        this.evacCount = 0;
        this.evacsLoaded = false;

        this.zoneZoomLevel = {
            min: 10,
            change: 12
        };
    }

    async get() {
        if (!this.evacsLoaded) {
            const data = await api(`${ENV.apiURL}evacuations`);

            // store active evacuations for use elsewhere within the map
            if (!data?.features) {
                return;
            }

            this.activeEvacuations = data.features;
            this.evacCount = this.activeEvacuations.length;

            this.evacsLoaded = true;
            this.displayEvacs(data);
        }
    }

    clickListener() {
        const content = [];
        const states = [];
        const counties = [];

        this.activeEvacuations
            ?.sort((a, b) => Number(b.properties.updated) - Number(a.properties.updated))
            .forEach(e => {
                const z = e.properties;
                const nomen = z.level == 1 ? 'Be Ready' : (z.level == 2 ? 'Be Set' : 'Leave Immediately');

                if (!z.county || !z.state) return;

                // Added: store unique states
                if (!states.includes(z.state)) {
                    states.push(z.state);
                }

                // Added: store counties as objects instead of strings
                if (!counties.some(c => c.name === z.county && c.state === z.state)) {
                    counties.push({
                        name: z.county,
                        state: z.state
                    });
                }

                content.push(`<div class="evac level${z.level}" data-state="${z.state}" data-county="${z.county}">
                    <div class="evacTitle">
                        <h3><span class="evac-circ l${z.level}"></span>Level ${z.level}: ${nomen}</h3>
                        <a href="#" class="btn btn-xs btn-black" style="margin:0;min-width:88px" data-action="goToEvacPoly" data-id="${z.id}" onclick="return false">View on Map</a>
                    </div>

                    <details>
                        <summary style="font-weight:400">
                            ${stateLabels[z.state]?.name} &ndash; ${z.county} County
                        </summary>

                        <span style="font-size:15px">${z.notes}</span>
                    </details>

                    <p class="updated" style="text-align:left;color:#4a4a4a">
                        Last updated ${z.updated ? timeAgo(z.updated) : 'N/A'}
                        by ${stateLabels[z.state]?.name} OEM
                    </p>
                </div>`);
            });

        // Added: sort once
        states.sort((a, b) => a.localeCompare(b));
        counties.sort((a, b) => {
            const stateCompare = a.state.localeCompare(b.state);
            return stateCompare || a.name.localeCompare(b.name);
        });

        const stateOptions = states.map(state =>
            `<option value="${state}">${stateLabels[state]?.name}</option>`
        ).join('');

        const countyOptions = counties.map(county =>
            `<option value="${county.name}" data-state="${county.state}">
            ${county.name} County, ${county.state}
        </option>`).join('');

        createDataForm(
            'Active Evacuations',
            `<div class="filterEvacs">
                <select id="evac_states">
                    <option value="">- All States -</option>
                    ${stateOptions}
                </select>

                <select id="evac_county">
                    <option value="">- All Counties -</option>
                    ${countyOptions}
                </select>
            </div>

            <div class="evacs" style="margin:0">
                ${content.join('')}
            </div>`);

        this.filterListener(counties);
    }

    filterListener(counties) {
        let useThisState = '';
        let useThisCounty = '';

        const state = document.querySelector('#evac_states');
        const county = document.querySelector('#evac_county');
        const list = document.querySelectorAll('.evacs .evac');

        // Added: rebuild county dropdown based on selected state
        const updateCountyList = () => {
            county.innerHTML = '<option value="">- All Counties -</option>';

            counties
                .filter(c => !useThisState || c.state === useThisState)
                .forEach(c => {
                    county.insertAdjacentHTML('beforeend', `<option value="${c.name}">${c.name} County</option>`);
                });
        };

        const filter = () => {
            list.forEach(item => {
                const stateMatch = !useThisState || item.dataset.state === useThisState;
                const countyMatch = !useThisCounty || item.dataset.county === useThisCounty;

                item.style.display = (stateMatch && countyMatch) ? 'block' : 'none';
            });
        };

        state.addEventListener('change', e => {
            useThisState = e.target.value;
            useThisCounty = '';

            updateCountyList();

            county.value = '';

            filter();
        });

        county.addEventListener('change', e => {
            useThisCounty = e.target.value;
            filter();
        });

        updateCountyList();
    }

    evacHelper() {
        const btn = document.querySelector('.control.evacBtn');
        if (!btn) return;

        btn.style.display = 'block';
        btn.dataset.tooltip = `Evacuations (${this.evacCount})`;
        if (this.evacCount > 0) btn.innerHTML = `<span class="notify${this.evacCount > 9 ? ' m10' : ''}">${this.evacCount > 9 ? '9+' : this.evacCount}</span>`;
    }

    zoomTo(e) {
        const id = e.dataset.id;
        const layer = global.map.getLayer('evac');

        if (!layer) return;
        if (layer.visibility != 'visible') {
            ['evac', 'evac_outline', 'evac_title'].forEach(n => global.map.setLayoutProperty(n, 'visibility', 'visible'));
        }

        const feature = this.activeEvacuations.find(i => i.id == id),
            bounds = geojsonExtent(feature?.geometry);

        if (bounds) {
            global.map.fitBounds(bounds, {
                padding: 100
            });

            global.inits.clickListener.closeDataForm();
        }
    }

    displayEvacs(data) {
        if (!global.map.getSource('evac')) {
            global.map.addSource('evac', {
                type: 'geojson',
                data: data
            });
        }

        if (!global.map.getLayer('evac')) {
            global.map.addLayer({
                id: 'evac',
                type: 'fill',
                source: 'evac',
                minzoom: 4,
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['to-number', ['get', 'level']], 2], '#edd601',
                        ['==', ['to-number', ['get', 'level']], 3], '#e60000',
                        '#02823a'
                    ],
                    'fill-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4,
                        0.3,
                        8,
                        0.2,
                        10,
                        0.1
                    ]
                },
                layout: {
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });

            mapMouseOver('evac');
        }

        if (!global.map.getLayer('evac_outline')) {
            global.map.addLayer({
                id: 'evac_outline',
                type: 'line',
                source: 'evac',
                minzoom: 4,
                paint: {
                    'line-color': '#333',
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'click'], false],
                        3,
                        1
                    ],
                    'line-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4,
                        1.0,
                        11,
                        0.6
                    ]
                },
                layout: {
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });
        }

        if (!global.map.getLayer('evac_title')) {
            global.map.addLayer({
                id: 'evac_title',
                type: 'symbol',
                source: 'evac',
                minzoom: this.zoneZoomLevel.min,
                paint: {
                    'text-color': '#333',
                    'text-halo-color': '#fff',
                    'text-halo-blur': 1,
                    'text-halo-width': 2
                },
                layout: {
                    'symbol-placement': 'point',
                    'symbol-spacing': 400,
                    'text-font': config.fonts.source(),
                    'text-field': [
                        'step',
                        ['zoom'],
                        [
                            'case',
                            ['==', ['to-number', ['get', 'level']], 2], 'Level 2: BE SET',
                            ['==', ['to-number', ['get', 'level']], 3], 'Level 3: GO NOW',
                            'Level 1: Be Ready'
                        ],
                        this.zoneZoomLevel.change,
                        [
                            'concat',
                            ['coalesce', ['to-string', ['get', 'zoneID']], ''],
                            '\n',
                            [
                                'case',
                                ['==', ['to-number', ['get', 'level']], 2], 'Level 2: BE SET',
                                ['==', ['to-number', ['get', 'level']], 3], 'Level 3: GO NOW',
                                'Level 1: Be Ready'
                            ]
                        ]
                    ],
                    'text-justify': 'center',
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        this.zoneZoomLevel.min,
                        10,
                        14,
                        16
                    ],
                    'text-max-width': [
                        'step',
                        ['zoom'],
                        8,
                        this.zoneZoomLevel.change,
                        10
                    ],
                    'text-anchor': 'center',
                    'text-offset': [0, 1],
                    'text-letter-spacing': 0.05,
                    visibility: config.settings.isEnabled('evac') ? 'visible' : 'none'
                }
            });
        }

        global.map.moveLayer('evac', 'perimeters_fill');
    }
}

export class NearbyEvacuations {
    constructor(y, x) {
        this.bufferMiles = 17.5;
        this.x = x;
        this.y = y;
        this.point = [x, y];
    }

    distanceToSegmentMiles(v, w) {
        const distToV = global.conversion.distance(this.y, this.x, v[1], v[0]); // distance from p to v
        const distToW = global.conversion.distance(this.y, this.x, w[1], w[0]); // distance from p to w
        const lineLength = global.conversion.distance(v[1], v[0], w[1], w[0]);

        if (lineLength === 0) return distToV;

        // Treat points as cartesian (approximate) for projection
        const px = this.x, py = this.y,
            vx = v[0], vy = v[1],
            wx = w[0], wy = w[1],
            t = ((px - vx) * (wx - vx) + (py - vy) * (wy - vy)) /
                ((wx - vx) ** 2 + (wy - vy) ** 2);

        if (t < 0) return distToV;
        if (t > 1) return distToW;

        const projX = vx + t * (wx - vx),
            projY = vy + t * (wy - vy);

        return global.conversion.distance(this.y, this.x, projY, projX);
    }

    isPointInPolygon(polygon) {
        let inside = false;
        const [x, y] = this.point;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i],
                [xj, yj] = polygon[j],
                intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }
        return inside;
    }

    isPointNearPolygon(polygon) {
        if (this.isPointInPolygon(polygon)) return true;
        for (let i = 0; i < polygon.length; i++) {
            const v = polygon[i],
                w = polygon[(i + 1) % polygon.length];
            if (this.distanceToSegmentMiles(v, w) <= this.bufferMiles) return true;
        }
        return false;
    }

    get() {
        return new Promise(resolve => {
            if (global.inits.evacuations?.evacsLoaded) {
                resolve(this.process());
            } else {
                const wait = setInterval(() => {
                    if (global.inits.evacuations?.evacsLoaded) {
                        clearInterval(wait);
                        resolve(this.process());
                    }
                }, 500);
            }
        });
    }

    process() {
        let grouped = {};

        global.inits.evacuations.activeEvacuations.forEach(feature => {
            let fnotes = '';

            const geom = feature.geometry;
            const polygons = !geom ? [] : (geom?.type === 'Polygon' ? [geom.coordinates[0]] : geom.coordinates.flat());

            const isNear = polygons.some(ring =>
                this.isPointNearPolygon(ring)
            );

            if (isNear) {
                const level = feature.properties.level,
                    notes = feature.properties.notes || '',
                    county = feature.properties.county || '',
                    state = feature.properties.state || '',
                    time = feature.properties.updated || 0;

                if (!grouped[level]) grouped[level] = {
                    level: level,
                    notes: new Set(),
                    counties: new Set(),
                    states: new Set(),
                    updated: new Set()
                };

                if (notes.search('Evac Zone Name') >= 0) fnotes = RegExp(/Evac Zone Name: (.*?)\s\//gm).exec(notes)[1];

                grouped[level].notes.add(fnotes);
                grouped[level].counties.add(county);
                grouped[level].states.add(state);
                grouped[level].updated.add(time);
            }
        });

        return Object.values(grouped).map(group => ({
            level: group.level,
            notes: Array.from(group.notes),
            counties: Array.from(group.counties),
            state: Array.from(group.states),
            updated: Math.max.apply(null, Array.from(group.updated))
        })) ?? null;
    }
}