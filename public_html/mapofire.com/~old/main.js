var host = 'https://www.mapofire.com/',
    apiURL = host + 'api/v1/',
    apiURL2 = 'https://api.mapotechnology.com/v1/',
    curTime = new Date(),
    modis_date = new Date((curTime.getTime() - (86400000 * 4))),
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    productName = 'Map-o-Fire',
    company = 'MAPO LLC',
    DONATE_POPUP_DAYS = 10,
    archive = settings.archive,
    state = settings.state,
    county = settings.county,
    version = ver[0],
    versionHTML = ver[1],
    attrib = '&copy;&nbsp;' + curTime.getFullYear() + '&nbsp;' + company,
    chartJSVersion = '4.1.1',
    defaultTitle = $('body').attr('data-t'),
    user = {
        noauth: 1,
        role: 'GUEST'
    },
    userLocation = [],
    geoLocation = [],
    map,
    nrMrkr,
    countyBounds,
    terrain,
    osm,
    satellite,
    caltopo,
    fs16,
    shading,
    delorme,
    usgs,
    carto,
    faa,
    modis,
    darkCanvas,
    lightning1,
    lightning24,
    nfdrs,
    cdfFHSZ,
    burnProb,
    sfp,
    spc,
    otlkCat = [],
    ndfd,
    nri,
    rth,
    erc,
    whp,
    drought,
    fuels,
    usfs,
    roads,
    lands,
    plss,
    uloc = L.featureGroup(),
    dispatch = L.featureGroup(),
    nwsFire = L.featureGroup(),
    calfireUnits,
    gaccBounds = L.featureGroup(),
    sfcSmoke,
    viSmoke,
    visSatellite,
    irSatellite,
    wvSatellite,
    velocity,
    hrrrSmokeTime,
    radarInit,
    moving = false,
    isRadarPaused = false,
    radarLoop,
    radarCount = 0,
    radarImgs = [],
    inviewAlerts = [],
    localIncidents = [],
    newFires = L.featureGroup(),
    allFires = L.featureGroup(),
    smokeChecks = L.featureGroup(),
    rxBurns = L.featureGroup(),
    wwas = L.featureGroup(),
    airq = L.featureGroup(),
    perimeters = L.featureGroup(),
    modis24 = L.featureGroup(),
    modis48 = L.featureGroup(),
    modis72 = L.featureGroup(),
    stns = L.featureGroup(),
    events = '',
    stnids = [],
    pOBJECTID = [],
    hspts = [],
    gaccs = [],
    psas = [],
    idcb = [],
    nfwz = [],
    nrics = [],
    tileIDs = [],
    airIDs = [],
    wwaIDs = [],
    tileNames = ['terrain', 'open street map', 'modis', 'satellite', 'caltopo', 'fs16', 'delorme', 'usgs', 'carto', 'faa'],
    tilePerms = [false, false, true, false, true, true, false, true, false, true],
    layersMenu = '',
    typeTimer,
    gm,
    tracked = [];

function loginWithGoogle(r) {
    $.ajax({
        url: apiUrl('user'),
        method: 'POST',
        data: {
            google: 1,
            token: r.credential
        },
        dataType: 'json',
        success: function (api) {
            authenticateUser(api);

            if (api.thirdParty == 1) {
                closeImpact();
                $('.loginForm').hide();
                $('#account').attr('data-tooltip', '{"text":"Manage map settings","dir":"right"}');
                notify('success', 'You were successfully logged in.');
            }
        }
    });
}

function authenticateUser(u = null) {
    var ms = new Date().getTime()/*,
        et = new Date(ms + (60 * 60 * 24 * 7 * 1000)),
        expires = days[et.getUTCDay()] + ', ' + et.getUTCDate() + ' ' + months[et.getUTCMonth()] + ' ' + et.getUTCFullYear() + ' ' + 
                (et.getUTCHours() < 10 ? '0' : '') + et.getUTCHours() + ':' + (et.getUTCMinutes() < 10 ? '0' : '') + et.getUTCMinutes() + 
                ':' + (et.getUTCSeconds() < 10 ? '0' : '') + et.getUTCSeconds() + ' UTC'*/;

    if (u == null) {
        var token;
        document.cookie.split('; ').forEach(function (v) {
            if (v.search('token') >= 0) {
                token = v.split('=')[1];
            }
        });

        $.ajax({
            url: apiUrl('user'),
            method: 'GET',
            data: {
                active: 1,
                token: token
            },
            dataType: 'json',
            success: function (api) {
                if (api.noauth == 1) {
                    console.info('User profile not loaded: in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
                } else {
                    user = api;
                    console.info('User profile loaded: ' + user.first_name + ' ' + user.last_name + ' in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');

                    if (user.settings) {
                        settings = user.settings;
                    }

                    if (user.location) {
                        userLocation = user.location;
                    }

                    /* update map based on user settings; any layers that the user want's checked */
                    /* go ahead of automatically check them so they display */
                    if (settings.center != null) {
                        if ($('#map').attr('data-state')) {
                            var a = stateCenter($('#map').attr('data-state'));
                            map.setView([a[0], a[1]], 7 - (L.Browser.mobile ? 1 : 0));
                        } else {
                            map.setView(settings.center, settings.zoom - (L.Browser.mobile ? 1 : 0));
                        }

                        setMapType(settings.tile);

                        $('.layersMenu input[type=checkbox]').each(function () {
                            if (settings.checkboxes && settings.checkboxes.includes($(this).attr('id')) === true) {
                                $(this).prop('checked', true).trigger('change');
                            } else {
                                $(this).prop('checked', false).trigger('change');
                            }
                        });
                    }
                }

                allowPerms();
            }
        });
    } else {
        user = u;
        settings = u.settings;
        allowPerms();

        /* update map based on user settings; any layers that the user want's checked */
        /* go ahead of automatically check them so they display */
        if (settings) {
            map.setView(settings.center, settings.zoom);
            setMapType(settings.tile);

            $('.layersMenu input[type=checkbox]').each(function () {
                if (settings.checkboxes.includes($(this).attr('id')) === true) {
                    $(this).prop('checked', true).trigger('change');
                } else {
                    $(this).prop('checked', false).trigger('change');
                }
            });
        }
    }
}

function allowPerms() {
    var g = hasPermission(user, actions.VIEW_LAYERS),
        p = hasPermission(user, actions.PREMIUM_LAYERS),
        p2 = hasPermission(user, actions.PREMIUM_BASEMAPS);

    myAccount(user, accountForm);
    getTrackedFires();

    if (!hasPermission(user, actions.PREMIUM_DATA)) {
        $('#local').remove();
    }

    if (p === true) {
        ndfdLegend();

        /* show california layer group if permissions are met */
        $('.layersMenu .group').each(function () {
            if ($(this).attr('title') == 'California') {
                $(this).show();
            }
        });
    }

    /* adjust layers menu for permissions of the user */
    $('.layersMenu .layer').each(function () {
        if ($(this).attr('data-p') == 1 && p === true) {
            $(this).show();
        }

        if ($(this).attr('data-p') == 0 && (g === true || p === true)) {
            $(this).show();
        }
    });

    /* adjust basemaps for permissions of the user */
    $('#tileChange ul.select-options li').each(function () {
        if ($(this).attr('style') == 'display:none' && p2) {
            $(this).show();
        }
    });
}

function getTrackedFires() {
    $.ajax({
        url: apiUrl('trackFires/list'),
        method: 'POST',
        dataType: 'json',
        success: function (g) {
            if (g.fires != null) {
                g.fires.forEach(function (f) {
                    tracked.push(f.wfid);
                });
            }

            /* if modal is already open with wildfire data, change the follow button now */
            if ($('#modal').hasClass('open fire')) {
                $('#trackFire').attr('data-following', '1')
                    .attr('title', 'You\'re following this fire')
                    .addClass('btn-blue yes')
                    .removeClass('btn-green')
                    .html('Following');
            }
        }
    });
}

function setMapType() {
    if (!settings.tile) {
        settings.tile = 'terrain';
    }

    var ind = tileNames.indexOf(settings.tile),
        tileIDs = [terrain, osm, modis, satellite, caltopo, fs16, delorme, usgs, carto, faa];

    if (ind != undefined) {
        tileIDs.forEach(function (k, v) {
            if (ind == v) {
                map.addLayer(tileIDs[v]).setMinZoom(tileIDs[v].options.minZoom).setMaxZoom(tileIDs[v].options.maxZoom);

                if (tileNames[ind] == 'caltopo' || tileNames[ind] == 'fs16') {
                    shading.addTo(map).bringToFront();
                }
            } else {
                if (map.hasLayer(tileIDs[v]) === true) {
                    if (tileNames[ind] != 'caltopo' && tileNames[ind] != 'fs16') {
                        shading.removeFrom(map);
                    }

                    map.removeLayer(tileIDs[v]);
                }
            }
        });
    } else {
        /* set default map type to terrain if there's a loading issue with the software */
        map.addLayer(terrain);
    }
}

/* social media shares */
function socialShare(se) {
    var p = window.location.pathname,
        s = p.split('/');

    if (se == 'tt') {
        window.open('https://tiktok.com/search?q=' + s[4].replaceAll('-', ' ').toLowerCase());
    } else {
        var ref = host.substring(0, host.length - 1) + p;

        if (se == 'fb') {
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + ref + '&src=sdkpreparse';
        } else {
            var hashtags = ucwords(s[3].toString().replaceAll('-', ' ')).replaceAll(' ', '') + ',' + ucwords(s[4].toString().replaceAll('-', ' ')).replaceAll(' ', '');
            url = 'https://twitter.com/intent/tweet?hashtags=' + hashtags + '&original_referer=' + ref + '&url=' + ref + '&ref_src=twsrc%5Etfw&tw_p=tweetbutton';
        }

        var h = 425,
            w = 700,
            t = ($(window).height() - h) / 2,
            l = ($(window).width() - w) / 2;

        window.open(url, 'social', 'location=no,menubar=no,status=no,resizable=no,top=' + t + ',left=' + l + ',width=' + w + ',height=' + h);
    }
}

/* function to show or hide layers on the map */
function params(t, a, v) {
    var c = $('#' + a).is(':checked');

    /* add map items in array based on layer ID and the layer variable */
    if (t == 1) {
        for (var i = 0; i < v.length; i++) {
            /* if layer is checked to be visible, otherwise remove from map */
            if (c === true) {
                v[i].addTo(map);
            } else {
                /* if layer is actually on the map */
                if (map.hasLayer(v[i]) === true) {
                    v[i].removeFrom(map);
                }
            }
        }
    } else if (t == 2) {
        if (c === true) {
            /* when user must interactive with map to get data from map tiles */
            if (a == 'fuels' || a == 'drought') {
                $('#map').css('cursor', 'crosshair');
            }

            if (a == 'ndfd') {
                var ur,
                    t = $('#forecastModel').find('option:selected').val();

                if (t == '12hr_precipitation_probability') {
                    ur = 'ndfd_precipitation';
                } else if (t == 'relative_humidity') {
                    ur = 'ndfd_moisture';
                } else if (t == 'wind_speed') {
                    ur = 'ndfd_wind';
                } else if (t == 'total_sky_cover') {
                    ur = 'ndfd_sky';
                } else if (t == 'apparent_temperature' || t == 'maximum_temperature') {
                    ur = 'ndfd_temperature';
                }

                ndfd.setUrl('https://nowcoast.noaa.gov/geoserver/' + ur + '/wms');

                $('#ndfdLegends').show();
                $('#legend' + t).show();
            }

            map.addLayer(v);
        } else {
            if (v != undefined) {
                map.removeLayer(v);
            }

            if (a == 'fuels' || a == 'drought') {
                $('#map').css('cursor', 'auto');
            }

            if (a == 'perimeters') {
                pOBJECTID = [];
            }

            if (a == 'stns') {
                stnids = [];
            }

            if (a == 'dispatch') {
                idcb = [];
            }

            if (a == 'ndfd') {
                $('#ndfdLegends').hide();
                $('#ndfdLegends > div').each(function () {
                    $(this).hide();
                });
            }
        }
    } else if (t == 3) {
        if (c) {
            if (typeof v == 'function') {
                v();
            } else {
                v;
            }
        }
    }
}

/* start or stop tracking a wildfire incident */
$(document).on('mouseover', '[id=trackFire]', function () {
    if ($(this).attr('data-following') == '1' && tracked.includes($(this).attr('data-id'))) {
        $(this).addClass('btn-red stop')
            .removeClass('btn-blue yes')
            .html('Unfollow?');
    }
});

$(document).on('mouseout', '[id=trackFire]', function () {
    if ($(this).attr('data-following') == '1' && tracked.includes($(this).attr('data-id'))) {
        $(this).removeClass('btn-red stop')
            .addClass('btn-blue yes')
            .html('Following');
    }
});

$(document).on('click', '[id=trackFire]', function () {
    var id = $(this).attr('data-id'),
        f = findFire(id),
        m;

    /* remove */
    if ($(this).attr('data-following') == '1' && tracked.includes(id)) {
        m = 'remove';
        tracked.splice($.inArray(id, tracked), 1);

        /* add */
    } else {
        m = 'add';
        tracked.push(id);
    }

    $.ajax({
        url: apiUrl('trackFires/' + m),
        method: 'POST',
        data: {
            wfid: id
        },
        dataType: 'json',
        success: function (r) {
            if (r.success == 'added') {
                $('#trackFire').attr('data-following', '1')
                    .attr('title', 'You\'re following this fire')
                    .addClass('btn-blue yes')
                    .removeClass('btn-green')
                    .html('Following');
                notify('success', 'You\'re now following the ' + f.options.title + '.');
            } else if (r.success = 'removed') {
                $('#trackFire').removeAttr('data-following')
                    .attr('title', 'Follow this fire')
                    .removeClass('btn-blue stop yes')
                    .addClass('btn-green')
                    .html('Follow');
                notify('success', 'You\'re no long following the ' + f.options.title + '.');
            }
        }
    });

    return false;
});

function showPosition(position) {
    var lat = position.coords.latitude,
        lon = position.coords.longitude,
        radius = position.coords.accuracy;

    geoLocation = [lat, lon, mToFt(radius)];
    calcNearbyFir();

    if (map.hasLayer(uloc)) {
        uloc.getLayers().forEach(function (e) {
            uloc.removeLayer(e);
        });

        map.removeLayer(uloc);
    }

    var a = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<div class="location"></div>',
            iconSize: new L.point(12, 12)
        })
    });

    var b = L.circle([lat, lon], {
        radius: radius,
        color: '#2a93ee',
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.2
    });

    uloc.addLayer(a)
        .addLayer(b)
        .bindTooltip('You are within ' + mToFt(radius) + ' of here')
        .on('click', function () {
            map.removeLayer(this);
        });

    map.addLayer(uloc)
        .setView([lat, lon], 11);
}

function geoLocationErrors(error) {
    var m = '';

    switch (error.code) {
        case error.PERMISSION_DENIED:
            m = "User denied the request for geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            m = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            m = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            m = "An unknown error occurred.";
            break;
    }

    notify('error', m);
}

function saveSession(h) {
    var c = map.getCenter(),
        a = c.lat,
        b = c.lng,
        z = map.getZoom(),
        t = $('#tileChange'),
        f = $('#saveFreq'),
        pc = $('#perimColor'),
        pz = $('#perimZoom'),
        pt = $('#perimTtip'),
        cd = $('#coordsDisplay'),
        p = $('#perimeterSize input[type=range]'),
        tu = $('#tempUnit'),
        wu = $('#windSpeedUnit'),
        au = $('#acresUnit'),
        ls = $('#locallySave'),
        ch = [];

    $('#sync i').removeClass('fa-arrow-down-to-line').addClass('fa-arrow-up-to-line');
    $('#sync span').html('Syncing your settings...');

    $('.layersMenu input[type=checkbox]').each(function () {
        var chk = $(this).is(':checked');
        if (chk) {
            ch.push($(this).attr('id'));
        }
    });

    var set = {
        method: (h === true ? 'true' : 'false'),
        center: [a, b],
        zoom: z,
        tile: t.attr('data-selected'),
        saveFreq: f.find('option:selected').val(),
        locallySave: ls.find('option:selected').val(),
        checkboxes: ch,
        coordsDisplay: cd.find('option:selected').val(),
        perimeters: {
            minSize: p.val(),
            color: pc.find('option:selected').val(),
            zoom: pz.find('option:selected').val(),
            ttip: pt.find('option:selected').val()
        },
        weather: {
            temp: tu.find('option:selected').val(),
            wind: wu.find('option:selected').val()
        },
        acres: au.find('option:selected').val()
    };

    if (hasPermission(user, actions.PREMIUM_LAYERS)) {
        set.special = {
            otlkDay: $('#otlkDay').find('option:selected').val(),
            otlkType: $('#otlkType').find('option:selected').val(),
            sfpDate: $('#sfpDateSelect').find('option:selected').val(),
            forecastModel: $('#forecastModel').find('option:selected').val(),
            fcstTime: $('#fcstTime').find('option:selected').val()
        };
    }

    settings = set;

    $.ajax({
        url: apiUrl('session'),
        method: 'POST',
        data: set,
        dataType: 'json',
        success: function (data) {
            if (data.success == 1) {
                $('#sync i').removeClass('fa-arrow-up-to-line').addClass('fa-arrow-down-to-line');
                $('#sync span').html('Account last synced just now');
                if (h === false) {
                    notify('success', 'Your settings were successfully synced.');
                }
                console.info('Settings saved');
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

                    $('#incidentForecast #aa').replaceWith('<div class="c"><i class="fal fa-temperature-half"></i><span class="desc">Max Temp</span>' + a + '</div>');
                    $('#incidentForecast #ab').replaceWith('<div class="c"><i class="fal fa-droplet-percent"></i><span class="desc">Min Humidity</span>' + b + '%</div>');
                    $('#incidentForecast #ac').replaceWith('<div class="c"><i class="fal fa-wind"></i><span class="desc">Avg Wind Speed</span>' + (c.toString() == 'NaN mph' ? '--' : c) + '</div>');
                    $('#incidentForecast #ad').replaceWith('<div class="c"><i class="fal fa-windsock"></i><span class="desc">Max Wind Speed</span>' + (d.toString() == '-Infinity mph' ? '--' : d) + '</div>');
                    $('#incidentForecast #ae').replaceWith('<p class="updated">Last forecasted ' + timeAgo(new Date(data.properties.updateTime).getTime() / 1000) + '</p>');
                },
                error: function (a, b, c) {
                    if (a.status == 500 || a.status == 503 || a.status == 404) {
                        $('#incidentForecast .body').remove();
                        $('#incidentForecast .fire-details').append('<div class="body"><p class="message inline error" style="margin-bottom:0">Incident weather forecast is not available at this time.</p></div>');
                    }
                }
            });
        }
    });
}

function incidentWX(a, b) {
    $.ajax({
        /*url: 'https://api.synopticlabs.org/v2/stations/latest',*/
        url: apiUrl('weather/nearby', 2),
        method: 'POST',
        data: {
            /*token: '44f4f6fef5d3468894bf07594e8862c0',*/
            radius: a + ',' + b + ',30',
            latest: 1
            /*vars: 'air_temp,relative_humidity,wind_speed,wind_direction',
            units: 'temp|f,speed|mph',
            obtimezone: 'local',
            limit: '2',
            status: 'active',
            network: '1,2',
            networkimportance: '2,1'*/
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
                    d = distance(a, b, wx.weather.lat, wx.weather.lon),
                    u = timeAgo(wx.weather.updated),
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

                /*if (t != '--' && rh != '--' && ws != '--') {
                if (hasPermission(user, actions.PREMIUM_WEATHER)) {
                    $('#weatherObs h3').replaceWith('<h3 style="margin:10px 0;text-align:center;font-family:dosis;color:var(--light-blue)">' + name + '</h3>');
                } else {*/
                $('#weatherObs h3').remove();
                /*}*/

                $('#weatherObs #temp').replaceWith('<div class="c"><i aria-hidden="true" class="fal fa-temperature-high"></i><span class="desc">Temperature</span>' + t + '</div>');
                $('#weatherObs #rh').replaceWith('<div class="c"><i aria-hidden="true" class="fal fa-droplet-percent"></i><span class="desc">Humidity</span>' + (!o.rh || rh == '--' ? '--' : rh + '%') + '</div>');
                $('#weatherObs #wind').replaceWith('<div class="c"><i aria-hidden="true" class="fal fa-wind"></i><span class="desc">Wind</span>' + (wd == 'V' && ws == '-- mph' ? '--' : wd + '/' + ws) + '</div>');
                $('#weatherObs #upd').replaceWith('<!--<p style="margin:15px 0 5px 0;text-align:center;font-size:13px"><b style="text-transform:uppercase;font-weight:400;padding-right:7.5px;color:var(--blue-gray)">Proximity Rating</b> ' +
                    '<i class="far fa-signal' + prox + '" title="Observations are' + (d <= 10 ? ' within 10' : (d > 10 && d <= 20 ? ' within 20' : ' further than 30')) + ' miles of this fire" style="color:var(--' + pc + ');cursor:help"></i></p>-->' +
                    '<p class="updated">Last report ' + u + (hasPermission(user, actions.PREMIUM_WEATHER) ? ' @ ' + name : '') + '</p>');

                /*} else {
                    $('#weatherObs .fire-details .body').html('<p class="message error" style="max-width:unset;margin:15px 0 0 0">No current weather conditions are available at this time.</p>');
                }*/
            } else {
                $('#weatherObs .row').remove();
                $('#weatherObs #upd').remove();
                $('#weatherObs .fire-details .body').html('<p class="message error" style="max-width:unset;margin:15px 0 0 0">No current weather conditions are available at this time.</p>');
            }

            /*if (wx.STATION) {
                var o = wx.STATION[0].OBSERVATIONS,
                    name = wx.STATION[0].NAME,
                    t = (o.air_temp_value_1.value ? Math.round(o.air_temp_value_1.value) : '--'),
                    rh = (o.relative_humidity_value_1 ? Math.round(o.relative_humidity_value_1.value) : '--'),
                    wd = getCompassDirection(o.wind_direction_value_1.value),
                    ws = (o.wind_speed_value_1.value ? Math.round(o.wind_speed_value_1.value) : '--'),
                    u = timeAgo(new Date(o.air_temp_value_1.date_time) / 1000),
                    d = distance(a, b, wx.STATION[0].LATITUDE, wx.STATION[0].LONGITUDE),
                    prox,
                    pc;

                if (!settings.weather || settings.weather.temp == 'c' && t != '--') {
                    t = FtoC(t) + '&deg;C';
                } else {
                    t += '&deg;F';
                }

                if (!settings.weather || settings.weather.wind == 'mph' && ws != '--') {
                    ws += ' mph';
                } else {
                    ws = speed(ws, settings.weather.wind) + ' ' + settings.weather.wind;
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

                if (t || rh || ws) {
                    if (hasPermission(user, actions.PREMIUM_WEATHER)) {
                        $('#weatherObs h3').replaceWith('<h3 style="margin:10px 0;text-align:center;font-family:dosis;color:var(--light-blue)">' + name + '</h3>');
                    } else {
                        $('#weatherObs h3').remove();
                    }


                    $('#weatherObs #temp').replaceWith('<div class="c"><i aria-hidden="true" class="fal fa-temperature-high"></i><span class="desc">Temperature</span>' + t + '</div>');
                    $('#weatherObs #rh').replaceWith('<div class="c"><i aria-hidden="true" class="fal fa-droplet-percent"></i><span class="desc">Humidity</span>' + rh + '%</div>');
                    $('#weatherObs #wind').replaceWith('<div class="c"><i aria-hidden="true" class="fal fa-wind"></i><span class="desc">Wind</span>' + wd + '/' + ws + '</div>');
                    $('#weatherObs #upd').replaceWith('<p style="margin:15px 0 5px 0;text-align:center;font-size:13px"><b style="text-transform:uppercase;font-weight:400;padding-right:7.5px;color:var(--blue-gray)">Proximity Rating</b> ' +
                        '<i class="far fa-signal' + prox + '" title="Observations are' + (d <= 10 ? ' within 10' : (d > 10 && d <= 20 ? ' within 20' : ' further than 30')) + ' miles of this fire" style="color:var(--' + pc + ');cursor:help"></i></p><p style="font-size:13px;text-align:center;font-style:italic;margin:10px 0 0 0;padding:0">Last report ' + u + '</p>');

                } else {
                    $('#modal #weatherObs').html('No current weather conditions are available at this time.');
                }
            } else {
                $('#weatherObs .row').remove();
                $('#weatherObs #upd').remove();
                $('#weatherObs .fire-details .body').append('<p class="message error" style="max-width:unset;margin:15px 0 0 0">No current weather conditions are available at this time.</p>');
            }*/
        }
    });
}

function getStatus(s, n) {
    return (s == null ? (n.search('contain') >= 0 ? 'contained' : (n.search('control') >= 0 ? 'controlled' : 'active')) : (s.Out ? 'out' : (s.Control ? 'controlled' : (s.Contain ? 'contained' : ''))));
}

function doDrought(a, b) {
    $.ajax({
        url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3/query',
        method: 'GET',
        data: {
            where: '1=1',
            geometry: '{x: ' + b + ', y: ' + a + '}',
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

                $('#modal span#drought').css('color', color).html(out);
            } else {
                $('.row.cta .col:nth-child(3)').remove();
            }
        }
    });
}

function wildfire(fire) {
    var edit = '',
        t = fire.properties.type,
        state = fire.properties.fireState,
        id = fire.properties.incidentId,
        wfid = fire.properties.wfid,
        acres = (fire.properties.acres == 'Unknown' ? 'Unknown' : numberFormat(fire.properties.acres)),
        fstat = fire.properties.status,
        st = (fire.time.year < curTime.getFullYear() ? 'out' : getStatus(fstat, fire.properties.notes)),
        st = (st ? st : 'active'),
        dispatch = fire.protection.dispatch,
        center = getDispatchCenter(dispatch),
        near = fire.geometry.near,
        city = near.split(' of '),
        agency = fire.protection,
        rthUrl = [apiUrl('risk', 2), encodeURIComponent(city[1])],
        n = fire.properties.fireName + (t == 'Wildfire' ? ' Fire' : '') + ((curTime.getTime() / 1000) - fire.time.discovered <= 43200 ? '<span class="new">NEW</span>' : ''),
        abbr = '',
        isTracked = tracked.includes(fire.properties.wfid.toString());

    if (agency.agency != 'US Forest Service') {
        abbr = agencies[agency.agency];
    }

    if (hasPermission(user, actions.ADMIN)) {
        edit = '<a target="blank" href="https://www.mapotechnology.com/account/admin/wildfires/' + (dispatch == 'MAPO' ? 'modify' : 'edit') + '?wfid=' + wfid + '" style="margin-right:5px"><i class="far fa-pen-to-square"></i></a>';
    }

    if (fire.time.year < curTime.getFullYear()) {
        $('#e, #nbm').remove();
    }

    var a = '<div class="row even" style="align-items:center"><div class="col" style="flex-direction:column"><div style="display:flex;align-items:center">' + edit + '<h1>' + n + '</h1></div><span class="coords">' + coords(fire.geometry.lat, fire.geometry.lon) + '</span></div>' +
        '<div class="col agency">' +
        '<div style="display:flex;align-items:center"><div><b>' + t.toUpperCase() + '</b> reported in ' + stateLabels[state] + (dispatch == '' || (dispatch == 'MAPO' && agency.agency == '') ? ', by National Interagency Fire Center' : (agency.area ? ', <span style="line-height:1.5;border-bottom:1px dotted #333;cursor:help" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' +
            (abbr ? abbr + ' ' : '') + agency.area + '</span>' : (agency.unit == 'NWCG' ? ', by NWCG/Inciweb' : ''))) + '</div>' +
        (agency.logo || dispatch == 'CAL FIRE' ? '<img class="agency" src="https://d3kcsn1y1fg3m9.cloudfront.net/fire/images/agency_' + (agency.logo ? agency.logo : (dispatch == 'CAL FIRE' ? 'calfire' : '')) + '_logo.png" alt="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' : '') + '</div></div></div>' +
        '<div class="social">' + (user.uid ? '<a class="btn btn-sm btn-' + (isTracked ? 'blue yes' : 'green') + '" id="trackFire" data-id="' + fire.properties.wfid + '" ' + (isTracked ? 'data-following="1" ' : '') + 'title="' + (isTracked ? 'You\'re following' : 'Track') + ' this fire" href="#">Follow' + (isTracked ? 'ing' : '') + '</a>' : '') +
        '<i class="fab fa-facebook social" title="Share on Facebook" onclick="socialShare(\'fb\')"></i>' +
        '<i class="fab fa-twitter social" title="Tweet on Twitter" onclick="socialShare(\'tw\')"></i>' +
        '<i class="fab fa-tiktok social" title="Find videos on TikTok" onclick="socialShare(\'tt\')"></i>' +
        '<i class="fal fa-share-nodes" title="Share: text, email, or copy link" id="sharer"></i></div>',

        b = '<div class="row cta"><div class="col"><div class="title">status</div><div class="desc"><span class="status ' + st + '">' + st.toUpperCase() + '</span></div></div>' +
            '<div class="col"><div class="title">size</div><div class="desc" style="color:var(--red)">' + (acres != 'Unknown' ? sizing(2, acres.replaceAll(',', '')) : acres) + (acres != 'Unknown' ? '<span class="si">' + sizing(1).toLowerCase() : '') + '</span></div></div>' +
            '<div class="col"><div class="title">drought</div><div class="desc"><span id="drought">--</span></div></div></div>' +
            '<div class="row" style="gap:10px;background-color:rgb(0 56 92 / 15%);color:#555;padding:10px;border-radius:3px;margin:10px 0">' +
            '<div class="col"><span><b>Last updated:</b> ' + timeAgo(fire.time.updated) + '</span></div>' +
            '<div class="col"><span title="' + /*new Date(fire.time.discovered * 1000)*/ localTime(fire.time) + '"><b>Reported:</b> ' + timeAgo(fire.time.discovered) + '</span></div>' +
            '<div class="col"><span><b>Incident #:</b> ' + id + '</span></div></div>',

        c = '<div class="fire-details head"><!--<div class="row"><div class="box">' +
            '<div class="c i"><i class="fad fa-shield-check"></i></div>' +
            '<div class="c t">Status</div>' +
            '<div class="c"><span class="status ' + st + '">' + st.toUpperCase() + '</span></div>' +
            '</div><div class="box">' +
            '<div class="c i"><i class="fad fa-object-ungroup"></i></div>' +
            '<div class="c t">' + sizing(1) + '</div>' +
            '<div class="c">' + (acres != 'Unknown' ? sizing(2, acres.replaceAll(',', '')) : acres) + '</div></div></div>-->' +
            '<div class="row"><div class="box">' +
            '<div class="c i"><i class="fas fa-location-dot"></i></div>' +
            '<div class="c t">Initial Location</div>' +
            '<div class="c">' + near + '</div>' +
            '</div><div class="box">' +
            '<div class="c i"><i class="fas fa-tower-observation"></i></div>' +
            '<div class="c t">Jurisdiction</div>' +
            '<div class="c">' + (!agency.agency && !agency.unit ? 'Unknown' : (agency.agency ? agency.agency + ' &mdash; ' : '') + (agency.area ? agency.area : '')) + '</div></div></div>' +
            '<div class="row"><div class="box">' +
            '<div class="c i"><i class="fal fa-notes"></i></div>' +
            '<div class="c t">Dispatch Notes</div>' +
            '<div class="c">' + (fire.properties.notes ? fire.properties.notes : 'N/A') + '</div>' +
            '</div><div class="box">' +
            '<div class="c i"><i class="fad fa-trees"></i></div>' +
            '<div class="c t">Fuels</div>' +
            '<div class="c">' + (fire.properties.fuels ? fire.properties.fuels : 'None specified') + '</div>' +
            '</div></div>' +
            '<div class="row"><div class="box">' +
            '<div class="c i"><i class="fad fa-sensor-triangle-exclamation"></i></div>' +
            '<div class="c t">IA Resources</div>' +
            '<div class="c">' + (fire.properties.resources ? fire.properties.resources : 'N/A') + '</div></div>';

    if (fstat != null && (fstat.Contain || fstat.Control || fstat.Out) && hasPermission(user, actions.PREMIUM_DATA)) {
        c += '<div class="box"><div class="c i"><i class="fad fa-chart-line"></i></div><div class="c t">Fire Status</div><div class="c">' +
            '<div style="display:flex;flex-wrap:wrap;gap:7.5px;width:100%;">' +
            (fstat.Contain ? '<div class="fstat-container"><b>Contained</b><span style="font-weight:100">' + dateTime(fstat.Contain) + '</span></div>' : '') +
            (fstat.Control ? '<div class="fstat-container"><b>Controlled</b><span style="font-weight:100">' + dateTime(fstat.Control) + '</span></div>' : '') +
            (fstat.Out ? '<div class="fstat-container"><b>Out</b><span style="font-weight:100">' + dateTime(fstat.Out) + '</span></div>' : '');
    }

    c += '</div></div>';

    if (fire.inciweb) {
        if (fire.inciweb.incident_info) {
            $('<div class="fire-details linear" id="f"><h2>Incident Information</h2><div class="body">' + fire.inciweb.incident_info + '</div></div>').insertAfter('#modal #e');
        }

        if (fire.inciweb.photo) {
            $('<div class="photo"><a target="blank" href="https://www.mapotechnology.com/assets/' + fire.inciweb.photo.url + '"><img src="https://www.mapotechnology.com/assets/' + fire.inciweb.photo.url + '" title="' + fire.inciweb.photo.caption + '"></a></div>').insertAfter('#modal #e');
        }

        if (fire.inciweb.current) {
            $(incidentDetails(fire.inciweb.current.data)).insertAfter('#modal #f');
        }

        if (fire.inciweb.contacts) {
            $('<div class="fire-details linear"><h2>Fire Incident Contact</h2><div class="body" style="padding-top:15px"><div class="row" style="padding-top:0;align-items:flex-start;gap:15px"><div class="col">' +
                '<span><b>Fire Unit Information</b><p style="margin-bottom:0">' + fire.inciweb.contacts.contact + '</p></span></div>' + (fire.inciweb.contacts.pio ? '<div class="col">' +
                    '<span><b>PIO Contact</b><p style="margin-bottom:0">' + fire.inciweb.contacts.pio + '</p></span></div>' : '') + '</div></div></div>').insertBefore('#modal #d');
        }
    }

    if (center) {
        $('#modal #d').replaceWith('<div class="fire-details linear"><h2>Dispatch Center</h2>' +
            '<div class="body"><p><b>' + center.name + ' (' + center.agency + ')</b><br>' + center.location + (center.phone && center.phone != '0' ? '<br>' + center.phone : '') +
            (center.website ? '<br><a href="' + center.website + '">' + center.website + '</a>' : '') + '</p><p class="updated" style="text-align:left">' + center.agency + ' data last sent ' + timeAgo(center.cad_update) + '</p></div></div>');
    } else {
        $('#modal #d').remove();
    }

    $('#modal').addClass('fire');
    $('#modal #a').replaceWith(a);
    $('#modal #b').replaceWith(b);
    $('#modal #c').replaceWith(c);
    /*$('#modal .content .container').html(content);*/

    doDrought(fire.geometry.lat, fire.geometry.lon);
}

function fireDetails(i, o = false) {
    const useModal = false;

    if (!useModal) {
        window.open(host + findFire(i).feature.properties.url);
    } else {
        var year;

        if (isAndroid == 1) {
            Fire.incident(i);
        } else {
            var lat = 0, lon = 0;
            $('#modal .content').html(fireDisplay);
            $('#modal').addClass('fire');
            openModal();

            if (localStorage.getItem('incident-' + i) && ((new Date().getTime() / 1000) - localStorage.getItem('incidentTime-' + i)) < 900) {
                var data = JSON.parse(localStorage.getItem('incident-' + i));
                f = data.fire,
                    p = f.properties,
                    g = f.geometry,
                    l = g.near.split(' of '),
                    year = data.fire.time.year,
                    nm = fireName(p.fireName),
                    title = nm + ' near ' + l[1] + ' - Current Incident Information and Wildfire Map',
                    desc = 'The ' + nm + ', located ' + g.near + ', is currently considered ' + getStatus(p.status, p.notes) + ' after starting ' + timeAgo(f.time.date) + ', and is ' + numberFormat(p.acres) + ' acres as of ' + timeAgo(f.time.updated) + '.',
                    lat = g.lat,
                    lon = g.lon;

                setHeaders(title, p.url, desc);

                if (o === true) {
                    map.setView([lat, lon], 12);
                }

                if (hasPermission(user, actions.CHARTS) && year == curTime.getFullYear()) {
                    $.getScript(host + 'src/js/chart-' + version + '.js', function () {
                        doNBM(lat, lon);
                    });
                } else {
                    $('#nbm').remove();
                }

                wildfire(data.fire);
                if (year == curTime.getFullYear()) {
                    incidentWX(lat, lon);
                    incidentForecast(lat, lon);
                }
            } else {
                $.ajax({
                    url: apiUrl('wildfires/incident', 2),
                    method: 'POST',
                    data: {
                        wfid: i
                    },
                    dataType: 'json',
                    success: function (data) {
                        if (settings.locallySave && settings.locallySave != 'n') {
                            localStorage.setItem('incidentTime-' + i, new Date().getTime() / 1000);
                            localStorage.setItem('incident-' + i, JSON.stringify(data));
                        }

                        var f = data.fire,
                            p = f.properties,
                            g = f.geometry,
                            l = g.near.split(' of '),
                            year = f.time.year,
                            title = p.fireName + ' Fire near ' + l[1] + ' - Current Incident Information and Wildfire Map',
                            desc = 'The ' + fireName(p.fireName) + ', located ' + g.near + ', is currently considered ' + getStatus(p.status, p.notes) + ' after starting ' + timeAgo(f.time.discovered) + ', and is ' + numberFormat(p.acres) + ' acres as of ' + timeAgo(f.time.updated) + '.',
                            lat = g.lat,
                            lon = g.lon;

                        setHeaders(title, p.url, desc);

                        if (o === true) {
                            map.setView([lat, lon], 12);
                        }

                        if (hasPermission(user, actions.CHARTS) && year == curTime.getFullYear()) {
                            $.getScript(host + 'src/js/chart-' + version + '.js', function () {
                                doNBM(lat, lon);
                            });
                        } else {
                            $('#nbm').remove();
                        }

                        wildfire(data.fire);
                    },
                    complete: function (d) {
                        console.log(d);
                        if (d.responseJSON.fire.time.year == curTime.getFullYear()) {
                            /* get nearby weather observation for the fire */
                            incidentWX(d.responseJSON.fire.geometry.lat, d.responseJSON.fire.geometry.lon);

                            /* get incident weather forecast */
                            incidentForecast(d.responseJSON.fire.geometry.lat, d.responseJSON.fire.geometry.lon);
                        }
                    }
                });
            }
        }
    }
}

function getAirQ() {
    $.ajax({
        url: 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air_Now_Current_Monitors_PM/FeatureServer/0/query',
        method: 'POST',
        data: {
            where: '1=1',
            outFields: 'ObjectId,AQSID,SiteName,LocalTimeString,PM25_AQI,PM25',
            returnGeometry: 'true',
            geometry: getbbox(),
            geometryPrecision: '6',
            returnExceededLimitFeatures: 'true',
            f: 'geojson'
        },
        dataType: 'json',
        success: function (data) {
            if (!data.error) {
                var aqD = L.geoJSON(data, {
                    pointToLayer: function (feature, latlng) {
                        var aq = feature.properties.PM25_AQI,
                            c = airQColor(aq);

                        return L.marker(latlng, {
                            icon: L.divIcon({
                                className: 'airQ',
                                html: '<div style="background-color:' + c + (aq >= 150 ? ';color:#fff' : '') + '">' + aq + '</div>',
                                popupAnchor: [10, 10]
                            })
                        });
                    },
                    onEachFeature: function (feature, layer) {
                        var n = feature.properties.SiteName,
                            aq = feature.properties.PM25_AQI,
                            pm = feature.properties.PM25,
                            c = airQColor(aq),
                            l = '';

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

                        layer.bindPopup(popup(n, '<table style="width:100%"><tr style="font-weight:bold;text-align:center"><td style="width:50%">Nowcast AQI</td><td>PM2.5</td></tr>' +
                            '<tr style="text-align:center"><td style="font-weight:100;font-size:28px;padding:10px 0">' + aq + '</td><td><span style="font-weight:100;font-size:28px;padding:10px 0">' + pm + '</span> &micro;g/m<sup>3</sup></td></tr>' +
                            '<tr><td colspan="2" style="text-align:center"><div class="aqi" style="color:#' + (aq <= 100 ? '000' : 'fff') + ';background-color:' + c + '" title="' + hm + '" onclick="notify(\'info\', \'' + hm + '\');return false">' + l + '</div></td></tr></table>' +
                            '<p style="font-size:13px;text-align:center;font-style:italic;margin:10px 0 0 0">Last report ' + timeAgo(new Date(feature.properties.LocalTimeString).getTime() / 1000) + '</p>'), {
                            className: 'fire-popup',
                            minWidth: 250,
                            maxWidth: 250
                        });

                        airIDs.push(feature.properties.ObjectId);
                    },
                    filter: function (feature) {
                        return (feature.properties.PM25_AQI != null && airIDs.includes(feature.properties.ObjectId) === false ? true : false);
                    }
                });

                airq.addLayer(aqD);
            }
        },
        complete: function () {
            updateProgressBar('Air quality loaded...');
            params(2, 'airq', airq);
        }
    });
}

function fuelType(a, b) {
    $.ajax({
        url: 'https://landfire.cr.usgs.gov/arcgis/rest/services/Landfire/US_140/MapServer/identify',
        method: 'POST',
        data: {
            geometry: b + ',' + a,
            geometryType: 'esriGeometryPoint',
            layers: '0,1',
            tolerance: '1',
            /*mapExtent: '-120,45.37810479866576,-118.99533688141292,45.469255949816926',*/
            mapExtent: '-181,14,-12,60',
            imageDisplay: '600,550,9',
            returnGeometry: 'false',
            f: 'json'
        },
        dataType: 'json',
        success: function (data) {
            var fuel = data.results[0].attributes.EVT_GP_N.replaceAll('Douglas-fir', 'Douglas fir').replaceAll(' and ', '-').split('-'),
                fo = '';

            fuel.forEach(function (f) {
                fo += '<li style="line-height:1.2">' + f + '</li>';
            });

            L.popup([a, b], {
                className: 'fire-popup',
                minWidth: 200,
                maxWidth: 250,
                content: popup('Fuel Types', '<ul style="padding-inline-start:20px!important">' + fo + '</ul>')
            })
                .openOn(map);
        }
    });
}

function getDrought(a, b) {
    $.ajax({
        url: 'https://gis.fema.gov/arcgis/rest/services/Partner/Drought_Current/MapServer/identify',
        method: 'GET',
        data: {
            geometry: b + ',' + a,
            geometryType: 'esriGeometryPoint',
            layers: '0',
            tolerance: '1',
            mapExtent: '-181,14,-12,60',
            imageDisplay: '600,550,9',
            returnGeometry: 'false',
            f: 'json'
        },
        dataType: 'json',
        success: function (data) {
            var v = (data.results.length == 2 ? data.results[1].value : data.results[0].value),
                t = timeAgo(new Date((data.results.length == 2 ? data.results[1].attributes.update_dat : data.results[0].attributes.update_dat) + ' UTC').getTime() / 1000),
                d;

            if (v == 0) {
                d = '<p class="drt" style="background-color:#ffff00">Abnormally Dry';
            } else if (v == 1) {
                d = '<p class="drt" style="background-color:#ffcc99">Moderate Drought';
            } else if (v == 2) {
                d = '<p class="drt w" style="background-color:#ff6600">Severe Drought';
            } else if (v == 3) {
                d = '<p class="drt w" style="background-color:#ff0000">Extreme Drought';
            } else if (v == 4) {
                d = '<p class="drt w" style="background-color:#660000">Exceptional Drought';
            }

            L.popup([a, b], {
                className: 'fire-popup',
                minWidth: 200,
                maxWidth: 250,
                content: popup('Drought Conditions', d + '</p><small style="display:block;text-align:center;font-style:italic;line-height:1.2">Last updated ' + t + '</small>')
            })
                .openOn(map);
        }
    });
}

function radar() {
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
        });

        radarLoop = setInterval(function () {
            if (isRadarPaused === false) {
                var d = new Date(radarImgs[radarCount].options.time * 1000),
                    t = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M';

                radarImgs[radarCount].setOpacity(0.8);
                $('#radarControl input[type=range]').val(radarCount);
                $('#radarControl .time').html(t);

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
        console.log(e.message);
    }
}

function getRadarAPI() {
    if ($('#radar').is(':checked')) {
        $('#radarControl').css('display', 'flex');

        if (!radarInit || ((new Date().getTime() / 1000) - radarInit.radar.past[12].time / 60) > 10) {
            $.ajax({
                url: 'https://api.rainviewer.com/public/weather-maps.json',
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    radarInit = data;
                },
                complete: function () {
                    radar();
                }
            });
        } else {
            radar();
        }
    } else {
        radarImgs.forEach(function (r) {
            r.setOpacity(0);
        });
        clearInterval(radarLoop);
        radarCount = 0;
        $('#radarControl').hide();
        $('#radarControl input[type=range]').val(0);
        $('#radarControl .time').html('--');
    }
}

function getWeather() {
    if ($('input[id=stns]').is(':checked')) {
        var b = JSON.parse(getbbox()),
            bx = b.xmax + ',' + b.ymin + ',' + b.xmin + ',' + b.ymax;

        console.info('Getting wx observations...');

        $.ajax({
            url: 'https://api.synopticlabs.org/v2/stations/latest',
            method: 'GET',
            data: {
                token: '350409c14c544ec9957effb1c15bcb99',
                bbox: bx,
                vars: 'air_temp,relative_humidity,wind_speed,wind_direction',
                units: 'temp|f,speed|mph',
                obtimezone: 'local',
                status: 'active',
                network: '2,1',
                networkimportance: '2,1'
            },
            dataType: 'json',
            success: function (wx) {
                if (wx.STATION) {
                    wx.STATION.forEach(function (w) {
                        var n = ucwords(w.NAME.toLowerCase()),
                            dt = timeAgo(new Date(w.OBSERVATIONS.air_temp_value_1.date_time) / 1000),
                            temp = (w.OBSERVATIONS.air_temp_value_1 ? Math.round(w.OBSERVATIONS.air_temp_value_1.value) : '--'),
                            rh = (w.OBSERVATIONS.relative_humidity_value_1 ? w.OBSERVATIONS.relative_humidity_value_1.value : '--'),
                            wdir = (w.OBSERVATIONS.wind_direction_value_1 ? getCompassDirection(w.OBSERVATIONS.wind_direction_value_1.value) : 'Var'),
                            wspd = (w.OBSERVATIONS.wind_speed_value_1 ? w.OBSERVATIONS.wind_speed_value_1.value : '--'),
                            id = w.STID;

                        if (stnids.indexOf(id) < 0) {
                            /* convert weather units based on user settings */
                            if (!settings.weather || settings.weather.temp == 'c' && temp != '--') {
                                temp = FtoC(temp) + '&deg;C';
                            } else {
                                temp += '&deg;F';
                            }

                            if (!settings.weather || settings.weather.wind == 'mph' && wspd != '--') {
                                wspd += ' mph';
                            } else {
                                wspd = speed(wspd, settings.weather.wind) + ' ' + settings.weather.wind;
                            }

                            var w = L.marker([w.LATITUDE, w.LONGITUDE], {
                                icon: L.divIcon({
                                    className: 'wx-icon',
                                    html: '<div>' + temp + '</div>',
                                    popupAnchor: [12, 0]
                                }),
                                title: 'Current Conditions as ' + n
                            })
                                .bindPopup(popup(n, '<div id="obs"><div class="row" style="text-align:center"><div class="col">Temp</div><div class="col">RH</div><div class="col">Wind</div></div><div class="row">' +
                                    '<div class="col" style="font-weight:bold;font-size:18px">' + temp + '</div><div class="col" style="font-weight:bold;font-size:18px">' + rh +
                                    '%</div><div class="col" style="font-weight:bold;font-size:18px;line-height:1.2">' + wdir + ' @ ' + wspd + '</div>' +
                                    '</div></div><p style="margin:10px 0 0 0;font-size:12px;text-align:center">Last report ' + dt + '</p>'), {
                                    className: 'fire-popup',
                                    minWidth: 300
                                });

                            stns.addLayer(w);
                            stnids.push(id);
                        }
                    });
                }
            },
            complete: function () {
                if ($('#stns').is(':checked') === true) {
                    console.info('Observations retrieved!');
                    updateProgressBar('Current weather loaded...');
                }
                params(2, 'stns', stns);
            }
        });
    } else {
        params(2, 'stns', stns);
    }
}

function retrieveWWA(e, t) {
    $.ajax({
        url: apiUrl('nws', 2),
        method: 'POST',
        data: {
            lat: e.latlng.lat,
            lon: e.latlng.lng
        },
        dataType: 'json',
        success: function (data) {
            var o = '';

            if (data.alerts == null) {
                o = 'There are no weather alerts currently in effect for this area.';
            } else {
                o += '<p style="margin:0;text-align:center">';
                data.alerts.forEach(function (a) {
                    o += '<a href="#" id="alert" title="' + a.headline + '" class="btn btn-light-blue wwa" style="text-overflow:ellipsis;overflow:hidden;white-space:nowrap" data-id="' + a.id + '">' + a.event + '</a> until ' + a.expires + '<br>';
                });
                o += '</p>';
            }

            t._popup.setContent(popup('Active Weather Alerts', o));
        }
    });
}

/* get text from SPC for severe/fire outlooks by day */
function readSPCText(type, day) {
    $('#modal .content').html(spcTemplate);
    openModal();

    $.ajax({
        url: apiUrl('outlooks/' + type + '/text', 2),
        method: 'POST',
        dataType: 'json',
        data: {
            day: day
        },
        success: function (data) {
            if (type == 'severe') {
                var r = '',
                    cats = ['General', 'Marginal', 'Slight', 'Enhanced', 'Moderate', 'High'];

                cats.forEach(function (g, n) {
                    r += '<div class="spc-risk ' + g.toLowerCase() + (n == otlkCat.length - 1 ? ' active' : '') + '">' + n + ' - ' + g.toUpperCase() + ' Risk</div>';
                });
            }

            var c = '<h1>Day ' + day + ' ' + ucfirst(type) + ' Weather Outlook</h1><p style="margin:15px 0 0 0;font-size:20px;color:gray">NWS Storm Prediction Center</p>' +
                '<p style="margin:3px 0 15px 0;color:#afafaf">Issued: ' + timeAgo(data.outlook.issue) + ' / ' + data.outlook.pretty + '</p>' +
                (type == 'severe' && otlkCat ? '<div class="risk-levels">' + r + '</div>' : '') + '<div class="spc">' + data.outlook.text + '</div>';

            setHeaders('Day ' + day + ' ' + ucfirst(type) + ' Weather Outlook from NWS Storm Prediction Center', 'weather/outlook/' + type + '/' + day, 'Review the most recent day ' + day + ' ' + type + ' weather outlook from the NWS Storm Prediction Center in Norman, OK.');

            $('#modal .content .container').html(c);
        }
    });
}

/* get SPC fire or severe weather outlooks by day */
function getOutlook() {
    if ($('input[id=spc]').is(':checked')) {
        var dy = $('#otlkDay').find('option:selected').val(),
            ty = $('#otlkType').find('option:selected').val();

        $.ajax({
            url: apiUrl('outlooks/' + ty, 2),
            method: 'POST',
            dataType: 'json',
            data: {
                day: (dy ? dy : 1)
            },
            success: function (data) {
                spc = L.geoJson(data, {
                    style: function (feature) {
                        return {
                            weight: 2,
                            fillColor: feature.properties.fill,
                            color: feature.properties.stroke,
                            fillOpacity: 0.4
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        otlkCat.push(feature.properties.name.replace(' Risk', '').replace(' Thunderstorms', ''));
                        /*layer.bindPopup(popup('Day ' + dy + ' ' + ucfirst(ty) + ' Outlook', feature.properties.name), {
                            className: 'fire-popup',
                            minWidth: 250,
                            maxWidth: 250
                        });*/
                    }
                })
                    .on('click', function () {
                        readSPCText(ty, dy);
                    });
            },
            complete: function () {
                params(2, 'spc', spc);
            }
        });
    } else {
        params(2, 'spc', spc);
    }
}

/* read wwa text from api */
function readWWA(id) {
    $('#modal .content').html(wwaTemplate);
    /*map.closePopup();*/
    openModal();

    $.ajax({
        url: apiUrl('getWWA', 2),
        method: 'POST',
        dataType: 'json',
        data: {
            id: id
        },
        success: function (a) {
            var a = a.wwa,
                r = '<h1 class="wwa" style="' + (a.title == 'Tornado Warning' || a.title == 'Severe Thunderstorm Warning' ? 'color:' + a.color + ';' : '') + 'border-color:' + a.color + '">' + a.title + '</h1><div class="row" style="margin:15px 0;font-size:18px;color:#4c4c4c;flex-wrap:nowrap"><div class="col" style="flex:1 1;min-width:40px;max-width:40px">' +
                    '<i class="fa-solid fa-location-dot" style="font-size:25px"></i></div><div class="col" style="line-height:1.2">' + a.area + '</div></div><div class="wwa-box"><div class="row" style="font-size:15px"><div class="col"><b>Issued</b><span>' +
                    a.issued + '</span></div><div class="col"><b>' + (a.onset ? 'Starts' : 'Expires') + '</b><span>' + (a.onset ? a.onset : a.expires) + '</span></div><div class="col"><b>Issued by</b><a target="blank" href="https://weather.gov/' + a.wfo.toLowerCase() + '" title="Issued by the National Weather Service in ' +
                    a.office + '"><span>NWS ' + a.office + '</span></a></div></div></div><div class="highlight">' + a.headline + '</div>' + (a.text.search('<p>') < 0 ? '<p>' + a.text + '</p>' : a.text) + (a.help && a.help != '<p></p>' ? '<hr><div style="text-transform:uppercase;letter-spacing:1px;color:#6a92cf">' +
                        (a.help.search('<p>') < 0 ? '<p>' + a.help + '</p>' : a.help) + '</div>' : '');

            setHeaders(a.title + ' issued by the National Weather Service in ' + a.office, 'weather/alert/' + id, 'The National Weather Service in ' + a.office + ' has issued a ' + a.title + ' for ' + a.area + ' until ' + a.expires + '.');

            $('#modal .content .container').html(r);
        }
    });
}

function getWWAs() {
    $.ajax({
        /*url: apiUrl('wwas'),*/
        url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6/query',
        method: 'POST',
        dataType: 'json',
        data: {
            where: '1=1',
            outFields: 'OBJECTID,Event,Affected,End_',
            returnGeometry: true,
            geometryPrecision: 6,
            geometry: getbbox(),
            f: 'geojson'
        },
        success: function (w) {
            var ww = L.geoJSON(w, {
                style: function (feature) {
                    return {
                        weight: 2,
                        color: wwaColors[feature.properties.Event],
                        fillOpacity: 0.4
                    }
                },
                onEachFeature: function (feature, layer) {
                    wwaIDs.push(feature.properties.OBJECTID);
                },
                filter: function (feature) {
                    return (wwaIDs.includes(feature.properties.OBJECTID) === false ? true : false);
                }
            })
                .bindPopup(loadingPopup, {
                    className: 'fire-popup',
                    minWidth: 250,
                    maxWidth: 275
                })
                .on('popupclose', function (t) {
                    /*this.setStyle({
                        weight: 2
                    });*/
                    t.popup.setContent(loadingPopup);
                })
                .on('click', function (t) {
                    /*this.setStyle({
                        weight: 4
                    });*/
                    map.fitBounds(t.layer.getBounds());
                    retrieveWWA(t, this);
                });

            wwas.addLayer(ww);
        },
        complete: function () {
            updateProgressBar('Weather alerts retrieved...');
            params(2, 'wwas', wwas);

            if (wwas) {
                var ac = c = 0;

                wwas.eachLayer(function (w) {
                    w.eachLayer(function (l) {
                        if (contains(l.getLatLngs()) === true) {
                            ac++;
                            inviewAlerts.push(c);
                        }
                        c++;
                    });
                });

                if (ac > 0) {
                    $('#alerts .notify').html((ac > 11 ? '11+' : ac)).show();
                } else {
                    $('#alerts .notify').html('').hide();
                }
            }
        }
    });
}

function riskChart() {
    var pie = $('#modal #d'),
        de = pie.attr('data-de'),
        ie = pie.attr('data-ie'),
        ne = pie.attr('data-ne');

    const data = {
        labels: ['Directly Exposed', 'Indirectly Exposed', 'Not Exposed'],
        datasets: [
            {
                label: 'Exposure',
                data: [de, ie, ne],
                backgroundColor: [
                    'rgb(255, 59, 84)',
                    'rgb(255, 143, 80)',
                    '#ccc'
                ]
            }
        ]
    };

    new Chart(pie, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: false,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ' ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

function viewRisk(i) {
    $('#modal .content').html(riskTemplate);
    openModal();

    $.ajax({
        url: apiUrl('risk/' + i, 2),
        method: 'post',
        dataType: 'json',
        success: function (data) {
            var place = data.area.name,
                state = data.area.state,
                type = data.area.level;

            setHeaders('Wildfire Risk for ' + place + ', ' + state, 'risk/' + i, '');

            const stat = {
                wl: {
                    'state': (data.data.wl.state * 100).toFixed(1),
                    'us': (data.data.wl.us * 100).toFixed(1),
                    'rank': data.data.wl.rank
                },
                rth: {
                    'state': (data.data.rth.state * 100).toFixed(1),
                    'us': (data.data.rth.us * 100).toFixed(1),
                    'rank': data.data.rth.rank
                },
                exp: {
                    'de': data.data.exposure.direct,
                    'ie': data.data.exposure.indirect,
                    'none': data.data.exposure.none
                }
            };

            if (stat['exp']['de'] + stat['exp']['ie'] < stat['exp']['none']) {
                var expose = 'Populated areas in ' + place + ' are not predominately exposed to wildfire (either directly or indirectly).',
                    ecl = 'not';
            } else {
                var expose = 'Populated areas in ' + place + ' are predominately exposed to <b>' + (stat['exp']['ie'] > stat['exp']['de'] ? 'in' : '') + 'direct</b> sources of wildfire (' + (stat['exp']['ie'] > stat['exp']['de'] ? 'embers or home-to-home ignition' : 'adjacent flammable vegetation') + ').',
                    ecl = (stat['exp']['ie'] > stat['exp']['de'] ? 'in' : '') + 'direct';
            }

            $('#modal #a').html('Wildfire Risk Report').removeClass('placeholder').addClass('wwa').css({
                'margin-bottom': '',
                'max-width': '',
                'height': '',
                'border-color': 'var(--red)'
            });

            $('#b').html(place + ', ' + state);

            $('#c').html('').append('<li><div class="rate ' + stat['wl']['rank'].toLowerCase().replace(' ', '-') + '"></div><p>' + place + ' has a <b style="border-bottom:1px dotted ' + riskColor(stat['wl']['rank']) + ';color:' + riskColor(stat['wl']['rank']) + '">' +
                stat['wl']['rank'].toUpperCase() + '</b> risk for wildfires, with a <b>' + stat['wl']['state'] + '%</b> greater risk, on average, than other ' +
                (type == 'county' ? 'counties' : 'communities') + ' in ' + state + '. Compared to other ' + (type == 'county' ? 'counties' : 'communities') + ' in the US, ' + place + ' has a ' + stat['wl']['us'] + '% greater risk.</p></li>');

            $('#c').append('<li><div class="rate ' + stat['rth']['rank'].toLowerCase().replace(' ', '-') + '"></div><p>There is a <b style="border-bottom:1px dotted ' + riskColor(stat['rth']['rank']) + ';color:' + riskColor(stat['rth']['rank']) + '">' +
                stat['rth']['rank'].toUpperCase() + '</b> risk to homes in ' + place + '&mdash;<b>' + stat['rth']['state'] + '%</b> greater risk, on average, than other ' +
                (type == 'county' ? 'counties' : 'communities') + ' in ' + state + '. Compared to other ' + (type == 'county' ? 'counties' : 'communities') + ' in the US, ' + place + ' has a ' + stat['rth']['us'] + '% greater risk.</p></li>');

            $('#c').append('<li><div class="rate ' + ecl + '"></div><p>' + expose + '</p></li>');

            $('#d').attr('data-de', stat['exp']['de'] * 100).attr('data-ie', stat['exp']['ie'] * 100).attr('data-ne', stat['exp']['none'] * 100);

            if (typeof (Chart) === 'undefined') {
                $.getScript('https://cdn.jsdelivr.net/npm/chart.js@' + chartJSVersion + '/dist/chart.umd.min.js', function () {
                    riskChart();
                });
            } else {
                riskChart();
            }
        }
    });
}

/* prepare the county wildfire risk report */
function viewRisk2(i) {
    $('#modal .content').html(riskTemplate);
    openModal();

    $.ajax({
        url: apiUrl('rth', 2),
        method: 'POST',
        dataType: 'json',
        data: {
            fips: i
        },
        success: function (data) {
            var r = data.risk.data,
                l1w = 100 / risk.whp.length;

            setHeaders('Wildfire Risk for ' + data.risk.county + ' County, ' + data.risk.state, 'risk/' + i, '');

            $('#modal #a').html('Wildfire Risk Report').removeClass('placeholder').addClass('wwa').css({
                'margin-bottom': '',
                'max-width': '',
                'height': '',
                'border-color': 'var(--red)'
            });
            $('#modal #b').html(data.risk.county + ' County, ' + data.risk.state);
            $('#modal #c').html(r.whp.legend.label);
            $('#modal #d').removeClass('placeholder').css('height', '').html('Populated areas in ' + data.risk.county + ' County have, on average, greater risk than <b>' + Math.round(r.whp.state * 100) + '%</b> of counties in ' + data.risk.state +
                ' and <b>' + Math.round(r.whp.nation * 100) + '%</b> of counties in the US.');

            risk.whp.forEach(function (e) {
                $('#modal #whp .c').append('<div class="i' + (r.whp.legend.label == e[0] ? ' active' : '') + '" style="width:' + l1w + '%;background-color:' + e[1] + '"></div>');
                $('#modal #whp .t').append('<div ' + (r.whp.legend.label == e[0] ? 'class="active" ' : '') + 'style="width:' + l1w + '%">' + (r.whp.legend.label == e[0] ? e[0] : '&nbsp;') + '</div>');
            });
        }
    });
}

function femaNRI() {
    if ($('input[id=nri]').is(':checked')) {
        console.info('Getting FEMA NRI data...');

        $.ajax({
            url: 'https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Counties/FeatureServer/0/query',
            method: 'POST',
            data: {
                where: '1=1',
                geometry: getbbox(),
                outFields: 'OBJECTID,NRI_ID,COUNTY,STATE,STATEABBRV,WFIR_EALT,WFIR_RISKR,EAL_SPCTL,POPULATION,BUILDVALUE,AGRIVALUE,AREA',
                geometryPrecision: 6,
                f: 'geojson'
            },
            dataType: 'json',
            success: function (data) {
                var c;

                nri = L.geoJSON(data, {
                    style: function (feature) {
                        switch (feature.properties.WFIR_RISKR) {
                            case 'Insufficient Data': c = '#9e9e9e'; break;
                            case 'No Rating': c = '#fff'; break;
                            case 'Very Low': c = '#4d6dBd'; break;
                            case 'Relatively Low': c = '#509bc7'; break;
                            case 'Relatively Moderate': c = '#f0D55d'; break;
                            case 'Relatively High': c = '#e07069'; break;
                            case 'Very High': c = '#c7445d'; break;
                        }

                        return {
                            weight: 2,
                            color: '#666',
                            fillColor: c,
                            opacity: 0.5,
                            fillOpacity: 0.7
                        }
                    },
                    filter: function (feature) {
                        return (nrics.indexOf(feature.properties.OBJECTID) < 0 ? true : false);
                    },
                    onEachFeature: function (feature, layer) {
                        var t = '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Wildfire Risk</div><div class="col" style="flex:1;line-height:1.2">' + feature.properties.WFIR_RISKR + '</div></div>' +
                            '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Wildfire Exp. Loss</div><div class="col">$' + numberFormat(parseFloat(feature.properties.WFIR_EALT), 2) + '</div></div>' +
                            '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Population</div><div class="col">' + numberFormat(feature.properties.POPULATION) + '</div></div>' +
                            '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Area</div><div class="col">' + numberFormat(Math.round(feature.properties.AREA)) + ' mi<sup>2</sup></div></div>' +
                            '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Building Values</div><div class="col">$' + numberFormat(feature.properties.BUILDVALUE) + '</div></div>' +
                            '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Agricultural Values</div><div class="col">$' + numberFormat(feature.properties.AGRIVALUE) + '</div></div>' +
                            '<div class="row"><div class="col" style="text-align:center;color:#bdbdbd;font-style:italic;font-size:15px">' + feature.properties.EAL_SPCTL.toFixed(1) + '% of counties in ' + feature.properties.STATE + ' have a lower Expected Annual Loss</div></div>' +
                            '<div class="row"><div class="col" style="justify-content:center"><a target="blank" class="btn btn-sm btn-light-blue" href="https://hazards.fema.gov/nri/report/viewer?dataLOD=Counties&dataIDs=' + feature.properties.NRI_ID + '">More details</a></div></div>';

                        layer.bindPopup(popup(feature.properties.COUNTY + ' County, ' + feature.properties.STATEABBRV, t), {
                            className: 'fire-popup',
                            minWidth: 275,
                            maxWidth: 275
                        });

                        nrics.push(feature.properties.OBJECTID);
                    }
                });
            },
            complete: function () {
                console.info('FEMA NRI data retrieved...');
                params(2, 'nri', nri);
            }
        });
    } else {
        params(2, 'nri', nri);
    }
}

/*function windSpeed() {
    if ($('.layersMenu #velocity').is(':checked')) {
        $.getJSON('https://onaci.github.io/leaflet-velocity/wind-global.json', function(data) {
            darkCanvas.addTo(map);
            console.info(data);

            velocity = L.velocityLayer({
                displayValues: true,
                displayOptions: {
                    velocityType: 'Wind',
                    position: 'bottomleft',
                    emptyString: '',
                    angleConvention: 'bearingCCW',
                    showBearing: false,
                    showCardinal: true,
                    speedUnit: 'mph',
                    directionString: 'Direction',
                    speedString: 'Speed'
                },
                data: data,
                particleAge: 64,
                particleMultiplier: 0.0033,
                particlelineWidth: 1,
                frameRate: 15,
                minVelocity: 0,
                maxVelocity: 10,
                velocityScale: 0.01,
                paneName: 'wind',
                opacity: 1
            })
            .addTo(map);
        });
    } else {
        map.removeLayer(velocity);
        darkCanvas.removeFrom(map);
    }
}*/

function getFires() {
    var firOps = (archive ? ['all'] : ['all', 'new', 'smk', 'rx', 'canada']),
        ms = new Date().getTime();

    if (archive) {
        $('body').append('<div class="screen-loading"><div class="spinner"></div></div>');
    }

    firOps.forEach(function (w, ct) {
        $.ajax({
            /*url: 'https://www.fwavy.com/api/v2/fires?token=cd62b422f5f06384ff76db30894fa8b20dd1edf5&application=1',*/
            url: apiUrl('wildfires/' + w, 2),
            method: 'POST',
            data: {
                /*callback: 'fires',
                request: w,*/
                archive: (archive ? archive : 0)
            },
            dataType: 'json',
            success: function (data) {
                if (data.features) {
                    var m = L.geoJson(data, {
                        pointToLayer: function (feature, latlng) {
                            var fire = feature.properties,
                                wfid = fire.wfid,
                                d = fire.time.discovered,
                                u = fire.time.updated,
                                diff = Math.round(curTime.getTime() / 1000) - d,
                                t = fire.type,
                                st = fire.state,
                                ac = acres(fire.acres),
                                n = fireName(fire.name, fire.type, fire.incidentId),
                                status = fireStatus(fire.status),
                                notes = fire.notes;

                            if (status != 'unknown' && (diff < 172000 || diff >= 172000 && ac != 0)) {
                                return L.marker(latlng, {
                                    title: n,
                                    icon: fireIcon(t, d, u, ac, status, notes),
                                    wfid: wfid,
                                    type: t,
                                    state: st,
                                    dt: d,
                                    up: u,
                                    acres: ac,
                                    status: status,
                                    url: fire.url
                                });
                            }
                        },
                        onEachFeature: function (feature, layer) {
                            layer.on('click', function () {
                                /* open wildfire modal and store click data */
                                if (this.options.state.substr(0, 2) == 'CA' && this.options.state.length > 2) {
                                    var ac = String(this.options.acres),
                                        prov = stateLabels[String(this.options.state.substr(2, 2))],
                                        stat = this.options.status,
                                        m = '<div style="color:#5a5a5a;font-size:16px"><h1 style="color:var(--blue);font-size:24px;font-family:dosis;margin-bottom:15px">' + this.options.title + '</h1>' +
                                            '<span class="status ' + stat + '" style="display:inline-block;margin:5px 0 10px 0">' + stat.toUpperCase() + '</span><p style="font-weight:100;margin:5px 0"><b style="font-weight:400">Province:</b> ' + (prov ? prov : this.options.state.substr(2, 2)) + '</p>' +
                                            '<p style="font-weight:100;margin:5px 0"><b style="font-weight:400">Size:</b> ' + sizing(2, ac.replaceAll(',', '')) + ' ' + sizing(1).toLowerCase() + '</p><p style="font-weight:100;margin:5px 0"><b style="font-weight:400">Started:</b> ' +
                                            timeAgo(this.options.dt) + '</p><p class="updated">Last updated ' + timeAgo(this.options.up) + ' via <span style="border-bottom:1px dotted #333;cursor:help" title="Canadian Interagency Forest Fire Centre">CIFCC</span></p></div>';

                                    layer.bindPopup(m, {
                                        minWidth: 250,
                                        maxWidth: 275
                                    });
                                } else {
                                    fireDetails(this.options.wfid);
                                }
                                logFire(this.options);

                                /* send data to GA4 */
                                gtag("event", "click", {
                                    fire_name: feature.properties.name + ' (' + feature.properties.state + ')',
                                    fire_url: host + feature.properties.url,
                                });
                            });
                        }
                    });

                    /* add individual fires to their appropriate feature group */
                    if (w == 'all' || w == 'canada') {
                        allFires.addLayer(m);
                    } else if (w == 'new') {
                        newFires.addLayer(m);
                    } else if (w == 'smk') {
                        smokeChecks.addLayer(m);
                    } else if (w == 'rx') {
                        rxBurns.addLayer(m);
                    }
                }

                /* show fires on map if no user auth or settings are specified */
                if (w == 'all' || w == 'canada') {
                    params(2, 'allFires', allFires);
                } else if (w == 'new') {
                    params(2, 'newFires', newFires);
                } else if (w == 'smk') {
                    params(2, 'smokeChecks', smokeChecks);
                } else if (w == 'rx') {
                    params(2, 'rxBurns', rxBurns);
                }
            },
            complete: function () {
                if (firOps.length - 1 == ct) {
                    tracked.forEach(function (i) {
                        var f = findFire(i);

                        if (f != undefined) {
                            $('#tracked').append(f.options.title + ' ' + stateLabels[f.options.state] + ' ' + f.options.acres);
                        }
                    });

                    calcNearbyFir();
                }

                console.info(w.toUpperCase() + ' fire data loaded in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
                updateProgressBar('Wildfires loaded...');
            }
        });
    });
}

/* find any fires within a certain distance of the user */
function calcNearbyFir() {
    const milesAway = 37.5;

    if (geoLocation) {
        [allFires, newFires, smokeChecks, rxBurns].forEach(function (w) {
            if (w.getLayers()[0]) {
                w.getLayers()[0].getLayers().forEach(function (f) {
                    var c = f.feature.geometry.coordinates;

                    if (distance(c[1], c[0], geoLocation[0], geoLocation[1]) <= milesAway) {
                        localIncidents.push(f.feature.properties);
                    }
                });
            }
        });

        var ti = localIncidents.length;

        if (hasPermission(user, actions.PREMIUM_DATA) && ti > 0) {
            $('#local').addClass('active').attr('data-count', ti).attr('title', 'There\'s ' + ti + ' incident' + (ti != 1 ? 's' : '') + ' near you');
        }
        /*showLocalIncidents();*/
    }
}

function modisHotspots(w) {
    var ms = new Date(),
        d1 = new Date(ms.getTime() - 86400000),
        d2 = new Date(ms.getTime() - 172800000),
        d3 = new Date(ms.getTime() - 259200000),
        fd1 = (d1.getMonth() + 1) + '/' + d1.getDate() + '/' + d1.getFullYear() + ' ' + d1.getHours() + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes(),
        fd2 = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear() + ' ' + d2.getHours() + ':' + (d2.getMinutes() < 10 ? '0' : '') + d2.getMinutes(),
        fd3 = (d3.getMonth() + 1) + '/' + d3.getDate() + '/' + d3.getFullYear() + ' ' + d3.getHours() + ':' + (d3.getMinutes() < 10 ? '0' : '') + d3.getMinutes();

    console.info('Getting VIIRS (' + w + ') hotspots...');

    $.ajax({
        url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query',
        method: 'POST',
        data: {
            where: 'acq_time >= DATE \'' + (w == 1 ? fd1 : (w == 2 ? fd2 : fd3)) + ':00\'' + (w != 1 ? ' AND acq_time <= DATE \'' + (w == 2 ? fd1 : fd2) + ':00\'' : ''),
            outFields: '*',
            geometry: getbbox(),
            geometryPrecision: 6,
            returnGeometry: true,
            f: 'geojson'
        },
        dataType: 'json',
        success: function (data) {
            var m = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    var t = (new Date().getTime() - feature.properties.acq_time) / 1000,
                        c = (t < 43200 ? '12' : (t >= 43200 && t < 86400 ? '24' : (t >= 86400 && t < 129600 ? '36' : (t >= 129600 && t < 172800 ? '48' : '72'))));

                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'modis t' + c,
                            html: '<i class="fas fa-times"></i>'
                        })
                    });
                },
                onEachFeature: function (feature, layer) {
                    hspts.push(feature.properties.OBJECTID);
                },
                filter: function (feature) {
                    return (hspts.indexOf(feature.properties.OBJECTID) < 0 ? true : false);
                }
            });

            if (w == 1) {
                modis24.addLayer(m);
            } else if (w == 2) {
                modis48.addLayer(m);
            } else {
                modis72.addLayer(m);
            }
        },
        complete: function () {
            updateProgressBar('VIIRS ' + w + ' hotspots loaded...');

            if (w == 1) {
                params(2, 'modis24', modis24);
            } else if (w == 2) {
                params(2, 'modis48', modis48);
            } else {
                params(2, 'modis72', modis72);
            }

            console.info('VIIRS (' + w + ') hotspots loaded in ' + ((new Date().getTime() - ms.getTime()) / 1000) + ' secs');
        }
    });
}

function calfireAdminUnits() {
    if ($('input[id=calfireUnits]').is(':checked')) {
        $.ajax({
            url: 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/cdfadmin19_1/FeatureServer/0/query',
            method: 'POST',
            data: {
                where: '1=1',
                outFields: 'UNIT,UNITCODE,REGION',
                geometryPrecision: 6,
                returnGeometry: true,
                f: 'geojson'
            },
            dataType: 'json',
            success: function (data) {
                calfireUnits = L.geoJSON(data, {
                    style: function (feature) {
                        return {
                            color: '#177ca3',
                            weight: 3,
                            fillOpacity: 0.1
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        layer.bindPopup(popup(feature.properties.UNIT, '<b>Region:</b> ' + feature.properties.REGION + '<br><b>Unit Code:</b> ' + feature.properties.UNITCODE), {
                            className: 'fire-popup',
                            minWidth: 225,
                            maxWidth: 250
                        });
                    }
                });
            },
            complete: function () {
                params(2, 'calfireUnits', calfireUnits);
            }
        });
    } else {
        params(2, 'calfireUnits', calfireUnits);
    }
}

function getGACCBounds() {
    if ($('input[id=gaccBounds]').is(':checked')) {
        $.ajax({
            url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_GACC_Current/FeatureServer/0/query',
            method: 'POST',
            data: {
                where: '1=1',
                outFields: 'OBJECTID,GACCUnitID,GACCName,GACCLocation',
                geometryPrecision: 6,
                returnGeometry: true,
                f: 'geojson'
            },
            dataType: 'json',
            success: function (data) {
                var a = L.geoJSON(data, {
                    style: function (feature) {
                        return {
                            color: '#282829',
                            weight: 3,
                            fillOpacity: 0
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        layer.bindPopup(popup(feature.properties.GACCUnitID, '<p style="margin:0;text-align:center;line-height:1.2"><b>' + feature.properties.GACCName + '</b><br>' + feature.properties.GACCLocation + '</p>'), {
                            className: 'fire-popup',
                            minWidth: 225,
                            maxWidth: 250
                        });

                        gaccs.push(feature.properties.OBJECTID);
                    },
                    filter: function (feature) {
                        return (gaccs.indexOf(feature.properties.OBJECTID) < 0 ? true : false);
                    }
                });

                gaccBounds.addLayer(a);
            },
            complete: function () {
                params(2, 'gaccBounds', gaccBounds);
            }
        });
    } else {
        params(2, 'gaccBounds', gaccBounds);
    }
}

function getPSAs() {
    if ($('input[id=erc]').is(':checked')) {
        $.ajax({
            url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_PSA_Current/FeatureServer/0/query',
            method: 'POST',
            data: {
                where: '1=1',
                outFields: 'OBJECTID,PSANationalCode',
                geometry: getbbox(),
                geometryPrecision: 6,
                returnGeometry: true,
                f: 'geojson'
            },
            dataType: 'json',
            success: function (data) {
                erc = L.geoJSON(data, {
                    style: function (feature) {
                        return {
                            color: '#177ca3',
                            weight: 3,
                            fillOpacity: 0.1
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        var sc = feature.properties.PSANationalCode.substr(0, 2),
                            url;
                        if (sc == 'NW') {
                            url = 'https://gacc.nifc.gov/nwcc/content/products/fwx/matrices/' + feature.properties.PSANationalCode + '_ERC.jpg';
                        } else if (sc == 'SA') {
                            url = 'https://gacc.nifc.gov/sacc/predictive/weather/99_dsi_stuff/gnfdrs7/chart_png/' + feature.properties.PSANationalCode + '_ERC.png';
                        } else {
                            var v = (sc == 'NC' || sc == 'SW' ? 'g' : (sc == 'EA' ? '' : 'y'));
                            url = 'https://www.wfas.net/plot/plot_sig3.php?SIG=' + feature.properties.PSANationalCode + '&INDEX=ERC' + v + '&BEGINDATE=1/1&ENDDATE=' + (curTime.getMonth() + 1) + '/' + curTime.getDate();
                        }

                        layer.bindPopup(popup(feature.properties.PSANationalCode + ' ERC', '<a target="blank" href="' + url + '"><img src="' + url + '" style="width:100%"></a>'), {
                            className: 'fire-popup',
                            minWidth: 300,
                            maxWidth: 325
                        });

                        psas.push(feature.properties.OBJECTID);
                    },
                    filter: function (feature) {
                        return (psas.indexOf(feature.properties.OBJECTID) < 0 ? true : false);
                    }
                });
            },
            complete: function () {
                params(2, 'erc', erc);
            }
        });
    } else {
        params(2, 'erc', erc);
    }
}

function nwsFireWX() {
    if ($('input[id=nwsfire]').is(':checked')) {
        $.ajax({
            url: 'https://idpgis.ncep.noaa.gov/arcgis/rest/services/NWS/nws_reference_map/MapServer/9/query',
            method: 'POST',
            data: {
                outFields: '*',
                geometry: getbbox(),
                geometryPrecision: 6,
                returnGeometry: true,
                f: 'geojson'
            },
            dataType: 'json',
            success: function (data) {
                var n = L.geoJSON(data, {
                    style: function (feature) {
                        return {
                            color: '#ffc107',
                            weight: 2,
                            fillOpacity: 0
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        var zoneName = feature.properties.name,
                            zid = feature.properties.state_zone;

                        layer.on('click', function () {
                            /*for (var x = 0; x < nwsFire.getLayers().length; x++) {
                                for (var z = 0; z < nwsFire.getLayers()[x].getLayers().length; z++) {
                                    nwsFire.getLayers()[x].getLayers()[z].setStyle({
                                        fillOpacity: 0,
                                        weight: 2
                                    });
                                }
                            }*/

                            this.setStyle({
                                fillOpacity: 0.3,
                                weight: 4
                            });

                            map.fitBounds(this.getBounds());
                            fireFcst(feature.properties.cwa, zid, zoneName);
                        });

                        nfwz.push(feature.properties.OBJECTID);
                    },
                    filter: function (feature) {
                        return (nfwz.indexOf(feature.properties.objectid) < 0 ? true : false);
                    }
                });

                nwsFire.addLayer(n);
            },
            complete: function () {
                params(2, 'nwsfire', nwsFire);
            }
        });
    } else {
        params(2, 'nwsfire', nwsFire);
    }
}

function fireFcst(off, zid, zn) {
    var zoneName = zn;
    $('#modal .content').html('<div class="container">' + nwsFireFcst + '</div>');
    openModal();

    $.ajax({
        url: 'https://api.weather.gov/products/types/FWF/locations/' + off.toUpperCase(),
        method: 'GET',
        dataType: 'json',
        success: function (g) {
            var p = JSON.parse(JSON.stringify(g).replaceAll('@', ''));

            if (p.graph.length == 0) {
                closeModal();
                notify('error', 'Fire weather forecast is not available here at this time.');
            } else {
                var pid = p.graph[0].id;

                $.ajax({
                    url: apiUrl('fwf/' + pid, 1),
                    method: 'POST',
                    data: {
                        zone: zid
                    },
                    dataType: 'json',
                    success: function (f) {
                        var zoneName = (zoneName ? zoneName : f.fwf.name);
                        setHeaders('Fire Weather Forecast for ' + zoneName + ' (' + zid + ')', 'weather/fire/' + off.toUpperCase() + '/' + zid, 'Read the latest fire weather forecast for ' + zoneName + ' issued by the National Weather Service in ' + f.fwf.wfo + '.');
                        $('#modal .content .container').html('<h1>Fire Weather Forecast for ' + zoneName + '</h1><p style="font-size:14px;font-weight:400;color:gray">Forecast last updated:&nbsp;' + timeAgo(f.fwf.updated) + ' by NWS ' + f.fwf.wfo + '</p>' + f.fwf.text);
                    }
                });
            }
        }
    });
}

function dispatchBounds() {
    if ($('input[id=dispatch]').is(':checked')) {
        $.ajax({
            url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_Dispatch_Current/FeatureServer/0/query',
            method: 'POST',
            data: {
                outFields: 'OBJECTID,DispName,DispUnitID,DispLocation,ContactPhone',
                geometry: getbbox(),
                geometryPrecision: 6,
                returnGeometry: true,
                f: 'geojson'
            },
            dataType: 'json',
            success: function (data) {
                var a = L.geoJSON(data, {
                    style: function (feature) {
                        return {
                            color: '#444',
                            weight: 2,
                            fillOpacity: 0.1
                        }
                    },
                    onEachFeature: function (feature, layer) {
                        var t = '<center><h3>' + feature.properties.DispName + '&nbsp;(' + feature.properties.DispUnitID.substr(2) + ')</h3><p style="margin:5px 0;line-height:1.2">' +
                            feature.properties.DispLocation + (feature.properties.ContactPhone ? '<br>' + feature.properties.ContactPhone : '') + '</p></center>';

                        layer.on('click', function () {
                            this.setStyle({
                                weight: 5,
                                color: '#00385c'
                            });
                        })
                            .on('popupclose', function () {
                                this.setStyle({
                                    weight: 3,
                                    color: '#444'
                                });
                            })
                            .bindPopup(popup('Dispatch Center', t), {
                                className: 'fire-popup',
                                minWidth: 200,
                                maxWidth: 250
                            });

                        idcb.push(feature.properties.OBJECTID);
                    },
                    filter: function (feature) {
                        return (idcb.indexOf(feature.properties.OBJECTID) < 0 ? true : false);
                    }
                });

                dispatch.addLayer(a);
            },
            complete: function () {
                params(2, 'dispatch', dispatch);
            }
        });
    } else {
        params(2, 'dispatch', dispatch);
    }
}

function loadPerimeters() {
    var y = (settings.archive ? settings.archive : curTime.getFullYear()),
        min = settings.perimeters.minSize,
        ms = new Date().getTime(),
        pc = '';

    console.info('Loading perimeters...');

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
                                '<span style="display:block;text-align:center;font-weight:100;font-size:25px;">' + numberFormat((settings.archive ? fp.GIS_ACRES : (fp.poly_GISAcres ? fp.poly_GISAcres : fp.poly_Acres_AutoCalc)), 0) +
                                ' acres</span><small style="display:block;text-align:center;padding-top:15px;font-style:italic;line-height:1.2">Last mapped ' + timeAgo((settings.archive ? DATE_CUR : fp.poly_DateCurrent) / 1000) + (settings.archive ? (fp.MAP_METHOD ? ' using ' + fp.MAP_METHOD : '') : (fp.poly_MapMethod ? ' using ' + fp.poly_MapMethod : '')) + '</small>'), {
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
            }
        },
        complete: function () {
            updateProgressBar('Perimeters loaded...');
            console.info('Perimeters loaded in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
            params(2, 'perimeters', perimeters);
        }
    });
}

function searchPerims(v) {
    var r = '',
        args = [],
        x = 0,
        y = 0;

    perimeters.getLayers().forEach(function (p, a) {
        if (p.getLayers().length > 0) {
            p.getLayers().forEach(function (e) {
                if (e.getTooltip()) {
                    var fp = e.feature.properties,
                        n = e.getTooltip().getContent(),
                        p = similarText(n.replace(' Fire', '').toLowerCase(), v.toLowerCase());

                    if (n.toLowerCase().search(v.toLowerCase()) >= 0 && p >= 0.2) {
                        var a = (settings.archive ? fp.GIS_ACRES : (fp.poly_GISAcres ? fp.poly_GISAcres : fp.poly_Acres_AutoCalc));
                        args.push([n, fp.attr_POOState, a, x, y]);
                    }

                    y++;
                }
            });
        }
        x++;
    });
    args.sort().reverse();

    args.forEach(function (f) {
        r += '<div id="result" data-type="perim" data-x="' + f[3] + '" data-y="' + f[4] + '"><div class="text"><h3>' + f[0].replace(v, '<b>' + v + '</b>') + '</h3>' +
            '<p>Wildfire Perimeter in <b>' + stateLabels[f[1].replace('US-', '')] + '</b> &middot; <span style="color:#ff6686">' + sizing(2, f[2]) + ' ' + sizing(1).toLowerCase() + '</span></p></div></div>';
    });

    $('#search-results').append(r);

    return args.length;
}

function searchFires(v) {
    var arr = [],
        args = [],
        r = '';

    if ($('#newFires').is(':checked') && newFires.getLayers().length > 0) {
        for (var i = 0; i < newFires.getLayers().length; i++) {
            arr.push(newFires.getLayers()[i].getLayers());
        }
    }

    if ($('#allFires').is(':checked') && allFires.getLayers().length > 0) {
        for (var i = 0; i < allFires.getLayers().length; i++) {
            arr.push(allFires.getLayers()[i].getLayers());
        }
    }

    if ($('#smokeChecks').is(':checked') && smokeChecks.getLayers().length > 0) {
        for (var i = 0; i < smokeChecks.getLayers().length; i++) {
            arr.push(smokeChecks.getLayers()[i].getLayers());
        }
    }

    if ($('#rxBurns').is(':checked') && rxBurns.getLayers().length > 0) {
        for (var i = 0; i < rxBurns.getLayers().length; i++) {
            arr.push(rxBurns.getLayers()[i].getLayers());
        }
    }

    /* iterate through the fire layers that are turned on, then iterate through each fire that is shown on the map */
    for (var x = 0; x < arr.length; x++) {
        for (var i = 0; i < arr[x].length; i++) {
            var a = arr[x][i].options.acres,
                ts = arr[x][i].options.state,
                s = (ts.substr(0, 2) == 'CA' && ts.length > 2 ? (stateLabels[ts.substr(2, 2)] == undefined ? 'Canada' : stateLabels[ts.substr(2, 2)]) : stateLabels[ts]),
                n = arr[x][i].options.title,
                t = arr[x][i].options.type,
                id = arr[x][i].options.wfid,
                sta = arr[x][i].options.status,
                lat = arr[x][i].getLatLng().lat,
                lon = arr[x][i].getLatLng().lng,
                p = similarText(n.replace(' Fire', '').toLowerCase(), v.toLowerCase());

            if (n.toLowerCase().search(v.toLowerCase()) >= 0/* && p >= 0.2*/) {
                args.push([p, n, s, a, t, id, sta, lat, lon]);
            }
        }
    }
    args.sort().reverse();

    args.forEach(function (f) {
        r += '<div id="result" data-type="fire" data-wfid="' + f[5] + '" data-status="' + f[6] + '" data-lat="' + f[7] + '" data-lon="' + f[8] + '"><!--<div class="icon"><i class="fal fa-fire"></i></div>--><div class="text"><h3>' + f[1].replace(v, '<b>' + v + '</b>') + '</h3>' +
            '<p>' + f[4] + ' in <b>' + f[2] + '</b> &middot; <span style="color:#ff6686">' + sizing(2, f[3]) + ' ' + sizing(1).toLowerCase() + '</span></p></div></div>';
    });

    $('#search-results').append(r);

    return args.length;
}

function query(q) {
    var qLen = q.length;

    if (qLen == 0) {
        $('#q').val('').blur();
        $('#search-results').hide();
    } else if (qLen >= 2) {
        $('#search-results').show();
        var currentRequest = null,
            do1 = searchFires(q),
            do2 = searchPerims(q);

        $('#search-results .default').hide();

        currentRequest = jQuery.ajax({
            url: apiUrl('search', 2),
            type: 'POST',
            data: {
                q: q
            },
            beforeSend: function () {
                if (currentRequest != null) {
                    currentRequest.abort();
                }
            },
            success: function (res) {
                var q = '',
                    oq = new RegExp(this.data.split('=')[1], 'gmi');

                if (res.rs != null && res.rs.length > 0) {
                    res.rs.forEach(function (r) {
                        var n = r.name.replace(oq, '<b>$&</b>'),
                            c = (r.county ? r.county : ''),
                            g = (r.geoType ? r.geoType : ''),
                            t = r.type,
                            a = r.lat,
                            b = r.lon;

                        if (n.search(',') >= 0) {
                            var s = stateLabels[n.match(/,\s([A-Z]+)/gm)[0].replace(', ', '')];
                        } else {
                            var s = '';
                        }

                        if (t == 'City') {
                            q += '<div id="result" data-type="city" data-lat="' + a + '" data-lon="' + b + '" title="' + n + '"><!--<div class="icon"><i class="fal fa-city"></i></div>--><div class="text"><h3>' + n +
                                '</h3><p><b>City</b> in ' + c + ' County &middot; ' + s + '</p></div></div>';
                        } else if (t == 'State') {
                            q += '<div id="result" data-type="state" data-lat="' + a + '" data-lon="' + b + '" title="' + n + '"><!--<div class="icon"><i class="far fa-earth-americas"></i></div>--><div class="text"><h3>' + n +
                                '</h3><p>State</p></div></div>';
                        } else if (t == 'GIS') {
                            q += '<div id="result" data-type="gis" data-lat="' + a + '" data-lon="' + b + '" title="' + n + '"><!--<div class="icon"><i class="fal fa-city"></i></div>--><div class="text"><h3>' + n +
                                '</h3><p><b>' + g + '</b> in ' + c + ' County &middot; ' + s + '</p></div></div>';
                        }
                    });

                    if (do1 == 0 && do2 == 0) {
                        $('#search-results').html(q);
                    } else {
                        $('#search-results').append(q);
                    }
                }
            }
        });
    }
}

function search(v, e) {
    clearTimeout(typeTimer);
    var kc = [16, 17, 18, 19, 20, 40, 32, 37, 38, 39];

    if (kc.includes(e.keyCode) === false && e.ctrlKey === false) {
        $('#search-results').html('<div class="default">Searching fires and places...</div>').show();

        typeTimer = setTimeout(function () {
            if (v == '') {
                $('#search-results').html(events);
            } else {
                query(v);
            }
        }, 750);
    }
}

/* generate forecast model times */
function initNDFDTimes() {
    for (var i = 0; i < 24; i++) {
        var t = new Date(ndfdTime(i)),
            y = t.getUTCFullYear(),
            m = (t.getUTCMonth() + 1),
            m = (m < 10 ? '0' : '') + m,
            d = t.getUTCDate(),
            d = (d < 10 ? '0' : '') + d,
            h = t.getUTCHours(),
            h = (h < 10 ? '0' : '') + h,
            ts = y + '-' + m + '-' + d + 'T' + h + ':00:00.000Z',
            lh = (t.getHours() > 12 ? t.getHours() - 12 : t.getHours()) + ':00';

        /*h = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())) + ':00 ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M';*/

        $('[id^=fcstTime]').append('<option ' + (settings.special && settings.special.fcstTime == ts ? 'selected ' : '') + 'value="' + ts + '">' + (lh == 0 ? '12' : lh) + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M' + '</option>');
    }
    $('[id^=fcstTime] option[value=""]').remove();
}

$(document).ready(function () {
    /* save list of fires user clicked on during their visit every 30 seconds */
    setInterval(function () {
        saveLogFire();
    }, 30000);

    /* get user location right off the bat if they'll allow it */
    navigator.geolocation.getCurrentPosition(function (pos) {
        geoLocation = [pos.coords.latitude, pos.coords.longitude, mToFt(pos.coords.accuracy)];
    });

    /* set layers menu */
    Object.keys(layers.layers).forEach(k => {
        layersMenu += '<div class="group" title="' + layers.categories[k] + '"' + (layers.categories[k] == 'California' ? ' style="display:none"' : '') + '><div class="group-title">' + layers.categories[k] + '</div><ul>';

        /* layers within each grouping */
        layers.layers[k].forEach(function (l, n) {
            layersMenu += '<li class="layer' + (!l.name ? ' grouped' : '') + '" data-p="' + l.perms + '" data-id="' + l.id + '" style="display:none"><div class="checkbox">' +
                '<input type="checkbox" data-type="' + l.type + '" id="' + l.id + '"' + (l.default === true && !settings.checkboxes || (settings.checkboxes && settings.checkboxes.includes(l.id)) ? ' checked' : '') + '>' +
                '<label for="' + l.id + '" style="font-size:13px"><span>' + (l.name ? '<h3>' + l.name + '</h3>' : '') + layerDesc[k][n] + '</span></label></div>';

            if (l.id == 'perimeters') {
                layersMenu += '<div id="perimeterSize"><i class="fad fa-filters" style="color:#b9b9b9"></i><input type="range" class="slider" min="0" max="1000" step="25" value="' + settings.perimeters.minSize + '">' +
                    '<div id="pSize">' + settings.perimeters.minSize + ' acres</div></div>';
            } else if (l.id == 'ndfd') {
                layersMenu += '<div id="models"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select id="forecastModel" style="max-width:45%"><option ' + (settings.special && settings.special.forecastModel == 'apparent_temperature' || !settings.special ? 'selected ' : '') + 'value="apparent_temperature">Temperature</option>' +
                    '<option ' + (settings.special && settings.special.forecastModel == 'relative_humidity' ? 'selected ' : '') + 'value="relative_humidity">Humidity</option><option ' + (settings.special && settings.special.forecastModel == 'wind_speed' ? 'selected ' : '') + 'value="wind_speed">Wind Speed</option>' +
                    '<option ' + (settings.special && settings.special.forecastModel == 'total_sky_cover' ? 'selected ' : '') + 'value="total_sky_cover">Cloud Cover</option><option ' + (settings.special && settings.special.forecastModel == '12hr_precipitation_probability' ? 'selected ' : '') + 'value="12hr_precipitation_probability">12-hr POPs</option></select>' +
                    '<select id="fcstTime" data-type="reg" style="max-width:35%"><option value="">Loading...</option></select></div>';
            } else if (l.id == 'sfp') {
                layersMenu += '<div id="sfpDate"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select id="sfpDateSelect" style="max-width:87%"></select></div>';
            } else if (l.id == 'spc') {
                layersMenu += '<div id="otlks"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select id="otlkType" style="max-width:55%"><option ' + (settings.special && settings.special.otlkType == 'fire' ? 'selected ' : '') + 'value="fire">Fire Weather</option>' +
                    '<option ' + (settings.special && settings.special.otlkType == 'severe' ? 'selected ' : '') + 'value="severe">Severe/Convective</option></select>' +
                    '<select id="otlkDay" style="max-width:30%"><option ' + (settings.special && settings.special.otlkDay == 1 ? 'selected ' : '') + 'value="1">Day 1</option>' +
                    '<option ' + (settings.special && settings.special.otlkDay == 2 ? 'selected ' : '') + 'value="2">Day 2</option>' +
                    '<option ' + (settings.special && settings.special.otlkDay == 3 ? 'selected ' : '') + 'value="3">Day 3</option></select></div>';
            }

            layersMenu += '</li>';
        });

        layersMenu += '</ul></div>';
    });

    /* add archive years to select menu */
    for (var y = curTime.getFullYear(); y > 2014; y--) {
        $('#yearChange .select-options').append('<li rel="' + y + '">' + y + '</li>');
    }
    $('#yearChange .select-styled').html('Archive Year');

    /* create dynamic legend from json array */
    var r = '';
    legend.categories.forEach(function (c) {
        var k = Object.keys(c)[0];
        r += '<h4>' + c[k] + '</h4>';

        legend.items[k].forEach(function (l) {
            r += '<div class="row"><div class="ic">' + (l[0] == 'icon' ? l[1] : '<div class="color" style="background-color:' + l[2] + '">' + (l[1] ? l[1] : '') + '</div>') +
                '</div><div class="desc">' + l[3] + '</div></div>';
        });
    });

    $('.legend').html(r);

    /* append various features in the right, impact menu */
    $('#impact .wrapper').append('<div class="layersMenu" style="display:none">' + layersMenu + '</div>')
        /*.append('<div class="loginForm" style="display:none">' + loginForm + createForm + forgotForm + '</div>')*/
        .append('<div class="account" style="display:none;text-align:center">' + accountForm + '</div>');

    updateProgressBar('Layers loading...');
    initNDFDTimes();

    for (var z = 0; z < 6; z++) {
        var t = new Date(new Date().getTime() + (z * 24 * 60 * 60 * 1000)),
            d = days[t.getUTCDay()] + ', ' + months[t.getUTCMonth()] + ' ' + t.getUTCDate(),
            v = t.getUTCFullYear() + '-' + (t.getUTCMonth() < 10 ? '0' : '') + (t.getUTCMonth() + 1) + '-' + (t.getUTCDate() < 10 ? '0' : '') + t.getUTCDate() + 'T00:00:00.0Z';

        $('#sfpDateSelect').append('<option ' + (settings.special && settings.special.sfpDate == v ? 'selected ' : '') + 'value="' + v + '">' + d + (z == 0 ? ' (Today)' : (z == 1 ? ' (Tomorrow)' : '')) + '</option>');
    }

    var hrrrSmokeTime = {
        "init": gmtime(-3600),
        "fcst": gmtime(-3600)
    };

    countyBounds = L.tileLayer.wms('https://new.nowcoast.noaa.gov/arcgis/rest/services/nowcoast/mapoverlays_political/MapServer/export', {
        className: 'counties',
        id: 'Counties',
        layers: 'show:2',
        format: 'png32',
        transparent: true,
        size: '1569,518',
        tileSize: L.point(1569, 518),
        bboxSR: 102100,
        imageSR: 102100,
        crs: L.CRS.EPSG3857,
        f: 'image',
        opacity: 1
    });

    /*https://www.mapotechnology.com/assets/images/tiles/esri/{z}/{y}/{x}.png*/
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
    });

    delorme = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}', {
        id: 'DeLorme',
        minZoom: 3,
        maxZoom: 12,
        attribution: 'Tiles &copy; <a href="https://garmin.com">Garmin</a>'
    });

    usgs = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        id: 'USGS',
        minZoom: 3,
        maxZoom: 18,
        attribution: 'Tiles &copy; <a href="https://usgs.gov">USGS</a>'
    });

    carto = L.tileLayer('https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {
        id: 'DeLorme',
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

    modis = L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wms.cgi', {
        layers: 'MODIS_Terra_CorrectedReflectance_TrueColor',
        format: 'image/png',
        transparent: true,
        size: '256,256',
        minZoom: 2,
        maxZoom: 10,
        crs: L.CRS.EPSG4326,
        tilematrixset: '250m',
        time: modis_date.getFullYear() + '-' + ((modis_date.getMonth() + 1) < 10 ? 0 : '') + (modis_date.getMonth() + 1) + '-' + (modis_date.getDate() < 10 ? 0 : '') + modis_date.getDate()
    });

    darkCanvas = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        id: 'Dark Gray Canvas',
        minZoom: 3,
        maxZoom: 18,
        attribution: attrib
    });

    /* WMS tile image overlay layers */
    /*https://tiles.lightningmaps.org/?x={x}&y={y}&z={z}&s=256&t=5*/
    lightning1 = L.tileLayer(apiUrl('lightning', 1) + '&x={x}&y={y}&z={z}&s=256&t=5', {
        id: '1-hr Lightning',
        minZoom: 3,
        maxZoom: 14,
        opacity: 1,
        attribution: attrib
    });

    /*https://tiles.lightningmaps.org/?x={x}&y={y}&z={z}&s=256&t=6*/
    lightning24 = L.tileLayer(apiUrl('lightning', 1) + '&x={x}&y={y}&z={z}&s=256&t=6', {
        id: '24-hr Lightning',
        minZoom: 3,
        maxZoom: 14,
        opacity: 1,
        attribution: attrib
    });

    /*ndfd = L.tileLayer.wms('https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_time/MapServer/export', {
        id: 'NWS NDFD',
        layers: 'show:' + (settings.special && settings.special.forecastModel ? settings.special.forecastModel : 31),
        dpi: 90,
        size: '584,627',
        tileSize: L.point(584, 627),
        transparent: true,
        crs: L.CRS.EPSG3857,
        format: 'png32',
        f: 'image',
        opacity: 0.7
    });*/

    ndfd = L.tileLayer.wms('https://nowcoast.noaa.gov/geoserver/ndfd_temperature/wms', {
        service: 'WMS',
        layers: (settings.special && settings.special.forecastModel ? settings.special.forecastModel : 'maximum_temperature'),
        version: '1.3.0',
        request: 'GetMap',
        format: 'image/png8',
        transparent: true,
        crs: L.CRS.EPSG3857,
        width: 1920,
        height: 626,
        tileSize: L.point(1920, 626),
        time: curTime.getUTCFullYear() + '-' + ((curTime.getUTCMonth() + 1) < 10 ? '0' : '') + (curTime.getUTCMonth() + 1) + '-' + (curTime.getUTCDate() < 10 ? '0' : '') + curTime.getUTCDate() + 'T' + ((curTime.getUTCHours() + 1) < 10 ? '0' : '') + (curTime.getUTCHours() + 1) + ':00:00.000Z',
        dim_time_reference: nwsFcstHour(),
        opacity: 0.7
    });

    nfdrs = L.tileLayer.wms('https://fsapps.nwcg.gov/arcgis/rest/services/npsg/Fire_Danger/MapServer/export', {
        id: 'National Fire Danger Rating System (NFDRS)',
        transparent: true,
        layers: 'show:0',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '1477,482',
        tileSize: L.point(1477, 482),
        crs: L.CRS.EPSG3857,
        f: 'image',
        opacity: 0.6
    });

    sfp = L.tileLayer.wms('https://fsapps.nwcg.gov/psp/arcgis/services/npsg/current_forecast/MapServer/WMSServer', {
        id: 'National Significant Fire Potential Outlook',
        time: (settings.special && settings.special.sfpDate ? settings.special.sfpDate : curTime.getUTCFullYear() + '-' + (curTime.getUTCMonth() < 10 ? '0' : '') + (curTime.getUTCMonth() + 1) + '-' + (curTime.getUTCDate() < 10 ? '0' : '') + curTime.getUTCDate() + 'T00:00:00.0Z'),
        transparent: true,
        layers: '0',
        format: 'image/png',
        crs: L.CRS.EPSG3857,
        f: 'image',
        opacity: 0.6
    });

    rth = L.tileLayer.wms('https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/RMRS_WRC_RiskToPotentialStructures/ImageServer/exportImage', {
        id: 'Wildfire Risk to Homes',
        transparent: true,
        layers: 'show:0',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.6
    });

    whp = L.tileLayer.wms('https://apps.fs.usda.gov/arcx/rest/services/RDW_Wildfire/RMRS_WildfireHazardPotential_2018/MapServer/export', {
        id: 'Wildfire Hazard Potential (2018)',
        transparent: true,
        layers: 'show:0',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.6
    });

    drought = L.tileLayer.wms('https://gis.fema.gov/arcgis/rest/services/Partner/Drought_Current/MapServer/export', {
        id: 'UNL Drought Monitor',
        ugtransparent: true,
        layers: 'show:0',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.6
    });

    fuels = L.tileLayer.wms('https://landfire.cr.usgs.gov/arcgis/rest/services/Landfire/US_140/MapServer/export', {
        id: 'LANDFIRE Fuels/Vegatation',
        transparent: true,
        layers: 'show:0,1',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.6
    });

    usfs = L.tileLayer('https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}', {
        id: 'USFS Boundaries',
        minZoom: 0,
        maxZoom: 19,
        opacity: 0.7,
        attribution: attrib
    });

    roads = L.tileLayer.wms('https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/export', {
        id: 'USFS Road Network',
        minZoom: 11,
        transparent: true,
        layers: 'show:0',
        /*dpi: 96,*/
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '1477, 515',
        tileSize: L.point(1477, 515),
        f: 'image',
        opacity: 0.9
    });

    /*lands = L.tileLayer.wms('https://maps1.arcgisonline.com/ArcGIS/rest/services/USA_Federal_Lands/MapServer/export', {*/
    lands = L.tileLayer.wms('https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/export', {
        id: 'Federal Lands',
        transparent: true,
        layers: 'show:17',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.75
    });

    plss = L.tileLayer.wms('https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/export', {
        id: 'PLSS',
        transparent: true,
        layers: 'show:1,2,3',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '1920,563',
        tileSize: L.point(1920, 563),
        f: 'image',
        opacity: 1,
        minZoom: 8
    });

    sfcSmoke = L.tileLayer('https://hwp-viz.gsd.esrl.noaa.gov/smoke/wmts/image/hrrr_smoke?var=sfc_smoke&x={x}&y={y}&z={z}&time=' + hrrrSmokeTime.init + '.000Z&modelrun=' + hrrrSmokeTime.fcst + 'Z&level=0', {
        id: 'Surface Smoke',
        minZoom: 3,
        maxZoom: 18,
        opacity: 0.6
    });

    viSmoke = L.tileLayer('https://hwp-viz.gsd.esrl.noaa.gov/smoke/wmts/image/hrrr_smoke?var=vi_smoke&x={x}&y={y}&z={z}&time=' + hrrrSmokeTime.init + '.000Z&modelrun=' + hrrrSmokeTime.fcst + 'Z&level=0', {
        id: 'Vertically Integrated Smoke',
        minZoom: 3,
        maxZoom: 18,
        opacity: 0.6
    });

    visSatellite = L.tileLayer.wms('https://nowcoast.noaa.gov/geoserver/satellite/wms', {
        service: 'WMS',
        layers: 'global_visible_imagery_mosaic',
        version: '1.3.0',
        request: 'GetMap',
        format: 'image/png',
        transparent: true,
        crs: L.CRS.EPSG3857,
        width: 1920,
        height: 626,
        tileSize: L.point(1920, 626),
        opacity: 0.7
    });

    irSatellite = L.tileLayer.wms('https://nowcoast.noaa.gov/geoserver/satellite/wms', {
        service: 'WMS',
        layers: 'global_longwave_imagery_mosaic',
        version: '1.3.0',
        request: 'GetMap',
        format: 'image/png',
        transparent: true,
        crs: L.CRS.EPSG3857,
        width: 1920,
        height: 626,
        tileSize: L.point(1920, 626),
        opacity: 0.7
    });

    wvSatellite = L.tileLayer.wms('https://nowcoast.noaa.gov/geoserver/satellite/wms', {
        service: 'WMS',
        layers: 'global_water_vapor_imagery_mosaic',
        version: '1.3.0',
        request: 'GetMap',
        format: 'image/png',
        transparent: true,
        crs: L.CRS.EPSG3857,
        width: 1920,
        height: 626,
        tileSize: L.point(1920, 626),
        opacity: 0.7
    });

    /*visSatellite = L.tileLayer.wms('https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/sat_meteo_imagery_time/MapServer/export', {
        id: 'Visible Satellite',
        transparent: true,
        layers: 'show:3,19',
        dpi: 9-6,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.7
    });

    irSatellite = L.tileLayer.wms('https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/sat_meteo_imagery_time/MapServer/export', {
        id: 'Infrared Satellite',
        transparent: true,
        layers: 'show:11,23',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.7
    });

    wvSatellite = L.tileLayer.wms('https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/sat_meteo_imagery_time/MapServer/export', {
        id: 'Water Vapor Satellite',
        transparent: true,
        layers: 'show:7',
        dpi: 96,
        format: 'png32',
        bboxSR: 102100,
        imageSR: 102100,
        size: '256,256',
        f: 'image',
        opacity: 0.7
    });*/

    cdfFHSZ = L.tileLayer.wms('https://egis.fire.ca.gov/arcgis/rest/services/FRAP/FHSZ/MapServer/export', {
        id: 'CAL FIRE Fire Hazard Severity Zones',
        transparent: true,
        layers: 'show:1',
        dpi: 96,
        format: 'png8',
        bboxSR: 102100,
        imageSR: 102100,
        size: '1920,661',
        tileSize: L.point(1920, 661),
        f: 'image',
        opacity: 0.8
    });

    burnProb = L.tileLayer.wms('https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/RMRS_WRC_BurnProbability/ImageServer/exportImage', {
        id: 'CAL FIRE Fire Hazard Severity Zones',
        transparent: true,
        dpi: 96,
        format: 'jpgpng',
        bboxSR: 102100,
        imageSR: 102100,
        size: '1520,625',
        tileSize: L.point(1520, 625),
        mosaicRule: {
            "ascending": true,
            "mosaicMethod": "esriMosaicNorthwest",
            "mosaicOperation": "MT_FIRST"
        },
        renderingRule: {
            "rasterFunction": "BurnProbability"
        },
        f: 'image',
        opacity: 0.6
    });

    if ($('#map').attr('data-state')) {
        var a = stateCenter($('#map').attr('data-state')),
            lat = a[0],
            lon = a[1];
        z = 7;
    }

    /* display zoom, lat, lon in URL hash 
    var hash = new L.Hash(map);*/

    /* add basemap options to selecter and based on user permissions */
    tileNames.forEach(function (n, c) {
        var prettyName;

        if (n == 'modis') {
            prettyName = n.toUpperCase();
        } else if (n == 'caltopo') {
            prettyName = 'CalTopo';
        } else if (n == 'fs16') {
            prettyName = 'USFS 2016';
        } else if (n == 'usgs') {
            prettyName = 'USGS';
        } else if (n == 'faa') {
            prettyName = 'FAA Sectional';
        } else {
            prettyName = ucwords(n);
        }

        var p = (tilePerms[c] && hasPermission(user, actions.PREMIUM_BASEMAPS) || tilePerms[c] === false ? true : false);
        $('#tileChange .select-options').append('<li' + (p === false ? ' style="display:none"' : '') + ' rel="' + n + '">' + prettyName + '</li>');

        if (settings.tile == n) {
            $('#tileChange').attr('data-selected', n);
            $('#tileChange .select-styled').html(ucwords(n));
        }
    });

    /* when user clicks to see local incidents */
    $('#local').on('click', function () {
        var ti = $(this).attr('data-count');

        notify('info', 'There ' + (ti == 1 ? 'is ' : 'are ') + (ti == undefined ? 0 : ti) + ' wildfire incident' + (ti != 1 ? 's' : '') + ' near your location.');
    });

    /* open basemap selector */
    $('#basemap').on('click', function () {
        var tc = $('#tileChange');

        if (tc.is(':visible') === true) {
            tc.hide();
        } else {
            if (isAndroid == 1) {
                var css = {
                    'right': '0px',
                    'top': '10px'
                };
            } else {
                var css = {
                    'right': '0px'
                };
            }
            tc.css(css).show();
        }
    });

    /* open archive year selector */
    $('#archive').on('click', function () {
        $('#yearChange').css({
            'right': '0px'
        })
            .show();
    });

    /* show legend */
    $('#legend').on('click', function () {
        $('.legend').show();
    });

    /* allow user to report new wildfires to us */
    $(document).on('click', '[id^=report]', function () {
        $(this).attr('data-active', '1');
        $('#map').css('cursor', 'crosshair');
        notify('info', 'Click anywhere on the map to report a <b>NEW</b> fire incident.');
    });

    /* get user's location */
    $('#mylocation').on('click', function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, geoLocationErrors);
        } else {
            notify('error', 'Geolocation is not supported by this browser.');
        }
        /*navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude,
                lon = position.coords.longitude;

            L.marker([lat, lon], {
                icon: L.divIcon({
                    html: '<div class="location"></div>',
                    iconSize: new L.point(12, 12)
                })
            })
                .on('click', function () {
                    map.removeLayer(this);
                })
                .addTo(map);
        
            map.setView([lat, lon], 11);
        });
    }, function (error) {
        var e = ""

        switch(error.code) {
            case error.PERMISSION_DENIED:
                e = "User denied the request for Geolocation."
                break;
            case error.POSITION_UNAVAILABLE:
                e = "Location information is unavailable."
                break;
            case error.TIMEOUT:
                e = "The request to get user location timed out."
                break;
            case error.UNKNOWN_ERROR:
                e = "An unknown error occurred."
                break;
        }

        notify('error', e);*/
    });

    /* save settings manually from button click */
    $('#save').on('click', function () {
        saveSession(false);
    });

    /* open account panel or login form */
    $('#account').on('click', function () {
        if (user.uid) {
            $('#impact .account').show();
            openImpact();

            if ($('#versionLabel').html() == '') {
                $('#versionLabel').html(versionHTML + ' (v' + version + ')');
            }
        } else {
            if (isAndroid != 1) {
                $('#loading .content').html('<div class="spinner"></div>');
                $('#loading').css('background-color', 'rgb(35 35 35 / 80%)').show();
                /*$('body').append('<div class="screen-loading"><div class="spinner"></div></div>');*/
                window.location.href = 'https://www.mapotechnology.com/secure/login?src=mapofire&next=' + encodeURIComponent(window.location.href);
            }
        }

        /*$('#impact .layersMenu').hide();
        if (user.uid) {
            $('#impact .account').show();
        } else {
            $.getScript('https://accounts.google.com/gsi/client', function () {
                google.accounts.id.renderButton(document.getElementById('gSignInWrapper'), {
                    type: 'standard',
                    size: 'large',
                    theme: 'filled_blue',
                    text: 'signin_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });

                $('#impact .loginForm').show();
            });
        }
        openImpact();*/
    });

    /* open search feature */
    $('#find').on('click', function () {
        $('.searchControl').toggleClass('in-use');
        $('.searchControl #q').focus();
    });

    /* close search featuare */
    $('#closeSearch').on('click', function () {
        $('.searchControl').removeClass('in-use');
        $('#search-results').hide();
        $('.searchControl #q').val('');
    });

    /* when search query is focused */
    $('.searchControl #q').on('focus', function () {
        if (!events) {
            $.ajax({
                url: apiUrl('events', 2),
                method: 'POST',
                dataType: 'json',
                success: function (e) {
                    var r = '';
                    if (e.top.length > 0) {
                        for (var i = 0; i < e.top.length; i++) {
                            var o = findFire(e.top[i].wfid);

                            if (o != undefined) {
                                var ts = o.options.state,
                                    state = (ts.substr(0, 2) == 'CA' && ts.length > 2 ? stateLabels[ts.substr(2, 2)] : stateLabels[ts]);

                                g = o.getLatLng();
                                r += '<div id="result" data-type="fire" data-wfid="' + e.top[i].wfid + '" data-lat="' + g.lat + '" data-lon="' + g.lng + '"><!--<div class="icon"><i class="fal fa-fire"></i></div>--><div class="text"><h3>' + o.options.title + '</h3>' +
                                    '<p>' + o.options.type + ' in <b>' + (ts.substr(0, 2) == 'CA' && ts.length > 2 ? 'Canada' : state) + '</b> &middot; <span style="color:#ff6686">' + sizing(2, o.options.acres) + ' ' + sizing(1).toLowerCase() + '</span></p></div></div>';
                            }
                        }

                        events = '<div class="topFires">Trending fires right now...</div>' + r;
                        setTimeout(function () {
                            $('#search-results').html(events).show();
                        }, 500);
                    }
                }
            });
        } else {
            setTimeout(function () {
                $('#search-results').html(events).show();
            }, 325);
        }
    });

    /* radar control play/pause */
    $('#radarPause').on('click', function () {
        if ($(this).attr('data-pause') == '0') {
            isRadarPaused = true;
            $(this).attr('data-pause', '1').addClass('fa-circle-play').removeClass('fa-circle-pause');
        } else {
            isRadarPaused = false;
            $(this).attr('data-pause', '0').addClass('fa-circle-pause').removeClass('fa-circle-play');
        }
    });

    /* show layers content in impact panel, and open */
    $('#layers').on('click', function () {
        if ($('#impact').attr('data-open') == 0) {
            $('#impact').attr('data-open', '1');
            $('#impact .wrapper').css('padding', 0);
            $('#impact .account').hide();
            $('#impact .loginForm').hide();
            $('#impact .layersMenu').show();
            openImpact();
        } else {
            closeImpact();
            $('#impact').attr('data-open', '0');
            $('#impact .wrapper').css('padding', '');
            $('#impact .layersMenu').hide();
        }
    });

    /* close donation popup */
    $(document).on('click', '[id=close-donate]', function () {
        $('.donate').fadeOut().end().remove();

        var d = new Date(),
            expires = d.getTime() + (86400 * DONATE_POPUP_DAYS * 1000);

        d.setTime(expires);
        document.cookie = 'donate=' + expires + ';expires=' + d.toUTCString() + ';domain=' + location.hostname.replace('www', '') + ';path=/';
    });

    /* if user clicks a share button on the app */
    $(document).on('click', '[id^=sharer]', function () {
        if (navigator.share) {
            navigator.share({
                title: ($(this).attr('title') ? $(this).attr('title') : document.title),
                text: "",
                url: ($(this).attr('data-href') ? $(this).attr('data-href') : window.location.href)
            })
                .then(() => console.log('Successfully shared'))
                .catch(error => console.log('Error sharing:', error));
        }
    });

    /* when a user clicks for more info on a weather alert, get data and show in modal */
    $(document).on('click', '[id=alert]', function () {
        readWWA($(this).attr('data-id'));
    });

    /* user click to view all weather alerts in the map bounding box */
    $(document).on('click', '[id=alerts]', function () {
        var t = '',
            wxalids = [];

        $('.layersMenu #wwas').prop('checked', true);
        map.addLayer(wwas);

        for (var x = 0; x < wwas.getLayers().length; x++) {
            for (var i = 0; i < wwas.getLayers()[x].getLayers().length; i++) {
                var n = wwas.getLayers()[x].getLayers()[inviewAlerts[i]];

                if (n && wxalids.includes(n.feature.id) === false) {
                    var gd = n.feature;
                    m = gd.properties;
                    c = wwaColors[n.Event];
                    /*map.fitBounds(wwas.getLayers()[0][' + inviewAlerts[i] + '].getBounds());closeModal();return false*/
                    t += '<li style="padding:5px 0;line-height:1.4"><a href="#" onclick="map.fitBounds(wwas.getLayers()[' + x + '].getLayers()[inviewAlerts[' + i + ']].getBounds());closeModal();return false">' +
                        m.Event + '</a>' + ' for ' + m.Affected + ' until <b>' + until(m.End_) + '</b></li>';

                    wxalids.push(gd.id);
                }
            }
        }

        $('#modal .content').html('<div class="container"><h1>Active Weather Alerts</h1><p style="color:var(--red)">These are current weather alerts in effect for the area on your map.</p>' +
            '<ul style="margin-inline-start:35px">' + t + '</ul></div>');

        openModal();
    });

    /* when a search result is clicked on */
    $(document).on('click', '[id^=result]', function () {
        var th = $(this),
            type = th.attr('data-type'),
            lat = th.attr('data-lat'),
            lon = th.attr('data-lon');

        $('#search-results').hide().html('');
        /*$('.searchControl').removeClass('in-use');*/
        $('#q').val('');

        if (type == 'fire') {
            var li = [newFires, allFires, smokeChecks, rxBurns],
                tw = th.attr('data-wfid');

            li.forEach(function (g) {
                if (g.getLayers().length > 0) {
                    for (var i = 0; i < g.getLayers().length; i++) {
                        g.getLayers()[i].getLayers().forEach(function (f) {
                            if (f.options.wfid == tw) {
                                /*fireDetails(f.options.wfid);*/
                                map.setView(f.getLatLng(), 11);

                                /* send data to GA4 */
                                gtag("event", "click", {
                                    fire_name: f.options.title.replace(' Fire', '') + ' (' + f.options.state + ')',
                                    fire_url: host + f.options.url,
                                });
                            }
                        });
                    }
                }
            });
        } else if (type == 'perim') {
            var x = th.attr('data-x'),
                y = th.attr('data-y'),
                lay = perimeters.getLayers()[x].getLayers()[y];

            map.fitBounds(lay.getBounds());
            lay.openPopup();
        } else if (type == 'city' || type == 'gis') {
            if (type == 'city') {
                $.ajax({
                    url: 'https://nominatim.openstreetmap.org/search.php?q=' + $(this).attr('title').replace('<b>', '').replace('</b>', '') + '&polygon_geojson=1&format=jsonv2',
                    method: 'GET',
                    dataType: 'json',
                    success: function (g) {
                        gm = L.geoJSON(g[0].geojson)
                            .bindPopup('<span style="color:#282829">' + g[0].display_name + '</span>', {
                                maxWidth: 250
                            })
                            .on('popupclose', function (e) {
                                map.removeLayer(gm);
                            })
                            .addTo(map);

                        map.fitBounds(gm.getBounds());
                        gm.openPopup();
                    }
                });
            } else {
                gm = L.marker([lat, lon])
                    .bindPopup('<span style="color:#282829">' + $(this).attr('title') + '</span>', {
                        maxWidth: 250
                    })
                    .addTo(map)
                    .openPopup()
                    .on('popupclose', function (e) {
                        map.removeLayer(gm);
                    });

                map.setView([lat, lon], 12);
            }
        } else if (type == 'state') {
            map.setView([lat, lon], 7);
        }
    });

    /* change the SFP outlook date */
    $(document).on('change', '[id=sfpDateSelect]', function () {
        var t = $(this).find('option:selected').val();

        sfp.setParams({
            time: t
        });
    });

    /* change the SPC outlook type and/or day */
    $(document).on('change', '[id=otlkType]', function () {
        if (spc != undefined || map.hasLayer(spc)) {
            map.removeLayer(spc);
        }

        if ($('input[id=spc').is(':checked')) {
            otlkCat = [];
            getOutlook();
        }
    });

    $(document).on('change', '[id=otlkDay]', function () {
        if (spc != undefined || map.hasLayer(spc)) {
            map.removeLayer(spc);
        }

        if ($('input[id=spc').is(':checked')) {
            otlkCat = [];
            getOutlook();
        }
    });

    /* change the forecast model overlay type and time */
    $(document).on('change', '[id=forecastModel]', function () {
        var t = $(this).find('option:selected').val(),
            nd = new Date(),
            ur;

        if (t == '12hr_precipitation_probability') {
            ur = 'ndfd_precipitation';
        } else if (t == 'relative_humidity') {
            ur = 'ndfd_moisture';
        } else if (t == 'wind_speed') {
            ur = 'ndfd_wind';
        } else if (t == 'total_sky_cover') {
            ur = 'ndfd_sky';
        } else if (t == 'apparent_temperature') {
            ur = 'ndfd_temperature';
        }

        /*if (t == '12hr_precipitation_probability') {
            $(this).attr('data-type', 'pop');

            if (nd.getUTCHours() > 0 && nd.getUTCHours() < 12) {
                var pt = new Date(new Date((nd.getUTCMonth() + 1) + '/' + nd.getUTCDate() + '/' + nd.getUTCFullYear() + ' 12:00 UTC').getTime()),
                    pt2 = new Date(new Date((nd.getUTCMonth() + 1) + '/' + nd.getUTCDate() + '/' + nd.getUTCFullYear() + ' 00:00 UTC').getTime() + (3600 * 48 * 1000));
            } else {
                var pt = new Date(new Date((nd.getUTCMonth() + 1) + '/' + nd.getUTCDate() + '/' + nd.getUTCFullYear() + ' 00:00 UTC').getTime() + (3600 * 24 * 1000)),
                    pt2 = new Date(new Date((nd.getUTCMonth() + 1) + '/' + nd.getUTCDate() + '/' + nd.getUTCFullYear() + ' 12:00 UTC').getTime() + (3600 * 24 * 1000));
            }

            $('[id^=fcstTime] option').each(function () {
                $(this).remove();
            });

            $('[id^=fcstTime]').append('<option value="' + pt.getTime() + '">Ending ' + (pt.getHours() > 12 ? (pt.getHours() - 12) + ' PM' : pt.getHours() + ' AM') + '</option>')
                .append('<option value="' + pt2.getTime() + '">Ending ' + (pt2.getHours() > 12 ? (pt2.getHours() - 12) + ' PM' : pt2.getHours() + ' AM') + '</option>')
        } else {
            if ($(this).attr('data-type') == 'pop') {
                $('[id^=fcstTime] option').each(function () {
                    $(this).remove();
                });

                initNDFDTimes();
                $(this).attr('data-type', 'reg');
            }
        }*/

        $('#ndfdLegends > div').each(function () {
            $(this).hide();
        });

        $('#legend' + t).show();

        ndfd.setUrl('https://nowcoast.noaa.gov/geoserver/' + ur + '/wms')
            .setParams({
                layers: t
            });
    });

    /* change forecast model time */
    $(document).on('change', '[id=fcstTime]', function () {
        var v = $(this).find('option:selected').val();
        ndfd.setParams({
            time: v
        });
    });

    /* min perimeter size slider */
    $(document).on('input', '[id=perimeterSize] input[type=range]', function () {
        $('#pSize').html($(this).val() + ' acres');
    });

    /* on min perimeter size change */
    $(document).on('change', '[id=perimeterSize] input[type=range]', function () {
        var s = $(this).val();
        settings.perimeters.minSize = s;

        if (map.hasLayer(perimeters)) {
            perimeters.eachLayer(function (p) {
                var l = p.getLayers();

                for (var i = 0; i < l.length; i++) {
                    if (l[i].feature.properties.poly_GISAcres < s) {
                        p.removeLayer(l[i]);
                    }
                }
            });
        }

        loadPerimeters();
    });

    /* if user manually changes the radar imagery time */
    $(document).on('input', '[id=radarControl] input[type=range]', function () {
        var t = $(this);
        radarImgs.forEach(function (r, n) {
            if (t.val() == n) {
                var d = new Date(r.options.time * 1000),
                    w = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M';

                r.setOpacity(0.8);
                $('#radarControl .time').html(w);
                radarCount = t.val();
            } else {
                r.setOpacity(0);
            }
        });
    });

    /* if user changes settings, apply them immediately to the map */
    $(document).on('change', '[id=perimColor]', function () {
        var a = $(this).find('option:selected').val();
        perimeters.setStyle({
            color: (a == 'default' ? 'red' : a)
        });
    });

    /* on layer clicked (checkboxes) */
    $(document).on('change', '[class=layersMenu] input[type=checkbox]', function () {
        var id = $(this).attr('id');

        switch (id) {
            case 'stns':
                getWeather();
                break;
            case 'dispatch':
                dispatchBounds();
                break;
            case 'nwsfire':
                nwsFireWX();
                break;
            case 'erc':
                getPSAs();
                break;
            case 'calfireUnits':
                calfireAdminUnits();
                break;
            case 'gaccBounds':
                getGACCBounds();
                break;
            case 'radar':
                getRadarAPI();
                break;
            case 'nri':
                femaNRI();
                break;
            case 'spc':
                getOutlook();
                break;
            default:
                if (id == 'fuels' || id == 'drought') {
                    if ($(this).is(':checked')) {
                        $('#map').css('cursor', 'crosshair');
                    } else {
                        $('#map').css('cursor', 'auto');
                    }
                }

                if (window[id] != undefined) {
                    params($(this).attr('data-type'), id, window[id]);
                }
        }

        /*if (id == 'stns') {
            getWeather();
        } else if (id == 'dispatch') {
            dispatchBounds();
        } else if (id = 'nwsfire') {
            nwsFireWX();
        } else if (id == 'erc') {
            getPSAs();
        } else if (id == 'calfireUnits') {
            calfireAdminUnits();
        } else if (id == 'gaccBounds') {
            getGACCBounds();
        } else if (id == 'radar') {
            getRadarAPI();
        } else if (id == 'nri') {
            femaNRI();
        } else if (id == 'spc') {
            getOutlook();
        } else {
            /* when user must interactive with map to get data from map tiles */
        /*if (id == 'fuels' || id == 'drought') {
            if ($(this).is(':checked')) {
                $('#map').css('cursor', 'crosshair');
            } else {
                $('#map').css('cursor', 'auto');
            }
        }

        if (window[id] != undefined) {
            params($(this).attr('data-type'), id, window[id]);
        }
    }*/

        if (id == 'plss' && $(this).is(':checked') && map.getZoom() < 8) {
            notify('info', 'You must be zoomed in more to see TRS layers')
        }

        if (id == 'roads' && $(this).is(':checked') && map.getZoom() < 12) {
            notify('info', 'You must be zoomed in more to see USFS roads')
        }
    });

    /* change basemap */
    $('.select-styled').click(function () {
        $('.select-styled, .select-options').toggleClass('active');
    });

    $('#tileChange .select-options li').click(function () {
        var a = $(this);
        $('#tileChange .select-styled').html(ucwords(a.html()));
        $('#tileChange').attr('data-selected', a.attr('rel'));

        /*if ($('#tileChange .select-options').parent().attr('id') == 'tileChange') {*/
        settings.tile = a.attr('rel');
        setMapType();
        $('#tileChange').hide();
        /*}*/
        $('#tileChange .select-styled').removeClass('active');
        $('#tileChange .select-options').removeClass('active');
    });

    $('#yearChange .select-options li').click(function () {
        window.location.href = host + 'archive/' + $(this).attr('rel');

        $('#yearChange').hide();
        $('#yearChange .select-styled').removeClass('active');
        $('#yearChange .select-options').removeClass('active');
    });

    /* modal close button clicked */
    $('#modal .close').click(function () {
        closeModal();
    });
});

window.onpopstate = function (event) {
    /* if URL is supposed to open an incident */
    if (window.location.pathname.search('/fires') >= 0) {
        var id = window.location.pathname.split('/')[2];
        fireDetails(id, true);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/alert') >= 0) {
        var id = window.location.pathname.split('/')[3];
        readWWA(id);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/outlook') >= 0) {
        var s = window.location.pathname.split('/');
        readSPCText(s[3], s[4]);
    }

    /* if URL is supposed to open nws fire wx fcst */
    if (window.location.pathname.search('/weather/fire') >= 0) {
        var s = window.location.pathname.split('/');
        fireFcst(s[3], s[4], zn = '');
    }

    /* if URL is supposed to open risk data for a county */
    if (window.location.pathname.search('/risk') >= 0) {
        var id = window.location.pathname.split('/')[2];
        viewRisk(id);
    }
};

$(window).on('load', function () {
    /* save settings automatically after the first 10 seconds, then every 5 minutes, whether to the session or user account */
    setTimeout(function () {
        saveSession(true);

        setInterval(function () {
            saveSession(true);
        }, settings.saveFreq);
    }, 300000);

    /* see if user is logged in, if so add credentials to app settings */
    authenticateUser();

    /* initialize map */
    var lat = settings.center[0],
        lon = settings.center[1],
        z = settings.zoom;

    map = L.map('map', {
        preferCanvas: true,
        renderer: L.canvas(),
        zoomControl: false,
        touchZoom: true
    })
        .setView([lat, lon], z)
        .on('load', function () {
            countFires();
        })
        .on('click', function (e) {
            /* if fuels layer is on, and user clicks on map, get vegatation at that lat/lon */
            if ($('input[id=fuels]').is(':checked')) {
                fuelType(e.latlng.lat, e.latlng.lng);
            }

            if ($('input[id=drought]').is(':checked')) {
                getDrought(e.latlng.lat, e.latlng.lng);
            }

            /* if user is reporting a new fire incident, do this... */
            if ($('#report').attr('data-active') == 1) {
                $('#report').attr('data-active', '0');

                if (isAndroid == 1) {
                    SubmitReport.fire(e.latlng.lat, e.latlng.lng)
                } else {
                    map.setView([e.latlng.lat, e.latlng.lng], 12);

                    nrMrkr = L.marker([e.latlng.lat, e.latlng.lng])
                        .bindPopup(popup('Report New Incident', newReport), {
                            className: 'fire-popup report',
                            minWidth: 400
                        })
                        .on('popupclose', function () {
                            this.removeFrom(map);
                            map.setView([settings.center[0], settings.center[1]], settings.zoom);
                        })
                        .addTo(map)
                        .openPopup();

                    if (user.noauth != 1) {
                        $('#newReport input[name=authUser]').val(1);
                        $('#newReport').append('<input type="hidden" name="uid" value="' + user.uid + '">');
                    }
                    $('#newReport input[name=lat]').val(e.latlng.lat);
                    $('#newReport input[name=lon]').val(e.latlng.lng);
                }
            }
        })
        .on('zoomend', function () {
            if ($('.layer input[id=plss]').is(':checked') && map.getZoom() < 8) {
                notify('info', 'You must be zoomed in more to see TRS layers')
            }

            if ($('.layer input[id=roads]').is(':checked') && map.getZoom() < 12) {
                notify('info', 'You must be zoomed in more to see USFS roads')
            }
        })
        .on('movestart', function () {
            $('#map').css('cursor', 'grabbing');
            moving = true;
        })
        .on('moveend', function () {
            countFires();

            if (moving === true) {
                $('#map').css('cursor', ($('#report').attr('data-active') == 1 ? 'crosshair' : 'auto'));

                loadPerimeters();

                if ($('input[id=modis24]').is(':checked')) {
                    modisHotspots(1);
                }

                if ($('input[id=modis48]').is(':checked')) {
                    modisHotspots(2);
                }

                if ($('input[id=modis72]').is(':checked')) {
                    modisHotspots(3);
                }

                if ($('input[id=stns]').is(':checked')) {
                    getWeather();
                }

                if ($('input[id=dispatch]').is(':checked')) {
                    dispatchBounds();
                }

                if ($('input[id=nwsfire]').is(':checked')) {
                    nwsFireWX();
                }

                if ($('input[id=gaccBounds]').is(':checked')) {
                    getGACCBounds();
                }

                if ($('input[id=erc]').is(':checked')) {
                    getPSAs();
                }

                /*if ($('input[id=wwas]').is(':checked')) {*/
                getWWAs();
                /*}*/

                if ($('input[id=airq]').is(':checked')) {
                    getAirQ();
                }

                if ($('input[id=nri]').is(':checked')) {
                    femaNRI();
                }

                if (wwas) {
                    var ac = c = 0;
                    inviewAlerts = [];

                    wwas.eachLayer(function (w) {
                        w.eachLayer(function (l) {
                            if (contains(l.getLatLngs()) === true) {
                                ac++;
                                inviewAlerts.push(c);
                            }
                            c++;
                        });
                    });

                    if (ac > 0) {
                        $('#alerts .notify').html((ac > 11 ? '11+' : ac)).show();
                    } else {
                        $('#alerts .notify').html('').hide();
                    }
                }

                moving = false;
            }
        });


    /* map custom controls back to the map */
    L.control.scale({
        imperial: true,
        position: 'bottomleft'
    })
        .addTo(map);

    L.control.zoom({
        position: 'topleft'
    })
        .addTo(map);

    if (!isAndroid) {
        map.addControl(new L.Control.Fullscreen());
    }

    /* custom style for the map zoom controls */
    $('.leaflet-control-zoom-in span, .leaflet-control-zoom-out span').remove();
    $('.leaflet-control-zoom-in').html('<i class="far fa-plus"></i>');
    $('.leaflet-control-zoom-out').html('<i class="far fa-minus"></i>');

    /* set map basemap tiles */
    setMapType();

    /* if URL is supposed to open an incident */
    if (window.location.pathname.search('/fires') >= 0) {
        var id = window.location.pathname.split('/')[2];
        fireDetails(id, true);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/alert') >= 0) {
        var id = window.location.pathname.split('/')[3];
        readWWA(id);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/outlook') >= 0) {
        var s = window.location.pathname.split('/');
        readSPCText(s[3], s[4]);
    }

    /* if URL is supposed to open nws fire wx fcst */
    if (window.location.pathname.search('/weather/fire') >= 0) {
        var s = window.location.pathname.split('/');
        fireFcst(s[3], s[4], zn = '');
    }

    /* if URL is supposed to open risk data for a county */
    if (window.location.pathname.search('/risk') >= 0) {
        var id = window.location.pathname.split('/')[2];
        viewRisk(id);
    }

    /* get important, initial layers on load */
    getFires();
    loadPerimeters();
    getWWAs();
    getAirQ();

    /* get layers if they are checked already */
    params(3, 'radar', getRadarAPI);
    params(3, 'modis24', modisHotspots(1));
    params(3, 'modis48', modisHotspots(2));
    params(3, 'modis72', modisHotspots(3));
    params(3, 'dispatch', dispatchBounds);
    params(3, 'nwsfire', nwsFireWX);
    params(3, 'calfireUnits', calfireAdminUnits);
    params(3, 'gaccBounds', getGACCBounds);
    params(3, 'erc', getPSAs);
    params(3, 'nri', femaNRI);
    params(3, 'stns', getWeather);

    params(2, 'lightning1', lightning1);
    params(2, 'lightning24', lightning24);
    params(2, 'ndfd', ndfd);
    params(2, 'visSatellite', visSatellite);
    params(2, 'irSatellite', irSatellite);
    params(2, 'wvSatellite', wvSatellite);
    params(2, 'nfdrs', nfdrs);
    params(2, 'sfp', sfp);
    params(2, 'rth', rth);
    params(2, 'whp', whp);
    params(2, 'drought', drought);
    params(2, 'fuels', fuels);
    params(2, 'usfs', usfs);
    params(2, 'roads', roads);
    params(2, 'lands', lands);
    params(2, 'sfcSmoke', sfcSmoke);
    params(2, 'viSmoke', viSmoke);
});

/* check if user is connected to a network or not */
window.addEventListener('offline', (e) => {
    connection(navigator.onLine);
});

window.addEventListener('online', (e) => {
    connection(navigator.onLine);
});

/* save scroll position on certain divs */
$('#impact .wrapper').on('scroll', function () {
    localStorage.setItem('layers_scrollTop', $('#impact .wrapper').scrollTop());
});

/* when user types text in the search box */
$(document).on('keyup', '[id^=q]', function (e) {
    search($(this).val(), e);
});

$(document).on('keydown', '[id^=q]', function (e) {
    clearTimeout(typeTimer);
});

/* anytime a settings is changed, automatically save it */
$(document).on('change', '[id^=settings] select', function () {
    saveSession(true);
});

/* login, forgot password, and register functions */
$(document).on('click', '[id=createAcct]', function () {
    $('form#loginForm').hide();
    $('form#forgotForm').hide();
    $('form#registerForm').show();

    geoLocation();

    navigator.geolocation.getCurrentPosition(function (position) {
        $.ajax({
            url: 'https://nominatim.openstreetmap.org/reverse',
            method: 'GET',
            data: {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                format: 'json',
                addressdetails: 1
            },
            dataType: 'json',
            success: function (nom) {
                var a = (nom.address.city ? nom.address.city : (nom.address.town ? nom.address.town : (nom.address.village ? nom.address.village : nom.address.county))),
                    b = nom.address.state,
                    c = nom.address.postcode,
                    d = { city: a, state: b, zip: c, lat: nom.lat, lon: nom.lon };

                $('#city').val(a + ', ' + b + ' ' + c);
                $('input[name=location]').val(JSON.stringify(d));
            }
        });
    }, function (error) {
        if (error.code == 1) {
            $('#city').val('Unable to get your location');
            $('input[name=location]').val('');
        }
    });
});

$(document).on('click', '[id=forgotPwd]', function () {
    $('form#forgotForm').show();
    $('form#loginForm').hide();
    $('form#registerForm').hide();
});

$(document).on('click', '[id=doLogin]', function () {
    $('form#loginForm').show();
    $('form#registerForm').hide();
    $('form#forgotForm').hide();
});

$(document).on('submit', '[id=loginForm]', function (e) {
    e.preventDefault();
    e.stopPropagation();

    $('#loginForm input[type=submit]').hide();
    $('#loginForm .spinner').show();
    $('[id^=loginErrorMsg]').remove();

    $.ajax({
        url: apiUrl('user'),
        method: 'POST',
        data: $(this).serialize(),
        dataType: 'json',
        success: function (api) {
            if (api.error) {
                var msg;
                if (api.error == 1) {
                    msg = 'Please enter an email/password to login.';
                } else if (api.error == 2) {
                    msg = 'The email you entered does not exist.';
                } else if (api.error == 3) {
                    msg = 'The password you entered is incorrect.';
                } else if (api.error == 4) {
                    msg = 'This account has not been confirmed yet.';
                }

                $('#loginForm input[type=submit]').show();
                $('#loginForm .spinner').hide();
                $('<p id="loginErrorMsg" class="message error" style="text-align:center">' + msg + '</p>').insertAfter('.loginForm h1');
            } else {
                closeImpact();
                $('.loginForm').hide();
                $('#account').attr('data-tooltip', '{"text":"Manage map settings","dir":"right"}');
                notify('success', 'You were successfully logged in.');

                authenticateUser(api);
            }
        }
    });
});

$(document).on('submit', '[id=forgotForm]', function (e) {
    e.preventDefault();
    e.stopPropagation();

    $('#forgotForm input[type=submit]').hide();
    $('#forgotForm .spinner').show();
    $('[id^=forgotErrorMsg]').remove();

    $.ajax({
        url: apiUrl('user'),
        method: 'POST',
        data: $(this).serialize(),
        dataType: 'json',
        success: function (api) {
            if (api.error) {
                $('#forgotForm input[type=submit]').show();
                $('#forgotForm .spinner').hide();
                $('<p id="forgotErrorMsg" class="message error" style="text-align:center">' + api.error + '</p>').insertAfter('.loginForm h1');
            } else {
                closeImpact();
                $('.loginForm').hide();
                $('#forgotForm').hide();
                $('#loginForm').show();
                notify('success', 'Your password was reset. Please check your email.');
            }
        }
    });
});

$(document).on('click', '[id=tos]', function () {
    if ($(this).is(':checked') === true) {
        $('#registerForm input[type=submit]').prop('disabled', false);
    } else {
        $('#registerForm input[type=submit]').prop('disabled', true);
    }
});

$(document).on('submit', '[id=registerForm]', function (e) {
    e.preventDefault();
    e.stopPropagation();

    $('#registerForm input[type=submit]').hide();
    $('#registerForm .spinner').show();
    $('[id^=registerErrorMsg]').remove();

    $.ajax({
        url: apiUrl('user'),
        method: 'POST',
        data: $(this).serialize(),
        dataType: 'json',
        success: function (api) {
            if (api.error) {
                $('#registerForm input[type=submit]').show();
                $('#registerForm .spinner').hide();
                $('<p id="registerErrorMsg" class="message error" style="text-align:center">' + api.error + '</p>').insertAfter('.loginForm h1');
            } else {
                $('form#registerForm').hide();
                $('form#registerForm')[0].reset();
                $('#impact .wrapper').append('<div id="confirmation" style="text-align:center"><h1>Account Created!</h1><p style="padding:35px 0;line-height:1.4">Your account was successfully created. Please click the confirmation link we just sent you.</p><a href="#" class="btn btn-black btn-lg" onclick="$(\'#impact\').css(\'right\',\'-350px\').attr(\'data-open\',\'0\');$(\'#confirmation\').remove();$(\'#loginForm\').show();$(\'#registerForm input[type=submit]\').show();$(\'#registerForm .spinner\').hide();return false">Thanks, got it!</a></div>');
            }
        }
    });
});

/* cancel new report */
$(document).on('click', '[id^=cancelNewRpt]', function () {
    nrMrkr.closePopup().removeFrom(map);
});

/* submit new incident report */
$(document).on('submit', '[id=newReport]', function (e) {
    var error = false,
        errorMsg = '';
    e.preventDefault();
    e.stopPropagation();

    if ($('#newReport select[name=type]').find('option:selected').val() == '- Choose -') {
        error = true;
        errorMsg += '<li>Please choose an incident type</li>';
    }

    if ($('#newReport input[name=size]').val() == '') {
        error = true;
        errorMsg += '<li>Please estimate the size of the fire (even if it\'s 0)</li>';
    } else if (!$('#newReport input[name=size]').val().match(/([0-9.]+)/)) {
        error = true;
        errorMsg += '<li>Your incident size cannot contain non-numeric characters</li>'
    }

    if ($('#newReport textarea[name=notes]').val() == '') {
        error = true;
        errorMsg += '<li>Please provide some details about this incident</li>';
    }

    if (error === true) {
        notify('error', '<ul style="margin-left:20px">' + errorMsg + '</ul>');
    } else {
        if (confirm('Are you sure this is a new incident? If so, click "OK." Otherwise, please click "Cancel."')) {
            $.ajax({
                url: apiUrl('newReport', 2),
                method: 'POST',
                data: $(this).serialize() + '&time=' + new Date().getTime() / 1000,
                dataType: 'json',
                success: function (r) {
                    if (r.success == 1) {
                        nrMrkr.closePopup().removeFrom(map);
                        notify('success', 'Your report was sent to us for review before it may be added to the map.');
                    }
                }
            });
        } else {

        }
    }
});