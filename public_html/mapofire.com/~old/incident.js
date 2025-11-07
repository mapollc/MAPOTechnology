var map,
    terrain,
    host = 'https://www.mapofire.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    token = '50e2c43f8f63ff0ed20127ee2487f15e',
    mc = $('#map'),
    mapLat = mc.attr('data-lat'),
    mapLon = mc.attr('data-lon'),
    firstPermLoad = true,
    perimeters = L.featureGroup(),
    pOBJECTID = [];

function doAIRQ(a, b) {
    $.ajax({
        url: 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air_Now_Current_Monitors_PM/FeatureServer/0/query',
        method: 'POST',
        data: {
            where: '1=1',
            geometry: '{"spatialReference":{"wkid":4326}, "x": ' + b + ', "y": ' + a + '}',
            geometryType: 'esriGeometryPoint',
            spatialRel: 'esriSpatialRelIntersects',
            inSR: 4326,
            outSR: 4326,
            distance: 40,
            units: 'esriSRUnit_StatuteMile',
            outFields: 'AQSID,SiteName,LocalTimeString,PM25_AQI,PM25',
            returnGeometry: false,
            f: 'json'
        },
        success: function (r) {
            if (r == null || r.features.length == 0) {
                $('#airq').html('N/A');
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

                        $('#airq').html('<div class="airQ" title="' + l + ': ' + hm + '" style="background-color:' + c + (aq >= 150 ? ';color:#fff' : '') + '">' + aq + '</div>');

                        break;
                    }
                }
            }
        }
    });
}

function doDrought(a, b) {
    $.ajax({
        url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3/query',
        method: 'POST',
        data: {
            where: '1=1',
            geometry: '{"x": ' + b + ', "y": ' + a + '}',
            geometryType: 'esriGeometryPoint',
            inSR: 4326,
            outFields: 'dm',
            returnGeometry: false,
            f: 'json'
        },
        success: function (d) {
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

                $('#drought').css('color', color).html(out);
            } else {
                $('#drought').html('None');
            }
        }
    });
}

function isInt(n) {
    return Number(n) === n && n % 1 === 0;
}

function rating(t, rh, avg, max) {
    var a = (t <= 67 ? 1 : ((t > 67 && t <= 82) ? 2 : 3)),
        b = (t >= 25 ? 1 : ((t >= 16 && t < 25) ? 2 : 3)),
        c = (t <= 15 ? 1 : ((t > 15 && t <= 24) ? 2 : 3)),
        d = (t <= 15 ? 1 : ((t > 15 && t <= 24) ? 2 : 3)),
        z = (a + b + c + d) / 4,
        rating = (z < 2 ? 'Neutral or Suppressed' : (z >= 2 && z < 3 ? 'Elevated' : 'Critical/Extreme')) + ' Fire Conditions';

    console.info('Weather rating: ' + rating);
}

function incidentWX(a, b) {
    $.ajax({
        url: apiUrl + 'weather/nearby',
        method: 'POST',
        data: {
            key: token,
            radius: a + ',' + b + ',30',
            latest: 1
        },
        dataType: 'json',
        success: function (wx) {
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

                if (d <= 10) {
                    prox = '';
                    pc = 'green';
                } else if (d > 10 && d <= 20) {
                    prox = '-good';
                    pc = 'yellow';
                } else {
                    prox = '-weak';
                    pc = 'red';
                }

                $('#curwx #a').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html(t);
                $('#curwx #b').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html((!o.rh || rh == '--' ? '--' : rh + '%'));
                $('#curwx #c').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html((wd == 'V' && ws == '-- mph' ? '--' : wd + '/' + ws));
                $('#curwx #d').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html('Last report ' + u + ' @ ' + name);
            } else {
                $('#curwx').html('<div class="errormsg">No current weather conditions are available at this time.</div>');
            }
        }
    });
}

function incidentForecast(a, b) {
    var temp = [],
        rh = [],
        wind = [];

    $.ajax({
        url: 'https://api.weather.gov/points/' + parseFloat(a).toFixed(4) + '000000,' + parseFloat(b).toFixed(4) + '0000',
        method: 'GET',
        dataType: 'json',
        success: function (a) {
            $.ajax({
                url: a.properties.forecastGridData,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
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

                    $('#wxcon #e').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html(a);
                    $('#wxcon #f').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html(b + '%');
                    $('#wxcon #g').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html((c.toString() == 'NaN mph' ? '--' : c));
                    $('#wxcon #h').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html((d.toString() == '-Infinity mph' ? '--' : d));
                    $('#wxcon #i').removeClass('placeholder').css({ 'height': 'unset', 'width': 'unset' }).html('Last forecasted ' + timeAgo(new Date(data.properties.updateTime).getTime() / 1000));
                },
                error: function (a, b, c) {
                    if (a.status == 500 || a.status == 503 || a.status == 404) {
                        $('#wxcon').html('<div class="errormsg">Incident weather forecast is not available at this time.</div>');
                    }
                }
            });
        }
    });
}

function loadPerimeters() {
    var y = (settings.archive ? settings.archive : new Date().getFullYear()),
        min = settings.perimeters.minSize,
        ms = new Date().getTime(),
        pc = '';

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
        var w = 'FEATURE_CA <> \'Wildfire\' AND FIRE_YEAR=' + settings.archive,
            o = 'OBJECTID,UNQE_FIRE_ID,INCIDENT,GIS_ACRES,DATE_CUR';
    } else {
        var w = 'attr_FireDiscoveryDateTime>=TIMESTAMP \'' + y + '-01-01 00:00:00\' AND attr_FireDiscoveryDateTime<=TIMESTAMP \'' + y + '-12-31 23:59:59\' AND (poly_GISAcres > ' + min + ' OR poly_Acres_AutoCalc > ' + min + ') AND attr_FireOutDateTime IS NULL',
            o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_FireOutDateTime';
    }

    $.ajax({
        /*https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query   Fire_History_Perimeters_Public*/
        url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/' + (settings.archive ? 'InterAgencyFirePerimeterHistory_All_Years_View' : 'WFIGS_Interagency_Perimeters') + '/FeatureServer/0/query',
        method: 'POST',
        data: {
            where: w,
            outFields: o,
            geometry: getbbox(),
            geometryPrecision: 6,
            returnGeometry: true,
            f: 'geojson'
        },
        dataType: 'json',
        success: function (data) {
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
                        })
                            .on('mouseover', function () {
                                this.setStyle({
                                    opacity: 0.95,
                                    weight: layer.options.weight + 1
                                });
                            })
                            .on('mouseout', function () {
                                this.setStyle({
                                    opacity: 0.8,
                                    weight: layer.options.weight - 1
                                });
                            })
                            .bindPopup(popup('<i class="fas fa-location-dot" style="padding-right:8px"></i>' + fn,
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
                        return (pOBJECTID.indexOf(feature.properties.OBJECTID) < 0 ? true : false);
                    }
                });

                perimeters.addLayer(p);

                if (firstPermLoad) {
                    perimeters.getLayers().forEach(function (l) {
                        l.getLayers().forEach(function (p) {
                            var prop = p.feature.properties;

                            if (prop.attr_UniqueFireIdentifier == uqid || (prop.poly_IncidentName.toLowerCase().search(fn.toLowerCase()) >= 0 || prop.attr_IncidentName.toLowerCase().search(fn.toLowerCase()) >= 0)) {
                                map.fitBounds(p.getBounds());
                            }
                        });
                    });

                    firstPermLoad = false;
                }
            }
        },
        complete: function () {
            map.addLayer(perimeters);
        }
    });
}

function addIcon(t, d, u, ac, status, notes) {
    var m = L.marker([mapLat, mapLon], {
        icon: fireIcon(t, d, u, ac, status, notes)
    })
        .addTo(map);

    map.setView([mapLat, mapLon], 9);
}

$(window).on('load', function () {
    if (settings.coordsDisplay != 'dec') {
        $('#coords').html(coords(mapLat, mapLon));
    }
});

$(document).ready(function () {
    map = L.map('map', {
        preferCanvas: true,
        renderer: L.canvas(),
        zoomControl: false,
        dragging: !L.Browser.mobile,
        touchZoom: true,
        scrollWheelZoom: ($(window).width() > 690 ? true : false),
        gestureHandling: false,
        attributionControl: false,
        center: settings.center,
        zoom: settings.zoom
    })
        .on('load', function () {
            loadPerimeters();
        })
        .on('moveend', function () {
            loadPerimeters();
        });

    terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        id: 'Terrain',
        minZoom: 3,
        maxZoom: 18
    })
        .addTo(map);

    addIcon(t, d, u, acres(ac), fireStatus(status), notes);
    doDrought(mapLat, mapLon);
    doAIRQ(mapLat, mapLon);

    if (y == new Date().getFullYear()) {
        incidentWX(mapLat, mapLon);
        incidentForecast(mapLat, mapLon);
    }
});

$(document).on('click', '[id^=rtm]', function () {
    if (window.opener == null) {
        window.location.href = host;
    } else {
        window.close();
    }
});