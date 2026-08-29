import { ENV, config, debugMode } from '../app/config.js';
import { global, modal } from '../app/state.js';

import { storage, api, timeAgo, setHeaders, createDataForm, mapMouseOver, formatArray, dateTime, getbbox } from '../utils/helpers.js';
import { stateLabels, DateFormatter } from '../utils/constants.js';

import { reorderLayers } from '../map/layers.js';
import { modalZoom } from '../map/mapping.js';

//import { Perimeters } from './perimeters.js';
import { Weather } from './weather.js';
import { NearbyEvacuations } from './evacuations.js';

import { notify } from '../ui/components.js';

export class Wildfires {
    constructor() {
        this.store = () => storage('mapofire.clicks');
        this.clicks = [];
        this.agencies = {
            'US Forest Service': 'USFS',
            'Bureau of Land Management': 'BLM',
            'Bureau of Indian Affairs': 'BIA',
            'National Park Service': 'NPS',
            'Bureau of Reclamation': 'BOR',
            'US Fish & Wildlife Service': 'USFWS',
            'Oregon Department of Forestry': 'ODF',
            'Department of Natural Resources': 'DNR',
            'Idaho Department of Lands': 'IDL',
            'California Department of Forestry & Fire Protection': 'CAL FIRE',
            'California Department of Forestry and Fire Protection': 'CAL FIRE'
        };

        this.TWO_MONTHS = 60 * 60 * 24 * (DateFormatter.daysInYear() / 6);
    }

    fireTextSize(t, which) {
        const thresh = t === 'new' ? 100 : 1000;
        const isComplex = ['==', ['get', 'isComplex'], true];
        const isBig = [
            'all',
            ['>=', ['to-number', ['coalesce', ['get', 'acres'], 0]], thresh],
            ['!=', ['get', 'Out'], true],
            ['!=', ['get', 'Control'], true],
            ['!=', ['get', 'Contain'], true]
        ];

        const config = {
            size: {
                z5: [
                    isComplex, 9, // Added: complex fire size @ z5
                    isBig, 12,
                    10
                ],
                z10: [
                    isComplex, 11, // Added: complex fire size @ z10
                    isBig, 15,
                    13
                ]
            },
            offset: {
                z5: [
                    isComplex, ['literal', [0, 1.2]], // Added: complex fire offset @ z5
                    isBig, ['literal', [0, 1.3]],
                    ['literal', [0, 1.0]]
                ],
                z10: [
                    isComplex, ['literal', [0, 1.1]], // Added: complex fire offset @ z10
                    isBig, ['literal', [0, 1.1]],
                    ['literal', [0, 1.0]]
                ]
            }
        }[which];

        return [
            'interpolate', ['linear'], ['zoom'],
            5, ['case', ...config.z5],
            10, ['case', ...config.z10]
        ];
    }

    fireIcon(t) {
        const now = Date.now() / 1000,
            acres = ['to-number', ['coalesce', ['get', 'acres'], 0]],
            discovered = ['to-number', ['coalesce', ['get', 'discovered', ['object', ['get', 'time']]], now]],
            baseCase = ['==', ['get', 'type'], 'Complex'],
            statusChecks = [
                ['==', ['get', 'Out'], true], 'fire-icon-out',
                ['==', ['get', 'Contain'], true], 'fire-icon-contained',
                ['==', ['get', 'Control'], true], 'fire-icon-controlled'
            ],
            complexIcon = 'fire-icon-complex';

        if (t === 'rx') return 'fire-icon-rx';
        if (t === 'smk') return 'fire-icon-smoke';
        if (t === 'new') {
            return [
                'case',
                baseCase, complexIcon,
                ...statusChecks,
                [
                    'all',
                    ['<', ['-', now, discovered], 43200],
                    ['>=', acres, 100]
                ],
                'fire-icon-new-big',
                'fire-icon-new'
            ];
        }

        const exp = [
            'case',
            baseCase, complexIcon,
            [
                'all',
                ['has', 'time'],
                [
                    '<',
                    ['to-number', ['coalesce', ['get', 'year', ['get', 'time']], 9999]],
                    config.curTime.getFullYear()
                ]
            ],
            'fire-icon-out',
            ...statusChecks,
            ['>=', acres, 1000],
            'fire-icon-large',
            ['>=', acres, 100], 'fire-icon-big',
            'fire-icon'
        ];

        //console.log(exp);
        return exp;
    }

    async commitLog() {
        if (this.store() && this.store() != '') {
            const send = await api(`${ENV.apiURL}logFire`, [['data', this.store()]]);

            if (send.success) localStorage.removeItem('mapofire.clicks');
        }

        return this;
    }

    logFire(id, json) {
        let clicks = JSON.parse(this.store() || '[]');
        const instance = clicks.find(e => e.wfid == id);

        if (!instance) {
            clicks.push({
                wfid: id,
                count: 1,
                data: json
            });
        } else {
            instance.count++;
            instance.data = json;
        }

        storage('mapofire.clicks', JSON.stringify(clicks));

        return this;
    }

    getStatus(s, n, t = 'Wildfire', ac = '0') {
        let a = ac.toString().toLowerCase();
        if (!s && !n) return 'active';

        if (s) {
            if (s.Out) return 'out';
            if (s.Control) return 'controlled';
            if (s.Contain) return 'contained';
            if (Object.keys(s).length > 0) return '';
        }

        const notes = n?.toLowerCase() || '';
        if (notes.includes('contain')) return 'contained';
        if (notes.includes('control')) return 'controlled';

        if (t == 'Smoke Check' && (a == '0' || a == 'unknown' || a == '')) {
            return 'unknown';
        }

        return 'active';
    }

    getDispatchCenter(center) {
        return global.dispatchCenters.find(d =>
            center === d.agency || center === d.agency.replace('-s', '')
        ) ?? null;
    }

    /*largestGrowthTime(it) {
        const now = new Date();

        const getMidnight = (d) => {
            d.setHours(0, 0, 0, 0);
            return d;
        };

        const today = getMidnight(new Date(now));
        const yesterday = getMidnight(new Date(now));
        yesterday.setDate(yesterday.getDate() - 1);

        const startOfWeek = getMidnight(new Date(now));
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        if (date >= today) {
            return "today";
        } else if (date >= yesterday) {
            return "yesterday";
        } else if (date >= startOfWeek) {
            const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
            return `on ${weekdayFormatter.format(date)}`;
        } else {
            const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            return `on ${dateFormatter.format(date)}`;
        }
    }*/

    largestGrowthTime(it) {
        const when = new Date(it * 1000);
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86400000);
        const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        if (when.getMonth() == now.getMonth() && when.getDate() == now.getDate()) return 'today';
        if (when.getMonth() == yesterday.getMonth() && yesterday.getDate() == now.getDate()) return 'yesterday';

        return `on ${dateFormatter.format(when)}`;
    }

    fireStats(history, incID = null) {
        let changes = [];

        const year = Number(incID?.split('-')[0] ?? config.curTime.getFullYear()),
            last = history[0],
            first = history[history.length - 1],
            curAcres = parseFloat(first.acres),
            firstAcres = parseFloat(last.acres),
            totalMinutes = Math.round(Math.abs((first.updated - last.updated) / 60)),
            statSentence = [];

        // Compute consecutive changes
        for (let i = 0; i < history.length - 1; i++) {
            const change = parseFloat(history[i + 1].acres) - parseFloat(history[i].acres);
            changes.push(change);
        }

        const diff = curAcres - firstAcres,
            overall = global.conversion.sizeFormat(diff);

        // Average growth per day/hour
        let growthSum = 0, growthTime = 0;

        for (let i = 0; i < history.length - 1; i++) {
            const change = parseFloat(history[i + 1].acres) - parseFloat(history[i].acres);
            if (change > 0) {
                growthSum += change;
                growthTime += (history[i + 1].updated - history[i].updated); // in seconds
            }
        }

        // Duration string
        let duration;

        if (totalMinutes >= 40320) {
            const w = Math.floor(totalMinutes / 10080);
            duration = `${w} week${w !== 1 ? 's' : ''}`;
        } else if (totalMinutes >= 1440) {
            const d = Math.floor(totalMinutes / 1440);
            duration = `${d} day${d !== 1 ? 's' : ''}`;
        } else if (totalMinutes >= 60) {
            const h = Math.floor(totalMinutes / 60);
            duration = `${h} hour${h !== 1 ? 's' : ''}`;
        } else {
            duration = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
        }

        // Largest positive growth only
        const positiveChanges = changes.filter(c => c > 0);
        const negativeChanges = changes.filter(c => c < 0);
        const onlyNegative = positiveChanges.length === 0 && negativeChanges.length > 0;

        const maxGrowth = positiveChanges.length ? Math.max(...positiveChanges) : 0;
        const whenGrew = maxGrowth ? this.largestGrowthTime(history[changes.indexOf(maxGrowth) + 1].updated) : '';

        if (onlyNegative) statSentence.push(`This fire was discovered at ${global.conversion.sizeFormat(last.acres)}.`);

        if (diff > 0) {
            const isCurrentYear = year === config.curTime.getFullYear();
            statSentence.push(`Over ${duration}${!isCurrentYear ? ` in ${year}` : ''}, this fire grew ${isCurrentYear ? 'by' : 'to'} ${overall}.`);
        } else {
            statSentence.push(`Incident reporting has decreased this fire in size by ${Math.abs(diff).toFixed(2).replace(/\.?0+$/, '')} acres.`);
        }

        if (maxGrowth > 0) statSentence.push(`The largest single growth was ${global.conversion.sizeFormat(maxGrowth)} ${whenGrew}.`);

        return `${statSentence.join(' ')}`;
    }

    async createChart(fireName, incID, hist) {
        if (hist.length <= 1) {
            document.querySelector('#acres_history').parentElement.parentElement.remove();
            return;
        }

        const { default: Chart } = await import(
            /* webpackIgnore: true */
            `https://cdn.jsdelivr.net/npm/chart.js@${ENV.versions.chartJS}/auto/+esm`
        );

        // reverse data to show oldest to newest
        hist.sort((a, b) => a.updated - b.updated);

        const fireStats = this.fireStats(hist, incID);
        const fireHistory = hist.map(item => ({
            x: item.updated,
            y: item.acres
        }));

        const chartArea = document.querySelector('#acres_history');
        chartArea.innerHTML = '<canvas style="width:100%;height:100%"></canvas>';
        const ctx = chartArea.querySelector('canvas').getContext('2d');

        const firstDate = hist[0].updated * 1000;
        const lastDate = hist[hist.length - 1].updated * 1000;
        const df = { year: 'numeric', month: 'short', day: 'numeric' };

        global.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Acres',
                    data: fireHistory,
                    tension: 0.2,
                    borderColor: '#e41616',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#e41616',
                    pointBorderWidth: 1,
                    fill: false,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 16
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        align: 'center',
                        labels: {
                            color: '#eee'
                        }
                    },
                    title: {
                        display: false
                    },
                    subtitle: {
                        display: true,
                        text: `${fireName} (${incID}) growth history from ${Intl.DateTimeFormat('en-US', df).format(firstDate)} to ${Intl.DateTimeFormat('en-US', df).format(lastDate)}.`,
                        position: 'bottom',
                        align: 'start',
                        color: '#fff',
                        font: {
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: items => {
                                const item = hist[items[0].dataIndex];
                                const match = RegExp(/([A-Za-z]+\s[0-9]+,\s[0-9]{4}),\s(.*)/).exec(
                                    Intl.DateTimeFormat('en-US', {
                                        ...df,
                                        hour: 'numeric',
                                        minute: 'numeric'
                                    }).format(item.updated * 1000));

                                return `${match[1]} - ${match[2]}`;
                            },
                            label: context => {
                                const item = hist[context.dataIndex],
                                    prev = hist[context.dataIndex - 1] ?? item,
                                    pct = `${Math.round(((item.acres - prev.acres) / prev.acres) * 100)}%`;

                                const out = [`${item.acres.toLocaleString()} acres`];

                                if (item.change > 0) out.push(`${item.change >= 0 ? '+' : ''}${item.change.toLocaleString()} acres (${pct})`);

                                return out;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        min: hist[0].updated,
                        grid: {
                            color: '#212d42'
                        },
                        title: {
                            display: true,
                            text: 'Timeline',
                            color: '#eee'
                        },
                        ticks: {
                            maxTicksLimit: 7,
                            includeBounds: true,
                            callback: value => {
                                return Intl.DateTimeFormat('en-US', df).format(value * 1000);
                            },
                            color: '#aaa'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#212d42'
                        },
                        title: {
                            display: true,
                            text: 'Total Acres',
                            color: '#eee'
                        },
                        ticks: {
                            color: '#aaa',
                            callback: val => val.toLocaleString()
                        }
                    }
                }
            }
        });

        if (fireStats != null) {
            const p = document.createElement('p');
            p.classList.add('fireStats');
            p.innerHTML = `<i class="far fa-chart-line-up"></i><span style="display:block;line-height:1.2">${fireStats}</span>`;
            document.querySelector('#acres_history').parentElement.appendChild(p);
        }

        return this;
    }

    findFire(id, incId = null, logFire = false) {
        let found = null;

        if (id != null) {
            found = global.activeIncidents.get(Number(id)) ?? null;
        }

        if (!found && incId != null) {
            for (const i of global.activeIncidents.values()) {
                if (i.properties.incidentId == incId) {
                    found = i;
                    break;
                }
            }
        }

        if (!found) return null;

        if (logFire) {
            const p = found.properties;
            const t = p.time;

            return {
                wfid: p.wfid,
                name: p.name,
                state: p.state,
                type: p.type,
                incidentID: p.incidentId,
                acres: p.acres,
                discovered: Number(t.discovered),
                updated: Number(t.updated)
            };
        }

        return found;
    }

    async getTrackedFires() {
        if (config.settings.user) {
            const resp = await api(`${ENV.host}api/v1/trackFires/list`, null, false, true);
            global.dataView.trackedFires = resp.fires?.map(f => f.wfid) ?? [];
        } else {
            const stored = storage('mapofire.tracked');
            global.dataView.trackedFires = stored ? JSON.parse(stored) : [];
        }

        global.inits.trackedDone = true;

        // if modal is already open with wildfire data, change the follow button now
        if (document.querySelector('#modal').classList.contains('opened', 'fire')) {
            const tf = document.querySelector('#trackFire');

            if (tf && global.dataView.trackedFires.includes(tf.dataset.id)) {
                tf.dataset.following = '1';
                tf.title = 'You\'re following this fire';
                tf.classList.add('fas', 'follow');
                tf.classList.remove('far');
            }
        }

        return this;
    }

    async getBushfireNames() {
        const data = await api('https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Near_Real_Time_Bushfire_Boundaries_view/FeatureServer/3/query', [
            ['where', '1=1 AND fire_name IS NOT NULL'],
            ['outFields', 'fire_id,fire_name,state,area_ha,ignition_date'],
            ['returnGeometry', false],
            ['returnCentroid', true],
            ['f', 'json']
        ]);

        if (!data || !data?.features?.length) return null;

        data.features.forEach(fire => {
            const discover = Math.round(fire.attributes.ignition_date / 1000),
                json = {
                    geometry: { type: 'Point', coordinates: [fire.centroid.x, fire.centroid.y] },
                    properties: {
                        isAustralia: true,
                        wfid: fire.attributes.fire_id,
                        name: fire.attributes.fire_name,
                        state: fire.attributes.state == 'WA' ? 'WAA' : (fire.attributes.state == 'NT' ? 'NTT' : fire.attributes.state),
                        type: 'Bushfire',
                        status: 'active',
                        acres: fire.attributes.area_ha * 2.471,
                        time: { year: new Date(discover * 1000).getFullYear(), discovered: discover }
                    }
                };
            global.activeIncidents.set(parseInt(fire.attributes.fire_id, 10), json);
        });
    }

    async canada() {
        const statuses = ['Out of control', 'Being held', 'Under Control', 'Out'],
            now = new Date().getTime() / 1000,
            fires = await api(`${ENV.apiURL}wildfires/canada`);

        if (fires != null && fires.features != null) {
            fires.features.forEach((f, n) => {
                fires['features'][n]['properties']['isCanada'] = true;

                statuses.forEach((stats) => {
                    if (f.properties.status && f.properties.status.search(stats) >= 0) {
                        fires['features'][n]['properties'][stats] = true;
                    }
                });

                global.activeIncidents.set(parseInt(f.properties.wfid, 10), f);
            });
        }

        if (!global.map.getSource('ca_fires')) {
            global.map.addSource('ca_fires', {
                type: 'geojson',
                data: fires,
                cluster: config.clusterFires,
                clusterMaxZoom: window.innerWidth < 600 || window.outerWidth < 600 ? 6 : 7,
                clusterMinPoints: 20,
                clusterRadius: 50
            });
        }

        const chk = setInterval(() => {
            if (global.map.isSourceLoaded('ca_fires')) {
                const vis = config.settings.isEnabled('allFires') ? 'visible' : 'none';

                clearInterval(chk);

                if (!global.map.getLayer('ca_fires')) {
                    global.map.addLayer({
                        id: 'ca_fires',
                        type: 'symbol',
                        source: 'ca_fires',
                        layout: {
                            'icon-image': [
                                'case',
                                [
                                    '<',
                                    ['-', now, ['to-number', ['get', 'discovered', ['get', 'time']]]],
                                    ['to-number', (12 * 60 * 60)]
                                ],
                                [
                                    'case',
                                    [
                                        '>=',
                                        ['to-number', ['get', 'acres']],
                                        100
                                    ],
                                    'fire-icon-new-big',
                                    'fire-icon-new'
                                ],
                                ['has', 'Out of control'],
                                'fire-icon',
                                ['has', 'Under Control'],
                                'fire-icon-controlled',
                                ['has', 'Begin held'],
                                'fire-icon-contained',
                                ['has', 'Out'],
                                'fire-icon-out',
                                [
                                    '>=',
                                    ['to-number', ['get', 'acres']],
                                    1000
                                ],
                                'fire-icon-large',
                                [
                                    '>=',
                                    ['to-number', ['get', 'acres']],
                                    100
                                ],
                                'fire-icon-big',
                                'fire-icon'
                            ],
                            'icon-size': [
                                'case',
                                ['has', 'Out'],
                                0.3,
                                0.4
                            ],
                            'icon-allow-overlap': true,
                            visibility: vis
                        }
                    });

                    mapMouseOver('ca_fires');
                }

                if (!global.map.getLayer('ca_fire_title')) {
                    global.map.addLayer({
                        id: 'ca_fire_title',
                        type: 'symbol',
                        source: 'ca_fires',
                        minzoom: window.innerWidth < 600 || window.outerWidth < 600 ? 5 : 6,
                        paint: {
                            'text-color': '#000',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 2,
                            'text-opacity': [
                                'step',
                                ['zoom'],
                                [
                                    'case',
                                    ['>', ['to-number', ['get', 'acres']], 1000],
                                    1.0,
                                    0.0
                                ],
                                9,
                                1.0
                            ]
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 150,
                            'text-font': config.fonts.source(),
                            'text-field': [
                                'case',
                                [
                                    '==',
                                    ['get', 'type'],
                                    'Wildfire'
                                ],
                                ['concat', ['get', 'name'], ' Fire'],
                                ['get', 'name']
                            ],
                            'text-justify': 'center',
                            'text-size': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                7,
                                [
                                    'case',
                                    ['>', ['to-number', ['get', 'acres']], 1000],
                                    12,
                                    10
                                ],
                                14,
                                [
                                    'case',
                                    ['>', ['to-number', ['get', 'acres']], 1000],
                                    15,
                                    13
                                ]
                            ],
                            'text-max-width': 10,
                            'text-anchor': 'top',
                            'text-offset': [
                                'case',
                                ['>', ['to-number', ['get', 'acres']], 1000],
                                ['literal', [0, 1.3]],
                                ['literal', [0, 1]]
                            ],
                            'text-allow-overlap': false,
                            'text-letter-spacing': 0.05,
                            visibility: vis
                        }
                    });

                    mapMouseOver('ca_fire_title');
                }
            }
        }, 500);

        return this;
    }

    processFires(fires, type, update) {
        if (!fires?.features) return;

        const sourceId = `${type}_fires`;
        const source = global.map.getSource(sourceId);

        // add or get properties from json return
        fires.features.forEach(f => {
            const p = f.properties;

            ['Out', 'Contain', 'Control'].forEach(status => {
                p[status] = p.status[status] ? true : false;
            });

            p.name = config.wildfire.fireName(p.name, p.type, p.incidentId);
            global.activeIncidents.set(parseInt(p.wfid, 10), f);

            if (type === 'new' && p.acres >= 100 && !global.dataView.newFires.some(item => item.properties.incidentId === p.incidentId)) {
                global.dataView.newFires.push(f);
            }
        });

        if (update) {
            source.setData(fires);
        } else {
            if (!source) {
                global.map.addSource(sourceId, {
                    type: 'geojson',
                    data: fires,
                    cluster: config.clusterFires,
                    clusterMaxZoom: type === 'all' ? (window.innerWidth < 600 ? 6 : 7) : 8,
                    clusterMinPoints: type === 'all' ? 20 : 5,
                    clusterRadius: type === 'all' ? 50 : 20
                });
            }
        }
    }

    async getComplexes() {
        const childIds = new Set();
        const fires = await api(`${ENV.apiURL}wildfires/complexes`);

        if (!fires?.features) return;

        fires.features.forEach(({ properties }) => {
            const children = properties.children
                .map(f => this.findFire(null, f.incidentID, true))
                .filter(Boolean);

            if (!children.length) return;

            children.forEach(({ incidentID }) => childIds.add(incidentID));

            global.activeComplexes.set(properties.incidentID, {
                name: properties.name,
                children
            });
        });

        this.displayComplexes(fires);

        const source = global.map.getSource('all_fires');
        const data = await source.getData();

        data.features.forEach(feature => {
            feature.properties.isComplex = childIds.has(feature.properties.incidentId);
        });

        source.setData(data);
    }

    async displayComplexes(data) {
        if (!global.map.getSource('complexes')) {
            global.map.addSource('complexes', {
                type: 'geojson',
                data: data,
                cluster: config.clusterFires,
                clusterMaxZoom: window.innerWidth < 600 ? 6 : 7,
                clusterMinPoints: 20,
                clusterRadius: 50
            });
        }

        if (!global.map.getLayer('complexes')) {
            global.map.addLayer({
                id: 'complexes',
                type: 'symbol',
                source: 'complexes',
                layout: {
                    'icon-image': 'fire-icon-complex',
                    'icon-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        3,
                        0.125,
                        6,
                        0.25,
                        9,
                        0.375
                    ],
                    'icon-allow-overlap': true,
                    visibility: 'visible'
                }
            });

            mapMouseOver('complexes');
        }

        if (!global.map.getLayer('complexes_title')) {
            global.map.addLayer({
                id: 'complexes_title',
                type: 'symbol',
                source: 'complexes',
                minzoom: 7,
                paint: {
                    'text-color': '#fff',
                    'text-halo-color': '#111',
                    'text-halo-blur': 50,
                    'text-halo-width': 100
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': config.fonts.source(),
                    'text-field': ['get', 'name'],
                    'text-justify': 'center',
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7,
                        12,
                        12,
                        17
                    ],
                    'text-transform': 'uppercase',
                    'text-max-width': 8,
                    'text-anchor': 'top',
                    'text-offset': [0, 1.5],
                    'text-allow-overlap': false,
                    'text-letter-spacing': 0,
                    visibility: 'visible'
                }
            });

            mapMouseOver('complexes_title');
        }
    }

    async showComplex(complex, geometry) {
        let totalAcres = 0;
        const updated = [];
        let ul = document.createElement('ul');
        ul.classList.add('new_fires');

        complex?.children
            .map(child => config.wildfire.findFire(null, child.incidentID))
            .filter(Boolean)
            .sort((a, b) => Number(b.properties?.acres ?? 0) - Number(a.properties?.acres ?? 0))
            .forEach(fire => {
                const li = document.createElement('li'),
                    name = `${fire.properties.name.replace(' Fire', '')}${(fire.properties.type == 'Wildfire' ? ' Fire' : '')}`,
                    near = fire.properties.near,
                    size = global.conversion.sizeFormat(fire.properties.acres);

                totalAcres += fire.properties.acres;
                updated.push(fire.properties.time.updated);

                li.dataset.action = 'new-fires';
                li.dataset.lat = fire.geometry.coordinates[1];
                li.dataset.lon = fire.geometry.coordinates[0];
                li.dataset.wfid = fire.properties.wfid;
                li.innerHTML = `<div class="pert"><h3>${name}</h3><span class="near">${near}</div></div><span class="disc">${size}</span>`;
                ul.appendChild(li);
            });

        createDataForm(`${complex.name}`, `<div style="margin-bottom:1em">
            <span style="font-size:14px;color:#888">
                Last updated ${updated.length ? timeAgo(Math.max.apply(null, updated)) : 'N/A'} &middot; <b>Total size:</b> ${global.conversion.sizeFormat(totalAcres, true, false)} ${global.conversion.sizeUnit()}
            </span>
        </div>
        ${ul.outerHTML}`);

        return this;
    }

    // get wildfires from API
    async getWildfires(update = false) {
        const qInput = document.querySelector('#q');
        const types = ['all', 'new', 'smk', 'rx'];

        if (config.settings.archive) {
            const fires = await api(`${ENV.apiURL}wildfires/all`, [['archive', config.settings.archive], ['bbox', getbbox()]]);

            this.processFires(fires, 'all', update);
            this.displayFires('all', 0);
        } else {
            // get canadian wildfires
            this.canada();

            // get fire types from API
            await Promise.all(types.map(async (type, i) => {
                const fires = await api(`${ENV.apiURL}wildfires/${type}`);
                this.processFires(fires, type, update);

                if (type === 'new' && global.dataView.newFires.length > 0) this.renderNewFiresUI(global.dataView.newFires.length);

                // Wait for source load before displaying
                await new Promise(resolve => {
                    const check = () => {
                        if (global.map.getSource(`${type}_fires`) && global.map.isSourceLoaded(`${type}_fires`)) {
                            this.displayFires(type, i);
                            resolve();
                        } else {
                            requestAnimationFrame(check);
                        }
                    };

                    check();
                });
            }));

            this.getComplexes();
        }

        if (qInput) qInput.disabled = false;
        return this;
    }

    renderNewFiresUI(count) {
        const nf = document.querySelector('nav #new_fires');

        nf.dataset.action = 'new_fires';
        nf.title = 'New Fires';
        nf.style.display = 'inline-flex';

        const nfCount = document.createElement('div');
        nfCount.className = `notify${count > 9 ? ' m10' : ''}`;
        nfCount.innerHTML = count;
        nf.appendChild(nfCount);
    }

    // display wildfires on the map
    async displayFires(type, n) {
        const lay = ['allFires', 'newFires', 'smokeChecks', 'rxBurns'],
            fireLayerName = `${type}_fires`,
            vis = config.settings.isEnabled(lay[n]) || !config.settings.checkboxes() && type != 'rx' ? 'visible' : 'none';

        // add fires to map
        if (global.map.getSource(fireLayerName)) {
            if (!global.map.getLayer(fireLayerName)) {
                const layer = {
                    id: fireLayerName,
                    type: 'symbol',
                    source: fireLayerName,
                    layout: {
                        'icon-image': this.fireIcon(type),
                        'icon-size': [
                            'case',
                            ['==', ['get', 'isComplex'], true],
                            0.25,
                            ['==', ['get', 'Out'], true],
                            0.3,
                            0.4
                        ],
                        'icon-allow-overlap': true,
                        visibility: vis
                    }
                };

                global.map.addLayer(layer);

                mapMouseOver(fireLayerName);
            }

            if (!global.map.getLayer(`${fireLayerName}_title`)) {
                global.map.addLayer({
                    id: `${fireLayerName}_title`,
                    type: 'symbol',
                    source: fireLayerName,
                    minzoom: window.innerWidth < 600 || window.outerWidth < 600 ? 4 : 5,
                    paint: {
                        'text-color': '#000',
                        'text-halo-color': '#fff',
                        'text-halo-blur': 1,
                        'text-halo-width': 2,
                        'text-opacity': [
                            'step',
                            ['zoom'],
                            [
                                'case',
                                ['>', ['to-number', ['get', 'acres']], 1000],
                                1.0,
                                0.0
                            ],
                            9,
                            1.0
                        ]
                    },
                    layout: {
                        'symbol-placement': 'point',
                        'symbol-spacing': 150,
                        'text-font': config.fonts.source(),
                        'text-field': ['get', 'name'],
                        'text-justify': 'center',
                        'text-size': this.fireTextSize(type, 'size'),
                        'text-max-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            5,
                            ['case', ['==', ['get', 'isComplex'], true], 5, 7],
                            7,
                            ['case', ['==', ['get', 'isComplex'], true], 8, 10],
                        ],
                        'text-line-height': 1.0,
                        'text-anchor': 'top',
                        'text-offset': this.fireTextSize(type, 'offset'),
                        'text-allow-overlap': false,
                        'text-letter-spacing': 0.05,
                        visibility: vis
                    }
                });

                mapMouseOver(`${fireLayerName}_title`);
            }
        }

        reorderLayers();

        return this;
    }

    doWeather(geo) {
        let wx = new Weather(geo[1], geo[0]);

        wx.incidentWX();
        wx.incidentForecast();
        /*wx.nearbyAQ();*/
    }

    fireName(name, type, incidentId) {
        switch (type) {
            case 'Prescribed Fire':
                if (name && /RX/i.test(name)) {
                    return name;
                }

                return (name || '') + ' RX';

            case 'Smoke Check': {
                let incidentNum = '';

                if (incidentId) {
                    const parts = incidentId.split('-');

                    if (parts.length > 2) {
                        const part1 = parts[1];
                        const part2 = Number.parseInt(parts[2], 10);

                        if (!Number.isNaN(part2)) {
                            incidentNum = ` #${part1}${part2}`;
                        }
                    }
                }

                return `Smoke Check${incidentNum}`;
            }

            default: {
                if (name == null || name.trim() === "") {
                    const parts = incidentId?.split("-") ?? [];
                    const parsedNum = Number.parseInt(parts[2], 10);

                    const incidentNum = !Number.isNaN(parsedNum)
                        ? String(parsedNum)
                        : incidentId || "Unknown";

                    return `Incident #${incidentNum}`;
                }

                let cleanedName = name.replace(/^\d+(?=\D)\s?/, "");
                cleanedName = cleanedName.toLowerCase().ucwords() + " Fire";

                for (const prefix of ["Mc", "Mac"]) {
                    if (cleanedName.startsWith(prefix)) {
                        cleanedName =
                            prefix +
                            cleanedName
                                .slice(prefix.length)
                                .replace(/^./, char => char.toUpperCase());

                        break;
                    }
                }

                return cleanedName;
            }
        }
    }

    async cacheIncident(wfid) {
        const cache = await caches.open(`mapofire-v${VERSION}`);
        const cacheKey = new Request('/' + wfid);

        try {
            // if user has in-app caching enabled
            if (config.settings.fire().cache() && !debugMode) {
                const cachedResponse = await cache.match(cacheKey);

                if (cachedResponse) {
                    const cachedData = await cachedResponse.json();

                    if (Date.now() - cachedData.timestamp < 10 * 60 * 1000) {
                        return cachedData.data;
                    } else {
                        cache.delete(cacheKey);
                    }
                }
            }

            const data = await api(`${ENV.apiURL}wildfires/incident`, [['wfid', wfid], ['history', 1]]);

            // if user has in-app caching enabled
            if (config.settings.fire().cache() && !data.error) {
                await cache.put(cacheKey, new Response(JSON.stringify({ data: data, timestamp: Date.now() })));
            }

            return data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    geoLocate(agency, type, fire) {
        let land = '';
        if (agency.logo == 'usfs') land = ` (${agency.area})`;

        return `<b>${type.toUpperCase()}</b> in ${fire.geometry.geo.county} County${fire.geometry.state ? `, ${fire.geometry.state}` : ''}${land}`;
    }

    async incident(wfid, zoomIn = true) {
        if (zoomIn) {
            const coords = this.findFire(wfid);
            if (coords) modalZoom(coords.geometry.coordinates);
        }

        global.inits.clickListener.openModal('fire');

        // get incident json from cache or API
        const incident = await this.cacheIncident(wfid);
        const fire = incident.fire;

        if (fire?.error == 404) {
            global.inits.clickListener.closeModal();
            notify('error', 'The incident you\'re looking for does not exist.');
            return;
        }

        const nearbyEvacs = await new NearbyEvacuations(fire).get();

        const prop = fire.properties;
        const fireIncName = this.fireName(prop.fireName, prop.type, prop.incidentId);
        const near = fire.geometry?.geo.near;
        const displayNear = !near || near == '' ? '' : ` near ${near.split(' of ')[1]}`;
        const acresHistory = prop.acres_history;
        //const nearbyPerims = new Perimeters().getAssociatedPerim(prop.fireName);

        // change the URL in the browser
        setHeaders(`${fireIncName}${displayNear} - Current Incident Information and Wildfire Map`, prop.url,
            `See current information on the ${fireIncName}${displayNear}.`);

        if (fire.inciweb && fire.inciweb.photo) {
            document.querySelector('meta[property="og:image"]').setAttribute('content', `https://mapofire.com/src/images/incident?path=${fire.inciweb.photo.url}`);
            document.querySelector('meta[name="twitter:image"]').setAttribute('content', `https://mapofire.com/src/images/incident?path=${fire.inciweb.photo.url}`);

            document.querySelector('meta[property="og:image:alt"]').setAttribute('content', fire.inciweb.photo.caption);
        }

        const worker = new Worker(
            new URL('../workers/incident.js', import.meta.url),
            { type: 'module' }
        );

        // send data to service worker
        worker.postMessage({
            fire: {
                json: incident,
                fireName: fireIncName,
                geoLocate: this.geoLocate(fire.protection, prop.type, fire),
                status: this.getStatus(prop.status, prop.notes, prop.type, prop.acres)
            },
            role: config.settings.getUser().role(),
            hasPermissions: config.settings?.hasPermissions(),
            vars: {
                domain: ENV.domain,
                center: this.getDispatchCenter(fire.protection.dispatch),
                agencies: this.agencies,
                tracked: global.dataView.trackedFires,
                acres: global.conversion.sizeFormat(prop.acres, true, false),
                sizeUnit: global.conversion.sizeUnit(),
                reported: {
                    ago: timeAgo(fire.time.discovered),
                    useAgo: (Date.now() / 1000) - fire.time.discovered < 60 * 60 * 6
                },
                updated: (config.curTime.getTime() / 1000) - fire.time.updated > this.TWO_MONTHS ? dateTime(fire.time.updated, true) : timeAgo(fire.time.updated)
            }
        });

        // add content to modal after service worker finishes
        worker.onmessage = async (event) => {
            modal.querySelector('.content').innerHTML = event.data;

            const acHis = modal.querySelector('#acres_history'),
                scrd = modal.querySelector('span.coords');

            // if nearby evacuations exist, show them on the modal
            if (nearbyEvacs.length) {
                let theEvacs = [];

                nearbyEvacs.reverse().forEach(z => {
                    const nomen = (z.level == 1 ? 'Be Ready' : (z.level == 2 ? 'BE SET' : 'GO NOW'));

                    theEvacs.push(`<div class="evac level${z.level}">
                        <div class="evacTitle">
                            <h3>
                                <span class="evac-circ l${z.level}"></span>
                                Level ${z.level}: ${nomen}
                            </h3>
                        </div>
                        <details>
                            <summary style="font-weight:400">${formatArray(z.counties)} Count${(z.counties.length == 1 ? 'y' : 'ies')}</summary>
                            <span style="font-size:15px">${z.notes.join(', ')}</span>
                        </details>
                        <p class="updated" style="text-align:left">Last updated ${timeAgo(z.updated)} via ${stateLabels[z.state[0]].name} OEM</p>
                    </div>`);
                });

                document.querySelector('.incident #curwx').parentElement.insertAdjacentHTML('beforebegin', `<div class="evacs">${theEvacs.join('')}</div>`);
            }

            // get incident weather
            this.doWeather([fire.geometry.lon, fire.geometry.lat]);

            // remove any features that require a user to be subscribed
            if (!config.settings?.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
                acHis.style.height = 'unset';
                acHis.innerHTML = '<a href="#" data-action="marketing-cta" data-utm="acres_history" class="btn btn-orange btn-lg" onclick="return false"><i class="fas fa-lock"></i>Upgrade to see growth history</a>';
                /*document.querySelector('#acres_history').parentElement.parentElement.remove();*/

                // blur coordinates
                scrd.innerHTML = '0.0000 -0.0000';
                scrd.style.cursor = 'default';
                scrd.classList.add('blur');
            } else {
                scrd.style.cursor = 'pointer';

                // load the script for the chart, then create the acreage chart
                if (acresHistory == null) {
                    modal.querySelector('#acres_history_wrapper').remove();
                    return;
                }

                this.createChart(
                    fireIncName,
                    prop.incidentId,
                    acresHistory
                );
            }
        };

        return this;
    }
}