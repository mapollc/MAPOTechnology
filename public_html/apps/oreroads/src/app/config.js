export const ENV = {
    origin: window.location.origin,
    host: `https://${__DEBUG__ ? 'mapotechnology.com' : `${window.location.host.replace('www.', '')}`}/`,
    baseURL: `${window.location.origin}/`,
    domain: 'https://mapotechnology.com/',
    apiURL: 'https://api.mapotechnology.com/v1/',
    debug: ['localhost', '127.0.0.1'].includes(window.location.hostname)
},
    mfFonts = `//mapofire.com/data/maps/fonts/{fontstack}/{range}.pbf`,
    debugMode = ENV.debug,
    API_KEYS = {
        'mapotrails': 'cf707f0516e5c1226835bbf0eece4a0c'
    };

export const siteTitle = document.title;
export const curtime = new Date();
export const getPlatform = () => 'oregonroads';

export const config = {
    settings: null,
    apiKey: () => ENV.debug ? 'bG9jYWxob3N0' : API_KEYS[getPlatform()],
    //summerMode: (curtime.getTime() >= new Date(`4/15/${curtime.getFullYear()} 00:00:00`).getTime() && curtime.getTime() <= new Date(`10/15/${curtime.getFullYear()} 23:59:59`).getTime() ? true : false),
    summerMode: false,
    userBaseMap: null,
    dataStatus: {
        rwRetrieved: false,
        rwisRetrieved: false,
        incidentsRetrieved: false,
        webcamsRetrieved: false,
        plowsRetrieved: false,
        dmsRetrieved: false,
        roadWorkRetrieved: false
    },
    imgPath: 'assets/images/oreroads/',
    mapboxToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbTd0ZnlseGMwemphMm5wcDQzNW9mdmltIn0.HAJ4nP3ui3lGljbrDjHyog'
    //'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw'
};

export const disclaimer = 'OregonRoads is a third-party app built by MAPO LLC. The data and information used in this app is provided by the ' +
    'Oregon Department of Transportation (ODOT)&mdash;an official government agency. However, this app is not an official government app, and is not affiliated or ' +
    'associated with ODOT or the State of Oregon in any way. Please acknowledge that you read and agree with this disclaimer.';