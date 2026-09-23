import { ENV, config } from '../app/config.js';
import { global } from '../app/state.js';
import { numberFormat } from '../utils/helpers.js';

import maplibregl from '../map/maplibre.js';

export function fitBounds(bounds, padding = 50) {
    const minAllowedZoom = 9;
    const camera = global.map.cameraForBounds(bounds, {
        linear: true,
        padding: padding
    });

    if (camera.zoom < minAllowedZoom) camera.zoom = minAllowedZoom;

    global.map.easeTo(camera);
}

function addStartsEnds(coords) {
    const SRC = 'trailStartsEnds';

    if (!global.map.getSource(SRC)) {
        global.map.addSource(SRC, {
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

    if (!global.map.getLayer(SRC)) {
        global.map.addLayer({
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

export function removeSelectedData() {
    const map = global.map;

    if (global.selected) {
        map.removeFeatureState({
            source: 'trailData',
            sourceLayer: 'mapotrails',
            id: global.selected
        });

        global.selected = null;
    }

    if (map.getLayer('trailStartsEnds')) map.removeLayer('trailStartsEnds');
    if (map.getSource('trailStartsEnds')) map.removeSource('trailStartsEnds');
}

export function createPopup(title, html, geo, options) {
    const geometry = geo.type === 'Point'
        ? geo.coordinates
        : geo.coordinates[Math.round(geo.coordinates.length / 2)];

    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
        .setLngLat(geometry)
        .setHTML(`<div class="header">
            <h1>${title}</h1>
            <button class="maplibregl-popup-close-button" type="button"><i class="far fa-xmark"></i></button>
        </div>
        ${config.settings.hasPermissions() && options?.edit
                ? `<a href="${ENV.domain}account/admin/trails/edit?id=${options.tid}" target="_blank" style="font-size:13px">edit</a>`
                : ''}
        ${html}`);

    popup.on('open', () => {
        const closeButton = popup.getElement()
            .querySelector('.maplibregl-popup-close-button');

        closeButton.addEventListener('click', () => {
            removeSelectedData();
            popup.remove();
        });
    });

    popup.addTo(global.map)
}

export async function onMapClick(e) {
    const buffer = 6;
    const features = global.map.queryRenderedFeatures([
        [e.point.x - buffer, e.point.y - buffer],
        [e.point.x + buffer, e.point.y + buffer]
    ]);

    // if there are no features returned, then exit early
    if (features.length == 0) return;

    // get geolocation data from vector tiles
    const geoFeatures = {
        county: null,
        state: null,
        elevation: 0,
        places: []
    };

    features.filter(f => ['openmaptiles', 'counties', 'contours'].includes(f.source))
        .forEach(f => {
            if (f.source === 'contours') {
                geoFeatures.elevation = f.properties.ele_ft;
            }

            if (f.source === 'openmaptiles') {
                if (!geoFeatures.places.includes(f.properties.name)) geoFeatures.places.push(f.properties.name);
            }

            if (f.source === 'counties') {
                geoFeatures.county = f.properties.NAME;
                geoFeatures.state = f.properties.STATE;
            }
        });

    // loop through all features
    for (let i = 0; i < features.length; i++) {
        const feature = features[i],
            source = feature.source,
            geometry = feature.geometry,
            prop = feature.properties;

        if (__DEBUG__) console.log(source, prop);

        // remove selected data on click
        removeSelectedData();

        /*
         * * * * WAYPOINTS * * * *
         */
        if (source === 'waypoints') {
            createPopup(
                prop.name,
                `${prop.note ? `<span>${prop.note}</span>` : ''}`,
                geometry,
                { edit: true, tid: prop.trail.trail_id }
            );

            return;
        }

        /*
         * * * * TRAILHEADS * * * *
         */
        if (source === 'trailheads') {
            if (prop?.cluster === true) {
                const expansionZoom = await global.map
                    .getSource('trailheads')
                    .getClusterExpansionZoom(prop.cluster_id);

                return global.map.easeTo({
                    center: geometry.coordinates,
                    zoom: expansionZoom + 1
                });
            }

            return global.trails.displayTrail(prop.id);
        }

        /*
         * * * * TRAILS * * * *
         */
        if (source === 'trailData') {
            const tid = Number(prop.trail_id);
            const { geojsonExtent } = await import('../utils/geometry.js');

            global.selected = feature.id;

            global.map.setFeatureState({
                source: 'trailData',
                sourceLayer: 'mapotrails',
                id: feature.id
            }, { click: true });


            addStartsEnds(geometry.coordinates);

            if (geometry) fitBounds(geojsonExtent(geometry), 150);

            if (prop.delta === 0) {
                global.trails.displayTrail(tid, prop.gis_id);
            } else {
                const stats = JSON.parse(prop.stats);

                createPopup(prop.caption, `<ul class="pu-stats">
                    <li>
                        <div class="title">Distance</div>
                        <span>${numberFormat(stats?.distance ?? 0, 1)} mi.</span>
                    </li>
                    <li>
                        <div class="title">Max. Elevation</div>
                        <span>${numberFormat(stats?.elevation?.max ?? 0, 1)} ft.</span>
                    </li>
                    <li>
                        <div class="title">Min. Elevation</div>
                        <span>${numberFormat(stats?.elevation?.min ?? 0, 1)} ft.</span>
                    </li>
                    <li>
                        <div class="title">Elev. Gain</div>
                        <span>${numberFormat(stats?.altitude.gain ?? 0, 1)} ft.</span>
                    </li>
                    <li>
                        <div class="title">Elev. Loss</div>
                        <span>${stats?.altitude?.loss ?? 0, 1} ft.</span>
                    </li>
                    ${stats?.slope?.avg ? `
                    <li>
                        <div class="title">Avg. Slope</div>
                        <span>${stats.slope.avg}%</span>
                    </li>` : ''}
                </ul>
                <a href="#" class="btn btn-green" style="display:block;margin:1rem auto 0 auto" data-action="main-guide" data-tid="${prop.trail_id}" onclick="return false">See trail guide</a>
                `, geometry, { edit: true, tid });
            }

            return;
        }
    }
}