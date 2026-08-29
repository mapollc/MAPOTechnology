import { ENV, config } from '../app/config.js';
import { global, impact, modal } from '../app/state.js';

import { DateFormatter } from './constants.js';

import { notify } from '../ui/components.js';

export function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

export function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

export function mapMouseOver(layer) {
    global.map.on('mouseenter', layer, () => global.map.getCanvas().style.cursor = 'pointer');
    global.map.on('mouseleave', layer, () => global.map.getCanvas().style.cursor = 'auto');
}

export function isVisible(div) {
    const element = document.querySelector(div);

    if (element != null) {
        const rect = element.getBoundingClientRect(),
            windowHeight = window.innerHeight;

        return rect.top >= 0 && rect.bottom <= windowHeight;
    }
}

export function formatArray(arr) {
    if (arr.length === 2) {
        return arr.join(' & ');
    } else if (arr.length >= 3) {
        const lastTwo = arr.slice(-2).join(' & '),
            firstPart = arr.slice(0, -2);
        return `${firstPart.join(', ')}, ${lastTwo}`;
    } else if (arr.length === 1) {
        return arr[0];
    } else {
        return '';
    }
}

export function gmtime(s) {
    const d = new Date(Date.now() + s * 1000),
        pad = (n) => n.toString().padStart(2, '0'),
        year = d.getUTCFullYear(),
        month = pad(d.getUTCMonth() + 1),
        day = pad(d.getUTCDate()),
        hours = pad(d.getUTCHours());

    return `${year}-${month}-${day}T${hours}:00:00`;
}

export function storage(key, data = null) {
    return data ? localStorage.setItem(key, data) : localStorage.getItem(key);
}

/*export async function getWorker(name) {
    if (!config.workers[name]) {
        const loader = workerModules[`../ui/${name}.js`];

        if (!loader) {
            throw new Error(`Unknown worker: ${name}`);
        }

        const WorkerClass = await loader();
        config.workers[name] = new WorkerClass();
    }

    return config.workers[name];
}*/

export async function api(uri, fields = null, v2 = false, forAuth = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let resp,
        result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu') || url.includes('rainviewer.com'),
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

export async function saveSession(method = true) {
    if (!navigator.onLine) return notify('error', 'Unable to sync due to no internet.');

    const sy = document.querySelector('li#save span'),
        syncStatus = impact.querySelector('#sync span'),
        set = {
            ...config.settings.settings,
            center: [global.map.getCenter().lat, global.map.getCenter().lng],
            zoom: global.map.getZoom(),
            pitch: global.map.getPitch(),
            bearing: global.map.getBearing(),
            tile: config.settings.getBasemap(),
            weather: config.settings.weather || { temp: 'f', wind: 'mph' }
        };

    if (sy) sy.innerHTML = 'Syncing...';
    if (syncStatus) syncStatus.innerHTML = 'Syncing...';

    const data = await api(`${ENV.host}api/v1/session`, [['method', method], ['settings', JSON.stringify(set)]], false, true);

    if (data?.success === 1) {
        if (config.settings.user) config.settings.user.synced = Date.now();
        if (sy) sy.innerHTML = 'Sync';
        if (syncStatus) syncStatus.innerHTML = 'Account synced just now';

        notify('success', 'Your settings were successfully synced.');
    } else {
        if (sy) sy.innerHTML = 'Sync Error';

        notify('error', 'Sync failed. Server might be down.');
    }
}

export function timeAgo(t, w, c) {
    if (t === 'undefined' || !t) return '';

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
    let val = `${Math.floor(d / range.div)} ${range.unit}${plural(Math.floor(d / range.div))}`;

    if (range.sub) {
        const subVal = subUnit(d, range.div, range.sub.div);
        if (subVal !== 0) {
            val += `,&nbsp;${subVal} ${range.sub.unit}${plural(subVal)}`;
        }
    }

    if (w === 1) val = val.split(',')[0];

    return `${val} ago`;
}

export function setHeaders(title, urlPath, description) {
    if (window.location.hostname === '127.0.0.1') return;

    const fullUrl = `${ENV.baseURL}${urlPath.replace(/incident\/|wildfire\//g, 'fires/')}${window.location.search}${window.location.hash}`,
        pageTitle = `${title} | ${config.productName}`;

    // Use a single line to decide which history method to use
    (modal.classList.contains('open') ? window.history.replaceState : window.history.pushState).call(window.history, {
        "pageTitle": pageTitle
    }, '', fullUrl);

    // Update document metadata
    document.title = pageTitle;
    const metaTags = [
        { property: 'og:title', content: pageTitle },
        { property: 'twitter:title', content: pageTitle },
        { name: 'description', content: description },
        { property: 'og:description', content: description },
        { name: 'twitter:description', content: description }
    ];

    metaTags.forEach(tag => {
        const selector = tag.property
            ? `meta[property="${tag.property}"]`
            : `meta[name="${tag.name}"]`;

        document.querySelector(selector)?.setAttribute('content', tag.content);
    });
}

export function unsetHeaders() {
    const h = window.location.href;

    if (['fires', 'perimeter', 'weather/', 'risk'].some(path => h.includes(path))) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', h.replace(window.location.pathname, (config.settings.archive == null ? '' : `/archive/${config.settings.archive}`)));

        document.title = defaultTitle;

        ['meta[property="og:title"]', 'meta[name="twitter:title"]']
            .forEach(n => document.querySelector(n).setAttribute('content', defaultTitle));
        ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']
            .forEach(n => document.querySelector(n).setAttribute('content', defaultDesc));
    }
}

export class Popup {
    constructor(title, tall = false) {
        this.header = `<div class="header"${(!title ? ' style="margin-bottom:0"' : '')}>
            <h1>${title}</h1>
            <span id="close-popup" data-action="close-popup" title="Close popup" class="far fa-xmark-large"></span>
        </div>`;
        this.tall = tall;
        this.dialog = null;

        if (isVisible('#modal')) global.inits.clickListener.closeModal();
    }

    createContent(data) {
        if (!data) return '';
        if (typeof data === 'string') return data;

        return Object.entries(data)
            .map(i => {
                if (i[1] == null) return '';

                return `<div class="item">
                    <div class="t">${i[0]}</div>
                    <div class="v">${i[1]}</div>
                </div>`;
            }).join('');
    }

    create(data, extraHTML = null) {
        this.close();

        const pop = document.createElement('div');
        pop.classList.add('popup');
        if (this.tall) pop.classList.add('tall');

        pop.innerHTML = `<div class="content">${this.header}
            <div class="data">
                ${this.createContent(data)}${extraHTML ?? ''}
            </div>
        </div>`;

        this.dialog = pop;
        this.open();

        return this;
    }

    loading(extraHTML = null) {
        this.create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>' + (extraHTML ?? ''));
        return this;
    }

    update(title = null, data, extraHTML = null) {
        if (title) {
            const h = this.dialog.querySelector('.header h1');
            h.innerHTML = title;
            h.parentElement.removeAttribute('style');
        }

        this.dialog.querySelector('.content .data').innerHTML = `${this.createContent(data)}${(extraHTML ?? '')}`;

        return this;
    }

    link(url, text = "Learn More") {
        this.dialog.querySelector('.content .data').insertAdjacentHTML('afterend', `<a class="popup-btn" target="_blank" href="${url}">${text}</a>`);
        return this;
    }

    open() {
        document.body.appendChild(this.dialog);
        return this;
    }

    close() {
        const p = document.querySelector('.popup');
        if (p) p.remove();
        return this;
    }
}

export function dateTime(it, time = false, timezone = false, longMonth = false) {
    if (it == null || it === '') return '';

    let t = new Date(it.toString().length == 10 ? it * 1000 : it),
        h = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())),
        m = (t.getMinutes() < 10 ? '0' : '') + t.getMinutes(),
        a = `${h}:${m} ${(t.getHours() >= 12 ? 'P' : 'A')}M`,
        s = (/\((.*?)\)/g).exec(new Date().toString())[1].split(' '),
        tz = s[0].substring(0, 1) + s[1].substring(0, 1) + s[2].substring(0, 1),
        month = longMonth ? DateFormatter.LONG_MONTHS[t.getMonth()] : config.months[t.getMonth()];

    return `${month} ${t.getDate()}, ${t.getFullYear()}${(time ? `&nbsp;at ${a}` : '')}${(timezone ? ` ${tz}` : '')}`;
}

export function getbbox() {
    var b = global.map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast();

    return (b ? JSON.stringify({
        xmin: sw.lng,
        ymin: sw.lat,
        xmax: ne.lng,
        ymax: ne.lat,
        spatialReference: {
            wkid: 4326
        }
    }) : false);
}

class Extent {
    constructor() {
        this._bbox = [Infinity, Infinity, -Infinity, -Infinity];
        this._valid = false;
    }

    include([lng, lat]) {
        this._valid = true;
        this._bbox[0] = Math.min(this._bbox[0], lng);
        this._bbox[1] = Math.min(this._bbox[1], lat);
        this._bbox[2] = Math.max(this._bbox[2], lng);
        this._bbox[3] = Math.max(this._bbox[3], lat);
        return this;
    }

    bbox() {
        return this._valid ? this._bbox : null;
    }

    polygon() {
        if (!this._valid) return null;

        const [minX, minY, maxX, maxY] = this._bbox;

        return {
            type: "Polygon",
            coordinates: [[
                [minX, minY],
                [maxX, minY],
                [maxX, maxY],
                [minX, maxY],
                [minX, minY]
            ]]
        };
    }
}

function geojsonCoords(gj) {
    const coords = [];

    function flatten(obj) {
        if (!obj) return;

        switch (obj.type) {
            case "FeatureCollection":
                obj.features.forEach(flatten);
                break;

            case "Feature":
                flatten(obj.geometry);
                break;

            case "GeometryCollection":
                obj.geometries.forEach(flatten);
                break;

            default:
                if (Array.isArray(obj.coordinates)) {
                    const stack = [obj.coordinates];

                    while (stack.length) {
                        const item = stack.pop();

                        if (typeof item[0] === "number") {
                            coords.push(item);
                        } else {
                            stack.push(...item);
                        }
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

export function geojsonExtent(gj) {
    const ext = new Extent();

    geojsonCoords(gj).forEach(coord => ext.include(coord));

    return ext.bbox();
}

geojsonExtent.polygon = function (gj) {
    const ext = new Extent();

    geojsonCoords(gj).forEach(coord => ext.include(coord));

    return ext.polygon();
};

geojsonExtent.bboxify = function (obj) {
    const geojsonTypes = new Set([
        "FeatureCollection",
        "Feature",
        "GeometryCollection",
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon"
    ]);

    traverse(obj, value => {
        if (value?.type && geojsonTypes.has(value.type)) {
            value.bbox = geojsonExtent(value);
        }
    });
};

export function loadScript(src) {
    return new Promise(function (resolve, reject) {
        var s;
        s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

export function createDataForm(title, content, center = false) {
    const df = document.querySelector('#data-form');

    df?.classList.remove('bg');
    df?.remove();

    const el = document.createElement('dialog');
    el.id = 'data-form';
    el.innerHTML = `<span id="exit" data-action="close-data-form" class="far fa-xmark"></span>
        <div class="wrapper${(center ? ' center' : '')}">
            <h1>${title}</h1>${content}
        </div>`;
    document.body.append(el);
}