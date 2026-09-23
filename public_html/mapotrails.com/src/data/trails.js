import { ENV, config } from '../app/config.js';
import { api, createModal, numberFormat, setHeaders, ucwords } from '../utils/helpers.js';
import { fitBounds } from '../map/mapping.js';

export class Trails {
    constructor() {
        this.lh = config.layersHandler;

        this.trailheads = new Map();
        this.waypoints = new Map();

        this.getTrailheads();
        this.getWaypoints();
    }

    fields() {
        const fields = [];

        fields.push(['types', config.taxonomy.category]);
        if (config.taxonomy.activity != null) fields.push(['activity', config.taxonomy.activity]);

        return fields;
    }

    refresh() {
        const ths = {
            type: 'FeatureCollection',
            features: [...this.trailheads.values()]
        };

        const wyps = {
            type: 'FeatureCollection',
            features: [...this.waypoints.values()]
        };

        this.lh.displayTrailheads(ths);
        this.lh.displayTracks();
        this.lh.displayWaypoints(wyps);
    }

    async getTrailheads() {
        const trailsInArea = [];
        const resp = await api(`${ENV.apiURL}trails/list`, this.fields(), true);

        if (!resp?.features || resp?.features.length === 0) {
            console.error('Unable to load trail data at this time');
            return;
        }

        resp.features.forEach(feature => {
            const id = feature.properties.id;

            if (id) this.trailheads.set(id, feature);

            // If map needs to be a specific area, get features tagged with those keywords
            if (config.taxonomy.area && feature.properties?.keywords) {
                JSON.parse(feature.properties.keywords).forEach(keyword => {
                    const area = keyword
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-');

                    if (area === config.taxonomy.area.toLowerCase()) {
                        trailsInArea.push(feature);
                    }
                });
            }
        });

        if (typeof FIND_TRAIL !== 'undefined' && FIND_TRAIL) this.displayTrail(QUERY_TRAIL_ID);

        document.querySelector('#q').disabled = false;

        this.lh.displayTracks();
        this.lh.displayTrailheads(resp);

        if (typeof FIND_TRAIL !== 'undefined' && !FIND_TRAIL) this.zoomToArea(trailsInArea);
    }

    async getWaypoints() {
        const resp = await api(`${ENV.apiURL}trails/waypoints`, this.fields(), true);

        if (!resp?.features || resp?.features.length === 0) {
            console.error('Unable to load waypoints at this time');
            return;
        }

        resp.features.forEach(feature => {
            const id = feature.properties.id;

            if (id) this.waypoints.set(id, feature);
        });

        this.lh.displayWaypoints(resp);
    }

    findTrail(id) {
        return this.trailheads?.get(Number(id)) ?? null;
    }

    setupModal(id, title) {
        createModal();

        const modal = document.querySelector('dialog#modal');
        const h2 = modal.querySelector('h2');

        h2.innerHTML = title;

        if (config.settings.getUser().role() === 'ADMIN') {
            h2.insertAdjacentHTML('afterbegin', `<a href="${ENV.domain}account/admin/trails/edit?id=${id}" title="Edit trail" target="_blank"><i class="far fa-pen"></i></a>`);
        }

        return modal.querySelector('.main-content');
    }

    createChart(id, gis_id) {
        const chartArea = document.querySelector('#chart');

        api(`${ENV.apiURL}trails/chart`, [['id', gis_id], ['trail_id', id]], true)
            .then(async (resp) => {
                console.log(resp);
                if (!resp?.chart) {
                    chartArea.remove();
                    return;
                }

                const { default: Chart } = await import(
                    /* webpackIgnore: true */
                    `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/auto/+esm`
                );

                const data = resp.chart.map(item => ({
                    x: item[0],
                    y: item[1]
                }));

                const values = resp.chart.map(item => item[1]);

                chartArea.innerHTML = '<canvas style="width:100%;height:100%"></canvas>';
                const ctx = chartArea.querySelector('canvas').getContext('2d');
                chartArea.classList.remove('placeholder');

                const topY = (Math.floor(Math.max(...values) / 100) * 100) + 100;
                let bottomY = (Math.floor(Math.min(...values) / 100) * 100) - 100;

                if (bottomY < 0) bottomY = 0;

                new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            data,
                            tension: 0.2,
                            borderColor: '#e41616',
                            pointBackgroundColor: '#e41616',
                            fill: false,
                            borderWidth: 2,
                            pointRadius: 1,
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
                                display: false
                            },
                            title: {
                                display: false
                            },
                            subtitle: {
                                display: false,
                            },
                            tooltip: {
                                enabled: false
                            }
                        },
                        scales: {
                            x: {
                                type: 'linear',
                                grid: {
                                    color: '#ddd'
                                },
                                title: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                min: bottomY,
                                max: topY,
                                grid: {
                                    color: '#ddd'
                                },
                                title: {
                                    display: false
                                },
                                ticks: {
                                    color: '#aaa',
                                    callback: val => val.toLocaleString()
                                }
                            }
                        }
                    }
                });
            });
    }

    displayTrail(id, gis_id) {
        const trail = this.findTrail(id)?.properties;

        if (!trail) return;

        const content = this.setupModal(trail.id, trail.title);
        setHeaders(`${trail.title}`, `trails/${trail.id}`);

        const keywords = !trail.keywords ? '' : JSON.parse(trail.keywords)
            .filter(k => k != '')
            .map(k => `<span class="label">#${ucwords(k.replace(/\s/g, ''))}</span> `)
            .join('');

        const iconArr = {
            'Hike': 'hike',
            'Mountain Bike': 'mtb',
            'Road Bike': 'road',
            'Backcountry Ski': 'atski',
            'Climb': 'climb',
            'Alpine Ski': 'alpine',
            'Nordic Ski': 'nordic',
            'Big Ride': 'big_ride',
            'Fantasy': 'fantasy',
            'Snowmobile': 'snomo',
            'Gravel Bike': 'gravel',
            'Dirtbike': 'dirtbike'
        };

        const data = `<li>
                <span class="caption">Guide Type</span>
                <div class="value">
                    <img src="https://cdn.mapotrails.com/icons/${iconArr[trail.term?.[0]] ?? 'info'}.png">${trail.term?.[0] ?? 'N/A'}
                </div>
            </li>
            <li>
                <span class="caption">Distance</span>
                <div class="value">${numberFormat(trail.stats?.distance ?? 0, 1)} mi</div>
            </li>
            <li>
                <span class="caption">Max. Altitude</span>
                
                <div class="value">${numberFormat(trail.stats?.elevation?.max ?? 0, 1)} ft.</div>
            </li>
            <li>
                <span class="caption">Min. Altitude</span>
                <div class="value">${numberFormat(trail.stats?.elevation?.min ?? 0, 1)} ft.</div>
            </li>
            <li>
                <span class="caption">Gain/Loss</span>
                <div class="value">${numberFormat(trail.stats?.altitude?.gain ?? 0, 1)} ft. / ${numberFormat(trail.stats?.altitude?.loss ?? 0, 1)} ft.</div>
            </li>
            ${trail.stats?.slope?.avg
                ? `<li><span class="caption">Avg. Slope</span><div class="value">${trail.stats?.slope?.avg ?? 0}%</div></li>`
                : ''}
        `;

        content.innerHTML = `${trail.file ? `<div class="guide-photo place-holder" style="width:100%;height:235px">
                <a href="${ENV.host}${trail.url}" target="_blank">
                    <img src="${ENV.cdn}photos/large/${trail.file}" title="${trail.caption}">
                </a>
            </div>` : ''}
            <div class="pill-group">${keywords}</div>
            <ul class="stats">${data}</ul>
            <div id="chart" style="width:100%;height:250px" class="placeholder"></div>
            <a href="${ENV.host}${trail.url}" target="_blank" style="margin:0 auto" class="btn btn-lg btn-green centered">Explore the full guide</a>`;

        this.createChart(id, gis_id);
    }

    zoomToArea(trails) {
        if (!trails.length) return;

        const bounds = trails.reduce((bounds, feature) => {
            const [lng, lat] = feature.geometry.coordinates;

            bounds[0][0] = Math.min(bounds[0][0], lng); // west
            bounds[0][1] = Math.min(bounds[0][1], lat); // south
            bounds[1][0] = Math.max(bounds[1][0], lng); // east
            bounds[1][1] = Math.max(bounds[1][1], lat); // north

            return bounds;
        }, [
            [Infinity, Infinity],
            [-Infinity, -Infinity]
        ]);

        fitBounds(bounds);
    }
}