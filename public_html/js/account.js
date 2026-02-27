const host = 'https://www.mapotechnology.com/',
    pageName = window.location.pathname.replace('/account/', ''),
    /*pageName = window.location.search.split('page=')[1],*/
    apiURL = 'https://api.mapotechnology.com/v1/',
    mapofireAPI = 'https://mapofire.com/api/v1/',
    usersAPI = 'account/secure/apis/',
    apiKey = 'c196d0958608ad2b7d4af2be078ecc54',
    WILDFIRE_NEARBY_DIST = 50,
    stateLabels = {
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
    token = '',
    wildfires = [],
    keywordResults,
    centerMarker;

async function api(uri, fields = null, v2 = false) {
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

class QueryWildfires {
    constructor() {
        this.totalRows = 0;
        this.wildfires = null;
        this.listOfFires = document.querySelector('#listOfFires');
        this.now = Date.now() / 1000;
        this.numberFormat = new Intl.NumberFormat('en-US');
    }

    async search(fields = null) { console.log(fields);
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

        const resp = await api(host + usersAPI + 'getFires' + (pageName.search('duplicates') >= 0 ? '/duplicates' : ''), body);
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

        for (let i = 1; i <= links; i++) {
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
        }
    }

    size(a) {
        if (a === '' || a === null || a === undefined) return 'Unknown';

        const acres = parseFloat(a);
        if (isNaN(acres)) return 'Unknown';

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

        if (pageName != 'admin/wildfires/duplicates' && fire.display !== '1') {
            tr.style.textDecoration = 'line-through';
        } else if (pageName == 'admin/wildfires/duplicates' && isDuplicate) {
            tr.style.color = 'red';
        }

        this.listOfFires.querySelector('tbody').appendChild(tr);
    }

    createCols(fire) {
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        const date = this.now - fire.date > 86400 ? new Intl.DateTimeFormat('en-US', options).format(fire.date * 1000).replace(',', '') : timeAgo(fire.date),
            url = `../admin/wildfires/${fire.owner == 'mapo' ? 'modify' : 'edit'}?wfid=${fire.wfid}`,
            dupURL = pageName == 'admin/wildfires/duplicates' ? ` | <a href="#" class="hidefrommap" data-wfid="${fire.wfid}" onclick="return false">hide</a>` : '';

        return `<td>${fire.incidentID}</td>
            <td>${fire.state}</td>
            <td>${fire.name}</td>
            <td>${date}</td>
            <td>${fire.type}</td>
            <td>${this.size(fire.acres)}</td>
            <td>${timeAgo(fire.updated)}</td>
            <td>${fire.display == '1' ? 'Yes' : 'No'}</td>
            <td>${fire.owner}</td>
            <td>${this.listOfFires.dataset.edit == '1' ? `<a style="font-weight:400!important" href="${url}">edit</a>${dupURL}` : ''}</td>`;
    }

    isDuplicateFire(currentFire, lastFire, acresThreshold = 10.0, idLastDigits = 3) {
        if (!currentFire || !lastFire) return false;

        const currentNameState = (currentFire.state + currentFire.name).toLowerCase();
        const lastNameState = (lastFire.state + lastFire.name).toLowerCase();

        const currentIdSuffix = String(currentFire.incidentID).slice(-idLastDigits);
        const lastIdSuffix = String(lastFire.incidentID).slice(-idLastDigits);

        let acresMatch = false;

        const currentAcres = parseFloat(currentFire.acres);
        const lastAcres = parseFloat(lastFire.acres);

        if (currentAcres === 0 || lastAcres === 0 || isNaN(currentAcres) || isNaN(lastAcres)) {
            acresMatch = true;
        } else {
            const acresDifference = Math.abs(currentAcres - lastAcres);
            acresMatch = acresDifference <= acresThreshold;
        }

        const nameStateMatch = currentNameState === lastNameState;
        const idSuffixMatch = currentIdSuffix === lastIdSuffix;

        return nameStateMatch && acresMatch && idSuffixMatch;
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

    bearing(startLat, startLng, destLat, destLng) {
        startLat = this.deg2rad(startLat);
        startLng = this.deg2rad(startLng);
        destLat = this.deg2rad(destLat);
        destLng = this.deg2rad(destLng);

        let y = Math.sin(destLng - startLng) * Math.cos(destLat),
            x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng),
            brng = Math.atan2(y, x);

        return this.getCompassDirection((this.rad2deg(brng) + 360) % 360);
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
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function getUserToken() {
    return document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || null;
}

async function getFires() {
    const resp = await api(apiURL + 'wildfires/all,new,smk');

    wildfires = resp.features;

    if (userLocation) {
        let content = '';

        resp.features.forEach(f => {
            const lat = f.geometry.coordinates[1],
                lon = f.geometry.coordinates[0],
                dist = calc.distance(lat, lon, userLocation.lat, userLocation.lon);

            if (dist <= WILDFIRE_NEARBY_DIST) {
                const name = f.properties.name,
                    type = f.properties.type,
                    url = f.properties.url.replace('wildfire/', 'fires/'),
                    bear = calc.bearing(lat, lon, userLocation.lat, userLocation.lon);

                content += '<div class="data-item"><div class="item"><a target="blank" href="https://www.mapofire.com/' + url + '">' +
                    name + (type != 'Smoke Check' ? ' Fire' : '') + '</a><span class="data">' + dist + ' miles ' + bear + ' of you</span></div></div>';
            }
        });

        document.getElementById('nearby').innerHTML = (content ? content : '<div class="message info">There are no wildfires currently near you.</div>');
    }
}

function getMyLoc(target) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const resp = await api(apiURL.replace('v1', 'v2') + 'geocode/reverse', [
                ['lat', position.coords.latitude],
                ['lon', position.coords.longitude]
            ]);

            const a = resp.geocode.city,
                b = resp.geocode.state_name,
                c = resp.geocode.zip_code,
                lat = resp.geocode.lat,
                lon = resp.geocode.lon,
                d = { city: a, state: b, zip: c, lat: lat, lon: lon };

            document.querySelector('input[name=city]').value = a;
            document.querySelector('input[name=state]').value = b;
            document.querySelector('input[name=zip]').value = c;
            document.querySelector('input[name=lat]').value = lat;
            document.querySelector('input[name=lon]').value = lon;
            document.querySelector('input[name=location]').value = JSON.stringify(d);
            target.disabled = false;
            target.value = 'Use current location';
        });
    }
}

function findFire(wfid) {
    return wildfires.find(f => f.properties.wfid == wfid) ?? null;
}

/*function getStatus(s, n, t = 'Wildfire', ac = '0') {
    let a = ac.toString().toLowerCase();
    if (!s && !n) return 'active';

    if (s) {
        if (s.Out) return 'out';
        if (s.Control) return 'controlled';
        if (s.Contain) return 'contained';
        if (Object.keys(s).length > 0) return '';
    }

    const notes = n?.toLowerCase() || '';
    if (notes.includes('contain')) return 'contained';
    if (notes.includes('control')) return 'controlled';

    if (t == 'Smoke Check' && (a == '0' || a == 'unknown' || a == '')) {
        return 'unknown';
    }

    return 'active';
}*/

async function downloadUserData() {
    try {
        const userData = await api(host + usersAPI + 'download');

        if (!userData) {
            alert('There was an error getting your data for download.');
            return;
        }

        const jsonString = JSON.stringify(userData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'mapollc_user-data_' + new Date().getTime() + '.json';

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
    link.href = 'https://cdn.mapotrails.com/userGIS/' + url;
    link.download = name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getFavoriteFires() {
    return await api(mapofireAPI + 'trackFires/list', [
        ['token', token],
        ['meta', 1]
    ]);
}

function displayFavFires(resp) {
    let content = '',
        anyValid = false;

    if (resp.fires && resp.fires.length > 0) {
        resp.fires.forEach(f => {
            const isValid = findFire(f.wfid) == null ? false : true;

            if (isValid) {
                const name = f.name,
                    type = f.type,
                    geo = f.geo,
                    url = f.url;

                content += '<div class="data-item" data-wfid="' + f.wfid + '"><div class="item"><a target="blank" href="https://www.mapofire.com/' + url + '">' + name + (type != 'Smoke Check' ? ' Fire' : '') + '</a>' +
                    '<span class="data">' + geo + '</span></div><div class="item ctrl"><div id="unfollow" style="margin-left:0.5em" data-wfid="' + f.wfid + '" title="Unfollow this incident" class="far fa-ellipsis-vertical control"></div></div></div></div>';
                anyValid = true;
            }
        });
    } else {
        content = '<div class="message info">You are not currently following any wildfires.</div>';
    }

    if (!anyValid) {
        content = '<div class="message info">You are not currently following any wildfires.</div>';
    }

    document.querySelector('#favfires').innerHTML = content;
}

async function getFavoriteTrails() {
    let content = '';
    const resp = await api(host + usersAPI + 'favtrails', [['token', token]]);

    if (resp.response && resp.response.length > 0) {
        resp.response.forEach((f) => {
            const id = f.id,
                title = f.title,
                url = f.url;

            content += '<div class="data-item" data-tid="' + id + '"><div class="item"><a target="blank" href="https://www.mapotrails.com/' + url + '">' + title + '</a></div>' +
                '<div class="item ctrl"><div id="unfavorite" data-tid="' + id + '" class="far fa-ellipsis-vertical control" title="Unfavorite this trail"></div></div></div>';
        });
    } else {
        content = '<div class="message info">You currently don\'t have any favorite trails.</div>';
    }

    document.querySelector('#favtrails').innerHTML = content;
}

async function getUploads() {
    let content = '';
    const resp = await api(host + usersAPI + 'userUploads', [['token', token]]);

    if (resp.response && resp.response.length > 0) {
        content += '<div class="table-responsive"><table class="table small"><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Created</th></tr></thead><tbody>';

        resp.response.forEach((f) => {
            content += '<tr><td><a href="#" onclick="downloadFile(\'' + f.fileName + '\', \'' + f.file + '\')">' + f.fileName + '</a></td><td>' +
                f.type + '</td><td>' + formatBytes(f.size) + '</td><td>' + timeAgo(f.created) + '</td></tr>';
        });

        content += '</tbody></table></div>';
    } else {
        content = '<div class="message info">You haven\'t uploaded any content to Map of Trails.</div>';
    }

    document.querySelector('#uploads').innerHTML = content;
}

async function geocode(a, b) {
    const json = await api('https://api.mapotechnology.com/v2/geocode/incident', [['lat', a], ['lon', b]]);

    document.querySelector('input[name=near]').value = json.geocode.near;
    document.querySelector('input[name=tz]').value = json.geocode.timezone;
    document.querySelector('input[id=geoc]').value = json.geocode.near;

    document.querySelectorAll('select[name=state] option').forEach((e) => {
        if (e.value == json.geocode.state) e.selected = true;
    });

    document.querySelector('select[name=state]').disabled = false;
}

function closeDialog() {
    const dialog = document.querySelector('#dialog'),
        popup = document.querySelector('#popup');

    document.querySelector('#shadow').style.display = 'none';

    if (dialog) dialog.remove();
    if (popup) popup.remove();
}

function createDialog(title, text, affirm = 'Yes', func) {
    const popup = document.createElement('div');

    popup.classList.add('popup');
    popup.innerHTML = '<i id="close-popup" class="far fa-xmark"></i>' +
        '<h2>' + title + '</h2><p>' + text + '</p>' +
        '<div class="options">' +
        '<a href="#" class="btn btn-gray" onclick="closeDialog();return false">Cancel</a>' +
        '<a href="#" class="btn btn-blue" onclick="' + func + ';return false">' + affirm + '</a></div>';

    document.body.appendChild(popup);
    shadow.style.display = 'block';

    document.querySelector('#close-popup').addEventListener('click', () => {
        document.querySelector('.popup').remove();
        shadow.style.display = 'none';
    });
}

async function unfollow(wfid) {
    const total = document.querySelectorAll('#favfires .row').length,
        resp = await api(mapfireAPI + 'trackFires/remove', [['token', token], ['wfid', wfid]]);

    if (resp.success && resp.success == 'removed') {
        closeDialog();

        document.querySelectorAll('#favfires .data-item').forEach((f) => {
            if (f.getAttribute('data-wfid') == wfid) f.remove();
        });

        if (total - 1 == 0) {
            document.querySelector('#favfires').innerHTML = '<div class="message error">You are not currently following any wildfires.</div>';
        }
    }
}

async function unfavorite(tid) {
    const resp = await api(host + usersAPI + 'favtrails', [['method', 'remove'], ['tid', tid]]),
        total = document.querySelectorAll('#favtrails .row').length;

    if (resp.response.success == 1) {
        closeDialog();

        document.querySelectorAll('#favtrails .row').forEach((f) => {
            if (f.getAttribute('data-tid') == tid) f.remove();
        });

        if (total - 1 == 0) {
            document.querySelector('#favtrails').innerHTML = '<div class="message error">You currently don\'t have any favorite trails.</div>';
        }
    }
}

function addWaypoint() {
    var selects = '<option>- Icon -</option>';

    for (var i = 0; i < iconsA.length; i++) {
        selects += '<option value="' + iconsA[i] + '">' + iconsB[i] + '</option>';
    }

    /*var line = '<li><input type="hidden" name="waypoint[id][]" value="">' +
        '<input type="hidden" name="waypoint[delta][]" value="">' +
        '<input type="text" name="waypoint[name][]" class="input" style="display:inline-block;max-width:240px" placeholder="Waypoint Name" value="">' +
        '<input type="text" name="waypoint[note][]" class="input" style="display:inline-block;max-width:400px" placeholder="Waypoint Notes" value="">' +
        '<select name="waypoint[icon][]" class="input" style="display:inline-block;max-width:170px">' + selects + '</select>' +
        '<input type="text" name="waypoint[lat][]" class="input" style="display:inline-block;max-width:140px" placeholder="Latitude" value="">' +
        '<input type="text" name="waypoint[lon][]" class="input" style="display:inline-block;max-width:140px" placeholder="Longitude" value=""></li>';*/
    var line = '<li><input type="hidden" name="waypoint[id][]" value="">' +
        '<input type="hidden" name="waypoint[delta][]" value="">' +
        '<div class="wrap">' +
        '<div class="column">' +
        '<label style="margin-bottom:5px">Name</label>' +
        '<input type="text" name="waypoint[name][]" class="input" placeholder="Waypoint Name" value="">' +
        '</div><div class="column">' +
        '<label style="margin-bottom:5px">Notes</label>' +
        '<input type="text" name="waypoint[note][]" class="input" placeholder="Waypoint Notes" value="">' +
        '</div><div class="column">' +
        '<label style="margin-bottom:5px">Icon</label>' +
        '<select name="waypoint[icon][]" class="input" style="max-width:165px;margin:0"><option>- Icon -</option>' + selects +
        '</select></div><div class="column">' +
        '<label style="margin-bottom:5px">Latitude</label>' +
        '<input type="text" name="waypoint[lat][]" class="input" style="max-width:150px" placeholder="45.01234" value="">' +
        '</div><div class="column">' +
        '<label style="margin-bottom:5px">Longitude</label>' +
        '<input type="text" name="waypoint[lon][]" class="input" style="max-width:150px" placeholder="-118.123456" value="">' +
        '</div><div class="column">' +
        '<a class="btn btn-sm btn-red" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletewaypoint" data-id="" onclick="return false">Delete</a>' +
        '</div></div></li>';

    document.querySelector('ul#waypoints').insertAdjacentHTML('beforeend', line);
}

function addGPX() {
    let ops = '',
        n = document.querySelectorAll('ul#files li').length,
        modes = ['ATV Track', 'Gravel', 'Road', 'Single Track', 'Ski Line', 'Snowmobile', 'Tour'];

    modes.forEach(e => {
        ops += '<option value="' + e + '">' + e + '</option>';
    });

    var line = '<li><input type="hidden" name="gpx[id][' + n + ']" value=""><input type="hidden" name="gpx[delta][' + n + ']" value="">' +
        '<div class="wrap">' +
        '<div class="file">' +
        '<label style="margin-bottom:5px">Map Data File</label>' +
        '<input type="file" class="input" name="gpxFile[]" accept=".gpx">' +
        '</div><div class="column">' +
        '<label style="margin-bottom:5px">Description</label>' +
        '<input type="text" class="input" style="display:inline-block;max-width:400px" name="gpx[caption][' + n + ']" placeholder="GPX file caption" value="">' +
        '</div><div class="column">' +
        '<label style="margin-bottom:5px">Type</label>' +
        '<select name="gpx[mode][' + n + ']" class="input" style="margin-top:0;max-width:175px">' +
        '<option value="">- Choose Mode -</option>' + ops +
        '</select></div><div class="column">' +
        '<label style="margin-bottom:1em">Display</label>' +
        '<div><div class="radio">' +
        '<input type="radio" name="gpx[display][' + n + ']" value="1"><label>Yes</label></div>' +
        '<div class="radio">' +
        '<input type="radio" name="gpx[display][' + n + ']" value="0"><label>No</label>' +
        '</div></div></div>' +
        '<div class="column">' +
        '<a class="btn btn-sm btn-red" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletegpx" data-tid="" data-delta="' + n + '" data-filename="" data-id="" onclick="return false">Delete</a>' +
        '</div></div></li>';

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

    cancels.innerHTML = '<div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>';

    const data = await api(apiURL.replace('v1', 'v2') + 'payment/subscriptions/cancel', fields);

    if (data.response == 'success') {
        if (isApp) {
            window.location.href = 'https://mapofire.com/confirmation?cancel=1&when=' + (cancelNow ? 'immediate' : 'later');
        } else {
            postResume('https://' + window.location.host + window.location.pathname, [['cancel', 1], ['when', (cancelNow ? 'immediate' : 'later')]]);
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
                npid = t.target.getAttribute('data-new-plan'),
                newName = t.target.getAttribute('data-name'),
                isApp = t.target.getAttribute('data-app') == '1' ? true : false,
                popup = document.createElement('div'),
                amt = '$' + (t.target.getAttribute('data-amount') / 100).toFixed(2),
                extra = method == 'upgrade' ? 'Your default payment method will be charged ' + amt + '.' : 'We will apply a credit for any unused time on your current plan toward your next invoice.';

            popup.classList.add('popup');
            popup.innerHTML = '<i id="close-popup" class="far fa-xmark"></i>' +
                '<h2>' + ucfirst(method) + ' subscription</h2>' +
                '<p>Are you sure you want to ' + method + ' your subscription to <b>' + newName + '</b>? ' + extra + '</p>' +
                '<div class="options">' +
                '<a href="#" id="modify-now" class="btn btn-' + (method == 'downgrade' ? 'red' : 'green') + '" onclick="return false">Yes, ' + method + '</a>' +
                '<a href="#" id="nvm" class="btn btn-gray" onclick="return false">Cancel</a>';

            document.body.appendChild(popup);
            shadow.style.display = 'block';

            document.querySelector('#close-popup').addEventListener('click', (e) => {
                popup.remove();
                shadow.style.display = 'none';
            });

            document.querySelector('#nvm').addEventListener('click', (e) => {
                popup.remove();
                shadow.style.display = 'none';
            });

            document.querySelector('#modify-now').addEventListener('click', async (e) => {
                const shadow = document.querySelector('#shadow');

                if (popup) {
                    popup.remove();
                    shadow.style.display = 'none';
                }

                cancels.innerHTML = '<div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>';

                const data = await api(apiURL.replace('v1', 'v2') + 'payment/subscriptions/modify', [['sid', sid], ['newPriceID', npid]]);

                if (data.response == 'success') {
                    if (isApp) {
                        window.location.href = 'https://mapofire.com/confirmation?modify=1&method=' + method;
                    } else {
                        const post = [];
                        post.push([method, 'true']);

                        if (forcedUpgrade) {
                            post.push(['forced', 'true']);
                        }

                        postResume('https://' + window.location.host + window.location.pathname, post);
                    }
                }
            });
        });

        if (hash != '') {
            if (forcedUpgrade) modify.click();
        }
    }

    if (cancel) {
        cancel.addEventListener('click', (t) => {
            const popup = document.createElement('div'),
                isApp = t.target.getAttribute('data-app') == '1' ? true : false,
                name = t.target.getAttribute('data-name'),
                sid = t.target.dataset.sid;

            popup.classList.add('popup');
            popup.innerHTML = '<i id="close-popup" class="far fa-xmark"></i>' +
                '<h2>Cancel subscription</h2>' +
                '<p>You can cancel your <b>' + name + '</b> subscription immediately, or keep it active until the end of your billing period. Your subscription will not renew automatically.</p>' +
                '<div class="options">' +
                '<a href="#" id="cancel-now" class="btn btn-gray" onclick="return false">Cancel now</a>' +
                '<a href="#" id="cancel-later" class="btn btn-red" onclick="return false">Cancel later</a>';

            document.body.appendChild(popup);
            shadow.style.display = 'block';

            document.querySelector('#close-popup').addEventListener('click', (e) => {
                e.target.parentElement.remove();
                shadow.style.display = 'none';
            });

            document.querySelector('#cancel-now').addEventListener('click', () => {
                cancelSub(
                    [['sid', sid], ['timing', 'now']],
                    true,
                    isApp,
                    'Your subscription has been canceled. You no longer have access to premium features.'
                );
            });

            document.querySelector('#cancel-later').addEventListener('click', () => {
                cancelSub(
                    [['sid', sid], ['timing', 'later']],
                    false,
                    isApp,
                    'Your subscription will be canceled at the end of your billing period.'
                );
            });
        });
    }

    if (rs) {
        rs.addEventListener('click', async (e) => {
            const isApp = e.target.getAttribute('data-app') == '1' ? true : false;
            e.target.parentElement.innerHTML = '<div class="spinner" style="width:20px;height:20px"></div><span>Processing...</span>';
            e.target.classList.add('disabled');

            const data = await api(apiURL.replace('v1', 'v2') + 'payment/subscriptions/resume', [
                ['sid', e.target.getAttribute('data-sid')]
            ]);

            if (data.response == 'success') {
                if (isApp) {
                    window.location.href = 'https://mapofire.com/confirmation?resume=1';
                } else {
                    postResume('https://' + window.location.host + window.location.pathname, [['resume', 1]]);
                }
            }
        });
    }
}

async function getInvoices() {
    const invoiceDiv = document.querySelector('#invoices'),
        inv = await api(host + usersAPI + 'invoices');

    if (inv.response == null || inv.response.data.length == 0) {
        invoiceDiv.innerHTML = '<p>There are no invoices or receipts for your account.</p>';
    } else {
        let table = '<div class="table-responsive"><table class="table small"><thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead><tbody>';

        inv.response.data.forEach((invoice) => {
            let amt = invoice.amount_remaining,
                links = '';

            if (invoice.status == 'paid') {
                amt = invoice.amount_paid;
            }

            if (invoice.hosted_invoice_url) {
                links += '<a target="blank" href="' + invoice.hosted_invoice_url + '">View</a>';
            }

            if (invoice.invoice_pdf) {
                links += ' &nbsp;&middot;&nbsp; <a href="' + invoice.invoice_pdf + '">Download</a>';
            }

            table += '<tr><td>' + (invoice.number ? invoice.number : (invoice.status == 'Draft' ? invoice.status : 'N/A')) + '</td>' +
                '<td>' + new Date(invoice.created * 1000).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '</td>' +
                '<td>$' + (amt / 100).toFixed(2) + '</td>' +
                '<td><span class="inv-paid' + (invoice.status != 'paid' ? ' no' : '') + '">' + invoice.status + '</span></td>' +
                '<td>' + links + '</td></tr>';
        });

        invoiceDiv.innerHTML = table + '</tbody></table></div>';
    }
}

async function doSearch(q) {
    let results = '';

    if (q.length > 0) {
        const resp = await api(apiURL + 'search', [['citiesonly', 1], ['q', q]]);

        resp.rs.forEach(s => {
            results += '<div class="result" data-name="' + s.name + '" data-lat="' + s.lat + '" data-lon="' + s.lon + '">' + s.name + '</div>';
        });

        if (results) document.querySelector('.search-results').innerHTML = results;
    }
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        calc = new Calculate();
        token = getUserToken();
    } else {
        if (document.querySelector('table thead.sortable') != null) {
            document.querySelectorAll('thead.sortable th').forEach((e) => {
                if (e.innerHTML != '') {
                    if (e.getAttribute('onclick') != null) {
                        const sort = window.location.href.match(/sort=([A-Za-z]+)/),
                            order = window.location.href.match(/order=([A-Za-z]+)/),
                            matches = e.getAttribute('onclick').match(/sort=([A-Za-z]+)&order=([A-Z]+)/);

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
                }
            });
        }

        if (pageName == 'home') {
            await Promise.all([
                getFires(),
                getFavoriteFires().then(response => { displayFavFires(response); })
            ]);

            getFavoriteTrails();
            getUploads();
        }

        if (pageName == 'billing') {
            billing();
        }

        if (pageName == 'settings/location') {
            document.querySelector('#q').addEventListener('focus', () => {
                const sr = document.querySelector('.search-results');

                sr.style.display = 'block';
                sr.innerHTML = '<p style="padding:.5em">Searching...</p>';
            });

            document.querySelector('#q').addEventListener('keyup', debounce((e) => {
                doSearch(e.target.value);
            }, 550));
        }

        if (pageName == 'settings/password') {
            const passInput = document.querySelector('input[name="pass"]'),
                confirmInput = document.querySelector('input[name="confirm_pass"]'),
                reqBox = document.querySelector('.req'),
                meets = document.querySelector('#meets'),
                rules = [
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

        if (pageName == 'mapofire') {
            const terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
                id: 'Terrain',
                minZoom: 3,
                maxZoom: 18
            });

            map = L.map('map', {
                preferCanvas: true,
                attributionControl: false
            }).on('dragend', function () {
                var a = this.getCenter(),
                    b = a.lat,
                    c = a.lng;

                centerMarker.setLatLng(new L.LatLng(b, c));
                document.querySelector('input[name=lat]').value = b;
                document.querySelector('input[name=lon]').value = c;
            }).on('zoomend', function (e) {
                document.querySelectorAll('select[name=zoom] option').forEach((o, n) => {
                    if (o.value == e.target.getZoom()) {
                        document.querySelector('select[name=zoom]').options.selectedIndex = n;
                    }
                });
            }).setView(settings.center, settings.zoom)
                .addLayer(terrain);

            /* add center marker to map */
            centerMarker = L.marker(settings.center, {
                draggable: true,
                icon: L.icon({
                    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAFgUlEQVR4Aa1XA5BjWRTN2oW17d3YaZtr2962HUzbDNpjszW24mRt28p47v7zq/bXZtrp/lWnXr337j3nPCe85NcypgSFdugCpW5YoDAMRaIMqRi6aKq5E3YqDQO3qAwjVWrD8Ncq/RBpykd8oZUb/kaJutow8r1aP9II0WmLKLIsJyv1w/kqw9Ch2MYdB++12Onxee/QMwvf4/Dk/Lfp/i4nxTXtOoQ4pW5Aj7wpici1A9erdAN2OH64x8OSP9j3Ft3b7aWkTg/Fm91siTra0f9on5sQr9INejH6CUUUpavjFNq1B+Oadhxmnfa8RfEmN8VNAsQhPqF55xHkMzz3jSmChWU6f7/XZKNH+9+hBLOHYozuKQPxyMPUKkrX/K0uWnfFaJGS1QPRtZsOPtr3NsW0uyh6NNCOkU3Yz+bXbT3I8G3xE5EXLXtCXbbqwCO9zPQYPRTZ5vIDXD7U+w7rFDEoUUf7ibHIR4y6bLVPXrz8JVZEql13trxwue/uDivd3fkWRbS6/IA2bID4uk0UpF1N8qLlbBlXs4Ee7HLTfV1j54APvODnSfOWBqtKVvjgLKzF5YdEk5ewRkGlK0i33Eofffc7HT56jD7/6U+qH3Cx7SBLNntH5YIPvODnyfIXZYRVDPqgHtLs5ABHD3YzLuespb7t79FY34DjMwrVrcTuwlT55YMPvOBnRrJ4VXTdNnYug5ucHLBjEpt30701A3Ts+HEa73u6dT3FNWwflY86eMHPk+Yu+i6pzUpRrW7SNDg5JHR4KapmM5Wv2E8Tfcb1HoqqHMHU+uWDD7zg54mz5/2BSnizi9T1Dg4QQXLToGNCkb6tb1NU+QAlGr1++eADrzhn/u8Q2YZhQVlZ5+CAOtqfbhmaUCS1ezNFVm2imDbPmPng5wmz+gwh+oHDce0eUtQ6OGDIyR0uUhUsoO3vfDmmgOezH0mZN59x7MBi++WDL1g/eEiU3avlidO671bkLfwbw5XV2P8Pzo0ydy4t2/0eu33xYSOMOD8hTf4CrBtGMSoXfPLchX+J0ruSePw3LZeK0juPJbYzrhkH0io7B3k164hiGvawhOKMLkrQLyVpZg8rHFW7E2uHOL888IBPlNZ1FPzstSJM694fWr6RwpvcJK60+0HCILTBzZLFNdtAzJaohze60T8qBzyh5ZuOg5e7uwQppofEmf2++DYvmySqGBuKaicF1blQjhuHdvCIMvp8whTTfZzI7RldpwtSzL+F1+wkdZ2TBOW2gIF88PBTzD/gpeREAMEbxnJcaJHNHrpzji0gQCS6hdkEeYt9DF/2qPcEC8RM28Hwmr3sdNyht00byAut2k3gufWNtgtOEOFGUwcXWNDbdNbpgBGxEvKkOQsxivJx33iow0Vw5S6SVTrpVq11ysA2Rp7gTfPfktc6zhtXBBC+adRLshf6sG2RfHPZ5EAc4sVZ83yCN00Fk/4kggu40ZTvIEm5g24qtU4KjBrx/BTTH8ifVASAG7gKrnWxJDcU7x8X6Ecczhm3o6YicvsLXWfh3Ch1W0k8x0nXF+0fFxgt4phz8QvypiwCCFKMqXCnqXExjq10beH+UUA7+nG6mdG/Pu0f3LgFcGrl2s0kNNjpmoJ9o4B29CMO8dMT4Q5ox8uitF6fqsrJOr8qnwNbRzv6hSnG5wP+64C7h9lp30hKNtKdWjtdkbuPA19nJ7Tz3zR/ibgARbhb4AlhavcBebmTHcFl2fvYEnW0ox9xMxKBS8btJ+KiEbq9zA4RthQXDhPa0T9TEe69gWupwc6uBUphquXgf+/FrIjweHQS4/pduMe5ERUMHUd9xv8ZR98CxkS4F2n3EUrUZ10EYNw7BWm9x1GiPssi3GgiGRDKWRYZfXlON+dfNbM+GgIwYdwAAAAASUVORK5CYII=',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    tooltipAnchor: [16, -28],
                    shadowSize: [41, 41]
                })
            }).on('dragend', function (e) {
                var c = e.target.getLatLng();
                map.setView([c.lat, c.lng], map.getZoom());

                document.querySelector('input[name=lat]').value = c.lat;
                document.querySelector('input[name=lon]').value = c.lng;
            }).addTo(map);

            document.querySelector('input[type=range]').addEventListener('input', (e) => {
                document.querySelector('#psize').innerHTML = e.target.value + ' acres';
            });
        }

        if (pageName == 'admin/wildfires' || pageName == 'admin/wildfires/duplicates') {
            const query = new QueryWildfires();
            query.search(window.location.search.replace('?', '') ?? null);

            document.querySelector('form#searchFires').addEventListener('submit', (e) => {
                e.preventDefault();

                const formData = new FormData(e.target);
                const params = new URLSearchParams();

                for (const [key, value] of formData.entries()) {
                    if (value !== '') {
                        params.append(key, value); // append preserves multiple values
                    }
                }

                const queryString = params.toString();

                query.search(queryString);
            });
        }

        if (pageName.search('admin/wildfires') >= 0) {
            const ac = document.querySelector('input[name=acres]');

            if (ac != null) {
                ac.addEventListener('keyup', (e) => {
                    e.target.value = e.target.value.replace(',', '');
                });
            }
        }

        if (pageName.search('admin/trails') >= 0) {
            keywordResults = document.getElementById('kw-results');
            kw = document.querySelector('input[name=keywords]');

            document.querySelector('#addwaypoint').addEventListener('click', () => {
                addWaypoint();
            });

            document.querySelector('#addgpx').addEventListener('click', () => {
                addGPX();
            });

            kw.addEventListener('keyup', (e) => {
                let res = '',
                    i = 0;

                let search = e.target.value.toLowerCase().replaceAll(', ', ',').split(',');

                keywords.forEach((kw) => {
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
            })
                .setView([45.32, -118.1], 5)
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
                            /* on lat/lon manual changes to value *//*
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

/* on popup save button *//*                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       /* get values from popup and store them in hidden input fields *//*
                                                                                                                                                                                                                                                                        wrap.querySelector('input[name="waypoint[lat][]"]').value = lat;
                                                                                                                                                                                                                                                                        wrap.querySelector('input[name="waypoint[lon][]"]').value = lon;
                                                                                                                                                                                                                                                                        wrap.querySelector('input[name="waypoint[name][]"]').value = name;
                                                                                                                                                                                                                                                                        wrap.querySelector('input[name="waypoint[note][]"]').value = notes;
                                                                                                                                                                                                                                                                        wrap.querySelector('input[name="waypoint[icon][]"]').value = icon;
                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                        map.closePopup();
                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                        
                                                                                                                                                                                                                                                                        /* on popup delete button *//*
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

        if (pageName == 'admin/wildfires') {
            document.querySelector('#q').addEventListener('focus', (e) => {
                const sr = document.querySelector('.search-results');

                sr.style.display = 'block';
                sr.innerHTML = '<p style="padding:.5em">Searching...</p>';
            });

            document.querySelector('#q').addEventListener('keyup', async (e) => {
                let results = '';
                const fd = new FormData();
                fd.append('callback', 'jurisdictions');
                fd.append('q', e.target.value);

                const resp = await api(host + usersAPI + 'jurisdictions', [['q', e.target.value]]);

                resp.response.results.forEach((s) => {
                    const dis = s.unit + ': ' + s.agency + (s.area ? ' / ' + s.area : '');
                    results += '<div class="result" data-name="' + dis + '" data-unit="' + s.unit + '">' + dis + '</div>';
                });

                if (results) {
                    document.querySelector('.search-results').innerHTML = results;
                }
            });
        }

        if (pageName == 'admin/wildfires/create') {
            document.querySelector('#f2').addEventListener('click', () => {
                document.querySelector('input[name=juris]').value = 'MAPO';
                document.querySelector('input[name=num]').value = document.querySelector('input[name=inhouse_num]').value;
                document.querySelector('#notirwin').style.display = 'block';
            });

            document.querySelector('#f1').addEventListener('click', () => {
                document.querySelector('input[name=juris]').value = '';
                document.querySelector('input[name=num]').value = '';
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
    }
};

if (document.querySelector('input[type=tel]')) {
    document.querySelector('input[type=tel]').addEventListener('keyup', (e) => {
        e.target.value = formatPhoneNumber(e.target.value);
    });
}

window.addEventListener('click', async (e) => {
    const target = e.target,
        searchResults = document.querySelector('.search-results');

    if (document.querySelector('#dialog') != null && target.id == 'close') {
        closeDialog();
    }

    if (target.id == 'unfollow') {
        createDialog('Unfollow this fire?', 'Are you sure you want to unfollow this incident?', 'Unfollow', 'unfollow(' + e.target.getAttribute('data-wfid') + ')');
    }

    if (target.id == 'unfavorite') {
        createDialog('Unfavorite this trail?', 'Are you sure you want to unfavorite this trail?', 'Unfavorite', 'unfavorite(' + e.target.getAttribute('data-tid') + ')');
    }

    if (target.id == 'menuIcon' || target.closest('#menuIcon')) {
        target.classList.toggle('fa-bars');
        target.classList.toggle('fa-times');
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
            const unit = target.getAttribute('data-unit'),
                name = target.getAttribute('data-name');

            document.querySelector('input[name=unit]').value = unit;
            document.querySelector('#q').value = name;
        } else {
            const lat = target.getAttribute('data-lat'),
                lon = target.getAttribute('data-lon'),
                name = target.getAttribute('data-name'),
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
        }

        document.querySelector('.search-results').style.display = 'none';
        document.querySelector('.search-results').innerHTML = '';
    }

    /* insert keyword into textbox */
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

    /* delete waypoints */
    if (target.id.startsWith('deletewaypoint')) {
        const id = target.dataset.id,
            fd = new FormData();

        fd.append('callback', 'waypoint');
        fd.append('mode', 'delete');
        fd.append('id', id);

        if (confirm('Are you sure you want to delete this waypoint?')) {
            target.parentNode.parentNode.parentNode.remove();

            if (id) {
                const resp = await api(host + usersAPI + 'waypoint', [['mode', 'delete'], ['id', id]]);

                if (resp) {
                    alert('That waypoint was successfully removed and your changes were saved.');
                }
            }
        }
    }

    /* delete gpx */
    if (target.id.startsWith('deletegpx')) {
        const id = target.dataset.id,
            d = target.dataset.delta,
            tid = target.dataset.tid,
            fn = target.dataset.filename;

        if (confirm('Are you sure you want to delete this GPX file?')) {
            target.parentNode.parentNode.parentNode.remove();

            if (id && tid) {
                const resp = await api(host + usersAPI + 'gpx', [['mode', 'delete'], ['id', id], ['trail_id', tid], ['filename', fn], ['delta', d]]);

                if (resp) {
                    alert('That GPX file was successfully removed and your changes were saved.');
                }
            }
        }
    }

    /* delete multimedia */
    if (target.id.startsWith('deletemedia')) {
        const id = target.dataset.id,
            fn = target.dataset.filename;

        if (confirm('Are you sure you want to delete this multimedia?')) {
            target.parentNode.remove();

            if (id && fn) {
                const resp = await api(host + usersAPI + 'media', [['mode', 'delete'], ['id', id], ['filename', fn]]);

                if (resp) {
                    alert('That photo was successfully removed and your changes were saved.');
                }
            }
        }
    }

    /* hide wildfires from the map link */
    if (target.classList.contains('hidefrommap')) {
        const id = target.dataset.wfid;

        if (id) {
            target.parentElement.parentElement.remove();

            await api(host + usersAPI + 'wildfires', [['mode', 'hide'], ['id', id]]);
        }
    }

    /* hide search results when clicked outside */
    if (searchResults) {
        if (!searchResults.contains(target) && !target.classList.contains('result') && target !== document.querySelector('#q')) {
            searchResults.style.display = 'none';
        }
    }
});