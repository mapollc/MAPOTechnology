let map,
    subscribe,
    modal = document.querySelector('#modal'),
    host = 'https://www.mapotrails.com/',
    domain = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    cdn = 'https://cdn.mapotrails.com/',
    apiKey = 'cf707f0516e5c1226835bbf0eece4a0c',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    mbDrawVersion = '1.4.3',
    appName = 'Map of Trails',
    sub_id = 'price_1NmiH6IpCdpJm6cTP1rELzPw',
    /*sub_id = 'price_1NmlJmIpCdpJm6cTexK8QJNT',*/
    tids = [],
    gisIDs = [],
    gettingWX = false,
    startLat,
    startLon,
    theads,
    gi,
    trailheads = [],
    radarImgs = [],
    radarAnim,
    RADAR_INT = 500,
    radarPlay = true,
    waypoints,
    snotels,
    curLoc,
    curWX,
    timeout = null,
    favTrails = [],
    uploadedFiles = [],
    uploadedJSON = [],
    userFeatures = [],
    userUploadFeatures = [],
    userFolders = [],
    selected = null,
    tbLoad = false,
    Draw = null,
    chartpng,
    typingTimer,
    EXAGG = 1.75,
    states = { 'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'DC': 'District Of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma', 'ON': 'Ontario', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming' },
    activities = [{ "trail": "ATV" }, { "snow": "Alpine Ski" }, { "snow": "Backcountry Ski" }, { "trail": "Beginner" }, { "trail": "Big Ride" }, { "trail": "Climb" }, { "trail": "Dirtbike" }, { "trail": "Fantasy" }, { "trail": "Gravel Bike" }, { "trail": "Hike" }, { "trail": "Mountain Bike" }, { "snow": "Nordic Ski" }, { "snow": "Private" }, { "trail": "Race" }, { "trail": "Road Bike" }, { "snow": "Snowmobile" }, { "snow": "Summit" }],
    icons = ['info', 'hike', 'mtb', 'road', 'gravel', 'dirtbike', 'climb', 'atski', 'nordic', 'alpine', 'snowmobile', 'camp', 'camp2', 'lake', 'media', 'parking', 'restroom', 'river', 'sledding', 'bridge', 'cabin', 'caution', 'fantasy', 'fishing', '4x4', 'big_ride', 'big_air', 'bigfoot', 'summit', 'ski', 'swim'],
    tileNames = ['terrain', 'satellite', 'caltopo', 'fs16', 'outdoors',/* 'delorme',*/ 'osm'],
    tilePerms = [0, 0, 0, 1, 1],
    copyData = '<span class="copyData fas fa-copy" data-content="{content}" title="Copy to clipboard"></span>',
    defaultAttr = '&copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a> ',
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    /*fog = {
        range: [2.5, 5.5],
        'horizon-blend': 1,
        color: '#f4fcff',
        'high-color': '#87c8dd',
        'space-color': '#a2d9f5',
        'star-intensity': 0.5
    },*/
    fog = {
        range: [1, 20], "color": ["interpolate", ["linear"], ["zoom"], 4, "hsl(200, 100%, 100%)", 6, "hsl(200, 50%, 90%)"],
        "high-color": ["interpolate", ["linear"], ["zoom"], 4, "hsl(200, 100%, 60%)", 6, "hsl(310, 60%, 80%)"],
        "space-color": ["interpolate", ["exponential", 1.2], ["zoom"], 4, "hsl(205, 10%, 10%)", 6, "hsl(205, 60%, 50%)"],
        "horizon-blend": ["interpolate", ["exponential", 1.2], ["zoom"], 4, 0.01, 6, 0.1], "star-intensity": ["interpolate", ["exponential", 1.2], ["zoom"], 4, 0.1, 6, 0]
    },
    osm = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'openstreetmap': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }
        },
        layers: [{
            id: 'osm',
            type: 'raster',
            source: 'openstreetmap',
            minzoom: 0,
            maxzoom: 22
        }]
    },
    terrain = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'esri': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.esri.com">ESRI</a>'
            }
        },
        layers: [{
            id: 'terrain',
            type: 'raster',
            source: 'esri',
            minzoom: 3,
            maxzoom: 18
        }]
    },
    caltopo = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'ct': {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/2/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://caltopo.com">CalTopo</a>'
            }
        },
        layers: [{
            id: 'caltopo',
            type: 'raster',
            source: 'ct',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    fs16 = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'usfs2016': {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/3/{z}/{x}/{y}.png'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'fs16',
            type: 'raster',
            source: 'usfs2016',
            minzoom: 5,
            maxzoom: 16
        }]
    },
    tiles = {
        'outdoors': 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9',
        'outdoors': 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9',
        'satellite': 'mapbox://styles/mapollc/clvh22ic505rn01pkdic7evid',
        /*'satellite': 'mapbox://styles/mapbox/satellite-v9',*/
        'osm': osm,
        'fs16': fs16,
        'caltopo': caltopo,
        'terrain': terrain
    },
    bearings = {
        'N': 'North',
        'NNE': 'North-Northeast',
        'NE': 'Northeast',
        'ENE': 'East-Northeast',
        'E': 'East',
        'ESE': 'East-Southeast',
        'SE': 'Southeast',
        'SSE': 'South-Southeast',
        'S': 'South',
        'SSW': 'South-Southwest',
        'SW': 'Southwest',
        'WSW': 'West-Southwest',
        'W': 'West',
        'WNW': 'West-Northwest',
        'NW': 'Northwest',
        'NNW': 'North-Northwest'
    },
    RED = '#ed254e',
    ONG = '#f44f10',
    BLU = '#3bb2d0',
    GRN = '#83b692',
    YEL = '#ffba08',
    DKBL = '#00385c',
    BLK = '#333',
    colorOptions = [
        {
            name: 'red',
            value: RED
        },
        {
            name: 'orange',
            value: ONG
        },
        {
            name: 'blue',
            value: BLU
        },
        {
            name: 'green',
            value: GRN
        },
        {
            name: 'yellow',
            value: YEL
        },
        {
            name: 'dark blue',
            value: DKBL
        },
        {
            name: 'black',
            value: BLK
        }
    ],
    DEFAULT_COLOR = 'orange',
    mbcolors = [
        'case',
        ['==', ['get', 'user_color'], 'red'], RED,
        ['==', ['get', 'user_color'], 'blue'], BLU,
        ['==', ['get', 'user_color'], 'green'], GRN,
        ['==', ['get', 'user_color'], 'yellow'], YEL,
        ['==', ['get', 'user_color'], 'dark blue'], DKBL,
        ['==', ['get', 'user_color'], 'black'], BLK,
        ONG
    ], mbicons = [
        'case',
        ['==', ['get', 'user_color'], 'red'], 'userIcon-red',
        ['==', ['get', 'user_color'], 'blue'], 'userIcon-blue',
        ['==', ['get', 'user_color'], 'green'], 'userIcon-green',
        ['==', ['get', 'user_color'], 'yellow'], 'userIcon-yellow',
        ['==', ['get', 'user_color'], 'dark blue'], 'userIcon-dark blue',
        ['==', ['get', 'user_color'], 'black'], 'userIcon-black',
        'userIcon-orange'
    ];

const modalHeader = '<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" onclick="closeModal()" title="Close window">' +
    '<i class="far fa-xmark"></i></div></header>',
    trailBrief = modalHeader + '<div class="content"><div class="rt-control">{favTrailLink}</div><a id="j" target="blank" href="#"><img id="trailImg" class="placeholder" style="width:100%;height:175px"></a><div class="tags">' +
        '<div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 5px 0 0"></div><div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 5px 0 5px"></div>' +
        '<div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 0 0 5px"></div></div><h4>Trail Stats</h4><ul class="stats" style="margin-top:10px"><li><div class="caption">Guide Type</div><div class="value" id="i">' +
        '<div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Distance</div><div class="value" id="c">' +
        '<div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Max. Altitude</div><div class="value" id="d"><div class="placeholder" style="width:50%;height:19px;margin:0">' +
        '</div></div></li><li><div class="caption">Min. Altitude</div><div class="value" id="e"><div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Elev. Gain</div>' +
        '<div class="value" id="f"><div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Elev. Loss</div><div class="value" id="g"><div class="placeholder" style="width:50%;height:19px;margin:0"></div>' +
        '</div></li></ul><a href="#" id="h" target="blank" style="margin:0 auto" class="btn btn-lg btn-green centered">Explore the full guide</a></div>',
    weather = modalHeader + '<div class="content"><div class="tab-wrapper"><ul class="tabs"><li class="li-tab active" rel="cur"><i class="far fa-sun"></i>Current</li><li class="li-tab" rel="fcst"><i class="far fa-chart-mixed"></i>Forecast</li><li style="flex:1"></li></ul>' +
        '<div class="tab-content active" data-tab="cur"><div style="text-align:center"><div class="spinner sm"></div><span style="display:block;margin-top:0.5em">Getting current conditions...</span></div></div><div class="tab-content" data-tab="fcst"><ul class="weather"><li><div class="head"><img class="placeholder" style="height:50px"><div class="title">' +
        '<h3 class="placeholder" style="width:60%;height:24px"></h3><span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
        '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
        '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
        '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
        '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
        '<div class="fcst placeholder" style="height:55px"></div></li></ul></div></div></div>',
    userContent = modalHeader + '<div class="content"><div class="tab-wrapper"><ul class="tabs"><li class="li-tab active" rel="draw">Custom</li><li class="li-tab" rel="uploads">Uploads</li><li style="flex:1"></li></ul>' +
        '<div class="tab-content active" data-tab="draw"><div style="text-align:center"><div class="spinner sm"></div><span style="display:block;margin-top:0.5em">Loading your content...</span></div></div>' +
        '<div class="tab-content" data-tab="uploads"><div style="text-align:center"><div class="spinner sm"></div><span style="display:block;margin-top:0.5em">Loading your content...</span></div></div></div></div>',
    uploadContent = modalHeader + '<div class="content"><p style="margin:0 0 1em 0;font-size:14px;color:#666">Upload a GPX, GeoJSON, or KML file to display on the map (maximum size: 10 MB)</p>' +
        '<form action="' + host + 'api/v1/upload/do" id="fileUpload" method="post" enctype="multipart/form-data" style="margin-top:1em"><input type="file" name="file" placeholder="Upload a file" accept=".gpx,.geojson,.json,.kml">' +
        '<div class="uploading"><i class="fa-duotone fa-spinner-third"></i>Uploading your file...</div><div id="progress"><span></span></div></form></div>',
    slopeRose = '<svg id="sr-{{slopeRoseID}}" width="150px" height="150px" viewBox="0 0 1050 1050" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" class="rose-svg" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round; stroke-miterlimit: 1.5;"><path data-id="north upper" d="M529.716,527l68.371,-166.7l-138.1,0l69.729,166.7Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="north middle" d="M666.581,193.63l-277.081,0l69.27,166.67l138.541,0l69.27,-166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="north lower" d="M734.1,26.997l-414.2,0l69.943,166.67l275.865,0l68.392,-166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="northeast upper" d="M529.716,527l166.22,-69.529l-97.651,-97.652l-68.569,167.181Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="northeast middle" d="M862.222,388.05l-195.925,-195.926l-68.873,166.835l97.963,97.963l166.835,-68.872Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="northeast lower" d="M1027.79,317.966l-292.884,-292.884l-68.396,167.311l195.066,195.066l166.214,-69.493Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="east upper" d="M527.716,528.339l166.7,68.371l0,-138.1l-166.7,69.729Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="east middle" d="M861.086,665.204l0,-277.081l-166.67,69.27l0,138.541l166.67,69.27Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="east lower" d="M1027.72,732.723l0,-414.2l-166.67,69.943l0,275.865l166.67,68.392Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="southeast upper" d="M527.716,528.339l69.529,166.22l97.652,-97.651l-167.181,-68.569Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="southeast middle" d="M666.666,860.845l195.926,-195.925l-166.835,-68.872l-97.963,97.962l68.872,166.835Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="southeast lower" d="M736.75,1026.42l292.884,-292.884l-167.311,-68.396l-195.066,195.066l69.493,166.214Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="south upper" d="M527.918,528.416l-68.371,166.7l138.1,0l-69.729,-166.7Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="south middle" d="M391.053,861.786l277.081,0l-69.27,-166.67l-138.541,0l-69.27,166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="south lower" d="M323.534,1028.42l414.2,0l-69.943,-166.67l-275.865,0l-68.392,166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="southwest upper" d="M527.918,528.416l-166.22,69.529l97.651,97.652l68.569,-167.181Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="southwest middle" d="M195.412,667.366l195.926,195.926l68.872,-166.835l-97.963,-97.963l-166.835,68.872Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="southwest lower" d="M29.841,737.451l292.884,292.883l68.396,-167.31l-195.066,-195.067l-166.214,69.494Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="west upper" d="M528.918,527.077l-166.7,-68.371l0,138.1l166.7,-69.729Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="west middle" d="M195.548,390.212l0,277.081l166.67,-69.27l0,-138.541l-166.67,-69.27Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="west lower" d="M28.915,322.693l0,414.2l166.67,-69.943l0,-275.865l-166.67,-68.392Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="northwest upper" d="M529.918,527.077l-69.529,-166.22l-97.652,97.651l167.181,68.569Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="northwest middle" d="M390.968,194.571l-195.926,195.926l166.835,68.872l97.963,-97.963l-68.872,-166.835Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path><path data-id="northwest lower" d="M318.884,27l-292.884,292.884l167.311,68.396l195.066,-195.066l-69.493,-166.214Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"><title></title></path></svg>',
    missingIcon = '<i class="fas fa-cloud-exclamation" style="color:#f7746a;font-size:50px;margin-bottom:16px"></i><br>',
    dialog = '<div class="wrap"><h1></h1><p></p><div class="buttons"><a href="#" id="neg" class="cta" onclick="return false"></a><a href="#" id="pos" class="cta" onclick="return false"></a></div></div>';

class RulerControl {
    constructor(options = {}) {
        this.LAYER_LINE = 'controls-layer-line';
        this.SOURCE_LINE = 'controls-source-line';
        this.MAIN_COLOR = '#263238';
        this.HALO_COLOR = '#ff0000';
        this.HALO1_COLOR = '#0f0';
        this.isMeasuring = false;
        this.enabled = true;
        this.markers = [];
        this.coordinates = [];
        this.labels = [];
        this.units = options.units || 'km';
        this.font = options.font || ['Noto Sans Regular'];
        this.fontSize = options.fontSize || 12;
        this.fontHalo = options.fontHalo || 1;
        this.mainColor = options.mainColor || this.MAIN_COLOR;
        this.secondaryColor = options.secondaryColor || this.HALO_COLOR;
        this.altColor = options.altColor || this.HALO1_COLOR;
        this.mapClickListener = this.mapClickListener.bind(this);
        this.styleLoadListener = this.styleLoadListener.bind(this);
        this.iconRuler = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="12" style="margin-top:4px" viewBox="0 0 22 12" fill="#505050">' +
            '<path fill-rule="evenodd" fill="none" d="M-1-6h24v24H-1z"/>' +
            '<path d="M20 0H2C.9 0 0 .9 0 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zm0 10H2V2h2v4h2V2h2v4h2V2h2v4h2V2h2v4h2V2h2v8z"/>' +
            '</svg>';
    }

    geoLineString(coordinates = []) {
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates
            }
        }
    }

    labelFormat(delta, sum, units) {
        return `<span style="line-height:1.5"><b>Segment:</b> ${delta.toFixed(2)} ${units}<br><b>Total:</b> ${sum.toFixed(2)} ${units}</span>`
    }

    insertControls() {
        this.container = document.createElement('div');
        this.container.classList.add('mapboxgl-ctrl');
        this.container.classList.add('mapboxgl-ctrl-group');
        this.container.classList.add('mapboxgl-ctrl-ruler');
        this.button = document.createElement('button');
        this.button.setAttribute('type', 'button');
        /*const img = document.createElement('div');
        img.innerHTML = this.iconRuler;*/
        this.button.innerHTML = this.iconRuler;
        this.container.appendChild(this.button);
    }

    setUnits(units) {
        this.units = units;
    }

    draw() {
        this.map.addSource(this.SOURCE_LINE, {
            type: 'geojson',
            data: this.geoLineString(this.coordinates)
        });

        this.map.addLayer({
            id: this.LAYER_LINE,
            type: 'line',
            source: this.SOURCE_LINE,
            paint: {
                'line-color': this.mainColor,
                'line-width': 2
            }
        });
    }

    measuringOn() {
        this.isMeasuring = true;
        this.markers = [];
        this.coordinates = [];
        this.labels = [];
        this.map.getCanvas().style.cursor = 'crosshair';
        this.button.classList.add('active');
        this.draw();
        this.map.on('click', this.mapClickListener);
        this.map.on('style.load', this.styleLoadListener);
        this.map.fire('ruler.on');
    }

    measuringOff() {
        this.isMeasuring = false;
        this.map.getCanvas().style.cursor = '';
        this.button.classList.remove('active');
        if (this.map.getLayer(this.LAYER_LINE)) this.map.removeLayer(this.LAYER_LINE);
        if (this.map.getSource(this.SOURCE_LINE)) this.map.removeSource(this.SOURCE_LINE);
        this.markers.forEach((m) => m.remove());
        this.map.off('click', this.mapClickListener);
        this.map.off('style.load', this.styleLoadListener);
        this.map.fire('ruler.off');
    }

    enable() {
        this.enabled = true;
        this.button.classList.remove('disabled');
    }

    disable() {
        this.enabled = false;
        this.measuringOff();
        this.button.classList.add('disabled');
    }

    mapClickListener(event) {
        const markerNode = document.createElement('div');
        markerNode.style.width = '12px';
        markerNode.style.height = '12px';
        markerNode.style.borderRadius = '50%';
        markerNode.style.background = this.markers.length === 0 ? this.altColor : this.secondaryColor;
        markerNode.style.boxSizing = 'border-box';
        markerNode.style.border = `2px solid ${this.mainColor}`;

        const marker = new mapboxgl.Marker({
            element: markerNode,
            draggable: true
        }).setLngLat(event.lngLat)
            .addTo(this.map);

        this.coordinates.push([event.lngLat.lng, event.lngLat.lat]);
        this.map.getSource(this.SOURCE_LINE).setData(this.geoLineString(this.coordinates));
        this.markers.push(marker);

        if (this.markers.length > 1) {
            this.labels = this.coordinatesToLabels();
            marker.setPopup(new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: 'measure'
            }));
            marker.togglePopup();
            marker.getPopup().setHTML(this.labels[this.markers.length - 1]);
        }

        marker.on('drag', () => {
            const index = this.markers.indexOf(marker);
            const lngLat = marker.getLngLat();
            this.coordinates[index] = [lngLat.lng, lngLat.lat];
            this.labels = this.coordinatesToLabels();
            this.labels.forEach((l, i) => {
                const popup = this.markers[i].getPopup();
                if (popup) popup.setHTML(l);
            });

            this.map.getSource(SOURCE_LINE).setData(this.geoLineString(this.coordinates));
        })
    }

    coordinatesToLabels() {
        let { coordinates, units, labelFormat } = this;
        let sum = 0;

        return coordinates.map((coordinate, index) => {
            if (index === 0) return labelFormat(0, 0, units);
            let delta = new Calculate().distance(coordinates[index - 1][1], coordinates[index - 1][0], coordinates[index][1], coordinates[index][0]);

            sum += delta;
            return labelFormat(delta, sum, units);
        })
    }

    styleLoadListener() {
        this.draw();
    }

    onButtonClick() {
        if (!this.enabled) return;
        if (this.isMeasuring) this.measuringOff();
        else this.measuringOn();
        this.map.fire('ruler.buttonclick', {
            measuring: this.isMeasuring
        });
    }

    onAdd(map) {
        this.map = map;
        this.insertControls();
        this.button.addEventListener('click', this.onButtonClick.bind(this));
        return this.container;
    }

    onRemove() {
        if (this.isMeasuring) {
            this.measuringOff();
        }

        this.button.removeEventListener('click', this.onButtonClick.bind(this));
        this.map.off('click', this.mapClickListener);
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
    }
}

class Calculate {
    relativeLocation() {
        const ctr = map.getCenter(),
            locs = [],
            allPlaces = [],
            pl = map.querySourceFeatures('composite', {
                sourceLayer: 'place_label'
            });

        if (pl != null && pl.length > 0) {
            pl.forEach((place) => {
                if (place.properties.symbolrank < 16) {
                    const c = place.geometry.coordinates,
                        dist = this.distance(ctr.lat, ctr.lng, c[1], c[0]),
                        bear = this.getCompassDirection(this.bearing(c[1], c[0], ctr.lat, ctr.lng)),
                        city = place.properties.name + (place.properties.iso_3166_2 ? ', ' + place.properties.iso_3166_2.substring(3, 5) : '');

                    if (!allPlaces.includes(city)) {
                        locs.push({ dist: dist, city: city, bearing: bear });
                    }
                }
            });

            locs.sort((a, b) => a.dist - b.dist);

            if (locs.length > 0) {
                const far = Math.round(locs[0].dist);
                curLoc = (far == 0 ? '' : far + ' miles ' + locs[0].bearing + ' of ') + locs[0].city;
            }
        }
    }

    distance(lat1, lon1, lat2, lon2) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c;

        return (d / 1.609);
    }

    ftToM(n) {
        return n * 0.3048;
    }

    miToKm(n) {
        return n * 1.60934;
    }

    deg2rad(v) {
        return v * (Math.PI / 180);
    }

    rad2deg(v) {
        return (v * 180) / Math.PI;
    }

    deg2pct(v) {
        return Math.tan(this.deg2rad(v)) * 100;
    }

    sqmiToAcres(v) {
        return numberFormat(v * 3.861E-7 * 640, 1);
    }

    getElevation(a, b, d = 3, meters = false) {
        let m = parseFloat(map.queryTerrainElevation([b, a], {
            exaggerated: false
        }));

        if (!meters) {
            m *= 3.28084;
        }

        return m.toFixed(d);
    }

    average(arr) {
        let total = 0;

        for (let i = 0; i < arr.length; i++) {
            total += parseFloat(arr[i]);
        }

        return total / arr.length;
    }

    bearing(startLat, startLng, destLat, destLng) {
        startLat = this.deg2rad(startLat);
        startLng = this.deg2rad(startLng);
        destLat = this.deg2rad(destLat);
        destLng = this.deg2rad(destLng);

        const y = Math.sin(destLng - startLng) * Math.cos(destLat),
            x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng),
            brng = this.rad2deg(Math.atan2(y, x));

        return (brng + 360) % 360;
    }

    getCompassDirection(b) {
        var d,
            b = Math.round(b / 22.5) % 16;

        switch (b) {
            case 1:
                d = "NNE";
                break;
            case 2:
                d = "NE";
                break;
            case 3:
                d = "ENE";
                break;
            case 4:
                d = "E";
                break;
            case 5:
                d = "ESE";
                break;
            case 6:
                d = "SE";
                break;
            case 7:
                d = "SSE";
                break;
            case 8:
                d = "S";
                break;
            case 9:
                d = "SSW";
                break;
            case 10:
                d = "SW";
                break;
            case 11:
                d = "WSW";
                break;
            case 12:
                d = "W";
                break;
            case 13:
                d = "WNW";
                break;
            case 14:
                d = "NW";
                break;
            case 15:
                d = "NNW";
                break;
            default:
                d = "N";
        }

        return d;
    }

    aspectDirection(b) {
        var d,
            b = Math.round(b / 45) % 8;

        switch (b) {
            case 0:
                d = "N";
                break;
            case 1:
                d = "NE";
                break;
            case 2:
                d = "E";
                break;
            case 3:
                d = "SE";
                break;
            case 4:
                d = "S";
                break;
            case 5:
                d = "SW";
                break;
            case 6:
                d = "W";
                break;
            case 7:
                d = "NW";
                break;
        }

        return d;
    }
}

class Favorites {
    async get() {
        const list = await api(host + 'api/v1/favorite/list');

        if (list.trails != null) {
            list.trails.forEach((t) => {
                favTrails.push(t.tid);
            });
        }
    }

    async fav(t) {
        const trailID = t.getAttribute('data-id'),
            mode = t.getAttribute('data-favorite');

        if (favTrails.includes(trailID) && mode == 'add') {
            notify('error', 'This trail is already in your list of favorites.');
        } else {
            const resp = await api(host + 'api/v1/favorite/' + (mode == 0 ? 'add' : 'remove'), [['tid', trailID]]);

            if (resp.success == 'added') {
                favTrails.push(trailID);
                t.setAttribute('data-favorite', 1);
                t.setAttribute('title', 'Remove this trail from your favorites');
                t.innerHTML = '<i class="fa-sharp fas fa-star"></i> Favorited Trail';
            } else if (resp.success == 'removed') {
                var pos = favTrails.indexOf(trailID);
                favTrails.splice(pos, 1);
                t.setAttribute('data-favorite', 0);
                t.setAttribute('title', 'Add this trail from your favorites');
                t.classList.add('btn-yellow');
                t.classList.remove('btn-red');
                t.innerHTML = '<i class="fa-sharp far fa-star"></i> Favorite Trail';
            }
        }
    }
}

class Weather {
    decodeWX(c) {
        var p = (c < 80 ? c : Math.floor(c / 6400)),
            i,
            shwr = [2, 13, 17, 51],
            rain = [1, 14, 16, 18, 52],
            snow = [3, 20, 21, 22, 24, 25, 55, 56, 59, 60, 61, 62],
            hail = [4, 26, 27, 38, 57, 58, 63, 64, 65, 67, 75, 76],
            fzrn = [15, 19, 23, 36, 49, 50, 53, 54],
            tstm = [5, 28, 29, 66, 77, 78];

        if (shwr.includes(p)) {
            i = 'fal fa-cloud-showers';
        } else if (rain.includes(p)) {
            i = 'fal fa-cloud-rain';
        } else if (snow.includes(p)) {
            i = 'fal fa-cloud-snow';
        } else if (hail.includes(p)) {
            i = 'fal fa-cloud-hail';
        } else if (fzrn.includes(p)) {
            i = 'fal fa-cloud-hail-mixed';
        } else if (tstm.includes(p)) {
            i = 'fal fa-cloud-bolt';
        } else if (p == 9 || p == 30 || p == 31) {
            i = 'fal fa-cloud-fog';
        } else if (p == 6 || p == 7) {
            i = 'fal fa-smoke';
        } else if (p == 39) {
            i = 'fal fa-haze';
        } else if (p == 32 || p == 70) {
            i = 'fal fa-snow-blowing';
        } else if (p == 8 || p == 33 || p == 35 || p == 68 || p == 69) {
            i = 'fal fa-sun-dust';
        } else if (p == 11) {
            i = 'fal fa-volcano';
        } else if (p < 0) {
            i = 'fal fa-tornado';
        } else {
            i = '';
        }

        return i;
    }

    heatIndex(t, rh) {
        var hi;

        if (t > 80) {
            hi = -42.379 + (2.04901523 * t) + (10.14333127 * rh) - (0.22475541 * t * rh) - (0.00683783 * Math.pow(t, 2)) -
                (0.05481717 * Math.pow(rh, 2)) + (0.00122874 * Math.pow(t, 2) * rh) + (0.00085282 * t * Math.pow(rh, 2)) -
                (0.00000199 * Math.pow(t, 2) * Math.pow(rh, 2));

            if (rh < 13 && (t > 80 && t < 112)) {
                hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
            } else if (rh > 85 && (t > 80 && t < 87)) {
                hi += ((rh - 85) / 10) * ((87 - t) / 5);
            }
        } else {
            hi = 0.5 * (t + 61 + ((t - 68) * 1.2) + (rh * 0.094));
        }

        return Math.round(hi);
    }

    windChill(t, w) {
        return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(w, 0.16)) + (0.4275 * t * Math.pow(w, 0.16)));
    }

    displayCurCond(data = null) {
        let weather = (data == null ? curWX : data),
            div = '',
            name = weather.name,
            type = (weather.MNET == 1 ? 'ASOS/AWOS' : (weather.MNET == 2 ? 'RAWS' : (weather.MNET == 25 ? 'NRCS/SNOTEL' : (weather.MNET == 65 ? 'APRSWXNET/CWOP' : 'Other')))),
            elev = Math.round(weather.elevation),
            temp = Math.round(weather.obs.temp.current),
            wdir = (weather.obs.wind_dir ? weather.obs.wind_dir : false),
            wspd = (weather.obs.wind_speed ? Math.round(weather.obs.wind_speed) : false),
            wgst = (weather.obs.wind_gust ? Math.round(weather.obs.wind_gust) : false),
            rh = (weather.obs.rh ? Math.round(weather.obs.rh) : false),
            pres = (weather.obs.pressure ? weather.obs.pressure : false),
            prec = (weather.obs.precip || weather.obs.precip == 0 ? weather.obs.precip : false),
            snow = (weather.obs.snow ? true : false),
            codeTime = (weather.obs.wxCode && new Date().getTime() - new Date(weather.obs.wxCode.time).getTime() < 10800000 ? true : false),
            code = this.decodeWX((weather.obs.wxCode && codeTime ? weather.obs.wxCode.code : 0)),
            upd = timeAgo(weather.updated);

        div += '<div class="current">' + (code ? '<div class="code"><i class="' + code + '"></i></div>' : '');

        if (temp) {
            div += '<div class="temps"><h1 style="font-size:50px;color:var(--red);margin-bottom:10px">' + temp + '&deg;</h1><span style="text-transform:uppercase;font-size:13px;letter-spacing:0.5px;color:var(--blue-gray)">Feels like ' +
                (temp < 60 && wspd ? this.windChill(temp, wspd) + '&deg;' : (temp && rh ? this.heatIndex(temp, rh) + '&deg;' : '--')) + '</span></div></div><ul class="wxstats" style="margin-top:15px">';
        }

        if (pres) {
            div += '<li><div class="caption">Pressure</div><div class="value">' + (pres ? pres + ' inHg' : '--') + '</div></li>';
        }

        div += (weather.obs.wind_speed > 0 && weather.obs.wind_dir != 'V' ? '<li><div class="caption">Wind Direction</div><div class="value">' + (wdir ? wdir + '<svg xmlns="http://www.w3.org/2000/svg" title="' + wdir + '" style="position:absolute;margin:-3px 0 0 0.5em;transform:rotate(' + weather.obs.raw_wind_dir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>' : '--') + '</div></li>' +
            '<li><div class="caption">Wind Speed</div><div class="value">' + (wspd ? wspd + ' mph' : '--') + '</div></li>' +
            '<li><div class="caption">Wind Gust</div><div class="value">' + (wgst ? wgst + ' mph' : '--') + '</div></li>' : '');

        if (rh) {
            div += '<li><div class="caption">Relative Humidity</div><div class="value">' + (rh ? rh + '%' : '--') + '</div></li>';
        }

        if (prec) {
            div += '<li><div class="caption">1-hr Rainfall</div><div class="value">' + (prec ? prec + ' in' : '--') + '</div></li>';
        }

        if (snow) {
            div += '<li><div class="caption">Snow Depth</div><div class="value">' + (weather.obs.snow.hs ? weather.obs.snow.hs + ' in <small>(' + (weather.obs.snow.hs * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
            div += '<li><div class="caption">6-hr New Snow</div><div class="value">' + (weather.obs.snow['6hr'] ? weather.obs.snow['6hr'] + ' in <small>(' + (weather.obs.snow['6hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
            div += '<li><div class="caption">12-hr New Snow</div><div class="value">' + (weather.obs.snow['12hr'] ? weather.obs.snow['12hr'] + ' in <small>(' + (weather.obs.snow['12hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
            div += '<li><div class="caption">24-hr New Snow</div><div class="value">' + (weather.obs.snow['24hr'] ? weather.obs.snow['24hr'] + ' in <small>(' + (weather.obs.snow['24hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
            div += '<li><div class="caption">48-hr New Snow</div><div class="value">' + (weather.obs.snow['48hr'] ? weather.obs.snow['48hr'] + ' in <small>(' + (weather.obs.snow['48hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
        }

        div += '</ul><span class="updated">Last report ' + upd + ' &middot; ' + name + ' (elevation ' + elev + ' ft.)</span>';

        document.querySelector('#modal .content .tab-content[data-tab=cur]').innerHTML = div;
    }

    async readSnotel(sid, geo) {
        modal.innerHTML = weather;

        if (modal.style.display != 'flex') {
            modal.style.display = 'flex';
        }

        this.getNWSFcst(geo[1].toFixed(4), geo[0].toFixed(4));

        const wx = await api(apiURL + 'weather/' + sid);

        modal.querySelector('#a').innerHTML = wx.weather.name;
        this.displayCurCond(wx.weather);
    }

    async getWeather(b, ctr = true) {
        if (ctr) {
            var sw = b.getSouthWest(),
                ne = b.getNorthEast(),
                cent = map.getCenter(),
                e = cent.lat,
                f = cent.lng,
                lat1 = sw.lat,
                lat2 = ne.lat,
                lon1 = sw.lng,
                lon2 = ne.lng;
        } else {
            var e = b[0],
                f = b[1];
        }

        var d = (ctr ? Math.round(new Calculate().distance(lat1, lon1, lat2, lon2)) : 25),
            traveled = new Calculate().distance(startLat, startLon, lat1, lon1);

        if (isNaN(traveled) || traveled > 7 && !gettingWX) {
            gettingWX = true;

            if (modal.style.display == 'flex' && modal.getAttribute('data-trail-brief') != 1) {
                /*closeModal();*/
            }

            /* get the location of where the weather is at */
            const gsi = setInterval(() => {
                if (map.getSource('composite')) {
                    const vli = map.getSource('composite').vectorLayerIds;

                    if (vli && vli.includes('place_label')) {
                        new Calculate().relativeLocation();
                        clearInterval(gsi);
                    }
                }
            }, 500);

            /*fetch('https://api.weather.gov/points/' + parseFloat((ctr ? e : f)).toFixed(4).replace(/0+$/g, '') + ',' + parseFloat((ctr ? f : e)).toFixed(4).replace(/0+$/g, ''), {
                headers: {
                    'User-Agent': navigator.userAgent
                }
            }).then(async (resp) => {
                const geo = await resp.json(),
                    prop = geo.properties.relativeLocation.properties;

                curLoc = Math.round(prop.distance.value / 1609) + ' miles ' + new Calculate().getCompassDirection(prop.bearing.value) + ' of ' + prop.city + ', ' + prop.state;
            });*/

            const w = await api(apiURL + 'weather/nearby', [['radius', (ctr ? e : f) + ',' + (ctr ? f : e) + ',' + d], ['latest', '1']]),
                elem = document.querySelector('#weather');

            if (w.weather) {
                curWX = w.weather;
                let wi = '',
                    name = curWX.name,
                    temp = Math.round(curWX.obs.temp.current),
                    wdir = curWX.obs.raw_wind_dir,
                    wspd = Math.round(curWX.obs.wind_speed);

                if (!temp) {
                    elem.style.display = 'none';
                } else {
                    elem.style.display = 'flex';
                }

                if (wspd && wdir) {
                    wi = '<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(' + wdir + 'deg)" width="20" height="20" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>';
                }

                elem.setAttribute('title', name);
                elem.querySelector('#temp').innerHTML = (temp ? temp + '<sup>&deg;F</sup>' : '--');
                elem.querySelector('#wind').innerHTML = wi + '<span><b>' + (wspd ? wspd : '0') + '</b>mph</span>';
                gettingWX = false;
            }
        }
    }

    wxIcon(daytime, f) {
        let fcst = f.toLowerCase(),
            i = '';

        if (daytime) {
            if (fcst.search('thunderstorm') >= 0) {
                i = 'wi-day-thunderstorm';
            } else if (fcst.search('rain shower') >= 0) {
                i = 'wi-day-showers';
            } else if (fcst.search('snow') >= 0) {
                i = 'wi-day-snow';
            } else if (fcst.search('rain') >= 0 && fcst.search('snow') >= 0) {
                i = 'wi-day-rain-mix';
            } else if (fcst == 'sunny') {
                i = 'wi-day-sunny';
            } else if (fcst == 'mostly sunny' || fcst == 'partly sunny' || fcst == 'partly cloudy') {
                i = 'wi-day-sunny-overcast';
            } else if (fcst.search('overcast') >= 0 || fcst.search('mostly cloudy') >= 0) {
                i = 'wi-cloudy';
            }
        } else {
            if (fcst.search('thunderstorm') >= 0) {
                i = 'wi-night-alt-thunderstorm';
            } else if (fcst.search('rain shower') >= 0) {
                i = 'wi-night-alt-showers';
            } else if (fcst.search('snow') >= 0) {
                i = 'wi-night-snow';
            } else if (fcst == 'clear') {
                i = 'wi-night-clear';
            } else if (fcst == 'mostly clear' || fcst == 'partly clear' || fcst == 'partly cloudy') {
                i = 'wi-night-partly-cloudy';
            } else if (fcst.search('overcast') >= 0 || fcst.search('mostly cloudy') >= 0) {
                i = 'wi-night-cloudy';
            }
        }

        if (fcst.search('windy') >= 0) {
            i = 'wi-windy';
        } else if (fcst.search('smoke') >= 0) {
            i = 'wi-smoke';
        } else if (fcst.search('fog') >= 0) {
            i = 'wi-fog';
        } else if (fcst.search('haze') >= 0) {
            i = 'wi-smog';
        }

        i = (i == '' ? 'wi-na' : i);

        return i;
    }

    async getNWSFcst(a, b) {
        let forecast = '',
            wx = await api(apiURL + 'forecast', [['lat', a], ['lon', b]]);

        /* create hourly forecast */
        if (wx.forecast.hourly.periods[0].temperature) {
            let c = '';

            wx.forecast.hourly.periods.forEach((h, n) => {
                if (n > 0) {
                    const d = new Date(h.startTime * 1000),
                        hr = d.getHours(),
                        time = (hr == 0 ? 12 : (hr > 12 ? hr - 12 : hr)) + (hr >= 12 ? 'p' : 'a') + 'm',
                        temp = h.temperature,
                        desc = h.shortForecast.replace(' And', ' and '),
                        icon = '<i class="wi ' + this.wxIcon(h.isDaytime, desc) + '" title="' + desc + '"></i>';

                    c += '<li><p>' + (h.number == 1 ? 'Now' : time) + '</p>' + icon + '<span class="t">' + temp + '&deg;</span></li>';
                }
            });

            forecast = '<h3 class="fcst-title">Hourly Weather</h3><ul class="forecast hourly">' + c + '</ul>';
        }

        /* create daily forecast */
        if (wx.forecast.daily.periods[0].temperature) {
            let c = '';

            for (let i = 0; i < wx.forecast.daily.periods.length; i++) {
                let h = wx.forecast.daily.periods[i],
                    d = h.name,
                    temp = h.temperature,
                    desc = h.shortForecast.replace(' And', ' and '),
                    icon = '<i class="wi ' + this.wxIcon(h.isDaytime, desc) + '" title="' + desc + '"></i>',
                    fcst = h.detailedForecast.split('.');

                c += '<h6>' + d + '</h6><li>' + icon + '<div style="flex:1"><p>' + fcst[0] + '. ' + fcst[1] + '.</p>' +
                    '</div><span class="t">' + temp + '&deg;</span></li>';
            }

            forecast += '<h3 class="fcst-title" style="margin:1em 0">Daily Forecast</h3><ul class="forecast">' + c + '</ul>';
        }

        document.querySelector('#modal .tab-content[data-tab=fcst]').innerHTML = forecast;

        /*await fetch('https://api.weather.gov/points/' + a + ',' + b, {
            method: 'GET'
        }).then(async (nws) => {
            let content = '',
                p = await nws.json();

            await fetch(p.properties.forecast, {
                method: 'GET'
            }).then(async (resp) => {
                const wx = await resp.json();

                for (var i = 0; i < 10; i++) {
                    var f = wx.properties.periods[i],
                        label = f.name,
                        temp = f.temperature,
                        ic = f.icon,
                        short = f.shortForecast.replaceAll(' And ', ' and ').replaceAll(' Of ', ' of '),
                        txt = f.detailedForecast;

                    content += '<li><div class="head"><img src="' + ic + '"><div class="title"><h3>' + label + '</h3><span style="line-height:1.2;font-weight:400;font-size:13px;color:var(--gray)">' + short + '</span></div>' +
                        '<div class="temp"' + (f.isDaytime === false ? ' style="color:var(--blue)"' : '') + '>' + temp + '&deg;F</div></div><div class="fcst">' + txt + '</div></li>';
                }

                document.querySelector('#modal .tab-content[data-tab=fcst]').innerHTML = '<!--<span style="font-size:12px;color:var(--blue-gray)">' + a + ', ' + b + '</span>--><ul class="weather">' +
                    content + '</ul><span class="updated">Last updated ' + timeAgo(new Date(wx.properties.updated).getTime() / 1000) +
                    ' &middot; Data from National Weather Service</span>';
            }).catch((error) => {
                console.error(error);
                document.querySelector('#modal .tab-content[data-tab=fcst]').innerHTML = '<p class="message error">The weather forecast for this area is not available at the moment. Try again later.</p>';
            });
        });*/
    }

    async radarInit() {
        await fetch('https://api.rainviewer.com/public/weather-maps.json', {
            method: 'GET'
        }).then(async (resp) => {
            let imgs = await resp.json();

            imgs.radar.past.forEach((e) => {
                radarImgs.push(e.time);
            });

            let time = (n) => {
                const d = new Date(radarImgs[n] * 1000),
                    h = d.getHours(),
                    m = d.getMinutes();

                return (h > 12 ? h - 12 : (h == 12 ? 12 : h)) + ':' + (m < 10 ? '0' : '') + m + (h > 12 ? 'p' : 'a') + 'm';
            };

            const rl = '<div class="radar"><div><span class="radarControl fas fa-pause"></span><div class="time">' +
                '<input type="range" steps="12" min="0" max="12" value="0">' +
                '<div class="tr"><span>' + time(0) + '</span><span>' + time(6) + '</span><span>' + time(12) + '</span></div></div></div></div>';

            document.body.insertAdjacentHTML('beforeend', rl);

            this.radar();
        });
    }

    radar() {
        let counter = 0;

        radarImgs.forEach((e, n) => {
            map.addSource('radar-' + n, {
                type: 'raster',
                tiles: ['https://tilecache.rainviewer.com/v2/radar/' + e + '/256/{z}/{x}/{y}/4/0_1.png'],
                tileSize: 256,
                attribution: defaultAttr + '&copy; <a href="https://www.rainviewer.com">RainViewer</a>'
            });

            map.addLayer({
                id: 'radar-layer-' + n,
                type: 'raster',
                source: 'radar-' + n,
                layout: {
                    visibility: 'none'
                },
                paint: {
                    'raster-fade-duration': 0,
                    'raster-opacity': 0.7
                }
            });
        });

        let ra = () => {
            radarImgs.forEach((e, n) => {
                map.setLayoutProperty('radar-layer-' + n, 'visibility', (n == counter ? 'visible' : 'none'));
                document.querySelector('.radar input[type=range]').value = counter;
            });

            if (counter == radarImgs.length - 1) {
                counter = 0;
                clearInterval(radarAnim);

                setTimeout(() => {
                    radarAnim = setInterval(ra, RADAR_INT);
                }, RADAR_INT);
            } else {
                counter++;
            }
        };

        radarAnim = setInterval(ra, RADAR_INT);
    }
}

class Subscription {
    constructor(u) {
        this.sub = null;
        this.user = u;

        if (this.user && this.user.subscriptions != null) {
            this.user.subscriptions.forEach((s) => {
                if (s.plan == sub_id) {
                    this.sub = s;
                }
            });
        }
    }

    valid() {
        return this.sub == null ? false : true;
    }

    cid() {
        return this.sub ? this.sub.cid : null;
    }

    sid() {
        return this.sub ? this.sub.subscription : null;
    }

    expires() {
        return this.sub ? dateTime(this.sub.ends) : null;
    }
}

class Settings {
    constructor(u) {
        this.user = u;
        this.tid = null;
        this.category = 'trail';
        this.activity = null;
        this.area = null;
        this.defaultSettings = {
            center: [44.75603319, -117.43075129],
            zoom: 6.4,
            tile: 'outdoors',
            layers: {
                avy: (this.category == 'snow' ? true : false),
                trailheads: true,
                trails: true,
                snotel: false,
                waypoints: true,
                fsadmin: false,
                contours: false,
                radar: false
            }
        };
        this.settings = u != null && u.settings.mapotrails ? u.settings.mapotrails : this.defaultSettings;
        this.path = window.location.pathname.substring(1, window.location.pathname.length).split('/');

        if (this.path.length >= 2) {
            if (this.path[0] == 'trails') {
                this.tid = this.path[1];
            } else {
                this.category = this.path[0];
                this.activity = this.path[1];

                if (this.path.length == 3) {
                    this.area = this.path[2];
                }
            }
        }
    }

    subscriptions() {
        let sub = new Subscription(this.user);

        return {
            valid: () => {
                return sub.valid();
            },
            customerID: () => {
                return sub.cid();
            },
            subID: () => {
                return sub.sid();
            },
            expires: () => {
                return sub.expires();
            }
        }
    }

    map() {
        return {
            lat: parseFloat(this.settings.center[0]),
            lon: parseFloat(this.settings.center[1]),
            zoom: parseInt(this.settings.zoom),
            tile: this.settings.tile,
            pitch: this.settings.pitch ? this.settings.pitch : 0,
            bearing: this.settings.bearing ? this.settings.bearing : 0,
            toggle3d: this.settings.toggle3d ? this.settings.toggle3d : '2d'
        }
    }

    get(t) {
        return this.settings[t] ? this.settings[t] : null;
    }

    update(i, v) {
        this.settings[i] = v;
    }

    updateLayer(l, c) {
        this.settings.layers[l] = c;
        return c;
    }

    layers() {
        const layers = { ...this.settings.layers };

        return {
            all: () => {
                return {
                    avy: this.settings.layers.avy,
                    trailheads: this.settings.layers.trailheads,
                    trails: this.settings.layers.trails,
                    snotel: this.settings.layers.snotel,
                    waypoints: this.settings.layers.waypoints,
                    fsadmin: this.settings.layers.fsadmin,
                    contours: this.settings.layers.contours,
                    radar: this.settings.layers.radar,
                }
            },
            avy: () => {
                return this.settings.layers ? this.settings.layers.avy : (this.category == 'snow' ? true : false);
            },
            trailheads: () => {
                return this.settings.layers ? this.settings.layers.trailheads : true;
            },
            trails: () => {
                return this.settings.layers ? this.settings.layers.trails : true;
            },
            snotel: () => {
                return this.settings.layers ? this.settings.layers.snotel : false;
            },
            waypoints: () => {
                return this.settings.layers ? this.settings.layers.waypoints : true;
            },
            fsadmin: () => {
                return this.settings.layers ? this.settings.layers.fsadmin : false;
            },
            contours: () => {
                return this.settings.layers ? this.settings.layers.contours : false;
            },
            radar: () => {
                return this.settings.layers ? this.settings.layers.radar : false;
            }
        }
    }

    getBasemap() {
        return this.settings.tile;
    }

    getRole() {
        return this.user == null ? 'PUBLIC' : this.user.role;
    }

    hasPermissions(action = '') {
        if (action == 'ADMIN') {
            return this.getRole() == 'ADMIN' ? true : false;
        } else {
            return this.getRole() == 'ADMIN' ? true : this.subscriptions().valid();
        }
    }

    getUID() {
        return this.user ? this.user.uid : null;
    }

    getName() {
        return this.getFirstName() + ' ' + this.user.last_name;
    }

    getFirstName() {
        return this.user.first_name;
    }

    async saveSession(method = true, msg) {
        if (!navigator.onLine) {
            notify('error', 'Unable to sync your settings due to no internet.');
        } else {
            const c = map.getCenter(),
                /*arr = [],
                draw = localStorage.getItem('features'),
                uploads = localStorage.getItem('uploads'),
                folders = localStorage.getItem('folders'),*/
                sy = document.querySelector('li#save span'),
                ds = document.querySelector('.tab-content[data-tab=draw] #synced'),
                us = document.querySelector('.tab-content[data-tab=uploads] #synced'),
                data = {
                    settings: {
                        center: [c.lat, c.lng],
                        pitch: map.getPitch(),
                        bearing: map.getBearing(),
                        toggle3d: document.querySelector('#toggle3d').getAttribute('data-type'),
                        zoom: map.getZoom(),
                        tile: settings.getBasemap(),
                        layers: settings.layers().all(),
                        avyOpac: (settings.get('avyOpac') ? settings.get('avyOpac') : 0.4)
                    }/*,
                    content: {
                        draw: btoa(draw),
                        uploads: btoa(uploads),
                        folders: btoa(folders)
                    }*/,
                    version: version
                },
                fd = new FormData();

            sy.innerHTML = 'Syncing...';
            fd.append('method', method);
            fd.append('data', JSON.stringify(data));

            if (ds) {
                ds.querySelector('span').style.color = 'var(--light-blue)';
                ds.querySelector('span').classList.add('fas', 'fa-spinner-third', 'spin');
                ds.querySelector('span').innerHTML = '';
            }

            if (us) {
                us.querySelector('span').style.color = 'var(--light-blue)';
                us.querySelector('span').classList.add('fas', 'fa-spinner-third', 'spin');
                us.querySelector('span').innerHTML = '';
            }

            await fetch(host + 'api/v1/session?key=' + apiKey, {
                method: 'POST',
                body: fd
            }).then(async (resp) => {
                const json = await resp.json();

                if (json.success == 1) {
                    /* settings saved */
                    localStorage.setItem('mt-lastSync', new Date().getTime() / 1000);
                    sy.innerHTML = 'Sync';

                    if (msg) {
                        notify('success', 'Your settings & data were successfully synced ' + (method ? 'automatic' : 'manu') + 'ally.');
                    }

                    if (ds) {
                        ds.querySelector('span').style.color = '';
                        ds.querySelector('span').className = '';
                        ds.querySelector('span').innerHTML = 'Last synced just now';
                    }

                    if (us) {
                        us.querySelector('span').style.color = '';
                        us.querySelector('span').className = '';
                        us.querySelector('span').innerHTML = 'Last synced just now';
                    }
                }
            });
        }
    }
}

/*class Subscribe {
    async check() {
        //const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMzUiLCJ0aW1lIjoxNzEyMDkwODE1LCJob3N0IjoiTW96aWxsYVwvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0XC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWVcLzEyMy4wLjAuMCBTYWZhcmlcLzUzNy4zNiIsImlwIjoiNDcuMjguMzIuMTkwIn0.M_8iGCOJA17rLR4y-9apRN9DpAHhel_BtCflY5RRFKk';
        const token = '';
        const json = await api(apiURL + 'subscriptions', [['token', token]]);
        subscribe = json.subscriptions;
    }

    validSubscription() {
        let liveSub = 'price_1NmlJmIpCdpJm6cTexK8QJNT',
            testSub = 'price_1NmiH6IpCdpJm6cTP1rELzPw',
            now = new Date().getTime() / 1000,
            valid = false;

        if (subscribe !== undefined && subscribe != null) {
            subscribe.forEach((e) => {
                if (e.plan == testSub) {
                    if (e.active_subscription && (now >= e.period_start && now <= e.period_end)) {
                        valid = true;
                    }
                }
            });
        }

        return valid;
    }

    hasPermissions() {
        return this.validSubscription() || user.uid != null && settings.getRole() != 'GUEST'
    }
}*/

function debounce(callback, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callback.apply(this, args);
        }, wait);
    };
}

async function api(url, fields = null) {
    let result,
        ops = {
            method: 'POST',
        },
        fd = new FormData();

    if (url.search(apiURL) >= 0 || url.search(host) >= 0) {
        fd.append('key', apiKey);
    }

    if (fields != null) {
        fields.forEach((v) => {
            fd.append(v[0], v[1]);
        });
    }

    ops['body'] = fd;

    await fetch(url, ops).then(async (resp) => {
        result = await resp.json();
    });

    return result;
}

function timeString() {
    const date = new Date();

    return date.getFullYear() + (date.getMonth() < 10 ? '0' : '') + date.getMonth() + (date.getDate() < 10 ? '0' : '') + date.getDate() +
        (date.getHours() < 10 ? '0' : '') + date.getHours() + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() +
        (date.getSeconds() < 10 ? '0' : '') + date.getSeconds()
}

function plural(v) {
    return (v > 1 ? 's' : '');
}

function matheq(d, s, r) {
    return Math.floor(((d / s) - Math.floor(d / s)) * r);
}

function timeAgo(t, w = null, c = null) {
    var val,
        d = (c ? c : Math.round(new Date().getTime() / 1000)) - t;

    if (d < 5) {
        val = 'Just now';
    } else if (d >= 5 && d < 60) {
        val = d.toFixed(0) + ' sec' + plural(d);
    } else if (d >= 60 && d < 3600) {
        val = Math.floor(d / 60) + ' min' + plural(Math.floor(d / 60)) + ((matheq(d, 60, 60) !== 0) ? ',&nbsp;' + matheq(d, 60, 60) + ' sec' + plural(matheq(d, 60, 60)) : '');
    } else if (d >= 3600 && d < 86400) {
        val = Math.floor(d / 3600) + ' hour' + plural(Math.floor(d / 3600)) + ((matheq(d, 3600, 60) !== 0) ? ',&nbsp;' + matheq(d, 3600, 60) + ' min' + plural(matheq(d, 3600, 60)) : '');
    } else if (d >= 86400 && d < 172800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400)) + ((matheq(d, 86400, 24) !== 0) ? ',&nbsp;' + matheq(d, 86400, 24) + ' hour' + plural(matheq(d, 86400, 24)) : '');
    } else if (d >= 172800 && d < 604800) {
        val = Math.floor(d / 86400) + ' day' + plural(Math.floor(d / 86400));
    } else if (d >= 604800 && d < 2419200) {
        val = Math.floor(d / 604800) + ' week' + plural(Math.floor(d / 604800));
    } else if (d >= 2419200 && d < 31536000) {
        val = Math.floor(d / 2419200) + ' month' + plural(Math.floor(d / 2419200));
    } else if (d >= 31536000) {
        val = Math.floor(d / 31536000) + ' year' + plural(Math.floor(d / 31536000));
    }

    if (w == 1) {
        val = val.split(', ')[0];
    }

    if (t == null) {
        return 'Never';
    } else if (val == 'Just now') {
        return val;
    } else {
        return val + ' ago';
    }
}

function prettyDT(t, short = false, tz = false) {
    let options;

    if (short) {
        options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
    } else {
        options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
    }

    if (tz) {
        options.timeZoneName = 'short';
    }

    return Intl.DateTimeFormat('en-US', options).format(t * 1000).replace(/([0-9]{4}),/gm, '$1 at');
}

function timezone(t = new Date()) {
    return new Date(t).toString().match(/\(([^)]+)\)/)[1].match(/\b(\w)/g).join('');
}

function smallIcon(ic) {
    let icon;

    switch (ic) {
        case 'Hike':
            icon = 'fas fa-person-hiking';
            break;
        case 'Climb':
            icon = 'fas fa-pickaxe';
            break;
        case 'Mountain Bike':
            icon = 'fas fa-person-biking-mountain';
            break;
        case 'Road Bike':
            icon = 'far fa-bicycle';
            break;
        case 'Gravel Bike':
            icon = 'far fa-bicycle';
            break;
        case 'Snowmobile':
            icon = 'fas fa-person-snowmobiling';
            break;
        case 'Alpine Ski':
            icon = 'fas fa-person-ski-lift';
            break;
        case 'Backcountry Ski':
            icon = 'fas fa-person-skiing';
            break;
        case 'Nordic Ski':
            icon = 'fas fa-person-skiing-nordic';
            break;
    }

    return icon;
}

function markerIcon(c) {
    var i;
    if (c.includes('Mountain Bike')) {
        i = 'mtb';
    } else if (c.includes('Hike')) {
        i = 'hike';
    } else if (c.includes('ATV')) {
        i = 'atv';
    } else if (c.includes('Climb')) {
        i = 'climb';
    } else if (c.includes('Dirtbike')) {
        i = 'dirtbike';
    } else if (c.includes('Gravel Bike')) {
        i = 'gravel';
    } else if (c.includes('Road Bike')) {
        i = 'road';
    } else if (c.includes('Alpine Ski')) {
        i = 'alpine';
    } else if (c.includes('Backcountry Ski')) {
        i = 'atski';
    } else if (c.includes('Nordic Ski')) {
        i = 'nordic';
    } else if (c.includes('Snowmobile')) {
        i = 'snowmobile';
    } else {
        i = 'info';
    }
    return i;
}

function ucfirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function ucwords(s) {
    if (s.search(/\s/g) >= 0) {
        var a = s.split(' '),
            o = '';

        a.forEach(function (s) {
            o += s.charAt(0).toUpperCase() + s.slice(1) + ' ';
        });

        return o.substring(0, o.length - 1);
    } else {
        return ucfirst(s);
    }
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
}

function closeModal() {
    modal.style.display = 'none';
    modal.innerHTML = '';
    modal.style.maxHeight = 'unset';
    modal.removeAttribute('data-trail-brief');

    /*if (selected != null) {
        map.setFeatureState({
            source: 'trailData',
            sourceLayer: 'mapotrails',
            id: selected
        }, {
            click: false
        });

        selected = null;
    }*/
}

function popup(e, c) {
    new mapboxgl.Popup({
        closeOnClick: true,
        maxWidth: '300px'
    }).setLngLat([e.lngLat.lng, e.lngLat.lat])
        .setHTML(c)
        .addTo(map)
        .on('close', () => {

        });
}

function createDialog(t, m, neg = false, pb = 'Ok', nb = '') {
    if (document.querySelector('.dialog') != null) {
        document.querySelector('.dialog').remove();
    }

    const d = document.createElement('div');
    d.innerHTML = dialog;
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

function notify(t, m) {
    const timing = (((m.split(' ').length / 5) + 0.5) * 1000) + 250,
        el = document.createElement('div');

    el.classList.add('alert', t);
    el.style.display = 'flex';
    el.innerHTML = '<i class="fas ' + (t == 'success' ? 'fa-check' : (t == 'info' ? 'fa-circle-info' : 'fa-circle-exclamation')) + '"></i><p>' + m + '</p>';
    document.body.append(el);

    setTimeout(() => {
        el.remove();
    }, timing);
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

function isItem(e) {
    let ce = e;

    while (ce && ce.tagName !== 'LI') {
        ce = ce.parentElement;
    }

    return ce;
}