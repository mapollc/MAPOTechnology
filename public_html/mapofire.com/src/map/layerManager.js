import { ENV, config } from "../app/config.js";
import { global, updateHrrrSmokeTime } from "../app/state.js";

import { api, mapMouseOver, gmtime, getbbox } from "../utils/helpers.js";
import { ClickListener } from '../utils/listeners.js';

import { getContourLibrary } from './layers.js';

import { ArcGISFeature } from './arcgis.js';
import { DateFormatter } from '../utils/constants.js';

import { sfpTimes } from "../data/index.js";
import { Evacuations } from "../data/evacuations.js";

import { notify } from '../ui/components.js';

export class Layers {
    constructor() {
        this.spcClimoDate = Date.now();
        this.loadedPositions = new Set();
        this.animationPosition = 0;
    }

    init() {
        // add lightning layers to the map if they permissions
        if (config.settings?.hasPermissions(config.PERMISSION_LEVELS.PREMIUM)) {
            this.lightning();
        }

        // get evacuations
        global.inits.evacuations = new Evacuations();
    }

    async addTerrain() {
        if (config.settings?.hasPermissions(config.PERMISSION_LEVELS.PRO)) {
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
    }

    async airQuality() {
        const data = await api('https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/Air%20Now%20Current%20Monitor%20Data%20Public/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'ObjectId,AQSID,SiteName,ValidTime,LocalTimeString,PM25_AQI,PM25,ReportingArea_PipeDelimited,StateName'],
            ['returnGeometry', 'true'],
            ['geometryPrecision', 4],
            ['returnExceededLimitFeatures', 'true'],
            ['f', 'geojson']
        ]);

        global.dataView.airQualityStns = data;

        if (!data.error) {
            if (!global.map.getSource('airq')) {
                global.map.addSource('airq', {
                    type: 'geojson',
                    data: data,
                    cluster: true,
                    clusterMaxZoom: 7,
                    clusterMinPoints: 5,
                    clusterRadius: 40
                });
            }

            if (!global.map.getLayer('airQuality')) {
                global.map.addLayer({
                    id: 'airQuality',
                    type: 'circle',
                    source: 'airq',
                    filter: [
                        'all',
                        ['has', 'PM25_AQI'],
                        ['==', ['typeof', ['get', 'PM25_AQI']], 'number']
                    ],
                    layout: {
                        visibility: config.settings.isEnabled('airq') ? 'visible' : 'none'
                    },
                    paint: {
                        'circle-radius': 12,
                        'circle-color': [
                            'step',
                            ['coalesce', ['get', 'PM25_AQI'], -1], // Fallback to -1 if null
                            '#d9d9d9', // Default for anything below 0
                            0, '#00e400', // 0-50 (Good)
                            51, '#ffff00', // 51-100 (Moderate)
                            101, '#ff7e00', // 101-150 (Unhealthy SG)
                            151, '#ff0000', // 151-200 (Unhealthy)
                            201, '#8f3f97', // 201-300 (Very Unhealthy)
                            301, '#7e0023'  // 301+ (Hazardous)
                        ],
                        'circle-stroke-color': 'black',
                        'circle-stroke-width': 1
                    }
                });

                mapMouseOver('airQuality');
            }

            if (!global.map.getLayer('airQuality_text')) {
                global.map.addLayer({
                    id: 'airQuality_text',
                    type: 'symbol',
                    source: 'airq',
                    filter: [
                        'all',
                        ['has', 'PM25_AQI'],
                        ['==', ['typeof', ['get', 'PM25_AQI']], 'number']
                    ],
                    paint: {
                        'text-color': [
                            'case',
                            ['>=', ['number', ['get', 'PM25_AQI'], 0], 150],
                            '#fff',
                            '#000'
                        ]
                    },
                    layout: {
                        'text-ignore-placement': true,
                        'text-allow-overlap': true,
                        'text-font': config.fonts.din(),
                        'text-field': ['to-string', ['number', ['get', 'PM25_AQI'], 0]],
                        'text-size': 11,
                        'text-justify': 'center',
                        visibility: config.settings.isEnabled('airq') ? 'visible' : 'none'
                    }
                });
            }
        }
    }

    async lightning() {
        /*const ltime = () => {
            const now = new Date(),
                mins = now.getUTCMinutes(),
                roundedMins = mins < 30 ? 0 : 30;

            now.setUTCMinutes(roundedMins, 0, 0);

            return now.toISOString();
        };*/

        if (!global.map.getSource('lightning1')) {
            global.map.addSource('lightning1', {
                type: 'raster',
                maxzoom: 15,
                tiles: [
                    //ENV.host + 'api/v1/lightning?key=' + config.apiKey() + '&x={x}&y={y}&z={z}&t=5'
                    //'https://tiles.lightningmaps.org/?x={x}&y={y}&z={z}&s=256&t=5'
                    'https://www.firewxavy.org/apis/lightning/5/{z}/{x}/{y}'
                    //'https://nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows?request=GetMap&service=WMS&layers=ldn_lightning_strike_density&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=256&height=256&time=' + ltime() + '&crs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getSource('lightning24')) {
            global.map.addSource('lightning24', {
                type: 'raster',
                maxzoom: 15,
                tiles: [
                    //ENV.host + 'api/v1/lightning?key=' + config.apiKey() + '&x={x}&y={y}&z={z}&t=6'
                    //'https://tiles.lightningmaps.org/?x={x}&y={y}&z={z}&s=256&t=6'
                    'https://www.firewxavy.org/apis/lightning/6/{z}/{x}/{y}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('lightning1')) {
            global.map.addLayer({
                id: 'lightning1',
                type: 'raster',
                source: 'lightning1',
                layout: {
                    visibility: config.settings.isEnabled('lightning1') || !config.settings.checkboxes() ? 'visible' : 'none'
                }
            });
        }

        if (!global.map.getLayer('lightning24')) {
            global.map.addLayer({
                id: 'lightning24',
                type: 'raster',
                source: 'lightning24',
                layout: {
                    visibility: config.settings.isEnabled('lightning24') || !config.settings.checkboxes() ? 'visible' : 'none'
                }
            });
        }
    }

    async radarInit() {
        const imgs = await api('https://api.rainviewer.com/public/weather-maps.json');
        if (!imgs) return;

        global.radar.mapFrames = imgs.radar.past;

        let formatTime = (n) => {
            return Intl.DateTimeFormat('en-US', {
                hour: 'numeric'
            }).format(global.radar.mapFrames[n].time * 1000).replace(' ', '').toLowerCase();
        };

        // build radar control once
        if (!document.querySelector('.radar')) {
            const len = global.radar.mapFrames.length,
                mid = Math.floor(len / 2),
                ticks = Array.from({ length: len }, (_, i) => {
                    const isMajor = i === 0 || i === mid || i === len - 1;

                    return `<div class="tick${isMajor ? '' : ' short'}" style="left:calc(${i} * (100% / ${len}))"></div>`;
                }).join('');

            const rl = `<div class="radar">
                <div>
                    <span class="radarControl fas fa-play ttip" data-tooltip="Start radar" data-action="radar-control"></span>
                    <div class="time">
                        <input type="range" step="1" min="0" max="${global.radar.mapFrames.length - 1}" value="${global.radar.mapFrames.length - 1}">
                        <div class="tr" style="align-items:center;height:8px">
                            ${ticks}
                        </div>
                        <div class="tr">
                            <span>${formatTime(0)}</span>
                            <span>${formatTime(Math.floor(global.radar.mapFrames.length / 2))}</span>
                            <span>${formatTime(global.radar.mapFrames.length - 1)}</span>
                        </div>
                    </div>
                </div>
            </div>`;

            document.body.insertAdjacentHTML('beforeend', rl);
        }

        this.showRadarFrame(global.radar.mapFrames.length - 1);
    }

    async showRadarFrame(position) {
        if (global.radar.isLoading) return;
        const cl = new ClickListener();

        const len = global.radar.mapFrames.length;

        position = (position + len) % len;

        const isLast = position === len - 1;
        const DELAY_MS = config.ANIMATION_DELAY_MS * (isLast ? 2 : 1);

        const frame = global.radar.mapFrames[position];
        const newSourceId = `radar-${position}`;
        const newLayerId = `radar-layer-${position}`;
        const oldLayerId = global.radar.currentLayerId;

        const setActiveLayer = () => {
            if (oldLayerId && oldLayerId !== newLayerId && global.map.getLayer(oldLayerId)) {
                global.map.setPaintProperty(oldLayerId, 'raster-opacity', 0);
            }

            global.map.setPaintProperty(newLayerId, 'raster-opacity', config.RADAR_OPACITY);

            global.radar.currentLayerId = newLayerId;
            global.radar.animationPosition = position;

            if (global.radar.animationTimer) global.radar.animationTimer = setTimeout(() => cl.radarPlay(), DELAY_MS);
        };

        if (global.radar.loadedPositions.has(position)) {
            setActiveLayer();
            return;
        }

        global.radar.isLoading = true;

        global.map.addSource(newSourceId, {
            type: 'raster',
            tiles: [`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/4/0_1.png`],
            tileSize: 256,
            maxzoom: 7
        });

        global.map.addLayer({
            id: newLayerId,
            type: 'raster',
            source: newSourceId,
            paint: {
                'raster-opacity': 0.001,
                'raster-opacity-transition': { duration: 0, delay: 0 },
                'raster-fade-duration': 0
            }
        });

        global.radar.currentLayerId = newLayerId;

        const onSourceData = (e) => {
            if (e.sourceId !== newSourceId || !global.map.isSourceLoaded(newSourceId)) return;

            global.map.off('sourcedata', onSourceData);
            global.map.once('idle', function () {
                setActiveLayer();

                global.radar.loadedPositions.add(position);
                global.radar.animationPosition = position;
                global.radar.isLoading = false;
            });
        };

        global.map.on('sourcedata', onSourceData);
    }

    async modis(w, update = false) {
        const url = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query',
            n = w == 1 ? '24' : (w == 2 ? '48' : '72'),
            modisID = `modis${n}`;

        const ts = (d) => {
            const dt = new Date(Date.now() - d * 86400000),
                pad = (n) => n.toString().padStart(2, '0');
            return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        };

        const start = ts(w),
            end = w > 1 ? ts(w - 1) : null;

        if (global.map.getZoom() >= config.modisZoomLevel) {
            const data = await api(url, [
                ['where', `acq_time >= DATE '${start}:00'${end ? ` AND acq_time < DATE '${end}:00'` : ''}`],
                ['outFields', '*'],
                ['geometry', getbbox()],
                ['geometryPrecision', 6],
                ['geometryType', 'esriGeometryEnvelope'],
                ['spatialRel', 'esriSpatialRelIntersects'],
                ['returnGeometry', true],
                ['f', 'geojson']
            ]);

            if (update && data) {
                if (global.map.getSource(modisID)) global.map.getSource(modisID).setData(data);
            } else {
                if (!global.map.getSource(modisID)) {
                    global.map.addSource(modisID, {
                        type: 'geojson',
                        data: data,
                        cluster: true,
                        clusterMaxZoom: window.innerWidth < 600 || window.outerWidth < 600 ? 8 : 9,
                        clusterMinPoints: 4,
                        clusterRadius: 20
                    });
                }

                if (!global.map.getLayer(modisID)) {
                    global.map.addLayer({
                        id: modisID,
                        type: 'symbol',
                        source: modisID,
                        layout: {
                            'icon-image': `modis${w}`,
                            'icon-size': 0.6,
                            'icon-allow-overlap': true
                        },
                        paint: {
                            'icon-opacity': [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                0,
                                0.5,
                                10,
                                0.5,
                                13.5,
                                1
                            ]
                        }
                    });

                    //mapMouseOver(modisID);
                }
            }
        } else {
            notify('info', 'You must be zoomed in more to see hotspots.');
        }
    }

    async pnwVulnerability() {
        const data = await api('https://services1.arcgis.com/gGHDlz6USftL5Pau/ArcGIS/rest/services/PNW_community_vulnerability_ranks_only/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'FID,City,State,Overall_Vu'],
            ['returnGeometry', true],
            ['resultType', 'tile'],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['f', 'geojson']
        ]);

        if (data && data.features.length > 0) {
            if (!global.map.getSource('ev')) {
                global.map.addSource('ev', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!global.map.getLayer('ev')) {
                global.map.addLayer({
                    id: 'ev',
                    type: 'circle',
                    source: 'ev',
                    minzoom: 6.5,
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            6,
                            8,
                            15,
                            15
                        ],
                        'circle-color': [
                            'case',
                            ['<=', ['to-number', ['get', 'Overall_Vu']], 174],
                            '#690207',
                            [
                                'all',
                                ['>', ['to-number', ['get', 'Overall_Vu']], 174],
                                ['<=', ['to-number', ['get', 'Overall_Vu']], 348],
                            ],
                            '#f6800b',
                            [
                                'all',
                                ['>', ['to-number', ['get', 'Overall_Vu']], 348],
                                ['<=', ['to-number', ['get', 'Overall_Vu']], 522],
                            ],
                            '#fef36d',
                            '#a7dc83'
                        ],
                        'circle-opacity': 0.9,
                        'circle-stroke-color': '#555',
                        'circle-stroke-width': 1,
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });

                mapMouseOver('ev');
            }
        }
    }

    async erc(update = false, toggle = false) {
        const sel = document.querySelector('#erc_time'),
            dy = sel ? sel.options[sel.selectedIndex].value : config.settings.special().erc(),
            obs = [
                'case',
                ['<', ['to-number', ['get', 'avg_erc_percentile']], 60],
                'rgb(56, 168, 0)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_percentile']], 60],
                    ['<', ['to-number', ['get', 'avg_erc_percentile']], 80]
                ],
                'rgb(209, 255, 115)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_percentile']], 80],
                    ['<', ['to-number', ['get', 'avg_erc_percentile']], 90]
                ],
                'rgb(255, 255, 190)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_percentile']], 90],
                    ['<', ['to-number', ['get', 'avg_erc_percentile']], 97]
                ],
                'rgb(255, 170, 0)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_percentile']], 97],
                    ['<', ['to-number', ['get', 'avg_erc_percentile']], 100]
                ],
                'rgb(255, 0, 0)',
                ['>=', ['to-number', ['get', 'avg_erc_percentile']], 100],
                'rgb(168, 0, 0)',
                '#e1e1e1'
            ],
            fcst = [
                'case',
                ['<', ['to-number', ['get', 'avg_erc_fcast_percentile']], 60],
                'rgb(56, 168, 0)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_fcast_percentile']], 60],
                    ['<', ['to-number', ['get', 'avg_erc_fcast_percentile']], 80]
                ],
                'rgb(209, 255, 115)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_fcast_percentile']], 80],
                    ['<', ['to-number', ['get', 'avg_erc_fcast_percentile']], 90]
                ],
                'rgb(255, 255, 190)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_fcast_percentile']], 90],
                    ['<', ['to-number', ['get', 'avg_erc_fcast_percentile']], 97]
                ],
                'rgb(255, 170, 0)',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_erc_fcast_percentile']], 97],
                    ['<', ['to-number', ['get', 'avg_erc_fcast_percentile']], 100]
                ],
                'rgb(255, 0, 0)',
                ['>=', ['to-number', ['get', 'avg_erc_fcast_percentile']], 100],
                'rgb(168, 0, 0)',
                '#e1e1e1'
            ];

        if (toggle) {
            global.map.setPaintProperty('erc_fill', 'fill-color', dy == 'obs' ? obs : fcst);
        } else {
            ////https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/DRAFT_NFDRS_v3_view/FeatureServer/1/query
            const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/PSA_ERC_and_BI_Percentiles_and_Trends/FeatureServer/0/query', [
                ['where', '1=1'],
                ['outFields', 'OBJECTID,PSANAME,PSANationalCode,avg_erc,avg_erc_fcast_percentile,avg_erc_fcast_trend,avg_erc_percentile,avg_erc_trend,update_date,update_time,ERC_Chart_URL'],
                //['outFields', 'PSANationalCode'],
                ['returnGeometry', true],
                ['inSR', 4326],
                ['outSR', 4326],
                ['resultType', 'tile'],
                ['geometryPrecision', 6],
                ['geometryType', 'esriGeometryEnvelope'],
                ['spatialRel', 'esriSpatialRelIntersects'],
                ['geometry', getbbox()],
                ['f', 'geojson']
            ]);

            // add ID to features for mapbox
            data.features.forEach((f, n) => {
                data.features[n].id = f.properties.OBJECTID;
            });

            if (update) {
                global.map.getSource('erc').setData(data);
                global.map.setPaintProperty('erc_fill', 'fill-color', dy == 'obs' ? obs : fcst)
            } else {
                if (data && data.features.length > 0) {
                    if (!global.map.getSource('erc')) {
                        global.map.addSource('erc', {
                            type: 'geojson',
                            data: data
                        });
                    }

                    if (!global.map.getLayer('erc_fill')) {
                        global.map.addLayer({
                            id: 'erc_fill',
                            type: 'fill',
                            source: 'erc',
                            paint: {
                                'fill-color': dy == 'obs' ? obs : fcst,
                                'fill-opacity': 0.5
                            },
                            layout: {
                                visibility: 'visible'
                            }
                        });
                    }

                    if (!global.map.getLayer('erc_outline')) {
                        global.map.addLayer({
                            id: 'erc_outline',
                            type: 'line',
                            source: 'erc',
                            paint: {
                                'line-color': [
                                    'case',
                                    ['boolean', ['feature-state', 'click'], false],
                                    '#111',
                                    '#555'
                                ],
                                'line-width': [
                                    'case',
                                    ['boolean', ['feature-state', 'click'], false],
                                    3,
                                    1
                                ]
                            },
                            layout: {
                                visibility: 'visible'
                            }
                        });
                    }
                }
            }
        }
    }

    /*nfdrs() {
        if (!global.map.getSource('nfdrs')) {
            global.map.addSource('nfdrs', {
                'type': 'raster',
                'tiles': [
                    'https://fsapps.nwcg.gov/psp/arcgis/rest/services/npsg/Fire_Danger/MapServer/export?service=WMS&request=GetMap&layers=show:0&styles=&format=png32&transparent=true&version=1.1.1&id=National Fire Danger Rating System (NFDRS)&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&width=1477&height=482&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                'tileSize': 256
            });
        }
     
        if (!global.map.getLayer('nfdrs')) {
            global.map.addLayer({
                id: 'nfdrs',
                type: 'raster',
                source: 'nfdrs',
                paint: {
                    'raster-opacity': 0.7
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }*/

    sfp(update = false) {
        const ss = document.querySelector('#sfpDateSelect'),
            bkTime = ss ? ss.options[ss.selectedIndex].value : sfpTimes()[0].key,
            time = config.settings.special().sfpDate() && new Date(config.settings.special().sfpDate()) >= new Date() ? config.settings.special().sfpDate() : bkTime,
            url = `https://fsapps.nwcg.gov/psp/arcgis/services/npsg/current_forecast/MapServer/WMSServer?service=WMS&request=GetMap&layers=0&styles=&format=image%2Fpng&transparent=true&version=1.1.1&Index=1&height=512&width=512&TIME=${time}&srs=EPSG%3A3857&bbox={bbox-epsg-3857}`;

        if (update) {
            global.map.getSource('sfp').setTiles([
                url
            ]);
        } else {
            if (!global.map.getSource('sfp')) {
                global.map.addSource('sfp', {
                    type: 'raster',
                    tiles: [
                        url
                    ],
                    tileSize: 256
                });
            }

            if (!global.map.getLayer('sfp')) {
                global.map.addLayer({
                    id: 'sfp',
                    type: 'raster',
                    source: 'sfp',
                    paint: {
                        'raster-opacity': 0.5
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    async spcClimo(day = 0, update = false, absolute = false) {
        let dateObj = new Date(this.spcClimoDate);
        const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

        if (absolute) {
            let dayCounter = 0;
            for (let m = 0; m < 12; m++) {
                if (day < dayCounter + monthLengths[m]) {
                    dateObj.setMonth(m);
                    dateObj.setDate(day - dayCounter + 1);
                    break;
                }
                dayCounter += monthLengths[m];
            }
            this.spcClimoDate = dateObj.getTime();
        } else if (day !== 0) {
            this.spcClimoDate += day * 86400 * 1000;
            dateObj = new Date(this.spcClimoDate);
        }

        const dayOfYear = (d) => {
            let doy = 0;
            for (let i = 0; i < d.getMonth(); i++) doy += monthLengths[i];
            return doy + d.getDate() - 1;
        };

        const doy = dayOfYear(dateObj),
            control = document.querySelector('.spcTimeline');

        if (!control) {
            const options = () => {
                let ops = '';
                const start = new Date('1/1/2026').getTime();
                const now = new Date();

                for (let i = 0; i < 365; i++) {
                    const date = new Date(start + (86400 * 1000 * i)),
                        isToday = date.getMonth() == now.getMonth() && date.getDate() == now.getDate();

                    ops += `<option ${isToday ? 'selected ' : ''}value="${i}">${DateFormatter.LONG_MONTHS[date.getMonth()]} ${date.getDate()}</option>`;
                }
                return ops;
            };

            const el = document.createElement('div');
            el.classList.add('spcTimeline');
            el.style.maxWidth = '225px';
            el.innerHTML = `
                <div style="justify-content:space-evenly">
                    <span id="tlb" data-action="spc-climo" data-dir="back" class="fas fa-backward-step tlcontrol disabled"></span>
                    <select id="spcDates" data-action="spcDates">${options()}</select>
                    <span id="tlf" data-action="spc-climo" data-dir="next" class="fas fa-forward-step tlcontrol"></span>
                </div>`;
            document.querySelector('.app-wrapper').appendChild(el);
        } else {
            const select = control.querySelector('#spcDates');
            select.selectedIndex = day;

            control.querySelector('#tlb').dataset.date = doy - 1;
            control.querySelector('#tlf').dataset.date = doy + 1;

            control.querySelector('#tlb').classList.toggle('disabled', doy === 0);
            control.querySelector('#tlf').classList.toggle('disabled', doy === 364);
        }

        // Fetch geojson using day of year
        const name = 'spc_climo',
            geojson = await api(`${ENV.host}api/v1/climo`, [['day', doy]]);

        if (update) {
            global.map.getSource(name).setData(geojson);
        } else {
            if (!global.map.getSource(name)) {
                global.map.addSource(name, {
                    type: 'geojson',
                    data: geojson
                });
            }

            if (!global.map.getLayer(`${name}_outline`)) {
                global.map.addLayer({
                    id: `${name}_outline`,
                    type: 'line',
                    source: name,
                    paint: {
                        'line-color': ['get', 'fill'],
                        'line-width': 1,
                        'line-opacity': 0.75
                    },
                    layout: { visibility: 'visible' }
                });
            }

            if (!global.map.getLayer(`${name}_fill`)) {
                global.map.addLayer({
                    id: `${name}_fill`,
                    type: 'fill',
                    source: name,
                    paint: {
                        'fill-color': ['get', 'fill'],
                        'fill-opacity': 0.7
                    },
                    layout: { visibility: 'visible' }
                });
            }

            if (!global.map.getSource(`${name}_prob`)) {
                global.map.addLayer({
                    id: `${name}_prob`,
                    type: 'symbol',
                    source: name,
                    minzoom: 6.75,
                    paint: {
                        'text-color': '#333',
                        'text-halo-color': '#f9f9f9',
                        'text-halo-blur': 1,
                        'text-halo-width': 1
                    },
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 400,
                        'text-font': config.fonts.din(),
                        'text-field': ['concat', '>=100 acre probability: ', ['to-string', ['to-number', ['get', 'title']]], '%'],
                        'text-size': 13,
                        'text-max-angle': 30,
                        'text-padding': 5,
                        'text-pitch-alignment': 'viewport',
                        'text-rotation-alignment': 'map',
                        'text-offset': [0, 1]
                    }
                });
            }
        }
    }

    async nri(update = false) {
        const data = await api('https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Counties/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,NRI_ID,COUNTY,STATE,STATEABBRV,WFIR_RISKS,WFIR_RISKR,EAL_SPCTL,POPULATION,BUILDVALUE,AGRIVALUE,AREA'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['returnGeometry', true],
            ['f', 'geojson']]);

        if (update) {
            global.map.getSource('nri').setData(data);
        } else {
            if (!global.map.getSource('nri')) {
                global.map.addSource('nri', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!global.map.getLayer('nri_fill')) {
                global.map.addLayer({
                    id: 'nri_fill',
                    type: 'fill',
                    source: 'nri',
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['get', 'WFIR_RISKR'], 'No Rating'], '#fff',
                            ['==', ['get', 'WFIR_RISKR'], 'Very Low'], '#4d6dbd',
                            ['==', ['get', 'WFIR_RISKR'], 'Relatively Low'], '#509bc7',
                            ['==', ['get', 'WFIR_RISKR'], 'Relatively Moderate'], '#f0d55d',
                            ['==', ['get', 'WFIR_RISKR'], 'Relatively High'], '#e07069',
                            ['==', ['get', 'WFIR_RISKR'], 'Very High'], '#c7445d',
                            '#9e9e9e'
                        ],
                        'fill-opacity': 0.5
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }

            if (!global.map.getLayer('nri_outline')) {
                global.map.addLayer({
                    id: 'nri_outline',
                    type: 'line',
                    source: 'nri',
                    paint: {
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            '#111',
                            '#555'
                        ],
                        'line-width': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            3,
                            1
                        ]
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    async power(update = false) {
        const data = await api('https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/US_Electric_Power_Transmission_Lines/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'TYPE,OWNER,VOLTAGE,VOLT_CLASS'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['returnGeometry', true],
            ['f', 'geojson']]);

        if (update) {
            global.map.getSource('power').setData(data);
        } else {
            if (!global.map.getSource('power')) {
                global.map.addSource('power', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!global.map.getLayer('power')) {
                global.map.addLayer({
                    id: 'power',
                    type: 'line',
                    source: 'power',
                    minzoom: 6,
                    paint: {
                        //'line-color': '#9c27b0',
                        'line-color': [
                            'case',
                            ['>=', ['get', 'VOLTAGE'], 735], '#f789d8',
                            ['all', ['>=', ['get', 'VOLTAGE'], 500], ['<', ['get', 'VOLTAGE'], 735]], '#ffde3e',
                            ['all', ['>=', ['get', 'VOLTAGE'], 345], ['<', ['get', 'VOLTAGE'], 500]], '#fc921f',
                            ['all', ['>=', ['get', 'VOLTAGE'], 220], ['<', ['get', 'VOLTAGE'], 345]], '#9e559c',
                            ['all', ['>=', ['get', 'VOLTAGE'], 100], ['<', ['get', 'VOLTAGE'], 220]], '#ed5151',
                            ['<', ['get', 'VOLTAGE'], 100], '#149ece',
                            '#aeaeae'
                        ],
                        'line-width': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            6,
                            2,
                            16,
                            6
                        ]
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    rth() {
        if (!global.map.getSource('rth')) {
            global.map.addSource('rth', {
                type: 'raster',
                tiles: [
                    'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_RiskToPotentialStructures/ImageServer/exportImage?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Risk%20to%20Homes&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('rth')) {
            global.map.addLayer({
                id: 'rth',
                type: 'raster',
                source: 'rth',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    wet() {
        if (!global.map.getSource('wet')) {
            global.map.addSource('wet', {
                type: 'raster',
                tiles: [
                    'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_ExposureType/ImageServer/exportImage?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Risk%20to%20Homes&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('wet')) {
            global.map.addLayer({
                id: 'wet',
                type: 'raster',
                source: 'wet',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    bp() {
        if (!global.map.getSource('bp')) {
            global.map.addSource('bp', {
                type: 'raster',
                tiles: [
                    'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_BurnProbability/ImageServer/exportImage?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Risk%20to%20Homes&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('bp')) {
            global.map.addLayer({
                id: 'bp',
                type: 'raster',
                source: 'bp',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    whp() {
        if (!global.map.getSource('whp')) {
            global.map.addSource('whp', {
                type: 'raster',
                tiles: [
                    'https://imagery.geoplatform.gov/iipp/rest/services/Fire_Aviation/USFS_EDW_RMRS_WRC_WildfireHazardPotential/ImageServer/exportImage?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Hazard%20Potential%20(2018)&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('whp')) {
            global.map.addLayer({
                id: 'whp',
                type: 'raster',
                source: 'whp',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async drought() {
        const color = [
            'case',
            ['==', ['to-number', ['get', 'dm']], 0], '#ffff00',
            ['==', ['to-number', ['get', 'dm']], 1], '#ffcc99',
            ['==', ['to-number', ['get', 'dm']], 2], '#ff6600',
            ['==', ['to-number', ['get', 'dm']], 3], '#ff0000',
            ['==', ['to-number', ['get', 'dm']], 4], '#660000',
            'rgba(255, 255, 255, 0)'
        ];

        if (!global.map.getSource('drought')) {
            new ArcGISFeature('drought', global.map, {
                url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3',
                precision: 6,
                where: '1=1',
                outFields: 'ddate,dm'
            });
        }

        if (!global.map.getLayer('drought')) {
            global.map.addLayer({
                id: 'drought',
                type: 'fill',
                source: 'drought',
                paint: {
                    'fill-color': color,
                    'fill-opacity': 0.5
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }

        if (!global.map.getLayer('drought_outline')) {
            global.map.addLayer({
                id: 'drought_outline',
                type: 'line',
                source: 'drought',
                paint: {
                    'line-color': color,
                    'line-width': 2,
                    'line-opacity': 0.75
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }

        if (!global.map.getLayer('drought_title')) {
            global.map.addLayer({
                id: 'drought_title',
                type: 'symbol',
                source: 'drought',
                minzoom: 7.8,
                paint: {
                    'text-color': '#000',
                    'text-halo-color': '#fff',
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 400,
                    'text-font': config.fonts.din(),
                    'text-field': [
                        'case',
                        ['==', ['to-number', ['get', 'dm']], 0], 'Abnormally Dry',
                        ['==', ['to-number', ['get', 'dm']], 1], 'Moderate Drought',
                        ['==', ['to-number', ['get', 'dm']], 2], 'Severe Drought',
                        ['==', ['to-number', ['get', 'dm']], 3], 'Extreme Drought',
                        ['==', ['to-number', ['get', 'dm']], 4], 'Exceptional Drought',
                        ''
                    ],
                    'text-justify': 'auto',
                    'text-size': 13,
                    'text-transform': 'uppercase',
                    'text-max-width': 12,
                    'text-max-angle': 30,
                    'text-anchor': 'center',
                    'text-offset': [0, 1],
                    'text-letter-spacing': 0.05
                }
            });
        }
        /*if (!global.map.getSource('drought')) {
            global.map.addSource('drought', {
                type: 'raster',
                tiles: [
                    'https://ndmcgeodata.unl.edu/cgi-bin/mapserv.exe?map=/ms4w/apps/usdm/map/usdm_current_wms.map&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=usdm_current&WIDTH=256&HEIGHT=256&crs=EPSG:3857&styles=default&format=image/png&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }
    
        if (!global.map.getLayer('drought')) {
            global.map.addLayer({
                id: 'drought',
                type: 'raster',
                source: 'drought',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }*/
    }

    async fuels() {
        if (config.fuelsData == null) {
            const data = await api('https://lfps.usgs.gov/arcgis/rest/services/Landfire_LF2024/LF2024_EVT_CONUS/ImageServer/rasterAttributeTable', [['f', 'json'], ['renderingRule', '{"rasterFunction":"LF2024_EVT_CONUS"}']]);

            config.fuelsData = data.features;
        }

        if (!global.map.getSource('fuels')) {
            global.map.addSource('fuels', {
                type: 'raster',
                tiles: [
                    'https://dmsdata.cr.usgs.gov/geoserver/gwc/service/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=landfire%3ALF2024_EVT_CONUS&TILED=true&SRS=EPSG%3A3857&jsonLayerId=us_250%20Existing%20Vegetation%20Type&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getSource('fuelsAK')) {
            global.map.addSource('fuelsAK', {
                type: 'raster',
                tiles: [
                    'https://dmsdata.cr.usgs.gov/geoserver/gwc/service/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=landfire%3ALF2024_EVT_AK&TILED=true&SRS=EPSG%3A3857&jsonLayerId=ak_250%20Existing%20Vegetation%20Type&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('fuels')) {
            global.map.addLayer({
                id: 'fuels',
                type: 'raster',
                source: 'fuels',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }

        if (!global.map.getLayer('fuelsAK')) {
            global.map.addLayer({
                id: 'fuelsAK',
                type: 'raster',
                source: 'fuelsAK',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    countyBounds() {
        if (!global.map.getSource('countyBounds')) {
            global.map.addSource('countyBounds', {
                type: 'raster',
                tiles: [
                    'https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/export?service=WMS&request=GetMap&layers=show%3A2&styles=&format=png32&transparent=true&version=1.1.1&id=Counties&size=256,256&bboxSR=102100&imageSR=102100&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('countyBounds')) {
            global.map.addLayer({
                id: 'countyBounds',
                type: 'raster',
                source: 'countyBounds',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    nwsCWAs() {
        if (!global.map.getSource('nwsCWAs')) {
            global.map.addSource('nwsCWAs', {
                type: 'raster',
                tiles: [
                    'https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/export?service=WMS&request=GetMap&layers=show%3A1&styles=&format=png32&transparent=true&version=1.1.1&id=NWS%20CWAs&size=256,256&bboxSR=3857&imageSR=3857&f=image&dpi=90&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('nwsCWAs')) {
            global.map.addLayer({
                id: 'nwsCWAs',
                type: 'raster',
                source: 'nwsCWAs',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    /*usfs() {
        if (!global.map.getSource('usfs')) {
            global.map.addSource('usfs', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256
            });
        }
     
        if (!global.map.getLayer('usfs')) {
            global.map.addLayer({
                id: 'usfs',
                type: 'raster',
                source: 'usfs',
                minzoom: 0,
                maxzoom: 19,        
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }*/

    roads() {
        if (!global.map.getSource('roads')) {
            global.map.addSource('roads', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/export?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=USFS%20Road%20Network&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('roads')) {
            if (global.map.getZoom() > 11) {
                global.map.addLayer({
                    id: 'roads',
                    type: 'raster',
                    source: 'roads',
                    paint: {
                        'raster-opacity': 1
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            } else {
                notify('info', 'You must be zoomed in more to see USFS roads.');
            }
        }
    }

    lands() {
        if (!global.map.getSource('lands')) {
            global.map.addSource('lands', {
                type: 'raster',
                tiles: [
                    /*'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/export?service=WMS&request=GetMap&layers=show%3A17&styles=&format=png32&transparent=true&version=1.1.1&id=Federal%20Lands&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'*/
                    'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('lands')) {
            global.map.addLayer({
                id: 'lands',
                type: 'raster',
                source: 'lands',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    plss() {
        if (!global.map.getSource('plss')) {
            global.map.addSource('plss', {
                type: 'raster',
                tiles: [
                    'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/export?service=WMS&request=GetMap&layers=show%3A1%2C2%2C3&styles=&format=png32&transparent=true&version=1.1.1&id=PLSS&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('plss')) {
            global.map.addLayer({
                id: 'plss',
                type: 'raster',
                source: 'plss',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async dispatch(update = false) {
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/DMP_National_Dispatch_Boundaries_Public/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,DispName,DispUnitID,DispLocation,ContactPhone'],
            ['returnGeometry', true],
            ['resultType', 'tile'],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            global.map.getSource('dispatch').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('dispatch')) {
                    global.map.addSource('dispatch', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('dispatch_outline')) {
                    global.map.addLayer({
                        id: 'dispatch_outline',
                        type: 'line',
                        source: 'dispatch',
                        paint: {
                            'line-color': '#000',
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });
                }

                if (!global.map.getLayer('dispatch_title')) {
                    global.map.addLayer({
                        id: 'dispatch_title',
                        type: 'symbol',
                        source: 'dispatch',
                        minzoom: 5.7,
                        paint: {
                            'text-color': '#000',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 450,
                            'text-font': config.fonts.din(),
                            'text-field': ['get', 'DispName'],
                            'text-justify': 'auto',
                            'text-size': 14,
                            'text-max-width': 12,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.3],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    async gaccBounds(update = false) {
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/DMP_NationalGACCBoundaries_Public/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,GACCUnitID,GACCName,GACCLocation'],
            ['returnGeometry', true],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['resultType', 'tile'],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            global.map.getSource('gaccBounds').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('gaccBounds')) {
                    global.map.addSource('gaccBounds', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('gaccBounds')) {
                    global.map.addLayer({
                        id: 'gaccBounds',
                        type: 'line',
                        source: 'gaccBounds',
                        paint: {
                            'line-color': '#000',
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });
                }

                if (!global.map.getLayer('gaccBounds_title')) {
                    global.map.addLayer({
                        id: 'gaccBounds_title',
                        type: 'symbol',
                        source: 'gaccBounds',
                        minzoom: 5.7,
                        paint: {
                            'text-color': '#000',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 450,
                            'text-font': config.fonts.din(),
                            'text-field': ['get', 'GACCName'],
                            'text-justify': 'auto',
                            'text-size': 14,
                            'text-max-width': 12,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.3],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    async hms(update = false) {
        const data = await api('https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/NOAA_Satellite_Smoke_Detection_(v1)/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', '*'],
            ['resultType', 'tile'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['returnGeometry', true],
            ['f', 'geojson']
        ]);

        if (!data?.features.length) {
            return notify('info', 'Current smoke detection data is processing and will be available later.');
        }

        if (update && global.map.getSource('hms')) {
            global.map.getSource('hms').setData(data);
        } else {
            if (!global.map.getSource('hms')) {
                global.map.addSource('hms', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!global.map.getLayer('hms')) {
                global.map.addLayer({
                    id: 'hms',
                    type: 'fill',
                    source: 'hms',
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['get', 'Density'], 'Light'], '#aaa',
                            ['==', ['get', 'Density'], 'Light'], '#757575',
                            '#666'
                        ],
                        'fill-opacity': 0.5
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }

            if (!global.map.getSource('hms_title')) {
                global.map.addLayer({
                    id: 'hms_title',
                    type: 'symbol',
                    source: 'hms',
                    minzoom: 5.8,
                    paint: {
                        'text-color': '#333',
                        'text-halo-color': '#f9f9f9',
                        'text-halo-blur': 1,
                        'text-halo-width': 1
                    },
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 200,
                        'text-font': config.fonts.din(),
                        'text-field': ['concat', ['get', 'Density'], ' Smoke'],
                        'text-size': 13,
                        'text-max-angle': 30,
                        'text-padding': 5,
                        'text-pitch-alignment': 'viewport',
                        'text-rotation-alignment': 'map',
                        'text-offset': [0, 1]
                    }
                });
            }
        }
    }

    async smokeFcst(update = false) {
        const start = gmtime(+3600).replace('T', ' '),
            end = gmtime(+7200).replace('T', ' '),
            rounds = ['0 - 3', '3 - 25', '25 - 63', '63 - 158', '158 - 1000'],
            data = await api('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NDGD_SmokeForecast_v1/FeatureServer/0/query', [
                ['where', `1=1 AND todate > DATE '${start}' AND todate < DATE '${end}'`],
                ['outFields', '*'],
                ['resultType', 'tile'],
                ['geometry', getbbox()],
                ['geometryPrecision', 6],
                ['geometryType', 'esriGeometryEnvelope'],
                ['spatialRel', 'esriSpatialRelIntersects'],
                ['returnGeometry', true],
                ['f', 'geojson']
            ]);

        // update the geojson so maplibre can parse the colors correctly
        if (data.features && data.features.length > 0) {
            for (let i = 0; i < data.features.length; i++) {
                const txt = data.features[i].properties.smoke_classdesc.toString();

                data.features[i].properties.class = txt;

                for (let x = 0; x < rounds.length; x++) {
                    if (txt.search(rounds[x]) >= 0) {
                        data.features[i].properties.smoke_classdesc = x;
                    }
                }
            }
        }

        if (update && global.map.getSource('smokeFcst')) {
            global.map.getSource('smokeFcst').setData(data);
        } else {
            if (!global.map.getSource('smokeFcst')) {
                global.map.addSource('smokeFcst', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!global.map.getLayer('smokeFcst')) {
                global.map.addLayer({
                    id: 'smokeFcst',
                    type: 'fill',
                    source: 'smokeFcst',
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['to-string', ['get', 'smoke_classdesc']], '0'], '#ffffc0',
                            ['==', ['to-string', ['get', 'smoke_classdesc']], '1'], '#fcdf8b',
                            ['==', ['to-string', ['get', 'smoke_classdesc']], '2'], '#f6c26d',
                            ['==', ['to-string', ['get', 'smoke_classdesc']], '3'], '#c5885c',
                            ['==', ['to-string', ['get', 'smoke_classdesc']], '4'], '#974f4f',
                            '#f8fde0'
                        ],
                        'fill-opacity': 0.6
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    sfcSmoke() {
        updateHrrrSmokeTime();

        if (!global.map.getSource('sfcSmoke')) {
            global.map.addSource('sfcSmoke', {
                type: 'raster',
                tiles: [
                    `https://mapservices.weather.noaa.gov/raster/rest/services/air_quality/ndgd_smoke_sfc_1hr_avg_time/ImageServer/exportImage?F=image&FORMAT=PNG32&TRANSPARENT=true&LAYERS=show%3A0&time=${global.hrrrSmokeTime.init}%2C${global.hrrrSmokeTime.fcst}&SIZE=256%2C256&BBOXSR=3857&IMAGESR=3857&DPI=90&BBOX={bbox-epsg-3857}`
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('sfcSmoke')) {
            global.map.addLayer({
                id: 'sfcSmoke',
                type: 'raster',
                source: 'sfcSmoke',
                paint: {
                    'raster-opacity': 0.75
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    viSmoke() {
        updateHrrrSmokeTime();

        if (!global.map.getSource('viSmoke')) {
            global.map.addSource('viSmoke', {
                type: 'raster',
                tiles: [
                    `https://mapservices.weather.noaa.gov/raster/rest/services/air_quality/ndgd_smoke_vert_1hr_avg_time/ImageServer/exportImage?F=image&FORMAT=PNG32&TRANSPARENT=true&LAYERS=show%3A0&time=${global.hrrrSmokeTime.init}%2C${global.hrrrSmokeTime.fcst}&SIZE=256%2C256&BBOXSR=3857&IMAGESR=3857&DPI=90&BBOX={bbox-epsg-3857}`
                ],
                tileSize: 256
            });
        }

        if (!global.map.getLayer('viSmoke')) {
            global.map.addLayer({
                id: 'viSmoke',
                type: 'raster',
                source: 'viSmoke',
                paint: {
                    'raster-opacity': 0.75
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async odfFDR(update = false) {
        const color = [
            'case',
            ['==', ['to-number', ['get', 'firedanger']], 1], '#8bc53f',
            ['==', ['to-number', ['get', 'firedanger']], 2], '#fef100',
            ['==', ['to-number', ['get', 'firedanger']], 3], '#ffa939',
            ['==', ['to-number', ['get', 'firedanger']], 4], '#ec1c24',
            '#fff'
        ],
            data = await api('https://gis.odf.oregon.gov/odfags/rest/services/Hosted/Fire_Danger_Level_View/FeatureServer/0/query', [
                ['where', '1=1'],
                ['outFields', '*'],
                ['returnGeometry', true],
                ['geometryPrecision', 12],
                ['f', 'geojson']
            ]);

        if (update) {
            global.map.getSource('odfFDR').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('odfFDR')) {
                    global.map.addSource('odfFDR', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('odfFDR')) {
                    global.map.addLayer({
                        id: 'odfFDR',
                        type: 'fill',
                        source: 'odfFDR',
                        paint: {
                            'fill-color': color,
                            'fill-opacity': 0.3
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });

                    mapMouseOver('odfFDR');
                }

                if (!global.map.getLayer('odfFDR_outline')) {
                    global.map.addLayer({
                        id: 'odfFDR_outline',
                        type: 'line',
                        source: 'odfFDR',
                        paint: {
                            'line-color': color,
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });
                }

                if (!global.map.getLayer('odfFDR_title')) {
                    global.map.addLayer({
                        id: 'odfFDR_title',
                        type: 'symbol',
                        source: 'odfFDR',
                        minzoom: 4,
                        paint: {
                            'text-color': '#000',
                            'text-halo-color': '#ddd',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'line',
                            'symbol-spacing': 400,
                            'text-font': config.fonts.din(),
                            'text-field': [
                                'concat',
                                'ODF Fire Danger: ',
                                [
                                    'case',
                                    ['==', ['to-number', ['get', 'firedanger']], 4],
                                    'Extreme',
                                    ['==', ['to-number', ['get', 'firedanger']], 3],
                                    'High',
                                    ['==', ['to-number', ['get', 'firedanger']], 2],
                                    'Moderate',
                                    ['==', ['to-number', ['get', 'firedanger']], 1],
                                    'Low',
                                    'N/A'
                                ],
                                ' (',
                                ['get', 'regusearea'],
                                ')'
                            ],
                            'text-justify': 'auto',
                            'text-size': 16,
                            'text-max-width': 12,
                            'text-max-angle': 30,
                            'text-transform': 'uppercase',
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.6],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    async calfireUnits(update = false) {
        const data = await api('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/cdfadmin19_1/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'UNIT,UNITCODE,REGION'],
            ['returnGeometry', true],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['geometry', getbbox()],
            ['resultType', 'tile'],
            ['f', 'geojson']
        ]);

        if (update) {
            global.map.getSource('calfireUnits').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('calfireUnits')) {
                    global.map.addSource('calfireUnits', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('calfireUnits')) {
                    global.map.addLayer({
                        id: 'calfireUnits',
                        type: 'line',
                        source: 'calfireUnits',
                        paint: {
                            'line-color': '#177ca3',
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });
                }

                if (!global.map.getLayer('calfireUnits_title')) {
                    global.map.addLayer({
                        id: 'calfireUnits_title',
                        type: 'symbol',
                        source: 'calfireUnits',
                        minzoom: 5.7,
                        paint: {
                            'text-color': '#177ca3',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 450,
                            'text-font': config.fonts.din(),
                            'text-field': ['get', 'UNIT'],
                            'text-justify': 'auto',
                            'text-size': 14,
                            'text-max-width': 12,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.3],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    async cdfFHSZ(update = false) {
        const data = await api('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/ArcGIS/rest/services/FHSZ_SRA_LRA_Combined/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'FHSZ'],
            ['returnGeometry', true],
            ['resultType', 'tile'],
            ['geometryPrecision', 6],
            ['geometryType', 'esriGeometryEnvelope'],
            ['spatialRel', 'esriSpatialRelIntersects'],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            global.map.getSource('cdfFHSZ').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('cdfFHSZ')) {
                    global.map.addSource('cdfFHSZ', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('cdfFHSZ')) {
                    global.map.addLayer({
                        id: 'cdfFHSZ',
                        type: 'fill',
                        source: 'cdfFHSZ',
                        paint: {
                            'fill-color': [
                                'case',
                                ['==', ['to-number', ['get', 'FHSZ']], 1], '#ffff00',
                                ['==', ['to-number', ['get', 'FHSZ']], 2], '#ffaa00',
                                '#ff0000'
                            ],
                            'fill-opacity': 0.75
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });
                }
            }
        }
    }

    async calfireAircraft(update = false) {
        const data = await api('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/ArcGIS/rest/services/CAL_FIRE_Aircraft_Tracking_public_view/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', '*'],
            ['geometryPrecision', 6],
            ['returnGeometry', true],
            ['f', 'geojson']
        ]);

        if (update) {
            global.map.getSource('calfireAircraft').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('calfireAircraft')) {
                    global.map.addSource('calfireAircraft', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('calfireAircraft')) {
                    global.map.addLayer({
                        id: 'calfireAircraft',
                        type: 'symbol',
                        minzoom: 5,
                        source: 'calfireAircraft',
                        layout: {
                            'icon-image': [
                                'case',
                                ['==', ['get', 'organizationGroup'], 'Helicopter'], 'helicopter',
                                ['==', ['get', 'organizationGroup'], 'Tactical'], 'plane_tactical',
                                ['==', ['get', 'organizationGroup'], 'Tanker'], 'plane_large', 'plane_small'],
                            'icon-size': 0.8,
                            'icon-rotate': ['to-number', ['get', 'cog']],
                            'icon-allow-overlap': true,
                            visibility: 'visible'
                        }
                    });
                }

                if (!global.map.getLayer('calfireAircraft_title')) {
                    global.map.addLayer({
                        id: 'calfireAircraft_title',
                        type: 'symbol',
                        minzoom: 5.7,
                        source: 'calfireAircraft',
                        paint: {
                            'text-color': '#444',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 2
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'text-font': config.fonts.source(),
                            'text-field': ['concat', ['get', 'unitId'], ' ', [
                                'case',
                                ['!=', ['to-string', ['get', 'tailNumber']], 'null'],
                                ['concat', '(', ['get', 'tailNumber'], ')'],
                                ''
                            ], ['get', 'category']],
                            'text-justify': 'center',
                            'text-size': 12,
                            'text-max-width': 8,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 4.5],
                            'text-letter-spacing': 0.05,
                            visibility: 'visible'
                        }
                    });
                }
            }
        }
    }

    async firemed(update = false) {
        const types = ['hosp', 'ems', 'fire'],
            url = 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/ArcGIS/rest/services/Structures_Medical_Emergency_Response_v1/FeatureServer/',
            fields = [
                ['where', '1=1'],
                ['outFields', 'OBJECTID,NAME,ADDRESS,CITY,STATE,ZIPCODE'],
                ['resultType', 'tile'],
                ['geometry', getbbox()],
                ['geometryPrecision', 6],
                ['geometryType', 'esriGeometryEnvelope'],
                ['spatialRel', 'esriSpatialRelIntersects'],
                ['returnGeometry', true],
                ['f', 'geojson']
            ];

        types.forEach(async (type) => {
            const icon = type == 'fire' ? 'fire_dept' : type;
            if (!global.map.hasImage(type)) {
                const image = await global.map.loadImage(`${ENV.domain}assets/images/icons/fire/${icon}_icon.png`);
                global.map.addImage(type, image.data);
            }
        });

        const results = await Promise.allSettled(types.map((_, i) => api(`${url}${i}/query`, fields)));
        const mergedFeatures = results.flatMap((res, i) => {
            if (res.status !== 'fulfilled' || !res.value?.features) return [];

            return res.value.features.map(f => {
                f.properties.type = types[i];
                return f;
            });
        });
        const data = { type: 'FeatureCollection', features: mergedFeatures };

        if (update && global.map.getSource('firemed')) {
            global.map.getSource('firemed').setData(data);
        } else {
            if (!global.map.getSource('firemed')) {
                global.map.addSource('firemed', {
                    type: 'geojson',
                    data: data,
                    cluster: true,
                    clusterMaxZoom: 11,
                    clusterMinPoints: 3,
                    clusterRadius: 20
                });
            }

            if (!global.map.getLayer('firemed')) {
                global.map.addLayer({
                    id: 'firemed',
                    type: 'symbol',
                    source: 'firemed',
                    minzoom: config.firemedZoomLevel,
                    layout: {
                        'icon-image': ['get', 'type'],
                        'icon-size': 0.22,
                        visibility: 'visible'
                    }
                });

                mapMouseOver('firemed');
            }
        }
    }

    async tfrs(update = false) {
        const data = await api(`${ENV.apiURL}tfrs`);

        if (update) {
            global.map.getSource('tfrs').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!global.map.getSource('tfrs')) {
                    global.map.addSource('tfrs', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!global.map.getLayer('tfrs')) {
                    global.map.addLayer({
                        id: 'tfrs',
                        type: 'fill',
                        source: 'tfrs',
                        paint: {
                            'fill-color': '#c73800',
                            'fill-opacity': 0.05
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });

                    mapMouseOver('tfrs');
                }

                if (!global.map.getLayer('tfrs_outline')) {
                    global.map.addLayer({
                        id: 'tfrs_outline',
                        type: 'line',
                        source: 'tfrs',
                        paint: {
                            'line-color': '#c73800',
                            'line-width': 2,
                            'line-dasharray': [5, 4]
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });

                    mapMouseOver('tfrs_outline');
                }

                if (!global.map.getLayer('tfrs_title')) {
                    global.map.addLayer({
                        id: 'tfrs_title',
                        type: 'symbol',
                        minzoom: 5.7,
                        source: 'tfrs',
                        paint: {
                            'text-color': '#444',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 2
                        },
                        layout: {
                            'symbol-placement': 'line',
                            'symbol-spacing': 400,
                            'text-font': config.fonts.source(),
                            'text-field': 'Temporary Flight Restriction',
                            'text-justify': 'center',
                            'text-size': 12,
                            'text-max-width': 8,
                            'text-anchor': 'center',
                            'text-offset': [0, 1.5],
                            'text-letter-spacing': 0.05,
                            visibility: 'visible'
                        }
                    });
                }
            }
        }
    }
}