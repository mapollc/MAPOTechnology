let host = 'https://www.mapofire.com/',
    apiURL = host + 'api/v1/',
    apiURL2 = 'https://api.mapotechnology.com/v1/',
    apiKey = '50e2c43f8f63ff0ed20127ee2487f15e',
    subscribe,
    /*apiKey = 'bG9jYWxob3N0',*/
    curTime = new Date(),
    modis_date = new Date((curTime.getTime() - 86400000)),
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    productName = 'Map of Fire',
    company = 'MAPO LLC',
    DONATE_POPUP_DAYS = 10,
    INC_CACHE_NAME = 'incident_cache',
    archive = settings.archive,
    state = settings.state,
    county = settings.county,
    version = ver[0],
    versionHTML = ver[1],
    attrib = '&copy;&nbsp;' + curTime.getFullYear() + '&nbsp;' + company,
    chartJSVersion = '4.1.1',
    user = {
        noauth: 1,
        role: 'GUEST'
    },
    userLocation = [],
    unique_wfids = [],
    map,
    countyBounds,
    nwsCWAs,
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
    modis,
    darkCanvas,
    lightning1,
    lightning24,
    nfdrs,
    cdfFHSZ,
    burnProb,
    sfp,
    spc,
    nrMrkr,
    otlkCat = [],
    ndfd,
    nri = L.featureGroup(),
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
    airQualityLoaded = false,
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
    tfrs = L.featureGroup(),
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
    tileNames = ['terrain', 'satellite', 'modis', 'outdoors', 'caltopo', 'fs16', 'usgs', 'carto', 'faa', 'open street map'],
    tilePerms = [false, false, true, true, true, true, false, false, true, false],
    layersMenu = '',
    gm,
    typeTimer,
    tracked = [],
    odesc,
    defaultTitle = 'Map of Fire: ' + (archive ? 'Historic ' + archive + ' ' : 'Current ') + (state ? (county ? county + ' County, ' : '') + state : 'US') + ' Wildfire, Smoke, and Lightning Map';

if (archive) {
    odesc = 'Explore historical data on wildfires from ' + archive + ' across ' + (state ? (county ? county + ' County, ' : '') + state : 'the United States') + ' with Map-o-Fire. Discover past wildfire occurrences, their locations, sizes, and impact. Gain insights into wildfire trends over time for research, analysis, or planning.';
} else {
    odesc = 'Get real-time updates on wildfires, smoke, and lightning strikes across ' + (state ? (county ? county + ' County, ' : '') + state : 'the United States') + ' with Map-o-Fire. Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity.';
}

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

/*outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/mapollc/clnnpsgob00st01pv20978ob9/tiles/256/{z}/{x}/{y}?access_token={token}', {
    id: 'Mapbox Outdoors v12',
    minZoom: 1,
    maxZoom: 20,
    tileSize: 256,
    token: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    attribution: 'Tiles &copy; <a href="https://mapbox.com">Mapbox</a>'
});*/

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

modis = L.tileLayer('https://gibs-{s}.earthdata.nasa.gov/wmts/epsg4326/best/{layer}/default/{time}/{tileMatrixSet}/{z}/{y}/{x}.jpg', {
    id: 'MODIS',
    layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    tileMatrixSet: '250m',
    time: modis_date.getFullYear() + '-' + ((modis_date.getMonth() + 1) < 10 ? 0 : '') + (modis_date.getMonth() + 1) + '-' + (modis_date.getDate() < 10 ? 0 : '') + modis_date.getDate(),
    tileSize: 512,
    subdomains: 'abc',
    noWrap: true,
    continuousWorld: true,
    minZoom: 2,
    maxZoom: 10,
    crs: L.CRS.EPSG4326,
    bounds: [
        [-89.9999, -179.9999],
        [89.9999, 179.9999]
    ],
    attribution: 'Tiles &copy; <a href="https://www.earthdata.nasa.gov/eosdis">NASA EOSDIS GIBS</a>'
});

/*modis = L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?TIME=2023-08-18&layer=MODIS_Aqua_CorrectedReflectance_TrueColor&tilematrixset=250m&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=3&TileCol=4&TileRow=1) */

darkCanvas = L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    id: 'Dark Gray Canvas',
    minZoom: 3,
    maxZoom: 18,
    attribution: attrib
});

class User {
    constructor(u = null) {
        this.u = u;
        this.ms = new Date().getTime();
        this.liveSub = 'price_1MvPv5IpCdpJm6cTU7NyYnyP';
        this.testSub = 'price_1MgxhSIpCdpJm6cTaKp2dqf5';

    }

    check() {
        if (this.u == null) {
            this.getProfile();
        } else {
            this.defaultProfile();
        }
    }

    getToken() {
        let token;

        document.cookie.split('; ').forEach(function (v) {
            if (v.search('token') >= 0) {
                token = v.split('=')[1];
            }
        });

        return token;
    }

    validSubscription() {
        let now = new Date().getTime() / 1000,
            valid = false;

        if (subscribe !== undefined && subscribe != null) {
            subscribe.forEach((e) => {
                if (e.plan == this.testSub) {
                    if (e.active_subscription && (now >= e.period_start && now <= e.period_end)) {
                        valid = true;
                    }
                }
            });
        }

        return valid;
    }

    /*subscriptionDetails() {
        let d;

        subscribe.forEach((e) => {
            if (e.plan == this.testSub) {
                d = e;
            }
        });

        return d;
    }*/

    async getProfile() {
        const fd = new FormData();
        //fd.append('active', 1);
        fd.append('token', this.getToken());

        await fetch(apiUrl('user/get/mapofire', 2), {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const api = await resp.json();

            if (api.response == 'error'/*api.noauth == 1*/) {
                console.info('User profile not loaded: in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
            } else {
                user = api.user;
                console.info('User profile loaded: ' + user.first_name + ' ' + user.last_name + ' in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');

                if (user.settings.allsettings) {
                    settings = user.settings.allsettings;
                }

                if (user.location) {
                    userLocation = user.location;
                }

                /* update map based on user settings; any layers that the user want's checked */
                /* go ahead of automatically check them so they display */
                if (settings.center != null) {
                    if (document.querySelector('#map').getAttribute('data-state')) {
                        let a = stateCenter(document.querySelector('#map').getAttribute('data-state'));
                        map.setView([a[0], a[1]], 7 - (L.Browser.mobile ? 1 : 0));
                    } else {
                        map.setView(settings.center, settings.zoom - (L.Browser.mobile ? 1 : 0));
                    }

                    setMapType();

                    document.querySelectorAll('.layersMenu input[type=checkbox]').forEach((t) => {
                        if (settings.checkboxes && settings.checkboxes.includes(t.getAttribute('id')) === true) {
                            t.checked = true;
                        } else {
                            t.checked = false;
                        }

                        t.dispatchEvent(new Event('change'));
                    });
                }
            }

            this.allowPerms();
        }).catch(() => {
            setMapType();
            this.allowPerms();
        });
    }

    defaultProfile() {
        user = this.u;
        settings = this.u.settings;
        this.allowPerms();

        /* update map based on user settings; any layers that the user want's checked */
        /* go ahead of automatically check them so they display */
        if (settings) {
            map.setView(settings.center, settings.zoom);
            setMapType();

            document.querySelectorAll('.layersMenu input[type=checkbox]').forEach((t) => {
                if (settings.checkboxes && settings.checkboxes.includes(t.getAttribute('id')) === true) {
                    t.checked = true;
                } else {
                    t.checked = false;
                }

                t.dispatchEvent(new Event('change'));
            });
        }
    }

    allowPerms() {
        let g = hasPermission(user, actions.VIEW_LAYERS),
            p = hasPermission(user, actions.PREMIUM_LAYERS),
            p2 = hasPermission(user, actions.PREMIUM_BASEMAPS);

        if (!user.noauth) {
            myAccount(user, accountForm);
            getTrackedFires();
        }

        if (!hasPermission(user, actions.PREMIUM_DATA) && document.querySelector('#local')) {
            document.querySelector('#local').remove();
        }

        if (p) {
            ndfdLegend();

            /* show california layer group if permissions are met */
            document.querySelectorAll('.layersMenu .group').forEach((t) => {
                if (t.getAttribute('title') == 'California') {
                    t.style.display = 'block';
                }
            });
        }

        /* adjust layers menu for permissions of the user layersmenu ul li */
        document.querySelectorAll('.layersMenu .layer').forEach((t) => {
            if (t.getAttribute('data-p') == 1 && p === true) {
                t.style.display = 'flex';
            }

            if (t.getAttribute('data-p') == 0 && (g === true || p === true)) {
                t.style.display = 'flex';
            }
        });

        /* adjust basemaps for permissions of the user */
        document.querySelectorAll('#tileChange ul.select-options li').forEach((t) => {
            if (t.getAttribute('style') == 'display:none' && p2) {
                t.style.display = 'block';
            }
        });
    }
}

async function getTrackedFires() {
    await fetch(apiUrl('trackFires/list'), {
        method: 'POST'
    }).then(async (resp) => {
        const g = await resp.json();

        if (g.fires != null) {
            g.fires.forEach(function (f) {
                tracked.push(f.wfid);
            });
        }

        /* if modal is already open with wildfire data, change the follow button now */
        if (document.querySelector('#modal').classList.contains('open', 'fire')) {
            const tf = document.querySelector('#trackFire');

            if (tf && tracked.includes(tf.getAttribute('data-id').toString())) {
                tf.setAttribute('data-following', '1');
                tf.setAttribute('title', 'You\'re following this fire');
                tf.classList.add('btn-blue', 'yes');
                tf.classList.remove('btn-green');
                tf.innerHTML = 'Following';
            }
        }
    });
}

function setMapType() {
    if (!settings.tile || settings.tile == '') {
        settings.tile = 'terrain';
    }

    let ind = tileNames.indexOf(settings.tile),
        tileIDs = [terrain, satellite, modis, outdoors, caltopo, fs16, usgs, carto, faa, osm];


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

    document.querySelectorAll('#tileChange ul.select-options li').forEach((t) => {
        if (t.getAttribute('rel') == settings.tile) {
            document.querySelector('#tileChange .select-styled').innerHTML = t.text;
        }
    });
}

/* social media shares */
function socialShare(se) {
    let p = window.location.pathname,
        s = p.split('/');

    if (se == 'tt') {
        window.open('https://tiktok.com/search?q=' + s[4].replaceAll('-', ' ').toLowerCase());
    } else {
        let ref = host.substring(0, host.length - 1) + p;

        if (se == 'fb') {
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + ref + '&src=sdkpreparse';
        } else {
            let hashtags = ucwords(s[3].toString().replaceAll('-', ' ')).replaceAll(' ', '') + ',' + ucwords(s[4].toString().replaceAll('-', ' ')).replaceAll(' ', '');
            url = 'https://twitter.com/intent/tweet?hashtags=' + hashtags + '&original_referer=' + ref + '&url=' + ref + '&ref_src=twsrc%5Etfw&tw_p=tweetbutton';
        }

        let h = 425,
            w = 700,
            t = (document.querySelector(window).height() - h) / 2,
            l = (document.querySelector(window).width() - w) / 2;

        window.open(url, 'social', 'location=no,menubar=no,status=no,resizable=no,top=' + t + ',left=' + l + ',width=' + w + ',height=' + h);
    }
}

/* function to show or hide layers on the map */
function params(t, a, v) {
    if (document.querySelector('#' + a)) {
        let c = document.querySelector('#' + a).checked;

        /* add map items in array based on layer ID and the layer variable */
        if (t == 1) {
            for (let i = 0; i < v.length; i++) {
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
                    document.querySelector('#map').style.cursor = 'crosshair';
                }

                if (a == 'ndfd') {
                    let ur,
                        fm = document.querySelector('#forecastModel'),
                        t = fm.options[fm.selectedIndex].value;

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

                    document.querySelector('#ndfdLegends').style.display = 'block';
                    document.querySelector('#legend' + t).style.display = 'block';
                }

                if (a == 'viSmoke' || a == 'sfcSmoke') {
                    if (!document.querySelector('#layerLabel')) {
                        document.body.insertAdjacentHTML('afterbegin', '<div id="layerLabel"><b style="font-weight:400">Smoke Fcst Time:</b> ' + dateTime(new Date(hrrrSmokeTime.fcst + 'Z').getTime() / 1000, 1) + '</div>');
                    }
                }

                map.addLayer(v);
            } else {
                if (v != undefined) {
                    map.removeLayer(v);
                }

                if (a == 'fuels' || a == 'drought') {
                    document.querySelector('#map').style.cursor = 'auto';
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
                    if (document.querySelector('#ndfdLegends')) {
                        document.querySelector('#ndfdLegends').style.display = 'none';
                    }
                    document.querySelectorAll('#ndfdLegends > div').forEach((t) => {
                        t.style.display = 'none';
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
}

async function faaTFRs() {
    await fetch(apiUrl('tfrs', 2), {
        method: 'POST'
    }).then(async (resp) => {
        const data = await resp.json();

        let a = L.geoJson(data, {
            style: function (feature) {
                return {
                    weight: 5,
                    fillColor: 'rgb(100 100 100)',
                    color: '#c62828',
                    opacity: 0.85,
                    fillOpacity: 0.25
                }
            },
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', () => {
                    this.setStyle({
                        fillOpacity: 0.4
                    });
                }).on('mouseout', () => {
                    this.setStyle({
                        fillOpacity: 0.25
                    });
                }).bindPopup();
            }
        });

        tfrs.addLayer(a);
        map.addLayer(tfrs);
    });
}

function showPosition(position) {
    let lat = position.coords.latitude,
        lon = position.coords.longitude,
        radius = position.coords.accuracy;

    geoLocation = [lat, lon, mToFt(radius)];
    calcNearbyFir();

    if (map.hasLayer(uloc)) {
        uloc.getLayers().forEach((e) => {
            uloc.removeLayer(e);
        });

        map.removeLayer(uloc);
    }

    let a = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<div class="user-location show-heading"><div class="user-location-dot"></div><div class="user-location-heading"></div></div>',
            className: 'geo'
        })
    });

    let b = L.circle([lat, lon], {
        radius: radius,
        color: '#1da1f2',
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.2
    });

    uloc.addLayer(a)
        .addLayer(b)
        .bindTooltip('You are within ' + mToFt(radius) + ' of here')
        .on('click', () => {
            uloc.removeFrom(map);
        });

    map.addLayer(uloc).setView([lat, lon], 11);
}

function geoLocationErrors(error) {
    let m = '';

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

async function saveSession(h) {
    let t,
        c = map.getCenter(),
        a = c.lat,
        b = c.lng,
        z = map.getZoom(),
        f = document.querySelector('#saveFreq'),
        pc = document.querySelector('#perimColor'),
        pz = document.querySelector('#perimZoom'),
        pt = document.querySelector('#perimTtip'),
        cd = document.querySelector('#coordsDisplay'),
        p = document.querySelector('#perimeterSize input[type=range]'),
        tu = document.querySelector('#tempUnit'),
        wu = document.querySelector('#windSpeedUnit'),
        au = document.querySelector('#acresUnit'),
        ls = document.querySelector('#locallySave'),
        fd = document.querySelector('#fireDisplay'),
        ch = [],
        data = new FormData();

    document.querySelector('#sync i').classList.remove('fa-arrow-down-to-line');
    document.querySelector('#sync i').classList.add('fa-arrow-up-to-line');
    document.querySelector('#sync span').innerHTML = 'Syncing your settings...';

    document.querySelectorAll('input[name=bsmo]').forEach((m) => {
        if (m.checked) {
            t = m.id;
        }
    });

    document.querySelectorAll('.layersMenu input[type=checkbox]').forEach((t) => {
        let chk = t.checked;
        if (chk) {
            ch.push(t.getAttribute('id'));
        }
    });

    let set = {
        method: (h === true ? 'true' : 'false'),
        center: [a, b],
        zoom: z,
        tile: t,
        saveFreq: f.options[f.selectedIndex].value,
        locallySave: ls.options[ls.selectedIndex].value,
        checkboxes: ch,
        coordsDisplay: cd.options[cd.selectedIndex].value,
        perimeters: {
            minSize: p.value,
            color: pc.options[pc.selectedIndex].value,
            zoom: pz.options[pz.selectedIndex].value,
            ttip: pt.options[pt.selectedIndex].value
        },
        weather: {
            temp: tu.options[tu.selectedIndex].value,
            wind: wu.options[wu.selectedIndex].value
        },
        acres: au.options[au.selectedIndex].value,
        fireDisplay: fd.options[fd.selectedIndex].value
    };

    if (hasPermission(user, actions.PREMIUM_LAYERS)) {
        set.special = {
            otlkDay: document.querySelector('#otlkDay').options[document.querySelector('#otlkDay').selectedIndex].value,
            otlkType: document.querySelector('#otlkType').options[document.querySelector('#otlkType').selectedIndex].value,
            sfpDate: document.querySelector('#sfpDateSelect').options[document.querySelector('#sfpDateSelect').selectedIndex].value,
            forecastModel: document.querySelector('#forecastModel').options[document.querySelector('#forecastModel').selectedIndex].value,
            fcstTime: document.querySelector('#fcstTime').options[document.querySelector('#fcstTime').selectedIndex].value
        };
    }

    settings = set;

    const keys = Object.keys(set);

    keys.forEach((e) => {
        const val = set[e],
            isArray = Array.isArray(val),
            isJson = (set[e].constructor == ({}).constructor ? true : false);

        if (!isArray && !isJson) {
            data.append(e, val);
        } else {
            if (isArray) {
                val.forEach((a) => {
                    data.append(e + '[]', a);
                });
            }

            if (isJson) {
                const keys = Object.keys(val);
                keys.forEach((b) => {
                    data.append(e + '[' + b + ']', set[e][b]);
                });
            }
        }
    });

    if (navigator.onLine) {
        document.querySelector('#save span').innerHTML = 'Syncing...';
        /*notify('info', 'Syncing...');*/

        await fetch(apiUrl('session'), {
            method: 'POST',
            body: data
        }).then(async (resp) => {
            const data = await resp.json();

            if (data.success == 1) {
                const s = document.querySelector('#sync i');
                document.querySelector('#save span').innerHTML = 'Sync';

                s.classList.remove('fa-arrow-up-to-line');
                s.classList.add('fa-arrow-down-to-line');
                document.querySelector('#sync span').innerHTML = 'Account last synced just now';

                if (h === false) {
                    notify('success', 'Your settings were successfully synced.');
                }
                console.info('Settings saved');
            }
        }).catch((error) => {
            console.error(error);
            notify('error', ucfirst(error));
        });
    } else {
        notify('error', 'Unable to save your map settings due to network connection.')
    }
}

class Weather {
    constructor(a, b) {
        this.lat = a;
        this.lon = b;
    }

    async incidentForecast() {
        let temp = [],
            rh = [],
            wind = [];

        try {
            await fetch('https://api.weather.gov/points/' + parseFloat(this.lat).toFixed(4) + '000000,' + parseFloat(this.lon).toFixed(4) + '0000')
                .then(async (resp) => {
                    const a = await resp.json();

                    try {
                        await fetch(a.properties.forecastGridData)
                            .then(async (resp) => {
                                const data = await resp.json(),
                                    prop = data.properties;

                                for (let i = 0; i < prop.temperature.values.length; i++) {
                                    let t = new Date(prop.temperature.values[i].validTime.split('/')[0]).getTime();

                                    if (t >= new Date().getTime() && (t - new Date().getTime()) < 86400000) {
                                        temp.push(prop.temperature.values[i].value);
                                        rh.push(prop.relativeHumidity.values[i].value);

                                        if (prop.transportWindSpeed.values[i]) {
                                            wind.push(prop.transportWindSpeed.values[i].value);
                                        }
                                    }
                                }

                                let a = Math.round((Math.max.apply(null, temp) * 1.8) + 32),
                                    b = Math.min.apply(null, rh),
                                    c = Math.round((wind.reduce((partialSum, a) => partialSum + a, 0) / wind.length) / 1.609),
                                    d = Math.round(Math.max.apply(null, wind) / 1.609),
                                    mt = document.querySelector('#wv1'),
                                    mh = document.querySelector('#wv2'),
                                    aw = document.querySelector('#wv3'),
                                    mw = document.querySelector('#wv4');

                                /*rating(a, b, c, d);*/

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

                                mt.innerHTML = a;
                                mt.classList.remove('placeholder');
                                mt.style.width = 'unset';
                                mt.style.height = 'unset';

                                mh.innerHTML = b + '%';
                                mh.classList.remove('placeholder');
                                mh.style.width = 'unset';
                                mh.style.height = 'unset';

                                aw.innerHTML = (c.toString() == 'NaN mph' ? '--' : c);
                                aw.classList.remove('placeholder');
                                aw.style.width = 'unset';
                                aw.style.height = 'unset';

                                mw.innerHTML = (d.toString() == '-Infinity mph' ? '--' : d);
                                mw.classList.remove('placeholder');
                                mw.style.width = 'unset';
                                mw.style.height = 'unset';

                                document.querySelector('#incidentForecast').insertAdjacentHTML('afterend', '<p class="updated">Last forecasted ' + timeAgo(new Date(prop.updateTime).getTime() / 1000) + '</p>');
                            }).catch((error) => {
                                console.log(error);
                                document.querySelector('#incidentForecast').parentElement.innerHTML = '<p class="message error">There was an error getting the fire weather forecast.</p>';
                            });
                    } catch (error) {
                        console.log(error);
                        document.querySelector('#incidentForecast').parentElement.innerHTML = '<p class="message error">There was an error getting the fire weather forecast.</p>';
                    }
                }).catch((error) => {
                    console.log(error);
                });
        } catch (error) {
            console.log('There is an error getting FWF', error);
        }
    }

    async incidentWX() {
        const fd = new FormData();
        fd.append('radius', this.lat + ',' + this.lon + ',30');
        fd.append('latest', 1);

        try {
            await fetch(apiUrl('weather/nearby', 2), {
                method: 'POST',
                body: fd
            }).then(async (resp) => {
                const wx = await resp.json();

                if (wx.weather) {
                    let o = wx.weather.obs,
                        name = wx.weather.name,
                        t = (o.temp.current ? Math.round(o.temp.current) : '--'),
                        rh = (o.rh ? Math.round(o.rh) : '--'),
                        wd = (o.wind_dir ? o.wind_dir : '--'),
                        ws = (o.wind_speed ? Math.round(o.wind_speed) : '--'),
                        /*d = distance(a, b, wx.weather.lat, wx.weather.lon),*/
                        u = timeAgo(wx.weather.updated),
                        /*prox,
                        pc,*/
                        t1 = document.querySelector('#t1'),
                        rh1 = document.querySelector('#rh1'),
                        w1 = document.querySelector('#w1');

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

                    t1.innerHTML = t;
                    t1.classList.remove('placeholder');
                    t1.style.width = 'unset';
                    t1.style.height = 'unset';

                    rh1.innerHTML = (!o.rh || rh == '--' ? '--' : rh + '%');
                    rh1.classList.remove('placeholder');
                    rh1.style.width = 'unset';
                    rh1.style.height = 'unset';

                    w1.innerHTML = (wd == 'V' && ws == '-- mph' ? '--' : wd + '/' + ws);
                    w1.classList.remove('placeholder');
                    w1.style.width = 'unset';
                    w1.style.height = 'unset';

                    document.querySelector('#weatherObs').insertAdjacentHTML('afterend', '<p class="updated">Last report ' + u + (hasPermission(user, actions.PREMIUM_WEATHER) ? ' @ ' + name : '') + '</p>');
                } else {
                    document.querySelector('#weatherObs').parentElement.innerHTML = '<p class="message error">No current weather conditions are available at this time.</p>';
                }
            }).catch((error) => {
                console.log(error);
                document.querySelector('#weatherObs').parentElement.innerHTML = '<p class="message error">There was an error getting current weather conditions.</p>';
            });
        } catch (error) {
            console.log('There was an error getting current wx obs', error);
        }
    }

    async nearbyAQ() {
        let distances = [],
            stns = [],
            aqh = document.querySelector('#modal #aq'),
            olat = this.lat,
            olon = this.lon,
            geo = '{"x":' + olon + ',"y":' + olat + ',"spatialReference":{"wkid": 4326}}',
            fd = new FormData();

        fd.append('where', '1=1');
        fd.append('geometry', geo);
        fd.append('geometryType', 'esriGeometryPoint');
        fd.append('inSR', 4326);
        fd.append('spatialRel', 'esriSpatialRelIndexIntersects');
        fd.append('distance', 50.0);
        fd.append('units', 'esriSRUnit_StatuteMile');
        fd.append('outFields', 'PM25_AQI');
        fd.append('returnGeometry', true);
        fd.append('geometryPrecision', 6);
        fd.append('outSR', 4326);
        fd.append('f', 'geojson');

        fetch('https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air_Now_Current_Monitors_PM/FeatureServer/0/query', {
            method: 'POST',
            body: fd
        })
            .then(async (resp) => {
                const json = await resp.json();

                if (json.features.length == 0) {
                    aqh.parentElement.classList.remove('max25');
                    aqh.parentElement.classList.add('max33');
                    aqh.remove();
                } else {
                    json.features.forEach((f) => {
                        const dist = distance(olat, olon, f.geometry.coordinates[1], f.geometry.coordinates[0]);

                        distances.push(dist);
                        stns.push(f.properties);
                    });

                    const minDist = Math.min.apply(null, distances);

                    const stn = stns[distances.indexOf(minDist)],
                        aq = stn.PM25_AQI,
                        color = airQColor(aq),
                        details = airQDesc(aq);

                    aqh.querySelector('.desc').innerHTML = '<span class="air_quality" onclick="notify(\'info\', \'' + details.desc + '\');return false" title="' + details.desc +
                        '" style="color:#' + (aq <= 100 ? '000' : 'fff') + ';background-color:' + color + '">' + details.quality + '</span>';
                }
            });

        /*let distances = [],
            stns = [],
            aqh = document.querySelector('#modal #aq');

        if (airq.getLayers() > 0) {
            airq.getLayers()[0].getLayers().forEach((ea) => {
                const c = ea.getLatLng(),
                    dist = distance(this.lat, this.lon, c.lat, c.lng);

                distances.push(dist);
                stns.push(ea.feature.properties);
            });

            const minDist = Math.min.apply(null, distances);

            if (minDist < 50) {
                const stn = stns[distances.indexOf(minDist)],
                    aq = stn.PM25_AQI,
                    color = airQColor(aq),
                    details = airQDesc(aq);

                aqh.querySelector('.desc').innerHTML = '<span class="air_quality" onclick="notify(\'info\', \'' + details.desc + '\');return false" title="' + details.desc + '" style="color:#' + (aq <= 100 ? '000' : 'fff') + ';background-color:' + color + '">' + details.quality + '</span>';
            } else {
                aqh.parentElement.classList.remove('max25');
                aqh.parentElement.classList.add('max33');
                aqh.remove();
            }
        }*/
    }

    async drought() {
        const fd = new FormData();
        fd.append('where', '1=1');
        fd.append('geometry', '{x: ' + this.lon + ', y: ' + this.lat + '}');
        fd.append('geometryType', 'esriGeometryPoint');
        fd.append('inSR', '4326');
        fd.append('outFields', 'dm');
        fd.append('returnGeometry', 'false');
        fd.append('f', 'json');

        await fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/US_Drought_Intensity_v1/FeatureServer/3/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const d = await resp.json(),
                dr = document.querySelector('#dr');

            if (d.features.length > 0) {
                let c = d.features[0].attributes.dm,
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

                dr.querySelector('.desc').innerHTML = '<span class="drought" style="background-color:' + color + (c == 0 ? ';color:#333' : '') + '">' + out + '</span>';
            } else {
                dr.parentElement.classList.remove('max25');
                dr.parentElement.classList.add('max33');
                dr.remove();
            }
        });
    }
}

function getStatus(s, n) {
    return (s == null ? (n.search('contain') >= 0 ? 'contained' : (n.search('control') >= 0 ? 'controlled' : 'active')) : (s.Out ? 'out' : (s.Control ? 'controlled' : (s.Contain ? 'contained' : ''))));
}

async function getAirQ() {
    const fd = new FormData();
    fd.append('where', '1=1');
    fd.append('outFields', 'ObjectId,AQSID,SiteName,LocalTimeString,PM25_AQI,PM25');
    fd.append('returnGeometry', 'true');
    fd.append('geometry', getbbox());
    fd.append('geometryPrecision', '6');
    fd.append('returnExceededLimitFeatures', 'true');
    fd.append('f', 'geojson');

    await fetch('https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air_Now_Current_Monitors_PM/FeatureServer/0/query', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        if (!data.error) {
            let aqD = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    let aq = feature.properties.PM25_AQI,
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
                    let n = feature.properties.SiteName,
                        aq = feature.properties.PM25_AQI,
                        pm = feature.properties.PM25,
                        c = airQColor(aq),
                        details = airQDesc(aq);

                    layer.bindPopup(popup(n, '<table style="width:100%"><tr style="font-weight:bold;text-align:center"><td style="width:50%">Nowcast AQI</td><td>PM2.5</td></tr>' +
                        '<tr style="text-align:center"><td style="font-weight:100;font-size:28px;padding:10px 0">' + aq + '</td><td><span style="font-weight:100;font-size:28px;padding:10px 0">' + pm + '</span> &micro;g/m<sup>3</sup></td></tr>' +
                        '<tr><td colspan="2" style="text-align:center"><div class="aqi" style="color:#' + (aq <= 100 ? '000' : 'fff') + ';background-color:' + c + '" title="' + details.desc + '" onclick="notify(\'info\', \'' + details.desc + '\');return false">' + details.quality + '</div></td></tr></table>' +
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
    }).then(() => {
        airQualityLoaded = true;
        updateProgressBar('Air quality loaded...');
        params(2, 'airq', airq);
    });
}

async function fuelType(a, b) {
    const fd = new FormData();
    fd.append('geometry', b + ',' + a);
    fd.append('geometryType', 'esriGeometryPoint');
    fd.append('layers', '0,1');
    fd.append('tolerance', '1');
    fd.append('mapExtent', '-181,14,-12,60');
    fd.append('imageDisplay', '600,550,9');
    fd.append('returnGeometry', 'false');
    fd.append('f', 'json');

    await fetch('https://landfire.cr.usgs.gov/arcgis/rest/services/Landfire/US_140/MapServer/identify', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        let fuel = data.results[0].attributes.EVT_GP_N.replaceAll('Douglas-fir', 'Douglas fir').replaceAll(' and ', '-').split('-'),
            fo = '';

        fuel.forEach((f) => {
            fo += '<li style="line-height:1.2">' + f + '</li>';
        });

        L.popup([a, b], {
            className: 'fire-popup',
            minWidth: 200,
            maxWidth: 250,
            content: popup('Fuel Types', '<ul style="padding-inline-start:20px!important">' + fo + '</ul>')
        }).openOn(map);
    });
}

async function getDrought(a, b) {
    const fd = new FormData();
    fd.append('geometry', b + ',' + a);
    fd.append('geometryType', 'esriGeometryPoint');
    fd.append('layers', '0');
    fd.append('tolerance', '1');
    fd.append('mapExtent', '-181,14,-12,60');
    fd.append('imageDisplay', '600,550,9');
    fd.append('returnGeometry', 'false');
    fd.append('f', 'json');

    await fetch('https://gis.fema.gov/arcgis/rest/services/Partner/Drought_Current/MapServer/identify', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        let v = (data.results.length == 2 ? data.results[1].value : data.results[0].value),
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
        }).openOn(map);
    });
}

function radar() {
    radarCount = 0;

    try {
        radarInit.radar.past.forEach((r, n) => {
            let url = 'https://tilecache.rainviewer.com' + r.path + '/256/{z}/{x}/{y}/4/0_1.png';

            let l = L.tileLayer(url, {
                id: 'Radar',
                time: r.time,
                sequence: n,
                opacity: 0
            }).addTo(map);

            radarImgs.push(l);
        });

        radarLoop = setInterval(() => {
            if (isRadarPaused === false) {
                let d = new Date(radarImgs[radarCount].options.time * 1000),
                    t = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M';

                radarImgs[radarCount].setOpacity(0.8);
                document.querySelector('#radarControl input[type=range]').value = radarCount;
                document.querySelector('#radarControl .time').innerHTML = t;

                for (let i = 0; i < radarImgs.length; i++) {
                    if (i != radarCount) {
                        radarImgs[i].setOpacity(0);
                    }
                }
                radarCount++;

                if (radarCount == radarImgs.length) {
                    isRadarPaused = true;
                    setTimeout(() => {
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

async function getRadarAPI() {
    if (document.querySelector('#radar').checked) {
        document.querySelector('#radarControl').style.display = 'flex';

        if (!radarInit || ((new Date().getTime() / 1000) - radarInit.radar.past[12].time / 60) > 10) {
            await fetch('https://api.rainviewer.com/public/weather-maps.json')
                .then(async (resp) => {
                    const data = await resp.json();

                    radarInit = data;
                }).then(() => {
                    radar();
                });
        } else {
            radar();
        }
    } else {
        radarImgs.forEach((r) => {
            r.setOpacity(0);
        });

        clearInterval(radarLoop);
        radarCount = 0;

        document.querySelector('#radarControl').style.display = 'none';
        document.querySelector('#radarControl input[type=range]').value = 0;
        document.querySelector('#radarControl .time').innerHTML = '--';
    }
}

async function getWeather() {
    if (document.querySelector('input[id=stns]').checked) {
        let b = JSON.parse(getbbox()),
            bx = b.xmax + ',' + b.ymin + ',' + b.xmin + ',' + b.ymax,
            vars = 'token=350409c14c544ec9957effb1c15bcb99' +
                '&bbox=' + bx +
                '&vars=air_temp,relative_humidity,wind_speed,wind_direction' +
                '&units=temp|f,speed|mph' +
                '&obtimezone=local' +
                '&status=active' +
                '&network=2,1' +
                '&networkimportance=2,1';

        console.info('Getting wx observations...');

        await fetch('https://api.synopticlabs.org/v2/stations/latest?' + vars).then(async (resp) => {
            const wx = await resp.json();

            if (wx.STATION) {
                wx.STATION.forEach((w) => {
                    let n = ucwords(w.NAME.toLowerCase()),
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

                        let wi = L.marker([w.LATITUDE, w.LONGITUDE], {
                            icon: L.divIcon({
                                className: 'wx-icon',
                                html: '<div>' + temp + '</div>',
                                popupAnchor: [12, 0]
                            }),
                            title: 'Current Conditions as ' + n
                        }).bindPopup(popup(n, '<div id="obs"><div class="row" style="text-align:center"><div class="col">Temp</div><div class="col">RH</div><div class="col">Wind</div></div><div class="row">' +
                            '<div class="col" style="font-weight:bold;font-size:18px">' + temp + '</div><div class="col" style="font-weight:bold;font-size:18px">' + rh +
                            '%</div><div class="col" style="font-weight:bold;font-size:18px;line-height:1.2">' + wdir + ' @ ' + wspd + '</div>' +
                            '</div></div><p style="margin:10px 0 0 0;font-size:12px;text-align:center">Last report ' + dt + '</p>'), {
                            className: 'fire-popup',
                            minWidth: 300
                        });

                        stns.addLayer(wi);
                        stnids.push(id);
                    }
                });
            }
        }).then(() => {
            if (document.querySelector('#stns').checked === true) {
                console.info('Observations retrieved!');
                updateProgressBar('Current weather loaded...');
            }

            params(2, 'stns', stns);
        });
    } else {
        params(2, 'stns', stns);
    }
}

/* get text from SPC for severe/fire outlooks by day */
async function readSPCText(type, day) {
    console.log(type, day);
    const fd = new FormData();
    document.querySelector('#modal .content').innerHTML = spcTemplate;
    openModal();

    fd.append('day', day);

    await fetch(apiUrl('outlooks/' + type + '/text', 2), {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        let r = '',
            data = await resp.json();

        /*if (type == 'severe') {
            let cats = ['General', 'Marginal', 'Slight', 'Enhanced', 'Moderate', 'High'];

            cats.forEach((g, n) => {
                console.log(n, otlkCat);
                r += '<div class="spc-risk ' + g.toLowerCase() + (n == otlkCat.length - 1 ? ' active' : '') + '">' + n + ' - ' + g.toUpperCase() + ' Risk</div>';
            });
        }*/

        let c = '<h1>Day ' + day + ' ' + ucfirst(type) + ' Weather Outlook</h1><p style="margin:15px 0 0 0;font-size:20px;color:gray">NWS Storm Prediction Center</p>' +
            '<p style="margin:3px 0 15px 0;color:#afafaf">Issued: ' + timeAgo(data.outlook.issue) + ' / ' + data.outlook.pretty + '</p>' +
            /*(type == 'severe' && otlkCat ? '<div class="risk-levels">' + r + '</div>' : '') +*/ '<div class="spc">' + data.outlook.text + '</div>';

        setHeaders('Day ' + day + ' ' + ucfirst(type) + ' Weather Outlook from NWS Storm Prediction Center', 'weather/outlook/' + type + '/' + day, 'Review the most recent day ' + day + ' ' + type + ' weather outlook from the NWS Storm Prediction Center in Norman, OK.');

        document.querySelector('#modal .content .container').innerHTML = c;
    });
}

/* get SPC fire or severe weather outlooks by day */
async function getOutlook() {
    if (document.querySelector('input[id=spc]').checked) {
        let dy = document.querySelector('#otlkDay').options[document.querySelector('#otlkDay').selectedIndex].value,
            ty = document.querySelector('#otlkType').options[document.querySelector('#otlkType').selectedIndex].value,
            fd = new FormData();

        fd.append('day', (dy ? dy : 1));

        await fetch(apiUrl('outlooks/' + ty, 2), {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();

            spc = L.geoJson(data, {
                style: (feature) => {
                    return {
                        weight: 2,
                        fillColor: feature.properties.fill,
                        color: feature.properties.stroke,
                        fillOpacity: 0.4
                    }
                },
                onEachFeature: (feature, layer) => {
                    otlkCat.push(feature.properties.name.replace(' Risk', '').replace(' Thunderstorms', ''));
                }
            }).on('click', function () {
                readSPCText(ty, dy);
            });
        }).then(() => {
            params(2, 'spc', spc);
        });
    } else {
        params(2, 'spc', spc);
    }
}

/* read wwa text from api */
async function readWWA(id) {
    const fd = new FormData();
    fd.append('id', id);

    document.querySelector('#modal .content').innerHTML = wwaTemplate;
    document.querySelector('#modal').classList.add('wwa');
    openModal();

    await fetch(apiUrl('getWWA', 2), {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json(),
            a = data.wwa;

        setHeaders(a.title + ' issued by the National Weather Service in ' + a.office, 'weather/alert/' + id, 'The National Weather Service in ' + a.office + ' has issued a ' + a.title + ' for ' + a.area + ' until ' + a.expires + '.');

        if (a.title == 'Tornado Warning' || a.title == 'Severe Thunderstorm Warning') {
            document.querySelector('#modal h1.title').style.color = a.color;
        }

        document.querySelector('#modal h1.title').innerHTML = a.title;
        document.querySelector('#modal h1.title').style.borderColor = a.color;
        document.querySelector('#modal #a').innerHTML = a.area;
        document.querySelector('#modal #b').innerHTML = '<b>Issued:</b> ' + a.issued;
        document.querySelector('#modal #c').innerHTML = '<b>' + (a.onset ? 'Starts' : 'Expires') + ':</b> ' + (a.onset ? a.onset : a.expires);
        document.querySelector('#modal #d').innerHTML = '<b>Issued by:</b> <a target="blank" href="https://weather.gov/' + a.wfo.toLowerCase() + '" title="Issued by the National Weather Service in ' +
            a.office + '">NWS ' + a.office + '</a>';
        document.querySelector('#modal .head').insertAdjacentHTML('afterend', '<div class="message error">' + a.headline + '</div>');
        document.querySelector('.wwa-details').innerHTML = a.text;
        document.querySelector('.wwa-details').insertAdjacentHTML('afterend', '<p class="help">' + a.help.replace(/<p>(.*)<\/p>/gm, '$1') + '</p>');

        /*let a = data.wwa,
            r = '<h1 class="wwa" style="' + (a.title == 'Tornado Warning' || a.title == 'Severe Thunderstorm Warning' ? 'color:' + a.color + ';' : '') + 'border-color:' + a.color + '">' + a.title + '</h1><div class="row" style="margin:15px 0;font-size:18px;color:#4c4c4c;flex-wrap:nowrap"><div class="col" style="flex:1 1;min-width:40px;max-width:40px">' +
                '<i class="fa-solid fa-location-dot" style="font-size:25px"></i></div><div class="col" style="line-height:1.2">' + a.area + '</div></div><div class="wwa-box"><div class="row" style="font-size:15px"><div class="col"><b>Issued</b><span>' +
                a.issued + '</span></div><div class="col"><b>' + (a.onset ? 'Starts' : 'Expires') + '</b><span>' + (a.onset ? a.onset : a.expires) + '</span></div><div class="col"><b>Issued by</b><a target="blank" href="https://weather.gov/' + a.wfo.toLowerCase() + '" title="Issued by the National Weather Service in ' +
                a.office + '"><span>NWS ' + a.office + '</span></a></div></div></div><div class="highlight">' + a.headline + '</div>' + (a.text.search('<p>') < 0 ? '<p>' + a.text + '</p>' : a.text) + (a.help && a.help != '<p></p>' ? '<hr><div style="text-transform:uppercase;letter-spacing:1px;color:#6a92cf">' +
                    (a.help.search('<p>') < 0 ? '<p>' + a.help + '</p>' : a.help) + '</div>' : '');


        document.querySelector('#modal .content .container').innerHTML = r;*/
    });
}

async function getWWAs() {
    const fd = new FormData();
    fd.append('where', '1=1');
    fd.append('outFields', 'OBJECTID,Event,Affected,End_');
    fd.append('returnGeometry', true);
    fd.append('geometryPrecision', 6);
    fd.append('geometry', getbbox());
    fd.append('f', 'geojson');

    await fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6/query', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const w = await resp.json();

        let ww = L.geoJSON(w, {
            style: function (feature) {
                return {
                    weight: 2,
                    color: wwaColors[feature.properties.Event],
                    fillOpacity: 0.4
                }
            },
            onEachFeature: function (feature, layer) {
                wwaIDs.push(feature.properties.OBJECTID);

                /*layer.bindPopup(loadingPopup, {
                    className: 'fire-popup',
                    minWidth: 250,
                    maxWidth: 275
                }).on('popupclose', (t) => {
                    t.popup.setContent(loadingPopup);
                }).on('click', (t) => {
                    map.fitBounds(layer.getBounds());
                    retrieveWWA(t);
                })*/

                layer.on('click', (e) => {
                    map.fitBounds(layer.getBounds());
                    retrieveWWA(e);
                });
            },
            filter: function (feature) {
                return (wwaIDs.includes(feature.properties.OBJECTID) === false ? true : false);
            }
        });

        wwas.addLayer(ww);
    }).then(() => {
        updateProgressBar('Weather alerts retrieved...');
        params(2, 'wwas', wwas);

        alertCount();
    });
}

async function retrieveWWA(e) {
    const fd = new FormData();
    fd.append('lat', e.latlng.lat);
    fd.append('lon', e.latlng.lng);

    document.querySelector('#impact').setAttribute('data-wwas', 1);

    if (!document.querySelector('#impact .wwas')) {
        document.querySelector('#impact .wrapper').insertAdjacentHTML('beforeend', '<div class="wwas"><div class="spinner s2" style="margin:1em auto"></div><ul></ul></div>');
        openImpact('wwas', 'Weather Alerts');
    } else {
        document.querySelector('#impact .wwas ul').insertAdjacentHTML('beforebegin', '<div class="spinner s2" style="margin:1em auto"></div>');
        document.querySelector('#impact .wwas ul').innerHTML = '';
    }

    await fetch(apiUrl('nws', 2), {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        if (data.alerts == null) {
            document.querySelector('#impact .wwas ul').insertAdjacentHTML('afterend', '<p>There are no weather alerts currently in affect here.</p>');
            document.querySelector('#impact .wwas ul').remove();
        } else {
            document.querySelector('#impact .wwas .spinner').remove();

            data.alerts.forEach((a) => {
                const txt = '<li><a href="#" id="alert" title="' + a.headline + '" style="text-overflow:ellipsis;overflow:hidden;white-space:nowrap" data-id="' + a.id + '">' +
                    a.event + '</a> for ' + a.area + ' <span style="font-weight:400">until ' + a.expires + '</span></li>';
                document.querySelector('#impact .wwas ul').insertAdjacentHTML('beforeend', txt);
            });
        }
    });
}

function riskChart() {
    let pie = document.querySelector('#modal #d'),
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

async function viewRisk(i) {
    document.querySelector('#modal .content').innerHTML = riskTemplate;
    openModal();

    await fetch(apiUrl('risk/' + i, 2), {
        method: 'POST'
    }).then(async (resp) => {
        const data = await resp.json();

        let place = data.area.name,
            state = data.area.state,
            type = data.area.level,
            expose,
            ecl;

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
            expose = 'Populated areas in ' + place + ' are not predominately exposed to wildfire (either directly or indirectly).';
            ecl = 'not';
        } else {
            expose = 'Populated areas in ' + place + ' are predominately exposed to <b>' + (stat['exp']['ie'] > stat['exp']['de'] ? 'in' : '') + 'direct</b> sources of wildfire (' + (stat['exp']['ie'] > stat['exp']['de'] ? 'embers or home-to-home ignition' : 'adjacent flammable vegetation') + ').';
            ecl = (stat['exp']['ie'] > stat['exp']['de'] ? 'in' : '') + 'direct';
        }

        const modalA = document.querySelector('#modal #a'),
            modalB = document.querySelector('#b'),
            modalC = document.querySelector('#c'),
            modalD = document.querySelector('#d');

        modalA.innerHTML = 'Wildfire Risk Report';
        modalA.classList.remove('placeholder');
        modalA.classList.add('wwa');
        modalA.style.marginBottom = '';
        modalA.style.maxWidth = '';
        modalA.style.height = '';
        modalA.style.borderColor = 'var(--red)';

        modalB.innerHTML = place + ', ' + state;

        modalC.innerHTML = '';
        modalC.insertAdjacentHTML('afterend', '<li><div class="rate ' + stat['wl']['rank'].toLowerCase().replace(' ', '-') + '"></div><p>' + place + ' has a <b style="border-bottom:1px dotted ' + riskColor(stat['wl']['rank']) + ';color:' + riskColor(stat['wl']['rank']) + '">' +
            stat['wl']['rank'].toUpperCase() + '</b> risk for wildfires, with a <b>' + stat['wl']['state'] + '%</b> greater risk, on average, than other ' +
            (type == 'county' ? 'counties' : 'communities') + ' in ' + state + '. Compared to other ' + (type == 'county' ? 'counties' : 'communities') + ' in the US, ' + place + ' has a ' + stat['wl']['us'] + '% greater risk.</p></li>');

        modalC.insertAdjacentHTML('afterend', '<li><div class="rate ' + stat['rth']['rank'].toLowerCase().replace(' ', '-') + '"></div><p>There is a <b style="border-bottom:1px dotted ' + riskColor(stat['rth']['rank']) + ';color:' + riskColor(stat['rth']['rank']) + '">' +
            stat['rth']['rank'].toUpperCase() + '</b> risk to homes in ' + place + '&mdash;<b>' + stat['rth']['state'] + '%</b> greater risk, on average, than other ' +
            (type == 'county' ? 'counties' : 'communities') + ' in ' + state + '. Compared to other ' + (type == 'county' ? 'counties' : 'communities') + ' in the US, ' + place + ' has a ' + stat['rth']['us'] + '% greater risk.</p></li>');

        modalC.insertAdjacentHTML('afterend', '<li><div class="rate ' + ecl + '"></div><p>' + expose + '</p></li>');

        modalD.setAttribute('data-de', stat['exp']['de'] * 100);
        modalD.setAttribute('data-ie', stat['exp']['ie'] * 100);
        modalD.setAttribute('data-ne', stat['exp']['none'] * 100);

        if (typeof (Chart) === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/chart.js@' + chartJSVersion + '/dist/chart.umd.min.js')
                .then(() => {
                    riskChart();
                });
        } else {
            riskChart();
        }
    });
}

/* prepare the county wildfire risk report */
async function viewRisk2(i) {
    document.querySelector('#modal .content').innerHTML = riskTemplate;
    openModal();

    await fetch(apiUrl('rth', 2), {
        method: 'POST',
        body: new FormData().append('fips', i)
    }).then(async (resp) => {
        const data = await resp.json();

        let r = data.risk.data,
            l1w = 100 / risk.whp.length;

        setHeaders('Wildfire Risk for ' + data.risk.county + ' County, ' + data.risk.state, 'risk/' + i, '');

        const modalA = document.querySelector('#modal #a'),
            modalB = document.querySelector('#modal #b'),
            modalC = document.querySelector('#modal #c'),
            modalD = document.querySelector('#modal #d');

        modalA.innerHTML = 'Wildfire Risk Report';
        modalA.classList.remove('placeholder');
        modalA.classList.add('wwa');
        modalA.style.marginBottom = '';
        modalA.style.maxwidth = '';
        modalA.style.height = '';
        modalA.style.borderColor = 'var(--red)';

        modalB.innerHTML = data.risk.county + ' County, ' + data.risk.state;
        modalC.innerHTML = r.whp.legend.label;

        modalD.classList.remove('placeholder');
        modalD.style.height = '';
        modalD.innerHTML = 'Populated areas in ' + data.risk.county + ' County have, on average, greater risk than <b>' + Math.round(r.whp.state * 100) + '%</b> of counties in ' + data.risk.state +
            ' and <b>' + Math.round(r.whp.nation * 100) + '%</b> of counties in the US.';

        risk.whp.forEach((e) => {
            document.querySelector('#modal #whp .c').insertAdjacentHTML('afterend', '<div class="i' + (r.whp.legend.label == e[0] ? ' active' : '') + '" style="width:' + l1w + '%;background-color:' + e[1] + '"></div>');
            document.querySelector('#modal #whp .t').insertAdjacentHTML('afterend', '<div ' + (r.whp.legend.label == e[0] ? 'class="active" ' : '') + 'style="width:' + l1w + '%">' + (r.whp.legend.label == e[0] ? e[0] : '&nbsp;') + '</div>');
        });
    });
}

async function femaNRI() {
    if (document.querySelector('input[id=nri]').checked) {
        console.info('Getting FEMA NRI data...');
        if (!document.querySelector('.screen-loading')) {
            document.body.insertAdjacentHTML('beforeend', '<div class="screen-loading"><div class="spinner s2"></div></div>');
        }

        const fd = new FormData();
        fd.append('where', '1=1');
        fd.append('geometry', getbbox());
        fd.append('outFields', 'OBJECTID,NRI_ID,COUNTY,STATE,STATEABBRV,WFIR_EALT,WFIR_RISKR,EAL_SPCTL,POPULATION,BUILDVALUE,AGRIVALUE,AREA');
        fd.append('geometryPrecision', 6);
        fd.append('f', 'geojson');

        await fetch('https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Counties/FeatureServer/0/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();
            let c;

            let m = L.geoJSON(data, {
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
                    let t = '<div class="row"><div class="col" style="flex:1 1;min-width:50%">Wildfire Risk</div><div class="col" style="flex:1;line-height:1.2">' + feature.properties.WFIR_RISKR + '</div></div>' +
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

            nri.addLayer(m);
        }).then(() => {
            console.info('FEMA NRI data retrieved...');
            params(2, 'nri', nri);
            document.querySelector('.screen-loading').remove();
        });
    } else {
        params(2, 'nri', nri);
    }
}

/*function windSpeed() {
    if ($('.layersMenu #velocity').checked) {
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

class Wildfires {
    processFires(data) {
        return L.geoJson(data, {
            pointToLayer: (feature, latlng) => {
                let fire = feature.properties,
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
            filter: (feature) => {
                return (!archive || (archive && !unique_wfids.includes(parseFloat(feature.properties.wfid))) ? true : false)
            },
            onEachFeature: (feature, layer) => {
                unique_wfids.push(parseFloat(feature.properties.wfid));

                layer.on('click', function () {
                    /* open wildfire modal and store click data */
                    if (this.options.state.substr(0, 2) == 'CA' && this.options.state.length > 2) {
                        let ac = String(this.options.acres),
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
                        new Wildfires().fireDetails(this.options.wfid);
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
    }

    async getHistoricFires() {
        try {
            const fd = new FormData(),
                ms = new Date().getTime();
            fd.append('archive', archive);
            fd.append('bbox', getbbox());

            await fetch(apiUrl('wildfires/all', 2), {
                method: 'POST',
                body: fd
            }).then(async (resp) => {
                const data = await resp.json();

                if (data.features) {
                    let m = this.processFires(data);
                    allFires.addLayer(m);

                    params(2, 'allFires', allFires);
                }
            }).then(() => {
                document.querySelector('.screen-loading').remove();

                console.info(archive + ' fire data loaded in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
                updateProgressBar('Wildfires loaded...');
            });
        } catch (error) {
            console.error(error);
        }
    }

    getFires() {
        let firOps = ['all', 'new', 'smk', 'rx'],
            ms = new Date().getTime();

        firOps.forEach(async (w, ct) => {
            try {
                await fetch(apiUrl('wildfires/' + w, 2), {
                    method: 'POST'
                }).then(async (resp) => {
                    const data = await resp.json();

                    if (data.features) {
                        let m = this.processFires(data);

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
                }).then(() => {
                    const sl = document.querySelector('.screen-loading');

                    if (firOps.length - 1 == ct) {

                        loadPerimeters();
                        getWWAs();
                        getAirQ();

                        tracked.forEach(function (i) {
                            let f = findFire(i);

                            if (f != undefined) {
                                document.querySelector('#tracked').append(f.options.title + ' ' + stateLabels[f.options.state] + ' ' + f.options.acres);
                            }
                        });

                        calcNearbyFir();

                        if (sl) {
                            sl.remove();
                        }
                    }

                    console.info(w.toUpperCase() + ' fire data loaded in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
                    updateProgressBar('Wildfires loaded...');
                });
            } catch (error) {
                console.error('There was an error getting ' + w + ' fires', error);
            }
        });
    }

    fireDetails(i, o = false) {
        const useModal = (!settings.fireDisplay || settings.fireDisplay == 'page' ? false : true);

        if (!useModal) {
            window.open(host + findFire(i).feature.properties.url);
        } else {
            if (isAndroid == 1) {
                Fire.incident(i);
            } else {
                document.querySelector('#modal .content').innerHTML = fireDisplay;
                document.querySelector('#modal').classList.add('fire');
                openModal();

                /* use cached information if its been <15 minutes since this incident was viewed before */
                if (settings.locallySave && settings.locallySave != 'n') {
                    if (localStorage.getItem(INC_CACHE_NAME) == null) {
                        this.freshFire(i, o);
                    } else {
                        let found = false,
                            ic = JSON.parse(localStorage.getItem(INC_CACHE_NAME));

                        ic.forEach((f) => {
                            if (f.wfid == i) {
                                if (new Date().getTime() - f.cacheTime > 900000) {
                                    this.freshFire(i, o);
                                } else {
                                    this.cachedFire(f.data, o);
                                }
                                found = true;
                            }
                        });

                        if (!found) {
                            this.freshFire(i, o);
                        }
                    }
                } else {
                    this.freshFire(i, o);
                }


                /*if (localStorage.getItem('incident-' + i) && ((new Date().getTime() / 1000) - localStorage.getItem('incidentTime-' + i)) < 900) {
                    this.cachedFire(JSON.parse(localStorage.getItem('incident-' + i)));
                } else {
                    this.freshFire(i, o);
                }*/
            }
        }
    }

    async freshFire(i, o) {
        let data,
            fd = new FormData();

        fd.append('wfid', i);
        fd.append('history', 1);

        await fetch(apiUrl('wildfires/incident', 2), {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            data = await resp.json();

            /* save incident data to cache for 15 minutes */
            if (settings.locallySave && settings.locallySave != 'n' && !data.fire.error) {
                const p = {
                    wfid: i,
                    cacheTime: new Date().getTime(),
                    data: data
                };

                if (localStorage.getItem(INC_CACHE_NAME) == null) {
                    localStorage.setItem(INC_CACHE_NAME, JSON.stringify([p]));
                } else {
                    let wfids = [],
                        fts = [],
                        ic = JSON.parse(localStorage.getItem(INC_CACHE_NAME));

                    ic.forEach((f) => {
                        wfids.push(f.wfid);
                        fts.push(f);
                    });

                    if (wfids.includes(i)) {
                        fts[wfids.indexOf(i)] = p;
                    } else {
                        fts.push(p);
                    }

                    localStorage.setItem(INC_CACHE_NAME, JSON.stringify(fts));
                }
                /*localStorage.setItem('incidentTime-' + i, new Date().getTime() / 1000);
                localStorage.setItem('incident-' + i, JSON.stringify(data));*/
            }

            let f = data.fire,
                p = f.properties,
                g = f.geometry,
                l = g.near.split(' of '),
                year = f.time.year,
                title = p.fireName + ' Fire near ' + l[1] + ' - Current Incident Information and Wildfire Map',
                desc = 'The ' + fireName(p.fireName, p.type, p.incidentId) + ', located ' + g.near + ', is currently considered ' + getStatus(p.status, p.notes) + ' after starting ' + timeAgo(f.time.discovered) + ', and is ' + numberFormat(p.acres) + ' acres as of ' + timeAgo(f.time.updated) + '.',
                lat = g.lat,
                lon = g.lon;

            setHeaders(title, p.url, desc);

            if (o === true) {
                map.setView([lat, lon], 12);
            }

            if (!hasPermission(user, actions.CHARTS) && year == curTime.getFullYear()) {
                /*loadScript(host + 'src/js/chart-' + version + '.js')*/
                loadScript(host + 'src/js/chart-' + version + '.js')
                    .then(async () => {
                        doNBM(lat, lon);
                    });
            } else {
                document.querySelector('#nbm').remove();
            }

            this.wildfire(data.fire);
        }).then(() => {
            if (data.fire.time.year == curTime.getFullYear()) {
                const wx = new Weather(data.fire.geometry.lat, data.fire.geometry.lon);

                /* get nearby weather observation for the fire */
                wx.incidentWX();

                /* get incident weather forecast */
                wx.incidentForecast();
            }
        });
    }

    cachedFire(data, o) {
        let f = data.fire,
            p = f.properties,
            g = f.geometry,
            l = g.near.split(' of '),
            year = data.fire.time.year,
            nm = fireName(p.fireName, p.type, p.incidentId),
            title = nm + ' near ' + l[1] + ' - Current Incident Information and Wildfire Map',
            desc = 'The ' + nm + ', located ' + g.near + ', is currently considered ' + getStatus(p.status, p.notes) + ' after starting ' + timeAgo(f.time.date) + ', and is ' + numberFormat(p.acres) + ' acres as of ' + timeAgo(f.time.updated) + '.',
            lat = g.lat,
            lon = g.lon;

        setHeaders(title, p.url, desc);

        if (o === true) {
            map.setView([lat, lon], 12);
        }

        if (!hasPermission(user, actions.CHARTS) && year == curTime.getFullYear()) {
            loadScript(host + 'src/js/chart-' + version + '.js')
                .then(async () => {
                    doNBM(lat, lon);
                });
        } else {
            document.querySelector('#nbm').remove();
        }

        this.wildfire(data.fire);

        if (year == curTime.getFullYear()) {
            const wx = new Weather(lat, lon);
            wx.incidentWX();
            wx.incidentForecast();
        }
    }

    wildfire(fire) {
        let fr = fire.properties,
            t = fr.type,
            state = fr.fireState,
            id = fr.incidentId,
            wfid = fr.wfid,
            acres = (fr.acres == 'Unknown' ? 'Unknown' : numberFormat(fr.acres)),
            fstat = fr.status,
            st1 = (fire.time.year < curTime.getFullYear() ? 'out' : getStatus(fstat, fr.notes)),
            st = (st1 ? st1 : 'active'),
            dispatch = fire.protection.dispatch,
            center = getDispatchCenter(dispatch),
            near = fire.geometry.near,
            city = near.split(' of '),
            agency = fire.protection,
            rthUrl = [apiUrl('risk', 2), encodeURIComponent(city[1])],
            n = fr.fireName + (t == 'Wildfire' ? ' Fire' : '') + ((curTime.getTime() / 1000) - fire.time.discovered <= 43200 ? '<span class="new">NEW</span>' : ''),
            abbr = '',
            isTracked = tracked.includes(wfid.toString());

        this.acresChange(fr.acres_history);

        if (agency.agency != 'US Forest Service') {
            abbr = agencies[agency.agency];
        }

        /* if user has ADMIN role */
        if (!hasPermission(user, actions.ADMIN)) {
            const edit = '<a target="blank" href="https://www.mapotechnology.com/account/admin/wildfires/' + (dispatch == 'MAPO' ? 'modify' : 'edit') + '?wfid=' + wfid + '" style="display:inline-block;margin-right:5px"><i class="far fa-pen-to-square"></i></a>';
            document.querySelector('h1.title').insertAdjacentHTML('beforebegin', edit);
        }

        /* remove placeholders from entire modal */
        document.querySelectorAll('.incident .placeholder').forEach((e) => {
            if (!e.parentElement.parentElement.classList.contains('weather') && e.parentElement.parentElement.id != 'aq') {
                e.classList.remove('placeholder');
                e.style.width = 'unset';
                e.style.height = 'unset';
            }
        });

        const juris = '<b>' + t.toUpperCase() + '</b> reported in ' + stateLabels[state] + (dispatch == '' || (dispatch == 'MAPO' && agency.agency == '') ? ', by National Interagency Fire Center' : (agency.area ? ', <span style="line-height:1.5;border-bottom:1px dotted #333;cursor:help" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' +
            (abbr ? abbr + ' ' : '') + agency.area + '</span>' : (agency.unit == 'NWCG' ? ', by NWCG/Inciweb' : ''))),
            jdesc = (!agency.agency && !agency.unit ? 'Unknown' : (agency.agency ? agency.agency + ' &mdash; ' : '') + (agency.area ? agency.area : '')),
            logo = (agency.logo || dispatch == 'CAL FIRE' ? '<img class="agency" src="https://d3kcsn1y1fg3m9.cloudfront.net/fire/images/agency_' + (agency.logo ? agency.logo : (dispatch == 'CAL FIRE' ? 'calfire' : '')) + '_logo.png" alt="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' : '');

        if (fstat != null && (fstat.Contain || fstat.Control || fstat.Out) && !hasPermission(user, actions.PREMIUM_DATA)) {
            document.querySelector('#fist .fs').innerHTML = (fstat.Contain ? '<div class="fstat-container"><b>Contained</b><span>' + dateTime(fstat.Contain) + '</span></div>' : '') +
                (fstat.Control ? '<div class="fstat-container"><b>Controlled</b><span>' + dateTime(fstat.Control) + '</span></div>' : '') +
                (fstat.Out ? '<div class="fstat-container"><b>Out</b><span>' + dateTime(fstat.Out) + '</span></div>' : '');
        } else {
            document.querySelector('#fist').remove();
        }

        /* don't get current or forecasted weather if this is an old incident */
        if (fire.time.year < curTime.getFullYear()) {
            document.querySelector('#aw').remove();
            document.querySelector('#modal .incident').insertAdjacentHTML('afterbegin', '<div class="message error">This incident is no longer active and is considered historical.</div>');
        }

        /* if containment is 100% */
        if (fr.containment == '100%') {
            document.querySelector('#e').style.color = 'var(--green)';
            document.querySelector('#e').style.fontWeight = 600;
        }

        document.querySelector('h1.title').innerHTML = n;
        document.querySelector('span.coords').innerHTML = coords(fire.geometry.lat, fire.geometry.lon);
        document.querySelector('#a').innerHTML = juris;
        document.querySelector('#b').innerHTML = logo;
        document.querySelector('#c').innerHTML = '<span class="status ' + st + '">' + st.toUpperCase() + '</span>';
        document.querySelector('#d').innerHTML = (acres != 'Unknown' ? sizing(2, acres.replaceAll(',', '')) : acres) + (acres != 'Unknown' ? '<span class="si">' + (acres == 1 ? sizing(1).slice(0, -1) : sizing(1)).toLowerCase() : '') + '</span>';
        document.querySelector('#e').innerHTML = fr.containment;
        document.querySelector('#f').innerHTML = '<b>Last updated:</b> ' + timeAgo(fire.time.updated);
        //document.querySelector('#f').setAttribute('title', localTime(fire.time.updated));
        document.querySelector('#g').innerHTML = '<b>Reported:</b> ' + timeAgo(fire.time.discovered);
        //document.querySelector('#g').setAttribute('title', localTime(fire.time.discovered));
        document.querySelector('#h').innerHTML = '<b>Incident #:</b> ' + id;
        document.querySelector('#il').innerHTML = near;
        document.querySelector('#jur').innerHTML = jdesc;
        document.querySelector('#dn').innerHTML = (fr.notes ? fr.notes : 'None provided');
        document.querySelector('#fu').innerHTML = (fr.fuels ? fr.fuels : 'None specified');
        document.querySelector('#ia').innerHTML = (fr.resources ? fr.resources : 'None reported');

        if (fr.acres_history != null && fr.acres_history.length > 1) {
            let aht = '<table class="ah-table"><thead><tr><th>Updated</th><th>Size</th><th>Change</th></tr></thead><tbody>';

            fr.acres_history.forEach((e) => {
                aht += '<tr><td>' + timeAgo(e.updated) + '</td><td>' + sizing(2, e.acres) + ' ' + sizing(1).toLowerCase() + '</td><td>' + (e.change > 0 ? '+' : '') + sizing(2, e.change) + ' ' + sizing(1).toLowerCase() + '</td></tr>';
            });

            document.querySelector('#ah').innerHTML = aht + '</tbody></table>';
        } else {
            document.querySelector('#ah').remove();
        }

        /* if wildfire incident has Inciweb data */
        if (fire.inciweb) {
            let inci = '';

            if (fire.inciweb.incident_info) {
                inci += '<div class="fire-details title"><h2>Incident Information</h2><div class="body text">' + fire.inciweb.incident_info + '</div></div>';
            }

            if (fire.inciweb.photo) {
                //document.querySelector('#modal #e').insertAdjacentHTML('afterend', '<div class="photo"><a target="blank" href="https://www.mapofire.com/src/images/incident?path=' + fire.inciweb.photo.url + '"><img src="https://www.mapofire.com/src/images/incident?path=' + fire.inciweb.photo.url + '" title="' + fire.inciweb.photo.caption + '"></a></div>');
            }

            if (fire.inciweb.current) {
                inci += incidentDetails(fire.inciweb.current.data);
            }

            if (fire.inciweb.contacts) {
                inci += '<div class="fire-details title"><h2>Fire Incident Contact</h2><div class="body"><div class="row no-margin align-top"><div class="col">' +
                    '<h4>Fire Unit Information</h4><p style="margin-bottom:0">' + fire.inciweb.contacts.contact + '</p></div>' +
                    (fire.inciweb.contacts.pio ? '<div class="col"><h4>PIO Contact</h4><p style="margin-bottom:0">' + fire.inciweb.contacts.pio + '</p></div>' : '') +
                    '</div></div></div>';
            }

            document.querySelector('.inciweb').innerHTML = inci;
        }

        /* update the track fire button */
        const tf = document.querySelector('#trackFire');
        tf.setAttribute('data-id', wfid);
        tf.setAttribute('title', (isTracked ? 'You\'re following' : 'Track') + ' this fire');

        if (isTracked) {
            tf.setAttribute('data-following', 1);
            tf.classList.add('btn-blue', 'yes');
            tf.classList.remove('btn-green');
            tf.innerHTML = 'Following';
        }

        /* if there is a dispatch center associated with this incident */
        if (center) {
            document.querySelector('#dc .body').innerHTML = '<p><b>' + center.name + ' (' + center.agency + ')</b><br>' +
                center.location + /*(center.phone && center.phone != '0' ? '<br>' + center.phone : '') +*/
                (center.website ? '<br><a href="' + center.website + '">' + center.website + '</a>' : '') + '</p>' +
                '<p class="updated" style="text-align:left">' + center.agency + ' data last sent ' + timeAgo(center.cad_update) + '</p>';
        }

        /* get drought conditions at the fire */
        const aqint = setInterval(() => {
            if (airQualityLoaded) {
                new Weather(fire.geometry.lat, fire.geometry.lon).nearbyAQ();
                clearInterval(aqint);
            }
        }, 500);
    }

    acresChange(acres) {
        let res = null;

        if (acres != null) {
            let count = acres.length,
                latest = acres[0].acres,
                start = acres[count - 1].acres,
                timediff = (acres[0].updated - acres[count - 1].updated) / 3600,
                total = 0;

            for (let i = 0; i < count; i++) {
                total += acres[i].acres;
            }

            res = {
                'latest': latest,
                'discovery': start,
                'growth': latest - start,
                'average': total / count,
                'hours': timediff,
                'delta': (latest - start) / timediff
            };
        }

        return res;
    }
}

/* find any fires within a certain distance of the user */
function calcNearbyFir() {
    const milesAway = 37.5;

    if (geoLocation) {
        [allFires, newFires, smokeChecks, rxBurns].forEach(function (w) {
            if (w.getLayers()[0]) {
                w.getLayers()[0].getLayers().forEach(function (f) {
                    let c = f.feature.geometry.coordinates;

                    if (distance(c[1], c[0], geoLocation[0], geoLocation[1]) <= milesAway) {
                        localIncidents.push(f.feature.properties);
                    }
                });
            }
        });

        let ti = localIncidents.length;
        const local = document.querySelector('#local');

        if (hasPermission(user, actions.PREMIUM_DATA) && ti > 0 && local) {
            local.classList.add('active');
            local.setAttribute('data-count', ti);
            local.setAttribute('title', 'There\'s ' + ti + ' incident' + (ti != 1 ? 's' : '') + ' near you');
        }
        /*showLocalIncidents();*/
    }
}

function modisHotspots(w) {
    let ms = new Date(),
        d1 = new Date(ms.getTime() - 86400000),
        d2 = new Date(ms.getTime() - 172800000),
        d3 = new Date(ms.getTime() - 259200000),
        fd1 = (d1.getMonth() + 1) + '/' + d1.getDate() + '/' + d1.getFullYear() + ' ' + d1.getHours() + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes(),
        fd2 = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear() + ' ' + d2.getHours() + ':' + (d2.getMinutes() < 10 ? '0' : '') + d2.getMinutes(),
        fd3 = (d3.getMonth() + 1) + '/' + d3.getDate() + '/' + d3.getFullYear() + ' ' + d3.getHours() + ':' + (d3.getMinutes() < 10 ? '0' : '') + d3.getMinutes();

    console.info('Getting VIIRS (' + w + ') hotspots...');

    const fd = new FormData();
    fd.append('where', 'acq_time >= DATE \'' + (w == 1 ? fd1 : (w == 2 ? fd2 : fd3)) + ':00\'' + (w != 1 ? ' AND acq_time <= DATE \'' + (w == 2 ? fd1 : fd2) + ':00\'' : ''));
    fd.append('outFields', '*');
    fd.append('geometry', getbbox());
    fd.append('geometryPrecision', 6);
    fd.append('returnGeometry', true);
    fd.append('f', 'geojson');

    fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query', {
        method: 'POST',
        body: fd
    }).then(async (resp) => {
        const data = await resp.json();

        if (!data.error) {
            let m = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    let t = (new Date().getTime() - feature.properties.acq_time) / 1000,
                        c = (t < 43200 ? '12' : (t >= 43200 && t < 86400 ? '24' : (t >= 86400 && t < 129600 ? '36' : (t >= 129600 && t < 172800 ? '48' : '72'))));

                    return L.marker(latlng, {
                        title: 'Heat detected in the last ' + c + ' hours (' + (feature.properties.daynight == 'N' ? 'at night' : 'during daytime') + ')',
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
        }
    }).then(() => {
        updateProgressBar('VIIRS ' + w + ' hotspots loaded...');

        if (w == 1) {
            params(2, 'modis24', modis24);
        } else if (w == 2) {
            params(2, 'modis48', modis48);
        } else {
            params(2, 'modis72', modis72);
        }

        console.info('VIIRS (' + w + ') hotspots loaded in ' + ((new Date().getTime() - ms.getTime()) / 1000) + ' secs');
    });
}

async function calfireAdminUnits() {
    if (document.querySelector('input[id=calfireUnits]').checked) {
        const fd = new FormData();
        fd.append('where', '1=1');
        fd.append('outFields', 'UNIT,UNITCODE,REGION');
        fd.append('geometryPrecision', 6);
        fd.append('returnGeometry', true);
        fd.append('f', 'geojson');

        await fetch('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/cdfadmin19_1/FeatureServer/0/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();

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
        }).then(() => {
            params(2, 'calfireUnits', calfireUnits);
        });
    } else {
        params(2, 'calfireUnits', calfireUnits);
    }
}

async function getGACCBounds() {
    if (document.querySelector('input[id=gaccBounds]').checked) {
        const fd = new FormData();
        fd.append('where', '1=1');
        fd.append('outFields', 'OBJECTID,GACCUnitID,GACCName,GACCLocation');
        fd.append('geometryPrecision', 6);
        fd.append('returnGeometry', true);
        fd.append('f', 'geojson');

        await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_GACC_Current/FeatureServer/1/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();

            let a = L.geoJSON(data, {
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
        }).then(() => {
            params(2, 'gaccBounds', gaccBounds);
        });
    } else {
        params(2, 'gaccBounds', gaccBounds);
    }
}

async function getPSAs() {
    if (document.querySelector('input[id=erc]').checked) {
        const fd = new FormData();
        fd.append('where', '1=1');
        fd.append('outFields', 'OBJECTID,PSANationalCode');
        fd.append('geometryPrecision', 6);
        fd.append('returnGeometry', true);
        fd.append('f', 'geojson');

        await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_PSA_Current/FeatureServer/0/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();

            erc = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: '#177ca3',
                        weight: 3,
                        fillOpacity: 0.1
                    }
                },
                onEachFeature: function (feature, layer) {
                    let sc = feature.properties.PSANationalCode.substr(0, 2),
                        url;
                    if (sc == 'NW') {
                        url = 'https://gacc.nifc.gov/nwcc/content/products/fwx/matrices/' + feature.properties.PSANationalCode + '_ERC.jpg';
                    } else if (sc == 'SA') {
                        url = 'https://gacc.nifc.gov/sacc/predictive/weather/99_dsi_stuff/gnfdrs7/chart_png/' + feature.properties.PSANationalCode + '_ERC.png';
                    } else {
                        let v = (sc == 'NC' || sc == 'SW' ? 'g' : (sc == 'EA' ? '' : 'y'));
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
        }).then(() => {
            params(2, 'erc', erc);
        });
    } else {
        params(2, 'erc', erc);
    }
}

async function nwsFireWX() {
    if (document.querySelector('input[id=nwsfire]').checked) {
        const fd = new FormData();
        fd.append('where', '1=1');
        fd.append('outFields', '*');
        fd.append('geometryPrecision', 6);
        fd.append('returnGeometry', true);
        fd.append('f', 'geojson');

        await fetch('https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/9/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();

            let n = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: '#ffc107',
                        weight: 2,
                        fillOpacity: 0
                    }
                },
                onEachFeature: function (feature, layer) {
                    let zoneName = feature.properties.name,
                        zid = feature.properties.state_zone;

                    layer.on('click', function () {
                        /*for (let x = 0; x < nwsFire.getLayers().length; x++) {
                            for (let z = 0; z < nwsFire.getLayers()[x].getLayers().length; z++) {
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
        }).then(() => {
            params(2, 'nwsfire', nwsFire);
        });
    } else {
        params(2, 'nwsfire', nwsFire);
    }
}

async function fireFcst(off, zid, zn) {
    let zoneName = zn;
    document.querySelector('#modal .content').innerHTML = '<div class="container">' + nwsFireFcst + '</div>';
    openModal();

    await fetch('https://api.weather.gov/products/types/FWF/locations/' + off.toUpperCase())
        .then(async (resp) => {
            const g = await resp.json();

            let p = JSON.parse(JSON.stringify(g).replaceAll('@', ''));

            if (p.graph.length == 0) {
                closeModal();
                notify('error', 'Fire weather forecast is not available here at this time.');
            } else {
                let pid = p.graph[0].id;

                await fetch(apiUrl('fwf/' + pid, 1), {
                    method: 'POST',
                    body: new FormData().append('zone', zid)
                }).then(async (resp) => {
                    const f = await resp.json(),
                        zoneN = (zoneName ? zoneName : f.fwf.name);

                    setHeaders('Fire Weather Forecast for ' + zoneName + ' (' + zid + ')', 'weather/fire/' + off.toUpperCase() + '/' + zid, 'Read the latest fire weather forecast for ' + zoneN + ' issued by the National Weather Service in ' + f.fwf.wfo + '.');
                    document.querySelector('#modal .content .container').innerHTML = '<h1>Fire Weather Forecast for ' + zoneN + '</h1><p style="font-size:14px;font-weight:400;color:gray">Forecast last updated:&nbsp;' + timeAgo(f.fwf.updated) + ' by NWS ' + f.fwf.wfo + '</p>' + f.fwf.text;
                });
            }
        });
}

async function dispatchBounds() {
    if (document.querySelector('input[id=dispatch]').checked) {
        const fd = new FormData();
        fd.append('outFields', 'OBJECTID,DispName,DispUnitID,DispLocation,ContactPhone');
        fd.append('geometry', getbbox());
        fd.append('geometryPrecision', 6);
        fd.append('returnGeometry', true);
        fd.append('f', 'geojson');

        await fetch('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_Dispatch_Current/FeatureServer/0/query', {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json();

            let a = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: '#444',
                        weight: 2,
                        fillOpacity: 0.1
                    }
                },
                onEachFeature: function (feature, layer) {
                    let t = '<center><h3>' + feature.properties.DispName + '&nbsp;(' + feature.properties.DispUnitID.substr(2) + ')</h3><p style="margin:5px 0;line-height:1.2">' +
                        feature.properties.DispLocation + (feature.properties.ContactPhone ? '<br>' + feature.properties.ContactPhone : '') + '</p></center>';

                    layer.on('click', function () {
                        this.setStyle({
                            weight: 5,
                            color: '#00385c'
                        });
                    }).on('popupclose', function () {
                        this.setStyle({
                            weight: 3,
                            color: '#444'
                        });
                    }).bindPopup(popup('Dispatch Center', t), {
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
        }).then(() => {
            params(2, 'dispatch', dispatch);
        });
    } else {
        params(2, 'dispatch', dispatch);
    }
}

async function loadPerimeters() {
    let y = (settings.archive ? settings.archive : curTime.getFullYear()),
        min = settings.perimeters.minSize,
        ms = new Date().getTime(),
        pc = '',
        w,
        o;

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
        w = 'FEATURE_CA <> \'Wildfire\' AND FIRE_YEAR=' + settings.archive;
        o = 'OBJECTID,UNQE_FIRE_ID,INCIDENT,GIS_ACRES,DATE_CUR';
    } else {
        w = 'attr_FireDiscoveryDateTime>=TIMESTAMP \'' + y + '-01-01 00:00:00\' AND attr_FireDiscoveryDateTime<=TIMESTAMP \'' + y + '-12-31 23:59:59\' AND (poly_GISAcres > ' + min + ' OR poly_Acres_AutoCalc > ' + min + ') AND attr_FireOutDateTime IS NULL';
        o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_FireOutDateTime';
    }

    const fd = new FormData();
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
            let p = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        weight: 2,
                        color: pc,
                        opacity: 0.8,
                        fillOpacity: 0.35
                    }
                },
                onEachFeature: function (feature, layer) {
                    let fp = feature.properties,
                        fn = (settings.archive ? ucwords(fp.INCIDENT.toLowerCase()) + ' Fire' : (fp.poly_IncidentName ? ucwords(fp.poly_IncidentName.toLowerCase()) + ' Fire' : fireName(fp.irwin_IncidentName))),
                        gt,
                        DATE_CUR,
                        acres;

                    if (settings.archive) {
                        gt = fp.DATE_CUR.substr(4, 2) + '/' + fp.DATE_CUR.substr(6, 2) + '/' + fp.DATE_CUR.substr(0, 4);
                        DATE_CUR = new Date(gt).getTime();

                        acres = sizing(2, fp.GIS_ACRES);
                    } else {
                        acres = sizing(2, (fp.poly_GISAcres ? fp.poly_GISAcres : fp.poly_Acres_AutoCalc));
                    }

                    acres += ' ' + (acres == 1 ? sizing(1).slice(0, -1) : sizing(1)).toLowerCase();
                    pOBJECTID.push(fp.OBJECTID);

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
                        '<span style="display:block;text-align:center;font-weight:100;font-size:25px;">' + acres + '</span><small style="display:block;text-align:center;padding-top:15px;font-style:italic;line-height:1.2">Last mapped ' + timeAgo((settings.archive ? fp.DATE_CUR : fp.poly_DateCurrent) / 1000) + (settings.archive ? (fp.MAP_METHOD ? ' using ' + fp.MAP_METHOD : '') : (fp.poly_MapMethod ? ' using ' + fp.poly_MapMethod : '')) + '</small>'), {
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
                    const sf = (settings.archive ? feature.properties.INCIDENT : feature.properties.poly_IncidentName);
                    return (pOBJECTID.indexOf(feature.properties.OBJECTID) < 0/* && sf.search('Fire') <= 0*/ ? true : false);
                }
            });

            perimeters.addLayer(p);
        }
    }).then(() => {
        updateProgressBar('Perimeters loaded...');
        console.info('Perimeters loaded in ' + parseFloat((new Date().getTime() - ms) / 1000) + ' secs');
        params(2, 'perimeters', perimeters);
    });
}

/*function loadPerimeters() {
    if (typeof (Worker) !== 'undefined') {
        if (typeof (w) == 'undefined') {
            w = new Worker("v1.1/perimeter.js");
            w.postMessage({
                s: settings, 
                b: getbbox()
            });
        }
        w.onmessage = function (event) {
            console.log(event);
        };
    }
}*/

function searchPerims(v) {
    let r = '',
        args = [],
        x = 0,
        y = 0;

    perimeters.getLayers().forEach((p, a) => {
        if (p.getLayers().length > 0) {
            p.getLayers().forEach((e) => {
                const fp = e.feature.properties,
                    n = (fp.poly_IncidentName ? fp.poly_IncidentName : fp.attr_IncidentName),
                    p = similarText(n.replace(' Fire', '').toLowerCase(), v.toLowerCase());

                if (n.toLowerCase().search(v.toLowerCase()) >= 0 && p >= 0.2) {
                    const a = (settings.archive ? fp.GIS_ACRES : (fp.poly_GISAcres ? fp.poly_GISAcres : fp.poly_Acres_AutoCalc));
                    args.push([n, fp.attr_POOState, a, x, y]);
                }

                y++;
            });
        }

        x++;
    });

    args.sort().reverse();

    args.forEach((f) => {
        const n = f[0],
            rx = n.match(new RegExp(v, 'gmi')),
            z = (rx ? n.replace(rx[0], '<b>' + rx[0] + '</b>') : n);

        r += '<div id="result" data-type="perim" data-x="' + f[3] + '" data-y="' + f[4] + '"><div class="text"><h3>' + z + '</h3>' +
            '<p>Wildfire Perimeter in <b>' + stateLabels[f[1].replace('US-', '')] + '</b> &middot; <span style="color:#ff6686">' + sizing(2, f[2]) + ' ' + sizing(1).toLowerCase() + '</span></p></div></div>';
    });

    document.querySelector('#search-results').insertAdjacentHTML('beforeend', r);

    return args.length;
}

function searchFires(v) {
    let arr = [],
        args = [],
        r = '';

    if (document.querySelector('#newFires').checked && newFires.getLayers().length > 0) {
        for (let i = 0; i < newFires.getLayers().length; i++) {
            arr.push(newFires.getLayers()[i].getLayers());
        }
    }

    if (document.querySelector('#allFires').checked && allFires.getLayers().length > 0) {
        for (let i = 0; i < allFires.getLayers().length; i++) {
            arr.push(allFires.getLayers()[i].getLayers());
        }
    }

    if (document.querySelector('#smokeChecks').checked && smokeChecks.getLayers().length > 0) {
        for (let i = 0; i < smokeChecks.getLayers().length; i++) {
            arr.push(smokeChecks.getLayers()[i].getLayers());
        }
    }

    if (document.querySelector('#rxBurns').checked && rxBurns.getLayers().length > 0) {
        for (let i = 0; i < rxBurns.getLayers().length; i++) {
            arr.push(rxBurns.getLayers()[i].getLayers());
        }
    }

    /* iterate through the fire layers that are turned on, then iterate through each fire that is shown on the map */
    for (let x = 0; x < arr.length; x++) {
        for (let i = 0; i < arr[x].length; i++) {
            let a = arr[x][i].options.acres,
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

    args.forEach((f) => {
        const n = f[1],
            rx = n.match(new RegExp(v, 'gmi')),
            z = (rx ? n.replace(rx[0], '<b>' + rx[0] + '</b>') : n);

        r += '<div id="result" data-type="fire" data-wfid="' + f[5] + '" data-status="' + f[6] + '" data-lat="' + f[7] + '" data-lon="' + f[8] + '"><!--<div class="icon"><i class="fal fa-fire"></i></div>--><div class="text"><h3>' + z + '</h3>' +
            '<p>' + f[4] + ' in <b>' + f[2] + '</b> &middot; <span style="color:#ff6686">' + sizing(2, f[3]) + ' ' + sizing(1).toLowerCase() + '</span></p></div></div>';
    });

    document.querySelector('#search-results').insertAdjacentHTML('beforeend', r);

    return args.length;
}

async function query(q) {
    let qLen = q.length;

    if (qLen == 0) {
        document.querySelector('#q').value = '';
        document.querySelector('#q').blur();
        document.querySelector('#search-results').style.display = 'none';
    } else if (qLen >= 2) {
        document.querySelector('#search-results').style.display = 'block';
        let do1 = searchFires(q),
            do2 = searchPerims(q),
            fd = new FormData();

        fd.append('q', q);

        document.querySelector('#search-results .default').style.display = 'none';

        await fetch(apiUrl('search', 2), {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const res = await resp.json();

            let lis = '';

            if (res.rs != null && res.rs.length > 0) {
                res.rs.forEach(function (r) {
                    let n = r.name,
                        rx = n.match(new RegExp(q, 'gmi')),
                        z = (rx ? n.replace(rx[0], '<b>' + rx[0] + '</b>') : n),
                        c = (r.county ? r.county : ''),
                        g = (r.geoType ? r.geoType : ''),
                        t = r.type,
                        a = r.lat,
                        b = r.lon,
                        s;

                    if (n.search(',') >= 0) {
                        s = stateLabels[n.match(/,\s([A-Z]+)/gm)[0].replace(', ', '')];
                    } else {
                        s = '';
                    }

                    const tmp = '<div id="result" data-type="{type}" data-lat="' + a + '" data-lon="' + b + '" title="' + n + '"><div class="text"><h3>' + z + '</h3><p>{desc}</p></div></div>';

                    if (t == 'City') {
                        lis += tmp.replace('{type}', 'city').replace('{desc}', '<b>City</b> in ' + c + ' County &middot; ' + s);
                    } else if (t == 'State') {
                        lis += tmp.replace('{type}', 'state').replace('{desc}', 'State');
                    } else if (t == 'GIS') {
                        lis += tmp.replace('{type}', 'gis').replace('{desc}', '<b>' + g + '</b> in ' + c + ' County &middot; ' + s);
                    }
                });

                if (do1 == 0 && do2 == 0) {
                    document.querySelector('#search-results').innerHTML = lis;
                } else {
                    document.querySelector('#search-results').insertAdjacentHTML('beforeend', lis);
                }
            }
        });
    }
}

function search(v, e) {
    clearTimeout(typeTimer);
    let kc = [16, 17, 18, 19, 20, 27, 40, 32, 37, 38, 39];

    if (kc.includes(e.keyCode) === false && e.ctrlKey === false) {
        document.querySelector('#search-results').innerHTML = '<div class="default">Searching fires and places...</div>';
        document.querySelector('#search-results').style.display = 'block';

        typeTimer = setTimeout(function () {
            if (v == '') {
                document.querySelector('#search-results').innerHTML = events;
            } else {
                query(v);
            }
        }, 750);
    }
}

function alertCount() {
    if (wwas) {
        let ac = c = 0;

        wwas.eachLayer((w) => {
            w.eachLayer((l) => {
                if (contains(l.getLatLngs()) === true) {
                    ac++;
                    inviewAlerts.push(c);
                }
                c++;
            });
        });

        /*if (ac > 0) {
            document.querySelector('#alerts .notify').innerHTML = (ac > 11 ? '11+' : ac);
            document.querySelector('#alerts .notify').style.display = 'flex';
        } else {
            document.querySelector('#alerts .notify').innerHTML = '';
            document.querySelector('#alerts .notify').style.display = 'none';
        }*/
    }
}

/* allow user to submit report to MAPO of a new wildfire incident */
function doReport(lat, lon) {
    if (isAndroid == 1) {
        SubmitReport.fire(lat, lon);
    } else {
        document.querySelector('#map').style.cursor = 'auto';

        map.setView([lat, lon], 12);
        document.querySelector('#impact .wrapper').insertAdjacentHTML('beforeend', newReport);
        document.querySelector('#newReport input[name=lat]').value = lat;
        document.querySelector('#newReport input[name=lon]').value = lon;

        if (user.noauth != 1) {
            document.querySelector('#newReport input[name=authUser]').value = 1;
            document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<input type="hidden" name="uid" value="' + user.uid + '">');
        }

        nrMrkr = L.marker([lat, lon], {
            draggable: true
        }).on('dragend', (e) => {
            const c = e.target.getLatLng(),
                lat = c.lat,
                lon = c.lng,
                fd = new FormData();

            fd.append('lat', lat);
            fd.append('lon', lon);

            fetch(apiUrl('geocode/incident', 2), {
                method: 'POST',
                body: fd
            }).then(async (resp) => {
                const data = await resp.json();
                document.querySelector('#newReport input[id=gl]').value = data.geocode.near;
                document.querySelector('#newReport input[id=gs]').value = stateLabels[data.geocode.state];
                document.querySelector('#newReport input[name=geolocation]').value = data.geocode.near;
                document.querySelector('#newReport input[name=state]').value = data.geocode.state + ' / ' + stateLabels[data.geocode.state];
            });

            map.setView([lat, lon], 12);
            document.querySelector('#newReport input[name=lat]').value = lat;
            document.querySelector('#newReport input[name=lon]').value = lon;
        }).addTo(map);

        openImpact(null, 'Report New Incident');
    }
}

/* generate forecast model times */
function initNDFDTimes() {
    for (let i = 0; i < 24; i++) {
        let t = new Date(ndfdTime(i)),
            y = t.getUTCFullYear(),
            m1 = (t.getUTCMonth() + 1),
            m = (m1 < 10 ? '0' : '') + m1,
            d1 = t.getUTCDate(),
            d = (d1 < 10 ? '0' : '') + d1,
            h1 = t.getUTCHours(),
            h = (h1 < 10 ? '0' : '') + h1,
            ts = y + '-' + m + '-' + d + 'T' + h + ':00:00.000Z',
            lh = (t.getHours() > 12 ? t.getHours() - 12 : t.getHours()) + ':00';

        /*h = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())) + ':00 ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M';*/

        if (document.querySelector('#fcstTime')) {
            const o = document.createElement('option');
            o.value = ts;
            o.text = (lh == 0 ? '12' : lh) + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M';

            if (settings.special && settings.special.fcstTime == ts) {
                o.selected = true;
            }

            document.querySelector('#fcstTime').add(o);
        }
    }

    /*if (document.querySelector('#fcstTime')) {
        document.querySelector('#fcstTime option[value=""]').remove();
    }*/
}

function init() {
    if (!document.querySelector('.screen-loading')) {
        document.body.insertAdjacentHTML('beforeend', '<div class="screen-loading"><div class="spinner s2"></div></div>');
    }

    /* save list of fires user clicked on during their visit every 30 seconds */
    setInterval(function () {
        saveLogFire();
    }, 30000);

    /* clear old fires from the cache */
    if (localStorage.getItem(INC_CACHE_NAME) != null) {
        let nl = [];
        JSON.parse(localStorage.getItem(INC_CACHE_NAME)).forEach((f) => {
            if (new Date().getTime() - f.cacheTime <= 900000) {
                nl.push(f);
            }
        });

        localStorage.setItem(INC_CACHE_NAME, JSON.stringify(nl));
    }

    /* get user location right off the bat if they'll allow it */
    /*navigator.geolocation.getCurrentPosition(function (pos) {
        geoLocation = [pos.coords.latitude, pos.coords.longitude, mToFt(pos.coords.accuracy)];
    });*/

    /* set layers menu */
    Object.keys(layers.layers).forEach(k => {
        let zzz = 0;
        layersMenu += '<div class="group" title="' + layers.categories[k] + '"' + (layers.categories[k] == 'California' ? ' style="display:none"' : '') + '><h3 class="group-title">' + layers.categories[k] + '</h3><ul class="layers-list">';

        /* layers within each grouping */
        layers.layers[k].forEach(function (l, n) {
            console.log(l);
            layersMenu += '<li class="layer' + (!l.name ? ' grouped' : '') + '" data-p="' + l.perms + '" data-id="' + l.id + '" style="display:none"><div class="checkbox">' +
                '<input type="checkbox" class="lmchkbx" data-type="' + l.type + '" id="' + l.id + '"' + (l.default == 1 && !settings.checkboxes || (settings.checkboxes && settings.checkboxes.includes(l.id)) ? ' checked' : '') + '></div>' +
                '<div class="desc"><label for="' + l.id + '">' + (l.name ? l.name : '') + '</label><span>' + /*layerDesc[k][zzz] + */'</span>';

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

            layersMenu += '</div></li>';
            zzz++;
        });

        layersMenu += '</ul></div>';
    });

    /* add archive years to select menu 
    for (let y = curTime.getFullYear(); y > 2014; y--) {
        document.querySelector('#yearChange .select-options').append('<li rel="' + y + '">' + y + '</li>');
    }
    document.querySelector('#yearChange .select-styled').innerHTML = 'Archive Year';*/

    /* create dynamic legend from json array */
    let legCont = '';
    legend.categories.forEach(function (c) {
        let k = Object.keys(c)[0];
        legCont += '<div class="group"><h3 class="group-title">' + c[k] + '</h3>';

        legend.items[k].forEach(function (l) {
            legCont += '<div class="row"><div class="ic">' + (l[0] == 'icon' ? l[1] : '<div class="color" style="background-color:' + l[2] + '">' + (l[1] ? l[1] : '') + '</div>') +
                '</div><div class="desc">' + l[3] + '</div></div>';
        });

        legCont += '</div>';
    });

    /* append various features in the right, impact menu */
    if (!document.querySelector('#impact .wrapper .layersMenu')) {
        document.querySelector('#impact .wrapper').insertAdjacentHTML('beforeend', '<div class="layersMenu" style="display:none">' + layersMenu + '</div>');
    }

    if (!document.querySelector('#impact .wrapper .basemaps')) {
        document.querySelector('#impact .wrapper').insertAdjacentHTML('beforeend', '<div class="basemaps" style="display:none"><div class="group"><h3 class="group-title">Basic</h3><ul class="basic layers-list"></ul></div><div class="group"><h3 class="group-title">Advanced</h3><ul class="adv layers-list"></ul></div></div>');
    }
    if (!document.querySelector('#impact .wrapper .legend')) {
        document.querySelector('#impact .wrapper').insertAdjacentHTML('beforeend', '<div class="legend" style="display:none">' + legCont + '</div>');
    }

    updateProgressBar('Layers loading...');
    initNDFDTimes();

    for (let z = 0; z < 6; z++) {
        let t = new Date(new Date().getTime() + (z * 24 * 60 * 60 * 1000)),
            d = days[t.getUTCDay()] + ', ' + months[t.getUTCMonth()] + ' ' + t.getUTCDate(),
            v = t.getUTCFullYear() + '-' + (t.getUTCMonth() < 10 ? '0' : '') + (t.getUTCMonth() + 1) + '-' + (t.getUTCDate() < 10 ? '0' : '') + t.getUTCDate() + 'T00:00:00.0Z';

        if (document.querySelector('#sfpDateSelect')) {
            const o = document.createElement('option');
            o.value = v;
            o.text = d + (z == 0 ? ' (Today)' : (z == 1 ? ' (Tomorrow)' : ''));

            if (settings.special && settings.special.sfpDate == v) {
                o.selected = true;
            }

            document.querySelector('#sfpDateSelect').add(o);
        }
    }

    hrrrSmokeTime = {
        "init": gmtime(-3600),
        "fcst": gmtime(+3600)
    };

    countyBounds = L.tileLayer.wms('https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/export', {
        className: 'counties',
        id: 'Counties',
        layers: 'show:2',
        format: 'png32',
        transparent: true,
        size: '1920,601',
        tileSize: L.point(1920, 601),
        bboxSR: 102100,
        imageSR: 102100,
        crs: L.CRS.EPSG3857,
        f: 'image',
        opacity: 1
    });

    nwsCWAs = L.tileLayer.wms('https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/export', {
        id: 'NWS CWAs',
        layers: 'show:1',
        format: 'png32',
        transparent: true,
        size: '1920,601',
        tileSize: L.point(1920, 601),
        bboxSR: 3857,
        imageSR: 3857,
        crs: L.CRS.EPSG3857,
        f: 'image',
        dpi: 90,
        opacity: 1
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

    nfdrs = L.tileLayer.wms('https://fsapps.nwcg.gov/psp/arcgis/rest/services/npsg/Fire_Danger/MapServer/export', {
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

    sfcSmoke = L.tileLayer('https://hwp-viz.gsd.esrl.noaa.gov/smoke/wmts/image/hrrr_smoke?var=sfc_smoke&x={x}&y={y}&z={z}&time=' + hrrrSmokeTime.fcst + '.000Z&modelrun=' + hrrrSmokeTime.init + 'Z&level=0', {
        id: 'Surface Smoke',
        minZoom: 3,
        maxZoom: 18,
        opacity: 0.6,
        pane: 'layers'
    });

    viSmoke = L.tileLayer('https://hwp-viz.gsd.esrl.noaa.gov/smoke/wmts/image/hrrr_smoke?var=vi_smoke&x={x}&y={y}&z={z}&time=' + hrrrSmokeTime.fcst + '.000Z&modelrun=' + hrrrSmokeTime.init + 'Z&level=0', {
        id: 'Vertically Integrated Smoke',
        minZoom: 3,
        maxZoom: 18,
        opacity: 0.6,
        pane: 'layers'
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
        opacity: 0.7,
        pane: 'layers'
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
        opacity: 0.7,
        pane: 'layers'
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
        opacity: 0.7,
        pane: 'layers'
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
        opacity: 0.8,
        pane: 'layers'
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
        opacity: 0.6,
        pane: 'layers'
    });

    /* display zoom, lat, lon in URL hash 
    let hash = new L.Hash(map);*/

    /* add basemap options to selecter and based on user permissions */
    tileNames.forEach((n, c) => {
        let prettyName;

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

        let p = (tilePerms[c] && hasPermission(user, actions.PREMIUM_BASEMAPS) || tilePerms[c] === false ? true : false);

        if (!tilePerms[c]) {
            document.querySelector('.basemaps ul.basic').insertAdjacentHTML('beforeend', '<li class="layer"><div class="radio">' +
                '<input type="radio" name="bsmo" id="' + n + '"' + (settings.tile == n ? ' checked' : '') + '></div>' +
                '<div class="desc"><label for="' + n + '">' + prettyName + '</label></div></li>');
        } else {
            document.querySelector('.basemaps ul.adv').insertAdjacentHTML('beforeend', '<li class="layer' + (!p ? ' disabled' : '') + '"><div class="radio">' +
                '<input type="radio" name="bsmo" id="' + n + '"' + (p ? (settings.tile == n ? ' checked' : '') : ' disabled') + '></div>' +
                '<div class="desc"><label for="' + n + '">' + prettyName + '</label></div></li>');
        }
    });

    /* when user clicks to see local incidents */
    if (document.querySelector('#local')) {
        document.querySelector('#local').addEventListener('click', () => {
            let ti = this.getAttribute('data-count');

            notify('info', 'There ' + (ti == 1 ? 'is ' : 'are ') + (ti == undefined ? 0 : ti) + ' wildfire incident' + (ti != 1 ? 's' : '') + ' near your location.');
        });
    }

    /* when search query is focused */
    document.querySelector('.searchControl #q').addEventListener('focus', async () => {
        document.querySelector('#closeSearch').style.display = 'block';

        if (!events) {
            await fetch(apiUrl('events', 2))
                .then(async (resp) => {
                    const e = await resp.json();

                    let r = '';
                    if (e.top != null) {
                        for (let i = 0; i < e.top.length; i++) {
                            let o = findFire(e.top[i].wfid);

                            if (o != undefined) {
                                let ts = o.options.state,
                                    state = (ts.substr(0, 2) == 'CA' && ts.length > 2 ? stateLabels[ts.substr(2, 2)] : stateLabels[ts]);

                                g = o.getLatLng();
                                r += '<div id="result" data-type="fire" data-wfid="' + e.top[i].wfid + '" data-lat="' + g.lat + '" data-lon="' + g.lng + '"><!--<div class="icon"><i class="fal fa-fire"></i></div>--><div class="text"><h3>' + o.options.title + '</h3>' +
                                    '<p>' + o.options.type + ' in <b>' + (ts.substr(0, 2) == 'CA' && ts.length > 2 ? 'Canada' : state) + '</b> &middot; <span style="color:#ff6686">' + sizing(2, o.options.acres) + ' ' + sizing(1).toLowerCase() + '</span></p></div></div>';
                            }
                        }

                        events = '<div class="topFires">Trending fires right now...</div>' + (r ? r : '<div class="default">There are no trending fires right now</div>');

                        setTimeout(() => {
                            document.querySelector('#search-results').innerHTML = events;
                            document.querySelector('#search-results').style.display = 'block';
                        }, 500);
                    }
                });
        } else {
            setTimeout(() => {
                document.querySelector('#search-results').innerHTML = events;
                document.querySelector('#search-results').style.display = 'block';
            }, 325);
        }
    });

    /* radar control play/pause */
    document.querySelector('#radarPause').addEventListener('click', (e) => {
        if (e.target.getAttribute('data-pause') == '0') {
            isRadarPaused = true;
            e.target.setAttribute('data-pause', '1');
            e.target.classList.add('fa-circle-play');
            e.target.classList.remove('fa-circle-pause');
        } else {
            isRadarPaused = false;
            e.target.setAttribute('data-pause', '0');
            e.target.classList.add('fa-circle-pause');
            e.target.classList.remove('fa-circle-play');
        }
    });

    /*document.querySelectorAll('#tileChange .select-options li').forEach((e) => {
        e.addEventListener('click', () => {
            let a = e.target;
            document.querySelector('#tileChange .select-styled').innerHTML = ucwords(a.innerHTML);
            document.querySelector('#tileChange').setAttribute('data-selected', a.getAttribute('rel'));

            settings.tile = a.getAttribute('rel');
            setMapType();

            document.querySelector('#tileChange').style.display = 'none';
            document.querySelector('#tileChange .select-styled').classList.remove('active');
            document.querySelector('#tileChange .select-options').classList.remove('active');

        });
    });

    document.querySelectorAll('#yearChange .select-options li').forEach((e) => {
        e.addEventListener('click', () => {
            window.location.href = host + 'archive/' + e.target.getAttribute('rel');

            document.querySelector('#yearChange').style.display = 'none';
            document.querySelector('#yearChange .select-styled').classList.remove('active');
            document.querySelector('#yearChange .select-options').classList.remove('active');
        });
    });*/
}

document.onreadystatechange = async () => {
    if (document.readyState == 'complete') {
        let token;

        document.cookie.split('; ').forEach((t) => {
            const a = t.split('=');
            if (a[0] == 'token') {
                token = a[1];
            }
        });

        const fd = new FormData();
        fd.append('token', token);

        await fetch(apiUrl('subscriptions', 2), {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const json = await resp.json();
            subscribe = json.subscriptions;
            new User().validSubscription();
        });
    }

    /* see if user is logged in, if so add credentials to app settings */
    if (!document.querySelector('#impact .wrapper .account')) {
        document.querySelector('#impact .wrapper').insertAdjacentHTML('beforeend', '<div class="account" style="display:none;text-align:center">' + accountForm + '</div>');
    }
    new User().check();

    if (document.readyState !== 'loading') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            init();

            /*setTimeout(() => {
                const l = document.querySelector('.screen-loading');

                if (l) {
                    l.remove();
                }
            }, 3000);*/
        });
    }
};

window.onload = () => {
    /* save settings automatically after the first 10 seconds, then every 5 minutes, whether to the session or user account */
    setTimeout(function () {
        saveSession(true);

        setInterval(function () {
            saveSession(true);
        }, settings.saveFreq);
    }, 300000);

    /* initialize map */
    let a,
        lat = settings.center[0],
        lon = settings.center[1],
        z = settings.zoom;

    if (document.querySelector('#map').getAttribute('data-state')) {
        a = stateCenter(document.querySelector('#map').getAttribute('data-state'));
        lat = a[0];
        lon = a[1];
        z = 7;
    } else {
        if (window.outerWidth <= 1024) {
            if (window.outerWidth <= 500) {
                lat = 41.982508894184505;
                lon = -112.18039736151698;
            }

            z -= 1;
        }
    }

    map = L.map('map', {
        preferCanvas: true,
        zoomControl: false,
        touchZoom: true,
        fullscreenControl: (!isAndroid ? {
            pseudoFullscreen: false,
            preferCanvas: true,
            position: 'bottomright'
        } : {})
    }).setView([lat, lon], z).on('load', () => {
        countFires();
    }).on('click', (e) => {
        /* if fuels layer is on, and user clicks on map, get vegatation at that lat/lon */
        if (document.querySelector('input[id=fuels]') && document.querySelector('input[id=fuels]').checked) {
            fuelType(e.latlng.lat, e.latlng.lng);
        }

        if (document.querySelector('input[id=drought]') && document.querySelector('input[id=drought]').checked) {
            getDrought(e.latlng.lat, e.latlng.lng);
        }

        /* open new incident report form */
        if (document.querySelector('li#report').getAttribute('data-active') == 1) {
            fetch(apiUrl('geocode/incident', 2) + '&lat=' + e.latlng.lat + '&lon=' + e.latlng.lng)
                .then(async (resp) => {
                    const data = await resp.json();
                    document.querySelector('#newReport input[id=gl]').value = data.geocode.near;
                    document.querySelector('#newReport input[id=gs]').value = stateLabels[data.geocode.state];
                    document.querySelector('#newReport input[name=geolocation]').value = data.geocode.near;
                    document.querySelector('#newReport input[name=state]').value = data.geocode.state + ' / ' + stateLabels[data.geocode.state];
                });

            doReport(e.latlng.lat, e.latlng.lng);
        }
    }).on('zoomend', () => {
        if (document.querySelector('.layer input[id=plss]') && document.querySelector('.layer input[id=plss]').checked && map.getZoom() < 8) {
            notify('info', 'You must be zoomed in more to see TRS layers')
        }

        if (document.querySelector('.layer input[id=roads]') && document.querySelector('.layer input[id=roads]').checked && map.getZoom() < 12) {
            notify('info', 'You must be zoomed in more to see USFS roads')
        }
    }).on('movestart', () => {
        document.querySelector('#map').style.cursor = 'grabbing';
        moving = true;
    }).on('moveend', () => {
        countFires();

        if (moving) {
            document.querySelector('#map').style.cursor = (document.querySelector('#report').getAttribute('data-active') == 1 ? 'crosshair' : 'auto');

            if (archive) {
                if (!document.querySelector('.screen-loading')) {
                    document.body.insertAdjacentHTML('beforeend', '<div class="screen-loading"><div class="spinner s2"></div></div>');
                }
                new Wildfires().getHistoricFires();
            }

            loadPerimeters();

            if (document.querySelector('.layersMenu')) {
                if (document.querySelector('input[id=modis24]').checked) {
                    modisHotspots(1);
                }

                if (document.querySelector('input[id=modis48]').checked) {
                    modisHotspots(2);
                }

                if (document.querySelector('input[id=modis72]').checked) {
                    modisHotspots(3);
                }

                if (document.querySelector('input[id=stns]').checked) {
                    getWeather();
                }

                if (document.querySelector('input[id=dispatch]').checked) {
                    dispatchBounds();
                }

                /*if (document.querySelector('input[id=nwsfire]').checked) {
                    nwsFireWX();
                }*/

                if (document.querySelector('input[id=gaccBounds]').checked) {
                    getGACCBounds();
                }

                if (document.querySelector('input[id=erc]').checked) {
                    getPSAs();
                }

                getWWAs();

                if (document.querySelector('input[id=airq]').checked) {
                    getAirQ();
                }

                if (document.querySelector('input[id=nri]').checked) {
                    femaNRI();
                }
            }

            alertCount();

            moving = false;
        }
    });

    /* create a pane for image overlays to prevent basemap from bringing to front */
    map.createPane('layers');
    map.getPane('layers').style.zIndex = 550;
    map.getPane('layers').style.pointerEvents = 'none';

    /* map custom controls back to the map */
    L.control.scale({
        imperial: true,
        position: 'bottomleft'
    }).addTo(map);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    /* custom style for the map zoom controls */
    document.querySelectorAll('.leaflet-control-zoom-in span, .leaflet-control-zoom-out span').forEach((e) => {
        e.remove();
    });
    document.querySelector('.leaflet-control-zoom-in').innerHTML = '<i class="far fa-plus"></i>';
    document.querySelector('.leaflet-control-zoom-out').innerHTML = '<i class="far fa-minus"></i>';

    /* set map basemap tiles */
    setMapType();

    /* if URL is supposed to open an incident */
    if (window.location.pathname.search('/fires') >= 0) {
        let id = window.location.pathname.split('/')[2];
        new Wildfires().fireDetails(id, true);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/alert') >= 0) {
        let id = window.location.pathname.split('/')[3];
        readWWA(id);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/outlook') >= 0) {
        let s = window.location.pathname.split('/');
        readSPCText(s[3], s[4]);
    }

    /* if URL is supposed to open nws fire wx fcst */
    if (window.location.pathname.search('/weather/fire') >= 0) {
        let s = window.location.pathname.split('/');
        fireFcst(s[3], s[4], zn = '');
    }

    /* if URL is supposed to open risk data for a county */
    if (window.location.pathname.search('/risk') >= 0) {
        let id = window.location.pathname.split('/')[2];
        viewRisk(id);
    }

    /* get important, initial layers on load */
    if (!archive) {
        new Wildfires().getFires();
    } else {
        new Wildfires().getHistoricFires();
    }

    /* get layers if they are checked already */
    params(3, 'radar', getRadarAPI);
    params(3, 'modis24', modisHotspots(1));
    params(3, 'modis48', modisHotspots(2));
    params(3, 'modis72', modisHotspots(3));
    params(3, 'dispatch', dispatchBounds);
    /*params(3, 'nwsfire', nwsFireWX);*/
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
};

/* on keyup */
window.onkeyup = (e) => {
    /* on esc */
    if (e.keyCode === 27) {
        if (document.querySelector('#modal').classList.contains('open')) {
            closeModal();
        }

        if (document.querySelector('#impact').offsetLeft > 0) {
            closeImpact();
        }

        if (document.activeElement == document.querySelector('#q')) {
            document.querySelector('#q').value = '';
            document.querySelector('#q').blur();
            document.querySelector('#search-results').style.display = 'none';
            document.querySelector('#closeSearch').style.display = 'none';
        }
    }

    /* ctrl + f */
    if (e.ctrlKey && e.which == 70) {
        e.preventDefault();
        document.querySelector('.searchControl').classList.add('in-use');
        document.querySelector('.searchControl #q').focus();
    }

    /* when user types text in the search box */
    if (e.target.id == 'q') {
        search(e.target.value, e);
    }

    if (e.target.name == 'size') {
        document.querySelector('#newReport div').innerHTML = 'acre' + (e.target.value != 1 ? 's' : '');
    }
};

/* on keydown */
window.onkeydown = (e) => {
    /* ctrl + f */
    if (e.ctrlKey && e.which == 70) {
        e.preventDefault();
        document.querySelector('.searchControl').classList.add('in-use');
        document.querySelector('.searchControl #q').focus();
    }

    if (e.target.id == 'q') {
        clearTimeout(typeTimer);
    }
};

/* start or stop tracking a wildfire incident */
document.addEventListener('mouseover', (el) => {
    if (el.target.id == 'trackFire') {
        if (el.target.getAttribute('data-following') == '1' && tracked.includes(el.target.getAttribute('data-id'))) {
            el.target.classList.add('btn-red', 'stop');
            el.target.classList.remove('btn-blue', 'yes');
            el.target.innerHTML = 'Unfollow?';
        }
    }

    if (el.target.classList.contains('ttip') || el.target.parentElement.classList.contains('ttip')) {
        let e = el.target,
            a = JSON.parse((e.getAttribute('data-tooltip') ? e.getAttribute('data-tooltip') : e.parentElement.getAttribute('data-tooltip'))),
            /*t = e.offsetTop,
            l = e.offsetLeft,
            r = window.innerWidth,
            w = e.offsetWidth,
            h = e.offsetHeight,
            tth = 26 / 2,*/
            c = e.getBoundingClientRect(),
            t = c.top,
            l = c.left,
            w = c.width,
            h = c.height,
            top = 0,
            left = 0,
            right = 0;

        if (a.dir == 'right') {
            top = t + 6.5;
            left = l + w + 9;

            document.body.insertAdjacentHTML('beforeend', '<div class="tooltip ' + a.dir + '" style="top:' + top + 'px' + (left != 0 ? ';left:' + left + 'px' : '') + (right != 0 ? ';right:' + right + 'px' : '') + '"><p>' + a.text + '</p></div>');
        }
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target.id == 'trackFire') {
        if (e.target.getAttribute('data-following') == '1' && tracked.includes(e.target.getAttribute('data-id'))) {
            e.target.classList.remove('btn-red', 'stop');
            e.target.classList.add('btn-blue', 'yes');
            e.target.innerHTML = 'Following';
        }
    }

    if (e.target.classList.contains('ttip') || e.target.parentElement.classList.contains('ttip')) {
        document.querySelector('div.tooltip').remove();
    }
});

/* on input */
document.addEventListener('input', (e) => {
    /* min perimeter size slider */
    if (e.target.parentElement.id == 'perimeterSize') {
        document.querySelector('#pSize').innerHTML = e.target.value + ' acres';
    }
});

document.addEventListener('change', (e) => {
    /* anytime a settings is changed, automatically save it */
    if (e.target.localName == 'select' && e.target.parentElement.parentElement.parentElement.id == 'settings') {
        saveSession(true);
    }

    /* change basemap on radio select */
    if (e.target.name == 'bsmo') {
        settings.tile = e.target.id;
        setMapType();
    }

    /* if user manually changes the radar imagery time */
    if (e.target.parentElement.parentElement.id == 'radarControl') {
        let t = e.target;

        radarImgs.forEach((r, n) => {
            if (t.val() == n) {
                let d = new Date(r.options.time * 1000),
                    w = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M';

                r.setOpacity(0.8);
                document.querySelector('#radarControl .time').innerHTML = w;
                radarCount = t.value;
            } else {
                r.setOpacity(0);
            }
        });
    }

    /* on min perimeter size change */
    if (e.target.parentElement.id == 'perimeterSize') {
        let s = e.target.value;
        settings.perimeters.minSize = s;

        if (map.hasLayer(perimeters)) {
            perimeters.eachLayer((p) => {
                let l = p.getLayers();

                for (let i = 0; i < l.length; i++) {
                    if (l[i].feature.properties.poly_GISAcres < s) {
                        p.removeLayer(l[i]);
                    }
                }
            });
        }

        loadPerimeters();
    }

    if (e.target.classList.contains('lmchkbx')) {
        let id = e.target.getAttribute('id');

        switch (id) {
            case 'stns':
                getWeather();
                break;
            case 'dispatch':
                dispatchBounds();
                break;
            /*case 'nwsfire':
                nwsFireWX();
                break;*/
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
                    if (e.target.checked) {
                        document.querySelector('#map').style.cursor = 'crosshair';
                    } else {
                        document.querySelector('#map').style.cursor = 'auto';
                    }
                }

                if (eval(id) != undefined) {
                    params(e.target.getAttribute('data-type'), id, eval(id));
                }
        }

        if (map.hasLayer(viSmoke) === false && map.hasLayer(sfcSmoke) === false && document.querySelector('#layerLabel')) {
            document.querySelector('#layerLabel').remove();
        }

        if (id == 'plss' && e.target.checked && map.getZoom() < 8) {
            notify('info', 'You must be zoomed in more to see TRS layers')
        }

        if (id == 'roads' && e.target.checked && map.getZoom() < 12) {
            notify('info', 'You must be zoomed in more to see USFS roads')
        }
    }

    /* if user changes settings, apply them immediately to the map */
    if (e.target.id == 'perimColor') {
        let a = e.target.options[e.target.selectedIndex].value;
        perimeters.setStyle({
            color: (a == 'default' ? 'red' : a)
        });
    }

    /* change the SFP outlook date */
    if (e.target.id == 'sfpDateSelect') {
        let t = e.target.options[e.target.selectedIndex].value;

        sfp.setParams({
            time: t
        });
    }

    /* change the SPC outlook type and/or day */
    if (e.target.id == 'otlkType') {
        if (spc != undefined || map.hasLayer(spc)) {
            map.removeLayer(spc);
        }

        if (document.querySelector('input[id=spc').checked) {
            otlkCat = [];
            getOutlook();
        }
    }

    if (e.target.id == 'otlkDay') {
        if (spc != undefined || map.hasLayer(spc)) {
            map.removeLayer(spc);
        }

        if (document.querySelector('input[id=spc').checked) {
            otlkCat = [];
            getOutlook();
        }
    }

    /* change the forecast model overlay type and time */
    if (e.target.id == 'forecastModel') {
        let t = e.target.options[e.target.selectedIndex].value,
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

        /*document.querySelector('#ndfdLegends > div').forEach((t) => {
            t.style.display = 'none';
        });*/

        document.querySelector('#legend' + t).style.display = 'block';

        ndfd.setUrl('https://nowcoast.noaa.gov/geoserver/' + ur + '/wms')
            .setParams({
                layers: t
            });
    }

    /* change forecast model time */
    if (e.target.id == 'fcstTime') {
        let v = e.target.options[e.target.selectedIndex].value;
        ndfd.setParams({
            time: v
        });
    }
});

document.addEventListener('click', async (e) => {
    /* close search */
    if (e.target.id == 'closeSearch') {
        document.querySelector('.searchControl input').value = '';
        e.target.style.display = 'none';
        document.querySelector('#search-results').style.display = 'none';
    }

    /* modal close button clicked */
    if (e.target.classList.contains('close') && e.target.parentElement.id == 'modal') {
        closeModal();
    }

    /* add fire to tracked list (or remove) */
    if (e.target.id == 'trackFire') {
        let id = e.target.getAttribute('data-id'),
            f = findFire(id),
            m;

        /* remove */
        if (e.target.getAttribute('data-following') == '1' && tracked.includes(id)) {
            m = 'remove';
            tracked.splice(tracked.indexOf(id), 1);

            /* add */
        } else {
            m = 'add';
            tracked.push(id);
        }

        const fd = new FormData();
        fd.append('wfid', id);

        await fetch(apiUrl('trackFires/' + m), {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const r = await resp.json(),
                tf = document.querySelector('#trackFire');

            if (r.success == 'added') {
                tf.setAttribute('data-following', '1');
                tf.setAttribute('title', 'You\'re following this fire');
                tf.classList.add('btn-blue', 'yes');
                tf.classList.remove('btn-green');
                tf.innerHTML = 'Following';
                notify('success', 'You\'re now following the ' + f.options.title + '.');
            } else if (r.success = 'removed') {
                tf.removeAttribute('data-following');
                tf.setAttribute('title', 'Follow this fire');
                tf.classList.remove('btn-blue', 'stop yes');
                tf.classList.add('btn-green');
                tf.innerHTML = 'Follow';

                notify('success', 'You\'re no long following the ' + f.options.title + '.');
            }
        });

        return false;
    }

    /*
     *   nav ul li menu options
     */

    /* open account panel or login form */
    if (e.target.id == 'account' || e.target.parentElement.id == 'account') {
        if (user.uid) {
            const vl = document.querySelector('#versionLabel');
            openImpact('account', '');

            if (vl.innerHTML == '') {
                vl.innerHTML = versionHTML + ' (v' + version + ')';
            }
        } else {
            if (isAndroid != 1) {
                window.location.href = 'https://www.mapotechnology.com/secure/login?service=mapofire&next=' + encodeURIComponent(window.location.href.replaceAll('?logout=1', ''));
            }
        }
    }

    /* get user's location */
    if (e.target.id == 'mylocation' || e.target.parentElement.id == 'mylocation') {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, geoLocationErrors);
        } else {
            notify('error', 'Geolocation is not supported by this browser.');
        }
    }


    /* open basemap selector */
    if (e.target.id == 'basemap' || e.target.parentElement.id == 'basemap') {
        openImpact('basemaps', 'Basemaps');
    }

    /* show layers content in impact panel, and open */
    if (e.target.id == 'layers' || e.target.parentElement.id == 'layers') {
        openImpact('layersMenu', 'Layers');
    }

    /* show legend */
    if (e.target.id == 'legend' || e.target.parentElement.id == 'legend') {
        openImpact('legend', 'Legend');
    }

    /* manually reload the page */
    if (e.target.id == 'refresh' || e.target.parentElement.id == 'refresh') {
        location.reload();
    }

    /* open archive year selector */
    if (e.target.id == 'archive' || e.target.parentElement.id == 'archive') {
        /*document.querySelector('#yearChange').style.right = '0px';
        document.querySelector('#yearChange').style.display = 'block';*/
        if (!document.querySelector('.archive_wrapper')) {
            document.body.insertAdjacentHTML('beforeend', '<div class="archive_wrapper"><i class="far fa-xmark" style="float:right;font-size:20px;cursor:pointer" onclick="this.parentElement.remove()"></i>' +
                '<h2>Historical Wildfires</h2><select id="archive"><option>- Choose a year -</option></select></div>');
            for (let i = new Date().getFullYear() - 1; i >= 2015; i--) {
                const option = document.createElement('option');
                option.text = i;
                option.value = i;
                document.querySelector('.archive_wrapper #archive').appendChild(option);
            }

            document.querySelector('.archive_wrapper #archive').addEventListener('change', (e) => {
                document.querySelector('.archive_wrapper').remove();
                window.location.href = host + 'archive/' + e.target.value;
            });
        }
    }

    /* allow user to report new wildfires to us */
    if (e.target.id == 'report' || e.target.parentElement.id == 'report') {
        document.querySelector('li#report').setAttribute('data-active', '1');
        document.querySelector('#map').style.cursor = 'crosshair';
        notify('info', 'Click anywhere on the map to report a <b>NEW</b> fire incident.');
    }

    /* save settings manually from button click */
    if (e.target.id == 'save' || e.target.parentElement.id == 'save') {
        saveSession(false);
    }

    /* close donation popup */
    if (e.target.id == 'close-donate') {
        document.querySelector('.donate').remove();

        let d = new Date(),
            expires = d.getTime() + (86400 * DONATE_POPUP_DAYS * 1000);

        d.setTime(expires);
        document.cookie = 'donate=' + expires + ';expires=' + d.toUTCString() + ';domain=' + location.hostname.replace('www', '') + ';path=/';
    }

    /* if user clicks a share button on the app */
    if (e.target.id == 'sharer') {
        if (navigator.share) {
            navigator.share({
                title: (e.target.getAttribute('title') ? e.target.getAttribute('title') : document.title),
                text: "",
                url: (e.target.getAttribute('data-href') ? e.target.getAttribute('data-href') : window.location.href)
            }).then(() => {
                console.log('Successfully shared');
            }).catch((error) => {
                console.log('Error sharing:', error);
            });
        }
    }

    /* when a user clicks for more info on a weather alert, get data and show in modal */
    if (e.target.id == 'alert') {
        readWWA(e.target.getAttribute('data-id'));
    }

    /* user click to view all weather alerts in the map bounding box */
    if (e.target.id == 'alerts') {
        let t = '',
            wxalids = [];

        document.querySelector('.layersMenu #wwas').checked = true;
        map.addLayer(wwas);

        for (let x = 0; x < wwas.getLayers().length; x++) {
            for (let i = 0; i < wwas.getLayers()[x].getLayers().length; i++) {
                let n = wwas.getLayers()[x].getLayers()[inviewAlerts[i]];

                if (n && wxalids.includes(n.feature.id) === false) {
                    let gd = n.feature;
                    m = gd.properties;
                    c = wwaColors[n.Event];
                    /*map.fitBounds(wwas.getLayers()[0][' + inviewAlerts[i] + '].getBounds());closeModal();return false*/
                    t += '<li style="padding:5px 0;line-height:1.4"><a href="#" onclick="map.fitBounds(wwas.getLayers()[' + x + '].getLayers()[inviewAlerts[' + i + ']].getBounds());closeModal();return false">' +
                        m.Event + '</a>' + ' for ' + m.Affected + ' until <b>' + until(m.End_) + '</b></li>';

                    wxalids.push(gd.id);
                }
            }
        }

        document.querySelector('#modal .content').innerHTML = '<div class="container"><h1>Active Weather Alerts</h1><p style="color:var(--red)">These are current weather alerts in effect for the area on your map.</p>' +
            '<ul style="margin-inline-start:35px">' + t + '</ul></div>';

        openModal();
    }

    /* when a search result is clicked on */
    if (e.target.id == 'result' || (e.target.parentElement.parentElement && e.target.parentElement.parentElement.id == 'result')) {
        let th = (e.target.id == 'result' ? e.target : e.target.parentElement.parentElement),
            type = th.getAttribute('data-type'),
            lat = th.getAttribute('data-lat'),
            lon = th.getAttribute('data-lon');

        document.querySelector('#search-results').style.display = 'none';
        document.querySelector('#search-results').innerHTML = '';
        document.querySelector('#q').value = '';

        if (type == 'fire') {
            let li = [newFires, allFires, smokeChecks, rxBurns],
                tw = th.getAttribute('data-wfid');

            li.forEach((g) => {
                if (g.getLayers().length > 0) {
                    for (let i = 0; i < g.getLayers().length; i++) {
                        g.getLayers()[i].getLayers().forEach((f) => {
                            if (f.options.wfid == tw) {
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
            let x = th.getAttribute('data-x'),
                y = th.getAttribute('data-y'),
                lay = perimeters.getLayers()[x].getLayers()[y];

            map.fitBounds(lay.getBounds());
            lay.openPopup();
        } else if (type == 'city' || type == 'gis') {
            if (type == 'city') {
                await fetch('https://nominatim.openstreetmap.org/search.php?q=' + th.getAttribute('title').replace('<b>', '').replace('</b>', '') + '&polygon_geojson=1&format=jsonv2')
                    .then(async (resp) => {
                        const g = await resp.json(),
                            p = g[0].display_name.split(',');

                        gm = L.geoJSON(g[0].geojson, {
                            style: function (feature) {
                                return {
                                    weight: 2,
                                    fillOpacity: 0.1,
                                    opacity: 0.3,
                                    color: '#1da1f2'
                                }
                            }
                        }).bindPopup('<div style="color:#222;text-align:center;font-family:var(--roboto)"><h2 style="margin-bottom:0.25em">' + p[0] + '</h2><p>' + p[1] + ' &middot; ' + p[2] + (p.length > 4 ? ' &middot; ' + p[3] : '') + '</p></div>', {
                            minWidth: 250,
                            maxWidth: 300
                        }).on('popupclose', () => {
                            map.removeLayer(gm);
                        }).addTo(map);

                        map.fitBounds(gm.getBounds());
                        gm.openPopup();
                    });
            } else {
                gm = L.marker([lat, lon]).bindPopup('<span style="color:#282829">' + e.target.getAttribute('title') + '</span>', {
                    maxWidth: 250
                }).addTo(map).openPopup().on('popupclose', function (e) {
                    map.removeLayer(gm);
                });

                map.setView([lat, lon], 12);
            }
        } else if (type == 'state') {
            map.setView([lat, lon], 7);
        }
    }

    /* cancel new report */
    if (e.target.id == 'cancelNewRpt') {
        nrMrkr.closePopup().removeFrom(map);
        closeImpact();
        document.querySelector('#newReport').remove();
        document.querySelector('#map').style.cursor = 'auto';
        document.querySelector('li#report').setAttribute('data-active', '0');
    }
});

document.addEventListener('submit', async (e) => {
    if (e.target.id == 'newReport') {
        let error = false,
            errorMsg = '';
        e.preventDefault();
        e.stopPropagation();

        if (document.querySelector('#nrerrors')) {
            document.querySelector('#nrerrors').remove();
        }

        /* error checking */
        if (document.querySelector('#newReport select[name=type]').options[document.querySelector('#newReport select[name=type]').selectedIndex].value == '- Choose -') {
            error = true;
            errorMsg += '<li>Please choose an incident type</li>';
        }

        if (document.querySelector('#newReport input[name=size]').value == '') {
            error = true;
            errorMsg += '<li>Please estimate the size of the fire (even if it\'s 0)</li>';
        } else if (!document.querySelector('#newReport input[name=size]').value.match(/([0-9.]+)/)) {
            error = true;
            errorMsg += '<li>Your incident size cannot contain non-numeric characters</li>'
        }

        if (document.querySelector('#newReport textarea[name=notes]').value == '') {
            error = true;
            errorMsg += '<li>Please provide some details about this incident</li>';
        }

        if (error === true) {
            document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<ul id="nrerrors" style="margin-left:20px">' + errorMsg + '</ul>');
        } else {
            if (confirm('Are you sure this is a new incident? If so, click "OK." Otherwise, please click "Cancel."')) {
                const sub = document.querySelector('#newReport input[type=submit]'),
                    canc = document.querySelector('#newReport .btn-group a');

                document.querySelector('li#report').setAttribute('data-active', '0');
                sub.insertAdjacentHTML('afterend', '<div class="spinner s2" style="width:25px;height:25px"></div>');
                sub.disabled = true;
                sub.value = 'Submitting...';
                canc.style.display = 'none';

                await fetch(apiUrl('newReport', 2), {
                    method: 'POST',
                    body: new URLSearchParams(new FormData(document.querySelector('form#newReport')))
                }).then(async (resp) => {
                    const r = await resp.json();

                    if (r.success == 1) {
                        nrMrkr.closePopup().removeFrom(map);
                        closeImpact();
                        document.querySelector('#newReport').remove();
                        notify('success', 'Your report was sent to us for review before it may be added to the map.');
                    } else {
                        document.querySelector('#newReport .spinner').remove();
                        sub.disabled = false;
                        sub.value = 'Submit Report';
                        canc.style.display = 'block';

                        notify('error', 'There was an error submitting your report. Please try again.');
                    }
                });
            }
        }
    }
});

window.onpopstate = (e) => {
    /* if URL is supposed to open an incident */
    if (window.location.pathname.search('/fires') >= 0) {
        let id = window.location.pathname.split('/')[2];
        new Wildfires().fireDetails(id, true);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/alert') >= 0) {
        let id = window.location.pathname.split('/')[3];
        readWWA(id);
    }

    /* if URL is supposed to open a weather alert */
    if (window.location.pathname.search('/weather/outlook') >= 0) {
        let s = window.location.pathname.split('/');
        readSPCText(s[3], s[4]);
    }

    /* if URL is supposed to open nws fire wx fcst */
    if (window.location.pathname.search('/weather/fire') >= 0) {
        let s = window.location.pathname.split('/');
        fireFcst(s[3], s[4], zn = '');
    }

    /* if URL is supposed to open risk data for a county */
    if (window.location.pathname.search('/risk') >= 0) {
        let id = window.location.pathname.split('/')[2];
        viewRisk(id);
    }
};

/* check if user is connected to a network or not */
window.addEventListener('offline', (e) => {
    connection(navigator.onLine);
});

window.addEventListener('online', (e) => {
    connection(navigator.onLine);
});

/* save scroll position on certain divs */
document.querySelector('#impact .wrapper').addEventListener('scroll', () => {
    localStorage.setItem('layers_scrollTop', document.querySelector('#impact .wrapper').scrollTop);
});