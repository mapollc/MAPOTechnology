let map,
    tids = [],
    trails = [],
    selectedID = null,
    pn = window.location.pathname.split('/'),
    winter = pn.length == 3 && pn[2] == 'snow' ? true : false,
    counties = ['union', 'wallowa', 'baker', 'umatilla', 'grant'],
    base = 'https://cdn.mapotrails.com/bmfpr/',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ',
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
    };

function init() {
    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9',
        /*style: terrain,*/
        projection: 'mercator',
        hash: true,
        attributionControl: false,
        zoom: 9.03,
        center: [-117.7115, 45.408]
    }).setMinZoom(8).addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    })).addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    })).on('style.load', (e) => {
        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
        }).setTerrain({
            source: 'mapbox-dem',
            exaggeration: 0
        });

        document.querySelector('#basemap').style.display = 'block';
        document.querySelector('.logo').style.display = 'block';
        document.querySelector('#legend').style.display = 'inline-flex';
        new Layers().get();
    }).on('click', (e) => {
        queryMap(e);
    });
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function ucwords(s) {
    if (s.search(/\s/g) >= 0) {
        var a = s.split(' '),
            o = '';

        a.forEach(function (s) {
            o += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
        });

        return o.substring(0, o.length - 1);
    } else {
        return ucfirst(s);
    }
}

function fsRoad(r) {
    const s = r.substring(0, 4),
        m = (s.substring(2, 4) == '00' ? s.substring(0, 2) : s),
        sp = r.substring(4, 7);

    return 'USFS ' + m + ' Rd' + (sp && sp != '000' ? ' (' + sp + ' Spur)' : '');
}

function queryMap(e) {
    const features = map.queryRenderedFeatures([e.point.x, e.point.y]);

    if (features.length > 0) {
        let t = [],
            roads = [];

        features.forEach((f) => {
            if (f.layer.id == 'basemap') {
                t.push(category(f.properties.SUBCATEGORY));
            } else if (f.layer.id == 'potential_wilderness') {
                t.push('Potential Wilderness');
            } else if (f.layer.id == 'wilderness') {
                t.push('Existing Wilderness' + (f.properties.NAME ? ' (<i>' + ucwords(f.properties.NAME.toLowerCase()) + '</i>)' : ''));
            } else if (f.layer.id == 'watershed') {
                t.push('Watershed' + (f.properties.NAME ? ' (<i>' + ucwords(f.properties.NAME.toLowerCase()) + '</i>)' : ''));
            } else if (f.layer.id == 'scenic_rivers') {
                t.push('Wild & Scenic River' + (f.properties.RIVER ? ' (<i>' + ucwords(f.properties.RIVER.toLowerCase()) + '</i>)' : ''));
            } else if (f.layer.id == 'proposed_rivers' || f.layer.id == 'proposed_rivers_fill') {
                t.push('Proposed Wild & Scenic River' + (f.properties.WSR ? ' (<i>' + ucwords(f.properties.WSR.toLowerCase()) + '</i>)' : ''));
            } else if (f.layer.id == 'research_areas') {
                t.push('Research & Natural Area' + (f.properties.NAME ? ' (<i>' + ucwords(f.properties.NAME.toLowerCase()) + '</i>)' : ''));
            }/* else if (f.layer.id == 'roadless') {
                t.push('Inventoried Roadless Area' + (f.properties.NAME ? ' (' + f.properties.NAME + ')' : ''));
            }*/ else if (f.layer.id.search('roads_nmvu_') >= 0 && !roads.includes('USFS ' + f.properties.ID + ' Rd (Non-Motorized)')) {
                t.push(fsRoad(f.properties.ID) + '&mdash;Non-Motorized');
                roads.push('USFS ' + f.properties.ID + ' Rd (Non-Motorized)');
            } else if (f.layer.id.search('roads_m') >= 0 && !roads.includes('USFS ' + f.properties.ID + ' Rd (Motorized)')) {
                t.push(fsRoad(f.properties.ID) + '&mdash;Motorized');
                roads.push('USFS ' + f.properties.ID + ' Rd (Motorized)');
            }
        });

        if (t.length > 0) {
            let li = '';

            t.forEach((i) => {
                li += '<li>' + i + '</li>';
            });

            popup(e, '<h3>What\'s here?</h3><ul>' + li + '</ul>');
        }
    }
}

async function addTrails() {
    if (!map.getSource('trailData')) {
        await fetch('https://api.mapotechnology.com/v1/trails/list?key=cf707f0516e5c1226835bbf0eece4a0c&filter=' + (winter ? 'snow' : 'trail'))
            .then(async (resp) => {
                const data = await resp.json();

                data.trails.forEach((t) => {
                    if (!t.category.includes('Big Ride')) {
                        trails.push(t);
                        tids.push(t.trail_id);
                        console.log(t.category);
                    }
                });
            });

        const filter = (winter ? [
            'all',
            ['==', ['get', 'type'], 'snow'],
            ['==', ['get', 'public'], '1'],
            ['==', ['get', 'display'], '1']
        ] : [
            'all',
            ['==', ['get', 'type'], 'trail'],
            ['!=', ['get', 'mode'], 'Road'],
            ['==', ['get', 'public'], '1'],
            ['==', ['get', 'display'], '1']
        ]);

        map.addSource('trailData', {
            type: 'vector',
            url: 'mapbox://mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs'
        }).addLayer({
            id: 'trails',
            type: 'line',
            source: 'trailData',
            minzoom: 10,
            'source-layer': 'mapotrails',
            filter: filter,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': (winter ? [
                    'get', 'color'
                ] : [
                    'case',
                    ['==', ['get', 'mode'], 'ATV Track'], '#7c0c7c',
                    ['==', ['get', 'mode'], 'Gravel'], '#777',
                    '#cb2626'
                ]),
                'line-gap-width': 0,
                'line-width': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    1, 3,
                    9, 4,
                    10, 5,
                    12, 6,
                    13, 7
                ]
            }
        }).on('mouseenter', 'trails', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'trails', () => {
            map.getCanvas().style.cursor = 'auto';
        }).on('click', (e) => {
            const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                layers: ['trails']
            });

            if (features.length > 0) {
                let photo;

                trails.forEach((t) => {
                    if (t.trail_id == features[0].properties.trail_id) {
                        photo = t.photo;
                    }
                });

                popup(e, '<h3>' + features[0].properties.title + '</h3>' + (photo ? '<a href="//mapotrails.com/' + features[0].properties.url + '" target="blank"><img title="' + photo.caption + '" src="//cdn.mapotrails.com/photos/' + photo.thumbnail + '" style="margin-top:1em;width:100%"></a>' : '') +
                    '<a class="btn btn-green centered" style="margin-bottom:0;font-family:roboto" href="//mapotrails.com/' + features[0].properties.url + '" target="blank">See Trail Guide</a>');
            }
        });

        map.addLayer({
            id: 'trailTitle',
            type: 'symbol',
            source: 'trailData',
            minzoom: 9,
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
                'text-field': [
                    'match',
                    ['get', 'delta'], 0, ['get', 'title'],
                    ['get', 'caption']
                ],
                'text-size': 14,
                'text-letter-spacing': 0.05
            },
            filter: filter
        });
    }
}

function category(s) {
    let t = '';
    switch (s) {
        case '1A': t = 'Existing Wilderness'; break;
        case '1B': t = 'Preliminary Administratively Recommended Wilderness Area'; break;
        case '1C': t = 'Wilderness Study Area'; break;
        case '2D': t = 'Geologic Area'; break;
        case '2E': t = 'Historic Area'; break;
        case '2H': t = 'Scenic Area'; break;
        case '2I': t = 'Starkey Experimental Forest/Range'; break;
        case '3A': t = 'Backcountry (Non-Motorized Use)'; break;
        case '3B': t = 'Backcountry (Motorized Use)'; break;
        case '4A': t = 'General Forest'; break;
    }
    return t;
}

function popup(e, c) {
    new mapboxgl.Popup({
        closeOnClick: true,
        maxWidth: '300px'
    }).setLngLat([e.lngLat.lng, e.lngLat.lat])
        .setHTML(c)
        .addTo(map)
        .on('close', () => {
            counties.forEach((e, n) => {
                if (selectedID != null) {
                    map.setFeatureState({
                        source: 'rd_' + n,
                        id: selectedID
                    }, {
                        click: false
                    });

                    map.setFeatureState({
                        source: 'rd_nmvu_' + n,
                        id: selectedID
                    }, {
                        click: false
                    });

                    selectedID = null;
                }
            });
        });
}

class Layers {
    get() {
        /*this.basemap();*/
        this.wilderness();
        this.watersheds();
        this.scenicRivers();
        this.potentialScenicRivers();
        /*this.roadless();*/
        this.roads();
        this.research();
    }

    basemap() {
        /* get basemap */
        map.addSource('base', {
            type: 'vector',
            url: 'mapbox://mapollc.de3x79ad'
        }).addLayer({
            id: 'basemap',
            type: 'fill',
            source: 'base',
            'source-layer': 'bmfrp2019_base-3dixpb',
            paint: {
                'fill-color': [
                    'case', ['==', ['get', 'SUBCATEGORY'], '1A'], '#64bb38',
                    ['==', ['get', 'SUBCATEGORY'], '1B'], '#efc941',
                    ['==', ['get', 'SUBCATEGORY'], '1C'], '#267300',
                    ['==', ['get', 'SUBCATEGORY'], '2D'], '#ffbfe8',
                    ['==', ['get', 'SUBCATEGORY'], '2E'], '#00ffff',
                    ['==', ['get', 'SUBCATEGORY'], '2H'], '#bfe8ff',
                    ['==', ['get', 'SUBCATEGORY'], '2I'], '#91a8ff',
                    ['==', ['get', 'SUBCATEGORY'], '3A'], '#c0d935',
                    ['==', ['get', 'SUBCATEGORY'], '3B'], '#ffff00',
                    ['==', ['get', 'SUBCATEGORY'], '4A'], '#b0946b',
                    '#fff'
                ],
                'fill-opacity': 0.7
            }
        });
    }

    /* get potential wilderness */
    wilderness() {
        map.addSource('wild', {
            type: 'vector',
            url: 'mapbox://mapollc.c9m2ch11'
        }).addSource('pw', {
            type: 'vector',
            url: 'mapbox://mapollc.6t5mxq82'
        }).addLayer({
            id: 'wilderness',
            type: 'fill',
            source: 'wild',
            'source-layer': 'wilderness-cp2nt4',
            paint: {
                'fill-color': 'transparent',
                'fill-opacity': 0
            }
        }).addLayer({
            id: 'wilderness_outline',
            type: 'line',
            source: 'wild',
            'source-layer': 'wilderness-cp2nt4',
            paint: {
                'line-color': '#77b46e',
                'line-width': 2
            }
        }).on('mouseenter', 'wilderness', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'wilderness', () => {
            map.getCanvas().style.cursor = 'auto';
        }).addLayer({
            id: 'potential_wilderness',
            type: 'fill',
            source: 'pw',
            'source-layer': 'bmfpr_2024-br755p',
            paint: {
                'fill-color': '#f7b90c',
                'fill-opacity': 0.5
            }
        }).on('mouseenter', 'potential_wilderness', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'potential_wilderness', () => {
            map.getCanvas().style.cursor = 'auto';
        }).addLayer({
            id: 'potential_wilderness_outline',
            type: 'line',
            source: 'pw',
            'source-layer': 'bmfpr_2024-br755p',
            paint: {
                'line-color': '#333',
                'line-width': 2,
                'line-opacity': 0.5
            }
        });

        addTrails();
    }

    /* get watersheds */
    watersheds() {
        fetch(base + 'bmfpr2019_watershed.geojson')
            .then(async (resp) => {
                const data = await resp.json();

                map.addSource('ws', {
                    type: 'geojson',
                    data: data
                }).addLayer({
                    id: 'watershed',
                    type: 'fill',
                    source: 'ws',
                    paint: {
                        'fill-color': '#00cccc',
                        'fill-opacity': 0.7
                    }
                }).on('mouseenter', 'watershed', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'watershed', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            });
    }

    /* get scenic rivers */
    scenicRivers() {
        fetch(base + 'bmfpr2019_scenic_rivers.geojson')
            .then(async (resp) => {
                const data = await resp.json();

                map.addSource('sr', {
                    type: 'geojson',
                    data: data
                }).addLayer({
                    id: 'scenic_rivers',
                    type: 'fill',
                    source: 'sr',
                    paint: {
                        'fill-color': '#004da8',
                        'fill-opacity': 0.7
                    }
                }).on('mouseenter', 'scenic_rivers', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'scenic_rivers', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            });
    }

    /* get proposed scenic rivers */
    potentialScenicRivers() {
        fetch(base + 'bmfpr2019_proposed_scenic_rivers.geojson')
            .then(async (resp) => {
                const data = await resp.json();

                map.addSource('pr', {
                    type: 'geojson',
                    data: data
                }).addLayer({
                    id: 'proposed_rivers',
                    type: 'line',
                    source: 'pr',
                    paint: {
                        'line-color': '#004da8',
                        'line-width': 2
                    }
                }).addLayer({
                    id: 'proposed_rivers_fill',
                    type: 'fill',
                    source: 'pr',
                    paint: {
                        'fill-color': '#97dcf2',
                        'fill-opacity': 0.7
                    }
                }).on('mouseenter', 'proposed_rivers_fill', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'proposed_rivers_fill', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            });
    }

    /* get proposed scenic rivers */
    research() {
        fetch(base + 'bmfpr2019_research.geojson')
            .then(async (resp) => {
                const data = await resp.json();

                map.addSource('ra', {
                    type: 'geojson',
                    data: data
                }).addLayer({
                    id: 'research_areas',
                    type: 'fill',
                    source: 'ra',
                    paint: {
                        'fill-color': '#aa66cd',
                        'fill-opacity': 0.7
                    }
                }).on('mouseenter', 'research_areas', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'research_areas', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            });
    }

    /* get roadless inventory */
    roadless() {
        fetch(base + 'bmfpr2019_roadless.geojson')
            .then(async (resp) => {
                const data = await resp.json();

                map.addSource('ira', {
                    type: 'geojson',
                    data: data
                }).loadImage(
                    base + 'stripes.png',
                    (err, image) => {
                        if (err) throw err;
                        map.addImage('pattern', image);
                        map.addLayer({
                            id: 'roadless',
                            type: 'fill',
                            source: 'ira',
                            paint: {
                                'fill-pattern': 'pattern'
                            }
                        }).addLayer({
                            id: 'roadless_outline',
                            type: 'line',
                            source: 'ira',
                            paint: {
                                'line-color': '#020001',
                                'line-opacity': 0.5
                            }
                        }).on('mouseenter', 'roadless', () => {
                            map.getCanvas().style.cursor = 'pointer';
                        }).on('mouseleave', 'roadless', () => {
                            map.getCanvas().style.cursor = 'auto';
                        });
                    }
                );
            });
    }

    roads() {
        counties.forEach((e, n) => {
            /* add roads */
            fetch(base + 'fs_roads_' + e + '.geojson')
                .then(async (resp) => {
                    const data = await resp.json();

                    map.addSource('rd_' + n, {
                        type: 'geojson',
                        data: data
                    }).addLayer({
                        id: 'roads_m_' + n,
                        type: 'line',
                        source: 'rd_' + n,
                        minzoom: 12,
                        paint: {
                            'line-color': '#202020',
                            'line-width': [
                                'case',
                                ['boolean', ['feature-state', 'click'], false],
                                5,
                                3
                            ]
                        }
                    }).on('mouseenter', 'roads_m_' + n, () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'roads_m_' + n, () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'roads_m_' + n, (e) => {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['roads_m_' + n]
                        });

                        for (var i = 0; i < features.length; i++) {
                            selectedID = features[i].id;

                            map.setFeatureState({
                                source: 'rd_' + n,
                                id: features[i].id
                            }, {
                                click: true
                            });
                        }
                    }).addLayer({
                        id: 'roads_title_' + n,
                        type: 'symbol',
                        source: 'rd_' + n,
                        minzoom: 12,
                        paint: {
                            'text-color': '#fff',
                            'text-halo-color': 'rgb(61, 61, 61)',
                            'text-halo-blur': 1,
                            'text-halo-width': 1

                        },
                        layout: {
                            'symbol-placement': 'line',
                            'symbol-spacing': 150,
                            'text-font': ['DIN Pro Regular'],
                            'text-field': ['concat',
                                'USFS ',
                                ['get', 'ID'],
                                ' Rd'
                            ],
                            'text-size': 14,
                            'text-letter-spacing': 0.05
                        }
                    });
                });

            /* add non motorized roads */
            /*fetch(base + 'fs_nmvu_' + e + '.geojson')
                .then(async (resp) => {
                    const data = await resp.json();

                    map.addSource('rd_nmvu_' + n, {
                        type: 'geojson',
                        data: data
                    }).addLayer({
                        id: 'roads_nmvu_' + n,
                        type: 'line',
                        source: 'rd_nmvu_' + n,
                        minzoom: 12,
                        paint: {
                            'line-color': '#ff0000',
                            'line-dasharray': [2, 1],
                            'line-width': [
                                'case',
                                ['boolean', ['feature-state', 'click'], false],
                                5,
                                3
                            ]
                        }
                    }).on('mouseenter', 'roads_nmvu_' + n, () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'roads_nmvu_' + n, () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'roads_nmvu_' + n, (e) => {
                        const features = map.queryRenderedFeatures(e.point, {
                            layers: ['roads_nmvu_' + n]
                        });

                        for (var i = 0; i < features.length; i++) {
                            selectedID = features[i].id;

                            map.setFeatureState({
                                source: 'rd_nmvu_' + n,
                                id: features[i].id
                            }, {
                                click: true
                            });
                        }
                    }).addLayer({
                        id: 'roads_nmvu_title_' + n,
                        type: 'symbol',
                        source: 'rd_nmvu_' + n,
                        minzoom: 12,
                        paint: {
                            'text-color': '#fff',
                            'text-halo-color': 'rgb(61, 61, 61)',
                            'text-halo-blur': 1,
                            'text-halo-width': 1

                        },
                        layout: {
                            'symbol-placement': 'line',
                            'symbol-spacing': 150,
                            'text-font': ['DIN Pro Regular'],
                            'text-field': 'Non-motorized',
                            'text-size': 14,
                            'text-letter-spacing': 0.05
                        }
                    });
                });*/
        });
    }
}

window.onload = (e) => {
    init();
};

window.addEventListener('change', (e) => {
    if (e.target.id == 'basemap') {
        const d = e.target;

        map.setStyle((d.options[d.selectedIndex].value == 'fs16' ? fs16 : 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9'));
    }
});

window.addEventListener('click', (e) => {
    if (e.target.id == 'legend' || (e.target.parentElement && e.target.parentElement.id == 'legend') || (e.target.parentElement.parentElement && e.target.parentElement.parentElement.id == 'legend')) {
        document.querySelector('.panel').style.display = 'block';
    }

    if (e.target.id == 'panelClose') {
        document.querySelector('.panel').style.display = 'none';
    }
});