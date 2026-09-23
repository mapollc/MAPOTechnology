import { global } from '../app/state.js';
import { ENV, config } from '../app/config.js';
import { removeSelectedData } from '../map/mapping.js';

export function ucwords(s) {
    const smallWords = new Set(['a', 'an', 'the', 'is', 'of', 'and', 'or', 'for', 'to', 'in', 'on', 'at', 'by', 'with']);
    return s.split(' ').map((word, i) => i === 0 || !smallWords.has(word.toLowerCase()) ? word.charAt(0).toUpperCase() + word.slice(1) : word.toLowerCase()).join(' ');
}

export function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

export function numberFormat(n, d = 0) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(Number(n));
}

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

    const sy = document.querySelector('li#save span');
    const set = {
        ...config.settings.settings,
        center: [global.map.getCenter().lat, global.map.getCenter().lng],
        zoom: global.map.getZoom(),
        pitch: global.map.getPitch(),
        bearing: global.map.getBearing(),
        tile: config.settings.map().basemap
    };

    if (sy) sy.innerHTML = 'Syncing...';

    const data = await api(
        `${ENV.host}api/v1/session`,
        [
            ['method', method],
            ['settings', JSON.stringify(set)]
        ],
        false,
        true
    );

    if (data?.success === 1) {
        if (config.settings.user) config.settings.user.synced = Date.now();
        if (sy) sy.innerHTML = 'Sync';

        notify('success', 'Your settings were successfully synced.');
        return;
    }

    if (sy) sy.innerHTML = 'Sync Error';

    notify('error', `Unable to sync your settings right now.${method ? ' Try again.' : ''}`);
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

export function storage(key, data = null) {
    return data ? localStorage.setItem(key, data) : localStorage.getItem(key);
}

export function layerMouseOver(id) {
    global.map.on('mouseenter', id, () => {
        global.map.getCanvas().style.cursor = 'pointer';
    });

    global.map.on('mouseleave', id, () => {
        global.map.getCanvas().style.cursor = 'auto';
    });
}

export function createModal() {
    document.querySelector('dialog#modal')?.remove();

    const modal = document.createElement('dialog');
    modal.id = 'modal';
    modal.innerHTML = `<div class="content">
        <div class="header">
            <h2 class="title"></h2>
            <button class="dialog-close" type="button"><i class="far fa-xmark"></i></button>
        </div>

        <div class="main-content"></div>
    </div>`;

    modal.querySelector('.dialog-close').addEventListener('click', () => {
        removeSelectedData();
        unsetHeaders();

        modal.close();
        modal.remove();
    });

    document.body.appendChild(modal);
    modal.showModal();
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

export function isVisible(div) {
    const element = document.querySelector(div);

    if (element != null) {
        const rect = element.getBoundingClientRect(),
            windowHeight = window.innerHeight;

        return rect.top >= 0 && rect.bottom <= windowHeight;
    }
}

export function setHeaders(title, urlPath) {
    if (window.location.hostname === '127.0.0.1') return;

    const fullUrl = `${ENV.baseURL}${urlPath}${window.location.search}${window.location.hash}`,
        pageTitle = `${title} - ${config.productName}`;

    (typeof FIND_TRAIL !== 'undefined' && FIND_TRAIL ? window.history.replaceState : window.history.pushState).call(window.history, {
        "pageTitle": pageTitle
    }, '', fullUrl);

    document.title = pageTitle;
}

export function unsetHeaders() {
    if (window.location.hostname === '127.0.0.1') return;

    const h = window.location.href;

    window.history.pushState({
        "pageTitle": document.title
    }, '', h.replace(window.location.pathname, ''));

    document.title = defaultTitle;

    ['meta[property="og:title"]', 'meta[name="twitter:title"]']
        .forEach(n => {
            const s = document.querySelector(n);

            if (s) s.setAttribute('content', defaultTitle);
        });
}