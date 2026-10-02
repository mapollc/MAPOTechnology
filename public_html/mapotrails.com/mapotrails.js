import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.1.0/dist/maplibre-gl.mjs';

const host = `https://${window.location.host.replace('www.', '')}/`,
    cdn = `https://cdn.${window.location.host.replace('www.', '')}/`,
    baseURL = `${window.location.origin}/`,
    domain = 'https://mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    page = window.location.pathname.substring(1);

let map = null;

const apiKey = () => 'cf707f0516e5c1226835bbf0eece4a0c';

class Extent {
    constructor() {
        this._bbox = [Infinity, Infinity, -Infinity, -Infinity];
        this._valid = false;
    }

    include([lng, lat]) {
        this._valid = true;
        this._bbox[0] = Math.min(this._bbox[0], lng);
        this._bbox[1] = Math.min(this._bbox[1], lat);
        this._bbox[2] = Math.max(this._bbox[2], lng);
        this._bbox[3] = Math.max(this._bbox[3], lat);
        return this;
    }

    bbox() {
        return this._valid ? this._bbox : null;
    }

    polygon() {
        if (!this._valid) return null;

        const [minX, minY, maxX, maxY] = this._bbox;

        return {
            type: "Polygon",
            coordinates: [[
                [minX, minY],
                [maxX, minY],
                [maxX, maxY],
                [minX, maxY],
                [minX, minY]
            ]]
        };
    }
}

function geojsonCoords(gj) {
    const coords = [];

    function flatten(obj) {
        if (!obj) return;

        switch (obj.type) {
            case "FeatureCollection":
                obj.features.forEach(flatten);
                break;

            case "Feature":
                flatten(obj.geometry);
                break;

            case "GeometryCollection":
                obj.geometries.forEach(flatten);
                break;

            default:
                if (Array.isArray(obj.coordinates)) {
                    const stack = [obj.coordinates];

                    while (stack.length) {
                        const item = stack.pop();

                        if (typeof item[0] === "number") {
                            coords.push(item);
                        } else {
                            stack.push(...item);
                        }
                    }
                }
        }
    }

    flatten(gj);

    return coords;
}

function traverse(obj, fn) {
    if (!obj || typeof obj !== "object") return;

    fn(obj);

    Object.values(obj).forEach(v => traverse(v, fn));
}

export function geojsonExtent(gj) {
    const ext = new Extent();

    geojsonCoords(gj).forEach(coord => ext.include(coord));

    return ext.bbox();
}

geojsonExtent.polygon = function (gj) {
    const ext = new Extent();

    geojsonCoords(gj).forEach(coord => ext.include(coord));

    return ext.polygon();
};

geojsonExtent.bboxify = function (obj) {
    const geojsonTypes = new Set([
        "FeatureCollection",
        "Feature",
        "GeometryCollection",
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon"
    ]);

    traverse(obj, value => {
        if (value?.type && geojsonTypes.has(value.type)) {
            value.bbox = geojsonExtent(value);
        }
    });
};

function numberFormat(n, d = 0) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(Number(n));
}

async function api(uri, fields = null, v2 = false, forAuth = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let resp,
        result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu') || url.includes('rainviewer.com'),
        isInternal = url.includes(apiURL) || url.includes(apiURL.replace('v1', 'v2')) || url.includes(host),
        ops = {
            method: isExternal ? 'GET' : 'POST'
        },
        fd = new FormData();

    if (isInternal) fd.append('key', apiKey());

    if (fields && Array.isArray(fields)) {
        for (const [k, v] of fields) {
            fd.append(k, v);
        }
    }

    if (forAuth) ops['credentials'] = 'include';
    if (!isExternal) ops['body'] = fd;

    try {
        resp = await fetch(url, ops);
    } catch (e) {
        console.warn(`Fetch failed for ${url}; retrying...`, e);

        await new Promise(resolve => setTimeout(resolve, 250));

        try {
            resp = await fetch(url, ops);
        } catch (retryError) {
            console.error(`Fetch failed after retry for URL: ${url}`, retryError);
            return null;
        }
    }

    // if there was an error with the network request, log the error
    if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`HTTP error! Status: ${resp.status}, URL: ${url}, Response: ${errorText}`);

        return null;
    }

    // parse JSON separately so a JSON error isn't retried
    try {
        result = await resp.json();
    } catch (e) {
        console.error(`JSON parsing error for URL: ${url}`, e.message);
        result = null;
    }

    return result;
}

function addStartsEnds(coords) {
    const SRC = 'trailStartsEnds';

    if (!map.getSource(SRC)) {
        map.addSource(SRC, {
            type: 'geojson',
            data: {
                'type': 'FeatureCollection',
                'features': [
                    {
                        id: 1,
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: coords[0] },
                        properties: { id: 1 }
                    },
                    {
                        id: 2,
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: coords[coords.length - 1] },
                        properties: { id: 2 }
                    }
                ]
            }
        });
    }

    if (!map.getLayer(SRC)) {
        map.addLayer({
            id: SRC,
            type: 'circle',
            source: SRC,
            paint: {
                'circle-color': [
                    'match',
                    ['to-number', ['get', 'id']],
                    2,
                    '#ed4f00',
                    '#72d529'
                ],
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
                'circle-radius': 10
            }
        });
    }
}

async function getContent(tid) {
    const resp = await api(`${apiURL}trails/guide`, [['id', tid]], true);

    /*
     * display trail stats
     */
    const stats = resp.guide?.stats,
        a = stats?.distance ?? 0,
        b = stats?.elevation?.max ?? 0,
        c = stats?.elevation?.min ?? 0,
        d = stats?.altitude?.gain ?? 0,
        e = stats?.altitude?.loss ?? 0,
        f = stats?.slope?.avg ?? 0;

    const statArray = {
        'distance': a,
        'max': b,
        'min': c,
        'gain': d,
        'loss': e,
        'slope': Math.round(f)
    };

    Object.keys(statArray).forEach(k => {
        let suffix = ' ft.';

        const li = document.querySelector(`ul.stats li[data-stat="${k}"] .value`);
        li.classList.remove('placeholder');
        li.style.maxWidth = 'unset';

        if (k == 'distance') suffix = ' mi.';
        else if (k == 'slope') suffix = '%';

        li.textContent = `${numberFormat(statArray[k], 1)}${suffix}`;
    });

    /*
     * get a list of photos for this campsite
     */
    const grid = document.querySelector('.photos');

    if (!resp || !resp.guide?.photos?.length) {
        grid.dataset.count = 1;

        const p = grid.querySelector('div:first-child');
        ////p.innerHTML = globals.svgs.noImage;
        p.classList = 'photo none';

        return;
    }

    const count = Math.min(resp.guide?.photos?.length, 3);
    grid.dataset.count = count;

    // top photo array
    resp.guide?.photos
        ?.slice(0, 3)
        ?.forEach((p, n) => {
            const holder = grid.querySelector(`div[data-layout="${n + 1}"]`);
            const img = document.createElement('img');
            img.loading = 'lazy';

            img.src = `${cdn}photos/large/${p.file}`;

            if (p.title) {
                img.alt = p.title;
                img.title = p.title;
            }

            img.addEventListener('load', () => holder.classList.remove('placeholder'));

            holder.appendChild(img);
        });

    // all photos
    const wrapper = document.querySelector('#guide-photos');

    resp.guide?.photos.forEach(p => {
        const img = document.createElement('img');
        img.src = `${cdn}photos/thumbnail/${p.file}`;
        img.loading = 'lazy';
        img.addEventListener('click', e => window.open(e.target.src.replace('/thumbnail', '')));

        if (p.title) {
            img.title = p.title;
            img.title = p.title;
        }

        wrapper.appendChild(img);
    });

    /*
     * display waypoints list
     */
    const list = document.querySelector('ul.waypoints');
    const wp = resp.guide?.waypoints;

    if (wp.length === 0) {
        list.innerHTML = '<p style="font-size:18px">This trail guide doesn\'t have any waypoints.</p>';
    }

    list.innerHTML = wp.map(w => {
        return `<li><img src="${cdn}icons/${w.icon == '- Icon -' ? 'info' : w.icon}.png">
            <div class="data">
                <h3>${w.name}</h3>
                <span class="coords">${Number(w.lat).toFixed(4)}, ${Number(w.lon).toFixed(4)}</span>
                ${w.note != 'N/A' && w.note != '' ? `<p>${w.note}</p>` : ''}
            </div>
        </li>`;
    }).join('');
}

async function createChart(id, gis_id) {
    const chartArea = document.querySelector('#chart');

    const { default: Chart } = await import(
        /* webpackIgnore: true */
        `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/auto/+esm`
    );

    api(`${apiURL}trails/chart`, [['id', gis_id], ['trail_id', id]], true)
        .then(resp => {
            if (!resp?.chart) {
                chartArea.remove();
                return;
            }

            const data = resp.chart.map(item => ({
                x: item[0],
                y: item[1]
            }));

            const values = resp.chart.map(item => item[1]);

            chartArea.innerHTML = '<canvas style="width:100%;height:100%"></canvas>';
            const ctx = chartArea.querySelector('canvas').getContext('2d');
            chartArea.classList.remove('placeholder');

            const minScale = Math.floor((Math.min.apply(null, values) - 1000) / 500) * 500;
            const maxScale = Math.ceil((Math.max.apply(null, values) + 1000) / 500) * 500;

            new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            data,
                            tension: 0.2,
                            borderColor: '#72d529',
                            pointBackgroundColor: '#72d529',
                            backgroundColor: 'rgb(114 213 41 / 7%)',
                            pointBorderWidth: 0,
                            fill: true,
                            borderWidth: 4,
                            pointRadius: 0,
                            pointHoverRadius: 0
                        }
                    ]
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
                            callbacks: {
                                title: context => `Distance: ${context[0].parsed.x.toFixed(2)} mi`,
                                label: context => `Elevation: ${Math.round(context.parsed.y).toLocaleString()} ft`
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: 0,
                            max: Math.max(...data.map(point => point[0])),
                            type: 'linear',
                            grid: {
                                color: '#ddd'
                            },
                            title: {
                                display: true,
                                text: 'Distance (mi.)',
                                color: '#999'
                            },
                            ticks: {
                                color: '#aaa'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            min: (minScale < 0 ? 0 : minScale),
                            max: maxScale,
                            grid: {
                                color: '#ddd'
                            },
                            title: {
                                display: true,
                                text: 'Elevation (ft.)',
                                color: '#999'
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

async function trailGuide() {
    const TRAIL_ID = document.querySelector('#map').dataset?.tid ?? null;

    getContent(TRAIL_ID);

    const trailPromise = api(`${apiURL}trails/geojson`, [['id', TRAIL_ID]], true);

    const tiles = {
        outdoors: `${apiURL}maps/style/terrain?key=${apiKey()}`,
        satellite: `${apiURL}maps/style/satellite?key=${apiKey()}`,
        fs16: `${apiURL}maps/style/usfs?key=${apiKey()}`
    };

    map = new maplibregl.Map({
        container: 'map',
        zoom: 5.37,
        center: [-119.92556, 44.28071],
        style: tiles['outdoors'],
        projection: 'mercator',
        hash: false,
        maxPitch: 85,
        pitch: 0,
        bearing: 0,
        attributionControl: false
    });

    map.addControl(
        new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        }),
        'top-right'
    );

    map.addControl(
        new maplibregl.FullscreenControl({
            container: document.body
        })
    );

    map.on('style.load', async () => {
        const trail = await trailPromise;

        if (!trail?.features?.length) return;

        if (!map.getSource('track')) {
            map.addSource('track', {
                type: 'geojson',
                data: trail
            });
        }

        if (!map.getLayer('track')) {
            map.addLayer({
                id: 'track',
                type: 'line',
                source: 'track',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': [
                        'interpolate',
                        ['exponential', 2],
                        ['zoom'],
                        1, 1,
                        10, 2,
                        12, 3,
                        13, 5
                    ]
                }
            });

            map.on('mouseenter', 'track', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'track', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        const geo = trail.features.filter(p => p.properties.delta === 0)?.[0];

        addStartsEnds(geo?.geometry.coordinates);

        createChart(TRAIL_ID, geo.properties.id);

        map.fitBounds(geojsonExtent(geo), {
            padding: 50
        });
    });
}

window.onload = () => {
    if (page.startsWith('guide')) trailGuide();
};