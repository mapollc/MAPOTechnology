import * as helpers from '../utils/helpers.js';
import { ENV, config } from '../app/config.js';
import { global } from '../app/global.js';
import { RoadNetwork } from '../data/roads.js';

export class Data {
    constructor() {
        this.cluster = {
            maxZoom: 8,
            minPoints: 3,
            radius: 40
        };
        this.DB_NAME = 'OreRoadsCache';
        this.DB_LIST_OF_STORE_NAMES = ['prod', 'dev'];
        this.STORE_NAME = 'dev';
        this.DB_VERSION = 2;
        this.DEBUG = false;
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;

                this.DB_LIST_OF_STORE_NAMES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async setCacheItem(key, value) {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getCacheItem(key) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const req = tx.objectStore(this.STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async getCachedData(key, endpoint, ttlMinutes = 10) {
        const now = Date.now();
        const ttl = ttlMinutes * 60 * 1000;

        const cached = await this.getCacheItem(key);
        const meta = await this.getCacheItem(`${key}_meta`);

        try {
            let json;

            // Use cache if valid
            if (cached && meta && (now - meta < ttl)) {
                json = cached;
            } else {
                // Fetch new data
                const url = endpoint.includes('https') || endpoint.startsWith('//') ? endpoint : ENV.apiURL + endpoint;
                json = await helpers.api(url);

                if (json) {
                    if (json.metadata) delete json.metadata;
                    if (json.total) delete json.total;

                    await this.setCacheItem(key, json);
                    await this.setCacheItem(`${key}_meta`, now);
                }
            }

            return json;
        } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            return null;
        }
    }

    async clearAllCache() {
        const db = await this.openDB();
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        tx.objectStore(this.STORE_NAME).clear();

        return new Promise(res => (tx.oncomplete = res));
    }

    init() {
        this.getHighways();
    }

    async getHighways() {
        //let data;
        const url = `https://apps.mapotechnology.com/oreroads/v1.6/mileposts.geojson`;
        const json = await this.getCachedData('mileposts', url, 7889400);

        if (json) {
            new RoadNetwork().mileposts(json);
        }

        /*let data;
        const json = helpers.storage('road_network');

        if (json == null) {
            const resp = await fetch(`${config.host.replace('www', 'apps')}oreroads/v${version}/mileposts.geojson`);

            if (resp.ok) {
                const ret = await resp.json();
                helpers.storage('road_network', JSON.stringify(ret));

                data = json;
            }
        } else {
            data = JSON.parse(json);
        }*/
    }

    async doLayers() {
        await this.getRoads();
        this.loadAllData();
        this.getWWAs();
        this.getTraffic();

        helpers.hideLoading();
    }

    findRoad(roadName) {
        const index = global.roads.features.findIndex(
            road => road.properties?.name?.toLowerCase() === roadName
        );

        return index !== -1 ? index : null;
    }

    defaultLayer(name) {
        const layer = JSON.parse(helpers.storage('layers'))
            .filter(f => f.layer == name);

        return !layer[0] || !layer[0]?.show ? 'none' : 'visible';
    }

    async getRoads() {
        const fc = 'https://api.mapbox.com/datasets/v1/mapollc/clofxe8el0lxy2arnbd8ltiz4/features?access_token=' + config.mapboxToken;
        const json = await this.getCachedData('road_network', fc, 43830);

        if (json) {
            global.roads = json;
            this.displayRoads(json);
        }
    }

    async loadAllData() {
        const processRW = (data) => {
            if (!data) {
                console.error('There was an error getting current road conditions.');
            } else if (data.rw == null) {
                console.info('Road and weather conditions are unavailable.');
            } else {
                data.rw.forEach(feature => {
                    const pos = this.findRoad(feature.name.toLowerCase());

                    global.globalData.roadReports.push(feature);
                    if (pos != null) global.roads.features[pos].properties = feature;
                });

                global.map.getSource('roads').setData(global.roads);

                console.info(data.rw.length + ' road & weather sections reporting');
            }
        };

        try {
            const [rw, rwis, incidents, cameras, plows, dms, roadWork] = await Promise.allSettled([
                this.getCachedData('rw', `roads${this.DEBUG ? '?test=1' : ''}`, 15),
                this.getCachedData('rwis', `roads/rwis${this.DEBUG ? '?test=1' : ''}`, 10),
                this.getCachedData('incidents', `roads/incidents${this.DEBUG ? '?test=1' : ''}`, 10),
                this.getCachedData('cameras', `webcams?network=ODOT`, 60),
                this.getCachedData('plows', `roads/plows${this.DEBUG ? '?test=1' : ''}`, 15),
                this.getCachedData('dms', `roads/dms${this.DEBUG ? '?test=1' : ''}`, 10),
                this.getCachedData('construction', `roads/incidents/construction${this.DEBUG ? '?test=1' : ''}`, 30)
            ]);

            if (rw.status === 'fulfilled' && rw.value) {
                processRW(rw.value);
                config.dataStatus.rwRetrieved = true;
            }

            if (rwis.status === 'fulfilled' && rwis.value) {
                this.displayRWIS(rwis.value);
                config.dataStatus.rwisRetrieved = true;
            }

            if (incidents.status === 'fulfilled' && incidents.value) {
                this.displayIncidents(incidents.value);
                config.dataStatus.incidentsRetrieved = true;
            }

            if (cameras.status === 'fulfilled' && cameras.value) {
                this.displayWebcams(cameras.value);
                config.dataStatus.webcamsRetrieved = true;
            }

            if (plows.status === 'fulfilled' && plows.value) {
                this.displayPlows(plows.value);
                config.dataStatus.plowsRetrieved = true;
            }

            if (dms.status === 'fulfilled' && dms.value) {
                this.displayDMS(dms.value);
                config.dataStatus.dmsRetrieved = true;
            }

            if (roadWork.status === 'fulfilled' && roadWork.value) {
                this.displayConstruction(roadWork.value);
                config.dataStatus.roadWorkRetrieved = true;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async getWWAs() {
        const json = await helpers.api(ENV.apiURL + 'wwas/oreroads');

        if (json && json.wwas != null && json.wwas.length > 0) {
            global.nwsAlerts = json.wwas;
        }
    }

    displayRoads(json) {
        const defColor = '#bdbdbd',
            roadColor = ["case",
                ["all", ["has", "road"], ["==", ["typeof", ["get", "road"]], "object"]],
                ["case",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 1], "#000",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 2], "#2196f3",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 3], "#ff9800",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 4], "#827717",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 5], "#7e57c2",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 6], "#d32f2f",
                    defColor
                ],
                defColor
            ];

        if (json) {
            // loop through features to add names to an array
            json.features.forEach((f) => {
                global.roadsArray.push(f);
                global.roadsIDArray.push(f.properties.id);
            });

            if (!global.map.getSource('roads')) {
                global.map.addSource('roads', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!global.map.getLayer('roads_path')) {
                global.map.addLayer({
                    id: 'roads_path',
                    type: 'line',
                    source: 'roads',
                    paint: {
                        'line-color': roadColor,
                        'line-width': [
                            "step",
                            ["zoom"],
                            6,
                            17,
                            10,
                            18.5,
                            15
                        ]
                    },
                    filter: ['==', '$type', 'LineString'],
                    layout: {
                        visibility: this.defaultLayer('roads')
                    }
                });

                global.map.on('mouseenter', 'roads_path', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'roads_path', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });

                global.map.addLayer({
                    id: 'roads_point',
                    type: 'circle',
                    source: 'roads',
                    paint: {
                        'circle-color': roadColor,
                        'circle-radius': [
                            "interpolate",
                            ["exponential", 1],
                            ["zoom"],
                            7,
                            8,
                            13,
                            15
                        ]
                    },
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        visibility: this.defaultLayer('roads')
                    }
                });

                global.map.on('mouseenter', 'roads_point', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'roads_point', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });

                global.map.addLayer({
                    id: 'roads_text',
                    type: 'symbol',
                    source: 'roads',
                    minzoom: 13,
                    paint: {
                        'text-color': '#fff',
                        'text-opacity': {
                            stops: [[13, 0], [14, 1]]
                        },
                        'text-halo-color': '#333',
                        'text-halo-width': 1,
                        'text-halo-blur': 2
                    },
                    filter: ['!=', '$type', 'Point'],
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 400,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'name'],
                        'text-justify': 'center',
                        'text-size': 14,
                        'text-allow-overlap': false,
                        visibility: this.defaultLayer('roads')
                    }
                });

                global.map.addLayer({
                    id: 'roads_point_text',
                    type: 'symbol',
                    source: 'roads',
                    minzoom: 12,
                    paint: {
                        'text-color': '#666',
                        'text-halo-color': '#fff',
                        'text-halo-width': 1,
                        'text-halo-blur': 2
                    },
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'symbol-placement': 'point',
                        'symbol-spacing': 400,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'name'],
                        'text-justify': 'center',
                        'text-size': 14,
                        'text-max-width': 4,
                        'text-offset': ['literal', [0, 2.25]],
                        'text-allow-overlap': true,
                        visibility: this.defaultLayer('roads')
                    }
                });
            }
        }
    }

    displayWebcams(json) {
        const groupedFeatures = new Map();

        json?.features?.forEach(feature => {
            const key = JSON.stringify(feature.geometry.coordinates);

            if (!groupedFeatures.has(key)) {
                groupedFeatures.set(key, {
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: {
                        cameras: []
                    }
                });
            }
            groupedFeatures.get(key).properties.cameras.push(feature.properties);
        });

        json = JSON.parse(`{"type":"FeatureCollection","features":${JSON.stringify(Array.from(groupedFeatures.values()))}}`);
        global.globalData.webcams = json.features;

        const addCams = () => {
            if (!global.map.getSource('webcams')) {
                global.map.addSource('webcams', {
                    type: 'geojson',
                    data: json,
                    cluster: true,
                    clusterMaxZoom: this.cluster.maxZoom,
                    clusterMinPoints: this.cluster.minPoints,
                    clusterRadius: this.cluster.radius
                });
            }

            if (!global.map.getLayer('webcams')) {
                global.map.addLayer({
                    id: 'webcams',
                    type: 'symbol',
                    source: 'webcams',
                    filter: ['!', ['has', 'point_count']],
                    paint: {},
                    layout: {
                        'icon-image': 'cam',
                        'icon-size': 0.5,
                        'icon-allow-overlap': true,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('webcams')
                    }
                });

                global.map.on('mouseenter', 'webcams', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'webcams', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!global.map.getLayer('webcams_cluster')) {
                global.map.addLayer({
                    id: 'webcams_cluster',
                    type: 'circle',
                    source: 'webcams',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': '#944f9f',
                        'circle-radius': 12,
                        'circle-stroke-color': '#0a0a0a',
                        'circle-stroke-width': 5,
                        'circle-stroke-opacity': 0.1
                    },
                    layout: {
                        visibility: this.defaultLayer('webcams')
                    }
                });

                global.map.on('mouseenter', 'webcams_cluster', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'webcams_cluster', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!global.map.getLayer('webcams_count')) {
                global.map.addLayer({
                    id: 'webcams_count',
                    type: 'symbol',
                    source: 'webcams',
                    filter: ['has', 'point_count'],
                    paint: {
                        'text-color': '#fff'
                    },
                    layout: {
                        'text-field': ['get', 'point_count_abbreviated'],
                        'text-font': ['DIN Pro Medium'],
                        'text-anchor': 'center',
                        'text-justify': 'center',
                        /*'text-offset': [1.2, 0],*/
                        'text-allow-overlap': true,
                        'text-size': 14,
                        visibility: this.defaultLayer('webcams')
                    }
                });

                global.map.on('mouseenter', 'webcams_count', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'webcams_count', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' webcams located');
        };

        Promise.all([
            this.loadImage('cam', `${ENV.host}${config.imgPath}camera_icon.png`),
            this.loadImage('cluster_cam', `${ENV.host}${config.imgPath}camera_cluster_icon.png`)
        ]).then(() => {
            console.log('yes');
            addCams();
        }).catch(err => {
            console.error('Image load error:', err);
        });
    }

    displayRWIS(json) {
        /* add webcams to an array */
        json.features.forEach((stn) => {
            global.globalData.rwis.push(stn);
        });

        if (!global.map.getSource('rwis')) {
            global.map.addSource('rwis', {
                type: 'geojson',
                data: json,
                cluster: true,
                clusterMaxZoom: this.cluster.maxZoom,
                clusterMinPoints: this.cluster.minPoints,
                clusterRadius: this.cluster.radius
            });
        }

        if (!global.map.getLayer('rwis')) {
            global.map.addLayer({
                id: 'rwis',
                type: 'circle',
                source: 'rwis',
                paint: {
                    'circle-color': [
                        'case',
                        ['has', 'point_count'],
                        '#04564f',
                        '#009688'
                    ],
                    'circle-radius': 14,
                    'circle-stroke-color': '#0a0a0a',
                    'circle-stroke-width': [
                        'case',
                        ['has', 'point_count'],
                        5,
                        1
                    ],
                    'circle-stroke-opacity': 0.1,
                    'circle-translate': [-24, -12]
                },
                layout: {
                    visibility: this.defaultLayer('rwis')
                }
            });

            global.map.on('mouseenter', 'rwis', () => {
                global.map.getCanvas().style.cursor = 'pointer';
            });

            global.map.on('mouseleave', 'rwis', () => {
                global.map.getCanvas().style.cursor = 'auto';
            });
        }


        if (!global.map.getLayer('rwis_text')) {
            global.map.addLayer({
                id: 'rwis_text',
                type: 'symbol',
                source: 'rwis',
                paint: {
                    'text-color': '#fff'
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': [
                        'case',
                        [
                            'all',
                            ['has', 'weather'],
                            ["==", ["typeof", ["get", "weather"]], "object"]
                        ],
                        [
                            'concat',
                            ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], '°'
                        ],
                        ''
                    ],
                    'text-justify': 'center',
                    'text-size': [
                        'case',
                        [
                            'all',
                            ['has', 'weather'],
                            ["==", ["typeof", ["get", "weather"]], "object"],
                            ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99]
                        ],
                        12,
                        14
                    ],
                    'text-offset': [
                        'case',
                        [
                            'all',
                            ['has', 'weather'],
                            ["==", ["typeof", ["get", "weather"]], "object"],
                            ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99]
                        ],
                        ['literal', [-1.98, -1.0]],
                        ['literal', [-1.7, -0.85]]
                    ],
                    'text-allow-overlap': true,
                    visibility: this.defaultLayer('rwis')
                }
            });

            global.map.on('mouseenter', 'rwis_text', () => {
                global.map.getCanvas().style.cursor = 'pointer';
            });

            global.map.on('mouseleave', 'rwis_text', () => {
                global.map.getCanvas().style.cursor = 'auto';
            });
        }

        if (!global.map.getLayer('rwis_count')) {
            global.map.addLayer({
                id: 'rwis_count',
                type: 'symbol',
                source: 'rwis',
                filter: ['has', 'point_count'],
                paint: {
                    'text-color': '#fff'
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-justify': 'center',
                    'text-size': 14,
                    'text-offset': ['literal', [-1.7, -0.85]],
                    'text-allow-overlap': true,
                    visibility: this.defaultLayer('rwis')
                }
            });

            global.map.on('mouseenter', 'rwis_count', () => {
                global.map.getCanvas().style.cursor = 'pointer';
            });

            global.map.on('mouseleave', 'rwis_count', () => {
                global.map.getCanvas().style.cursor = 'auto';
            });
        }

        console.info(json.features.length + ' RWIS stations reporting');
    }

    loadImage(name, url) {
        return new Promise((resolve, reject) => {
            if (global.map.hasImage(name)) {
                resolve();
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

            fetch(url, { signal: controller.signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.blob();
                })
                .then(blob => {
                    const img = new Image();
                    img.src = URL.createObjectURL(blob);
                    img.onload = () => {
                        URL.revokeObjectURL(img.src);
                        if (!global.map.hasImage(name)) {
                            global.map.addImage(name, img);
                        }
                        resolve();
                    };
                    img.onerror = (err) => reject(new Error(`Failed to decode image: ${url}`));
                })
                .catch(err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }

    displayIncidents(json) {
        const incImgs = ['', '_crash', '_closure', '_vehicle', '_ramp_gate', '_obstruction'];

        const finish = () => {
            /* if the incident is a linestring, we need to add icons for the start and end milepost */
            json.features.forEach((feature) => {
                global.globalData.incidents.push(feature);

                if (feature.geometry.type != 'Point') {
                    const start = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: feature.geometry.coordinates[0]
                        },
                        properties: feature.properties
                    }, end = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: feature.geometry.coordinates[feature.geometry.coordinates.length - 1]
                        },
                        properties: feature.properties
                    };

                    json.features.push(start);
                    json.features.push(end);
                }
            });

            if (!global.map.getSource('incidents')) {
                global.map.addSource('incidents', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!global.map.getLayer('incidents_point')) {
                global.map.addLayer({
                    id: 'incidents_point',
                    type: 'symbol',
                    source: 'incidents',
                    filter: ['==', '$type', 'Point'],
                    paint: {
                        'icon-halo-color': '#333',
                        'icon-halo-width': 5,
                        'icon-halo-blur': 1
                    },
                    layout: {
                        'icon-image': [
                            'case',
                            ['==', ['get', 'type'], 'Crash'], 'incident_crash',
                            ['==', ['get', 'type'], 'Closure'], 'incident_closure',
                            ['==', ['get', 'type'], 'Disabled Vehicle - Hazard'], 'incident_vehicle',
                            ['==', ['get', 'type'], 'Ramp Gate Activation'], 'incident_ramp_gate',
                            ['==', ['get', 'category'], 'Obstruction'], 'incident_obstruction',
                            'incident'
                        ],
                        'icon-size': 0.45,
                        'icon-allow-overlap': true,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('incidents')
                    }
                });

                global.map.on('mouseenter', 'incidents_point', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'incidents_point', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!global.map.getLayer('incidents_line_bg')) {
                global.map.addLayer({
                    id: 'incidents_line_bg',
                    type: 'line',
                    source: 'incidents',
                    filter: ['!=', '$type', 'Point'],
                    paint: {
                        'line-width': 5,
                        'line-color': '#555'
                    },
                    layout: {
                        visibility: this.defaultLayer('incidents')
                    }
                }, 'incidents_point');

                global.map.on('mouseenter', 'incidents_line_bg', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'incidents_line_bg', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!global.map.getLayer('incidents_line')) {
                global.map.addLayer({
                    id: 'incidents_line',
                    type: 'line',
                    source: 'incidents',
                    filter: ['!=', '$type', 'Point'],
                    paint: {
                        'line-width': 5,
                        'line-color': '#ff4a4a',
                        'line-dasharray': [3, 3]
                    },
                    layout: {
                        visibility: this.defaultLayer('incidents')
                    }
                }, 'incidents_point');

                global.map.on('mouseenter', 'incidents_line', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'incidents_line', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!global.map.getLayer('incidents_text')) {
                global.map.addLayer({
                    id: 'incidents_text',
                    type: 'symbol',
                    source: 'incidents',
                    minzoom: 8.5,
                    paint: {
                        'text-color': '#333',
                        'text-opacity': {
                            stops: [[8.4, 0], [8.5, 1]]
                        },
                        'text-halo-color': '#fff',
                        'text-halo-width': 1,
                        'text-halo-blur': 1
                    },
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'symbol-placement': 'point',
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'type'],
                        'text-max-width': 8,
                        'text-justify': 'center',
                        'text-anchor': 'top',
                        'text-offset': ['literal', [0, 1.05]],
                        'text-size': 11,
                        'text-allow-overlap': false,
                        visibility: this.defaultLayer('incidents')
                    }
                });
            }

            console.info(json.features.length + ' incidents reported by ODOT TOCs');
        };

        Promise.all(
            incImgs.map(n => this.loadImage(`incident${n}`, `${ENV.host}${config.imgPath}incident${n}.png`))
        ).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading incident images:', err);
        });
    }

    displayConstruction(json) {
        const finish = () => {
            global.globalData.roadWork = json;

            if (!global.map.getSource('roadWork')) {
                global.map.addSource('roadWork', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!global.map.getLayer('roadWork_point')) {
                global.map.addLayer({
                    id: 'roadWork_point',
                    type: 'symbol',
                    source: 'roadWork',
                    paint: {},
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'icon-image': 'construction',
                        'icon-size': 0.65,
                        'icon-allow-overlap': false,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('construction')
                    }
                });

                global.map.on('mouseenter', 'roadWork_point', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'roadWork_point', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' road work & maintenance events reported by ODOT TOCs');
        };

        Promise.all([
            this.loadImage('construction', `${ENV.host}${config.imgPath}roadwork_icon.png`)
        ]).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading image:', err);
        });
    }

    displayDMS(json) {
        const finish = () => {
            global.globalData.varMsgSigns = json;

            if (!global.map.getSource('dms')) {
                global.map.addSource('dms', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!global.map.getLayer('dms')) {
                global.map.addLayer({
                    id: 'dms',
                    type: 'symbol',
                    source: 'dms',
                    paint: {},
                    layout: {
                        'icon-image': 'dms',
                        'icon-size': 0.65,
                        'icon-allow-overlap': false,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('vms')
                    }
                });

                global.map.on('mouseenter', 'dms', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'dms', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' active variable message signs');
        };

        Promise.all([
            this.loadImage('dms', `${ENV.host}${config.imgPath}dms_icon.png`)
        ]).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading image:', err);
        });
    }

    displayPlows(json) {
        const finish = () => {
            global.globalData.snowPlows = json;

            if (!global.map.getSource('plows')) {
                global.map.addSource('plows', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!global.map.getLayer('plows')) {
                global.map.addLayer({
                    id: 'plows',
                    type: 'symbol',
                    source: 'plows',
                    paint: {},
                    layout: {
                        'icon-image': 'plow',
                        'icon-size': 0.2,
                        'icon-allow-overlap': true,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('plows')
                    }
                });

                global.map.on('mouseenter', 'plows', () => {
                    global.map.getCanvas().style.cursor = 'pointer';
                });

                global.map.on('mouseleave', 'plows', () => {
                    global.map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' recently seen snow plows');
        };

        Promise.all([
            this.loadImage('plow', `${ENV.host}${config.imgPath}snow_plow_icon.png`)
        ]).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading image:', err);
        });
    }

    getTraffic() {
        if (!global.map.getSource('traffic')) {
            global.map.addSource('traffic', {
                type: 'raster',
                tiles: [
                    'https://api.mapbox.com/styles/v1/mapollc/cloq47dre005e01r6gnn92v3h/tiles/256/{z}/{x}/{y}@2x?access_token=' + config.mapboxToken
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('traffic')) {
            global.map.addLayer({
                id: 'traffic',
                type: 'raster',
                source: 'traffic',
                paint: {},
                layout: {
                    visibility: this.defaultLayer('traffic')
                }
            });
        }
    }
}