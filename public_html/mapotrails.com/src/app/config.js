export const ENV = {
    origin: window.location.origin,
    host: `https://${__DEBUG__ ? 'mapotrails.com' : `${window.location.host.replace('www.', '')}`}/`,
    cdn: `https://cdn.${__DEBUG__ ? 'mapotrails.com' : `${window.location.host.replace('www.', '')}`}/`,
    baseURL: `${window.location.origin}/`,
    domain: 'https://mapotechnology.com/',
    apiURL: 'https://api.mapotechnology.com/v1/',
    debug: ['localhost', '127.0.0.1'].includes(window.location.hostname),
    versions: {
        chartJS: '4.5.1'
    }
},
    mfFonts = `${ENV.baseURL}data/maps/fonts/{fontstack}/{range}.pbf`,
    debugMode = ENV.debug,
    API_KEYS = {
        'mapotrails': 'cf707f0516e5c1226835bbf0eece4a0c'
    };

export const getPlatform = () => 'mapotrails';

export const config = {
    settings: null,
    productName: 'Map of Trails',
    company: 'MAPO LLC',
    apiKey: () => ENV.debug ? 'bG9jYWxob3N0' : API_KEYS[getPlatform()],
    months: ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    runSearch: false,
    tiles: null,
    settings: null,
    layersHandler: null,
    trails: null,
    fonts: {
        din: () => getFont('din'),
        source: () => getFont('source'),
        roboto: () => getFont('roboto')
    },
    taxonomy: {
        category: null,
        activity: null,
        area: null
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
    activities: {
        'trail': [
            'ATV',
            'Beginner',
            'Big Ride',
            'Climb',
            'Dirtbike',
            'Fantasy',
            'Gravel Bike',
            'Hike',
            'Mountain Bike',
            'Private',
            'Race',
            'Road Bike',
            'Summit'
        ],
        'snow': [
            'Alpine Ski',
            'Backcountry Ski',
            'Big Ski',
            'Nordic Ski',
            'Snowmobile'
        ]
    },
    layersMenu: null
};

export const getFont = (type) => {
    const mapType = config.settings.map().basemap;
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
        permissions: ['ADMIN']
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
        permissions: ['ADMIN']
    },
    {
        id: 'terrain',
        name: 'Terrain',
        imgs: 'terrain',
        permissions: ['ADMIN']
    },
    {
        id: 'voyager',
        name: 'Carto Voyager',
        imgs: 'voyager',
        permissions: ['ADMIN']
    }
];