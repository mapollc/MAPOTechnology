var map,
    host = 'https://www.mapotrails.com/',
    apiUrl = 'https://api.mapotechnology.com/v1/',
    domain = 'https://www.mapotechnology.com/',
    key = 'cf707f0516e5c1226835bbf0eece4a0c',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ',
    attrib = '&copy; ' + new Date().getFullYear() + ' MAPO LLC',
    trailID = window.location.pathname.match(/\/([0-9]+)\//gm)[0].replaceAll('/', ''),
    terrain,
    caltopo,
    shading,
    avy,
    fs16,
    satellite,
    delorme,
    tileNames = ['terrain', 'satellite', 'caltopo', 'fs16', 'outdoors',/* 'delorme',*/ 'osm'],
    tilePerms = [0, 0, 0, 1, 1],
    chart,
    allWaypoints = [],
    elevs = [],
    cdata = [];

terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    id: 'Terrain',
    minZoom: 3,
    maxZoom: 18,
    attribution: attrib
});

caltopo = L.tileLayer(domain + 'assets/images/tiles/2/{z}/{x}/{y}.png', {
    id: 'CalTopo',
    minZoom: 5,
    maxZoom: 16,
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

shading = L.tileLayer(domain + 'assets/images/tiles/1/{z}/{x}/{y}.png', {
    id: 'CalTopo Shading',
    minZoom: 5,
    maxZoom: 16,
    opacity: 0.3,
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

avy = L.tileLayer('https://d3kcsn1y1fg3m9.cloudfront.net/tiles/4/{z}/{x}/{y}.png', {
    id: 'Avalanche Shading',
    minZoom: 5,
    maxZoom: 16,
    opacity: (settings.avyOpac ? settings.avyOpac / 100 : 0.4),
    className: 'avy-shade',
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

fs16 = L.tileLayer(domain + 'assets/images/tiles/3/{z}/{x}/{y}.png', {
    id: 'USFS 2016',
    minZoom: 5,
    maxZoom: 16,
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    id: 'Google Hybrid',
    minZoom: 3,
    maxZoom: 20,
    attribution: attrib + ' | Tiles by <a href="https://google.com">Google</a>'
});

outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token={token}', {
    id: 'Mapbox Outdoors v12',
    minZoom: 1,
    maxZoom: 20,
    token: mapboxToken,
    attribution: attrib + ' | Tiles by <a href="https://mapbox.com">Mapbox</a>'
});

osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    id: 'Open Street Map',
    minZoom: 4,
    maxZoom: 19,
    attribution: attrib + ' | Tiles by <a href="https://openstreetmap.org">OSM</a>'
});

function popup(t, c) {
    return '<div class="popupHeader"><h3>' + t + '</h3></div><div class="popupContent">' + c + '</div>';
}

function handleTileError(evt) {
    if (evt.tile._hasError) return;

    if (evt.target.options.id == 'CalTopo') {
        url2 = 'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png';
    } else if (evt.target.options.id == 'CalTopo Shading') {
        url2 = 'https://caltopo.com/tile/hs_m315z45s3/{z}/{x}/{y}.png';
    } else if (evt.target.options.id == 'Avalanche Shading') {
        url2 = 'https://caltopo.com/tile/sc_fixed/{z}/{x}/{y}.png';
    } else if (evt.target.options.id == 'USFS 2016') {
        url2 = 'https://caltopo.com/tile/f16a/{z}/{x}/{y}.png';
    }

    var si = Math.floor((Math.random() * 3));
    var tileSrc = url2.replace(/{x}/g, evt.coords.x);
    tileSrc = tileSrc.replace(/{y}/g, evt.coords.y);
    tileSrc = tileSrc.replace(/{z}/g, evt.coords.z);
    evt.tile._hasError = true;
    evt.tile.src = tileSrc;
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d / 1.609;
}

function pctToDeg(n) {
    return (Math.atan(n / 100) * (180 / Math.PI)).toFixed(1);
}

function toRad(Value) {
    return Value * Math.PI / 180;
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
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

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function removeElement(e) {
    e.parent().parent().remove();
}

function setMapType() {
    if (!settings.tile) {
        settings.tile = 'fs16';
    }

    var ind = tileNames.indexOf(settings.tile),
        tileIDs = [terrain, satellite, caltopo, fs16, outdoors,/*delorme,*/ osm];

    tileIDs.forEach(function (k, v) {
        if (ind == v) {
            map.addLayer(tileIDs[v]).setMinZoom(tileIDs[v].options.minZoom).setMaxZoom(tileIDs[v].options.maxZoom);

            if (tileNames[ind] == 'caltopo' || tileNames[ind] == 'fs16') {
                shading.addTo(map).bringToFront();
            }

            if (settings.category == 'snow' && settings.avy !== true && settings.aspect !== true || settings.avy) {
                if (!map.hasLayer(avy)) {
                    avy.addTo(map);
                }
                avy.bringToFront();
            }

            if (settings.aspect) {
                if (!map.hasLayer(aspectLayer)) {
                    aspectLayer.addTo(map);
                }
                aspectLayer.bringToFront();
            }

            if (tileNames[ind] == 'outdoors') {
                outdoors.bringToBack();
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
}

function markerIcon(c) {
    var i;
    if (c.includes('Hike')) {
        i = wpIcon('hike');
    } else if (c.includes('Mountain Bike')) {
        i = wpIcon('mtn_bike');
    } else if (c.includes('Gravel Bike')) {
        i = wpIcon('gravel');
    } else if (c.includes('Road Bike')) {
        i = wpIcon('road');
    } else if (c.includes('Backcountry Ski')) {
        i = wpIcon('ski');
    } else if (c.includes('Snowmobile')) {
        i = wpIcon('snowmobile');
    } else {
        i = wpIcon('info');
    }
    return i;
}

function wpIcon(i) {
    let icon,
        t = 1,
        color;

    switch (i) {
        case '4x4':
            icon = 'far fa-steering-wheel';
            color = '#8a6a18';
            t = 1;
            break;
        case 'big_air':
            icon = 'fad fa-cards-blank';
            color = '#962d89';
            t = 1;
            break;
        case 'bigfoot':
            icon = 'far fa-shoe-prints';
            color = '#e55188';
            t = 1;
            break;
        case 'bridge':
            icon = 'far fa-bridge';
            color = '#8a6a18';
            t = 1;
            break;
        case 'cabin':
            icon = 'fal fa-cabin';
            color = '#8a6a18';
            t = 1;
            break;
        case 'camp':
            icon = 'fas fa-campground';
            color = '#3e9d1f';
            t = 1;
            break;
        case 'camp2':
            icon = 'fas fa-campground';
            color = '#3e9d1f';
            t = 1;
            break;
        case 'caution':
            icon = 'fad fa-diamond-exclamation';
            color = '#eeff00';
            t = 0;
            break;
        case 'fishing':
            icon = 'far fa-fishing-rod';
            color = '#004741';
            t = 1;
            break;
        case 'hike':
            icon = 'far fa-person-hiking';
            color = '#24a7ff';
            break;
        case 'fantasy':
            icon = 'far fa-wand-sparkles';
            color = '#f48fb1';
            t = 1;
            break;
        case 'gravel':
            icon = 'fas fa-xmarks-lines';
            color = '#a3a3a3';
            t = 1;
            break;
        case 'info':
            icon = 'fal fa-circle-info';
            color = '#3875d7';
            t = 1;
            break;
        case 'lake':
            icon = 'far fa-water';
            color = '#0f5fff';
            t = 1;
            break;
        case 'media':
            icon = 'fas fa-video';
            color = '#51c3b5';
            t = 1;
            break;
        case 'mtn_bike':
            icon = 'fa-solid fa-person-biking-mountain';
            color = '#15cf05';
            t = 0;
            break;
        case 'parking':
            icon = 'far fa-circle-parking';
            color = '#874f28';
            break;
        case 'road':
            icon = 'fas fa-road';
            color = '#3a3a3a';
            t = 1;
            break;
        case 'restroom':
            icon = 'fas fa-sharp fa-restroom';
            color = '#104daf';
            t = 1;
            break;
        case 'river':
            icon = 'far fa-water';
            color = '#0f5fff';
            t = 1;
            break;
        case 'sledding':
            icon = 'far fa-person-sledding';
            color = '#24ffd0';
            t = 0;
            break;
        case 'ski':
            icon = 'far fa-person-skiing';
            color = '#24ffd0';
            t = 0;
            break;
        case 'snowmobile':
            icon = 'fas fa-person-snowmobiling';
            color = '#f99d3e';
            t = 1;
            break;
        case 'summit':
            icon = 'far fa-mountains';
            color = '#006625';
            t = 1;
            break;
        default:
            icon = 'fal fa-circle-info';
            color = '#3875d7';
            t = 1;
            break;
    }

    return L.divIcon({
        html: '<div style="background-color:' + color + ';color:#' + (t == 1 ? 'fff' : '282829') + '"><i class="' + icon + '"></i></div>',
        className: 'waypoint',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

async function getGIS() {
    const live = (document.querySelector('.stats') == null ? false : true);
    const fd = new FormData();
    fd.append('id', document.getElementById('map').getAttribute('data-tid'));

    const resp = await fetch(apiUrl + 'trails/gis?key=' + key, {
        method: 'POST',
        body: fd
    });

    if (resp.ok) {
        const g = await resp.json();

        let gis = g.trail.gis,
            stat = g.trail.stats,
            ww = Math.round(gis[0].gpx.length / 2),
            grades = [],
            gradeCount = 0,
            gradeTotal = 0;

        /* replace placeholders for stats with the data */
        document.getElementById('map').style.filter = 'unset';

        if (live) {
            if (stat) {
                document.getElementById('a').innerHTML = stat.distance.toFixed(1) + ' mi.';
                document.getElementById('b').innerHTML = numberFormat(gis[0].gpx[0].chart.elev, 1) + ' ft.';
                document.getElementById('c').innerHTML = numberFormat(stat.elevation.max, 1) + ' ft.';
                document.getElementById('d').innerHTML = numberFormat(stat.elevation.min, 1) + ' ft.';
                document.getElementById('e').innerHTML = numberFormat(stat.altitude.gain, 1) + ' ft.';
                document.getElementById('f').innerHTML = numberFormat(stat.altitude.loss, 1) + ' ft.';
            } else {
                document.querySelectorAll('#a, #b, #c, #d, #e, #f').innerHtml = 'N/A';
            }

            if (localStorage.getItem('guide' + trailID) == null) {
                fuelType(gis[0].gpx[ww].coords[0], gis[0].gpx[ww].coords[1]);
            }
        }

        /* loop through each GIS trail */
        for (var x = 0; x < gis.length; x++) {
            var trail = gis[x],
                gpx = trail.gpx,
                a = [];

            /* loop through each GPX file for the specified trail */
            for (var l = 0; l < gpx.length; l++) {
                var e = parseFloat(gpx[l].chart.elev.toFixed(1)),
                    d = parseFloat(gpx[l].chart.dist.toFixed(3));

                /* if not the first point in the GPX, calculate the slope between each point */
                if (l > 0) {
                    var h = l - 1,
                        f = parseFloat(gpx[h].chart.elev.toFixed(1)),
                        j = parseFloat(gpx[h].chart.dist.toFixed(3));

                    var ch = (((e - f) / ((d - j) * 5280)) * 100).toFixed(1),
                        deg = pctToDeg(ch);

                    if (!isNaN(ch) && ch.search('Infinity') < 0) {
                        if (x == 0) {
                            grades.push(ch);
                            gradeTotal += parseFloat(ch);
                            gradeCount++;
                        }

                        ch = ch + '% (' + deg + '°)';
                    } else {
                        ch = '--';
                    }
                }

                /* push lat/lon to an array for leaflet */
                a.push([parseFloat(gpx[l].coords[0]), parseFloat(gpx[l].coords[1])]);

                /* format tooltip for the chart */
                if (x == 0) {
                    elevs.push(gpx[l].chart.elev);
                    cdata.push([d, e, ch]);
                }
            }

            /* if this is the main GPX track */
            if (x == 0) {
                var avg = (gradeTotal / gradeCount),
                    max = Math.max.apply(null, grades);

                /*green < 10
                yellow 10-15
                orange 15-20
                red >20*/

                if (live) {
                    document.getElementById('g').innerHTML = avg.toFixed(1) + '% (' + pctToDeg(avg) + '&deg;)';
                    document.getElementById('h').innerHTML = max.toFixed(1) + '% (' + pctToDeg(max) + '&deg;)';
                }
            }

            /* if the coordinates exist, add polyline to leaflet */
            if (a) {
                var p = L.polyline(a, {
                    color: (trail.color ? trail.color : '#cb2626'),
                    weight: 5,
                    title: trail.caption
                })
                    .bindPopup(popup(trail.caption, ''), {
                        className: 'trail-popup d',
                        minWidth: 225,
                        maxWidth: 250
                    })
                    .on('mouseover', function () {
                        this.setStyle({
                            weight: 8
                        })
                    })
                    .on('mouseout', function () {
                        this.setStyle({
                            weight: 5
                        })
                    })
                    .addTo(map);

                /* if this is the first GPX track, add arrows to the track */
                if (x == 0) {
                    L.polylineDecorator(a, {
                        pane: 'trail',
                        patterns: [{
                            offset: "10%",
                            repeat: "15%",
                            symbol: L.Symbol.arrowHead({
                                pixelSize: 12,
                                polygon: !1,
                                pathOptions: {
                                    color: (trail.mode == 'Tour' ? '#f1f1f1' : '#282829'),
                                    fillOpacity: 1,
                                    stroke: !0,
                                    weight: 4
                                }
                            })
                        }]
                    })
                        .addTo(map);

                    /* add start/end markers for the main GPX track */
                    L.marker(a[0], {
                        pane: 'trail',
                        icon: L.divIcon({
                            className: 'ends start',
                            html: '<div></div>',
                            iconSize: [20, 20],
                            iconAnchor: [0, 10]
                        })
                    })
                        .addTo(map);

                    L.marker(a[a.length - 1], {
                        pane: 'trail',
                        icon: L.divIcon({
                            className: 'ends end',
                            html: '<div></div>',
                            iconSize: [20, 20],
                            iconAnchor: [0, 10]
                        })
                    })
                        .addTo(map);

                    if (p.getBounds()) {
                        map.fitBounds(p.getBounds());
                    }

                }
            }
        }

        /* get chartjs library, then draw the elevation chart */
        if (document.querySelector('.chart')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            document.head.appendChild(script);

            script.onload = function () {
                drawChart();
            };
        }
    }
}

async function fuelType(a, b) {
    const post = {
        geometry: b + ',' + a,
        geometryType: 'esriGeometryPoint',
        layers: '0,1',
        tolerance: '1',
        mapExtent: '-181,14,-12,60',
        imageDisplay: '600,550,9',
        returnGeometry: 'false',
        f: 'json'
    };

    const fd = new FormData();
    for (var key in post) {
        fd.append(key, post[key]);
    }

    const js = await fetch('https://landfire.cr.usgs.gov/arcgis/rest/services/Landfire/US_140/MapServer/identify', {
        method: 'POST',
        body: fd
    });

    if (js.ok) {
        const resp = await js.json();
        var f = resp.results[0].attributes.EVT_GP_N.replaceAll('Douglas-fir', 'Douglas fir').replaceAll(' and ', '-').split('-'),
            veg = '';

        f.forEach(function (e, n) {
            veg += e + (n < f.length - 1 ? ', ' : '');
        });

        document.querySelector('#veg span').innerHTML = veg;
        console.log(trailID);
        localStorage.setItem('guide' + trailID, veg);
    }
}

async function getWaypoints() {
    const fd = new FormData();
    fd.append('id', document.getElementById('map').getAttribute('data-tid'));

    await fetch(apiUrl + 'trails/waypoints?key=' + key, {
        method: 'POST',
        body: fd
    }).then(async function (dat) {
        const w = await dat.json();
        wyp = true;

        /* if waypoints doesn't return a null value */
        if (w.waypoints != null) {
            for (var i = 0; i < w.waypoints.length; i++) {
                var id = w.waypoints[i].id,
                    name = w.waypoints[i].name,
                    note = w.waypoints[i].note,
                    icon = w.waypoints[i].icon,
                    lat = w.waypoints[i].lat,
                    lon = w.waypoints[i].lon,
                    p;

                if (name && note != 'N/A') {
                    p = popup(name, '<p style="margin:0;padding:0;text-align:center;font-size:inherit">' + note + '</p>');
                } else if (name && note == 'N/A') {
                    p = popup('Waypoint', '<p style="margin:0;padding:0;text-align:center;font-size:inherit">' + name + '</p>');
                } else if (!name && note != 'N/A') {
                    p = popup('Waypoint', '<p style="margin:0;padding:0;text-align:center;font-size:inherit">' + note + '</p>');
                }

                /* add waypoints to map */
                var m = L.marker([lat, lon], {
                    id: id,
                    icon: wpIcon(icon),
                    trail: w.waypoints[i].trail_id,
                    title: (name ? name : '') + (note != 'N/A' ? ' / ' + note : '')
                })
                    .bindPopup(p, {
                        className: 'trail-popup d',
                        minWidth: 225,
                        maxWidth: 250
                    });

                m.addTo(map);
                allWaypoints.push(m);
            }
        }
    });
}

function drawChart() {
    /* if all the elevations are 0 */
    if (elevs.every(value => value === 0)) {
        document.querySelector('.chart').style.display = 'none';
    } else {
        var dist = [],
            elev = [],
            grade = [];

        cdata.forEach(function (c) {
            dist.push(c[0]);
            elev.push(c[1]);
            grade.push(c[2]);
        });

        var totalDist = dist[dist.length - 1],
            maxSteps = Math.ceil(totalDist / (totalDist < 3 ? 0.1 : (totalDist < 8 ? 0.5 : 2))) + 1,
            minScale = Math.floor((Math.min.apply(null, elev) - 1000) / 500) * 500,
            maxScale = Math.ceil((Math.max.apply(null, elev) + 1000) / 500) * 500;

        chart = document.querySelector('#chart');

        new Chart(chart, {
            type: 'line',
            data: {
                labels: dist,
                datasets: [{
                    xAxisID: 'xAxis',
                    yAxisID: 'yAxis',
                    fill: true,
                    label: '',
                    data: elev,
                    pointStyle: false,
                    borderWidth: 5,
                    borderColor: 'rgb(112 162 136)',
                    backgroundColor: 'rgb(112 162 136 / 15%)',
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    yAxis: {
                        beginAtZero: true,
                        min: (minScale < 0 ? 0 : minScale),
                        max: maxScale,
                        title: {
                            display: true,
                            text: 'Elevation (ft)',
                            padding: 10,
                            font: {
                                family: 'Noto Sans',
                                size: 13,
                                weight: 600
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Noto Sans',
                                size: 14
                            }
                        }
                    },
                    xAxis: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Distance (mi)',
                            padding: 10,
                            font: {
                                family: 'Noto Sans',
                                size: 13,
                                weight: 600
                            }
                        },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: maxSteps + 2,
                            callback: function (value, index, ticks) {
                                return parseFloat(this.getLabelForValue(value)).toFixed((totalDist > 1 ? 1 : 2));
                            },
                            font: {
                                family: 'Noto Sans',
                                size: 14
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#f1f1f1',
                        titleColor: '#000',
                        bodyColor: '#000',
                        titleFont: {
                            family: 'Noto Sans',
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            family: 'Noto Sans',
                            size: 14
                        },
                        displayColors: false,
                        callbacks: {
                            title: function () {
                                return 'Track Point';
                            },
                            label: function (context) {
                                var slope = grade[context.dataIndex],
                                    d = parseFloat(context.label);
                                return ['Distance: ' + d.toFixed((d > 1 ? 1 : 2)) + ' mi.', 'Elevation: ' + numberFormat(context.parsed.y) + ' ft.', 'Slope: ' + (slope ? slope : 'N/A')];
                            }
                        }
                    },
                    legend: {
                        labels: {
                            font: {
                                family: 'Noto Sans',
                                size: 16
                            }
                        },
                        display: false
                    }
                }
            }
        });
    }
}

window.onload = function () {
    /*document.querySelectorAll('.waypoint-icon').forEach(function (n) {
        n.innerHTML = wpIcon(n.getAttribute('data-icon')).options.html;
    });*/
    const st = localStorage.getItem('guide' + trailID);

    if (st != null) {
        document.querySelector('#veg span').innerHTML = st;
    }
};

document.onkeydown = function (e) {
    if (e.key == 'Escape') {
        document.getElementById('lightbox').style.display = 'none';
        document.querySelector('#lightbox .photo').style.backgroundImage = '';
        document.querySelector('#lightbox .caption').innerHTML = '';
    }
};

document.onreadystatechange = async () => {
    if (document.readyState == 'complete') {
    /*google.load("visualization", "1.0", {
        packages: ["corechart"]
    });*/

    var ops = {
        center: JSON.parse(document.querySelector('#map').getAttribute('data-center')),
        zoom: settings.zoom,
        preferCanvas: false,
        fullscreenControl: {
            pseudoFullscreen: false,
            preferCanvas: true
        }
    };

    if (user === false) {
        ops['zoomControl'] = false;
        ops['dragging'] = false;
        ops['touchZoom'] = false;
        ops['doubleClickZoom'] = false;
        ops['scrollWheelZoom'] = false;
    }

    map = L.map('map', ops);

    map.createPane('trail');
    map.getPane('trail').style.zIndex = 650;

    setMapType();
    getGIS();
    getWaypoints();

    document.querySelectorAll('.leaflet-control-zoom-in span, .leaflet-control-zoom-out span').forEach(function (n) {
        n.remove();
    });

    if (user !== false) {
        document.querySelector('.leaflet-control-zoom-in').innerHTML = '<i class="far fa-plus"></i>';
        document.querySelector('.leaflet-control-zoom-out').innerHTML = '<i class="far fa-minus"></i>';
    }

    document.querySelectorAll('.wpc, .waypoint-icon').forEach(function (e) {
        e.addEventListener('click', function (n) {
            var id = this.getAttribute('data-id');

            document.getElementById('map').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            allWaypoints.forEach(function (n) {
                if (n.options.id == id) {
                    n.openPopup();
                    map.setView([n.getLatLng().lat, n.getLatLng().lng], 14);
                }
            });
        });
    });

    /* add basemaps into selector */
    tileNames.forEach((t) => {
        var n = t,
            t = (n == 'caltopo' ? 'CalTopo' : (n == 'fs16' ? 'USFS 2016' : (n == 'osm' ? 'Open Street Map' : (n == 'outdoors' ? 'Outdoors' : ucwords(n)))));

        document.getElementById('basemap').insertAdjacentHTML('beforeend', '<option ' + (settings.tile == n ? 'selected ' : '') + 'value="' + n + '">' + t + '</option>');
    });

    /* change basemap on select change */
    document.getElementById('basemap').onchange = function () {
        settings.tile = this.options[this.selectedIndex].value;
        setMapType();
    };

    /* on photo click */
    document.querySelectorAll('.photos .item img').forEach(function (e) {
        e.addEventListener('click', function () {
            var src = 'url(' + this.getAttribute('src').replace('/thumbnail', '').replace('/large', '') + ')',
                ca = this.getAttribute('title');

            document.querySelector('#lightbox .photo').style.backgroundImage = src;
            document.querySelector('#lightbox .caption').innerHTML = ca;
            document.getElementById('lightbox').style.display = 'block';
        });
    });

    document.querySelector('#lightbox #close').onclick = function () {
        document.getElementById('lightbox').style.display = 'none';
        document.querySelector('#lightbox .photo').style.backgroundImage = '';
        document.querySelector('#lightbox .caption').innerHTML = '';
    };

    document.querySelector('#lightbox .photo').oncontextmenu = function (e) {
        e.preventDefault();
    };
};

L.Control.Fullscreen = L.Control.extend({
    options: {
        position: "topleft",
        title: {
            "false": "Go Fullscreen",
            "true": "Exit Fullscreen"
        }
    },
    onAdd: function (map) {
        var container = L.DomUtil.create("div", "leaflet-control-fullscreen leaflet-bar leaflet-control");
        this.link = L.DomUtil.create("a", "leaflet-control-fullscreen-button leaflet-bar-part", container);
        this.link.href = "#";
        this._map = map;
        this._map.on("fullscreenchange", this._toggleTitle, this);
        this._toggleTitle();
        L.DomEvent.on(this.link, "click", this._click, this);
        return container
    },
    _click: function (e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        this._map.toggleFullscreen(this.options)
    },
    _toggleTitle: function () {
        this.link.title = this.options.title[this._map.isFullscreen()]
    }
});

L.Map.include({
    isFullscreen: function () {
        return this._isFullscreen || false
    },
    toggleFullscreen: function (options) {
        var container = this.getContainer();
        if (this.isFullscreen()) {
            if (options && options.pseudoFullscreen) {
                this._disablePseudoFullscreen(container)
            } else if (document.exitFullscreen) {
                document.exitFullscreen()
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen()
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen()
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen()
            } else {
                this._disablePseudoFullscreen(container)
            }
        } else {
            if (options && options.pseudoFullscreen) {
                this._enablePseudoFullscreen(container)
            } else if (container.requestFullscreen) {
                container.requestFullscreen()
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen()
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen()
            } else {
                this._enablePseudoFullscreen(container)
            }
        }
    },
    _enablePseudoFullscreen: function (container) {
        L.DomUtil.addClass(container, "leaflet-pseudo-fullscreen");
        this._setFullscreen(true);
        this.invalidateSize();
        this.fire("fullscreenchange")
    },
    _disablePseudoFullscreen: function (container) {
        L.DomUtil.removeClass(container, "leaflet-pseudo-fullscreen");
        this._setFullscreen(false);
        this.invalidateSize();
        this.fire("fullscreenchange")
    },
    _setFullscreen: function (fullscreen) {
        this._isFullscreen = fullscreen;
        var container = this.getContainer();
        if (fullscreen) {
            L.DomUtil.addClass(container, "leaflet-fullscreen-on")
        } else {
            L.DomUtil.removeClass(container, "leaflet-fullscreen-on")
        }
    },
    _onFullscreenChange: function (e) {
        var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        if (fullscreenElement === this.getContainer() && !this._isFullscreen) {
            this._setFullscreen(true); this.fire("fullscreenchange")
        } else if (fullscreenElement !== this.getContainer() && this._isFullscreen) {
            this._setFullscreen(false);
            this.fire("fullscreenchange")
        }
    }
});
L.Map.mergeOptions({
    fullscreenControl: false
});
L.Map.addInitHook(function () {
    if (this.options.fullscreenControl) {
        this.fullscreenControl = new L.Control.Fullscreen(this.options.fullscreenControl);
        this.addControl(this.fullscreenControl)
    }
    var fullscreenchange;
    if ("onfullscreenchange" in document) {
        fullscreenchange = "fullscreenchange"
    } else if ("onmozfullscreenchange" in document) {
        fullscreenchange = "mozfullscreenchange"
    } else if ("onwebkitfullscreenchange" in document) {
        fullscreenchange = "webkitfullscreenchange"
    } else if ("onmsfullscreenchange" in document) {
        fullscreenchange = "MSFullscreenChange"
    } if (fullscreenchange) {
        var onFullscreenChange = L.bind(this._onFullscreenChange, this);
        this.whenReady(function () {
            L.DomEvent.on(document, fullscreenchange, onFullscreenChange)
        });
        this.on("unload", function () {
            L.DomEvent.off(document, fullscreenchange, onFullscreenChange)
        })
    }
});
L.control.fullscreen = function (options) {
    return new L.Control.Fullscreen(options)
};
}