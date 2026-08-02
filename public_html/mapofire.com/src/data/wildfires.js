import { ENV, config, debugMode } from '../app/config.js';
import { global, modal } from '../app/state.js';

import { storage, api, timeAgo, setHeaders, mapMouseOver, loadScript, formatArray, dateTime, getbbox } from '../utils/helpers.js';
import { stateLabels, DateFormatter } from '../utils/constants.js';
import { ArcGISFeature } from '../map/arcgis.js';

import { modalZoom } from '../map/mapping.js';

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
        this.REGION_BBOX = {
            ca: [-141.0, 41.7, -52.6, 83.1],        // Canada approx
            aus: [112.0, -44.0, 154.0, -10.0]       // Australia approx
        }
    }

    fireTextSize(t, which) {
        const thresh = t === 'new' ? 100 : 1000;
        const isBig = [
            'all',
            ['>=', ['to-number', ['coalesce', ['get', 'acres'], 0]], thresh],
            ['!=', ['get', 'Out'], true],
            ['!=', ['get', 'Control'], true],
            ['!=', ['get', 'Contain'], true]
        ];

        const config = {
            size: {
                z5: [isBig, 12, 10],
                z10: [isBig, 15, 13]
            },
            offset: {
                z5: [
                    isBig,
                    ['literal', [0, 1.3]],
                    ['literal', [0, 1.0]]
                ],
                z10: [
                    isBig,
                    ['literal', [0, 1.1]],
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
        if (history.length < 2) return null;

        let changes = [];
        let totalAcres = 0, totalTimeDiff = 0;

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
            totalAcres += change;
            totalTimeDiff += history[i + 1].updated - history[i].updated;
        }

        const diff = curAcres - firstAcres,
            overall = global.conversion.sizeFormat(diff);

        // Average growth per day/hour
        let avgValue, growthUnit, growthSum = 0, growthTime = 0;

        for (let i = 0; i < history.length - 1; i++) {
            const change = parseFloat(history[i + 1].acres) - parseFloat(history[i].acres);
            if (change > 0) {
                growthSum += change;
                growthTime += (history[i + 1].updated - history[i].updated); // in seconds
            }
        }

        if (growthTime === 0) {
            avgValue = 0;
            growthUnit = "day"; // default
        } else {
            const growthHours = growthTime / 3600;
            const growthDays = growthHours / 24;

            if (growthDays > 2) {
                avgValue = growthSum / growthDays;
                growthUnit = "day";
            } else {
                avgValue = growthSum / growthHours;
                growthUnit = "hour";
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
            statSentence.push(`Over ${duration}${!isCurrentYear ? ` in ${year}` : ''}, this fire grew ${isCurrentYear ? 'by' : 'to'} ${overall}, averaging ${global.conversion.sizeFormat(avgValue)} of growth per ${growthUnit} (when active).`);
        } else {
            statSentence.push(`Incident reporting has decreased this fire in size by ${Math.abs(diff).toFixed(2).replace(/\.?0+$/, '')} acres.`);
        }

        if (maxGrowth > 0) statSentence.push(`The largest single growth was ${global.conversion.sizeFormat(maxGrowth)} ${whenGrew}.`);

        return `${statSentence.join(' ')}`;
    }

    createChart(fireName, incID, hist) {
        if (hist.length <= 1) {
            document.querySelector('#acres_history').parentElement.parentElement.remove();
        } else {
            let lastTs = null;

            // reverse data to show oldest to newest
            hist.sort((a, b) => a.updated - b.updated);

            const data = hist.map((h) => {
                let ts = h.updated * 1000;

                if (ts === lastTs) ts += 1;

                lastTs = ts;
                return [ts, h.acres];
            });

            const fireStats = this.fireStats(hist, incID),
                gridColor = '#212d42',
                fmt = { year: 'numeric', month: 'long', day: 'numeric' },
                date1 = Intl.DateTimeFormat('en-US', fmt).format(data[0][0]),
                date2 = Intl.DateTimeFormat('en-US', fmt).format(data[data.length - 1][0]),
                dates = date1 == date2 ? ` on ${date1}` : ` from ${date1} to ${date2}`;

            Highcharts.setOptions({
                time: {
                    timezone: 'America/Los_Angeles'
                }
            });

            global.chart = Highcharts.chart('acres_history', {
                chart: {
                    type: 'line',
                    style: {
                        fontFamily: 'Roboto'
                    },
                    marginTop: 50,
                    backgroundColor: 'transparent'
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: null
                },
                legend: {
                    itemStyle: {
                        color: '#f1f1f1'
                    }
                },
                subtitle: {
                    text: `<b>${fireName} (${incID}) growth history ${dates}.</b>`,
                    useHTML: true,
                    verticalAlign: 'bottom',
                    align: 'left',
                    style: {
                        color: 'rgb(255 255 255 / 80%)'
                    }
                },
                navigation: {
                    buttonOptions: {
                        enabled: true
                    }
                },
                tooltip: {
                    xDateFormat: '%a, %b %e, %Y %l:%M %p',
                    shared: true
                },
                xAxis: {
                    type: 'datetime',
                    lineColor: gridColor,
                    tickColor: gridColor,
                    gridLineColor: gridColor,
                    gridLineWidth: 1,
                    labels: {
                        style: {
                            color: '#f1f1f1'
                        },
                        format: '{value:%b %e}'
                    }
                },
                yAxis: [{
                    lineWidth: 1,
                    lineColor: gridColor,
                    gridLineColor: gridColor,
                    gridLineWidth: 1,
                    title: {
                        text: 'Total Acres',
                        style: {
                            color: '#f1f1f1'
                        }
                    },
                    labels: {
                        style: {
                            color: '#fff'
                        }
                    },
                    min: 0
                }],
                series: [{
                    name: 'Total Acres',
                    type: 'line',
                    data: data
                }],
                panning: true,
                panKey: 'ctrl',
                zooming: {
                    type: 'xy'
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            symbolStroke: '#eee',
                            theme: {
                                fill: 'transparent',
                                states: {
                                    hover: {
                                        fill: '#223260'
                                    },
                                    select: {
                                        fill: '#223260'
                                    }
                                }
                            }
                        }
                    }
                },
                plotOptions: {
                    series: {
                        marker: {
                            symbol: 'circle',
                            fillColor: '#fff',
                            enabled: true,
                            radius: 3,
                            lineWidth: 1,
                            lineColor: null
                        }
                    }
                },
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 600
                        },
                        chartOptions: {
                            yAxis: {
                                title: {
                                    text: ''
                                }
                            }
                        }
                    }]
                },
                colors: ['#e41616', '#ffd54f']
            });

            if (fireStats != null) {
                const p = document.createElement('p');
                p.classList.add('fireStats');
                p.innerHTML = `<i class="far fa-chart-line-up"></i><span style="display:block;line-height:1.2">${fireStats}</span>`;
                document.querySelector('#acres_history').parentElement.appendChild(p);
            }
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
                global.map.addLayer({
                    id: fireLayerName,
                    type: 'symbol',
                    source: fireLayerName,
                    layout: {
                        'icon-image': this.fireIcon(type),
                        'icon-size': [
                            'case',
                            ['==', ['get', 'Out'], true],
                            0.3,
                            0.4
                        ],
                        'icon-allow-overlap': true,
                        visibility: vis
                    }
                });

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
                            7,
                            8,
                            10
                        ],
                        'text-line-height': 1.0,
                        'text-anchor': 'top',
                        'text-offset': this.fireTextSize(type, 'offset'),
                        'text-allow-overlap': false,
                        'text-letter-spacing': 0.05,
                        visibility: vis
                    }
                });

                mapMouseOver(`${fireLayerName}_fire`);
            }
        }

        /*if (type == 'rx' && global.map.getSource('perimeters')) {
            global.map.moveLayer('perimeters_fill', 'all_fires');
            global.map.moveLayer('perimeters_outline', 'all_fires');
            global.map.moveLayer('perimeters_title', 'all_fires');
        }*/

        return this;
    }

    getAssociatedPerim(fireName) {
        if (!config.settings.isEnabled('perimeters')) return;

        const src = global.map.getSource('perimeters')._data.geojson.features,
            wait = setInterval(() => {
                if (src) {
                    const name = fireName.replace(/\s/gm, '').toLowerCase();
                    clearInterval(wait);

                    const results = src.filter(feat => {
                        const p = feat.properties;

                        return p.attr_IncidentName.replace(/\s/gm, '').toLowerCase() == name ||
                            p.poly_IncidentName.replace(/\s/gm, '').toLowerCase() == name;
                    });

                    console.log(results);
                }
            }, 200);
    }

    doWeather(geo) {
        let wx = new Weather(geo[1], geo[0]);

        wx.incidentWX();
        wx.incidentForecast();
        /*wx.nearbyAQ();*/
    }

    fireName(n, t, i) {
        let o = '';

        if (t == 'Prescribed Fire') {
            o = (n.toLowerCase().includes('rx') ? n : `${n} RX`);
        } else if (t == 'Smoke Check') {
            o = 'Smoke Check' + (i !== undefined ? ` #${i.split('-')[1]}-${parseInt(i.split('-')[2])}` : '');
        } else {
            if (n === undefined || n == '') {
                o = 'Incident #' + parseInt(i.split('-')[2]);
            } else {
                const cleanedName = n.replace(/^\d+(?=\D)\s?/, '');
                o = `${cleanedName.toLowerCase().ucwords()} Fire`;
            }
        }
        return o;
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
        const TWO_MONTHS = 60 * 60 * 24 * (DateFormatter.daysInYear() / 6);

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

        const fireLat = fire.geometry.lat;
        const fireLon = fire.geometry.lon;
        const prop = fire.properties;
        const nearbyEvacs = await new NearbyEvacuations(fireLat, fireLon).get();
        const fireIncName = this.fireName(prop.fireName, prop.type, prop.incidentId);
        const near = fire.geometry?.geo.near;
        const displayNear = !near || near == '' ? '' : ` near ${near.split(' of ')[1]}`;
        const acresHistory = prop.acres_history;
        //const nearbyPerims = this.getAssociatedPerim(prop.fireName);

        // change the URL in the browser
        setHeaders(`${fireIncName}${displayNear} - Current Incident Information and Wildfire Map`, prop.url,
            `See current information on the ${fireIncName}${displayNear}.`);

        if (fire.inciweb && fire.inciweb.photo) {
            document.querySelector('meta[property="og:image"]').setAttribute('content', `https://mapofire.com/src/images/incident?path=${fire.inciweb.photo.url}`);
            document.querySelector('meta[name="twitter:image"]').setAttribute('content', `https://mapofire.com/src/images/incident?path=${fire.inciweb.photo.url}`);
        }

        if (fire.inciweb && fire.inciweb.photo) {
            document.querySelector('meta[property="og:image:alt"]').setAttribute('content', fire.inciweb.photo.caption);
        }

        // send data to service worker
        config.workers.incident.postMessage({
            fire: {
                json: incident,
                fireName: fireIncName,
                geoLocate: this.geoLocate(fire.protection, prop.type, fire),
                status: this.getStatus(prop.status, prop.notes, prop.type, prop.acres)
            },
            role: config.settings.getUser().role(),
            hasPermissions: config.settings.hasPermissions(),
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
                updated: (config.curTime.getTime() / 1000) - fire.time.updated > TWO_MONTHS ? dateTime(fire.time.updated, true) : timeAgo(fire.time.updated)
            }
        });

        // add content to modal after service worker finishes
        config.workers.incident.onmessage = (event) => {
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
            this.doWeather([fireLon, fireLat]);

            // remove any features that require a user to be subscribed
            if (!config.settings.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
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
                if (acresHistory != null) {
                    const c = this;

                    if (!global.inits.highchartsLoad) {
                        loadScript('https://code.highcharts.com/highcharts.js')
                            .then(() => {
                                global.inits.highchartsLoad = true;

                                loadScript('https://code.highcharts.com/modules/exporting.js').then(() => {
                                    c.createChart(fireIncName, prop.incidentId, acresHistory);
                                });
                            });
                    } else {
                        c.createChart(fireIncName, prop.incidentId, acresHistory);
                    }
                } else {
                    modal.querySelector('#acres_history_wrapper').remove();
                }
            }
        };

        return this;
    }

    perimeterColor(c) {
        let pc;

        switch (c) {
            case 'default':
            case 'red':
                pc = '#f35a5a';
                break;
            case 'blue':
                pc = '#3289d5';
                break;
            case 'orange':
                pc = '#fb8c00';
                break;
            case 'green':
                pc = '#388e3c';
                break;
            case 'purple':
                pc = '#9c27b0';
                break;
            case 'brown':
                pc = '#795548';
                break;
            case 'black':
                pc = '#333';
                break;
        }

        return config.settings.archive == null ? [
            'case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#777', pc] : '#777';
    }

    async intlPerimeters(/*update = false*/) {
        const vis = !config.settings.user || !config.settings.checkboxes() || config.settings.isEnabled('perimeters') ? 'visible' : 'none',
            min = config.settings.perimeters().minSize() / 2.471,    // convert to hectres for the metric countries
            pc = this.perimeterColor(config.settings.perimeters().color()),
            b = global.map.getBounds(),
            viewBBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
            intersects = (view, region) => {
                return !(view[2] < region[0] || view[0] > region[2] || view[3] < region[1] || view[1] > region[3]);
            },
            loadPerimeter = async ({ id, url, where }) => {
                const src = `${id}_perimeters`,
                    outline = `${id}_perimeters_outline`,
                    fill = `${id}_perimeters_fill`;

                // the map isn't over Canada or Australia so there's no need to fetch perimeters for those areas
                if (!intersects(viewBBox, this.REGION_BBOX[id])) return null;

                if (!global.map.getSource(src)) {
                    new ArcGISFeature(src, global.map, {
                        url: url,
                        precision: 6,
                        where: where,
                        outFields: '*'
                    });
                }
                /*const data = await api(url, [
                    ['where', where],
                    ['outFields', '*'],
                    ['resultType', 'tile'],
                    ['geometry', getbbox()],
                    ['geometryPrecision', 6],
                    ['geometryType', 'esriGeometryEnvelope'],
                    ['spatialRel', 'esriSpatialRelIntersects'],
                    ['returnGeometry', true],
                    ['f', 'geojson']
                ]);
     
                if (update && global.map.getSource(src)) {
                    global.map.getSource(src).setData(data);
                    return;
                }
     
                if (!global.map.getSource(src)) {
                    global.map.addSource(src, { type: 'geojson', data });
                }*/

                if (!global.map.getLayer(outline)) {
                    global.map.addLayer({
                        id: outline,
                        type: 'line',
                        source: src,
                        paint: {
                            'line-width': [
                                'case',
                                ['boolean', ['feature-state', 'click'], false],
                                3,
                                1
                            ],
                            'line-color': pc
                        },
                        layout: { visibility: vis }
                    });
                }

                if (!global.map.getLayer(fill)) {
                    global.map.addLayer({
                        id: fill,
                        type: 'fill',
                        source: src,
                        paint: {
                            'fill-opacity': 0.45,
                            'fill-color': pc
                        },
                        layout: { visibility: vis }
                    });

                    mapMouseOver(fill);
                }
            };

        await Promise.all([
            loadPerimeter({
                id: 'ca',
                url: 'https://services.arcgis.com/wjcPoefzjpzCgffS/ArcGIS/rest/services/Active_Wildfire_Perimeters_in_Canada_View/FeatureServer/0',
                where: `1=1 AND LASTDATE >= TIMESTAMP '${new Date().getFullYear()}-01-01 00:00:00' AND AREA >= ${min}`
            }),
            loadPerimeter({
                id: 'aus',
                url: 'https://services-ap1.arcgis.com/ypkPEy1AmwPKGNNv/arcgis/rest/services/Near_Real_Time_Bushfire_Boundaries_view/FeatureServer/3',
                where: `1=1 AND fire_name IS NOT NULL AND area_ha >= ${min}`
            })
        ]);

        return this;
    }

    async perimeters(update = false) {
        let vis = !config.settings.user || !config.settings.checkboxes() || config.settings.isEnabled('perimeters') ? 'visible' : 'none',
            y = (config.settings.archive ? config.settings.archive : config.curTime.getFullYear()),
            min = config.settings.perimeters().minSize(),
            pc = this.perimeterColor(config.settings.perimeters().color()),
            o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_ContainmentDateTime,attr_PercentContained,attr_FireOutDateTime',
            perimName = 'attr_IncidentName',
            w = `attr_FireDiscoveryDateTime>=TIMESTAMP '${y}-01-01 00:00:00'`;

        if (!config.settings.archive) w += ` AND (poly_GISAcres > ${min} OR poly_Acres_AutoCalc > ${min}) AND attr_FireOutDateTime IS NULL`;

        // get Canada wildfire perimeters if not in archive mode
        if (!config.settings.archive) this.intlPerimeters(update);

        if (!global.map.getSource('perimeters')) {
            new ArcGISFeature('perimeters', global.map, {
                url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0',
                precision: 6,
                where: w,
                outFields: o
            });
        }

        if (!global.map.getLayer('perimeters_fill')) {
            global.map.addLayer({
                id: 'perimeters_fill',
                type: 'fill',
                source: 'perimeters',
                paint: {
                    'fill-opacity': 0.45,
                    'fill-color': pc
                },
                layout: {
                    visibility: vis
                }
            });
        }

        if (!global.map.getLayer('perimeters_outline')) {
            global.map.addLayer({
                id: 'perimeters_outline',
                type: 'line',
                source: 'perimeters',
                paint: {
                    'line-width': [
                        'case',
                        ['boolean', ['feature-state', 'click'], false],
                        3,
                        1
                    ],
                    'line-color': pc
                },
                layout: {
                    visibility: vis
                }
            });
        }

        if (!global.map.getLayer('perimeters_title')) {
            global.map.addLayer({
                id: 'perimeters_title',
                type: 'symbol',
                source: 'perimeters',
                minzoom: 5.8,
                paint: {
                    'text-color': config.settings.archive ? '#fff' : ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#333', '#fff'],
                    'text-halo-color': config.settings.archive ? '#333' : ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#fff', '#ff0000'],
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 200,
                    'text-font': config.fonts.din(),
                    'text-field': ['upcase', ['concat', ['get', perimName], ' Fire']],
                    'text-size': 13,
                    'text-max-angle': 30,
                    'text-padding': 5,
                    'text-pitch-alignment': 'viewport',
                    'text-rotation-alignment': 'map',
                    'text-offset': [0, 1],
                    visibility: vis
                }
            });

            mapMouseOver('perimeters_fill');
        }

        return this;
    }
}