import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';

const host = `https://${window.location.host.replace('www.', '')}/`,
    cdn = `https://cdn.${window.location.host.replace('www.', '')}/`,
    apiURL = 'https://api.mapotechnology.com/v1/',
    page = window.location.pathname.substring(1);

let map = null,
    mlcontour = null;

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

function addStartsEnds(geometry) {
    const SRC = 'trailStartsEnds';
    const coords = geometry.coordinates;
    let points = [];

    if (geometry.type === 'MultiLineString') {
        for (let i = 0; i < coords.length; i++) {
            points.push(coords[i][0]);
            points.push(coords[i][coords[i].length - 1]);
        }
    } else {
        points = [coords[0], coords[coords.length - 1]];
    }

    const features = points.map((coordinates, id) => ({
        id,
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: null
    }));

    if (!map.getSource(SRC)) {
        map.addSource(SRC, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features
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
                    "case",
                    ["==", ["%", ['id'], 2], 0],
                    "#72d529", // even
                    "#ed4f00" // odd
                ],
                'circle-stroke-color': '#fff',
                'circle-stroke-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    9,
                    1,
                    12,
                    2
                ],
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    9,
                    6,
                    12,
                    10
                ]
            }
        });
    }
}

async function getContent(resp) {
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
        let places = 1;

        const li = document.querySelector(`ul.stats li[data-stat="${k}"] .value`);
        li.classList.remove('placeholder');
        li.style.maxWidth = 'unset';

        if (k == 'distance') {
            if (statArray[k] < 1) places = 2;
            suffix = ' mi.';
        } else if (k == 'slope') {
            suffix = '%';
        }

        li.textContent = `${numberFormat(statArray[k], places)}${suffix}`;
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

    const replaceImg = (img, url, title = null) => {
        const newImg = document.createElement('img');
        newImg = url.replace('/large', '').replace('/thumbnail', '');
        newImg.loading = 'lazy';

        if (title) {
            newImg.title = title;
            newImg.alt = title;
        }

        img.appendChild(newImg);
        img.remove();
    };

    const count = Math.min(resp.guide?.photos?.length, 3);
    grid.dataset.count = count;

    // top photo array
    resp.guide?.photos
        ?.slice(0, 3)
        ?.forEach((p, n) => {
            const holder = grid.querySelector(`div[data-layout="${n + 1}"]`);
            const img = document.createElement('img');
            const url = `${cdn}photos/large/${p.file}`;

            img.loading = 'lazy';
            img.src = url;

            if (p.title) {
                img.alt = p.title;
                img.title = p.title;
            }

            const caption = document.createElement('span');
            caption.className = 'caption';
            caption.textContent = p.title;
            caption.addEventListener('click', () => window.open(url.replace('/large', '')));

            img.addEventListener('load', () => {
                holder.classList.remove('placeholder');
                holder.querySelector('.caption').style.opacity = 1;
            });
            img.addEventListener('error', () => {
                replaceImg(img, url, p.title);
            });
            img.addEventListener('click', () => window.open(url.replace('/large', '')));

            holder.appendChild(img);
            holder.appendChild(caption);
        });

    // all photos
    const wrapper = document.querySelector('#guide-photos');

    resp.guide?.photos.forEach(p => {
        const div = document.createElement('div');
        div.classList.add('item');

        const img = document.createElement('img');
        img.src = `${cdn}photos/thumbnail/${p.file}`;
        img.loading = 'lazy';
        img.addEventListener('click', e => window.open(e.target.src.replace('/thumbnail', '')));

        if (p.title) {
            img.title = p.title;
        }
        
        div.append(img);

        if (p.title) {        
            const caption = document.createElement('span');
            caption.className = 'caption';
            caption.textContent = p.title;
            caption.addEventListener('click', e => {
                if (window.innerWidth > 600) caption.classList.toggle('expanded');
            });

            div.appendChild(caption);
        }

        wrapper.appendChild(div);
    });

    /*
     * display waypoints list
     */
    const list = document.querySelector('ul.waypoints');
    const wp = resp.guide?.waypoints;

    if (!wp || wp?.length === 0) {
        list.style.display = 'block';
        list.innerHTML = '<p style="font-size:18px">This trail guide doesn\'t have any waypoints.</p>';
        return;
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

async function createChart(id) {
    const chartArea = document.querySelector('#chart');

    const { default: Chart } = await import(
        /* webpackIgnore: true */
        `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/auto/+esm`
    );

    const getGradeColor = (grade, alpha) => {
        const colors = [
            { grade: -15, rgb: [249, 115, 22] },  // #f97316 - Steep Descent
            { grade: -8, rgb: [234, 179, 8] },  // #eab308 - Moderate Descent
            { grade: -3, rgb: [114, 213, 41] },  // #72d529 - Base Flat Start
            { grade: 3, rgb: [114, 213, 41] },  // #72d529 - Base Flat End
            { grade: 8, rgb: [234, 179, 8] },  // #eab308 - Moderate Climb
            { grade: 15, rgb: [249, 115, 22] },  // #f97316 - Steep Climb
            { grade: 20, rgb: [220, 38, 38] }   // #dc2626 - Very Steep Climb
        ];

        if (grade <= colors[0].grade) {
            return `rgba(${colors[0].rgb.join(',')}, ${alpha})`;
        }
        if (grade >= colors[colors.length - 1].grade) {
            return `rgba(${colors[colors.length - 1].rgb.join(',')}, ${alpha})`;
        }

        for (let i = 0; i < colors.length - 1; i++) {
            const c1 = colors[i];
            const c2 = colors[i + 1];

            if (grade >= c1.grade && grade <= c2.grade) {
                const factor = (grade - c1.grade) / (c2.grade - c1.grade);
                const r = Math.round(c1.rgb[0] + (c2.rgb[0] - c1.rgb[0]) * factor);
                const g = Math.round(c1.rgb[1] + (c2.rgb[1] - c1.rgb[1]) * factor);
                const b = Math.round(c1.rgb[2] + (c2.rgb[2] - c1.rgb[2]) * factor);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
        }

        return `rgba(114, 213, 41, ${alpha})`;
    };

    const getSegment = (ctx, useFeet, alpha = 1) => {
        const p0 = ctx.p0.parsed,
            p1 = ctx.p1.parsed,
            run = p1.x - p0.x, // Delta Distance
            rise = p1.y - p0.y; // Delta Elevation

        if (run <= 0) return '#72d529'; // Fallback color if no distance change

        // Ensure units match before calculating grade!
        const grade = (rise / (run * (useFeet ? 1 : 5280))) * 100;

        return getGradeColor(grade, alpha);
    };

    // get charting data from the API
    const chartData = await api(`${apiURL}trails/chart`, [['trail_id', id]], true);

    if (!chartData?.chart) {
        chartArea.remove();
        return;
    }

    const useFeet = chartData.chart[chartData.chart.length - 1][0] < 1;

    const data = chartData.chart.map(item => ({
        x: item[0] * (useFeet ? 5280 : 1),
        y: item[1]
    }));

    const values = chartData.chart.map(item => item[1]);

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
                    segment: {
                        borderColor: ctx => getSegment(ctx, useFeet),
                        backgroundColor: ctx => getSegment(ctx, useFeet, 0.25),
                    },
                    pointBorderWidth: 0,
                    fill: 'start',
                    borderWidth: 6,
                    pointRadius: 0
                }
            ]
        },
        options: {
            interaction: {
                intersect: false,
                mode: 'index'
            },
            responsive: true,
            maintainAspectRatio: false,
            onResize: (chart, size) => {
                chart.options.scales.x.title.display = size.width > 475;
                chart.options.scales.y.title.display = size.width > 600;
            },
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
                        label: context => {
                            const index = context.dataIndex;
                            const data = context.dataset.data;

                            // Use previous point for grade if at the end of the dataset
                            const p0 = data[index - 1] || data[index];
                            const p1 = data[index + 1] || data[index];

                            const run = (p1.x - p0.x) * (useFeet ? 1 : 5280); // Miles to feet
                            const rise = p1.y - p0.y;

                            const grade = run > 0 ? (rise / run) * 100 : 0;

                            // Returning an array creates separate lines in the tooltip
                            return [
                                `Elevation: ${Math.round(context.parsed.y).toLocaleString()} ft`,
                                `Grade: ${grade.toFixed(1)}%`
                            ];
                        }
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
                        display: window.innerWidth > 475,
                        text: `Distance (${useFeet ? 'ft' : 'mi'}.)`,
                        color: '#666'
                    },
                    ticks: {
                        color: '#888'
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
                        display: window.innerWidth > 600,
                        text: 'Elevation (ft.)',
                        color: '#666'
                    },
                    ticks: {
                        color: '#888',
                        callback: val => val.toLocaleString()
                    }
                }
            }
        }
    });
}

async function trailGuide(TRAIL_ID, guide) {
    const coords = guide?.stats?.geo?.start;

    const tiles = {
        outdoors: `${apiURL}maps/style/terrain?key=${apiKey()}`,
        satellite: `${apiURL}maps/style/satellite?key=${apiKey()}`,
        fs16: `${apiURL}maps/style/usfs?key=${apiKey()}`
    };

    map = new maplibregl.Map({
        container: 'map',
        minZoom: 8,
        zoom: 8,
        center: [coords[1], coords[0]],
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

    map.addControl(new TerrainControl());

    map.on('style.load', async () => {
        await loadMapIcons();

        createChart(TRAIL_ID);
        addTrack(TRAIL_ID);
        displayWaypoints(guide?.waypoints);
    });
}

function addTrack(TRAIL_ID) {
    const filter = ['==', ['to-number', ['get', 'trail_id']], TRAIL_ID];

    if (!map.getSource('track')) {
        map.addSource('track', {
            type: 'vector',
            minzoom: 8,
            maxzoom: 18,
            tiles: [`${host}data/maps/tiles/trails/{z}/{x}/{y}.pbf`]
        });
    }

    if (!map.getLayer('track')) {
        map.addLayer({
            id: 'track',
            type: 'line',
            'source-layer': 'trails',
            source: 'track',
            filter,
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

        const onSourceData = (e) => {
            if (e.sourceId !== 'track' || !e.isSourceLoaded) return;

            const features = map.querySourceFeatures('track', {
                sourceLayer: 'trails',
                filter
            });

            if (!features.length) return;

            const primaryFeature = features.find(f => f.properties?.delta === 0);
            if (!primaryFeature) return;

            // Stop listening immediately so panning/zooming doesn't re-trigger fitBounds
            map.off('sourcedata', onSourceData);

            ////createChart(TRAIL_ID, primaryFeature.properties.id);
            addStartsEnds(primaryFeature.geometry);

            map.fitBounds(geojsonExtent(primaryFeature.geometry), {
                padding: 50
            });
        };

        map.on('sourcedata', onSourceData);

        map.on('mouseenter', 'track', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'track', () => {
            map.getCanvas().style.cursor = 'auto';
        });
    }
}

async function loadMapIcons() {
    const icons = ['info', 'hike', 'mtb', 'road', 'gravel', 'dirtbike', 'climb', 'atski', 'nordic', 'alpine', 'snowmobile', 'camp', 'camp2', 'lake', 'media', 'parking', 'restroom', 'river', 'sledding', 'bridge', 'cabin', 'caution', 'fantasy', 'fishing', '4x4', 'big_ride', 'big_air', 'bigfoot', 'summit', 'ski', 'swim'];

    await Promise.all(
        icons.map(async (path) => {
            try {
                const id = `icon-${path}`;
                const img = await map.loadImage(`${cdn}icons/${path}.png`);

                if (!map.hasImage(id)) map.addImage(id, img.data);
            } catch (e) {
                console.error(`Failed to load image: ${path}`, e);
            }
        })
    );
}

function displayWaypoints(wp) {
    if (!wp) return;

    const features = wp.filter(f => f.lat && f.lon).map(f => {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [Number(f.lon), Number(f.lat)]
            },
            properties: f
        };
    });

    const SRC = 'waypoints';
    const geojson = {
        type: 'FeatureCollection',
        features
    };

    if (!map.getSource(SRC)) {
        map.addSource(SRC, {
            type: 'geojson',
            data: geojson
        });
    }

    if (!map.getLayer(SRC)) {
        map.addLayer({
            id: SRC,
            type: 'symbol',
            source: SRC,
            minzoom: 11,
            layout: {
                'icon-image': [
                    'match',
                    ['get', 'icon'],
                    '- Icon -', 'icon-info',
                    'mtn_bike', 'icon-mtb',
                    ['concat', 'icon-', ['get', 'icon']]
                ],
                'icon-size': {
                    type: 'exponential',
                    base: 0.25,
                    stops: [
                        [11, 0.75],
                        [13, 1]
                    ]
                },
                'icon-allow-overlap': true,
                'visibility': 'visible'
            }
        });
    }
}

function avy() {
    if (!map.getSource('avy')) {
        map.addSource('avy', {
            type: 'raster',
            tiles: [`${host}assets/images/tiles/4/{z}/{x}/{y}.png?force=1`],
            tileSize: 256,
            scheme: 'xyz'
        });
    }

    if (!map.getLayer('avalanche')) {
        map.addLayer({
            id: 'avalanche',
            type: 'raster',
            source: 'avy',
            layout: {
                visibility: 'visible'
            },
            paint: {
                'raster-opacity': 0.4
            }
        });
    }
}

async function getContourLibrary() {
    if (!mlcontour) {
        const module = await import('https://cdn.jsdelivr.net/npm/maplibre-contour@0.1.1/+esm');
        mlcontour = module.default;
    }

    return mlcontour;
}

async function addTerrain() {
    await getContourLibrary();

    if (!map.getSource('terrain')) {
        map.addSource('terrain', {
            type: 'raster-dem',
            encoding: 'terrarium',
            maxzoom: 13,
            tileSize: 512,
            url: 'https://tiles.mapterhorn.com/tilejson.json'
        });
    }

    // set 3d terrain
    map.setTerrain({
        source: 'terrain',
        exaggeration: 1.2
    });
}

export class TerrainControl {
    onAdd(map) {
        this.map = map;

        this.container = document.createElement('div');
        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
        this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        const button = document.createElement('button');
        button.dataset.mode = '2d';
        button.type = 'button';
        button.className = 'maplibregl-ctrl-terrain ttip';
        button.title = 'Toggle 3D terrain';
        button.innerHTML = '3D';

        // button click listener
        button.addEventListener('click', () => {
            const is3d = button.dataset.mode === '2d';

            button.dataset.mode = is3d ? '3d' : '2d';
            button.innerHTML = is3d ? '2D' : '3D';
            //config.settings.toggle3d(is3d);

            is3d ? addTerrain() : map.setTerrain(null);
        });

        this.container.appendChild(button);

        return this.container;
    }

    onRemove() {
        this.container?.remove();
        this.map = null;
    }
}

window.onload = async () => {
    if (page.startsWith('guide')) {
        const map = document.querySelector('#map');
        const TRAIL_ID = Number(map.dataset?.tid) ?? null;

        const resp = await api(`${apiURL}trails/guide`, [['id', TRAIL_ID]], true);

        setTimeout(() => map.classList.remove('loading'), 750);

        getContent(resp);
        trailGuide(TRAIL_ID, resp?.guide);
    }
};