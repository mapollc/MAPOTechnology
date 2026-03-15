let map, draw;
const ArcGISFeatureSource = window[""]["arcgis-featureserver"];
const urlParts = window.location.pathname.substring(1).split('/');

const config = {
    page: urlParts[2] ?? null,
    method: urlParts[3] ?? null,
    id: urlParts[4] ?? null
};

function showCurrentTime(timezone = 'UTC') {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone,
        timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);

    const hh = parts.find(p => p.type === 'hour')?.value ?? '00';
    const mm = parts.find(p => p.type === 'minute')?.value ?? '00';
    const ss = parts.find(p => p.type === 'second')?.value ?? '00';
    const tz = parts.find(p => p.type === 'timeZoneName')?.value ?? timezone;

    return `${hh}:${mm}:${ss} ${tz}`;
}

function tasks() {
    if (config.page == 'manage') {
        if (config.id) {
            // add line to map elements
            document.querySelector('#addMapEl').addEventListener('click', () => {
                const container = document.querySelector('#mapels');
                const count = container.childElementCount + 1;
                const row = document.createElement('div');
                row.classList.add('mapel');
                row.dataset.row = count;
                row.innerHTML = `<span>#${count}</span>
                    <input type="color" name="color[]" style="max-width:55px">
                    <input type="text" name="element_name[]" class="field" placeholder="Element name" value="">
                    <a href="#" data-row="${count}" class="deleteMapEl btn btn-red btn-small">Delete</a>
                `;

                container.appendChild(row);

                if (count > 1) document.querySelectorAll('.mapel').item(0).querySelector('a').style.display = 'inline-block';
            });

            // automatically create product identifier based on product name
            document.querySelector('input[name="name"]').addEventListener('keyup', (e) => {
                const value = e.target.value,
                    initials = value
                        .split(' ')
                        .filter(word => word.length > 0)
                        .map(word => word[0])
                        .join('');

                document.querySelector('#ident').value = initials;
                document.querySelector('input[name="identifier"]').value = initials;
            });
        }
    }

    if (config.page == 'issue') {
        if (document.querySelector('#map')) createMap();
    }
}

function generateColors() {
    const config = JSON.parse(document.querySelector('#map').dataset.config);
    const el = document.createElement('select');
    el.classList.add('palette');

    const count = config.colors.length;

    for (let i = 0; i < count; i++) {
        const op = document.createElement('option');
        op.value = config.colors[i];
        op.text = count == 1 ? 'Default Color' : config.names[i];
        op.style.color = config.colors[i];
        el.appendChild(op);
    }

    document.querySelector('.maplibregl-control-container').appendChild(el);
}

function updateFormGeometry() {
    const form = document.querySelector('form#issueProduct');
    const geojson = JSON.stringify(draw.getAll());

    form.querySelector('input[name="features"]').value = geojson;
}

async function addRadar() {
    const data = await fetch('https://api.rainviewer.com/public/weather-maps.json');

    if (data.ok) {
        const radar = await data.json();
        const img = radar.radar.past;

        const url = `https://tilecache.rainviewer.com${img[img.length - 1].path}/256/{z}/{x}/{y}/4/0_1.png`;

        map.addSource('radar', {
            type: 'raster',
            tiles: [url]
        });

        map.addLayer({
            id: 'radar',
            source: 'radar',
            type: 'raster',
            maxzoom: 7,
            paint: {
                'raster-fade-duration': 0,
                'raster-opacity': 0.7
            }
        });
    }
}

function addCounties() {
    if (!map.getSource('us_counties')) {
        new ArcGISFeatureSource('us_counties', map, {
            url: 'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0',
            precision: 6,
            where: '1=1',
            minzoom: 5
        });
    }

    if (!map.getLayer('us_counties')) {
        /*map.addLayer({
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
        });*/

        map.addLayer({
            id: 'county-boundaries',
            type: 'line',
            source: 'us_counties',
            minzoom: 5,
            paint: {
                'line-opacity': [
                    "step",
                    ["zoom"],
                    0,
                    5,
                    0.15,
                    7,
                    0.3,
                    9.5,
                    0.5,
                    16,
                    0.8
                ],
                'line-color': '#404040',
                'line-width': 1.5
            }
        });
    }
}

function createMap() {
    const styles = [
        {
            "id": "gl-draw-polygon-fill-inactive",
            "type": "fill",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "false"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "paint": {
                "fill-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
                "fill-outline-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
                "fill-opacity": 0.1
            }
        },
        {
            "id": "gl-draw-polygon-fill-inactive.cold",
            "type": "fill",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "false"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "paint": {
                "fill-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
                "fill-outline-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
                "fill-opacity": 0.1
            }
        },
        {
            "id": "gl-draw-polygon-fill-active",
            "type": "fill",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "true"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ]
            ],
            "paint": {
                "fill-color": "#404040",
                "fill-outline-color": "#404040",
                "fill-opacity": 0.1
            }
        },
        {
            "id": "gl-draw-polygon-midpoint",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "==",
                    "meta",
                    "midpoint"
                ]
            ],
            "paint": {
                "circle-radius": 3,
                "circle-color": "#404040"
            }
        },
        {
            "id": "gl-draw-polygon-stroke-inactive",
            "type": "line",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "false"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-polygon-stroke-active",
            "type": "line",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "true"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ]
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#404040",
                "line-dasharray": [
                    0.2,
                    2
                ],
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-line-inactive",
            "type": "line",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "false"
                ],
                [
                    "==",
                    "$type",
                    "LineString"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": ["coalesce", ["get", "user_color"], "#3bb2d0"],
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-line-active",
            "type": "line",
            "filter": [
                "all",
                [
                    "==",
                    "$type",
                    "LineString"
                ],
                [
                    "==",
                    "active",
                    "true"
                ]
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#404040",
                "line-dasharray": [
                    0.2,
                    2
                ],
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-polygon-and-line-vertex-stroke-inactive",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "meta",
                    "vertex"
                ],
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "paint": {
                "circle-radius": 5,
                "circle-color": "#fff"
            }
        },
        {
            "id": "gl-draw-polygon-and-line-vertex-inactive",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "meta",
                    "vertex"
                ],
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "paint": {
                "circle-radius": 3,
                "circle-color": "#404040"
            }
        },
        {
            "id": "gl-draw-point-point-stroke-inactive",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "false"
                ],
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "==",
                    "meta",
                    "feature"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "paint": {
                "circle-radius": 5,
                "circle-opacity": 1,
                "circle-color": "#fff"
            }
        },
        {
            "id": "gl-draw-point-inactive",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "active",
                    "false"
                ],
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "==",
                    "meta",
                    "feature"
                ],
                [
                    "!=",
                    "mode",
                    "static"
                ]
            ],
            "paint": {
                "circle-radius": 3,
                "circle-color": ["coalesce", ["get", "user_color"], "#3bb2d0"]
            }
        },
        {
            "id": "gl-draw-point-stroke-active",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "==",
                    "active",
                    "true"
                ],
                [
                    "!=",
                    "meta",
                    "midpoint"
                ]
            ],
            "paint": {
                "circle-radius": 7,
                "circle-color": "#fff"
            }
        },
        {
            "id": "gl-draw-point-active",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "$type",
                    "Point"
                ],
                [
                    "!=",
                    "meta",
                    "midpoint"
                ],
                [
                    "==",
                    "active",
                    "true"
                ]
            ],
            "paint": {
                "circle-radius": 5,
                "circle-color": "#404040"
            }
        },
        {
            "id": "gl-draw-polygon-fill-static",
            "type": "fill",
            "filter": [
                "all",
                [
                    "==",
                    "mode",
                    "static"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ]
            ],
            "paint": {
                "fill-color": "#404040",
                "fill-outline-color": "#404040",
                "fill-opacity": 0.1
            }
        },
        {
            "id": "gl-draw-polygon-stroke-static",
            "type": "line",
            "filter": [
                "all",
                [
                    "==",
                    "mode",
                    "static"
                ],
                [
                    "==",
                    "$type",
                    "Polygon"
                ]
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#404040",
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-line-static",
            "type": "line",
            "filter": [
                "all",
                [
                    "==",
                    "mode",
                    "static"
                ],
                [
                    "==",
                    "$type",
                    "LineString"
                ]
            ],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#404040",
                "line-width": 2
            }
        },
        {
            "id": "gl-draw-point-static",
            "type": "circle",
            "filter": [
                "all",
                [
                    "==",
                    "mode",
                    "static"
                ],
                [
                    "==",
                    "$type",
                    "Point"
                ]
            ],
            "paint": {
                "circle-radius": 5,
                "circle-color": "#404040"
            }
        }
    ];

    MapboxDraw.constants.classes.CANVAS = 'maplibregl-canvas';
    MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl';
    MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
    MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';
    MapboxDraw.constants.classes.ATTRIBUTION = 'maplibregl-ctrl-attrib';

    map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [-95.955095, 38.139743],
        zoom: 3.5,
        attributionControl: false
    });

    map.addControl(
        new maplibregl.AttributionControl({
            compact: true
        }), 'bottom-right'
    );

    map.on('load', () => {
        //addRadar();
        addCounties();
        generateColors();

        let activeColor = null,
            activeDesc = null;

        draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            },
            userProperties: true,
            styles
        });

        map.addControl(draw, 'top-right');

        const existingFeatures = document.querySelector('form#issueProduct input[name="features"]');

        if (existingFeatures && existingFeatures.value != '') {
            const geojson = JSON.parse(existingFeatures.value);
            const bounds = new maplibregl.LngLatBounds();

            geojson.features.forEach(feat => {
                const coords = feat.geometry.coordinates;
                coords[0].forEach(coord => bounds.extend(coord));

                draw.add(feat);
            });

            map.fitBounds(bounds, { padding: 175 });
            updateFormGeometry();
        }

        map.on('draw.modechange', (e) => {
            if (e.mode == 'draw_polygon') {
                activeColor = document.querySelector('select.palette').value;
                activeDesc = document.querySelector('select.palette').text;
            }
        });

        map.on('draw.create', (e) => {
            const id = e.features[0].id;

            draw.setFeatureProperty(id, 'color', activeColor);
            draw.setFeatureProperty(id, 'name', activeDesc);
            const feature = draw.get(id);

            draw.add(feature);

            activeColor = null;
            activeDesc = null;

            updateFormGeometry();
        });

        map.on('draw.update', () => updateFormGeometry());
        map.on('draw.delete', () => updateFormGeometry());
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setInterval(() => {
        const t = document.querySelector('#curtime');

        t.textContent = showCurrentTime(window.timezone);
    }, 1000);

    tasks();
});

window.addEventListener('click', (e) => {
    const target = e.target;

    // delete line to map elements
    if (target.classList.contains('deleteMapEl')) {
        e.preventDefault();

        const row = target.dataset.row;
        console.log(row);

        const el = document.querySelector(`#mapels > .mapel[data-row="${row}"]`);
        if (el) el.remove();

        const rows = document.querySelectorAll('.mapel');

        rows.forEach((d, i) => {
            const count = i + 1;
            d.dataset.row = count;
            d.querySelector('a').dataset.row = count;
            d.querySelector('span').textContent = `#${count}`;
        });

        if (rows.length == 1) document.querySelectorAll('.mapel').item(0).querySelector('a').style.display = 'none';

        return false;
    }

    if (target.classList.contains('go-back')) {
        const p = window.location.pathname;

        window.location.href = `//${window.location.host}${p.split('/', p.split('/').length - 1).join('/')}`;
    }
});

window.addEventListener('input', (e) => {
    const target = e.target;

    if (target.name == 'validity') {
        const validFrom = document.querySelector('#validFrom'),
            expireable = document.querySelector('#expireable'),
            whenExpires = document.querySelector('#whenExpires');

        validFrom.style.display = target.value == 1 ? 'block' : 'none';
        expireable.style.display = target.value == 1 ? 'block' : 'none';

        if (document.querySelector('input[name="expires"]:checked').value == 'predefined') {
            whenExpires.style.display = 'none';
        }
    }

    if (target.name == 'expires') {
        document.querySelector('#whenExpires').style.display = target.value == 'predefined' ? 'block' : 'none';
    }
});