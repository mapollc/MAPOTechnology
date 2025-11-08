<!DOCTYPE html>

<html>
    <head>
        <title>WxDashboards</title>
        <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <link href="https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css" rel="stylesheet">
        <noscript>
            <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;700&display=swap">
        </noscript>
        <style>
            * {box-sizing:border-box;}
            :root{--spacing:1em;}
            html,body{width:100%;height:100%;margin:0;padding:0;font-family:roboto;font-size:16px;overflow:hidden;}
            #map{position:relative;width:100%;height:100%;overflow:hidden;}
            .mapboxgl-ctrl-scale{line-height:1.3;margin:0 0 .5em var(--spacing)!important;}
            .mapboxgl-ctrl button.mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23ed254e' width='300' height='300' viewBox='0 0 29 29'%3E%3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E%3Cpath d='M10.5 16l4 8 4-8h-8z' fill='%23ddd'/%3E%3C/svg%3E")!important
            }
            .mapboxgl-ctrl button:not(.mapboxgl-ctrl-fullscreen) .mapboxgl-ctrl-icon {
                background-size: 90%;
            }
        </style>
    </head>
    <body>

    <div id="map"></div>

    <script src="https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js"></script>
    <script>
        let mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
            apiURL = 'https://api.mapotechnology.com/v1/',
            apiKey = '50e2c43f8f63ff0ed20127ee2487f15e',
            map,
            layers,
            wwaColors = [
                'case',
                ['==', ['get', 'Event'], '911 Telephone Outage'], '#bfbfbf',
                ['==', ['get', 'Event'], 'Administrative Message'], '#fefefe',
                ['==', ['get', 'Event'], 'Air Quality Alert'], '#7f7f7f',
                ['==', ['get', 'Event'], 'Air Stagnation Advisory'], '#7f7f7f',
                ['==', ['get', 'Event'], 'Arroyo and Small Stream Flood Advisory'], '#00fe7e',
                ['==', ['get', 'Event'], 'Ashfall Advisory'], '#686868',
                ['==', ['get', 'Event'], 'Ashfall Warning'], '#a8a8a8',
                ['==', ['get', 'Event'], 'Avalanche Advisory'], '#cc843e',
                ['==', ['get', 'Event'], 'Avalanche Warning'], '#1d8ffe',
                ['==', ['get', 'Event'], 'Avalanche Watch'], '#f3a35f',
                ['==', ['get', 'Event'], 'Beach Hazards Statement'], '#3fdfcf',
                ['==', ['get', 'Event'], 'Blizzard Warning'], '#fe4400',
                ['==', ['get', 'Event'], 'Blizzard Watch'], '#acfe2e',
                ['==', ['get', 'Event'], 'Blowing Dust Advisory'], '#bcb66a',
                ['==', ['get', 'Event'], 'Brisk Wind Advisory'], '#d7bed7',
                ['==', ['get', 'Event'], 'Child Abduction Emergency'], '#fed600',
                ['==', ['get', 'Event'], 'Civil Danger Warning'], '#feb5c0',
                ['==', ['get', 'Event'], 'Civil Emergency Message'], '#feb5c0',
                ['==', ['get', 'Event'], 'Coastal Flood Advisory'], '#7bfb00',
                ['==', ['get', 'Event'], 'Coastal Flood Statement'], '#6a8d22',
                ['==', ['get', 'Event'], 'Coastal Flood Warning'], '#218a21',
                ['==', ['get', 'Event'], 'Coastal Flood Watch'], '#65cca9',
                ['==', ['get', 'Event'], 'Dense Fog Advisory'], '#6f7f8f',
                ['==', ['get', 'Event'], 'Dense Smoke Advisory'], '#efe58b',
                ['==', ['get', 'Event'], 'Dust Storm Warning'], '#fee3c3',
                ['==', ['get', 'Event'], 'Earthquake Warning'], '#8a4412',
                ['==', ['get', 'Event'], 'Evacuation - Immediate'], '#7efe00',
                ['==', ['get', 'Event'], 'Excessive Heat Warning'], '#c61484',
                ['==', ['get', 'Event'], 'Excessive Heat Watch'], '#7f0000',
                ['==', ['get', 'Event'], 'Extreme Cold Warning'], '#0000fe',
                ['==', ['get', 'Event'], 'Extreme Cold Watch'], '#0000fe',
                ['==', ['get', 'Event'], 'Extreme Fire Danger'], '#e89579',
                ['==', ['get', 'Event'], 'Extreme Wind Warning'], '#fe8b00',
                ['==', ['get', 'Event'], 'Fire Warning'], '#9f512c',
                ['==', ['get', 'Event'], 'Fire Weather Watch'], '#feddac',
                ['==', ['get', 'Event'], 'Flash Flood Statement'], '#8a0000',
                ['==', ['get', 'Event'], 'Flash Flood Warning'], '#8a0000',
                ['==', ['get', 'Event'], 'Flash Flood Watch'], '#2d8a56',
                ['==', ['get', 'Event'], 'Flood Advisory'], '#00fe7e',
                ['==', ['get', 'Event'], 'Flood Statement'], '#00fe00',
                ['==', ['get', 'Event'], 'Flood Warning'], '#00fe00',
                ['==', ['get', 'Event'], 'Flood Watch'], '#2d8a56',
                ['==', ['get', 'Event'], 'Freeze Warning'], '#473c8a',
                ['==', ['get', 'Event'], 'Freeze Watch'], '#00fefe',
                ['==', ['get', 'Event'], 'Freezing Fog Advisory'], '#007f7f',
                ['==', ['get', 'Event'], 'Freezing Rain Advisory'], '#d96fd5',
                ['==', ['get', 'Event'], 'Freezing Spray Advisory'], '#00befe',
                ['==', ['get', 'Event'], 'Frost Advisory'], '#6394ec',
                ['==', ['get', 'Event'], 'Gale Warning'], '#dc9fdc',
                ['==', ['get', 'Event'], 'Gale Watch'], '#febfca',
                ['==', ['get', 'Event'], 'Hard Freeze Warning'], '#9300d2',
                ['==', ['get', 'Event'], 'Hard Freeze Watch'], '#4068e0',
                ['==', ['get', 'Event'], 'Hazardous Materials Warning'], '#4a0081',
                ['==', ['get', 'Event'], 'Hazardous Seas Warning'], '#d7bed7',
                ['==', ['get', 'Event'], 'Hazardous Seas Watch'], '#473c8a',
                ['==', ['get', 'Event'], 'Hazardous Weather Outlook'], '#ede7a9',
                ['==', ['get', 'Event'], 'Heat Advisory'], '#fe7e4f',
                ['==', ['get', 'Event'], 'Heavy Freezing Spray Warning'], '#00befe',
                ['==', ['get', 'Event'], 'Heavy Freezing Spray Watch'], '#bb8e8e',
                ['==', ['get', 'Event'], 'High Surf Advisory'], '#b954d2',
                ['==', ['get', 'Event'], 'High Surf Warning'], '#218a21',
                ['==', ['get', 'Event'], 'High Wind Warning'], '#d9a41f',
                ['==', ['get', 'Event'], 'High Wind Watch'], '#b7850a',
                ['==', ['get', 'Event'], 'Hurricane Force Wind Warning'], '#cc5b5b',
                ['==', ['get', 'Event'], 'Hurricane Force Wind Watch'], '#9831cb',
                ['==', ['get', 'Event'], 'Hurricane Local Statement'], '#fee3b4',
                ['==', ['get', 'Event'], 'Hurricane Warning'], '#db133b',
                ['==', ['get', 'Event'], 'Hurricane Watch'], '#fe00fe',
                ['==', ['get', 'Event'], 'Hydrologic Advisory'], '#00fe7e',
                ['==', ['get', 'Event'], 'Hydrologic Outlook'], '#8fed8f',
                ['==', ['get', 'Event'], 'Ice Storm Warning'], '#8a008a',
                ['==', ['get', 'Event'], 'Lake Effect Snow Advisory'], '#47d0cb',
                ['==', ['get', 'Event'], 'Lake Effect Snow Warning'], '#008a8a',
                ['==', ['get', 'Event'], 'Lake Effect Snow Watch'], '#86cdf9',
                ['==', ['get', 'Event'], 'Lake Wind Advisory'], '#d1b38b',
                ['==', ['get', 'Event'], 'Lakeshore Flood Advisory'], '#7bfb00',
                ['==', ['get', 'Event'], 'Lakeshore Flood Statement'], '#6a8d22',
                ['==', ['get', 'Event'], 'Lakeshore Flood Warning'], '#218a21',
                ['==', ['get', 'Event'], 'Lakeshore Flood Watch'], '#65cca9',
                ['==', ['get', 'Event'], 'Law Enforcement Warning'], '#bfbfbf',
                ['==', ['get', 'Event'], 'Local Area Emergency'], '#bfbfbf',
                ['==', ['get', 'Event'], 'Low Water Advisory'], '#a42929',
                ['==', ['get', 'Event'], 'Marine Weather Statement'], '#feeed4',
                ['==', ['get', 'Event'], 'Nuclear Power Plant Warning'], '#4a0081',
                ['==', ['get', 'Event'], 'Radiological Hazard Warning'], '#4a0081',
                ['==', ['get', 'Event'], 'Red Flag Warning'], '#fe1392',
                ['==', ['get', 'Event'], 'Rip Current Statement'], '#3fdfcf',
                ['==', ['get', 'Event'], 'Severe Thunderstorm Warning'], '#fea400',
                ['==', ['get', 'Event'], 'Severe Thunderstorm Watch'], '#da6f92',
                ['==', ['get', 'Event'], 'Severe Weather Statement'], '#00fefe',
                ['==', ['get', 'Event'], 'Shelter In Place Warning'], '#f97f71',
                ['==', ['get', 'Event'], 'Short Term Forecast'], '#97fa97',
                ['==', ['get', 'Event'], 'Small Craft Advisory'], '#d7bed7',
                ['==', ['get', 'Event'], 'Small Craft Advisory For Hazardous Seas'], '#d7bed7',
                ['==', ['get', 'Event'], 'Small Craft Advisory For Rough Bar'], '#d7bed7',
                ['==', ['get', 'Event'], 'Small Craft Advisory For Winds'], '#d7bed7',
                ['==', ['get', 'Event'], 'Small Stream Flood Advisory'], '#00fe7e',
                ['==', ['get', 'Event'], 'Special Marine Warning'], '#fea400',
                ['==', ['get', 'Event'], 'Special Weather Statement'], '#fee3b4',
                ['==', ['get', 'Event'], 'Storm Warning'], '#9300d2',
                ['==', ['get', 'Event'], 'Storm Watch'], '#fee3b4',
                ['==', ['get', 'Event'], 'Test'], '#effefe',
                ['==', ['get', 'Event'], 'Tornado Warning'], '#fe0000',
                ['==', ['get', 'Event'], 'Tornado Watch'], '#fefe00',
                ['==', ['get', 'Event'], 'Tropical Depression Local Statement'], '#fee3b4',
                ['==', ['get', 'Event'], 'Tropical Storm Local Statement'], '#fee3b4',
                ['==', ['get', 'Event'], 'Tropical Storm Warning'], '#b12121',
                ['==', ['get', 'Event'], 'Tropical Storm Watch'], '#ef7f7f',
                ['==', ['get', 'Event'], 'Tsunami Advisory'], '#d1681d',
                ['==', ['get', 'Event'], 'Tsunami Warning'], '#fc6246',
                ['==', ['get', 'Event'], 'Tsunami Watch'], '#fe00fe',
                ['==', ['get', 'Event'], 'Typhoon Local Statement'], '#fee3b4',
                ['==', ['get', 'Event'], 'Typhoon Warning'], '#db133b',
                ['==', ['get', 'Event'], 'Typhoon Watch'], '#fe00fe',
                ['==', ['get', 'Event'], 'Urban and Small Stream Flood Advisory'], '#00fe7e',
                ['==', ['get', 'Event'], 'Volcano Warning'], '#2e4e4e',
                ['==', ['get', 'Event'], 'Wind Advisory'], '#d1b38b',
                ['==', ['get', 'Event'], 'Wind Chill Advisory'], '#aeeded',
                ['==', ['get', 'Event'], 'Wind Chill Warning'], '#afc3dd',
                ['==', ['get', 'Event'], 'Wind Chill Watch'], '#5e9d9f',
                ['==', ['get', 'Event'], 'Winter Storm Warning'], '#fe68b3',
                ['==', ['get', 'Event'], 'Winter Storm Watch'], '#4581b3',
                ['==', ['get', 'Event'], 'Winter Weather Advisory'], '#7a67ed',
                '#eee'
            ];

        async function api(url, fields = null) {
            let result,
                ops = {
                    method: url.search('weather.gov') >= 0 ? 'GET' : 'POST',
                },
                fd = new FormData();

            if (url.search(apiURL) >= 0 || url.search(apiURL.replace('v1', 'v2')) >= 0) {
                fd.append('key', apiKey);
            }

            if (fields != null) {
                fields.forEach((v) => {
                    fd.append(v[0], v[1]);
                });
            }

            if (url.search('weather.gov') < 0) {
                ops['body'] = fd;
            }

            if (navigator.onLine) {
                await fetch(url, ops).then(async (resp) => {
                    result = await resp.json();
                }).catch((e) => {
                    console.error(e.message);
                });

                return result;
            } else {
                console.error('You are not connected to the internet');
                return null;
            }
        }

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

        function getbbox() {
            var b = map.getBounds(),
                sw = b.getSouthWest(),
                ne = b.getNorthEast();

            return (b ? JSON.stringify({
                xmin: ne.lng,
                ymin: sw.lat,
                xmax: sw.lng,
                ymax: ne.lat,
                spatialReference: {
                    wkid: 4326
                }
            }) : false);
        }

        class Layers {
            init() {
                this.getWWAs();
                this.getReports();
            }

            async getWWAs(update = false) {
                const wwa = await api('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6/query', [
                    ['where', '1=1'],
                    ['outFields', 'OBJECTID,Event,Affected,End_'],
                    ['returnGeometry', true],
                    ['geometryPrecision', 6],
                    ['geometry', getbbox()],
                    ['f', 'geojson']
                ]);

                if (wwa && wwa.features.length > 0) {
                    if (update) {
                        map.getSource('wwas').setData(wwa);
                    } else {
                        if (wwa && wwa.features.length > 0) {
                            if (!map.getSource('wwas')) {
                                map.addSource('wwas', {
                                    type: 'geojson',
                                    data: wwa
                                });
                            }

                            if (!map.getLayer('wwas_outline')) {
                                map.addLayer({
                                    id: 'wwas_outline',
                                    type: 'line',
                                    source: 'wwas',
                                    paint: {
                                        'line-color': wwaColors,
                                        'line-width': 2,
                                        'line-opacity': 0.5
                                    },
                                    layout: {
                                        visibility: 'visible'
                                    }
                                }).addLayer({
                                    id: 'wwas_fill',
                                    type: 'fill',
                                    source: 'wwas',
                                    paint: {
                                        'fill-color': wwaColors,
                                        'fill-opacity': 0.2
                                    },
                                    layout: {
                                        visibility: 'visible'
                                    }
                                }).on('mouseenter', 'wwas_fill', () => {
                                    map.getCanvas().style.cursor = 'pointer';
                                }).on('mouseleave', 'wwas_fill', () => {
                                    map.getCanvas().style.cursor = 'auto';
                                });
                            }
                        }
                    }
                }
            }

            async getReports() {
                const when = (new Date().getTime() - (60 * 60 * 24 * 1000)) / 1000,
                    rpt = await api(apiURL + 'spc/reports', [['date', when], ['category', 'severe']]);

                if (rpt.reports.data.length > 0) {
                    const type = ['get', 'code', ['get', 'type', ['properties']]],
                        features = [];

                    for (let i = 0; i < rpt.reports.data.length; i++) {
                        features.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: rpt.reports.data[i].location.coordinates
                            },
                            properties: rpt.reports.data[i]
                        });
                    }

                    if (!map.getSource('reports')) {
                        map.addSource('reports', {
                            type: 'geojson',
                            data: {
                                type: 'FeatureCollection',
                                features: features
                            }
                        });
                    }

                    if (!map.getLayer('reports')) {
                        map.addLayer({
                            id: 'reports',
                            type: 'circle',
                            source: 'reports',
                            paint: {
                                'circle-radius': [
                                    'case',
                                    ['==', type, 'TO'],
                                    7,
                                    6
                                ],
                                'circle-color': [
                                    'case',
                                    ['==', type, 'TO'],
                                    '#ff0000',
                                    ['==', type, 'HA'],
                                    '#8bc34a',
                                    ['==', type, 'TG'],
                                    '#795548',
                                    '#333'
                                ],
                                'circle-stroke-color': '#111',
                                'circle-stroke-width': 1
                            },
                            layout: {
                                visibility: 'visible'
                            }
                        }).on('mouseenter', 'reports', () => {
                            map.getCanvas().style.cursor = 'pointer';
                        }).on('mouseleave', 'reports', () => {
                            map.getCanvas().style.cursor = 'auto';
                        }).addLayer({
                            id: 'reports_symbol',
                            type: 'symbol',
                            source: 'reports',
                            minzoom: 5,
                            paint: {
                                'text-color': '#000',
                                'text-halo-color': '#fff',
                                'text-halo-blur': 0,
                                'text-halo-width': 0
                            },
                            layout: {
                                'symbol-placement': 'point',
                                'text-font': ['Source Sans Pro SemiBold'],
                                'text-field': type,
                                'text-justify': 'center',
                                'text-size': 14,
                                'text-max-width': 12
                            }
                        });
                    }
                }
            }
        }

        function init() {
            map = new mapboxgl.Map({
                container: 'map',
                accessToken: mapboxToken,
                style: 'mapbox://styles/mapbox/dark-v11',
                projection: 'mercator',
                hash: true,
                attributionControl: false,
                collectResourceTiming: true,
                zoom: 4.24,
                center: [-98.68, 38.41]
            }).on('style.load', () => {
                layers.init();                
            }).on('error', (e) => {
                if (e && e.error.status != 500) { }
            }).on('moveend', debounce(() => {
                map.getCanvas().style.cursor = 'auto';

                layers.getWWAs(true);
            }));

            /* add map controls */
            map.addControl(new mapboxgl.FullscreenControl({
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
                    fitBoundsOptions: {
                        maxZoom: 10.16
                    },
                    trackUserLocation: true,
                    showUserHeading: true
                })
            );

            map.getCanvas().style.cursor = 'auto';
        }

        document.onreadystatechange = async () => {
            if (document.readyState != 'complete') {

            } else {
                layers = new Layers();
                init();
            }
        };
    </script>
    </body>
</html>