let map,
    dash = null,
    snotels = [],
    GET_SNOTELS = false,
    mchart,
    apiKey = 'c196d0958608ad2b7d4af2be078ecc54',
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    longdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'],
    wssiLegend = '<div class="wssi-legend"><span style="background-color:#D3E0E8">Winter Weather</span><span style="background-color:#FAF5A4">Minor Impacts</span><span style="background-color:#F7972B">Moderate Impacts</span><span style="background-color:#E71921;color:#fff">Major Impacts</span><span style="background-color:#7952A2;color:#fff">Extreme Impacts</span></div>';

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
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

function getDashboard() {
    let r = [];

    dashboards.forEach((d, i) => {
        if (d.state == settings.state && d.dashboard == settings.dashboard) {
            r = d;
        }
    });
    return r;
}

function inside(point, vs) {
    var x = point[1], y = point[0];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][1], yi = vs[i][0];
        var xj = vs[j][1], yj = vs[j][0];

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}

function getCenterOfPolygon(points) {
    let x = y = 0;

    for (let i = 0; i < points.length; i++) {
        x += points[i][0];
        y += points[i][1];
    }

    return [
        (y / points.length),
        (x / points.length)
    ];
}

function prepareAlert(prop) {
    let el = document.querySelector('#wxalerts'),
        t1 = new Date(prop.effective),
        today = new Date().getDay(),
        d1 = (t1.getDay() == today ? 'Today' : longdays[t1.getDay()]),
        h1 = t1.getHours(),
        start = (h1 > 12 ? h1 - 12 : (h1 == 0 ? 12 : h1)) + (t1.getMinutes() > 0 ? ':' + (t1.getMinutes() < 10 ? '0' : '') + t1.getMinutes() + ' ' : ' ') + (h1 == 0 || h1 < 12 ? 'A' : 'P') + 'M ' + d1,
        t2 = new Date(prop.ends),
        d2 = (t2.getDay() == today ? 'Today' : longdays[t2.getDay()]),
        h2 = t2.getHours(),
        end = (h2 > 12 ? h2 - 12 : (h2 == 0 ? 12 : h2)) + (t2.getMinutes() > 0 ? ':' + (t2.getMinutes() < 10 ? '0' : '') + t2.getMinutes() + ' ' : ' ') + (h2 == 0 || h2 < 12 ? 'A' : 'P') + 'M ' + d2;

    let txt = '<li><a target="blank" href="https://alerts-v2.weather.gov/#/?id=' + prop.id + '"><b style="font-weight:400">' + prop.event + '</b></a> &mdash; in effect from ' + start + ' until ' + end + '</li>';

    if (el.getAttribute('data-alerts') == '0') {
        el.innerHTML = '';
        el.setAttribute('data-alerts', '1');
    }

    el.insertAdjacentHTML('beforeend', txt);
}

function getWWAs(c, m) {
    let alertIDs = [];

    c.pop();

    c.forEach(async (e) => {
        const resp = await fetch('https://api.weather.gov/alerts/active?point=' + e[1] + ',' + e[0]);

        if (resp.ok) {
            const a = await resp.json();

            /* if there are any active wwas for this point of the circle */
            if (a.features.length > 0) {
                for (let i = 0; i < a.features.length; i++) {
                    if (alertIDs.includes(a.features[i].properties.id) === false) {
                        prepareAlert(a.features[i].properties);
                        alertIDs.push(a.features[i].properties.id);
                    }
                }
            }
        }
    });

    /*map.addSource('wwas', {
        type: 'geojson',
        data: wwas
    });

    map.addLayer({
        'id': 'wwas',
        'type': 'fill',
        'source': 'wwas',
        'paint': {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.4,
            'fill-antialias': true
        }
    });
}*/
}

async function getGeofence() {
    /*const resp = await fetch('https://www.mapotechnology.com/users/admin/storage/' + dash.state + '_' + dash.dashboard + '.json');

    if (resp.ok) {*/
    var c = [],
        bounds = new mapboxgl.LngLatBounds(),
        g = dash.shape;
    /*const g = await resp.json();*/

    for (let i = 0; i < g.length; i++) {
        c.push([g[i].lng, g[i].lat]);
        bounds.extend([g[i].lng, g[i].lat]);
    }
    c.push([g[0].lng, g[0].lat]);

    map.fitBounds(bounds, {
        padding: 20
    });

    const ctrpt = getCenterOfPolygon(c);

    getDashSNTLs(c);
    frzg(ctrpt);
    webcams(ctrpt);
    getWWAs(c, ctrpt);

    map.addSource('outline', {
        'type': 'geojson',
        'data': {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [c]
            }
        }
    });

    map.addLayer({
        'id': 'fill',
        'type': 'fill',
        'source': 'outline',
        'layout': {},
        'paint': {
            'fill-color': '#0080ff',
            'fill-opacity': 0.05
        }
    });

    map.addLayer({
        'id': 'outline',
        'type': 'line',
        'source': 'outline',
        'layout': {},
        'paint': {
            'line-color': '#0080ff',
            'line-opacity': 0.1
        }
    });
    /*}*/
}

function drawChart(id, pts) {
    new frappe.Chart('#' + id, {
        title: "Snow Accumulation (last 48 hours)",
        data: {
            labels: ["6-hr", "12-hr", "24-hr", "48-hr"],
            datasets: [
                {
                    name: "Snow Accumulation", type: "bar",
                    values: pts
                }
            ]
        },
        type: 'bar',
        height: 200,
        tooltipOptions: {
            formatTooltipY: d => numberFormat(d, 0) + ' in'
        },
        barOptions: {
            spaceRatio: 0.2
        },
        colors: [
            '#7cd6fd'
        ]
    });
}

function trise(r) {
    let c = d = '',
        t = 'Temperature ';

    if (r >= 5) {
        c = 'red';
        d = '0';
        t += 'rising rapidly';
    } else if (r >= 1 && r < 5) {
        c = '#e56c6c';
        d = '45';
        t += 'rising';
    } else if (r >= -1 && r < 1) {
        c = '#4fe3a6';
        d = '90';
        t += 'steady';
    } else if (r < -1 && r > -5) {
        c = '#6dcef3';
        d = '135';
        t += 'falling';
    } else {
        c = '#01b9ff';
        d = '180';
        t += 'falling rapidly';
    }

    return [d, c, t];
}

function snrate(r) {
    let t = '';
    r = r * 2.54;

    if (r < 0.5) {
        t = 'Very light';
    } else if (r >= 0.5 && r < 1) {
        t = 'Light';
    } else if (r >= 1 && r < 2) {
        t = 'Moderate';
    } else if (r >= 2 && r < 5) {
        t = 'Heavy';
    } else {
        t = 'Very heavy';
    }

    return t;
}

async function weatherAPI(f) {
    let id = f.stationId,
        stn = f.shefId;

    const resp = await fetch('https://api.mapotechnology.com/v1/weather/' + stn + '?key=' + apiKey + '&flags=1');

    if (resp.ok) {
        const data = await resp.json();
        let wx = await data.weather;

        if (wx === undefined || data.error == 1) {
            document.querySelectorAll('#snotels .col').forEach((e) => {
                if (e.getAttribute('data-id') == id) {
                    e.remove();
                }
            });
        } else {
            var unit = wx.unit.toUpperCase(),
                temp = (wx.obs.temp.current ? Math.round(wx.obs.temp.current) : null),
                h24 = (wx.obs.temp['24h_max'] ? Math.round(wx.obs.temp['24h_max']) : null),
                l24 = (wx.obs.temp['24h_min'] ? Math.round(wx.obs.temp['24h_min']) : null),
                aob_time = (wx.obs.temp['aob_frzg'] ? wx.obs.temp['aob_frzg'][0] : null),
                total_time = (wx.obs.temp['aob_frzg'] ? wx.obs.temp['aob_frzg'][1] : null),
                elap = (aob_time < 3600 ? (aob_time / 60) + ' mins' : (aob_time / 3600) + ' hr' + ((aob_time / 3600) != 1 ? 's' : '')),
                rise = (wx.obs.temp['rise_3'] ? wx.obs.temp['rise_3'] : null),
                snowData = (wx.obs.snow ? true : false),
                wdir = (wx.obs.raw_rind_dir != -99999 && wx.obs.raw_rind_dir != undefined ? wx.obs.wind_dir : null),
                wspd = (wx.obs.raw_rind_dir != -99999 && wx.obs.raw_rind_dir != undefined ? wx.obs.wind_speed : null),
                hs = (snowData ? wx.obs.snow.hs : null),
                s6 = (snowData ? wx.obs.snow['6hr'] : null),
                s12 = (snowData ? wx.obs.snow['12hr'] : null),
                s24 = (snowData ? wx.obs.snow['24hr'] : null),
                s48 = (snowData ? wx.obs.snow['48hr'] : null),
                srate6 = (snowData ? snrate(s6 / 6) : null),
                srate12 = (snowData ? snrate(s12 / 12) : null),
                srate24 = (snowData ? snrate(s24 / 24) : null),
                srate48 = (snowData ? snrate(s48 / 48) : null),
                completeSnow = (s6 != null && s12 != null && s24 != null && s48 != null ? true : false);

            var ctnt = '<div class="data-share"><div class="l"><h6>Temperature</h6><span>' + (temp == null ? '--' : temp + '&deg;' + unit) + '</span></div>' +
                (h24 != null ? '<div class="l"><h6>24-hr High</h6><span>' + h24 + '&deg;' + unit + '</span></div>' : '') +
                (l24 != null ? '<div class="l"><h6>24-hr Low</h6><span>' + l24 + '&deg;' + unit + '</span></div>' : '') +
                (aob_time != null ? '<div class="l"><h6>Time Below Freezing</h6><span>' + elap + '</span></div>' : '') +
                (snowData ? '<div class="l"><h6>Snow Depth</h6><span>' + (hs == null ? 'N/A' : hs + '"') + '</span></div>' : '') +
                (snowData ? '<div class="l"><h6>6-hr Snow</h6><span>' + (s6 == null ? 'N/A' : s6 + '"') +
                    (s6 != null && s6 > 0 ? '<br><small>' + srate6 + '</small>' : '') + '</span></div>' : '') +
                (snowData ? '<div class="l"><h6>12-hr Snow</h6><span>' + (s12 == null ? 'N/A' : s12 + '"') +
                    (s12 != null && s12 > 0 ? '<br><small>' + srate12 + '</small>' : '') + '</span></div>' : '') +
                (snowData ? '<div class="l"><h6>24-hr Snow</h6><span>' + (s24 == null ? 'N/A' : s24 + '"') +
                    (s24 != null && s24 > 0 ? '<br><small>' + srate24 + '</small>' : '') + '</span></div>' : '') +
                (snowData ? '<div class="l"><h6>48-hr Snow</h6><span>' + (s48 == null ? 'N/A' : s48 + '"') +
                    (s48 != null && s48 > 0 ? '<br><small>' + srate48 + '</small>' : '') + '</span></div>' : '') +
                (wdir != null ? '<div class="l"><h6>Wind Direction</h6><span>' + wdir + '</span></div>' : '') +
                (wspd != null ? '<div class="l"><h6>Wind Speed</h6><span>' + wspd + ' mph</span></div>' : '') +
                '<span class="upd">Last report ' + timeAgo(wx.updated) + '</span></div><div id="chart_' + id + '"></div>';

            if (rise != null) {
                let v = trise(rise);
                document.querySelector('.col[data-id="' + CSS.escape(id) + '"] .card .controls').insertAdjacentHTML('afterbegin', '<i class="fas fa-arrow-up" title="' + v[2] + ' (' + (rise / 3).toFixed(1) + '°F/hr)" style="margin-right:10px;color:' + v[1] + ';transform:rotate(' + v[0] + 'deg)"></i>');
            }

            document.querySelectorAll('#snotels div.col').forEach((c) => {
                if (c.getAttribute('data-id') == id) {
                    c.querySelector('.body .data-share').innerHTML = ctnt;

                    if (completeSnow) {
                        drawChart('chart_' + id, [s6, s12, s24, s48]);
                    }
                }
            });
        }
    }
}

function getDashSNTLs(c) {
    let hold = '',
        ph = '<div class="data-share"><div class="l"><h6><div class="placeholder" style="width:91px;height:22px"></div></h6><span><div class="placeholder" style="width:33px;height:22px"></div></span></div>' +
            '<div class="l"><h6><div class="placeholder" style="width:91px;height:22px"></div></h6><span><div class="placeholder" style="width:33px;height:22px"></div></span></div>' +
            '<div class="l"><h6><div class="placeholder" style="width:76px;height:22px"></div></h6><span><div class="placeholder" style="width:33px;height:22px"></div></span></div>' +
            '<div class="l"><h6><div class="placeholder" style="width:71px;height:22px"></div></h6><span><div class="placeholder" style="width:33px;height:22px"></div></span></div></div>';

    snotels.forEach((s) => {
        if (inside(s.geometry.coordinates, c)) {
            weatherAPI(s.properties);
            hold += '<div data-id="' + s.properties.stationId + '" class="col" onclick="goToStn(' + s.properties.stationId + ')"><section class="card" style="cursor:pointer"><h5>' + s.properties.name + '</h5><div class="body">' +
                '<div class="controls"><span><i class="far fa-mountains" style="padding-right:10px"></i>' + s.properties.elevation + '\'</span></div>' + ph + '</div></section></div>';
        }
    });

    document.getElementById('snotels').innerHTML = hold;
}

function goToStn(id) {
    const f = map.queryRenderedFeatures({
        layers: ['snotels']
    });

    /* clicking on snotels */
    if (f.length > 0) {
        f.forEach((feature) => {
            if (feature.layer.id == 'snotels' && feature.properties.stationId == id) {
                var b = new mapboxgl.LngLatBounds();
                b.extend(feature.geometry.coordinates);
                map.fitBounds(b, {
                    maxZoom: 11.2
                });
            }
        });
    }
}

async function webcams(c) {
    const resp = await fetch('https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=8&include=images&nearby=' + c[0] + ',' + c[1] + ',75', {
        method: 'GET',
        headers: {
            'x-windy-api-key': '1G6xpRaFXNHLQBRxMtdpLZXiCoAGsCm9'
        }
    });

    if (resp.ok) {
        let wc = await resp.json(),
            img = '';

        wc.webcams.forEach((w) => {
            img += '<a target="blank" style="display:inline-block" href="https://www.windy.com/webcams/' + w.webcamId + '"><img src="' + w.images.current.thumbnail + '"></a>';
        });

        document.querySelector('#webcams').innerHTML = img;
    }
}

function mean(arr, f = 1) {
    const n = arr.length,
        mean = arr.reduce((a, b) => a + b) / n/*,
        stdev = Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)*/;

    return mean.toFixed(f);
}

async function frzg(arr) {
    const useChart = false;
    const fd = new FormData();
    fd.append('lat', arr[0]);
    fd.append('lon', arr[1]);

    const popup = new mapboxgl.Popup({
        offset: 25,
        maxWidth: 75
    })
        .setHTML('<span style="color:#000">Forecast data from this point</span>');

    new mapboxgl.Marker({
        color: 'black'
    })
        .setLngLat([arr[1], arr[0]])
        .setPopup(popup)
        .addTo(map)
        .togglePopup();

    const resp = await fetch('https://api.mapotechnology.com/v1/nbm/winter?key=' + apiKey, {
        method: 'POST',
        body: fd
    });

    if (resp.ok) {
        let d = await resp.json(),
            times = [],
            /*temp = [],
            t1 = [],
            t2 = [],
            sd1 = [],
            sd2 = [],*/
            ctx = document.getElementById('frzgchart');

        if (d.nbm.data.frzg_level == null) {
            ctx.insertAdjacentHTML('afterend', '<p class="error">We\'re unable to generate a freezing level chart for this area</p>');
            ctx.remove();
        } else {
            d.nbm.data.time.forEach((v) => {
                let d = new Date(v * 1000),
                    day = days[d.getDay()],
                    date = d.getDate();

                times.push(day + ', ' + (d.getHours() > 12 ? (d.getHours() - 12) + 'p' : (d.getHours() == 0 ? '12' : d.getHours()) + 'a') + 'm');
            });

            /* create the freezing level chart */
            mchart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: times,
                    datasets: [
                        {
                            type: 'line',
                            label: 'Freezing Level',
                            data: d.nbm.data.frzg_level,
                            borderColor: '#36a2eb',
                            backgroundColor: 'rgb(54 162 235 / 20%)',
                            fill: 'origin',
                            yAxisID: 'y'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    layout: {
                        padding: 20
                    },
                    scales: {
                        x: {
                            type: 'category',
                            title: {
                                display: true,
                                text: 'Time',
                                font: {
                                    family: 'Noto Sans',
                                    size: 11
                                }
                            },
                            ticks: {
                                font: {
                                    family: 'Noto Sans',
                                    size: 10
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Freezing Level (ft)',
                                font: {
                                    family: 'Noto Sans',
                                    size: 11
                                }
                            },
                            position: 'left',
                            stacked: true,
                            ticks: {
                                font: {
                                    family: 'Noto Sans',
                                    size: 11
                                }
                            }
                        }
                    },
                    plugins: {
                        customCanvasBackgroundColor: {
                            color: '#fff',
                        },
                        colors: {
                            enabled: true,
                            forceOverride: true
                        },
                        legend: {
                            display: false,
                            position: 'right',
                            align: 'center'
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + numberFormat(context.parsed.y, 0) + ' ft';
                                }
                            }
                        }
                    }
                },
                plugins: [{
                    id: 'customCanvasBackgroundColor',
                    beforeDraw: (chart, args, options) => {
                        const { ctx } = chart;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = options.color || '#99ffff';
                        ctx.fillRect(0, 0, chart.width, chart.height);
                        ctx.restore();
                    }
                }]
            });
        }

        if (d.nbm.data['6hr_accum'] == null) {
            document.querySelector('#acc6').parentElement.remove();
        } else {
            let valid = new Date(d.nbm.data['6hr_accum'][d.nbm.data['6hr_accum'].length - 1].valid),
                vh = valid.getHours(),
                when = longdays[valid.getDay()] + ' at ' + (vh == 0 ? '12' : (vh > 12 ? (vh - 12) + ' A' : vh + ' P')) + 'M',
                avg = d.nbm.data['6hr_accum'][d.nbm.data['6hr_accum'].length - 1].accum / d.nbm.data['6hr_accum'].length,
                totalAccum = parseFloat(d.nbm.data['6hr_accum'][d.nbm.data['6hr_accum'].length - 1].accum).toFixed(1),
                st;

            for (let i = 0; i < d.nbm.data['6hr_accum'].length; i++) {
                if (d.nbm.data['6hr_accum'][i].total != 0) {
                    st = d.nbm.data['6hr_accum'][i].valid;
                    break;
                }
            }

            let beg = new Date(st),
                eh = beg.getHours(),
                start = longdays[beg.getDay()] + ' at ' + (eh == 0 ? '12' : (eh > 12 ? (eh - 12) + ' A' : eh + ' P')) + 'M';

            if (totalAccum == 0) {
                advisoryText = 'No new snow accumulation expected over the next few days';
            } else {
                advisoryText = 'Expect about ' + totalAccum + ' inches of new snow (' + avg.toFixed(1) + '"/hr) between ' + start + ' and ' + when;
            }

            document.querySelector('#acc6').innerHTML = '<span><i class="fat fa-snowflake" style="padding-right:5px"></i>' + advisoryText + '.</span>';
        }

        if (d.nbm.data.snprob == null) {
            document.querySelector('#sntable').parentElement.parentElement.innerHTML = '<p class="error">We\'re unable to produce a snow probability forecast for this area</p>';
        } else {
            let at = '',
                tableAdd1 = [],
                tableAdd2 = [],
                tableAdd3 = [],
                tableAdd4 = [],
                tableAdd5 = [],
                tableAdd6 = [];

            /* build snow probably table */
            for (let i = 0; i < d.nbm.data.snprob.times.length; i++) {
                var dt = new Date(d.nbm.data.snprob.times[i] * 1000),
                    hrs = dt.getHours(),
                    date = longdays[dt.getDay()] + ' (' + months[dt.getMonth()] + ' ' + dt.getDate() + ')';

                at += '<tr style="text-align:center"><td style="text-align:left">' + date + '</td><td>' + Math.round(d.nbm.data.snprob.in1[i]) + '%</td><td>' + Math.round(d.nbm.data.snprob.in2[i]) + '%</td>' +
                    '<td>' + Math.round(d.nbm.data.snprob.in4[i]) + '%</td><td>' + Math.round(d.nbm.data.snprob.in6[i]) + '%</td><td>' + Math.round(d.nbm.data.snprob.in8[i]) + '%</td>' +
                    '<td>' + Math.round(d.nbm.data.snprob.in12[i]) + '%</td></tr>';

                tableAdd1.push(parseFloat(d.nbm.data.snprob.in1[i]));
                tableAdd2.push(parseFloat(d.nbm.data.snprob.in2[i]));
                tableAdd3.push(parseFloat(d.nbm.data.snprob.in4[i]));
                tableAdd4.push(parseFloat(d.nbm.data.snprob.in6[i]));
                tableAdd5.push(parseFloat(d.nbm.data.snprob.in8[i]));
                tableAdd6.push(parseFloat(d.nbm.data.snprob.in12[i]));
            }

            at += '<tr style="text-align:center;font-weight:500"><td style="text-align:left">10-day Average</td><td>' + mean(tableAdd1) + '%</td><td>' + mean(tableAdd2) + '%</td><td>' + mean(tableAdd3) + '%</td>' +
                '<td>' + mean(tableAdd4) + '%</td><td>' + mean(tableAdd5) + '%</td><td>' + mean(tableAdd6) + '%</td></tr>';

            document.querySelectorAll('.table div.placeholder').forEach((te) => {
                te.remove();
            });
            document.querySelector('#sntable').innerHTML = '<thead><tr><th></th><th>>1"</th><th>>2"</th><th>>4"</th><th>>6"</th><th>>8"</th><th>>12"</th></tr></thead><tbody>' + at + '</tbody>';
        }
    }
}

async function readWWA(p, c) {
    const resp = await fetch('https://api.weather.gov/points/' + c[0] + ',' + c[1]);
    /*https://api.weather.gov/alerts/active?point=*/
    if (resp.ok) {
        const a = await resp.json(),
            zone = a.properties.forecastZone.match(/([A-Z]{2,}[0-9]{3})/gm),
            co = a.properties.county.match(/([A-Z]{2,}[0-9]{3})/gm),
            fwz = a.properties.fireWeatherZone.match(/([A-Z]{2,}[0-9]{3})/gm);


        window.open('https://forecast.weather.gov/showsigwx.php?warnzone=' + zone + '&warncounty=' + co + '&firewxzone=' + fwz + '&product1=' + p);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    dash = getDashboard();
    let ctr = (dash ? [dash.geo.lng, dash.geo.lat] : [-117.464, 45.451]),
        zm = (dash ? dash.geo.z : 5.5);

    /* get wssi and weather alerts for the WFO this area is located */
    document.querySelector('#supp .body').innerHTML = wssiLegend + '<div class="wssi" style="background-image:url(https://origin.wpc.ncep.noaa.gov/wwd/wssi/images/WSSI_Overall_' + dash.wfo + '.png)" onclick="window.open(\'https://www.wpc.ncep.noaa.gov/wwd/wssi/wssi.php?id=' + dash.wfo + '\')"></div>';

    map = new mapboxgl.Map({
        container: 'map',
        center: ctr,
        zoom: zm,
        minZoom: 5.3,
        hash: false,
        style: 'mapbox://styles/mapbox/light-v11',
        accessToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ'
    })
        .on('load', () => {
            document.getElementById('map').classList.remove('placeholder');

            /* get snotel layer */
            map.addSource('snotels', {
                type: 'vector',
                url: 'mapbox://mapollc.clnvzgl9v2vzd2blkijt84icc-1gjxv'
            });

            /* add snotels to map */
            map.addLayer({
                'id': 'snotels',
                'type': 'circle',
                'source': 'snotels',
                'source-layer': 'snotels',
                'filter': ['!=', 'networkCode', 'COOP'],
                'paint': {
                    'circle-color': '#38428b',
                    'circle-stroke-color': '#f9f9f9',
                    'circle-stroke-width': 2,
                    'circle-radius': {
                        'base': 3,
                        'stops': [
                            [7, 5],
                            [10, 8]
                        ]
                    }
                }
            });

            /* add labels for snotels */
            map.addLayer({
                'id': 'symbols',
                'type': 'symbol',
                'source': 'snotels',
                'minzoom': 8,
                'source-layer': 'snotels',
                'filter': ['==', 'networkCode', 'SNTL'],
                'layout': {
                    'symbol-placement': 'point',
                    'text-font': ['Open Sans Regular'],
                    'text-field': '{name}',
                    'text-size': 12,
                    'text-offset': [0, 1.35],
                    'text-justify': 'center',
                    'text-letter-spacing': 0,
                    'text-allow-overlap': false
                },
                'paint': {
                    'text-color': '#222',
                    'text-halo-blur': 0,
                    'text-halo-width': 0.5,
                    'text-halo-color': '#ccc'
                }
            });
        })
        .on('idle', () => {
            if (!GET_SNOTELS) {
                GET_SNOTELS = true;

                const f = map.queryRenderedFeatures({
                    layers: ['snotels']
                });

                /* clicking on snotels */
                if (f.length > 0) {
                    f.forEach((feature) => {
                        if (feature.layer.id == 'snotels') {
                            snotels.push(feature);
                        }
                    });
                }

                if (dash) {
                    getGeofence();
                }
            }
        })
        .on('click', (e) => {
            const f = map.queryRenderedFeatures([e.point.x, e.point.y], {
                layers: ['snotels', 'wwas']
            });

            /* clicking on snotels */
            if (f.length > 0) {
                f.forEach((feature) => {
                    if (feature.layer.id == 'snotels') {

                    } else if (feature.layer.id == 'wwas') {
                        let start = new Date(feature.properties.issuance * 1000).toString().replace(/\s\GMT-[0-9]+\s\((.*?)\)/, ' $1').replace(/([A-Z])[a-z]+\s([A-Z])[a-z]+\s([A-Z])[a-z]+$/gm, '$1$2$3'),
                            end = new Date(feature.properties.end * 1000).toString().replace(/\s\GMT-[0-9]+\s\((.*?)\)/, ' $1').replace(/([A-Z])[a-z]+\s([A-Z])[a-z]+\s([A-Z])[a-z]+$/gm, '$1$2$3');

                        new mapboxgl.Popup({
                            offset: 25,
                            maxWidth: 75
                        })
                            .setLngLat([e.lngLat.lng, e.lngLat.lat])
                            .setHTML('<p style="margin:0;text-align:center"><b>' + feature.properties.phenomenon + ' ' + feature.properties.significance + '</b> from ' + start + ' until ' + end + '<br><a href="#" onclick="readWWA(\'' + feature.properties.phenomenon + ' ' + feature.properties.significance + '\', [' + e.lngLat.lat + ', ' + e.lngLat.lng + ']); return false">More Details</a></p>')
                            .setMaxWidth("325px")
                            .addTo(map);
                    }
                });
            }
        });

    /* add navigation control */
    map.addControl(new mapboxgl.NavigationControl());

});

window.addEventListener('onresize', () => {
    mchart.resize();
});