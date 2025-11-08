var map,
    host = 'https://www.mapofire.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    token = '50e2c43f8f63ff0ed20127ee2487f15e',
    mc = document.querySelector('#map'),
    mapLat = mc.getAttribute('data-lat'),
    mapLon = mc.getAttribute('data-lon'),
    firstPermLoad = true,
    perimeters = L.featureGroup(),
    attrib = '&copy;&nbsp;' + new Date().getFullYear() + '&nbsp;MAPO LLC',
    pOBJECTID = [],
    terrain,
    osm,
    satellite,
    caltopo,
    fs16,
    shading,
    outdoors,
    usgs,
    carto,
    faa,
    darkCanvas,
    tile;

async function doAIRQ(a, b) {
    const fd = new FormData(),
        airQuality = document.querySelector('#airq');

    fd.append('where', '1=1');
    fd.append('geometry', '{"spatialReference":{"wkid":4326}, "x": ' + b + ', "y": ' + a + '}');
    fd.append('geometryType', 'esriGeometryPoint');
    fd.append('spatialRel', 'esriSpatialRelIntersects');
    fd.append('inSR', 4326);
    fd.append('outSR', 4326);
    fd.append('distance', 40);
    fd.append('units', 'esriSRUnit_StatuteMile');
    fd.append('outFields', 'AQSID,SiteName,LocalTimeString,PM25_AQI,PM25');
    fd.append('returnGeometry', false);
    fd.append('f', 'json');

    await fetch('https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air_Now_Current_Monitors_PM/FeatureServer/0/query', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const r = await resp.json();

        if (r == null || r.features.length == 0) {
            airQuality.innerHTML = 'N/A';
        } else {
            for (var i = 0; i < r.features.length; i++) {
                var q = r.features[i].attributes,
                    aq = q.PM25_AQI;

                if (aq != null) {
                    var l = '',
                        hm = '',
                        c = airQColor(aq);

                    if (aq <= 50) {
                        l = 'Good';
                        hm = 'Air quality is satisfactory, and air pollution poses little or no risk.';
                    } else if (aq > 50 && aq <= 100) {
                        l = 'Moderate';
                        hm = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
                    } else if (aq > 100 && aq <= 150) {
                        l = 'Unhealthy for Sensitive Groups';
                        hm = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
                    } else if (aq > 150 && aq <= 200) {
                        l = 'Unhealthy';
                        hm = 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
                    } else if (aq > 200 && aq <= 300) {
                        l = 'Very Unhealthy';
                        hm = 'Health alert: The risk of health effects is increased for everyone.';
                    } else if (aq > 300) {
                        l = 'Hazardous';
                        hm = 'Health warning of emergency conditions: everyone is more likely to be affected.';
                    }

                    airQuality.innerHTML = '<div class="airQ" data-id="' + q.AQSID + '" title="' + l + ': ' + hm + '" style="background-color:' + c + (aq >= 150 ? ';color:#fff' : '') + '">' + l + '</div>';

                    break;
                }
            }
        }
    });
}

async function doDrought(a, b) {
    const fd = new FormData(),
        drought = document.querySelector('#drought');

    fd.append('where', '1=1');
    fd.append('geometry', '{"x": ' + b + ', "y": ' + a + '}');
    fd.append('geometryType', 'esriGeometryPoint');
    fd.append('inSR', 4326);
    fd.append('outFields', 'dm');
    fd.append('returnGeometry', false);
    fd.append('f', 'json');

    await fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3/query', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const d = await resp.json();

        if (d.features.length > 0) {
            var c = d.features[0].attributes.dm,
                out = '',
                color = '';

            if (c == 0) {
                out = 'Dry';
                color = 'rgb(240 223 166)';
            } else if (c == 1) {
                out = 'Moderate';
                color = 'rgb(237 201 123)';
            } else if (c == 2) {
                out = 'Severe';
                color = 'rgb(235 149 80)';
            } else if (c == 3) {
                out = 'Extreme';
                color = 'rgb(217 77 35)';
            } else if (c == 4) {
                out = 'Exceptional';
                color = 'rgb(153 0 0)';
            }

            drought.style.color = color;
            drought.innerHTML = out;
        } else {
            drought.innerHTML = 'None';
        }
    });
}

function nwsTime(s) {
    return new Date(s).toString();
}

async function alerts(a, b) {
    await fetch('https://api.weather.gov/points/' + a + ',' + b)
        .then(async (resp) => {
            const data = await resp.json(),
                zone = data.properties.fireWeatherZone.match(/([A-Z]{2})Z([0-9]{3})/)[0];

            await fetch('https://api.weather.gov/alerts/active/zone/' + zone)
                .then(async (resp) => {
                    const wwa = await resp.json();
                    let re = '';

                    if (wwa.features.length > 0) {
                        wwa.features.forEach((a) => {
                            if (a.properties.event == 'Red Flag Warning' || a.properties.event == 'Fire Weather Watch') {
                                re += '<p>A <a target="blank" href="https://alerts-v2.weather.gov/#/?id=' + a.properties.id + '">' + a.properties.event + '</a> is in effect until ' + a.properties.headline.split(' until')[1].replace(/:[0-9]+AM|PM/g, function (m) {
                                    return ' ' + m[0] + m[1];
                                }) + '</p>';
                            }
                        });

                        if (re != '') {
                            document.querySelector('#notifications').innerHTML = re;
                            document.querySelector('#notifications').style.display = 'block';
                        }
                    }
                });
        });
}

function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

async function incidentWX(a, b) {
    const fd = new FormData();
    fd.append('radius', a + ',' + b + ',30');
    fd.append('latest', 1);

    await fetch(apiUrl + 'weather/nearby?key=' + token, {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const wx = await resp.json();

        if (wx.weather) {
            var o = wx.weather.obs,
                name = wx.weather.name,
                t = (o.temp.current ? Math.round(o.temp.current) : '--'),
                rh = (o.rh ? Math.round(o.rh) : '--'),
                wd = (o.wind_dir ? o.wind_dir : '--'),
                ws = (o.wind_speed ? Math.round(o.wind_speed) : '--'),
                u = timeAgo(wx.weather.updated),
                /*d = distance(a, b, wx.weather.lat, wx.weather.lon),*/
                prox,
                pc;

            if (settings.weather && settings.weather.temp == 'c' && t != '--') {
                t = FtoC(t) + '&deg;C';
            } else {
                t += '&deg;F';
            }

            if (settings.weather && settings.weather.wind != 'mph' && ws != '--') {
                ws = speed(ws, settings.weather.wind) + ' ' + settings.weather.wind;
            } else {
                ws += ' mph';
            }

            /*if (d <= 10) {
                prox = '';
                pc = 'green';
            } else if (d > 10 && d <= 20) {
                prox = '-good';
                pc = 'yellow';
            } else {
                prox = '-weak';
                pc = 'red';
            }*/

            const a = document.querySelector('#curwx #a'),
                b = document.querySelector('#curwx #b'),
                c = document.querySelector('#curwx #c'),
                d = document.querySelector('#curwx #d');

            a.classList.remove('placeholder');
            a.style.height = 'unset';
            a.style.width = 'unset';
            b.classList.remove('placeholder');
            b.style.height = 'unset';
            b.style.width = 'unset';
            c.classList.remove('placeholder');
            c.style.height = 'unset';
            c.style.width = 'unset';
            d.classList.remove('placeholder');
            d.style.height = 'unset';
            d.style.width = 'unset';

            a.innerHTML = t;
            b.innerHTML = (!o.rh || rh == '--' ? '--' : rh + '%');
            c.innerHTML = (wd == 'V' && ws == '-- mph' ? '--' : wd + '/' + ws);
            d.innerHTML = 'Last report ' + u + ' @ ' + name;
        } else {
            document.querySelector('#curwx').innerHTML = '<div class="errormsg">No current weather conditions are available at this time.</div>';
        }
    });
}

async function incidentForecast(a, b) {
    var temp = [],
        rh = [],
        wind = [];

    await fetch('https://api.weather.gov/points/' + parseFloat(a).toFixed(4) + '000000,' + parseFloat(b).toFixed(4) + '0000')
        .then(async (resp) => {
            const a = await resp.json();

            await fetch(a.properties.forecastGridData)
                .then(async (resp) => {
                    const data = await resp.json();

                    for (var i = 0; i < data.properties.temperature.values.length; i++) {
                        var t = new Date(data.properties.temperature.values[i].validTime.split('/')[0]).getTime();

                        if (t >= new Date().getTime() && (t - new Date().getTime()) < 86400000) {
                            temp.push(data.properties.temperature.values[i].value);
                            rh.push(data.properties.relativeHumidity.values[i].value);
                            if (data.properties.transportWindSpeed.values[i]) {
                                wind.push(data.properties.transportWindSpeed.values[i].value);
                            }
                        }
                    }

                    var a = Math.round((Math.max.apply(null, temp) * 1.8) + 32),
                        b = Math.min.apply(null, rh),
                        c = Math.round((wind.reduce((partialSum, a) => partialSum + a, 0) / wind.length) / 1.609),
                        d = Math.round(Math.max.apply(null, wind) / 1.609);

                    rating(a, b, c, d);

                    if (settings.weather && settings.weather.temp == 'c') {
                        a = FtoC(a) + '&deg;C';
                    } else {
                        a += '&deg;F';
                    }

                    if (settings.weather && settings.weather.wind != 'mph') {
                        c = speed(c, settings.weather.wind) + ' ' + settings.weather.wind;
                        d = speed(d, settings.weather.wind) + ' ' + settings.weather.wind;
                    } else {
                        c += ' mph';
                        d += ' mph';
                    }

                    const e = document.querySelector('#wxcon #e'),
                        f = document.querySelector('#wxcon #f'),
                        g = document.querySelector('#wxcon #g'),
                        h = document.querySelector('#wxcon #h'),
                        ii = document.querySelector('#wxcon #i');

                    e.classList.remove('placeholder');
                    e.style.height = 'unset';
                    e.style.width = 'unset';
                    f.classList.remove('placeholder');
                    f.style.height = 'unset';
                    f.style.width = 'unset';
                    g.classList.remove('placeholder');
                    g.style.height = 'unset';
                    g.style.width = 'unset';
                    h.classList.remove('placeholder');
                    h.style.height = 'unset';
                    h.style.width = 'unset';
                    ii.classList.remove('placeholder');
                    ii.style.height = 'unset';
                    ii.style.width = 'unset';

                    e.innerHTML = a;
                    f.innerHTML = b + '%';
                    g.innerHTML = (c.toString() == 'NaN mph' ? '--' : c);
                    h.innerHTML = (d.toString() == '-Infinity mph' ? '--' : d);
                    ii.innerHTML = 'Last forecasted ' + timeAgo(new Date(data.properties.updateTime).getTime() / 1000);
                })
                .catch(() => {
                    document.querySelector('#wxcon').innerHTML = '<div class="errormsg">Incident weather forecast is not available at this time.</div>';
                });
        });
}

async function loadPerimeters() {
    let y = (settings.archive ? settings.archive : new Date().getFullYear()),
        min = settings.perimeters.minSize,
        ms = new Date().getTime(),
        pc = '',
        fd = new FormData(),
        w,
        o;

    switch (settings.perimeters.color) {
        case 'default':
        case 'red':
            pc = '#f35a5a';
            break;
        case 'blue':
            pc = '#3289d5';
            break;
        case 'orange':
            pc = '#fb8c00';
            break;
        case 'green':
            pc = '#388e3c';
            break;
        case 'purple':
            pc = '#9c27b0';
            break;
        case 'brown':
            pc = '#795548';
            break;
        case 'black':
            pc = '#333';
            break;
    }

    if (settings.archive) {
        w = 'FEATURE_CA <> \'Wildfire\' AND FIRE_YEAR=' + settings.archive;
        o = 'OBJECTID,UNQE_FIRE_ID,INCIDENT,GIS_ACRES,DATE_CUR';
    } else {
        w = 'attr_FireDiscoveryDateTime>=TIMESTAMP \'' + y + '-01-01 00:00:00\' AND attr_FireDiscoveryDateTime<=TIMESTAMP \'' + y + '-12-31 23:59:59\' AND (poly_GISAcres > ' + min + ' OR poly_Acres_AutoCalc > ' + min + ') AND attr_FireOutDateTime IS NULL';
        o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_FireOutDateTime';
    }

    fd.append('where', w);
    fd.append('outFields', o);
    fd.append('geometry', getbbox());
    fd.append('geometryPrecision', 6);
    fd.append('returnGeometry', true);
    fd.append('f', 'geojson');

    await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/' + (settings.archive ? 'InterAgencyFirePerimeterHistory_All_Years_View' : 'WFIGS_Interagency_Perimeters') + '/FeatureServer/0/query', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        if (data.features) {
            var p = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        weight: 2,
                        color: pc,
                        opacity: 0.8,
                        fillOpacity: 0.35
                    }
                },
                onEachFeature: function (feature, layer) {
                    var fp = feature.properties,
                        fn = (settings.archive ? ucwords(fp.INCIDENT.toLowerCase()) + ' Fire' : (fp.poly_IncidentName ? ucwords(fp.poly_IncidentName.toLowerCase()) + ' Fire' : fireName(fp.irwin_IncidentName)));

                    pOBJECTID.push(fp.OBJECTID);

                    if (settings.archive) {
                        var gt = fp.DATE_CUR.substr(4, 2) + '/' + fp.DATE_CUR.substr(6, 2) + '/' + fp.DATE_CUR.substr(0, 4),
                            DATE_CUR = new Date(gt).getTime();
                    }

                    layer.on('click', function () {
                        if (settings.perimeters.zoom != '0') {
                            map.fitBounds(layer.getBounds());
                        }
                    }).on('mouseover', function () {
                        this.setStyle({
                            opacity: 0.95,
                            weight: layer.options.weight + 1
                        });
                    }).on('mouseout', function () {
                        this.setStyle({
                            opacity: 0.8,
                            weight: layer.options.weight - 1
                        });
                    }).bindPopup(popup('<i class="fas fa-location-dot" style="padding-right:8px"></i>' + fn,
                        '<span style="display:block;margin:15px;text-align:center;font-weight:100;font-size:25px;">' + numberFormat((settings.archive ? fp.GIS_ACRES : (fp.poly_GISAcres ? fp.poly_GISAcres : fp.poly_Acres_AutoCalc)), 0) +
                        ' acres</span><small style="display:block;text-align:center;font-style:italic;line-height:1.2">Last mapped ' + timeAgo((settings.archive ? DATE_CUR : fp.poly_DateCurrent) / 1000) + (settings.archive ? (fp.MAP_METHOD ? ' using ' + fp.MAP_METHOD : '') : (fp.poly_MapMethod ? ' using ' + fp.poly_MapMethod : '')) + '</small>'), {
                        className: 'fire-popup',
                        minWidth: 250,
                        maxWidth: 250
                    });

                    if (settings.perimeters.ttip == 1) {
                        layer.bindTooltip(fn, {
                            sticky: true
                        });
                    }
                },
                filter: function (feature) {
                    return (pOBJECTID.indexOf(feature.properties.OBJECTID) < 0 && feature.properties.poly_IncidentName.search('Fire') <= 0 ? true : false);
                }
            });

            perimeters.addLayer(p);

            if (firstPermLoad) {
                perimeters.getLayers().forEach((l) => {
                    l.getLayers().forEach((p) => {
                        var prop = p.feature.properties;

                        if (prop.attr_UniqueFireIdentifier == uqid || (prop.poly_IncidentName.toLowerCase().search(fn.toLowerCase()) >= 0 || prop.attr_IncidentName.toLowerCase().search(fn.toLowerCase()) >= 0)) {
                            map.fitBounds(p.getBounds());
                        }
                    });
                });

                firstPermLoad = false;
            }
        }

        map.addLayer(perimeters);
    });
}

function addIcon(t, d, u, ac, status, notes) {
    var m = L.marker([mapLat, mapLon], {
        icon: fireIcon(t, d, u, ac, status, notes)
    })
        .addTo(map);

    map.setView([mapLat, mapLon], 9);
}

function init() {
    terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        id: 'Terrain',
        minZoom: 3,
        maxZoom: 18,
        attribution: attrib
    });

    satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        id: 'Hybrid Satellite',
        minZoom: 3,
        maxZoom: 20,
        attribution: attrib
    });

    osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        id: 'OSM',
        minZoom: 0,
        maxZoom: 19,
        attribution: attrib
    });

    /*https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png*/
    caltopo = L.tileLayer('https://caltopo.com/tile/t/{z}/{x}/{y}.png', {
        id: 'USFS 2016',
        minZoom: 5,
        maxZoom: 16,
        attribution: attrib
    });

    fs16 = L.tileLayer('https://ctusfs.s3.amazonaws.com/2016a/{z}/{x}/{y}.png', {
        id: 'USFS 2016',
        minZoom: 5,
        maxZoom: 16,
        attribution: 'Tiles &copy; <a href="https://caltopo.com">CalTopo</a>'
    });

    shading = L.tileLayer('https://caltopo.com/tile/hs_m315z45s3/{z}/{x}/{y}.png', {
        id: 'CalTopo Shading',
        minZoom: 5,
        maxZoom: 16,
        opacity: 0.4
    })/*;

    outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/mapollc/clnnpsgob00st01pv20978ob9/tiles/256/{z}/{x}/{y}?access_token={token}', {
        id: 'Mapbox Outdoors v12',
        minZoom: 1,
        maxZoom: 20,
        tileSize: 256,
        token: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
        attribution: 'Tiles &copy; <a href="https://mapbox.com">Mapbox</a>'
    })*/;

    usgs = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        id: 'USGS',
        minZoom: 3,
        maxZoom: 18,
        attribution: 'Tiles &copy; <a href="https://usgs.gov">USGS</a>'
    });

    carto = L.tileLayer('https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {
        id: 'CartoDB',
        minZoom: 3,
        maxZoom: 18,
        attribution: 'Tiles &copy; <a href="https://cartodb.com">CartoDB</a>'
    });

    faa = L.tileLayer('https://maps.iflightplanner.com/Maps/Tiles/Sectional/Z{z}/{y}/{x}.png', {
        id: 'FAA',
        minZoom: 6,
        maxZoom: 10,
        attribution: 'Tiles &copy; <a href="https://iflightplanner.com/">iFLightPlanner</a>'
    });

    darkCanvas = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        id: 'Dark Gray Canvas',
        minZoom: 3,
        maxZoom: 18,
        attribution: attrib
    });

    if (settings.tile) {
        switch (settings.tile) {
            case 'terrain': tile = terrain; break;
            case 'satellite': tile = satellite; break;
            case 'outdoors': tile = outdoors; break;
            case 'caltopo': tile = caltopo; break;
            case 'fs16': tile = fs16; break;
            case 'usgs': tile = usgs; break;
            case 'carto': tile = carto; break;
            case 'faa': tile = faa; break;
            case 'open street map': tile = osm; break;
        }
    } else {
        tile = terrain;
    }

    map = L.map('map', {
        preferCanvas: true,
        renderer: L.canvas(),
        zoomControl: false,
        dragging: !L.Browser.mobile,
        touchZoom: true,
        scrollWheelZoom: (window.outerWidth > 690 ? true : false),
        gestureHandling: false,
        attributionControl: false,
        center: settings.center,
        zoom: settings.zoom,
        layers: tile
    }).on('load', function () {
        loadPerimeters();
    }).on('moveend', function () {
        loadPerimeters();
    });

    L.control.layers({
        'Terrain': terrain,
        'Open Street Map': osm,
        'Satellite': satellite,
        'CalTopo': caltopo,
        'USFS 2016': fs16,
        'Outdoors': outdoors,
        'USGS': usgs,
        'Carto': carto,
        'FAA Sectional': faa,
        'Dark Canvas': darkCanvas
    }).addTo(map);

    addIcon(t, d, u, acres(ac), fireStatus(status), notes);
    /*doDrought(mapLat, mapLon);*/
    alerts(mapLat, mapLon);
    doAIRQ(mapLat, mapLon);

    if (y == new Date().getFullYear()) {
        incidentWX(mapLat, mapLon);
        incidentForecast(mapLat, mapLon);
    }
}

window.onload = () => {
    if (settings.coordsDisplay != 'dec') {
        document.querySelector('#coords').innerHTML = coords(mapLat, mapLon);
    }
};

if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
}

document.addEventListener('click', (e) => {
    if (e.target.id == 'rtm') {
        if (window.opener == null) {
            window.location.href = host;
        } else {
            window.close();
        }
    }

    if (e.target.id == 'airQ') {
        window.open('https://tools.airfire.org/monitor-data-report/v4/report?databaseversion=4.0&webserviceapi=4.0&monitors=' + e.target.getAttribute('data-id') + '_01');
    }
});