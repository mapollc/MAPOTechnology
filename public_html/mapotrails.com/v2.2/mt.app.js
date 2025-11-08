async function getSnotels() {
    map.loadImage(cdn + 'icons/snotel.png', (error, image) => { if (error) throw error; map.addImage('snotel', image); });

    if (!snotels) {
        snotels = await api(apiURL + 'weather/snotels');
    }

    if (!map.getSource('stls')) {
        map.addSource('stls', {
            type: 'geojson',
            data: snotels
        });
    }

    if (!map.getLayer('snotels')) {
        map.addLayer({
            id: 'snotels',
            type: 'symbol',
            source: 'stls',
            paint: {
                'text-halo-color': '#fff',
                'text-halo-width': 1,
                'text-halo-blur': 1
            },
            layout: {
                'icon-image': 'snotel',
                'icon-size': 0.85,
                'text-anchor': 'top',
                'text-font': ['DIN Pro Medium'],
                'text-field': [
                    'step',
                    ['zoom'], '',
                    9, ['get', 'code']
                ],
                'text-size': {
                    type: 'exponential',
                    base: 0,
                    stops: [
                        [9, 10],
                        [12, 12],
                        [13, 14]
                    ]
                },
                'text-offset': [0, 1.1]
            }
        }).on('mouseenter', 'snotels', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'snotels', () => {
            map.getCanvas().style.cursor = 'auto';
        }).on('click', (e) => {
            const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                layers: ['snotels']
            });

            if (features.length > 0) {
                new Weather().readSnotel(features[0].properties.code, features[0].geometry.coordinates);
            }
        });
    }
}

function openLayers() {
    const l = modalHeader + '<div class="content"><ul class="layers-list">' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="trailheads"' + (settings.layers().trailheads() ? ' checked' : '') + '></div><div class="desc"><label>Trailheads</label><span>Display trailhead markers on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="trails"' + (settings.layers().trails() ? ' checked' : '') + '></div><div class="desc"><label>Trails</label><span>Display trails on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="snotel"' + (settings.layers().snotel() ? ' checked' : '') + '></div><div class="desc"><label>Snotels</label><span>Show backcountry weather stations that measure snow</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="waypoints"' + (settings.layers().waypoints() ? ' checked' : '') + '></div><div class="desc"><label>Waypoints</label><span>Display waypoints (points of interest) on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="avy"' + (settings.layers().avy() && settings.category == 'snow' ? ' checked' : '') + '></div><div class="desc"><label>Avalanche</label><span>Show avalanche slope shading overlayed on the map</span>' +
        '<input type="range" id="avyOpac" style="display:' + (settings.layers().avy() && settings.category == 'snow' ? 'block' : 'none') + ';margin-top:0.5em" min="0" max="100" step="5" value="' + (settings.get('avyOpac') ? settings.get('avyOpac') * 100 : 40) + '">' +
        '<div class="legend avy"' + (settings.layers().avy() && settings.category == 'snow' ? ' style="display:flex"' : '') + '><div class="colors"></div><div class="labels"><div>27-29&deg;</div><div>30-31&deg;</div><div>32-34&deg;</div><div>35-45&deg;</div><div>46-50&deg;</div><div>51-59&deg;</div><div>>60&deg;</div></div></div></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="contours"' + (settings.layers().contours() ? ' checked' : '') + '></div><div class="desc"><label>Contours</label><span>Visualize terrain with enhanced contour lines</span></li>' +
        /*'<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="aspect"' + (settings.layers().aspect() ? ' checked' : '') + '></div><div class="desc"><label>Aspect</label><span>Visualize cardinal directions of terrain aspect</span>' +
        '<input type="range" id="aspOpac" style="display:' + (settings.get('aspect') ? 'block' : 'none') + ';margin-top:0.5em" min="0" max="100" step="5" value="' + (settings.aspOpac ? settings.aspOpac : 40) + '">' +
        '<div class="legend aspect"' + (settings.layers().aspect() ? ' style="display:flex"' : '') + '><div class="colors"></div><div class="labels"><div>N</div><div>NE</div><div>E</div><div>SE</div><div>S</div><div>SW</div><div>W</div><div>NW</div></div></div></div>' +*/
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="radar"' + (settings.layers().radar() ? ' checked' : '') + '></div><div class="desc"><label>Weather Radar</label><span>Find where rain and snow are falling using Level II NEXRAD Radar data</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="fsadmin"' + (settings.layers().fsadmin() ? ' checked' : '') + '></div><div class="desc"><label>USFS Boundaries</label><span>Find US Forest Service boundaries throughout the map</span></div></li>' +
        '</ul></div>';

    modal.innerHTML = l;
    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'Layers';

    modal.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + modal.querySelector('#avyOpac').value + '%, transparent ' + modal.querySelector('#avyOpac').value + '%)';
    /*modal.querySelector('#aspOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + modal.querySelector('#aspOpac').value + '%, transparent ' + modal.querySelector('#aspOpac').value + '%)';*/
}

function doContextMenu(e) {
    /* get information about the point the user clicked on */
    const distToPix = (miles, l, z) => {
        return (miles * 1609.34) / (40075017 * Math.cos(l * (Math.PI / 180)) / Math.pow(2, z + 8));
    };

    let dist = distToPix(20, e.lngLat.lat, map.getZoom()),
        features = '',
        query = map.queryRenderedFeatures([
            [e.point.x - dist, e.point.y - dist],
            [e.point.x + dist, e.point.y + dist]
        ]);

    if (query.length > 0) {
        let ca = cb = cc = cd = ce = cf = cg = 0,
            wild = [];

        query.forEach((f) => {
            /*const geometry = f.geometry;*/

            if (f.layer.id == 'trails') {
                let icon;

                trailheads.forEach((t) => {
                    if (t.properties.trail_id == f.properties.trail_id) {
                        icon = smallIcon(t.properties.icon);
                    }
                });

                const dist = JSON.parse(f.properties.stats).distance;
                features += (ca == 0 ? '<h4>Trails</h4>' : '') + '<li data-tid="' + f.properties.trail_id + '" data-type="trail"><div><span class="feature-icon ' + icon + '"></span><label>' + f.properties.caption + '</label></div><div class="extra">' + dist.toFixed(1) + ' mi.</div></li>';
                ca++;
            }

            if (f.layer.id == 'trailheads') {
                const dist = JSON.parse(f.properties.stats).distance;
                features += (cb == 0 ? '<h4>Trailheads</h4>' : '') + '<li data-tid="' + f.properties.trail_id + '" data-type="th"><div><span class="feature-icon far fa-signs-post"></span><label>' + f.properties.title + '</label></div><div class="extra">' + dist.toFixed(1) + ' mi.</div></li>';
                cb++;
            }

            if (f.layer.id == 'poi-label' || f.layer.id == 'national-forest-labels') {
                if (f.properties.name.search('National Forest')) {
                    features += (cg == 0 ? '<h4>National Forest</h4>' : '') + '<li class="v"><div><span class="feature-icon fas fa-tree-large"></span><label>' + f.properties.name + '</label></div></li>';
                    cg++;
                } else if (f.properties.type == 'Camp Site' || f.properties.type == 'Chalet') {
                    const icon = (f.properties.type == 'Camp Site' ? 'fa-campground' : (f.properties.type == 'Chalet' ? 'fa-cabin' : ''));
                    features += (cc == 0 ? '<h4>Campgrounds</h4>' : '') + '<li><div><span class="feature-icon fas ' + icon + '"></span><label>' + f.properties.name + '</label></div></li>';
                    cc++;
                }
            }

            if (f.layer.id == 'water-line-label' || f.layer.id == 'water-point-label') {
                features += (cd == 0 ? '<h4>Water</h4>' : '') + '<li><div><span class="feature-icon fas fa-water"></span><label>' + f.properties.name + '</label></div><div class="extra">' + (f.properties.elevation_ft ? numberFormat(f.properties.elevation_ft) + ' ft.' : '') + '</div></li>';
                cd++;
            }

            if (f.layer.id == 'wilderness-fill' || f.layer.id == 'nps-parks') {
                features += (ce == 0 ? '<h4>Wilderness & National Parks</h4>' : '');

                if (f.layer.id == 'wilderness-fill' && !wild.includes(f.properties.NAME)) {
                    features += '<li class="v"><div><span class="feature-icon fas fa-trees"></span><label>' + f.properties.NAME + '</label></div><div class="extra">' + f.properties.Description + ' <a href="' + f.properties.URL + '" target="blank">Read more</a></div></li>';
                    wild.push(f.properties.NAME);
                }

                if (f.layer.id == 'nps-parks' && !wild.includes(f.properties.UNIT_NAME)) {
                    features += '<li class="v"><div><span class="feature-icon fas fa-trees"></span><label>' + f.properties.UNIT_NAME + ' (' + f.properties.STATE + ')</label></div><div class="extra"><a href="https://nps.gov/' + f.properties.UNIT_CODE.toLowerCase() + '" target="blank">Learn more about ' + f.properties.PARKNAME + '</a></div></li>';
                    wild.push(f.properties.UNIT_NAME);
                }
                ce++;
            }

            if (f.layer.id == 'natural-point-label') {
                features += (cf == 0 ? '<h4>Peaks</h4>' : '') + '<li><div><span class="feature-icon fas fa-' + (f.properties.maki == 'mountain' || f.properties.maki == 'volcano' ? 'mountain' : 'circle-info') + '"></span><label>' + f.properties.name + '</label></div><div class="extra">' + numberFormat(f.properties.elevation_ft) + ' ft.</div></li>';
                cf++;
            }
        });
    }

    modal.innerHTML = modalHeader + '<div class="content"><ul class="user-tracks"><li><div class="trk"><div id="ts" style="display:block;margin-top:0"><ol>' +
        '<li><div class="w">Coordinates</div><div class="v">' + e.lngLat.lat.toFixed(4) + ', ' + e.lngLat.lng.toFixed(4) + copyData.replace('{content}', e.lngLat.lat + ', ' + e.lngLat.lng) + '</div></li>' +
        '<li><div class="w">Elevation</div><div class="v">' + numberFormat(new Calculate().getElevation(e.lngLat.lat, e.lngLat.lng, 1)) + ' ft.</div></li>' +
        '</ol></div></div></li></ul>' + (features != '' ? '<h3 class="feat">Things Near Here</h3><ul class="features">' + features + '</ul>' : '') + '</div>';

    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'What\'s near here?';

    document.querySelectorAll('ul.features li').forEach((p) => {
        p.addEventListener('click', (f) => {
            if (p.getAttribute('data-type')) {
                trailheads.forEach((th) => {
                    if (th.properties.trail_id == p.getAttribute('data-tid')) {
                        if (p.getAttribute('data-type') == 'th') {
                            const c = th.properties.stats.geo.start;

                            map.easeTo({
                                center: [parseFloat(c[1]), parseFloat(c[0])],
                                zoom: map.getZoom()
                            });
                        } else {
                            const bounds = new mapboxgl.LngLatBounds(),
                                sw = th.properties.stats.bounds.sw,
                                ne = th.properties.stats.bounds.ne;

                            bounds.extend(new mapboxgl.LngLat(
                                sw[0], sw[1]
                            ));

                            bounds.extend(new mapboxgl.LngLat(
                                ne[0], ne[1]
                            ));

                            map.fitBounds(bounds);
                        }
                    }
                });
            }
        });
    });
}

function set3d(e, p, b) {
    map.setTerrain({
        'exaggeration': e
    })
        .setBearing(b != null ? b : 0)
        .setPitch(p != null ? p : 60)
        .setFog(fog);
}

async function init() {
    let options = [['filter', settings.category]];

    if (settings.activity) {
        options.push(['category', settings.activity.replace('-', ' ')]);
    }

    gi = await api(apiURL + 'trails/gis/display');
    theads = await api(apiURL + 'trails/list', options);

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: tiles[settings.getBasemap()],
        projection: 'mercator',
        hash: true,
        pitch: (settings.map().pitch ? settings.map().pitch : 0),
        bearing: (settings.map().bearing ? settings.map().bearing : 0),
        attributionControl: false,
        zoom: settings.map().zoom,
        center: [settings.map().lon, settings.map().lat]
    }).on('contextmenu', (e) => {
        if (settings.hasPermissions()) {
            doContextMenu(e);
        }
    }).on('style.load', () => {
        document.querySelector('.loading').remove();

        icons.forEach((icon) => {
            if (!map.hasImage('icon-' + icon)) {
                map.loadImage(cdn + 'icons/' + icon + '.png', (error, image) => { if (error) throw error; map.addImage('icon-' + icon, image); });
            }
        });

        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
        }).setTerrain({
            source: 'mapbox-dem',
            exaggeration: 0
        });

        if (settings.map().toggle3d == '3d') {
            set3d(EXAGG, map.getPitch());
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
                    visibility: (settings.layers().avy() && settings.category == 'snow' ? 'visible' : 'none')
                },
                paint: {
                    'raster-opacity': settings.get('avyOpac') ? settings.get('avyOpac') : 0.4
                }
            });
        }

        if (!map.getSource('fswms')) {
            map.addSource('fswms', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256,
                scheme: 'xyz'
            });
        }

        if (!map.getLayer('fswms')) {
            map.addLayer({
                id: 'fsadmin',
                type: 'raster',
                source: 'fswms',
                paint: {},
                layout: {
                    visibility: (settings.layers().fsadmin() ? 'visible' : 'none')
                }
            });
        }
    }).on('load', () => {
        const ctr = map.getCenter();
        /*new Weather().getWeather([ctr.lng, ctr.lat], false);*/

        if (settings.hasPermissions()) {
            /*loadScript(host + 'src/js/mt.draw-' + version + '.js').then(() => {*/
            loadScript(host + 'v' + version + '/mt.draw.js?' + new Date().getTime()).then(() => {
                mbdraw();
            });
        }

        const gtht = setTimeout(() => {
            if (theads !== undefined) {
                new Trails(false).getTHs();
                clearTimeout(gtht);
            }
        }, 500);

        if (settings.layers().snotel()) {
            getSnotels();
        }

        if (settings.layers().contours()) {
            new Trails().contours();
        }

        if (settings.layers().radar()) {
            new Weather().radarInit();
        }
    }).on('movestart', () => {
        map.getCanvas().style.cursor = 'grabbing';
        startLat = map.getCenter().lat;
        startLon = map.getCenter().lng;
    }).on('moveend', () => {
        map.getCanvas().style.cursor = 'auto';
        /*new Weather().getWeather(map.getBounds());*/
    }).addControl(new mapboxgl.FullscreenControl({
        container: document.body
    })).addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    })).addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    })).addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        })
    ).addControl(new RulerControl({
        units: 'mi'
    }));

    map.getCanvas().style.cursor = 'auto';

    /* add 2D/3D control */
    document.querySelector('.mapboxgl-ctrl-top-right').insertAdjacentHTML('beforeend', '<div class="mapboxgl-ctrl mapboxgl-ctrl-group">' +
        '<button id="toggle3d" data-type="' + (settings.map().toggle3d ? settings.map().toggle3d : '2d') + '" type="button">' + (settings.map().toggle3d ? (settings.map().toggle3d == '3d' ? '2D' : '3D') : '3D') + '</button></div>');

    /* add activities to activity filter */
    const theact = (settings.activity ? (settings.activity == 'atv' ? 'ATV' : ucwords(settings.activity.replace('-', ' '))) : 'all');

    activities.forEach((a) => {
        const k = Object.keys(a)[0],
            v = Object.values(a)[0],
            li = document.createElement('li');

        if (settings.activity && v == theact) {
            li.classList.add('active');
        }
        li.setAttribute('data-type', k);
        li.innerHTML = v;

        document.querySelector('ul.list[data-dd="activities"]').appendChild(li);
    });

    if (settings.activity) {
        document.querySelector('button[data-dd="activities"] .label').innerHTML = theact;
    } else {
        document.querySelectorAll('ul.list[data-dd="activities"] li').forEach((v) => {
            if (v.innerHTML == 'All Trail') {
                v.classList.add('active');
            }
        });
    }

    /* controls for custom dropdowns */
    document.querySelectorAll('.dropdown-button button').forEach((d) => {
        d.addEventListener('click', (e) => {
            const t = e.target.closest('button'),
                list = t.parentElement.querySelector('ul.list'),
                ar = t.querySelector('.arrow');

            if (t.classList.contains('expand')) {
                t.classList.remove('expand');
                list.style.display = 'none';
            } else {
                t.classList.add('expand');
                list.style.display = 'inline-flex';
            }
        });
    });

    document.querySelectorAll('.dropdown-button ul.list li').forEach((e) => {
        e.addEventListener('click', (t) => {
            const v = t.target.innerHTML,
                c = t.target.getAttribute('data-type'),
                dd = t.target.parentElement.getAttribute('data-dd'),
                b = document.querySelector('.dropdown-button button[data-dd="' + dd + '"]'),
                a = b.querySelector('.arrow');

            document.querySelectorAll('.dropdown-button ul.list li').forEach((e) => {
                e.classList.remove('active');
            });

            b.querySelector('.label').innerHTML = v;
            b.classList.remove('expand');
            t.target.classList.add('active');
            t.target.parentElement.style.display = 'none';

            if (dd == 'activities') {
                let url;
                if (v == 'All Trail' || v == 'All Snow') {
                    url = c;
                } else {
                    url = c + '/' + v.replace(' ', '-').toLowerCase();
                }

                window.location.href = host + url + (window.location.hash ? window.location.hash : '');
            }
        });
    });
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        settings = new Settings(null);

        let usr = null,
            token = (/token=(.*?)(?=;|$)/gm).exec(document.cookie);

        if (token != null) {
            const get = await api(apiURL + 'user/get/mapotrails', [['token', token[1]]]);
            usr = get.user;

            /* change menu button */
            if (usr != null) {
                const a = document.querySelector('#account');
                a.querySelector('span').innerHTML = 'Account';
                a.setAttribute('data-tooltip', '{"text":"Account Settings","dir":"left"}');
            }
        }

        document.querySelector('nav ul').style.display = 'flex';

        settings = new Settings(usr);

        new Favorites().get();
    } else {
        /* initialize map */
        init();
        let done = false;

        /* get trail guide is specified by trail ID */
        if (settings.tid) {
            const intv = setInterval(() => {
                if (done) {
                    clearInterval(intv);
                } else {
                    if (trailheads.length > 0) {
                        done = true;

                        trailheads.forEach((f) => {
                            if (f.properties.trail_id == settings.tid) {
                                map.easeTo({
                                    center: [
                                        parseFloat(f.geometry.coordinates[0]),
                                        parseFloat(f.geometry.coordinates[1])
                                    ],
                                    zoom: 13,
                                    duration: 1500
                                }).on('moveend', () => {
                                    if (!tbLoad) {
                                        tbLoad = true;
                                        const query = map.queryRenderedFeatures({
                                            layers: ['trailheads']
                                        });

                                        if (query.length > 0) {
                                            query.forEach((t) => {
                                                if (t.properties.trail_id == settings.tid) {
                                                    new Trails().readTrail(t.properties);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            }, 500);
        }
    }
};

class Trails {
    constructor(refresh) {
        this.refresh = refresh;
    }

    async getTHs() {
        const premiumAllow = settings.hasPermissions();

        if (trailheads.length == 0) {
            /* parse THs into geojson for mapbox */
            if (theads.trails != null && theads.trails.length > 0) {
                theads.trails.forEach((t) => {
                    if (t.stats != null && t.premium == 0 || (t.premium == 1 && premiumAllow)) {
                        const cat = t.category[0];

                        if (settings.activity) {
                            const setact = ucwords(settings.activity.replace('-', ' '));

                            if (t.category.includes(setact.replace('Atv', 'ATV'))) {
                                tids.push(t.trail_id.toString());
                            }
                        }

                        t['icon'] = cat;

                        trailheads.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [
                                    t.stats.geo.start[1],
                                    t.stats.geo.start[0]
                                ]
                            },
                            properties: t
                        });
                    }
                });

                /* make search undisabled */
                document.querySelector('#q').disabled = false;
            }
        }

        Object.keys(gi.gis).forEach((g) => {
            if (tids.includes(g)) {
                gi.gis[g].forEach((n) => {
                    gisIDs.push(n);
                });
            }
        });

        this.processTHs();
    }

    processTHs() {
        const cc = [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            50,
            '#f28cb1'
        ];

        /* get GIS trails */
        this.getTrails();

        /* add trailheads source */
        if (!map.getSource('ths')) {
            map.addSource('ths', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: trailheads
                },
                cluster: true,
                clusterMaxZoom: 10,
                clusterMinPoints: 3,
                clusterRadius: 50
            });
        }

        /* add trailhead icon markers to map */
        if (!map.getLayer('trailheads')) {
            map.addLayer({
                id: 'trailheads',
                type: 'symbol',
                source: 'ths',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'icon'],
                        'Hike', 'icon-hike',
                        'Mountain Bike', 'icon-mtb',
                        'Road Bike', 'icon-road',
                        'Backcountry Ski', 'icon-atski',
                        'Climb', 'icon-climb',
                        'Alpine Ski', 'icon-alpine',
                        'Nordic Ski', 'icon-nordic',
                        'Big Ride', 'icon-big_ride',
                        'Fantasy', 'icon-fantasy',
                        'Snowmobile', 'icon-snomo',
                        'Gravel Bike', 'icon-gravel',
                        /*'Beginner', 'icon-hike',
                        'Private', 'icon-hike',*/
                        'Dirtbike', 'icon-dirtbike',
                        /*'Race', 'icon-hike',*/
                        'icon-info'
                    ],
                    'icon-size': 1,
                    'icon-allow-overlap': true,
                    visibility: (settings.layers().trailheads() ? 'visible' : 'none')
                },
            }).on('mouseenter', 'trailheads', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'trailheads', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('touchend', 'trailheads', (e) => {
                const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                    layers: ['trailheads']
                });

                if (features.length > 0) {
                    this.readTrail(features[0].properties);
                }
            }).on('click', 'trailheads', (e) => {
                const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                    layers: ['trailheads']
                });

                if (features.length > 0) {
                    this.readTrail(features[0].properties);
                }
            });
        }

        /* deal with marker clustering */
        if (!map.getLayer('cluster-ths')) {
            let clusterClick = (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['cluster-ths']
                });

                map.getSource('ths').getClusterExpansionZoom(features[0].properties.cluster_id,
                    (err, zoom) => {
                        if (err) return;

                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom + 1
                        });
                    }
                );
            };

            map.addLayer({
                id: 'cluster-ths',
                source: 'ths',
                type: 'circle',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': cc,
                    'circle-stroke-color': cc,
                    'circle-stroke-width': 5,
                    'circle-stroke-opacity': 0.5,
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        15,
                        20,
                        20,
                        50,
                        30
                    ]
                },
                layout: {
                    'visibility': (settings.layers().trailheads() ? 'visible' : 'none')
                }
            }).addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'ths',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['DIN Offc Pro Medium'],
                    'text-size': 14,
                    'visibility': (settings.layers().trailheads() ? 'visible' : 'none')
                }
            }).on('touchend', 'cluster-ths', (e) => {
                clusterClick(e);
            }).on('click', 'cluster-ths', (e) => {
                clusterClick(e);
            }).on('mouseenter', 'cluster-ths', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'cluster-ths', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }
    }

    /* when a trail is clicked on */
    onTrailClick(e) {
        const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
            layers: ['trails']
        });

        if (features.length > 0) {
            selected = features[0].id;

            /*map.setFeatureState({
                source: 'trailData',
                sourceLayer: 'mapotrails',
                id: selected
            }, {
                click: true
            });*/

            /* if the trail clicked on was the main trail route */
            if (features[0].properties.delta == 0) {
                /* get all trailheads that have rendered on the screen, then match the trail clicked on to the trailhead to get the 
                 * bounds of that trail to zoom the map into and then open the modal with the trail info
                 */
                trailheads.forEach((t) => {
                    if (t.properties.trail_id == features[0].properties.trail_id) {
                        let bnds,
                            prop = t.properties;

                        if (prop.stats instanceof Object) {
                            bnds = prop.stats.bounds;
                            prop.category = JSON.stringify(prop.category);
                            prop.keywords = JSON.stringify(prop.keywords);
                            prop.photo = JSON.stringify(prop.photo);
                            prop.stats = JSON.stringify(prop.stats);
                        } else {
                            bnds = JSON.parse(prop.stats).bounds;
                        }

                        this.readTrail(prop);

                        map.fitBounds([bnds.sw, bnds.ne], {
                            padding: 40
                        });
                    }
                });
            } else {
                const stats = this.stats(features[0].properties.stats),
                    content = (stats ? '<ul class="pu-stats"><li><div class="title">Distance</div><span>' + stats.distance().toFixed(1) + ' mi.</span></li>' +
                        '<li><div class="title">Max Elevation</div><span>' + numberFormat(stats.elevation().max(), 0) + ' ft.</span></li><li>' +
                        '<div class="title">Min Elevation</div><span>' + numberFormat(stats.elevation().min(), 0) + ' ft.</span></li>' +
                        '<li><div class="title">Elevation Gain</div><span>' + numberFormat(stats.altitude().gain(), 1) + ' ft.</span></li>' +
                        '<li><div class="title">Elevation Loss</div><span>' + numberFormat(stats.altitude().loss(), 1) + ' ft.</span></li></ul>' : '<span style="display:block;text-align:center;color:var(--gray)">No stats available</span>');

                popup(e, '<h3>' + features[0].properties.caption + '</h3>' + content);
            }
        }
    }

    stats(data) {
        const st = JSON.parse(data);

        return {
            distance: () => {
                return st.distance;
            },
            altitude: () => {
                return {
                    gain: () => {
                        return st.altitude.gain;
                    },
                    loss: () => {
                        return st.altitude.loss;
                    }
                };
            },
            elevation: () => {
                return {
                    min: () => {
                        return st.elevation.min;
                    },
                    max: () => {
                        return st.elevation.max;
                    }
                };
            }
        };
    }

    getTrails() {
        /* go to a specific area */
        if (settings.area) {
            this.area();
        }

        /* get waypoints */
        this.getWaypoints();

        /* generate filter for trails */
        let filter = ['all'];
        filter.push(['==', ['get', 'type'], settings.category]);
        filter.push(['==', ['get', 'display'], '1']);

        if (settings.activity) {
            filter.push(['in', ['get', 'trail_id'], ['literal', tids]]);
        }

        /* if user has permissions to see all trails */
        if (settings.getRole() != 'ADMIN') {
            filter.push(['==', ['get', 'public'], '1']);
        }

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
                minzoom: 10,
                'source-layer': 'mapotrails',
                filter: filter,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                    'visibility': (settings.layers().trails() ? 'visible' : 'none')
                },
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
                        /*1, ['case', ['boolean', ['feature-state', 'click'], false], 3, 1],
                        10, ['case', ['boolean', ['feature-state', 'click'], false], 4, 2],
                        12, ['case', ['boolean', ['feature-state', 'click'], false], 5, 3],
                        15, ['case', ['boolean', ['feature-state', 'click'], false], 7, 5]*/
                    ]
                }
            }).on('mouseenter', 'trails', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'trails', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('touchend', 'trails', (e) => {
                this.onTrailClick(e);
            }).on('click', 'trails', (e) => {
                this.onTrailClick(e);
            });
        }

        /* add text inside of trail lines */
        /*[
                        'match',
                        ['get', 'color'], '#000', 'rgba(150, 150, 150, 0)',
                        'rgba(250, 250, 250, 0.5)'
                    ]*/
        if (!map.getLayer('trailTitle')) {
            map.addLayer({
                id: 'trailTitle',
                type: 'symbol',
                source: 'trailData',
                'source-layer': 'mapotrails',
                paint: {
                    'text-color': [
                        'match',
                        ['get', 'color'],
                        [
                            '#000',
                            '#ff0000',
                            '#3949ab',
                            '#cb2626',
                            '#0058aa',
                            '#880e4f'
                        ],
                        '#ffffff',
                        '#000000'
                    ],
                    'text-halo-color': [
                        'match',
                        ['get', 'color'],
                        [
                            '#000',
                            '#3949ab',
                            '#ff0000',
                            '#cb2626',
                            '#0058aa',
                            '#880e4f'
                        ],
                        'rgb(61, 61, 61)',
                        'rgb(255, 255, 255)'
                    ],
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 150,
                    'text-font': ['DIN Pro Medium'],
                    'text-anchor': 'center',
                    'text-field': [
                        'match',
                        ['get', 'delta'], 0, ['get', 'title'],
                        ['get', 'caption']
                    ],
                    'text-size': 13,
                    'text-letter-spacing': 0.05,
                    'visibility': (settings.layers().trails() ? 'visible' : 'none')
                },
                filter: filter
            });
        }
    }

    async getWaypoints() {
        if (waypoints === undefined) {
            const arr = [];
            arr.push(['category', settings.category]);

            if (settings.activity) {
                arr.push(['activity', settings.activity]);
            }

            const way = await api(apiURL + 'trails/waypoints', arr),
                wf = [];

            way.features.forEach((f) => {
                if ((f.properties.public == 0 && settings.getRole() == 'ADMIN') || (f.properties.public == 1 && (f.properties.premium == 0 || f.properties.premium == 1 && settings.hasPermissions()))) {
                    wf.push(f);
                }
            });

            waypoints = {
                type: 'FeatureCollection',
                features: wf
            };
        }

        this.displayWaypoints();
    }

    displayWaypoints() {
        /* add waypoints source */
        if (!map.getSource('wps')) {
            map.addSource('wps', {
                type: 'geojson',
                data: waypoints
            });
        }

        if (!map.getLayer('waypoints')) {
            map.addLayer({
                id: 'waypoints',
                type: 'symbol',
                source: 'wps',
                minzoom: 11,
                filter: ['in', ['get', 'type'], ['literal', settings.category]],
                /*filter: ['in', ['get', 'trail_id'], ['literal', tids]],*/
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
                    'visibility': (settings.layers().waypoints() ? 'visible' : 'none')
                }
            }).on('mouseenter', 'waypoints', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'waypoints', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('click', (e) => {
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

                    const edit = '<a class="edit-link" href="https://www.mapotechnology.com/account/admin/trails/edit?id=' + features[0].properties.trail_id + '" target="blank"><i class="far fa-pen"></i>edit</a>';

                    popup(e, '<h3>' + name + '</h3><p style="text-align:center">' + note + '</p>' + (settings.getRole() == 'ADMIN' ? edit : ''));
                }
            });
        }
    }

    readTrail(trail) {
        let link,
            k = '',
            photo = JSON.parse(trail.photo),
            stats = this.stats(trail.stats),
            categories = JSON.parse(trail.category),
            keywords = JSON.parse(trail.keywords);

        if (favTrails.includes(trail.trail_id)) {
            link = '<a href="#" id="favTrail" onclick="return false" data-id="' + trail.trail_id + '" data-favorite="1" title="Remove this trail from your favorites" class="btn btn-sm btn-yellow" style="margin:0"><i class="fa-sharp fas fa-star"></i> Favorited Trail</a>';
        } else {
            link = '<a href="#" id="favTrail" onclick="return false" data-id="' + trail.trail_id + '" data-favorite="0" title="Add this trail from your favorites" class="btn btn-sm btn-yellow" style="margin:0"><i class="fa-sharp far fa-star"></i> Favorite Trail</a>';
        }

        modal.setAttribute('data-trail-brief', 1);
        modal.innerHTML = trailBrief.replace('{favTrailLink}', (settings.getUID() ? link : ''));

        /* add an edit link for admins */
        if (settings.getRole() == 'ADMIN') {
            document.querySelector('.rt-control').insertAdjacentHTML('beforeend', '<a class="edit-link" style="width:auto;margin:0" href="https://www.mapotechnology.com/account/admin/trails/edit?id=' + trail.trail_id + '" target="blank"><i class="far fa-pen"></i>edit</a>');
        }

        if (modal.style.display != 'flex') {
            modal.style.display = 'flex';
        }

        document.querySelector('#a').innerHTML = trail.title;
        document.querySelector('#j').innerHTML = '<img id="trailImg" class="placeholder" src="' + cdn + 'photos/' + photo.thumbnail + '" onerror="this.parentElement.parentElement.prepend(\'<div class=noimg></div>\');this.parentElement.remove();" style="width:100%;height:175px">';
        document.querySelector('#trailImg').style.height = 'unset';
        document.querySelector('#i').innerHTML = '<img src="' + cdn + 'icons/' + markerIcon(categories) + '.png">' + categories.join(' / ');
        document.querySelector('#c').innerHTML = stats.distance().toFixed(1) + ' <span>mi</span>';
        document.querySelector('#d').innerHTML = numberFormat(stats.elevation().max(), 1) + ' <span>ft</span>';
        document.querySelector('#e').innerHTML = numberFormat(stats.elevation().min(), 1) + ' <span>ft</span>';
        document.querySelector('#f').innerHTML = numberFormat(stats.altitude().gain(), 1) + ' <span>ft</span>';
        document.querySelector('#g').innerHTML = numberFormat(stats.altitude().loss(), 1) + ' <span>ft</span>';
        document.querySelectorAll('#h, #j').forEach((e) => {
            e.setAttribute('href', host + trail.url);
        });

        /* add keywords to modal */
        if (keywords != null && keywords[0] != '' && keywords !== false) {
            keywords.forEach((w) => {
                k += '<div class="tag" onclick="window.open(\'' + host + 'guides/all/all-activities/' + w.replaceAll(' ', '-').toLowerCase() + '\')">#' + w.replaceAll(' ', '').replaceAll('.', '') + '</div>';
            });

            document.querySelector('.tags').innerHTML = k;
        } else {
            document.querySelector('.tags').remove();
        }
    }

    contours() {
        if (!map.getSource('contours')) {
            map.addSource('contours', {
                type: 'vector',
                url: 'mapbox://mapbox.mapbox-terrain-v2'
            });
        }

        if (!map.getLayer('contours')) {
            map.addLayer({
                id: 'contours',
                type: 'line',
                source: 'contours',
                'source-layer': 'contour',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': (settings.getBasemap() == 'satellite' ? '#ccc' : '#877b59'),
                    'line-width': 1
                }
            }).addLayer({
                id: 'contours-text',
                type: 'symbol',
                source: 'contours',
                'source-layer': 'contour',
                paint: {
                    'text-color': (settings.getBasemap() == 'satellite' ? '#fff' : '#626250'),
                    'text-halo-width': 1,
                    'text-halo-blur': 0
                },
                layout: {
                    'symbol-placement': 'line',
                    'text-font': ['DIN Offc Pro Medium'],
                    'text-field': [
                        'concat', [
                            'round', [
                                '*',
                                ['get', 'ele'],
                                3.28084
                            ]
                        ],
                        ' ft'
                    ],
                    'text-size': 11
                }
            });


        }
    }

    area() {
        let count = 0,
            bounds = new mapboxgl.LngLatBounds(),
            s = settings.area.replace('-', ' ');

        trailheads.forEach((t) => {
            const kw = t.properties.keywords;

            for (let i = 0; i < kw.length; i++) {
                if (kw[i].toLowerCase().search(s) >= 0 || t.properties.title.toLowerCase().search(s) >= 0) {
                    const c = t.geometry.coordinates;

                    bounds.extend(new mapboxgl.LngLat(
                        parseFloat(c[0]),
                        parseFloat(c[1])
                    ));

                    count++;
                }
            }
        });

        if (count > 0) {
            console.log(bounds);
            map.fitBounds(bounds, {
                padding: 100
            });
        }
    }
}

class CustomControls {
    constructor(id) {
        this.id = id;
        this.allFeatures = userFeatures;

        userUploadFeatures.forEach((g) => {
            g.features.forEach((f) => {
                this.allFeatures.push(f);
            });
        });
    }

    /* create geojson feature for mapbox and display it on the map */
    toggle(checked, s) {
        const ts = document.querySelector('.user-tracks li[data-id="' + this.id + '"] #ts');

        ts.style.display = (checked ? 'block' : 'none');

        if (checked) {
            let feature,
                bounds,
                type,
                coords;

            this.allFeatures.forEach((f) => {
                if (this.id == f.id) {
                    type = f.type;
                    coords = f.coords;
                    feature = {
                        id: f.id,
                        type: 'Feature',
                        properties: {
                            color: f.color ? f.color : DEFAULT_COLOR
                        },
                        geometry: {
                            type: type,
                            coordinates: f.coords
                        }
                    };

                    bounds = new mapboxgl.LngLatBounds(turf.bbox(feature));
                }
            });

            Draw.add(feature);

            if (type == 'Point') {
                map.easeTo({
                    center: coords,
                    zoom: 15
                });
            } else {
                map.fitBounds(bounds, {
                    padding: 100
                });
            }
        } else {
            Draw.delete(this.id);
        }
    }

    store(e) {
        return isItem(e).parentElement.classList.contains('uploads') ? 'uploads' : 'features';
    }

    feature() {
        const parent = this;

        return {
            edit: () => {
                const h = document.querySelector('.user-tracks li[data-id="' + this.id + '"] h6'),
                    i = h.querySelector('input'),
                    f = h.querySelector('.editFeature'),
                    j = h.querySelector('.saveFeature');

                i.style.display = 'inline-flex';
                i.focus();
                i.selectionStart = i.value.length;
                i.selectionEnd = i.value.length;
                h.querySelector('span').style.display = 'none';
                f.style.display = 'none';
                j.style.display = 'block';
            },

            save: (w) => {
                const h = document.querySelector('.user-tracks li[data-id="' + this.id + '"] h6'),
                    dt = h.parentElement.querySelector('.dt'),
                    i = h.querySelector('input'),
                    f = h.querySelector('.editFeature'),
                    j = h.querySelector('.saveFeature'),
                    mod = Math.round(new Date().getTime() / 1000);

                if (this.store(h) == 'features') {
                    userFeatures.forEach((f, n) => {
                        if (f.id == parent.id) {
                            userFeatures[n].modified = Math.round(mod);
                            userFeatures[n].name = i.value;
                        }
                    });
                } else {
                    userUploadFeatures.forEach((g, m) => {
                        g.features.forEach((f, n) => {
                            if (f.id == parent.id) {
                                userUploadFeatures[m].features[n].modified = Math.round(mod);
                                userUploadFeatures[m].features[n].name = i.value;
                            }
                        });
                    });
                }

                new Design().save(parent.id, mod, [['name', i.value]]);

                i.style.display = 'none';
                h.querySelector('span').innerHTML = i.value;
                dt.innerHTML = 'Modified ' + timeAgo(mod);
                dt.setAttribute('title', prettyDT(mod));
                h.querySelector('span').style.display = 'block';
                f.style.display = 'block';
                j.style.display = 'none';
            },

            chart: (s) => {
                if (typeof Chart !== undefined) {
                    const c = this;

                    loadScript('https://cdn.jsdelivr.net/npm/chart.js')
                        .then(() => {
                            c.createChart(s);
                        });
                } else {
                    this.createChart(s);
                }
            },

            changeColor(color, store) {
                let h = document.querySelector('.user-tracks li[data-id="' + parent.id + '"] h6'),
                    dt = h.parentElement.querySelector('.dt'),
                    mod = Math.round(new Date().getTime() / 1000);

                if (store == 'features') {
                    userFeatures.forEach((f, n) => {
                        if (f.id == parent.id) {
                            userFeatures[n].modified = mod;
                            userFeatures[n].color = color;
                        }
                    });
                } else {
                    userUploadFeatures.forEach((g, m) => {
                        g.features.forEach((f, n) => {
                            if (f.id == parent.id) {
                                userUploadFeatures[m].features[n].modified = mod;
                                userUploadFeatures[m].features[n].color = color;
                            }
                        });
                    });
                }

                new Design().save(parent.id, mod, [['color', color]]);

                dt.innerHTML = 'Modified ' + timeAgo(mod);
                dt.setAttribute('title', prettyDT(mod));

                Draw.delete(this.id);
                parent.toggle(true, store);
            },

            saveNotes: (e, s) => {
                let /*arr = [],*/
                    mod = Math.round(new Date().getTime() / 1000),
                    notes = document.querySelector('#notes-' + this.id).value;

                if (notes == '') {
                    createDialog('Error', 'There are no notes to save. Type something first.');
                } else {
                    e.classList.add('disabled');
                    e.innerHTML = 'Saved!';

                    setTimeout(() => {
                        const dt = e.parentElement.parentElement.querySelector('.h .dt');

                        e.classList.remove('disabled');
                        e.innerHTML = 'Save';

                        dt.innerHTML = 'Modified just now';
                        dt.setAttribute('title', prettyDT(mod));
                    }, 2000);

                    if (this.store(e) == 'features') {
                        userFeatures.forEach((f, n) => {
                            if (f.id == parent.id) {
                                userFeatures[n].modified = mod;
                                userFeatures[n].notes = notes;
                            }
                        });
                    } else {
                        userUploadFeatures.forEach((g, m) => {
                            g.features.forEach((f, n) => {
                                if (f.id == parent.id) {
                                    userUploadFeatures[m].features[n].modified = mod;
                                    userUploadFeatures[m].features[n].notes = notes;
                                }
                            });
                        });
                    }

                    new Design().save(parent.id, mod, [['notes', notes]]);
                }
            },

            delete: (e) => {
                const type = e.getAttribute('data-type'),
                    store = e.getAttribute('data-store');

                createDialog('Delete ' + ucfirst(type), 'Are you sure you want to delete this ' + type + '?', true, 'Yes', 'Cancel');

                document.querySelector('.dialog #pos').addEventListener('click', () => {
                    document.querySelector('.user-tracks li[data-id="' + this.id + '"]').remove();

                    /*if (store == 'uploads') {
                        document.querySelector('.user-tracks h3.fileName[data-id="' + this.id + '"]').remove();
                    }*/

                    Draw.delete(this.id);
                    new Design(null).delete(parent.id);

                    notify('success', 'That ' + type + ' has been deleted.');
                });
            },

            export: (mode, store) => {
                let feats = [],
                    statData = {},
                    allFeatures = userFeatures,
                    name = 'my_mapotrails_' + (store == 'uploads' ? 'uploads' : 'content');

                userUploadFeatures.forEach((g) => {
                    g.features.forEach((f) => {
                        allFeatures.push(f);
                    });
                });

                /*JSON.parse(localStorage.getItem(store)).forEach((f) => {*/
                allFeatures.forEach((f) => {
                    if ((mode == 'single' && f.id == this.id) || mode != 'single') {
                        const con = {
                            type: 'Feature',
                            geometry: {
                                type: f.type,
                                coordinates: f.coords
                            },
                            properties: {
                                attribution: 'Created using ' + appName + ' (mapotrails.com)',
                                created: prettyDT(f.created, false, true),
                                id: f.id,
                                modified: prettyDT(f.modified, false, true),
                                name: f.name,
                                notes: f.notes
                            }
                        };

                        /* if user is a premium user, they can download the stats too */
                        if (settings.hasPermissions()) {
                            if (f.type == 'Point') {
                                statData = {
                                    elevation: f.stats.elevation + ' feet',
                                    aspect: {
                                        degrees: parseFloat(f.stats.aspect),
                                        bearing: new Calculate().getCompassDirection(f.stats.aspect)
                                    },
                                    slope: f.stats.slope + '°'
                                };
                            } else {
                                const elev = {
                                    change: {
                                        gain: f.stats.elevation.height.gain + ' feet',
                                        loss: f.stats.elevation.height.loss + ' feet'
                                    },
                                    profile: {
                                        minimum: f.stats.elevation.computed.min + ' feet',
                                        average: f.stats.elevation.computed.avg + ' feet',
                                        maximum: f.stats.elevation.computed.max + ' feet'
                                    }
                                };

                                statData = {
                                    points: f.stats.points,
                                    average_aspect: {
                                        degrees: parseFloat(f.stats.aspect.avg),
                                        bearing: new Calculate().getCompassDirection(f.stats.aspect)
                                    },
                                    slope: {
                                        minimum: f.stats.slope.min + '°',
                                        average: f.stats.slope.avg + '°',
                                        maximum: f.stats.slope.max + '°'
                                    }
                                };

                                if (f.type == 'LineString') {
                                    statData.distance = f.stats.distance + ' miles';
                                    statData.elevation = elev;
                                } else {
                                    statData.perimeter = {
                                        distance: f.stats.distance + ' miles',
                                        elevation: elev
                                    };
                                }
                            }
                        }

                        con.properties.stats = statData;

                        /* if downloading a feature that was uploaded */
                        if (store == 'uploads') {
                            userUploadFeatures.forEach((gg) => {
                                gg.features.forEach((ff) => {
                                    if (ff.id == f.id) {
                                        con.properties.upload = {
                                            file: gg.file,
                                            name: gg.fileName,
                                            type: gg.type,
                                            size: gg.size
                                        };
                                    }
                                });
                            });
                        }

                        feats.push(con);

                        if (mode == 'single') {
                            name = f.id;
                        }
                    }
                });

                const data = {
                    type: 'FeatureCollection',
                    created: prettyDT(new Date().getTime() / 1000, false, true),
                    features: feats
                };

                let file = document.createElement('a');
                file.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
                file.setAttribute('download', name + '.geojson');
                file.style.display = 'none';
                document.body.appendChild(file);
                file.click();
                document.body.removeChild(file);

                return true;
            }
        };
    }

    folder() {
        const layout = '<div class="trk"><div class="h"><div class="p"><i class="fad fa-folders" style="width:20px;font-size:20px;color:#ffce45"></i>' +
            '<div class="j"><h6 class="title"><span style="display:none">Title</span><input type="text" id="" placeholder="Folder name..." value="{{folderName}}" style="display:inline-flex">' +
            '<div class="controls" data-id=""><span class="fas fa-check saveFolder" data-type="folder" style="display:block;margin-right:1em" title="Save Folder"></span>' +
            '<span class="far fa-pen editFolder" title="Rename this folder" style="display:none"></span>' +
            '<span class="fas fa-trash deleteFolder" data-type="folder" title="Delete folder"></span></div></h6>' +
            '<span class="dt">Created just now</span></div></div></div>';

        return {
            uqid: () => {
                const array = new Uint8Array(16);
                window.crypto.getRandomValues(array);
                const randomBytes = Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join(''),
                    timestamp = Date.now().toString(36);

                return `${timestamp}${randomBytes}`;
            },

            /* creates a new folder for the user to organize their data into */
            new: async () => {
                let fid = this.folder().uqid(),
                    ins = document.createElement('li'),
                    folderName = 'New folder';

                ins.setAttribute('data-id', fid);
                ins.setAttribute('data-type', 'folder');

                if (userFolders.length > 0) {
                    const names = [];

                    userFolders.forEach((f) => {
                        if (f.name.search('New folder') >= 0) {
                            names.push(e.name);
                        }
                    });

                    if (names.includes('New folder')) {
                        folderName = 'New folder ' + (names.length + 1);
                    }
                }

                ins.innerHTML = layout.replaceAll('id=""', 'id="' + fid + '"').replace('{{folderName}}', folderName);

                document.querySelector('.tab-content[data-tab=draw] ul.user-tracks').prepend(ins);

                const inputField = document.querySelector('.tab-content[data-tab=draw] ul.user-tracks input[id=' + fid + ']');
                inputField.focus();
                inputField.setSelectionRange(inputField.value.length, inputField.value.length);

                let item = [
                    ['id', fid],
                    ['name', folderName],
                    ['items', []],
                    ['created', Math.round(new Date().getTime() / 1000)],
                    ['modified', Math.round(new Date().getTime() / 1000)]
                ],
                    json = Object.fromEntries(item);

                /* add new feature to user feature array */
                userFolders.unshift(json);

                /* convert coords and stats array elements to string for data transport*/
                item[2] = [item[2][0], JSON.stringify(item[2][1])];

                await api(host + 'api/v1/session/folders/create', item);
            },

            edit: () => {
                const h = document.querySelector('.user-tracks li[data-id="' + this.id + '"] h6'),
                    i = h.querySelector('input'),
                    f = h.querySelector('.editFolder'),
                    j = h.querySelector('.saveFolder');

                i.style.display = 'inline-flex';
                i.focus();
                i.selectionStart = i.value.length;
                i.selectionEnd = i.value.length;
                h.querySelector('span').style.display = 'none';
                f.style.display = 'none';
                j.style.display = 'block';
            },

            save: async () => {
                const h = document.querySelector('.user-tracks li[data-id="' + this.id + '"] h6'),
                    dt = h.parentElement.querySelector('.dt'),
                    i = h.querySelector('input'),
                    f = h.querySelector('.editFolder'),
                    j = h.querySelector('.saveFolder'),
                    mod = Math.round(new Date().getTime() / 1000);

                userFolders.forEach((f, n) => {
                    if (f.id == this.id) {
                        userFolders[n].name = i.value;
                        userFolders[n].modified = mod;
                    }
                });

                await api(host + 'api/v1/session/folders/update', [['id', this.id], ['name', i.value], ['modified', mod]]);

                i.style.display = 'none';
                h.querySelector('span').innerHTML = i.value;
                dt.innerHTML = 'Modified ' + timeAgo(mod);
                dt.setAttribute('title', prettyDT(mod));
                h.querySelector('span').style.display = 'block';
                f.style.display = 'block';
                j.style.display = 'none';
            },

            delete: () => {
                let items = [];

                createDialog('Delete folder', 'Are you sure you want to delete this folder? Deleting the folder does not delete any content inside it.', true, 'Yes', 'Cancel');

                document.querySelector('.dialog #pos').addEventListener('click', async () => {
                    document.querySelector('.user-tracks li[data-id="' + this.id + '"]').remove();

                    userFolders.forEach((f, index) => {
                        if (f.id == this.id) {
                            items = f.items;
                            userFolders.splice(index, 1);
                        }
                    });

                    items.forEach((i) => {
                        document.querySelector('.user-tracks li[data-id="' + i + '"]').classList.remove('in-folder', 'collapsed');
                    });

                    await api(host + 'api/v1/session/folders/delete', [['id', this.id]]);

                    notify('success', 'Your folder was successfully deleted.');
                });
                /*let arr = [],
                    items,
                    store = localStorage.getItem('folders');

                createDialog('Delete folder', 'Are you sure you want to delete this folder? Deleting the folder does not delete any content inside it.', true, 'Yes', 'Cancel');

                document.querySelector('.dialog #pos').addEventListener('click', () => {
                    document.querySelector('.user-tracks li[data-id="' + this.id + '"]').remove();

                    if (store != null && store != '') {
                        JSON.parse(store).forEach((f) => {
                            if (f.id != this.id) {
                                arr.push(f);
                            } else {
                                items = f.items;
                            }
                        });

                        items.forEach((i) => {
                            document.querySelector('.user-tracks li[data-id="' + i + '"]').classList.remove('in-folder', 'collapsed');
                        });

                        localStorage.setItem('folders', JSON.stringify(arr));
                    }

                    notify('success', 'Your folder was successfully deleted.');
                });*/
            }
        }
    }

    generate(e = null) {
        let feat;

        if (e != null) {
            e.classList.add('btn-black', 'disabled');
            e.classList.remove('btn-orange');
            e.innerHTML = 'Processing...';
        }

        userUploadFeatures.forEach((g, m) => {
            g.features.forEach((f, n) => {
                if (f.id == this.id) {
                    feat = f;

                    const d = new Design(),
                        stats = d.stats(f.type, f.coords),
                        mod = Math.round(new Date().getTime() / 1000);

                    userUploadFeatures[m].features[n].stats = stats;
                    userUploadFeatures[m].features[n].modified = mod;

                    d.save(f.id, mod, [['stats', JSON.stringify(stats)]]);
                }
            });
        });

        const par = document.querySelector('.user-tracks li[data-id="' + this.id + '"]'),
            ol = par.querySelector('ol'),
            guc = new GetUserContent(feat);

        ol.innerHTML = guc.getStats();

        if (feat.type == 'Polygon' || feat.type == 'LineString') {
            par.setAttribute('data-points', feat.stats.points);
        }

        if (feat.type == 'LineString') {
            ol.insertAdjacentHTML('afterend', slopeRose.replace('{{slopeRoseID}}', this.id));
            par.setAttribute('data-aspect', guc.slopeRose());
            guc.drawSlopeRose()
        }

        /*let arr = [],
            feat = null;

        JSON.parse(localStorage.getItem('uploads')).forEach((f) => {
            if (f.id == this.id) {
                f.stats = new Design().stats(f.type, f.coords);
                feat = f;
            }
            arr.push(f);
        });

        const par = document.querySelector('.user-tracks li[data-id="' + this.id + '"]'),
            ol = par.querySelector('ol'),
            guc = new GetUserContent(feat);

        ol.innerHTML = guc.getStats();

        if (feat.type != 'Point') {
            par.setAttribute('data-points', feat.stats.points);
        }

        if (feat.type == 'LineString') {
            ol.insertAdjacentHTML('afterend', slopeRose.replace('{{slopeRoseID}}', this.id));
            par.setAttribute('data-aspect', guc.slopeRose());
            guc.drawSlopeRose()
        }

        new Design(null).save(arr, true);*/
    }

    /*async rename() {
        const h = document.querySelector('.user-tracks.uploads li[data-id="' + this.id + '"] h6'),
            dt = h.parentElement.querySelector('.dt'),
            i = h.querySelector('input'),
            f = h.querySelector('.editFeature'),
            j = h.querySelector('.saveFeature'),
            mod = Math.round(new Date().getTime() / 1000);

        i.style.display = 'none';
        h.querySelector('span').innerHTML = i.value;
        dt.innerHTML = 'Modified ' + timeAgo(mod);
        h.querySelector('span').style.display = 'block';
        f.style.display = 'block';
        j.style.display = 'none';

        await api('https://www.mapotrails.com/api/v1/upload/rename', [['fid', this.id], ['n', i.value]]);
    }*/

    createChart(s) {
        let stats,
            name,
            times = [],
            elev = [],
            dist = [];

        document.body.insertAdjacentHTML('beforeend', '<div id="chart"><span class="fat fa-xmark closeChart"></span><canvas style="max-height:320px!important"></canvas>' +
            '<a href="#" id="downloadChart" class="btn disabled btn-sm btn-gray centered" style="margin-bottom:0"><i class="fas fa-download"></i>Download Chart</a></div>');

        JSON.parse(localStorage.getItem(s)).forEach((f) => {
            if (f.id == this.id) {
                stats = f.stats;
                name = f.name;
                times = [f.created, f.modified];
                /*const coords = (f.type == 'Polygon' ? f.coords[0] : f.coords);*/
                const coords = (f.coords.length == 1 ? f.coords[0] : f.coords);

                for (let i = 0; i < coords.length; i++) {
                    dist.push(new Calculate().distance(coords[0][1], coords[0][0], coords[i][1], coords[i][0]).toFixed(1));
                }
            }
        });

        stats.elevation.points.forEach((e, n) => {
            elev.push(e);
        });

        const minE = Math.min.apply(null, elev),
            maxE = Math.max.apply(null, elev),
            v = (maxE - minE > 1000 ? 500 : 100),
            minYScale = Math.floor((minE - v) / v) * v,
            maxYScale = Math.ceil((maxE + v) / v) * v;

        const eChart = new Chart(document.querySelector('#chart canvas'), {
            type: 'line',
            data: {
                labels: dist,
                datasets: [{
                    label: 'Elevation',
                    data: elev,
                    fill: false,
                    borderColor: '#83b692',
                    tension: 0.1
                }]
            },
            plugins: [
                {
                    id: 'customCanvasBackgroundColor',
                    beforeDraw: (chart, args, options) => {
                        const { ctx } = chart;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = options.color;
                        ctx.fillRect(0, 0, chart.width, chart.height);
                        ctx.restore();
                    }
                }
            ],
            options: {
                animation: {
                    onComplete: () => {
                        chartpng = eChart.toBase64Image();
                        const dc = document.querySelector('#downloadChart');

                        dc.classList.add('btn-black');
                        dc.classList.remove('disabled', 'btn-gray');
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    customCanvasBackgroundColor: {
                        color: '#fff',
                    },
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Elevation Profile for ' + name,
                        font: {
                            family: 'Roboto',
                            weight: 'bold',
                            size: 18
                        },
                        color: '#00385c'
                    },
                    subtitle: {
                        display: true,
                        text: (times[0] != times[1] ? 'Modified ' + timeAgo(times[1]).replace('&nbsp;', ' ') + ' · ' : '') + 'Created ' + prettyDT(times[0]),
                        font: {
                            family: 'Roboto',
                            size: 12
                        },
                        color: '#656565',
                        padding: {
                            top: 0,
                            bottom: 10
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#fff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        titleFont: {
                            family: 'Roboto',
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: 'Roboto'
                        },
                        padding: 10,
                        cornerRadius: 4,
                        borderColor: '#042a0b',
                        borderWidth: '1',
                        callbacks: {
                            title: function () {
                                return 'Track Point';
                            },
                            label: function (context) {
                                return ['Distance: ' + context.label + ' mi.', 'Elevation: ' + numberFormat(context.parsed.y) + ' ft.'];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Distance (mi)',
                            font: {
                                family: 'Roboto',
                                size: 12,
                                style: 'italic'
                            },
                            color: '#999'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return numberFormat(value, 1) + ' mi';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Elevation (ft)',
                            font: {
                                family: 'Roboto',
                                size: 12,
                                style: 'italic'
                            },
                            color: '#999'
                        },
                        beginAtZero: false,
                        min: minYScale,
                        max: maxYScale,
                        ticks: {
                            callback: (value) => {
                                return numberFormat(value, 0) + ' ft';
                            }
                        }
                    }
                }
            }
        });
    }

    /*download(m) {
        let file = document.createElement('a');
        file.setAttribute('href', cdn + 'userGIS/' + fn);
        file.setAttribute('download', fn);
        file.style.display = 'none';
        document.body.appendChild(file);
        file.click();
        document.body.removeChild(file);

        return true;
    }*/
}

window.onload = () => {
    if (window.location.search.search('logout=1') >= 0) {
        history.pushState({}, '', document.location.href.replace('?logout=1', ''));
    }

    /* remove weather icon after fonts have loaded */
    document.querySelector('body i.wi').remove();

    /* save settings automatically after the first minute, then every 5 minutes */
    setTimeout(() => {
        settings.saveSession(true, true);

        setInterval(() => {
            settings.saveSession(true, true);
        }, 300000);
    }, 600000);
};

/* custom tooltips
window.addEventListener('mouseover', (e) => {
    let el;

    if (e.target.classList.contains('ttip')) {
        el = e.target;
    } else if (e.target.parentElement.classList.contains('ttip')) {
        el = e.target.parentElement;
    }

    if (el) {
        const rect = el.getBoundingClientRect(),
            data = JSON.parse(el.getAttribute('data-tooltip')),
            tip = document.createElement('div');

        tip.style.top = rect.top + 'px';
        tip.style.left = rect.right + 'px';
        tip.classList.add('tooltip', data.dir);
        tip.innerHTML = '<p>' + data.text + '</p>';
        document.body.appendChild(tip);
    }
});

window.addEventListener('mouseout', () => {
    document.querySelectorAll('.tooltip').forEach((t) => {
        t.remove();
    });
});*/

/* search trails and cities control */
window.addEventListener('keyup', debounce((e) => {
    if (e.target.id == 'q') {
        let userSearch = async (q) => {
            let query = q.toLowerCase(),
                count = 0,
                results = document.querySelector('#search-results'),
                theseStates = ['OR', 'WA', 'ID', 'CA', 'UT', 'AZ'];

            if (query.length > 0) {
                trailheads.forEach((t) => {
                    let use = false,
                        title = t.properties.title.toLowerCase(),
                        p = title.split(' '),
                        dist = (t.properties.stats.distance ? t.properties.stats.distance.toFixed(1) : 'N/A'),
                        gain = (t.properties.stats.altitude ? t.properties.stats.altitude.gain.toFixed(1) : 'N/A');

                    for (let i = 0; i < p.length; i++) {
                        if (p[i].search(query) >= 0) {
                            use = true;
                        }
                    }

                    if (title.search(query) >= 0) {
                        use = true;
                    }

                    if (use) {
                        let icon = smallIcon(t.properties.icon);
                        const li = document.createElement('li');

                        li.setAttribute('data-tid', t.properties.trail_id);
                        li.setAttribute('data-type', 'trail');
                        li.innerHTML = '<span class="icon ' + (icon ? icon : 'none') + '"></span><h3>' + t.properties.title + '<span><b>Distance:</b> ' + dist + ' mi. &middot; <b>Elev. Gain:</b> ' + gain + ' ft.</span></h3>';
                        results.appendChild(li);
                        count++;
                    }
                });

                if (query.length >= 3) {
                    const search = await api(apiURL + 'search', [['q', query], ['citiesonly', 1]]);

                    if (search.rs != null && search.rs.length > 0) {
                        search.rs.forEach((p) => {
                            const st = (/,\s([A-Z][A-Z])\s/gm).exec(p.name)[1];

                            if (theseStates.includes(st)) {
                                const li = document.createElement('li');

                                li.setAttribute('data-lat', p.lat);
                                li.setAttribute('data-lon', p.lon);
                                li.setAttribute('data-type', 'city');
                                li.innerHTML = '<span class="icon fas fa-city"></span><h3>' + p.name.split(',')[0] + '<span>' + p.county + ' County &middot; ' + states[st] + '</span></h3>';
                                results.appendChild(li);
                                count++;
                            }
                        });
                    }
                }
            } else {
                results.querySelector('li.standby i').style.display = 'none';
                results.querySelector('li.standby span').innerHTML = 'No results found';
            }

            if (count == 0) {
                results.querySelector('li.standby i').style.display = 'none';
                results.querySelector('li.standby span').innerHTML = 'No results found';
            } else {
                results.querySelector('li.standby').style.display = 'none';
            }
        };

        userSearch(e.target.value);
    }
}, 1200));

window.addEventListener('keydown', (e) => {
    if (e.target.id == 'q') {
        if (!e.ctrlKey && !e.altKey && e.key != 'Enter' && e.key != 'Shift') {
            const results = document.querySelector('#search-results');

            if (results.style.display == '' || results.style.display == 'none') {
                results.style.display = 'flex';
            }

            if (results.querySelector('li.standby').style.display != 'inline-flex') {
                document.querySelectorAll('#search-results li:not(.standby)').forEach((li) => {
                    li.remove();
                });

                results.querySelector('li.standby').style.display = 'inline-flex';
            }

            results.querySelector('li.standby i').style.display = 'block';
            results.querySelector('li.standby span').innerHTML = 'Searching...';
        }
    }

    /* save folder and user map items by pressing enter */
    if (document.querySelector('.user-tracks') && document.querySelector('.user-tracks').contains(e.target) && e.target.type == 'text') {
        if (e.key == 'Enter') {
            const li = isItem(e.target),
                id = li.dataset.id,
                type = li.dataset.type,
                ctrl = new CustomControls(id);

            if (type == 'folder') {
                ctrl.folder().save();
            } else {
                ctrl.feature().save(li.querySelector('.saveFeature').dataset.type);
            }
        }
    }
});

/* onclick listener */
window.addEventListener('click', (e) => {
    const t = e.target,
        sr = document.querySelector('#search-results');

    /* menu buttons */
    if (document.querySelector('nav ul').contains(t)) {
        /* open layers menu */
        if (isItem(t).id == 'layer-group') {
            openLayers();
        }

        /* on login/account click */
        if (isItem(t).id == 'account') {
            if (settings.getUID() != null) {
                window.location.href = domain + 'account/home?ref=mapotrails';
            } else {
                window.location.href = domain + 'secure/login?service=mapotrails&next=' + encodeURIComponent(window.location.href);
            }
        }

        /* open basemap menu */
        if (isItem(t).id == 'basemap') {
            let l = modalHeader + '<div class="content"><ul class="layers-list">';

            tileNames.forEach((n, c) => {
                let p = true;

                l += (p === true ? '<li><div class="radio"><input type="radio" class="basemap-option" name="bsmo" data-tile="' + n + '"' + (n == settings.getBasemap() ? ' checked' : '') + '></div><div class="desc"><label>' +
                    (n == 'caltopo' ? 'CalTopo' : (n == 'fs16' ? 'USFS 2016' : (n == 'osm' ? 'Open Street Map' : (n == 'outdoors' ? 'MAPO Outdoors' : ucwords(n))))) + '</label></div></li>' : '');
            });

            modal.innerHTML = l + '</ul></div>';
            modal.style.display = 'flex';
            modal.querySelector('#a').innerHTML = 'Basemaps';
        };

        /* open custom user content */
        if (isItem(t).id == 'custom') {
            modal.innerHTML = userContent;
            modal.style.display = 'flex';
            modal.querySelector('#a').innerHTML = 'My Content';

            if (settings.hasPermissions()) {
                const startCust = setInterval(() => {
                    if (Draw != null) {
                        const guc = new GetUserContent();
                        guc.getDraw();
                        guc.displayUploads();

                        clearInterval(startCust);
                    }
                }, 100);
            } else {
                const ad = '<img src="' + domain + 'assets/images/create_account_icon.jpeg" style="width:150px;margin:1em auto;display:block">' +
                    '<h2 style="text-align:center">Want to map your own stuff?</h2>' +
                    '<p style="margin-top:2em;text-align:center"><a href="' + domain + 'secure/register?service=mapotrails&next=' + encodeURIComponent(window.location.href) +
                    '">Create an account</a> to upload your files, draw custom waypoints, tracks, polygons, and more!</p>';

                document.querySelector('.tab-content[data-tab=draw]').innerHTML = ad;
                document.querySelector('.tab-content[data-tab=uploads]').innerHTML = ad;
            }
        }

        /* upload a file */
        if (isItem(t).id == 'import' || isItem(t).id == 'uploadFromContent') {
            upload();
        }

        /* sync map settings */
        if (isItem(t).id == 'save') {
            settings.saveSession(false, true);
        }
    }

    /* upload a file from user content modal */
    if (t.id == 'uploadFromContent') {
        upload();
    }

    /* open dropdown nav menu */
    if (t.id == 'menuIcon' || t.id == 'dd-close') {
        document.querySelector('nav').classList.toggle('open');
    }

    /* on dialog button click */
    if (document.querySelector('.dialog') != null && t.classList.contains('cta')) {
        document.querySelector('.dialog').remove();
        document.querySelector('.backdrop').style.display = 'none';
    }

    /* pause of play radar */
    if (t.classList.contains('radarControl')) {
        const c = document.querySelector('.radarControl');

        if (radarPlay) {
            clearInterval(radarAnim);
            c.classList.remove('fa-pause');
            c.classList.add('fa-play');
            radarPlay = false;
        } else {
            let counter = document.querySelector('.radar input[type=range]').value,
                ra = () => {
                    radarImgs.forEach((e, n) => {
                        map.setLayoutProperty('radar-layer-' + n, 'visibility', (n == counter ? 'visible' : 'none'));
                        document.querySelector('.radar input[type=range]').value = counter;
                    });

                    if (counter == radarImgs.length - 1) {
                        counter = 0;
                        clearInterval(radarAnim);

                        setTimeout(() => {
                            radarAnim = setInterval(ra, RADAR_INT);
                        }, RADAR_INT);
                    } else {
                        counter++;
                    }
                };

            radarAnim = setInterval(ra, RADAR_INT);

            c.classList.add('fa-pause');
            c.classList.remove('fa-play');
            radarPlay = true;
        }
    }

    /* shrink or expand navbar */
    if (t.id == 'close-navbar') {
        if (t.getAttribute('data-open') == '1') {
            t.setAttribute('data-open', '0');
            t.classList.remove('fa-chevron-left');
            t.classList.add('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '40px');
            document.querySelector('nav').classList.add('hide');
        } else {
            t.setAttribute('data-open', '1');
            t.classList.add('fa-chevron-left');
            t.classList.remove('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '100px');
            document.querySelector('nav').classList.remove('hide');
        }
    }

    /* collapse and expand folders */
    if (t.classList.contains('expandFolder')) {
        t.classList.toggle('fa-chevron-down');
        t.classList.toggle('fa-chevron-up');
        t.setAttribute('title', (t.classList.contains('fa-chevron-down') ? 'Collapse' : 'Expand'));

        new GetUserContent().toggleFolder(t.parentElement.parentElement.parentElement.parentElement.dataset.id);
    }

    /* download a PNG of a created chart */
    if (t.id == 'downloadChart' && !t.classList.contains('disabled')) {
        let file = document.createElement('a');

        file.setAttribute('href', chartpng);
        file.setAttribute('download', 'mapotrails-chart_' + timeString() + '.png');
        file.style.display = 'none';
        document.body.appendChild(file);
        file.click();
        document.body.removeChild(file);
    }

    /* create a new folder */
    if (t.id == 'newFolder') {
        new CustomControls(null).folder().new();
    }

    /* user custom content controls */
    if (document.querySelector('.user-tracks') && document.querySelector('.user-tracks').contains(t) ||
        document.querySelector('.user-tracks.uploads') && document.querySelector('.user-tracks.uploads').contains(t)) {
        const ctrl = new CustomControls(t.parentElement.getAttribute('data-id'));

        /* edit item */
        if (t.classList.contains('editFeature')) {
            ctrl.feature().edit();
        }

        /* save item */
        if (t.classList.contains('saveFeature')) {
            ctrl.feature().save(t.getAttribute('data-type'));
        }

        /* edit folder */
        if (t.classList.contains('editFolder')) {
            ctrl.folder().edit();
        }

        /* save folder */
        if (t.classList.contains('saveFolder')) {
            ctrl.folder().save();
        }

        /* delete folder */
        if (t.classList.contains('deleteFolder')) {
            ctrl.folder().delete();
        }

        /* generate stats */
        if (t.classList.contains('generateStats')) {
            new CustomControls(t.getAttribute('data-id')).generate(t);
        }

        /* chart */
        if (t.classList.contains('chartFeature')) {
            ctrl.feature().chart(t.getAttribute('data-type'));
        }

        /* export */
        if (t.classList.contains('exportFeature')) {
            const s = t.getAttribute('data-store'),
                m = t.getAttribute('data-mode');

            ctrl.feature().export(m, s);
        }

        /* delete feature */
        if (t.classList.contains('deleteFeature')) {
            ctrl.feature().delete(t);
        }

        /* save notes to feature */
        if (t.classList.contains('saveNotes')) {
            new CustomControls(t.getAttribute('data-id')).feature().saveNotes(t, t.getAttribute('data-type'));
        }
    }

    /* change color of feature */
    if (t.classList.contains('clr')) {
        const li = isItem(t);

        t.parentElement.querySelectorAll('.clr').forEach((f) => {
            f.classList.remove('selected');
        });

        t.classList.add('selected');

        new CustomControls(li.dataset.id).feature().changeColor(t.dataset.color, t.parentElement.dataset.store);
    }

    /* export */
    if (t.classList.contains('exportAllFeatures')) {
        const s = t.getAttribute('data-store'),
            m = t.getAttribute('data-mode');

        new CustomControls(null).feature().export(m, s);
    }

    /* copy text to clipboard */
    if (t.classList.contains('copyData')) {
        navigator.clipboard.writeText(t.getAttribute('data-content'));
    }

    /* close chart modal */
    if (t.classList.contains('closeChart')) {
        chartpng = '';
        document.querySelector('#chart').remove();
    }

    /* user clicked on question mark faq helper icon */
    if (t.id == 'helper') {
        let w = t.dataset.info,
            h = '',
            m = '';

        if (w == 'predom') {
            h = 'Predominate Aspects';
            m = 'We calculate all the aspects within your polygon and determine what the top three predominate aspects are. We then calculate the percentage of aspects in relation to the entire polygon.';
        } else if (w == 'avy terrain') {
            h = 'Avalanche Terrain';
            m = 'We calculate all the slopes within your polygon and determine what percentage of it is considered to be likely avalanche terrain (slopes between 30&deg; and 45&deg;).';
        } else if (w == 'avy slopes') {
            h = 'Avalanche Slopes';
            m = 'At each point along your track, we determine if the point is located on a slope that could potentially avalanche. We only count it if the slope is between 30&deg; and 45&deg;.';
        } else if (w == 'avyable') {
            h = 'Avalanche Terrain';
            m = 'If this waypoint is located on a slope between 30&deg; and 45&deg;, it is considered avalanche terrain.';
        } else if (w == 'shapes') {
            h = 'Shapes';
            m = 'This is the number of sub-polygon shapes contained in this one feature.';
        }

        createDialog(h, m);
    }

    /* weather badge click to open full weather details in modal */
    /*if (document.querySelector('#weather').contains(t)) {
        if (curWX) {
            let lat, lon;

            if (curWX) {
                lat = curWX.lat;
                lon = curWX.lon;
            } else {
                const c = map.getCenter();
                lat = c.lat;
                lon = c.lng;
            }

            new Weather().getNWSFcst(parseFloat(lat).toFixed(4), parseFloat(lon).toFixed(4));

            modal.innerHTML = weather;

            if (modal.style.display != 'flex') {
                modal.style.display = 'flex';
            }

            modal.querySelector('#a').innerHTML = (curLoc ? curLoc : curWX.name);
            new Weather().displayCurCond();
        } else {
            notify('error', 'Unable to get weather conditions & forecast just yet.');
        }
    }*/

    /* tab controls */
    if (t.classList.contains('li-tab') || (t.parentElement && t.parentElement.classList.contains('li-tab'))) {
        const tab = t.getAttribute('rel');

        document.querySelectorAll('.li-tab').forEach((p) => {
            if (p.getAttribute('rel') == tab) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach((p) => {
            if (p.getAttribute('data-tab') == tab) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    }

    /* on search result click */
    if (sr.style.display != 'none' && t.closest('li') != null && t.closest('li').parentElement.id == 'search-results') {
        const p = t.closest('li'),
            type = p.getAttribute('data-type'),
            tid = p.getAttribute('data-tid');

        if (type == 'trail') {
            trailheads.forEach((t) => {
                if (t.properties.trail_id == tid) {
                    map.easeTo({
                        center: new mapboxgl.LngLat(t.geometry.coordinates[0], t.geometry.coordinates[1]),
                        zoom: 13
                    });

                    let prop = t.properties;

                    if (prop.stats instanceof Object) {
                        prop.category = JSON.stringify(prop.category);
                        prop.keywords = JSON.stringify(prop.keywords);
                        prop.photo = JSON.stringify(prop.photo);
                        prop.stats = JSON.stringify(prop.stats);
                    }

                    new Trails().readTrail(prop);
                }
            });
        } else {
            const lat = p.getAttribute('data-lat'),
                lon = p.getAttribute('data-lon');

            map.easeTo({
                center: new mapboxgl.LngLat(lon, lat),
                zoom: 12
            });
        }

        sr.style.display = 'none';
    }

    /* favorite a trail */
    if (t.id == 'favTrail') {
        new Favorites().fav(t);
    }

    /* toggle 3D mapping */
    if (t.id == 'toggle3d') {
        const p = map.getPitch(),
            b = map.getBearing();

        if (t.getAttribute('data-type') == '2d') {
            settings.update('toggle3d', '3d');
            set3d(EXAGG, p, map.getBearing());

            t.setAttribute('data-type', '3d');
            t.innerHTML = '2D';
        } else {
            settings.update('toggle3d', '2d');
            set3d(0, 0, 0);

            t.setAttribute('data-type', '2d');
            t.innerHTML = '3D';
        }
    }

    /* hide search results if outside search result container */
    if (!t.contains(document.querySelector('#search-results')) && !t.contains(document.querySelector('#q'))) {
        document.querySelector('#search-results').style.display = 'none';
        document.querySelector('#q').value = '';

        document.querySelectorAll('#search-results li:not(.standby)').forEach((li) => {
            li.remove();
        });
    }

    /* hide any dropdown menus when user clicks outside of them */
    document.querySelectorAll('.dropdown-button').forEach((d) => {
        if (!d.contains(t)) {
            const l = d.querySelector('ul.list');

            if (l.style.display == 'inline-flex') {
                d.querySelector('.dd').classList.remove('expand');
                l.style.display = 'none';
            }
        }
    });
});

window.addEventListener('change', async (e) => {
    const t = e.target;

    /* user created GEOJSON features, toggle on/off with checkbox */
    if (t.classList.contains('toggleUF')) {
        new CustomControls(t.getAttribute('data-id')).toggle(t.checked, t.getAttribute('data-type'));
    }

    /* control layers displayed on map */
    if (t.classList.contains('layer-option')) {
        const layer = t.getAttribute('data-layer');

        settings.updateLayer(layer, t.checked);
        settings.saveSession(true, false);

        /* avalanche shading overlay */
        if (layer == 'trailheads' || layer == 'trails' || layer == 'waypoints' || layer == 'fsadmin') {
            map.setLayoutProperty(layer, 'visibility', (t.checked ? 'visible' : 'none'));
        } else if (layer == 'snotel') {
            if (map.getLayer('snotels')) {
                map.setLayoutProperty('snotels', 'visibility', (t.checked ? 'visible' : 'none'));
            } else {
                getSnotels();
            }
        } else if (layer == 'contours') {
            if (map.getLayer('contours')) {
                map.setLayoutProperty('contours', 'visibility', (t.checked ? 'visible' : 'none'));
                map.setLayoutProperty('contours-text', 'visibility', (t.checked ? 'visible' : 'none'));
            } else {
                if (t.checked) {
                    new Trails().contours();
                }
            }
        } else if (layer == 'radar') {
            const wx = new Weather();

            if (t.checked) {
                if (map.getLayer('radar-layer-0')) {
                    wx.radar();
                } else {
                    wx.radarInit();
                }
            } else {
                clearInterval(radarAnim);
                radarImgs.forEach((e, n) => {
                    map.setLayoutProperty('radar-layer-' + n, 'visibility', 'none');
                });
                document.querySelector('.radar').remove();
            }
        } else if (layer == 'avy') {
            map.setLayoutProperty('avalanche', 'visibility', (t.checked ? 'visible' : 'none'));
            document.querySelector('.legend.avy').style.display = (t.checked ? 'flex' : 'none');
            document.querySelector('#avyOpac').style.display = (t.checked ? 'block' : 'none');
        }
    }

    /* change basemap */
    if (t.classList.contains('basemap-option')) {
        const tile = t.getAttribute('data-tile');

        map.setStyle(tiles[tile], {
            diff: false
        }).on('style.load', () => {
            const t = new Trails();

            t.getTHs();

            if (settings.layers().contours()) {
                t.contours();
            }

            /*if (settings.layers().contours()) {
                map.setPaintProperty('contours', 'line-color', (tile == 'satellite' ? '#ccc' : '#877b59'));
                map.setPaintProperty('contours-text', 'text-color', (tile == 'satellite' ? '#fff' : '#626250'));
            }*/
        });

        settings.update('tile', tile);
        settings.saveSession(true, false);
    }

    /* upload a file */
    if (t.name == 'file') {
        let form = document.querySelector('form#fileUpload'),
            u = form.querySelector('.uploading'),
            p = form.querySelector('#progress'),
            ps = p.querySelector('span'),
            request = new XMLHttpRequest(),
            fd = new FormData(form);

        t.style.display = 'none';
        u.style.display = 'flex';
        p.style.display = 'block';

        /* remove any existing error messages */
        if (document.querySelector('#modal .message')) {
            document.querySelector('#modal .message').remove();
        }

        /* let files = document.querySelector('form#fileUpload input[type=file]').files[0];
        const up = await api(host + 'api/v1/upload/do', [['file', files]]);*/

        fd.append('key', apiKey);
        request.open('POST', form.action);

        request.upload.addEventListener('progress', (e) => {
            const prog = Math.round((e.loaded / e.total) * 100);

            if (prog >= 7) {
                if (ps.style.display == 'none') {
                    ps.style.display = 'block';
                }
                ps.innerHTML = prog + '%';
                ps.style.width = prog + '%';
            }

            if (prog == 100) {
                p.style.background = '#25b350';
            } else {
                p.style.background = 'linear-gradient(to right, var(--blue), var(--blue) ' + prog + '%, #e6e8ec ' + prog + '%)';
            }
        });

        request.onreadystatechange = async () => {
            if (request.readyState == 4 && request.status == 200) {
                form.querySelector('#progress').style.display = 'none';
                const up = JSON.parse(request.responseText);

                /* if there was an error uploading, otherwise process file */
                if (up.error) {
                    modal.querySelector('form').insertAdjacentHTML('beforebegin', '<p class="message error">' + up.error + '</p>');
                    u.style.display = 'none';
                    modal.querySelector('input[name=file]').style.display = 'block';
                    modal.querySelector('input[name=file]').value = '';
                } else if (up.success == 1) {
                    const m = u.innerHTML;
                    u.innerHTML = m.replace('Uploading your file', 'Processing GIS data');

                    await fetch(cdn + 'userGIS/' + up.file)
                        .then(async (resp) => {
                            let data,
                                stop = false,
                                details,
                                content = await resp.text();

                            /* conver the user's uploaded file into geojson */
                            if (up.type == 'json' || up.type == 'geojson') {
                                data = JSON.parse(content);
                            } else {
                                const xmlDoc = new DOMParser().parseFromString(content, 'text/xml');

                                if (up.type == 'gpx') {
                                    data = toGeoJSON.gpx(xmlDoc);
                                } else if (up.type == 'kml') {
                                    data = toGeoJSON.kml(xmlDoc);
                                }
                            }

                            /* if a geometrycollection type is found, stop this process and exit as the software doesn't support that geometry type */
                            for (let i = 0; i < data.features.length; i++) {
                                if (data.features[i].geometry.type == 'GeometryCollection') {
                                    stop = true;
                                }
                            }

                            if (stop) {
                                form.insertAdjacentHTML('beforebegin', '<p class="message error">This file contains a geometry collection. Unfortunately, we don\'t support that type of data right now.</p>');
                                form.querySelector('.uploading').style.display = 'none';
                                form.querySelector('input[name=file]').style.display = 'block';
                                form.querySelector('input[name=file]').value = '';
                            } else {
                                delete up['metadata'];
                                delete up['success'];
                                new Design(data).createFromUpload(up);

                                modal.innerHTML = userContent;
                                modal.style.display = 'flex';
                                modal.querySelector('#a').innerHTML = 'My Content';

                                modal.querySelector('.li-tab[rel=draw]').classList.remove('active');
                                modal.querySelector('.tab-content[data-tab=draw]').classList.remove('active');
                                modal.querySelector('.li-tab[rel=uploads]').classList.add('active');

                                modal.querySelector('.tab-content[data-tab=uploads]').innerHTML = '<div style="text-align:center"><div class="spinner sm"></div><span style="display:block;margin-top:0.5em">Loading your content...</span></div>';
                                modal.querySelector('.tab-content[data-tab=uploads]').classList.add('active');

                                const guc = new GetUserContent();

                                guc.displayUploads();
                                guc.getDraw();
                            }

                            /* save everything that's happened up until this point */
                            settings.saveSession(true, false);
                        });
                }
            }
        };

        request.send(fd);
    }
});

/* avy opacity slider on input */
window.addEventListener('input', (e) => {
    if (e.target.id == 'avyOpac') {
        document.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + e.target.value + '%, transparent ' + e.target.value + '%)';
        settings.update('avyOpac', e.target.value);
        map.setPaintProperty('avalanche', 'raster-opacity', e.target.value / 100);
        settings.update('avyOpac', e.target.value);
    }
});