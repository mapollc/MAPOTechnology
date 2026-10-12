import { ENV, config } from './config.js';

export const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturdary'];
export const short_months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const long_months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const global = {
    map: null,
    basemaps: {
        'light': 'mapbox://styles/mapollc/cm2kmozef00wi01ps649r2lgl',
        'dark': 'mapbox://styles/mapollc/cm33jv42500un01pw5skw9dqr'
    },
    menuLoaded: false,
    modal: null,
    moving: false,
    radar: null,
    radarImgs: [],
    radarAnim: null,
    nwsAlerts: [],
    globalData: {
        roadReports: [],
        rwis: [],
        roadWork: [],
        webcams: [],
        incidents: [],
        varMsgSigns: [],
        snowPlows: []
    },
    cities: null,
    roadNetwork: [],
    roads: null,
    calculate: null,
    helper: null,
    radarPlay: true,
    roadsArray: [],
    roadsIDArray: []
};

export const constants = {
    dialog: '<div class="wrapper"><h1></h1><p></p><div class="buttons"><a href="#" id="neg" class="cta" onclick="return false"></a><a href="#" id="pos" class="cta" onclick="return false"></a></div></div>',
    noRes: '<div id="result" class="none">Searching...</div>'
};

export const basemaps = {
    light: `${ENV.apiURL}maps/style/terrain?key=${config.apiKey()}`,
    dark: ''
}

export const layersList = [
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
];

export const metro = [
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
];