let map,
    settings,
    basemaps = {
        'light': 'mapbox://styles/mapollc/cm2kmozef00wi01ps649r2lgl',
        'dark': 'mapbox://styles/mapollc/cm33jv42500un01pw5skw9dqr'
    },
    siteTitle = document.title,
    menuLoaded = false,
    modal = null,
    radar = null,
    radarImgs = [],
    radarAnim,
    nwsAlerts = [],
    globalData = {
        roadReports: [],
        rwis: [],
        roadWork: [],
        webcams: [],
        incidents: [],
        varMsgSigns: [],
        snowPlows: []
    },
    roadNetwork = [],
    roads,
    calculate,
    helpers,
    roadsArray = [],
    roadsIDArray = [],
    dialog = '<div class="wrapper"><h1></h1><p></p><div class="buttons"><a href="#" id="neg" class="cta" onclick="return false"></a><a href="#" id="pos" class="cta" onclick="return false"></a></div></div>',
    noRes = '<div id="result" class="none">Searching...</div>';

const curtime = new Date(),
    yr = curtime.getFullYear(),
    disclaimer = 'OregonRoads is a third-party app built by MAPO LLC. The data and information used in this app is provided by the ' +
        'Oregon Department of Transportation (ODOT)&mdash;an official government agency. However, this app is not an official government app, and is not affiliated or ' +
        'associated with ODOT or the State of Oregon in any way. Please acknowledge that you read and agree with this disclaimer.';

const config = {
    queryParams: window.location.href.split('oregonroads/')[1],
    host: 'https://www.mapotechnology.com/',
    apiURL: 'https://api.mapotechnology.com/v1/',
    imgPath: 'assets/images/oreroads/',
    apiKey: () => { return 'c196d0958608ad2b7d4af2be078ecc54'; },
    mapboxToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    summerMode: (curtime.getTime() >= new Date('4/15/' + yr + ' 00:00:00').getTime() && curtime.getTime() <= new Date('10/15/' + yr + ' 23:59:59').getTime() ? true : false),
    dataStatus: {
        rwRetrieved: false,
        rwisRetrieved: false,
        incidentsRetrieved: false,
        webcamsRetrieved: false,
        plowsRetrieved: false,
        dmsRetrieved: false,
        roadWorkRetrieved: false
    }
};
const userBaseMap = localStorage.getItem('basemap'),
    layersList = [
        {
            'layer': 'roads',
            'name': 'Road Conditions',
            'default': config.summerMode ? false : true,
            'desc': 'See current road conditions on interstates and highways'
        },
        {
            'layer': 'webcams',
            'name': 'Travel Cameras',
            'default': true,
            'desc': 'Live images of road &amp; weather conditions'
        },
        {
            'layer': 'rwis',
            'name': 'Live Weather',
            'default': config.summerMode ? false : true,
            'desc': 'Live weather conditions information'
        },
        {
            'layer': 'incidents',
            'name': 'Incidents',
            'default': true,
            'desc': 'Current incidents and closures impacting highways'
        },
        {
            'layer': 'plows',
            'name': 'Snow Plows',
            'default': config.summerMode ? false : true,
            'desc': 'See where ODOT snow plows are working'
        },
        {
            'layer': 'vms',
            'name': 'Dynamic Message Signs',
            'default': false,
            'desc': 'See current messages on roadside variable signs'
        },
        {
            'layer': 'traffic',
            'name': 'Traffic',
            'default': config.summerMode ? true : false,
            'desc': 'Display real-time traffic conditions from MapBox'
        },
        {
            'layer': 'construction',
            'name': 'Road Work',
            'default': config.summerMode ? true : false,
            'desc': 'Display road &amp; bridge maintenance and construction projects'
        },
        {
            'layer': 'radar',
            'name': 'Weather Radar',
            'default': false,
            'desc': 'Show live weather radar across the state'
        }
    ],
    metro = [
        {
            name: 'Portland',
            center: [45.434599, -122.655487],
            zoom: 11
        },
        {
            name: 'Salem',
            center: [44.916194, -122.940444],
            zoom: 11
        },
        {
            name: 'Eugene',
            center: [44.050583, -123.033142],
            zoom: 11
        },
        {
            name: 'Medford/Ashland',
            center: [42.273244, -122.783203],
            zoom: 10
        },
        {
            name: 'Bend',
            center: [44.056258, -121.272583],
            zoom: 11.5
        },
        {
            name: 'Santiam/Redmond',
            center: [44.351350, -121.495056],
            zoom: 11
        },
        {
            name: 'Columbia Gorge',
            center: [45.5953, -121.1642],
            zoom: 10.7
        },
        {
            name: 'Pendleton to La Grande',
            center: [45.477947, -118.313140],
            zoom: 11
        },
        {
            name: 'Cabbage Hill',
            center: [45.592509, -118.610715],
            zoom: 14
        },
        {
            name: 'Ladd Canyon',
            center: [45.171872, -117.959518],
            zoom: 11
        }
    ],
    cities = [
        { "city": "La Grande", "lat": 45.3246, "lon": -118.0877 }
    ];

function isVisible(el) {
    if (el == null) {
        return false;
    } else {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
}

function hideLoading() {
    if (isVisible(document.querySelector('#loading'))) {
        document.querySelector('#loading').remove();
    }

    const logo = document.querySelector('.logo');
    if (logo && !isVisible(logo)) logo.style.display = 'block';
}

function Snackbar(m) {
    document.body.insertAdjacentHTML('beforeend', '<div class="snackbar">' + m + '</div>');
    animate(document.querySelector('.snackbar'), 16, 'bottom');
}

function createDialog(t, m, neg = false, pb = 'Ok', nb = '') {
    if (document.querySelector('.dialog') != null) {
        document.querySelector('.dialog').remove();
    }

    const d = document.createElement('div');

    d.innerHTML = dialog;
    d.classList.add('dialog');
    document.body.appendChild(d);
    document.querySelector('.dialog h1').innerHTML = t;
    document.querySelector('.dialog p').innerHTML = m.replaceAll('..', '.');
    document.querySelector('.dialog #pos').innerHTML = pb;

    if (!neg) {
        document.querySelector('.dialog #neg').remove();
    } else {
        document.querySelector('.dialog #neg').innerHTML = nb;
    }

    document.querySelector('.backdrop').style.display = 'block';
}

function counterpart(tf) {
    const counterparts = {
        'tollgate wb': 'tollgate eb',
        'tollgate eb': 'tollgate wb',
        'siskiyou summit nb': 'siskiyou summit sb',
        'siskiyou summit sb': 'siskiyou summit nb',
        'meacham eb': 'meacham wb',
        'meacham wb': 'meacham eb',
        'ladd canyon eb': 'ladd canyon wb',
        'ladd canyon wb': 'ladd canyon eb',
        'pleasant valley eb': 'pleasant valley wb',
        'pleasant valley wb': 'pleasant valley eb',
        'cabbage hill eb': 'cabbage hill wb',
        'cabbage hill wb': 'cabbage hill eb',
        'perry wb': 'perry eb',
        'perry eb': 'perry wb'
    };

    return counterparts[tf] || '';
}

class Calculate {
    distance(lat1, lon1, lat2, lon2) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c;

        return (d / 1.609);
    }

    deg2rad(d) {
        return d * (Math.PI / 180);
    }

    rad2deg(r) {
        return r * (180 / Math.PI);
    }

    getBearing(a, b, c, d) {
        a = this.deg2rad(a);
        b = this.deg2rad(b);
        c = this.deg2rad(c);
        d = this.deg2rad(d);

        const y = Math.sin(d - b) * Math.cos(c);
        const x = Math.cos(a) * Math.sin(c) - Math.sin(a) * Math.cos(c) * Math.cos(d - b);
        const brng = this.rad2deg(Math.atan2(y, x));

        return this.getCompassDirection((brng + 360) % 360);
    }

    direction(dir) {
        const labels = {
            NB: 'Northbound',
            SB: 'Southbound',
            EB: 'Eastbound',
            WB: 'Westbound'
        };

        return labels[dir];
    }

    getCompassDirection(d) {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return directions[Math.round(d / 22.5) % 16];
    }

    rh(t, td) {
        const a = 17.625,
            b = 243.04;

        return (100 * (Math.exp((a * td) / (b + td)) / Math.exp((a * t) / (b + t)))).toFixed(1);
    }

    windChill(t, w) {
        if (t >= 60 || !w) return null;

        return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(w, 0.16)) + (0.4275 * t * Math.pow(w, 0.16)));
    }
}

class Helpers {
    roadName(s) {
        return s.replace(/((OR)([0-9]+))/gm, '$2E$3')
            .replace(/((I)([0-9]+))/gm, '$2-$3');
    }

    compileReports(name) {
        const tf = name.toLowerCase(),
            s = counterpart(tf)?.toLowerCase();

        return globalData.roadReports.filter(ea => {
            const roadName = ea.name.toLowerCase();
            return roadName === tf || (s && roadName === s);
        });
    }

    nearestCity(a, b) {
        const theCity = [],
            theDist = [],
            theBear = [];

        cities.forEach((c) => {
            const dist = calculate.distance(c.lat, c.lon, a, b);
            const bear = calculate.getBearing(c.lat, c.lon, a, b);
            theCity.push(c.city);
            theDist.push(dist);
            theBear.push(bear);
        });

        const min = Math.min.apply(null, theDist);
        return min.toFixed(1) + ' miles ' + theBear[theDist.indexOf(min)] + ' of ' + theCity[theDist.indexOf(min)] + ', OR';
    }

    incidentStyle(type) {
        let ty, col;

        if (type == 'Crash') {
            ty = 'triangle-exclamation';
            col = '#e65100';
        } else if (type == 'Closure') {
            ty = 'do-not-enter';
            col = '#dc3545';
        } else {
            ty = 'diamond-exclamation';
            col = '#fcc733';
        }

        return { icon: ty, color: col };
    }

    fetchRWIS(id) {
        const filter = globalData.rwis.filter(stn => stn.properties.id === id);

        return filter[0] ?? null;
    }

    getIncident(id, construct = false) {
        const item = construct ? globalData.roadWork : globalData.incidents,
            inc = item.filter(i => i.properties.id == id);

        return inc[0] ?? null;
    }

    gripHelper(g) {
        const thresholds = [
            { min: 0.81, label: 'Dry', desc: 'Ideal conditions' },
            { min: 0.6, label: 'Dry or generally wet', desc: 'Very good' },
            { min: 0.5, label: 'Forming snow pack or ice', desc: 'Okay' },
            { min: 0.45, label: 'Snow-covered or icy', desc: 'Fair' },
            { min: 0.4, label: 'Packed snow or snow-covered', desc: 'Poor' },
            { min: 0.3, label: 'Icy', desc: 'Very poor' },
            { min: 0, label: 'Ice-covered', desc: 'Extremely poor' }
        ];

        const entry = thresholds.find(t => g >= t.min);
        return [entry.desc, entry.label];
    }

    grip(v) {
        const [desc, label] = this.gripHelper(v);
        const msg = `A surface friction of ${v} is usually ${desc.toLowerCase()} and the road is likely ${label.toLowerCase()}.`;
        createDialog('Road Grip', msg);
    }

    timeAgo(t, w, c) {
        const plural = (v) => { return v > 1 ? 's' : ''; },
            subUnit = (d, s, r) => { return Math.floor(((d / s) - Math.floor(d / s)) * r); },
            now = c ?? Date.now(),
            timestamp = t.toString().length === 10 ? t * 1000 : t,
            d = Math.round((now - timestamp) / 1000);

        if (d < 10) return 'Just now';

        const ranges = [
            { limit: 60, unit: 'sec', div: 1, sub: null },
            { limit: 3600, unit: 'min', div: 60, sub: { div: 60, unit: 'sec' } },
            { limit: 86400, unit: 'hour', div: 3600, sub: { div: 60, unit: 'min' } },
            { limit: 172800, unit: 'day', div: 86400, sub: { div: 24, unit: 'hour' } },
            { limit: 604800, unit: 'day', div: 86400 },
            { limit: 2419200, unit: 'week', div: 604800 },
            { limit: 31536000, unit: 'month', div: 2419200 },
            { limit: Infinity, unit: 'year', div: 31536000 }
        ];

        const range = ranges.find(r => d < r.limit);
        let val = Math.floor(d / range.div) + ' ' + range.unit + plural(Math.floor(d / range.div));

        if (range.sub) {
            const subVal = subUnit(d, range.div, range.sub.div);
            if (subVal !== 0) {
                val += `,&nbsp;${subVal} ${range.sub.unit}${plural(subVal)}`;
            }
        }

        if (w === 1) val = val.split(',')[0];

        return val + ' ago';
    }
}

async function api(uri, fields = null, v2 = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu') || url.includes('mapbox.com'),
        isInternal = url.includes(config.apiURL) || url.includes(config.apiURL.replace('v1', 'v2')) || url.includes(config.host),
        ops = {
            method: isExternal ? 'GET' : 'POST'
        },
        fd = new FormData();

    if (isInternal) fd.append('key', config.apiKey());

    if (fields && Array.isArray(fields)) {
        for (const [k, v] of fields) {
            fd.append(k, v);
        }
    }

    if (!isExternal) ops['body'] = fd;

    try {
        const resp = await fetch(url, ops);

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`HTTP error! Status: ${resp.status}, URL: ${url}, Response: ${errorText}`);

            return null;
        }

        // Attempt to parse JSON
        result = await resp.json();
    } catch (e) {
        console.error(`Fetch or JSON parsing error for URL: ${url}`, e.message);
        result = null
    }

    return result;
}

function removeHash() {
    const newUrl = window.location.origin + '/oregonroads' + (window.location.search.search('version') ? window.location.search : '') + window.location.hash;
    window.history.pushState({}, siteTitle, newUrl);
    document.title = siteTitle;
}

function handleURIIntents() {
    if (!config.queryParams) {
        if (modal?.style.display === 'flex') {
            modal.style.display = 'none';
            modal.classList.remove('full', 'disclaimer');
        }
        return;
    }

    const flyTo = (center, zoom = null) => {
        map.flyTo({
            center,
            zoom: zoom ?? map.getZoom() + 2.5
        });
    };

    const updateURI = (title = '') => {
        if (title) document.title = `${title} | ${siteTitle}`;
    };

    const router = new Router(config.queryParams);
    const type = router.type();
    const theID = router.id();

    const buildLocationTitle = (p) =>
        `${p.type} @ ${p.location.hwy} MP ${p.location.milepost.start}` +
        (p.location.milepost.end ? `-${p.location.milepost.end}` : '') +
        (p.location.direction ? ` ${p.location.direction}` : '');

    const ready = {
        'road-segment': () =>
            config.dataStatus.rwRetrieved && config.dataStatus.rwisRetrieved && config.dataStatus.incidentsRetrieved &&
            config.dataStatus.roadWorkRetrieved && config.dataStatus.dmsRetrieved && config.dataStatus.webcamsRetrieved,

        'road-report': () => config.dataStatus.rwRetrieved,
        'rwis': () => config.dataStatus.rwisRetrieved,
        'incident': () => config.dataStatus.incidentsRetrieved,
        'construction': () => config.dataStatus.roadWorkRetrieved,
        'dms': () => config.dataStatus.dmsRetrieved,
        'camera': () => config.dataStatus.webcamsRetrieved,
        'area': () => true
    };

    const handlers = {
        'road-segment': () => {
            const data = JSON.parse(atob(theID));
            const report = helpers.compileReports(data.name);

            new RoadNetwork(
                data.lat,
                data.lon,
                data.hwy
            ).getRange(
                report,
                data.name,
                false
            );
        },
        'road-report': () => {
            const reports = roads.features.filter(r => r.properties.id == theID);

            if (!reports.length) return;

            const s = counterpart(reports[0].properties.name.toLowerCase());

            roads.features.forEach(r => {
                if (r.properties.name.toLowerCase() === s.toLowerCase()) {
                    reports.push(r.properties);
                }
            });

            updateURI(`Road Report for ${reports[0].name}`);
            new Modal(reports).roadReport(reports[0].name);
        },

        'rwis': () => {
            const f = helpers.fetchRWIS(theID);
            if (!f) return;

            const cams = globalData.webcams.filter(cam =>
                calculate.distance(
                    f.geometry.coordinates[1],
                    f.geometry.coordinates[0],
                    cam.geometry.coordinates[1],
                    cam.geometry.coordinates[0]
                ) <= 1
            );

            updateURI(`Current Weather: ${f.properties.station.name}`);
            new Modal(f.properties).rwis(cams);
        },
        'incident': () => {
            const inc = helpers.getIncident(theID);

            if (!inc) {
                createDialog(
                    'Incident Not Found',
                    `We are unable to locate incident #${theID}. It may already be resolved or it doesn't exist.`
                );
                return;
            }

            updateURI(buildLocationTitle(inc.properties));
            new Modal(inc.properties).incident();
        },
        'construction': () => {
            const match = helpers.getIncident(theID, true);
            if (!match) return;

            if (match.geometry.type === 'Point') {
                flyTo(match.geometry.coordinates);
            } else {
                map.fitBounds(match.geometry.coordinates);
            }

            updateURI(buildLocationTitle(match.properties));
            new Modal(match.properties).incident();
        },
        'dms': () => {
            if (!globalData.varMsgSigns.length) return;

            const sign = globalData.varMsgSigns.features.find(s => s.properties.id == theID);
            if (!sign) return;

            flyTo(sign.geometry.coordinates);
            updateURI(sign.properties.name);
            new Modal(sign.properties).vms();
        },
        'camera': () => {
            let geo = null;
            let firstName = '';
            const cams = [];

            globalData.webcams.forEach(w => {
                w.properties.cameras.forEach(cam => {
                    if (cam.id == theID) {
                        firstName = cam.name;
                        geo = w.geometry.coordinates;
                        cams.push(cam);
                    }
                });
            });

            if (!geo) return;

            flyTo(geo);
            updateURI(firstName);
            new Modal(cams).webcam(geo);
        },
        'area': () => {
            let area = theID
                .replaceAll('-', ' ')
                .split(' ')
                .map(w => (w === 'to' ? w : w[0].toUpperCase() + w.slice(1)))
                .join(' ');

            if (!theID.includes('to')) area = area.replace(' ', '/');

            const match = metro.find(m => m.name === area);
            if (!match) return;

            map.flyTo({
                center: [match.center[1], match.center[0]],
                zoom: match.zoom
            });

            updateURI(`${match.name} Area Road Conditions`);
        }
    };

    const intvl = setInterval(() => {
        if (!ready[type]?.()) return;

        handlers[type]?.();
        clearInterval(intvl);
    }, 200);
}

class Router {
    constructor(qp) {
        this.params = qp;
        this.map = ['type', 'id', 'extra'];
        this.route = [];
        this.params = this.params.split('?')[0].split('#')[0].split('/');

        for (let i = 0; i < this.params.length; i++) {
            this.route[this.map[i]] = this.params[i];
        }
    }

    type() {
        return this.route.type ? this.route.type : null;
    }

    id() {
        return this.route.id ? this.route.id : null;
    }

    extra() {
        return this.route.extra ? this.route.extra : null;
    }
}

class Settings {
    constructor(u) {
        this.user = u;
        this.role = this.user?.role ?? 'GUEST';
        this.settings = u != null && u.settings.allsettings ? u.settings.allsettings : this.defaultSettings;

        if (this.getRoadReports() != null) {
            localStorage.setItem('favorites_roadReports', JSON.stringify(this.getRoadReports()));
        }

        if (this.getRWIS() != null) {
            localStorage.setItem('favorites_rwis', JSON.stringify(this.getRWIS()));
        }

        if (this.getCameras() != null) {
            localStorage.setItem('favorites_cameras', JSON.stringify(this.getCameras()));
        }
    }

    subscriptions() {
        const sub = new Subscription(this.user);

        return {
            valid: () => {
                return sub.valid();
            },
            customerID: () => {
                return sub.cid();
            },
            subID: () => {
                return sub.sid();
            },
            name: () => {
                return sub.name();
            },
            plan: () => {
                return sub.plan();
            },
            isTrial: () => {
                return sub.isTrial();
            },
            expires: () => {
                return sub.expires();
            }
        }
    }

    getUser() {
        return {
            getName: () => {
                return {
                    first: () => {
                        return this.user?.first_name ?? null;
                    },
                    last: () => {
                        return this.user?.last_name ?? null;
                    },
                    full() {
                        return this.user ? `${this.user.first_name} ${this.user.last_name}` : null;
                    }
                };
            },
            role: () => {
                return this.user ? this.role : null;
            },
            token: () => {
                return this.user?.token ?? null;
            },
            uid: () => {
                return this.user?.uid ?? null;
            },
            synced: () => {
                return this.user?.settings.synced ?? null;
            }
        };
    }

    favorites() {
        return this.user == null ? null : this.user.settings.oreroads;
    }

    getCameras() {
        return this.user == null ? null : (this.user.settings.oreroads ? this.user.settings.oreroads.cameras : null);
    }

    getRoadReports() {
        return this.user == null ? null : (this.user.settings.oreroads ? this.user.settings.oreroads.roadReports : null);
    }

    getRWIS() {
        return this.user == null ? null : (this.user.settings.oreroads ? this.user.settings.oreroads.rwis : null);
    }

    getSyncTime() {
        return this.user == null ? null : this.user.settings.synced
    }

    syncFavorites(success = false) {
        const save = async (success) => {
            let data = {
                "roadReports": JSON.parse(localStorage.getItem('favorites_roadReports')),
                "rwis": JSON.parse(localStorage.getItem('favorites_rwis')),
                "cameras": JSON.parse(localStorage.getItem('favorites_cameras'))
            };

            //const sync = Math.round(new Date().getTime() / 1000);

            const response = await api(config.apiURL + 'oreroads', [
                ['token', settings.getToken()],
                ['settings', JSON.stringify(data)]
            ]);

            if (response) {
                if (response.success == 1) {
                    if (success) {
                        createDialog('Sync Success', 'Your favorite road reports, cameras, and weather stations were successfully synced to your account.');
                    }
                    console.info('User favorites were successfully synced.');
                } else {
                    if (success) {
                        createDialog('Sync Error', 'There was an error syncing your favorite road reports, cameras, and weather stations to your account.');
                    }
                    console.error('There was en error syncing user favorites.');
                }
            }
        };

        if (settings.user != null) {
            save(success);
        } else {
            return null;
        }
    }

    isFavorite(cat, id) {
        const s = localStorage.getItem('favorites_' + cat);

        if (s == null || s == 'null' || s == '') {
            return false;
        } else {
            return (JSON.parse(s).includes(id) ? true : false);
        }
    }

    doFavorites(action, category, id, title) {
        const key = `favorites_${category}`;
        const cur = localStorage.getItem(key);
        let favorites = cur && cur !== 'null' ? JSON.parse(cur) : [];

        id = id.toString();

        if (action === 'add') {
            if (favorites.includes(id)) {
                console.error('This item already exists in the user\'s favorites');
            } else {
                favorites.push(id);
                localStorage.setItem(key, JSON.stringify(favorites));
                Snackbar(`${title} was successfully added to your favorites.`);
            }
        } else if (action === 'remove') {
            favorites = favorites.filter(e => e !== id);
            localStorage.setItem(key, JSON.stringify(favorites));
            Snackbar(`${title} was successfully removed from your favorites.`);
        }

        localStorage.setItem('modTime', Math.floor(Date.now() / 1000));
    }
}

class Geo {
    constructor(lat, lon, zoom) {
        this.lat = lat;
        this.lon = lon;
        this.zoom = zoom;
    }

    saveLocation() {
        localStorage.setItem('map_lat', this.lat);
        localStorage.setItem('map_lon', this.lon);
        localStorage.setItem('map_zoom', this.zoom);
    }

    getLocation() {
        return [
            localStorage.getItem('map_lat'),
            localStorage.getItem('map_lon'),
            localStorage.getItem('map_zoom')
        ];
    }
}

class RoadNetwork {
    constructor(lat = null, lon = null, road = null) {
        this.lat = lat;
        this.lon = lon;
        this.road = road;
        this.ROAD_RANGE_DIST = 10;

        this.reportTemplate = '<span id="close"></span><h1 style="margin-bottom:0.5em;align-items:center"></h1><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="rw">Road</li><li class="tab" data-tab="wx">Weather</li>' +
            '<li class="tab" data-tab="cams">Cameras</li><li class="tab" data-tab="incs">Incidents</li></ul><div class="tab-content"><div class="content active" data-tab="rw">Loading...</div>' +
            '<div class="content" data-tab="wx">Loading...</div><div class="content" data-tab="cams">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>';
    }

    mileposts(json) {
        if (!json?.features?.length) return;

        roadNetwork = json.features
            .map(f => ({
                id: String(f.properties.HWYNUMB),
                name: f.properties.HWYNAME,
                mp: Number(f.properties.MP_DISP.split('.')[0]),
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0]
            }))
            .sort((a, b) => a.id.localeCompare(b.id) || a.mp - b.mp);
    }

    getRange(report, rn, isClick = false) {
        const roadMatch = roadNetwork.find(e => e.id === this.road);
        if (!roadMatch) return '';

        const name = roadMatch.name;

        const candidates = roadNetwork.filter(rn =>
            rn.name === name &&
            calculate.distance(this.lat, this.lon, rn.lat, rn.lon) <= this.ROAD_RANGE_DIST / 2
        );

        if (!candidates.length) return '';

        const mpValues = candidates.map(c => Number(c.mp));
        const minMP = Math.min(...mpValues);
        const maxMP = Math.max(...mpValues);

        const mp1 = candidates.find(f => f.mp === minMP);
        const mp2 = candidates.find(f => f.mp === maxMP);

        this.listFeatures(mp1, mp2, report);

        return `${mp1.mp}-${mp2.mp}`;
    }

    listFeatures(a, b, report) {
        const hwy = helpers.roadName(report[0].hwy);
        const start = Math.min(a.mp, b.mp);
        const end = Math.max(a.mp, b.mp);

        const isBetween = (num) => (num >= start && num <= end) || (num <= start && num >= end);

        const features = {
            meta: { hwy, start: a.mp, end: b.mp },
            rw: report,
            rwis: [],
            webcams: [],
            incidents: [],
            construction: []
        };

        const incidentIDs = new Set();

        // get RWIS
        globalData.rwis.forEach(f => {
            const st = f.properties.station;

            if (st.hwy === hwy.replace('-', '') && isBetween(st.mp)) {
                features.rwis.push(f);
            }
        });

        // get travel cameras
        globalData.webcams.forEach(f => {
            const cam = f.properties.cameras?.[0];

            if (cam && cam.hwy === hwy && isBetween(cam.milepost)) {
                features.webcams.push(f);
            }
        });

        // get incidents
        globalData.incidents.forEach(f => {
            const { id, location } = f.properties;
            if (incidentIDs.has(id)) return;
            if (location.hwy !== hwy) return;

            const { start: mpStart, end: mpEnd } = location.milepost;

            if (f.geometry.type === 'Point') {
                if (isBetween(mpStart) || (mpEnd && isBetween(mpEnd))) {
                    incidentIDs.add(id);
                    features.incidents.push(f.properties);
                }
            } else {
                if (isBetween(start) || isBetween(end)) {
                    incidentIDs.add(id);
                    features.incidents.push(f.properties);
                }
            }
        });

        const bounds = new mapboxgl.LngLatBounds()
            .extend([a.lon, a.lat])
            .extend([b.lon, b.lat]);

        map.fitBounds(bounds, { padding: 60 });

        this.displayFeatures(features);
    }

    itemHeader(name, updated) {
        return `<h2>${name}</h2>${updated != null ? `<span class="updated">${updated}</span>` : ''}`;
    }

    displayFeatures(report) {
        const processor = new Modal();
        modal.innerHTML = this.reportTemplate;

        const tabs = modal.querySelector('ul.tabs');
        const tabContent = modal.querySelector('.tab-content');
        const buildSection = (items = [], emptyMsg) => items.length ? items.join('<hr>') : emptyMsg;

        tabs.addEventListener('click', (e) => {
            onTabClickListener(tabs, tabContent, e);
        });
        tabContent.scrollTo({ top: 0, behavior: 'smooth' });

        modal.querySelector('h1').innerHTML = `Report for ${report.meta.hwy} from MP ${report.meta.start} - ${report.meta.end}`;

        // work through RWIS
        const rwisContent = buildSection(
            (report.rwis ?? []).forEach(rwis => {
                if (!rwis?.properties) return '';
                const { station, surface, weather } = rwis.properties;
                return this.itemHeader(`${station.name}${processor.genFav('rwis', station.id, station.name)}`, null) +
                    processor.processRWIS([], station, surface, weather, rwis.properties.updated);
            }),
            'There are no RWIS in this area.'
        );

        // work through cameras
        const cameraContent = buildSection(
            (report.webcams ?? []).flatMap(json =>
                (json?.properties?.cameras ?? []).map(cam =>
                    this.itemHeader(`${cam?.name}${processor.genFav('cameras', cam?.id, cam?.name)}`) +
                    processor.processCameras(null, cam)
                )
            ),
            'There are no travel cameras in this area.'
        );

        // work through incidents
        const incidentContent = buildSection(
            (report.incidents ?? []).map(inc => {
                if (!inc) return '';
                const { icon, color } = helpers.incidentStyle(inc.type);
                const header = `<h2><i class="fa-solid fa-${icon}" style="color:${color};margin-right:0.75em"></i>${inc.type}</h2>`;

                return header + processor.processIncidents(inc, inc.location, true);
            }),
            'There are no incidents reported in this area.'
        );

        // work through road reports
        const rwContent = buildSection(
            (report.rw ?? []).map(rw =>
                this.itemHeader(
                    `${rw.name}${processor.genFav('roadReports', rw.name, rw.name)}`,
                    `Last report ${helpers.timeAgo(rw.updated)}`
                ) + processor.processRoadReports(rw)
            ),
            'There are no road reports in this area.'
        );

        // inject into modal
        const list = { rw: rwContent, wx: rwisContent, cams: cameraContent, incs: incidentContent };

        Object.keys(list).forEach(key => {
            modal.querySelector(`.content[data-tab="${key}"]`).innerHTML = list[key];
        });

        // finally, show modal
        modal.classList.add('full');
        modal.style.display = 'flex';
    }
}

class Modal {
    constructor(json, origin = false) {
        this.json = json;
        this.origin = origin;
        this.closeBtn = '<span id="close"></span>';
        this.template = `${this.closeBtn}<h1 style="align-items:center"></h1><span class="updated"></span><div class="rows"></div>`;
        this.template2 = `${this.closeBtn}<h1 style="align-items:center"></h1><div class="popup-content"></div>`;
    }

    updateURI(type, id, title = '') {
        if (origin) {
            const newURL = window.location.origin + '/oregonroads/' + type + '/' + id + (window.location.search.search('version') ? window.location.search : '') + window.location.hash;
            window.history.pushState({}, (title ? title + ' | ' + siteTitle : ''), newURL);
        }

        if (title) {
            document.title = title + ' | ' + siteTitle;
        }
    }

    vms() {
        let messages,
            thetype = typeof this.json.messages;

        if (thetype != 'string') {
            this.json.messages = JSON.parse(JSON.stringify(this.json.messages));
            messages = this.json.messages;
        } else {
            messages = this.json.messages ? JSON.parse(this.json.messages) : null;
        }

        let msg = `${messages[0][0]}<br>${messages[0][1]}<br>${messages[0][2]}`;

        if (messages[1]) {
            msg += `<br><span style="font-weight:100">------------------------------------------------------</span><br>
                ${messages[1][0]}<br>${messages[1][1]}<br>${messages[1][2]}`;
        }

        this.actions().create(this.json.name);
        this.actions().setContent(`<div class="vmsMsg">${msg}</div>${this.json.attached ? `<small>This message is in relation to incident #${this.json.attached}.</small>` : ''}`);

        this.updateURI('dms', this.json.id, this.json.name);
    }

    processRoadReports(data) {
        let rows = `<div class="line"><div class="de">Temperature</div><span>${data.temp}&deg;F</span></div>
            <div class="line"><div class="de">Road Conditions</div><span${data.road.id == 3 ? ' class="bi"' : ''}>${data.road.condition}</span></div>
            <div class="line"><div class="de">Weather</div><span>${data.weather}</span></div>
            <div class="line"><div class="de">New Snow</div><span>${data.snow.new == null ? 'N/A' : (data.snow.new == 'Trace' ? 'Trace' : `${data.snow.new}&nbsp;in`)}</span></div>
            <div class="line"><div class="de">Roadside Snow</div><span>${data.snow.roadside == null ? 'N/A' : (data.snow.roadside == 'Trace' ? 'Trace' : `${data.snow.roadside}&nbsp;in`)}</span></div>
            ${data.notes ? `<div class="line m"><div class="de">Comments</div><span>${data.notes}</span></div>` : ''}
            ${data.restrict.cmv.restrict ? `<div class="line m"><div class="de">Commerical Vehicle Restrictions</div><span>${data.restrict.cmv.restrict}</span></div>` : ''}
            ${data.restrict.chains.cond != 0 ? `<div class="sz"><h3>Snow Zone</h3><p>${data.restrict.chains.desc}</p></div>` : ''}
            <small>This data is reported by ODOT maintenance crews five times per day and at other times when conditions change significantly.</small>`;

        return rows;
    }

    roadReport(name, int = 0) {
        if (this.json.length == 0) {
            createDialog('No Report', 'Currently, there is no road report for ' + name + '.');
            return;
        }

        const data = this.json[int];

        this.actions().create(`${data.name} (${roadName(data.hwy)})` + this.genFav('roadReports', data.name, data.name));
        this.actions().rows(this.processRoadReports(data));
        this.actions().updated(`Last report ${timeAgo(data.updated)}`);

        if (data.restrict.chains.cond != 0 && data.restrict.chains.cond != 'A') {
            modal.querySelector('.updated').insertAdjacentHTML('beforebegin', '<p class="chreq">Chain restrictions are in place</p>');
        }

        if (this.json.length > 1) {
            let ops = '';

            this.json.forEach((w, n) => {
                ops += '<option ' + (w.name == data.name ? 'selected ' : '') + 'value="' + n + '">' + w.name + '</option>';
            });

            modal.querySelector('.updated').insertAdjacentHTML('beforebegin', '<select id="changeRW" style="width:100%" data-json=\'' + JSON.stringify(this.json) + '\'>' + ops + '</select>');
        }

        this.actions().show(true);
        this.updateURI('road-report', data.id, 'Report Report for ' + name);
    }

    processRWIS(cams = [], station, surface, weather, updated) {
        let pvt = 'N/A',
            content = '',
            wc = 'N/A',
            wi = '',
            vis = 'N/A',
            cameras = '';

        const geo = helpers.fetchRWIS(station.id);

        // process nearby webcams
        if (cams.length > 0) {
            cams.forEach(c => {
                const thecam = c.properties.cameras;

                for (let i = 0; i < thecam.length; i++) {
                    cameras += '<a href="#" class="rwisCam" data-id="' + thecam[i].id + '" onclick="return false">' + thecam[i].name + '</a>';
                }
            });
        }

        if (surface.pavement != null) pvt = surface.pavement[0].toFixed(1) + '&deg;F';
        if (weather.wind != null) wi = `<svg xmlns="http://www.w3.org/2000/svg" title="${weather.wind.dir}" style="transform:rotate(${weather.wind.rawdir}deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>`;
        if (weather.temp <= 50 && (weather.wind && (weather.wind.speed >= 3 || weather.wind.gust >= 3))) {
            wc = calculate.windChill(weather.temp, (weather.wind.speed >= 3 ? weather.wind.speed : weather.wind.gust)) + '&deg;F';
        } else {
            wc = Math.round(weather.temp) + '&deg;F';
        }

        if (weather.visibility != null) vis = weather.visibility.toFixed(2) + ' miles';

        content = `<div class="card">
            <div style="flex:1 1 50%;text-align:center">
                <h5 style="font-size:50px;color:var(--blue);margin:0">${Math.round(weather.temp)}&deg;F</h5>
                <span class="cl">temperature</span>
            </div>
            <div style="display:inline-flex;flex-direction:column;justify-content:center;gap:1em;flex:1 1 50%">
                <div style="text-align:center"><h5${surface.pavement != null && surface.pavement[0] < 32 ? ' style="color:#D33737"' : ''}>${pvt}</h5><span class="cl">pavement temp</span></div>
                <div style="text-align:center"><h5>${wc}</h5><span class="cl">feels like</span></div>
            </div>
        </div>`;

        if (surface.grip != null) {
            content += `<div class="card vert" onclick="grip('${surface.grip}');return false">
                <span class="cl" style="margin:0 0 0.5em 0">surface friction</span>
                <div class="grip">
                    <svg xmlns="http://www.w3.org/2000/svg" title="West" width="36" height="36" viewBox="0 0 24 24" style="transform:rotate(180deg);left:calc(-17px + ${Math.round(surface.grip / 0.82 * 100)}%)">
                        <path fill="#444" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path>
                    </svg>
                </div>
                <div style="display:inline-flex;width:100%;justify-content:space-between;align-items:center;margin-top:0.2em">
                    <h5>${Math.round(surface.grip * 100)}%</h5>
                    <p style="margin:0">${helpers.gripHelper(surface.grip)[0].toUpperCase()}</p>
                </div>
            </div>`;
        }

        if (weather.wind != null) {
            content += `<div style="display:flex;gap:1em">
                <div class="card vert">
                    <h5>${Math.round(weather.wind.speed) + ' mph'}</h5>
                    <span class="cl">wind speed</span>
                    <h5>${Math.round(weather.wind.gust) + ' mph'}</h5>
                    <span class="cl">wind gust</span>
                </div>
                <div class="card vert" style="justify-content:center">
                    ${wi}
                    <h5 style="margin-top:0.5em">${weather.wind.dir}</h5>
                    <span class="cl">wind direction</span>
                </div>
            </div>`;
        }

        content += `<div style="display:flex;gap:1em">
            <div class="card vert">
                <h5>${calculate.rh(weather.temp, weather.td)}%</h5>
                <span class="cl">relative humidity</span>
            </div>
            <div class="card vert" style="justify-content:center">
                <h5>${vis}</h5>
                <span class="cl">visibility</span>
            </div>
        </div>
        ${cameras != '' ? `<div class="card vert"><span class="cl" style="margin:0 0 0.5em 0">nearby cameras</span>${cameras}</div>` : ''}
        <div style="margin-top:1em;text-align:center">
            <span class="updated">Last report ${helpers.timeAgo(updated)}</span>
            <a href="#" class="btn" id="getwxf" data-stn="${station.id}" data-lat="${geo[1]}" data-lon="${geo[0]}" onclick="return false" style="margin-top:1em">
                <i class="far fa-snowflake"></i>Get weather forecast
            </a>
        <small>This data is automatically reported from a network of Road Weather Information Systems (RWIS).</small>
        </div>`;

        return content;
    }

    rwis(cams = []) {
        let thetype = typeof this.json.station,
            station,
            surface,
            weather;

        if (thetype != 'string') {
            this.json = JSON.parse(JSON.stringify(this.json));
            station = this.json.station;
            surface = this.json.surface;
            weather = this.json.weather;
        } else {
            station = this.json.station ? JSON.parse(this.json.station) : null;
            surface = this.json.surface ? JSON.parse(this.json.surface) : null;
            weather = this.json.weather ? JSON.parse(this.json.weather) : null;
        }

        const content = this.processRWIS(cams, station, surface, weather, this.json.updated);

        this.actions().create(helpers.roadName(station.name) + this.genFav('rwis', station.id, station.name), true);
        this.actions().setContent(content, true);

        if ((new Date().getTime() / 1000) - this.json.updated > (60 * 60 * 24 * 2)) {
            modal.querySelector('.popup-content').insertAdjacentHTML('beforebegin', '<p class="chreq">Station is likely offline and data is expired</p>');
        }

        this.updateURI('rwis', station.id, 'Current Weather: ' + station.name);
    }

    processIncidents(data, dataLoc = null, showUpd = false) {
        let lanes, comments, filesObj, files = "", affected = "";

        if (lanes != null) {
            for (let i = 0; i < lanes.length; i++) {
                var aff = lanes[i].lane;
                var affDir = lanes[i].direction;

                affected += aff + ' (' + affDir + ')<br>';
            }
        }

        if (comments && comments.link) files = `<span><a target="blank" href="${comments.desc}">Additional Information</a></span>`;

        if (filesObj) {
            filesObj.forEach(l => {
                files += `<span><a target="blank" href="${l.url}">${l['file-description']}</a></span>`;
            });
        }

        const thisInc = helpers.getIncident(data.id);
        const coords = thisInc?.geometry.type == 'Point' ? thisInc?.geometry.coordinates : thisInc?.geometry.coordinates[0];
        const whichWay = dataLoc.direction ? ` ${calculate.direction(dataLoc.direction)}` : '';

        return `<div class="boxes" style="margin:0 0 1em 0">
            <div class="ea" style="max-width:100%">
                <p>${dataLoc.hwy}${whichWay ?? ''}, MP ${dataLoc.milepost.start}${dataLoc.milepost.end ? '-' + dataLoc.milepost.end : ''}</p>
                <p style="font-size:15px;color:black;margin-top:2px;font-weight:400">${helpers.nearestCity(coords[1], coords[0])}</p>
            </div>
        </div>
        ${showUpd ? `Updated ${helpers.timeAgo(data.updated)} &middot; Reported ${helpers.timeAgo(data.created)}` : ''}
        <p style="color:var(--blue-gray)">${data.desc}</p>
        ${comments && !comments.link ? `<p style="color:var(--blue-gray)">${comments.desc}</p>` : ''}
        <div class="rows">
            ${filesObj || (comments && comments.link) ? `<div class="line m"><div class="de" style="font-size:13px">Links</div>${files}</div>` : ''}
            <div class="line m">
                <div class="de" style="font-size:13px">Delays</div>
                <span>${data.impact}</span>
            </div>
        </div>
        <div class="line m" style="margin-top:0.5em">
            <div class="de" style="font-size:13px">Lanes Affected</div>
            <span>${lanes == null ? 'None' : affected}</span></div>
        </div>
        <a href="#" class="btn dark" style="margin-top:1em" data-find="incident" data-id="${data.id}">Zoom in</a>
        <span class="bottom">Incident #${data.id} &middot; ${dataLoc.name} (#${dataLoc.id})</span>`;
    }

    incident() {
        const data = this.json,
            thetype = typeof data.location;
        let dataLoc;

        if (thetype != 'string') {
            data = JSON.parse(JSON.stringify(data));
            dataLoc = data.location;
            lanes = data.lanes;
            comments = data.comments;
            filesObj = data.files;
        } else {
            dataLoc = data.location ? JSON.parse(data.location) : null;
            lanes = data.lanes ? JSON.parse(data.lanes) : null;
            comments = data.comments ? JSON.parse(data.comments) : null;
            filesObj = data.files ? JSON.parse(data.files) : null;
        }

        const { icon, color } = helpers.incidentStyle(inc.type);

        this.actions().create(`<i class="fa-solid fa-${icon}" style="color:${color};margin-right:0.75em"></i>${data.type}`);
        this.actions().setContent(this.processIncidents(data, dataLoc));
        this.actions().updated(`Updated ${helpers.timeAgo(data.updated)} &middot; Reported ${helpers.timeAgo(data.created)}`);

        modal.querySelector('.updated').parentNode.insertBefore(modal.querySelector('.boxes'), modal.querySelector('.updated'));

        this.updateURI('incident', data.id, `${data.type} @ ${dataLoc.hwy} MP ${dataLoc.milepost.start}${dataLoc.milepost.end ? `-${dataLoc.milepost.end}` : ''}${dataLoc.direction ? ` ${dataLoc.direction}` : ''}`);
    }

    processCameras(geo, camera) {
        const where = geo == null ? null : helpers.nearestCity(geo[1], geo[0]);

        return `<span>${camera.name}</span>${this.genFav('cameras', camera.id, camera.name)}</h2>
        <img loading="lazy" src="${atob(camera.url)}?${new Date().getTime()}" alt="${camera.name}" title="${camera.name}" class="webcam">
        <span class="bottom" style="margin-bottom:1em">${where != null && where != '' ? where + ' &middot; ' : ''}${camera.county ? `${camera.county}&nbsp;County&nbsp;&middot;&nbsp;` : ''} Provided by ODOT</span>`;
    }

    webcam(geo = null) {
        let firstID, firstName;

        this.actions().create('Travel Cameras');

        this.json.forEach((camera, i) => {
            if (!firstID) {
                firstID = camera.id;
                firstName = camera.name;
            }

            this.actions().setContent(`<h2 class="wc"${this.json.length > 0 && i != this.json.length - 1 ? ' style="margin-top:1em"' : ''}>${this.processCameras(geo, camera, this.json.length, i)}`);

            this.updateURI('camera', firstID, firstName);
        });
    }

    genFav(cat, id, title) {
        const is = settings.isFavorite(cat, id.toString());
        return '<i id="fav" class="fas fa-heart ' + (!is ? 'un' : '') + 'favorite" data-category="' + cat + '" data-title="' + title + '" data-id="' + id + '" title="' + (is ? 'Remove from' : 'Add to') + ' favorites" aria-hidden="true"></i>';
    }

    actions() {
        const self = this;

        return {
            create: (title, useTemp2 = false) => {
                modal.innerHTML = useTemp2 ? self.template2 : self.template;
                self.actions().setTitle(title);
            },
            setTitle: (title) => {
                modal.querySelector('h1').innerHTML = title;
            },
            rows: (rows) => {
                modal.querySelector('.rows').innerHTML = rows;
            },
            setContent: (content, useTemp2 = false) => {
                if (useTemp2) {
                    modal.querySelector('.popup-content').innerHTML = content;
                } else {
                    const rows = modal.querySelector('.rows');

                    rows?.insertAdjacentHTML('afterend', content);
                    rows?.remove();
                }

                self.actions().show();
            },
            updated: (ago) => {
                modal.querySelector('.updated').innerHTML = ago;
            },
            show: (removeFull = false) => {
                if (removeFull) modal.classList.remove('full');
                modal.style.display = 'flex';
            }
        };
    }
}

class Data {
    constructor() {
        this.cluster = {
            maxZoom: 8,
            minPoints: 3,
            radius: 40
        };
        this.DB_NAME = 'OreRoadsCache';
        this.DB_LIST_OF_STORE_NAMES = ['prod', 'dev'];
        this.STORE_NAME = 'dev';
        this.DB_VERSION = 2;
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;

                this.DB_LIST_OF_STORE_NAMES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName);
                    }
                });
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async setCacheItem(key, value) {
        const db = await this.openDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readwrite');
            tx.objectStore(this.STORE_NAME).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async getCacheItem(key) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORE_NAME, 'readonly');
            const req = tx.objectStore(this.STORE_NAME).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async getCachedData(key, endpoint, ttlMinutes = 10) {
        const now = Date.now();
        const ttl = ttlMinutes * 60 * 1000;

        const cached = await this.getCacheItem(key);
        const meta = await this.getCacheItem(`${key}_meta`);

        try {
            let json;

            // Use cache if valid
            if (cached && meta && (now - meta < ttl)) {
                json = cached;
            } else {
                // Fetch new data
                const url = endpoint.includes('https') ? endpoint : config.apiURL + endpoint;
                json = await api(url);

                if (json) {
                    if (json.metadata) delete json.metadata;
                    if (json.total) delete json.total;

                    await this.setCacheItem(key, json);
                    await this.setCacheItem(`${key}_meta`, now);
                }
            }

            return json;
        } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            return null;
        }
    }

    async clearAllCache() {
        const db = await this.openDB();
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        tx.objectStore(this.STORE_NAME).clear();

        return new Promise(res => (tx.oncomplete = res));
    }

    init() {
        this.getHighways();
    }

    async getHighways() {
        let data;
        const json = localStorage.getItem('road_network');

        if (json == null) {
            const resp = await fetch('./oreroads/v' + version + '/mileposts.geojson');

            if (resp.ok) {
                const ret = await resp.json();
                localStorage.setItem('road_network', JSON.stringify(ret));

                data = json;
            }
        } else {
            data = JSON.parse(json);
        }

        new RoadNetwork().mileposts(data);
    }

    async doLayers() {
        await this.getRoads();
        this.loadAllData();
        this.getWWAs();
        this.getTraffic();

        hideLoading();
    }

    findRoad(roadName) {
        const index = roads.features.findIndex(
            road => road.properties?.name?.toLowerCase() === roadName
        );

        return index !== -1 ? index : null;
    }

    defaultLayer(name) {
        const layer = JSON.parse(localStorage.getItem('layers'))
            .filter(f => f.layer == name);

        return !layer[0] || !layer[0]?.show ? 'none' : 'visible';
    }

    async getRoads() {
        const fc = 'https://api.mapbox.com/datasets/v1/mapollc/clofxe8el0lxy2arnbd8ltiz4/features?access_token=' + config.mapboxToken;
        const json = await this.getCachedData('road_network', fc, 43830);

        if (json) {
            roads = json;
            this.displayRoads(json);
        }
    }

    async loadAllData() {
        const processRW = (data) => {
            if (!data || data.rw == null) {
                console.error('There was an error getting current road conditions.');
            } else {
                data.rw.forEach(feature => {
                    const pos = this.findRoad(feature.name.toLowerCase());

                    globalData.roadReports.push(feature);
                    if (pos != null) roads.features[pos].properties = feature;
                });

                map.getSource('roads').setData(roads);

                console.info(data.rw.length + ' road & weather sections reporting');
            }
        };

        try {
            const [rw, rwis, incidents, cameras, plows, dms, roadWork] = await Promise.allSettled([
                this.getCachedData('rw', 'roads', 15),
                this.getCachedData('rwis', 'roads/rwis', 10),
                this.getCachedData('incidents', 'roads/incidents', 10),
                this.getCachedData('cameras', 'webcams?network=ODOT', 60),
                this.getCachedData('plows', 'roads/plows', 15),
                this.getCachedData('dms', 'roads/dms', 10),
                this.getCachedData('construction', 'roads/incidents/construction', 30)
            ]);

            if (rw.status === 'fulfilled' && rw.value) {
                processRW(rw.value);
                config.dataStatus.rwRetrieved = true;
            }

            if (rwis.status === 'fulfilled' && rwis.value) {
                this.displayRWIS(rwis.value);
                config.dataStatus.rwisRetrieved = true;
            }

            if (incidents.status === 'fulfilled' && incidents.value) {
                this.displayIncidents(incidents.value);
                config.dataStatus.incidentsRetrieved = true;
            }

            if (cameras.status === 'fulfilled' && cameras.value) {
                this.displayWebcams(cameras.value);
                config.dataStatus.webcamsRetrieved = true;
            }

            if (plows.status === 'fulfilled' && plows.value) {
                this.displayPlows(plows.value);
                config.dataStatus.plowsRetrieved = true;
            }

            if (dms.status === 'fulfilled' && dms.value) {
                this.displayDMS(dms.value);
                config.dataStatus.dmsRetrieved = true;
            }

            if (roadWork.status === 'fulfilled' && roadWork.value) {
                this.displayConstruction(roadWork.value);
                config.dataStatus.roadWorkRetrieved = true;
            }
        } catch (err) {
            console.error(err);
        }
    }

    async getWWAs() {
        const json = await api(config.apiURL + 'wwas/oreroads');

        if (json) {
            if (json.wwas != null && json.wwas.length > 0) {
                nwsAlerts = json.wwas;
            }
        }
    }

    displayRoads(json) {
        const defColor = '#bdbdbd',
            roadColor = ["case",
                ["all", ["has", "road"], ["==", ["typeof", ["get", "road"]], "object"]],
                ["case",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 1], "#000",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 2], "#2196f3",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 3], "#ff9800",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 4], "#827717",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 5], "#7e57c2",
                    ["==", ["to-number", ["get", "id", ["get", "road", ["properties"]]]], 6], "#d32f2f",
                    defColor
                ],
                defColor
            ];

        if (json) {
            // loop through features to add names to an array
            json.features.forEach((f) => {
                roadsArray.push(f);
                roadsIDArray.push(f.properties.id);
            });

            if (!map.getSource('roads')) {
                map.addSource('roads', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!map.getLayer('roads_path')) {
                map.addLayer({
                    id: 'roads_path',
                    type: 'line',
                    source: 'roads',
                    paint: {
                        'line-color': roadColor,
                        'line-width': [
                            "step",
                            ["zoom"],
                            6,
                            17,
                            10,
                            18.5,
                            15
                        ]
                    },
                    filter: ['==', '$type', 'LineString'],
                    layout: {
                        visibility: this.defaultLayer('roads')
                    }
                }).on('mouseenter', 'roads_path', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'roads_path', () => {
                    map.getCanvas().style.cursor = 'auto';
                });

                map.addLayer({
                    id: 'roads_point',
                    type: 'circle',
                    source: 'roads',
                    paint: {
                        'circle-color': roadColor,
                        'circle-radius': [
                            "interpolate",
                            ["exponential", 1],
                            ["zoom"],
                            7,
                            8,
                            13,
                            15
                        ]
                    },
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        visibility: this.defaultLayer('roads')
                    }
                }).on('mouseenter', 'roads_point', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'roads_point', () => {
                    map.getCanvas().style.cursor = 'auto';
                });

                map.addLayer({
                    id: 'roads_text',
                    type: 'symbol',
                    source: 'roads',
                    minzoom: 13,
                    paint: {
                        'text-color': '#fff',
                        'text-opacity': {
                            stops: [[13, 0], [14, 1]]
                        },
                        'text-halo-color': '#333',
                        'text-halo-width': 1,
                        'text-halo-blur': 2
                    },
                    filter: ['!=', '$type', 'Point'],
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 400,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'name'],
                        'text-justify': 'center',
                        'text-size': 14,
                        'text-allow-overlap': false,
                        visibility: this.defaultLayer('roads')
                    }
                });

                map.addLayer({
                    id: 'roads_point_text',
                    type: 'symbol',
                    source: 'roads',
                    minzoom: 12,
                    paint: {
                        'text-color': '#666',
                        'text-halo-color': '#fff',
                        'text-halo-width': 1,
                        'text-halo-blur': 2
                    },
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'symbol-placement': 'point',
                        'symbol-spacing': 400,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'name'],
                        'text-justify': 'center',
                        'text-size': 14,
                        'text-max-width': 4,
                        'text-offset': [0, 2.25],
                        'text-allow-overlap': true,
                        visibility: this.defaultLayer('roads')
                    }
                });
            }
        }
    }

    displayWebcams(json) {
        const groupedFeatures = new Map();

        json.features.forEach(feature => {
            const key = JSON.stringify(feature.geometry.coordinates);

            if (!groupedFeatures.has(key)) {
                groupedFeatures.set(key, {
                    type: 'Feature',
                    geometry: feature.geometry,
                    properties: {
                        cameras: []
                    }
                });
            }
            groupedFeatures.get(key).properties.cameras.push(feature.properties);
        });

        json = JSON.parse(`{"type":"FeatureCollection","features":${JSON.stringify(Array.from(groupedFeatures.values()))}}`);
        globalData.webcams = json.features;

        const addCams = () => {
            if (!map.getSource('webcams')) {
                map.addSource('webcams', {
                    type: 'geojson',
                    data: json,
                    cluster: true,
                    clusterMaxZoom: this.cluster.maxZoom,
                    clusterMinPoints: this.cluster.minPoints,
                    clusterRadius: this.cluster.radius
                });
            }

            if (!map.getLayer('webcams')) {
                map.addLayer({
                    id: 'webcams',
                    type: 'symbol',
                    source: 'webcams',
                    filter: ['!', ['has', 'point_count']],
                    paint: {},
                    layout: {
                        'icon-image': 'cam',
                        'icon-size': 0.5,
                        'icon-allow-overlap': true,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('webcams')
                    }
                }).on('mouseenter', 'webcams', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'webcams', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!map.getLayer('webcams_cluster')) {
                map.addLayer({
                    id: 'webcams_cluster',
                    type: 'circle',
                    source: 'webcams',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': '#944f9f',
                        'circle-radius': 12,
                        'circle-stroke-color': '#0a0a0a',
                        'circle-stroke-width': 5,
                        'circle-stroke-opacity': 0.1
                    },
                    layout: {
                        visibility: this.defaultLayer('webcams')
                    }
                }).on('mouseenter', 'webcams_cluster', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'webcams_cluster', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!map.getLayer('webcams_count')) {
                map.addLayer({
                    id: 'webcams_count',
                    type: 'symbol',
                    source: 'webcams',
                    filter: ['has', 'point_count'],
                    paint: {
                        'text-color': '#fff'
                    },
                    layout: {
                        'text-field': ['get', 'point_count_abbreviated'],
                        'text-font': ['DIN Pro Medium'],
                        'text-anchor': 'center',
                        'text-justify': 'center',
                        /*'text-offset': [1.2, 0],*/
                        'text-allow-overlap': true,
                        'text-size': 14,
                        visibility: this.defaultLayer('webcams')
                    }
                }).on('mouseenter', 'webcams_count', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'webcams_count', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' webcams located');
        };

        Promise.all([
            this.loadImage('cam', `${config.host}${config.imgPath}camera_icon.png`),
            this.loadImage('cluster_cam', `${config.host}${config.imgPath}camera_cluster_icon.png`)
        ]).then(() => {
            addCams();
        }).catch(err => {
            console.error('Image load error:', err);
        });
    }

    displayRWIS(json) {
        /* add webcams to an array */
        json.features.forEach((stn) => {
            globalData.rwis.push(stn);
        });

        if (!map.getSource('rwis')) {
            map.addSource('rwis', {
                type: 'geojson',
                data: json,
                cluster: true,
                clusterMaxZoom: this.cluster.maxZoom,
                clusterMinPoints: this.cluster.minPoints,
                clusterRadius: this.cluster.radius
            });
        }

        if (!map.getLayer('rwis')) {
            map.addLayer({
                id: 'rwis',
                type: 'circle',
                source: 'rwis',
                paint: {
                    'circle-color': [
                        'case',
                        ['has', 'point_count'],
                        '#04564f',
                        '#009688'
                    ],
                    'circle-radius': 14,
                    'circle-stroke-color': '#0a0a0a',
                    'circle-stroke-width': [
                        'case',
                        ['has', 'point_count'],
                        5,
                        1
                    ],
                    'circle-stroke-opacity': 0.1,
                    'circle-translate': [-24, -12]
                },
                layout: {
                    visibility: this.defaultLayer('rwis')
                }
            }).on('mouseenter', 'rwis', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'rwis', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }


        if (!map.getLayer('rwis_text')) {
            map.addLayer({
                id: 'rwis_text',
                type: 'symbol',
                source: 'rwis',
                paint: {
                    'text-color': '#fff'
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': [
                        'case',
                        [
                            'all',
                            ['has', 'weather'],
                            ["==", ["typeof", ["get", "weather"]], "object"]
                        ],
                        [
                            'concat',
                            ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], '°'
                        ],
                        ''
                    ],
                    'text-justify': 'center',
                    'text-size': [
                        'case',
                        [
                            'all',
                            ['has', 'weather'],
                            ["==", ["typeof", ["get", "weather"]], "object"],
                            ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99]
                        ],
                        12,
                        14
                    ],
                    'text-offset': [
                        'case',
                        [
                            'all',
                            ['has', 'weather'],
                            ["==", ["typeof", ["get", "weather"]], "object"],
                            ['>', ['round', ['get', 'temp', ['get', 'weather', ['properties']]]], 99]
                        ],
                        [-1.98, -1],
                        [-1.7, -.85]
                    ],
                    'text-allow-overlap': true,
                    visibility: this.defaultLayer('rwis')
                }
            }).on('mouseenter', 'rwis_text', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'rwis_text', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        if (!map.getLayer('rwis_count')) {
            map.addLayer({
                id: 'rwis_count',
                type: 'symbol',
                source: 'rwis',
                filter: ['has', 'point_count'],
                paint: {
                    'text-color': '#fff'
                },
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-justify': 'center',
                    'text-size': 14,
                    'text-offset': [-1.7, -0.85],
                    'text-allow-overlap': true,
                    visibility: this.defaultLayer('rwis')
                }
            }).on('mouseenter', 'rwis_count', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'rwis_count', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }

        console.info(json.features.length + ' RWIS stations reporting');
    }

    loadImage(name, url) {
        return new Promise((resolve, reject) => {
            if (map.hasImage(name)) {
                resolve();
                return;
            }

            map.loadImage(
                url,
                (error, img) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    map.addImage(name, img);
                    resolve();
                }
            );
        });
    }

    displayIncidents(json) {
        const incImgs = ['', '_crash', '_closure', '_vehicle', '_ramp_gate', '_obstruction'];

        const finish = () => {
            /* if the incident is a linestring, we need to add icons for the start and end milepost */
            json.features.forEach((feature) => {
                globalData.incidents.push(feature);

                if (feature.geometry.type != 'Point') {
                    const start = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: feature.geometry.coordinates[0]
                        },
                        properties: feature.properties
                    }, end = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: feature.geometry.coordinates[feature.geometry.coordinates.length - 1]
                        },
                        properties: feature.properties
                    };

                    json.features.push(start);
                    json.features.push(end);
                }
            });

            if (!map.getSource('incidents')) {
                map.addSource('incidents', {
                    type: 'geojson',
                    data: json
                });
            }

            map.addLayer({
                id: 'incidents_point',
                type: 'symbol',
                source: 'incidents',
                filter: ['==', '$type', 'Point'],
                paint: {
                    'icon-halo-color': '#333',
                    'icon-halo-width': 5,
                    'icon-halo-blur': 1
                },
                layout: {
                    'icon-image': [
                        'case',
                        ['==', ['get', 'type'], 'Crash'], 'incident_crash',
                        ['==', ['get', 'type'], 'Closure'], 'incident_closure',
                        ['==', ['get', 'type'], 'Disabled Vehicle - Hazard'], 'incident_vehicle',
                        ['==', ['get', 'type'], 'Ramp Gate Activation'], 'incident_ramp_gate',
                        ['==', ['get', 'category'], 'Obstruction'], 'incident_obstruction',
                        'incident'
                    ],
                    'icon-size': 0.45,
                    'icon-allow-overlap': true,
                    'symbol-placement': 'point',
                    visibility: this.defaultLayer('incidents')
                }
            }).on('mouseenter', 'incidents_point', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'incidents_point', () => {
                map.getCanvas().style.cursor = 'auto';
            });

            map.addLayer({
                id: 'incidents_line_bg',
                type: 'line',
                source: 'incidents',
                filter: ['!=', '$type', 'Point'],
                paint: {
                    'line-width': 5,
                    'line-color': '#555'
                },
                layout: {
                    visibility: this.defaultLayer('incidents')
                }
            }, 'incidents_point').on('mouseenter', 'incidents_line_bg', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'incidents_line_bg', () => {
                map.getCanvas().style.cursor = 'auto';
            });

            map.addLayer({
                id: 'incidents_line',
                type: 'line',
                source: 'incidents',
                filter: ['!=', '$type', 'Point'],
                paint: {
                    'line-width': 5,
                    'line-color': '#ff4a4a',
                    'line-dasharray': [3, 3]
                },
                layout: {
                    visibility: this.defaultLayer('incidents')
                }
            }, 'incidents_point').on('mouseenter', 'incidents_line', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'incidents_line', () => {
                map.getCanvas().style.cursor = 'auto';
            });

            map.addLayer({
                id: 'incidents_text',
                type: 'symbol',
                source: 'incidents',
                minzoom: 8.5,
                paint: {
                    'text-color': '#333',
                    'text-opacity': {
                        stops: [[8.4, 0], [8.5, 1]]
                    },
                    'text-halo-color': '#fff',
                    'text-halo-width': 1,
                    'text-halo-blur': 1
                },
                filter: ['==', '$type', 'Point'],
                layout: {
                    'symbol-placement': 'point',
                    'text-font': ['DIN Pro Medium'],
                    'text-field': ['get', 'type'],
                    'text-max-width': 8,
                    'text-justify': 'center',
                    'text-anchor': 'top',
                    'text-offset': [0, 1.05],
                    'text-size': 11,
                    'text-allow-overlap': false,
                    visibility: this.defaultLayer('incidents')
                }
            });

            console.info(json.features.length + ' incidents reported by ODOT TOCs');
        };

        Promise.all(
            incImgs.map(n => this.loadImage(`incident${n}`, `${config.host}${config.imgPath}incident${n}.png`))
        ).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading incident images:', err);
        });
    }

    displayConstruction(json) {
        const finish = () => {
            globalData.roadWork = json;

            if (!map.getSource('roadWork')) {
                map.addSource('roadWork', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!map.getLayer('roadWork')) {
                map.addLayer({
                    id: 'roadWork_point',
                    type: 'symbol',
                    source: 'roadWork',
                    paint: {},
                    filter: ['==', '$type', 'Point'],
                    layout: {
                        'icon-image': 'construction',
                        'icon-size': 0.65,
                        'icon-allow-overlap': false,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('construction')
                    }
                }).on('mouseenter', 'roadWork_point', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'roadWork_point', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' road work & maintenance events reported by ODOT TOCs');
        };

        Promise.all([
            this.loadImage('construction', `${config.host}${config.imgPath}roadwork_icon.png`)
        ]).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading image:', err);
        });
    }

    displayDMS(json) {
        const finish = () => {
            globalData.varMsgSigns = json;

            if (!map.getSource('dms')) {
                map.addSource('dms', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!map.getLayer('dms')) {
                map.addLayer({
                    id: 'dms',
                    type: 'symbol',
                    source: 'dms',
                    paint: {},
                    layout: {
                        'icon-image': 'dms',
                        'icon-size': 0.65,
                        'icon-allow-overlap': false,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('vms')
                    }
                }).on('mouseenter', 'dms', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'dms', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' active variable message signs');
        };

        Promise.all([
            this.loadImage('dms', `${config.host}${config.imgPath}dms_icon.png`)
        ]).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading image:', err);
        });
    }

    displayPlows(json) {
        const finish = () => {
            globalData.snowPlows = json;

            if (!map.getSource('plows')) {
                map.addSource('plows', {
                    type: 'geojson',
                    data: json
                });
            }

            if (!map.getLayer('plows')) {
                map.addLayer({
                    id: 'plows',
                    type: 'symbol',
                    source: 'plows',
                    paint: {},
                    layout: {
                        'icon-image': 'plow',
                        'icon-size': 0.2,
                        'icon-allow-overlap': true,
                        'symbol-placement': 'point',
                        visibility: this.defaultLayer('plows')
                    }
                }).on('mouseenter', 'plows', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'plows', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            console.info(json.features.length + ' recently seen snow plows');
        };

        Promise.all([
            this.loadImage('plow', `${config.host}${config.imgPath}snow_plow_icon.png`)
        ]).then(() => {
            finish();
        }).catch(err => {
            console.error('Error loading image:', err);
        });
    }

    getTraffic() {
        if (!map.getSource('traffic')) {
            map.addSource('traffic', {
                type: 'raster',
                tiles: [
                    'https://api.mapbox.com/styles/v1/mapollc/cloq47dre005e01r6gnn92v3h/tiles/256/{z}/{x}/{y}@2x?access_token=' + config.mapboxToken
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('traffic')) {
            map.addLayer({
                id: 'traffic',
                type: 'raster',
                source: 'traffic',
                paint: {},
                layout: {
                    visibility: this.defaultLayer('traffic')
                }
            });
        }
    }
}

class Radar {
    async init() {

    }
}

function saveLoc() {
    new Geo(map.getCenter().lat, map.getCenter().lng, map.getZoom()).saveLocation();
}

class Style {
    constructor() {
        this.menu = null;
        this.userBtn = null;
        this.winLoc = window.location;

        this.createButtons();
        this.createListeners();

        hideLoading();
        new Data().doLayers();

        /* whether or not to load up radar animation */
        if (new Data().defaultLayer('radar') != 'none') {
            radar = new Radar();
            radar.init();
        }
    }

    createButtons() {
        const d = `<div class="search">
            <i class="fas fa-search" style="color:#919191"></i><input type="text" id="search" autocomplete="off" placeholder="Find road reports or cities..."></div>
            <div class="search-results"><div id="result" class="none">Searching...</div></div>
            <img class="logo" src="${config.host}${config.imgPath}pJg1DYY.png" title="OregonRoads logo" alt="OregonRoads logo">
            <div class="radar-controls"><div class="t"><span id="time" style="font-size:14px">--</span><span><i class="fas fa-pause" id="radarPP"></i></span></div>
            <input type="range" id="radarTime" min="0" max="12" value="0" oninput="setRT(this.value)"></div>
            <div class="mitem-wrapper"><div id="layers" class="mitem" title="Layers"><i class="fas fa-layer-group"></i></div>
            <div id="query" class="mitem" title="Search map"><i class="far fa-magnifying-glass"></i></div>
            <div id="table" class="mitem" title="Tabular Listing"><i class="fa-sharp far fa-table"></i></div>
            <div id="areas" class="mitem" title="Zoom Areas"><i class="fas fa-magnifying-glass-plus"></i></div>
            <div id="myfavorites" class="mitem" title="My Favorites"><i class="fas fa-heart"></i></div>
            <div id="user" class="mitem" title="Account"><i class="fas fa-user"></i></div></div>
            <div id="menu"><span id="close"></span></div>
            <div id="modal"></div>`;

        document.querySelector('#map').insertAdjacentHTML('afterend', d);
        this.menu = document.querySelector('#menu');
        this.userBtn = document.querySelector('#user');
        modal = document.querySelector('#modal');
    }

    createListeners() {
        this.userBtn.addEventListener('click', () => this.onUserProfileClick());
        document.querySelector('#layers').addEventListener('click', (e) => this.onLayersBtnClick(e));
        document.querySelector('#myfavorites').addEventListener('click', () => this.onFavsBtnClick());
        document.querySelector('#areas').addEventListener('click', () => this.onAreasBtnClick());
        document.querySelector('#table').addEventListener('click', () => this.onTableBtnClick());
        document.querySelector('#query').addEventListener('click', () => this.onQueryBtnClick());
    }

    onQueryBtnClick() {
        document.querySelector('.search').style.display = 'flex';
        document.querySelector('#search').focus();
    }

    onUserProfileClick() {
        const uri = this.winLoc.pathname + (this.winLoc.hash ? this.winLoc.hash : '');

        if (settings.user != null) {
            const userMenu = `<ul id="userMenu"><li class="head"><span>Hi, ${settings.getUser().getName().first()}</span></li>
                <li onclick="settings.syncFavorites(true)"><a href="#" onclick="return false">Sync Favorites</a></li>
                <li><a href="${config.host}account/settings">Account</a></li>
                <li><a href="${config.host}logout?next='${encodeURIComponent(this.winLoc.href + '?loggedOut=1')}">Logout</a></li>
                <li><a href="#" onclick="createDialog(\'Disclaimer\', disclaimer, false, \'Ok\');get(\'.dialog\').classList.add(\'disclaimer\');get(\'ul#userMenu\').remove();return false">Disclaimer</a></li>
                <li><a target="blank" href="../about/contact">Contact Us</a></li>
                <li><a href="#" id="aboutDialog" onclick="get(\'ul#userMenu\').remove();return false">About</a></li></ul>`;

            if (!document.querySelector('ul#userMenu')) document.body.insertAdjacentHTML('beforeend', userMenu);
            const um = document.querySelector('ul#userMenu');

            um.style.top = this.userBtn.parentElement.offsetTop + 'px';
            um.style.left = (this.userBtn.parentElement.offsetLeft - 166) + 'px';
        } else {
            this.winLoc.href = `${config.host.replace('www', 'auth')}login?service=apps&prod=oregonroads&next=${encodeURIComponent(uri)}`;
        }
    }

    onLayersBtnClick(e) {
        if (!menuLoaded) {
            const bm = '<div class="item"><div class="t"><h2>Basemap</h2><div class="radio">' +
                '<input type="radio" id="light" name="basemap" value="light"' + (userBaseMap == null || userBaseMap == 'light' ? ' checked' : '') + '><label for="light">Light</label></div>' +
                '<div class="radio"><input type="radio" id="dark" name="basemap" value="dark"' + (userBaseMap == 'dark' ? ' checked' : '') + '><label for="dark">Dark</label></div></div></div>';

            let lm = '<h1>Layers</h1>' + bm;
            const cache = JSON.parse(localStorage.getItem('layers')),
                isChecked = (name) => cache.filter(it => it.layer == name)?.[0].show;

            layersList.forEach(e => {
                const checked = isChecked(e.layer) ? ' checked' : '';

                lm += `<div class="item"><div class="t"><h2>${e.name}</h2>
                    <span style="font-size:14px">${e.desc}</span></div><div class="s">
                    <label class="switch">
                    <input type="checkbox" id="lo${e.layer}" class="toggle" data-layer="${e.layer}"${checked}>
                    <span class="slider"></span></label></div></div>`;
            });

            this.menu.insertAdjacentHTML('beforeend', lm);
            menuLoaded = true;
        }

        menu.style.display = this.menu.style.display == 'block' ? 'none' : 'block';

        e.stopPropagation();
    }

    onTabClickListener(tabContainer, tabContent, e) {
        const clickedTab = e.target.closest('li.tab');
        if (!clickedTab) return;

        tabContainer.querySelectorAll('li').forEach(t => t.classList.remove('active'));

        tabContent.querySelectorAll('.content').forEach(c => {
            c.style.display = c.getAttribute('data-tab') === clickedTab.getAttribute('data-tab') ? 'block' : 'none';
        });

        clickedTab.classList.add('active');
    }

    onFavsBtnClick() {
        const tables = new Tables();
        let rwisCount = globalData.rwis.length,
            rwCount = globalData.roadReports.length;

        history.replaceState(null, null, ' ');

        modal.innerHTML = '<span id="close"></span><h1>My Favorites</h1><div class="wrapper"><ul class="tabs"><li class="tab active" data-tab="cams">Cameras</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="rwis">Weather</li></ul>' +
            '<div class="tab-content"><div class="content active" data-tab="cams">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="rwis">Loading...</div></div></div>';
        modal.classList.add('full');
        modal.style.display = 'flex';

        modal.querySelector('ul.tabs').addEventListener('click', (e) => {
            onTabClickListener(modal.querySelector('ul.tabs'), modal.querySelector('.tab-content'), e);
        });

        tables.webcamTable();
        tables.rwisTable();

        document.querySelectorAll('#modal .tab-content .content[data-tab=rwis] .rwis-card').forEach((e) => {
            if (!settings.isFavorite('rwis', e.dataset.id)) {
                e.remove();
                rwisCount--;
            }

            if (rwisCount == 0) {
                modal.querySelector('.tab-content .content[data-tab=rwis]').innerHTML = 'You currently don\'t have any favorite weather stations';
            }
        });

        tables.rwTable();

        document.querySelectorAll('#modal .tab-content .content[data-tab=roads] .inc-card').forEach((e) => {
            if (!settings.isFavorite('roadReports', e.dataset.id)) {
                e.remove();
                rwCount--;
            }

            if (rwCount == 0) {
                modal.querySelector('.tab-content .content[data-tab=roads]').innerHTML = 'You currently don\'t have any favorite road reports';
            }
        });
    }

    /* regional areas icon on click */
    onAreasBtnClick() {
        let d = document.createElement('div'),
            items = '';

        metro.forEach((i) => {
            const zm = i.zoom - 2 - (window.outerWidth < 475 ? 2 : (window.outerWidth < 600 ? 1 : 0));
            items += `<li><a href="#" id="areaLink" onclick="return false" data-lon="${i.center[1]}" data-lat="${i.center[0]}" data-zoom="${zm}">${i.name}</a></li>`;
        });

        d.innerHTML = dialog;
        d.classList.add('dialog');
        document.body.appendChild(d);

        const container = document.querySelector('.dialog');
        container.querySelector('h1').innerHTML = 'Go to an area';
        container.querySelector('p').innerHTML = '<ul>' + items + '</ul>';
        container.querySelector('#pos').innerHTML = 'Cancel';
        container.querySelector('#neg').remove();

        document.querySelector('.backdrop').style.display = 'block';
    }

    /* tabular listing icon on click */
    onTableBtnClick() {
        const tables = new Tables();
        history.replaceState(null, null, ' ');

        modal.innerHTML = '<span id="close"></span><h1>Tabular Report</h1><div class="wrapper"><ul class="tabs"><li class="tab" data-tab="alerts">Alerts</li><li class="tab active" data-tab="rwis">Weather</li><li class="tab" data-tab="roads">Roads</li><li class="tab" data-tab="incs">Incidents</li></ul>' +
            '<div class="tab-content"><div class="content" data-tab="alerts">There are currently no high priority alerts.</div><div class="content active" data-tab="rwis">Loading...</div><div class="content" data-tab="roads">Loading...</div><div class="content" data-tab="incs">Loading...</div></div></div>';
        modal.classList.add('full');
        modal.style.display = 'flex';

        modal.querySelector('ul.tabs').addEventListener('click', (e) => {
            onTabClickListener(modal.querySelector('ul.tabs'), modal.querySelector('.tab-content'), e);
        });

        tables.rwisTable();
        tables.incsTable();
        tables.rwTable();
    }
}

class Tables {
    constructor() { }

    rwTable() {
        let content = '',
            exists = false;

        if (globalData.roadReports.length > 0) {
            globalData.roadReports.forEach(p => {
                if (p.road) {
                    exists = true;
                    content += `<div class="inc-card" data-id="${p.name}"  onclick="goToRW('${p.name}')">
                        <div class="wrap">
                            <h2>${p.name}</h2><span class="updated">Last report ${helpers.timeAgo(p.updated)}</span>
                        </div>
                        <div class="rows" style="margin-top:0">
                            <div class="line"><div class="de">Weather</div><span>${p.weather}</span></div>
                            <div class="line"><div class="de">Road Conditions</div><span>${p.road.condition}</span></div>
                        </div>
                    </div>`;
                }
            });
        }

        modal.querySelector('.tab-content .content[data-tab=roads]').innerHTML = exists ? '<input type="text" id="filterRW" class="text" autocomplete="off" placeholder="Search reports...">' + content : 'There are no road reports currently available.';
    }

    webcamTable() {
        let content = '',
            count = 0;

        globalData.webcams.forEach(w => {
            w.properties.cameras.forEach(data => {
                if (settings.isFavorite('cameras', data.id.toString())) {
                    content += `<div style="${count != 0 ? 'margin-top:0.5em;' : ''}text-align:center">
                        <h4 class="fav">${data.name}${new Modal().genFav('cameras', data.id, data.name)}</h4>
                        <img loading="lazy" src="${atob(data.url)}?${new Date().getTime()}" alt="${data.name}" title="${data.name}" class="webcam">
                    </div>`;

                    count++;
                }
            });
        });

        modal.querySelector('.tab-content .content[data-tab=cams]').innerHTML = (count == 0 ? 'You currently don\'t have any favorite cameras' : content);
    }

    rwisTable() {
        let content = '';

        globalData.rwis.forEach(s => {
            let p = s.properties,
                pvt;

            if (p.surface.pavement != null) {
                pvt = Math.round(p.surface.pavement[0]) + '&deg;F';

                if (p.surface.pavement[1]) {
                    pvt += '/' + Math.round(p.surface.pavement[1]) + '&deg;F';
                }
            }

            if (p.weather.wind != null) {
                var wi = '<svg xmlns="http://www.w3.org/2000/svg" title="' + p.weather.wind.dir + '" style="transform:rotate(' + p.weather.wind.rawdir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--light-blue)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"/></svg>';
            }

            content += `<div class="rwis-card" data-id="${p.station.id}" onclick="goToRWIS('${p.station.id}')">
                <span class="temp">${Math.round(p.weather.temp)}&deg;</span>
                <div class="wrapper">
                    <h2>${p.station.name}</h2>
                    <div class="rows">
                        ${pvt ? `<div class="line"><div class="de">Pavement Temp</div><span>${pvt}</span></div>` : ''}
                        ${p.weather.wind != null ? `<div class="line"><div class="de">Wind</div><span>${wi}${Math.round(p.weather.wind.speed)} mph</span></div>` : ''}
                        ${p.surface.grip != null ? `<div class="line"><div class="de">Surface Friction</div>
                        <span><a href="#" onclick="grip('${p.surface.grip}');return false">${p.surface.grip * 100}%</a></span></div>` : ''}
                    </div>
                    <span class="updated" style="text-align:left;margin-top:1em">Last reported ${helpers.timeAgo(p.updated)}</span>
                </div>
            </div>`;
        });

        modal.querySelector('.tab-content .content[data-tab=rwis]').innerHTML = '<input type="text" id="filterRWIS" class="text" autocomplete="off" placeholder="Search stations...">' + content;
    }

    async incsTable() {
        let content = '',
            alerts = '';

        globalData.incidents.forEach(s => {
            if (s.properties.category != 'Road Work') {
                let p = s.properties,
                    isAlert = false;

                if (p.type == 'Closure' || p.impact == 'Closure' || p.impact == 'Closure with Detour') isAlert = true;

                content += `<div class="inc-card" data-find="incident" data-id="${p.id}">
                    <div class="wrap">
                        <h2>${p.type}</h2>
                        <span class="updated">${helpers.timeAgo(p.updated)}</span>
                    </div>
                    <p style="margin:0;color:var(--blue)">${p.location.desc}</p>
                    <span style="color:#555;font-size:14px">${p.location.hwy}, Milepost ${p.location.milepost.start}${p.location.milepost.end ? `-${p.location.milepost.end}` : ''}
                    ${p.location.direction ? ' &middot; ' + p.location.direction : ''}</span>
                </div>`;

                if (isAlert) {
                    alerts += `<div class="inc-card" data-find="incident" data-id="${p.id}">
                        <div class="wrap">
                            <h2 style="color:#e53935">${p.type}</h2>
                            <span class="updated">${helpers.timeAgo(p.updated)}</span>
                        </div>
                        <p style="margin:0;color:var(--blue)">${p.location.desc}</p>
                        <span style="color:#555;font-size:14px">${p.location.hwy}, Milepost ${p.location.milepost.start}${p.location.milepost.end ? `-${p.location.milepost.end}` : ''}
                        ${p.location.direction ? ' &middot; ' + p.location.direction : ''}</span>
                    </div>`;
                }
            }
        });

        /* parse WWAs */
        if (nwsAlerts.length > 0) {
            for (let i = 0; i < nwsAlerts.length; i++) {
                const d1 = new Date(alert.effective * 1000);
                const d2 = new Date(alert.expires * 1000);

                const tzMatch = d1.toString().match(/\(([A-Za-z\s]+)\)/);
                const tzParts = tzMatch ? tzMatch[1].split(' ') : [''];
                const tz = tzParts.map(p => p[0]).join('');

                const formatTime = d => {
                    const hours = d.getHours();
                    const mins = d.getMinutes();
                    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    const mStr = mins < 10 ? '0' + mins : mins;
                    const ampm = hours >= 12 ? 'P' : 'A';
                    return `${h12}:${mStr} ${ampm}M`;
                };

                const t1 = formatTime(d1);
                const t2 = formatTime(d2);

                const iss = `${short_months[d1.getMonth()]} ${d1.getDate()}, ${d1.getFullYear()} at ${t1} ${tz}`;
                const exp = `${dow[d2.getDay()]}, ${long_months[d2.getMonth()]} ${d2.getDate()}, ${d2.getFullYear()} at ${t2}`;

                alerts += `<div class="wwa-card" onclick="window.open('https://alerts-v2.weather.gov/#/?id=${nwsAlerts[i].id}')">
                    <div class="wrap"><h2>${nwsAlerts[i].event}</h2></div>
                    <p style="font-size:15px;margin:0">In effect until ${exp}</p>
                    '<p style="color:var(--blue-gray);margin:0">${nwsAlerts[i].zone}</p>
                    <span class="updated" style="text-align:left">Issued ${iss}</span>
                </div>`;
            }
        }

        modal.querySelector('.tab-content .content[data-tab=alerts]').innerHTML = alerts;
        modal.querySelector('.tab-content .content[data-tab=incs]').innerHTML = content;
    }
}

function init() {
    if (localStorage.getItem('map_lat') != null) {
        var mc = [localStorage.getItem('map_lon'), localStorage.getItem('map_lat')],
            mz = localStorage.getItem('map_zoom');
    } else {
        var mc = [-120.5542, 44.10337],
            mz = 6;
    }

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: config.mapboxToken,
        style: (userBaseMap == null || userBaseMap == 'light' ? basemaps.light : basemaps.dark),
        projection: 'mercator',
        hash: true,
        attributionControl: true,
        collectResourceTiming: true,
        zoom: mz,
        center: mc
    }).on('zoomstart', () => {
        moving = true;
    }).on('movestart', () => {
        map.getCanvas().style.cursor = 'grabbing';
        moving = true;
    }).on('moveend', () => {
        map.getCanvas().style.cursor = 'auto';
        saveLoc();
        moving = false;
    }).on('zoomend', () => {
        saveLoc();
        moving = false;
    });

    map.on('load', () => {
        map.touchPitch.disable();
        new Data().init();

        handleURIIntents();
    });

    map.on('style.load', () => new Style());
    map.on('click', (e) => onMapClickListener(e));

    // add controls
    map.addControl(new mapboxgl.FullscreenControl({
        container: document.body
    })).addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false
    })).addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    })).addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        })
    );
}

function onMapClickListener(e) {
    const features = map.queryRenderedFeatures([
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5]
    ]);

    // return if no features at click location
    if (features == null || features.length == 0) return;

    const point = map.unproject(e.point);

    const zoomToCluster = (coords) => {
        map.flyTo({
            center: coords,
            zoom: map.getZoom() + 2.5
        });
    };

    features.forEach(feature => {
        const { source: layer } = feature.layer || {};
        const { properties, geometry, sourceLayer } = feature;
        const coords = geometry.coordinates;

        // Handle mileposts first (not tied to layer)
        if (sourceLayer === 'mileposts-68fgu7') {
            const name = ucwords(properties.HWYNAME.toLowerCase()),
                num = properties.HWYNUMB,
                mp = properties.MP,
                id = properties.RDWY_ID;

            const direction = num % 2 === 0 ? (id === '1' ? 'East' : 'West') : (id === '1' ? 'South' : 'North');

            createDialog(
                'Milepost',
                `${name} HWY (#${num}) Milepost ${mp} ${direction}bound`
            );
            return;
        }

        switch (layer) {
            case 'webcams':
                if (properties.cluster) return zoomToCluster(coords);

                const cams = JSON.parse(properties.cameras);

                if (cams?.length) new Modal(cams, true).webcam(coords);

                return;

            case 'rwis':
                if (properties.cluster) return zoomToCluster(coords);

                const nearby = globalData.webcams.filter((cam) => {
                    const [lon, lat] = cam.geometry.coordinates;
                    return calculate.distance(coords[1], coords[0], lat, lon) <= 1;
                });

                new Modal(properties, true).rwis(nearby);
                return;

            case 'dms':
                new Modal(properties, true).vms();
                return;

            case 'plows': {
                const temp = JSON.parse(properties.temp);
                const where = helpers.nearestCity(coords[1], coords[0]);

                createDialog('ODOT Snow Plow', `<div style="line-height:1.3">
                    <b>Speed</b><br>${properties.speed} mph<br>
                    <b>Location</b><br>${where}<br>
                    <b>Air Temperature</b><br>${temp.air}&deg;<br>
                    <b>Road Temperature</b><br>${temp.road}&deg;<br>
                    <b>Last Seen</b><br>${helpers.timeAgo(properties.updated)}
                </div>`);

                return;
            }

            case 'incidents':
            case 'roadWork':
                new Modal(properties, true).incident();
                return;

            case 'roads': {
                const report = helpers.compileReports(properties.name);

                if (!report.length) {
                    new Modal(report, true).roadReport(properties.name);
                    return;
                }

                const hwy = report[0]?.hwyID?.toString() || properties.hwy;

                const range = new RoadNetwork(
                    point.lat,
                    point.lng,
                    hwy
                ).getRange(
                    report,
                    properties.name,
                    true
                );

                const uqid = {
                    lat: point.lat,
                    lon: point.lng,
                    hwy,
                    name: properties.name
                };

                new Modal(null, true).updateURI(
                    'road-segment',
                    btoa(JSON.stringify(uqid)),
                    `Road Report for ${helpers.roadName(properties.hwy)} from MP ${range}`
                );

                return;
            }
        }
    });
}

document.onreadystatechange = async () => {
    const preload = async () => {
        let usr = null,
            token = (/\btoken=(.*?)(?=;|$)/gm).exec(document.cookie);

        if (token != null) {
            const get = await api(config.apiURL + 'user/get/oreroads', [['token', token[1]]]);
            usr = get.user;
        }

        calculate = new Calculate();
        helpers = new Helpers();
        settings = new Settings(usr);
    };

    const complete = () => {
        /* save favorites every 5 minutes */
        setInterval(() => {
            settings.syncFavorites();
        }, 1000 * 60 * 5);

        /* refresh the app every 15 minutes */
        setInterval(() => {
            window.location.href = window.location.href;
        }, 1000 * 60 * 15);

        /* log the user's first time on the map */
        if (!localStorage.getItem('firstLoad')) {
            localStorage.setItem('firstLoad', new Date().getTime() / 1000);
        }

        /* show the disclaimer if user hasn't read it before */
        if (!localStorage.getItem('disclaimer')) {
            let t = setInterval(() => {
                if (globalData.roadReports.length > 0) {
                    clearInterval(t);

                    setTimeout(() => {
                        createDialog('Disclaimer', disclaimer, false, 'I agree');
                        document.querySelector('.dialog').classList.add('disclaimer');
                    }, 1000);
                }
            }, 500);
        }

        /* set default layers for the map for first time user */
        if (localStorage.getItem('layers') == null || JSON.parse(localStorage.getItem('layers').length != layersList.length)) {
            const defaultLayers = [];

            layersList.forEach((e) => {
                defaultLayers.push({
                    layer: e.layer,
                    show: e.default
                });
            });

            localStorage.setItem('layers', JSON.stringify(defaultLayers));
        }

        // start mapping
        init();
    };

    if (document.readyState != 'complete') {
        preload();
    } else {
        complete();
    }
};

window.addEventListener('change', (e) => {
    const target = e.target;

    // change basemap
    if (e.target.type == 'radio' && e.target.dataset.name == 'basemap') {
        const bm = e.target.value;

        map.setStyle(bm == 'light' ? basemaps.light : basemaps.dark, {
            diff: false
        });

        localStorage.setItem('basemap', bm);
    }

    // show or hide layers
    if (e.target && e.target.className == 'toggle') {
        const customLayers = [];
        const name = e.target.dataset.layer;
        const isVisible = e.target.checked ? 'visible' : 'none';

        const layerGroups = {
            roads: ['roads_path', 'roads_point', 'roads_text', 'roads_point_text'],
            webcams: ['webcams', 'webcams_count'],
            rwis: ['rwis', 'rwis_text'],
            incidents: ['incidents_point', 'incidents_line_bg', 'incidents_line', 'incidents_text'],
            vms: ['dms'],
            construction: ['roadWork_point'],
            wwas: ['wwas_outline', 'wwas_fill'],
            traffic: ['traffic']
        };

        if (layerGroups[name]) {
            layerGroups[name].forEach(l => map.setLayoutProperty(l, 'visibility', isVisible));
        }

        if (name === 'radar') {
            if (e.target.checked) {
                radarInit();
            } else {
                radarPlay = true;
                document.querySelector('.radar')?.remove();
                clearInterval(radarAnim);
                radarImgs.forEach((_, i) => {
                    map.removeLayer(`radar-layer-${i}`).removeSource(`radar-${i}`);
                });
            }
        }

        // Save all toggled layers to localStorage
        document.querySelectorAll('#menu .toggle').forEach(chk => {
            customLayers.push({
                layer: chk.dataset.layer,
                show: chk.checked
            });
        });

        localStorage.setItem('layers', JSON.stringify(customLayers));
    }
});

window.addEventListener('click', (e) => {
    const target = e.target;

    // close modal and/or menu
    if (target.id == 'close') {
        if (modal && modal.style.display == 'flex') {
            modal.style.display = 'none';
            modal.innerHTML = '';
            modal.classList.remove('full');
            modal.classList.remove('disclaimer');

            removeHash();
        }

        if (menu && menu.style.display == 'block') {
            menu.style.display = 'none';
            modal.innerHTML = '';
        }
    }

    // click on positive CTA button in dialog
    if (target.id == 'pos' && target.classList.contains('cta')) {
        if (document.querySelector('.dialog').classList.contains('disclaimer')) {
            localStorage.setItem('disclaimer', new Date().getTime() / 1000);
        }

        document.querySelector('.dialog').remove();
        document.querySelector('.backdrop').style.display = 'none';
        history.replaceState(null, null, ' ');
    }

    if (!menu.contains(target) && menu.style.display == 'block') {
        menu.style.display = 'none';
        modal.innerHTML = '';
    }

    // Toggle favorite status
    if (target.id === 'fav') {
        const isUnfavorite = target.classList.contains('unfavorite');

        target.classList.toggle('favorite', isUnfavorite);
        target.classList.toggle('unfavorite', !isUnfavorite);
        target.setAttribute('title', isUnfavorite ? 'Remove from favorites' : 'Add to favorites');

        settings.doFavorites(
            isUnfavorite ? 'add' : 'remove',
            target.dataset.category,
            target.dataset.id,
            target.dataset.title
        );
    }

    /* on search result click */
    if (e.target.id == 'result') {
        const s = document.querySelector('.search');
        const sr = document.querySelector('.search-results');

        document.querySelector('#search').value = '';
        s.classList.remove('open');
        s.style.display = 'none';
        sr.style.display = 'none';
        sr.innerHTML = noRes;

        if (e.target.getAttribute('data-report')) {
            map.fitBounds(geojsonExtent(roadsArray[e.target.getAttribute('data-pos')].geometry), {
                padding: 60
            });
        } else {
            map.flyTo({
                center: [e.target.getAttribute('data-lon'), e.target.getAttribute('data-lat')],
                zoom: 12
            });
        }
    }

    // on area link click
    if (e.target.id == 'areaLink') {
        const data = e.target.dataset,
            name = e.target.innerHTML;

        new Modal(null).updateURI('area', name.toLowerCase().replace('/', '-').replaceAll(' ', '-'), `${name} Area Road Conditions`);

        map.flyTo({
            center: [data.lon, data.lat],
            zoom: data.zoom
        });

        document.querySelector('.dialog').remove();
        document.querySelector('.backdrop').style.display = 'none';
    }
});

window.addEventListener('mousedown', (e) => {
    const target = e.target,
        user = document.querySelector('#user'),
        search = document.querySelector('.search'),
        results = document.querySelector('.search-results');

    if (e.button === 0) {
        if (!modal.contains(target) && !user.contains(target) && !search.contains(target)) {
            if (isVisible(modal)) {
                modal.style.display = 'none';
                modal.classList.remove('full');
                modal.classList.remove('disclaimer');

                removeHash();
            }
        }

        if (!user.contains(target) && target.parentElement.parentElement.id != 'userMenu' && document.querySelector('#userMenu') != null) {
            document.querySelector('#userMenu').remove();
        }

        if (!search.contains(target) && !results.contains(target) && search.style.display == 'flex') {
            search.style.display = 'none';
            results.style.display = 'none';
            results.innerHTML = noRes;
        }
    }
});

window.addEventListener('keyup', (e) => {
    const target = e.target;
    const sr = document.querySelector('.search-results')

    /* close dialog when enter key is pressed */
    if (isVisible(document.querySelector('.dialog')) && (e.code == 'Enter' || e.code == 'Escape')) {
        document.querySelector('.dialog').remove();
        document.querySelector('.backdrop').style.display = 'none';
    } else {
        /* close modal when esc key is pressed */
        if (isVisible(modal) && e.code == 'Escape') {
            modal.style.display = 'none';
            modal.classList.remove('full');
            modal.classList.remove('disclaimer');

            removeHash();
        }
    }

    if (target.id == 'search') {
        if (search.value.length >= 2) {
            document.querySelector('.search').classList.add('open');
            sr.style.display = 'block';

            let count = 0,
                res = '';

            /* search through all 12-37 reporting stations */
            roadsArray.forEach((e, n) => {
                if (e.properties.name.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-report="' + e.properties.name + '" data-pos="' + n + '">' + e.properties.name + '<span>Road Report</span></div>';
                    count++;
                }
            });

            /* search through Oregon cities */
            cities.forEach((c) => {
                if (c.city.toLowerCase().search(search.value.toLowerCase()) >= 0) {
                    res += '<div id="result" data-city="' + c.city + '" data-lat="' + c.lat + '" data-lon="' + c.lon + '">' + c.city + ', OR<span>City</span></div>';
                    count++;
                }
            });

            if (count == 0) {
                if (document.querySelector('.search-result #result.none') != null) {
                    sr.querySelector('#result.none').innerHTML = 'No results found';
                } else {
                    sr.innerHTML = noRes;
                }
            } else {
                sr.innerHTML = res;
            }
        } else {
            if (document.querySelector('.search-result #result.none') != null) {
                sr.querySelector('#result.none').innerHTML = 'No results found';
            } else {
                sr.innerHTML = noRes;
            }
        }
    }
});

(function (global) {
    function Extent() {
        this._bbox = [Infinity, Infinity, -Infinity, -Infinity];
        this._valid = false;
    }
    Extent.prototype.include = function ([lng, lat]) {
        this._valid = true;
        this._bbox[0] = Math.min(this._bbox[0], lng);
        this._bbox[1] = Math.min(this._bbox[1], lat);
        this._bbox[2] = Math.max(this._bbox[2], lng);
        this._bbox[3] = Math.max(this._bbox[3], lat);
        return this;
    };
    Extent.prototype.bbox = function () { return this._valid ? this._bbox : null; };
    Extent.prototype.polygon = function () {
        if (!this._valid) return null;
        const [minX, minY, maxX, maxY] = this._bbox;
        return { type: "Polygon", coordinates: [[[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY], [minX, minY]]] };
    };

    function geojsonCoords(gj) {
        const coords = [];
        function flatten(obj) {
            if (!obj) return;
            switch (obj.type) {
                case "FeatureCollection": obj.features.forEach(flatten); break;
                case "Feature": flatten(obj.geometry); break;
                case "GeometryCollection": obj.geometries.forEach(flatten); break;
                default:
                    if (Array.isArray(obj.coordinates)) {
                        const stack = [obj.coordinates];
                        while (stack.length) {
                            const item = stack.pop();
                            typeof item[0] === "number" ? coords.push(item) : stack.push(...item);
                        }
                    }
            }
        }
        flatten(gj);
        return coords;
    }

    function traverse(obj, fn) {
        if (!obj || typeof obj !== "object") return;
        fn(obj);
        Object.values(obj).forEach(v => traverse(v, fn));
    }

    function geojsonExtent(gj) {
        const ext = new Extent();
        geojsonCoords(gj).forEach(c => ext.include(c));
        return ext.bbox();
    }

    geojsonExtent.polygon = function (gj) {
        const ext = new Extent();
        geojsonCoords(gj).forEach(c => ext.include(c));
        return ext.polygon();
    };

    geojsonExtent.bboxify = function (obj) {
        const geojsonTypes = ["FeatureCollection", "Feature", "GeometryCollection", "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"];
        traverse(obj, function (v) {
            if (v && v.type && geojsonTypes.includes(v.type)) {
                v.bbox = geojsonExtent(v);
            }
        });
    };

    global.geojsonExtent = geojsonExtent;
})(window);