const host = `https://${window.location.host}/`,
    pageName = window.location.pathname.replace('/account/', ''),
    apiURL = 'https://api.mapotechnology.com/v1/',
    mapofireAPI = 'https://mapofire.com/api/v1/',
    usersAPI = 'account/secure/apis/',
    apiKey = 'c196d0958608ad2b7d4af2be078ecc54';

const stateLabels = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District of Columbia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
},
    iconsA = ['4x4', 'big_air', 'bigfoot', 'bridge', 'cabin', 'camp',
        'caution', 'fishing', 'hike', 'info', 'lake', 'media',
        'mtn_bike', 'parking', 'redneck', 'restroom', 'river', 'sledding', 'summit', 'swim'],
    iconsB = ['4x4', 'Big Air', 'Bigfoot', 'Bridge', 'Cabin', 'Campground',
        'Caution', 'Fishing', 'Hike', 'Info', 'Lake', 'Media',
        'Mountain Bike', 'Parking', 'Redneck', 'Restroom', 'River', 'Sledding', 'Summit', 'Swimming'];

let calc,
    map,
    kw,
    //token = '',
    wildfires = [],
    keywordResults,
    centerMarker,
    WILDFIRE_NEARBY_DIST = 50;

async function api(uri, fields = null, v2 = false, forAuth = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu'),
        isInternal = url.includes(apiURL) || url.includes(apiURL.replace('v1', 'v2')) || url.includes(host) || url.includes(mapofireAPI),
        ops = {
            method: isExternal ? 'GET' : 'POST'
        },
        fd = new FormData();

    if (isInternal) fd.append('key', apiKey);

    if (fields && Array.isArray(fields)) {
        for (const [k, v] of fields) {
            fd.append(k, v);
        }
    }

    if (forAuth) ops['credentials'] = 'include';
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
        if (e.name !== 'AbortError') console.error(`Fetch or JSON parsing error for URL: ${url}`, e.message);
        result = null
    }

    return result;
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

function loadScript(src) {
    return new Promise(function (resolve, reject) {
        var s;
        s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function goBack(fallbackUrl) {
    const sameSite = document.referrer && new URL(document.referrer).origin === location.origin;

    if (sameSite && history.length > 1) {
        history.back();
    } else {
        window.location.href = fallbackUrl;
    }

    return false;
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function ucwords(s) {
    const smallWords = new Set(['a', 'an', 'the', 'is', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'with']);
    return s.split(' ').map((word, i) => i === 0 || !smallWords.has(word.toLowerCase()) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(' ');
}

function timeAgo(t, w, c) {
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

function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length < 4) return cleaned;

    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;

    return cleaned;
}

function validateEmail(email) {
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function getUserToken() {
    return document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null;
}

class QueryWildfires {
    constructor() {
        this.totalRows = 0;
        this.wildfires = null;
        this.listOfFires = document.querySelector('#listOfFires');
        this.now = Date.now() / 1000;
        this.numberFormat = new Intl.NumberFormat('en-US');
    }

    async search(fields = null) {
        const body = [];

        window.history.pushState(
            {},
            '',
            `${window.location.origin}${window.location.pathname}${fields ? `?${fields}` : ''}`
        );

        if (fields) {
            for (const [key, value] of new URLSearchParams(fields).entries()) {
                body.push([key, value]);
            }
        }

        document.querySelector('#resultsNum').innerHTML = '';
        this.listOfFires.querySelector('tbody').innerHTML = '<tr><td colspan="10" style="text-align:center"><div class="spinner"></div></td></tr>';

        const resp = await api(`${apiURL}account/getFires` + (pageName.search('duplicates') >= 0 ? '/duplicates' : ''), body, true);
        this.success(resp);
    }

    success(resp) {
        if (resp && resp.response.fires) {
            this.totalRows = resp.response.count;
            this.wildfires = resp.response.fires;
            this.listOfFires.querySelector('tbody').innerHTML = '';
            this.pagination();

            for (let i = 0; i < this.wildfires.length; i++) {
                this.createRow(this.wildfires[i], (i > 0 ? this.wildfires[i - 1] : null));
            }
        } else {
            this.listOfFires.querySelector('tbody').innerHTML = '<tr><td colspan="9" style="text-align:center">No wildfires were found for that search criteria</td></tr>';
        }
    }

    pagination() {
        const regex = window.location.search.match(/results=([0-9]+)/);
        const resultsPage = regex ? parseInt(regex[1], 10) : 1;

        const total = parseInt(this.totalRows, 10);
        const perPage = 100;

        const curResults = resultsPage <= 1 ? 1 : ((resultsPage - 1) * perPage) + 1;

        let max = resultsPage * perPage;
        max = Math.min(max, total);

        document.querySelector('#resultsNum').innerHTML = `Showing results ${this.numberFormat.format(curResults)} to ${this.numberFormat.format(max)} of ${this.numberFormat.format(total)}`;

        const links = Math.ceil(total / perPage);
        const container = document.querySelector('.pagination > div');
        container.innerHTML = '';

        const createPage = (i) => {
            let el;

            if (i === resultsPage) {
                el = document.createElement('b');
            } else {
                el = document.createElement('a');

                const params = new URLSearchParams(window.location.search);
                params.set('results', i);

                el.href = '?' + params.toString();
            }

            el.textContent = i;
            container.appendChild(el);
        };

        const createDots = () => {
            const span = document.createElement('span');
            span.textContent = '...';
            container.appendChild(span);
        };

        if (links <= 20) {
            for (let i = 1; i <= links; i++) {
                createPage(i);
            }
        } else {
            const range = 4;

            createPage(1);
            if (resultsPage > 1 + range + 1) createDots();

            for (let i = Math.max(2, resultsPage - range); i <= Math.min(links - 1, resultsPage + range); i++) {
                createPage(i);
            }

            if (resultsPage < links - range - 1) createDots();

            createPage(links);
        }
    }

    size(a) {
        if (a === '' || a === null || a === undefined) return 'Unk';

        const acres = parseFloat(a);
        if (isNaN(acres)) return 'Unk';

        // format to 2 decimals
        let o = acres.toFixed(2);

        if (o.slice(-2) === '00') {
            o = Math.round(acres).toString();
        } else if (o.slice(-1) === '0') {
            o = acres.toFixed(1);
        }

        return this.numberFormat.format(o);
    }

    createRow(fire, lastFire) {
        const isDuplicate = this.isDuplicateFire(fire, lastFire);

        const tr = document.createElement('tr');
        tr.dataset.wfid = fire.wfid;
        tr.innerHTML = this.createCols(fire);

        /*if (pageName != 'admin/wildfires/duplicates' && fire.display !== '1') {
            tr.style.textDecoration = 'line-through';
        } else */if (pageName == 'admin/wildfires/duplicates' && isDuplicate) {
            tr.style.color = 'red';
        }

        this.listOfFires.querySelector('tbody').appendChild(tr);
    }

    createCols(fire) {
        const dateOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }, timeOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };

        const date = this.now - fire.date > 9000 ? `${new Intl.DateTimeFormat('en-US', dateOptions).format(fire.date * 1000)} - ${new Intl.DateTimeFormat('en-US', timeOptions).format(fire.date * 1000)}` : timeAgo(fire.date);
        const url = `../admin/wildfires/${fire.owner == 'mapo' ? 'modify' : 'edit'}?wfid=${fire.wfid}`;
        const dupURL = pageName == 'admin/wildfires/duplicates' ? `&nbsp;|&nbsp;<a href="#" class="hidefrommap" data-wfid="${fire.wfid}" onclick="return false">hide</a>` : '';

        return `<td>${stateLabels[fire.state]}</td>
            <td>${fire.incidentID}</td>
            <td>${fire.type}</td>
            <td>${fire.name}</td>
            <td>${this.size(fire.acres)}</td>
            <td>${date}</td>
            <td>${fire.display == '1' ? 'Yes' : 'No'}</td>
            <td>${fire.owner}</td>
            <td>${timeAgo(fire.updated)}</td>
            <td>${this.listOfFires.dataset.edit == '1' ? `<a style="font-weight:400!important" href="${url}">edit</a>
            &nbsp;|&nbsp;<a style="font-weight:400!important" target="_blank" href="//mapofire.com/${fire.url}">view</a>${dupURL}` : ''}</td>`;
    }

    isDuplicateFire(currentFire, lastFire, acresThreshold = 10.0, idLastDigits = 3, staleHours = 12) {
        if (!currentFire || !lastFire) return false;

        const currentNameState = (currentFire.state + currentFire.name).toLowerCase().trim();
        const lastNameState = (lastFire.state + lastFire.name).toLowerCase().trim();

        if (currentNameState !== lastNameState) {
            return false;
        }

        const stale = Number(currentFire.updated) - Number(lastFire.updated) > staleHours * 3600;

        if (stale) {
            return true;
        }

        const currentIdSuffix = String(currentFire.incidentID).slice(-idLastDigits);
        const lastIdSuffix = String(lastFire.incidentID).slice(-idLastDigits);

        if (currentIdSuffix === lastIdSuffix) {
            return true;
        }

        const currentAcres = Number(currentFire.acres);
        const lastAcres = Number(lastFire.acres);

        if (
            !isNaN(currentAcres) &&
            !isNaN(lastAcres) &&
            currentAcres > 0 &&
            lastAcres > 0
        ) {
            return Math.abs(currentAcres - lastAcres) <= acresThreshold;
        }

        return false;
    }
}

class Calculate {
    distance(lat1, lon1, lat2, lon2, metric = false) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            km = R * c,
            dist = metric ? km : km / 1.60934;

        return dist;
    }

    bearing(startLat, startLng, destLat, destLng, raw = false) {
        startLat = this.deg2rad(startLat);
        startLng = this.deg2rad(startLng);
        destLat = this.deg2rad(destLat);
        destLng = this.deg2rad(destLng);

        let y = Math.sin(destLng - startLng) * Math.cos(destLat),
            x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng),
            brng = Math.atan2(y, x);

        const out = (this.rad2deg(brng) + 360) % 360;

        return raw ? out : this.getCompassDirection(out);
    }

    getCompassDirection(bearing) {
        const dir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return dir[Math.round(bearing / 22.5) % 16];
    }

    deg2rad(d) {
        return d * Math.PI / 180;
    }

    rad2deg(r) {
        return r * 180 / Math.PI;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));

        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

async function getCrowdsource() {
    const container = document.querySelector('#crowdsourced');
    if (!container) return;

    const json = await api(`${apiURL}crowdsource`, [['verified', 0]]);

    if (!json.features.length) {
        container.innerHTML = '<div class="message info">No crowdsourced fires have been reported today.</div>';
        return;
    }

    const rows = json.features
        .filter(a => a.properties.reported > new Date().setHours(0, 0, 0) / 1000)
        .map(data => {
            const rpt = data.properties;

            return `<tr>
                <td>#${rpt.reportId}</td>
                <td>${stateLabels[rpt.state]}</td>
                <td>${timeAgo(rpt.reported)}</td>
                <td><a target="_blank" href="./admin/crowdsource/view?id=${data.id}">view</a></td>
            </tr>`;
        });

    if (rows == 0) {
        container.innerHTML = '<div class="message info">No crowdsourced fires have been reported today.</div>';
        return;
    }

    const content = `<div class="table-responsive">
        <table class="table small">
            <thead>
                <tr><th>Report #</th><th>State</th><th>Reported</th><th></th></tr>
            </thead>
            <tbody>
                ${rows.join('')}
            </tbody>
        </table>
    </div>`;

    container.innerHTML = content;
}

async function getFires(refresh = false) {
    const nearby = document.getElementById('nearby');

    if (refresh) {
        nearby.innerHTML = '<div class="spinner"></div>';
    }

    const resp = await api(`${apiURL}wildfires/all,new,smk`);
    wildfires = resp.features;

    if (!userLocation) return;

    if (!resp.features.length) {
        nearby.innerHTML = '<div class="message info">There are no wildfires currently near you.</div>';
        return;
    }

    let content = [];

    content.push('<div class="table-responsive"><table class="table small"><thead><tr><th>Name</th><th>Type</th><th>Location</th></tr></thead><tbody>');

    resp.features
        .map(f => ({
            feature: f,
            dist: calc.distance(userLocation.lat, userLocation.lon, f.geometry.coordinates[1], f.geometry.coordinates[0])
        }))
        .filter(f => f.dist <= WILDFIRE_NEARBY_DIST)
        .sort((a, b) => a.dist - b.dist)
        .forEach(({ feature: f, dist }) => {
            const lat = f.geometry.coordinates[1],
                lon = f.geometry.coordinates[0],
                name = f.properties.name,
                type = f.properties.type,
                url = f.properties.url.replace('wildfire/', 'fires/'),
                bear = calc.bearing(userLocation.lat, userLocation.lon, lat, lon, true);

            content.push(`<tr>
                <td><a target="blank" href="https://mapofire.com/${url}?utm_campaign=mapofire&utm_medium=wildfires_near_you&utm_source=account">${name}${(type != 'Smoke Check' ? ' Fire' : '')}</td>
                <td>${ucwords(type)}</td>
                <td>
                    <i class="fas fa-location-arrow" style="width:18px;margin-right:.5em;color:var(--orange);transform:rotate(${Number(bear - 45)}deg)"></i>
                    <span>${Math.round(dist)} miles ${calc.getCompassDirection(bear)} of you</span>
                </td>
            </tr>`);
        });

    content.push('</tbody></table></div>');

    nearby.innerHTML = content.join('');
}

function getMyLoc(target) {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const resp = await api(`${apiURL}geocode/reverse`, [
            ['lat', position.coords.latitude],
            ['lon', position.coords.longitude]
        ], true);

        const a = resp.geocode.city,
            b = resp.geocode.state_name,
            c = resp.geocode.zip_code,
            lat = resp.geocode.lat,
            lon = resp.geocode.lon,
            d = { city: a, state: b, zip: c, lat: lat, lon: lon };

        if (document.querySelector('input[name=zip]').value === String(c)) {
            alert('You current location and device location are the same.');
        }

        document.querySelector('input[name=city]').value = a;
        document.querySelector('input[name=state]').value = b;
        document.querySelector('input[name=zip]').value = c;
        document.querySelector('input[name=lat]').value = lat;
        document.querySelector('input[name=lon]').value = lon;
        document.querySelector('input[name=location]').value = JSON.stringify(d);
        target.disabled = false;
        target.value = 'Use current location';

        document.querySelector('input[name=location]').dispatchEvent(new Event('change', { bubbles: true }))
    });
}

function findFire(wfid) {
    return wildfires.find(f => f.properties.wfid == wfid) ?? null;
}

async function downloadUserData() {
    try {
        const userData = await api(`${host}${usersAPI}download`);

        if (!userData) {
            alert('There was an error getting your data for download.');
            return;
        }

        const jsonString = JSON.stringify(userData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `mapollc_user-data_${new Date().getTime()}.json`;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        alert('There was an error getting your data for download.');
        console.error('Failed to download user data:', error);
    }
}

function downloadFile(name, url) {
    const link = document.createElement('a');
    link.href = `https://cdn.mapotrails.com/userGIS/${url}`;
    link.download = name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
}

async function getFavoriteFires() {
    return await api(`${host}${usersAPI}favFires`, null, false, true);
}

function displayFavFires(resp) {
    const ff = document.querySelector('#favfires');

    if (!resp.response.fires) {
        ff.innerHTML = '<div class="message info">You are not currently following any active wildfires.</div>';
        return;
    }

    const validFires = resp.response.fires.filter(f => findFire(f.wfid) != null);

    if (!validFires.length) {
        ff.innerHTML = '<div class="message info">You are not currently following any active wildfires.</div>';
        return;
    }

    const rows = validFires.map(f => {
        const name = f.name,
            type = f.type,
            geo = f.geo,
            url = f.url;

        return `<tr>
            <td><a target="blank" href="https://mapofire.com/${url}?utm_campaign=mapofire&utm_medium=tracked_fires&utm_source=account">${name}${(type != 'Smoke Check' ? ' Fire' : '')}</a></td>
            <td>${geo}</td>
            <td class="ctrl"><div id="unfollow" data-wfid="${f.wfid}" title="Unfollow this incident" class="far fa-ellipsis-vertical control unfollow"></div></td>
        </tr>`;
    });

    const content = `<div class="table-responsive">
        <table class="table small">
            <thead>
                <tr><th>Name</th><th>Location</th><th class="ctrl"></th></tr>
            </thead>
            <tbody>
                ${rows.join('')}
            </tbody>
        </table>
    </div>`;

    ff.innerHTML = content;
}

async function getFavoriteTrails() {
    const favTrails = document.querySelector('#favtrails');
    const resp = await api(`${host}${usersAPI}favtrails`, null, false, true);

    if (!resp.response || resp.response.length === 0) {
        favTrails.innerHTML = '<div class="message info">You currently don\'t have any favorite trails.</div>';
        return;
    }

    let content = [];

    resp.response
        .forEach(f => {
            const id = f.id,
                title = f.title,
                url = f.url;

            content.push(`<div class="data-item" data-tid="${id}">
                <div class="item">
                    <a target="blank" href="https://mapotrails.com/${url}">${title}</a>
                </div>
                <div class="item ctrl">
                    <div id="unfavorite" data-tid="${id}" class="far fa-ellipsis-vertical control" title="Unfavorite this trail"></div>
                </div>
            </div>`);
        });

    favTrails.innerHTML = content.join('');
}

async function getUploads() {
    const ups = document.querySelector('#uploads');
    const resp = await api(`${host}${usersAPI}userUploads`, null, false, true);

    if (!resp.response || resp.response.length === 0) {
        ups.innerHTML = '<div class="message info">You haven\'t uploaded any content to Map of Trails.</div>';
        return;
    }

    let content = ['<div class="table-responsive"><table class="table small"><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Created</th></tr></thead><tbody>'];

    resp.response
        .forEach(f => {
            content.push(`<tr>
                <td><a href="#" onclick="downloadFile('${f.fileName}', '${f.file}')">${f.fileName}</a></td>
                <td>${f.type}</td><td>${calc.formatBytes(f.size)}</td><td>${timeAgo(f.created)}</td>
            </tr>`);
        });

    content.push('</tbody></table></div>');

    ups.innerHTML = content.join('');
}

async function geocode(a, b) {
    const spinner = document.querySelector('#geocoding'),
        lat = document.querySelector('input[name=lat]'),
        lon = document.querySelector('input[name=lon]');

    lat.disabled = true;
    lon.disabled = true;
    spinner.style.display = 'inline-block';

    const json = await api(`${apiURL}geocode/incident`, [['lat', a], ['lon', b]], true, false);
    const geo = json?.geocode;

    document.querySelector('input[name=near]').value = JSON.stringify({
        county: geo.county.county,
        fips: geo.county.fips,
        near: geo.near
    });
    document.querySelector('input[name=tz]').value = geo?.timezone;
    document.querySelector('input[id=geoc]').value = geo?.near;

    document.querySelectorAll('select[name=state] option').forEach(e => {
        if (e.value == geo?.state) e.selected = true;
    });

    document.querySelector('select[name=state]').disabled = false;
    lat.disabled = false;
    lon.disabled = false;
    spinner.style.display = 'none';
}

function closeDialog() {
    const dialog = document.querySelector('#dialog');
    const popup = document.querySelector('.popup');

    document.querySelector('#shadow').style.display = 'none';

    if (dialog) dialog.remove();
    if (popup) popup.remove();
}

function createDialog(title, text, affirm = 'Yes', func) {
    const popup = document.createElement('div');

    popup.classList.add('popup');
    popup.innerHTML = `<i id="close-popup" class="far fa-xmark"></i>
        <h2 style="color:var(--black)">${title}</h2><p>${text}</p>
        <div class="options">
        <a href="#" class="btn btn-gray" onclick="closeDialog();return false">Cancel</a>
        <a href="#" class="btn btn-blue" onclick="${func};return false">${affirm}</a></div>`;

    document.body.appendChild(popup);
    shadow.style.display = 'block';

    document.querySelector('#close-popup').addEventListener('click', () => {
        document.querySelector('.popup').remove();
        shadow.style.display = 'none';
    });
}

async function unfollow(wfid) {
    const favfires = document.querySelector('#favfires');
    const total = favfires.querySelectorAll('.row').length;

    try {
        const resp = await api(`${mapofireAPI}trackFires/remove`, [['wfid', wfid]], false, true);

        if (resp.success && resp.success == 'removed') {
            closeDialog();

            favfires.querySelectorAll('.data-item').forEach(f => {
                if (f.dataset.wfid == wfid) f.remove();
            });

            if (total - 1 == 0) favfires.innerHTML = '<div class="message error">You are not currently following any wildfires.</div>';
        }
    } catch (err) {
        console.error(err);
    }
}

async function unfavorite(tid) {
    const favtrails = document.querySelector('#favtrails');
    const total = favtrails.querySelectorAll('.row').length;

    try {
        const resp = await api(`${host}${usersAPI}favtrails`, [['method', 'remove'], ['tid', tid]]);

        if (resp.response.success == 1) {
            closeDialog();

            favtrails.querySelectorAll('.row').forEach(f => {
                if (f.dataset.tid == tid) f.remove();
            });

            if (total - 1 == 0) favtrails.innerHTML = '<div class="message error">You currently don\'t have any favorite trails.</div>';
        }
    } catch (err) {
        console.error(err);
    }
}

function addWaypoint() {
    let selects = ['<option>- Icon -</option>'];

    for (const i = 0; i < iconsA.length; i++) {
        selects.push(`<option value="${iconsA[i]}">${iconsB[i]}</option>`);
    }

    /*const line = '<li><input type="hidden" name="waypoint[id][]" value="">' +
        '<input type="hidden" name="waypoint[delta][]" value="">' +
        '<input type="text" name="waypoint[name][]" class="input" style="display:inline-block;max-width:240px" placeholder="Waypoint Name" value="">' +
        '<input type="text" name="waypoint[note][]" class="input" style="display:inline-block;max-width:400px" placeholder="Waypoint Notes" value="">' +
        '<select name="waypoint[icon][]" class="input" style="display:inline-block;max-width:170px">' + selects + '</select>' +
        '<input type="text" name="waypoint[lat][]" class="input" style="display:inline-block;max-width:140px" placeholder="Latitude" value="">' +
        '<input type="text" name="waypoint[lon][]" class="input" style="display:inline-block;max-width:140px" placeholder="Longitude" value=""></li>';*/
    const line = `<li>
        <input type="hidden" name="waypoint[id][]" value="">
        <input type="hidden" name="waypoint[delta][]" value="">
        <div class="wrap">
            <div class="column">
                <label style="margin-bottom:5px">Name</label>
                <input type="text" name="waypoint[name][]" class="input" placeholder="Waypoint Name" value="">
            </div>
            <div class="column">
                <label style="margin-bottom:5px">Notes</label>
                <input type="text" name="waypoint[note][]" class="input" placeholder="Waypoint Notes" value="">
            </div>
            <div class="column">
                <label style="margin-bottom:5px">Icon</label>
                <select name="waypoint[icon][]" class="input" style="max-width:165px;margin:0"><option>- Icon -</option>${selects.join('')}</select>
            </div>
            <div class="column">
                <label style="margin-bottom:5px">Latitude</label>
                <input type="text" name="waypoint[lat][]" class="input" style="max-width:150px" placeholder="45.01234" value="">
            </div>
            <div class="column">
                <label style="margin-bottom:5px">Longitude</label>
                <input type="text" name="waypoint[lon][]" class="input" style="max-width:150px" placeholder="-118.123456" value="">
            </div>
            <div class="column">
                <a class="btn btn-sm btn-red" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletewaypoint" data-id="" onclick="return false">Delete</a>
            </div>
        </div>
    </li>`;

    document.querySelector('ul#waypoints').insertAdjacentHTML('beforeend', line);
}

function addGPX() {
    let ops = [],
        n = document.querySelectorAll('ul#files li').length,
        modes = ['ATV Track', 'Gravel', 'Road', 'Single Track', 'Ski Line', 'Snowmobile', 'Tour'];

    modes.forEach(e => {
        ops.push(`<option value="${e}">${e}</option>`);
    });

    var line = `<li>
        <input type="hidden" name="gpx[id][${n}]" value=""><input type="hidden" name="gpx[delta][${n}]" value="">
        <div class="wrap">
            <div class="file">
                <label style="margin-bottom:5px">Map Data File</label>
                <input type="file" class="input" name="gpxFile[]" accept=".gpx">
            </div>
            <div class="column">
                <label style="margin-bottom:5px">Description</label>
                <input type="text" class="input" style="display:inline-block;max-width:400px" name="gpx[caption][${n}]" placeholder="GPX file caption" value="">
            </div>
            <div class="column">
                <label style="margin-bottom:5px">Type</label>
                <select name="gpx[mode][${n}]" class="input" style="margin-top:0;max-width:175px">
                    <option value="">- Choose Mode -</option>${ops}
                </select>
            </div>
            <div class="column">
                <label style="margin-bottom:1em">Display</label>
                <div>
                    <div class="radio">
                        <input type="radio" name="gpx[display][${n}]" value="1"><label>Yes</label>
                    </div>
                    <div class="radio">
                        <input type="radio" name="gpx[display][${n}]" value="0"><label>No</label>
                    </div>
                </div>
            </div>
            <div class="column">
                <a class="btn btn-sm btn-red" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletegpx" data-tid="" data-delta="${n}" data-filename="" data-id="" onclick="return false">Delete</a>
            </div>
        </div>
    </li>`;

    document.querySelector('ul#files').insertAdjacentHTML('beforeend', line);
}

function postResume(url, params = null) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;

    if (params != null) {
        params.forEach((param) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = param[0];
            input.value = param[1];
            form.appendChild(input);
        });
    }

    document.body.appendChild(form);
    form.submit();
}

async function cancelSub(fields, cancelNow, isApp, msg) {
    const popup = document.querySelector('.popup'),
        shadow = document.querySelector('#shadow');

    if (popup) {
        popup.remove();
        shadow.style.display = 'none';
    }

    document.querySelector('#cancels').innerHTML = '<div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>';

    const data = await api(`${apiURL}payment/subscriptions/cancel`, fields, true);

    if (data.response == 'success') {
        if (isApp) {
            window.location.href = `https://mapofire.com/confirmation?cancel=1&when=${cancelNow ? 'immediate' : 'later'}`;
        } else {
            postResume(`https://${window.location.host}${window.location.pathname}`, [['cancel', 1], ['when', (cancelNow ? 'immediate' : 'later')]]);
        }
    }
}

function billing() {
    const cancel = document.querySelector('#cancel'),
        modify = document.querySelector('#modify'),
        shadow = document.querySelector('#shadow'),
        rs = document.querySelector('#resume'),
        cancels = document.querySelector('#cancels'),
        popup = document.querySelector('.popup'),
        hash = window.location.hash,
        forcedUpgrade = hash.match(/upgrade=true/) != null;

    // get invoices for the customer
    getInvoices();

    if (modify) {
        modify.addEventListener('click', (t) => {
            const method = t.target.dataset.method,
                sid = t.target.dataset.sid,
                npid = t.target.dataset.newPlan,
                newName = t.target.dataset.name,
                isApp = t.target.dataset.app == '1' ? true : false,
                popup = document.createElement('div'),
                amt = '$' + (t.target.dataset.amount / 100).toFixed(2),
                extra = method == 'upgrade' ? 'Your default payment method will be charged ' + amt + '.' : 'We will apply a credit for any unused time on your current plan toward your next invoice.';

            popup.classList.add('popup');
            popup.innerHTML = `<i id="close-popup" class="far fa-xmark"></i>
                <h2>${ucfirst(method)} subscription</h2>
                <p>Are you sure you want to ${method} your subscription to <b>${newName}</b>? ${extra}</p>
                <div class="options">
                <a href="#" id="modify-now" class="btn btn-${method == 'downgrade' ? 'red' : 'green'}" onclick="return false">Yes, ${method}</a>
                <a href="#" id="nvm" class="btn btn-gray" onclick="return false">Cancel</a>`;

            document.body.appendChild(popup);
            shadow.style.display = 'block';

            document.querySelector('#close-popup').addEventListener('click', () => {
                popup.remove();
                shadow.style.display = 'none';
            });

            document.querySelector('#nvm').addEventListener('click', () => {
                popup.remove();
                shadow.style.display = 'none';
            });

            document.querySelector('#modify-now').addEventListener('click', async () => {
                const shadow = document.querySelector('#shadow');

                if (popup) {
                    popup.remove();
                    shadow.style.display = 'none';
                }

                cancels.innerHTML = '<div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>';

                const data = await api(`${apiURL}payment/subscriptions/modify`, [['sid', sid], ['newPriceID', npid]], true);

                if (data.response == 'success') {
                    if (isApp) {
                        window.location.href = `https://mapofire.com/confirmation?modify=1&method=${method}`;
                    } else {
                        const post = [];
                        post.push([method, 'true']);

                        if (forcedUpgrade) post.push(['forced', 'true']);

                        postResume(`https://${window.location.host}${window.location.pathname}`, post);
                    }
                }
            });
        });

        if (hash != '' && forcedUpgrade) modify.click();
    }

    if (cancel) {
        cancel.addEventListener('click', (t) => {
            const popup = document.createElement('div'),
                isApp = t.target.dataset.app == '1' ? true : false,
                name = t.target.dataset.name,
                sid = t.target.dataset.sid;

            popup.classList.add('popup');
            popup.innerHTML = `<i id="close-popup" class="far fa-xmark"></i>
                <h2>Cancel subscription</h2>
                <p>You can cancel your <b>${name}</b> subscription immediately, or keep it active until the end of your billing period. Your subscription will not renew automatically.</p>
                <div class="options">
                <a href="#" id="cancel-now" class="btn btn-gray" onclick="return false">Cancel now</a>
                <a href="#" id="cancel-later" class="btn btn-red" onclick="return false">Cancel later</a>`;

            document.body.appendChild(popup);
            shadow.style.display = 'block';

            document.querySelector('#close-popup').addEventListener('click', (e) => {
                e.target.parentElement.remove();
                shadow.style.display = 'none';
            });

            const cancelClick = (sid, when) => {
                cancelSub(
                    [['sid', sid], ['timing', when]],
                    when == 'now' ? true : false,
                    isApp,
                    when == 'now' ? 'Your subscription has been canceled. You no longer have access to premium features.' : 'Your subscription will be canceled at the end of your billing period.'
                );
            };

            document.querySelector('#cancel-now').addEventListener('click', () => {
                cancelClick(sid, 'now', 'Your subscription has been canceled. You no longer have access to premium features.');
            });

            document.querySelector('#cancel-later').addEventListener('click', () => {
                cancelClick(sid, 'later');
            });
        });
    }

    if (rs) {
        rs.addEventListener('click', async (e) => {
            const isApp = e.target.dataset.app == '1' ? true : false;
            e.target.parentElement.innerHTML = '<div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>';
            e.target.classList.add('disabled');

            const data = await api(`${apiURL}payment/subscriptions/resume`, [
                ['sid', e.target.dataset.sid]
            ], true);

            if (data.response == 'success') {
                if (isApp) {
                    window.location.href = 'https://mapofire.com/confirmation?resume=1';
                } else {
                    postResume(`https://${window.location.host}${window.location.pathname}`, [['resume', 1]]);
                }
            }
        });
    }
}

async function getInvoices() {
    const invoiceDiv = document.querySelector('#invoices');

    if (!invoiceDiv) return;

    const inv = await api(`${host}${usersAPI}invoices`);

    if (inv.response == null || inv.response.data.length == 0) {
        invoiceDiv.innerHTML = '<p>There are no invoices or receipts for your account.</p>';
        return;
    }

    let table = [`<div class="table-responsive">
            <table class="table small"><thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>`];

    inv.response.data
        .forEach(invoice => {
            let amt = invoice.amount_remaining,
                links = [];

            if (invoice.status == 'paid') amt = invoice.amount_paid;
            if (invoice.hosted_invoice_url) links.push(`<a target="blank" href="${invoice.hosted_invoice_url}">View</a>`);
            if (invoice.invoice_pdf) links.push(` &nbsp;&middot;&nbsp; <a href="${invoice.invoice_pdf}">Download</a>`);

            table.push(`<tr>
                <td>${invoice.number ? invoice.number : (invoice.status == 'Draft' ? invoice.status : 'N/A')}</td>
                <td>${new Date(invoice.created * 1000).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                <td>$${(amt / 100).toFixed(2)}</td>
                <td><span class="inv-paid${invoice.status != 'paid' ? ' no' : ''}">${invoice.status}</span></td>
                <td>${links.join('')}</td>
            </tr>`);
        });

    invoiceDiv.innerHTML = `${table.join('')}</tbody></table></div>`;
}

async function doSearch(q) {
    let results = [];
    const sr = document.querySelector('.search-results');

    if (q.length > 0) {
        const resp = await api(`${apiURL}search`, [['citiesonly', 1], ['q', q]], true);

        if (resp.results != null) {
            resp.results
                .forEach(s => {
                    const data = s.data;
                    const name = `${data.city}, ${data.state} ${data.zip}`;

                    results.push(`<div class="result" data-name="${name}" data-lat="${s.lat}" data-lon="${s.lon}">${name}</div>`);
                });

            if (results.length) sr.innerHTML = results.join('');
        }
    }
}

async function complete() {
    // sort any tables by column name and order
    if (document.querySelector('table thead.sortable') != null) {
        document.querySelectorAll('thead.sortable th').forEach((e) => {
            if (e.innerHTML == '') return;

            if (e.getAttribute('onclick') != null) {
                const sort = window.location.href.match(/sort=([A-Za-z]+)/);
                const order = window.location.href.match(/order=([A-Za-z]+)/);
                const matches = e.getAttribute('onclick').match(/sort=([A-Za-z]+)&order=([A-Z]+)/);

                if (matches && sort != null && sort[1] == matches[1]) {
                    const c = document.createElement('i');

                    if (order[1] == 'DESC') {
                        c.classList.add('fas', 'fa-sort-down');
                    } else {
                        c.classList.add('fas', 'fa-sort-up');
                    }

                    e.appendChild(c);
                }
            }
        });
    }

    // home page
    if (pageName == 'home') {
        // allow the user to change the distance from them they see wildfire data
        const nearbyKey = 'mapo.account.nearbyDist';
        const changeNearbyDist = document.getElementById('nearbyFiresDist');
        const nearbyDistVal = localStorage.getItem(nearbyKey);

        changeNearbyDist.addEventListener('change', (e) => {
            const newVal = e.target.value;
            WILDFIRE_NEARBY_DIST = newVal;

            localStorage.setItem(nearbyKey, newVal);
            getFires(true);
        });

        WILDFIRE_NEARBY_DIST = nearbyDistVal ?? 50;
        changeNearbyDist.value = nearbyDistVal ?? 50;

        // get list of all fires (display nearby)
        await getFires();

        // get favorite fires once the entire list is retrieved
        getFavoriteFires().then(response => displayFavFires(response));

        // get everything else
        getCrowdsource();
        getFavoriteTrails();
        getUploads();
    }

    // billing page
    if (pageName == 'billing') {
        billing();
    }

    // user settings home location
    if (pageName == 'settings/location') {
        const sr = document.querySelector('.search-results');
        const q = document.querySelector('#q');
        const sub = document.querySelector('input[type=submit]');

        const locJson = document.querySelector('input[name=location]');
        const initLocJson = locJson.value;

        sub.disabled = true;

        locJson.addEventListener('change', (e) => {
            if (initLocJson != e.target.value) sub.disabled = false;
        });

        q.addEventListener('focus', () => {
            sr.style.display = 'block';
            sr.innerHTML = '<p style="padding:.5em">Search by city, state or zip code...</p>';
        });

        q.addEventListener('keydown', () => {
            sr.querySelectorAll('.result').forEach(e => e.remove());
            sr.innerHTML = '<p style="padding:.5em">Searching...</p>';
        });

        q.addEventListener('keyup', debounce((e) => {
            doSearch(e.target.value);
        }, 550));
    }

    // user settings change password
    if (pageName == 'settings/password') {
        const passInput = document.querySelector('input[name="pass"]'),
            confirmInput = document.querySelector('input[name="confirm_pass"]'),
            reqBox = document.querySelector('.req'),
            meets = document.querySelector('#meets');

        const rules = [
            { id: 'p1', test: v => v.length >= 8 },
            { id: 'p2', test: v => (/[0-9]/).test(v) },
            { id: 'p3', test: v => (/[a-z]/).test(v) },
            { id: 'p4', test: v => (/[A-Z]/).test(v) },
            { id: 'p5', test: v => (/[#$%^&@&*()+=\-\[\]';,.\/{}|":<>?~\\]/).test(v) }
        ];

        const show = el => el && (el.style.display = 'block'),
            hide = el => el && (el.style.display = 'none');

        passInput.addEventListener('focus', () => show(reqBox));
        passInput.addEventListener('blur', () => hide(reqBox));

        passInput.addEventListener('keyup', () => {
            const value = passInput.value;

            rules.forEach(rule => {
                document.querySelector(`#${rule.id}`).classList.toggle('met', rule.test(value));
            });
        });

        confirmInput.addEventListener('focus', () => show(meets));
        confirmInput.addEventListener('blur', () => hide(meets));

        confirmInput.addEventListener('keyup', () => {
            const match = confirmInput.value === passInput.value;

            meets.style.color = match ? 'var(--green)' : 'var(--red)';
            meets.textContent = match ? 'Your passwords match' : 'Your passwords don’t match';
        });
    }

    // mapofire settings
    if (pageName == 'mapofire') {
        const coordsDisp = document.querySelector('select[name=coordsDisplay]');
        const ctr = [settings.center[1], settings.center[0]];

        const coordsHelp = (t) => {
            let f = '';

            switch (t) {
                case 'dec':
                    f = '45.32, -118.1';
                    break;
                case 'dms':
                    f = '45° 19\' 12"N, 118° 6\' 0"W';
                    break;
                case 'utm':
                    f = '11T 413787.16 5019087.83';
                    break;
            }

            document.querySelector('#coordsHelp').innerHTML = `<b>Example:</b> ${f}`;
        };

        map = new maplibregl.Map({
            container: 'map',
            zoom: settings.zoom,
            center: ctr,
            style: `${apiURL}maps/style/terrain?key=${apiKey}`,
            projection: 'mercator',
            hash: false,
            maxPitch: 85,
            pitch: settings.pitch ?? 0,
            bearing: settings.bearing ?? 0,
            attributionControl: false
        });

        map.once('load', () => {
            map.getCanvas().style.cursor = 'default';

            map.addControl(new maplibregl.NavigationControl({
                showCompass: true,
                showZoom: true,
                visualizePitch: true
            }), 'top-right');

            map.addControl(new maplibregl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                fitBoundsOptions: {
                    maxZoom: 10.16
                },
                trackUserLocation: true,
                showUserHeading: true
            }), 'top-right');
        });

        map.on('style.load', () => {
            if (centerMarker != null) return;

            centerMarker = new maplibregl.Marker({
                color: 'rgb(241 143 1)',
                draggable: true
            })
                .setLngLat(ctr)
                .addTo(map);

            centerMarker.on('dragend', (e) => {
                const coords = e.target.getLngLat();

                map.setCenter([coords.lng, coords.lat]);

                document.querySelector('input[name=lat]').value = coords.lat;
                document.querySelector('input[name=lon]').value = coords.lng;
            });
        });

        map.on('moveend', () => {
            if (!centerMarker) return;

            const coords = map.getCenter();
            centerMarker.setLngLat([coords.lng, coords.lat]);

            document.querySelector('input[name=lat]').value = coords.lat;
            document.querySelector('input[name=lon]').value = coords.lng;
        });

        map.on('zoomend', () => {
            document.querySelectorAll('select[name=zoom] option').forEach((o, n) => {
                if (o.value == Math.round(map.getZoom())) document.querySelector('select[name=zoom]').options.selectedIndex = n;
            });
        });

        coordsDisp.addEventListener('change', (e) => {
            coordsHelp(e.target.value);
        });
        coordsHelp(coordsDisp.value);

        document.querySelector('input[type=range]').addEventListener('input', (e) => {
            document.querySelector('#psize').innerHTML = e.target.value + ' acres';
        });
    }

    if (pageName == 'admin/wildfires/edit' && window.location.search.includes('history=1')) {
        loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js').then(() => {
            const k = acresHistory.map(e => Number(e.updated) * 1000).reverse();
            const v = acresHistory.map(e => Number(e.acres)).reverse();

            new Chart(document.querySelector('#history-chart'), {
                type: 'line',
                data: {
                    labels: k,
                    datasets: [{
                        label: 'Acres',
                        data: v,
                        borderColor: '#ff5722',
                        backgroundColor: 'rgba(255,87,34,.15)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title(items) {
                                    return new Date(Number(items[0].label)).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    });
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'nearest'
                    },
                    scales: {
                        x: {
                            ticks: {
                                callback(value) {
                                    return new Date(this.getLabelForValue(value)).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    });
                                }
                            }
                        },
                        y: {
                            beginAtZero: false
                        }
                    }
                }
            });
        });
    }

    // ADMIN: wildfire management (specifically these pages)
    if (pageName == 'admin/wildfires' || pageName == 'admin/wildfires/duplicates') {
        const query = new QueryWildfires();
        query.search(window.location.search.replace('?', '') ?? null);

        document.querySelector('form#searchFires').addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const params = new URLSearchParams();

            for (const [key, value] of formData.entries()) {
                if (value !== '') params.append(key, value);
            }

            const queryString = params.toString();
            const updatedQueryParams = queryString.replace(/(sort|order)=[A-Za-z]+&?/g, '');

            document.querySelectorAll('.sortTable').forEach(th => {
                let url = th.dataset.url;
                th.dataset.url = `${url.match(/sort=[A-Za-z]+&order=[A-Za-z]+/)}&${updatedQueryParams}`;
            });

            query.search(queryString);
        });

        // searh wildfires
        const q = document.querySelector('#q');
        if (!q) return;

        q.addEventListener('focus', () => {
            const sr = document.querySelector('.search-results');

            sr.style.display = 'block';
            sr.innerHTML = '<p style="padding:.5em">Searching...</p>';
        });

        q.addEventListener('keyup', async (e) => {
            let results = [];
            const resp = await api(`${host}${usersAPI}jurisdictions`, [['q', e.target.value]]);

            resp.response.results.forEach(s => {
                const dis = `${s.unit}: ${s.agency + (s.area ? ` / ${s.area}` : '')}`;
                results.push(`<div class="result" data-name="${dis}" data-unit="${s.unit}">${dis}</div>`);
            });

            if (results.length) document.querySelector('.search-results').innerHTML = results.join('');
        });
    }

    // ADMIN: wildfire management (any page)
    if (pageName.includes('admin/wildfires')) {
        const ac = document.querySelector('input[name=acres]');

        if (ac) {
            ac.addEventListener('keyup', (e) => {
                e.target.value = e.target.value.replace(',', '');
            });
        }
    }

    // ADMIN: create a wildfire
    if (pageName == 'admin/wildfires/create') {
        const cs = document.querySelector('input[name=crowdsource]');

        // if this is a crowdsource report being turned into an incident, get geocode info
        if (cs) {
            const a = cs.dataset.lat,
                b = cs.dataset.lon;

            geocode(a, b);
        }

        document.querySelector('#f2').addEventListener('click', () => {
            document.querySelector('input[name=juris]').value = 'MAPO';
            document.querySelector('input[name=juris]').readOnly = true;
            document.querySelector('input[name=num]').value = document.querySelector('input[name=inhouse_num]').value;
            document.querySelector('input[name=num]').readOnly = true;
            document.querySelector('#notirwin').style.display = 'block';
        });

        document.querySelector('#f1').addEventListener('click', () => {
            document.querySelector('input[name=juris]').value = '';
            document.querySelector('input[name=juris]').readOnly = false;
            document.querySelector('input[name=num]').value = '';
            document.querySelector('input[name=num]').readOnly = false;
            document.querySelector('#notirwin').style.display = 'none';
        });

        document.querySelector('input[name=lat]').addEventListener('blur', (e) => {
            if (e.target.value != '' && document.querySelector('input[name=lon]').value != '') {
                geocode(e.target.value, document.querySelector('input[name=lon]').value);
            }
        });

        document.querySelector('input[name=lon]').addEventListener('blur', (e) => {
            if (e.target.value != '' && document.querySelector('input[name=lat]').value != '') {
                geocode(document.querySelector('input[name=lat]').value, e.target.value);
            }
        });

        document.querySelector('input[name=acres]').addEventListener('keyup', (e) => {
            e.target.value = e.target.value.replace(',', '');
        });
    }

    // ADMIN: trail management
    if (pageName.includes('admin/trails')) {
        keywordResults = document.getElementById('kw-results');
        kw = document.querySelector('input[name=keywords]');

        document.querySelector('#addwaypoint').addEventListener('click', () => addWaypoint());
        document.querySelector('#addgpx').addEventListener('click', () => addGPX());

        kw.addEventListener('keyup', (e) => {
            let res = '',
                i = 0;

            let search = e.target.value.toLowerCase().replaceAll(', ', ',').split(',');

            keywords.forEach(kw => {
                if (kw.toLowerCase().search(search[search.length - 1]) >= 0 && i < 25) {
                    res += '<div id="kw-item">' + kw + '</div>';
                    i++;
                }
            });

            if (search[search.length - 1] != '' && search[search.length - 1] != ' ') {
                keywordResults.style.display = 'block';
                keywordResults.innerHTML = res;
            }

            if (e.target.value == '' || i == 0) {
                keywordResults.style.display = 'none';
            }
        });

        /*let markerCounter = 0,
            terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
                id: 'Terrain',
                minZoom: 3,
                maxZoom: 18
            }),
            pc = function (id, lat, lon, name = null, notes = null) {
                return '<input type="hidden" name="thisid" value="' + id + '"><label>Coordinates</label><input type="text" name="coords1" value="' + lat + '" placeholder="45.32">, ' +
                    '<input type="text" name="coords2" value="' + lon + '" placeholder="-118.1">' +
                    '<label>Name</label><input type="text" name="waypoint_name" value="' + (name != null ? name : '') + '" placeholder="Waypoint name">' +
                    '<label>Notes</label><input type="text" name="waypoint_notes" value="' + (notes != null ? notes : '') + '" placeholder="Waypoint notes">' +
                    '<label>Icon</label><select name="waypoint_icon" style="margin:0">' +
                    '<option>- Icon -</option>' +
                    '<option value="4x4">4x4</option>' +
                    '<option value="big_air">Big Air</option>' +
                    '<option value="bigfoot">Bigfoot</option>' +
                    '<option value="bridge">Bridge</option>' +
                    '<option value="cabin">Cabin</option>' +
                    '<option value="camp">Campground</option>' +
                    '<option value="caution">Caution</option>' +
                    '<option value="fishing">Fishing</option>' +
                    '<option value="hike">Hike</option>' +
                    '<option value="info">Info</option>' +
                    '<option value="lake">Lake</option>' +
                    '<option value="media">Media</option>' +
                    '<option value="mtn_bike">Mountain Bike</option>' +
                    '<option value="parking">Parking</option>' +
                    '<option value="redneck">Redneck</option>' +
                    '<option value="restroom">Restroom</option>' +
                    '<option value="river">River</option>' +
                    '<option value="sledding">Sledding</option>' +
                    '<option value="summit">Summit</option>' +
                    '<option value="swim">Swimming</option>' +
                    '</select><input type="button" id="saveWaypoint" class="btn btn-sm btn-green" value="Save">' +
                    '<input type="button" id="deleteWaypoint" class="btn btn-sm btn-red" value="Delete">';
            };

        map = L.map('waypoint-map', {
            preferCanvas: true,
            attributionControl: false
        }).setView([45.32, -118.1], 5)
            .addLayer(terrain)
            .on('click', (e) => {
                const latlng = e.latlng,
                    createInput = function (name, value = null) {
                        var i = document.createElement('input');
                        i.setAttribute('type', 'hidden');
                        i.setAttribute('name', 'waypoint[' + name + '][]');

                        if (value != null) {
                            i.value = value;
                        }

                        return i;
                    };
                markerCounter++;

                const newMarker = L.marker(latlng, {
                    title: markerCounter,
                    draggable: true
                }).on('dragend', (e) => {
                    const c = e.target._latlng;

                    document.querySelector('form #waypoint-' + markerCounter).querySelector('input[name="waypoint[lat][]"]').value = c.lat;
                    document.querySelector('form #waypoint-' + markerCounter).querySelector('input[name="waypoint[lon][]"]').value = c.lng;
                }).on('popupopen', (e) => {
                    if (!e.popup.options.openedBefore) {
                        e.popup.options.openedBefore = true;
                    } else {
                        const wrap = document.querySelector('form #waypoint-' + e.target.options.title),
                            lat = wrap.querySelector('input[name="waypoint[lat][]"]').value,
                            lon = wrap.querySelector('input[name="waypoint[lon][]"]').value,
                            name = wrap.querySelector('input[name="waypoint[name][]"]').value,
                            notes = wrap.querySelector('input[name="waypoint[note][]"]').value,
                            ic = wrap.querySelector('input[name="waypoint[icon][]"]').value;

                        e.popup.setContent(pc(e.target.options.title, lat, lon, name, notes));

                        document.querySelectorAll('.leaflet-popup-content select[name=waypoint_icon] option').forEach((k, n) => {
                            if (k.value == ic) {
                                document.querySelector('.leaflet-popup-content select[name=waypoint_icon]').selectedIndex = n;
                            }
                        });
                    }

                    const pu = document.querySelector('.leaflet-popup-content');

                    if (pu != null) {
                        // on lat/lon manual changes to value
                        pu.querySelector('input[name=coords1').addEventListener('keyup', (p) => {
                            const lat = p.target.value,
                                lon = pu.querySelector('input[name=coords2').value,
                                wrap = document.querySelector('form #waypoint-' + pu.querySelector('input[name=thisid]'));

                            if (lat != '') {
                                wrap.querySelector('input[name="waypoint[lat][]"]').value = lat;
                                wrap.querySelector('input[name="waypoint[lon][]"]').value = lon;
                                newMarker.setLatLng(L.latLng(lat, lon));
                            }
                        });

                        pu.querySelector('input[name=coords2').addEventListener('keyup', (p) => {
                            const lat = pu.querySelector('input[name=coords1').value,
                                lon = p.target.value,
                                wrap = document.querySelector('form #waypoint-' + pu.querySelector('input[name=thisid]'));

                            if (lon != '') {
                                wrap.querySelector('input[name="waypoint[lat][]"]').value = lat;
                                wrap.querySelector('input[name="waypoint[lon][]"]').value = lon;
                                newMarker.setLatLng(L.latLng(lat, lon));
                            }
                        });

                        // on popup save button                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      // get values from popup and store them in hidden input fields/*
const markerDataContainer = document.createElement('div');
markerDataContainer.id = 'waypoint-' + markerCounter;

markerDataContainer.appendChild(createInput('lat', e.latlng.lat));
markerDataContainer.appendChild(createInput('lon', e.latlng.lng));
markerDataContainer.appendChild(createInput('id'));
markerDataContainer.appendChild(createInput('delta'));
markerDataContainer.appendChild(createInput('name'));
markerDataContainer.appendChild(createInput('note'));
markerDataContainer.appendChild(createInput('icon'));

document.querySelector('#waypoints').appendChild(markerDataContainer);
}
});
});*/
    }

    if (pageName.includes('admin/organizations')) {
        const start = document.querySelector('input[name="start_period"]'),
            end = document.querySelector('input[name="end_period"]');

        if (start) {
            const now = new Date();
            now.setMinutes(0, 0, 0);

            start.addEventListener('input', () => {
                if (!start.value) return;

                const date = new Date(start.value),
                    selected = new Date(start.value);

                date.setMonth(date.getMonth() + 1);

                const offset = date.getTimezoneOffset() * 60000;
                end.value = new Date(date - offset).toISOString().slice(0, 13) + ':00';

                selected.setMinutes(0, 0, 0);
                document.querySelector('input#yes').checked = selected > now ? false : true;
                document.querySelector('input#no').checked = selected > now ? true : false;
            });
        }
    }
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        calc = new Calculate();
        //token = getUserToken();
    } else {
        complete();
    }
};

document.querySelector('input[type=tel]')?.addEventListener('keyup', (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
});

window.addEventListener('click', async (e) => {
    const target = e.target,
        searchResults = document.querySelector('.search-results'),
        sidebar = document.querySelector('.sidebar'),
        menuIcon = target.closest('#menuIcon');

    if (document.querySelector('#dialog') != null && target.id == 'close') {
        closeDialog();
    }

    if (target.id == 'unfollow') {
        createDialog('Unfollow this fire?', 'Are you sure you want to unfollow this incident?', 'Unfollow', 'unfollow(' + e.target.dataset.wfid + ')');
    }

    if (target.id == 'unfavorite') {
        createDialog('Unfavorite this trail?', 'Are you sure you want to unfavorite this trail?', 'Unfavorite', 'unfavorite(' + e.target.dataset.tid + ')');
    }

    if (menuIcon) {
        const icon = menuIcon.querySelector('i');

        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');

        document.querySelector('.sidebar').classList.toggle('open');
    }

    if (target.id == 'getMyLoc') {
        target.disabled = true;
        target.value = 'Getting location...';
        getMyLoc(target);
    }

    if (target.classList.contains('sortTable')) {
        const url = target.dataset.url;
        const match = url.match(/order=ASC/);
        const match2 = url.match(/order=DESC/);
        if (match != null) {
            target.dataset.url = url.replace('order=ASC', 'order=DESC');
        } else {
            if (match2 != null) target.dataset.url = url.replace('order=DESC', 'order=ASC');
        }

        new QueryWildfires().search(url);
    }

    if (target.classList.contains('result')) {
        if (pageName == 'admin/wildfires') {
            const unit = target.dataset.unit,
                name = target.dataset.name;

            document.querySelector('input[name=unit]').value = unit;
            document.querySelector('#q').value = name;
        } else {
            const lat = target.dataset.lat,
                lon = target.dataset.lon,
                name = target.dataset.name,
                e = name.split(', '),
                z = e[1].split(' '),
                city = e[0],
                state = stateLabels[z[0]],
                zip = z[1],
                data = {
                    city: city,
                    state: state,
                    zip: zip,
                    lat: lat,
                    lon: lon
                };

            document.querySelector('input[name=city]').value = city;
            document.querySelector('input[name=state]').value = state;
            document.querySelector('input[name=zip]').value = zip;
            document.querySelector('input[name=lat]').value = lat;
            document.querySelector('input[name=lon]').value = lon;
            document.querySelector('input[name=location]').value = JSON.stringify(data);
            document.querySelector('#q').value = '';

            document.querySelector('input[name=location]').dispatchEvent(new Event('change', { bubbles: true }))
        }

        document.querySelector('.search-results').style.display = 'none';
        document.querySelector('.search-results').innerHTML = '';
    }

    // insert keyword into textbox
    if (target.id == 'kw-item') {
        if (kw.value.search(',') < 0) {
            kw.value = target.innerHTML;
        } else {
            const rm = kw.value.split(',').pop();
            kw.value = kw.value.replace(rm, '') + ' ' + target.innerHTML;
        }

        keywordResults.style.display = 'none';
        keywordResults.innerHTML = '';
        kw.focus();
    }

    // delete waypoints
    if (target.id.startsWith('deletewaypoint')) {
        const id = target.dataset.id;

        if (confirm('Are you sure you want to delete this waypoint?')) {
            target.parentNode.parentNode.parentNode.remove();

            if (id) {
                const resp = await api(`${host}${usersAPI}waypoint`, [['mode', 'delete'], ['id', id]]);

                if (resp) alert('That waypoint was successfully removed and your changes were saved.');
            }
        }
    }

    // delete gpx
    if (target.id.startsWith('deletegpx')) {
        const id = target.dataset.id,
            d = target.dataset.delta,
            tid = target.dataset.tid,
            fn = target.dataset.filename;

        if (confirm('Are you sure you want to delete this GPX file?')) {
            target.parentNode.parentNode.parentNode.remove();

            if (id && tid) {
                const resp = await api(`${host}${usersAPI}gpx`, [['mode', 'delete'], ['id', id], ['trail_id', tid], ['filename', fn], ['delta', d]]);

                if (resp) alert('That GPX file was successfully removed and your changes were saved.');
            }
        }
    }

    // delete multimedia
    if (target.id.startsWith('deletemedia')) {
        const id = target.dataset.id,
            fn = target.dataset.filename;

        if (confirm('Are you sure you want to delete this multimedia?')) {
            target.parentNode.remove();

            if (id && fn) {
                const resp = await api(`${host}${usersAPI}media`, [['mode', 'delete'], ['id', id], ['filename', fn]]);

                if (resp) alert('That photo was successfully removed and your changes were saved.');
            }
        }
    }

    // hide wildfires from the map link
    if (target.classList.contains('hidefrommap')) {
        const id = target.dataset.wfid;

        if (id) {
            target.parentElement.parentElement.remove();

            await api(`${host}${usersAPI}wildfires`, [['mode', 'hide'], ['id', id]]);
        }
    }

    // hide search results when clicked outside
    if (searchResults && !searchResults.contains(target) && !target.classList.contains('result') && target !== document.querySelector('#q')) {
        searchResults.style.display = 'none';
    }

    // close sidebar nav menu when clicked outside of it
    if (!sidebar.contains(e.target) && !e.target.closest('#menuIcon')) {
        const mi = document.querySelector('#menuIcon > i');

        sidebar.classList.remove('open');
        mi.classList.add('fa-bars');
        mi.classList.remove('fa-times');
    }
});