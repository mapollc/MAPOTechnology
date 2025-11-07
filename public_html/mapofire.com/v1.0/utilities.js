function apiUrl(t, s = null) {
    return (s == null || s == 1 ? apiURL : apiURL2) + t + '?key=50e2c43f8f63ff0ed20127ee2487f15e';
}

function dateTime(t, w = null) {
    var t = new Date(t * 1000),
        time = (t.getHours() > 12 ? t.getHours() - 12 : t.getHours()) + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes() + ' ' + (t.getHours() > 12 ? 'P' : 'A') + 'M';

    /*return months[t.getMonth()] + ' ' + t.getDate() + ', ' + t.getFullYear() + ' at ' + (t.getHours() > 12 ? t.getHours() - 12 : t.getHours()) + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes() + ' ' + (t.getHours() > 12 ? 'P' : 'A') + 'M';*/
    return months[t.getMonth()] + ' ' + t.getDate() + ', ' + t.getFullYear() + (w == 1 ? ' ' + time : '');
}

function plural(v) {
    return (v > 1 ? 's' : '');
}

function matheq(d, s, r) {
    return Math.floor(((d / s) - Math.floor(d / s)) * r);
}

function timeAgo(t, w, c) {
    var val,
        d = (c ? c : Math.round(new Date().getTime() / 1000)) - t;

    if (d < 10) {
        val = 'Just now';
    } else if (d >= 10 && d < 60) {
        val = d + ' sec' + plural(d);
    } else if (d >= 60 && d < 3600) {
        val = Math.floor(d / 60) + ' min' + plural(Math.floor(d / 60)) + ((matheq(d, 60, 60) !== 0) ? ',&nbsp;' + matheq(d, 60, 60) + ' sec' + plural(matheq(d, 60, 60)) : '');
    } else if (d >= 3600 && d < 86400) {
        val = Math.floor(d / 3600) + ' hour' + plural(Math.floor(d / 3600)) + ((matheq(d, 3600, 60) !== 0) ? ',&nbsp;' + matheq(d, 3600, 60) + ' min' + plural(matheq(d, 3600, 60)) : '');
    } else if (d >= 86400 && d < 172800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400)) + ((matheq(d, 86400, 24) !== 0) ? ',&nbsp;' + matheq(d, 86400, 24) + ' hour' + plural(matheq(d, 86400, 24)) : '');
    } else if (d >= 172800 && d < 604800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400));
    } else if (d >= 604800 && d < 2419200) {
        val = Math.floor(d / 604800) + ' week' + plural(Math.floor(d / 604800));
    } else if (d >= 2419200 && d < 31536000) {
        val = Math.floor(d / 2419200) + ' month' + plural(Math.floor(d / 2419200));
    } else if (d >= 31536000) {
        val = Math.floor(d / 31536000) + ' year' + plural(Math.floor(d / 31536000));
    }

    if (w == 1) {
        val = val.split(', ')[0];
    }

    if (val == 'Just now') {
        return val;
    } else {
        return val + ' ago';
    }
}

function hasDST(t) {
    const date = new Date(t);
    const january = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
    const july = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();

    return Math.max(january, july) !== date.getTimezoneOffset();
}

function localTime(v) {
    var epo = parseInt(v.discovered),
        tz = v.timezone.replace('America/', ''),
        sub = parseInt(3600 * (tz == 'Los_Angeles' ? 0 : (tz == 'Denver' ? 1 : (tz == 'Chicago' ? 2 : (tz == 'New_York' ? 3 : -1))))),
        z = (tz == 'Los_Angeles' ? 'P' : (tz == 'Denver' ? 'M' : (tz == 'Chicago' ? 'C' : (tz == 'New_York' ? 'E' : 'AK')))),
        unix = (epo + sub) * 1000,
        d = new Date(unix),
        l = days[d.getDay()],
        F = fullMonths[d.getMonth()],
        j = d.getDate(),
        Y = d.getFullYear(),
        h = d.getHours(),
        h = (h > 12 ? h - 12 : h),
        a = (h > 12 ? 'AM' : 'PM'),
        i = d.getMinutes(),
        i = (i < 10 ? '0' + i : i);

    return l + ', ' + F + ' ' + j + ', ' + Y + ' ' + h + ':' + i + ' ' + a + ' ' + z + (hasDST(unix) ? 'S' : 'D') + 'T';
}

function riskColor (r) {
    var c;
    
    switch (r) {
        case 'Low': c = 'rgb(254 255 168)'; break;
        case 'Medium': c = 'rgb(255 135 24)'; break;
        case 'High': c = 'rgb(255 26 0)'; break;
        case 'Very High': c = 'rgb(206 0 27)'; break;
    }

    return c;
}

function getTileURL(lat, lon, zoom) {
    var xtile = parseInt(Math.floor((lon + 180) / 360 * (1 << zoom))),
        ytile = parseInt(Math.floor((1 - Math.log(Math.tan(deg2rad(lat)) + 1 / Math.cos(deg2rad(lat))) / Math.PI) / 2 * (1 << zoom)));

    return window[settings.tile]._url.replace('{x}', xtile).replace('{y}', ytile).replace('{z}', zoom);
    /*return 'https://a.tile.openstreetmap.org/' + zoom + '/' + xtile + '/' + ytile + '.png';*/
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371,
        dLat = deg2rad(lat2 - lat1),
        dLon = deg2rad(lon2 - lon1),
        a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c;

    return (d / 1.609);
}

function deg2rad(v) {
    return v * Math.PI / 180;
}

function gmtime(s) {
    var d = new Date(new Date().getTime() + (s * 1000)),
        m = d.getUTCMonth() + 1,
        t = d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate() + 'T' + (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':00:00';

    return t;
}

function ndfdTime(add = null) {
    var a = new Date(),
        e = a.toString().split(' GMT')[0],
        b = (a.getMonth() + 1) + '/' + a.getDate() + '/' + a.getFullYear();
    c = e.match(/([0-9:]{8,})/gm)[0].split(':'),
        h = parseInt(c[0]);

    if (c[1] > 0) {
        h += 1;
    }

    var t = b + ' ' + h + ':00:00';

    return new Date(t).getTime() + (add ? (add * 60 * 60 * 1000) : 0);
}

function nwsFcstHour() {
    var h = curTime.getUTCHours(),
        m = curTime.getUTCMonth() + 1,
        m = (m < 10 ? '0' : '') + m,
        d = curTime.getUTCDate(),
        d = (d < 10 ? '0' : '') + d;

    if (h >= 19 && h <= 23 || h == 0) {
        t = '18';
    } else if (h >= 1 && h <= 6) {
        t = '00';
    } else if (h >= 7 && h <= 12) {
        t = '06';
    } else {
        t = '12';
    }

    return curTime.getUTCFullYear() + '-' + m + '-' + d + 'T' + t + ':00:00.000Z';
}

function until(t) {
    var n = new Date(),
        u = new Date(new Date().getTime() + 86400000),
        d = new Date(t),
        m1 = n.getMonth() + '/' + n.getDate() + '/' + n.getFullYear(),
        m2 = d.getMonth() + '/' + d.getDate() + '/' + d.getFullYear(),
        m3 = u.getMonth() + '/' + u.getDate() + '/' + u.getFullYear(),
        h = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() > 12 ? 'P' : 'A') + 'M';

    if (m1 == m2) {
        r = 'Today';
    } else if (m3 == m2) {
        r = 'Tomorrow';
    } else {
        r = days[d.getDay()];
    }

    return r + ' at ' + (h == '12:00 AM' ? 'Midnight' : h);
}

function notify(t, m) {
    if (isAndroid == 1) {
        Notify.alert(m);
    } else {
        var timing = (((m.split(' ').length / 5) + 0.5) * 1000) + 1000;

        $('body').append('<div class="alert ' + t + '"><i class="far fa-' + (t == 'success' ? 'check' : 'circle-exclamation') + '"></i><p>' + m + '</p></div>');
        $('.alert').animate({
            top: '10px'
        }, 500, function () {
            setTimeout(function () {
                $('.alert').remove();
            }, timing)
        });
    }
}

function getPosition(position) {
    return true;
}

function geoLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getPosition);
    } else {
        alert('Geolocation is not supported in this browser');
    }
}

function ndfdLegend() {
    var a = ['temperature', 'moisture', 'precipitation', 'wind', 'sky'],
        b = ['apparent_temperature', 'relative_humidity', '12hr_precipitation_probability', 'wind_speed', 'total_sky_cover'],
        o = '';

    for (var i = 0; i < a.length; i++) {
        o += '<div id="legend' + b[i] + '" style="display:none"><img style="width:100%;max-width:283px" src="https://nowcoast.noaa.gov/geoserver/forecasts/ndfd_' + a[i] + '/ows?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=283&height=33&layer=conus_' + b[i] + '"></div>';
    }

    $('body').append('<div id="ndfdLegends" style="display:none">' + o + '</div>');

    /*updateProgressBar('Forecast models loaded...');
    $.ajax({
        url: 'https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/forecast_meteoceanhydro_sfc_ndfd_time/MapServer/legend?f=json',
        method: 'POST',
        dataType: 'json',
        success: function (data) {
            var arr = [23, 32, 35, 20, 17],
                fm = [31, 43, 47, 27, 23],
                leg = '';

            arr.forEach(function (w, c) {
                var o = '',
                    q = '';

                data.layers[w].legend.forEach(function (l) {
                    o += '<td><div style="background:url(data:image/png;base64,' + l.imageData + ') no-repeat;background-size:20px 20px;background-position:-3px -3px;width:15px;height:15px"></td>';
                });
                data.layers[w].legend.forEach(function (l, n) {
                    if (n % 2 == 0) {
                        q += '<td colspan="2" style="padding-top:3px">' + parseFloat(l.label.split(' - ')[0] * (fm[c] == 47 ? 1.151 : 1)).toFixed(0) + '</td>';
                    }
                });

                leg += '<div id="legend' + fm[c] + '" style="display:none"><table cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>' + o + '</tr><tr style="font-size:12px">' + q + '</tr></table></div>';
            });

            $('body').append('<div id="ndfdLegends" style="display:none">' + leg + '</div>');
        },
        complete: function () {
            updateProgressBar('Forecast models loaded...');
        }
    });*/
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function mToFt(r) {
    var radius = r * 3.281;
    return (radius > 5280 ? numberFormat(radius / 5280, 1) + ' miles' : numberFormat(radius, 2) + ' ft.')
}

function FtoC(t) {
    var t = ((t - 32) * (5 / 9)).toFixed(1);
    return (t == '0.0' ? 0 : t);
}

function sizing(v, a = null) {
    var d;

    if (!settings.acres || settings.acres == 'acres') {
        a = a;
        d = 'Acres';
    } else if (settings.acres == 'hectacres') {
        a = a / 2.471;
        d = 'Hectares';
    } else if (settings.acres == 'sqmi') {
        a = a / 640;
        d = 'Square Miles';
    } else if (settings.acres == 'sqkm') {
        a = a / 247.1;
        d = 'Square Km.';
    }

    return (v == 1 ? d : (!settings.acres || settings.acres == 'acres' ? numberFormat(a, 2) : (a < 1 ? numberFormat(a, 4) : numberFormat(a, 2))));
}

function speed(v, u) {
    if (u == 'km/h') {
        return Math.round(v * 1.609);
    } else {
        return (u == 'mph' ? v : Math.round(v / (u == 'm/s' ? 2.237 : (u == 'kts' ? 1.151 : 1))));
    }
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function convertToDms(dd, isLng) {
    var dir = dd < 0
        ? isLng ? 'W' : 'S'
        : isLng ? 'E' : 'N';

    var absDd = Math.abs(dd),
        deg = absDd | 0,
        frac = absDd - deg,
        min = (frac * 60) | 0,
        sec = Math.round((frac * 3600 - min * 60) * 100) / 100;

    return deg + "&deg; " + min + "' " + sec + '" ' + dir;
}

function toDeg(rad) {
    return rad / Math.PI * 180;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function coords(a, b) {
    if (!settings.coordsDisplay || settings.coordsDisplay == 'dec') {
        return parseFloat(a).toFixed(4) + ', ' + parseFloat(b).toFixed(4);
    } else if (settings.coordsDisplay == 'dms') {
        return convertToDms(a, false) + ', ' + convertToDms(b, true);
    } else if (settings.coordsDisplay == 'utm') {
        var utm = L.latLng(a, b).utm();
        return utm.zone + utm.band + ' ' + Math.round(utm.x) + 'E ' + Math.round(utm.y) + 'N';
    }
}

function ucwords(s) {
    if (s.search(/\s/g) >= 0) {
        var a = s.split(' '),
            o = '';

        a.forEach(function (s) {
            o += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
        });

        return o.substring(0, o.length - 1);
    } else {
        return ucfirst(s);
    }
}

function popup(t, c) {
    return '<div class="popupHeader"><h3>' + t + '</h3></div><div class="popupContent">' + c + '</div>';
}

function getCookie(cname) {
    var name = cname + '=',
        decodedCookie = decodeURIComponent(document.cookie),
        ca = decodedCookie.split(';');

    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return '';
}

function updateProgressBar(d = null) {
    var numTasks = 8,
        w = parseFloat(100 / numTasks),
        com = parseFloat($('#loading .spinner').attr('data-progress')) + w;

    $('#loading .spinner').attr('data-progress', com);

    if (d != null) {
        $('#loading span').html(d);
    }

    /* when progress bar hits 100%, hide the loading overlay */
    if (/*com == 100*/d == 'Wildfires loaded...') {
        setTimeout(function () {
            /* show donate popup if user hasn't seen in it for awhile */
            /*if (curTime.getTime() > getCookie('donate') || !getCookie('donate')) {
                $('body').append(donateForm);
            }*/
            $('#loading').hide().html('<div class="content"></div>');
            $('#loading .spinner').attr('data-progress', '0');
        }, 0);
    }
}

function connection(s) {
    console.log('Network: ' + (s === false ? 'Not ' : '') + 'Connected');

    if (navigator.connection.effectiveType == '2g' || navigator.connection.effectiveType == '3g') {
        notify('info', 'Your internet connection is slow');
    }

    if (s === false) {
        $('body').append('<div id="overlay-modal"><div class="mes"><div class="icon"><i class="fa-regular fa-wifi-slash"></i></div><div class="text">' +
            '<h3>No Internet</h3><p>You are not connected to a network. The map won\'t be able to load any new data without a connection.</p>' +
            '<a href="#" class="btn btn-light-blue" onclick="$(this).parent().parent().parent().remove();return false;">Got it, thanks!</a></div></div></div>');
    } else {
        $('#overlay-modal').remove();
        notify('success', 'Your device has reconnected to the internet.');
    }
}

function getDispatchCenter(c) {
    var r = null;

    dispatchCenters.forEach(function (d) {
        if (c == d.agency || c == d.agency.replace('-', '')) {
            r = d;
        }
    });

    return r;
}

function acres(a) {
    if (a == '') {
        return 0;
    } else {
        return a;
    }
}

function fireName(n, t, i) {
    var o = '';
    if (t == 'Prescribed Fire') {
        o = (n.search('RX') >= 0 ? n : n + ' RX');
    } else if (t == 'Smoke Check') {
        o = 'Smoke Check #' + parseInt(i.split('-')[2]);
    } else {
        o = (n == undefined ? '' : (n == '' ? 'Incident #' + parseInt(i.split('-')[2]) : ucwords(n.toLowerCase())) + ' Fire');
    }
    return o;
}

function fireIcon(t, d, u, a, s, note) {
    var z = new Date(),
        n = Math.round(z.getTime() / 1000),
        c = '',
        hrs = 12,
        aph = 15;

    if (new Date(d * 1000).getFullYear() < z.getFullYear()) {
        c = ' out';
    } else {
        if (t == 'Prescribed Fire') {
            c = ' rx';
        } else if (t == 'Smoke Check') {
            c = ' smkchk';
        } else {
            if (s == 'contained' || note.search('contain') >= 0) {
                c = ' contain';
            } else if (s == 'controlled' || note.search('control') >= 0) {
                c = ' controlled' + (a > 10 ? ' norm' : (a > 1 ? ' norm2' : ''));
            } else if (s == 'out') {
                c = ' out';
            } else {
                if (n - d <= (60 * 60 * hrs)) {
                    c = ' new' + (a != '' && a != 'Unknokwn' && a > (((n - d) / 3600) * aph) ? ' fast' : '');
                } else {
                    c = (a > 1000 ? ' large' : (a > 100 ? ' big' : ''));
                }
            }
        }
    }

    return L.divIcon({
        className: 'fire-icon' + c,
        html: '<i class="fa' + ((s != 'contained' && s != 'controlled') && a > 1000 && (n - d > hrs) ? 'r' : 's') + ' fa-' + (t == 'Prescribed Fire' ? 'prescription' : (s == 'out' ? 'fire-flame-simple' : 'fire')) + '"></i>',
        iconAnchor: [8, 11]
    });
}

function fireStatus(v) {
    var s;

    if (v == null || v == '' || v == undefined) {
        s = 'active';
    } else {
        if (v.Out) {
            s = 'out'
        }

        if (v.Contain || v.Contain == null) {
            s = 'contained'
        }

        if (v.Control || v.Control == null) {
            s = 'controlled'
        }
    }

    return s;
}

function airQColor(v) {
    if (v <= 50) {
        r = '00e400';
    } else if (v > 50 && v <= 100) {
        r = 'ffff00';
    } else if (v > 100 && v <= 150) {
        r = 'ff7e00';
    } else if (v > 150 && v <= 200) {
        r = 'ff0000';
    } else if (v > 200 && v <= 300) {
        r = '8f3f97';
    } else if (v > 300 && v <= 500) {
        r = '7e0023';
    } else {
        r = 'd9d9d9';
    }

    return '#' + r;
}

function logFire(f) {
    if (!f) {
        console.error('No WFID supplied to the log');
    } else {
        var a = [],
            c = localStorage.getItem('clks'),
            d = {
                a: f.wfid,
                b: f.state,
                c: f.title,
                d: parseFloat(f.acres)
            };

        if (c) {
            var g = JSON.parse(c);
            g.forEach(function (e) {
                a.push(e);
            })
        }
        a.push(d);
        localStorage.setItem('clks', JSON.stringify(a));
    }
}

function saveLogFire() {
    var a = localStorage.getItem('clks');
    if (a) {
        $.ajax({
            url: apiUrl('logFire', 2),
            method: 'POST',
            data: {
                data: a
            },
            dataType: 'json',
            success: function (r) {

            },
            complete: function () {
                localStorage.setItem('clks', '');
            }
        });
    }
}

function setHeaders(a, b, c) {
    window.history.pushState({
        "pageTitle": a + ' - ' + productName
    }, '', host + b.replace('incident/', '').replace('wildfire/', 'fires/'));

    document.title = a + ' - ' + productName;
    $('meta[name="description"]').attr('content', c);
}

function unsetHeaders() {
    if (window.location.href.search('fires') >= 0 || window.location.href.search('weather/') >= 0 || window.location.href.search('risk') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', host + (archive ? 'archive/' + archive : ''));
        document.title = defaultTitle;
        $('meta[name="description"]').attr('content', $('body').attr('data-d'));
    }
}

function openModal() {
    /*$('#modal').animate({
        'top': '50px'
    }, 750);*/
    $('#modal').removeClass('closing').addClass('open');
}

function closeModal() {
    /*$('#modal').animate({
        'top': '50px'
    }, 750);*/
    $('#modal').removeClass('open fire').addClass('closing');
    $('#modal .content').html('');

    if ($('input[id=nwsfire]').is(':checked')) {
        for (var x = 0; x < nwsFire.getLayers().length; x++) {
            for (var z = 0; z < nwsFire.getLayers()[x].getLayers().length; z++) {
                nwsFire.getLayers()[x].getLayers()[z].setStyle({
                    fillOpacity: 0,
                    weight: 2
                });
            }
        }
    }

    unsetHeaders();
}

function openImpact() {
    $('#impact').attr('data-open', 1).animate({
        'right': '0px'
    }, 750, function () {
        var st = localStorage.getItem('layers_scrollTop');
        /*$('.impactClose').css('right', '335px');*/
        $('#impact .wrapper').animate({
            scrollTop: (st ? st : 0)
        }, 500);
    });
}

function closeImpact() {
    $('#impact').attr('data-open', 0).animate({
        'right': '-375px'
    }, 750, function () {
        if ($('.layersMenu').is(':visible')) {
            $('.layersMenu').hide();
        }
    });

    $('.impactClose').css('right', '-30px');
}

function removePlaceholders() {
    $('#modal .content .container > *').each(function () {
        if ($(this).hasClass('placeholder')) {
            $(this).removeClass('placeholder').css({
                'width': '',
                'height': '',
                'margin-bottom': ''
            });
        }
    });
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
            if (i == 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    var newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}

function similarText(s1, s2) {
    var longer = s1,
        shorter = s2;

    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
        return 1.0;
    }

    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
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

function contains(c) {
    var b = map.getBounds(),
        n = b.getNorth(),
        s = b.getSouth(),
        w = b.getWest(),
        e = b.getEast(),
        r = false;

    for (var x = 0; x < c.length; x++) {
        for (var i = 0; i < c[x].length; i++) {
            if (c[x][i].lat <= n && c[x][i].lat >= s && c[x][i].lng <= e && c[x][i].lng >= w) {
                r = true;
                break;
            } else {
                r = false;
            }
        }
    }

    return r;
}

function findFire(w) {
    var a = [allFires, newFires, smokeChecks, rxBurns],
        p;

    for (var i = 0; i < a.length; i++) {
        if (a[i].getLayers().length > 0) {
            for (var x = 0; x < a[i].getLayers().length; x++) {
                a[i].getLayers()[x].getLayers().forEach(function (f) {
                    if (f.feature.properties.wfid == w) {
                        p = f;
                    }
                });
            }
        }
    }
    return p;
}

function countFires() {
    var tot = [],
        g = [newFires, allFires, smokeChecks, rxBurns];

    for (var x = 0; x < g.length; x++) {
        var count = 0;

        for (var i = 0; i < g[x].getLayers().length; i++) {
            g[x].getLayers()[i].getLayers().forEach(function (l) {
                if (map.getBounds().contains(l.getLatLng())) {
                    count++;
                }
            });
        }

        tot.push(count);
    }

    return tot;
}

function myAccount(u, a) {
    var s = a.replace('{fname}', u.first_name)
        .replace('{lname}', u.last_name)
        .replace('{since}', timeAgo(u.created))
        .replace('{token}', user.token);

    $('.account').html(s);

    if (u.uid) {
        $('#sync span').html('Account last synced ' + (u.synced.method == 1 ? 'automatic' : 'manu') + 'ally ' + timeAgo(u.synced.time).toLowerCase());

        if (settings.perimeters) {
            $('#perimColor option').each(function () {
                if ($(this).val() == settings.perimeters.color) {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#perimZoom option').each(function () {
                if ($(this).val() == settings.perimeters.zoom) {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#perimTtip option').each(function () {
                if ($(this).val() == settings.perimeters.ttip) {
                    $(this).prop('selected', 'selected');
                }
            });
        }

        if (settings.weather) {
            $('#tempUnit option').each(function () {
                if ($(this).val() == settings.weather.temp) {
                    $(this).prop('selected', 'selected');
                }
            });

            $('#windSpeedUnit option').each(function () {
                if ($(this).val() == settings.weather.wind) {
                    $(this).prop('selected', 'selected');
                }
            });
        }

        $('#saveFreq option').each(function () {
            if ($(this).val() == settings.saveFreq) {
                $(this).prop('selected', 'selected');
            }
        });

        $('#locallySave option').each(function () {
            if ($(this).val() == settings.locallySave) {
                $(this).prop('selected', 'selected');
            }
        });

        $('#coordsDisplay option').each(function () {
            if ($(this).val() == settings.coordsDisplay) {
                $(this).prop('selected', 'selected');
            }
        });

        $('#acresUnit option').each(function () {
            if ($(this).val() == settings.acres) {
                $(this).prop('selected', 'selected');
            }
        });

        $('#fireDisplay option').each(function () {
            if ($(this).val() == settings.fireDisplay) {
                $(this).prop('selected', 'selected');
            }
        });
    }
}

function hasPermission(user, action, idSpec = false) {
    if (!user.role) {
        return false;
    }

    if (idSpec) {
        if (mappings.has(action)) {
            return mappings.get(action).includes(user.role) && user.uid == 1;
        }
    } else {
        if (mappings.has(action)) {
            return mappings.get(action).includes(user.role);
        }
    }

    return false;
    /*hasPermission(user, actions.VIEW_LAYERS)*/
}

function getCompassDirection(b) {
    var d,
        b = Math.round(b / 22.5);

    switch (b) {
        case 1:
            d = "NNE";
            break;
        case 2:
            d = "NE";
            break;
        case 3:
            d = "ENE";
            break;
        case 4:
            d = "E";
            break;
        case 5:
            d = "ESE";
            break;
        case 6:
            d = "SE";
            break;
        case 7:
            d = "SSE";
            break;
        case 8:
            d = "S";
            break;
        case 9:
            d = "SSW";
            break;
        case 10:
            d = "SW";
            break;
        case 11:
            d = "WSW";
            break;
        case 12:
            d = "W";
            break;
        case 13:
            d = "WNW";
            break;
        case 14:
            d = "NW";
            break;
        case 15:
            d = "NNW";
            break;
        default:
            d = "N";
    }
    return d;
}

function incidentDetails(data) {
    var a = ['Basic Information', 'Current Situation', 'Outlook', 'Weather Synopsis'],
        o = '';

    a.forEach(function (b) {
        if (data[b]) {
            /* style="padding:10px"*/
            o += '<div class="fire-details linear"><h2>' + b + '</h2><div class="body" style="padding-top:15px">';

            data[b].forEach(function (c, n) {
                /*;padding:' + (n == 0 ? '0' : '10px 0') + '*/
                o += (n % 2 == 0 ? '<div class="row sm" style="align-items:flex-start">' : '') +
                    '<div class="box" style="' + (data[b].length == 1 ? 'max-width:100%' : '') + '"><div class="c t l">' + c.desc + '</div>' +
                    '<div class="c">' + c.info + '</div></div>' + (n % 2 != 0 || n == data[b].length - 1 ? '</div>' : '');
            });

            o += '</div></div>';
        }
    });

    return o;

    /*if (data['Basic Information']) {
        incidentDetails(data['Basic Information']);
    }
    if (data['Current Situation']) {
        incidentDetails(data['Current Situation']);
    }
    if (data['Outlook']) {
        incidentDetails(data['Outlook']);
    }
    if (data['Weather Synopsis']) {
        incidentDetails(data['Weather Synopsis']);
    }*/
}

/* on keyup */
$(document).on('keyup', function (e) {
    /* on esc */
    if (e.keyCode == 27) {
        if ($('#modal').hasClass('open') === true) {
            closeModal();
        }

        if ($('#impact').attr('data-open') == '1') {
            closeImpact();
        }
    }
});

/* on keyup of 2 or more keys */
$(document).bind("keyup keydown", function (e) {
    /* ctrl + f */
    if (e.ctrlKey && e.which == 70) {
        e.preventDefault();
        $('.searchControl').addClass('in-use');
        $('.searchControl #q').focus();
    }
});

/* on mouse up with the DOM */
$(document).on('mouseup', function (e) {
    var $target = $(e.target);
    if (!$('#tileChange').is($target) && $('#tileChange').has($target).length === 0 && $('#tileChange').is(':visible') === true) {
        $('#tileChange').hide();
        $('#tileChange .select-styled, #tileChange .select-options').removeClass('active');
    }

    if (!$('#yearChange').is($target) && $('#yearChange').has($target).length === 0 && $('#yearChange').is(':visible') === true) {
        $('#yearChange').hide();
        $('#yearChange .select-styled, #yearChange .select-options').removeClass('active');
    }

    if (!$('#modal').is($target) && $('#modal').has($target).length === 0 && $('#modal').hasClass('open') === true) {
        closeModal();
    }

    if (!$('.legend').is($target) && $('.legend').has($target).length === 0 && $('.legend').is(':visible') === true) {
        $('.legend').fadeOut();
    }

    if ((!$('#impact').is($target) && $('#impact').has($target).length === 0) && (!$('.impactClose').is($target) && $('.impactClose').has($target).length === 0) && $('#impact').attr('data-open') == '1') {
        closeImpact();
    }

    if (!$('#search-results').is($target) && $('#search-results').has($target).length === 0 && !$('.searchControl').is($target) && $('.searchControl').has($target).length === 0 && $('.searchControl').hasClass('in-use') === true) {
        /*$('#q').val('');
        $('.searchControl').removeClass('in-use');*/
        $('#search-results').hide();
    }
});

/* close the modal when user swipes down on a touchscreen device */
/*document.getElementById('modal').addEventListener('touchmove', function (e) {
    if ($(window).height() - e.touches[0].clientY < 100) {
        $(this).animate({
            top: '100%'
        }, 500, function () {
            $('#modal').removeClass('open fire');
            unsetHeaders();
        });
    }
}, {
    passive: true
});*/

/* tooltip code */
$('div').on('mouseover', function () {
    if ($(this).hasClass('ttip')) {
        var e = $(this),
            a = JSON.parse(e.attr('data-tooltip')),
            t = e.offset().top,
            l = e.offset().left,
            r = $(window).width(),
            w = e.width(),
            h = e.height(),
            top = 0,
            left = 0,
            right = 0;

        if (a.dir == 'left') {
            top = (t + (h / 2) - 6.25);
            left = (l + w + 12);
        } else if (a.dir == 'right') {
            top = (t + (h / 2) - 12);
            left = 'unset';
            right = r - l + 12;
        } else if (a.dir == 'top') {
            top = t - 32;
            left = l - w;
        } else if (a.dir == 'bottom') {
            top = t + h + 19;
            left = l - w;
        }

        $('body').append('<div class="tooltip ' + a.dir + '" style="top:' + top + 'px;left:' + (left == 'unset' ? 'unset' : left + 'px') + (right != 0 ? ';right:' + right + 'px' : '') + '"><p>' + a.text + '</p></div>');

        /* remove tooltip after 1.5 secs if still showing */
        setTimeout(function () {
            if ($('div.tooltip').is(':visible')) {
                $('div.tooltip').remove();
            }
        }, 1500);
    }
});

$('div').on('mouseout', function () {
    if ($(this).hasClass('ttip')) {
        $('div.tooltip').remove();
    }
});

!function (t) { if (void 0 === t) throw new Error("Leaflet must be included first"); function n() { var t = 3.14159265358979, n = 6378137, o = 6356752.314, a = .9996; function h(n) { return n / 180 * t } function i(n) { return n / t * 180 } function e(t) { return h(6 * t - 183) } function r(t, a, h, i) { var e, r, u, M, s, p, w, c, f, l, d; r = (Math.pow(n, 2) - Math.pow(o, 2)) / Math.pow(o, 2) * Math.pow(Math.cos(t), 2), e = Math.pow(n, 2) / (o * Math.sqrt(1 + r)), M = (u = Math.tan(t)) * u, Math.pow(u, 6), s = a - h, p = 1 - M + r, w = 5 - M + 9 * r + r * r * 4, c = 5 - 18 * M + M * M + 14 * r - 58 * M * r, f = 61 - 58 * M + M * M + 270 * r - 330 * M * r, l = 61 - 479 * M + M * M * 179 - M * M * M, d = 1385 - 3111 * M + M * M * 543 - M * M * M, i[0] = e * Math.cos(t) * s + e / 6 * Math.pow(Math.cos(t), 3) * p * Math.pow(s, 3) + e / 120 * Math.pow(Math.cos(t), 5) * c * Math.pow(s, 5) + e / 5040 * Math.pow(Math.cos(t), 7) * l * Math.pow(s, 7), i[1] = function (t) { var a, h, i, e, r, u; return u = (n - o) / (n + o), a = (n + o) / 2 * (1 + Math.pow(u, 2) / 4 + Math.pow(u, 4) / 64), h = -3 * u / 2 + 9 * Math.pow(u, 3) / 16 + -3 * Math.pow(u, 5) / 32, i = 15 * Math.pow(u, 2) / 16 + -15 * Math.pow(u, 4) / 32, e = -35 * Math.pow(u, 3) / 48 + 105 * Math.pow(u, 5) / 256, r = 315 * Math.pow(u, 4) / 512, a * (t + h * Math.sin(2 * t) + i * Math.sin(4 * t) + e * Math.sin(6 * t) + r * Math.sin(8 * t)) }(t) + u / 2 * e * Math.pow(Math.cos(t), 2) * Math.pow(s, 2) + u / 24 * e * Math.pow(Math.cos(t), 4) * w * Math.pow(s, 4) + u / 720 * e * Math.pow(Math.cos(t), 6) * f * Math.pow(s, 6) + u / 40320 * e * Math.pow(Math.cos(t), 8) * d * Math.pow(s, 8) } function u(t, a, h, i) { var e, r, u, M, s, p, w, c, f, l, d, m, v, y, x, L, U, g, b, z, H, O, S, T; e = function (t) { var a, h, i, e, r, u; return u = (n - o) / (n + o), a = t / ((n + o) / 2 * (1 + Math.pow(u, 2) / 4 + Math.pow(u, 4) / 64)), h = 3 * u / 2 + -27 * Math.pow(u, 3) / 32 + 269 * Math.pow(u, 5) / 512, i = 21 * Math.pow(u, 2) / 16 + -55 * Math.pow(u, 4) / 32, e = 151 * Math.pow(u, 3) / 96 + -417 * Math.pow(u, 5) / 128, r = 1097 * Math.pow(u, 4) / 512, a + h * Math.sin(2 * a) + i * Math.sin(4 * a) + e * Math.sin(6 * a) + r * Math.sin(8 * a) }(a), s = (Math.pow(n, 2) - Math.pow(o, 2)) / Math.pow(o, 2), f = Math.cos(e), M = s * Math.pow(f, 2), l = 1 / ((u = r = Math.pow(n, 2) / (o * Math.sqrt(1 + M))) * f), d = (p = Math.tan(e)) / (2 * (u *= r)), m = 1 / (6 * (u *= r) * f), v = p / (24 * (u *= r)), y = 1 / (120 * (u *= r) * f), x = p / (720 * (u *= r)), L = 1 / (5040 * (u *= r) * f), U = p / (40320 * (u *= r)), g = -1 - M, b = -1 - 2 * (w = p * p) - M, z = 5 + 3 * w + 6 * M - 6 * w * M - M * M * 3 - 9 * w * (M * M), H = 5 + 28 * w + 24 * (c = w * w) + 6 * M + 8 * w * M, O = -61 - 90 * w - 45 * c - 107 * M + 162 * w * M, S = -61 - 662 * w - 1320 * c - c * w * 720, T = 1385 + 3633 * w + 4095 * c + c * w * 1575, i[0] = e + d * g * (t * t) + v * z * Math.pow(t, 4) + x * O * Math.pow(t, 6) + U * T * Math.pow(t, 8), i[1] = h + l * t + m * b * Math.pow(t, 3) + y * H * Math.pow(t, 5) + L * S * Math.pow(t, 7) } var M = "CDEFGHJKLMNPQRSTUVWX", s = M.indexOf("N"); return { LatLon2UTM: function (t, n, o, i) { var u; n = 180 === (u = n) ? u : ((u - -180) % 360 + 360) % 360 - 180; var s = function (t) { if (t < -80 || t > 84) return ""; var n = Math.floor((t + 80) / 8); return M.charAt(n) || "X" }(t); o = o || function (t, n) { var o = Math.floor((n + 180) / 6) + 1; return 180 == n && (o = 60), "V" === t && n > 3 && n < 7 ? o = 32 : "X" === t && (n >= 0 && n < 9 ? o = 31 : n >= 9 && n < 21 ? o = 33 : n >= 21 && n < 33 ? o = 35 : n >= 33 && n < 42 && (o = 37)), o }(s, n), i = null == i ? t < 0 : i; var p = new Array(2); return o = function (t, n, o, h) { return r(t, n, e(o), h), h[0] = h[0] * a + 5e5, h[1] = h[1] * a, h[1] < 0 && (h[1] = h[1] + 1e7), o }(h(t), h(n), o, p), { x: p[0], y: p[1], zone: o, band: s, southHemi: i } }, UTM2LatLon: function (n) { if (void 0 === n.southHemi && void 0 === n.band) throw "Undefined hemisphere in " + n.toString(); var o = n.southHemi, h = n.band; h && 1 == h.length && M.indexOf(h.toUpperCase()) >= 0 && (o = M.indexOf(h.toUpperCase()) < s); var r = new Array(2); return function (t, n, o, h, i) { t -= 5e5, h && (n -= 1e7), u(t /= a, n /= a, e(o), i) }(n.x, n.y, n.zone, o, r), Math.abs(r[0]) > t / 2 ? null : { lat: i(r[0]), lng: i(r[1]) } } } } t.Utm = function (t, n, o, a, h) { this.x = +t, this.y = +n, this.zone = o, this.band = a, this.southHemi = h }, t.Utm.setDefaultOptions = function (n) { t.Utm.prototype._defaultOptions = n }, t.Utm.prototype = { toString: function (n) { var o = { decimals: 1, sep: ",", format: "{x}{sep} {y}{sep} {zone}{band}{sep} {datum}", north: "North", south: "South" }; if (this._defaultOptions) { var a = this._defaultOptions; "function" == typeof a && (a = a(n, o)), o = t.extend(o, a) } n = t.extend(o, n); var h = this.dic(); return h.x = h.x.toFixed(n.decimals), h.y = h.y.toFixed(n.decimals), h.hemi = h.southHemi ? n.south : n.north, h.sep = n.sep, h.datum = "WGS84", t.Util.template(n.format, h) }, latLng: function (o) { try { var a = n().UTM2LatLon(this); return t.latLng(a) } catch (t) { if (o) return null; throw t } }, equals: function (t) { try { return this.latLng().equals(t.latLng()) } catch (t) { return !1 } }, normalize: function () { var t = this.latLng(!0); return t ? t.utm() : null }, dic: function (t) { var n = { x: this.x, y: this.y, zone: this.zone, band: this.band, southHemi: this.southHemi }; return t && (n.easting = this.x, n.northing = this.y), n }, clone: function () { return t.utm(this) } }, t.utm = function (n, o, a, h, i) { return null == n ? n : n instanceof t.Utm ? n : "object" == typeof n && "x" in n && "y" in n && "zone" in n ? new t.Utm(n.x, n.y, n.zone, n.band, n.southHemi) : new t.Utm(n, o, a, h, i) }, t.LatLng.prototype.utm = function (o, a) { var h = n().LatLon2UTM(this.lat, this.lng, o, a); return t.utm(h) } }(L);
!function (t) { var a, n = (a = t.documentMode, "onhashchange" in t && (void 0 === a || a > 7)); L.Hash = function (t) { this.onHashChange = L.Util.bind(this.onHashChange, this), t && this.init(t) }, L.Hash.parseHash = function (t) { 0 === t.indexOf("#") && (t = t.substr(1)); var a = t.split(","); if (3 != a.length) return !1; var n = parseInt(a[0], 10), s = parseFloat(a[1]), h = parseFloat(a[2]); return !(isNaN(n) || isNaN(s) || isNaN(h)) && { center: new L.LatLng(s, h), zoom: n } }, L.Hash.formatHash = function (t) { var a = t.getCenter(), n = t.getZoom(), s = Math.max(0, Math.ceil(Math.log(n) / Math.LN2)); return "#" + [n, a.lat.toFixed(s), a.lng.toFixed(s)].join(",") }, L.Hash.prototype = { map: null, lastHash: null, parseHash: L.Hash.parseHash, formatHash: L.Hash.formatHash, init: function (t) { this.map = t, this.lastHash = null, this.onHashChange(), this.isListening || this.startListening() }, removeFrom: function (t) { this.changeTimeout && clearTimeout(this.changeTimeout), this.isListening && this.stopListening(), this.map = null }, onMapMove: function () { if (this.movingMap || !this.map._loaded) return !1; var t = this.formatHash(this.map); this.lastHash != t && (location.replace(t), this.lastHash = t) }, movingMap: !1, update: function () { var t = location.hash; if (t !== this.lastHash) { var a = this.parseHash(t); a ? (this.movingMap = !0, this.map.setView(a.center, a.zoom), this.movingMap = !1) : this.onMapMove(this.map) } }, changeDefer: 100, changeTimeout: null, onHashChange: function () { if (!this.changeTimeout) { var t = this; this.changeTimeout = setTimeout((function () { t.update(), t.changeTimeout = null }), this.changeDefer) } }, isListening: !1, hashChangeInterval: null, startListening: function () { this.map.on("moveend", this.onMapMove, this), n ? L.DomEvent.addListener(t, "hashchange", this.onHashChange) : (clearInterval(this.hashChangeInterval), this.hashChangeInterval = setInterval(this.onHashChange, 50)), this.isListening = !0 }, stopListening: function () { this.map.off("moveend", this.onMapMove, this), n ? L.DomEvent.removeListener(t, "hashchange", this.onHashChange) : clearInterval(this.hashChangeInterval), this.isListening = !1 } }, L.hash = function (t) { return new L.Hash(t) }, L.Map.prototype.addHash = function () { this._hash = L.hash(this) }, L.Map.prototype.removeHash = function () { this._hash.removeFrom() } }(window);
L.Control.Fullscreen = L.Control.extend({ options: { position: "topleft", title: { "false": "Go Fullscreen", "true": "Exit Fullscreen" } }, onAdd: function (map) { var container = L.DomUtil.create("div", "leaflet-control-fullscreen leaflet-bar leaflet-control"); this.link = L.DomUtil.create("a", "leaflet-control-fullscreen-button leaflet-bar-part", container); this.link.href = "#"; this._map = map; this._map.on("fullscreenchange", this._toggleTitle, this); this._toggleTitle(); L.DomEvent.on(this.link, "click", this._click, this); return container }, _click: function (e) { L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e); this._map.toggleFullscreen(this.options) }, _toggleTitle: function () { this.link.title = this.options.title[this._map.isFullscreen()] } }); L.Map.include({ isFullscreen: function () { return this._isFullscreen || false }, toggleFullscreen: function (options) { var container = this.getContainer(); if (this.isFullscreen()) { if (options && options.pseudoFullscreen) { this._disablePseudoFullscreen(container) } else if (document.exitFullscreen) { document.exitFullscreen() } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen() } else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen() } else if (document.msExitFullscreen) { document.msExitFullscreen() } else { this._disablePseudoFullscreen(container) } } else { if (options && options.pseudoFullscreen) { this._enablePseudoFullscreen(container) } else if (container.requestFullscreen) { container.requestFullscreen() } else if (container.mozRequestFullScreen) { container.mozRequestFullScreen() } else if (container.webkitRequestFullscreen) { container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) } else if (container.msRequestFullscreen) { container.msRequestFullscreen() } else { this._enablePseudoFullscreen(container) } } }, _enablePseudoFullscreen: function (container) { L.DomUtil.addClass(container, "leaflet-pseudo-fullscreen"); this._setFullscreen(true); this.invalidateSize(); this.fire("fullscreenchange") }, _disablePseudoFullscreen: function (container) { L.DomUtil.removeClass(container, "leaflet-pseudo-fullscreen"); this._setFullscreen(false); this.invalidateSize(); this.fire("fullscreenchange") }, _setFullscreen: function (fullscreen) { this._isFullscreen = fullscreen; var container = this.getContainer(); if (fullscreen) { L.DomUtil.addClass(container, "leaflet-fullscreen-on") } else { L.DomUtil.removeClass(container, "leaflet-fullscreen-on") } }, _onFullscreenChange: function (e) { var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement; if (fullscreenElement === this.getContainer() && !this._isFullscreen) { this._setFullscreen(true); this.fire("fullscreenchange") } else if (fullscreenElement !== this.getContainer() && this._isFullscreen) { this._setFullscreen(false); this.fire("fullscreenchange") } } }); L.Map.mergeOptions({ fullscreenControl: false }); L.Map.addInitHook(function () { if (this.options.fullscreenControl) { this.fullscreenControl = new L.Control.Fullscreen(this.options.fullscreenControl); this.addControl(this.fullscreenControl) } var fullscreenchange; if ("onfullscreenchange" in document) { fullscreenchange = "fullscreenchange" } else if ("onmozfullscreenchange" in document) { fullscreenchange = "mozfullscreenchange" } else if ("onwebkitfullscreenchange" in document) { fullscreenchange = "webkitfullscreenchange" } else if ("onmsfullscreenchange" in document) { fullscreenchange = "MSFullscreenChange" } if (fullscreenchange) { var onFullscreenChange = L.bind(this._onFullscreenChange, this); this.whenReady(function () { L.DomEvent.on(document, fullscreenchange, onFullscreenChange) }); this.on("unload", function () { L.DomEvent.off(document, fullscreenchange, onFullscreenChange) }) } }); L.control.fullscreen = function (options) { return new L.Control.Fullscreen(options) };