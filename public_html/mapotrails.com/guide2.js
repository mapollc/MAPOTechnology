import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.1.0/dist/maplibre-gl.mjs';

const host = `https://${window.location.host.replace('www.', '')}/`,
    cdn = `https://cdn.${window.location.host.replace('www.', '')}/`,
    baseURL = `${window.location.origin}/`,
    domain = 'https://mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    page = window.location.pathname.substring(1);

let map;

const apiKey = () => 'cf707f0516e5c1226835bbf0eece4a0c';

async function api(uri, fields = null, v2 = false, forAuth = false) {
    if (!navigator.onLine) {
        console.error('You are not connected to the internet');
        return null;
    }

    let resp,
        result,
        url = v2 ? uri.replace('v1', 'v2') : uri;

    const isExternal = url.includes('weather.gov') || url.includes('unl.edu') || url.includes('rainviewer.com'),
        isInternal = url.includes(apiURL) || url.includes(apiURL.replace('v1', 'v2')) || url.includes(host),
        ops = {
            method: isExternal ? 'GET' : 'POST'
        },
        fd = new FormData();

    if (isInternal) fd.append('key', apiKey());

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

async function trailGuide() {
    const tiles = {
        outdoors: `${apiURL}maps/style/terrain?key=${apiKey()}`,
        satellite: `${apiURL}maps/style/satellite?key=${apiKey()}`,
        fs16: `${apiURL}maps/style/usfs?key=${apiKey()}`
    };

    map = new maplibregl.Map({
        container: 'map',
        zoom: 5.37,
        center: [-119.92556, 44.28071],
        style: tiles['outdoors'],
        projection: 'mercator',
        hash: false,
        maxPitch: 85,
        pitch: 0,
        bearing: 0,
        attributionControl: false
    });

    map.addControl(
        new maplibregl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true
        }),
        'top-right'
    );


    const trail = await api(`${apiURL}trails/guide`, [['id', 1]], true);

    console.log(trail);
}

window.onload = () => {
    if (page.startsWith('guide2')) trailGuide();
};