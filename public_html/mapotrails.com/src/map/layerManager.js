import { ENV, config } from '../app/config.js';
import { global } from '../app/state.js';
import { getContourLibrary, reorderLayers } from './layers.js';

import { layerMouseOver } from '../utils/helpers.js';
import { ArcGISFeature } from '../map/arcgis.js';

export class Layers {
    constructor() {
        this.clusterColors = [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            50,
            '#f28cb1'
        ];
    }

    async addTerrain() {
        await getContourLibrary();

        if (!global.map.getSource('terrain')) {
            global.map.addSource('terrain', {
                type: 'raster-dem',
                encoding: 'terrarium',
                maxzoom: 13,
                tileSize: 512,
                url: 'https://tiles.mapterhorn.com/tilejson.json'
            });
        }

        // set 3d terrain
        global.map.setTerrain({
            source: 'terrain',
            exaggeration: 1.2
        });
    }

    async getCounties() {
        if (!global.map.getSource('counties')) {
            new ArcGISFeature('counties', global.map, {
                //url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Counties_Generalized_Boundaries/FeatureServer/0',
                url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0',
                precision: 6,
                where: '1=1',
                outFields: 'NAME,STATE_ABBR AS STATE,FIPS,POPULATION,SQMI'
            });
        }

        if (!global.map.getLayer('counties')) {
            global.map.addLayer({
                id: 'counties',
                source: 'counties',
                type: 'fill',
                paint: {
                    'fill-opacity': 0,
                    'fill-color': '#fff'
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    displayTracks() {
        // generate filter for trails
        const filter = ['all'];
        filter.push(['==', ['get', 'type'], config.taxonomy.category]);
        filter.push(['==', ['to-number', ['get', 'display']], 1]);

        if (!config.settings.hasPermissions()) {
            filter.push(['==', ['to-number', ['get', 'public']], 1]);
            filter.push(['!=', ['to-number', ['get', 'premium']], 1]);
        }

        if (config.taxonomy.activity != null) {
            //filter.push(['==', ['get']]);
        }

        if (!global.map.getSource('trailData')) {
            global.map.addSource('trailData', {
                type: 'vector',
                tiles: [
                    'https://api.mapbox.com/v4/mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs/{z}/{x}/{y}.vector.pbf?access_token=sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ'
                ]
            });
        }

        // add trail lines
        if (!global.map.getLayer('trails')) {
            global.map.addLayer({
                id: 'trails',
                type: 'line',
                source: 'trailData',
                minzoom: 9,
                'source-layer': 'mapotrails',
                filter: filter,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                    'visibility': config.settings.isEnabled('trails') ? 'visible' : 'none'
                },
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': [
                        'interpolate',
                        ['exponential', 2],
                        ['zoom'],
                        1, ['case', ['boolean', ['feature-state', 'click'], false], 6, 1],
                        10, ['case', ['boolean', ['feature-state', 'click'], false], 7, 2],
                        12, ['case', ['boolean', ['feature-state', 'click'], false], 8, 3],
                        13, ['case', ['boolean', ['feature-state', 'click'], false], 10, 5]
                    ]
                }
            });

            layerMouseOver('trails');
        }

        if (!global.map.getLayer('trails_title')) {
            global.map.addLayer({
                id: 'trails_title',
                type: 'symbol',
                source: 'trailData',
                minzoom: 9,
                'source-layer': 'mapotrails',
                filter: filter,
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        9,
                        225,
                        18,
                        400
                    ],
                    'text-font': config.fonts.source(),
                    'text-anchor': 'center',
                    'text-max-angle': 50,
                    'text-field': [
                        'match',
                        ['get', 'delta'],
                        0,
                        ['get', 'title'],
                        ['get', 'caption']
                    ],
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        9,
                        12,
                        18,
                        16
                    ],
                    'text-allow-overlap': false,
                    'text-letter-spacing': 0.05,
                    'visibility': config.settings.isEnabled('trails') ? 'visible' : 'none'
                },
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
                }
            });

            layerMouseOver('trails_title');
        }

        reorderLayers();
    }

    displayTrailheads(geojson) {
        const SRC = 'trailheads';
        const filter = ['all'];

        if (!config.settings.hasPermissions()) {
            filter.push(['==', ['to-number', ['get', 'public']], 1]);
            filter.push(['!=', ['to-number', ['get', 'premium']], 1]);
        }

        if (global.map.getSource(SRC)) {
            global.map.getSource(SRC).setData(geojson);
        } else {
            global.map.addSource(SRC, {
                type: 'geojson',
                data: geojson,
                cluster: true,
                clusterMaxZoom: 10,
                clusterMinPoints: 3,
                clusterRadius: 50
            });
        }

        if (!global.map.getLayer('cluster-ths')) {
            global.map.addLayer({
                id: 'cluster-ths',
                source: SRC,
                type: 'circle',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': this.clusterColors,
                    'circle-stroke-color': this.clusterColors,
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
                    'visibility': config.settings.isEnabled('trailheads') ? 'visible' : 'none'
                }
            });

            layerMouseOver('cluster-ths');
        }

        if (!global.map.getLayer('cluster-count')) {
            global.map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: SRC,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': config.fonts.source(),
                    'text-size': 14,
                    'visibility': config.settings.isEnabled('trailheads') ? 'visible' : 'none'
                }
            });

            layerMouseOver('cluster-count');
        }

        if (!global.map.getLayer(SRC)) {
            global.map.addLayer({
                id: SRC,
                type: 'symbol',
                source: SRC,
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
                        'Dirtbike', 'icon-dirtbike',
                        'icon-info'
                    ],
                    'icon-size': 1.0,
                    'visibility': config.settings.isEnabled(SRC) ? 'visible' : 'none'
                }
            });

            layerMouseOver(SRC);
        }

        reorderLayers();
    }

    displayWaypoints(geojson) {
        const SRC = 'waypoints';
        const filter = ['all'];

        if (!config.settings.hasPermissions()) {
            filter.push(['==', ['to-number', ['get', 'public']], 1]);
            filter.push(['!=', ['to-number', ['get', 'premium']], 1]);
        }

        if (global.map.getSource(SRC)) {
            global.map.getSource(SRC).setData(geojson);
        } else {
            global.map.addSource(SRC, {
                type: 'geojson',
                data: geojson
            });
        }

        if (!global.map.getLayer(SRC)) {
            global.map.addLayer({
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
                    'visibility': config.settings.isEnabled(SRC) ? 'visible' : 'none'
                }
            });

            layerMouseOver(SRC);
        }

        reorderLayers();
    }

    avy() {
        if (!global.map.getSource('avy')) {
            global.map.addSource('avy', {
                type: 'raster',
                tiles: [`${ENV.domain}assets/images/tiles/4/{z}/{x}/{y}.png?force=1`],
                tileSize: 256,
                scheme: 'xyz'
            });
        }

        if (!global.map.getLayer('avalanche')) {
            global.map.addLayer({
                id: 'avalanche',
                type: 'raster',
                source: 'avy',
                layout: {
                    visibility: config.settings.isEnabled('avy') ? 'visible' : 'none'
                },
                paint: {
                    'raster-opacity': 0.4
                }
            });
        }
    }
}