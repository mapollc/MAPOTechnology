let map, torDB, torDebounce, searchResults = document.querySelector('#search-results');
const ArcGISFeatureSource = window[""]["arcgis-featureserver"],
    config = {
        host: `https://${window.location.host}/`,
        domain: 'https://www.mapotechnology.com/',
        apiURL: 'https://api.mapotechnology.com/v1/',
        apiKey: () => { return 'bG9jYWxob3N0'; },
        dataPaths: {
            //tracks: 'https://gis.mrcc.purdue.edu/arcgis/rest/services/MRCC/tornadotracks/MapServer/1/query'
            tracks: 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/Tornado_Tracks_1950_2017_1/FeatureServer/0'
        },
        filter: {
            magnitudes: ['0', '1', '2', '3', '4', '5'],
            months: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
        },
        efRatings: ['U', 0, 1, 2, 3, 4, 5],
        layers: ['tornado-paths', 'tornado-points', 'tornado-points-text'],
        runSearch: true,
        charts: {
            count: null,
            seasonal: null,
            risk: null
        },
        isDataSet: false,
        MIN_TORNADOES_FOR_CALCS: 30,    // the minimum number of tornadoes to make a good analysis
        modal: null,
        countyPaint: {
            opacity: [
                'interpolate',
                ['linear'],
                ['zoom'],
                4, 0.1,
                9, 0.25,
                20, 0.4
            ],
            width: [
                'interpolate',
                ['linear'],
                ['zoom'],
                4, 1,
                7, 2,
                20, 3
            ]
        },
        settings: {
            showLabels: true
        },
        selected: {
            point: null,
            county: null,
            tornado: null,
            event: null
        },
        dropdownOpen: () => {
            return Array.from(
                document.querySelectorAll('.dropdown-button button')
            ).some(btn => btn.classList.contains('expand'));
        },
        showOnMap: true,
        months: [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ],
        seasons: {}
    },
    efScale = {
        0: '65-85',
        1: '86-110',
        2: '111-135',
        3: '136-165',
        4: '166-200',
        5: '>200'
    },
states = {
    "AL": { name: "Alabama", coords: [-86.8295337, 33.2588817] },
    "AK": { name: "Alaska", coords: [-149.680909, 64.4459613] },
    "AZ": { name: "Arizona", coords: [-111.7632755, 34.395342] },
    "AR": { name: "Arkansas", coords: [-92.4479108, 35.2048883] },
    "CA": { name: "California", coords: [-118.7559974, 36.7014631] },
    "CO": { name: "Colorado", coords: [-105.6077167, 38.7251776] },
    "CT": { name: "Connecticut", coords: [-72.7342163, 41.6500201] },
    "DE": { name: "Delaware", coords: [-75.4013315, 38.6920451] },
    "DC": { name: "District of Columbia", coords: [-77.0365529, 38.8948932] },
    "FL": { name: "Florida", coords: [-81.4639835, 27.7567667] },
    "GA": { name: "Georgia", coords: [-83.1137366, 32.3293809] },
    "HI": { name: "Hawaii", coords: [-157.975203, 21.2160437] },
    "ID": { name: "Idaho", coords: [-114.74121, 45.61788] },
    "IL": { name: "Illinois", coords: [-89.4337288, 40.0796606] },
    "IN": { name: "Indiana", coords: [-86.1746933, 40.3270127] },
    "IA": { name: "Iowa", coords: [-93.3122705, 41.9216734] },
    "KS": { name: "Kansas", coords: [-98.5821872, 38.27312] },
    "KY": { name: "Kentucky", coords: [-85.1551411, 37.5726028] },
    "LA": { name: "Louisiana", coords: [-92.007126, 30.8703881] },
    "MB": { name: "Manitoba", coords: [-97.8, 55.0] },
    "ME": { name: "Maine", coords: [-68.8590201, 45.709097] },
    "MD": { name: "Maryland", coords: [-76.9382069, 39.5162234] },
    "MA": { name: "Massachusetts", coords: [-72.032366, 42.3788774] },
    "MI": { name: "Michigan", coords: [-84.6824346, 43.6211955] },
    "MN": { name: "Minnesota", coords: [-94.6113288, 45.9896587] },
    "MS": { name: "Mississippi", coords: [-89.7348497, 32.9715645] },
    "MO": { name: "Missouri", coords: [-92.5617875, 38.7604815] },
    "MT": { name: "Montana", coords: [-109.6387579, 47.3752671] },
    "NE": { name: "Nebraska", coords: [-99.5873816, 41.7370229] },
    "NV": { name: "Nevada", coords: [-116.8537227, 39.5158825] },
    "NH": { name: "New Hampshire", coords: [-71.6553992, 43.4849133] },
    "NJ": { name: "New Jersey", coords: [-74.4041622, 40.0757384] },
    "NM": { name: "New Mexico", coords: [-105.993007, 34.5708167] },
    "NY": { name: "New York", coords: [-74.0060152, 40.7127281] },
    "NC": { name: "North Carolina", coords: [-79.0392919, 35.6729639] },
    "ND": { name: "North Dakota", coords: [-100.540737, 47.6201461] },
    "OH": { name: "Ohio", coords: [-82.6881395, 40.2253569] },
    "OK": { name: "Oklahoma", coords: [-97.2684063, 34.9550817] },
    "OR": { name: "Oregon", coords: [-120.737257, 43.9792797] },
    "PA": { name: "Pennsylvania", coords: [-77.7278831, 40.9699889] },
    "RI": { name: "Rhode Island", coords: [-71.5992372, 41.7962409] },
    "SC": { name: "South Carolina", coords: [-80.4363743, 33.6874388] },
    "SD": { name: "South Dakota", coords: [-100.348761, 44.6471761] },
    "TN": { name: "Tennessee", coords: [-86.2820081, 35.7730076] },
    "TX": { name: "Texas", coords: [-99.5120986, 31.8160381] },
    "UT": { name: "Utah", coords: [-111.7143584, 39.4225192] },
    "VT": { name: "Vermont", coords: [-72.5002608, 44.5990718] },
    "VA": { name: "Virginia", coords: [-78.4927721, 37.1232245] },
    "WA": { name: "Washington", coords: [-120.74014, 47.75107] },
    "WV": { name: "West Virginia", coords: [-80.8408415, 38.4758406] },
    "WI": { name: "Wisconsin", coords: [-89.6884637, 44.4308975] },
    "WY": { name: "Wyoming", coords: [-107.5685348, 43.1700264] }
};

Number.prototype.prettyRound = function (decimals = 1) {
    if (isNaN(this)) return '';

    return Number(this.toFixed(decimals)).toString().replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
};

function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

async function api(url, fields = null) {
    let result,
        ops = {
            method: url.search('weather.gov') >= 0 || url.search('unl.edu') >= 0 ? 'GET' : 'POST',
        },
        fd = new FormData();

    if (url.search(config.apiURL) >= 0 || url.search(config.apiURL.replace('v1', 'v2')) >= 0 || url.search(config.host) >= 0) {
        fd.append('key', config.apiKey());
    }

    if (fields != null) {
        fields.forEach((v) => {
            fd.append(v[0], v[1]);
        });
    }

    if (url.search('weather.gov') < 0 && url.search('unl.edu') < 0) {
        ops['body'] = fd;
    }

    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    try {
        const resp = await fetch(url, ops);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`HTTP error! Status: ${resp.status}, URL: ${url}, Response: ${errorText}`);

            return null;
        }

        // Attempt to parse JSON
        result = await resp.json();
    } catch (e) {
        console.error(`Fetch or JSON parsing error for URL: ${url}`, e.message);
        result = null
    }

    return result;
}

(deg2rad = (deg) => deg * Math.PI / 180);
(rad2deg = (rad) => rad * 180 / Math.PI);

function bearingToCardinal(bearing) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
    return directions[Math.round(bearing / 22.5)];
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371,
        dLat = deg2rad(lat2 - lat1),
        dLon = deg2rad(lon2 - lon1),
        a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c;

    return (d / 1.609);
}

function getBearing(coords1, coords2) {
    if (coords1 === undefined || coords2 === undefined) return null;

    const startLat = deg2rad(coords1[1]);
    const startLon = deg2rad(coords1[0]);
    const endLat = deg2rad(coords2[1]);
    const endLon = deg2rad(coords2[0]);

    const dLon = endLon - startLon;

    // Calculate X and Y components
    const y = Math.sin(dLon) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLon);

    // Calculate the bearing in radians
    let bearingRad = Math.atan2(y, x);

    // Convert bearing to degrees
    let bearingDeg = rad2deg(bearingRad);

    // Normalize bearing to a 0-360 degree range
    return (bearingDeg + 360) % 360;
}

function getbbox(raw = false) {
    var b = map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast(),
        bbox = {
            xmin: sw.lng,
            ymin: sw.lat,
            xmax: ne.lng,
            ymax: ne.lat,
            spatialReference: {
                wkid: 4326
            }
        };

    return raw ? bbox : (b ? JSON.stringify(bbox) : false);
}

class Search {
    constructor(q) {
        this.query = q != null ? q.toLowerCase() : null;
        this.results = searchResults;
    }

    async do() {
        Array.from(this.results.querySelectorAll('li:not(.standby)')).forEach(li => li.remove());

        let count = 0,
            apiStarted = false;

        if (this.query.length > 0) {
            const crds = (/([0-9]{2}\.[0-9]+),\s?(-[0-9]{3}.[0-9]+)/gm).exec(this.query);

            if (crds != null) {
                const lat = crds[1],
                    lon = crds[2],
                    h = map.getCenter(),
                    dist = distance(h.lat, h.lng, lat, lon).toFixed(1);

                const li = document.createElement('li');
                li.setAttribute('data-action', 'sr-onclick');
                li.setAttribute('data-type', 'coordinates');
                li.setAttribute('data-lat', lat);
                li.setAttribute('data-lon', lon);
                li.innerHTML = `<span class="icon fas fa-map-location"></span><h3>${parseFloat(lat).toFixed(6).replace(/[0]+$/, '')},&nbsp;${parseFloat(lon).toFixed(6).replace(/[0]+$/, '')}<span>${dist} mile${dist != 1 ? 's' : ''} away</span></h3>`;
                this.results.appendChild(li);

                count++;
            }
        }

        if (count > 0) {
            this.standby.style.display = 'none';
        }

        if (this.query.length > 3) {
            apiStarted = true;

            this.apiSearch().then(added => {
                const finalCount = count + added;

                if (finalCount > 0) {
                    this.standby.style.display = 'none';
                } else {
                    this.standby.style.display = 'block';
                    this.standby.querySelector('i').style.display = 'none';
                    this.standby.querySelector('span').innerHTML = 'No results found';
                }
            });
        }

        if (this.query.length == 0 || (count === 0 && !apiStarted)) {
            this.standby.style.display = 'block';
            this.standby.querySelector('i').style.display = 'none';
            this.standby.querySelector('span').innerHTML = this.query.length == 0 ? 'Ready to search? Type something...' : 'No results found';
        }
    }

    async apiSearch() {
        let count = 0;
        const search = await api(config.apiURL + 'search', [['q', this.query], ['citiesonly', 1]]);

        if (search.rs != null && search.rs.length > 0) {
            search.rs.forEach((p) => {
                const li = document.createElement('li');

                if (p.type == 'State') {
                    li.setAttribute('data-bbox', JSON.stringify(p.bbox));
                } else {
                    if (p.type == 'GIS') {
                        li.setAttribute('data-geotype', p.geoType);
                    }

                    li.setAttribute('data-lat', p.lat);
                    li.setAttribute('data-lon', p.lon);
                }
                li.setAttribute('data-action', 'sr-onclick');
                li.setAttribute('data-name', p.name);
                li.setAttribute('data-county', p.county ? p.county : '');
                li.setAttribute('data-type', p.type.toLowerCase());
                li.innerHTML = `<span class="icon fas fa-location-dot"></span><h3>${p.name}<span>${p.type == 'GIS' ? p.geoType + ' in ' : ''}${p.county ? p.county + ' County' : 'State'}</span></h3>`;
                this.results.appendChild(li);

                count++;
            });
        }

        return count;
    }
}

function loadArcGISGeoJSON(sourceId, map, arcgisOptions) {
    return new Promise((resolve, reject) => {
        let source;
        try {
            source = new ArcGISFeatureSource(sourceId, map, arcgisOptions);
        } catch (err) {
            reject(err);
            return;
        }

        // Wait until the internal Mapbox source has data
        const checkData = () => {
            const mapSource = map.getSource(sourceId);
            if (mapSource && mapSource._data) {
                resolve(mapSource._data); // return the GeoJSON
                map.off('sourcedata', checkData);
                source.destroySource(); // optional cleanup
            }
        };

        map.on('sourcedata', checkData);
    });
}

class TornadoDB {
    constructor() {
        this.minZoom = window.innerWidth < 768 ? 5 : 6;
        this.minYear = null;
        this.maxYear = null;
        this.years = 0;
        this.days = 0;
        this.statsCalculated = false;
        this.dataset = { type: 'FeatureCollection', features: [] };
        this.tmpSource = null;
        this.countyPolygon = null;

        // Bayesian prior parameters (can be tuned)
        this.beta_prior = 5;    // prior equivalent years        
        this.alpha_prior = this.beta_prior * ((71813 / 3231) / 75); // (count / # counties / # years) prior expected tornadoes

        this.torColor = [
            'case',
            ['==', ['to-number', ['get', 'mag']], 0], '#aaa',
            ['==', ['to-number', ['get', 'mag']], 1], '#8BC34A',
            ['==', ['to-number', ['get', 'mag']], 2], '#4CAF50',
            ['==', ['to-number', ['get', 'mag']], 3], '#FFC107',
            ['==', ['to-number', ['get', 'mag']], 4], '#FF5722',
            ['==', ['to-number', ['get', 'mag']], 5], '#9C27B0',
            '#d0d0d0'
        ];
        this.torWidth = [
            '+',
            2,
            ['*', 2, ['min', 1, ['/', ['coalesce', ['to-number', ['get', 'len']], 0], 203]]],
            ['*', 1.5, ['to-number', ['coalesce', ['to-number', ['get', 'mag']]], 0]]
        ];
    }

    currentZoom() {
        return map.getZoom();
    }

    getMinZoom() {
        return this.minZoom;
    }

    setFilter() {
        config.layers.forEach(lay => {
            if (!map.getLayer(lay)) return;

            const selectedMags = config.filter.magnitudes;

            map.setFilter(lay, [
                'all',
                [
                    'in',
                    [
                        'case',
                        ['==', ['get', 'mag'], null], 'U',
                        ['==', ['get', 'mag'], -9], 'U',
                        ['to-string', ['get', 'mag']]
                    ],
                    ['literal', selectedMags]
                ],
                [
                    'in',
                    ['-', ['get', 'mo'], 1],
                    ['literal', config.filter.months.map(Number)]
                ]
            ]);
        });
    }

    getCount() {
        function lineIntersectsBBox(lineCoords, bbox) {
            const [minLng, minLat, maxLng, maxLat] = bbox;

            for (let i = 0; i < lineCoords.length - 1; i++) {
                const [x1, y1] = lineCoords[i];
                const [x2, y2] = lineCoords[i + 1];

                // Quick reject if both points are completely outside bbox on one side
                if ((x1 < minLng && x2 < minLng) || (x1 > maxLng && x2 > maxLng) ||
                    (y1 < minLat && y2 < minLat) || (y1 > maxLat && y2 > maxLat)) continue;

                // Otherwise, line might intersect, do a simple segment vs bbox test
                // Check if either point inside bbox
                if ((x1 >= minLng && x1 <= maxLng && y1 >= minLat && y1 <= maxLat) ||
                    (x2 >= minLng && x2 <= maxLng && y2 >= minLat && y2 <= maxLat)) {
                    return true;
                }

                // Check each bbox edge for intersection
                const edges = [
                    [[minLng, minLat], [maxLng, minLat]],
                    [[maxLng, minLat], [maxLng, maxLat]],
                    [[maxLng, maxLat], [minLng, maxLat]],
                    [[minLng, maxLat], [minLng, minLat]],
                ];

                for (const [[ex1, ey1], [ex2, ey2]] of edges) {
                    if (segmentsIntersect([x1, y1], [x2, y2], [ex1, ey1], [ex2, ey2])) return true;
                }
            }
            return false;
        }

        // Helper function to check if two line segments intersect
        function segmentsIntersect(p1, p2, q1, q2) {
            const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

            const r = [p2[0] - p1[0], p2[1] - p1[1]];
            const s = [q2[0] - q1[0], q2[1] - q1[1]];

            const uNumer = cross([q1[0] - p1[0], q1[1] - p1[1]], r);
            const denom = cross(r, s);

            if (denom === 0) return false; // parallel

            const u = uNumer / denom;
            const t = cross([q1[0] - p1[0], q1[1] - p1[1]], s) / denom;

            return t >= 0 && t <= 1 && u >= 0 && u <= 1;
        }

        const geojson = this.dataset,
            bboxObj = getbbox(true),
            [minLng, minLat, maxLng, maxLat] = [
                bboxObj.xmin,
                bboxObj.ymin,
                bboxObj.xmax,
                bboxObj.ymax
            ];

        if (!geojson || !geojson.features) return 0;

        let total = 0;
        const byMag = {};

        geojson.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const mag = feature.properties.mag ?? 0; // fallback if null

            let inBBox = false;

            if (feature.geometry.type === 'Point') {
                const [lng, lat] = coords;
                inBBox = lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
            } else if (feature.geometry.type === 'LineString') {
                inBBox = lineIntersectsBBox(coords, [minLng, minLat, maxLng, maxLat]);
                //inBBox = coords.some(([lng, lat]) => lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat);
            } else if (feature.geometry.type === 'Polygon') {
                const flatCoords = coords.flat(2);
                inBBox = flatCoords.some(([lng, lat]) => lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat);
            }

            if (inBBox) {
                total++;
                byMag[mag] = (byMag[mag] || 0) + 1;
            }
        });

        return { total, byMag };
    }

    formatGeojson(data) {
        if (!data || !Array.isArray(data.features)) return;

        const years = [];

        // Keep only features with valid properties and mag
        /*data.features = data.features.filter(item =>
            item.properties && typeof item.properties.mag === 'number' && item.properties.mag >= 0
        );*/

        for (let i = 0; i < data.features.length; i++) {
            const feature = data.features[i];

            // Ensure len exists and is a number
            if (typeof feature.properties.len === 'number' && feature.properties.len <= 1) {
                feature.geometry.type = 'Point';
                // Handle nested coordinates safely
                if (Array.isArray(feature.geometry.coordinates[0])) {
                    feature.geometry.coordinates = [
                        feature.geometry.coordinates[0][0],
                        feature.geometry.coordinates[0][1]
                    ];
                }
            }

            // Only push valid years
            if (typeof feature.properties.yr === 'number') {
                years.push(feature.properties.yr);
            }
        }

        // Only calculate min/max if years array has values
        if (years.length > 0) {
            this.minYear = Math.min(...years);
            this.maxYear = Math.max(...years);
            this.years = this.maxYear - this.minYear + 1;
            this.daysInYear = 365.25;
            this.days = this.years * this.daysInYear;
        } else {
            this.minYear = this.maxYear = this.years = this.days = 0;
        }

        this.dataset = data;
    }

    tryCalculateStats(lat = null, lon = null) {
        if (this.statsCalculated) return;

        if (this.dataset && config.selected.county) {
            this.statsCalculated = true;
            this.calculateStats(lat, lon);
        } else {
            const interval = setInterval(() => {
                if (this.dataset && config.selected.county && !this.statsCalculated) {
                    clearInterval(interval);
                    this.statsCalculated = true;
                    this.calculateStats(lat, lon);
                }
            }, 100);
        }
    }

    dataExists() {
        return map.getSource('tornadoes') && this.dataset.features && this.dataset.features.length > 0;
    }

    initSource(map) {
        if (!map.getSource('tornadoes')) {
            map.addSource('tornadoes', {
                type: 'geojson',
                data: this.dataset
            });
        }

        if (!this.tmpSource) {
            this.tmpSource = new ArcGISFeatureSource('tmp', map, {
                url: config.dataPaths.tracks,
                precision: 6,
                where: '1=1 AND yr > 1950',
                outFields: '*',
                minZoom: this.minZoom
            });

            map.on('sourcedata', (e) => {
                if (e.sourceId === 'tmp' && e.isSourceLoaded) {
                    this.mergeFeatures(map.getSource('tmp')._data);
                }
            });

            // Make sure tmpSource is removed when no longer needed
            map.once('remove', () => {
                if (this.tmpSource) {
                    this.tmpSource.destroySource();
                    this.tmpSource = null;
                }
            });
        }
    }

    mergeFeatures(newData) {
        if (!newData || !newData.features) return;

        const oldData = this.dataset;

        newData.features.forEach(f => {
            if (!oldData.features.find(x => x.id === f.id)) {
                oldData.features.push(f);
            }
        });

        this.formatGeojson(oldData);

        // Update the main map source
        if (map.getSource('tornadoes')) {
            map.getSource('tornadoes').setData(this.dataset);
            config.isDataSet = true;
            document.querySelector('#data-loading').style.display = 'none';
        }
    }

    async get() {
        document.querySelector('#data-loading').style.display = 'block';

        // hide layers below minZoom
        if (this.currentZoom() < this.getMinZoom()) {
            config.layers.forEach(l => { if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', 'none'); });
            document.querySelector('#data-loading').style.display = 'none';
            return;
        }

        // show layers when zoomed in enough
        config.layers.forEach(l => { if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', 'visible'); });

        this.initSource(map);

        if (!map.getLayer('tornado-paths')) {
            map.addLayer({
                id: 'tornado-paths',
                type: 'line',
                source: 'tornadoes',
                filter: ['==', '$type', 'LineString'],
                paint: {
                    'line-color': this.torColor,
                    'line-width': this.torWidth
                },
                layout: {
                    'line-cap': 'round',
                    visibility: 'visible'
                }
            });

            map.on('mouseenter', 'tornado-paths', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'tornado-paths', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        if (!map.getLayer('tornado-points')) {
            map.addLayer({
                id: 'tornado-points',
                type: 'symbol',
                source: 'tornadoes',
                filter: ['==', '$type', 'Point'],
                layout: {
                    'icon-image': [
                        'case',
                        ['any',
                            ['==', ['get', 'mag'], null],
                            ['==', ['to-number', ['get', 'mag']], -9],
                        ],
                        'tor-icon-efu',
                        ['concat', 'tor-icon-ef', ['get', 'mag']]
                    ],
                    'icon-overlap': 'always',
                    'icon-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        6,
                        0.1,
                        12,
                        0.15
                    ],
                    visibility: 'visible'
                }
            });

            map.on('mouseenter', 'tornado-points', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', 'tornado-points', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        if (!map.getLayer('tornado-paths-text')) {
            map.addLayer({
                id: 'tornado-paths-text',
                type: 'symbol',
                source: 'tornadoes',
                minzoom: 10,
                filter: ['!=', '$type', 'Point'],
                layout: {
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10,
                        11,
                        18,
                        16
                    ],
                    'symbol-avoid-edges': true,
                    'text-transform': 'uppercase',
                    'symbol-spacing': 1,
                    'text-font': ['Roboto Medium'],
                    'symbol-placement': 'line-center',
                    'icon-rotation-alignment': 'map',
                    'text-offset': [0, 0.1],
                    'text-field': ['to-string', ['get', 'yr']],
                    'text-letter-spacing': 0.05,
                    visibility: 'visible'
                },
                paint: {
                    'text-color': '#000',
                    'text-halo-color': '#fff',
                    'text-halo-width': 1.5,
                    'text-halo-blur': 0.5
                }
            });
        }

        if (!map.getLayer('tornado-points-text')) {
            map.addLayer({
                id: 'tornado-points-text',
                type: 'symbol',
                source: 'tornadoes',
                minzoom: 10,
                filter: ['==', '$type', 'Point'],
                layout: {
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10,
                        11,
                        18,
                        16
                    ],
                    'symbol-avoid-edges': true,
                    'text-transform': 'uppercase',
                    'symbol-spacing': 400,
                    'text-font': ['Roboto Medium'],
                    'symbol-placement': 'point',
                    'text-offset': [0, 1.7],
                    'text-field': ['to-string', ['get', 'yr']],
                    'text-letter-spacing': 0.05,
                    visibility: 'visible'
                },
                paint: {
                    'text-color': '#fff',
                    'text-halo-color': '#e0a7f7',
                    'text-halo-width': 0,
                    'text-halo-blur': 0
                }
            });
        }
    }

    math() {
        return {
            totalAbove: (counts, minMag) => Object.entries(counts).reduce((sum, [mag, val]) => sum + (parseInt(mag) >= minMag ? val : 0), 0),
            poissonCI: (k, t = this.years, confidence = 0.95) => {
                if (k === 0) return { lower: 0, upper: -Math.log(1 - confidence) / t };

                const Z_SCORE_95 = 1.96;
                const chi2Approx = (count, sign) => 2 * count * (1 - 1 / (9 * count) + (sign * Z_SCORE_95) / (3 * Math.sqrt(count))) ** 3;

                return {
                    lower: chi2Approx(k, -1) / (2 * t),
                    upper: chi2Approx(k + 1, 1) / (2 * t)
                };

                /*const alpha = 1 - confidence;
                const chi2Lower = 2 * k * (1 - 1 / (9 * k) - 1.96 / (3 * Math.sqrt(k))) ** 3;
                const chi2Upper = 2 * (k + 1) * (1 - 1 / (9 * (k + 1)) + 1.96 / (3 * Math.sqrt(k + 1))) ** 3;

                return {
                    lower: chi2Lower / (2 * t),
                    upper: chi2Upper / (2 * t)
                };*/
            },
            /*useSmoothing(totalEvents, thresholdYears = 10, rareEventCutoff = 5) {
                const avgAnnualRate = totalEvents / this.years;

                // Apply smoothing if dataset is short or events are rare
                if (this.years <= thresholdYears) return true; // short dataset
                if (avgAnnualRate < rareEventCutoff) return true; // rare events
                return false; // otherwise, smoothing optional
            },*/
            logNormalCI: (k_fractional, t = this.years) => {
                // If the fractional count is effectively zero, revert to the upper bound for k=0 (Feldt-Laplace rule)
                if (k_fractional <= 0) return { lower: 0, upper: -Math.log(0.05) / t };

                const Z_SCORE_95 = 1.96;
                const rate = k_fractional / t; // lambda (annual rate)
                const ln_rate = Math.log(rate);

                // Standard error calculation relies on the fractional count (k*)
                const std_err_term = Z_SCORE_95 / Math.sqrt(k_fractional);

                // Apply the log-Normal approximation: exp( ln(lambda) +/- Z * SE )
                return {
                    lower: Math.exp(ln_rate - std_err_term),
                    upper: Math.exp(ln_rate + std_err_term)
                };
            },
            smoothedRate: (count) => {
                return (this.alpha_prior + count) / (this.beta_prior + this.years);
            },
            median: (arr) => {
                if (!arr.length) return null;
                const sorted = [...arr].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 === 0
                    ? (sorted[mid - 1] + sorted[mid]) / 2
                    : sorted[mid];
            },
            IQR: (arr) => {
                if (!arr.length) return { q1: null, q3: null, iqr: null };
                const sorted = [...arr].sort((a, b) => a - b);
                const mid = Math.floor(sorted.length / 2);

                const lowerHalf = sorted.slice(0, mid);
                const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

                const q1 = this.math().median(lowerHalf);
                const q3 = this.math().median(upperHalf);

                return { q1, q3, iqr: q3 - q1 };
            }
        };
    }

    countByCounty() {
        if (!this.dataset || !this.dataset.features) return 0;

        let counts = { 'unknown': 0, 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            statsByLength = { 'unknown': [], 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] },
            bear = [],
            lengths = {};

        // create a turf feature for the county's geometry
        this.countyPolygon = turf.feature(config.selected.county.geometry);

        this.dataset.features.forEach(f => {
            let inside = false;
            const mag = f.properties.mag == null || f.properties.mag == -9 ? 'unknown' : parseInt(f.properties.mag),
                feature = turf.feature(f.geometry, f.properties);

            if (f.geometry.type === 'Point') {
                inside = turf.booleanPointInPolygon(feature, this.countyPolygon);
            } else if (f.geometry.type === 'LineString') {
                inside = turf.booleanIntersects(feature, this.countyPolygon) || f.geometry.coordinates.some(c => turf.booleanPointInPolygon(turf.point(c), this.countyPolygon));
            }

            if (inside) {
                counts[mag]++;
                statsByLength[mag].push(f.properties.len);

                const bb = getBearing(f.geometry.coordinates[0], f.geometry.coordinates[f.geometry.coordinates.length - 1]);
                if (bb != null && !isNaN(bb)) bear.push(bb);
            }
        });

        for (const [key, arr] of Object.entries(statsByLength)) {
            if (arr.length === 0) {
                lengths[key] = { min: null, max: null, avg: null, median: null, iqr: null };
                continue;
            }

            const min = Math.min(...arr),
                max = Math.max(...arr),
                avg = arr.reduce((sum, val) => sum + val, 0) / arr.length,
                median = this.math().median(arr),
                iqr = this.math().IQR(arr);

            lengths[key] = { min, max, avg, median, iqr };
        }

        const bearings = this.math().median(bear),
            total = Object.values(counts).reduce((sum, val) => sum + val, 0),
            totals = { total, byMag: counts, lengths, medianBearing: bearings ? bearingToCardinal(bearings) : null };

        return totals;
    }

    compactJson(all, ef2, ef4, daily = null, dailyEF2 = null, dailyEF4 = null) {
        const json = {
            all: {
                annual: {
                    rate: all,
                    prob: 1 - Math.exp(-all)
                },
                daily: null
            },
            ef2: {
                annual: {
                    rate: ef2,
                    prob: 1 - Math.exp(-ef2)
                },
                daily: null
            },
            ef4: {
                annual: {
                    rate: ef4,
                    prob: 1 - Math.exp(-ef4)
                },
                daily: null
            }
        };

        if (daily != null) {
            json.all.daily = {
                rate: daily,
                prob: 1 - Math.exp(-daily)
            };
        }

        if (dailyEF2 != null) {
            json.ef2.daily = {
                rate: dailyEF2,
                prob: 1 - Math.exp(-dailyEF2)
            };
        }

        if (dailyEF4 != null) {
            json.ef4.daily = {
                rate: dailyEF4,
                prob: 1 - Math.exp(-dailyEF4)
            };
        }

        return json;
    }

    calculateRisk(/*useSmoothing = false, */prob, lat = null, lon = null) {
        if (config.selected.county == null) return prob;

        // if a lat/lon isn't provided, just use the point where the user clicked
        if (lat == null || lon == null) {
            lon = config.selected.point.lng;
            lat = config.selected.point.lat;
        }

        // compute gridded analysis
        const bbox = turf.bbox(turf.feature(config.selected.county.geometry)),
            gridSize = 5,
            grid = turf.squareGrid(bbox, gridSize, { units: 'miles' }),
            tornadoesInCounty = this.dataset.features.filter(tor => {
                const torBbox = turf.bbox(tor.geometry);
                return !(torBbox[2] < bbox[0] || torBbox[0] > bbox[2] || torBbox[3] < bbox[1] || torBbox[1] > bbox[3]);
            });

        // use this to calculate risk at different EF ratings
        const incrementCounts = (tor, minMag) => {
            if (tor.properties.mag < minMag) return;

            grid.features.forEach(cell => {
                let fraction = 0;

                if (tor.geometry.type === 'LineString') {
                    const pointsInside = tor.geometry.coordinates.filter(c =>
                        turf.booleanPointInPolygon(turf.point(c), cell)
                    ).length;

                    fraction = pointsInside / tor.geometry.coordinates.length;
                } else if (tor.geometry.type === 'Point') {
                    fraction = turf.booleanPointInPolygon(turf.point(tor.geometry.coordinates), cell) ? 1 : 0;
                }

                if (fraction > 0) {
                    cell.properties[minMag] = (cell.properties[minMag] || 0) + fraction;
                }
            });
        };

        // map tornadoes to each grid
        tornadoesInCounty.forEach(tor => {
            incrementCounts(tor, 0);
            incrementCounts(tor, 2);
            incrementCounts(tor, 4);
        });

        // compute cell specific annual rates
        grid.features.forEach(cell => {
            cell.properties.annualAll = (cell.properties[0] || 0) / this.years;
            cell.properties.annualEF2 = (cell.properties[2] || 0) / this.years;
            cell.properties.annualEF4 = (cell.properties[4] || 0) / this.years;
        });

        [5, 10, 25].forEach(radiusMiles => {
            let annualAll = 0, annualEF2 = 0, annualEF4 = 0;
            const pt = turf.point([lon, lat]),
                buffer = turf.buffer(pt, radiusMiles, { units: 'miles' });

            grid.features.forEach(cell => {
                if (turf.booleanIntersects(cell, buffer)) {
                    annualAll += cell.properties.annualAll;
                    annualEF2 += cell.properties.annualEF2;
                    annualEF4 += cell.properties.annualEF4;
                }
            });

            prob.localRisk[radiusMiles] = this.compactJson(annualAll, annualEF2, annualEF4);

            // Convert fractional annual rate back to count for CI
            const fractionalCountAll = annualAll * this.years,
                fractionalCountEF2 = annualEF2 * this.years,
                fractionalCountEF4 = annualEF4 * this.years;

            prob.localRisk[radiusMiles].all.ci = this.confidence(this.math().logNormalCI(fractionalCountAll));
            prob.localRisk[radiusMiles].ef2.ci = this.confidence(this.math().logNormalCI(fractionalCountEF2));
            prob.localRisk[radiusMiles].ef4.ci = this.confidence(this.math().logNormalCI(fractionalCountEF4));

            // RATE: on average, this number of tornadoes in a year in this specific radius (λ)
            // PROB: the likelihood of >= 1 tornado in a give year within this specific radius

            /*let countAll = annualAll * this.years;
            let countEF2 = annualEF2 * this.years;
            let countEF4 = annualEF4 * this.years;*/

            /*if (useSmoothing) {
            let countAll = this.math().smoothedRate(annualAll * this.years);
            countEF2 = this.math().smoothedRate(annualEF2 * this.years);
            countEF4 = this.math().smoothedRate(annualEF4 * this.years);
            }

            prob.localRisk[radiusMiles].all.ci = this.confidence(this.math().poissonCI(countAll));
            prob.localRisk[radiusMiles].ef2.ci = this.confidence(this.math().poissonCI(countEF2));
            prob.localRisk[radiusMiles].ef4.ci = this.confidence(this.math().poissonCI(countEF4));*/
        });

        return prob;
    }

    calculateSeasonal(/*useSmoothing = false*/) {
        const seasonalStats = {},
            countsBySeason = {
                winter: { total: 0, byMag: [] },
                spring: { total: 0, byMag: [] },
                summer: { total: 0, byMag: [] },
                fall: { total: 0, byMag: [] }
            },
            getSeason = (date) => {
                const month = new Date(date).getMonth() + 1;
                for (const [season, months] of Object.entries(config.seasons)) {
                    if (months.includes(month)) return season;
                }
            },
            daysInSeason = (season) => {
                return config.seasons[season].reduce((sum, month) => {
                    let daysInMonth = 0;
                    for (let year = this.minYear; year <= this.maxYear; year++) {
                        daysInMonth += new Date(year, month, 0).getDate();
                    }
                    return sum + daysInMonth;
                }, 0) / this.years;
            };

        this.dataset.features.filter(f => {
            const feature = turf.feature(f.geometry, f.properties);

            if (f.geometry.type === 'Point') {
                return turf.booleanPointInPolygon(feature, this.countyPolygon);
            } else if (f.geometry.type === 'LineString') {
                return turf.booleanIntersects(feature, this.countyPolygon) || f.geometry.coordinates.some(c => turf.booleanPointInPolygon(turf.point(c), this.countyPolygon));
            }

            return false;
        }).forEach(tor => {
            const season = getSeason(tor.properties.date);
            countsBySeason[season].total++;
            countsBySeason[season].byMag.push(tor.properties.mag);
        });

        for (const [season, counts] of Object.entries(countsBySeason)) {
            const noOfDays = daysInSeason(season);

            const k_all = counts.total,
                k_ef2 = counts.byMag.filter(m => m >= 2).length,
                k_ef4 = counts.byMag.filter(m => m >= 4).length,
                annualAll = this.math().smoothedRate(k_all),
                annualEF2 = this.math().smoothedRate(k_ef2),
                annualEF4 = this.math().smoothedRate(k_ef4),
                dailyAll = annualAll / noOfDays,
                dailyEF2 = annualEF2 / noOfDays,
                dailyEF4 = annualEF4 / noOfDays;

            /*if (useSmoothing) {
                annualAll = this.math().smoothedRate(counts.total);
                annualEF2 = this.math().smoothedRate(counts.byMag.filter(m => m >= 2).length);
                annualEF4 = this.math().smoothedRate(counts.byMag.filter(m => m >= 4).length);
            } else {
                annualAll = counts.total / this.years,
                    annualEF2 = counts.byMag.filter(m => m >= 2).length / this.years,
                    annualEF4 = counts.byMag.filter(m => m >= 4).length / this.years;
            }*/

            const seasonal = this.compactJson(annualAll, annualEF2, annualEF4, dailyAll, dailyEF2, dailyEF4);

            seasonal.counts = {
                total: countsBySeason[season].total,
                byMag: countsBySeason[season].byMag.reduce((a, v) => {
                    const k = (v === null || typeof v !== 'number' || v < 0 || v > 5) ? "unknown" : String(v);

                    a[k] = (a[k] || 0) + 1;

                    return a;
                }, { "unknown": 0, "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 })
            };

            seasonal.all.ci = this.confidence(this.math().poissonCI(k_all));
            seasonal.ef2.ci = this.confidence(this.math().poissonCI(k_ef2));
            seasonal.ef4.ci = this.confidence(this.math().poissonCI(k_ef4));

            seasonalStats[season] = seasonal;
        }

        return seasonalStats;
    }

    confidence(value) {
        return {
            rate: {      // 95% confidence interval that we'll see >= 1 tornado every {lower} to {upper} years
                lower: 1 / value.upper,
                upper: 1 / value.lower
            },
            prob: {  // 95% confidence interval for probability of >= 1 tornado
                lower: 1 - Math.exp(-value.lower),
                upper: 1 - Math.exp(-value.upper)
            }
        };
    }

    calculateStats(lat = null, lon = null) {
        const interval = setInterval(() => {
            if (config.isDataSet) {
                clearInterval(interval);
                this.performAnalysis(lat, lon);
            }
        }, 500);
    }

    performAnalysis(lat = null, lon = null) {
        // get tornadoes inside of the county
        const count = this.countByCounty()/*,
            useSmoothing = this.math().useSmoothing(count.total)*/;

        let annualAll, annualEF2, annualEF4, dailyAll, dailyEF2, dailyEF4;

        // if current dataset spans <= 10 years, apply Bayesian smoothing
        //// if (useSmoothing) {
        // average annual rate
        annualAll = this.math().smoothedRate(count.total);
        annualEF2 = this.math().smoothedRate(this.math().totalAbove(count.byMag, 2));
        annualEF4 = this.math().smoothedRate(this.math().totalAbove(count.byMag, 4));

        dailyAll = annualAll / this.daysInYear;
        dailyEF2 = annualEF2 / this.daysInYear;
        dailyEF4 = annualEF4 / this.daysInYear;
        /*} else {
            // average annual rate
            annualAll = count.total / this.years;
            annualEF2 = this.math().totalAbove(count.byMag, 2) / this.years;
            annualEF4 = this.math().totalAbove(count.byMag, 4) / this.years;

            // average daily rate
            dailyAll = count.total / this.days;
            dailyEF2 = this.math().totalAbove(count.byMag, 2) / this.days;
            dailyEF4 = this.math().totalAbove(count.byMag, 4) / this.days;
        }*/

        // calculate chi square for confidence interval for annual rates
        const ciAll = this.math().poissonCI(count.total);
        const ciEF2 = this.math().poissonCI(this.math().totalAbove(count.byMag, 2));
        const ciEF4 = this.math().poissonCI(this.math().totalAbove(count.byMag, 4));

        // determine probabilities
        const probability = this.compactJson(annualAll, annualEF2, annualEF4, dailyAll, dailyEF2, dailyEF4);

        probability.all.periodOfYears = 1 / annualAll;
        probability.ef2.periodOfYears = 1 / annualEF2;
        probability.ef4.periodOfYears = 1 / annualEF4;

        probability.all.ci = this.confidence(ciAll);
        probability.ef2.ci = this.confidence(ciEF2);
        probability.ef4.ci = this.confidence(ciEF4);

        probability.localRisk = {};
        probability.counts = count;
        probability.params = {
            startYear: this.minYear,
            endYear: this.maxYear,
            totalYears: this.years,
            totalDays: this.days/*,
            smoothed: useSmoothing*/
        };

        /*all: {
            annual: {
                rate: annualAll,
                prob: 1 - Math.exp(-annualAll),   // probability of >= 1 tornado in a random chosen year (1 / this value is number of years)
            },
            daily: {
                rate: dailyAll,
                prob: 1 - Math.exp(-dailyAll), // probability of >= 1 tornado on a random chosen day
            },
            periodOfYears: 1 / annualAll,    // the expected average time interval (in years) between tornado events
            ci: {
                rate: {      // 95% confidence interval that we'll see >= 1 tornado every {lower} to {upper} years
                    lower: 1 / ciAll.upper,
                    upper: 1 / ciAll.lower
                },
                probability: {  // 95% confidence interval for annual probability of >= 1 tornado
                    lower: 1 - Math.exp(-ciAll.lower),
                    upper: 1 - Math.exp(-ciAll.upper)
                }
            }
        },
        ef2: {
            annual: {
                rate: annualEF2,
                prob: 1 - Math.exp(-annualEF2)
            },
            daily: {
                rate: dailyEF2,
                prob: 1 - Math.exp(-dailyEF2)
            },
            periodOfYears: 1 / annualEF2,
            ci: {
                rate: {
                    lower: 1 / ciEF2.upper,
                    upper: 1 / ciEF2.lower
                },
                probability: {
                    lower: 1 - Math.exp(-ciEF2.lower),
                    upper: 1 - Math.exp(-ciEF2.upper)
                }
            }
        },
        ef4: {
            annual: {
                rate: annualEF4,
                prob: 1 - Math.exp(-annualEF4)
            },
            daily: {
                rate: dailyEF4,
                prob: 1 - Math.exp(-dailyEF4)
            },
            periodOfYears: 1 / annualEF4,
            ci: {
                rate: {
                    lower: 1 / ciEF4.upper,
                    upper: 1 / ciEF4.lower
                },
                probability: {
                    lower: 1 - Math.exp(-ciEF4.lower),
                    upper: 1 - Math.exp(-ciEF4.upper)
                }
            }
        },
        localRisk: {}
    };*/

        const probs = this.calculateRisk(/*useSmoothing, */probability, lat, lon);
        probs.seasonal = this.calculateSeasonal(/*useSmoothing*/);

        config.modal = new Modal(probs, config.selected.event);
        config.modal.create();
    }
}

class Modal {
    constructor(probabilities, selectedEvent = null) {
        this.stats = probabilities;
        this.event = selectedEvent;
        this.modal = document.querySelector('#modal');
        this.modalTemplate = null;
        this.drag = null;
        this.dragEnd = null;
        this.dragStart = null;
        this.animationEnd = null;
    }

    getDate() {
        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "full",
        }).format(
            new Date(this.event.mo + '/' + this.event.dy + '/' + this.event.yr + ' 00:00:00 UTC')
        );
    }

    getTime() {
        const st = new Date(this.event.mo + '/' + this.event.dy + '/' + this.event.yr + ' 00:00:00 UTC').toString().search('Standard'),
            ts = this.event.time.split(':'),
            h = parseInt(ts[0]),
            min = ts[1],
            hour = h > 12 ? h - 12 : h,
            ampm = h >= 12 ? 'PM' : 'AM';

        return `${hour}:${min} ${ampm} C${st >= 0 ? 'S' : 'D'}T`;
    }

    createBoxAndWhisker() {
        let boxes = '';
        const lengths = this.stats.counts.lengths;
        const maxes = [];

        Object.values(lengths).forEach(r => {
            if (r.max != null) maxes.push(r.max);
        });

        const maxScale = Math.max.apply(null, maxes);

        for (let mag = 0; mag < 6; mag++) {
            const track = lengths[mag];

            if (track.median != null) {
                const q1Pct = (track.iqr.q1 / maxScale) * 100,
                    medPct = (track.median / maxScale) * 100,
                    q3Pct = (track.iqr.q3 / maxScale) * 100,
                    boxWidth = q3Pct - q1Pct;

                boxes += '<div class="length-row" data-mag="' + mag + '">' +
                    '<span class="label">EF-' + mag + '</span>' +
                    '<div class="box-whisker">' +
                    '<div class="whisker"></div>';

                if (track.iqr.iqr != 0) {
                    boxes += '<div class="box" style="left:' + q1Pct + '%;width:' + boxWidth + '%"></div>' +
                        '<div class="median" style="left:' + medPct + '%"></div>' +
                        '<span class="data-point" style="left:0%" id="min">' + track.min.prettyRound(1) + '</span>' +
                        '<span class="data-point" id="max">' + track.max.prettyRound(1) + '</span>' +
                        '<span class="data-point" style="left:' + q1Pct + '%" id="q1">' + track.iqr.q1.prettyRound(1) + '</span>' +
                        '<span class="data-point" style="left:' + medPct + '%" id="med">' + track.median.prettyRound(1) + '</span>' +
                        '<span class="data-point" style="left:' + q3Pct + '%" id="q3">' + track.iqr.q3.prettyRound(1) + '</span>' +
                        '</div></div><span class="help">Most EF-' + mag + ' tornadoes traveled ' + parseInt(track.iqr.q1).prettyRound(1) +
                        ' to ' + parseInt(track.iqr.q3).prettyRound(1) + ' miles, with a typical EF-' + mag + ' traveling ' + track.median.prettyRound(1) + ' miles.</span>';
                } else {
                    boxes += '<div class="box" style="left:0%;width:100%"></div>' +
                        '<div class="median" style="left:50%"></div>' +
                        '<span class="data-point" style="left:0%" id="min">' + track.min.prettyRound(1) + '</span>' +
                        '<span class="data-point" style="left:50%" id="med">' + track.median.prettyRound(1) + '</span>' +
                        '<span class="data-point" id="max">' + track.max.prettyRound(1) + '</span>' +
                        '</div></div><span class="help">A typical EF-' + mag + ' traveled ' + parseInt(track.median).prettyRound(1) + ' miles.</span>';
                }
            } else {
                boxes += '<div class="length-row no-data" data-mag="' + mag + '">' +
                    '<span class="label">EF-' + mag + '</span>' +
                    '<div class="box-whisker">' +
                    '<div class="whisker"></div></div></div>';
            }
        }

        return boxes;
    }

    createStatBlocks(type, forRisk = false, miles = null) {
        let block = '',
            error = `<div class="stat-title">{{title}}</div>
                <span class="help">The likely number of {{rating}} tornadoes within this radius</span>
                <p class="error">There is inadequate {{rating}} data to assess the risk of future {{rating}}
                tornadoes within ${miles} miles of here.</p>`;

        ['all', 'ef2', 'ef4'].forEach(r => {
            let value, ci, title, desc, statValue, ciHelp, ciLeft = 0, ciWidth = 0;
            const tor = (forRisk ? this.stats.localRisk[miles] : this.stats)[r];
            const rateLabel = (r !== 'all' ? r.toUpperCase() + '+ ' : '');

            if (type === 'rate') {
                value = tor.annual.rate;
                ci = tor.ci.rate;
                statValue = value.toFixed(2) + ' ' + rateLabel + 'tornadoes/year';

                // recurrence ordering (upper = short interval)
                const shortYears = ci.lower.prettyRound(1);
                const longYears = ci.upper.prettyRound(1);

                if (forRisk) {
                    title = 'Risk for ' + (r == 'all' ? ' Any ' : rateLabel) + 'Tornado' + (r != 'all' ? 'es' : '');
                    desc = 'The likely number of any tornadoes within this radius';
                    ciHelp = 'There\'s 95% confidence you could expect at least 1 tornado every ' + shortYears + '&ndash;' + longYears + ' years within ' + miles + ' miles of here.';
                } else {
                    title = r.toUpperCase().replace('ALL', 'All') + ' Tornadoes';
                    desc = 'How often ' + rateLabel + 'tornadoes occur in this county';
                    ciHelp = 'There\'s 95% confidence this county will see at least 1 ' + rateLabel + 'tornado every ' + shortYears + '&ndash;' + longYears + ' years.';
                }

                ciLeft = ci.lower;
                ciWidth = ci.upper - ci.lower;
            } else {
                title = 'Annual Probability (' + (r === 'all' ? 'All' : r.toUpperCase() + '+') + ')';
                desc = 'Likelihood of at least 1 ' + rateLabel + 'tornado ocurring in a year';
                value = tor.annual.prob;     // this is prob (0–1)
                ci = tor.ci.prob;
                statValue = (value * 100).prettyRound(1) + '%';

                const ciLowPct = (ci.lower * 100).prettyRound(1);
                const ciHighPct = (ci.upper * 100).prettyRound(1);

                ciLeft = ciLowPct;
                ciWidth = ciHighPct - ciLowPct;
                ciHelp = 'Considering natural variability, the true probability is ' + ciLowPct + '% to ' + ciHighPct + '%.';
            }

            const recurrence = (1 / tor.annual.rate).prettyRound(2);

            block += '<div><div class="stat-block">';

            if (ciWidth.toString() == 'Infinity' || recurrence.toString() == 'Infinity') {
                block += error.replaceAll('{{title}}', title).replaceAll('{{rating}}', r != 'all' ? r.toUpperCase() + '+' : '');
            } else {
                block += '<div class="stat-title">' + title + '</div>' +
                    '<span class="help">' + desc + '</span>' +
                    '<div class="stat-value">' + statValue + '</div>' +
                    '<span class="stat-sub">(~1 ' + rateLabel + 'tornado every ' + recurrence + ' years)</span>' +
                    '<div class="stat-bar-container">' +
                    '<div class="stat-bar" style="width:' + (type == 'risk' ? (value * 100) / 2 : value * 100) + '%"></div>' +
                    '<div class="stat-ci-bar" style="left:' + ciLeft + '%;width:' + ciWidth + '%"></div>' +
                    '</div><span class="stat-ci-label">' + ciHelp + '</span>';
            }

            block += '</div></div>';
        });

        return block;
    }

    create() {
        const ENOUGH_DATA = torDB.getCount().total > config.MIN_TORNADOES_FOR_CALCS;

        if (ENOUGH_DATA || this.event != null) {
            let json = {};
            this.allTabs = this.modal.querySelectorAll('.tab-layout li:not(.active)');

            // if the user clicked on a tornado, get the details for that event
            if (this.event != null) {
                json = {
                    mag: this.event.mag,
                    winds: efScale[this.event.mag],
                    date: this.getDate(),
                    time: this.getTime(),
                    deaths: this.event.fat ? this.event.fat : 0,
                    injuries: this.event.inj ? this.event.inj : 0,
                    length: this.event.len,
                    width: this.event.wid
                };
            }

            const dataParams = {
                county: config.selected.county.name,
                stateAbbr: config.selected.county.state,
                longState: states[config.selected.county.state].name,
                tornadoCounts: {
                    total: this.stats.counts.total,
                    efu: this.stats.counts.byMag['unknown'],
                    ef0: this.stats.counts.byMag[0],
                    ef1: this.stats.counts.byMag[1],
                    ef2: this.stats.counts.byMag[2],
                    ef3: this.stats.counts.byMag[3],
                    ef4: this.stats.counts.byMag[4],
                    ef5: this.stats.counts.byMag[5]
                },
                params: this.stats.params,
                boxAndWhiskers: this.createBoxAndWhisker(),
                rate: this.createStatBlocks('rate'),
                probs: this.createStatBlocks('prob'),
                spring: {
                    pct: (this.stats.seasonal.spring.counts.total / this.stats.counts.total * 100).prettyRound(1),
                    define: config.months[config.seasons['spring'][0] - 1] + '&ndash;' + config.months[config.seasons['spring'][2] - 1]
                },
                summer: {
                    pct: (this.stats.seasonal.summer.counts.total / this.stats.counts.total * 100).prettyRound(1),
                    define: config.months[config.seasons['summer'][0] - 1] + '&ndash;' + config.months[config.seasons['summer'][2] - 1]
                },
                fall: {
                    pct: (this.stats.seasonal.fall.counts.total / this.stats.counts.total * 100).prettyRound(1),
                    define: config.months[config.seasons['fall'][0] - 1] + '&ndash;' + config.months[config.seasons['fall'][2] - 1]
                },
                winter: {
                    pct: (this.stats.seasonal.winter.counts.total / this.stats.counts.total * 100).prettyRound(1),
                    define: config.months[config.seasons['winter'][0] - 1] + '&ndash;' + config.months[config.seasons['winter'][2] - 1]
                },
                risk: {
                    value: (this.stats.localRisk[5].all.annual.prob * 100).prettyRound(1),
                    lower: (this.stats.localRisk[5].all.ci.prob.lower * 100).prettyRound(1),
                    upper: (this.stats.localRisk[5].all.ci.prob.upper * 100).prettyRound(1),
                    rate5: this.createStatBlocks('rate', true, 5),
                    prob5: this.createStatBlocks('prob', true, 5),
                    rate10: this.createStatBlocks('rate', true, 10),
                    prob10: this.createStatBlocks('prob', true, 10),
                    rate25: this.createStatBlocks('rate', true, 25),
                    prob25: this.createStatBlocks('prob', true, 25),
                }
            };

            this.modalTemplate = Mustache.render(template, { ...json, ...dataParams });
            this.show();
            this.display();
        } else {
            const errorMsg = '<div class="msg error">Due to the small number of tornado events in this county, we are unable to calculate tornado climatology or future tornado risk. Try again with another county or an area with more tornadoes.</div>';

            this.modalTemplate = '<div id="drag-handle"></div>' +
                '<div class="wrapper">' +
                '<div class="header">' +
                '<div class="title">' +
                '<h1>TornadoIQ Analysis</h1>' +
                '<i id="close-modal" class="far fa-xmark"></i>' +
                '</div></div><div class="content">' + errorMsg + '</div></div>';

            this.show();
        }
    }

    createCharts(type) {
        const sCounts = {
            'ef0': [], 'ef1': [], 'ef2': [], 'ef3': [], 'ef4': [], 'ef5': [],
        };
        const pluginDynamicBarWidth = (size = 0.5) => (chart) => {
            chart.on("draw", (data) => {
                if (data.type === "bar") {
                    const chartWidth = chart.container.clientWidth;
                    const numberOfBars = data.series.data ? data.series.data.length : data.series.length;
                    const desiredBarWidth = (chartWidth / numberOfBars) * size;

                    data.element.attr({
                        style: `stroke-width: ${desiredBarWidth}px`
                    });
                }
            });
        };

        const interval = setInterval(() => {
            if (typeof Chartist !== 'undefined' && Chartist !== null) {
                clearInterval(interval);

                if (type == 'climatology') {
                    const countData = {
                        labels: ['EF0', 'EF1', 'EF2', 'EF3', 'EF4', 'EF5', 'Unknown'],
                        series: [
                            Object.values(this.stats.counts.byMag)
                        ]
                    };

                    // calculate tornado count by magnitude per season
                    Object.keys(this.stats.seasonal).forEach(s => {
                        for (let i = 0; i < 6; i++) {
                            sCounts['ef' + i].push(this.stats.seasonal[s].counts.byMag[i]);
                        }
                    });

                    config.charts.count = new Chartist.BarChart('#count-chart', countData, {
                        plugins: [
                            pluginDynamicBarWidth()
                        ],
                        axisY: {
                            onlyInteger: true,
                            labelOffset: {
                                x: 0,
                                y: 5
                            }
                        },
                        chartPadding: {
                            top: 25,
                            right: 0,
                            bottom: 0,
                            left: 0
                        }
                    });

                    const seasonData = {
                        labels: [
                            config.months[config.seasons['spring'][0] - 1] + '-' + config.months[config.seasons['spring'][2] - 1],
                            config.months[config.seasons['summer'][0] - 1] + '-' + config.months[config.seasons['summer'][2] - 1],
                            config.months[config.seasons['fall'][0] - 1] + '-' + config.months[config.seasons['fall'][2] - 1],
                            config.months[config.seasons['winter'][0] - 1] + '-' + config.months[config.seasons['winter'][2] - 1]
                        ],
                        series: [
                            {
                                className: "ef0",
                                data: sCounts['ef0']
                            },
                            {
                                className: "ef1",
                                data: sCounts['ef1']
                            },
                            {
                                className: "ef2",
                                data: sCounts['ef2']
                            },
                            {
                                className: "ef3",
                                data: sCounts['ef3']
                            },
                            {
                                className: "ef4",
                                data: sCounts['ef4']
                            },
                            {
                                className: "ef5",
                                data: sCounts['ef5']
                            }
                        ]
                    };

                    config.charts.seasonal = new Chartist.BarChart("#seasonal-chart", seasonData, {
                        plugins: [
                            pluginDynamicBarWidth(0.1)
                        ],
                        labelInterpolationFnc: function (value, idx) {
                            return value + ' (' + data.series[idx] + ')';
                        },
                        stackBars: true,
                        horizontalBars: true,
                        axisX: {
                            onlyInteger: true,
                            labelOffset: {
                                x: 5,
                                y: 0
                            }
                        },
                        chartPadding: {
                            top: 25,
                            right: 0,
                            bottom: 0,
                            left: 35
                        }
                    });
                }

                if (type == 'risk') {
                    const theRisk = this.stats.localRisk[5].all.annual.prob * 100,
                        remainder = 100 - theRisk;

                    config.charts.risk = new Chartist.PieChart("#risk-chart", { series: [theRisk, remainder] }, {
                        labelInterpolationFnc: (value, idx) => {
                            return idx === 0 ? `${value.prettyRound(1)}%` : '';
                        },
                        height: '300px',
                        donut: true,
                        donutWidth: 50,
                        startAngle: 270,
                        total: 200,
                        showLabel: theRisk < 1 ? false : true
                    });
                }

                // remove loading circles from charts
                document.querySelectorAll('.ct-chart .loading').forEach(l => {
                    if (l != null) l.remove();
                });
            }
        }, 500);
    }

    close() {
        const handle = this.modal.querySelector('#drag-handle');
        if (handle) handle.removeEventListener('mousedown', this.dragStart);

        this.modal.removeEventListener('animationend', this.animationEnd);
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('mouseup', this.dragEnd);

        this.modal.classList.remove('open');
        this.modal.classList.add('close');
        this.modal.style = '';
        this.modal.innerHTML = '';

        this.drag = null;
        this.dragEnd = null;
        this.dragStart = null;
        this.animationEnd = null;

        resetSelected();
    }

    show() {
        this.modal.insertAdjacentHTML('beforeend', this.modalTemplate);
        this.modalContent = this.modal.querySelector('.content');

        // show the modal on screen
        this.modal.classList.remove('close');
        this.modal.classList.add('open');
        this.makeDraggable();
    }

    display() {
        const ENOUGH_DATA = torDB.getCount().total > config.MIN_TORNADOES_FOR_CALCS;

        const tab1 = this.modal.querySelector('.tab-layout li[data-name="details"]'),
            tabC1 = this.modal.querySelector('.tab-content .tab[data-name="details"]'),
            tab2 = this.modal.querySelector('.tab-layout li[data-name="climatology"]'),
            tabC2 = this.modal.querySelector('.tab-content .tab[data-name="climatology"]'),
            tab3 = this.modal.querySelector('.tab-layout li[data-name="risk"]'),
            tabC3 = this.modal.querySelector('.tab-content .tab[data-name="risk"]');

        // if the user didn't click on a tornado, just show them our stats
        if (this.event == null) {
            tab1.classList.add('disabled');
            tab1.setAttribute('title', 'There is no tornado event');
            tab2.classList.add('active');
            tabC1.classList.add('disabled');
            tabC2.classList.add('active');

            this.createCharts('climatology');
        } else {
            tab1.classList.add('active');
            tabC1.classList.add('active');
        }

        if (!ENOUGH_DATA) {
            tab2.classList.add('disabled');
            tabC2.classList.add('disabled');
            tab3.classList.add('disabled');
            tabC3.classList.add('disabled');
        }

        // as the user scrolls, make some UI changes
        this.modalContent.addEventListener('scroll', (e) => {
            const fromTop = e.target.scrollTop;

            this.allTabs.forEach(l => {
                const color = fromTop >= 100 ? 'transparent' : 'rgb(158 33 33 / 15%)';
                if (color != l.style.borderBottomColor) l.style.borderBottomColor = color;
            });
        });
    }

    makeDraggable() {
        const handle = this.modal.querySelector('#drag-handle'),
            MAX_UP_VH = 15,
            OPEN_VH = 30,
            MIN_DOWN_VH = 100,
            vhToPx = (vh) => window.innerHeight * (vh / 100),
            pxToVh = (px) => (px / window.innerHeight) * 100;

        let currentTopVh = OPEN_VH,
            startY = 0,
            startTopVh = OPEN_VH,
            dragging = false,
            lastY = 0,
            lastTime = 0,
            velocity = 0;

        this.animationEnd = (e) => {
            if (this.modal.classList.contains('open')) {
                this.modal.style.top = `${OPEN_VH}vh`;
                currentTopVh = OPEN_VH;
            }
        };

        this.dragStart = (e) => {
            dragging = true;

            handle.style.cursor = 'grabbing';
            this.modal.style.animation = 'none';
            this.modal.style.transition = 'none';

            startY = e.clientY;

            // You can keep this if you want:
            const modalTopPx = parseFloat(getComputedStyle(this.modal).top);
            startTopVh = pxToVh(modalTopPx);

            // --- ADDED: reset velocity tracking ---
            lastY = e.clientY;
            lastTime = performance.now();
            velocity = 0;
        };

        this.drag = (e) => {
            if (!dragging) return;

            const now = performance.now();

            const deltaY = e.clientY - startY;
            const deltaVh = pxToVh(deltaY);

            let newTop = startTopVh + deltaVh;

            newTop = Math.max(MAX_UP_VH, Math.min(MIN_DOWN_VH, newTop));

            this.modal.style.top = `${newTop}vh`;
            this.modal.style.height = `calc(100vh - ${newTop}vh)`;
            currentTopVh = newTop;

            // --- ADDED: compute drag velocity ---
            const dy = e.clientY - lastY;
            const dt = now - lastTime;
            if (dt > 0) velocity = dy / dt;

            lastY = e.clientY;
            lastTime = now;
        };

        this.dragEnd = () => {
            if (!dragging) return;
            dragging = false;

            handle.style.cursor = 'grab';
            this.modal.style.transition = 'none'; // disable default transition

            // --- ADDED: inertia effect ---
            const inertiaStrength = 200; // adjust for more/less "glide"
            let targetTop = currentTopVh + pxToVh(velocity * inertiaStrength);

            // clamp after inertia movement
            targetTop = Math.max(MAX_UP_VH, Math.min(MIN_DOWN_VH, targetTop));

            const start = currentTopVh;
            const end = targetTop;
            const duration = 220; // ms
            const startTime = performance.now();

            const animate = (t) => {
                const progress = Math.min((t - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

                const newVh = start + (end - start) * eased;
                this.modal.style.top = `${newVh}vh`;
                currentTopVh = newVh;

                if (progress < 1) requestAnimationFrame(animate);
                else this.modal.style.transition = 'top 0.2s ease'; // restore

                if (this.modal.style.top == '100vh') {
                    this.close();
                }
            };

            requestAnimationFrame(animate);
        };

        this.modal.addEventListener('animationend', this.animationEnd);
        handle.addEventListener('mousedown', this.dragStart);
        document.addEventListener('mousemove', this.drag);
        document.addEventListener('mouseup', this.dragEnd);
    }
}

async function preload() {
    torDB = new TornadoDB();

    const fetchTornadoCount = async (mo) => {
        const data = await api('https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/Tornado_Tracks_1950_2017_1/FeatureServer/0/query?where=1%3D1+AND+mo+%3D+' + mo + '&returnCountOnly=true&f=json');
        return {
            month: mo,
            count: data.count
        };
    }, shouldRecalculate = () => {
        const storedItem = localStorage.getItem('seasons');

        if (!storedItem) return true;

        const CUTOFF_MONTH = 4,
            CUTOFF_DAY = 1,
            dataWrapper = JSON.parse(storedItem),
            lastCalculatedTime = new Date(dataWrapper.timestamp),
            today = new Date();

        let nextMay1st = new Date(today.getFullYear(), CUTOFF_MONTH, CUTOFF_DAY);

        if (lastCalculatedTime >= nextMay1st) {
            nextMay1st = new Date(today.getFullYear() + 1, CUTOFF_MONTH, CUTOFF_DAY);
        }

        return today > nextMay1st;
    };

    // determine tornado season based on historical counts by month
    try {
        if (shouldRecalculate()) {
            const months = Array.from({ length: 12 }, (_, i) => i + 1);

            // Fetch tornado count per month
            const apiCalls = months.map(fetchTornadoCount);
            const results = await Promise.all(apiCalls);

            // Convert to array sorted by month index (0–11)
            const monthCounts = results.map(r => r.count);
            const total = monthCounts.reduce((a, b) => a + b, 0);

            if (total === 0) {
                console.warn("No tornadoes recorded—seasonality cannot be determined.");
                return null;
            }

            const nMonths = 12;
            const windowSize = 3;
            const windowSums = [];

            // Compute sliding window sums using actual tornado counts
            for (let i = 0; i < nMonths; i++) {
                let sum = 0;
                for (let j = 0; j < windowSize; j++) {
                    sum += monthCounts[(i + j) % nMonths];
                }
                windowSums.push({ start: i, sum });
            }

            // Sort windows from most-active to least-active
            windowSums.sort((a, b) => b.sum - a.sum);

            // Assign seasons without overlapping months
            const assigned = new Array(nMonths).fill(false);
            const seasonOrder = ["spring", "summer", "fall", "winter"];
            const seasons = { spring: [], summer: [], fall: [], winter: [] };

            let seasonIndex = 0;

            for (const window of windowSums) {
                if (seasonIndex >= 3) break; // last one (winter) will be filled at the end

                const start = window.start;
                const monthsInWindow = [];
                let overlap = false;

                for (let j = 0; j < windowSize; j++) {
                    const idx = (start + j) % nMonths;
                    if (assigned[idx]) overlap = true;
                    monthsInWindow.push(idx);
                }

                if (!overlap) {
                    // Assign months to current season
                    const seasonName = seasonOrder[seasonIndex];
                    seasons[seasonName] = monthsInWindow.map(i => i + 1); // convert to 1–12
                    monthsInWindow.forEach(i => (assigned[i] = true));
                    seasonIndex++;
                }
            }

            // Assign remaining months to winter
            const leftover = assigned
                .map((used, idx) => (!used ? idx + 1 : null))
                .filter(x => x !== null);

            seasons.winter = leftover;

            localStorage.setItem('seasons', JSON.stringify({
                timestamp: new Date().toISOString(),
                data: seasons
            }));
            config.seasons = seasons;
        } else {
            config.seasons = JSON.parse(localStorage.getItem('seasons')).data;
        }

        init();
    } catch (error) {
        console.error('Preload failed:', error);
    }
}

function complete() {
    const dropdown = {
        mag: document.querySelector('.list.control[data-item=mag]'),
        months: document.querySelector('.list.control[data-item=months]'),
        settings: document.querySelector('.list.control[data-item=settings]')
    };

    // add options to ratings dropdown menu
    const checkAll = document.createElement('li');
    checkAll.innerHTML = '<div class="checkbox"><input type="checkbox" id="mag-all" checked><label for="mag-all">All Ratings</label></div>';
    dropdown.mag.appendChild(checkAll);

    // add EF checkboxes to filter
    config.efRatings.forEach(mag => {
        const displayMag = (mag === null || mag === -9) ? 'u' : mag,
            li = document.createElement('li'),
            check = '<div class="checkbox"><input type="checkbox" class="filter-mag" id="mag-ef' + displayMag + '" value="' + displayMag + '" checked><label for="mag-ef' + displayMag + '">EF' + displayMag + (displayMag == 'U' ? ' (Unknown)' : '') + '</label></div>';

        li.classList.add('checkboxes');
        li.innerHTML = check;
        li.querySelector('input.filter-mag').addEventListener('change', () => {
            const newValues = [];

            document.querySelectorAll('.filter-mag').forEach(box => {
                if (box.checked) {
                    newValues.push(box.id.replace('mag-ef', ''));
                }
            });

            config.filter.magnitudes = newValues;
            torDB.setFilter();
        });

        dropdown.mag.appendChild(li);
    });

    // add options (months) to month selector dropdown menu
    const checkAll2 = document.createElement('li');
    checkAll2.innerHTML = '<div class="checkbox"><input type="checkbox" id="months-all" checked><label for="months-all">All Months</label></div>';
    dropdown.months.appendChild(checkAll2);

    for (let month = 0; month < 12; month++) {
        const li = document.createElement('li'),
            check = '<div class="checkbox"><input type="checkbox" class="filter-months" id="month' + month + '" value="' + month + '" checked><label for="month' + month + '">' + config.months[month] + '</label></div>';

        li.classList.add('checkboxes');
        li.innerHTML = check;
        li.querySelector('input.filter-months').addEventListener('change', () => {
            const newValues = [];

            document.querySelectorAll('.filter-months').forEach(box => {
                if (box.checked) {
                    newValues.push(box.id.replace('month', ''));
                }
            });

            config.filter.months = newValues;
            torDB.setFilter();
        });

        dropdown.months.appendChild(li);
    }

    const settingsMenu = [
        { t: 'Show labels', a: 'show-labels' }
    ];

    settingsMenu.forEach((set, i) => {
        const li = document.createElement('li'),
            check = '<div class="checkbox"><input type="checkbox" class="settings" id="setting' + i + '" data-action="' + set.a + '" checked><label for="setting' + i + '">' + set.t + '</label></div>';

        li.classList.add('checkboxes');
        li.innerHTML = check;
        dropdown.settings.appendChild(li);
    });

    // make search active
    const search = document.querySelector('.filter-controls .search');

    search.style.display = 'inline-flex';
    search.querySelector('input').disabled = false;
}

function showPopup(e) {
    const POPUP_WIDTH = 200,
        popup = document.querySelector('#popup');

    map.setPaintProperty('county-boundaries', 'line-opacity', config.countyPaint.opacity);
    map.setPaintProperty('county-boundaries', 'line-width', config.countyPaint.width);

    if (popup) {
        popup.remove();
    } else {
        const interval = setInterval(() => {
            if (config.selected.county != null) {
                clearInterval(interval);

                const div = document.createElement('div'),
                    ul = document.createElement('ul');

                div.id = 'popup';
                div.style.width = POPUP_WIDTH + 'px';
                div.style.top = (e.point.y + 8) + 'px';
                div.style.left = (e.point.x - (POPUP_WIDTH / 2)) + 'px';
                div.setAttribute('data-x', e.point.x);
                div.setAttribute('data-y', e.point.y);
                div.setAttribute('data-lat', e.lngLat.lat);
                div.setAttribute('data-lon', e.lngLat.lng);
                div.innerHTML = '<div class="pointer"></div><div class="content"></div>';

                // create popup list items
                const list = [
                    { t: config.selected.county.fullName, a: null },
                    { t: 'Calculate Risk', a: 'get-risk' },
                    { t: 'Zoom to county', a: 'zoom-county' }
                ];

                list.forEach((item, i) => {
                    const li = document.createElement('li');
                    if (item.a != null) li.setAttribute('data-action', item.a);
                    if (i == 0) li.classList.add('title');
                    li.innerText = item.t;

                    ul.appendChild(li);
                });

                div.querySelector('.content').appendChild(ul);

                document.querySelector('#map').appendChild(div);
            }
        }, 500);
    }
}

function buttons() {
    document.querySelectorAll('.dropdown-button').forEach(b => {
        const minZoomMet = map.getZoom() >= torDB.getMinZoom();

        b.querySelector('button').disabled = minZoomMet ? false : true;

        if (minZoomMet) {
            b.classList.remove('disabled');
        } else {
            b.classList.add('disabled');
        }
    });
}

function addListeners() {
    // on style load
    map.on('style.load', async () => {
        document.querySelector('.filter-controls').style.display = 'flex';

        // add/remove disabled from buttons depending on zoom level
        buttons();

        // load tornado points images
        config.efRatings.forEach(async (i) => {
            const mag = i.toString();

            if (!map.hasImage('tor-icon-ef' + mag.toLowerCase())) {
                const image = await map.loadImage(config.domain + 'assets/images/icons/tor-icon-ef' + mag.toLowerCase() + '.png');
                map.addImage('tor-icon-ef' + mag.toLowerCase(), image.data);
            }
        });

        // get data
        setTimeout(() => {
            torDB.get();
        }, 1000);

        // load us counties
        getCounties();
    });

    map.on('movestart', () => {
        config.isDataSet = false;
        const popup = document.querySelector('#popup');

        // add/remove disabled from buttons depending on zoom level
        buttons();

        if (popup) popup.remove();
    });

    map.on('moveend', () => {
        // get tornado data as the map moves
        torDB.get();
        torDB.getCount();
    });

    map.on('click', (e) => {
        const features = map.queryRenderedFeatures([
            [e.point.x - 5, e.point.y - 5],
            [e.point.x + 5, e.point.y + 5]
        ]);

        // reset maplibre opacity for layers
        resetSelected();

        // set the county the user clicked on
        setCounty(e.lngLat);

        const tornadoFeature = features.find(f => f.layer.source === 'tornadoes');

        if (tornadoFeature) {
            if (config.selected.tornado != tornadoFeature.id) {
                if (tornadoFeature.geometry.type == 'Point') {
                    map.easeTo({
                        center: tornadoFeature.geometry.coordinates,
                        zoom: map.getZoom() + 2 /*13.2*/,
                        duration: 3000
                    });
                } else {
                    /*map.fitBounds(turf.bbox(turf.feature(tornadoFeature.geometry)), {
                        padding: 150
                    });*/
                }
            }

            config.selected.tornado = tornadoFeature.id;
            config.selected.event = tornadoFeature.properties;

            map.setPaintProperty('tornado-paths', 'line-opacity', [
                'case',
                ['==', ['id'], config.selected.tornado],
                1,
                0.2
            ]);

            map.setPaintProperty('tornado-points', 'icon-opacity', [
                'case',
                ['==', ['id'], config.selected.tornado],
                1,
                0.2
            ]);

            torDB.statsCalculated = false;
            torDB.tryCalculateStats();
        } else {
            // create context menu if the user wants to analyze risk at that location
            if (!config.dropdownOpen()) {
                showPopup(e);
            }
        }
    });
}

function resetSelected() {
    config.selected.county = null;
    config.selected.point = null;
    config.selected.tornado = null;
    config.selected.event = null;

    if (map.getLayer('tornado-paths')) {
        map.setPaintProperty('tornado-paths', 'line-opacity', 1);
    }

    if (map.getLayer('tornado-points')) {
        map.setPaintProperty('tornado-points', 'icon-opacity', 1);
    }
}

async function setCounty(point) {
    const county = map.queryRenderedFeatures(map.project([point.lng, point.lat]), { layers: ['us_counties'] });

    if (county != null && county.length > 0) {
        const feat = county[0]; //console.log(feat);

        config.selected.point = point;
        config.selected.county = {
            'id': feat.properties.OBJECTID,
            'name': feat.properties.COUNTY,
            'state': feat.properties.STATEABBRV,
            'fullName': feat.properties.COUNTY + ' County, ' + feat.properties.STATEABBRV,
            'fips': parseInt(feat.properties.STCOFIPS),
            'area': parseFloat(feat.properties.AREA),
            'population': parseInt(feat.properties.POPULATION),
            'geometry': feat.geometry
        };
    }

    /*const geometry = map.queryRenderedFeatures(map.project([point.lng, point.lat]), { layers: ['us_counties'] }),
        alreadyHaveGeo = geometry && geometry.length > 0,
        params = [
            ['f', 'geojson'],
            ['where', '1=1'],
            ['spatialRel', 'esriSpatialRelWithin'],
            ['geometry', point.lng + ',' + point.lat],
            ['geometryType', 'esriGeometryPoint'],
            ['inSR', '4326'],
            ['outFields', 'POPULATION,AREA,STCOFIPS,COUNTY,STATEABBRV'],
            ['returnGeometry', alreadyHaveGeo ? false : true],
            ['resultRecordCount', 1]
        ];

    const data = await api('https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query', params);

    if (!data?.features?.length) return;

    config.selected.county = {
        'name': data.features[0].properties.COUNTY,
        'state': data.features[0].properties.STATEABBRV,
        'fullName': data.features[0].properties.COUNTY + ' County, ' + data.features[0].properties.STATEABBRV,
        'fips': parseInt(data.features[0].properties.STCOFIPS),
        'area': parseFloat(data.features[0].properties.AREA),
        'population': parseInt(data.features[0].properties.POPULATION),
        'geometry': alreadyHaveGeo ? geometry[0].geometry : data.features[0].geometry
    };

    torDB.statsCalculated = false;
    torDB.tryCalculateStats();*/
}

function getCounties() {
    if (!map.getSource('us_counties')) {
        /*map.addSource('us_counties', {
            type: 'vector',
            tiles: ['https://vectortileservices.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Counties/VectorTileServer/tile/{z}/{y}/{x}.pbf'],
            minzoom: 0,
            maxzoom: 23
        });*/
        new ArcGISFeatureSource('us_counties', map, {
            url: 'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0',
            precision: 6,
            where: '1=1',
            outFields: 'POPULATION,AREA,STCOFIPS,COUNTY,STATEABBRV',
            minZoom: 5
        });
    }

    if (!map.getLayer('us_counties')) {
        map.addLayer({
            id: 'us_counties',
            source: 'us_counties',
            type: 'fill',
            paint: {
                'fill-opacity': 0,
                'fill-color': '#fff'
            },
            layout: {
                visibility: 'visible'
            }
        });

        map.addLayer({
            id: 'county-boundaries',
            type: 'line',
            source: 'us_counties',
            minzoom: 5,
            paint: {
                'line-opacity': config.countyPaint.opacity,
                'line-color': '#d28bef',
                'line-width': config.countyPaint.width
            }
        });

        map.addLayer({
            id: 'county-labels',
            type: 'symbol',
            source: 'us_counties',
            minzoom: 8,
            layout: {
                'text-size': 11,
                'symbol-avoid-edges': true,
                'text-transform': 'uppercase',
                'symbol-spacing': 400,
                'text-font': ['Roboto Medium'],
                'symbol-placement': 'line',
                'text-offset': [0, 1],
                'text-field': ['concat', ['to-string', ['get', 'COUNTY']], ' County'],
                'text-letter-spacing': 0.05
            },
            paint: {
                'text-color': '#fff',
                'text-halo-color': '#e0a7f7',
                'text-halo-width': 1,
                'text-halo-blur': 1
            }
        });
    }
}

function init() {
    map = new maplibregl.Map({
        container: 'map',
        /*zoom: 4.35,
        center: [-98.06, 38.63],*/
        zoom: 11.84,
        center: [-97.29492, 35.20678],
        style: 'https://apps.mapotechnology.com/src/toriq/geojson/style.json', //'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',   //'https://www.mapofire.com/data/maps/terrain.json',
        projection: 'mercator',
        hash: true,
        pitch: 0,
        bearing: 0,
        attributionControl: false
    });

    addListeners();

    // add map controls
    map.addControl(
        new CustomAttributionControl({
            compact: true
        }),
        'bottom-right'
    );

    map.addControl(
        new maplibregl.FullscreenControl({
            container: document.body
        })
    );

    map.addControl(
        new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        })
    );

    map.addControl(
        new maplibregl.ScaleControl({
            unit: 'imperial'
        })
    );

    map.addControl(
        new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            fitBoundsOptions: {
                maxZoom: 10.16
            },
            trackUserLocation: true,
            showUserHeading: true
        })
    );
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        preload();
    } else {
        complete();
    }
};

window.addEventListener('change', (e) => {
    const target = e.target,
        listOfFilters = ['mag-all', 'months-all'];

    if (listOfFilters.indexOf(target.id) >= 0) {
        const uq = listOfFilters[listOfFilters.indexOf(target.id)].split('-')[0],
            boxes = target.closest('ul.list.control').querySelectorAll('input.filter-' + uq);

        if (boxes) {
            const newValues = [];

            boxes.forEach(box => {
                box.checked = target.checked;
                if (target.checked) {
                    newValues.push(box.value.replace(/ef|month/g, ''));
                }
            });

            if (target.id == 'mag-all') {
                config.filter.magnitudes = newValues;
            }

            if (target.id == 'months-all') {
                config.filter.months = newValues;
            }

            torDB.setFilter();
        }
    }

    if (target.classList.contains('settings')) {
        if (target.dataset.action == 'show-labels') {
            config.settings.showLabels = target.checked;

            ['tornado-paths-text', 'tornado-points-text'].forEach(l => {
                map.setLayoutProperty(l, 'visibility', (target.checked ? 'visible' : 'none'));
            });
        }
    }
});

window.addEventListener('click', (e) => {
    const target = e.target,
        filterControl = target.closest('button.dd.control'),
        tabElement = target.closest('ul.tab-layout li');

    if (filterControl) {
        const list = filterControl.parentElement.querySelector('ul.list');

        if (filterControl.classList.contains('expand')) {
            filterControl.classList.remove('expand');
            list.style.display = 'none';
        } else {
            filterControl.classList.add('expand');
            list.style.display = 'inline-flex';
        }
    }

    // close the modal
    if (target.id == 'close-modal') {
        config.modal.close();
    }

    // if a tab is clicked on
    if (tabElement) {
        const tab = tabElement.dataset.name,
            isDisabled = tabElement.classList.contains('disabled');

        if (!isDisabled) {
            config.modal.createCharts(tab);

            document.querySelectorAll('ul.tab-layout li').forEach(t => {
                t.classList.remove('active');
            });

            document.querySelectorAll('.tab-content .tab').forEach(t => {
                t.classList.remove('active');
            });

            tabElement.classList.add('active');
            document.querySelector('.tab-content .tab[data-name="' + tab + '"]').classList.add('active');

            document.querySelector('#modal .content').scrollTop = 0;
        }
    }

    // if a clicked element has a data-action attribute
    if (target.dataset.action) {
        if (target.dataset.action == 'get-risk') {
            const dataReady = torDB.dataExists(),
                p = target.closest('#popup'),
                lat = parseFloat(p.dataset.lat),
                lon = parseFloat(p.dataset.lon),
                bbox = turf.bbox(turf.feature(config.selected.county.geometry));

            if (!dataReady) {
                alert('Tornado data is still processing, please try again shortly.');
                return;
            }

            map.fitBounds(bbox, {
                padding: 100
            });

            map.once('moveend', () => {
                torDB.statsCalculated = false;
                torDB.tryCalculateStats(lat, lon);
            });
        }

        if (target.dataset.action == 'zoom-county') {
            const p = target.closest('#popup');

            const bbox = turf.bbox(turf.feature(config.selected.county.geometry));

            map.setPaintProperty('county-boundaries', 'line-opacity', [
                'interpolate',
                ['linear'],
                ['zoom'],
                4,
                ['case', ['==', ['get', 'OBJECTID'], config.selected.county.id], 1, 0.1],
                9,
                ['case', ['==', ['get', 'OBJECTID'], config.selected.county.id], 1, 0.25],
                20,
                ['case', ['==', ['get', 'OBJECTID'], config.selected.county.id], 1, 0.4],
            ]);
            map.setPaintProperty('county-boundaries', 'line-width', [
                'interpolate',
                ['linear'],
                ['zoom'],
                4,
                ['case', ['==', ['get', 'OBJECTID'], config.selected.county.id], 4, 1],
                7,
                ['case', ['==', ['get', 'OBJECTID'], config.selected.county.id], 4, 2],
                20,
                ['case', ['==', ['get', 'OBJECTID'], config.selected.county.id], 4, 3],
            ]);

            map.fitBounds(bbox, {
                padding: 100
            });

            if (p) p.remove();
        }
    }

    // hide search results if outside search result container
    if (!target.contains(searchResults) && (target.parentElement && !target.parentElement.contains(searchResults)) && !target.contains(document.querySelector('#q'))) {
        searchResults.style.display = 'none';
        document.querySelector('#q').value = '';

        searchResults.querySelectorAll('li').forEach(li => {
            li.remove();
        });
    }

    document.querySelectorAll('.dropdown-button').forEach((d) => {
        if (!d.contains(target)) {
            const l = d.querySelector('ul.list');

            if (l.style.display == 'inline-flex') {
                d.querySelector('.dd').classList.remove('expand');
                l.style.display = 'none';
            }
        }
    });
});

window.addEventListener('keyup', debounce((e) => {
    if (e.target.id == 'q' && config.runSearch) {
        new Search(e.target.value).do();

        config.runSearch = false;
    }
}, 1050));

// custom attribution control to modify links
class CustomAttributionControl extends maplibregl.AttributionControl {
    constructor(options) {
        super(options);
    }

    onAdd(map) {
        return super.onAdd(map);
    }

    _updateAttributions() {
        ////super._updateAttributions();
        this._innerContainer.innerHTML = '<a href="https://maplibre.org/">MapLibre</a> | © <a href="https://www.esri.com">Esri</a>, © <a href="https://carto.com/about-carto/" target="_blank" rel="noopener">CARTO</a>, © <a href="http://www.openstreetmap.org/about/" target="_blank">OpenStreetMap</a> contributors';
    }
}