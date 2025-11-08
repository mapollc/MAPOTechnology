let map,
    subscribe,
    modal = document.querySelector('#modal'),
    host = 'https://www.mapotrails.com/',
    domain = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    cdn = 'https://cdn.mapotrails.com/',
    /*apiKey = 'bG9jYWxob3N0',*/
    apiKey = 'cf707f0516e5c1226835bbf0eece4a0c',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ',
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
    fog = {
        range: [2.5, 5.5],
        'horizon-blend': 1,
        color: '#f4fcff',
        'high-color': '#87c8dd',
        'space-color': '#a2d9f5',
        'star-intensity': 0.5
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
        'NE': 'Northest',
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
    };

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
    weather = modalHeader + '<div class="content"><div class="tab-wrapper"><ul class="tabs"><li class="li-tab active" rel="cur"><i class="far fa-sun"></i>Current</li><li class="li-tab" rel="fcst"><i class="far fa-chart-mixed"></i>Forecast</li></ul>' +
        '<div class="tab-content active" data-tab="cur"><div style="text-align:center"><div class="spinner"></div><span style="display:block;margin-top:0.5em">Getting current conditions...</span></div></div><div class="tab-content" data-tab="fcst"><ul class="weather"><li><div class="head"><img class="placeholder" style="height:50px"><div class="title">' +
        '<h3 class="placeholder" style="width:60%;height:24px"></h3><span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
        '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
        '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
        '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
        '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
        '<div class="fcst placeholder" style="height:55px"></div></li></ul></div></div></div>',
    userContent = modalHeader + '<div class="content"><div class="tab-wrapper"><ul class="tabs"><li class="li-tab active" rel="draw">Custom</li><li class="li-tab" rel="uploads">Uploads</li></ul>' +
        '<div class="tab-content active" data-tab="draw"><div style="text-align:center"><div class="spinner"></div><span style="display:block;margin-top:0.5em">Loading your content...</span></div></div>' +
        '<div class="tab-content" data-tab="uploads"><p>You haven\'t uploaded any content yet. <a href="#" onclick="upload();return false">Upload a file</a>.</p></div></div></div>',
    uploadContent = modalHeader + '<div class="content"><p style="margin:0 0 1em 0;font-size:14px;color:#666">Upload a GPX, GeoJSON, or KML file to display on the map (maximum size: 10 MB)</p>' +
        '<form action="' + host + 'api/v1/upload/do" id="fileUpload" method="post" enctype="multipart/form-data" style="margin-top:1em"><input type="file" name="file" placeholder="Upload a file" accept=".gpx,.geojson,.json,.kml">' +
        '<div class="uploading"><i class="fa-duotone fa-spinner-third" aria-hidden="true"></i>Uploading your file...</div><div id="progress"><span></span></div></form></div>',
    slopeRose = '<svg data-v-0b6c2a78="" id="sr-{{slopeRoseID}}" width="150px" height="150px" viewBox="0 0 1050 1050" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" class="rose-svg" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linecap: round; stroke-linejoin: round; stroke-miterlimit: 1.5;"><path data-v-0b6c2a78="" data-id="north upper" d="M529.716,527l68.371,-166.7l-138.1,0l69.729,166.7Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="north middle" d="M666.581,193.63l-277.081,0l69.27,166.67l138.541,0l69.27,-166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="north lower" d="M734.1,26.997l-414.2,0l69.943,166.67l275.865,0l68.392,-166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northeast upper" d="M529.716,527l166.22,-69.529l-97.651,-97.652l-68.569,167.181Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northeast middle" d="M862.222,388.05l-195.925,-195.926l-68.873,166.835l97.963,97.963l166.835,-68.872Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northeast lower" d="M1027.79,317.966l-292.884,-292.884l-68.396,167.311l195.066,195.066l166.214,-69.493Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="east upper" d="M527.716,528.339l166.7,68.371l0,-138.1l-166.7,69.729Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="east middle" d="M861.086,665.204l0,-277.081l-166.67,69.27l0,138.541l166.67,69.27Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="east lower" d="M1027.72,732.723l0,-414.2l-166.67,69.943l0,275.865l166.67,68.392Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southeast upper" d="M527.716,528.339l69.529,166.22l97.652,-97.651l-167.181,-68.569Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southeast middle" d="M666.666,860.845l195.926,-195.925l-166.835,-68.872l-97.963,97.962l68.872,166.835Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southeast lower" d="M736.75,1026.42l292.884,-292.884l-167.311,-68.396l-195.066,195.066l69.493,166.214Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="south upper" d="M527.918,528.416l-68.371,166.7l138.1,0l-69.729,-166.7Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="south middle" d="M391.053,861.786l277.081,0l-69.27,-166.67l-138.541,0l-69.27,166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="south lower" d="M323.534,1028.42l414.2,0l-69.943,-166.67l-275.865,0l-68.392,166.67Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southwest upper" d="M527.918,528.416l-166.22,69.529l97.651,97.652l68.569,-167.181Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southwest middle" d="M195.412,667.366l195.926,195.926l68.872,-166.835l-97.963,-97.963l-166.835,68.872Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="southwest lower" d="M29.841,737.451l292.884,292.883l68.396,-167.31l-195.066,-195.067l-166.214,69.494Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="west upper" d="M528.918,527.077l-166.7,-68.371l0,138.1l166.7,-69.729Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="west middle" d="M195.548,390.212l0,277.081l166.67,-69.27l0,-138.541l-166.67,-69.27Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="west lower" d="M28.915,322.693l0,414.2l166.67,-69.943l0,-275.865l-166.67,-68.392Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northwest upper" d="M529.918,527.077l-69.529,-166.22l-97.652,97.651l167.181,68.569Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northwest middle" d="M390.968,194.571l-195.926,195.926l166.835,68.872l97.963,-97.963l-68.872,-166.835Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path><path data-v-0b6c2a78="" data-id="northwest lower" d="M318.884,27l-292.884,292.884l167.311,68.396l195.066,-195.066l-69.493,-166.214Z" style="stroke: rgb(81, 85, 88); stroke-width: 10px; fill: transparent"></path></svg>';

class RulerControl {
    constructor(options = {}) {
        this.LAYER_LINE = 'controls-layer-line';
        this.SOURCE_LINE = 'controls-source-line';
        this.MAIN_COLOR = '#263238';
        this.HALO_COLOR = '#fff';
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
        return `<b>Segment:</b> ${delta.toFixed(2)} ${units} | <b>Total:</b> ${sum.toFixed(2)} ${units}`
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
    const d = new Date(t * 1000),
        m = months[d.getMonth()],
        dt = d.getDate(),
        y = d.getFullYear(),
        h = (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()),
        min = d.getMinutes(),
        tod = ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M',
        time = h + ':' + (min < 10 ? '0' : '') + min + tod;

    if (short) {
        return (d.getMonth() + 1) + '/' + dt + '/' + y.substring(2, 4) + ' ' + time + (tz ? ' ' + timezone(t * 1000) : '');
    } else {
        return m + ' ' + dt + ', ' + y + ' at ' + time + (tz ? ' ' + timezone(t * 1000) : '');
    }
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

class Design {
    constructor(e) {
        this.app = localStorage.getItem('features');
        this.app2 = localStorage.getItem('uploads');
        this.now = Math.round(new Date().getTime() / 1000);

        if (e != null) {
            if (e.type && e.type == 'FeatureCollection') {
                this.event = e;
                this.features = this.event.features;
                this.type = null;
                this.coords = null;
                this.id = null;
            } else {
                this.event = e;
                this.feat = this.event.features[0];
                this.type = this.feat.geometry.type;
                this.name = (this.type == 'Point' ? 'Waypoint' : (this.type == 'LineString' ? 'Track' : 'Polygon'));
                this.coords = this.feat.geometry.coordinates;
                this.id = this.feat.id;
            }
        }
    }

    save(data, uploads = false) {
        localStorage.setItem((uploads ? 'uploads' : 'features'), JSON.stringify(data));
    }

    slopeAspect(lng, lat) {
        const PRECISION = 6,
            calc = new Calculate(),
            px = map.project([lng, lat], map.getZoom()),
            x = px.x,
            y = px.y,
            N = map.unproject(new mapboxgl.Point(x, y - 1)),
            E = map.unproject(new mapboxgl.Point(x + 1, y)),
            S = map.unproject(new mapboxgl.Point(x, y + 1)),
            W = map.unproject(new mapboxgl.Point(x - 1, y)),
            eleN = calc.getElevation(N.lat, N.lng, PRECISION, true),
            eleE = calc.getElevation(E.lat, E.lng, PRECISION, true),
            eleS = calc.getElevation(S.lat, S.lng, PRECISION, true),
            eleW = calc.getElevation(W.lat, W.lng, PRECISION, true),
            dy = calc.distance(N.lat, N.lng, S.lat, S.lng) * 1609,
            dx = calc.distance(E.lat, E.lng, W.lat, W.lng) * 1609,
            dzdx = (eleE - eleW) / dx,
            dzdy = (eleN - eleS) / dy,
            slope = Math.atan(Math.sqrt(dzdx ** 2 + dzdy ** 2)) * (180 / Math.PI),
            aspect = dx !== 0 ? (Math.atan2(dzdy, dzdx) * (180 / Math.PI) + 180) % 360 : (90 * (dy > 0 ? 1 : -1) + 180) % 360;

        return {
            slope: slope.toFixed(2),
            aspect: aspect
        };
    }

    stats(ty = null, cds = null) {
        let calc = new Calculate(),
            ret = {},
            type = (ty == null ? this.type : ty),
            coords = (cds != null ? (cds.length == 1 ? cds[0] : cds) : (type == 'Polygon' ? this.coords[0] : this.coords));

        if (type == 'Point') {
            const sa = this.slopeAspect(coords[0], coords[1]);

            ret.elevation = calc.getElevation(coords[1], coords[0], 1);
            ret.slope = sa.slope;
            ret.aspect = sa.aspect;
        } else {
            let el = [],
                slopes = [],
                aspects = [],
                distance = 0,
                lastCoords,
                avy = 0,
                gain = 0,
                loss = 0;

            coords.forEach((c, n) => {
                const sa = this.slopeAspect(c[0], c[1]);

                if (sa.slope >= 30 && sa.slope <= 45) {
                    avy++;
                }

                if (n > 0) {
                    distance += new Calculate().distance(c[0], c[1], lastCoords[0], lastCoords[1]);
                }

                el.push(parseFloat(calc.getElevation(c[1], c[0], 1)));
                slopes.push(sa.slope);
                aspects.push(sa.aspect);
                lastCoords = c;
            });

            for (let i = 1; i < el.length; i++) {
                const x = i - 1;

                if (el[i] > el[x]) {
                    gain += el[i] - el[x];
                } else {
                    loss += el[i] - el[x];
                }
            }

            ret.points = coords.length;
            ret.distance = distance;
            ret.elevation = {
                computed: {
                    min: Math.min.apply(null, el),
                    avg: calc.average(el),
                    max: Math.max.apply(null, el)
                },
                height: {
                    gain: gain,
                    loss: loss
                },
                points: el
            };
            ret.slope = {
                min: Math.min.apply(null, slopes),
                avg: calc.average(slopes),
                max: Math.max.apply(null, slopes),
                avalanche: avy
            };
            ret.aspect = {
                all: aspects,
                avg: calc.average(aspects)
            };

            if (type == 'Polygon') {
                ret.area = turf.area(turf.polygon([coords]));
            }
        }

        return ret;
    }

    createFromUpload(file) {
        let all = [];

        this.features.forEach((feat) => {
            const type = feat.geometry.type,
                name = feat.properties.name ? feat.properties.name : (type == 'Point' ? 'Waypoint' : (type == 'LineString' ? 'Track' : 'Polygon'));

            this.type = type;
            this.id = crypto.randomUUID().replaceAll('-', '');
            this.coords = feat.geometry.coordinates;

            const item = {
                id: this.id,
                name: name,
                type: type,
                coords: this.coords,
                stats: {},
                notes: '',
                created: feat.properties.time ? Math.round(new Date(feat.properties.time).getTime() / 1000) : this.now,
                modified: this.now,
                file: file
            };

            /*item.stats = this.stats();*/

            all.push(item);
        });

        if (this.app2 == null || this.app2 == '') {
            this.save(all, true);
        } else {
            const arr = JSON.parse(this.app2);

            all.forEach((a) => {
                arr.push(a);
            });

            this.save(arr, true);
        }
    }

    create() {
        const item = {
            id: this.id,
            name: this.name,
            type: this.type,
            coords: this.coords,
            stats: {},
            notes: '',
            created: this.now,
            modified: this.now
        };

        item.stats = this.stats();

        if (this.app == null || this.app == '') {
            this.save([item]);
        } else {
            const arr = JSON.parse(this.app);
            arr.push(item);
            this.save(arr);
        }

        modal.innerHTML = userContent;
        modal.style.display = 'flex';
        modal.querySelector('#a').innerHTML = 'My Content';
        const guc = new GetUserContent();
        guc.getDraw();
        guc.displayUploads();
    }

    update() {
        let arr = [];

        JSON.parse(this.app).forEach((f) => {
            if (f.id == this.id) {
                f.coords = this.coords;
                f.modified = this.now;
                f.stats = this.stats();
            }

            arr.push(f);
        });

        this.save(arr);

        modal.innerHTML = userContent;
        modal.style.display = 'flex';
        modal.querySelector('#a').innerHTML = 'My Content';
        const guc = new GetUserContent();
        guc.getDraw();
        guc.displayUploads();
    }

    delete(forced_id = null, s = 'features') {
        let arr = [],
            thisID = (this.id ? this.id : forced_id);

        JSON.parse(localStorage.getItem(s)).forEach((f) => {
            if (f.id != thisID) {
                arr.push(f);
            }
        });

        /* if feature is an uploaded feature and it was the last one in the "file/folder" upload, remove the whole file container from ul.user-tracks */
        if (s == 'uploads' && arr.length == 0) {
            document.querySelector('h3.fileName[data-id="' + thisID + '"]').remove();
        }

        this.save(arr, (s == 'features' ? false : true));
        saveSession(true, true);

        if (document.querySelectorAll('.user-tracks:' + (s == 'features' ? 'not' : 'has') + '(uploads) > li').length == 0) {
            /* show message that there are not more features */
        }
    }
}

class GetUserContent {
    constructor(f = null) {
        this.feature = f;
    }

    getDraw(storeName = 'features') {
        let app = localStorage.getItem(storeName),
            mbDraw = document.querySelector('#modal .tab-content[data-tab=' + (storeName == 'features' ? 'draw' : 'uploads') + ']'),
            content = '';

        if (app == null || app == '') {
            mbDraw.innerHTML = '<p>' + (storeName == 'features' ? 'You currently don\'t have any waypoints, tracks, or polygons.' : 'You haven\'t uploaded any content yet. <a href="#" onclick="upload();return false" class="btn btn-sm btn-orange" style="display:block;margin-bottom:0">Upload a file</a>') + '</p>';
        } else {
            if (modal.style.display != 'none') {
                let exportable,
                    fids = [],
                    json = JSON.parse(app),
                    recent = [],
                    all = Draw.getAll();

                if (all != null && all.features.length > 0) {
                    all.features.forEach((f) => {
                        recent.push(f.id);
                    });
                }

                if (storeName == 'features') {
                    exportable = '<a href="#" class="btn btn-yellow btn-sm exportAllFeatures" style="margin:0" data-mode="all" data-store="' + storeName + '" title="Export all of your content" onclick="return false"><i class="far fa-file-export"></i>Export all</a></div>';
                } else {
                    exportable = '<a href="#" class="btn btn-yellow btn-sm exportAllFeatures" style="margin:0" data-mode="all" data-store="' + storeName + '" title="Download your uploads as one file" onclick="return false"><i class="far fa-file-download"></i>Download all</a></div>';
                }

                for (let i = 0; i < json.length; i++) {
                    this.feature = json[i];

                    const id = json[i].id,
                        type = json[i].type,
                        ptype = (type == 'LineString' ? 'Track' : (type == 'Point' ? 'Waypoint' : type)),
                        icon = (type == 'Point' ? 'fas fa-location-dot' : (type == 'LineString' ? 'far fa-route' : 'fad fa-draw-polygon')),
                        name = json[i].name,
                        notes = json[i].notes,
                        file = (json[i].file ? json[i].file : null),
                        time = (json[i].created == json[i].modified ? 'Created ' + prettyDT(json[i].created) : 'Modified ' + timeAgo(json[i].modified));

                    let showStats = (Object.entries(json[i].stats).length == 0 ? '<a href="#" class="btn centered btn-orange generateStats" style="margin:0 auto" data-id="' + id + '">Generate Stats</a></ol>' :
                        this.getStats() + '</ol>' + (type == 'LineString' && this.feature.stats.aspect.avg != null ? slopeRose.replace('{{slopeRoseID}}', id) : ''));

                    /* create controls for each geojson feature */
                    const controls = '<div class="controls" data-id="' + id + '"><span class="fas fa-check saveFeature" data-type="' + storeName + '" style="display:none;margin-right:1em" title="Save ' + ptype + '"></span>' +
                        '<span class="far fa-pen editFeature" title="Edit ' + ptype + '"></span>' +
                        (type == 'LineString' ? '<span class="fas fa-chart-area chartFeature" data-type="' + storeName + '" title="Show elevation profile"></span>' : '') +
                        '<span class="fad fa-file-export exportFeature" data-store="' + storeName + '" data-mode="single" title="Export this ' + ptype.toLowerCase() + '"></span>' +
                        '<span class="fas fa-trash deleteFeature" data-store="' + storeName + '" data-type="' + ptype.toLowerCase() + '" title="Delete this ' + ptype.toLowerCase() + '"></span></div>';

                    if (file != null) {
                        if (!fids.includes(file.fid)) {
                            content += '<h3 class="fileName" data-id="' + id + '"><i class="fas fa-folders" style="font-size:18px"></i><span>' + file.name + '</span>' +
                                '<span class="badge">' + (file.type.search('json') >= 0 ? 'geojson' : file.type) + '</span></h3>';
                        }

                        fids.push(file.fid);
                    }

                    /* create HTML list for feature display */
                    content += '<li data-id="' + id + '"' + (type == 'LineString' ? ' data-points="' + (json[i].stats.points ? json[i].stats.points : '') + '" data-aspect="' + (type == 'LineString' && this.feature.stats.aspect != null ? this.slopeRose() : '') + '"' : '') + '>' +
                        '<div class="trk"><div class="h"><div class="p"><i class="' + icon + '" title="' + ptype + '" style="width:20px;font-size:20px;color:var(--orange)"></i>' +
                        '<div class="j"><h6 class="title"><span>' + name + '</span><input type="text" id="' + id + '" placeholder="Name..." value="' + name + '">' + controls + '</h6>' +
                        '<span class="dt">' + time + '</span></div></div>' +
                        '<div class="checkbox"><input type="checkbox" class="toggleUF" title="Toggle visibility" data-type="' + storeName + '" data-id="' + id + '"' + (recent.includes(id) ? ' checked' : '') + '></div></div>' +
                        '<div id="ts"' + (recent.includes(id) ? ' style="display:block"' : '') + '>' +
                        '<textarea id="notes-' + id + '" placeholder="' + (name ? name : ptype) + ' notes...">' + (notes ? notes : '') + '</textarea>' +
                        '<a href="#" class="btn btn-sm btn-blue saveNotes"  data-type="' + storeName + '" data-id="' + id + '" style="display:block;margin:0 0 0.5em auto;font-size:12px" onclick="return false">Save</a>' +
                        '<ol>' + showStats + '</div></div></li>';
                }

                const syncTime = localStorage.getItem('mt-lastSync');

                mbDraw.innerHTML = '<div class="user-content-head"><p id="synced"><i class="fas fa-cloud-arrow-up" style="font-size:15px"></i><span>Last synced ' + (syncTime != null ? timeAgo(syncTime) : 'never') + '</span></p>' +
                    exportable + '<ul class="user-tracks' + (storeName != 'features' ? ' uploads' : '') + '">' + content + '</ul>';

                this.drawSlopeRose();
            }
        }
    }

    displayUploads() {
        this.getDraw('uploads');
    }

    slopeRose() {
        let dirs = [],
            counter = {};

        if (this.feature.stats.aspect.all) {
            this.feature.stats.aspect.all.forEach((e) => {
                dirs.push(new Calculate().aspectDirection(e));
            });

            dirs.forEach(ele => {
                if (counter[ele]) {
                    counter[ele] += 1;
                } else {
                    counter[ele] = 1;
                }
            });

            return JSON.stringify(counter).replaceAll('"', '\'');
        }
    }

    drawSlopeRose() {
        document.querySelectorAll('.user-tracks svg[id^=sr-]').forEach((sr) => {
            const par = sr.parentElement.parentElement.parentElement,
                total = par.getAttribute('data-points'),
                data = JSON.parse(par.getAttribute('data-aspect').replaceAll('\'', '"')),
                arr = [];

            Object.keys(data).forEach((e) => {
                arr[bearings[e].toLowerCase()] = ((data[e] / total) * 100).toFixed(2);
            });

            Object.keys(arr).forEach((p) => {
                sr.querySelectorAll('path').forEach((path) => {
                    if (path.getAttribute('data-id').search(p + ' ') >= 0) {
                        path.style.fill = 'rgb(241 143 1 / ' + arr[p] + '%)';
                    }
                });
            });
        });
    }

    getStats() {
        let feat = this.feature,
            stats = feat.stats,
            calc = new Calculate(),
            s = '',
            dist = (!stats.distance ? null : (stats.distance < 1 ? (stats.distance * 5280).toFixed(1) + ' ft.' : stats.distance.toFixed((stats.distance > 10 ? 1 : 2)) + ' mi.'));

        if (feat.type == 'LineString') {
            s += '<li><div class="w">Distance</div><div class="v" title="' + numberFormat(calc.miToKm(stats.distance), 2) + ' km">' + dist + '</div></li>' +
                '<li><div class="w">Avalanche Slopes</div><div class="v">' + (stats.slope.avalanche == 0 ? 'None' : stats.slope.avalanche) + '</div></li>{{elev}}' +
                (stats.elevation.height.gain != null ? '<li><div class="w">Elevation Gain</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation.height.gain), 1) + ' m">' +
                    numberFormat(stats.elevation.height.gain, 1) + ' ft.</div></li>' : '') +
                (stats.elevation.height.loss != null ? '<li><div class="w">Elevation Loss</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation.height.loss), 1) + ' m">' +
                    numberFormat(stats.elevation.height.loss, 1) + ' ft.</div></li>' : '') +
                (stats.slope.min && stats.slope.max ? '<li><div class="w">Slope Range</div><div class="v">' + stats.slope.min.toFixed(1) + '-' + stats.slope.max.toFixed(1) + '&deg;</div></li>' : '') +
                (stats.slope.avg ? '<li><div class="w">Average Slope</div><div class="v">' + Math.round(stats.slope.avg) + '&deg;</div></li>' : '') +
                (stats.aspect.avg ? '<li><div class="w">Average Aspect</div><div class="v">' + calc.getCompassDirection(stats.aspect.avg) + '</div></li>' : '');
        } else if (feat.type == 'Polygon') {
            s += '<li><div class="w">Area</div><div class="v">' + numberFormat(stats.area * 3.861E-7, 2) + ' sq. mi.</div></li>' +
                '<li><div class="w">Perimeter</div><div class="v">' + dist + '</div></li>{{elev}}' +
                '<li><div class="w">Points</div><div class="v">' + numberFormat(stats.points) + '</div></li>';
        }

        if (feat.type == 'Point') {
            s += '<li><div class="w">Coordinates</div><div class="v">' + feat.coords[1].toFixed(4) + ', ' + feat.coords[0].toFixed(4) + copyData.replace('{content}', feat.coords[1] + ', ' + feat.coords[0]) + '</div></li>' +
                '<li><div class="w">Elevation</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation), 1) + ' m">' + numberFormat(stats.elevation, 1) + ' ft.</div></li>' +
                '<li><div class="w">Slope</div><div class="v">' + Math.round(stats.slope) + '&deg;</div></li>' +
                '<li><div class="w">Aspect</div><div class="v">' + calc.getCompassDirection(stats.aspect) + '</div></li>';
        } else {
            s = s.replace('{{elev}}', (stats.elevation.computed.max ? '<li><div class="w">Max' + (feat.type == 'Polygon' ? '. Perimeter' : 'imum') +
                ' Elevation</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation.computed.max), 1) + ' m">' + numberFormat(stats.elevation.computed.max, 1) + ' ft.</div></li>' : '') +
                (stats.elevation.computed.min ? '<li><div class="w">Min' + (feat.type == 'Polygon' ? '. Perimeter' : 'imum') +
                    ' Elevation</div><div class="v" title="' + numberFormat(calc.ftToM(stats.elevation.computed.min), 1) + ' m">' +
                    numberFormat(stats.elevation.computed.min, 1) + ' ft.</div></li>' : ''));
        }

        return s;
    }
}

class Trails {
    constructor(refresh) {
        this.refresh = refresh;
    }

    async getTHs() {
        const premiumAllow = new Subscribe().hasPermissions();

        if (trailheads.length == 0) {
            /* parse THs into geojson for mapbox */
            if (theads.trails != null && theads.trails.length > 0) {
                theads.trails.forEach((t) => {
                    if (t.stats != null && t.premium == 0 || (t.premium == 1 && premiumAllow)) {
                        const cat = t.category[0];

                        if (settings.activity) {
                            const setact = ucwords(settings.activity.replace('-', ' '));

                            if (t.category.includes(setact.replace('Atv', 'ATV'))) {
                                tids.push(t.trail_id.toString());
                            }
                        }

                        t['icon'] = cat;

                        trailheads.push({
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [
                                    t.stats.geo.start[1],
                                    t.stats.geo.start[0]
                                ]
                            },
                            properties: t
                        });
                    }
                });

                /* make search undisabled */
                document.querySelector('#q').disabled = false;
            }
        }

        Object.keys(gi.gis).forEach((g) => {
            if (tids.includes(g)) {
                gi.gis[g].forEach((n) => {
                    gisIDs.push(n);
                });
            }
        });

        this.processTHs();
    }

    processTHs() {
        const cc = [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            50,
            '#f28cb1'
        ];

        /* get GIS trails */
        this.getTrails();

        /* add trailheads source */
        if (!map.getSource('ths')) {
            map.addSource('ths', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: trailheads
                },
                cluster: true,
                clusterMaxZoom: 10,
                clusterMinPoints: 3,
                clusterRadius: 50
            });
        }

        /* add trailhead icon markers to map */
        if (!map.getLayer('trailheads')) {
            map.addLayer({
                id: 'trailheads',
                type: 'symbol',
                source: 'ths',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'icon'],
                        'Hike', 'icon-hike',
                        'Mountain Bike', 'icon-mtb',
                        'Road Bike', 'icon-road',
                        'Backcountry Ski', 'icon-atski',
                        'Climb', 'icon-climb',
                        'Alpine Ski', 'icon-alpine',
                        'Nordic Ski', 'icon-nordic',
                        'Big Ride', 'icon-big_ride',
                        'Fantasy', 'icon-fantasy',
                        'Snowmobile', 'icon-snomo',
                        'Gravel Bike', 'icon-gravel',
                        /*'Beginner', 'icon-hike',
                        'Private', 'icon-hike',*/
                        'Dirtbike', 'icon-dirtbike',
                        /*'Race', 'icon-hike',*/
                        'icon-info'
                    ],
                    'icon-size': 1,
                    'icon-allow-overlap': true,
                    visibility: (settings.layers.trailheads ? 'visible' : 'none')
                },
            }).on('mouseenter', 'trailheads', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'trailheads', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('touchend', 'trailheads', (e) => {
                const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                    layers: ['trailheads']
                });

                if (features.length > 0) {
                    this.readTrail(features[0].properties);
                }
            }).on('click', 'trailheads', (e) => {
                const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                    layers: ['trailheads']
                });

                if (features.length > 0) {
                    this.readTrail(features[0].properties);
                }
            });
        }

        /* deal with marker clustering */
        if (!map.getLayer('cluster-ths')) {
            let clusterClick = (e) => {
                const features = map.queryRenderedFeatures(e.point, {
                    layers: ['cluster-ths']
                });

                map.getSource('ths').getClusterExpansionZoom(features[0].properties.cluster_id,
                    (err, zoom) => {
                        if (err) return;

                        map.easeTo({
                            center: features[0].geometry.coordinates,
                            zoom: zoom + 1
                        });
                    }
                );
            };

            map.addLayer({
                id: 'cluster-ths',
                source: 'ths',
                type: 'circle',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': cc,
                    'circle-stroke-color': cc,
                    'circle-stroke-width': 5,
                    'circle-stroke-opacity': 0.5,
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        15,
                        20,
                        20,
                        50,
                        30
                    ]
                },
                layout: {
                    'visibility': (settings.layers.trailheads ? 'visible' : 'none')
                }
            }).addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'ths',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': ['get', 'point_count_abbreviated'],
                    'text-font': ['DIN Offc Pro Medium'],
                    'text-size': 14,
                    'visibility': (settings.layers.trailheads ? 'visible' : 'none')
                }
            }).on('touchend', 'cluster-ths', (e) => {
                clusterClick(e);
            }).on('click', 'cluster-ths', (e) => {
                clusterClick(e);
            }).on('mouseenter', 'cluster-ths', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'cluster-ths', () => {
                map.getCanvas().style.cursor = 'auto';
            });
        }
    }

    onTrailClick(e) {
        const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
            layers: ['trails']
        });

        if (features.length > 0) {
            selected = features[0].id;

            /*map.setFeatureState({
                source: 'trailData',
                sourceLayer: 'mapotrails',
                id: selected
            }, {
                click: true
            });*/

            /* if the trail clicked on was the main trail route */
            if (features[0].properties.delta == 0) {
                /* get all trailheads that have rendered on the screen, then match the trail clicked on to the trailhead to get the 
                 * bounds of that trail to zoom the map into and then open the modal with the trail info
                 */
                trailheads.forEach((t) => {
                    if (t.properties.trail_id == features[0].properties.trail_id) {
                        let bnds,
                            prop = t.properties;

                        if (prop.stats instanceof Object) {
                            bnds = prop.stats.bounds;
                            prop.category = JSON.stringify(prop.category);
                            prop.keywords = JSON.stringify(prop.keywords);
                            prop.photo = JSON.stringify(prop.photo);
                            prop.stats = JSON.stringify(prop.stats);
                        } else {
                            bnds = JSON.parse(prop.stats).bounds;
                        }

                        this.readTrail(prop);

                        map.fitBounds([bnds.sw, bnds.ne], {
                            padding: 40
                        });
                    }
                });
            } else {
                const stats = JSON.parse(features[0].properties.stats),
                    content = (stats ? '<ul class="pu-stats"><li><div class="title">Distance</div><span>' + stats.distance.toFixed(1) + ' mi.</span></li>' +
                        '<li><div class="title">Max Elevation</div><span>' + Math.round(stats.elevation.max) + ' ft.</span></li><li>' +
                        '<div class="title">Min Elevation</div><span>' + Math.round(stats.elevation.min) + ' ft.</span></li>' +
                        '<li><div class="title">Elevation Gain</div><span>' + stats.altitude.gain.toFixed(1) + ' ft.</span></li>' +
                        '<li><div class="title">Elevation Loss</div><span>' + stats.altitude.loss.toFixed(1) + ' ft.</span></li></ul>' : '<span style="display:block;text-align:center;color:var(--gray)">No stats available</span>');

                popup(e, '<h3>' + features[0].properties.caption + '</h3>' + content);
            }
        }
    }

    getTrails() {
        /* go to a specific area */
        if (settings.area) {
            this.area();
        }

        /* get waypoints */
        this.getWaypoints();

        /* generate filter for trails */
        let filter = ['all'];
        filter.push(['==', ['get', 'type'], settings.category]);
        filter.push(['==', ['get', 'display'], '1']);

        if (settings.activity) {
            filter.push(['in', ['get', 'trail_id'], ['literal', tids]]);
        }

        /* if user has permissions to see all trails */
        if (user.role != 'ADMIN') {
            filter.push(['==', ['get', 'public'], '1']);
        }

        /* get vector trails from mapbox */
        if (!map.getSource('trailData')) {
            map.addSource('trailData', {
                type: 'vector',
                url: 'mapbox://mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs'
            });
        }

        /* add trail lines */
        if (!map.getLayer('trails')) {
            map.addLayer({
                id: 'trails',
                type: 'line',
                source: 'trailData',
                minzoom: 10,
                'source-layer': 'mapotrails',
                filter: filter,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                    'visibility': (settings.layers.trails ? 'visible' : 'none')
                },
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': /*[
                        'interpolate',
                        ['exponential', 2],
                        ['zoom'],
                        1, ['case', ['boolean', ['feature-state', 'click'], false], 3, 2],
                        9, ['case', ['boolean', ['feature-state', 'click'], false], 4, 3],
                        10, ['case', ['boolean', ['feature-state', 'click'], false], 6, 4],
                        12, ['case', ['boolean', ['feature-state', 'click'], false], 7, 5],
                        15, ['case', ['boolean', ['feature-state', 'click'], false], 8, 6]
                    ]*/
                        [
                            'interpolate',
                            ['exponential', 2],
                            ['zoom'],
                            1, 2,
                            9, 3,
                            10, 4,
                            12, 5,
                            13, 6
                        ]
                }
            }).on('mouseenter', 'trails', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'trails', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('touchend', 'trails', (e) => {
                this.onTrailClick(e);
            }).on('click', 'trails', (e) => {
                this.onTrailClick(e);
            });
        }

        /* add text inside of trail lines */
        /*[
                        'match',
                        ['get', 'color'], '#000', 'rgba(150, 150, 150, 0)',
                        'rgba(250, 250, 250, 0.5)'
                    ]*/
        if (!map.getLayer('trailTitle')) {
            map.addLayer({
                id: 'trailTitle',
                type: 'symbol',
                source: 'trailData',
                'source-layer': 'mapotrails',
                paint: {
                    'text-color': [
                        'match',
                        ['get', 'color'],
                        [
                            '#000',
                            '#ff0000',
                            '#3949ab',
                            '#cb2626',
                            '#0058aa',
                            '#880e4f'
                        ],
                        '#ffffff',
                        '#000000'
                    ],
                    'text-halo-color': [
                        'match',
                        ['get', 'color'],
                        [
                            '#000',
                            '#3949ab',
                            '#ff0000',
                            '#cb2626',
                            '#0058aa',
                            '#880e4f'
                        ],
                        'rgb(61, 61, 61)',
                        'rgb(255, 255, 255)'
                    ],
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'line',
                    'symbol-spacing': 150,
                    'text-font': ['DIN Pro Medium'],
                    'text-field': [
                        'match',
                        ['get', 'delta'], 0, ['get', 'title'],
                        ['get', 'caption']
                    ],
                    'text-size': 14,
                    'text-letter-spacing': 0.05,
                    'visibility': (settings.layers.trails ? 'visible' : 'none')
                },
                filter: filter
            });
        }
    }

    async getWaypoints() {
        if (waypoints === undefined) {
            const arr = [];
            arr.push(['category', settings.category]);

            if (settings.activity) {
                arr.push(['activity', settings.activity]);
            }

            const way = await api(apiURL + 'trails/waypoints', arr),
                wf = [];

            way.features.forEach((f) => {
                if ((f.properties.public == 0 && user.role == 'ADMIN') || (f.properties.public == 1 && (f.properties.premium == 0 || f.properties.premium == 1 && new Subscribe().hasPermissions()))) {
                    wf.push(f);
                }
            });

            waypoints = {
                type: 'FeatureCollection',
                features: wf
            };
        }

        this.displayWaypoints();
    }

    displayWaypoints() {
        /* add waypoints source */
        if (!map.getSource('wps')) {
            map.addSource('wps', {
                type: 'geojson',
                data: waypoints
            });
        }

        if (!map.getLayer('waypoints')) {
            map.addLayer({
                id: 'waypoints',
                type: 'symbol',
                source: 'wps',
                minzoom: 11,
                filter: ['in', ['get', 'type'], ['literal', settings.category]],
                /*filter: ['in', ['get', 'trail_id'], ['literal', tids]],*/
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'icon'],
                        '- Icon -', 'icon-info',
                        'mtn_bike', 'icon-mtb',
                        ['concat', 'icon-', ['get', 'icon']]
                    ],
                    'icon-size': {
                        type: 'exponential',
                        base: 0.25,
                        stops: [
                            [11, 0.75],
                            [13, 1]
                        ]
                    },
                    'icon-allow-overlap': true,
                    'visibility': (settings.layers.waypoints ? 'visible' : 'none')
                }
            }).on('mouseenter', 'waypoints', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'waypoints', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('click', (e) => {
                const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                    layers: ['waypoints']
                });

                if (features.length > 0) {
                    let name = 'Waypoint',
                        note;

                    if (features[0].properties.note == 'N/A') {
                        note = features[0].properties.name;
                    } else {
                        if (features[0].properties.name) {
                            name = features[0].properties.name;
                        }
                        note = features[0].properties.note;
                    }

                    const edit = '<a class="edit-link" href="https://www.mapotechnology.com/account/admin/trails/edit?id=' + features[0].properties.trail_id + '" target="blank"><i class="far fa-pen"></i>edit</a>';

                    popup(e, '<h3>' + name + '</h3><p style="text-align:center">' + note + '</p>' + (user.role == 'ADMIN' ? edit : ''));
                }
            });
        }
    }

    readTrail(trail) {
        let link,
            k = '',
            photo = JSON.parse(trail.photo),
            stats = JSON.parse(trail.stats),
            categories = JSON.parse(trail.category),
            keywords = JSON.parse(trail.keywords);

        if (favTrails.includes(trail.trail_id)) {
            link = '<a href="#" id="favTrail" onclick="return false" data-id="' + trail.trail_id + '" data-favorite="1" title="Remove this trail from your favorites" class="btn btn-sm btn-yellow" style="margin:0"><i class="fa-sharp fas fa-star"></i> Favorited Trail</a>';
        } else {
            link = '<a href="#" id="favTrail" onclick="return false" data-id="' + trail.trail_id + '" data-favorite="0" title="Add this trail from your favorites" class="btn btn-sm btn-yellow" style="margin:0"><i class="fa-sharp far fa-star"></i> Favorite Trail</a>';
        }

        modal.setAttribute('data-trail-brief', 1);
        modal.innerHTML = trailBrief.replace('{favTrailLink}', (user.uid ? link : ''));

        /* add an edit link for admins */
        if (user.role == 'ADMIN') {
            document.querySelector('.rt-control').insertAdjacentHTML('beforeend', '<a class="edit-link" style="width:auto;margin:0" href="https://www.mapotechnology.com/account/admin/trails/edit?id=' + trail.trail_id + '" target="blank"><i class="far fa-pen"></i>edit</a>');
        }

        if (modal.style.display != 'flex') {
            modal.style.display = 'flex';
        }

        document.querySelector('#a').innerHTML = trail.title;
        document.querySelector('#j').innerHTML = '<img id="trailImg" class="placeholder" src="' + cdn + 'photos/' + photo.thumbnail + '" onerror="this.parentElement.parentElement.prepend(\'<div class=noimg></div>\');this.parentElement.remove();" style="width:100%;height:175px">';
        document.querySelector('#trailImg').style.height = 'unset';
        document.querySelector('#i').innerHTML = '<img src="' + cdn + 'icons/' + markerIcon(categories) + '.png">' + categories.join(' / ');
        document.querySelector('#c').innerHTML = stats.distance.toFixed(1) + ' <span>mi</span>';
        document.querySelector('#d').innerHTML = numberFormat(stats.elevation.max, 1) + ' <span>ft</span>';
        document.querySelector('#e').innerHTML = numberFormat(stats.elevation.min, 1) + ' <span>ft</span>';
        document.querySelector('#f').innerHTML = numberFormat(stats.altitude.gain, 1) + ' <span>ft</span>';
        document.querySelector('#g').innerHTML = numberFormat(stats.altitude.loss, 1) + ' <span>ft</span>';
        document.querySelectorAll('#h, #j').forEach((e) => {
            e.setAttribute('href', host + trail.url);
        });

        /* add keywords to modal */
        if (keywords != null && keywords[0] != '' && keywords !== false) {
            keywords.forEach((w) => {
                k += '<div class="tag" onclick="window.open(\'' + host + 'guides/all/all-activities/' + w.replaceAll(' ', '-').toLowerCase() + '\')">#' + w.replaceAll(' ', '').replaceAll('.', '') + '</div>';
            });

            document.querySelector('.tags').innerHTML = k;
        } else {
            document.querySelector('.tags').remove();
        }
    }

    contours() {
        if (!map.getSource('contours')) {
            map.addSource('contours', {
                type: 'vector',
                url: 'mapbox://mapbox.mapbox-terrain-v2'
            });
        }

        if (!map.getLayer('contours')) {
            map.addLayer({
                id: 'contours',
                type: 'line',
                source: 'contours',
                'source-layer': 'contour',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': (settings.tile == 'satellite' ? '#ccc' : '#877b59'),
                    'line-width': 1
                }
            }).addLayer({
                id: 'contours-text',
                type: 'symbol',
                source: 'contours',
                'source-layer': 'contour',
                paint: {
                    'text-color': (settings.tile == 'satellite' ? '#fff' : '#626250'),
                    'text-halo-width': 1,
                    'text-halo-blur': 0
                },
                layout: {
                    'symbol-placement': 'line',
                    'text-font': ['DIN Offc Pro Medium'],
                    'text-field': [
                        'concat', [
                            'round', [
                                '*',
                                ['get', 'ele'],
                                3.28084
                            ]
                        ],
                        ' ft'
                    ],
                    'text-size': 11
                }
            });


        }
    }

    area() {
        let count = 0,
            bounds = new mapboxgl.LngLatBounds(),
            s = settings.area.replace('-', ' ');

        trailheads.forEach((t) => {
            const kw = t.properties.keywords;

            for (let i = 0; i < kw.length; i++) {
                if (kw[i].toLowerCase().search(s) >= 0 || t.properties.title.toLowerCase().search(s) >= 0) {
                    const c = t.geometry.coordinates;

                    bounds.extend(new mapboxgl.LngLat(
                        parseFloat(c[0]),
                        parseFloat(c[1])
                    ));

                    count++;
                }
            }
        });

        if (count > 0) {
            console.log(bounds);
            map.fitBounds(bounds, {
                padding: 100
            });
        }
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

async function getSnotels() {
    map.loadImage(cdn + 'icons/snotel.png', (error, image) => { if (error) throw error; map.addImage('snotel', image); });

    if (!snotels) {
        snotels = await api(apiURL + 'weather/snotels');
    }

    if (!map.getSource('stls')) {
        map.addSource('stls', {
            type: 'geojson',
            data: snotels
        });
    }

    if (!map.getLayer('snotels')) {
        map.addLayer({
            id: 'snotels',
            type: 'symbol',
            source: 'stls',
            layout: {
                'icon-image': 'snotel',
                'icon-size': 0.85,
                'text-anchor': 'top',
                'text-font': ['DIN Offc Pro Regular'],
                'text-field': [
                    'step',
                    ['zoom'], '',
                    9, ['get', 'code']
                ],
                'text-size': {
                    type: 'exponential',
                    base: 0,
                    stops: [
                        [9, 10],
                        [12, 12],
                        [13, 14]
                    ]
                },
                'text-offset': [0, 1.1]
            }
        }).on('mouseenter', 'snotels', () => {
            map.getCanvas().style.cursor = 'pointer';
        }).on('mouseleave', 'snotels', () => {
            map.getCanvas().style.cursor = 'auto';
        }).on('click', (e) => {
            const features = map.queryRenderedFeatures([e.point.x, e.point.y], {
                layers: ['snotels']
            });

            if (features.length > 0) {
                new Weather().readSnotel(features[0].properties.code, features[0].geometry.coordinates);
            }
        });
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

        div += (weather.obs.raw_wind_dir >= 0 ? '<li><div class="caption">Wind Direction</div><div class="value">' + (wdir ? wdir + '<svg xmlns="http://www.w3.org/2000/svg" title="' + wdir + '" style="position:absolute;margin:-3px 0 0 0.5em;transform:rotate(' + weather.obs.raw_wind_dir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>' : '--') + '</div></li>' +
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
                        icon = '<i class="wi ' + this.wxIcon(h.isDaytime, desc) + '" style="margin-bottom:0.2em" title="' + desc + '"></i>';

                    c += '<li><p>' + (h.number == 1 ? 'Now' : time) + '</p>' + icon + '<span class="t">' + temp + '&deg;</span></li>';
                }
            });

            forecast = '<h3 class="fcst-title">Hourly</h3><ul class="forecast hourly">' + c + '</ul>';
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

            forecast += '<h3 class="fcst-title" style="margin-top:0.5em">Daily</h3><ul class="forecast">' + c + '</ul>';
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

class Subscribe {
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
        return this.validSubscription() || user.uid != null && user.role != 'GUEST'
    }
}

async function saveSession(method = true, msg) {
    if (navigator.onLine) {
        const c = map.getCenter(),
            arr = [],
            draw = localStorage.getItem('features'),
            uploads = localStorage.getItem('uploads'),
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
                    tile: settings.tile,
                    layers: settings.layers,
                    avyOpac: (settings.avyOpac ? settings.avyOpac : 0.4)
                },
                content: {
                    draw: btoa(draw),
                    uploads: btoa(uploads)
                }
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
    } else {
        notify('error', 'Unable to sync your settings due to no internet.');
    }
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

function openLayers() {
    const l = modalHeader + '<div class="content"><ul class="layers-list">' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="trailheads"' + (settings.layers.trailheads ? ' checked' : '') + '></div><div class="desc"><label>Trailheads</label><span>Display trailhead markers on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="trails"' + (settings.layers.trails ? ' checked' : '') + '></div><div class="desc"><label>Trails</label><span>Display trails on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="snotel"' + (settings.layers.snotel ? ' checked' : '') + '></div><div class="desc"><label>Snotels</label><span>Show backcountry weather stations that measure snow</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="waypoints"' + (settings.layers.waypoints ? ' checked' : '') + '></div><div class="desc"><label>Waypoints</label><span>Display waypoints (points of interest) on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="avy"' + (settings.layers.avy && settings.category == 'snow' ? ' checked' : '') + '></div><div class="desc"><label>Avalanche</label><span>Show avalanche slope shading overlayed on the map</span>' +
        '<input type="range" id="avyOpac" style="display:' + (settings.layers.avy && settings.category == 'snow' ? 'block' : 'none') + ';margin-top:0.5em" min="0" max="100" step="5" value="' + (settings.avyOpac ? settings.avyOpac * 100 : 40) + '">' +
        '<div class="legend avy"' + (settings.layers.avy && settings.category == 'snow' ? ' style="display:flex"' : '') + '><div class="colors"></div><div class="labels"><div>27-29&deg;</div><div>30-31&deg;</div><div>32-34&deg;</div><div>35-45&deg;</div><div>46-50&deg;</div><div>51-59&deg;</div><div>>60&deg;</div></div></div></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="contours"' + (settings.layers.contours ? ' checked' : '') + '></div><div class="desc"><label>Contours</label><span>Visualize terrain with enhanced contour lines</span></li>' +
        /*'<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="aspect"' + (settings.layers.aspect ? ' checked' : '') + '></div><div class="desc"><label>Aspect</label><span>Visualize cardinal directions of terrain aspect</span>' +
        '<input type="range" id="aspOpac" style="display:' + (settings.aspect ? 'block' : 'none') + ';margin-top:0.5em" min="0" max="100" step="5" value="' + (settings.aspOpac ? settings.aspOpac : 40) + '">' +
        '<div class="legend aspect"' + (settings.layers.aspect ? ' style="display:flex"' : '') + '><div class="colors"></div><div class="labels"><div>N</div><div>NE</div><div>E</div><div>SE</div><div>S</div><div>SW</div><div>W</div><div>NW</div></div></div></div>' +*/
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="radar"' + (settings.layers.radar ? ' checked' : '') + '></div><div class="desc"><label>Weather Radar</label><span>Find where rain and snow are falling using Level II NEXRAD Radar data</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="fsadmin"' + (settings.layers.fsadmin ? ' checked' : '') + '></div><div class="desc"><label>USFS Boundaries</label><span>Find US Forest Service boundaries throughout the map</span></div></li>' +
        '</ul></div>';

    modal.innerHTML = l;
    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'Layers';

    modal.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + modal.querySelector('#avyOpac').value + '%, transparent ' + modal.querySelector('#avyOpac').value + '%)';
    /*modal.querySelector('#aspOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + modal.querySelector('#aspOpac').value + '%, transparent ' + modal.querySelector('#aspOpac').value + '%)';*/
}

function doContextMenu(e) {
    /* get information about the point the user clicked on */
    const distToPix = (miles, l, z) => {
        return (miles * 1609.34) / (40075017 * Math.cos(l * (Math.PI / 180)) / Math.pow(2, z + 8));
    };

    let dist = distToPix(20, e.lngLat.lat, map.getZoom()),
        features = '',
        query = map.queryRenderedFeatures([
            [e.point.x - dist, e.point.y - dist],
            [e.point.x + dist, e.point.y + dist]
        ]);

    if (query.length > 0) {
        let ca = cb = cc = cd = ce = cf = cg = 0,
            wild = [];

        query.forEach((f) => {
            /*console.log(f.layer.id, f.properties);*/

            if (f.layer.id == 'trails') {
                let icon;

                trailheads.forEach((t) => {
                    if (t.properties.trail_id == f.properties.trail_id) {
                        icon = smallIcon(t.properties.icon);
                    }
                });

                const dist = JSON.parse(f.properties.stats).distance;
                features += (ca == 0 ? '<h4>Trails</h4>' : '') + '<li data-tid="' + f.properties.trail_id + '" data-type="trail"><div><span class="feature-icon ' + icon + '"></span><label>' + f.properties.caption + '</label></div><div class="extra">' + dist.toFixed(1) + ' mi.</div></li>';
                ca++;
            }

            if (f.layer.id == 'trailheads') {
                const dist = JSON.parse(f.properties.stats).distance;
                features += (cb == 0 ? '<h4>Trailheads</h4>' : '') + '<li data-tid="' + f.properties.trail_id + '" data-type="th"><div><span class="feature-icon far fa-signs-post"></span><label>' + f.properties.title + '</label></div><div class="extra">' + dist.toFixed(1) + ' mi.</div></li>';
                cb++;
            }

            if (f.layer.id == 'poi-label') {
                if (f.properties.name.search('National Forest')) {
                    features += (cg == 0 ? '<h4>National Forest</h4>' : '') + '<li class="v"><div><span class="feature-icon fas fa-tree-large"></span><label>' + f.properties.name + '</label></div></li>';
                    cg++;
                } else if (f.properties.type == 'Camp Site' || f.properties.type == 'Chalet') {
                    const icon = (f.properties.type == 'Camp Site' ? 'fa-campground' : (f.properties.type == 'Chalet' ? 'fa-cabin' : ''));
                    features += (cc == 0 ? '<h4>Campgrounds</h4>' : '') + '<li><div><span class="feature-icon fas ' + icon + '"></span><label>' + f.properties.name + '</label></div></li>';
                    cc++;
                }
            }

            if (f.layer.id == 'water-line-label' || f.layer.id == 'water-point-label') {
                features += (cd == 0 ? '<h4>Water</h4>' : '') + '<li><div><span class="feature-icon fas fa-water"></span><label>' + f.properties.name + '</label></div><div class="extra">' + (f.properties.elevation_ft ? numberFormat(f.properties.elevation_ft) + ' ft.' : '') + '</div></li>';
                cd++;
            }

            if (f.layer.id == 'wilderness-fill' || f.layer.id == 'nps-parks') {
                features += (ce == 0 ? '<h4>Wilderness & National Parks</h4>' : '');

                if (f.layer.id == 'wilderness-fill' && !wild.includes(f.properties.NAME)) {
                    features += '<li class="v"><div><span class="feature-icon fas fa-trees"></span><label>' + f.properties.NAME + '</label></div><div class="extra">' + f.properties.Description + ' <a href="' + f.properties.URL + '" target="blank">Read more</a></div></li>';
                    wild.push(f.properties.NAME);
                }

                if (f.layer.id == 'nps-parks' && !wild.includes(f.properties.UNIT_NAME)) {
                    features += '<li class="v"><div><span class="feature-icon fas fa-trees"></span><label>' + f.properties.UNIT_NAME + ' (' + f.properties.STATE + ')</label></div><div class="extra"><a href="https://nps.gov/' + f.properties.UNIT_CODE.toLowerCase() + '" target="blank">Learn more about ' + f.properties.PARKNAME + '</a></div></li>';
                    wild.push(f.properties.UNIT_NAME);
                }
                ce++;
            }

            if (f.layer.id == 'natural-point-label') {
                features += (cf == 0 ? '<h4>Peaks</h4>' : '') + '<li><div><span class="feature-icon fas fa-' + (f.properties.maki == 'mountain' || f.properties.maki == 'volcano' ? 'mountain' : 'circle-info') + '"></span><label>' + f.properties.name + '</label></div><div class="extra">' + numberFormat(f.properties.elevation_ft) + ' ft.</div></li>';
                cf++;
            }
        });
    }

    modal.innerHTML = modalHeader + '<div class="content"><ul class="user-tracks"><li><div class="trk"><div id="ts" style="display:block;margin-top:0"><ol>' +
        '<li><div class="w">Coordinates</div><div class="v">' + e.lngLat.lat.toFixed(4) + ', ' + e.lngLat.lng.toFixed(4) + copyData.replace('{content}', e.lngLat.lat + ', ' + e.lngLat.lng) + '</div></li>' +
        '<li><div class="w">Elevation</div><div class="v">' + numberFormat(new Calculate().getElevation(e.lngLat.lat, e.lngLat.lng, 1)) + ' ft.</div></li>' +
        '</ol></div></div></li></ul>' + (features != '' ? '<h3 class="feat">Things Near Here</h3><ul class="features">' + features + '</ul>' : '') + '</div>';

    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'What\'s near here?';

    document.querySelectorAll('ul.features li').forEach((p) => {
        p.addEventListener('click', (f) => {
            if (p.getAttribute('data-type')) {
                trailheads.forEach((th) => {
                    if (th.properties.trail_id == p.getAttribute('data-tid')) {
                        if (p.getAttribute('data-type') == 'th') {
                            const c = th.properties.stats.geo.start;

                            map.easeTo({
                                center: [parseFloat(c[1]), parseFloat(c[0])],
                                zoom: map.getZoom()
                            });
                        } else {
                            const bounds = new mapboxgl.LngLatBounds(),
                                sw = th.properties.stats.bounds.sw,
                                ne = th.properties.stats.bounds.ne;

                            bounds.extend(new mapboxgl.LngLat(
                                sw[0], sw[1]
                            ));

                            bounds.extend(new mapboxgl.LngLat(
                                ne[0], ne[1]
                            ));

                            map.fitBounds(bounds);
                        }
                    }
                });
            }
        });
    });
}

function set3d(e, p, b) {
    map.setTerrain({
        'exaggeration': e
    })
        .setBearing(b != null ? b : 0)
        .setPitch(p != null ? p : 60)
        .setFog(fog);
}

async function init() {
    let options = [['filter', settings.category]];

    if (settings.activity) {
        options.push(['category', settings.activity.replace('-', ' ')]);
    }

    gi = await api(apiURL + 'trails/gis/display');
    theads = await api(apiURL + 'trails/list', options);

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: tiles[settings.tile],
        projection: 'mercator',
        hash: true,
        pitch: (settings.pitch ? settings.pitch : 0),
        bearing: (settings.bearing ? settings.bearing : 0),
        attributionControl: false,
        zoom: settings.zoom,
        center: [settings.center[1], settings.center[0]]
    }).on('contextmenu', (e) => {
        if (new Subscribe().hasPermissions()) {
            doContextMenu(e);
        }
    }).on('style.load', () => {
        document.querySelector('.loading').remove();

        icons.forEach((icon) => {
            if (!map.hasImage('icon-' + icon)) {
                map.loadImage(cdn + 'icons/' + icon + '.png', (error, image) => { if (error) throw error; map.addImage('icon-' + icon, image); });
            }
        });

        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
        }).setTerrain({
            source: 'mapbox-dem',
            exaggeration: 0
        });

        if (settings.toggle3d == '3d') {
            set3d(EXAGG, map.getPitch());
        }

        if (!map.getSource('avy')) {
            map.addSource('avy', {
                type: 'raster',
                tiles: ['https://www.mapotechnology.com/assets/images/tiles/4/{z}/{x}/{y}.png?force=1'],
                tileSize: 256,
                scheme: 'xyz'
            });
        }

        if (!map.getLayer('avalanche')) {
            map.addLayer({
                id: 'avalanche',
                type: 'raster',
                source: 'avy',
                layout: {
                    visibility: (settings.layers.avy && settings.category == 'snow' ? 'visible' : 'none')
                },
                paint: {
                    'raster-opacity': (settings.avyOpac ? settings.avyOpac / 100 : 0.4)
                }
            });
        }

        if (!map.getSource('fswms')) {
            map.addSource('fswms', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256,
                scheme: 'xyz'
            });
        }

        if (!map.getLayer('fswms')) {
            map.addLayer({
                id: 'fsadmin',
                type: 'raster',
                source: 'fswms',
                paint: {},
                layout: {
                    visibility: (settings.layers.fsadmin ? 'visible' : 'none')
                }
            });
        }
    }).on('load', () => {
        const ctr = map.getCenter();
        /*new Weather().getWeather([ctr.lng, ctr.lat], false);*/

        if (new Subscribe().hasPermissions()) {
            mbdraw();
        }

        const gtht = setTimeout(() => {
            if (theads !== undefined) {
                new Trails(false).getTHs();
                clearTimeout(gtht);
            }
        }, 500);

        if (settings.layers.snotel) {
            getSnotels();
        }

        if (settings.layers.contours) {
            new Trails().contours();
        }

        if (settings.layers.radar) {
            new Weather().radarInit();
        }
    }).on('movestart', () => {
        map.getCanvas().style.cursor = 'grabbing';
        startLat = map.getCenter().lat;
        startLon = map.getCenter().lng;
    }).on('moveend', () => {
        map.getCanvas().style.cursor = 'auto';
        /*new Weather().getWeather(map.getBounds());*/
    }).addControl(new mapboxgl.FullscreenControl({
        container: document.body
    })).addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
    })).addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    })).addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        })
    ).addControl(new RulerControl({
        units: 'mi'
    }));

    map.getCanvas().style.cursor = 'auto';

    /* add 2D/3D control */
    document.querySelector('.mapboxgl-ctrl-top-right').insertAdjacentHTML('beforeend', '<div class="mapboxgl-ctrl mapboxgl-ctrl-group">' +
        '<button id="toggle3d" data-type="' + (settings.toggle3d ? settings.toggle3d : '2d') + '" type="button" aria-label="Toggle 3D" aria-pressed="false">' + (settings.toggle3d ? (settings.toggle3d == '3d' ? '2D' : '3D') : '3D') + '</button></div>');

    /* add activities to activity filter */
    const theact = (settings.activity ? (settings.activity == 'atv' ? 'ATV' : ucwords(settings.activity.replace('-', ' '))) : 'all');

    activities.forEach((a) => {
        const k = Object.keys(a)[0],
            v = Object.values(a)[0],
            li = document.createElement('li');

        if (settings.activity && v == theact) {
            li.classList.add('active');
        }
        li.setAttribute('data-type', k);
        li.innerHTML = v;

        document.querySelector('ul.list[data-dd="activities"]').appendChild(li);
    });

    if (settings.activity) {
        document.querySelector('button[data-dd="activities"] .label').innerHTML = theact;
    } else {
        document.querySelectorAll('ul.list[data-dd="activities"] li').forEach((v) => {
            if (v.innerHTML == 'All Trail') {
                v.classList.add('active');
            }
        });
    }

    /* controls for custom dropdowns */
    document.querySelectorAll('.dropdown-button button').forEach((d) => {
        d.addEventListener('click', (e) => {
            const t = e.target.closest('button'),
                list = t.parentElement.querySelector('ul.list'),
                ar = t.querySelector('.arrow');

            if (t.classList.contains('expand')) {
                t.classList.remove('expand');
                list.style.display = 'none';
            } else {
                t.classList.add('expand');
                list.style.display = 'inline-flex';
            }
        });
    });

    document.querySelectorAll('.dropdown-button ul.list li').forEach((e) => {
        e.addEventListener('click', (t) => {
            const v = t.target.innerHTML,
                c = t.target.getAttribute('data-type'),
                dd = t.target.parentElement.getAttribute('data-dd'),
                b = document.querySelector('.dropdown-button button[data-dd="' + dd + '"]'),
                a = b.querySelector('.arrow');

            document.querySelectorAll('.dropdown-button ul.list li').forEach((e) => {
                e.classList.remove('active');
            });

            b.querySelector('.label').innerHTML = v;
            b.classList.remove('expand');
            t.target.classList.add('active');
            t.target.parentElement.style.display = 'none';

            if (dd == 'activities') {
                let url;
                if (v == 'All Trail' || v == 'All Snow') {
                    url = c;
                } else {
                    url = c + '/' + v.replace(' ', '-').toLowerCase();
                }

                window.location.href = host + url + (window.location.hash ? window.location.hash : '');
            }
        });
    });
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

function upload() {
    modal.innerHTML = uploadContent;
    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'Upload a File';
}

async function mbdraw() {
    if (localStorage.getItem('features') == null || localStorage.getItem('features') == '' || localStorage.getItem('uploads') == null || localStorage.getItem('uploads') == '') {
        const res = await api(host + 'api/v1/session/data');

        if (res.userMapObjects.features != null) {
            localStorage.setItem('features', atob(res.userMapObjects.features));
        }

        if (res.userMapObjects.uploads != null) {
            localStorage.setItem('uploads', atob(res.userMapObjects.uploads));
        }
    }

    map.loadImage(cdn + 'icons/user-icon-inactive.png', (error, image) => { if (error) throw error; map.addImage('userIconInactive', image); });
    map.loadImage(cdn + 'icons/user-icon.png', (error, image) => { if (error) throw error; map.addImage('userIcon', image); });

    loadScript('https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.js')
        .then(() => {
            /* load helper scripts asynchronously before allowing any drawing */
            loadScript(host + 'src/js/turf-' + settings.version[0] + '.js');
            loadScript(host + 'src/js/togeojson-' + settings.version[0] + '.js');

            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-draw/v1.4.3/mapbox-gl-draw.css';
            document.head.append(l);

            const ONG = '#f44f10',
                BLU = '#3bb2d0',
                colors = [
                    'case', ['==', ['get', 'user_color'], 'blue'], '#0000ff',
                    ONG
                ];

            Draw = new MapboxDraw({
                controls: {
                    point: true,
                    line_string: true,
                    polygon: true,
                    trash: true,
                    combine_features: false,
                    uncombine_features: false
                },
                userProperties: true,
                styles: [
                    {
                        id: 'gl-draw-polygon-fill-inactive',
                        type: 'fill',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Polygon'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'fill-color': colors,
                            'fill-outline-color': colors,
                            'fill-opacity': 0.2
                        }
                    },
                    {
                        id: 'gl-draw-polygon-fill-active',
                        type: 'fill',
                        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
                        paint: {
                            'fill-color': '#fbb03b',
                            'fill-outline-color': '#fbb03b',
                            'fill-opacity': 0.1
                        }
                    },
                    {
                        id: 'gl-draw-polygon-midpoint',
                        type: 'circle',
                        filter: ['all',
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'midpoint']],
                        paint: {
                            'circle-radius': 3,
                            'circle-color': BLU,
                            'circle-stroke-color': '#fff',
                            'circle-stroke-width': 2
                        }
                    },
                    {
                        id: 'gl-draw-polygon-stroke-inactive',
                        type: 'line',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Polygon'],
                            ['!=', 'mode', 'static']
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': colors,
                            'line-width': 3
                        }
                    },
                    {
                        id: 'gl-draw-polygon-stroke-active',
                        type: 'line',
                        filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#fbb03b',
                            'line-dasharray': [0.2, 2],
                            'line-width': 3
                        }
                    },
                    {
                        id: 'gl-draw-line-inactive',
                        type: 'line',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'LineString'],
                            ['!=', 'mode', 'static']
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': colors,
                            'line-width': 4
                        }
                    },
                    {
                        id: 'gl-draw-line-active',
                        type: 'line',
                        filter: ['all',
                            ['==', '$type', 'LineString'],
                            ['==', 'active', 'true']
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#fbb03b',
                            'line-dasharray': [0.2, 2],
                            'line-width': 3
                        }
                    },
                    {
                        id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
                        type: 'circle',
                        filter: ['all',
                            ['==', 'meta', 'vertex'],
                            ['==', '$type', 'Point'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'circle-radius': 5,
                            'circle-color': '#fff'
                        }
                    },
                    {
                        id: 'gl-draw-polygon-and-line-vertex-inactive',
                        type: 'circle',
                        filter: ['all',
                            ['==', 'meta', 'vertex'],
                            ['==', '$type', 'Point'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'circle-radius': 3,
                            'circle-color': '#fbb03b'
                        }
                    },
                    {
                        id: 'gl-draw-point-point-stroke-inactive',
                        type: 'circle',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'feature'],
                            ['!=', 'mode', 'static']
                        ],
                        paint: {
                            'circle-radius': 5,
                            'circle-opacity': 1,
                            'circle-color': '#fff'
                        }
                    },
                        /*{
                            id: 'gl-draw-point-inactive',
                            type: 'circle',
                            filter: ['all',
                                ['==', 'active', 'false'],
                                ['==', '$type', 'Point'],
                                ['==', 'meta', 'feature'],
                                ['!=', 'mode', 'static']
                            ],
                            paint: {
                                'circle-radius': 6,
                                'circle-color': ONG,
                                'circle-stroke-color': '#fff',
                                'circle-stroke-width': 2
                            }
                        }*/,
                    {
                        id: 'gl-draw-point-inactive',
                        type: 'symbol',
                        filter: ['all',
                            ['==', 'active', 'false'],
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'feature'],
                            ['!=', 'mode', 'static']
                        ],
                        layout: {
                            'icon-image': 'userIcon',
                            'icon-size': 0.5
                        }
                    },
                    {
                        id: 'gl-draw-point-stroke-active',
                        type: 'circle',
                        filter: ['all',
                            ['==', '$type', 'Point'],
                            ['==', 'active', 'true'],
                            ['!=', 'meta', 'midpoint']
                        ],
                        paint: {
                            'circle-radius': 8,
                            'circle-color': '#fff'
                        }
                    },
                    {
                        id: 'gl-draw-point-active',
                        type: 'circle',
                        filter: ['all',
                            ['==', '$type', 'Point'],
                            ['!=', 'meta', 'midpoint'],
                            ['==', 'active', 'true']],
                        paint: {
                            'circle-radius': 6,
                            'circle-color': BLU
                        }
                    },
                    {
                        id: 'gl-draw-polygon-fill-static',
                        type: 'fill',
                        filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
                        paint: {
                            'fill-color': '#404040',
                            'fill-outline-color': '#404040',
                            'fill-opacity': 0.1
                        }
                    },
                    {
                        id: 'gl-draw-polygon-stroke-static',
                        type: 'line',
                        filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#404040',
                            'line-width': 2
                        }
                    },
                    {
                        id: 'gl-draw-line-static',
                        type: 'line',
                        filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        paint: {
                            'line-color': '#404040',
                            'line-width': 2
                        }
                    }
                ]
            });

            if (!map.hasControl(Draw)) {
                map.addControl(Draw, 'top-right')
                    .on('draw.create', (e) => {
                        new Design(e).create()
                    })
                    .on('draw.delete', (e) => {
                        new Design(e).delete()
                    })
                    .on('draw.update', (e) => {
                        new Design(e).update()
                    });
            }
        });
}

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        new Subscribe().check();
        new Favorites().get();
    } else {
        /* initialize map */
        init();
        let done = false;

        if (settings.tid) {
            const intv = setInterval(() => {
                if (done) {
                    clearInterval(intv);
                } else {
                    if (trailheads.length > 0) {
                        done = true;

                        trailheads.forEach((f) => {
                            if (f.properties.trail_id == settings.tid) {
                                map.easeTo({
                                    center: [
                                        parseFloat(f.geometry.coordinates[0]),
                                        parseFloat(f.geometry.coordinates[1])
                                    ],
                                    zoom: 13,
                                    duration: 1500
                                }).on('moveend', () => {
                                    if (!tbLoad) {
                                        tbLoad = true;
                                        const query = map.queryRenderedFeatures({
                                            layers: ['trailheads']
                                        });

                                        if (query.length > 0) {
                                            query.forEach((t) => {
                                                if (t.properties.trail_id == settings.tid) {
                                                    new Trails().readTrail(t.properties);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            }, 500);
        }

        /* open layers menu */
        document.querySelector('#layer-group').onclick = () => {
            openLayers();
        };

        /* on login/account click */
        document.getElementById('account').onclick = () => {
            if (user.uid) {
                window.location.href = domain + 'account/home?ref=mapotrails';
            } else {
                window.location.href = domain + 'secure/login?service=mapotrails&next=' + encodeURIComponent(window.location.href);
            }
        };

        /* open basemap menu */
        document.getElementById('basemap').onclick = () => {
            let l = modalHeader + '<div class="content"><ul class="layers-list">';

            tileNames.forEach((n, c) => {
                let p = true;

                l += (p === true ? '<li><div class="radio"><input type="radio" class="basemap-option" name="bsmo" data-tile="' + n + '"' + (n == settings.tile ? ' checked' : '') + '></div><div class="desc"><label>' +
                    (n == 'caltopo' ? 'CalTopo' : (n == 'fs16' ? 'USFS 2016' : (n == 'osm' ? 'Open Street Map' : (n == 'outdoors' ? 'MAPO Outdoors' : ucwords(n))))) + '</label></div></li>' : '');
            });

            modal.innerHTML = l + '</ul></div>';
            modal.style.display = 'flex';
            modal.querySelector('#a').innerHTML = 'Basemaps';
        };

        /* open custom user content */
        document.getElementById('custom').addEventListener('click', () => {
            modal.innerHTML = userContent;
            modal.style.display = 'flex';
            modal.querySelector('#a').innerHTML = 'My Content';

            const to = setInterval(() => {
                if (Draw != null) {
                    const guc = new GetUserContent();
                    guc.getDraw();
                    guc.displayUploads();

                    clearInterval(to);
                }
            }, 100);
        });

        /* upload a file */
        document.getElementById('import').addEventListener('click', () => {
            upload();
        });

        /* sync map settings */
        document.querySelector('#save').onclick = (e) => {
            saveSession(false, true);
        };
    }
};

class CustomControls {
    constructor(id) {
        this.id = id;
    }

    /*blur(e) {
        const p = e.parentElement;

        e.style.display = 'none';
        p.querySelector('span').style.display = 'inline-flex';
        p.querySelector('.editFeature').style.display = 'block';
        p.querySelector('.saveFeature').style.display = 'none';
    }*/

    async toggle(checked, s) {
        const ts = document.querySelector('.user-tracks li[data-id="' + this.id + '"] #ts');

        ts.style.display = (checked ? 'block' : 'none');

        if (checked) {
            let feature,
                bounds,
                type,
                coords;

            JSON.parse(localStorage.getItem(s)).forEach((f) => {
                if (this.id == f.id) {
                    feature = {
                        id: f.id,
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: f.type,
                            coordinates: f.coords
                        }
                    };

                    if (f.type != 'Point') {
                        bounds = new mapboxgl.LngLatBounds(
                            (f.type == 'LineString' ? f.coords[0] : f.coords[0][0]),
                            (f.type == 'LineString' ? f.coords[0] : f.coords[0][0])
                        );

                        for (const coord of (f.type == 'LineString' ? f.coords : f.coords[0])) {
                            bounds.extend(coord);
                        }
                    }

                    type = f.type;
                    coords = f.coords;
                }
            });

            Draw.add(feature);

            if (type == 'Point') {
                map.easeTo({
                    center: coords,
                    zoom: 15
                });
            } else {
                map.fitBounds(bounds, {
                    padding: 100
                });
            }
        } else {
            Draw.delete(this.id)
        }
    }

    edit() {
        const h = document.querySelector('.user-tracks li[data-id="' + this.id + '"] h6'),
            i = h.querySelector('input'),
            f = h.querySelector('.editFeature'),
            j = h.querySelector('.saveFeature');

        i.style.display = 'inline-flex';
        i.focus();
        i.selectionStart = i.value.length;
        i.selectionEnd = i.value.length;
        h.querySelector('span').style.display = 'none';
        f.style.display = 'none';
        j.style.display = 'block';
    }

    generate(e) {
        e.classList.add('btn-black', 'disabled');
        e.classList.remove('btn-orange');
        e.innerHTML = 'Processing...';

        let arr = [],
            feat = null;

        JSON.parse(localStorage.getItem('uploads')).forEach((f) => {
            if (f.id == this.id) {
                f.stats = new Design().stats(f.type, f.coords);
                feat = f;
            }
            arr.push(f);
        });

        const par = document.querySelector('.user-tracks li[data-id="' + this.id + '"]'),
            ol = par.querySelector('ol'),
            guc = new GetUserContent(feat);

        ol.innerHTML = guc.getStats();

        if (feat.type != 'Point') {
            par.setAttribute('data-points', feat.stats.points);
        }

        if (feat.type == 'LineString') {
            ol.insertAdjacentHTML('afterend', slopeRose.replace('{{slopeRoseID}}', this.id));
            par.setAttribute('data-aspect', guc.slopeRose());
            guc.drawSlopeRose()
        }

        new Design(null).save(arr, true);
    }

    /*async rename() {
        const h = document.querySelector('.user-tracks.uploads li[data-id="' + this.id + '"] h6'),
            dt = h.parentElement.querySelector('.dt'),
            i = h.querySelector('input'),
            f = h.querySelector('.editFeature'),
            j = h.querySelector('.saveFeature'),
            mod = Math.round(new Date().getTime() / 1000);

        i.style.display = 'none';
        h.querySelector('span').innerHTML = i.value;
        dt.innerHTML = 'Modified ' + timeAgo(mod);
        h.querySelector('span').style.display = 'block';
        f.style.display = 'block';
        j.style.display = 'none';

        await api('https://www.mapotrails.com/api/v1/upload/rename', [['fid', this.id], ['n', i.value]]);
    }*/

    save(w) {
        const h = document.querySelector('.user-tracks li[data-id="' + this.id + '"] h6'),
            dt = h.parentElement.querySelector('.dt'),
            i = h.querySelector('input'),
            f = h.querySelector('.editFeature'),
            j = h.querySelector('.saveFeature'),
            mod = Math.round(new Date().getTime() / 1000);

        let arr = [],
            create;

        JSON.parse(localStorage.getItem(w)).forEach((f) => {
            if (f.id == this.id) {
                create = f.created;
                f.name = i.value;
                f.modified = mod;
            }
            arr.push(f);
        });

        new Design(null).save(arr, true);

        i.style.display = 'none';
        h.querySelector('span').innerHTML = i.value;
        dt.innerHTML = 'Modified ' + timeAgo(mod);
        h.querySelector('span').style.display = 'block';
        f.style.display = 'block';
        j.style.display = 'none';
    }

    chart(s) {
        if (typeof Chart !== undefined) {
            const c = this;

            loadScript('https://cdn.jsdelivr.net/npm/chart.js')
                .then(() => {
                    c.createChart(s);
                });
        } else {
            this.createChart(s);
        }
    }

    createChart(s) {
        let stats,
            name,
            times = [],
            elev = [],
            dist = [];

        document.body.insertAdjacentHTML('beforeend', '<div id="chart"><span class="fat fa-xmark closeChart"></span><canvas style="max-height:320px!important"></canvas>' +
            '<a href="#" id="downloadChart" class="btn disabled btn-sm btn-gray centered" style="margin-bottom:0"><i class="fas fa-download"></i>Download Chart</a></div>');

        JSON.parse(localStorage.getItem(s)).forEach((f) => {
            if (f.id == this.id) {
                stats = f.stats;
                name = f.name;
                times = [f.created, f.modified];
                /*const coords = (f.type == 'Polygon' ? f.coords[0] : f.coords);*/
                const coords = (f.coords.length == 1 ? f.coords[0] : f.coords);

                for (let i = 0; i < coords.length; i++) {
                    dist.push(new Calculate().distance(coords[0][1], coords[0][0], coords[i][1], coords[i][0]).toFixed(1));
                }
            }
        });

        stats.elevation.points.forEach((e, n) => {
            elev.push(e);
        });

        const minE = Math.min.apply(null, elev),
            maxE = Math.max.apply(null, elev),
            v = (maxE - minE > 1000 ? 500 : 100),
            minYScale = Math.floor((minE - v) / v) * v,
            maxYScale = Math.ceil((maxE + v) / v) * v;

        const eChart = new Chart(document.querySelector('#chart canvas'), {
            type: 'line',
            data: {
                labels: dist,
                datasets: [{
                    label: 'Elevation',
                    data: elev,
                    fill: false,
                    borderColor: '#83b692',
                    tension: 0.1
                }]
            },
            plugins: [
                {
                    id: 'customCanvasBackgroundColor',
                    beforeDraw: (chart, args, options) => {
                        const { ctx } = chart;
                        ctx.save();
                        ctx.globalCompositeOperation = 'destination-over';
                        ctx.fillStyle = options.color;
                        ctx.fillRect(0, 0, chart.width, chart.height);
                        ctx.restore();
                    }
                }
            ],
            options: {
                animation: {
                    onComplete: () => {
                        chartpng = eChart.toBase64Image();
                        const dc = document.querySelector('#downloadChart');

                        dc.classList.add('btn-black');
                        dc.classList.remove('disabled', 'btn-gray');
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    customCanvasBackgroundColor: {
                        color: '#fff',
                    },
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Elevation Profile for ' + name,
                        font: {
                            family: 'Roboto',
                            weight: 'bold',
                            size: 18
                        },
                        color: '#00385c'
                    },
                    subtitle: {
                        display: true,
                        text: (times[0] != times[1] ? 'Modified ' + timeAgo(times[1]).replace('&nbsp;', ' ') + ' · ' : '') + 'Created ' + prettyDT(times[0]),
                        font: {
                            family: 'Roboto',
                            size: 12
                        },
                        color: '#656565',
                        padding: {
                            top: 0,
                            bottom: 10
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#fff',
                        titleColor: '#000',
                        bodyColor: '#000',
                        titleFont: {
                            family: 'Roboto',
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: 'Roboto'
                        },
                        padding: 10,
                        cornerRadius: 4,
                        borderColor: '#042a0b',
                        borderWidth: '1',
                        callbacks: {
                            title: function () {
                                return 'Track Point';
                            },
                            label: function (context) {
                                return ['Distance: ' + context.label + ' mi.', 'Elevation: ' + numberFormat(context.parsed.y) + ' ft.'];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Distance (mi)',
                            font: {
                                family: 'Roboto',
                                size: 12,
                                style: 'italic'
                            },
                            color: '#999'
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return numberFormat(value, 1) + ' mi';
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Elevation (ft)',
                            font: {
                                family: 'Roboto',
                                size: 12,
                                style: 'italic'
                            },
                            color: '#999'
                        },
                        beginAtZero: false,
                        min: minYScale,
                        max: maxYScale,
                        ticks: {
                            callback: (value) => {
                                return numberFormat(value, 0) + ' ft';
                            }
                        }
                    }
                }
            }
        });
    }

    saveNotes(e, s) {
        let arr = [],
            notes = document.querySelector('#notes-' + this.id).value;

        if (notes != '') {
            e.classList.add('disabled');
            e.innerHTML = 'Saved!';

            setTimeout(() => {
                e.classList.remove('disabled');
                e.innerHTML = 'Save';
            }, 3000);

            JSON.parse(localStorage.getItem(s)).forEach((f) => {
                if (f.id == this.id) {
                    f.modified = Math.round(new Date().getTime() / 1000);
                    f.notes = notes;
                }

                arr.push(f);
            });

            new Design(null).save(arr, s == 'uploads' ? true : false);
        }
    }

    delete(e) {
        const type = e.getAttribute('data-type'),
            store = e.getAttribute('data-store');

        if (confirm('Are you sure you want to delete this ' + type + '?')) {
            /*document.querySelector('.user-tracks h3.fileName[data-id="' + this.id + '"]').remove();*/
            document.querySelector('.user-tracks li[data-id="' + this.id + '"]').remove();

            if (store == 'uploads') {
                document.querySelector('.user-tracks h3.fileName[data-id="' + this.id + '"]').remove();
            }

            Draw.delete(this.id);
            new Design(null).delete(this.id, store);

            notify('success', 'That ' + type + ' has been deleted.');
        }
    }

    /*download(m) {
        let file = document.createElement('a');
        file.setAttribute('href', cdn + 'userGIS/' + fn);
        file.setAttribute('download', fn);
        file.style.display = 'none';
        document.body.appendChild(file);
        file.click();
        document.body.removeChild(file);

        return true;
    }*/

    export(mode, store) {
        let feats = [],
            statData = {},
            name = 'my_mapotrails_' + (store == 'uploads' ? 'uploads' : 'content');

        JSON.parse(localStorage.getItem(store)).forEach((f) => {
            if ((mode == 'single' && f.id == this.id) || mode != 'single') {
                const con = {
                    type: 'Feature',
                    geometry: {
                        type: f.type,
                        coordinates: f.coords
                    },
                    properties: {
                        attribution: 'Created using Map-o-Trails (mapotrails.com)',
                        created: prettyDT(f.created, false, true),
                        id: f.id,
                        modified: prettyDT(f.modified, false, true),
                        name: f.name,
                        notes: f.notes
                    }
                };

                /* if user is a premium user, they can download the stats too */
                if (new Subscribe().hasPermissions()) {
                    if (f.type == 'Point') {
                        statData = {
                            elevation: f.stats.elevation + ' feet',
                            aspect: {
                                degrees: parseFloat(f.stats.aspect),
                                bearing: new Calculate().getCompassDirection(f.stats.aspect)
                            },
                            slope: f.stats.slope + '°'
                        };
                    } else {
                        const elev = {
                            change: {
                                gain: f.stats.elevation.height.gain + ' feet',
                                loss: f.stats.elevation.height.loss + ' feet'
                            },
                            profile: {
                                minimum: f.stats.elevation.computed.min + ' feet',
                                average: f.stats.elevation.computed.avg + ' feet',
                                maximum: f.stats.elevation.computed.max + ' feet'
                            }
                        };

                        statData = {
                            points: f.stats.points,
                            average_aspect: {
                                degrees: parseFloat(f.stats.aspect.avg),
                                bearing: new Calculate().getCompassDirection(f.stats.aspect)
                            },
                            slope: {
                                minimum: f.stats.slope.min + '°',
                                average: f.stats.slope.avg + '°',
                                maximum: f.stats.slope.max + '°'
                            }
                        };

                        if (f.type == 'LineString') {
                            statData.distance = f.stats.distance + ' miles';
                            statData.elevation = elev;
                        } else {
                            statData.perimeter = {
                                distance: f.stats.distance + ' miles',
                                elevation: elev
                            };
                        }
                    }
                }

                con.properties.stats = statData;

                /* if downloading a feature that was uploaded */
                if (store == 'uploads') {
                    con.properties.upload = {
                        file: f.file.file,
                        name: f.file.name,
                        type: f.file.type
                    };
                }

                feats.push(con);

                if (mode == 'single') {
                    name = f.id;
                }
            }
        });

        const data = {
            type: 'FeatureCollection',
            created: prettyDT(new Date().getTime() / 1000, false, true),
            features: feats
        };

        let file = document.createElement('a');
        file.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
        file.setAttribute('download', name + '.geojson');
        file.style.display = 'none';
        document.body.appendChild(file);
        file.click();
        document.body.removeChild(file);

        return true;
    }
}

window.onload = () => {
    if (window.location.search.search('logout=1') >= 0) {
        history.pushState({}, '', document.location.href.replace('?logout=1', ''));
    }

    /* remove weather icon after fonts have loaded */
    document.querySelector('body i.wi').remove();

    /* save settings automatically after the first minute, then every 5 minutes */
    setTimeout(() => {
        saveSession(true, true);

        setInterval(() => {
            saveSession(true, true);
        }, 300000);
    }, 600000);
};

/* custom tooltips */
window.addEventListener('mouseover', (e) => {
    let el;

    if (e.target.classList.contains('ttip')) {
        el = e.target;
    } else if (e.target.parentElement.classList.contains('ttip')) {
        el = e.target.parentElement;
    }

    if (el) {
        const rect = el.getBoundingClientRect(),
            data = JSON.parse(el.getAttribute('data-tooltip')),
            tip = document.createElement('div');

        tip.style.top = rect.top + 'px';
        tip.style.left = rect.right + 'px';
        tip.classList.add('tooltip', data.dir);
        tip.innerHTML = '<p>' + data.text + '</p>';
        document.body.appendChild(tip);
    }
});

window.addEventListener('mouseout', () => {
    document.querySelectorAll('.tooltip').forEach((t) => {
        t.remove();
    });
});

/* search trails and cities control */
window.addEventListener('keyup', debounce((e) => {
    if (e.target.id == 'q') {
        let userSearch = async (q) => {
            let query = q.toLowerCase(),
                count = 0,
                results = document.querySelector('#search-results'),
                theseStates = ['OR', 'WA', 'ID', 'CA', 'UT', 'AZ'];

            if (query.length > 0) {
                trailheads.forEach((t) => {
                    let use = false,
                        title = t.properties.title.toLowerCase(),
                        p = title.split(' '),
                        dist = (t.properties.stats.distance ? t.properties.stats.distance.toFixed(1) : 'N/A'),
                        gain = (t.properties.stats.altitude ? t.properties.stats.altitude.gain.toFixed(1) : 'N/A');

                    for (let i = 0; i < p.length; i++) {
                        if (p[i].search(query) >= 0) {
                            use = true;
                        }
                    }

                    if (title.search(query) >= 0) {
                        use = true;
                    }

                    if (use) {
                        let icon = smallIcon(t.properties.icon);
                        const li = document.createElement('li');

                        li.setAttribute('data-tid', t.properties.trail_id);
                        li.setAttribute('data-type', 'trail');
                        li.innerHTML = '<span class="icon ' + (icon ? icon : 'none') + '"></span><h3>' + t.properties.title + '<span><b>Distance:</b> ' + dist + ' mi. &middot; <b>Elev. Gain:</b> ' + gain + ' ft.</span></h3>';
                        results.appendChild(li);
                        count++;
                    }
                });

                if (query.length >= 3) {
                    const search = await api(apiURL + 'search', [['q', query], ['citiesonly', 1]]);

                    if (search.rs != null && search.rs.length > 0) {
                        search.rs.forEach((p) => {
                            const st = (/,\s([A-Z][A-Z])\s/gm).exec(p.name)[1];

                            if (theseStates.includes(st)) {
                                const li = document.createElement('li');

                                li.setAttribute('data-lat', p.lat);
                                li.setAttribute('data-lon', p.lon);
                                li.setAttribute('data-type', 'city');
                                li.innerHTML = '<span class="icon fas fa-city"></span><h3>' + p.name.split(',')[0] + '<span>' + p.county + ' County &middot; ' + states[st] + '</span></h3>';
                                results.appendChild(li);
                                count++;
                            }
                        });
                    }
                }
            } else {
                results.querySelector('li.standby i').style.display = 'none';
                results.querySelector('li.standby span').innerHTML = 'No results found';
            }

            if (count == 0) {
                results.querySelector('li.standby i').style.display = 'none';
                results.querySelector('li.standby span').innerHTML = 'No results found';
            } else {
                results.querySelector('li.standby').style.display = 'none';
            }
        };

        userSearch(e.target.value);
    }
}, 1200));

window.addEventListener('keydown', (e) => {
    if (e.target.id == 'q') {
        if (!e.ctrlKey && !e.altKey && e.key != 'Enter' && e.key != 'Shift') {
            const results = document.querySelector('#search-results');

            if (results.style.display == '' || results.style.display == 'none') {
                results.style.display = 'flex';
            }

            if (results.querySelector('li.standby').style.display != 'inline-flex') {
                document.querySelectorAll('#search-results li:not(.standby)').forEach((li) => {
                    li.remove();
                });

                results.querySelector('li.standby').style.display = 'inline-flex';
            }

            results.querySelector('li.standby i').style.display = 'block';
            results.querySelector('li.standby span').innerHTML = 'Searching...';
        }
    }
});

window.addEventListener('click', (e) => {
    const t = e.target,
        sr = document.querySelector('#search-results');

    /* open dropdown nav menu */
    if (t.id == 'menuIcon' || t.id == 'dd-close') {
        document.querySelector('nav').classList.toggle('open');
    }

    /* pause of play radar */
    if (t.classList.contains('radarControl')) {
        const c = document.querySelector('.radarControl');

        if (radarPlay) {
            clearInterval(radarAnim);
            c.classList.remove('fa-pause');
            c.classList.add('fa-play');
            radarPlay = false;
        } else {
            let counter = document.querySelector('.radar input[type=range]').value,
                ra = () => {
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

            c.classList.add('fa-pause');
            c.classList.remove('fa-play');
            radarPlay = true;
        }
    }

    /* shrink or expand navbar */
    if (t.id == 'close-navbar') {
        if (t.getAttribute('data-open') == '1') {
            t.setAttribute('data-open', '0');
            t.classList.remove('fa-chevron-left');
            t.classList.add('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '40px');
            document.querySelector('nav').classList.add('hide');
        } else {
            t.setAttribute('data-open', '1');
            t.classList.add('fa-chevron-left');
            t.classList.remove('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '100px');
            document.querySelector('nav').classList.remove('hide');
        }
    }

    /* download a PNG of a created chart */
    if (t.id == 'downloadChart' && !t.classList.contains('disabled')) {
        let file = document.createElement('a');

        file.setAttribute('href', chartpng);
        file.setAttribute('download', 'mapotrails-chart_' + timeString() + '.png');
        file.style.display = 'none';
        document.body.appendChild(file);
        file.click();
        document.body.removeChild(file);
    }

    /* user custom content controls */
    if (document.querySelector('.user-tracks') && document.querySelector('.user-tracks').contains(t) ||
        document.querySelector('.user-tracks.uploads') && document.querySelector('.user-tracks.uploads').contains(t)) {
        const ctrl = new CustomControls(t.parentElement.getAttribute('data-id'));

        /* edit */
        if (t.classList.contains('editFeature')) {
            ctrl.edit();
        }

        /* save */
        if (t.classList.contains('saveFeature')) {
            ctrl.save(t.getAttribute('data-type'));
        }

        /* generate stats */
        if (t.classList.contains('generateStats')) {
            new CustomControls(t.getAttribute('data-id')).generate(t);
        }

        /* chart */
        if (t.classList.contains('chartFeature')) {
            ctrl.chart(t.getAttribute('data-type'));
        }

        /* export */
        if (t.classList.contains('exportFeature')) {
            const s = t.getAttribute('data-store'),
                m = t.getAttribute('data-mode');

            ctrl.export(m, s);
        }

        /* delete feature */
        if (t.classList.contains('deleteFeature')) {
            ctrl.delete(t);
        }

        /* save notes to feature */
        if (t.classList.contains('saveNotes')) {
            new CustomControls(t.getAttribute('data-id')).saveNotes(t, t.getAttribute('data-type'));
        }
    }

    /* export */
    if (t.classList.contains('exportAllFeatures')) {
        const s = t.getAttribute('data-store'),
            m = t.getAttribute('data-mode');

        new CustomControls(null).export(m, s);
    }

    /* copy text to clipboard */
    if (t.classList.contains('copyData')) {
        navigator.clipboard.writeText(t.getAttribute('data-content'));
    }

    /* close chart modal */
    if (t.classList.contains('closeChart')) {
        chartpng = '';
        document.querySelector('#chart').remove();
    }

    /* weather badge click to open full weather details in modal */
    /*if (document.querySelector('#weather').contains(t)) {
        if (curWX) {
            let lat, lon;

            if (curWX) {
                lat = curWX.lat;
                lon = curWX.lon;
            } else {
                const c = map.getCenter();
                lat = c.lat;
                lon = c.lng;
            }

            new Weather().getNWSFcst(parseFloat(lat).toFixed(4), parseFloat(lon).toFixed(4));

            modal.innerHTML = weather;

            if (modal.style.display != 'flex') {
                modal.style.display = 'flex';
            }

            modal.querySelector('#a').innerHTML = (curLoc ? curLoc : curWX.name);
            new Weather().displayCurCond();
        } else {
            notify('error', 'Unable to get weather conditions & forecast just yet.');
        }
    }*/

    /* tab controls */
    if (t.classList.contains('li-tab') || (t.parentElement && t.parentElement.classList.contains('li-tab'))) {
        const tab = t.getAttribute('rel');

        document.querySelectorAll('.li-tab').forEach((p) => {
            if (p.getAttribute('rel') == tab) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach((p) => {
            if (p.getAttribute('data-tab') == tab) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });
    }

    /* on search result click */
    if (sr.style.display != 'none' && t.closest('li') != null && t.closest('li').parentElement.id == 'search-results') {
        const p = t.closest('li'),
            type = p.getAttribute('data-type'),
            tid = p.getAttribute('data-tid');

        if (type == 'trail') {
            trailheads.forEach((t) => {
                if (t.properties.trail_id == tid) {
                    map.easeTo({
                        center: new mapboxgl.LngLat(t.geometry.coordinates[0], t.geometry.coordinates[1]),
                        zoom: 13
                    });

                    let prop = t.properties;

                    if (prop.stats instanceof Object) {
                        prop.category = JSON.stringify(prop.category);
                        prop.keywords = JSON.stringify(prop.keywords);
                        prop.photo = JSON.stringify(prop.photo);
                        prop.stats = JSON.stringify(prop.stats);
                    }

                    new Trails().readTrail(prop);
                }
            });
        } else {
            const lat = p.getAttribute('data-lat'),
                lon = p.getAttribute('data-lon');

            map.easeTo({
                center: new mapboxgl.LngLat(lon, lat),
                zoom: 12
            });
        }

        sr.style.display = 'none';
    }

    /* favorite a trail */
    if (t.id == 'favTrail') {
        new Favorites().fav(t);
    }

    /* toggle 3D mapping */
    if (t.id == 'toggle3d') {
        const p = map.getPitch(),
            b = map.getBearing();

        if (t.getAttribute('data-type') == '2d') {
            set3d(EXAGG, p, map.getBearing());

            t.setAttribute('data-type', '3d');
            t.innerHTML = '2D';
        } else {
            set3d(0, 0, 0);

            t.setAttribute('data-type', '2d');
            t.innerHTML = '3D';
        }
    }

    /* hide search results if outside search result container */
    if (!t.contains(document.querySelector('#search-results')) && !t.contains(document.querySelector('#q'))) {
        document.querySelector('#search-results').style.display = 'none';
        document.querySelector('#q').value = '';

        document.querySelectorAll('#search-results li:not(.standby)').forEach((li) => {
            li.remove();
        });
    }

    /* hide any dropdown menus when user clicks outside of them */
    document.querySelectorAll('.dropdown-button').forEach((d) => {
        if (!d.contains(t)) {
            const l = d.querySelector('ul.list');

            if (l.style.display == 'inline-flex') {
                d.querySelector('.dd').classList.remove('expand');
                l.style.display = 'none';
            }
        }
    });
});

window.addEventListener('change', async (e) => {
    const t = e.target;

    /* user created GEOJSON features, toggle on/off with checkbox */
    if (t.classList.contains('toggleUF')) {
        new CustomControls(t.getAttribute('data-id')).toggle(t.checked, t.getAttribute('data-type'));
    }

    /* control layers displayed on map */
    if (t.classList.contains('layer-option')) {
        const layer = t.getAttribute('data-layer');

        settings['layers'][layer] = t.checked;
        saveSession(true, false);

        /* avalanche shading overlay */
        if (layer == 'trailheads' || layer == 'trails' || layer == 'waypoints' || layer == 'fsadmin') {
            map.setLayoutProperty(layer, 'visibility', (t.checked ? 'visible' : 'none'));
        } else if (layer == 'snotel') {
            if (map.getLayer('snotels')) {
                map.setLayoutProperty('snotels', 'visibility', (t.checked ? 'visible' : 'none'));
            } else {
                getSnotels();
            }
        } else if (layer == 'contours') {
            if (map.getLayer('contours')) {
                map.setLayoutProperty('contours', 'visibility', (t.checked ? 'visible' : 'none'));
                map.setLayoutProperty('contours-text', 'visibility', (t.checked ? 'visible' : 'none'));
            } else {
                if (t.checked) {
                    new Trails().contours();
                }
            }
        } else if (layer == 'radar') {
            const wx = new Weather();

            if (t.checked) {
                if (map.getLayer('radar-layer-0')) {
                    wx.radar();
                } else {
                    wx.radarInit();
                }
            } else {
                clearInterval(radarAnim);
                radarImgs.forEach((e, n) => {
                    map.setLayoutProperty('radar-layer-' + n, 'visibility', 'none');
                });
                document.querySelector('.radar').remove();
            }
        } else if (layer == 'avy') {
            map.setLayoutProperty('avalanche', 'visibility', (t.checked ? 'visible' : 'none'));
            document.querySelector('.legend.avy').style.display = (t.checked ? 'flex' : 'none');
            document.querySelector('#avyOpac').style.display = (t.checked ? 'block' : 'none');
        }
    }

    /* change basemap */
    if (t.classList.contains('basemap-option')) {
        const tile = t.getAttribute('data-tile');

        map.setStyle(tiles[tile], {
            diff: false
        }).on('style.load', () => {
            const t = new Trails();

            t.getTHs();

            if (settings.layers.contours) {
                t.contours();
            }

            /*if (settings.layers.contours) {
                map.setPaintProperty('contours', 'line-color', (tile == 'satellite' ? '#ccc' : '#877b59'));
                map.setPaintProperty('contours-text', 'text-color', (tile == 'satellite' ? '#fff' : '#626250'));
            }*/
        });

        settings.tile = tile;
        saveSession(true, false);
    }

    /* upload a file */
    if (t.name == 'file') {
        let form = document.querySelector('form#fileUpload'),
            u = form.querySelector('.uploading'),
            p = form.querySelector('#progress'),
            ps = p.querySelector('span'),
            request = new XMLHttpRequest(),
            fd = new FormData(form);

        t.style.display = 'none';
        u.style.display = 'flex';
        p.style.display = 'block';

        /* remove any existing error messages */
        if (document.querySelector('#modal .message')) {
            document.querySelector('#modal .message').remove();
        }

        /* let files = document.querySelector('form#fileUpload input[type=file]').files[0];
        const up = await api(host + 'api/v1/upload/do', [['file', files]]);*/

        fd.append('key', apiKey);
        request.open('POST', form.action);

        request.upload.addEventListener('progress', (e) => {
            const prog = Math.round((e.loaded / e.total) * 100);

            if (prog >= 7) {
                if (ps.style.display == 'none') {
                    ps.style.display = 'block';
                }
                ps.innerHTML = prog + '%';
                ps.style.width = prog + '%';
            }

            if (prog == 100) {
                p.style.background = '#25b350';
            } else {
                p.style.background = 'linear-gradient(to right, var(--blue), var(--blue) ' + prog + '%, #e6e8ec ' + prog + '%)';
            }
        });

        request.onreadystatechange = async () => {
            if (request.readyState == 4 && request.status == 200) {
                form.querySelector('#progress').style.display = 'none';
                const up = JSON.parse(request.responseText);

                /* if there was an error uploading, otherwise process file */
                if (up.error) {
                    modal.querySelector('form').insertAdjacentHTML('beforebegin', '<p class="message error">' + up.error + '</p>');
                    u.style.display = 'none';
                    modal.querySelector('input[name=file]').style.display = 'block';
                    modal.querySelector('input[name=file]').value = '';
                } else if (up.success == 1) {
                    const m = u.innerHTML;
                    u.innerHTML = m.replace('Uploading your file', 'Processing GIS data');

                    await fetch(cdn + 'userGIS/' + up.file)
                        .then(async (resp) => {
                            let data,
                                stop = false,
                                details,
                                content = await resp.text();

                            /* conver the user's uploaded file into geojson */
                            if (up.type == 'json' || up.type == 'geojson') {
                                data = JSON.parse(content);
                            } else {
                                const xmlDoc = (new DOMParser()).parseFromString(content, 'text/xml');

                                if (up.type == 'gpx') {
                                    data = toGeoJSON.gpx(xmlDoc);
                                } else if (up.type == 'kml') {
                                    data = toGeoJSON.kml(xmlDoc);
                                }
                            }

                            for (let i = 0; i < data.features.length; i++) {
                                if (data.features[i].geometry.type == 'GeometryCollection') {
                                    stop = true;
                                }
                            }

                            if (stop) {
                                form.insertAdjacentHTML('beforebegin', '<p class="message error">This file contains a geometry collection. Unfortunately, we don\'t support that type of data right now.</p>');
                                form.querySelector('.uploading').style.display = 'none';
                                form.querySelector('input[name=file]').style.display = 'block';
                                form.querySelector('input[name=file]').value = '';
                            } else {
                                delete up['metadata'];
                                delete up['success'];
                                new Design(data).createFromUpload(up);

                                modal.innerHTML = userContent;
                                modal.style.display = 'flex';
                                modal.querySelector('#a').innerHTML = 'My Content';

                                modal.querySelector('.li-tab[rel=draw]').classList.remove('active');
                                modal.querySelector('.tab-content[data-tab=draw]').classList.remove('active');
                                modal.querySelector('.li-tab[rel=uploads]').classList.add('active');

                                modal.querySelector('.tab-content[data-tab=uploads]').innerHTML = '<div style="text-align:center"><div class="spinner"></div><span style="display:block;margin-top:0.5em">Loading your content...</span></div>';
                                modal.querySelector('.tab-content[data-tab=uploads]').classList.add('active');

                                const guc = new GetUserContent();

                                guc.displayUploads();
                                guc.getDraw();
                            }

                            /* save everything that's happened up until this point */
                            saveSession(true, false);
                        });
                }
            }
        };

        request.send(fd);


        /*if (up.success == 1) {
            modal.innerHTML = userContent;
            modal.style.display = 'flex';
            modal.querySelector('#a').innerHTML = 'My Content';

            modal.querySelector('.li-tab[rel=draw]').classList.remove('active');
            modal.querySelector('.tab-content[data-tab=draw]').classList.remove('active');
            modal.querySelector('.li-tab[rel=uploads]').classList.add('active');

            modal.querySelector('.tab-content[data-tab=uploads]').innerHTML = '<div style="text-align:center"><div class="spinner"></div><span style="display:block;margin-top:0.5em">Loading your content...</span></div>';
            modal.querySelector('.tab-content[data-tab=uploads]').classList.add('active');

            const guc = new GetUserContent();

            guc.getDraw();
        } else {
            document.querySelector('form#fileUpload input[type=file]').style.display = 'block';
            document.querySelector('form#fileUpload input[type=file]').parentElement.insertAdjacentHTML('afterbegin', '<p class="message error">' + up.error + '</p>');
            document.querySelector('form#fileUpload .uploading').style.display = 'none';
        }*/
    }
});

/* avy opacity slider on input */
window.addEventListener('input', (e) => {
    if (e.target.id == 'avyOpac') {
        document.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + e.target.value + '%, transparent ' + e.target.value + '%)';
        settings.avyOpac = e.target.value;
        map.setPaintProperty('avalanche', 'raster-opacity', e.target.value / 100);
        settings.avyOpac = e.target.value;
    }
});