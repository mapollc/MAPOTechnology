import { ENV, config } from '../app/config.js';
import { global, constants } from '../app/global.js';

import { Calculate } from './calculate.js';
import { Modal } from '../ui/modal.js';

const calculate = new Calculate();

export const ucwords = (s) => {
    const smallWords = new Set(['a', 'an', 'the', 'is', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'with']);
    return s.split(' ').map((word, i) => i === 0 || !smallWords.has(word.toLowerCase()) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(' ');
};

export function counterpart(tf) {
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

export function roadName(s) {
    if (!s) return '';
    return s.replace(/^Hwy\s?/gm, 'ORE')
        .replace(/((OR)([0-9]+))/gm, '$2E$3')
        .replace(/((I)([0-9]+))/gm, '$2-$3');
}

export function compileReports(name) {
    const tf = name.toLowerCase(),
        s = counterpart(tf)?.toLowerCase();

    return global.globalData.roadReports.filter(ea => {
        const roadName = ea.name.toLowerCase();
        return roadName === tf || (s && roadName === s);
    });
}

export function nearestCity(a, b) {
    const theCity = [],
        theDist = [],
        theBear = [],
        dirMap = {
            N: 'North',
            S: 'South',
            E: 'East',
            W: 'West'
        };

    global.cities.forEach((c) => {
        const dist = calculate.distance(c.lat, c.lon, a, b);
        const bear = calculate.getBearing(c.lat, c.lon, a, b);
        theCity.push(c.city);
        theDist.push(dist);
        theBear.push(bear);
    });

    const min = Math.min.apply(null, theDist);
    const dir = theBear[theDist.indexOf(min)].replace(/\b[NSEW]\b/g, (match) => dirMap[match]);
    return min.toFixed(1) + ' miles ' + dir + ' of ' + theCity[theDist.indexOf(min)] + ', OR';
}

export function incidentStyle(type) {
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

export function goToRW(name) {
    new Modal(this.compileReports(name)).roadReport(name);
}

export function goToRWIS(id) {
    const stn = this.fetchRWIS(id);
    if (!stn) return;

    new Modal(stn.properties).rwis();
}

export function goToIncident(id) {
    const inc = this.getIncident(id);
    if (inc == null) {
        createDialog('Incident Not Found', `We are unable to locate incident #${id}. It may already be resolved or it doesn't exist.`);
        return;
    }

    new Modal(inc.properties).incident();
}

export function fetchRWIS(id) {
    const filter = global.globalData.rwis.filter(stn => stn.properties.id === id);

    return filter[0] ?? null;
}

export function getIncident(id, construct = false) {
    const item = construct ? global.globalData.roadWork : global.globalData.incidents,
        inc = item.filter(i => i.properties.id == id);

    return inc[0] ?? null;
}

export function gripHelper(g) {
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

export function grip(v) {
    const [desc, label] = this.gripHelper(v);
    const msg = `A surface friction of ${v} is usually ${desc.toLowerCase()} and the road is likely ${label.toLowerCase()}.`;
    createDialog('Road Grip', msg);
}

export function timeAgo(t, w, c) {
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

export async function api(uri, fields = null, v2 = false, forAuth = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let resp,
        result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu') || url.includes('rainviewer.com') || url.includes('mapbox.com'),
        isInternal = url.includes(ENV.apiURL) || url.includes(ENV.apiURL.replace('v1', 'v2')) || url.includes(ENV.host),
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

    if (forAuth) ops['credentials'] = 'include';
    if (!isExternal) ops['body'] = fd;

    try {
        resp = await fetch(url, ops);
    } catch (e) {
        console.warn(`Fetch failed for ${url}; retrying...`, e);

        await new Promise(resolve => setTimeout(resolve, 250));

        try {
            resp = await fetch(url, ops);
        } catch (retryError) {
            console.error(`Fetch failed after retry for URL: ${url}`, retryError);
            return null;
        }
    }

    // if there was an error with the network request, log the error
    if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`HTTP error! Status: ${resp.status}, URL: ${url}, Response: ${errorText}`);

        return null;
    }

    // parse JSON separately so a JSON error isn't retried
    try {
        result = await resp.json();
    } catch (e) {
        console.error(`JSON parsing error for URL: ${url}`, e.message);
        result = null;
    }

    return result;
}

export function notify(t, m, time = 0) {
    const timing = time === 0 ? (((m.split(' ').length / 5) + 0.5) * 1000) + 500 : time * 1000,
        el = document.createElement('div'),
        icon = t == 'success' ? 'fa-check' : (t == 'info' ? 'fa-circle-info' : 'fa-circle-exclamation');

    document.querySelector('div.alert')?.remove();

    el.classList.add('alert', t);

    //if (modal.classList.contains('open')) el.classList.add('mo');

    el.style.display = 'flex';
    el.innerHTML = `<i class="fas ${icon}"></i><p>${m}</p>`;
    document.body.append(el);

    setTimeout(() => { el.remove(); }, timing);
}

export function storage(k, data = null) {
    const key = `oreroads_v${VERSION.replace('.', '_')}.${k}`;
    return data ? localStorage.setItem(key, data) : localStorage.getItem(key);
}

export function hideLoading() {
    if (isVisible(document.querySelector('#loading'))) {
        document.querySelector('#loading').remove();
    }

    const logo = document.querySelector('.logo');
    if (logo && !isVisible(logo)) logo.style.display = 'block';
}

export function isVisible(el) {
    if (el == null) {
        return false;
    } else {
        return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }
}

export function Snackbar(m) {
    const animate = (elem, max, d) => {
        let pos = 0;

        let id = setInterval(() => {
            if (pos == max) {
                clearInterval(id);

                setTimeout(() => {
                    elem.remove();
                }, elem.innerHTML.split(' ').length / 2.5 * 1000);
            } else {
                pos++;
                if (d == 'top') {
                    elem.style.top = pos + 'px';
                } else if (d == 'bottom') {
                    elem.style.bottom = pos + 'px';
                }
            }
        }, 5);
    };

    document.body.insertAdjacentHTML('beforeend', '<div class="snackbar">' + m + '</div>');
    animate(document.querySelector('.snackbar'), 16, 'bottom');
}

export function createDialog(t, m, neg = false, pb = 'Ok', nb = '') {
    if (document.querySelector('.dialog') != null) {
        document.querySelector('.dialog').remove();
    }

    const d = document.createElement('div');

    d.innerHTML = constants.dialog;
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