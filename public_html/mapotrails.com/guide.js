let map,
    host = 'https://www.mapotrails.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    domain = 'https://www.mapotechnology.com/',
    apiKey = 'cf707f0516e5c1226835bbf0eece4a0c',
    cdn = 'https://cdn.mapotrails.com/',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ',
    attrib = '&copy; ' + new Date().getFullYear() + ' MAPO LLC',
    trailID = settings.tid,
    chart,
    allWaypoints = [],
    elevs = [],
    cdata = [],
    defaultAttr = '&copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a> ',
    icons = ['info', 'hike', 'mtb', 'road', 'gravel', 'dirtbike', 'climb', 'atski', 'nordic', 'alpine', 'snowmobile', 'camp', 'camp2', 'lake', 'media', 'parking', 'restroom', 'river', 'sledding', 'bridge', 'cabin', 'caution', 'fantasy', 'fishing', '4x4', 'big_ride', 'big_air', 'bigfoot', 'summit', 'ski', 'swim'],
    fog = {
        range: [2.5, 5.5],
        'horizon-blend': 1,
        color: '#f4fcff',
        'high-color': '#87c8dd',
        'space-color': '#a2d9f5',
        'star-intensity': 0.5
    },
    osm = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'openstreetmap': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        },
        layers: [{
            id: 'osm',
            type: 'raster',
            source: 'openstreetmap',
            minzoom: 0,
            maxzoom: 22
        }]
    },
    terrain = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'esri': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.esri.com">ESRI</a>'
            }
        },
        layers: [{
            id: 'terrain',
            type: 'raster',
            source: 'esri',
            minzoom: 3,
            maxzoom: 18
        }]
    },
    caltopo = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'ct': {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/2/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://caltopo.com">CalTopo</a>'
            }
        },
        layers: [{
            id: 'caltopo',
            type: 'raster',
            source: 'ct',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    fs16 = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'usfs2016': {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/3/{z}/{x}/{y}.png'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'fs16',
            type: 'raster',
            source: 'usfs2016',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    tiles = {
        'outdoors': 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9',
        'satellite': 'mapbox://styles/mapbox/satellite-v9',
        'osm': osm,
        'fs16': fs16,
        'caltopo': caltopo,
        'terrain': terrain
    };

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d / 1.609;
}

function pctToDeg(n) {
    return Math.atan(n) * (180 / Math.PI);
}

function degToPct(n) {
    const p = (Math.tan(n * (Math.PI / 180)) * 100).toFixed(1);
    return p > 200 ? '>200' : p;``
}

async function getWaypoints() {
    const fd = new FormData();
    fd.append('key', apiKey);
    fd.append('id', trailID);

    await fetch(apiUrl + 'trails/waypoints', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const way = await resp.json();

        if (way.features != null && way.features.length > 0) {
            /* add waypoints source */
            if (!map.getSource('wps')) {
                map.addSource('wps', {
                    type: 'geojson',
                    data: way
                });
            }

            if (!map.getLayer('waypoints')) {
                map.addLayer({
                    id: 'waypoints',
                    type: 'symbol',
                    source: 'wps',
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
                        'icon-allow-overlap': true
                    }
                }).on('mouseenter', 'waypoints', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'waypoints', () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', (e) => {
                    console.log(e);
                    const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                        layers: ['waypoints']
                    });

                    if (features.length > 0) {
                        let name = 'Waypoint',
                            note;

                        if (features[0].properties.note == 'N/A') {
                            note = features[0].properties.name;
                        } else {
                            if (features[0].properties.name) {
                                name = features[0].properties.name;
                            }
                            note = features[0].properties.note;
                        }

                        new mapboxgl.Popup({
                            closeOnClick: true,
                            maxWidth: '300px'
                        }).setLngLat([e.lngLat.lng, e.lngLat.lat])
                            .setHTML('<h3>' + name + '</h3><p style="text-align:center">' + note + '</p>')
                            .addTo(map);
                    }
                });
            }
        }
    });
}

function createChart() {
    let start = async () => {
        const comp = [],
            grades = [],
            fd = new FormData();

        fd.append('key', apiKey);
        fd.append('id', trailID);

        await fetch(apiUrl + 'trails/gis', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json(),
                gpx = data.trail.gis[0].gpx;

            /* calculate trailhead altitude */
            const thlat = parseFloat(data.trail.stats.geo.start[0]),
                thlon = parseFloat(data.trail.stats.geo.start[1]);

            document.querySelector('#b').innerHTML = numberFormat(map.queryTerrainElevation([thlon, thlat]) * 3.28084, 1) + ' ft.';

            /* calculate slopes along the trail and push data into array for charting */
            for (let i = 0; i < gpx.length - 1; i++) {
                const x = i + 1,
                    delta = gpx[x].chart.elev - gpx[i].chart.elev,
                    dist = (gpx[x].chart.dist * 5280) - (gpx[i].chart.dist * 5280),
                    calc = delta != 0 && dist != 0 ? pctToDeg(delta / dist) : 0,
                    slope = (isNaN(calc) ? 0 : calc);

                grades.push(slope);

                comp.push([
                    gpx[i].chart.dist,
                    gpx[i].chart.elev,
                    slope
                ]);
            }

            /* calculate average slope */
            let avg = () => {
                let total = 0;

                grades.forEach((g) => {
                    total += g;
                });

                const sl = total / grades.length;

                return (total == 0 ? 'N/A' : sl.toFixed(1) + '&deg;&nbsp;/&nbsp;' + degToPct(sl) + '%');
            };

            /* draw chart and finish putting stats in */
            drawChart(comp);
            document.querySelector('#g').innerHTML = avg();
            document.querySelector('#h').innerHTML = (grades.every(item => item === 0) ? 'N/A' : Math.max.apply(null, grades).toFixed(1) + '&deg;&nbsp;/&nbsp;' + degToPct(Math.max.apply(null, grades)) + '%');
            document.querySelector('#b').innerHTML = (gpx[0].chart.elev ? numberFormat(gpx[0].chart.elev, 1) + ' ft.' : 'N/A');
        });
    };

    /* get chartjs library, then draw the elevation chart */
    if (document.querySelector('.chart')) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(script);

        script.onload = function () {
            start();
        };
    }
}

function drawChart(cdata) {
    /* if all the elevations are 0
    if (elevs.every(value => value === 0)) {
        document.querySelector('.chart').style.display = 'none';
    } else {*/
    var dist = [],
        elev = [],
        grade = [];

    cdata.forEach((c) => {
        dist.push(c[0]);
        elev.push(c[1]);
        grade.push(c[2]);
    });

    var totalDist = dist[dist.length - 1],
        maxSteps = Math.ceil(totalDist / (totalDist < 3 ? 0.1 : (totalDist < 8 ? 0.5 : 2))) + 1,
        minScale = Math.floor((Math.min.apply(null, elev) - 1000) / 500) * 500,
        maxScale = Math.ceil((Math.max.apply(null, elev) + 1000) / 500) * 500;

    chart = document.querySelector('#chart');

    new Chart(chart, {
        type: 'line',
        data: {
            labels: dist,
            datasets: [{
                xAxisID: 'xAxis',
                yAxisID: 'yAxis',
                fill: true,
                label: '',
                data: elev,
                pointStyle: false,
                borderWidth: 5,
                borderColor: 'rgb(112 162 136)',
                backgroundColor: 'rgb(112 162 136 / 15%)',
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                yAxis: {
                    beginAtZero: true,
                    min: (minScale < 0 ? 0 : minScale),
                    max: maxScale,
                    title: {
                        display: true,
                        text: 'Elevation (ft)',
                        padding: 10,
                        font: {
                            family: 'Noto Sans',
                            size: 13,
                            weight: 600
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Noto Sans',
                            size: 14
                        }
                    }
                },
                xAxis: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Distance (mi)',
                        padding: 10,
                        font: {
                            family: 'Noto Sans',
                            size: 13,
                            weight: 600
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: maxSteps + 2,
                        callback: function (value, index, ticks) {
                            return parseFloat(this.getLabelForValue(value)).toFixed((totalDist > 1 ? 1 : 2));
                        },
                        font: {
                            family: 'Noto Sans',
                            size: 14
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: '#f1f1f1',
                    titleColor: '#000',
                    bodyColor: '#000',
                    titleFont: {
                        family: 'Noto Sans',
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        family: 'Noto Sans',
                        size: 14
                    },
                    displayColors: false,
                    callbacks: {
                        title: function () {
                            return 'Track Point';
                        },
                        label: function (context) {
                            var slope = grade[context.dataIndex],
                                d = parseFloat(context.label);
                            return ['Distance: ' + d.toFixed((d > 1 ? 1 : 2)) + ' mi.', 'Elevation: ' + numberFormat(context.parsed.y) + ' ft.', 'Slope: ' + (slope ? slope : 'N/A')];
                        }
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'Noto Sans',
                            size: 16
                        }
                    },
                    display: false
                }
            }
        }
    });
    /*}*/
}

async function fuelType(c) {
    const post = {
        geometry: c[0] + ',' + c[1],
        geometryType: 'esriGeometryPoint',
        layers: '0,1',
        tolerance: '1',
        mapExtent: '-181,14,-12,60',
        imageDisplay: '600,550,9',
        returnGeometry: 'false',
        f: 'json'
    };

    const fd = new FormData();
    for (var key in post) {
        fd.append(key, post[key]);
    }

    await fetch('https://landfire.cr.usgs.gov/arcgis/rest/services/Landfire/US_140/MapServer/identify', {
        method: 'POST',
        body: fd
    }).then(async (js) => {
        const resp = await js.json();
        var f = resp.results[0].attributes.EVT_GP_N.replaceAll('Douglas-fir', 'Douglas Fir').replaceAll(' and ', '-').split('-'),
            veg = '';

        f.forEach(function (e, n) {
            veg += e + (n < f.length - 1 ? ',&nbsp;' : '');
        });

        const span = document.querySelector('#veg span');
        span.classList.remove('placeholder');
        span.style.height = 'auto';
        span.style.width = 'auto';
        span.innerHTML = veg;

        localStorage.setItem('guide' + trailID, veg);
    });
}

function getTrail() {
    /* get vector trails from mapbox */
    if (!map.getSource('trailData')) {
        map.addSource('trailData', {
            type: 'vector',
            url: 'mapbox://mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs'
        });
    }

    /* add trail lines */
    if (!map.getLayer('trails')) {
        map.addLayer({
            id: 'trails',
            type: 'line',
            source: 'trailData',
            'source-layer': 'mapotrails',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                visibility: 'visible'
            },
            paint: {
                'line-color': ['get', 'color'],
                'line-width': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    1, 2,
                    9, 3,
                    10, 4,
                    12, 5,
                    13, 6
                ]
            },
            filter: [
                'all',
                ['==', ['get', 'display'], '1'],
                ['==', ['to-number', ['get', 'trail_id']], trailID],
            ]
        }).on('mouseenter', 'trails', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'trails', () => {
            map.getCanvas().style.cursor = 'auto';
        }).on('click', 'trails', (e) => {
            const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                layers: ['trails']
            });

            if (features.length > 0) {
                const stats = JSON.parse(features[0].properties.stats),
                    content = (stats ? '<ul class="pu-stats"><li><div class="title">Distance</div><span>' + stats.distance.toFixed(1) + ' mi.</span></li>' +
                        '<li><div class="title">Max Elevation</div><span>' + numberFormat(stats.elevation.max, 0) + ' ft.</span></li><li>' +
                        '<div class="title">Min Elevation</div><span>' + numberFormat(stats.elevation.min, 0) + ' ft.</span></li>' +
                        '<li><div class="title">Elevation Gain</div><span>' + numberFormat(stats.altitude.gain, 1) + ' ft.</span></li>' +
                        '<li><div class="title">Elevation Loss</div><span>' + numberFormat(stats.altitude.loss, 1) + ' ft.</span></li></ul>' : '<span style="display:block;text-align:center;color:var(--gray)">No stats available</span>');

                new mapboxgl.Popup({
                    closeOnClick: true,
                    maxWidth: '300px'
                }).setLngLat([e.lngLat.lng, e.lngLat.lat])
                    .setHTML('<h3>' + features[0].properties.caption + '</h3>' + content)
                    .addTo(map);
            }
        });

        /* add text inside of trail lines */
        if (!map.getLayer('trailTitle')) {
            map.addLayer({
                id: 'trailTitle',
                type: 'symbol',
                source: 'trailData',
                'source-layer': 'mapotrails',
                filter: [
                    'any',
                    ['==', ['to-number', ['get', 'trail_id']], trailID],
                ],
                paint: {
                    'text-color': [
                        'match',
                        ['get', 'color'], '#000', '#fff',
                        '#222'
                    ],
                    'text-halo-blur': 3,
                    'text-halo-color': [
                        'match',
                        ['get', 'color'], '#000', 'rgba(150, 150, 150, 0)',
                        'rgba(250, 250, 250, 0.5)'
                    ],
                    'text-halo-width': 2
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 200,
                    'text-font': ['DIN Offc Pro Regular'],
                    'text-field': [
                        'match',
                        ['get', 'delta'], 0, ['get', 'title'],
                        ['get', 'caption']
                    ],
                    'text-size': 14,
                    'text-letter-spacing': 0.05
                }
            });
        }
    }

    if (!map.getSource('startEnd')) {
        const start = [parseFloat(stats.geo.start[1]), parseFloat(stats.geo.start[0])],
            end = [parseFloat(stats.geo.end[1]), parseFloat(stats.geo.end[0])];

        /* get vegetation type at trailhead */
        /*if (localStorage.getItem('guide' + trailID) == null) {
            fuelType(start);
        }*/

        map.addSource('startEnd', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: start
                        },
                        properties: {
                            type: 'start',
                            color: '#2ac52a'
                        }
                    },
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: end
                        },
                        properties: {
                            type: 'end',
                            color: '#d54b4b'
                        }
                    }
                ]
            }
        });
    }

    if (!map.getLayer('endpoints')) {
        map.addLayer({
            id: 'endpoints',
            type: 'circle',
            source: 'startEnd',
            paint: {
                'circle-color': ['get', 'color'],
                'circle-radius': 5,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2
            }
        }).on('mouseenter', 'endpoints', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'endpoints', () => {
            map.getCanvas().style.cursor = 'auto';
        });
    }
}

function init() {
    const bnds = new mapboxgl.LngLatBounds();
    bnds.extend(stats.bounds.sw);
    bnds.extend(stats.bounds.ne);

    /* display stats */
    if (document.querySelector('.stats')) {
        const a = document.querySelector('#a'),
            c = document.querySelector('#c'),
            d = document.querySelector('#d'),
            e = document.querySelector('#e'),
            f = document.querySelector('#f');

        a.innerHTML = stats.distance.toFixed(1) + ' mi.';
        c.innerHTML = (stats.elevation.max ? numberFormat(stats.elevation.max, 1) + ' ft.' : 'N/A');
        d.innerHTML = (stats.elevation.min ? numberFormat(stats.elevation.min, 1) + ' ft.' : 'N/A');
        e.innerHTML = (stats.altitude.gain ? numberFormat(stats.altitude.gain, 1) + ' ft.' : 'N/A');
        f.innerHTML = (stats.altitude.loss ? numberFormat(stats.altitude.loss, 1) + ' ft.' : 'N/A');
    }

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: tiles['outdoors'],
        projection: 'mercator',
        hash: false,
        attributionControl: false,
        zoom: 10.5,
        center: center
    }).on('load', () => {
        createChart();
        getWaypoints();
    }).on('style.load', () => {
        /* after the map has loaded */
        icons.forEach((icon) => {
            if (!map.hasImage('icon-' + icon)) {
                map.loadImage(cdn + 'icons/' + icon + '.png', (error, image) => { if (error) throw error; map.addImage('icon-' + icon, image); });
            }
        });

        getTrail();

        map.fitBounds(bnds, {
            padding: 75
        });

        if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 20
            }).setTerrain({
                source: 'mapbox-dem',
                exaggeration: 0
            });
        }

        if (!map.getSource('avy')) {
            map.addSource('avy', {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/4/{z}/{x}/{y}.png?force=1'],
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
                    visibility: (settings.category == 'snow' ? 'visible' : 'none')
                },
                paint: {
                    'raster-opacity': 0.4
                }
            });
        }
    }).addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    })).addControl(new mapboxgl.FullscreenControl({
        container: document.body
    })).addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    }));

    if (settings.user != null) {
        map.dragPan.disable();
        map.scrollZoom.disable();
    } else {
        map.addControl(new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true,
            visualizePitch: false
        }));
    }

    map.getCanvas().style.cursor = 'auto';
}

document.onreadystatechange = async () => {
    if (document.readyState == 'interactive') {
        /*const st = localStorage.getItem('guide' + trailID);

        if (st != null) {
            const span = document.querySelector('#veg span');

            span.classList.remove('placeholder');
            span.style.height = 'auto';
            span.style.width = 'auto';
            span.innerHTML = st;
        }*/

        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js';
        document.head.appendChild(script);

        script.onload = function () {
            init();
        };
    }
};

function preloadImages(urls) {
    urls.forEach(function (url) {
        preloadImage(url);
    });

    function preloadImage(url) {
        var img = new Image();
        img.src = url;
    }
}

/* on photo click */
if (document.querySelector('.photos .item img')) {
    const imgs = document.querySelectorAll('.photos .item img'),
        srcs = [];

    for (let g = 1; g < imgs.length; g++) {
        srcs.push(imgs[g].src.replace('/thumbnail', '').replace('/large', ''));
    }

    preloadImages(srcs);

    imgs.forEach(function (e) {
        e.addEventListener('click', function () {
            let src = 'url(' + this.getAttribute('src').replace('/thumbnail', '').replace('/large', '') + ')',
                ca = this.getAttribute('title'),
                w = this.getAttribute('data-n'),
                it = '';

            for (let i = 0; i < imgs.length; i++) {
                it += '<div class="ea' + (w == i ? ' cur' : '') + '" data-n="' + i + '"></div>';
            }

            document.querySelector('#lightbox .photo').style.backgroundImage = src;
            document.querySelector('#lightbox .caption').innerHTML = ca;
            document.getElementById('lightbox').style.display = 'block';
            document.querySelector('#lightbox .pitems').innerHTML = it;
        });
    });

    document.querySelector('#lightbox #close').onclick = function () {
        document.getElementById('lightbox').style.display = 'none';
        document.querySelector('#lightbox .photo').style.backgroundImage = '';
        document.querySelector('#lightbox .caption').innerHTML = '';
    };

    document.querySelector('#lightbox .photo').oncontextmenu = function (e) {
        e.preventDefault();
    };
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('ea') && e.target.parentElement.classList.contains('pitems')) {
        const g = e.target.getAttribute('data-n');

        document.querySelectorAll('.photos .item img').forEach((p) => {
            if (p.getAttribute('data-n') == g) {
                const src = 'url(' + p.getAttribute('src').replace('/thumbnail', '').replace('/large', '') + ')';

                document.querySelector('#lightbox .photo').style.backgroundImage = src;
                document.querySelector('#lightbox .caption').innerHTML = p.getAttribute('title');
            }
        });

        document.querySelectorAll('.pitems .ea').forEach((w) => {
            w.classList.remove('cur');
        });

        e.target.classList.add('cur');
    }
});

function move(i) {
    document.querySelectorAll('.pitems .ea').forEach((w) => {
        if (parseInt(w.getAttribute('data-n')) == i) {
            w.classList.add('cur');
        } else {
            w.classList.remove('cur');
        }
    });

    document.querySelectorAll('.photos .item img').forEach((p) => {
        if (parseInt(p.getAttribute('data-n')) == i) {
            const src = 'url(' + p.getAttribute('src').replace('/thumbnail', '').replace('/large', '') + ')';

            document.querySelector('#lightbox .photo').style.backgroundImage = src;
            document.querySelector('#lightbox .caption').innerHTML = p.getAttribute('title');
        }
    });
}

document.onkeydown = (e) => {
    if (e.key == 'Escape') {
        document.getElementById('lightbox').style.display = 'none';
        document.querySelector('#lightbox .photo').style.backgroundImage = '';
        document.querySelector('#lightbox .caption').innerHTML = '';
    }

    if (e.key == 'ArrowRight' || e.key == 'ArrowLeft' && document.querySelector('#lightbox').style.display == 'block') {
        const c = parseInt(document.querySelector('.pitems .ea.cur').getAttribute('data-n'));

        if (e.key == 'ArrowLeft' && c != 0) {
            move(c - 1);
        }

        if (e.key == 'ArrowRight' && c != document.querySelectorAll('.pitems .ea').length - 1) {
            move(c + 1);
        }
    }
};