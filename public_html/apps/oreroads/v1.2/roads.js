let map,
    mapLat,
    mapLon,
    mapZoom,
    basemap,
    traffic,
    host = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    webkey = 'c196d0958608ad2b7d4af2be078ecc54',
    nativekey = 'bG9jYWxob3N0',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ',
    windowHost = window.location.host,
    cloudBased = (windowHost == 'localhost' || windowHost.search('mapotechnology.com') >= 0 ? true : false),
    key = (windowHost.search('mapotechnology.com') >= 0 ? webkey : nativekey),
    appPackage = 'com.mapollc.oreroads',
    curtime = new Date(),
    yr = curtime.getFullYear(),
    userLoc,
    userLocRad,
    summerMode = (curtime.getTime() >= new Date('4/15/' + yr + ' 00:00:00').getTime() && curtime.getTime() <= new Date('10/15/' + yr + ' 23:59:59').getTime() ? true : false),
    validSubscription,
    /*rwisPath = (windowHost == 'localhost' ? '../cache/rwis.json' : apiURL + 'roads/rwis?key=' + key),*/
    ref,
    radarInit,
    isRadarPaused = false,
    radarLoop,
    radarCount = 0,
    radarImgs = [],
    rw = [],
    roadsArray = [],
    roadsIDArray = [],
    roads = L.featureGroup(),
    ttimes = L.featureGroup(),
    /*webcams = L.featureGroup(),
    rwis = L.featureGroup(),
    incidents = L.featureGroup(),*/
    webcams = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 10,
        maxClusterRadius: function () {
            if (map.getZoom() <= 7) {
                return 15;
            } else {
                return 10;
            }
        }
    }),
    rwis = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 10,
        maxClusterRadius: function () {
            if (map.getZoom() <= 7) {
                return 35;
            } else {
                return 26;
            }
        }
    }),
    vms = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 10,
        maxClusterRadius: function () {
            if (map.getZoom() <= 8) {
                return 35;
            } else {
                return 26;
            }
        }
    }),
    incidents = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 10,
        maxClusterRadius: 10
    }),
    construction = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        disableClusteringAtZoom: 10,
        maxClusterRadius: 10
    }),
    moving = false,
    initial = false,
    rwRetreived = false,
    chlSent = false,
    useLocalStorage = (cloudBased ? false : true);

if (cloudBased) {
    var layers_roads = (summerMode ? false : true),
        layers_webcams = true,
        layers_rwis = (summerMode ? false : true),
        layers_incidents = true,
        layers_traffic = (summerMode ? true : false),
        layers_construction = (summerMode ? true : false),
        layers_vms = false,
        layers_radar = false,
        layers_ttimes = true,
        useMapCaching = true;
}

function isVisible(el) {
    if (el == null) {
        return false;
    } else {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
}

function layers(layerID, t) {
    if (t) {
        map.addLayer(layerID);
        if (layerID == roads && !rwRetreived) {
            getRW();
        }
    } else {
        map.removeLayer(layerID);
    }

    if (layerID == construction || layerID == incidents) {
        document.querySelectorAll('.leaflet-marker-icon.incident span').forEach((s) => {
            if (map.getZoom() >= 10) {
                if (s.style.display != 'block') {
                    s.style.display = 'block';
                }
            } else {
                if (s.style.display != 'none') {
                    s.style.display = 'none';
                }
            }
        });
    }
}

function hideLoading() {
    const el = document.querySelector('#loading');

    if (isVisible(el)) {
        el.style.display = 'none';
    }
}

function storageIsOld(n, t) {
    if ((new Date().getTime() - localStorage.getItem(n + '_time')) > t * 1000) {
        return true;
    } else {
        return false;
    }
}

function findIncident(n, m = false) {
    let ll,
        wh,
        bounds = [];

    incidents.getLayers().forEach((i) => {
        if (i.feature !== undefined && i.feature.properties.id == n) {
            if (m) {
                new Modal(i.feature.properties).incident();
            }

            if (i._latlng) {
                wh = 1;
                ll = i.getLatLng();
            } else {
                wh = 2;
                ll = i.getLatLngs();
            }
            bounds.push(ll);
        }
    });

    map.fitBounds(bounds, {
        padding: (wh ? (cloudBased ? [150, 150] : [50, 50]) : [0, 0])
    });
}

function geolocate(a, b, c = null, d = null) {
    map.setView([a, b], map.getZoom());

    if (document.querySelector('.user-location') == null) {
        userLoc = L.marker([a, b], {
            icon: L.divIcon({
                html: '<div class="user-location show-heading"><div class="user-location-dot"></div><div class="user-location-heading"></div></div>',
                className: 'geo'
            })
        }).on('click', (e) => {
            e.target.remove();
        }).addTo(map);

        if (d != null && d > 0) {
            userLocRad = L.circle([a, b], {
                radius: d,
                color: '#1da1f2',
                opacity: 0.3,
                fillOpacity: 0.3
            }).addTo(map);
        }
    } else {
        userLoc.setLatLng([a, b]);

        if (d != null && d > 0) {
            userLocRad.setLatLng([a, b]);
            userLocRad.setRadius(d);
        }
    }
}

function road(i) {
    let c = '';
    switch (i) {
        case 0: c = '#bdbdbd'; break;
        case 1: c = '#000'; break;
        case 2: c = '#2196f3'; break;
        case 3: c = '#ff9800'; break;
        case 4: c = '#827717'; break;
        /*case 5: c = '#0cb5c9'; break;*/
        case 5: c = '#7e57c2'; break;
        case 6: c = '#d32f2f'; break;
    }

    return c;
}

function findRoad(name) {
    roads.getLayers()[0].getLayers().forEach((e) => {
        if (e.feature.properties.name == name) {
            let b;

            if (e.getLatLngs) {
                b = e.getLatLngs();
            } else {
                b = e.getLatLng();
            }

            map.fitBounds(b, {
                padding: (cloudBased ? [150, 150] : [50, 50])
            });
        }
    })
}

function matchRW(name) {
    let o = [null, null];

    roads.getLayers()[0].getLayers().forEach((layer, n) => {
        if (layer.feature.properties.name.toLowerCase() == name) {
            o = [n, layer];
        }
    });

    return o;
}

function deg2rad(d) {
    return d * Math.PI / 180;
}

function rad2deg(r) {
    return r * 180 / Math.PI;
}

function distance(lat1, lon1, lat2, lon2, round = true) {
    const theta = parseFloat(lon1) - parseFloat(lon2);
    let dist = Math.sin(deg2rad(parseFloat(lat1))) * Math.sin(deg2rad(parseFloat(lat2))) + Math.cos(deg2rad(parseFloat(lat1))) * Math.cos(deg2rad(parseFloat(lat2))) * Math.cos(deg2rad(theta));
    dist = Math.acos(dist);
    dist = rad2deg(dist);
    let miles = dist * 60 * 1.1515;

    return (round ? miles.toFixed(2) : miles);
}

function counterpart(tf) {
    let s = '';

    if (tf == 'tollgate wb') {
        s = 'Tollgate EB'
    } else if (tf == 'tollgate eb') {
        s = 'Tollgate WB'
    } else if (tf == 'siskiyou summit nb') {
        s = 'Siskiyou Summit SB'
    } else if (tf == 'siskiyou summit sb') {
        s = 'Siskiyou Summit NB'
    } else if (tf == 'meacham eb') {
        s = 'Meacham WB'
    } else if (tf == 'meacham wb') {
        s = 'Meacham EB'
    } else if (tf == 'ladd canyon eb') {
        s = 'Ladd Canyon WB'
    } else if (tf == 'ladd canyon wb') {
        s = 'Ladd Canyon EB'
    } else if (tf == 'pleasant valley eb') {
        s = 'Pleasant Valley WB'
    } else if (tf == 'pleasant valley wb') {
        s = 'Pleasant Valley EB'
    } else if (tf == 'cabbage hill eb') {
        s = 'Cabbage Hill WB'
    } else if (tf == 'cabbage hill wb') {
        s = 'Cabbage Hill EB'
    } else if (tf == 'perry wb') {
        s = 'Perry EB';
    } else if (tf == 'perry eb') {
        s = 'Perry WB';
    }

    return s;
}

async function getRoads() {
    const resp = await fetch('https://api.mapbox.com/datasets/v1/mapollc/clofxe8el0lxy2arnbd8ltiz4/features?access_token=' + mapboxToken);

    if (resp.ok) {
        const json = await resp.json();

        const data = L.geoJSON(json.features, {
            pane: 'poly',
            style: function (feature) {
                return {
                    color: '#000',
                    weight: 6
                };
            },
            pointToLayer: (_, latlng) => {
                return L.circleMarker(latlng, {
                    pane: 'poly',
                    radius: 5,
                    fillOpacity: 1,
                    color: '#000'
                });
            },
            onEachFeature: (feature, layer) => {
                roadsArray.push(feature.properties.name);
                roadsIDArray.push(layer);

                layer.on('click', (e) => {
                    let report = [],
                        tf = feature.properties.name.toLowerCase(),
                        s = counterpart(tf);

                    rw.forEach((ea) => {
                        if (ea.id.toLowerCase() == tf) {
                            report.push(ea.properties);
                        }
                    });

                    if (s != '') {
                        rw.forEach((ea) => {
                            if (ea.id == s) {
                                report.push(ea.properties);
                            }
                        });
                    }

                    if (cloudBased) {
                        new Modal(report).roadReport(feature.properties.name);
                        new RoadNetwork(e.latlng.lat, e.latlng.lng, (report.length > 0 && report[0].hwyID ? report[0].hwyID.toString() : null)).getRange(report, feature.properties.name);
                    } else {
                        App.roadReport(JSON.stringify(report));
                    }
                });
            }
        });

        if (webApp) {
            data.bindTooltip((layer) => {
                return 'Road Report for ' + layer.feature.properties.name;
            }, {
                sticky: true
            });
        }

        roads.addLayer(data);

        if (layers_roads) {
            map.addLayer(roads);
            document.querySelector('#loading span').innerHTML = 'Getting road conditions...';
            getRW();
        }
    }
}

async function getRW() {
    const el = document.querySelector('#loading');

    if (!isVisible(el)) {
        document.querySelector('#loading span').innerHTML = 'Getting road conditions...';
        el.style.display = 'block';
    }

    let rwURL = apiURL + 'roads?key=' + key;
    const resp = await fetch(rwURL);

    if (resp.ok) {
        let rpt = await resp.json(),
            rwnames = [],
            count = 0;

        if (rpt.rw == null) {
            console.error('There was an error getting current road conditions.');
        } else {
            rpt.rw.forEach((feature) => {
                const layer = matchRW(feature.name.toLowerCase());

                if (layer[0] != null) {
                    /* if the road, weather attributes exist */
                    if (feature.road) {
                        layer[1].setStyle({
                            color: road(feature.road.id)
                        });

                        if (feature.road.id != 0) {
                            count++;
                        }
                    } else {
                        layer[1].setStyle({
                            color: road(0)
                        });
                    }

                    rwnames.push(layer[1].feature.properties.name);
                    rw.push({ 'id': layer[1].feature.properties.name, 'properties': feature });
                }
            });

            roads.getLayers()[0].getLayers().forEach((r) => {
                if (!rwnames.includes(r.feature.properties.name)) {
                    r.setStyle({
                        color: road(0)
                    });
                }
            });

            console.info(count + ' road & weather stations reporting');
            rwRetreived = true;
        }
        hideLoading();
    }
}

function displayWebcams(json) {
    var latlons = [];

    const data = L.geoJSON(json.features, {
        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                pane: 'markers',
                title: '*Camera* ' + feature.properties.name,
                icon: L.divIcon({
                    className: 'webcam',
                    html: '<div><i class="fa-solid fa-video"></i></div>',
                    iconAnchor: [0, 0]
                })
            }).on('click', (e) => {
                const data = e.target.feature.properties;

                if (cloudBased) {
                    new Modal(data).webcam();
                } else {
                    App.webcam(JSON.stringify(data));
                }
            });
        }
    });

    console.info(json.features.length + ' webcams listed');
    webcams.addLayer(data);

    /* if there is multi webcams at a location, move the icon left */
    webcams.getLayers().forEach((w) => {
        const loc = w.getLatLng();

        if (latlons.includes(loc.lat + loc.lng)) {
            w.setIcon(L.divIcon({
                className: 'webcam',
                html: '<div><i class="fa-solid fa-video"></i></div>',
                iconAnchor: [23, 0]
            }));
        } else {
            latlons.push(loc.lat + loc.lng);
        }
    });

    if (layers_webcams) {
        map.addLayer(webcams);
    }
}

async function getWebcams() {
    let webcamURL = apiURL + 'webcams?key=' + key + '&network=ODOT';

    if ((localStorage.getItem('webcams') == null || storageIsOld('webcams', 2592000)) || !useLocalStorage) {
        const resp = await fetch(webcamURL);

        if (resp.ok) {
            const json = await resp.text();

            if (useLocalStorage) {
                localStorage.setItem('webcams', json);
                localStorage.setItem('webcams_time', new Date().getTime());
            }
            displayWebcams(JSON.parse(json));
        }
    } else {
        displayWebcams(JSON.parse(localStorage.getItem('webcams')));
    }
}

function rwisClick(e) {
    let cams = [];

    const feat = e.target.feature,
        c = feat.geometry.coordinates,
        a = c[1],
        b = c[0],
        data = {
            'id': feat.properties.station.id,
            'temp': feat.properties.weather.temp,
            'json': feat.properties
        };

    webcams.getLayers().forEach((w) => {
        const c = w.feature.geometry.coordinates,
            d = distance(a, b, c[1], c[0]);

        if (d <= 1) {
            cams.push(w.feature.properties);
        }
    });
    data['webcams'] = cams;

    if (cloudBased) {
        new Modal(data).rwis();
    } else {
        App.rwis(JSON.stringify(data));
    }
}

function displayRWIS(json) {
    const data = L.geoJSON(json.features, {
        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                pane: 'markers',
                title: Math.round(feature.properties.weather.temp) + '°F @ ' + feature.properties.station.name,
                icon: L.divIcon({
                    className: 'rwis',
                    html: '<div>' + Math.round(feature.properties.weather.temp) + '&deg;</div>',
                    iconAnchor: [-5, 22]
                })
            }).on('click', (e) => {
                rwisClick(e);
            });
        }
    });

    console.info(json.features.length + ' RWIS stations reporting');
    rwis.addLayer(data);

    if (layers_rwis) {
        map.addLayer(rwis);
    }
}

async function getRWIS() {
    if ((localStorage.getItem('rwis') == null || storageIsOld('rwis', 300)) || !useLocalStorage) {
        const resp = await fetch(apiURL + 'roads/rwis?key=' + key);

        if (resp.ok) {
            const json = await resp.text();

            if (useLocalStorage) {
                localStorage.setItem('rwis', json);
                localStorage.setItem('rwis_time', new Date().getTime());
            }
            displayRWIS(JSON.parse(json));
        }
    } else {
        displayRWIS(JSON.parse(localStorage.getItem('rwis')));
    }
}

function displayIncidents(json) {
    const data = L.geoJSON(json.features, {
        pane: 'poly',
        style: (feature) => {
            return {
                color: '#ff4a4a',
                weight: 5,
                dashArray: '14, 14',
                dashOffset: '14'
            }
        },
        onEachFeature: (feature, layer) => {
            if (feature.geometry.type == 'LineString' || feature.geometry.type == 'MultiLineString') {
                const coords = layer.getLatLngs();

                let ty = '',
                    ic = 'circle-exclamation',
                    title = '*' + feature.properties.type + '* ' + feature.properties.location.hwy + (feature.properties.location.direction ? ' ' + feature.properties.location.direction : '') + ' @ MP' + feature.properties.location.milepost.start + (feature.properties.location.milepost.end ? ' - ' + feature.properties.location.milepost.end : '') + '\nIncident #' + feature.properties.id;

                if (feature.properties.type == 'Closure') {
                    ty = ' closure';
                    ic = 'do-not-enter';
                } else if (feature.properties.type == 'Crash') {
                    ty = ' crash';
                    ic = 'car-burst'
                }

                /*if (roadWork) {
                    ty = ' road-work';
                    ic = 'traffic-cone';
                }*/

                var a = L.polyline(coords, {
                    color: '#555',
                    weight: 5,
                    pane: 'poly',
                    title: title
                });

                /* if feature is not part of a multi polyline object */
                if (feature.geometry.type != 'MultiLineString') {
                    var b = L.marker(coords[0], {
                        pane: 'markers',
                        feature: feature,
                        title: title,
                        icon: L.divIcon({
                            className: 'incident' + ty,
                            html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + feature.properties.type + '</span>'
                        })
                    }).on('click', () => {
                        const data = feature.properties;

                        if (cloudBased) {
                            new Modal(data).incident();
                        } else {
                            App.incident(JSON.stringify(data));
                        }
                    });

                    var c = L.marker(coords[coords.length - 1], {
                        pane: 'markers',
                        title: title,
                        icon: L.divIcon({
                            feature: feature,
                            className: 'incident' + ty,
                            html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + feature.properties.type + '</span>'
                        })
                    }).on('click', () => {
                        const data = feature.properties;

                        if (cloudBased) {
                            new Modal(data).incident();
                        } else {
                            App.incident(JSON.stringify(data));
                        }
                    });

                    incidents.addLayer(b);
                    incidents.addLayer(c);
                } else {
                    for (let i = 0; i < coords.length; i++) {
                        var b = L.marker(coords[i][0], {
                            pane: 'markers',
                            feature: feature,
                            title: title,
                            icon: L.divIcon({
                                className: 'incident' + ty,
                                html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + feature.properties.type + '</span>'
                            })
                        }).on('click', () => {
                            const data = feature.properties;

                            if (cloudBased) {
                                new Modal(data).incident();
                            } else {
                                App.incident(JSON.stringify(data));
                            }
                        });

                        var c = L.marker(coords[i][coords[i].length - 1], {
                            pane: 'markers',
                            title: title,
                            icon: L.divIcon({
                                feature: feature,
                                className: 'incident' + ty,
                                html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + feature.properties.type + '</span>'
                            })
                        }).on('click', () => {
                            const data = feature.properties;

                            if (cloudBased) {
                                new Modal(data).incident();
                            } else {
                                App.incident(JSON.stringify(data));
                            }
                        });

                        incidents.addLayer(b);
                        incidents.addLayer(c);
                    }
                }

                incidents.addLayer(a);
            }

            layer.on('click', () => {
                const data = feature.properties;

                if (cloudBased) {
                    new Modal(data).incident();
                } else {
                    App.incident(JSON.stringify(data));
                }
            });
        },
        pointToLayer: (feature, latlng) => {
            let ty = '',
                ic = 'circle-exclamation';

            if (feature.properties.type == 'Closure') {
                ty = ' closure';
            } else if (feature.properties.type == 'Crash') {
                ty = ' crash';
                ic = 'car-burst';
            }

            return L.marker(latlng, {
                pane: 'markers',
                feature: feature,
                title: '*' + feature.properties.type + '* ' + feature.properties.location.hwy + (feature.properties.location.direction ? ' ' + feature.properties.location.direction : '') + ' @ MP' + feature.properties.location.milepost.start + (feature.properties.location.milepost.end ? ' - ' + feature.properties.location.milepost.end : '') + '\nIncident #' + feature.properties.id,
                icon: L.divIcon({
                    className: 'incident' + ty,
                    html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + feature.properties.type + '</span>'
                })
            });
        }
    });

    console.info(json.features.length + ' incidents reported by ODOT TOCs');
    incidents.addLayer(data);

    if (layers_incidents) {
        map.addLayer(incidents);
    }
}

function displayConstruction(json) {
    const data = L.geoJSON(json.features, {
        style: (feature) => {
            return {
                color: '#fff',
                weight: 4,
                dashArray: '14, 14',
                dashOffset: '14'
            }
        },
        onEachFeature: (feature, layer) => {
            if (feature.geometry.type == 'LineString') {
                const coords = layer.getLatLngs();

                let ty = ' road-work',
                    ic = 'traffic-cone',
                    fpt = (feature.properties.type == 'Road Maintenance Operations' ? 'Road Maint. Ops.' : feature.properties.type);

                var a = L.polyline(coords, {
                    color: '#555',
                    weight: 4
                });

                var b = L.marker(coords[0], {
                    pane: 'markers',
                    icon: L.divIcon({
                        className: 'incident' + ty,
                        html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + fpt + '</span>'
                    })
                }).on('click', () => {
                    const data = feature.properties;

                    if (cloudBased) {
                        new Modal(data).incident();
                    } else {
                        App.incident(JSON.stringify(data));
                    }
                });

                var c = L.marker(coords[coords.length - 1], {
                    pane: 'markers',
                    icon: L.divIcon({
                        className: 'incident' + ty,
                        html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + fpt + '</span>'
                    })
                }).on('click', () => {
                    const data = feature.properties;

                    if (cloudBased) {
                        new Modal(data).incident();
                    } else {
                        App.incident(JSON.stringify(data));
                    }
                });

                construction.addLayer(a);
                construction.addLayer(b);
                construction.addLayer(c);
            }

            layer.on('click', () => {
                const data = feature.properties;

                if (cloudBased) {
                    new Modal(data).incident();
                } else {
                    App.incident(JSON.stringify(data));
                }
            });
        },
        pointToLayer: (feature, latlng) => {
            let ty = ' road-work',
                ic = 'traffic-cone',
                fpt = (feature.properties.type == 'Road Maintenance Operations' ? 'Road Maint. Ops.' : feature.properties.type);

            return L.marker(latlng, {
                pane: 'markers',
                icon: L.divIcon({
                    className: 'incident' + ty,
                    html: '<div><i class="fas fa-' + ic + '" style="display:flex"></i></div><span>' + fpt + '</span>'
                })
            });
        }
    });

    construction.addLayer(data);

    if (layers_construction) {
        map.addLayer(construction);

        document.querySelectorAll('.leaflet-marker-icon.incident span').forEach((s) => {
            if (map.getZoom() >= 10) {
                if (s.style.display != 'block') {
                    s.style.display = 'block';
                }
            } else {
                if (s.style.display != 'none') {
                    s.style.display = 'none';
                }
            }
        });
    }
}

async function getIncidents() {
    if ((localStorage.getItem('incidents') == null || storageIsOld('incidents', 300)) || !useLocalStorage) {
        const resp = await fetch(apiURL + 'roads/incidents?key=' + key);

        if (resp.ok) {
            const json = await resp.text();

            if (useLocalStorage) {
                localStorage.setItem('incidents', json);
                localStorage.setItem('incidents_time', new Date().getTime());
            }
            displayIncidents(JSON.parse(json));
        }
    } else {
        displayIncidents(JSON.parse(localStorage.getItem('incidents')));
    }

    hideLoading();
}

async function getConstruction() {
    if ((localStorage.getItem('construction') == null || storageIsOld('construction', 300)) || !useLocalStorage) {
        const resp = await fetch(apiURL + 'roads/incidents/construction?key=' + key);

        if (resp.ok) {
            const json = await resp.text();

            if (useLocalStorage) {
                localStorage.setItem('construction', json);
                localStorage.setItem('construction_time', new Date().getTime());
            }
            displayConstruction(JSON.parse(json));
        }
    } else {
        displayConstruction(JSON.parse(localStorage.getItem('construction')));
    }

    hideLoading();
}

function displayTT(json) {
    const data = L.geoJSON(json.features, {
        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                pane: 'markers',
                icon: L.divIcon({
                    className: 'travel',
                    html: '<div><i class="fa-solid fa-clock"></i></div>',
                    iconAnchor: [0, 0]
                })
            }).on('click', () => {
                const data = feature.properties;

                if (cloudBased) {
                    new Modal(data).ttimes();
                }/* else {
                    App.ttimes(JSON.stringify(data));
                }*/
            });
        }
    });

    ttimes.addLayer(data);

    if (layers_ttimes) {
        map.addLayer(ttimes);
    }
}

async function getTT() {
    if ((localStorage.getItem('ttimes') == null || storageIsOld('ttimes', 300)) || !useLocalStorage) {
        const resp = await fetch(apiURL + 'roads/travel?key=' + key);

        if (resp.ok) {
            const json = await resp.text();

            if (useLocalStorage) {
                localStorage.setItem('ttimes', json);
                localStorage.setItem('ttimes_time', new Date().getTime());
            }
            displayTT(JSON.parse(json));
        }
    } else {
        displayTT(JSON.parse(localStorage.getItem('ttimes')));
    }

    hideLoading();
}

function displayDMS(json) {
    const data = L.geoJSON(json.features, {
        pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
                pane: 'markers',
                title: '*DMS* ' + feature.properties.name,
                icon: L.divIcon({
                    className: 'vms',
                    html: '<div>' + feature.properties.messages[0][0] + '<br>' + feature.properties.messages[0][1] + '<br>' + feature.properties.messages[0][2] + '</div>',
                    iconAnchor: [0, 0]
                })
            }).on('click', () => {
                const data = feature.properties;

                if (cloudBased) {
                    new Modal(data).vms();
                } else {
                    App.vms(JSON.stringify(data));
                }
            });
        }
    });

    vms.addLayer(data);

    if (layers_vms) {
        map.addLayer(vms);
    }
}

async function getDMS() {
    if ((localStorage.getItem('dms') == null || storageIsOld('dms', 1200)) || !useLocalStorage) {
        const resp = await fetch(apiURL + 'roads/dms?key=' + key);

        if (resp.ok) {
            const json = await resp.text();

            if (useLocalStorage) {
                localStorage.setItem('dms', json);
                localStorage.setItem('dms_time', new Date().getTime());
            }
            displayDMS(JSON.parse(json));
        }
    } else {
        displayDMS(JSON.parse(localStorage.getItem('dms')));
    }

    hideLoading();
}

function startRadar() {
    const rc = document.querySelector('.radar-controls');
    radarCount = 0;

    try {
        radarInit.radar.past.forEach(function (r, n) {
            var url = 'https://tilecache.rainviewer.com' + r.path + '/256/{z}/{x}/{y}/4/0_1.png';

            var l = L.tileLayer(url, {
                id: 'Radar',
                time: r.time,
                sequence: n,
                opacity: 0
            })
                .addTo(map);

            radarImgs.push(l);

            if (webApp && n == 1) {
                rc.style.display = 'flex';
            }
        });

        radarLoop = setInterval(function () {
            if (isRadarPaused === false) {
                var d = new Date(radarImgs[radarCount].options.time * 1000),
                    t = (webApp ? dow[d.getDay()].substring(0, 3) + ' ' : '') + (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M'/*,
                    utc = (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':' + (d.getUTCMinutes() < 10 ? '0' : '') + d.getUTCMinutes() + 'Z'*/;

                radarImgs[radarCount].setOpacity(0.8);

                if (webApp) {
                    document.querySelector('.radar-controls #radarTime').value = radarCount;
                    document.querySelector('.radar-controls #time').innerHTML = t/* + '/' + utc*/;
                }

                for (var i = 0; i < radarImgs.length; i++) {
                    if (i != radarCount) {
                        radarImgs[i].setOpacity(0);
                    }
                }
                radarCount++;

                if (radarCount == radarImgs.length) {
                    isRadarPaused = true;
                    setTimeout(function () {
                        isRadarPaused = false;
                    }, 500);
                    radarCount = 0;
                }
            }
        }, 450);
    } catch (e) {
        console.error(e.message);
    }
}

async function getRadarAPI() {
    if (!radarInit || ((new Date().getTime() / 1000) - radarInit.radar.past[12].time / 60) > 10) {
        const resp = await fetch('https://api.rainviewer.com/public/weather-maps.json');

        if (resp.ok) {
            radarInit = await resp.json();
            startRadar();
        }
    } else {
        startRadar();
    }
}

function saveLoc() {
    const arr = {
        'lat': map.getCenter().lat,
        'lon': map.getCenter().lng,
        'z': map.getZoom()
    };

    if (cloudBased && webApp) {
        new Geo(map.getCenter().lat, map.getCenter().lng, map.getZoom()).saveLocation();
    } else {
        App.saveLocation(JSON.stringify(arr));
    }
}

function initialize() {
    /*if (typeof layers_roads !== 'undefined' &&
        typeof layers_rwis !== 'undefined' &&
        typeof layers_incidents !== 'undefined' &&
        typeof layers_webcams !== 'undefined' &&
        typeof layers_traffic !== 'undefined' &&
        typeof layers_construction !== 'undefined' &&
        typeof layers_vms !== 'undefined' &&
        typeof useMapCaching !== 'undefined') {
        initial = true;
        clearInterval(ref);*/

    if (localStorage.getItem('map_lat')) {
        var mc = [localStorage.getItem('map_lat'), localStorage.getItem('map_lon')],
            mz = localStorage.getItem('map_zoom');
    } else {
        var mc = [44.10337, -120.5542],
            mz = 7;
    }

    map = L.map('map', {
        center: mc,
        zoom: mz,
        doubleClickZoom: true,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        renderer: L.canvas({
            tolerance: 15
        })
    })
        .on('load', () => {
            document.querySelector('#loading span').innerHTML = 'Getting road conditions...';
        })
        .on('zoomstart', (e) => {
            moving = true;
        })
        .on('movestart', (e) => {
            moving = true;
        })
        .on('moveend', (e) => {
            saveLoc();
            moving = false;
        })
        .on('zoomend', (e) => {
            saveLoc();
            moving = false;

            document.querySelectorAll('.leaflet-marker-icon.incident span').forEach((s) => {
                if (map.getZoom() >= 10) {
                    if (s.style.display != 'block') {
                        s.style.display = 'block';
                    }
                } else {
                    if (s.style.display != 'none') {
                        s.style.display = 'none';
                    }
                }
            });
        });

    map.createPane('poly');
    map.createPane('markers');

    map.getPane('poly').style.zIndex = 600;
    map.getPane('markers').style.zIndex = 601;

    if (!cloudBased) {
        App.changeUserLocation();
    }

    /*https://api.mapbox.com/styles/v1/mapollc/cloq1q2jo005101r6crxw3z0v/tiles/256/{z}/{x}/{y}@2x?access_token={token}*/
    basemap = L.tileLayer(host + 'assets/images/tiles/5/{z}/{x}/{y}.png', {
        tileSize: 256,
        attribution: '&copy; ' + new Date().getFullYear() + ' Mapbox',
        token: mapboxToken,
        useCache: false/*useMapCaching*/
    }).addTo(map);

    traffic = L.tileLayer('https://api.mapbox.com/styles/v1/mapollc/cloq47dre005e01r6gnn92v3h/tiles/256/{z}/{x}/{y}@2x?access_token={token}', {
        tileSize: 256,
        attribution: '&copy; ' + new Date().getFullYear() + ' Mapbox',
        token: mapboxToken
    });

    if (layers_traffic) {
        map.addLayer(traffic);
    }

    getRoads();
    getWebcams();
    getRWIS();
    getIncidents();
    getDMS();
    getConstruction();

    document.querySelector('.zoom-controls button.zoom-in').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1);
    });

    document.querySelector('.zoom-controls button.zoom-out').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1);
    });
    /*}*/
}

window.addEventListener('load', () => {
    if (windowHost == 'localhost' || windowHost == 'www.mapotechnology.com' || webApp) {
        initialize();
    }
});

/*if (!initial) {
    ref = setInterval(() => {
        initialize();
    }, 500);
}*/

if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        value: function (callback, type, quality) {
            var dataURL = this.toDataURL(type, quality).split(",")[1];
            setTimeout(function () {
                var binStr = atob(dataURL),
                    len = binStr.length,
                    arr = new Uint8Array(len);

                for (var i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback(new Blob([arr], { type: type || "image/png" }));
            });
        }
    });
}

L.TileLayer.addInitHook(function () {
    if (!this.options.useCache) {
        this._db = null;
        return;
    }

    this._db = new PouchDB("offline-tiles");
});

L.TileLayer.prototype.options.useCache = false;
L.TileLayer.prototype.options.saveToCache = true;
L.TileLayer.prototype.options.useOnlyCache = false;
L.TileLayer.prototype.options.cacheFormat = "image/png";
L.TileLayer.prototype.options.cacheMaxAge = 60 * 60 * 24 * 30 * 1000;

L.TileLayer.include({
    createTile: function (coords, done) {
        var tile = document.createElement("img");

        tile.onerror = L.bind(this._tileOnError, this, done, tile);

        if (this.options.crossOrigin) {
            tile.crossOrigin = "";
        }

        tile.alt = "";

        var tileUrl = this.getTileUrl(coords);

        if (this.options.useCache) {
            this._db.get(
                tileUrl,
                { revs_info: true },
                this._onCacheLookup(tile, tileUrl, done)
            );
        } else {
            tile.onload = L.bind(this._tileOnLoad, this, done, tile);
            tile.src = tileUrl;
        }

        return tile;
    },

    _onCacheLookup: function (tile, tileUrl, done) {
        return function (err, data) {
            if (data) {
                return this._onCacheHit(tile, tileUrl, data, done);
            } else {
                return this._onCacheMiss(tile, tileUrl, done);
            }
        }.bind(this);
    },

    _onCacheHit: function (tile, tileUrl, data, done) {
        this.fire("tilecachehit", {
            tile: tile,
            url: tileUrl,
        });

        this._db.getAttachment(tileUrl, "tile").then(
            function (blob) {
                var url = URL.createObjectURL(blob);

                if (Date.now() > data.timestamp + this.options.cacheMaxAge && !this.options.useOnlyCache) {
                    if (this.options.saveToCache) {
                        tile.onload = L.bind(
                            this._saveTile,
                            this,
                            tile,
                            tileUrl,
                            data._revs_info[0].rev,
                            done
                        );
                    }
                    tile.crossOrigin = "Anonymous";
                    tile.src = tileUrl;
                    /*tile.onerror = function (ev) {
                        this.src = url;
                    };*/
                } else {
                    tile.onload = L.bind(this._tileOnLoad, this, done, tile);
                    tile.src = url;
                }
            }.bind(this)
        );
    },

    _onCacheMiss: function (tile, tileUrl, done) {
        this.fire("tilecachemiss", {
            tile: tile,
            url: tileUrl,
        });
        if (this.options.useOnlyCache) {
            tile.onload = L.Util.falseFn;
            tile.src = L.Util.emptyImageUrl;
        } else {
            if (this.options.saveToCache) {
                tile.onload = L.bind(
                    this._saveTile,
                    this,
                    tile,
                    tileUrl,
                    undefined,
                    done
                );
            } else {
                tile.onload = L.bind(this._tileOnLoad, this, done, tile);
            }
            tile.crossOrigin = "Anonymous";
            tile.src = tileUrl;
        }
    },

    _saveTile: function (tile, tileUrl, existingRevision, done) {
        if (!this.options.saveToCache) {
            return;
        }

        var canvas = document.createElement("canvas");
        canvas.width = tile.naturalWidth || tile.width;
        canvas.height = tile.naturalHeight || tile.height;

        var context = canvas.getContext("2d");
        context.drawImage(tile, 0, 0);

        var format = this.options.cacheFormat;

        canvas.toBlob(
            function (blob) {
                this._db
                    .put({
                        _id: tileUrl,
                        _rev: existingRevision,
                        timestamp: Date.now(),
                    })
                    .then(
                        function (status) {
                            return this._db.putAttachment(
                                tileUrl,
                                "tile",
                                status.rev,
                                blob,
                                format
                            );
                        }.bind(this)
                    )
                    .then(function (resp) {
                        if (done) {
                            done();
                        }
                    })
                    .catch(function () {
                        if (done) {
                            done();
                        }
                    });
            }.bind(this),
            format
        );
    },

    seed: function (bbox, minZoom, maxZoom) {
        if (!this.options.useCache) return;
        if (minZoom > maxZoom) return;
        if (!this._map) return;

        var queue = [];

        for (var z = minZoom; z <= maxZoom; z++) {
            // Geo bbox to pixel bbox (as per given zoom level)...
            var northEastPoint = this._map.project(bbox.getNorthEast(), z);
            var southWestPoint = this._map.project(bbox.getSouthWest(), z);

            // Then to tile coords bounds, as per GridLayer
            var tileBounds = this._pxBoundsToTileRange(
                L.bounds([northEastPoint, southWestPoint])
            );

            for (var j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
                for (var i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                    var point = new L.Point(i, j);
                    point.z = z;
                    queue.push(this._getTileUrl(point));
                }
            }
        }

        var seedData = {
            bbox: bbox,
            minZoom: minZoom,
            maxZoom: maxZoom,
            queueLength: queue.length,
        };
        this.fire("seedstart", seedData);
        var tile = this._createTile();
        tile._layer = this;
        this._seedOneTile(tile, queue, seedData);
        return this;
    },

    _createTile: function () {
        return document.createElement("img");
    },

    _getTileUrl: function (coords) {
        var zoom = coords.z;
        if (this.options.zoomReverse) {
            zoom = this.options.maxZoom - zoom;
        }
        zoom += this.options.zoomOffset;
        return L.Util.template(
            this._url,
            L.extend(
                {
                    r:
                        this.options.detectRetina &&
                            L.Browser.retina &&
                            this.options.maxZoom > 0
                            ? "@2x"
                            : "",
                    s: this._getSubdomain(coords),
                    x: coords.x,
                    y: this.options.tms
                        ? this._globalTileRange.max.y - coords.y
                        : coords.y,
                    z: this.options.maxNativeZoom
                        ? Math.min(zoom, this.options.maxNativeZoom)
                        : zoom,
                },
                this.options
            )
        );
    },

    _seedOneTile: function (tile, remaining, seedData) {
        if (!remaining.length) {
            this.fire("seedend", seedData);
            return;
        }
        this.fire("seedprogress", {
            bbox: seedData.bbox,
            minZoom: seedData.minZoom,
            maxZoom: seedData.maxZoom,
            queueLength: seedData.queueLength,
            remainingLength: remaining.length,
        });

        var url = remaining.shift();

        this._db.get(
            url,
            function (err, data) {
                if (!data) {
                    tile.onload = function (ev) {
                        this._saveTile(tile, url, null);
                        this._seedOneTile(tile, remaining, seedData);
                    }.bind(this);
                    tile.crossOrigin = "Anonymous";
                    tile.src = url;
                } else {
                    this._seedOneTile(tile, remaining, seedData);
                }
            }.bind(this)
        );
    },
});