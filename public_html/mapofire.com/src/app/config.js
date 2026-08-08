import { storage, api } from '../utils/helpers.js'

import { global } from './state.js'

export const ENV = {
    origin: window.location.origin,
    host: `https://${__DEBUG__ ? 'mapofire.com' : `${window.location.host.replace('www.', '')}`}/`,
    baseURL: `${window.location.origin}/`,
    domain: 'https://mapotechnology.com/',
    apiURL: 'https://api.mapotechnology.com/v1/',
    debug: window.location.search.includes('version'),
    PLATFORM_MAP: {
        'wildfiremap.org': 'wildfiremap',
        'fireweatheravalanche.org': 'fireweatheravalanche'
    }/*,
    originalConsole: {},
    consoleMsgs: []*/
},
    mfFonts = `${ENV.baseURL}data/maps/fonts/{fontstack}/{range}.pbf`,
    debugMode = ENV.debug,
    API_KEYS = {
        'fireweatheravalanche': '191eab18c50c8f5653bdeba13f219bed',
        'wildfiremap': '85f58fa255efe0f779e0dfcd62d87e6d',
        'mapofire': '50e2c43f8f63ff0ed20127ee2487f15e'
    };

export const getPlatform = () => ENV.PLATFORM_MAP[ENV.host] || 'mapofire';

export const config = {
    settings: null,
    productName: 'Map of Fire',
    company: 'MAPO LLC',
    apiKey: () => ['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'bG9jYWxob3N0' : API_KEYS[getPlatform()],
    disableClicks: false,
    clusterFires: true,
    RADAR_OPACITY: 0.7,
    ANIMATION_DELAY_MS: 500,
    wildfire: null,
    perimeters: null,
    layersHandler: null,
    layersMenu: null,
    listOfLayers: [],
    fuelsData: null,
    defaultAttr: '',
    months: ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    curTime: new Date(),
    runSearch: false,
    TIERS: {
        'ignite_monthly': 'PREMIUM',
        'ignite_annual': 'PREMIUM',
        'hotshot_monthly': 'PRO',
        'hotshot_annual': 'PRO'
    },
    PERMISSION_LEVELS: {
        ADMIN: 'ADMIN',
        LICENSEE: 'LICENSEE',
        PREMIUM: 'PREMIUM',
        PRO: 'PRO'
    },
    RANKS: {
        PREMIUM: 1,
        PRO: 2,
        LICENSEE: 3,
        ADMIN: 4
    },
    modisZoomLevel: 7,
    firemedZoomLevel: 9,
    toolsInstance: null,
    /*workers: {
        incident: incidentWorker,
        fwf: fwfWorker,
        wwas: wwasWorker
    },*/
    fog: {
        'sky-color': '#33bbff',
        'sky-horizon-blend': +0.5,
        'horizon-color': '#b1ddec',
        'horizon-fog-blend': +0.5,
        'fog-color': '#c7c7c7',
        'fog-ground-blend': +0.1
    },
    tiles: null,
    fonts: {
        din: () => getFont('din'),
        source: () => getFont('source'),
        roboto: () => getFont('roboto')
    }
};

export const getFont = (type) => {
    const mapType = config.settings.getBasemap();
    const fontMap = {
        din: {
            dark: ['Noto Sans Regular'],
            voyager: ['Noto Sans Regular'],
            satellite: ['Noto Sans Bold'],
            default: ['DIN Pro Medium']
        },
        source: {
            dark: ['Noto Sans Regular'],
            voyager: ['Noto Sans Regular'],
            satellite: ['Noto Sans Bold'],
            osm: ['Source Sans Pro SemiBold'],
            default: ['Source Sans Pro SemiBold']
        },
        roboto: {
            dark: ['Montserrat Medium'],
            voyager: ['Montserrat Medium'],
            satellite: ['Noto Sans Bold'],
            default: ['Roboto Medium']
        }
    };

    return fontMap[type][mapType] || fontMap[type].default;
};

export const tileConfig = [
    {
        id: 'outdoors',
        name: 'MAPO Outdoors',
        imgs: 'mapo_outdoors',
        permissions: []
    },
    {
        id: 'satellite',
        name: 'Satellite',
        imgs: 'satellite',
        permissions: []
    },
    {
        id: 'fs16',
        name: 'USFS 2016',
        imgs: 'fs_topo',
        permissions: ['PRO']
    },
    {
        id: 'dark',
        name: 'Dark',
        imgs: 'dark',
        permissions: []
    },
    {
        id: 'osm',
        name: 'OpenStreetMap',
        imgs: 'osm',
        permissions: []
    },
    {
        id: 'topofire',
        name: 'Topofire',
        imgs: 'topofire',
        permissions: ['PRO']
    },
    {
        id: 'terrain',
        name: 'Terrain',
        imgs: 'terrain',
        permissions: ['PREMIUM', 'PRO']
    },
    {
        id: 'voyager',
        name: 'Carto Voyager',
        imgs: 'voyager',
        permissions: ['PREMIUM', 'PRO']
    }
];

export const risk = {
    'whp': [
        ['N/A', '#fff'],
        ['Very Low', '#38a800'],
        ['Low', '#d1ff73'],
        ['Moderate', '#ffff00'],
        ['High', '#ffaa00'],
        ['Very High', '#ff0000']
    ]
};

export async function loadDispatchCenters() {
    if (storage('mapofire.dispatch') == null || Date.now() - storage('mapofire.dispatch_time') > 60 * 60 * 24 * 1000) {
        const dc = await api(`${ENV.apiURL}dispatch/all`);

        if (!dc?.dispatch) return;

        storage('mapofire.dispatch', JSON.stringify(dc.dispatch));
        storage('mapofire.dispatch_time', Date.now());
        global.dispatchCenters = dc.dispatch;
    } else {
        global.dispatchCenters = JSON.parse(storage('mapofire.dispatch'));
    }
}