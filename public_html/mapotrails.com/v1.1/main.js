var map,
    subscribe,
    host = 'https://www.mapotrails.com/',
    cdn = 'https://cdn.mapotrails.com/',
    domain = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    key = (window.location.host == 'localhost' ? 'bG9jYWxob3N0' : 'cf707f0516e5c1226835bbf0eece4a0c'),
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    attrib = '&copy; ' + new Date().getFullYear() + ' MAPO LLC',
    category,
    activity,
    area,
    unique,
    wyp = false,
    tiles,
    osm,
    terrain,
    caltopo,
    shading,
    avy,
    slope,
    aspectLayer,
    elevationShading,
    fs16,
    satellite,
    outdoors,
    usfs,
    fsrds,
    gnis,
    pls,
    snotel,
    typeTimer,
    curSel,
    curWX,
    ttipTimer,
    ylc,
    ylm,
    hideGIS = false,
    isChartJS = false,
    elevProfile,
    startLat,
    startLon,
    context,
    mapPMLoaded = false,
    USE_CACHING = false,
    GIS_TIDS = 'GIS_TIDS',
    GIS_CACHE_TIME = 'GIS_CACHE_TIME',
    GIS_CACHE = 'GIS_CACHE',
    unique = document.getElementById('map').getAttribute('data-tid'),
    userDefinedTracks = [],
    favTrails = [],
    lines,
    vectorIDs = [],
    trailData = [],
    waypoints,
    tileIDs = [],
    customLayersIDS = [],
    tileNames = ['terrain', 'satellite', 'caltopo', 'fs16', 'outdoors',/* 'delorme',*/ 'osm'],
    tilePerms = [0, 0, 0, 1, 1],
    drawControl,
    gettingWX = false,
    store = localStorage,
    userIcon = L.divIcon({
        className: 'user-marker',
        html: '<svg width="80" height="102" viewBox="0 -3.3 24 27.3" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M19.25 8C19.25 11.0382 17.5912 14.8908 15.7285 18.0572C14.8072 19.6235 13.8587 20.9837 13.0871 21.9444C12.6998 22.4267 12.3678 22.7947 12.1146 23.0351C12.0725 23.075 12.0344 23.1097 12 23.1398C11.9656 23.1097 11.9275 23.075 11.8854 23.0351C11.6322 22.7947 11.3002 22.4267 10.9129 21.9444C10.1413 20.9837 9.19276 19.6235 8.27145 18.0572C6.40884 14.8908 4.75 11.0382 4.75 8C4.75 3.99594 7.99594 0.75 12 0.75C16.0041 0.75 19.25 3.99594 19.25 8ZM11.7973 23.2923C11.7974 23.2918 11.8024 23.2889 11.8118 23.2848C11.8019 23.2906 11.7972 23.2927 11.7973 23.2923ZM12.1882 23.2848C12.1976 23.2889 12.2025 23.2918 12.2027 23.2923C12.2028 23.2927 12.1981 23.2906 12.1882 23.2848Z" fill="#f44f10" stroke="#f9f9f9" stroke-width="1.25" />' +
            '<circle cx="12" cy="8" r="3" fill="#f9f9f9"/></svg>',
        iconSize: [40, 51],
        iconAnchor: [20, 45],
        popupAnchor: [0, -20]
    }),
    editableLayers = new L.FeatureGroup({
        pane: 'marker'
    }),
    trails = L.markerClusterGroup({
        spiderfyOnMaxZoom: false,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        removeOutsideVisibleBounds: true,
        disableClusteringAtZoom: 13,
        maxClusterRadius: 75,
        iconCreateFunction: (cluster) => {
            let size;

            if (cluster.getChildCount() >= 5 && cluster.getChildCount() < 20) {
                size = 'medium';
            } else if (cluster.getChildCount() >= 25 && cluster.getChildCount() < 40) {
                size = 'large';
            } else if (cluster.getChildCount() >= 50 && cluster.getChildCount() < 80) {
                size = 'xl';
            } else if (cluster.getChildCount() >= 80) {
                size = 'xxl';
            } else {
                size = 'small';
            }

            return L.divIcon({
                className: 'marker-cluster mc-' + size,
                iconSize: new L.point(40, 40),
                html: '<div><span>' + cluster.getChildCount() + '</span></div>'
            });
        }
    }),
    aspect = {
        "N": "North",
        "NNE": "North-Northeast",
        "NE": "Northeast",
        "ENE": "East-Northeast",
        "E": "East",
        "ESE": "East-Southeast",
        "SE": "Southeast",
        "SSE": "South-Southeast",
        "S": "South",
        "SSW": "South-Southwest",
        "SW": "Southwest",
        "WSW": "West-Southwest",
        "W": "West",
        "WNW": "West-Northwest",
        "NW": "Northwest",
        "NNW": "North-Northwest",
        "": "Unknown"
    },
    states = {
        'AB': 'ALBERTA',
        'AL': 'ALABAMA',
        'AK': 'ALASKA',
        'AZ': 'ARIZONA',
        'AR': 'ARKANSAS',
        'BC': 'BRITISH COLUMBIA',
        'CA': 'CALIFORNIA',
        'CO': 'COLORADO',
        'CT': 'CONNECTICUT',
        'DE': 'DELAWARE',
        'DC': 'DISTRICT OF COLUMBIA',
        'FL': 'FLORIDA',
        'GA': 'GEORGIA',
        'HI': 'HAWAII',
        'ID': 'IDAHO',
        'IL': 'ILLINOIS',
        'IN': 'INDIANA',
        'IA': 'IOWA',
        'KS': 'KANSAS',
        'KY': 'KENTUCKY',
        'LA': 'LOUISIANA',
        'ME': 'MAINE',
        'MD': 'MARYLAND',
        'MA': 'MASSACHUSETTS',
        'MB': 'MANITOBA',
        'MI': 'MICHIGAN',
        'MN': 'MINNESOTA',
        'MS': 'MISSISSIPPI',
        'MO': 'MISSOURI',
        'MT': 'MONTANA',
        'NB': 'NEW BRUNSWICK',
        'NE': 'NEBRASKA',
        'NV': 'NEVADA',
        'NH': 'NEW HAMPSHIRE',
        'NJ': 'NEW JERSEY',
        'NM': 'NEW MEXICO',
        'NS': 'NOVA SCOTIA',
        'NY': 'NEW YORK',
        'NC': 'NORTH CAROLINA',
        'ND': 'NORTH DAKOTA',
        'NL': 'NEWFOUNDLAND',
        'OH': 'OHIO',
        'OK': 'OKLAHOMA',
        'ON': 'ONTARIO',
        'OR': 'OREGON',
        'PA': 'PENNSYLVANIA',
        'PE': 'PRINCE EDWARD ISLAND',
        'QC': 'QUEBEC',
        'RI': 'RHODE ISLAND',
        'SC': 'SOUTH CAROLINA',
        'SD': 'SOUTH DAKOTA',
        'SK': 'SASKATCHEWAN',
        'TN': 'TENNESSEE',
        'TX': 'TEXAS',
        'UT': 'UTAH',
        'VT': 'VERMONT',
        'VA': 'VIRGINIA',
        'WA': 'WASHINGTON',
        'WV': 'WEST VIRGINIA',
        'WI': 'WISCONSIN',
        'WY': 'WYOMING'
    };

const modalHeader = '<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" onclick="closeModal()" title="Close window">' +
    '<i class="far fa-xmark"></i></div></header>';

const trailBrief = modalHeader + '<div class="content">{favTrailLink}<a id="j" target="blank" href="#"><img id="trailImg" class="placeholder" style="width:100%;height:175px"></a><div class="tags">' +
    '<div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 5px 0 0"></div><div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 5px 0 5px"></div>' +
    '<div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 0 0 5px"></div></div><h4>Trail Stats</h4><ul class="stats" style="margin-top:10px"><li><div class="caption">Guide Type</div><div class="value" id="i">' +
    '<div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Distance</div><div class="value" id="c">' +
    '<div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Max. Altitude</div><div class="value" id="d"><div class="placeholder" style="width:50%;height:19px;margin:0">' +
    '</div></div></li><li><div class="caption">Min. Altitude</div><div class="value" id="e"><div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Elev. Gain</div>' +
    '<div class="value" id="f"><div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Elev. Loss</div><div class="value" id="g"><div class="placeholder" style="width:50%;height:19px;margin:0"></div>' +
    '</div></li></ul><a href="#" id="h" target="blank" style="margin:0 auto" class="btn btn-lg btn-green centered">Explore the full guide</a></div>';

const weather = modalHeader + '<div class="content"><div class="tab-wrapper"><ul class="tabs"><li class="li-tab active" rel="cur"><i class="far fa-circle-exclamation"></i>Current</li><li class="li-tab" rel="fcst"><i class="far fa-cloud-sun"></i>Forecast</li></ul>' +
    '<div class="tab-content active" data-tab="cur">Getting current weather...</div><div class="tab-content" data-tab="fcst"><ul class="weather"><li><div class="head"><img class="placeholder" style="height:50px"><div class="title">' +
    '<h3 class="placeholder" style="width:60%;height:24px"></h3><span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
    '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
    '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
    '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
    '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
    '<div class="fcst placeholder" style="height:55px"></div></li></ul></div></div></div>';

const upload = modalHeader + '<div class="content"><p style="margin:10px 0;font-size:15px;color:#666;text-align:center">Upload a GPX, GeoJSON, or KML file to display on the map (max size&nbsp;=&nbsp;10 MB)</p>' +
    '<form action="" id="fileUpload" method="post" enctype="multipart/form-data" style="margin-top:15px"><input type="file" name="file" placeholder="Upload a file" accept=".gpx,.geojson,.kml">' +
    '<div class="uploading"><i class="fa-duotone fa-spinner-third"></i>Uploading your file...</div></form></div>';

const userFiles = modalHeader + '<div class="content"><div class="tab-wrapper ufiles"><ol class="tabs"><li class="li-tab active" rel="import"><i class="fa-light fa-upload"></i>Uploaded</li><li class="li-tab" rel="draw"><i class="fa-solid fa-folders"></i>Custom</li></ol>' +
    '<div class="tab-content active" data-tab="import"><div class="selectAll"><div class="checkbox"><label for="selectAll" style="padding:0 10px 0 0">Select All</label><input type="checkbox" id="selectAll" data-tab="import"></div></div>' +
    '<ul class="user-tracks"></ul></div><div class="tab-content" data-tab="draw"><p class="message error">You don\'t have any custom points, tracks, or polygons.</p><div class="selectAll" style="justify-content:space-between;align-items:flex-start">' +
    '<div style="display:flex;flex-direction:column"><a href="#" id="saveUserObjects" class="btn btn-red btn-sm" style="margin:0 0 0.5em 0;font-size:14px" onclick="return false"><i class="fas fa-cloud-arrow-up"></i>Sync Your Data</a>' +
    '<span id="lastsynced" style="font-size:13px;padding:5px 0 2px 0;color:var(--blue-gray)">Last synced...</span></div><div style="display:flex;flex-direction:column;align-items:flex-end"><div class="checkbox"><label for="selectAll" style="padding:0 10px 0 0">Select All</label>' +
    '<input type="checkbox" id="selectAll" style="margin-right:15px" data-tab="draw"></div><a href="#" onclick="return false" style="font-size:18px;margin-top:0.5em" title="Export all features"><i class="far fa-file-export" aria-hidden="true"></i></a></div></div>' +
    '<ul class="user-tracks"></ul></div></div></div>';

const mappings = new Map();
const mappings2 = new Map();

const roles = {
    ADMIN: "ADMIN",
    PREMIUM: "PREMIUM",
    GUEST: "GUEST"
};

const actions = {
    ADMIN: "ADMIN",
    DRAW: "DRAW",
    OFFLINE: "OFFLINE"
};

mappings.set(actions.ADMIN, [roles.ADMIN]);
mappings.set(actions.DRAW, [roles.PREMIUM, roles.ADMIN]);
mappings.set(actions.OFFLINE, [roles.PREMIUM, roles.ADMIN]);
mappings2.set(actions.DRAW, true);
mappings2.set(actions.OFFLINE, true);

terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    id: 'Terrain',
    minZoom: 3,
    maxZoom: 18,
    attribution: attrib
});

/*https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png*/
caltopo = L.tileLayer(domain + 'assets/images/tiles/2/{z}/{x}/{y}.png', {
    id: 'CalTopo',
    minZoom: 5,
    maxZoom: 16,
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

/*https://caltopo.com/tile/hs_m315z45s3/{z}/{x}/{y}.png*/
shading = L.tileLayer('https://d3kcsn1y1fg3m9.cloudfront.net/tiles/1/{z}/{x}/{y}.png', {
    id: 'CalTopo Shading',
    minZoom: 5,
    maxZoom: 16,
    opacity: 0.3,
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

/*https://caltopo.com/tile/sc_fixed/9/89/183.png
https://d3kcsn1y1fg3m9.cloudfront.net/tiles/4/14/2835/5873.png
https://www.mapotechnology.com/assets/images/tiles/4
https://gaiavectortilerendering.global.ssl.fastly.net/slope-avy-v2/{z}/{x}/{y}.png*/
avy = L.tileLayer('https://d3kcsn1y1fg3m9.cloudfront.net/tiles/4/{z}/{x}/{y}.png', {
    id: 'Avalanche Shading',
    minZoom: 5,
    maxZoom: 16,
    opacity: (settings.avyOpac ? settings.avyOpac / 100 : 0.4),
    className: 'avy-shade',
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

/*avy = new Topography.TopoLayer({
    topotype: 'slope',
    token: mapboxToken,
    opacity: (settings.avyOpac ? settings.avyOpac / 100 : 0.4),
    minZoom: 11,
    customization: {
        continuous: true,
        colors: ['#a1fa4e', '#fef855', '#eda347', '#e83b27','#942ee4', "#0a20e5", "#0a20e5", '#ffffff', '#ffffff'],
        brakpoints: [20, 25, 30, 35, 40, 45, 55, 56, 90]
    }
});*/

aspectLayer = new Topography.TopoLayer({
    topotype: 'aspect',
    token: mapboxToken,
    opacity: 0.4,
    minZoom: 11,
    customization: {
        continuous: true
    }
});

elevationShading = L.tileLayer('https://api.mapbox.com/styles/v1/mapollc/cls57uqcy025p01qsdz8xabo7/tiles/256/{z}/{x}/{y}?access_token={token}', {
    id: 'Elevation Shading',
    minZoom: 0,
    maxZoom: 22,
    opacity: 0.4,
    token: mapboxToken,
    attribution: attrib + ' | Data &copy; <a href="https://mapbox">Mapbox</a>'
});

/*slope = L.tileLayer.wms('https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage', {
    id: 'Avalanche Shading',
    minZoom: 7,
    maxZoom: 19,
    opacity: 0.55,
    f: 'image',
    format: 'jpgpng',
    renderingRule: '{"rasterFunction":"Slope Map"}',
    imageSR: 102100,
    bboxSR: 102100,
    size: '1798,529',
    tileSize: L.point(1798, 529)
});*/

/*https://ctusfs.s3.amazonaws.com/2016a/{z}/{x}/{y}.png'*/
fs16 = L.tileLayer('https://d3kcsn1y1fg3m9.cloudfront.net/tiles/3/{z}/{x}/{y}.png', {
    id: 'USFS 2016',
    minZoom: 5,
    maxZoom: 16,
    attribution: attrib + ' | Tiles by <a href="http://www.caltopo.com">CalTopo</a>'
})
    .on('tileerror', function (error) {
        handleTileError(error);
    });

satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    id: 'Google Hybrid',
    minZoom: 3,
    maxZoom: 20,
    attribution: attrib + ' | Tiles by <a href="https://google.com">Google</a>'
});

/*delorme = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/{z}/{y}/{x}', {
    id: 'Garmin DeLorme',
    minZoom: 3,
    maxZoom: 12,
    attribution: attrib + ' | Tiles by <a href="https://garmin.com">Garmin</a>'
});
https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/{z}/{x}/{y}?access_token={token}*/
outdoors = L.tileLayer('https://api.mapbox.com/styles/v1/mapollc/clnnpsgob00st01pv20978ob9/tiles/256/{z}/{x}/{y}?access_token={token}', {
    id: 'Mapbox Outdoors v12',
    minZoom: 1,
    maxZoom: 20,
    tileSize: 256,
    token: mapboxToken,
    attribution: attrib + ' | Tiles by <a href="https://mapbox.com">Mapbox</a>'
});

osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    id: 'Open Street Map',
    minZoom: 4,
    maxZoom: 19,
    attribution: attrib + ' | Tiles by <a href="https://openstreetmap.org">OSM</a>'
});

usfs = L.tileLayer('https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}', {
    id: 'USFS Boundaries',
    minZoom: 0,
    maxZoom: 19,
    opacity: 1,
    attribution: attrib
});

fsrds = L.tileLayer.wms('https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/export', {
    id: 'USFS Road Network',
    minZoom: 11,
    transparent: true,
    layers: 'show:0',
    /*dpi: 96,*/
    format: 'png32',
    bboxSR: 102100,
    imageSR: 102100,
    size: '1477, 515',
    tileSize: L.point(1477, 515),
    f: 'image',
    opacity: 1
});

gnis = L.tileLayer.wms('https://carto.nationalmap.gov/arcgis/rest/services/geonames/MapServer/export', {
    dpi: 96,
    layers: 'show:5,6,7',
    transparent: true,
    format: 'png32',
    bboxSR: 102100,
    imageSR: 102100,
    size: '1477,520',
    tileSize: L.point(1477, 520)
});

function validSubscription() {
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

function hasPermission(user, action) {
    if (!user?.role) {
        return false;
    }

    if (mappings.has(action)) {
        return mappings.get(action).includes(user.role) || (mappings2.get(action) && validSubscription());
    }

    return false;
}

function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function updateURI() {
    const m = map,
        c = m.getCenter(),
        h = '/#' + [m.getZoom(), c.lat.toFixed(6), c.lng.toFixed(6)].join(',');
}

function handleTileError(evt) {
    if (evt.tile._hasError) return;

    if (evt.target.options.id == 'CalTopo') {
        url2 = 'https://caltopo.s3.amazonaws.com/topo/{z}/{x}/{y}.png';
    } else if (evt.target.options.id == 'CalTopo Shading') {
        url2 = 'https://caltopo.com/tile/hs_m315z45s3/{z}/{x}/{y}.png';
    } else if (evt.target.options.id == 'Avalanche Shading') {
        /*url2 = domain + 'assets/images/tiles/4/{z}/{x}/{y}.png';
        url2 = 'https://gaiavectortilerendering.global.ssl.fastly.net/slope-avy-v2/{z}/{x}/{y}.png';*/
        url2 = 'https://caltopo.com/tile/sc_fixed/{z}/{x}/{y}.png';
    } else if (evt.target.options.id == 'USFS 2016') {
        url2 = 'https://caltopo.com/tile/f16a/{z}/{x}/{y}.png';
    }

    var si = Math.floor((Math.random() * 3));
    var tileSrc = url2.replace(/{x}/g, evt.coords.x);
    tileSrc = tileSrc.replace(/{y}/g, evt.coords.y);
    tileSrc = tileSrc.replace(/{z}/g, evt.coords.z);
    evt.tile._hasError = true;
    evt.tile.src = tileSrc;
}

function fields(obj) {
    var o = '';
    const keys = Object.keys(obj);
    const values = Object.values(obj);

    for (let i = 0; i < keys.length; i++) {
        o += keys[i] + '=' + values[i] + '&';
    }

    return o.substring(0, o.length - 1);
}

function setMapType() {
    if (!settings.tile) {
        settings.tile = 'fs16';
    }

    var ind = tileNames.indexOf(settings.tile),
        tileIDs = [terrain, satellite, caltopo, fs16, outdoors,/*delorme,*/ osm];

    tileIDs.forEach(function (k, v) {
        if (ind == v) {
            map.addLayer(tileIDs[v]).setMinZoom(tileIDs[v].options.minZoom).setMaxZoom(tileIDs[v].options.maxZoom);

            if (tileNames[ind] == 'caltopo' || tileNames[ind] == 'fs16') {
                shading.addTo(map).bringToFront();
            }

            if (settings.category == 'snow' && settings.avy !== true && settings.aspect !== true || settings.avy) {
                if (!map.hasLayer(avy)) {
                    avy.addTo(map);
                }
                avy.bringToFront();
            }

            if (settings.aspect) {
                if (!map.hasLayer(aspectLayer)) {
                    aspectLayer.addTo(map);
                }
                aspectLayer.bringToFront();
            }

            if (tileNames[ind] == 'outdoors') {
                outdoors.bringToBack();
            }
        } else {
            if (map.hasLayer(tileIDs[v]) === true) {
                if (tileNames[ind] != 'caltopo' && tileNames[ind] != 'fs16') {
                    shading.removeFrom(map);
                }

                map.removeLayer(tileIDs[v]);
            }
        }
    });
}

function popup(t, c) {
    return '<div class="popupHeader"><h3>' + t + '</h3></div><div class="popupContent">' + c + '</div>';
}

/*function addClass(e, c) {
    var a = c.split(' ');

    a.forEach(function (n) {
        e.classList.add(n);
    });
}

function removeClass(e, c) {
    var a = c.split(' ');

    a.forEach(function (n) {
        e.classList.remove(n);
    });
}*/

async function saveSession(h) {
    var c = map.getCenter(),
        a = c.lat,
        b = c.lng,
        z = map.getZoom();

    var set = {
        activity: (settings.activity ? settings.activity : null),
        android: (settings.android ? settings.android : null),
        area: (settings.area ? settings.area : null),
        avy: settings.avy,
        aspect: settings.aspect,
        avyOpac: (settings.avyOpac ? settings.avyOpac : 40),
        aspOpac: (settings.aspOpac ? settings.aspOpac : 40),
        category: (settings.category ? settings.category : null),
        center: [a, b],
        method: (h === true ? true : false),
        tile: settings.tile,
        trailheads: settings.trailheads,
        trails: settings.trails,
        snotel: settings.snotel,
        usfs: settings.usfs,
        version: settings.version,
        waypoints: settings.waypoints,
        zoom: z,
    };

    settings = set;

    const fd = new FormData();
    for (var k in set) {
        fd.append(k, set[k]);
    }

    await fetch(host + 'api/v1/session?key=' + key, {
        method: 'POST',
        body: fd
    }).then(async function (resp) {
        const d = await resp.json();

        saveUserObjects();

        if (d.success == 1) {
            alert('Your map settings were successfully synced.');
        }
    });
}

function numberFormat(n, d = 2) {
    return Intl.NumberFormat('en-US', {
        maximumFractionDigits: d
    }).format(n);
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

function alert(m, t = 'success') {
    if (isAndroid == 1) {
        Notify.alert(m);
    } else {
        const alert = document.querySelector('.alert'),
            timing = (((m.split(' ').length / 5) + 0.5) * 1000) + 250;

        alert.innerHTML = '<i class="fas ' + (t == 'success' ? 'fa-check' : (t == 'info' ? 'fa-circle-info' : 'fa-circle-exclamation')) + '"></i><p>' + m + '</p>';
        alert.className = 'alert ' + t;
        alert.style.display = 'inline-flex';

        setTimeout(() => {
            alert.style.display = 'none';
            alert.className = 'alert';
            alert.innerHTML = '';
        }, timing);
    }
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

function markerIcon(c) {
    var i;
    if (c.includes('Mountain Bike')) {
        i = wpIcon('mtn_bike');
    } else if (c.includes('Hike')) {
        i = wpIcon('hike');
    } else if (c.includes('ATV')) {
        i = wpIcon('atv');
    } else if (c.includes('Climb')) {
        i = wpIcon('climb');
    } else if (c.includes('Dirtbike')) {
        i = wpIcon('dirtbike');
    } else if (c.includes('Gravel Bike')) {
        i = wpIcon('gravel');
    } else if (c.includes('Road Bike')) {
        i = wpIcon('road');
    } else if (c.includes('Alpine Ski')) {
        i = wpIcon('apski');
    } else if (c.includes('Backcountry Ski')) {
        i = wpIcon('atski');
    } else if (c.includes('Nordic Ski')) {
        i = wpIcon('nski');
    } else if (c.includes('Snowmobile')) {
        i = wpIcon('snowmobile');
    } else {
        i = wpIcon('info');
    }
    return i;
}

function wpIcon(i) {
    var icon,
        t = 1,
        color;

    switch (i) {
        case '4x4':
            icon = 'far fa-steering-wheel';
            color = '#8a6a18';
            t = 1;
            break;
        case 'atv':
            icon = 'fad fa-truck-monster';
            color = '#738104';
            t = 1;
            break;
        case 'big_air':
            icon = 'fad fa-cards-blank';
            color = '#962d89';
            t = 1;
            break;
        case 'bigfoot':
            icon = 'far fa-shoe-prints';
            color = '#e55188';
            t = 1;
            break;
        case 'big ride':
            icon = 'far fa-roller-coaster';
            color = '#f4511e';
            t = 1;
            break;
        case 'bridge':
            icon = 'far fa-bridge';
            color = '#8a6a18';
            t = 1;
            break;
        case 'cabin':
            icon = 'fal fa-cabin';
            color = '#8a6a18';
            t = 1;
            break;
        case 'camp':
            icon = 'fas fa-campground';
            color = '#3e9d1f';
            t = 1;
            break;
        case 'camp2':
            icon = 'fas fa-campground';
            color = '#3e9d1f';
            t = 1;
            break;
        case 'caution':
            icon = 'fad fa-diamond-exclamation';
            color = '#eeff00';
            t = 0;
            break;
        case 'climb':
            icon = 'far fa-pickaxe';
            color = '#d1b80b';
            t = 1;
            break;
        case 'dirtbike':
            icon = 'far fa-motorcycle';
            color = '#061895';
            t = 1;
            break;
        case 'fishing':
            icon = 'far fa-fishing-rod';
            color = '#004741';
            t = 1;
            break;
        case 'hike':
            icon = 'far fa-person-hiking';
            color = '#24a7ff';
            break;
        case 'fantasy':
            icon = 'far fa-wand-sparkles';
            color = '#f48fb1';
            t = 1;
            break;
        case 'gravel':
            icon = 'fas fa-xmarks-lines';
            color = '#a3a3a3';
            t = 1;
            break;
        case 'info':
            icon = 'fal fa-circle-info';
            color = '#3875d7';
            t = 1;
            break;
        case 'lake':
            icon = 0;
            color = '#0f5fff';
            t = 1;
            break;
        case 'media':
            icon = 'fas fa-video';
            color = '#51c3b5';
            t = 1;
            break;
        case 'mtn_bike':
            icon = 'fa-solid fa-person-biking-mountain';
            color = '#15cf05';
            t = 0;
            break;
        case 'parking':
            icon = 'far fa-circle-parking';
            color = '#874f28';
            break;
        case 'road':
            icon = 'fas fa-road';
            color = '#3a3a3a';
            t = 1;
            break;
        case 'restroom':
            icon = 'fas fa-sharp fa-restroom';
            color = '#104daf';
            t = 1;
            break;
        case 'river':
            icon = 'far fa-water';
            color = '#0f5fff';
            t = 1;
            break;
        case 'sledding':
            icon = 'far fa-person-sledding';
            color = '#24ffd0';
            t = 0;
            break;
        case 'apski':
            icon = 'far fa-person-skiing';
            color = '#24ffd0';
            t = 0;
            break;
        case 'atski':
            icon = 'far fa-person-skiing';
            color = '#24ffd0';
            t = 0;
            break;
        case 'ski':
            icon = 'far fa-person-skiing';
            color = '#24ffd0';
            t = 0;
            break;
        case 'nski':
            icon = 'far fa-person-skiing-nordic';
            color = '#24ffd0';
            t = 0;
            break;
        case 'snowmobile':
            icon = 'fas fa-person-snowmobiling';
            color = '#f99d3e';
            t = 1;
            break;
        case 'summit':
            icon = 'far fa-mountains';
            color = '#006625';
            t = 1;
            break;
        default:
            icon = 'fal fa-circle-info';
            color = '#3875d7';
            t = 1;
            break;
    }

    var c = (icon == 0 ? '<img src="' + domain + 'assets/images/lake.png" style="width:25px;padding:2px">' : '<i class="' + icon + '"></i>');

    return L.divIcon({
        html: '<div style="background-color:' + color + ';color:#' + (t == 1 ? 'fff' : '282829') + '">' + c + '</div>',
        className: 'waypoint',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -13]
    })
}

function showPosition(position) {
    var lat = position.coords.latitude,
        lon = position.coords.longitude,
        acc = position.coords.accuracy,
        acc2 = (acc * 3.28084).toFixed(1);

    ylc = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<div class="user-location"><div class="user-location-dot"></div><div class="user-location-heading"></div></div>',
            className: 'geo'
        })
    }).on('click', (e) => {
        e.target.remove();
    }).bindTooltip('Accuracy: ' + (acc2 >= 5280 ? acc2 / 5280 + ' mi' : acc2 + ' ft.'), {
        sticky: true
    }).on('click', function () {
        map.removeLayer(this);
        map.removeLayer(ylc);
    }).addTo(map);

    ylc = L.circle([lat, lon], {
        radius: acc,
        color: '#1da1f2',
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.3
    }).bindTooltip('Accuracy: ' + (acc2 >= 5280 ? acc2 / 5280 + ' mi' : acc2 + ' ft.'), {
        sticky: true
    }).on('click', function () {
        map.removeLayer(this);
        map.removeLayer(ylm);
    }).addTo(map);

    map.setView([lat, lon], 11);
}

function showError(error) {
    var m;

    switch (error.code) {
        case error.PERMISSION_DENIED:
            m = "You denied permission for us to request your location.";
            break;
        case error.POSITION_UNAVAILABLE:
            m = "Geolocation information is unavailable right now.";
            break;
        case error.TIMEOUT:
            m = "The request to get your location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            m = "An unknown error occurred with the geolocation API.";
            break;
    }

    alert(m, 'error');
}

class Calculate {
    distance(lat1, lon1, lat2, lon2) {
        var R = 6371,
            dLat = this.deg2rad(lat2 - lat1),
            dLon = this.deg2rad(lon2 - lon1),
            a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
            c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
            d = R * c;

        return (d / 1.609);
    }

    perimeter(coords) {
        let dist = 0;

        for (let i = 0; i < coords.length - 1; i++) {
            let x = i + 1,
                d = this.distance(coords[i].lat, coords[i].lng, coords[x].lat, coords[x].lng);

            dist += (isNaN(d) ? 0 : d);
        }

        return numberFormat(dist, 2);
    }

    toAcres(v) {
        return numberFormat(v * 640, 2);
    }

    deg2rad(v) {
        return v * Math.PI / 180;
    }

    metric(v, u) {
        return (u == 'm' ? (v / 3.2808) : (v * 1.60934));
    }

    calculateArea(latLngs) {
        var pointsCount = latLngs.length,
            area = 0.0,
            d2r = Math.PI / 180,
            p1, p2;

        if (pointsCount > 2) {
            for (var i = 0; i < pointsCount; i++) {
                p1 = latLngs[i];
                p2 = latLngs[(i + 1) % pointsCount];
                area += ((p2.lng - p1.lng) * d2r) * (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
            }
            area = area * 6378137.0 * 6378137.0 / 2.0;
        }

        return numberFormat(Math.abs(area) / 2589986.9952, 2);
    }

    getCompassDirection(b) {
        var d,
            b = Math.round(b / 22.5);

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
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal').innerHTML = '';
    document.getElementById('modal').style.maxHeight = 'unset';

    map.closePopup();
    customLayersIDS = [];

    if (pls != undefined) {
        lines.setFeatureStyle(pls[0], {
            weight: pls[1],
            color: pls[2],
            opacity: pls[3]
        });

        pls = undefined;
    }
}

function readTrail(trail, w = 1) {
    let k = '',
        data,
        content = trailBrief;

    if (favTrails.includes((w == 2 ? trail.id : trail.trail_id))) {
        var link = '<a href="#" id="favTrail" onclick="return false" data-id="' + (w == 2 ? trail.id : trail.trail_id) + '" data-favorite="1" class="btn btn-sm btn-yellow" style="margin:0 0 1em 0;padding:6px 9px;min-width:143px"><i class="fa-sharp fas fa-star"></i> Favorited Trail</a>';
    } else {
        var link = '<a href="#" id="favTrail" onclick="return false" data-id="' + (w == 2 ? trail.id : trail.trail_id) + '" data-favorite="0" class="btn btn-sm btn-yellow" style="margin:0 0 1em 0;padding:6px 9px;min-width:143px"><i class="fa-sharp far fa-star"></i> Favorite Trail</a>';
    }

    /* get trail details */
    if (w == 2) {
        data = trail;
    } else {
        trails.getLayers().forEach((t) => {
            if (trail.trail_id == t.options.id) {
                data = t.options;
            }
        });
    }

    let modal = document.querySelector('#modal');
    let stats = (w == 2 ? data.stats : JSON.parse(trail.stats));

    modal.innerHTML = content.replace('{favTrailLink}', (user.uid ? link : ''));
    modal.style.display = 'flex';

    document.querySelector('#a').innerHTML = data.title;
    document.querySelector('#j').innerHTML = '<img id="trailImg" class="placeholder" src="' + cdn + 'photos/' + data.thumbnail + '" onerror="this.parentElement.parentElement.prepend(\'<div class=noimg></div>\');this.parentElement.remove();" style="width:100%;height:175px">';
    document.querySelector('#trailImg').style.height = 'unset';
    document.querySelector('#i').innerHTML = '<div class="leaflet-marker-icon waypoint" title="' + data.category + '">' + data.icon.options.html + '</div>' + data.category.join(', ');
    document.querySelector('#c').innerHTML = stats.distance.toFixed(1) + '<span>mi</span>';
    document.querySelector('#d').innerHTML = numberFormat(stats.elevation.max, 1) + '<span>ft</span>';
    document.querySelector('#e').innerHTML = numberFormat(stats.elevation.min, 1) + '<span>ft</span>';
    document.querySelector('#f').innerHTML = numberFormat(stats.altitude.gain, 1) + '<span>ft</span>';
    document.querySelector('#g').innerHTML = numberFormat(stats.altitude.loss, 1) + '<span>ft</span>';
    document.querySelectorAll('#h, #j').forEach((e) => {
        e.setAttribute('href', host + trail.url);
    });

    /* add keywords to modal */
    if (data.keywords != null && data.keywords !== false) {
        data.keywords.forEach((w) => {
            k += '<div class="tag" onclick="window.open(\'' + host + 'guides/all/all-activities/' + w.replaceAll(' ', '-').toLowerCase() + '\')">#' + w.replaceAll(' ', '').replaceAll('.', '') + '</div>';
        });

        document.querySelector('.tags').innerHTML = k;
    } else {
        document.querySelector('.tags').remove();
    }
}

async function getFavorites() {
    const resp = await fetch(host + 'api/v1/favorite/list?key=' + key, {
        method: 'POST'
    });

    if (resp.ok) {
        const api = await resp.json();

        if (api.trails != null) {
            api.trails.forEach((t) => {
                favTrails.push(t.tid);
            });
        }
    }
}

function doStats(pr) {
    var dist = 0,
        gain = 0,
        loss = 0,
        gt = 0,
        elevs = [],
        g = [],
        ty = pr.type,
        ar = pr.coordinates;

    for (var i = 0; i < ar.length; i++) {
        var x = i - 1;

        if (i > 0) {
            var d = new Calculate().distance(ar[i][1], ar[i][0], ar[x][1], ar[x][0]);
            dist += d;

            if (ar[i].length > 2) {
                elevs.push(ar[i][2] * 3.281);

                if (ar[i][2] > ar[x][2]) {
                    gain += (ar[i][2] - ar[x][2]);
                }

                if (ar[i][2] < ar[x][2]) {
                    loss += (ar[i][2] - ar[x][2]);
                }

                var ch = parseFloat((((ar[i][2] - ar[x][2]) * 3.281) / (d * 5280)) * 100);

                if (!isNaN(ch)) {
                    gt += ch;
                    g.push(ch);
                }
            }
        }
    }

    if (ar[0].length > 2) {
        var a = Math.max.apply(null, elevs).toFixed(1),
            b = Math.min.apply(null, elevs).toFixed(1),
            c = Math.max.apply(null, g).toFixed(1);

        return [dist.toFixed(2), a, b, gain.toFixed(1), loss.toFixed(1), c, (gt / g.length).toFixed(1)];
    } else {
        return [dist.toFixed(2)];
    }
}

function uTi(t) {
    t = t.toLowerCase();
    return '<i class="fas ' + (t == 'linestring' || t == 'polyline' || t == 'track' ? 'fa-route' : (t == 'polygon' ? 'fa-draw-polygon' : 'fa-location-dot')) + '"></i>';
}

function prettyTime(t) {
    var d = new Date(t * 1000),
        m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

    return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' at ' + (d.getHours() > 12 ? d.getHours() - 12 : d.getHours()) + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M';
}

function premiumTrails(p, u) {
    if (p == 0) {
        return true;
    } else {
        if (u.subscribe && u.subscribe.active == 1 || user.role == 'ADMIN') {
            return true;
        } else {
            return false;
        }
    }
}

async function init() {
    var fields = new FormData(),
        fg = L.featureGroup();

    if (settings.category) {
        fields.append('filter', settings.category);
    }

    if (settings.activity) {
        fields.append('category', settings.activity.replaceAll('-', ' '));
    }

    const resp = await fetch(apiURL + 'trails/list?key=' + key, {
        method: 'POST',
        body: fields
    });

    if (resp.ok) {
        const t = await resp.json();

        if (t.trails != null) {
            for (var i = 0; i < t.trails.length; i++) {
                var trail = t.trails[i],
                    premium = premiumTrails(trail.premium, user);

                if (trail.stats != null && trail.stats.geo && premium) {
                    var kw = [],
                        lat = trail.stats.geo.start[0],
                        lon = trail.stats.geo.start[1];

                    if (lat && lon) {
                        c = '<a href="' + host + trail.url + '" style="display:block">' +
                            '<img onerror="this.parentElement.parentElement.prepend(\'<div class=noimg></div>\');this.parentElement.remove();" src="' + cdn + 'photos/' + trail.photo.thumbnail + '" style="margin-bottom:5px;width:100%"></a>' +
                            '<a href="' + host + trail.url + '" class="btn btn-center btn-green">Explore guide</a>';

                        trailData.push(trail.trail_id);

                        m = L.marker([lat, lon], {
                            icon: markerIcon(trail.category),
                            category: trail.category,
                            id: trail.trail_id,
                            type: trail.type,
                            title: trail.title,
                            distance: trail.stats.distance,
                            stats: trail.stats,
                            keywords: trail.keywords,
                            updated: parseFloat(trail.updated),
                            thumbnail: 'large/' + trail.photo.url,
                            url: trail.url
                        })
                            .on('click', function () {
                                if (isAndroid == 1) {
                                    TrailGuide.read(this.options.id);
                                } else {
                                    readTrail(this.options, 2);
                                }
                            })
                            /*.bindPopup(popup(trail.title, c), {
                                className: 'trail-popup',
                                minWidth: 275,
                                maxWidth: 275
                            })*/;

                        trails.addLayer(m);

                        if (settings.area && trail.keywords != null) {
                            for (var z = 0; z < trail.keywords.length; z++) {
                                kw.push(trail.keywords[z].toLowerCase());
                            }

                            if (kw.includes(settings.area) === true) {
                                m.addTo(fg);
                            }
                        }

                        if (unique && trail.trail_id == unique) {
                            map.setView([lat, lon], 15);
                        }
                    }
                }
            }

            if (settings.trailheads) {
                map.addLayer(trails);
            }
        }

        getFavorites();

        if (settings.snotel) {
            getSnotels();
        }

        if (unique) {
            var l = trails.getLayers();

            for (var i = 0; i < l.length; i++) {
                if (l[i].options.id == unique) {
                    var c = l[i].getLatLng();

                    map.setView([c.lat, c.lng], 12);
                    document.title = l[i].options.title + ' - Online Recreation Mapping - Map-o-Trails';
                }
            }
        } else {
            if (settings.area && fg.getLayers().length > 0) {
                map.fitBounds(fg.getBounds());
            }
        }

        if (map.getZoom() >= 11) {
            if (lines == undefined) {
                getTrailData();
            }
        }

        if (map.getZoom() >= 12) {
            if (wyp === false) {
                getWaypoints();
            }
        }
    }

    /* get any user uploaded files from the server */
    if (user.uid) {
        /*if (store.getItem('files') == null) {*/
        const ul = await fetch(host + 'api/v1/upload/list?key=' + key);

        if (ul.ok) {
            const api = await ul.json();

            if (api.files != null) {
                var arr = [];

                api.files.forEach(function (f) {
                    arr.push({
                        fid: f.fid,
                        name: f.fileName,
                        file: f.file,
                        create: f.created,
                        modify: f.modified,
                        stats: f.stats
                    });
                });

                store.setItem('files', JSON.stringify(arr));
            }
        }
        /*}*/

        /* get any user created map objects */
        if (store.getItem('draw') == null || store.getItem('profile') == null) {
            const ucl = await fetch(host + 'api/v1/upload/custom/list?key=' + key, {
                method: 'POST'
            });

            if (ucl.ok) {
                const api = await ucl.json();

                if (api.content != null) {
                    store.setItem('draw', JSON.stringify(api.content));
                    store.setItem('profile', JSON.stringify(api.profile));
                    store.setItem('drawSync', api.sync);
                }

                /*getCustomDraw();*/
            }
        }/* else {
            getCustomDraw();
        }*/
    }
}

async function getWaypoints() {
    const fd = new FormData();
    fd.append('filter', settings.category);

    const resp = await fetch(apiURL + 'trails/waypoints?key=' + key, {
        method: 'POST',
        body: fd
    });

    if (resp.ok) {
        const w = await resp.json();

        wyp = true;

        waypoints = L.geoJSON(w.features, {
            pointToLayer: function (feature, latlng) {
                let p,
                    edit = '';

                if (hasPermission(user, actions.ADMIN)) {
                    edit = '<p style="margin:0.5em 0 0;text-align:center;font-size:14px"><a href="' + domain + 'account/admin/trails/edit?id=' + feature.properties.trail_id + '"><i class="fas fa-pen"></i> Edit</a></p>';
                }

                p = popup((feature.properties.name && feature.properties.note != 'N/A' ? feature.properties.name : 'Waypoint'),
                    '<p style="margin:0;text-align:center">' +
                    (feature.properties.name && feature.properties.note == 'N/A' ? feature.properties.name : feature.properties.note) +
                    '</p>' + edit);

                return L.marker(latlng, {
                    icon: wpIcon(feature.properties.icon),
                    pane: 'waypoints',
                    trail: feature.properties.trail_id,
                    title: (feature.properties.name ? feature.properties.name : '') + (feature.properties.note != 'N/A' ? ' / ' + feature.properties.note : '')
                })
                    .bindPopup(p, {
                        className: 'trail-popup d',
                        minWidth: 300
                    });
            }
        });

        if (settings.waypoints && map.getZoom() >= 12) {
            map.addLayer(waypoints);
        }
    }
}

/*function drawTrails(tid, r) {
    var gis = r.trail.gis;

    if (gis != null) {
        /* loop through all the GIS tracks for this trail *//*
        for (var i = 0; i < gis.length; i++) {
            var coords = [],
                elev = [],
                mode = gis[i].mode,
                dist = (gis[i].gpx.length > 1 ? gis[i].gpx[gis[i].gpx.length - 1].chart.dist : 0),
                cap = gis[i].caption,
                grades = []/*,
                gradeCount = 0,
                gradeTotal = 0*/;

/* loop through coordinates of the trail and parse them into array  *//*
for (var x = 0; x < gis[i].gpx.length; x++) {
    var e = parseFloat(gis[i].gpx[x].chart.elev.toFixed(1)),
        d = parseFloat(gis[i].gpx[x].chart.dist.toFixed(3));

    coords.push(gis[i].gpx[x].coords);
    elev.push(gis[i].gpx[x].chart.elev);

    /* if not the first point in the GPX, calculate the slope between each point *//*
if (x > 0) {
var h = x - 1,
f = parseFloat(gis[i].gpx[h].chart.elev.toFixed(1)),
j = parseFloat(gis[i].gpx[h].chart.dist.toFixed(3));

var ch = (((e - f) / ((d - j) * 5280)) * 100).toFixed(1);

if (!isNaN(ch) && ch.search('Infinity') < 0) {
/*if (ch > 100) {
ch = 100;
}*//*

grades.push(parseFloat(ch));
}
}
}

var emin = Math.round(Math.min.apply(null, elev)),
emax = Math.round(Math.max.apply(null, elev)),
avg = 0,
/*avg = (gradeTotal / gradeCount).toFixed(1),*//*
max = Math.max.apply(null, grades).toFixed(1),
max = (max == 0 ? Math.min.apply(null, grades) : max);

for (var j = 0; j < grades.length; j++) {
avg += grades[j];
}
avg = (avg / grades.length).toFixed(1);

/* add extra wide polyline to map to make it easier for mobile users to click on *//*
L.polyline(coords, {
    id: 'd-' + gis[i].id,
    tid: tid,
    seq: i,
    color: 'transparent',
    weight: 20,
    title: (gis[i].caption ? gis[i].caption : gis[i].title)
})
    .on('click', (e) => {
        var g = e.target;

        if (g.options.seq == 0) {
            trails.getLayers().forEach((lay) => {
                if (lay.options.id == tid) {
                    readTrail(lay.options);
                }
            });
        }

        lines.forEach((t) => {
            if (g.options.id == 'd-' + t.options.id) {
                t.setStyle({
                    weight: 10
                });

                /* open trail popup if window is greater than 768 *//*
if (window.outerWidth > 768 || i > 0) {
t.openPopup();
}

curSel = t;

map.fitBounds(g.getBounds());
trailSelect(t.getLatLngs(), mode);
}
});
})
.addTo(map);

/* add normal colored polyline to the map (this is the actual trail that displays) *//*
p = L.polyline(coords, {
    id: gis[i].id,
    tid: tid,
    seq: i,
    color: gis[i].color,
    weight: 5,
    opacity: (map.getZoom() <= 10 ? 0 : 1),
    title: (gis[i].caption ? gis[i].caption : gis[i].title)
})
    .on('click', (e) => {
        var th = e.target;

        th.setStyle({
            weight: 10
        });
        curSel = th;

        if (th.options.seq == 0) {
            trails.getLayers().forEach((lay) => {
                if (lay.options.id == tid) {
                    readTrail(lay.options);
                }
            });
        }

        map.fitBounds(th.getBounds());
        trailSelect(th.getLatLngs());

        /*lines.forEach(function (t) {
            if (t.options.id != th.options.id) {
                t.setStyle({
                    opacity: 0.5
                });
            }
        });*//*
})
.addTo(map);

if (i > 0) {
p.bindPopup(popup((i == 0 ? 'Trail Stats' : cap), (hasPermission(user, actions.ADMIN) ? '<a style="display:block;text-align:center" target="blank" href="' + domain + 'account/admin/trails/edit?id=' + r.trail.trail_id + '">edit</a>' : '') +
'<div class="row"><div class="col title">Distance:</div><div class="col">' + dist.toFixed(2) +
' miles (' + numberFormat(new Calculate().metric(dist, 'km'), 2) + ' km)</div></div><div class="row"><div class="col title">Max Elev:</div><div class="col">' + numberFormat(emax, 0) + ' ft. (' + numberFormat(new Calculate().metric(emax, 'm'), 1) + ' m)</div></div><div class="row">' +
'<div class="col title">Min Elev:</div><div class="col">' + numberFormat(emin, 0) + ' ft. (' + numberFormat(new Calculate().metric(emin, 'm'), 1) + ' m)</div></div>' +
'<div class="row"><div class="col title">Avg. Trail Slope</div><div class="col">' + avg + '%</div></div>' +
'<div class="row"><div class="col title">Max. Trail Slope</div><div class="col">' + max + '%</div></div>'), {
className: 'trail-popup',
minWidth: 300,
maxWidth: 300
});
}

if (unique && unique == r.trail.trail_id && i == 0) {
map.fitBounds(p.getBounds());
}

lines.push(p);
}
}
}

async function gisAPI(tid) {
const resp = await fetch(apiURL + 'trails/gis?key=' + key + '&id=' + tid, {
method: 'POST'
});

if (resp.ok) {
const r = await resp.json();

/* cache which trails have already been loaded before for this user IF CACHING IS TURNED ON *//*
if (USE_CACHING) {
    if (!store.getItem(GIS_TIDS)) {
        var atls = [tid],
            agpxtls = [r];
    } else {
        var atls = JSON.parse(store.getItem(GIS_TIDS));
        var agpxtls = JSON.parse(store.getItem(GIS_CACHE));
        if (!atls.includes(tid)) {
            atls.push(tid);
            agpxtls.push(r);
        }
    }
    store.setItem(GIS_TIDS, JSON.stringify(atls));
    store.setItem(GIS_CACHE, JSON.stringify(agpxtls));
    store.setItem(GIS_CACHE_TIME, new Date().getTime())
}
drawTrails(tid, r);
}
}*/

function trailZoom(z) {
    return (z < 10 ? 2 : (z > 13 ? 5 : (z > 12 ? 4 : 3)));
}

function getTrailData() {
    lines = L.vectorGrid.protobuf('https://{s}.tiles.mapbox.com/v4/mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs/{z}/{x}/{y}.vector.pbf?access_token={token}', {
        interactive: true,
        rendererFactory: L.canvas.tile,
        minZoom: 6,
        pane: 'trail',
        subdomains: 'abcd',
        token: mapboxToken,
        getFeatureId: function (e) {
            return e.properties.trail_id + '' + e.properties.id;
        },
        vectorTileLayerStyles: {
            ['mapotrails']: function (properties, zoom) {
                let opacity = 1,
                    weight = 0,
                    /*dash = (zoom > 13 ? '2, 6' : '2, 10'),*/
                    color = properties.color;

                if (trailData.includes(properties.trail_id)) {
                    /*opacity = 1;*/
                    weight = trailZoom(zoom);
                    vectorIDs.push(properties.trail_id + '' + properties.id);
                }

                return {
                    opacity: opacity,
                    weight: weight,
                    color: color,
                    /*dashArray: dash,*/
                    fillOpacity: 0
                }
            },
        }
    }).on('click', (e) => {
        const layer = e.layer,
            trail = layer.properties,
            stats = JSON.parse(trail.stats),
            fd = new FormData();

        fd.append('id', trail.trail_id);

        fetch(apiURL + 'trails/bounds?key=' + key, {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const data = await resp.json(),
                bounds = data.bounds;

            map.fitBounds(
                L.latLngBounds(
                    L.latLng(bounds.ne[1], bounds.ne[0]),
                    L.latLng(bounds.sw[1], bounds.sw[0])
                ), {
                padding: [15, 15]
            });
        });

        pls = [trail.trail_id + '' + trail.id, layer.options.weight, layer.options.color, layer.options.opacity];

        lines.setFeatureStyle(pls[0], {
            weight: pls[1] + 3,
            color: pls[2]
        });

        /*if (stats.geo.start && stats.geo.end) {
            map.fitBounds(
                L.latLngBounds(
                    L.latLng(stats.geo.start[0], stats.geo.start[1]),
                    L.latLng(stats.geo.end[0], stats.geo.end[1])
                ), {
                padding: [15, 15]
            });
        }*/

        if (layer.properties.delta > 0) {
            let emin = stats.elevation.min,
                emax = stats.elevation.max,
                edit = '';

            console.log(layer);

            if (hasPermission(user, actions.ADMIN)) {
                edit = '<p style="margin:0 0 0.5em 0;text-align:center;font-size:14px"><a href="' + domain + 'account/admin/trails/edit?id=' + trail.trail_id + '"><i class="fas fa-pen"></i> Edit</a></p>';
            }

            let sts = '<li><div class="title">Distance</div><span>' + stats.distance.toFixed(1) + ' mi.</span></li>' +
                '<li><div class="title">Max Elevation</div><span>' + numberFormat(emax, 0) + ' ft.</span></li>' +
                '<li><div class="title">Min Elevation</div><span>' + numberFormat(emin, 0) + ' ft.</span></li>' +
                '<li><div class="title">Elevation Gain</div><span>' + numberFormat(stats.altitude.gain, 1) + ' ft.</span></li>' +
                '<li><div class="title">Elevation Loss</div><span>' + numberFormat(stats.altitude.loss, 1) + ' ft.</span></li>';

            L.popup({
                className: 'trail-popup',
                minWidth: 350
            })
                .setLatLng(e.latlng)
                .setContent(popup((trail.delta == 0 ? 'Trail Stats' : trail.caption), edit + '<ul class="pu-stats">' + sts + '</ul><a href="#" style="margin-bottom:0;color:#fff" class="btn btn-blue btn-sm centered" onclick=\'readTrail(' + JSON.stringify(trail) + ');return false\'>Preview Trail Guide</a>'))
                .openOn(map);
        } else {
            readTrail(trail);
        }

        L.DomEvent.stop(e);
    });

    if (settings.trails) {
        map.addLayer(lines);
    }

    /*if (map.getZoom() >= 12 && settings.trails) {
    trails.eachLayer((l) => {
    var tid = l.options.id,
    cacheable = (l.options.updated > store.getItem(GIS_CACHE_TIME) / 1000 ? false : true),
    f = JSON.parse(store.getItem(GIS_TIDS));
    
    if (map.getBounds().contains(l.getLatLng()) === true && trailData.includes(tid) === false) {
    /* if this trail is already in the cache */
    /* if the trail has been updated since the last time the data was cached, remove it */
    /*if (store.getItem(GIS_TIDS) && f.includes(tid) && !cacheable) {
        var g = JSON.parse(store.getItem(GIS_CACHE));

        f.splice(f.indexOf(tid), 1);
        store.setItem(GIS_TIDS, JSON.stringify(f));

        for (var i = 0; i < g.length; i++) {
            if (g[i].trail.trail_id == tid) {
                g.splice(i, 1);
            }
        }
        store.setItem(GIS_CACHE, JSON.stringify(g));

        /* load a fresh version of the GPX data from the API */
    /*gisAPI(tid);
} else if (store.getItem(GIS_TIDS) && f.includes(tid) && cacheable) {
    var e = JSON.parse(store.getItem(GIS_CACHE));

    e.forEach(function (k) {
        drawTrails(tid, k);
    });
} else {
    /* this trail has never been loaded before, so load it for the first time */
    /*gisAPI(tid);
}
trailData.push(tid);
}
});
}*/
}

async function getWeather(b, ctr = true) {
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
        await fetch(apiURL + 'weather/nearby?key=' + key + '&radius=' + e + ',' + f + ',' + d + '&latest=1')
            .then(async (resp) => {
                let w = await resp.json(),
                    elem = document.querySelector('#weather');

                if (w.weather) {
                    curWX = w.weather;
                    let wi = '',
                        name = curWX.name,
                        temp = Math.round(curWX.obs.temp.current),
                        wdir = curWX.obs.raw_wind_dir,
                        wspd = Math.round(curWX.obs.wind_speed)/*,
                        upd = timeAgo(curWX.updated).split(',')[0] + ' ago'*/;

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
            });
    }
}

function heatIndex(t, rh) {
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

function windChill(t, w) {
    return Math.round(35.74 + (0.6215 * t) - (35.75 * Math.pow(w, 0.16)) + (0.4275 * t * Math.pow(w, 0.16)));
}

function decodeWX(c) {
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

function displayCurCond() {
    let div = '',
        name = curWX.name,
        type = (curWX.MNET == 1 ? 'ASOS/AWOS' : (curWX.MNET == 2 ? 'RAWS' : (curWX.MNET == 25 ? 'NRCS/SNOTEL' : (curWX.MNET == 65 ? 'APRSWXNET/CWOP' : 'Other')))),
        elev = Math.round(curWX.elevation),
        temp = Math.round(curWX.obs.temp.current),
        wdir = (curWX.obs.wind_dir ? curWX.obs.wind_dir : false),
        wspd = (curWX.obs.wind_speed ? Math.round(curWX.obs.wind_speed) : false),
        wgst = (curWX.obs.wind_gust ? Math.round(curWX.obs.wind_gust) : false),
        rh = (curWX.obs.rh ? Math.round(curWX.obs.rh) : false),
        pres = (curWX.obs.pressure ? curWX.obs.pressure : false),
        prec = (curWX.obs.precip || curWX.obs.precip == 0 ? curWX.obs.precip : false),
        snow = (curWX.obs.snow ? true : false),
        codeTime = (curWX.obs.wxCode && new Date().getTime() - new Date(curWX.obs.wxCode.time).getTime() < 10800000 ? true : false),
        code = decodeWX((curWX.obs.wxCode && codeTime ? curWX.obs.wxCode.code : 0)),
        upd = timeAgo(curWX.updated);

    div += '<div class="current">' + (code ? '<div class="code"><i class="' + code + '"></i></div>' : '');

    if (temp) {
        div += '<div class="temps"><h1 style="font-size:50px;color:var(--red);margin-bottom:10px">' + temp + '&deg;</h1><span style="text-transform:uppercase;font-size:13px;letter-spacing:0.5px;color:var(--blue-gray)">Feels like ' +
            (temp < 60 && wspd ? windChill(temp, wspd) + '&deg;' : (temp && rh ? heatIndex(temp, rh) + '&deg;' : '--')) + '</span></div></div><ul class="wxstats" style="margin-top:15px">';
    }

    if (pres) {
        div += '<li><div class="caption">Pressure</div><div class="value">' + (pres ? pres + ' inHg' : '--') + '</div></li>';
    }

    div += (curWX.obs.raw_wind_dir >= 0 ? '<li><div class="caption">Wind Direction</div><div class="value">' + (wdir ? wdir + '<svg xmlns="http://www.w3.org/2000/svg" title="' + wdir + '" style="position:absolute;margin:-3px 0 0 0.5em;transform:rotate(' + curWX.obs.raw_wind_dir + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>' : '--') + '</div></li>' +
        '<li><div class="caption">Wind Speed</div><div class="value">' + (wspd ? wspd + ' mph' : '--') + '</div></li>' +
        '<li><div class="caption">Wind Gust</div><div class="value">' + (wgst ? wgst + ' mph' : '--') + '</div></li>' : '');

    if (rh) {
        div += '<li><div class="caption">Relative Humidity</div><div class="value">' + (rh ? rh + '%' : '--') + '</div></li>';
    }

    if (prec) {
        div += '<li><div class="caption">1-hr Rainfall</div><div class="value">' + (prec ? prec + ' in' : '--') + '</div></li>';
    }

    if (snow) {
        div += '<li><div class="caption">Snow Depth</div><div class="value">' + (curWX.obs.snow.hs ? curWX.obs.snow.hs + ' in <small>(' + (curWX.obs.snow.hs * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
        div += '<li><div class="caption">6-hr New Snow</div><div class="value">' + (curWX.obs.snow['6hr'] ? curWX.obs.snow['6hr'] + ' in <small>(' + (curWX.obs.snow['6hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
        div += '<li><div class="caption">12-hr New Snow</div><div class="value">' + (curWX.obs.snow['12hr'] ? curWX.obs.snow['12hr'] + ' in <small>(' + (curWX.obs.snow['12hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
        div += '<li><div class="caption">24-hr New Snow</div><div class="value">' + (curWX.obs.snow['24hr'] ? curWX.obs.snow['24hr'] + ' in <small>(' + (curWX.obs.snow['24hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
        div += '<li><div class="caption">48-hr New Snow</div><div class="value">' + (curWX.obs.snow['48hr'] ? curWX.obs.snow['48hr'] + ' in <small>(' + (curWX.obs.snow['48hr'] * 2.54).toFixed(1) + ' cm)</small>' : '--') + '</div></li>';
    }

    div += '</ul><span class="updated">Last report ' + upd + ' &middot; ' + name + ' (elevation ' + elev + ' ft.)</span>';

    document.querySelector('#modal .content .tab-content[data-tab=cur]').innerHTML = div;
}

async function wxForecast(a, b, ftab = false) {
    var content = '';

    if (ftab) {
        document.querySelectorAll('.tabs li').forEach((t) => {
            if (t.getAttribute('rel') == 'fcst') {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });

        document.querySelectorAll('.tab-content').forEach((t) => {
            if (t.getAttribute('data-tab') == 'fcst') {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
    }

    displayCurCond();

    const nws = await fetch('https://api.weather.gov/points/' + a + ',' + b);

    if (nws.ok) {
        const p = await nws.json();

        var rel = p.properties.relativeLocation.properties,
            dist = numberFormat(rel.distance.value / 1609, 1),
            wh = (dist > 3 ? dist + ' miles ' + new Calculate().getCompassDirection(rel.bearing.value) + ' of ' : '') + rel.city + ', ' + rel.state;

        document.querySelector('#modal #a').innerHTML = 'Current Conditions near ' + rel.city + ', ' + rel.state;
        document.querySelector('#modal #a').setAttribute('data-bk', 'Forecast for ' + wh);

        const re = await fetch(p.properties.forecast);

        if (re.ok) {
            const wx = await re.json();

            for (var i = 0; i < 10; i++) {
                var f = wx.properties.periods[i],
                    label = f.name,
                    temp = f.temperature,
                    ic = f.icon,
                    short = f.shortForecast.replaceAll(' And ', ' and ').replaceAll(' Of ', ' of '),
                    txt = f.detailedForecast;

                content += '<li><div class="head"><img src="' + ic + '"><div class="title"><h3>' + label + '</h3><span style="line-height:1.2;font-weight:400;font-size:13px;color:var(--gray)">' + short + '</span></div>' +
                    '<div class="temp"' + (f.isDaytime === false ? ' style="color:var(--light-blue)"' : '') + '>' + temp + '&deg;F</div></div><div class="fcst">' + txt + '</div></li>';
            }

            document.querySelector('#modal .content .tab-content[data-tab=fcst]').innerHTML = '<!--<span style="font-size:12px;color:var(--blue-gray)">' + a.toFixed(5) + ', ' + b.toFixed(5) + '</span>--><ul class="weather">' +
                content + '</ul><span class="updated">Last updated ' + timeAgo(new Date(wx.properties.updated).getTime() / 1000) +
                ' &middot; Data by National Weather Service</span>';
        } else {
            document.querySelector('#modal .content .tab-content[data-tab=fcst]').innerHTML = '<p class="message error">The weather forecast for this area is not available at the moment. Try again later.</p>';
        }
    }
}

/* get snotels */
async function getSnotels() {
    await fetch(apiURL + 'weather/snotels?key=' + key)
        .then(async (data) => {
            snotel = L.geoJSON(await data.json(), {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {
                        id: feature.properties.code,
                        title: feature.properties.name,
                        type: feature.properties.type,
                        icon: L.divIcon({
                            className: 'snotel',
                            html: '<i class="far fa-snowflake"></i>'
                        })
                    }).on('click', async () => {
                        if (feature.properties.type == 'SNOTEL') {
                            document.querySelector('#modal').innerHTML = weather;
                            document.querySelector('#modal').style.display = 'flex';

                            await fetch(apiURL + 'weather/' + feature.properties.code + '?key=' + key)
                                .then(async (data) => {
                                    const resp = await data.json();
                                    curWX = resp.weather;

                                    wxForecast(latlng.lat, latlng.lng);
                                });
                        } else {
                            window.open('https://wcc.sc.egov.usda.gov/reportGenerator/view/customSingleStationReport/hourly/start_of_period/' + feature.properties.id + ':' + feature.properties.state + ':SNTLT%7Cid=%22%22%7Cname/-167,0/TOBS::value,WTEQ::value,SNWD::value,PREC::value?fitToScreen=false');
                        }
                    });
                }
            });

            if (settings.snotel) {
                snotel.addTo(map);
            }
        })
}

/* when a search result is clicked on */
function result(t) {
    var a = t.getAttribute('data-lat'),
        b = t.getAttribute('data-lon'),
        tid = t.getAttribute('data-tid'),
        title = t.getAttribute('title'),
        supp = t.getAttribute('data-supp');

    document.querySelector('#search-results').style.display = 'none';
    document.querySelector('#search-results').innerHTML = '';
    document.querySelector('#q').value = '';

    if (tid) {
        trails.getLayers().forEach((p) => {
            if (p.options.id == tid) {
                readTrail(p.options, 2);
                a = p.getLatLng().lat;
                b = p.getLatLng().lng;
            }
        });
    } else {
        L.marker([a, b])
            .bindPopup(popup(title, '<p style="margin:0;text-align:center">' + supp + '</p>'), {
                className: 'trail-popup',
                minWidth: 250,
                maxWidth: 275
            })
            .addTo(map)
            .openPopup()
            .on('popupclose', (e) => {
                e.target.removeFrom(map);
            });
    }

    map.setView([a, b], 15);
}

async function query(q) {
    var qLen = q.length,
        r = '',
        sres = document.querySelector('#search-results');

    if (qLen == 0) {
        document.querySelector('#q').value = '';
        document.querySelector('#q').blur();
        sres.style.display = 'none';
    } else if (qLen >= 2) {
        sres.style.display = 'block';

        document.querySelector('#search-results > div:first-child').remove();

        /* search list of trails */
        trails.getLayers().forEach((t) => {
            if (t.options.title.toLowerCase().search(q.toLowerCase().split(',')[0]) >= 0) {
                var cat = '';

                t.options.category.forEach((k) => {
                    cat += k + ', ';
                });

                r += '<div id="result" onclick="result(this)" data-tid="' + t.options.id + '"><div class="text"><h3>' + t.options.title +
                    '</h3><span><b style="font-weight:400">' + ucfirst(t.options.type) + '</b> &middot; ' +
                    (t.options.distance ? t.options.distance.toFixed(1) + ' mi. &middot; ' : '') + cat.slice(0, -2) +
                    '</span></div></div>';
            }
        });

        sres.insertAdjacentHTML('beforeend', r);

        /* search database for GNIS cities etc */
        const resp = await fetch(apiURL + 'search?key=' + key + '&q=' + q);

        if (resp.ok) {
            let r = '';
            const data = await resp.json();

            if (data.rs != null) {
                data.rs.forEach((f) => {
                    var title = f.name,
                        cs = f.name.match(/,\s([A-Z]{2,})/)[1],
                        state = (cs ? ucwords(states[cs].toLowerCase()) : ''),
                        desc = (f.type == 'City' ? '<b style="font-weight:400">City</b> in ' + f.county + ' County &middot; ' + state : '<b style="font-weight:400">' + f.geoType + '</b> in ' + f.county + ' County' + (state ? ' &middot; ' + state : ''));

                    r += '<div id="result" onclick="result(this)" data-lat="' + f.lat + '" data-lon="' + f.lon + '" data-supp="' + (f.type == 'GIS' ? f.geoType : f.type) + ' in ' + f.county + ' County, ' + state + '" title="' + title + '"><div class="text"><h3>' + title + '</h3><span>' + desc + '</span></div></div>';
                });

                sres.insertAdjacentHTML('beforeend', r);
            }
        }
    }
}

function search(v, e) {
    clearTimeout(typeTimer);
    var kc = [16, 17, 18, 19, 20, 40, 32, 37, 38, 39];

    if (kc.includes(e.keyCode) === false && e.ctrlKey === false) {
        document.getElementById('closeSearch').style.display = 'block';
        document.querySelector('#search-results').innerHTML = '<div style="padding:10px 10px 5px 10px;margin-bottom:5px;user-select:none;font-size:14px">Searching trails, places & cities...</div>';
        document.querySelector('#search-results').style.display = 'block';

        typeTimer = setTimeout(() => {
            if (v == '') {
                /*document.querySelector('#search-results').innerHTML = events;*/
            } else {
                query(v);
            }
        }, 750);
    }
}

function convertToDms(dd, isLng) {
    var dir = dd < 0
        ? isLng ? 'W' : 'S'
        : isLng ? 'E' : 'N';

    var absDd = Math.abs(dd),
        deg = absDd | 0,
        frac = absDd - deg,
        min = (frac * 60) | 0,
        sec = Math.round((frac * 3600 - min * 60) * 100) / 100;

    return deg + "&deg;" + min + "'" + sec + '"' + dir;
}

function openLayers() {
    const modal = document.querySelector('#modal');

    const l = modalHeader + '<div class="content"><ul class="layers-list">' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="trailheads"' + (settings.trailheads ? ' checked' : '') + '></div><div class="desc"><label>Trailheads</label><span>Display trailhead markers on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="trails"' + (settings.trails ? ' checked' : '') + '></div><div class="desc"><label>Trails</label><span>Display trails on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="snotel"' + (settings.snotel ? ' checked' : '') + '></div><div class="desc"><label>Snotels</label><span>Show backcountry weather stations that measure snow</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="waypoints"' + (settings.waypoints ? ' checked' : '') + '></div><div class="desc"><label>Waypoints</label><span>Display waypoints (points of interest) on the map</span></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="avy"' + (settings.avy || settings.category == 'snow' && settings.avy != true && settings.aspect != true ? ' checked' : '') + '></div><div class="desc"><label>Avalanche</label><span>Show avalanche slope shading overlayed on the map</span>' +
        '<input type="range" id="avyOpac" style="display:' + (settings.avy || settings.category == 'snow' && settings.avy != true && settings.aspect != true ? 'block' : 'none') + ';margin-top:0.5em" min="0" max="100" step="5" value="' + (settings.avyOpac ? settings.avyOpac : 40) + '">' +
        '<div class="legend avy"' + (settings.avy || settings.category == 'snow' && settings.avy != true && settings.aspect != true ? ' style="display:flex"' : '') + '><div class="colors"></div><div class="labels"><div>27-29&deg;</div><div>30-31&deg;</div><div>32-34&deg;</div><div>35-45&deg;</div><div>46-50&deg;</div><div>51-59&deg;</div><div>>60&deg;</div></div></div></div></li>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="aspect"' + (settings.aspect ? ' checked' : '') + '></div><div class="desc"><label>Aspect</label><span>Visualize cardinal directions of terrain aspect</span>' +
        '<input type="range" id="aspOpac" style="display:' + (settings.aspect ? 'block' : 'none') + ';margin-top:0.5em" min="0" max="100" step="5" value="' + (settings.aspOpac ? settings.aspOpac : 40) + '">' +
        '<div class="legend aspect"' + (settings.aspect ? ' style="display:flex"' : '') + '><div class="colors"></div><div class="labels"><div>N</div><div>NE</div><div>E</div><div>SE</div><div>S</div><div>SW</div><div>W</div><div>NW</div></div></div></div>' +
        '<li><div class="checkbox"><input type="checkbox" class="layer-option" data-layer="usfs"' + (settings.usfs ? ' checked' : '') + '></div><div class="desc"><label>USFS Boundaries</label><span>Find US Forest Service boundaries throughout the map</span></div></li>' +
        '</ul></div>';

    modal.innerHTML = l;
    modal.style.display = 'flex';
    modal.querySelector('#a').innerHTML = 'Layers';

    modal.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + modal.querySelector('#avyOpac').value + '%, transparent ' + modal.querySelector('#avyOpac').value + '%)';
    modal.querySelector('#aspOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + modal.querySelector('#aspOpac').value + '%, transparent ' + modal.querySelector('#aspOpac').value + '%)';
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        var s;
        s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

window.onload = () => {
    if (window.location.search.search('logout=1') >= 0) {
        history.pushState({}, '', document.location.href.replace('?logout=1', ''));
    }

    /* save settings automatically after the first minute, then every 5 minutes */
    setTimeout(() => {
        saveSession(true);

        setInterval(() => {
            saveSession(true);
        }, 300000);
    }, 60000);

    /* clear trail GIS cache in the local storage if the data is older than 15 days */
    if (store.getItem(GIS_CACHE_TIME) && ((new Date().getTime() - store.getItem(GIS_CACHE_TIME)) / 1000) > (60 * 60 * 24 * 15)) {
        store.removeItem(GIS_TIDS);
        store.removeItem(GIS_CACHE);
        store.removeItem(GIS_CACHE_TIME);
    }

    /* add draw controls to map if premium or admin user */
    if (hasPermission(user, actions.DRAW)) {
        var lineOps = {
            hintlineStyle: {
                color: '#ed254e',
                opacity: 0.5,
                dashArray: [5, 5],
                dashOffset: 5,
                weight: 4
            },
            templineStyle: {
                color: '#ed254e',
                weight: 4
            },
            pane: 'trail'
        };

        let addPMControls = setInterval(() => {
            if (map.pm && !mapPMLoaded) {
                mapPMLoaded = true;
                clearInterval(addPMControls);

                map.pm.addControls({
                    position: 'bottomright',
                    drawMarker: true,
                    drawPolyline: true,
                    drawPolygon: true,
                    drawRectangle: false,
                    drawCircle: false,
                    drawCircleMarker: false,
                    cutPolygon: false,
                    editMode: false,
                    removalMode: false
                });

                document.querySelector('.leaflet-pm-toolbar:first-child').remove();

                map.pm.enableDraw('Poly', lineOps);
                map.pm.disableDraw('Poly');
                map.pm.enableDraw('Line', lineOps);
                map.pm.disableDraw('Line');
                map.pm.enableDraw('Marker', {
                    markerStyle: {
                        opacity: 0.8,
                        draggable: true,
                        icon: userIcon
                    },
                    pane: 'trail'
                });
                map.pm.disableDraw('Marker');
            }
        }, 150);

        /* on create new marker, polyline, or polygon listener */
        map.on('pm:create', async (e) => {
            var layer = e.layer,
                type,
                id = assignLayerID(),
                coords,
                extra = '',
                popcnt = '',
                elev;

            /* if object is a marker */
            if (e.shape == 'Marker') {
                type = 'Point';
                map.pm.disableDraw('Marker');

                layer.setOpacity(1).setIcon(userIcon);

                coords = layer.getLatLng();
                await Topography.getTopography({
                    lat: coords.lat,
                    lng: coords.lng
                }, {
                    token: mapboxToken
                }).then(async (data) => {
                    elev = [
                        data.elevation * 3.28084,
                        data.slope,
                        data.aspect
                    ];

                    /*await getElevation([coords.lat, coords.lng]).then((u) => {
                        elev = [parseFloat((u.value * 3.28084).toFixed(1)), u.processedValues[1], u.processedValues[2]];
                    });*/
                    popcnt = '<div class="row"><div class="col title">Coordinates</div><div class="col">' + numberFormat(coords.lat, 4) + ', ' + numberFormat(coords.lng, 4) + '</div></div>' +
                        '<div class="row"><div class="col title">Elevation</div><div class="col">' + numberFormat(elev[0], 1) + ' ft.</div></div>' +
                        '<div class="row"><div class="col title">Slope</div><div class="col">' + Math.round(elev[1]) + '&deg;</div></div>' +
                        '<div class="row"><div class="col title">Aspect</div><div class="col">' + new Calculate().getCompassDirection(elev[2]) + '</div></div>';
                });

                /* if object is a polyline */
            } else if (e.shape == 'Line') {
                type = 'Track';
                map.pm.disableDraw('Line');

                layer.setStyle({
                    color: '#00385c',
                    weight: 6
                });

                var coords = layer.getLatLngs(),
                    trackStats = [],
                    dist = 0;

                for (var i = 1; i < coords.length; i++) {
                    var x = i - 1;

                    await Topography.getTopography({
                        lat: coords[i].lat,
                        lng: coords[i].lng
                    }, {
                        token: mapboxToken
                    }).then(async (data) => {
                        trackStats.push([
                            data.elevation * 3.28084,
                            data.slope,
                            data.aspect
                        ]);
                    });

                    dist += new Calculate().distance(coords[i].lat, coords[i].lng, coords[x].lat, coords[x].lng);
                }

                /*getProfile(id, coords, layer);*/
                extra = numberFormat(dist.toFixed(2));
                popcnt = '<div class="row"><div class="col title">Distance</div><div class="col">' + extra + ' mi.</div></div>';

                /* if object is a polygon */
            } else if (e.shape == 'Polygon') {
                type = 'Polygon';
                map.pm.disableDraw('Poly');

                layer.setStyle({
                    color: '#00385c',
                    weight: 6,
                    opacity: 1,
                    fillOpacity: 0.3
                });

                coords = layer.getLatLngs()[0];
                extra = new Calculate().calculateArea(coords);
                popcnt = '<div class="row"><div class="col title">Area</div><div class="col">' + extra + ' sq. mi.</div></div>' +
                    '<div class="row"><div class="col title">Points</div><div class="col">' + coords.length + '</div></div>';
            }

            /* add an ID and a popup to the layer */
            layer.options.title = 'Untitled ' + type;
            layer.options.id = id;
            layer.bindPopup(popup('Untitled ' + type, popcnt), {
                className: 'trail-popup',
                closeOnClick: false,
                minWidth: 250,
                maxWidth: 275
            })
                .on('click', () => {
                    openUserUploadsModal();
                    document.querySelector('#modal .content li[rel=import]').classList.remove('active');
                    document.querySelector('#modal .content li[rel=draw]').classList.add('active');
                    document.querySelector('#modal .tab-content[data-tab=import]').classList.remove('active');
                    document.querySelector('#modal .tab-content[data-tab=draw]').classList.add('active');
                });

            const comp = {
                0: id,
                1: new Date().getTime(),
                2: type,
                3: extra,
                4: coords,
                5: (elev ? elev : 0),
                6: '',
                7: (trackStats ? trackStats : null)
            };

            /* various methods for saving depending on if this is the first object saved, or n-th object */
            if (!store.getItem('draw')) {
                store.setItem('draw', JSON.stringify([comp]));
            } else {
                var arr = JSON.parse(store.getItem('draw'));
                arr.push(comp);
                store.setItem('draw', JSON.stringify(arr));
            }

            /* do modal content for leaflet draw */
            getCustomDraw(id);

            editableLayers.addLayer(layer);
        });
    }
};

function onLoad() {
    var webMap = document.querySelector('#map'),
        center = settings.center,
        zoom = settings.zoom,
        category = (settings.category ? settings.category : null),
        activity = (settings.activity ? settings.activity.replace('-', ' ') : null),
        area = (settings.area ? settings.area.replace('-', ' ') : null);

    getWeather(center, false);

    if (webMap.getAttribute('data-lat') != null && webMap.getAttribute('data-lon') != null) {
        center = [webMap.getAttribute('data-lat'), webMap.getAttribute('data-lon')];
    }

    if (webMap.getAttribute('data-zoom')) {
        zoom = webMap.getAttribute('data-zoom');
    }

    if (!user.uid) {
        store.removeItem('files');
    }

    /* append custom user content wrapper into body for initialization, then delete it after it has been opened at least once in the modal*/
    document.body.insertAdjacentHTML('beforeend', '<div id="userFiles" style="display:none">' + userFiles + '</div>');

    map = L.map('map', {
        center: center,
        zoom: zoom,
        preferCanvas: false,
        zoomControl: false,
        maxZoom: 22,
        fullscreenControl: {
            pseudoFullscreen: false,
            preferCanvas: true,
            position: 'bottomright'
        }
    }).on('contextmenu', (e) => {
        /*const lat = e.latlng.lat,
            lon = e.latlng.lng;

        Topography.getTopography(e.latlng, {
            token: mapboxToken
        }).then(async (data) => {
            context = L.popup(e.latlng, {
                minWidth: 250,
                maxWidth: 250
            })
                .setContent('<span style="color:#282829;font-size:14px"><p style="color:var(--blue);font-size:15px;font-weight:bold;margin:0 0 7.5px 0">' + lat.toFixed(5) + ', ' + lon.toFixed(5) + '</p>' +
                    '<b style="color:var(--gray)">DMS</b><br>' + convertToDms(lat, false) + ', ' + convertToDms(lon, true) + '<br>' +
                    '<b style="color:var(--gray)">Elevation</b><br><span id="el">' + numberFormat(data.elevation * 3.28084, 1) + ' ft.</span><br>' +
                    '<b style="color:var(--gray)">Slope</b><br><span id="el">' + Math.round(data.slope) + '&deg;</span><br>' +
                    '<b style="color:var(--gray)">Aspect</b><br><span id="el">' + new Calculate().getCompassDirection(data.aspect) + '</span><br>' +
                    '<span id="nf-cont"><b style="color:var(--gray)">National Forest</b><br><span id="nf">--</span><br></span>' +
                    '<span id="wild-cont"><b style="color:var(--gray)">Wilderness</b><br><span id="wild">--</span><br></span>' +
                    '<b style="color:var(--gray)">Weather</b><br><a href="#" onclick="wxForecast(' + lat + ', ' + lon + ', true);context.closePopup();return false">Point Forecast</a><br>' +
                    '<a target="blank" href="https://www.windy.com/-Temperature-temp?temp,' + lat + ',' + lon + ',11">Windy</a></span>')
                .openOn(map);

            var fd = new FormData();
            fd.append('lat', lat);
            fd.append('lon', lon);

            const resp = await fetch(host + 'api/v1/usfs?key=' + key, {
                method: 'POST',
                body: fd
            });

            if (resp.ok) {
                const r = await resp.json();

                if (r.data.forest != null) {
                    document.querySelector('span#nf').innerHTML = r.data.forest;
                } else {
                    document.querySelector('#nf-cont').remove();
                }

                if (r.data.wilderness != null) {
                    document.querySelector('span#wild').innerHTML = r.data.wilderness;
                } else {
                    document.querySelector('#wild-cont').remove();
                }
            }
        });*/
    })
        .on('popupopen', () => {
            document.querySelector('.leaflet-popup-close-button').innerHTML = '<i class="fat fa-xmark"></i>';
        })
        .on('popupclose', () => {
            if (pls != undefined) {
                lines.setFeatureStyle(pls[0], {
                    weight: pls[1],
                    color: pls[2],
                    opacity: pls[3]
                });

                pls = undefined;
                /*pls.removeFrom(map);
        
                curSel.setStyle({
                    weight: 5
                });*/
            }
            /*if (pls != undefined) {
                pls.removeFrom(map);

                curSel.setStyle({
                    weight: 5
                });
            }*/
        })
        .on('zoomend', (e) => {
            updateURI();

            vectorIDs.forEach((v) => {
                lines.setFeatureStyle({
                    weight: trailZoom(map.getZoom())
                });
            });

            /*if (map.getZoom() <= 9) {
                lines.setOpacity(0);
            } else {
                if (lines.options.opacity != 1) {
                    lines.setOpacity(1);
                }
                
                vectorIDs.forEach((v) => {
                    const feat = lines.getFeature(v);

                    lines.setFeatureStyle(v, {
                        weight: trailZoom(map.getZoom()),
                        color: (feat != undefined ? feat.options.color : 'red'),
                        opacity: (feat != undefined ? feat.options.opacity : 1)
                    });
                });
            }*/
        })
        .on('movestart', (e) => {
            startLat = map.getCenter().lat;
            startLon = map.getCenter().lng;
        })
        .on('moveend', () => {
            let z = map.getZoom();
            updateURI();
            getWeather(map.getBounds());

            if (lines == undefined) {
                if (z >= 11 && settings.trails) {
                    getTrailData();
                }
            } else {
                if (z >= 11) {
                    if (settings.trails) {
                        map.addLayer(lines);
                    }
                } else {
                    map.removeLayer(lines);
                }
            }

            if (wyp === true) {
                if (z >= 12) {
                    if (settings.waypoints) {
                        map.addLayer(waypoints);
                    }
                } else {
                    map.removeLayer(waypoints);
                }
            } else {
                if (z >= 12) {
                    getWaypoints();
                }
            }
        });

    L.DomEvent.fakeStop = () => {
        return true;
    };

    /* add scale to map */
    L.control.scale({
        imperial: true,
        metric: false
    }).addTo(map);

    /* add zoom control to map */
    L.control.zoom({
        position: 'bottomright'
    })
        .addTo(map);

    map.createPane('trail');
    map.createPane('dec');
    map.createPane('waypoints');

    map.getPane('trail').style.zIndex = 400;
    map.getPane('dec').style.zIndex = 675;
    map.getPane('waypoints').style.zIndex = 750;

    /* set map tile */
    setMapType();

    if (settings.usfs) {
        usfs.addTo(map).bringToFront();
        fsrds.addTo(map).bringToFront();
    }

    /* custom style for the map zoom controls */
    document.querySelectorAll('.leaflet-control-zoom-in span, .leaflet-control-zoom-out span').forEach((e) => {
        e.remove();
    });
    document.querySelector('.leaflet-control-zoom-in').innerHTML = '<i class="far fa-plus"></i>';
    document.querySelector('.leaflet-control-zoom-out').innerHTML = '<i class="far fa-minus"></i>';

    /* initialize features on the map */
    init();

    document.querySelector('#close-navbar').onclick = (e) => {
        if (e.target.getAttribute('data-open') == '1') {
            e.target.setAttribute('data-open', '0');
            e.target.classList.remove('fa-chevron-left');
            e.target.classList.add('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '40px');
            document.querySelector('nav').classList.add('hide');
        } else {
            e.target.setAttribute('data-open', '1');
            e.target.classList.add('fa-chevron-left');
            e.target.classList.remove('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '100px');
            document.querySelector('nav').classList.remove('hide');
        }
    };

    /* when user types text in the search box */
    document.getElementById('q').onkeyup = (e) => {
        search(document.getElementById('q').value, e);
    };

    document.getElementById('q').onkeydown = (e) => {
        clearTimeout(typeTimer);
    };

    document.getElementById('closeSearch').onclick = (e) => {
        e.target.style.display = 'none';
        document.getElementById('q').value = '';
        document.getElementById('q').blur();
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('search-results').innerHTML = '';
    };

    document.getElementById('account').onclick = () => {
        if (user.uid) {
            window.location.href = domain + 'account/home?ref=mapotrails';
        } else {
            window.location.href = domain + 'secure/login?service=mapotrails&next=' + encodeURIComponent(window.location.href);
        }
    };

    /* open basemap menu */
    document.getElementById('basemap').onclick = () => {
        const modal = document.querySelector('#modal');

        let l = modalHeader + '<div class="content"><ul class="layers-list">';

        tileNames.forEach((n, c) => {
            let p = true;

            l += (p === true ? '<li><div class="radio"><input type="radio" class="basemap-option" name="bsmo" data-tile="' + n + '"' + (n == settings.tile ? ' checked' : '') + '></div><div class="desc"><label>' +
                (n == 'caltopo' ? 'CalTopo' : (n == 'fs16' ? 'USFS 2016' : (n == 'osm' ? 'Open Street Map' : (n == 'outdoors' ? 'Outdoors' : ucwords(n))))) + '</label></div></li>' : '');
        });

        modal.innerHTML = l + '</ul></div>';
        modal.style.display = 'flex';
        modal.querySelector('#a').innerHTML = 'Basemaps';
    };

    /* open layers menu */
    document.querySelector('#layer-group').onclick = () => {
        openLayers();
    };

    /* get user location on click */
    document.querySelector('#mylocation').onclick = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            alert('Geolocation is not supported by this browser.', 'error');
        }
    };

    /* go to NWS forecast */
    document.querySelector('#weather').onclick = (e) => {
        var c = map.getCenter(),
            a = c.lat,
            b = c.lng;

        document.querySelector('#modal').innerHTML = weather;
        document.querySelector('#modal').style.display = 'flex';

        wxForecast(a, b);
    };

    /* view user uploaded GIS */
    document.querySelector('#userUploads').onclick = () => {
        openUserUploadsModal();
    };

    /* import GPX, geojson, KML files */
    document.querySelector('#import').onclick = () => {
        document.getElementById('modal').innerHTML = upload;
        document.getElementById('modal').style.display = 'flex';
        document.querySelector('#modal #a').innerHTML = 'Import a File';
    };

    /* sync map settings */
    document.querySelector('#save').onclick = () => {
        saveSession(false);
    };
}

/* avy & aspect opacity slider on input */
window.addEventListener('input', (e) => {
    if (e.target.id == 'avyOpac') {
        document.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + e.target.value + '%, transparent ' + e.target.value + '%)';
        avy.setOpacity(e.target.value / 100);
        settings.avyOpac = e.target.value;
    }

    if (e.target.id == 'aspOpac') {
        document.querySelector('#aspOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + e.target.value + '%, transparent ' + e.target.value + '%)';
        aspectLayer.setOpacity(e.target.value / 100);
        settings.aspOpac = e.target.value;
    }
});

window.addEventListener('change', (e) => {
    const t = e.target;

    /* avy opacity slider (on change) */
    if (t.id == 'avyOpac') {
        document.querySelector('#avyOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + t.value + '%, transparent ' + t.value + '%)';
        avy.setOpacity(t.value / 100);
        settings.avyOpac = t.value;
    }

    /* aspect opacity slider (on change) */
    if (t.id == 'aspOpac') {
        document.querySelector('#aspOpac').style.backgroundImage = 'linear-gradient(to right, rgb(131 182 146 / 55%) 0%, rgb(131 182 146 / 55%) ' + t.value + '%, transparent ' + t.value + '%)';
        aspectLayer.setOpacity(t.value / 100);
        settings.aspOpac = t.value;
    }

    /* toggle basemap */
    if (t.classList.contains('basemap-option')) {
        settings.tile = t.getAttribute('data-tile');
        setMapType();
    }

    /* toggle layers on/off */
    if (t.classList.contains('layer-option')) {
        const isChecked = t.checked,
            lay = t.getAttribute('data-layer');

        settings[lay] = isChecked;

        if (lay == 'trailheads') {
            isChecked ? map.addLayer(trails) : map.removeLayer(trails);
        } else if (lay == 'trails') {
            isChecked ? map.addLayer(lines) : map.removeLayer(lines);
        } else if (lay == 'snotel') {
            if (snotel === undefined) {
                getSnotels();
            } else {
                isChecked ? snotel.addTo(map) : snotel.removeFrom(map);
            }
        } else if (lay == 'waypoints') {
            if (waypoints === undefined) {
                getWaypoints();
            } else {
                isChecked ? waypoints.addTo(map) : waypoints.removeFrom(map);
            }
        } else if (lay == 'avy') {
            isChecked ? avy.addTo(map).bringToFront() : avy.removeFrom(map);
            document.querySelector('#avyOpac').style.display = (isChecked ? 'block' : 'none');
            document.querySelector('.legend.avy').style.display = (isChecked ? 'flex' : 'none');
        } else if (lay == 'aspect') {
            isChecked ? aspectLayer.addTo(map).bringToFront() : aspectLayer.removeFrom(map);
            document.querySelector('#aspOpac').style.display = (isChecked ? 'block' : 'none');
            document.querySelector('.legend.aspect').style.display = (isChecked ? 'flex' : 'none');
        } else if (lay == 'usfs') {
            isChecked ? usfs.addTo(map).bringToFront() : usfs.removeFrom(map);
            isChecked ? fsrds.addTo(map).bringToFront() : fsrds.removeFrom(map);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    onLoad();
});

document.onreadystatechange = async () => {
    if (document.readyState == 'complete') {
        let token;

        document.cookie.split('; ').forEach((t) => {
            const a = t.split('=');
            if (a[0] == 'token') {
                token = a[1];
            }
        });

        const fd = new FormData();
        fd.append('token', token);

        await fetch(apiURL + 'subscriptions?key=' + key, {
            method: 'POST',
            body: fd
        }).then(async (resp) => {
            const json = await resp.json();
            subscribe = json.subscriptions;
            validSubscription();
        });
    }

    /*if (document.readyState !== 'loading') {
        onLoad();
    }/* else {
        document.addEventListener('DOMContentLoaded', () => {
            onLoad();
        });
    }*/
};

/* window click event listener */
window.addEventListener('click', async (e) => {
    let t = e.target;

    /* copy to clipboard */
    if (t.classList.contains('copyData')) {
        navigator.clipboard.writeText(t.parentElement.innerHTML.match(/([0-9.,\-\sa-z]+)/)[1]);
        alert('Copied to clipboard');
    }

    /* export a custom feature or grouping */
    if (t.classList.contains('fa-file-export')) {
        if (t.getAttribute('data-type') == 'item') {
            editableLayers.getLayers().forEach((l) => {
                if (l.options.id == t.getAttribute('data-id')) {
                    let coords = [];

                    if (l._latlngs !== undefined) {
                        if (t.getAttribute('data-geo') == 'Polygon') {
                            let tmp = [];

                            for (let x = 0; x < l.getLatLngs().length; x++) {
                                for (let i = 0; i < l.getLatLngs()[x].length; i++) {
                                    tmp.push([l.getLatLngs()[x][i].lng, l.getLatLngs()[x][i].lat]);
                                }

                                tmp.push([l.getLatLngs()[x][0].lng, l.getLatLngs()[x][0].lat]);
                                coords.push(tmp);
                            }
                        } else {
                            for (let i = 0; i < l.getLatLngs().length; i++) {
                                coords.push([l.getLatLngs()[i].lng, l.getLatLngs()[i].lat]);
                            }
                        }
                    } else {
                        coords = [l.getLatLng().lng, l.getLatLng().lat];
                    }

                    l.options.title = t.getAttribute('data-name');

                    const json = {
                        type: 'FeatureCollection',
                        features: [
                            {
                                type: 'Feature',
                                geometry: {
                                    type: (t.getAttribute('data-geo') == 'Track' ? 'LineString' : t.getAttribute('data-geo')),
                                    coordinates: coords
                                },
                                properties: l.options
                            }
                        ]
                    };

                    downloadFile(json, t.getAttribute('data-name'), 'geojson');
                }
            });
        } else {
            let features = [],
                draw = JSON.parse(localStorage.getItem('draw'));

            editableLayers.getLayers().forEach((lay, n) => {
                let coords = [];

                if (draw[n][2] == 'Point') {
                    coords = [lay.getLatLng().lng, lay.getLatLng().lat];
                } else if (draw[n][2] == 'Polygon') {
                    let tmp = [];

                    for (let x = 0; x < lay.getLatLngs().length; x++) {
                        for (let i = 0; i < lay.getLatLngs()[x].length; i++) {
                            tmp.push([lay.getLatLngs()[x][i].lng, lay.getLatLngs()[x][i].lat]);
                        }

                        tmp.push([lay.getLatLngs()[x][0].lng, lay.getLatLngs()[x][0].lat]);
                        coords.push(tmp);
                    }
                } else {
                    for (let i = 0; i < lay._latlngs.length; i++) {
                        coords.push([lay._latlngs[i].lng, lay._latlngs[i].lat]);
                    }
                }

                lay.options.title = draw[n][6];

                features.push({
                    type: 'Feature',
                    geometry: {
                        type: (draw[n][2] == 'Track' ? 'LineString' : draw[n][2]),
                        coordinates: coords
                    },
                    properties: lay.options
                });
            });

            const json = {
                type: 'FeatureCollection',
                features: features
            };

            downloadFile(json, user.first_name + '\'s GIS data', 'geojson');
        }
    }

    /* open user content panel when adding GIS feature */
    if (t.classList.contains('control-icon')) {
        openUserUploadsModal('custom');
    }

    /* switch between tabbed content */
    if (t.classList.contains('li-tab')) {
        const tab = t.getAttribute('rel');

        document.querySelectorAll('.tabs li').forEach((o) => {
            if (o.getAttribute('rel') == tab) {
                o.classList.add('active');
            } else {
                o.classList.remove('active');
            }

            if (tab == 'fcst' || tab == 'cur') {
                const ma = document.querySelector('#modal #a');
                const bk = ma.getAttribute('data-bk');
                ma.setAttribute('data-bk', ma.innerHTML);
                ma.innerHTML = bk;
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

    /* favorite a trail */
    if (t.id == 'favTrail') {
        const trailID = t.getAttribute('data-id');

        if (favTrails.includes(trailID)) {
            alert('This trail is already in your list of favorites.', 'error');
        } else {
            const fd = new FormData();
            fd.append('tid', trailID);

            const resp = await fetch(host + 'api/v1/favorite/' + (t.getAttribute('data-favorite') == 0 ? 'add' : 'remove') + '?key=' + key, {
                method: 'POST',
                body: fd
            });

            if (resp.ok) {
                const api = await resp.json();

                if (api.success == 'added') {
                    favTrails.push(trailID);
                    t.setAttribute('data-favorite', 1);
                    t.innerHTML = '<i class="fa-sharp fas fa-star"></i> Favorited Trail';
                } else if (api.success == 'removed') {
                    var pos = favTrails.indexOf(trailID);
                    favTrails.splice(pos, 1);
                    t.setAttribute('data-favorite', 0);
                    t.classList.add('btn-yellow');
                    t.classList.remove('btn-red');
                    t.innerHTML = '<i class="fa-sharp far fa-star"></i> Favorite Trail';
                }
            }
        }
    }
});

/* change fav trail button to "unfavorite" on hover */
document.onmouseover = (e) => {
    const z = e.target;

    if (z.id == 'favTrail' && z.getAttribute('data-favorite') == 1) {
        z.classList.add('btn-red');
        z.classList.remove('btn-yellow');
        z.innerHTML = '<i class="fas fa-xmark"></i> Unfavorite?';
    }

    if (z.classList != undefined && z.classList.contains('ttip')) {
        var a = JSON.parse(z.getAttribute('data-tooltip')),
            p = z.getBoundingClientRect(),
            t = p.top,
            l = p.left,
            r = window.outerWidth,
            w = p.width,
            h = p.height,
            top = 0,
            left = 0,
            right = 0;

        if (a.dir == 'left') {
            top = (t + (h / 2) - 12);
            left = (l + w + 12);
        } else if (a.dir == 'right') {
            top = (t + (h / 2) - 12);
            left = 'unset';
            right = r - l + 12;
        } else if (a.dir == 'top') {
            top = t - 32;
            left = l - w;
        } else if (a.dir == 'bottom') {
            top = t + h + 19;
            left = l - w;
        }

        if (document.querySelectorAll('.tooltip').length > 0) {
            document.querySelectorAll('.tooltip').forEach((o) => {
                o.remove();
            });
        }

        document.body.insertAdjacentHTML('beforeend', '<div class="tooltip ' + a.dir + '" style="top:' + top + 'px;left:' + (left == 'unset' ? 'unset' : left + 'px') + (right != 0 ? ';right:' + right + 'px' : '') + '"><p>' + a.text + '</p></div>');
    }
};

document.onmouseout = (e) => {
    const z = e.target;

    if (z.id == 'favTrail' && z.getAttribute('data-favorite') == 1) {
        z.classList.add('btn-yellow');
        z.classList.remove('btn-red');
        z.innerHTML = '<i class="fa-sharp fas fa-star"></i> Favorited Trail';
    }

    if (z.classList != undefined && z.classList.contains('ttip') && document.contains(document.querySelector('.tooltip'))) {
        document.querySelectorAll('.tooltip').forEach((i) => {
            i.remove();
        });
    }
};

/* on mouse up with the DOM */
window.addEventListener('mouseup', (e) => {
    var target = e.target,
        tc = document.querySelector('#tileChange'),
        sc = document.querySelector('.searchControl'),
        sr = document.querySelector('#search-results');

    if (target !== tc && !tc.contains(target)) {
        tc.style.display = 'none';
        /*document.querySelectorAll('#tileChange .select-styled, #tileChange .select-options').forEach((p) => {
            p.classList.remove('active');
        });*/
    }

    if (target !== sc && !sc.contains(target) && target !== sr && !sr.contains(target)/* && sc.classList.contains('in-use')*/) {
        document.querySelector('#q').value = '';
        /*sc.classList.remove('in-use');*/
        sr.style.display = 'none';
    }
});

L.Control.Fullscreen = L.Control.extend({ options: { position: "topleft", title: { "false": "Go Fullscreen", "true": "Exit Fullscreen" } }, onAdd: function (map) { var container = L.DomUtil.create("div", "leaflet-control-fullscreen leaflet-bar leaflet-control"); this.link = L.DomUtil.create("a", "leaflet-control-fullscreen-button leaflet-bar-part", container); this.link.href = "#"; this._map = map; this._map.on("fullscreenchange", this._toggleTitle, this); this._toggleTitle(); L.DomEvent.on(this.link, "click", this._click, this); return container }, _click: function (e) { L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e); this._map.toggleFullscreen(this.options) }, _toggleTitle: function () { this.link.title = this.options.title[this._map.isFullscreen()] } }); L.Map.include({ isFullscreen: function () { return this._isFullscreen || false }, toggleFullscreen: function (options) { var container = this.getContainer(); if (this.isFullscreen()) { if (options && options.pseudoFullscreen) { this._disablePseudoFullscreen(container) } else if (document.exitFullscreen) { document.exitFullscreen() } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen() } else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen() } else if (document.msExitFullscreen) { document.msExitFullscreen() } else { this._disablePseudoFullscreen(container) } } else { if (options && options.pseudoFullscreen) { this._enablePseudoFullscreen(container) } else if (container.requestFullscreen) { container.requestFullscreen() } else if (container.mozRequestFullScreen) { container.mozRequestFullScreen() } else if (container.webkitRequestFullscreen) { container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) } else if (container.msRequestFullscreen) { container.msRequestFullscreen() } else { this._enablePseudoFullscreen(container) } } }, _enablePseudoFullscreen: function (container) { L.DomUtil.addClass(container, "leaflet-pseudo-fullscreen"); this._setFullscreen(true); this.invalidateSize(); this.fire("fullscreenchange") }, _disablePseudoFullscreen: function (container) { L.DomUtil.removeClass(container, "leaflet-pseudo-fullscreen"); this._setFullscreen(false); this.invalidateSize(); this.fire("fullscreenchange") }, _setFullscreen: function (fullscreen) { this._isFullscreen = fullscreen; var container = this.getContainer(); if (fullscreen) { L.DomUtil.addClass(container, "leaflet-fullscreen-on") } else { L.DomUtil.removeClass(container, "leaflet-fullscreen-on") } }, _onFullscreenChange: function (e) { var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement; if (fullscreenElement === this.getContainer() && !this._isFullscreen) { this._setFullscreen(true); this.fire("fullscreenchange") } else if (fullscreenElement !== this.getContainer() && this._isFullscreen) { this._setFullscreen(false); this.fire("fullscreenchange") } } }); L.Map.mergeOptions({ fullscreenControl: false }); L.Map.addInitHook(function () { if (this.options.fullscreenControl) { this.fullscreenControl = new L.Control.Fullscreen(this.options.fullscreenControl); this.addControl(this.fullscreenControl) } var fullscreenchange; if ("onfullscreenchange" in document) { fullscreenchange = "fullscreenchange" } else if ("onmozfullscreenchange" in document) { fullscreenchange = "mozfullscreenchange" } else if ("onwebkitfullscreenchange" in document) { fullscreenchange = "webkitfullscreenchange" } else if ("onmsfullscreenchange" in document) { fullscreenchange = "MSFullscreenChange" } if (fullscreenchange) { var onFullscreenChange = L.bind(this._onFullscreenChange, this); this.whenReady(function () { L.DomEvent.on(document, fullscreenchange, onFullscreenChange) }); this.on("unload", function () { L.DomEvent.off(document, fullscreenchange, onFullscreenChange) }) } }); L.control.fullscreen = function (options) { return new L.Control.Fullscreen(options) };