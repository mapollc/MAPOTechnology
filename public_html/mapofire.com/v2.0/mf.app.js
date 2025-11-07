let map,
    host = 'https://www.mapofire.com/',
    domain = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    apiKey = '50e2c43f8f63ff0ed20127ee2487f15e',
    productName = 'Map of Fire',
    company = 'MAPO LLC',
    sub_id = 'price_1MgxhSIpCdpJm6cTaKp2dqf5',
    donateLink = 'https://donate.stripe.com/3csg1F7PF8gpfni003?__prefilled_amount=2500',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    defaultAttr = '&copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a> ',
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    curTime = new Date(),
    conversion,
    settings,
    CLUSTER_FIRES = true,
    highchartsLoad = false,
    hrrrSmokeTime = {
        'init': gmtime(-3600),
        'fcst': gmtime(+3600)
    },
    defaultTitle = document.body.getAttribute('data-title'),
    defaultDesc = document.body.getAttribute('data-desc'),
    dispatchCenters,
    selectedPerim = null,
    topFires = [],
    clicks = [],
    activeIncidents = [],
    radarImgs = [],
    radarAnim,
    RADAR_INT = 500,
    radarPlay = true,
    tracked = [],
    trackedDone = false,
    airQualityStns = [],
    premFeature = '<i class="fas fa-lock" style="color:#656565" title="Subscribe to Map of Fire Premium to gain access to this feature"></i>',
    tileNames = ['outdoors', 'satellite', /*'caltopo',*/ 'fs16', 'dark',/* 'delorme',*/ 'osm', 'terrain'],
    tilePerms = [0, 0, /*1,*/ 1, 1, 0, 0],
    icons = ['', 'out', 'big', 'controlled', 'contained', 'large', 'complex', 'new', 'new-big', 'rx', 'smoke'],
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
    /*terrain = {
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
    },*/
    caltopo = {
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'ct': {
                type: 'raster',
                tiles: [domain + 'assets/images/tiles/2/{z}/{x}/{y}.png'],
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
                tiles: [domain + 'assets/images/tiles/3/{z}/{x}/{y}.png'],
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
        'satellite': 'mapbox://styles/mapollc/clvh22ic505rn01pkdic7evid',
        'osm': osm,
        'fs16': fs16,
        'caltopo': caltopo,
        /*'terrain': terrain*/
        'dark': 'mapbox://styles/mapbox/dark-v11',
        'terrain': 'mapbox://styles/mapbox/streets-v12'
    },
    modal = document.querySelector('#modal'),
    impact = document.querySelector('#impact'),
    disclaimer = 'This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.',
    impactHeader = '<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" onclick="closeImpact()" title="Close window">' +
        '<i class="far fa-xmark"></i></div></header>',
    userSettingsForm = '<div id="settings"><div class="r"><div class="var">Save Frequency</div><div class="input"><select id="saveFreq">' +
        '<option value="60000">1 min</option>' +
        '<option value="300000">5 mins</option>' +
        '<option value="600000">10 mins</option>' +
        '<option value="900000">15 mins</option>' +
        '<option value="1800000">30 mins</option></select></div></div>' +
        '<div class="r"><div class="var">Perimeter Color</div><div class="input"><select id="perimColor">' +
        '<option value="default">Default</option>' +
        '<option value="red">Red</option>' +
        '<option value="blue">Blue</option>' +
        '<option value="orange">Orange</option>' +
        '<option value="green">Green</option>' +
        '<option value="purple">Purple</option>' +
        '<option value="brown">Brown</option>' +
        '<option value="black">Black</option></select></div></div>' +
        '<div class="r"><div class="var">Perimeter Tooltip</div><div class="input"><select id="perimTtip">' +
        '<option value="1">Yes</option>' +
        '<option value="0">No</option></select></div></div>' +
        '<div class="r"><div class="var">Perimeter Zoom</div><div class="input"><select id="perimZoom">' +
        '<option value="1">Yes</option>' +
        '<option value="0">No</option></select></div></div>' +
        '<div class="r"><div class="var">Coordinates</div><div class="input"><select id="coordsDisplay">' +
        '<option value="dec">Decimal</option>' +
        '<option value="dms">Degs, Mins, Secs</option>' +
        '<option value="utm">UTM</option></select></div></div>' +
        '<div class="r"><div class="var">Temperature Unit</div><div class="input"><select id="tempUnit">' +
        '<option value="f">&deg;F</option>' +
        '<option value="c">&deg;C</option></select></div></div>' +
        '<div class="r"><div class="var">Wind Speed Unit</div><div class="input"><select id="windSpeedUnit">' +
        '<option value="mph">mph</option>' +
        '<option value="m/s">m/s</option>' +
        '<option value="kts">kts</option>' +
        '<option value="km/h">km/h</option></select></div></div>' +
        '<div class="r"><div class="var">Fire Size Unit</div><div class="input"><select id="acresUnit">' +
        '<option value="acres">acres</option>' +
        '<option value="hectacres">hectacres</option>' +
        '<option value="sqmi">sq. mi.</option>' +
        '<option value="sqkm">sq. km.</option></select></div></div>' +
        '<div class="r"><div class="var">Cache Fire Data</div><div class="input"><select id="locallySave">' +
        '<option value="y">Yes</option>' +
        '<option value="n">No</option></select></div></div>' +
        '<div class="r"><div class="var">Fire Display</div><div class="input"><select id="fireDisplay">' +
        '<option value="page">Open incident page</option>' +
        '<option value="map">On the map</option></select></div></div>' +
        '<div class="my-subs"><h2>Subscriptions</h2><div id="subs"></div></div>' +
        '<div style="margin-top:5em;font-size:12px;text-align:center;color:var(--blue-gray);line-height:1.3">&copy; ' + new Date().getFullYear() +
        ' ' + company + '<br>Version ' + version + '</div></div>',
    fireDisplay = '<div class="container"><div class="incident"><!--start container--><div class="row align-top no-margin max50 fire-header"><div class="col">' +
        '<div class="row column no-margin no-gap"><div class="col"><h1 class="title placeholder" style="width:200px;height:45.5px"><div id="trackFire" style="display:none" class="fa-sharp far fa-star"></div></h1></div><div class="col">' +
        '<span class="coords no-margin placeholder" style="width:136px;height:20px"></span></div></div></div>' +
        '<div class="col"><div class="row no-margin no-wrap agency">' +
        '<div class="col" id="a" style="font-size:15px;text-align:right"><div class="placeholder no-margin" style="width:350px;height:20px"></div></div>' +
        '<div class="col fit" id="b"><div class="placeholder no-margin" style="width:50px;height:50px"></div></div>' +
        '</div></div></div>' +
        '<div class="summ"><div class="ea"><div class="desc" id="c"><div class="placeholder no-margin" style="width:93px;height:28px"></div></div><div class="label">status</div></div>' +
        '<div class="ea"><div class="desc" id="d" style="color:var(--red)"><div class="placeholder no-margin" style="width:140px;height:28px"></div></div><div class="label">size</div></div>' +
        '<div class="ea"><div class="desc" id="e"><div class="placeholder no-margin" style="width:93px;height:28px"></div></div><div class="label">containment</div></div>' +
        '<div class="ea" id="aq"><div class="desc"><div class="placeholder no-margin" style="width:93px;height:28px"></div></div><div class="label">Air Quality</div></div></div>' +
        '<div class="row head"><div class="col"><span id="f"><div class="placeholder no-margin" style="width:160px;height:22px"></div></div>' +
        '<div class="col"><span id="g"><div class="placeholder no-margin" style="width:160px;height:22px"></div></div>' +
        '<div class="col"><span id="h"><div class="placeholder no-margin" style="width:160px;height:22px"></div></div></div>' +
        '<div class="fire-details title no-margin"><h2>Summary</h2><div class="body"><div class="row max50 align-top"><div class="col"><div class="box">' +
        '<div class="icon"><i class="fas fa-location-dot"></i></div>' +
        '<div class="label">Initial Location</div><div class="txt" id="il"><div class="placeholder" style="width:75%;height:22px"></div></div></div></div>' +
        '<div class="col"><div class="box"><div class="icon"><i class="fas fa-tower-observation"></i></div>' +
        '<div class="label">Jurisdiction</div><div class="txt" id="jur"><div class="placeholder" style="width:75%;height:22px"></div></div></div></div></div>' +
        '<div class="row max50 align-top"><div class="col"><div class="box">' +
        '<div class="icon"><i class="fal fa-notes"></i></div>' +
        '<div class="label">Dispatch Notes</div><div class="txt" id="dn"><div class="placeholder" style="width:75%;height:22px"></div></div></div></div>' +
        '<div class="col"><div class="box"><div class="icon"><i class="fad fa-trees"></i></div>' +
        '<div class="label">Fuels</div><div class="txt" id="fu"><div class="placeholder" style="width:75%;height:22px"></div></div></div></div></div>' +
        '<div class="row max50 align-top"><div class="col"><div class="box">' +
        '<div class="icon"><i class="fal fa-sensor-triangle-exclamation"></i></div>' +
        '<div class="label">IA Resources</div><div class="txt" id="ia"><div class="placeholder" style="width:75%;height:22px"></div></div></div></div>' +
        '<div class="col" id="fist"><div class="box"><div class="icon"><i class="fad fa-chart-line"></i></div>' +
        '<div class="label">Fire Status</div><div class="txt"><div class="fs"><div class="placeholder" style="width:75%;height:22px"></div></div></div></div></div></div></div></div>' +
        '<div class="row max50 align-top" id="aw"><div class="col"><div class="fire-details title no-margin">' +
        '<h2>Nearby Weather Conditions</h2>' +
        '<div class="body"><div class="row max33 weather align-top" id="weatherObs">' +
        '<div class="col"><i class="fal fa-temperature-high"></i><span>temperature</span><p id="t1" class="placeholder" style="width:32px;height:20px"></p></div>' +
        '<div class="col"><i class="fal fa-droplet-percent"></i><span>humidity</span><p id="rh1" class="placeholder" style="width:32px;height:20px"></p></div>' +
        '<div class="col"><i class="fal fa-wind"></i><span>wind speed</span><p id="w1" class="placeholder" style="width:64px;height:20px"></p></div></div></div></div></div>' +
        '<div class="col"><div class="fire-details title no-margin"><h2>24-hr Forecast Concerns</h2>' +
        '<div class="body"><div class="row max25 weather align-top" id="incidentForecast">' +
        '<div class="col"><i class="fal fa-temperature-high"></i><span>max temp</span><p id="wv1" class="placeholder" style="width:32px;height:20px"></p></div>' +
        '<div class="col"><i class="fal fa-droplet-percent"></i><span>min humidity</span><p id="wv2" class="placeholder" style="width:32px;height:20px"></p></div>' +
        '<div class="col"><i class="fal fa-wind"></i><span>avg wind speed</span><p id="wv3" class="placeholder" style="width:64px;height:20px"></p></div>' +
        '<div class="col"><i class="fal fa-windsock"></i><span>max wind speed</span><p id="wv4" class="placeholder" style="width:64px;height:20px"></p></div>' +
        '</div></div></div></div></div><div id="ah" class="fire-details title"><h2>Fire Change History</h2><div class="body" id="ah"></div></div>' +
        '<div class="inciweb"></div>' +
        '<div class="fire-details title" id="dc"><h2>Dispatch Center</h2><div class="body"><p class="placeholder" style="width:409px;height:22px"></p>' +
        '<p class="placeholder" style="width:130px;height:22px"></p><p class="placeholder" style="width:130px;height:22px"></p><p class="placeholder" style="width:160px;height:22px"></p></div></div>' +
        '<div class="social"><!--<a class="btn btn-sm btn-green" id="trackFire" href="#">Follow</a>-->' +
        '<i class="fab fa-facebook social" title="Share on Facebook" onclick="socialShare(\'fb\')" aria-hidden="true"></i>' +
        '<span class="sr-only">Share on Facebook</span><i class="fab fa-twitter social" title="Tweet on Twitter" onclick="socialShare(\'tw\')" aria-hidden="true"></i>' +
        '<span class="sr-only">Tweet on Twitter</span><i class="fab fa-tiktok social" title="Find videos on TikTok" onclick="socialShare(\'tt\')" aria-hidden="true"></i>' +
        '<span class="sr-only">Find videos on TikTok</span><i class="fal fa-share-nodes" title="Share: text, email, or copy link" id="sharer" aria-hidden="true"></i>' +
        '<span class="sr-only">Share: text, email, or copy link</span></div>' +
        '<!--<div id="nbm" class="fire-details title"><h2>Temperature & RH Ensembles</h2><div class="body"><div class="chart-wrapper" style="width:100%;height:auto;min-height:400px">' +
        '<div id="spinner" style="display:block;margin:0 auto"></div></div></div></div>-->' +
        '<div class="disclaimer">' + disclaimer + '</div><!--end container--></div></div>',
    wwaTemplate = '<div class="container"><h1 class="title" style="border-color:transparent"><div class="placeholder no-margin" style="width:300px;height:45.5px"></div></h1>' +
        '<div class="row" style="color:#4c4c4c;font-size:18px">' +
        '<div class="col fit"><i class="fas fa-location-dot" style="font-size:25px"></i></div>' +
        '<div class="col" id="a" style="flex:1;line-height:1.3">' +
        '<div class="placeholder no-margin" style="width:100%;height:24px"></div></div></div><div class="row head">' +
        '<div class="col"><span id="b"><div class="placeholder no-margin" style="width:160px;height:22px"></div></span></div>' +
        '<div class="col"><span id="c"><div class="placeholder no-margin" style="width:160px;height:22px"></div></span></div>' +
        '<div class="col"><span id="d"><div class="placeholder no-margin" style="width:160px;height:22px"></div></span></div></div>' +
        '<div class="wwa-details">' +
        '<p class="placeholder" style="width:50px;height:22px"></p>' +
        '<p class="placeholder" style="width:30%;height:22px"></p>' +
        '<p class="placeholder" style="width:60px;height:22px"></p>' +
        '<p class="placeholder" style="width:70%;height:22px"></p>' +
        '<p class="placeholder" style="width:50px;height:22px"></p>' +
        '<p class="placeholder" style="width:65%;height:22px"></p>' +
        '<p class="placeholder" style="width:70px;height:22px"></p>' +
        '<p class="placeholder" style="width:65%;height:22px"></p></div></div>',
    newReport = '<form id="newReport" method="post"><input type="hidden" name="platform" value="web"><input type="hidden" name="authUser" value="0"><input type="hidden" name="lat"><input type="hidden" name="lon"><input type="hidden" name="state">' +
        '<input type="hidden" name="geolocation"><label>State</label><input type="text" id="gs" value="Loading..." disabled><label>General Location</label><input type="text" id="gl" value="Loading..." disabled>' +
        '<label>What type of incident is this?</label><select name="type"><option>- Choose -</option><option value="Wildfire">Wildfire</option><option value="Smoke Check">Smoke Check</option><option value="Prescribed Burn">Prescribed Burn</option></select>' +
        '<label>How big is it?</label><input type="text" name="size" placeholder="eg: 10" style="display:inline-block;max-width:100px"><div id="alab" style="display:inline-block;padding-left:5px">acres</div><label>Brief description of incident:</label>' +
        '<textarea name="notes" placeholder="Anything else you can add..." style="min-height:100px;resize:none"></textarea><div class="btn-group centered"><input type="submit" class="btn btn-blue" value="Submit Report">' +
        '<a class="btn btn-gray" href="#" id="cancelNewRpt" onclick="return false">Cancel</a></div><div class="disclaimer">Submitting this report only sends information to the ' + productName + ' team&mdash;it does not send any information to emergency or governmental authorities. Please call 911 to report a new wildfire.</div></form>',
    layerDesc = {
        'fire': [
            'New wildfires in the last 12 hours',
            'All wildfire incidents',
            'Non-wildfire, smoke checks reported to dispatch centers',
            'Active or planned prescribed burns',
            'Show latest, active mapped wildfire perimeters (some fires only)',
            'See hotspots in the last 24 hours',
            'See hotspots over the last 48 hours',
            'See hotspots over the last 72 hours'
        ],
        'evac': [
            'See detailed mapping of current Oregon evacuation areas'
        ],
        'wx': [
            'See current air quality conditions from the EPA',
            'Overlay lightning strikes within the last hour',
            'Overlay lightning strikes from the last 24 hours',
            'View current weather alerts from the NWS',
            'Review current severe & fire outlooks from the SPC',
            /*'Read the technical fire weather forecast from the NWS',*/
            'See current weather obs at remote automatic weather stations (RAWS)',
            'See radar imagery from the last 2 hours',
            'Visualize various weather forecast models',
            'Visible satellite imagery',
            'Infrared satellite imagery',
            'Water vapor satellite imagery'
        ],
        'plan': [
            'See current national fire danger (NFDRS)',
            'Show significant fire potential outlooks',
            'See each county\'s wildfire risk based on annual loss, vulnerability & resilience',
            'Overlay wildfire risk to homes model',
            'Overlay wildfire supression difficulty model',
            'Overlay current drought conditions',
            'See ERC charts for predictive service areas (PSA)',
            'Overlay fuel/vegatation LANDFIRE model',
        ],
        'gis': [
            'Overlay counties boundaries',
            'Overlay NWS county warning areas',
            'Show USFS national forest & wilderness boundaries',
            'Show USFS road network',
            'Show federal land ownership',
            'Overlay TRS boundaries',
            'Show interagency dispatch center boundaries',
            'Show national Geographic Area Coordination Centers (GACCs)'
        ],
        'smoke': [
            'See HRRR near-surface smoke models',
            'See HRRR vertically integrated smoke models'
        ],
        'cdf': [
            'Overlay administrative unit boundaries',
            'Overlay fire hazard severity zones (FHSZ)'
        ]
    },
    risk = {
        'whp': [
            ['N/A', '#fff'],
            ['Very Low', '#38a800'],
            ['Low', '#d1ff73'],
            ['Moderate', '#ffff00'],
            ['High', '#ffaa00'],
            ['Very High', '#ff0000']
        ]
    },
    legend = {
        'categories': [
            { 'fire': 'Wildfires' },
            { 'modis': 'MODIS Hotspots' },
            { 'drought': 'Drought Conditions' },
            { 'nfdrs': 'Fire Danger' },
            { 'sfp': 'Sig. Fire Potential' },
            { 'burnProb': 'Burn Probability' },
            { 'fhsz': 'CAL FIRE FHSZ' },
            { 'lands': 'Federal Lands' },
            { 'rth': 'Wildfire Risk to Homes' },
            { 'whp': 'Wildfire Hazard Potential' },
            { 'nri': 'FEMA Wildfire Risk Index' }
        ],
        'items': {
            'fire': [
                ['icon', '<div class="fire-icon new"><i class="fas fa-fire"></i></div>', '', 'New Fire'],
                ['icon', '<div class="fire-icon new fast"><i class="fas fa-fire"></i></div>', '', 'Fast Growing Fire'],
                ['icon', '<div class="fire-icon"><i class="fas fa-fire"></i></div>', '', 'Active Fire (0-100 acres)'],
                ['icon', '<div class="fire-icon big"><i class="fas fa-fire"></i></div>', '', 'Active Fire (100-1K acres)'],
                ['icon', '<div class="fire-icon large"><i class="fas fa-fire"></i></div>', '', 'Active Fire (>1K acres)'],
                ['icon', '<div class="fire-icon complex"><i class="fad fa-fire-flame-curved" aria-hidden="true" style="position:absolute;left:2px;top:2px;color:rgb(255 255 255 / 100%)"></i>' +
                    '<i class="fad fa-fire-flame-curved" aria-hidden="true" style="position:absolute;right:1px;bottom:2px;color:rgb(255 255 255 / 100%)"></i>' +
                    '<div style="position:absolute;width:25px;border-bottom:1px solid rgb(255 255 255 / 68%);top:50%;transform:rotate(-45deg)"></div></div>', '', 'Complex'],
                ['icon', '<div class="fire-icon contain"><i class="fas fa-fire"></i></div>', '', 'Contained Fire'],
                ['icon', '<div class="fire-icon controlled"><i class="fas fa-fire"></i></div>', '', 'Controlled Fire'],
                ['icon', '<div class="fire-icon rx"><i class="fas fa-prescription"></i></div>', '', 'Prescribed Burn'],
                ['icon', '<div class="fire-icon smkchk"><i class="fas fa-fire"></i></div>', '', 'Smoke Check']
            ],
            'modis': [
                ['icon', '<div class="modis t24"></div>', '', 'Heat Detection (0-24 hrs)'],
                ['icon', '<div class="modis t48"></div>', '', 'Heat Detection (24-48 hrs)'],
                ['icon', '<div class="modis t72"></div>', '', 'Heat Detection (48-72 hrs)'],
            ],
            'nfdrs': [
                ['color', '', '#3db471', 'Low'],
                ['color', '', '#00ff00', 'Moderate'],
                ['color', '', '#ffff00', 'High'],
                ['color', '', '#ff8b00', 'Very High'],
                ['color', '', '#b31f1f', 'Extreme'],
            ],
            'sfp': [
                ['color', '', '#85ca0a', 'Little or No Risk'],
                ['color', '', '#ffff00', 'Low Risk'],
                ['color', '', '#ad7c23', 'Moderate Risk'],
                ['color', 'D', '#ff9900', 'Dry'],
                ['color', 'W', '#ff9900', 'Hot & Dry'],
                ['color', 'H', '#ff9900', 'Hot'],
                ['color', 'U', '#ff9900', 'Unstable'],
                ['color', 'L', '#ff0000', 'Lightning'],
                ['color', 'R', '#ff0000', 'Recreation'],
                ['color', 'B', '#ff0000', 'Burn Environment']
            ],
            'burnProb': [
                ['color', '', '#fff0cf', '0-0.01%'],
                ['color', '', '#fddcaf', '0.01-0.02%'],
                ['color', '', '#fdca94', '0.02-0.05%'],
                ['color', '', '#fdb27b', '0.05-0.1%'],
                ['color', '', '#fc8d59', '0.1-0.2%'],
                ['color', '', '#f26d4b', '0.2-.05%'],
                ['color', '', '#e1452f', '0.5-1%'],
                ['color', '', '#c91d13', '1-2.2%'],
                ['color', '', '#a90000', '2.2-4.5%'],
                ['color', '', '#7f0000', '4.5-12.5%']
            ],
            'fhsz': [
                ['color', '', '#ffff69', 'Moderate'],
                ['color', '', '#ffcd69', 'High'],
                ['color', '', '#ff6969', 'Very High']
            ],
            'nri': [
                ['color', '', '#4d6dbd', 'Very Low'],
                ['color', '', '#509bc7', 'Relatively Low'],
                ['color', '', '#f0d55d', 'Relatively Moderate'],
                ['color', '', '#e07069', 'Relatively High'],
                ['color', '', '#c7445d', 'Very High'],
                ['color', '', '#ffffff', 'No Rating'],
                ['color', '', '#9e9e9e', 'Insufficient Data'],
            ],
            'lands': [
                ['color', '', '#fcb5ce', 'Department of Defense'],
                ['color', '', '#fee67a', 'Bureau of Land Management'],
                ['color', '', '#cabddd', 'National Park Service'],
                ['color', '', '#cdecc5', 'U.S. Forest Service'],
                ['color', '', '#7fcda7', 'U.S. Fish & Wildlife Service'],
                ['color', '', '#ffffb4', 'Bureau of Reclamation'],
                ['color', '', '#fdb56b', 'Bureau of Indian Affairs'],
                ['color', '', '#e4c4a0', 'Other Federal'],
                ['color', '', '#b4e3ef', 'State']
            ],
            'rth': [
                ['color', '', '#ffffff', '0 percentile'],
                ['color', '', '#f1f2a0', '0-40th percentile'],
                ['color', '', '#f2c13c', '40-70th percentile'],
                ['color', '', '#f28017', '70-90th percentile'],
                ['color', '', '#f21900', '90-95th percentile'],
                ['color', '', '#c4001a', '95-100th percentile'],
            ],
            'whp': [
                ['color', '', '#37a300', 'Very Low'],
                ['color', '', '#a3ff94', 'Low'],
                ['color', '', '#ffff63', 'Moderate'],
                ['color', '', '#ffa300', 'High'],
                ['color', '', '#ee1900', 'Very High'],
                ['color', '', '#e1e1e1', 'Non-burnable'],
                ['color', '', '#006fff', 'Water'],
            ],
            'drought': [
                ['color', '', '#ffff00', 'Abnormally Dry'],
                ['color', '', '#ffcc99', 'Moderate Drought'],
                ['color', '', '#ff6600', 'Severe Drought'],
                ['color', '', '#ff0000', 'Extreme Drought'],
                ['color', '', '#660000', 'Exceptional Drought']
            ]
        }
    },
    wwaColors = [
        'case',
        ['==', ['get', 'Event'], '911 Telephone Outage'], '#bfbfbf',
        ['==', ['get', 'Event'], 'Administrative Message'], '#fefefe',
        ['==', ['get', 'Event'], 'Air Quality Alert'], '#7f7f7f',
        ['==', ['get', 'Event'], 'Air Stagnation Advisory'], '#7f7f7f',
        ['==', ['get', 'Event'], 'Arroyo and Small Stream Flood Advisory'], '#00fe7e',
        ['==', ['get', 'Event'], 'Ashfall Advisory'], '#686868',
        ['==', ['get', 'Event'], 'Ashfall Warning'], '#a8a8a8',
        ['==', ['get', 'Event'], 'Avalanche Advisory'], '#cc843e',
        ['==', ['get', 'Event'], 'Avalanche Warning'], '#1d8ffe',
        ['==', ['get', 'Event'], 'Avalanche Watch'], '#f3a35f',
        ['==', ['get', 'Event'], 'Beach Hazards Statement'], '#3fdfcf',
        ['==', ['get', 'Event'], 'Blizzard Warning'], '#fe4400',
        ['==', ['get', 'Event'], 'Blizzard Watch'], '#acfe2e',
        ['==', ['get', 'Event'], 'Blowing Dust Advisory'], '#bcb66a',
        ['==', ['get', 'Event'], 'Brisk Wind Advisory'], '#d7bed7',
        ['==', ['get', 'Event'], 'Child Abduction Emergency'], '#fed600',
        ['==', ['get', 'Event'], 'Civil Danger Warning'], '#feb5c0',
        ['==', ['get', 'Event'], 'Civil Emergency Message'], '#feb5c0',
        ['==', ['get', 'Event'], 'Coastal Flood Advisory'], '#7bfb00',
        ['==', ['get', 'Event'], 'Coastal Flood Statement'], '#6a8d22',
        ['==', ['get', 'Event'], 'Coastal Flood Warning'], '#218a21',
        ['==', ['get', 'Event'], 'Coastal Flood Watch'], '#65cca9',
        ['==', ['get', 'Event'], 'Dense Fog Advisory'], '#6f7f8f',
        ['==', ['get', 'Event'], 'Dense Smoke Advisory'], '#efe58b',
        ['==', ['get', 'Event'], 'Dust Storm Warning'], '#fee3c3',
        ['==', ['get', 'Event'], 'Earthquake Warning'], '#8a4412',
        ['==', ['get', 'Event'], 'Evacuation - Immediate'], '#7efe00',
        ['==', ['get', 'Event'], 'Excessive Heat Warning'], '#c61484',
        ['==', ['get', 'Event'], 'Excessive Heat Watch'], '#7f0000',
        ['==', ['get', 'Event'], 'Extreme Cold Warning'], '#0000fe',
        ['==', ['get', 'Event'], 'Extreme Cold Watch'], '#0000fe',
        ['==', ['get', 'Event'], 'Extreme Fire Danger'], '#e89579',
        ['==', ['get', 'Event'], 'Extreme Wind Warning'], '#fe8b00',
        ['==', ['get', 'Event'], 'Fire Warning'], '#9f512c',
        ['==', ['get', 'Event'], 'Fire Weather Watch'], '#feddac',
        ['==', ['get', 'Event'], 'Flash Flood Statement'], '#8a0000',
        ['==', ['get', 'Event'], 'Flash Flood Warning'], '#8a0000',
        ['==', ['get', 'Event'], 'Flash Flood Watch'], '#2d8a56',
        ['==', ['get', 'Event'], 'Flood Advisory'], '#00fe7e',
        ['==', ['get', 'Event'], 'Flood Statement'], '#00fe00',
        ['==', ['get', 'Event'], 'Flood Warning'], '#00fe00',
        ['==', ['get', 'Event'], 'Flood Watch'], '#2d8a56',
        ['==', ['get', 'Event'], 'Freeze Warning'], '#473c8a',
        ['==', ['get', 'Event'], 'Freeze Watch'], '#00fefe',
        ['==', ['get', 'Event'], 'Freezing Fog Advisory'], '#007f7f',
        ['==', ['get', 'Event'], 'Freezing Rain Advisory'], '#d96fd5',
        ['==', ['get', 'Event'], 'Freezing Spray Advisory'], '#00befe',
        ['==', ['get', 'Event'], 'Frost Advisory'], '#6394ec',
        ['==', ['get', 'Event'], 'Gale Warning'], '#dc9fdc',
        ['==', ['get', 'Event'], 'Gale Watch'], '#febfca',
        ['==', ['get', 'Event'], 'Hard Freeze Warning'], '#9300d2',
        ['==', ['get', 'Event'], 'Hard Freeze Watch'], '#4068e0',
        ['==', ['get', 'Event'], 'Hazardous Materials Warning'], '#4a0081',
        ['==', ['get', 'Event'], 'Hazardous Seas Warning'], '#d7bed7',
        ['==', ['get', 'Event'], 'Hazardous Seas Watch'], '#473c8a',
        ['==', ['get', 'Event'], 'Hazardous Weather Outlook'], '#ede7a9',
        ['==', ['get', 'Event'], 'Heat Advisory'], '#fe7e4f',
        ['==', ['get', 'Event'], 'Heavy Freezing Spray Warning'], '#00befe',
        ['==', ['get', 'Event'], 'Heavy Freezing Spray Watch'], '#bb8e8e',
        ['==', ['get', 'Event'], 'High Surf Advisory'], '#b954d2',
        ['==', ['get', 'Event'], 'High Surf Warning'], '#218a21',
        ['==', ['get', 'Event'], 'High Wind Warning'], '#d9a41f',
        ['==', ['get', 'Event'], 'High Wind Watch'], '#b7850a',
        ['==', ['get', 'Event'], 'Hurricane Force Wind Warning'], '#cc5b5b',
        ['==', ['get', 'Event'], 'Hurricane Force Wind Watch'], '#9831cb',
        ['==', ['get', 'Event'], 'Hurricane Local Statement'], '#fee3b4',
        ['==', ['get', 'Event'], 'Hurricane Warning'], '#db133b',
        ['==', ['get', 'Event'], 'Hurricane Watch'], '#fe00fe',
        ['==', ['get', 'Event'], 'Hydrologic Advisory'], '#00fe7e',
        ['==', ['get', 'Event'], 'Hydrologic Outlook'], '#8fed8f',
        ['==', ['get', 'Event'], 'Ice Storm Warning'], '#8a008a',
        ['==', ['get', 'Event'], 'Lake Effect Snow Advisory'], '#47d0cb',
        ['==', ['get', 'Event'], 'Lake Effect Snow Warning'], '#008a8a',
        ['==', ['get', 'Event'], 'Lake Effect Snow Watch'], '#86cdf9',
        ['==', ['get', 'Event'], 'Lake Wind Advisory'], '#d1b38b',
        ['==', ['get', 'Event'], 'Lakeshore Flood Advisory'], '#7bfb00',
        ['==', ['get', 'Event'], 'Lakeshore Flood Statement'], '#6a8d22',
        ['==', ['get', 'Event'], 'Lakeshore Flood Warning'], '#218a21',
        ['==', ['get', 'Event'], 'Lakeshore Flood Watch'], '#65cca9',
        ['==', ['get', 'Event'], 'Law Enforcement Warning'], '#bfbfbf',
        ['==', ['get', 'Event'], 'Local Area Emergency'], '#bfbfbf',
        ['==', ['get', 'Event'], 'Low Water Advisory'], '#a42929',
        ['==', ['get', 'Event'], 'Marine Weather Statement'], '#feeed4',
        ['==', ['get', 'Event'], 'Nuclear Power Plant Warning'], '#4a0081',
        ['==', ['get', 'Event'], 'Radiological Hazard Warning'], '#4a0081',
        ['==', ['get', 'Event'], 'Red Flag Warning'], '#fe1392',
        ['==', ['get', 'Event'], 'Rip Current Statement'], '#3fdfcf',
        ['==', ['get', 'Event'], 'Severe Thunderstorm Warning'], '#fea400',
        ['==', ['get', 'Event'], 'Severe Thunderstorm Watch'], '#da6f92',
        ['==', ['get', 'Event'], 'Severe Weather Statement'], '#00fefe',
        ['==', ['get', 'Event'], 'Shelter In Place Warning'], '#f97f71',
        ['==', ['get', 'Event'], 'Short Term Forecast'], '#97fa97',
        ['==', ['get', 'Event'], 'Small Craft Advisory'], '#d7bed7',
        ['==', ['get', 'Event'], 'Small Craft Advisory For Hazardous Seas'], '#d7bed7',
        ['==', ['get', 'Event'], 'Small Craft Advisory For Rough Bar'], '#d7bed7',
        ['==', ['get', 'Event'], 'Small Craft Advisory For Winds'], '#d7bed7',
        ['==', ['get', 'Event'], 'Small Stream Flood Advisory'], '#00fe7e',
        ['==', ['get', 'Event'], 'Special Marine Warning'], '#fea400',
        ['==', ['get', 'Event'], 'Special Weather Statement'], '#fee3b4',
        ['==', ['get', 'Event'], 'Storm Warning'], '#9300d2',
        ['==', ['get', 'Event'], 'Storm Watch'], '#fee3b4',
        ['==', ['get', 'Event'], 'Test'], '#effefe',
        ['==', ['get', 'Event'], 'Tornado Warning'], '#fe0000',
        ['==', ['get', 'Event'], 'Tornado Watch'], '#fefe00',
        ['==', ['get', 'Event'], 'Tropical Depression Local Statement'], '#fee3b4',
        ['==', ['get', 'Event'], 'Tropical Storm Local Statement'], '#fee3b4',
        ['==', ['get', 'Event'], 'Tropical Storm Warning'], '#b12121',
        ['==', ['get', 'Event'], 'Tropical Storm Watch'], '#ef7f7f',
        ['==', ['get', 'Event'], 'Tsunami Advisory'], '#d1681d',
        ['==', ['get', 'Event'], 'Tsunami Warning'], '#fc6246',
        ['==', ['get', 'Event'], 'Tsunami Watch'], '#fe00fe',
        ['==', ['get', 'Event'], 'Typhoon Local Statement'], '#fee3b4',
        ['==', ['get', 'Event'], 'Typhoon Warning'], '#db133b',
        ['==', ['get', 'Event'], 'Typhoon Watch'], '#fe00fe',
        ['==', ['get', 'Event'], 'Urban and Small Stream Flood Advisory'], '#00fe7e',
        ['==', ['get', 'Event'], 'Volcano Warning'], '#2e4e4e',
        ['==', ['get', 'Event'], 'Wind Advisory'], '#d1b38b',
        ['==', ['get', 'Event'], 'Wind Chill Advisory'], '#aeeded',
        ['==', ['get', 'Event'], 'Wind Chill Warning'], '#afc3dd',
        ['==', ['get', 'Event'], 'Wind Chill Watch'], '#5e9d9f',
        ['==', ['get', 'Event'], 'Winter Storm Warning'], '#fe68b3',
        ['==', ['get', 'Event'], 'Winter Storm Watch'], '#4581b3',
        ['==', ['get', 'Event'], 'Winter Weather Advisory'], '#7a67ed',
        '#eee'
    ],
    stateLabels =
    {
        'AL': { v: 'Alabama', c: [-86.8295337, 33.2588817] },
        'AK': { v: 'Alaska', c: [-149.680909, 64.4459613] },
        'AZ': { v: 'Arizona', c: [-111.7632755, 34.395342] },
        'AR': { v: 'Arkansas', c: [-92.4479108, 35.2048883] },
        'CA': { v: 'California', c: [-118.7559974, 36.7014631] },
        'CO': { v: 'Colorado', c: [-105.6077167, 38.7251776] },
        'CT': { v: 'Connecticut', c: [-72.7342163, 41.6500201] },
        'DE': { v: 'Delaware', c: [-75.4013315, 38.6920451] },
        'DC': { v: 'District of Columbia', c: [-77.0365529, 38.8948932] },
        'FL': { v: 'Florida', c: [-81.4639835, 27.7567667] },
        'GA': { v: 'Georgia', c: [-83.1137366, 32.3293809] },
        'HI': { v: 'Hawaii', c: [-157.975203, 21.2160437] },
        'ID': { v: 'Idaho', c: [-114.74121, 45.61788] },
        'IL': { v: 'Illinois', c: [-89.4337288, 40.0796606] },
        'IN': { v: 'Indiana', c: [-86.1746933, 40.3270127] },
        'IA': { v: 'Iowa', c: [-93.3122705, 41.9216734] },
        'KS': { v: 'Kansas', c: [-98.5821872, 38.27312] },
        'KY': { v: 'Kentucky', c: [-85.1551411, 37.5726028] },
        'LA': { v: 'Louisiana', c: [-92.007126, 30.8703881] },
        'ME': { v: 'Maine', c: [-68.8590201, 45.709097] },
        'MD': { v: 'Maryland', c: [-76.9382069, 39.5162234] },
        'MA': { v: 'Massachusetts', c: [-72.032366, 42.3788774] },
        'MI': { v: 'Michigan', c: [-84.6824346, 43.6211955] },
        'MN': { v: 'Minnesota', c: [-94.6113288, 45.9896587] },
        'MS': { v: 'Mississippi', c: [-89.7348497, 32.9715645] },
        'MO': { v: 'Missouri', c: [-92.5617875, 38.7604815] },
        'MT': { v: 'Montana', c: [-109.6387579, 47.3752671] },
        'NE': { v: 'Nebraska', c: [-99.5873816, 41.7370229] },
        'NV': { v: 'Nevada', c: [-116.8537227, 39.5158825] },
        'NH': { v: 'New Hampshire', c: [-71.6553992, 43.4849133] },
        'NJ': { v: 'New Jersey', c: [-74.4041622, 40.0757384] },
        'NM': { v: 'New Mexico', c: [-105.993007, 34.5708167] },
        'NY': { v: 'New York', c: [-74.0060152, 40.7127281] },
        'NC': { v: 'North Carolina', c: [-79.0392919, 35.6729639] },
        'ND': { v: 'North Dakota', c: [-100.540737, 47.6201461] },
        'OH': { v: 'Ohio', c: [-82.6881395, 40.2253569] },
        'OK': { v: 'Oklahoma', c: [-97.2684063, 34.9550817] },
        'OR': { v: 'Oregon', c: [-120.737257, 43.9792797] },
        'PA': { v: 'Pennsylvania', c: [-77.7278831, 40.9699889] },
        'RI': { v: 'Rhode Island', c: [-71.5992372, 41.7962409] },
        'SC': { v: 'South Carolina', c: [-80.4363743, 33.6874388] },
        'SD': { v: 'South Dakota', c: [-100.348761, 44.6471761] },
        'TN': { v: 'Tennessee', c: [-86.2820081, 35.7730076] },
        'TX': { v: 'Texas', c: [-99.5120986, 31.8160381] },
        'UT': { v: 'Utah', c: [-111.7143584, 39.4225192] },
        'VT': { v: 'Vermont', c: [-72.5002608, 44.5990718] },
        'VA': { v: 'Virginia', c: [-78.4927721, 37.1232245] },
        'WA': { v: 'Washington', c: [-120.74014, 47.75107] },
        'WV': { v: 'West Virginia', c: [-80.8408415, 38.4758406] },
        'WI': { v: 'Wisconsin', c: [-89.6884637, 44.4308975] },
        'WY': { v: 'Wyoming', c: [-107.5685348, 43.1700264] },
    };

!function (e) { if ("object" == typeof exports && "undefined" != typeof module) module.exports = e(); else if ("function" == typeof define && define.amd) define([], e); else { var n; "undefined" != typeof window ? n = window : "undefined" != typeof global ? n = global : "undefined" != typeof self && (n = self), n.geojsonExtent = e() } }(function () { return function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = "function" == typeof require && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } for (var i = "function" == typeof require && require, o = 0; o < r.length; o++)s(r[o]); return s }({ 1: [function (require, module, exports) { function getExtent(_) { for (var ext = extent(), coords = geojsonCoords(_), i = 0; i < coords.length; i++)ext.include(coords[i]); return ext } var geojsonCoords = require("@mapbox/geojson-coords"), traverse = require("traverse"), extent = require("@mapbox/extent"), geojsonTypesByDataAttributes = { features: ["FeatureCollection"], coordinates: ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"], geometry: ["Feature"], geometries: ["GeometryCollection"] }, dataAttributes = Object.keys(geojsonTypesByDataAttributes); module.exports = function (_) { return getExtent(_).bbox() }, module.exports.polygon = function (_) { return getExtent(_).polygon() }, module.exports.bboxify = function (_) { return traverse(_).map(function (value) { if (value) { var isValid = dataAttributes.some(function (attribute) { return value[attribute] ? -1 !== geojsonTypesByDataAttributes[attribute].indexOf(value.type) : !1 }); isValid && (value.bbox = getExtent(value).bbox(), this.update(value)) } }) } }, { "@mapbox/extent": 2, "@mapbox/geojson-coords": 4, traverse: 7 }], 2: [function (require, module, exports) { function Extent(bbox) { return this instanceof Extent ? (this._bbox = bbox || [1 / 0, 1 / 0, -(1 / 0), -(1 / 0)], void (this._valid = !!bbox)) : new Extent(bbox) } module.exports = Extent, Extent.prototype.include = function (ll) { return this._valid = !0, this._bbox[0] = Math.min(this._bbox[0], ll[0]), this._bbox[1] = Math.min(this._bbox[1], ll[1]), this._bbox[2] = Math.max(this._bbox[2], ll[0]), this._bbox[3] = Math.max(this._bbox[3], ll[1]), this }, Extent.prototype.equals = function (_) { var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] == other[0] && this._bbox[1] == other[1] && this._bbox[2] == other[2] && this._bbox[3] == other[3] }, Extent.prototype.center = function (_) { return this._valid ? [(this._bbox[0] + this._bbox[2]) / 2, (this._bbox[1] + this._bbox[3]) / 2] : null }, Extent.prototype.union = function (_) { this._valid = !0; var other; return other = _ instanceof Extent ? _.bbox() : _, this._bbox[0] = Math.min(this._bbox[0], other[0]), this._bbox[1] = Math.min(this._bbox[1], other[1]), this._bbox[2] = Math.max(this._bbox[2], other[2]), this._bbox[3] = Math.max(this._bbox[3], other[3]), this }, Extent.prototype.bbox = function () { return this._valid ? this._bbox : null }, Extent.prototype.contains = function (ll) { if (!ll) return this._fastContains(); if (!this._valid) return null; var lon = ll[0], lat = ll[1]; return this._bbox[0] <= lon && this._bbox[1] <= lat && this._bbox[2] >= lon && this._bbox[3] >= lat }, Extent.prototype.intersect = function (_) { if (!this._valid) return null; var other; return other = _ instanceof Extent ? _.bbox() : _, !(this._bbox[0] > other[2] || this._bbox[2] < other[0] || this._bbox[3] < other[1] || this._bbox[1] > other[3]) }, Extent.prototype._fastContains = function () { if (!this._valid) return new Function("return null;"); var body = "return " + this._bbox[0] + "<= ll[0] &&" + this._bbox[1] + "<= ll[1] &&" + this._bbox[2] + ">= ll[0] &&" + this._bbox[3] + ">= ll[1]"; return new Function("ll", body) }, Extent.prototype.polygon = function () { return this._valid ? { type: "Polygon", coordinates: [[[this._bbox[0], this._bbox[1]], [this._bbox[2], this._bbox[1]], [this._bbox[2], this._bbox[3]], [this._bbox[0], this._bbox[3]], [this._bbox[0], this._bbox[1]]]] } : null } }, {}], 3: [function (require, module, exports) { module.exports = function (list) { function _flatten(list) { return Array.isArray(list) && list.length && "number" == typeof list[0] ? [list] : list.reduce(function (acc, item) { return Array.isArray(item) && Array.isArray(item[0]) ? acc.concat(_flatten(item)) : (acc.push(item), acc) }, []) } return _flatten(list) } }, {}], 4: [function (require, module, exports) { var geojsonNormalize = require("@mapbox/geojson-normalize"), geojsonFlatten = require("geojson-flatten"), flatten = require("./flatten"); module.exports = function (_) { if (!_) return []; var normalized = geojsonFlatten(geojsonNormalize(_)), coordinates = []; return normalized.features.forEach(function (feature) { feature.geometry && (coordinates = coordinates.concat(flatten(feature.geometry.coordinates))) }), coordinates } }, { "./flatten": 3, "@mapbox/geojson-normalize": 5, "geojson-flatten": 6 }], 5: [function (require, module, exports) { function normalize(gj) { if (!gj || !gj.type) return null; var type = types[gj.type]; return type ? "geometry" === type ? { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: gj }] } : "feature" === type ? { type: "FeatureCollection", features: [gj] } : "featurecollection" === type ? gj : void 0 : null } module.exports = normalize; var types = { Point: "geometry", MultiPoint: "geometry", LineString: "geometry", MultiLineString: "geometry", Polygon: "geometry", MultiPolygon: "geometry", GeometryCollection: "geometry", Feature: "feature", FeatureCollection: "featurecollection" } }, {}], 6: [function (require, module, exports) { module.exports = function e(t) { switch (t && t.type || null) { case "FeatureCollection": return t.features = t.features.reduce(function (t, r) { return t.concat(e(r)) }, []), t; case "Feature": return t.geometry ? e(t.geometry).map(function (e) { var r = { type: "Feature", properties: JSON.parse(JSON.stringify(t.properties)), geometry: e }; return void 0 !== t.id && (r.id = t.id), r }) : [t]; case "MultiPoint": return t.coordinates.map(function (e) { return { type: "Point", coordinates: e } }); case "MultiPolygon": return t.coordinates.map(function (e) { return { type: "Polygon", coordinates: e } }); case "MultiLineString": return t.coordinates.map(function (e) { return { type: "LineString", coordinates: e } }); case "GeometryCollection": return t.geometries.map(e).reduce(function (e, t) { return e.concat(t) }, []); case "Point": case "Polygon": case "LineString": return [t] } } }, {}], 7: [function (require, module, exports) { function Traverse(obj) { this.value = obj } function walk(root, cb, immutable) { var path = [], parents = [], alive = !0; return function walker(node_) { function updateState() { if ("object" == typeof state.node && null !== state.node) { state.keys && state.node_ === state.node || (state.keys = objectKeys(state.node)), state.isLeaf = 0 == state.keys.length; for (var i = 0; i < parents.length; i++)if (parents[i].node_ === node_) { state.circular = parents[i]; break } } else state.isLeaf = !0, state.keys = null; state.notLeaf = !state.isLeaf, state.notRoot = !state.isRoot } var node = immutable ? copy(node_) : node_, modifiers = {}, keepGoing = !0, state = { node: node, node_: node_, path: [].concat(path), parent: parents[parents.length - 1], parents: parents, key: path.slice(-1)[0], isRoot: 0 === path.length, level: path.length, circular: null, update: function (x, stopHere) { state.isRoot || (state.parent.node[state.key] = x), state.node = x, stopHere && (keepGoing = !1) }, "delete": function (stopHere) { delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, remove: function (stopHere) { isArray(state.parent.node) ? state.parent.node.splice(state.key, 1) : delete state.parent.node[state.key], stopHere && (keepGoing = !1) }, keys: null, before: function (f) { modifiers.before = f }, after: function (f) { modifiers.after = f }, pre: function (f) { modifiers.pre = f }, post: function (f) { modifiers.post = f }, stop: function () { alive = !1 }, block: function () { keepGoing = !1 } }; if (!alive) return state; updateState(); var ret = cb.call(state, state.node); return void 0 !== ret && state.update && state.update(ret), modifiers.before && modifiers.before.call(state, state.node), keepGoing ? ("object" != typeof state.node || null === state.node || state.circular || (parents.push(state), updateState(), forEach(state.keys, function (key, i) { path.push(key), modifiers.pre && modifiers.pre.call(state, state.node[key], key); var child = walker(state.node[key]); immutable && hasOwnProperty.call(state.node, key) && (state.node[key] = child.node), child.isLast = i == state.keys.length - 1, child.isFirst = 0 == i, modifiers.post && modifiers.post.call(state, child), path.pop() }), parents.pop()), modifiers.after && modifiers.after.call(state, state.node), state) : state }(root).node } function copy(src) { if ("object" == typeof src && null !== src) { var dst; if (isArray(src)) dst = []; else if (isDate(src)) dst = new Date(src.getTime ? src.getTime() : src); else if (isRegExp(src)) dst = new RegExp(src); else if (isError(src)) dst = { message: src.message }; else if (isBoolean(src)) dst = new Boolean(src); else if (isNumber(src)) dst = new Number(src); else if (isString(src)) dst = new String(src); else if (Object.create && Object.getPrototypeOf) dst = Object.create(Object.getPrototypeOf(src)); else if (src.constructor === Object) dst = {}; else { var proto = src.constructor && src.constructor.prototype || src.__proto__ || {}, T = function () { }; T.prototype = proto, dst = new T } return forEach(objectKeys(src), function (key) { dst[key] = src[key] }), dst } return src } function toS(obj) { return Object.prototype.toString.call(obj) } function isDate(obj) { return "[object Date]" === toS(obj) } function isRegExp(obj) { return "[object RegExp]" === toS(obj) } function isError(obj) { return "[object Error]" === toS(obj) } function isBoolean(obj) { return "[object Boolean]" === toS(obj) } function isNumber(obj) { return "[object Number]" === toS(obj) } function isString(obj) { return "[object String]" === toS(obj) } var traverse = module.exports = function (obj) { return new Traverse(obj) }; Traverse.prototype.get = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) { node = void 0; break } node = node[key] } return node }, Traverse.prototype.has = function (ps) { for (var node = this.value, i = 0; i < ps.length; i++) { var key = ps[i]; if (!node || !hasOwnProperty.call(node, key)) return !1; node = node[key] } return !0 }, Traverse.prototype.set = function (ps, value) { for (var node = this.value, i = 0; i < ps.length - 1; i++) { var key = ps[i]; hasOwnProperty.call(node, key) || (node[key] = {}), node = node[key] } return node[ps[i]] = value, value }, Traverse.prototype.map = function (cb) { return walk(this.value, cb, !0) }, Traverse.prototype.forEach = function (cb) { return this.value = walk(this.value, cb, !1), this.value }, Traverse.prototype.reduce = function (cb, init) { var skip = 1 === arguments.length, acc = skip ? this.value : init; return this.forEach(function (x) { this.isRoot && skip || (acc = cb.call(this, acc, x)) }), acc }, Traverse.prototype.paths = function () { var acc = []; return this.forEach(function (x) { acc.push(this.path) }), acc }, Traverse.prototype.nodes = function () { var acc = []; return this.forEach(function (x) { acc.push(this.node) }), acc }, Traverse.prototype.clone = function () { var parents = [], nodes = []; return function clone(src) { for (var i = 0; i < parents.length; i++)if (parents[i] === src) return nodes[i]; if ("object" == typeof src && null !== src) { var dst = copy(src); return parents.push(src), nodes.push(dst), forEach(objectKeys(src), function (key) { dst[key] = clone(src[key]) }), parents.pop(), nodes.pop(), dst } return src }(this.value) }; var objectKeys = Object.keys || function (obj) { var res = []; for (var key in obj) res.push(key); return res }, isArray = Array.isArray || function (xs) { return "[object Array]" === Object.prototype.toString.call(xs) }, forEach = function (xs, fn) { if (xs.forEach) return xs.forEach(fn); for (var i = 0; i < xs.length; i++)fn(xs[i], i, xs) }; forEach(objectKeys(Traverse.prototype), function (key) { traverse[key] = function (obj) { var args = [].slice.call(arguments, 1), t = new Traverse(obj); return t[key].apply(t, args) } }); var hasOwnProperty = Object.hasOwnProperty || function (obj, key) { return key in obj } }, {}] }, {}, [1])(1) });

async function api(url, fields = null) {
    let result,
        ops = {
            method: url.search('weather.gov') >= 0 ? 'GET' : 'POST',
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

    if (url.search('weather.gov') < 0) {
        ops['body'] = fd;
    }

    if (navigator.onLine) {
        await fetch(url, ops).then(async (resp) => {
            result = await resp.json();
        }).catch((e) => {
            console.error(e.message);
        });

        return result;
    } else {
        console.error('You are not connected to the internet');
        return null;
    }
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

function convertToDms(dd, isLng) {
    var dir = dd < 0
        ? isLng ? 'W' : 'S'
        : isLng ? 'E' : 'N';

    var absDd = Math.abs(dd),
        deg = absDd | 0,
        frac = absDd - deg,
        min = (frac * 60) | 0,
        sec = Math.round((frac * 3600 - min * 60) * 100) / 100;

    return deg + "&deg; " + min + "' " + sec + '" ' + dir;
}

function rad2deg(rad) {
    return rad / Math.PI * 180;
}

function deg2rad(deg) {
    return deg * Math.PI / 180;
}

function distance(lat1, lon1, lat2, lon2) {
    var R = 6371,
        dLat = deg2rad(lat2 - lat1),
        dLon = deg2rad(lon2 - lon1),
        a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        d = R * c;

    return (d / 1.609);
}

function dateTime(t, time = false) {
    var t = new Date(t * 1000),
        a = (t.getHours() == 0 ? 12 : (t.getHours() > 12 ? t.getHours() - 12 : t.getHours())) + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes() + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M',
        s = (/\((.*?)\)/g).exec(new Date().toString())[1].split(' '),
        tz = s[0].substring(0, 1) + s[1].substring(0, 1) + s[2].substring(0, 1);

    /*return months[t.getMonth()] + ' ' + t.getDate() + ', ' + t.getFullYear() + ' at ' + (t.getHours() > 12 ? t.getHours() - 12 : t.getHours()) + ':' + (t.getMinutes() < 10 ? '0' : '') + t.getMinutes() + ' ' + (t.getHours() > 12 ? 'P' : 'A') + 'M';*/
    return months[t.getMonth()] + ' ' + t.getDate() + ',&nbsp;' + t.getFullYear() + (time ? ' ' + a : '');
}

/* social media shares */
function socialShare(se) {
    let p = window.location.pathname,
        s = p.split('/');

    if (se == 'tt') {
        window.open('https://tiktok.com/search?q=' + s[4].replaceAll('-', '%20').toLowerCase());
    } else {
        let ref = host.substring(0, host.length - 1) + p;

        if (se == 'fb') {
            url = 'https://www.facebook.com/sharer/sharer.php?u=' + ref + '&src=sdkpreparse';
        } else {
            let hashtags = ucwords(s[3].toString().replaceAll('-', ' ')).replaceAll(' ', '') + ',' + ucwords(s[4].toString().replaceAll('-', ' ')).replaceAll(' ', '');
            url = 'https://twitter.com/intent/tweet?hashtags=' + hashtags + '&original_referer=' + ref + '&url=' + ref + '&ref_src=twsrc%5Etfw&tw_p=tweetbutton';
        }

        let h = 425,
            w = 700,
            t = (window.innerHeight - h) / 2,
            l = (window.innerWidth - w) / 2;

        window.open(url, 'social', 'location=no,menubar=no,status=no,resizable=no,top=' + t + ',left=' + l + ',width=' + w + ',height=' + h);
    }
}

class UTM {
    constructor() {
        this.k0 = 0.9996; // scale factor
        this.e = 0.00669438; // eccentricity
        this.e1sq = 0.006739497; // second eccentricity squared
        this.a = 6378137; // major radius of the WGS84 ellipsoid
    }

    toUTM(lat, lon) {
        let zoneNumber = Math.floor((lon + 180) / 6) + 1;

        // Special zone for Norway
        if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) {
            zoneNumber = 32;
        }

        // Special zones for Svalbard
        if (lat >= 72.0 && lat < 84.0) {
            if (lon >= 0.0 && lon < 9.0) {
                zoneNumber = 31;
            } else if (lon >= 9.0 && lon < 21.0) {
                zoneNumber = 33;
            } else if (lon >= 21.0 && lon < 33.0) {
                zoneNumber = 35;
            } else if (lon >= 33.0 && lon < 42.0) {
                zoneNumber = 37;
            }
        }

        let lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;
        let lonOriginRad = deg2rad(lonOrigin);

        let latRad = deg2rad(lat);
        let lonRad = deg2rad(lon);

        let N = this.a / Math.sqrt(1 - this.e * Math.sin(latRad) * Math.sin(latRad));
        let T = Math.tan(latRad) * Math.tan(latRad);
        let C = this.e1sq * Math.cos(latRad) * Math.cos(latRad);
        let A = Math.cos(latRad) * (lonRad - lonOriginRad);

        let M = this.a * ((1 - this.e / 4 - 3 * this.e * this.e / 64 - 5 * this.e * this.e * this.e / 256) * latRad
            - (3 * this.e / 8 + 3 * this.e * this.e / 32 + 45 * this.e * this.e * this.e / 1024) * Math.sin(2 * latRad)
            + (15 * this.e * this.e / 256 + 45 * this.e * this.e * this.e / 1024) * Math.sin(4 * latRad)
            - (35 * this.e * this.e * this.e / 3072) * Math.sin(6 * latRad));

        let UTMEasting = this.k0 * N * (A + (1 - T + C) * A * A * A / 6
            + (5 - 18 * T + T * T + 72 * C - 58 * this.e1sq) * A * A * A * A * A / 120) + 500000.0;

        let UTMNorthing = this.k0 * (M + N * Math.tan(latRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
            + (61 - 58 * T + T * T + 600 * C - 330 * this.e1sq) * A * A * A * A * A * A / 720));

        if (lat < 0) {
            UTMNorthing += 10000000.0; // 10000000 meter offset for southern hemisphere
        }

        return zoneNumber + 'T ' + UTMEasting.toFixed(1) + 'E ' + UTMNorthing.toFixed(1) + 'N';
    }
}

class Convert {
    acres(a) {
        const acres = (a == 'Unknown' ? 'Unknown' : numberFormat(a)),
            acresDisp = (acres != 'Unknown' ? this.sizing(2, acres.replaceAll(',', '')) : acres) + ' ' + (acres != 'Unknown' ? (acres == 1 ? this.sizing(1).slice(0, -1) : this.sizing(1)).toLowerCase() : '');

        return acresDisp;
    }

    coords(a, b) {
        if (!settings.get('coordsDisplay') || settings.get('coordsDisplay') == 'dec') {
            return parseFloat(a).toFixed(4) + ',&nbsp;' + parseFloat(b).toFixed(4);
        } else if (settings.get('coordsDisplay') == 'dms') {
            return convertToDms(a, false) + ',&nbsp;' + convertToDms(b, true);
        } else if (settings.get('coordsDisplay') == 'utm') {
            return new UTM().toUTM(a, b);
        }
    }

    speed(v, u) {
        if (u == 'km/h') {
            return Math.round(v * 1.609);
        } else {
            return (u == 'mph' ? v : Math.round(v / (u == 'm/s' ? 2.237 : (u == 'kts' ? 1.151 : 1))));
        }
    }

    sizing(v, a = null) {
        let d = '',
            s = settings.get('acres');

        if (!s || s == 'acres') {
            a = a;
            d = 'Acres';
        } else if (s == 'hectares') {
            a = a / 2.471;
            d = 'Hectares';
        } else if (s == 'sqmi') {
            a = a / 640;
            d = 'Square Miles';
        } else if (s == 'sqkm') {
            a = a / 247.1;
            d = 'Square Km.';
        }

        return (v == 1 ? d : (!s || s == 'acres' ? numberFormat(a, 2) : (a < 1 ? numberFormat(a, 4) : numberFormat(a, 2))));
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

    FtoC(t) {
        var t = ((t - 32) * (5 / 9)).toFixed(1);
        return (t == '0.0' ? 0 : t);
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
        this.defaultSettings = {
            'center': [43.67, -117.15],
            'zoom': 5,
            'tile': 'outdoors',
            'perimeters': {
                'minSize': 500,
                'color': 'default',
                'zoom': 1
            },
            'saveFreq': 300000
        };
        this.user = u;
        this.role = u != null ? u.role : 'GUEST';
        this.settings = u != null && u.settings.allsettings ? u.settings.allsettings : this.defaultSettings;
        this.archive = typeof historical !== 'undefined' ? historical : null;
    }

    updateLayers(layers) {
        this.settings.checkboxes = layers;
    }

    updateSpecial() {
        const ot = document.querySelector('#otlkType'),
            od = document.querySelector('#otlkDay'),
            fm = document.querySelector('#forecastModel'),
            ft = document.querySelector('#fcstTime'),
            sf = document.querySelector('#sfpDateSelect');

        this.settings.special = {
            otlkType: ot.options[ot.selectedIndex].value,
            otlkDay: od.options[od.selectedIndex].value,
            sfpDate: sf.options[sf.selectedIndex].value,
            forecastModel: fm.options[fm.selectedIndex].value,
            fcstTime: ft.options[ft.selectedIndex].value
        };
    }

    updatePersonal(s) {
        if (s.selectedIndex >= 0) {
            const id = s.id,
                val = s.options[s.selectedIndex].value;

            if (id == 'perimColor') {
                this.settings.perimeters.color = val;

                let c = new Wildfires().perimeterColor(val);

                map.setPaintProperty('perimeters_outline', 'line-color', c)
                    .setPaintProperty('perimeters_fill', 'fill-color', c);
            } else if (id == 'perimTtip') {
                this.settings.perimeters.ttip = val;
            } else if (id == 'perimZoom') {
                this.settings.perimeters.zoom = val;
            } else if (id == 'tempUnit') {
                if (!this.settings.weather) {
                    this.settings.weather = {};
                }

                this.settings.weather.temp = val;
            } else if (id == 'windSpeedUnit') {
                if (!this.settings.weather) {
                    this.settings.weather = {};
                }

                this.settings.weather.wind = val;
            } else if (id == 'acresUnit') {
                this.settings.acres = val;
            } else {
                this.settings[id] = val;
            }
        }
    }

    updatePSize(v) {
        this.settings.perimeters.minSize = v;
        saveSession(true);
    }

    get(t) {
        return this.settings[t] ? this.settings[t] : false;
    }

    includes(v) {
        return this.get('checkboxes') ? this.get('checkboxes').includes(v) : false;
    }

    map() {
        return {
            lat: parseFloat(this.settings.center[0]),
            lon: parseFloat(this.settings.center[1]),
            zoom: parseInt(this.settings.zoom),
            tile: this.settings.tile,
            pitch: this.settings.pitch ? this.settings.pitch : 0,
            bearing: this.settings.bearing ? this.settings.bearing : 0
        }
    }

    getBasemap() {
        return this.settings.tile;
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

    getRole() {
        return this.role;
    }

    hasPermissions(action) {
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

    fire() {
        return {
            cache: () => {
                return this.settings.locallySave == 'y' ? true : false;
            },
            display: () => {
                return this.settings.fireDisplay == 'page' ? false : true;
            }
        }
    }

    perimeters() {
        if (this.settings.perimeters !== undefined) {
            return {
                zoom: () => {
                    return this.settings.perimeters.zoom;
                },
                minSize: () => {
                    return this.settings.perimeters.minSize;
                },
                color: () => {
                    return this.settings.perimeters.color;
                },
                ttip: () => {
                    return this.settings.perimeters.ttip;
                }
            }
        } else {
            return null;
        }
    }

    weather() {
        return {
            wind: () => (
                this.settings.weather !== undefined ? this.settings.weather.wind : 'mph'
            ),
            temp: () => (
                this.settings.weather !== undefined ? this.settings.weather.temp : 'f'
            )
        }
    }
}

class NWS {
    async get(update = false) {
        const wwa = await api('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/NWS_Watches_Warnings_v1/FeatureServer/6/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,Event,Affected,End_'],
            ['returnGeometry', true],
            ['geometryPrecision', 6],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            map.getSource('wwas').setData(wwa);
        } else {
            if (wwa && wwa.features.length > 0) {
                if (!map.getSource('wwas')) {
                    map.addSource('wwas', {
                        type: 'geojson',
                        data: wwa
                    });
                }

                if (!map.getLayer('wwas_outline')) {
                    map.addLayer({
                        id: 'wwas_outline',
                        type: 'line',
                        source: 'wwas',
                        paint: {
                            'line-color': wwaColors,
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    }).addLayer({
                        id: 'wwas_fill',
                        type: 'fill',
                        source: 'wwas',
                        paint: {
                            'fill-color': wwaColors,
                            'fill-opacity': 0.35
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    }).on('mouseenter', 'wwas_fill', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    }).on('mouseleave', 'wwas_fill', () => {
                        map.getCanvas().style.cursor = 'auto';
                    }).on('click', 'wwas_fill', (e) => {
                        const l = e.lngLat;

                        this.find(l.lat, l.lng);
                    });
                }
            }
        }
    }

    /* get current weather alerts at the lat/lon of the users' click point */
    async find(lat, lon) {
        let out = '<p>There are no valid weather alerts at this location</p>';

        new mapboxgl.Popup()
            .setLngLat([lon, lat])
            .setHTML('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div><p style="text-align:center;margin-top:0.5em">Getting weather alerts...</p>')
            .addTo(map);

        const data = await api(apiURL + 'nws', [['lat', lat], ['lon', lon]]);

        if (data.alerts && data.alerts.length > 0) {
            let c = '';

            data.alerts.forEach((a) => {
                c += '<li style="line-height:1.3"><a href="#" class="readWWA" onclick="return false" data-id="' + a.id + '">' + a.event + '</a> until ' + a.expires + '</li>';
            });

            /* update the popup with valid alerts */
            out = '<ul style="padding-inline-start:1em;display:inline-flex;flex-direction:column;gap:.5em">' +
                c + '</ul>';
        }

        document.querySelector('.mapboxgl-popup-content').innerHTML = '<h1>Current Alerts</h1>' + out + '<button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup" aria-hidden="true">×</button>';
    }

    /* get SPC convective and fire weather outlooks */
    async spc(update = false) {
        let dy, ty;

        if (document.querySelector('#otlkDay')) {
            dy = document.querySelector('#otlkDay').options[document.querySelector('#otlkDay').selectedIndex].value;
            ty = document.querySelector('#otlkType').options[document.querySelector('#otlkType').selectedIndex].value;
        } else {
            dy = settings.get('special').otlkDay;
            ty = settings.get('special').otlkType;
        }

        const out = await api(apiURL + 'outlooks/' + ty, [['day', (dy ? dy : 1)]]);

        if (update) {
            map.getSource('outlook').setData(out);
        } else {
            if (!map.getSource('outlook')) {
                map.addSource('outlook', {
                    type: 'geojson',
                    data: out
                });
            }

            if (!map.getLayer('outlook_fill')) {
                map.addLayer({
                    id: 'outlook_fill',
                    type: 'fill',
                    source: 'outlook',
                    paint: {
                        'fill-color': ['get', 'fill'],
                        'fill-opacity': 0.4
                    },
                    layout: {
                        visibility: 'visible'
                    }
                }).addLayer({
                    id: 'outlook_outline',
                    type: 'line',
                    source: 'outlook',
                    paint: {
                        'line-color': ['get', 'stroke']
                    },
                    layout: {
                        visibility: 'visible'
                    }
                }).addLayer({
                    id: 'outlook_title',
                    type: 'symbol',
                    source: 'outlook',
                    minzoom: 5.7,
                    paint: {
                        'text-color': '#000',
                        'text-halo-color': '#fff',
                        'text-halo-blur': 1,
                        'text-halo-width': 1
                    },
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 450,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'name'],
                        'text-justify': 'auto',
                        'text-size': 14,
                        'text-max-width': 12,
                        'text-anchor': 'bottom',
                        'text-offset': [0, 1.3],
                        'text-letter-spacing': 0.05
                    }
                });
            }
        }
    }

    fcstHour() {
        var h = curTime.getUTCHours(),
            m = curTime.getUTCMonth() + 1,
            m = (m < 10 ? '0' : '') + m,
            d = curTime.getUTCDate(),
            d = (d < 10 ? '0' : '') + d,
            t;

        if (h >= 19 && h <= 23 || h == 0) {
            t = '18';
        } else if (h >= 1 && h <= 6) {
            t = '00';
        } else if (h >= 7 && h <= 12) {
            t = '06';
        } else {
            t = '12';
        }

        return curTime.getUTCFullYear() + '-' + m + '-' + d + 'T' + t + ':00:00.000Z';
    }

    ndfd(update = false) {
        let fm, ft, ur, leg;

        if (document.querySelector('#forecastModel')) {
            fm = document.querySelector('#forecastModel').options[document.querySelector('#forecastModel').selectedIndex].value;
            ft = document.querySelector('#fcstTime').options[document.querySelector('#fcstTime').selectedIndex].value;
        } else {
            fm = settings.get('special').forecastModel;
            ft = settings.get('special').fcstTime;
        }

        if (!ft) {
            ft = curTime.getUTCFullYear() + '-' + ((curTime.getUTCMonth() + 1) < 10 ? '0' : '') + (curTime.getUTCMonth() + 1) + '-' + (curTime.getUTCDate() < 10 ? '0' : '') + curTime.getUTCDate() + 'T' + ((curTime.getUTCHours() + 1) < 10 ? '0' : '') + (curTime.getUTCHours() + 1) + ':00:00.000Z';
        }

        if (fm == '12hr_precipitation_probability') {
            ur = 'ndfd_precipitation';
            leg = 'forecasts/ndfd_precipitation/ows?layer=conus_12hr_precipitation_probability';
        } else if (fm == 'relative_humidity') {
            ur = 'ndfd_moisture';
            leg = 'forecasts/ndfd_moisture/ows?layer=conus_relative_humidity';
        } else if (fm == 'wind_speed') {
            ur = 'ndfd_wind';
            leg = 'forecasts/ndfd_wind/ows?layer=conus_wind_speed';
        } else if (fm == 'total_sky_cover') {
            ur = 'ndfd_sky';
            leg = 'forecasts/ndfd_sky/ows?layer=conus_total_sky_cover';
        } else if (fm == 'apparent_temperature') {
            ur = 'ndfd_temperature';
            leg = 'ndfd_temperature/ows?layer=conus_apparent_temperature';
        }

        leg = 'https://nowcoast.noaa.gov/geoserver/' + leg + '&service=WMS&version=1.3.0&request=GetLegendGraphic&format=image%2Fpng&width=283&height=33';

        if (update) {
            map.getSource('ndfd').setTiles([
                'https://nowcoast.noaa.gov/geoserver/' + ur + '/wms?service=WMS&layers=' + fm + '&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=1920&height=626&time=' + ft + '&dim_time_reference=' + this.fcstHour() + '&crs=EPSG%3A3857&bbox={bbox-epsg-3857}'
            ]);

            document.querySelector('.ndfdLegend img').setAttribute('src', leg);
        } else {
            if (!map.getSource('ndfd')) {
                map.addSource('ndfd', {
                    'type': 'raster',
                    'tiles': [
                        'https://nowcoast.noaa.gov/geoserver/' + ur + '/wms?service=WMS&layers=' + fm + '&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=1920&height=626&time=' + ft + '&dim_time_reference=' + this.fcstHour() + '&crs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                    ],
                    'tileSize': 256
                });
            }

            if (!map.getLayer('ndfd')) {
                map.addLayer({
                    id: 'ndfd',
                    type: 'raster',
                    source: 'ndfd',
                    paint: {
                        'raster-opacity': 0.75
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }

            const ndfdLeg = document.createElement('div');
            ndfdLeg.classList.add('ndfdLegend');
            ndfdLeg.innerHTML = '<img src="' + leg + '">';
            document.body.append(ndfdLeg);
        }
    }

    satellite(w) {
        let layer;

        switch (w) {
            case 1: layer = 'global_visible_imagery_mosaic'; break;
            case 2: layer = 'global_longwave_imagery_mosaic'; break;
            case 3: layer = 'global_water_vapor_imagery_mosaic'; break;
        }

        if (!map.getSource('satellite' + w)) {
            map.addSource('satellite' + w, {
                'type': 'raster',
                'tiles': [
                    'https://nowcoast.noaa.gov/geoserver/satellite/wms?service=WMS&layers=' + layer + '&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=1920&height=617&crs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                'tileSize': 256
            });
        }

        if (!map.getLayer('satellite' + w)) {
            map.addLayer({
                id: 'satellite' + w,
                type: 'raster',
                source: 'satellite' + w,
                paint: {
                    'raster-opacity': 0.7
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async readWWA(id) {
        modal.querySelector('.content').innerHTML = wwaTemplate;
        modal.classList.add('wwa', 'open');

        if (document.querySelector('.mapboxgl-popup')) {
            document.querySelector('.mapboxgl-popup').remove();
        }

        const request = await api(apiURL + 'getWWA', [['id', id]]),
            a = request.wwa;

        setHeaders(a.title + ' issued by the National Weather Service in ' + a.office, 'weather/alert/' + id, 'The National Weather Service in ' + a.office + ' has issued a ' + a.title + ' for ' + a.area + ' until ' + a.expires + '.');

        if (a.title == 'Tornado Warning' || a.title == 'Severe Thunderstorm Warning') {
            modal.querySelector('h1.title').style.color = a.color;
        }

        modal.querySelector('h1.title').innerHTML = a.title;
        modal.querySelector('h1.title').style.borderColor = a.color;
        modal.querySelector('#a').innerHTML = a.area;
        modal.querySelector('#b').innerHTML = '<b>Issued:</b> ' + a.issued;
        modal.querySelector('#c').innerHTML = '<b>' + (a.onset ? 'Starts' : 'Expires') + ':</b> ' + (a.onset ? a.onset : a.expires);
        modal.querySelector('#d').innerHTML = '<b>Issued by:</b> <a target="blank" href="https://weather.gov/' + a.wfo.toLowerCase() + '" title="Issued by the National Weather Service in ' +
            a.office + '">NWS ' + a.office + '</a>';
        modal.querySelector('.head').insertAdjacentHTML('afterend', '<div class="message error">' + a.headline + '</div>');
        document.querySelector('.wwa-details').innerHTML = a.text;
        document.querySelector('.wwa-details').insertAdjacentHTML('afterend', '<p class="help">' + a.help.replace(/<p>(.*)<\/p>/gm, '$1') + '</p>');
    }
}

class Weather {
    constructor(lat = null, lon = null) {
        this.lat = lat != null ? parseFloat(lat) : null;
        this.lon = lon != null ? parseFloat(lon) : null;
    }

    windIndicator(d) {
        return '<svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(' + d + 'deg)" width="24" height="24" viewBox="0 0 24 24"><path fill="var(--orange)" d="M12,2L4.5,20.29l0.71,0.71L12,18l6.79,3 0.71,-0.71z"></path></svg>';
    }

    async incidentWX() {
        try {
            const wx = await api(apiURL + 'weather/nearby', [['radius', this.lat + ',' + this.lon + ',30'], ['latest', 1]]);

            if (wx.weather) {
                let o = wx.weather.obs,
                    name = wx.weather.name,
                    t = (o.temp.current ? Math.round(o.temp.current) : '--'),
                    rh = (o.rh ? Math.round(o.rh) : '--'),
                    wd = (o.wind_dir ? o.wind_dir : '--'),
                    rwd = (o.raw_wind_dir ? o.raw_wind_dir : null),
                    ws = (o.wind_speed ? Math.round(o.wind_speed) : '--'),
                    u = timeAgo(wx.weather.updated);

                /* format temperature */
                if (settings.weather() && settings.weather().temp() == 'c' && t != '--') {
                    t = conversion.FtoC(t) + '&deg;C';
                } else {
                    t += '&deg;F';
                }

                /* format wind speed */
                if (settings.weather() && settings.weather().wind() != 'mph' && ws != '--') {
                    ws = conversion.speed(ws, settings.weather().wind()) + ' ' + settings.weather().wind();
                } else {
                    ws += ' mph';
                }

                const t1 = document.querySelector('#t1'),
                    rh1 = document.querySelector('#rh1'),
                    w1 = document.querySelector('#w1');

                if (t1 && rh1 && w1) {
                    t1.innerHTML = t;
                    t1.classList.remove('placeholder');
                    t1.style.width = 'unset';
                    t1.style.height = 'unset';

                    rh1.innerHTML = (!o.rh || rh == '--' ? '--' : rh + '%');
                    rh1.classList.remove('placeholder');
                    rh1.style.width = 'unset';
                    rh1.style.height = 'unset';

                    w1.innerHTML = (wd == 'V' && ws == '-- mph' && rwd != null ? '--' : this.windIndicator(rwd) + '<p>' + ws + '</p>');
                    w1.classList.remove('placeholder');
                    w1.style.display = 'inline-flex';
                    w1.style.alignItems = 'center';
                    w1.style.gap = '0.5em';
                    w1.style.width = 'unset';
                    w1.style.height = 'unset';
                    w1.setAttribute('title', 'Winds are ' + wd + ' at ' + ws);

                    document.querySelector('#weatherObs').insertAdjacentHTML('afterend', '<p class="updated">Last report ' + u + (settings.hasPermissions('PREMIUM') ? ' @ ' + name : '') + '</p>');
                }
            } else {
                document.querySelector('#weatherObs').parentElement.innerHTML = '<div class="message error">No current weather conditions are available near this incident.</div>';
            }
        } catch (error) {
            console.error('There is an error getting current conditions', error);
        }
    }

    async incidentForecast() {
        let temp = [],
            rh = [],
            wind = [];

        try {
            const ap = await api('https://api.weather.gov/points/' + this.lat.toFixed(4) + ',' + this.lon.toFixed(4));
            const data = await api(ap.properties.forecastGridData),
                prop = data.properties;

            if (prop.temperature) {
                for (let i = 0; i < prop.temperature.values.length; i++) {
                    let t = new Date(prop.temperature.values[i].validTime.split('/')[0]).getTime();

                    if (t >= new Date().getTime() && (t - new Date().getTime()) < 86400000) {
                        temp.push(prop.temperature.values[i].value);
                        rh.push(prop.relativeHumidity.values[i].value);

                        if (prop.transportWindSpeed.values[i]) {
                            wind.push(prop.transportWindSpeed.values[i].value);
                        }
                    }
                }

                let a = Math.round((Math.max.apply(null, temp) * 1.8) + 32),
                    b = Math.min.apply(null, rh),
                    c = Math.round((wind.reduce((partialSum, a) => partialSum + a, 0) / wind.length) / 1.609),
                    d = Math.round(Math.max.apply(null, wind) / 1.609),
                    mt = document.querySelector('#wv1'),
                    mh = document.querySelector('#wv2'),
                    aw = document.querySelector('#wv3'),
                    mw = document.querySelector('#wv4');

                /*rating(a, b, c, d);*/

                if (settings.weather() && settings.weather().temp() == 'c') {
                    a = conversion.FtoC(a) + '&deg;C';
                } else {
                    a += '&deg;F';
                }

                if (settings.weather() && settings.weather().wind() != 'mph') {
                    c = conversion.speed(c, settings.weather().wind()) + ' ' + settings.weather().wind();
                    d = conversion.speed(d, settings.weather().wind()) + ' ' + settings.weather().wind();
                } else {
                    c += ' mph';
                    d += ' mph';
                }

                mt.innerHTML = a;
                mt.classList.remove('placeholder');
                mt.style.width = 'unset';
                mt.style.height = 'unset';

                mh.innerHTML = b + '%';
                mh.classList.remove('placeholder');
                mh.style.width = 'unset';
                mh.style.height = 'unset';

                aw.innerHTML = (c.toString() == 'NaN mph' ? '--' : c);
                aw.classList.remove('placeholder');
                aw.style.width = 'unset';
                aw.style.height = 'unset';

                mw.innerHTML = (d.toString() == '-Infinity mph' ? '--' : d);
                mw.classList.remove('placeholder');
                mw.style.width = 'unset';
                mw.style.height = 'unset';

                document.querySelector('#incidentForecast').insertAdjacentHTML('afterend', '<p class="updated">Last forecasted ' + timeAgo(new Date(prop.updateTime).getTime() / 1000) + '</p>');
            } else {
                console.error('There is an error getting FWF', error);
                document.querySelector('#incidentForecast').innerHTML = '<div class="message error">The 24-hour fire forecast is unavailable at this time.</div>';
            }
        } catch (error) {
            console.error('There is an error getting FWF', error);
            document.querySelector('#incidentForecast').innerHTML = '<div class="message error">The 24-hour fire forecast is unavailable at this time.</div>';
        }
    }

    async raws(update = false) {
        let feat = [],
            b = JSON.parse(getbbox()),
            bx = b.xmax + ',' + b.ymin + ',' + b.xmin + ',' + b.ymax,
            vars = 'token=350409c14c544ec9957effb1c15bcb99' +
                '&bbox=' + bx +
                '&vars=air_temp,relative_humidity,wind_speed,wind_direction' +
                '&units=temp|f,speed|mph' +
                '&obtimezone=local' +
                '&status=active' +
                '&network=2,1' +
                '&networkimportance=2,1';

        const data = await api('https://api.synopticlabs.org/v2/stations/latest?' + vars);

        data.STATION.forEach((s) => {
            if (s.OBSERVATIONS.air_temp_value_1) {
                const t = s.OBSERVATIONS.air_temp_value_1.value;

                if (settings.weather() && settings.weather().temp() == 'c' && t != '--') {
                    t = conversion.FtoC(s.OBSERVATIONS.air_temp_value_1.value);
                }

                s.temp = Math.round(t);
            }

            feat.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(s.LONGITUDE), parseFloat(s.LATITUDE)]
                },
                properties: s
            });
        });

        if (update) {
            if (feat.length > 0) {
                map.getSource('stns').setData({
                    type: 'FeatureCollection',
                    features: feat
                });
            }
        } else {
            if (!map.getSource('stns')) {
                map.addSource('stns', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: feat
                    },
                    cluster: true,
                    clusterMaxZoom: 7,
                    clusterMinPoints: 5,
                    clusterRadius: 100
                });
            }

            if (!map.getLayer('stns')) {
                map.addLayer({
                    id: 'stns',
                    source: 'stns',
                    type: 'circle',
                    filter: [
                        'all',
                        ['!=', ['get', 'temp'], ''],
                        ['!', ['has', 'point_count']]
                    ],
                    paint: {
                        'circle-color': [
                            'case',
                            ['all', ['>=', ['get', 'temp'], -20], ['<', ['get', 'temp'], -10]], 'rgb(117,107,177)',
                            ['all', ['>=', ['get', 'temp'], -10], ['<', ['get', 'temp'], 0]], 'rgb(13,0,125)',
                            ['all', ['>=', ['get', 'temp'], 0], ['<', ['get', 'temp'], 10]], 'rgb(0,102,194)',
                            ['all', ['>=', ['get', 'temp'], 10], ['<', ['get', 'temp'], 20]], 'rgb(74,199,255)',
                            ['all', ['>=', ['get', 'temp'], 20], ['<', ['get', 'temp'], 30]], 'rgb(173,255,255)',
                            ['all', ['>=', ['get', 'temp'], 30], ['<', ['get', 'temp'], 40]], 'rgb(0,153,150)',
                            ['all', ['>=', ['get', 'temp'], 40], ['<', ['get', 'temp'], 50]], 'rgb(6,109,44)',
                            ['all', ['>=', ['get', 'temp'], 50], ['<', ['get', 'temp'], 60]], 'rgb(116,196,118)',
                            ['all', ['>=', ['get', 'temp'], 60], ['<', ['get', 'temp'], 70]], 'rgb(211,255,190)',
                            ['all', ['>=', ['get', 'temp'], 70], ['<', ['get', 'temp'], 80]], 'rgb(255,237,160)',
                            ['all', ['>=', ['get', 'temp'], 80], ['<', ['get', 'temp'], 90]], 'rgb(254,174,42)',
                            ['all', ['>=', ['get', 'temp'], 90], ['<', ['get', 'temp'], 100]], 'rgb(252,78,42)',
                            ['all', ['>=', ['get', 'temp'], 100], ['<', ['get', 'temp'], 110]], 'rgb(177,0,38)',
                            ['all', ['>=', ['get', 'temp'], 110], ['<', ['get', 'temp'], 120]], 'rgb(89,0,66)',
                            'rgb(40,0,40)'
                        ],
                        'circle-radius': 15
                    }
                }).addLayer({
                    id: 'stns_text',
                    type: 'symbol',
                    source: 'stns',
                    filter: [
                        'all',
                        ['!=', ['get', 'temp'], ''],
                        ['!', ['has', 'point_count']]
                    ],
                    paint: {
                        'text-color': [
                            'case',
                            ['all', ['>=', ['get', 'temp'], -10], ['<', ['get', 'temp'], 0]], '#fff',
                            ['all', ['>=', ['get', 'temp'], 40], ['<', ['get', 'temp'], 50]], '#fff',
                            ['all', ['>=', ['get', 'temp'], 110], ['<', ['get', 'temp'], 120]], '#fff',
                            ['>=', ['get', 'temp'], 120], '#fff',
                            '#000'
                        ]
                    },
                    layout: {
                        'symbol-placement': 'point',
                        'symbol-spacing': 150,
                        'text-font': ['DIN Pro Regular'],
                        'text-field': ['concat', ['get', 'temp'], '°'],
                        'text-justify': 'center',
                        'text-size': 14
                    }
                }).on('mouseenter', 'stns', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'stns', () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', 'stns', (e) => {
                    const stn = map.queryRenderedFeatures(e.point, {
                        layers: ['stns']
                    });

                    if (stn.length > 0) {
                        let p = stn[0].properties,
                            obs = JSON.parse(p.OBSERVATIONS),
                            t = obs.air_temp_value_1.value,
                            rh = obs.relative_humidity_value_1.value,
                            wd = obs.wind_direction_value_1.value,
                            ws = obs.wind_speed_value_1.value,
                            fl = (t < 60 && ws ? conversion.windChill(t, ws) : (t && rh ? conversion.heatIndex(t, rh) : null));

                        /* format temperature */
                        if (settings.weather() && settings.weather().temp() == 'c' && t != '--') {
                            t = conversion.FtoC(t) + '&deg;C';
                            fl = fl == null ? null : conversion.FtoC(fl) + '&deg;C';
                        } else {
                            t += '&deg;F';
                            fl += fl == null ? '' : '&deg;F';
                        }

                        if (wd) {
                            wd = conversion.getCompassDirection(wd);
                        } else {
                            wd = 'Variable';
                        }

                        /* format wind speed */
                        if (settings.weather() && settings.weather().wind() != 'mph' && ws != '--') {
                            ws = conversion.speed(ws, settings.weather().wind()) + ' ' + settings.weather().wind();
                        } else {
                            ws += ' mph';
                        }

                        new mapboxgl.Popup()
                            .setLngLat(stn[0].geometry.coordinates)
                            .setHTML('<h1>' + p.NAME + '</h1><p><b>Temperature:</b> ' + Math.round(t) + '</p>' + (fl != null ? '<p><b>Feels Like:</b> ' + fl : '') + '<p><b>Humidity:</b> ' + Math.round(rh) + '%</p>' +
                                '<p><b>Wind:</b> ' + (ws == 0 ? 'Calm' : wd + ' at ' + ws) + '</p><p class="updated">Last report ' + timeAgo(new Date(obs.air_temp_value_1.date_time).getTime() / 1000) + '</p>')
                            .addTo(map);
                    }
                });
            }
        }
    }

    airQColor(v) {
        let r = '';

        if (v <= 50) {
            r = '00e400';
        } else if (v > 50 && v <= 100) {
            r = 'ffff00';
        } else if (v > 100 && v <= 150) {
            r = 'ff7e00';
        } else if (v > 150 && v <= 200) {
            r = 'ff0000';
        } else if (v > 200 && v <= 300) {
            r = '8f3f97';
        } else if (v > 300 && v <= 500) {
            r = '7e0023';
        } else {
            r = 'd9d9d9';
        }

        return '#' + r;
    }

    airQDesc(aq) {
        let l, hm;

        if (aq <= 50) {
            l = 'Good';
            hm = 'Air quality is satisfactory, and air pollution poses little or no risk.';
        } else if (aq > 50 && aq <= 100) {
            l = 'Moderate';
            hm = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
        } else if (aq > 100 && aq <= 150) {
            l = 'Unhealthy for Sensitive Groups';
            hm = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
        } else if (aq > 150 && aq <= 200) {
            l = 'Unhealthy';
            hm = 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
        } else if (aq > 200 && aq <= 300) {
            l = 'Very Unhealthy';
            hm = 'Health alert: The risk of health effects is increased for everyone.';
        } else if (aq > 300) {
            l = 'Hazardous';
            hm = 'Health warning of emergency conditions: everyone is more likely to be affected.';
        }

        return { 'quality': l, 'desc': hm };
    }

    nearbyAQ() {
        const g = setInterval(() => {
            if (airQualityStns.features) {
                clearInterval(g);

                if (airQualityStns.features.length > 0) {
                    const aqh = modal.querySelector('#aq'),
                        distances = [],
                        stns = [];

                    airQualityStns.features.forEach((f) => {
                        const dist = distance(this.lat, this.lon, f.geometry.coordinates[1], f.geometry.coordinates[0]);

                        distances.push(dist);
                        stns.push(f.properties);
                    });

                    const minDist = Math.min.apply(null, distances);

                    const stn = stns[distances.indexOf(minDist)],
                        aq = stn.PM25_AQI,
                        color = this.airQColor(aq),
                        details = this.airQDesc(aq);

                    aqh.querySelector('.desc').innerHTML = '<span class="air_quality" onclick="notify(\'info\', \'' + details.desc + '\');return false" title="' + details.quality + ': ' + details.desc +
                        '" style="color:#' + (aq <= 100 ? '000' : 'fff') + ';background-color:' + color + '">' + details.quality.replace('Unhealthy for Sensitive Groups', 'Unhealthy') + '</span>';
                } else {
                    aqh.parentElement.classList.remove('max25');
                    aqh.parentElement.classList.add('max33');
                    aqh.remove();
                }
            }
        }, 500);
    }
}

class Wildfires {
    constructor() {
        this.store = localStorage.getItem('clicks');
    }

    fireIcon(t) {
        let exp = '',
            now = new Date().getTime() / 1000;

        if (t == 'new') {
            exp = [
                'case',
                [
                    '==',
                    ['get', 'type'],
                    'Complex'
                ],
                'fire-icon-complex',
                ['has', 'Out'],
                'fire-icon-out',
                ['has', 'Contain'],
                'fire-icon-contained',
                ['has', 'Control'],
                'fire-icon-controlled',
                [
                    'all',
                    [
                        '<',
                        ['-', now, ['to-number', ['get', 'discovered', ['get', 'time', ['properties']]]]],
                        ['to-number', (12 * 60 * 60)]
                    ],
                    [
                        '>=',
                        ['to-number', ['get', 'acres']],
                        100
                    ]
                ],
                'fire-icon-new-big',
                'fire-icon-new'
            ];
        } else if (t == 'rx') {
            exp = 'fire-icon-rx';
        } else if (t == 'smk') {
            exp = /*[
                'case',
                [
                    '<',
                    ['-', now, ['to-number', ['get', 'discovered', ['get', 'time', ['properties']]]]],
                    ['to-number', (12 * 60 * 60)]
                ],
                'fire-icon-smoke-new',*/
                'fire-icon-smoke'
            /*]*/;
        } else {
            exp = [
                'case',
                [
                    '==',
                    ['get', 'type'],
                    'Complex'
                ],
                'fire-icon-complex',
                [
                    '<',
                    ['to-number', ['get', 'year', ['get', 'time', ['properties']]]], curTime.getFullYear()
                ],
                'fire-icon-out',
                ['has', 'Out'],
                'fire-icon-out',
                ['has', 'Contain'],
                'fire-icon-contained',
                ['has', 'Control'],
                'fire-icon-controlled',
                [
                    'case',
                    [
                        '>=',
                        ['to-number', ['get', 'acres']],
                        1000
                    ],
                    'fire-icon-large',
                    [
                        '>=',
                        ['to-number', ['get', 'acres']],
                        100
                    ],
                    'fire-icon-big',
                    'fire-icon'
                ]
            ];
        }

        return exp;
    }

    async commitLog() {
        if (this.store != null && this.store != '') {
            const fd = new FormData();
            fd.append('key', apiKey);
            fd.append('data', this.store);

            await fetch(apiURL + 'logFire', {
                method: 'POST',
                body: fd
            }).then(() => {
                clicks = [];
                localStorage.removeItem('clicks');
            });
        }
    }

    logFire(id, json) {
        if (clicks.length == 0) {
            clicks.push({ wfid: id, count: 1, data: json });
        } else {
            let inList = false;

            clicks.forEach((e, n) => {
                if (e.wfid == id) {
                    inList = true;
                    clicks[n].count = clicks[n].count + 1;
                    clicks[n].data = json;
                }
            });

            if (!inList) {
                clicks.push({ wfid: id, count: 1, data: json });
            }
        }

        localStorage.setItem('clicks', JSON.stringify(clicks));
    }

    getStatus(s, n) {
        if (s == '' && n == '') {
            return 'active';
        } else {
            return (s == null ? (n.search('contain') >= 0 ? 'contained' : (n.search('control') >= 0 ? 'controlled' : 'active')) : (s.Out ? 'out' : (s.Control ? 'controlled' : (s.Contain ? 'contained' : ''))));
        }
    }

    getDispatchCenter(c) {
        var r = null;

        dispatchCenters.forEach(function (d) {
            if (c == d.agency || c == d.agency.replace('-', '')) {
                r = d;
            }
        });

        return r;
    }

    incidentDetails(data) {
        let a = ['Basic Information', 'Current Situation', 'Outlook', 'Current Weather'],
            o = '';

        a.forEach((b) => {
            if (data[b]) {
                o += '<div class="fire-details title"><h2>' + b + '</h2><div class="body">';

                data[b].forEach((c, n) => {
                    o += (n % 2 == 0 ? '<div class="row' + (data[b].length != 1 ? ' max50' : '') + ' align-top no-margin">' : '') +
                        '<div class="col"><div class="box"><div class="label">' + c.desc + '</div><div class="txt">' + c.info + '</div></div></div>' +
                        (n % 2 != 0 || n == data[b].length - 1 ? '</div>' : '');
                });

                o += '</div></div>';
            }
        });

        return o;
    }

    createChart(ah) {
        if (ah.length > 1) {
            const labels = [],
                dp = [],
                chg = [];

            let dt = (t) => {
                const d = new Date(t * 1000),
                    m = d.getMonth() + 1,
                    dy = d.getDate(),
                    h = d.getHours() % 12,
                    hr = h ? h : 12;

                return m + '/' + dy + ' ' + hr + ' ' + (d.getHours() >= 12 ? 'P' : 'A') + 'M';
            };

            ah.reverse().forEach((h) => {
                labels.push(dt(h.updated));
                dp.push(h.acres);
                chg.push(h.change);
            });

            document.querySelector('#ah .body').innerHTML = '<div id="ah-chart" style="width:100%;height:315px"></div>';

            Highcharts.chart('ah-chart', {
                chart: {
                    type: 'line',
                    marginTop: 40,
                    backgroundColor: '#fdfdfd',
                    style: {
                        fontFamily: 'Roboto'
                    }
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: undefined
                },
                series: [{
                    name: 'Change in Acres',
                    data: dp,
                    color: '#f18f01'
                }],
                xAxis: {
                    categories: labels
                },
                yAxis: {
                    labels: {
                        formatter: function () {
                            return Highcharts.numberFormat(this.value, 0, '.', ',');
                        },
                        overflow: 'justify'
                    },
                    title: {
                        text: 'Acres'
                    }
                },
                tooltip: {
                    formatter: function () {
                        return '<b>' + numberFormat(this.points[0].y) + ' acres</b> at ' + this.points[0].x;
                    },
                    shared: true
                },
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 1200
                        },
                        chartOptions: {
                            legend: {
                                align: 'center',
                                verticalAlign: 'bottom',
                                layout: 'horizontal'
                            }
                        }
                    }]
                }
            });
        } else {
            document.querySelector('#ah').remove();
        }
    }

    findFire(id) {
        let inc = null;

        activeIncidents.forEach((f) => {
            if (f.properties.wfid == id.toString()) {
                inc = f;
            }
        });

        return inc == null ? null : inc;
    }

    async getTrackedFires() {
        if (settings.user) {
            const g = await api(host + 'api/v1/trackFires/list');

            trackedDone = true;

            if (g.fires != null) {
                g.fires.forEach(function (f) {
                    tracked.push(f.wfid);
                });
            }
        } else {
            const tr = localStorage.getItem('tracked');
            trackedDone = true;

            if (tr != null) {
                tracked = JSON.parse(tr);
            }
        }

        /* if modal is already open with wildfire data, change the follow button now */
        if (document.querySelector('#modal').classList.contains('open', 'fire')) {
            const tf = document.querySelector('#trackFire');

            if (tf && tracked.includes(tf.getAttribute('data-id'))) {
                tf.setAttribute('data-following', '1');
                tf.setAttribute('title', 'You\'re following this fire');
                tf.classList.add('fas', 'follow');
                tf.classList.remove('far');
            }
        }
    }

    /* get wildfires from API */
    async getWildfires() {
        const types = ['all', 'new', 'smk', 'rx'];

        if (settings.archive) {
            const fires = await api(apiURL + 'wildfires/all', [['archive', settings.archive]]);

            /* add status parameters to each property object and push each incident to an array for search capabilities */
            fires.features.forEach((f, n) => {
                activeIncidents.push(f);

                if (f.properties.status.Out) {
                    fires['features'][n]['properties']['Out'] = true;
                }
                if (f.properties.status.Contain) {
                    fires['features'][n]['properties']['Contain'] = true;
                }
                if (f.properties.status.Control) {
                    fires['features'][n]['properties']['Control'] = true;
                }
            });

            document.querySelector('#q').disabled = false;

            /* convert wildfire geojson to mapbox data */
            if (!map.getSource(types[0] + '_fires')) {
                map.addSource(types[0] + '_fires', {
                    type: 'geojson',
                    data: fires,
                    cluster: CLUSTER_FIRES,
                    clusterMaxZoom: 8,
                    clusterMinPoints: 5,
                    clusterRadius: 50
                });
            }

            this.displayFires(types[0], 0);
        } else {
            /* iterate through types of fire data */
            types.forEach(async (type, n) => {
                /* get fire data from API */
                const fires = await api(apiURL + 'wildfires/' + type);

                /* add status parameters to each property object and push each incident to an array for search capabilities */
                if (fires != null && fires.features != null) {
                    fires.features.forEach((f, n) => {
                        activeIncidents.push(f);

                        if (f.properties.status.Out) {
                            fires['features'][n]['properties']['Out'] = true;
                        }

                        if (f.properties.status.Contain) {
                            fires['features'][n]['properties']['Contain'] = true;
                        }

                        if (f.properties.status.Control) {
                            fires['features'][n]['properties']['Control'] = true;
                        }
                    });

                    /* convert wildfire geojson to mapbox data */
                    if (!map.getSource(type + '_fires')) {
                        map.addSource(type + '_fires', {
                            type: 'geojson',
                            data: fires,
                            cluster: CLUSTER_FIRES,
                            clusterMaxZoom: 7,
                            clusterMinPoints: 10,
                            clusterRadius: 15
                        });
                    }

                    const chk = setInterval(() => {
                        if (map.isSourceLoaded(type + '_fires')) {
                            this.displayFires(type, n);
                            clearInterval(chk);
                        }
                    }, 500);
                }

                /* make search undisabled */
                if (n == types.length - 1) {
                    document.querySelector('#q').disabled = false;
                }

            });
        }
    }

    displayFires(type, n) {
        const lay = ['allFires', 'newFires', 'smokeChecks', 'rxBurns'],
            fireLayerName = type + '_fires_layer';

        /* add fires to map */
        if (map.getSource(type + '_fires')) {
            if (!map.getLayer(type + '_fires')) {
                map.addLayer({
                    id: fireLayerName,
                    type: 'symbol',
                    source: type + '_fires',
                    layout: {
                        'icon-image': this.fireIcon(type),
                        'icon-size': 0.4,
                        'icon-allow-overlap': true,
                        visibility: settings.includes(lay[n]) || !settings.get('checkboxes') && type != 'rx' ? 'visible' : 'none'
                    },
                    paint: {
                        'icon-opacity': [
                            'case',
                            ['has', 'Out'],
                            0.5,
                            1
                        ]
                    }
                }).on('mouseenter', fireLayerName, () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', fireLayerName, () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', fireLayerName, (e) => {
                    const features = map.queryRenderedFeatures(e.point, {
                        layers: [fireLayerName]
                    });

                    if (features.length > 0) {
                        const time = JSON.parse(features[0].properties.time),
                            coords = features[0].geometry.coordinates,
                            data = {
                                wfid: features[0].properties.wfid,
                                name: features[0].properties.name,
                                state: features[0].properties.state,
                                type: features[0].properties.type,
                                incidentID: features[0].properties.incidentID,
                                acres: features[0].properties.acres,
                                discovered: parseFloat(time.discovered),
                                updated: parseFloat(time.updated)
                            };

                        /* log fire click data */
                        this.logFire(data.wfid, data);

                        /* display fire details in modal or open in a new tab */
                        if (settings.fire().display()) {
                            this.incident(data.wfid, true);
                        } else {
                            window.open(host + features[0].properties.url);
                        }
                    }
                }).addLayer({
                    id: type + '_fire_title',
                    type: 'symbol',
                    source: type + '_fires',
                    minzoom: 9,
                    paint: {
                        'text-color': '#000',
                        'text-halo-color': '#fff',
                        'text-halo-blur': 1,
                        'text-halo-width': 2
                    },
                    layout: {
                        'symbol-placement': 'point',
                        'symbol-spacing': 150,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': [
                            'case',
                            [
                                '==',
                                ['get', 'type'],
                                'Wildfire'
                            ],
                            ['concat', ['get', 'name'], ' Fire'],
                            ['get', 'name']
                        ],
                        'text-justify': 'center',
                        'text-size': 12,
                        'text-max-width': 8,
                        'text-anchor': 'top',
                        'text-offset': [0, 1.3],
                        'text-letter-spacing': 0.05,
                        visibility: settings.includes(lay[n]) ? 'visible' : 'none'
                    }
                }).on('mouseenter', type + '_fire_title', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', type + '_fire_title', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }
        }
    }

    doWeather(geo) {
        let wx = new Weather(geo[1], geo[0]);

        wx.incidentWX();
        wx.incidentForecast();
        wx.nearbyAQ();
    }

    fireName(n, t, i) {
        let o = '';
        if (t == 'Prescribed Fire') {
            o = (n.search('RX') >= 0 ? n : n + ' RX');
        } /*else if (t == 'Smoke Check') {
            o = 'Smoke Check #' + parseInt(i.split('-')[2]);
        }*/ else {
            o = (n == undefined ? '' : (n == '' ? 'Incident #' + parseInt(i.split('-')[2]) : ucwords(n.toLowerCase())) + ' Fire');
        }
        return o;
    }

    async incident(wfid, click = false) {
        modal.querySelector('.content').innerHTML = fireDisplay;
        modal.classList.add('fire', 'open');
        modal.classList.remove('wwa', 'closing');

        /* use/get cached incident information */
        if (settings.fire().cache()) {
            /* TODO */
        }

        const getinc = await api(apiURL + 'wildfires/incident', [['wfid', wfid], ['history', 1]]);

        if (!click) {
            map.easeTo({
                center: [getinc.fire.geometry.lon, getinc.fire.geometry.lat],
                zoom: 12,
                duration: 0
            });
        }

        this.doWeather([getinc.fire.geometry.lon, getinc.fire.geometry.lat]);

        /* assign data to variables from incident API */
        const agencies = {
            'US Forest Service': 'USFS',
            'Bureau of Land Management': 'BLM',
            'Bureau of Indian Affairs': 'BIA',
            'National Park Service': 'NPS',
            'Bureau of Reclamation': 'BOR',
            'US Fish & Wildlife Service': 'USFWS',
            'Oregon Department of Forestry': 'ODF',
            'Department of Natural Resources': 'DNR',
            'Idaho Department of Lands': 'IDL',
            'California Department of Forestry & Fire Protection': 'CAL FIRE',
            'California Department of Forestry and Fire Protection': 'CAL FIRE'
        };

        let fire = getinc.fire,
            fr = fire.properties,
            t = fr.type,
            state = fr.fireState,
            incID = fr.incidentId,
            acres = (fr.acres == 'Unknown' ? 'Unknown' : numberFormat(fr.acres)),
            fstat = fr.status,
            st1 = (fire.time.year < curTime.getFullYear() ? 'out' : this.getStatus(fstat, fr.notes)),
            st = (st1 ? st1 : 'active'),
            dispatch = fire.protection.dispatch,
            center = this.getDispatchCenter(dispatch),
            near = fire.geometry.near,
            city = near.split(' of '),
            agency = fire.protection,
            /*rthUrl = [apiUrl('risk', 2), encodeURIComponent(city[1])],*/
            /*n = fr.fireName + (t == 'Wildfire' ? ' Fire' : '')/* + ((curTime.getTime() / 1000) - fire.time.discovered <= 43200 ? '<span class="new">NEW</span>' : ''),*/
            n = this.fireName(fr.fireName, fr.type, incID),
            abbr = agency.agency != 'US Forest Service' ? agencies[agency.agency] : '',
            isTracked = tracked.includes(parseInt(wfid)),
            acresHistory = fr.acres_history;

        if (window.location.pathname.search('/fires') < 0) {
            const title = this.fireName(fr.fireName, fr.type, incID) + ' near ' + near.split(' of ')[1] + ' - Current Incident Information and Wildfire Map',
                desc = 'The ' + this.fireName(fr.fireName, fr.type, incID) + ', located ' + near + ', is currently considered ' + this.getStatus(fr.status, fr.notes) + ' after starting ' + timeAgo(fire.time.discovered) + ', and is ' + acres + ' acres as of ' + timeAgo(fire.time.updated) + '.';

            setHeaders(title, fr.url, desc);
        }

        /* remove any features that require a user to be subscribed */
        if (!settings.hasPermissions('PREMIUM')) {
            document.querySelector('#ah').remove();

            /* unblur coordinates */
            document.querySelector('span.coords').classList.add('blur');
        } else {
            /* load the script for the chart, then create the acreage chart */
            if (acresHistory != null) {
                const c = this;

                if (!highchartsLoad) {
                    loadScript('https://code.highcharts.com/highcharts.js')
                        .then(() => {
                            highchartsLoad = true;
                            c.createChart(acresHistory);
                        });
                } else {
                    c.createChart(acresHistory);
                }
            } else {
                document.querySelector('#ah').remove();
            }
        }

        /* remove placeholders from entire modal */
        document.querySelectorAll('.incident .placeholder').forEach((e) => {
            if (!e.parentElement.parentElement.classList.contains('weather') && e.parentElement.parentElement.id != 'aq') {
                e.classList.remove('placeholder');
                e.style.width = 'unset';
                e.style.height = 'unset';
            }
        });

        /* create template for jurisdiction of incident */
        const juris = '<b>' + t.toUpperCase() + '</b> reported ' +
            (dispatch == '' || (dispatch == 'MAPO' && agency.agency == '') ? ' by National Interagency Fire Center' :
                (agency.area ? (agency.area.search(' Center') >= 0 ? ' by' : ' in') + ' <span style="line-height:1.5;border-bottom:1px dotted #333;cursor:help" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' +
                    (abbr ? abbr + ' ' : '') + agency.area + '</span>' :
                    (agency.unit == 'NWCG' ? ' by NWCG/Inciweb' : '')
                )
            ) + ',&nbsp;' + stateLabels[state].v,
            jdesc = (!agency.agency && !agency.unit ? 'Unknown' : (agency.agency ? agency.agency + ' &mdash; ' : '') + (agency.area ? agency.area : '')),
            logo = (agency.logo || dispatch == 'CAL FIRE' ? '<img class="agency" src="' + domain + 'assets/images/icons/fire/agencies/agency_' + (agency.logo ? agency.logo : (dispatch == 'CAL FIRE' ? 'calfire' : '')) + '_logo.png" alt="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '" title="' + agency.agency + ' - ' + agency.area + ' (' + agency.unit + ')' + '">' : '');

        /* determine the incident's status and apply a badge */
        if (fstat != null && (fstat.Contain || fstat.Control || fstat.Out) && settings.hasPermissions('PREMIUM')) {
            document.querySelector('#fist .fs').innerHTML = (fstat.Contain ? '<div class="fstat-container"><b>Contained</b><span>' + dateTime(fstat.Contain) + '</span></div>' : '') +
                (fstat.Control ? '<div class="fstat-container"><b>Controlled</b><span>' + dateTime(fstat.Control) + '</span></div>' : '') +
                (fstat.Out ? '<div class="fstat-container"><b>Out</b><span>' + dateTime(fstat.Out) + '</span></div>' : '');
        } else {
            document.querySelector('#fist').remove();
        }

        /* don't get current or forecasted weather if this is an old incident */
        if (fire.time.year < curTime.getFullYear()) {
            document.querySelector('#aw').remove();
            modal.querySelector('.incident').insertAdjacentHTML('afterbegin', '<div class="message error">This incident is no longer active and is considered historical.</div>');
        }

        /* if containment is 100% */
        if (fr.containment == '100%') {
            document.querySelector('#e').style.color = 'var(--green)';
            document.querySelector('#e').style.fontWeight = 600;
        }

        /* if user has ADMIN role */
        if (settings.hasPermissions('ADMIN')) {
            n = '<a target="blank" href="' + domain + 'account/admin/wildfires/' + (dispatch == 'MAPO' ? 'modify' : 'edit') + '?wfid=' + wfid + '" style="display:inline-block;font-size:15px;margin-right:5px"><i class="far fa-pen-to-square"></i></a>' + n;
            /*document.querySelector('h1.title').insertAdjacentHTML('beforebegin', edit);*/
        }

        /* fill in FIRE DISPLAY template */
        document.querySelector('h1.title').insertAdjacentHTML('afterbegin', n);
        document.querySelector('span.coords').innerHTML = conversion.coords(fire.geometry.lat, fire.geometry.lon);
        document.querySelector('#a').innerHTML = juris;
        document.querySelector('#b').innerHTML = logo;
        document.querySelector('#c').innerHTML = '<span class="status ' + st + '">' + st.toUpperCase() + '</span>';
        document.querySelector('#d').innerHTML = (acres != 'Unknown' ? conversion.sizing(2, acres.replaceAll(',', '')) : acres) + (acres != 'Unknown' ? '<span class="si">' + (acres == 1 ? conversion.sizing(1).slice(0, -1) : conversion.sizing(1)).toLowerCase() : '') + '</span>';
        document.querySelector('#e').innerHTML = fr.containment;
        document.querySelector('#e').setAttribute('title', 'This fire is ' + fr.containment + ' contained');
        document.querySelector('#f').innerHTML = '<b>Last update:</b> ' + timeAgo(fire.time.updated);
        document.querySelector('#f').setAttribute('title', dateTime(fire.time.updated, true));
        document.querySelector('#g').innerHTML = '<b>Reported:</b> ' + ((curTime.getTime() / 1000) - fire.time.discovered > 2628000 ? dateTime(fire.time.discovered, true) : timeAgo(fire.time.discovered));
        document.querySelector('#g').setAttribute('title', dateTime(fire.time.discovered, true));
        document.querySelector('#h').innerHTML = '<b>Incident #:</b> ' + incID;
        document.querySelector('#il').innerHTML = near;
        document.querySelector('#jur').innerHTML = jdesc;
        document.querySelector('#dn').innerHTML = (fr.notes ? fr.notes : 'None provided');
        document.querySelector('#fu').innerHTML = (fr.fuels ? fr.fuels : 'None specified');
        document.querySelector('#ia').innerHTML = (fr.resources ? fr.resources : 'None reported');

        /* if wildfire incident has Inciweb data */
        if (fire.inciweb) {
            let inci = '';

            if (fire.inciweb.incident_info) {
                inci += '<div class="fire-details title"><h2>Incident Information</h2><div class="body text">' + fire.inciweb.incident_info + '</div></div>';
            }

            if (fire.inciweb.photo) {
                //modal.querySelector('#e').insertAdjacentHTML('afterend', '<div class="photo"><a target="blank" href="https://www.mapofire.com/src/images/incident?path=' + fire.inciweb.photo.url + '"><img src="https://www.mapofire.com/src/images/incident?path=' + fire.inciweb.photo.url + '" title="' + fire.inciweb.photo.caption + '"></a></div>');
            }

            if (fire.inciweb.current) {
                inci += this.incidentDetails(fire.inciweb.current.data);
            }

            if (fire.inciweb.contacts) {
                inci += '<div class="fire-details title"><h2>Fire Incident Contact</h2><div class="body"><div class="row no-margin align-top">' +
                    (fire.inciweb.contacts.contact ? '<div class="col"><h4>Fire Unit Information</h4><p style="margin-bottom:0">' + fire.inciweb.contacts.contact + '</p></div>' : '') +
                    (fire.inciweb.contacts.pio ? '<div class="col"><h4>PIO Contact</h4><p style="margin-bottom:0">' + fire.inciweb.contacts.pio + '</p></div>' : '') +
                    '</div></div></div>';
            }

            document.querySelector('.inciweb').innerHTML = inci;
        }

        /* update the track fire button */
        const tf = document.querySelector('#trackFire');
        tf.style.display = 'block';
        tf.setAttribute('data-id', wfid);
        tf.setAttribute('title', (isTracked ? 'You\'re following' : 'Track') + ' this fire');

        if (isTracked) {
            tf.setAttribute('data-following', 1);
            tf.classList.add('follow', 'fas');
            tf.classList.remove('far');
        }

        /* if there is a dispatch center associated with this incident */
        if (center) {
            document.querySelector('#dc .body').innerHTML = '<p><b>' + center.name + ' (' + center.agency + ')</b><br>' +
                center.location + /*(center.phone && center.phone != '0' ? '<br>' + center.phone : '') +*/
                (center.website ? '<br><a href="' + center.website + '">' + center.website + '</a>' : '') + '</p>' +
                '<p class="updated" style="text-align:left">' + center.agency + ' data last sent ' + timeAgo(center.cad_update) + '</p>';
        } else {
            document.querySelector('#dc').remove();
        }
    }

    perimeterColor(c) {
        let pc;

        switch (c) {
            case 'default':
            case 'red':
                pc = '#f35a5a';
                break;
            case 'blue':
                pc = '#3289d5';
                break;
            case 'orange':
                pc = '#fb8c00';
                break;
            case 'green':
                pc = '#388e3c';
                break;
            case 'purple':
                pc = '#9c27b0';
                break;
            case 'brown':
                pc = '#795548';
                break;
            case 'black':
                pc = '#333';
                break;
        }

        return settings.archive == null ? ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#777', pc] : '#777';
    }

    async perimeters(update = false) {
        let y = (settings.archive ? settings.archive : curTime.getFullYear()),
            min = settings.get('perimeters').minSize,
            pc = this.perimeterColor(settings.perimeters().color()),
            perimName,
            w,
            o;

        if (settings.archive) {
            w = 'FEATURE_CA <> \'Wildfire\' AND FIRE_YEAR=' + settings.archive;
            o = 'OBJECTID,UNQE_FIRE_ID,INCIDENT,GIS_ACRES,DATE_CUR';
            perimName = 'INCIDENT';
        } else {
            w = 'attr_FireDiscoveryDateTime>=TIMESTAMP \'' + y + '-01-01 00:00:00\' AND attr_FireDiscoveryDateTime<=TIMESTAMP \'' + y + '-12-31 23:59:59\' AND (poly_GISAcres > ' + min + ' OR poly_Acres_AutoCalc > ' + min + ') AND attr_FireOutDateTime IS NULL';
            o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_ContainmentDateTime,attr_FireOutDateTime';
            perimName = 'attr_IncidentName';
        }

        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/' + (settings.archive ? 'InterAgencyFirePerimeterHistory_All_Years_View' : 'WFIGS_Interagency_Perimeters') + '/FeatureServer/0/query', [
            ['where', w],
            ['outFields', o],
            ['resultType', 'tile'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['returnGeometry', true],
            ['f', 'geojson']
        ]);

        /* when the map moves, update the source data */
        if (update && map.getSource('perimeters')) {
            map.getSource('perimeters').setData(data);
        } else {
            if (!map.getSource('perimeters')) {
                map.addSource('perimeters', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!map.getLayer('perimeters_outline')) {
                map.addLayer({
                    id: 'perimeters_outline',
                    type: 'line',
                    source: 'perimeters',
                    paint: {
                        'line-width': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            2,
                            1
                        ],
                        'line-color': pc
                    }
                }).addLayer({
                    id: 'perimeters_fill',
                    type: 'fill',
                    source: 'perimeters',
                    paint: {
                        'fill-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            0.5,
                            0.3
                        ],
                        'fill-color': pc
                    }
                }).addLayer({
                    id: 'perimeters_title',
                    type: 'symbol',
                    source: 'perimeters',
                    minzoom: 5.8,
                    paint: {
                        'text-color': settings.archive ? '#fff' : ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#333', '#fff'],
                        'text-halo-color': settings.archive ? '#333' : ['case', ['!=', ['to-string', ['to-number', ['get', 'attr_ContainmentDateTime']]], '0'], '#fff', '#ff0000'],
                        'text-halo-blur': 1,
                        'text-halo-width': 1
                    },
                    layout: {
                        'symbol-placement': 'line',
                        'symbol-spacing': 200,
                        'symbol-avoid-edges': true,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['upcase', ['concat', ['get', perimName], ' Fire']],
                        'text-justify': 'center',
                        'text-size': 13,
                        'text-max-width': 8,
                        'text-anchor': 'center',
                        'text-offset': [0, 1],
                        'text-letter-spacing': 0.05
                    }
                }).on('click', 'perimeters_fill', (e) => {
                    if (e.features.length > 0) {
                        if (settings.perimeters().zoom() == '1') {
                            map.fitBounds(geojsonExtent(e.features[0].geometry), {
                                padding: 60
                            });
                        }

                        /*const incID = e.features[0].properties.attr_UniqueFireIdentifier,
                            calcAcres = e.features[0].properties.poly_Acres_AutoCalc,
                            modified = e.features[0].properties.poly_DateCurrent / 1000,
                            gisAcres = e.features[0].properties.poly_GISAcres,
                            name = e.features[0].properties.poly_IncidentName,
                            acres = calcAcres > gisAcres ? calcAcres : gisAcres;

                        new mapboxgl.Popup()
                            .setLngLat([e.lngLat.lng, e.lngLat.lat])
                            .setHTML('<h1>' + name + '</h1><p><b>' + numberFormat(acres) + '</b> acres</p><p class="updated">Last mapped ' + timeAgo(modified) + '</p>')
                            .addTo(map);*/

                        /*activeIncidents.forEach((a) => {
                            if (a.properties.incidentId == e.features[0].properties.attr_UniqueFireIdentifier) {
                                console.log(new Wildfires().incident(a.properties.wfid));
                            }
                        });*/

                        /*if (selectedPerim !== null) {
                            map.setFeatureState(
                                { source: 'perimeters', id: selectedPerim },
                                { click: false }
                            );
                        }
                        selectedPerim = e.features[0].id;
 
                        map.setFeatureState(
                            { source: 'perimeters', id: selectedPerim },
                            { click: true }
                        );*/
                    }
                }).on('mouseenter', 'perimeters_fill', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'perimeters_fill', () => {
                    map.getCanvas().style.cursor = 'auto';

                    /*if (selectedPerim !== null) {
                        map.setFeatureState(
                            { source: 'perimeters', id: selectedPerim },
                            { hover: false }
                        );
                    }
                    selectedPerim = null;*/
                })/*.on('mousemove', 'perimeters_fill', (e) => {
            if (e.features.length > 0) {
                if (selectedPerim !== null) {
                    map.setFeatureState(
                        { source: 'perimeters', id: selectedPerim },
                        { hover: false }
                    );
                }
                selectedPerim = e.features[0].id;

                map.setFeatureState(
                    { source: 'perimeters', id: selectedPerim },
                    { hover: true }
                );
            }
        })*/;
            }
        }
    }
}

class Layers {
    init() {
        /* add lightning layers to the map */
        this.lightning();

        /* get air quality */
        this.airQuality();
    }

    async airQuality() {
        const data = await api('https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/Air_Now_Current_Monitors_PM/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'ObjectId,AQSID,SiteName,LocalTimeString,PM25_AQI,PM25'],
            ['returnGeometry', 'true'],
            /*['geometry', getbbox()],*/
            ['geometryPrecision', '6'],
            ['returnExceededLimitFeatures', 'true'],
            ['f', 'geojson']
        ]);

        airQualityStns = data;

        if (!data.error) {
            if (!map.getSource('airq')) {
                map.addSource('airq', {
                    type: 'geojson',
                    data: data,
                    cluster: true,
                    clusterMaxZoom: 7,
                    clusterMinPoints: 5,
                    clusterRadius: 40
                });
            }

            if (!map.getLayer('airQuality')) {
                map.addLayer({
                    id: 'airQuality',
                    type: 'circle',
                    source: 'airq',
                    filter: [
                        '==', ['typeof', ['get', 'PM25_AQI']], 'number'
                    ],
                    layout: {
                        visibility: settings.includes('airq') ? 'visible' : 'none'
                    },
                    paint: {
                        'circle-radius': 12,
                        'circle-color': [
                            'case',
                            ['<=', ['get', 'PM25_AQI'], 50],
                            '#00e400',
                            [
                                'all',
                                ['>', ['get', 'PM25_AQI'], 50],
                                ['<=', ['get', 'PM25_AQI'], 100]
                            ],
                            '#ffff00',
                            [
                                'all',
                                ['>', ['get', 'PM25_AQI'], 100],
                                ['<=', ['get', 'PM25_AQI'], 150]
                            ],
                            '#ff7e00',
                            [
                                'all',
                                ['>', ['get', 'PM25_AQI'], 150],
                                ['<=', ['get', 'PM25_AQI'], 200]
                            ],
                            '#ff0000',
                            [
                                'all',
                                ['>', ['get', 'PM25_AQI'], 200],
                                ['<=', ['get', 'PM25_AQI'], 300]
                            ],
                            '#8f3f97',
                            [
                                'all',
                                ['>', ['get', 'PM25_AQI'], 300],
                                ['<=', ['get', 'PM25_AQI'], 500]
                            ],
                            '#7e0023',
                            '#d9d9d9'
                        ],
                        'circle-stroke-color': 'black',
                        'circle-stroke-width': 1
                    }
                }).on('mouseenter', 'airQuality', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'airQuality', () => {
                    map.getCanvas().style.cursor = 'auto';
                }).on('click', 'airQuality', (e) => {
                    const aq = map.queryRenderedFeatures(e.point, {
                        layers: ['airQuality']
                    });

                    if (aq.length > 0) {
                        const e = aq[0];

                        if (e.layer.id == 'airQuality') {
                            console.log(e);

                            const w = new Weather(),
                                aqi = e.properties.PM25_AQI,
                                d = w.airQDesc(aqi);

                            new mapboxgl.Popup()
                                .setLngLat(e.geometry.coordinates)
                                .setHTML('<h1>' + e.properties.SiteName + '</h1><span class="air_quality" style="display:inline-block;color:#' + (aqi <= 100 ? '000' : 'fff') + ';background-color:' + w.airQColor(e.properties.PM25_AQI) + '">' +
                                    d.quality + '</span><p>' + d.desc + '</p><p class="updated" style="text-align:left">Last report ' + timeAgo(new Date(e.properties.LocalTimeString).getTime() / 1000) + '</p>')
                                .addTo(map);
                        }
                    }
                }).addLayer({
                    id: 'airQuality_text',
                    type: 'symbol',
                    source: 'airq',
                    paint: {
                        'text-color': [
                            'case',
                            ['>=', ['get', 'PM25_AQI'], 150],
                            '#fff',
                            '#000'
                        ]
                    },
                    layout: {
                        'text-ignore-placement': true,
                        'text-allow-overlap': true,
                        'symbol-placement': 'point',
                        'symbol-spacing': 150,
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['get', 'PM25_AQI'],
                        'text-justify': 'center',
                        'text-size': 11,
                        visibility: settings.includes('airq') ? 'visible' : 'none'
                    }
                });
            }
        }
    }

    lightning() {
        map.addSource('lightning1', {
            type: 'raster',
            maxzoom: 15,
            tiles: [
                host + 'api/v1/lightning?key=' + apiKey + '&x={x}&y={y}&z={z}&s=256&t=5'
                /*host + 'apis/cache/lightning/5_{x}_{y}_{z}.png'*/
            ],
            tileSize: 256
        }).addLayer({
            id: 'lightning1',
            type: 'raster',
            source: 'lightning1',
            layout: {
                visibility: settings.includes('lightning1') || !settings.get('checkboxes') ? 'visible' : 'none'
            }
        }).addSource('lightning24', {
            type: 'raster',
            maxzoom: 15,
            tiles: [
                host + 'api/v1/lightning?key=' + apiKey + '&x={x}&y={y}&z={z}&s=256&t=6'
                /*host + 'apis/cache/lightning/6_{x}_{y}_{z}.png'*/
            ],
            tileSize: 256
        }).addLayer({
            id: 'lightning24',
            type: 'raster',
            source: 'lightning24',
            layout: {
                visibility: settings.includes('lightning24') || !settings.get('checkboxes') ? 'visible' : 'none'
            }
        });
    }

    async radarInit() {
        await fetch('https://api.rainviewer.com/public/weather-maps.json').then(async (resp) => {
            const imgs = await resp.json();

            imgs.radar.past.forEach((e) => {
                radarImgs.push(e.time);
            });

            let time = (n) => {
                const d = new Date(radarImgs[n] * 1000),
                    h = d.getHours(),
                    m = d.getMinutes();

                return (h > 12 ? h - 12 : (h == 12 ? 12 : h)) + ':' + (m < 10 ? '0' : '') + m + (h >= 12 ? 'p' : 'a') + 'm';
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

    async modis(w, update = false) {
        let n = (w == 1 ? '24' : (w == 2 ? '48' : '72')),
            color = (w == 1 ? '#ffa500' : (w == 2 ? '#800080' : '#800000')),
            ms = new Date(),
            d1 = new Date(ms.getTime() - 86400000),
            d2 = new Date(ms.getTime() - 172800000),
            d3 = new Date(ms.getTime() - 259200000),
            fd1 = (d1.getMonth() + 1) + '/' + d1.getDate() + '/' + d1.getFullYear() + ' ' + d1.getHours() + ':' + (d1.getMinutes() < 10 ? '0' : '') + d1.getMinutes(),
            fd2 = (d2.getMonth() + 1) + '/' + d2.getDate() + '/' + d2.getFullYear() + ' ' + d2.getHours() + ':' + (d2.getMinutes() < 10 ? '0' : '') + d2.getMinutes(),
            fd3 = (d3.getMonth() + 1) + '/' + d3.getDate() + '/' + d3.getFullYear() + ' ' + d3.getHours() + ':' + (d3.getMinutes() < 10 ? '0' : '') + d3.getMinutes();

        const data = await api('https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query', [
            ['where', 'acq_time >= DATE \'' + (w == 1 ? fd1 : (w == 2 ? fd2 : fd3)) + ':00\'' + (w != 1 ? ' AND acq_time <= DATE \'' + (w == 2 ? fd1 : fd2) + ':00\'' : '')],
            ['outFields', '*'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['returnGeometry', true],
            ['f', 'geojson']]);

        if (update) {
            map.getSource('modis' + n).setData(data);
        } else {
            if (!map.getSource('modis' + n)) {
                map.addSource('modis' + n, {
                    type: 'geojson',
                    data: data
                });
            }

            if (!map.getLayer('modis' + n)) {
                map.addLayer({
                    id: 'modis' + n,
                    /*type: 'circle',*/
                    type: 'symbol',
                    source: 'modis' + n,
                    layout: {
                        'icon-image': 'modis' + w,
                        'icon-size': 0.5,
                        'icon-allow-overlap': true
                    },
                    paint: {
                        'icon-opacity': 0.5
                        /*'circle-color': color,
                        'circle-stroke-color': color,
                        'circle-radius': [
                            'interpolate',
                            ['exponential', 0.5],
                            ['zoom'],
                            5,
                            1,
                            9,
                            3,
                            12,
                            4
                        ],
                        'circle-stroke-width': 2,
                        'circle-opacity': 0.4*/
                    }
                });
            }
        }
    }

    nfdrs() {
        if (!map.getSource('nfdrs')) {
            map.addSource('nfdrs', {
                'type': 'raster',
                'tiles': [
                    'https://fsapps.nwcg.gov/psp/arcgis/rest/services/npsg/Fire_Danger/MapServer/export?service=WMS&request=GetMap&layers=show:0&styles=&format=png32&transparent=true&version=1.1.1&id=National Fire Danger Rating System (NFDRS)&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&width=1477&height=482&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                'tileSize': 256
            });
        }

        if (!map.getLayer('nfdrs')) {
            map.addLayer({
                id: 'nfdrs',
                type: 'raster',
                source: 'nfdrs',
                paint: {
                    'raster-opacity': 0.7
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    sfp(update = false) {
        const ss = document.querySelector('#sfpDateSelect'),
            time = settings.get('special').sfpDate ? settings.get('special').sfpDate : ss,
            url = 'https://fsapps.nwcg.gov/psp/arcgis/services/npsg/current_forecast/MapServer/WMSServer?service=WMS&request=GetMap&layers=0&styles=&format=image/png&transparent=true&version=1.1.1&id=National Significant Fire Potential Outlook&time=' + time + '&f=image&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}';

        if (update) {
            map.getSource('sfp').setTiles([
                url
            ]);
        } else {
            if (!map.getSource('sfp')) {
                map.addSource('sfp', {
                    type: 'raster',
                    tiles: [
                        url
                    ],
                    tileSize: 256
                });
            }

            if (!map.getLayer('sfp')) {
                map.addLayer({
                    id: 'sfp',
                    type: 'raster',
                    source: 'sfp',
                    paint: {
                        'raster-opacity': 0.5
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    async nri(update = false) {
        const data = await api('https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/National_Risk_Index_Counties/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,NRI_ID,COUNTY,STATE,STATEABBRV,WFIR_EALT,WFIR_RISKR,EAL_SPCTL,POPULATION,BUILDVALUE,AGRIVALUE,AREA'],
            ['geometry', getbbox()],
            ['geometryPrecision', 6],
            ['returnGeometry', true],
            ['f', 'geojson']]);

        if (update) {
            map.getSource('nri').setData(data);
        } else {
            if (!map.getSource('nri')) {
                map.addSource('nri', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!map.getLayer('nri_outline')) {
                map.addLayer({
                    id: 'nri_fill',
                    type: 'fill',
                    source: 'nri',
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['get', 'WFIR_RISKR'], 'No Rating'], '#fff',
                            ['==', ['get', 'WFIR_RISKR'], 'Very Low'], '#4d6dbd',
                            ['==', ['get', 'WFIR_RISKR'], 'Relatively Low'], '#509bc7',
                            ['==', ['get', 'WFIR_RISKR'], 'Relatively Moderate'], '#f0d55d',
                            ['==', ['get', 'WFIR_RISKR'], 'Relatively High'], '#e07069',
                            ['==', ['get', 'WFIR_RISKR'], 'Very High'], '#c7445d',
                            '#9e9e9e'
                        ],
                        'fill-opacity': 0.5
                    },
                    layout: {
                        visibility: 'visible'
                    }
                }).addLayer({
                    id: 'nri_outline',
                    type: 'line',
                    source: 'nri',
                    paint: {
                        'line-color': '#666',
                        'line-width': 1
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            }
        }
    }

    rth() {
        if (!map.getSource('rth')) {
            map.addSource('rth', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/RMRS_WRC_RiskToPotentialStructures/ImageServer/exportImage?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Risk%20to%20Homes&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('rth')) {
            map.addLayer({
                id: 'rth',
                type: 'raster',
                source: 'rth',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    whp() {
        if (!map.getSource('whp')) {
            map.addSource('whp', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/arcx/rest/services/RDW_Wildfire/RMRS_WildfireHazardPotential_2018/MapServer/export?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Hazard%20Potential%20(2018)&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('whp')) {
            map.addLayer({
                id: 'whp',
                type: 'raster',
                source: 'whp',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    drought() {
        if (!map.getSource('drought')) {
            map.addSource('drought', {
                type: 'raster',
                tiles: [
                    'https://gis.fema.gov/arcgis/rest/services/Partner/Drought_Current/MapServer/export?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=false&version=1.1.1&id=UNL%20Drought%20Monitor&ugtransparent=true&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('drought')) {
            map.addLayer({
                id: 'drought',
                type: 'raster',
                source: 'drought',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    fuels() {
        if (!map.getSource('fuels')) {
            map.addSource('fuels', {
                type: 'raster',
                tiles: [
                    'https://dmsdata.cr.usgs.gov/geoserver/gwc/service/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=landfire%3ALC23_FVT_240&TILED=true&SRS=EPSG%3A3857&jsonLayerId=us_240%20Fuel%20Vegetation%20Type&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
                ],
                tileSize: 256
            }).addSource('fuelsAK', {
                type: 'raster',
                tiles: [
                    'https://dmsdata.cr.usgs.gov/geoserver/gwc/service/wms?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=&TRANSPARENT=true&LAYERS=landfire%3ALA23_EVT_240&TILED=true&SRS=EPSG%3A3857&jsonLayerId=ak_240%20Existing%20Vegetation%20Type&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('fuels')) {
            map.addLayer({
                id: 'fuels',
                type: 'raster',
                source: 'fuels',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            }).addLayer({
                id: 'fuelsAK',
                type: 'raster',
                source: 'fuelsAK',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    countyBounds() {
        if (!map.getSource('countyBounds')) {
            map.addSource('countyBounds', {
                type: 'raster',
                tiles: [
                    'https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/export?service=WMS&request=GetMap&layers=show%3A2&styles=&format=png32&transparent=true&version=1.1.1&id=Counties&size=256,256&bboxSR=102100&imageSR=102100&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('countyBounds')) {
            map.addLayer({
                id: 'countyBounds',
                type: 'raster',
                source: 'countyBounds',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    nwsCWAs() {
        if (!map.getSource('nwsCWAs')) {
            map.addSource('nwsCWAs', {
                type: 'raster',
                tiles: [
                    'https://mapservices.weather.noaa.gov/static/rest/services/nws_reference_maps/nws_reference_map/MapServer/export?service=WMS&request=GetMap&layers=show%3A1&styles=&format=png32&transparent=true&version=1.1.1&id=NWS%20CWAs&size=256,256&bboxSR=3857&imageSR=3857&f=image&dpi=90&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('nwsCWAs')) {
            map.addLayer({
                id: 'nwsCWAs',
                type: 'raster',
                source: 'nwsCWAs',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    /*usfs() {
        if (!map.getSource('usfs')) {
            map.addSource('usfs', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('usfs')) {
            map.addLayer({
                id: 'usfs',
                type: 'raster',
                source: 'usfs',
                minzoom: 0,
                maxzoom: 19,        
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }*/

    roads() {
        if (!map.getSource('roads')) {
            map.addSource('roads', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_RoadBasic_01/MapServer/export?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=USFS%20Road%20Network&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('roads')) {
            if (map.getZoom() > 11) {
                map.addLayer({
                    id: 'roads',
                    type: 'raster',
                    source: 'roads',
                    paint: {
                        'raster-opacity': 1
                    },
                    layout: {
                        visibility: 'visible'
                    }
                });
            } else {
                notify('info', 'You must be zoomed in more to see USFS roads.');
            }
        }
    }

    lands() {
        if (!map.getSource('lands')) {
            map.addSource('lands', {
                type: 'raster',
                tiles: [
                    'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/export?service=WMS&request=GetMap&layers=show%3A17&styles=&format=png32&transparent=true&version=1.1.1&id=Federal%20Lands&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('lands')) {
            map.addLayer({
                id: 'lands',
                type: 'raster',
                source: 'lands',
                paint: {
                    'raster-opacity': 0.6
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    plss() {
        if (!map.getSource('plss')) {
            map.addSource('plss', {
                type: 'raster',
                tiles: [
                    'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/export?service=WMS&request=GetMap&layers=show%3A1%2C2%2C3&styles=&format=png32&transparent=true&version=1.1.1&id=PLSS&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('plss')) {
            map.addLayer({
                id: 'plss',
                type: 'raster',
                source: 'plss',
                paint: {
                    'raster-opacity': 1
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async dispatch(update = false) {
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_Dispatch_Current/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,DispName,DispUnitID,DispLocation,ContactPhone'],
            ['returnGeometry', true],
            ['resultType', 'tile'],
            ['geometryPrecision', 6],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            map.getSource('dispatch').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!map.getSource('dispatch')) {
                    map.addSource('dispatch', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!map.getLayer('dispatch_outline')) {
                    map.addLayer({
                        id: 'dispatch_outline',
                        type: 'line',
                        source: 'dispatch',
                        paint: {
                            'line-color': '#000',
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    }).addLayer({
                        id: 'dispatch_title',
                        type: 'symbol',
                        source: 'dispatch',
                        minzoom: 5.7,
                        paint: {
                            'text-color': '#000',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 450,
                            'text-font': ['DIN Pro Medium'],
                            'text-field': ['get', 'DispName'],
                            'text-justify': 'auto',
                            'text-size': 14,
                            'text-max-width': 12,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.3],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    async gaccBounds(update = false) {
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_GACC_Current/FeatureServer/1/query', [
            ['where', '1=1'],
            ['outFields', 'OBJECTID,GACCUnitID,GACCName,GACCLocation'],
            ['returnGeometry', true],
            ['geometryPrecision', 6],
            ['resultType', 'tile'],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            map.getSource('gaccBounds').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!map.getSource('gaccBounds')) {
                    map.addSource('gaccBounds', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!map.getLayer('gaccBounds')) {
                    map.addLayer({
                        id: 'gaccBounds',
                        type: 'line',
                        source: 'gaccBounds',
                        paint: {
                            'line-color': '#000',
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    }).addLayer({
                        id: 'gaccBounds_title',
                        type: 'symbol',
                        source: 'gaccBounds',
                        minzoom: 5.7,
                        paint: {
                            'text-color': '#000',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 450,
                            'text-font': ['DIN Pro Medium'],
                            'text-field': ['get', 'GACCName'],
                            'text-justify': 'auto',
                            'text-size': 14,
                            'text-max-width': 12,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.3],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    sfcSmoke() {
        if (!map.getSource('sfcSmoke')) {
            map.addSource('sfcSmoke', {
                type: 'raster',
                tiles: [
                    'https://apps.gsl.noaa.gov/smoke/wmts/image/hrrr_smoke?var=sfc_smoke&x={x}&y={y}&z={z}&time=' + hrrrSmokeTime.fcst + '&modelrun=' + hrrrSmokeTime.init + '&level=0'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('sfcSmoke')) {
            map.addLayer({
                id: 'sfcSmoke',
                type: 'raster',
                source: 'sfcSmoke',
                paint: {
                    'raster-opacity': 0.75
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    viSmoke() {
        if (!map.getSource('viSmoke')) {
            map.addSource('viSmoke', {
                type: 'raster',
                tiles: [
                    'https://apps.gsl.noaa.gov/smoke/wmts/image/hrrr_smoke?var=vi_smoke&x={x}&y={y}&z={z}&time=' + hrrrSmokeTime.fcst + '&modelrun=' + hrrrSmokeTime.init + '&level=0'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('viSmoke')) {
            map.addLayer({
                id: 'viSmoke',
                type: 'raster',
                source: 'viSmoke',
                paint: {
                    'raster-opacity': 0.75
                },
                layout: {
                    visibility: 'visible'
                }
            });
        }
    }

    async calfireUnits(update = false) {
        const data = await api('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/cdfadmin19_1/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'UNIT,UNITCODE,REGION'],
            ['returnGeometry', true],
            ['geometryPrecision', 6],
            ['geometry', getbbox()],
            ['resultType', 'tile'],
            ['f', 'geojson']
        ]);

        if (update) {
            map.getSource('calfireUnits').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!map.getSource('calfireUnits')) {
                    map.addSource('calfireUnits', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!map.getLayer('calfireUnits')) {
                    map.addLayer({
                        id: 'calfireUnits',
                        type: 'line',
                        source: 'calfireUnits',
                        paint: {
                            'line-color': '#177ca3',
                            'line-width': 2
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    }).addLayer({
                        id: 'calfireUnits_title',
                        type: 'symbol',
                        source: 'calfireUnits',
                        minzoom: 5.7,
                        paint: {
                            'text-color': '#177ca3',
                            'text-halo-color': '#fff',
                            'text-halo-blur': 1,
                            'text-halo-width': 1
                        },
                        layout: {
                            'symbol-placement': 'point',
                            'symbol-spacing': 450,
                            'text-font': ['DIN Pro Medium'],
                            'text-field': ['get', 'UNIT'],
                            'text-justify': 'auto',
                            'text-size': 14,
                            'text-max-width': 12,
                            'text-anchor': 'bottom',
                            'text-offset': [0, 1.3],
                            'text-letter-spacing': 0.05
                        }
                    });
                }
            }
        }
    }

    async cdfFHSZ(update = false) {
        const data = await api('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/ArcGIS/rest/services/FHSZSRA_23_3/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', 'FHSZ'],
            ['returnGeometry', true],
            ['resultType', 'tile'],
            ['geometryPrecision', 6],
            ['geometry', getbbox()],
            ['f', 'geojson']
        ]);

        if (update) {
            map.getSource('cdfFHSZ').setData(data);
        } else {
            if (data && data.features.length > 0) {
                if (!map.getSource('cdfFHSZ')) {
                    map.addSource('cdfFHSZ', {
                        type: 'geojson',
                        data: data
                    });
                }

                if (!map.getLayer('cdfFHSZ')) {
                    map.addLayer({
                        id: 'cdfFHSZ',
                        type: 'fill',
                        source: 'cdfFHSZ',
                        paint: {
                            'fill-color': [
                                'case',
                                ['==', ['to-number', ['get', 'FHSZ']], 1], '#ffff00',
                                ['==', ['to-number', ['get', 'FHSZ']], 2], '#ffaa00',
                                '#ff0000'
                            ],
                            'fill-opacity': 0.75
                        },
                        layout: {
                            visibility: 'visible'
                        }
                    });
                }
            }
        }
    }

    async oregonEvac() {
        const data = await api('https://services.arcgis.com/uUvqNMGPm7axC2dD/ArcGIS/rest/services/Fire_Evacuation_Areas_Public/FeatureServer/0/query', [
            ['where', '1=1'],
            ['outFields', '*'],
            ['returnGeometry', true],
            ['resultType', 'tile'],
            ['geometryPrecision', 6],
            ['f', 'geojson']
        ]);

        if (!map.getSource('orEVAC')) {
            map.addSource('orEVAC', {
                type: 'geojson',
                data: data
            });
        }

        if (!map.getLayer('orEVAC')) {
            map.addLayer({
                id: 'orEVAC',
                type: 'fill',
                source: 'orEVAC',
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['to-number', ['get', 'Fire_Evacuation_Level']], 2], 'rgb(255, 255, 0)',
                        ['==', ['to-number', ['get', 'Fire_Evacuation_Level']], 3], 'rgb(230, 0, 0)',
                        'rgb(56, 168, 0)'
                    ],
                    'fill-opacity': 0.3
                },
                layout: {
                    visibility: 'visible'
                }
            }).addLayer({
                type: 'line',
                source: 'orEVAC',
                id: 'orEVAC_outline',
                paint: {
                    'line-color': '#111',
                    'line-width': 2,
                    'line-dasharray': [0, 4, 3]
                }
            }).addLayer({
                id: 'orEVAC_title',
                type: 'symbol',
                source: 'orEVAC',
                minzoom: 10,
                paint: {
                    'text-color': '#fff',
                    'text-halo-color': '#333',
                    'text-halo-blur': 1,
                    'text-halo-width': 1
                },
                layout: {
                    'symbol-placement': 'point',
                    'symbol-spacing': 200,
                    'text-font': ['DIN Pro Medium'],
                    'text-field': [
                        'case',
                        ['==', ['get', 'Fire_Evacuation_Level'], 2], 'Level 2: Be Set',
                        ['==', ['get', 'Fire_Evacuation_Level'], 3], 'Level 3: Go Now',
                        'Level 1: Be Ready'
                    ],
                    'text-justify': 'center',
                    'text-size': 15,
                    'text-max-width': 8,
                    'text-anchor': 'center',
                    'text-offset': [0, 1],
                    'text-letter-spacing': 0.05
                }
            }).on('mouseenter', 'orEVAC', () => {
                map.getCanvas().style.cursor = 'pointer';
            }).on('mouseleave', 'orEVAC', () => {
                map.getCanvas().style.cursor = 'auto';
            }).on('click', 'orEVAC', (e) => {
                const feat = map.queryRenderedFeatures(e.point, {
                    layers: ['orEVAC']
                });

                if (feat.length > 0) {
                    map.fitBounds(geojsonExtent(feat[0].geometry), {
                        padding: 60
                    });

                    const p = feat[0].properties,
                        n = p.Evac_Area_Name,
                        s = p.StructuresWithin,
                        a = p.AddressesWithin,
                        ppl = p.PopulationWithin,
                        u = timeAgo(p.last_edited_date / 1000),
                        d = p.Fire_Evacuation_Level == 1 ? 'Prepare to evacuate' : p.Fire_Evacuation_Level == 2 ? 'Prepare to leave at a moment\'s notice' : 'Leave immediately';

                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML('<h1>Level ' + p.Fire_Evacuation_Level + ' Evacuation</h1><p style="font-weight:bold;color:var(--blue-gray);font-size:16px;text-transform:uppercase">' + d + '</p>' +
                            (n != null ? '<p><b>Area Name:</b> ' + n + '</p>' : '') +
                            '<p><b>County:</b> ' + p.County + ' County</p><p><b>Structures:</b> ' + s + '</p>' +
                            '<p><b>Addresses:</b> ' + a + '</p><p><b>Population:</b> ' + ppl + '</p><p class="updated" style="text-align:left">Last modified ' + u + '</p>'
                        )
                        .addTo(map);
                }
            });
        }
    }
}

function plural(v) {
    return (v > 1 ? 's' : '');
}

function matheq(d, s, r) {
    return Math.floor(((d / s) - Math.floor(d / s)) * r);
}

function gmtime(s) {
    var d = new Date(new Date().getTime() + (s * 1000)),
        m = d.getUTCMonth() + 1,
        t = d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate() + 'T' + (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':00:00';

    return t;
}

function timeAgo(t, w, c) {
    var val,
        d = (c ? c : Math.round(new Date().getTime() / 1000)) - t;

    if (d < 10) {
        val = 'Just now';
    } else if (d >= 10 && d < 60) {
        val = d + ' sec' + plural(d);
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

    if (val == 'Just now') {
        return val;
    } else {
        return val === undefined ? 'unknown' : val + ' ago';
    }
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

function getbbox() {
    var b = map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast();

    return (b ? JSON.stringify({
        xmin: ne.lng,
        ymin: sw.lat,
        xmax: sw.lng,
        ymax: ne.lat,
        spatialReference: {
            wkid: 4326
        }
    }) : false);
}

/* generate forecast model times */
function ndfdTime(add = null) {
    var a = new Date(),
        e = a.toString().split(' GMT')[0],
        b = (a.getMonth() + 1) + '/' + a.getDate() + '/' + a.getFullYear();
    c = e.match(/([0-9:]{8,})/gm)[0].split(':'),
        h = parseInt(c[0]);

    if (c[1] > 0) {
        h += 1;
    }

    var t = b + ' ' + h + ':00:00';

    return new Date(t).getTime() + (add ? (add * 60 * 60 * 1000) : 0);
}

function initNDFDTimes() {
    let o = '';

    for (let i = 0; i < 24; i++) {
        let t = new Date(ndfdTime(i)),
            y = t.getUTCFullYear(),
            m1 = (t.getUTCMonth() + 1),
            m = (m1 < 10 ? '0' : '') + m1,
            d1 = t.getUTCDate(),
            d = (d1 < 10 ? '0' : '') + d1,
            h1 = t.getUTCHours(),
            h = (h1 < 10 ? '0' : '') + h1,
            ts = y + '-' + m + '-' + d + 'T' + h + ':00:00.000Z',
            lh = (t.getHours() > 12 ? t.getHours() - 12 : (t.getHours() == 0 ? '12' : t.getHours())) + ':00';

        o += '<option ' + (settings.get('special') && settings.get('special').fcstTime == ts ? 'selected ' : '') + 'value="' + ts + '">' + (lh == 0 ? '12' : lh) + ' ' + (t.getHours() >= 12 ? 'P' : 'A') + 'M</option>';
    }

    return o;
}

function sfpTimes() {
    let o = '';

    for (let z = 0; z < 6; z++) {
        let t = new Date(new Date().getTime() + (z * 24 * 60 * 60 * 1000)),
            d = days[t.getUTCDay()] + ', ' + months[t.getUTCMonth()] + ' ' + t.getUTCDate(),
            v = t.getUTCFullYear() + '-' + (t.getUTCMonth() < 10 ? '0' : '') + (t.getUTCMonth() + 1) + '-' + (t.getUTCDate() < 10 ? '0' : '') + t.getUTCDate() + 'T00:00:00.0Z';

        o += '<option value="' + v + '">' + d + (z == 0 ? ' (Today)' : (z == 1 ? ' (Tomorrow)' : '')) + '</option>';
    }

    return o;
}

function setHeaders(a, b, c) {
    window.history.pushState({
        "pageTitle": a + ' - ' + productName
    }, '', host + b.replace('incident/', '').replace('wildfire/', 'fires/') + (window.location.search ? window.location.search : '') + (window.location.hash ? window.location.hash : ''));

    document.title = a + ' - ' + productName;
    document.querySelector('meta[name="description"]').setAttribute('content', c);
}

function unsetHeaders() {
    if (window.location.href.search('fires') >= 0 || window.location.href.search('weather/') >= 0 || window.location.href.search('risk') >= 0) {
        window.history.pushState({
            "pageTitle": document.title
        }, '', window.location.href.replace(window.location.pathname, ''));
        document.title = defaultTitle;
        document.querySelector('meta[name="description"]').setAttribute('content', defaultDesc);
    }
}

function closeModal() {
    modal.classList.remove('open');
    modal.classList.add('closing');
    modal.querySelector('.content').innerHTML = '';

    unsetHeaders();
}

function closeDataForm() {
    const df = document.querySelector('#data-form'),
        sh = document.querySelector('.shadow');

    if (df) {
        df.remove();
    }

    if (sh) {
        sh.remove();
    }
}

function closeImpact() {
    impact.style.display = 'none';
    impact.innerHTML = '';
    impact.style.maxHeight = 'unset';
}

function notify(t, m) {
    const timing = (((m.split(' ').length / 5) + 0.5) * 1000) + 500,
        el = document.createElement('div');

    if (document.querySelector('div.alert')) {
        document.querySelector('div.alert').remove();
    }

    el.classList.add('alert', t);

    if (modal.classList.contains('open')) {
        el.classList.add('mo');
    }

    el.style.display = 'flex';
    el.innerHTML = '<i class="fas ' + (t == 'success' ? 'fa-check' : (t == 'info' ? 'fa-circle-info' : 'fa-circle-exclamation')) + '"></i><p>' + m + '</p>';
    document.body.append(el);

    setTimeout(() => {
        el.remove();
    }, timing);
}

async function saveSession(method = true, msg) {
    if (navigator.onLine) {
        let c = map.getCenter(),
            lat = c.lat,
            lon = c.lng,
            z = map.getZoom(),
            p = map.getPitch(),
            b = map.getBearing(),
            t = settings.map().tile,
            set = settings.settings,
            sy = document.querySelector('li#save span');

        set.center = [lat, lon];
        set.zoom = z;
        set.pitch = p;
        set.bearing = b;
        set.tile = t;

        if (sy != null) {
            sy.innerHTML = 'Syncing...';
        }

        if (impact.querySelector('#sync')) {
            impact.querySelector('#sync span').innerHTML = 'Syncing...';
        }

        const data = await api(host + 'api/v1/session', [
            ['method', method],
            ['settings', JSON.stringify(set)],
            ['new', 1]
        ]);

        if (data.success == 1) {
            sy.innerHTML = 'Sync';

            if (impact.querySelector('#sync')) {
                impact.querySelector('#sync span').innerHTML = 'Account synced just now';
            }

            console.info('Settings saved ' + (method ? 'automatic' : 'manu' + 'ally'));
            notify('success', 'Your settings were successfully synced.');
        }
    } else {
        notify('error', 'Unable to sync your settings due to no internet.');
    }
}

function createDataForm(title, content, center = false) {
    if (document.querySelector('#data-form')) {
        document.querySelector('#data-form').remove();
    }

    const el = document.createElement('div');
    el.id = 'data-form';
    el.innerHTML = '<div class="wrapper' + (center ? ' center' : '') + '"><h1>' + title + '</h1>' + content + '</div>';
    document.body.append(el);
}

/* allow user to submit report to MAPO of a new wildfire incident */
function doReport(data, lat, lon) {
    if (settings.user != null) {
        document.querySelector('#newReport input[name=authUser]').value = 1;
        document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<input type="hidden" name="uid" value="' + settings.user.uid + '">');
    }

    document.querySelector('#newReport input[name=lat]').value = lat;
    document.querySelector('#newReport input[name=lon]').value = lon;
    document.querySelector('#newReport input[id=gl]').value = data.geocode.near;
    document.querySelector('#newReport input[id=gs]').value = data.geocode.state ? stateLabels[data.geocode.state].v : 'Undetermined';
    document.querySelector('#newReport input[name=geolocation]').value = data.geocode.near;
    document.querySelector('#newReport input[name=state]').value = data.geocode.state + ' / ' + stateLabels[data.geocode.state].v;

    document.querySelector('#newReport input[name=size]').addEventListener('keyup', (e) => {
        document.querySelector('#newReport #alab').innerHTML = 'acre' + (e.target.value != 1 ? 's' : '');
    });
}

function init() {
    let wf = new Wildfires(),
        lay = new Layers(),
        ctr_lat = settings.map().lat,
        ctr_lon = settings.map().lon;

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        style: tiles[settings.map().tile],
        projection: 'mercator',
        hash: true,
        pitch: (settings.map().pitch ? settings.map().pitch : 0),
        bearing: (settings.map().bearing ? settings.map().bearing : 0),
        attributionControl: false,
        collectResourceTiming: true,
        zoom: settings.map().zoom,
        center: [ctr_lon, ctr_lat]
    }).on('zoomend', () => {
        /* control whether FS roads show on the map based on the zoom level */
        if (settings.includes('roads')) {
            if (!map.getLayer('roads')) {
                new Layers().roads();
            }

            map.setLayoutProperty('roads', 'visibility', map.getZoom() <= 11 ? 'none' : (map.getLayer('roads') ? 'visible' : 'visible'));
        }
    }).on('click', async (e) => {
        /*let p = false;

        map.queryRenderedFeatures(e.point).forEach((l) => {
            if (l.layer.id == 'perimeters_fill') {
                p = true;
            }
        });

        if (!p) {
            map.setFeatureState(
                { source: 'perimeters', id: selectedPerim },
                { click: false }
            );
        }*/

        /* open new incident report form */
        if (document.querySelector('li#report').getAttribute('data-active') == 1) {
            map.panTo([e.lngLat.lng, e.lngLat.lat]);
            createDataForm('Report an incident', newReport);

            map.getCanvas().style.cursor = 'auto';

            const data = await api(apiURL + 'geocode/incident', [['lat', e.lngLat.lat], ['lon', e.lngLat.lng]]);

            doReport(data, e.lngLat.lat, e.lngLat.lng);
        }
    }).on('style.load', () => {
        /* if user has settings saved, go to their saved location...not the mapbox hash location */
        if (window.location.hash) {
            const h = window.location.hash.replace('#', '').split('/');

            if (settings.map().lat == h[1] && settings.map().lon == h[2] && settings.map().zoom == h[0]) {
                map.easeTo({
                    center: [settings.map().lon, settings.map().lat],
                    zoom: settings.map().zoom,
                    duration: 1000
                });
            }
        }

        if (document.querySelector('.loading')) {
            document.querySelector('.loading').remove();
            document.querySelector('.filter-controls .search').style.display = 'inline-flex';
        }

        /* function to provide a popup soliciting donations, subscriptions, etc. */
        marketing();

        icons.forEach((icon) => {
            icon = (icon ? '-' : '') + icon;

            if (!map.hasImage('fire-icon' + icon)) {
                map.loadImage(domain + 'images/icons/fire/fire-icon' + icon + '.png', (error, image) => { if (error) throw error; map.addImage('fire-icon' + icon, image); });
            }
        });

        for (let i = 1; i < 4; i++) {
            map.loadImage(domain + 'images/icons/fire/modis' + i + '.png', (error, image) => { if (error) throw error; map.addImage('modis' + i, image); });
        }

        /* if user wants a state map, zoom to that state */
        if (state) {
            Object.keys(stateLabels).forEach((e) => {
                if (stateLabels[e].v == state) {
                    map.easeTo({
                        center: stateLabels[e].c,
                        zoom: 5.8,
                        duration: 1000
                    });
                }
            });
        }

        /* get timezones
        map.addSource('timezones', {
            type: 'vector',
            url: 'mapbox://examples.4ze9z6tv'
        }).addLayer({
            id: 'timezones',
            type: 'fill',
            source: 'timezones',
            'source-layer': 'tz_world-c5z4hv',
            paint: {
                'fill-color': '#fff',
                'fill-opacity': 0
            }
        });*/

        /* get us counties
        map.addSource('us_counties', {
            type: 'vector',
            url: 'mapbox://mapollc.clz3a8hkg0m371sqgb0i5okkw-1pm0q'
        }).addLayer({
            id: 'counties',
            type: 'line',
            source: 'us_counties',
            'source-layer': 'us_counties',
            paint: {
                'line-color': '#a43f04',
                'line-width': 1,
                'line-dasharray': [6, 4, 2, 6],
                'line-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    5,
                    0,
                    10,
                    0.7
                ]
            }
        });*/

        /* add 3D terrain to map */
        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
        }).setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1.5
        }).setFog(fog);

        /* processing layers on startup */
        lay.init();
        wf.getWildfires();
        wf.perimeters();

        const dont = ['newFires', 'allFires', 'smokeChecks', 'rxBurns', 'perimeters'];

        if (settings.settings.checkboxes) {
            settings.settings.checkboxes.forEach((c) => {
                if (!dont.includes(c)) {
                    toggleLayer({ id: c, checked: true });
                }
            });
        }
    }).on('movestart', () => {
        map.getCanvas().style.cursor = 'grabbing';
        startLat = map.getCenter().lat;
        startLon = map.getCenter().lng;
    }).on('moveend', () => {
        map.getCanvas().style.cursor = 'auto';

        if (settings.includes('perimeters')) {
            wf.perimeters(true);
        }

        if (settings.includes('modis24')) {
            new Layers().modis(1, true);
        }

        if (settings.includes('modis48')) {
            new Layers().modis(2, true);
        }

        if (settings.includes('modis72')) {
            new Layers().modis(3, true);
        }

        if (settings.includes('wwas')) {
            new NWS().get(true);
        }

        if (settings.includes('stns')) {
            new Weather().raws(true);
        }

        if (settings.includes('nri')) {
            new Layers().nri(true);
        }

        if (settings.includes('dispatch')) {
            new Layers().dispatch(true);
        }

        if (settings.includes('gaccBounds')) {
            new Layers().gaccBounds(true);
        }

        if (settings.includes('calfireUnits')) {
            new Layers().calfireUnits(true);
        }

        if (settings.includes('cdfFHSZ')) {
            new Layers().cdfFHSZ(true);
        }
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
    );

    map.getCanvas().style.cursor = 'auto';
}

function toggleLayer(e) {
    const layer = e.id,
        checked = e.checked;

    if (layer == 'newFires') {
        map.setLayoutProperty('new_fires_layer', 'visibility', (checked ? 'visible' : 'none'))
            .setLayoutProperty('new_fire_title', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'allFires') {
        map.setLayoutProperty('all_fires_layer', 'visibility', (checked ? 'visible' : 'none'))
            .setLayoutProperty('all_fire_title', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'smokeChecks') {
        map.setLayoutProperty('smk_fires_layer', 'visibility', (checked ? 'visible' : 'none'))
            .setLayoutProperty('smk_fire_title', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'rxBurns') {
        map.setLayoutProperty('rx_fires_layer', 'visibility', (checked ? 'visible' : 'none'))
            .setLayoutProperty('rx_fire_title', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'perimeters') {
        map.setLayoutProperty('perimeters_outline', 'visibility', (checked ? 'visible' : 'none'))
            .setLayoutProperty('perimeters_fill', 'visibility', (checked ? 'visible' : 'none'))
            .setLayoutProperty('perimeters_title', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'modis24') {
        if (map.getSource('modis24')) {
            map.setLayoutProperty('modis24', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().modis(1);
            }
        }
    } else if (layer == 'modis48') {
        if (map.getSource('modis48')) {
            map.setLayoutProperty('modis48', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().modis(2);
            }
        }
    } else if (layer == 'modis72') {
        if (map.getSource('modis72')) {
            map.setLayoutProperty('modis72', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().modis(3);
            }
        }
    } else if (layer == 'airq') {
        const i = setInterval(() => {
            if (map.getSource('airq')) {
                clearInterval(i);

                map.setLayoutProperty('airQuality', 'visibility', (checked ? 'visible' : 'none'))
                    .setLayoutProperty('airQuality_text', 'visibility', (checked ? 'visible' : 'none'));
            }
        }, 500);
    } else if (layer == 'lightning1') {
        map.setLayoutProperty('lightning1', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'lightning24') {
        map.setLayoutProperty('lightning24', 'visibility', (checked ? 'visible' : 'none'));
    } else if (layer == 'wwas') {
        if (map.getSource('wwas')) {
            map.setLayoutProperty('wwas_fill', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('wwas_outline', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new NWS().get();
            }
        }
    } else if (layer == 'spc') {
        if (map.getSource('outlook')) {
            map.setLayoutProperty('outlook_fill', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('outlook_outline', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('outlook_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new NWS().spc();
            }
        }
    } else if (layer == 'stns') {
        if (map.getSource('stns')) {
            map.setLayoutProperty('stns', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('stns_text', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Weather().raws();
            }
        }
    } else if (layer == 'radar') {
        if (checked) {
            new Layers().radarInit();
        } else {
            radarPlay = true;
            document.querySelector('.radar').remove();
            clearInterval(radarAnim);

            for (let i = 0; i < radarImgs.length; i++) {
                map.removeLayer('radar-layer-' + i)
                    .removeSource('radar-' + i);
            }
        }
    } else if (layer == 'ndfd') {
        if (map.getSource('ndfd')) {
            map.setLayoutProperty('ndfd', 'visibility', (checked ? 'visible' : 'none'));
            if (!checked) {
                document.querySelector('.ndfdLegend').remove();
            }
        } else {
            if (checked) {
                new NWS().ndfd();
            }
        }
    } else if (layer == 'visSatellite') {
        if (map.getSource('satellite1')) {
            map.setLayoutProperty('satellite1', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new NWS().satellite(1);
            }
        }
    } else if (layer == 'irSatellite') {
        if (map.getSource('satellite2')) {
            map.setLayoutProperty('satellite2', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new NWS().satellite(2);
            }
        }
    } else if (layer == 'wvSatellite') {
        if (map.getSource('satellite3')) {
            map.setLayoutProperty('satellite3', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new NWS().satellite(3);
            }
        }
    } else if (layer == 'nfdrs') {
        if (map.getSource('nfdrs')) {
            map.setLayoutProperty('nfdrs', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().nfdrs();
            }
        }
    } else if (layer == 'sfp') {
        if (map.getSource('sfp')) {
            map.setLayoutProperty('sfp', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().sfp();
            }
        }
    } else if (layer == 'nri') {
        if (map.getSource('nri')) {
            map.setLayoutProperty('nri_outline', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('nri_fill', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().nri();
            }
        }
    } else if (layer == 'rth') {
        if (map.getSource('rth')) {
            map.setLayoutProperty('rth', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().rth();
            }
        }
    } else if (layer == 'whp') {
        if (map.getSource('whp')) {
            map.setLayoutProperty('whp', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().whp();
            }
        }
    } else if (layer == 'drought') {
        if (map.getSource('drought')) {
            map.setLayoutProperty('drought', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().drought();
            }
        }
    } else if (layer == 'fuels') {
        if (map.getSource('fuels')) {
            map.setLayoutProperty('fuels', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('fuelsAK', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().fuels();
            }
        }
    } else if (layer == 'countyBounds') {
        if (map.getSource('countyBounds')) {
            map.setLayoutProperty('countyBounds', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().countyBounds();
            }
        }
    } else if (layer == 'nwsCWAs') {
        if (map.getSource('nwsCWAs')) {
            map.setLayoutProperty('nwsCWAs', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().nwsCWAs();
            }
        }
    } /*else if (layer == 'usfs') {
        if (map.getSource('usfs')) {
            map.setLayoutProperty('usfs', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().usfs();
            }
        }
    }*/ else if (layer == 'roads') {
        if (map.getSource('roads')) {
            map.setLayoutProperty('roads', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().roads();
            }
        }
    } else if (layer == 'lands') {
        if (map.getSource('lands')) {
            map.setLayoutProperty('lands', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().lands();
            }
        }
    } else if (layer == 'plss') {
        if (map.getSource('plss')) {
            map.setLayoutProperty('plss', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().plss();
            }
        }
    } else if (layer == 'dispatch') {
        if (map.getSource('dispatch')) {
            map.setLayoutProperty('dispatch_outline', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('dispatch_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().dispatch();
            }
        }
    } else if (layer == 'gaccBounds') {
        if (map.getSource('gaccBounds')) {
            map.setLayoutProperty('gaccBounds', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('gaccBounds_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().gaccBounds();
            }
        }
    } else if (layer == 'sfcSmoke') {
        if (map.getSource('sfcSmoke')) {
            map.setLayoutProperty('sfcSmoke', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().sfcSmoke();
            }
        }
    } else if (layer == 'viSmoke') {
        if (map.getSource('viSmoke')) {
            map.setLayoutProperty('viSmoke', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().viSmoke();
            }
        }
    } else if (layer == 'orEVAC') {
        if (map.getSource('orEVAC')) {
            map.setLayoutProperty('orEVAC', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('orEVAC_outline', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('orEVAC_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().oregonEvac();
            }
        }
    } else if (layer == 'calfireUnits') {
        if (map.getSource('calfireUnits')) {
            map.setLayoutProperty('calfireUnits', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('calfireUnits_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().calfireUnits();
            }
        }
    } else if (layer == 'cdfFHSZ') {
        if (map.getSource('cdfFHSZ')) {
            map.setLayoutProperty('cdfFHSZ', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('cdfFHSZ_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().cdfFHSZ();
            }
        }
    }
}

function marketing() {
    const m = localStorage.getItem('marketing'),
        time = new Date().getTime(),
        REPEAT_EVERY_DAY = 3;

    if (m == null || ((m - time) > (86400000 * REPEAT_EVERY_DAY))) {
        const content = '<p style="margin:1em 0">Please support Map of Fire and our efforts to keep this service going and providing critical wildfire information to everyone.</p>' +
            '<div class="btn-group centered"><input type="button" class="btn btn-red" value="Make a Donation" onclick="window.open(\'' + donateLink + '\');closeDataForm();">' +
            '<input type="button" class="btn btn-gray" value="No, thanks" onclick="closeDataForm()"></div>';

        const el = document.createElement('div');
        el.classList.add('shadow');
        document.body.appendChild(el);

        createDataForm('We need your help!', content, true);
        localStorage.setItem('marketing', time);
    }
}

window.addEventListener('click', async (e) => {
    const target = e.target,
        sr = document.querySelector('#search-results');

    if (target.parentElement.id == 'modal' && target.classList.contains('close')) {
        closeModal();
    }

    if (target.classList.contains('impactClose')) {
        closeImpact();
    }

    if (sr.style.display != 'none' && target.closest('li') != null && target.closest('li').parentElement.id == 'search-results') {
        const p = target.closest('li'),
            type = p.getAttribute('data-type');

        if (type == 'city') {
            const lat = p.getAttribute('data-lat'),
                lon = p.getAttribute('data-lon');

            /*new mapboxgl.Marker()
                .setLngLat([lon, lat])
                .addTo(map);*/

            new mapboxgl.Popup()
                .setHTML(
                    '<p style="text-align:center;margin:0">' + p.querySelector('h3').innerHTML.split('<span>')[0] + '</p>'
                )
                .setLngLat([lon, lat])
                .addTo(map);

            map.easeTo({
                center: new mapboxgl.LngLat(lon, lat),
                zoom: 10
            });
        } else {
            const r = new Wildfires().findFire(parseInt(p.getAttribute('data-wfid')));

            map.easeTo({
                center: r.geometry.coordinates,
                zoom: 10
            });
        }

        sr.style.display = 'none';
    }

    /* hide search results if outside search result container */
    if (!target.contains(document.querySelector('#search-results')) && !target.parentElement.contains(document.querySelector('#search-results')) && !target.contains(document.querySelector('#q'))) {
        document.querySelector('#search-results').style.display = 'none';
        document.querySelector('#q').value = '';

        document.querySelectorAll('#search-results li:not(.standby)').forEach((li) => {
            li.remove();
        });
    }

    /* hide impact panel if outside of container */
    if (!impact.contains(e.target) && e.target !== impact) {
        closeImpact();
    }

    /*
     * navigation menu controls
     */

    /* shrink or expand navbar */
    if (target.id == 'close-navbar') {
        if (target.getAttribute('data-open') == '1') {
            target.setAttribute('data-open', '0');
            target.classList.remove('fa-chevron-left');
            target.classList.add('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '40px');
            document.querySelector('nav').classList.add('hide');
        } else {
            target.setAttribute('data-open', '1');
            target.classList.add('fa-chevron-left');
            target.classList.remove('fa-chevron-right');

            document.documentElement.style.setProperty('--nav-width', '100px');
            document.querySelector('nav').classList.remove('hide');
        }
    }

    /* open dropdown nav menu */
    if (target.id == 'menuIcon' || target.id == 'dd-close') {
        document.querySelector('nav').classList.toggle('open');
    }

    if (document.querySelector('body nav .nav-wrapper ul').contains(target)) {
        if (target.closest('li')) {
            document.querySelector('nav').classList.toggle('open');
        }

        /* user account & settings */
        if (target.closest('li').id == 'account') {
            if (settings.user == null) {
                window.location.href = domain + 'secure/login?service=mapofire&next=' + encodeURIComponent(window.location.href);
            } else {
                let ms = '';
                const userProfile = '<div id="sync"><i class="fa-regular fa-arrow-down-to-line" aria-hidden="true"></i><span>Account last synced ' + timeAgo(settings.user.settings.synced) + '</span></div>';

                impact.innerHTML = impactHeader + '<div class="content">' + userProfile + '<h2>Map Settings</h2>' + userSettingsForm + '</div>';
                impact.style.display = 'flex';
                impact.querySelector('#a').innerHTML = 'Hello, ' + settings.getFirstName();

                document.querySelector('select#saveFreq').value = settings.get('saveFreq');
                document.querySelector('select#perimColor').value = settings.perimeters().color() ? settings.perimeters().color() : 'default';
                document.querySelector('select#perimTtip').value = settings.perimeters().ttip() ? settings.perimeters().ttip() : 1;
                document.querySelector('select#perimZoom').value = settings.perimeters().zoom() ? settings.perimeters().zoom() : 1;
                document.querySelector('select#coordsDisplay').value = settings.get('coordsDisplay') ? settings.get('coordsDisplay') : 'dec';
                document.querySelector('select#tempUnit').value = settings.weather().temp();
                document.querySelector('select#windSpeedUnit').value = settings.weather().wind();
                document.querySelector('select#acresUnit').value = settings.get('acres') ? settings.get('acres') : 'acres';
                document.querySelector('select#locallySave').value = settings.get('locallySave') ? settings.get('locallySave') : 'y';
                document.querySelector('select#fireDisplay').value = settings.get('fireDisplay') ? settings.get('fireDisplay') : 'map';

                if (!settings.subscriptions().valid()) {
                    ms = ''/*'<p style="color:#555;font-size:14px">You don\'t have a subscription to Map of Fire Premium. <a href="' + domain + 'checkout?price_id=' + sub_id + '&next=' + encodeURIComponent(window.location.href) + '">Try it now!</a>'*/;
                } else {
                    ms = '<div style="display:inline-flex;width:100%;justify-content:space-between;gap:1em"><div style="display:inline-flex;flex-direction:column;gap:0.45em">' +
                        '<span>Map of Fire Premium</span><small style="color:#999">Expires ' + settings.subscriptions().expires() + '</small></div>' +
                        '<a href="' + domain + 'account/billing/portal?sid=' + settings.subscriptions().subID() + '&cid=' + settings.subscriptions().customerID() + '&next=' + encodeURIComponent(window.location.href) + '">Manage</a></div>';
                }

                document.querySelector('#subs').innerHTML = ms;
            }
        }

        /* basemaps */
        if (target.closest('li').id == 'basemap') {
            let l = '';

            tileNames.forEach((n, c) => {
                const hasPerms = tilePerms[c] == 0 || (tilePerms[c] == 1 && settings.hasPermissions('PREMIUM')) ? true : false;

                l += '<li><div class="radio">' + (hasPerms ? '<input type="radio" class="basemap-option" name="bsmo" data-tile="' + n + '"' + (n == settings.getBasemap() ? ' checked' : '') + '>' : premFeature) +
                    '</div><div class="desc"><label>' + (n == 'caltopo' ? 'CalTopo' : (n == 'fs16' ? 'USFS 2016' : (n == 'osm' ? 'Open Street Map' : (n == 'outdoors' ? 'MAPO Outdoors' : ucwords(n))))) + '</label></div></li>';
            });

            impact.innerHTML = impactHeader + '<div class="content"><ul class="layers-list">' + l + '</ul></div>';
            impact.style.display = 'flex';
            impact.querySelector('#a').innerHTML = 'Basemaps';
        }

        /* layers menu */
        if (target.closest('li').id == 'layers') {
            let laylist = '';

            /* loop through layer categories */
            Object.entries(layers.categories).forEach((g) => {
                let lay = '';

                layers.layers[g[0]].forEach((l, i) => {
                    const hasPerms = l.perms == 0 || (l.perms == 1 && settings.hasPermissions('PREMIUM')) ? true : false;

                    lay += '<li class="layer" data-p="' + l.perms + '" data-id="' + l.id + '" title="' + l.name + '"><div class="checkbox">' +
                        (hasPerms ? '<input type="checkbox" class="layChkBx" data-type="' + l.type + '" id="' + l.id + '"' + (l.default && !settings.get('checkboxes') || settings.get('checkboxes') && settings.includes(l.id) ? ' checked' : '') + '>' : premFeature) + '</div>' +
                        '<div class="desc"><label for="' + l.id + '">' + l.name + '</label><span>' + l.desc/*layerDesc[g[0]][i]*/ + '</span>';

                    if (l.id == 'perimeters') {
                        lay += '<div id="perimeterSize"><i class="fad fa-filters" style="color:#b9b9b9"></i><input type="range" class="slider" min="0" max="1000" step="25" value="' + settings.get('perimeters').minSize + '">' +
                            '<div id="pSize" style="width:69.11px">' + settings.get('perimeters').minSize + ' acres</div></div>';
                    }

                    if (hasPerms) {
                        if (l.id == 'ndfd') {
                            lay += '<div id="models"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select id="forecastModel" style="min-width:170px;max-width:45%"><option ' + (settings.get('special') && settings.get('special').forecastModel == 'apparent_temperature' || !settings.get('special') ? 'selected ' : '') + 'value="apparent_temperature">Temperature</option>' +
                                '<option ' + (settings.get('special') && settings.get('special').forecastModel == 'relative_humidity' ? 'selected ' : '') + 'value="relative_humidity">Humidity</option><option ' + (settings.get('special') && settings.get('special').forecastModel == 'wind_speed' ? 'selected ' : '') + 'value="wind_speed">Wind Speed</option>' +
                                '<option ' + (settings.get('special') && settings.get('special').forecastModel == 'total_sky_cover' ? 'selected ' : '') + 'value="total_sky_cover">Cloud Cover</option><option ' + (settings.get('special') && settings.get('special').forecastModel == '12hr_precipitation_probability' ? 'selected ' : '') + 'value="12hr_precipitation_probability">12-hr POPs</option></select>' +
                                '<select id="fcstTime" data-type="reg" style="min-width:100px;max-width:35%">' + initNDFDTimes() + '</select></div>';
                        } else if (l.id == 'sfp') {
                            lay += '<div id="sfpDate"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select id="sfpDateSelect" style="max-width:87%">' + sfpTimes() + '</select></div>';
                        } else if (l.id == 'spc') {
                            lay += '<div id="otlks"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select id="otlkType" style="min-width:170px;max-width:55%"><option ' + (settings.get('special') && settings.get('special').otlkType == 'fire' ? 'selected ' : '') + 'value="fire">Fire Weather</option>' +
                                '<option ' + (settings.get('special') && settings.get('special').otlkType == 'severe' ? 'selected ' : '') + 'value="severe">Severe/Convective</option></select>' +
                                '<select id="otlkDay" style="min-width:100px;max-width:30%"><option ' + (settings.get('special') && settings.get('special').otlkDay == 1 ? 'selected ' : '') + 'value="1">Day 1</option>' +
                                '<option ' + (settings.get('special') && settings.get('special').otlkDay == 2 ? 'selected ' : '') + 'value="2">Day 2</option>' +
                                '<option ' + (settings.get('special') && settings.get('special').otlkDay == 3 ? 'selected ' : '') + 'value="3">Day 3</option></select></div>';
                        }
                    }

                    lay += '</div></li>';
                });

                laylist += '<div class="group"><h3 class="group-title">' + g[1] + '</h3><ul class="layers-list">' + lay + '</ul></div>';
            });

            impact.innerHTML = impactHeader + '<div class="content">' + laylist + '</div>';

            const scrlt = localStorage.getItem('impactScroll');
            impact.style.display = 'flex';
            impact.querySelector('#a').innerHTML = 'Layers';

            if (scrlt != null && scrlt != 0) {
                impact.scrollTop = scrlt;
            }
        }

        /* create & display archive picker */
        if (target.closest('li').id == 'archive') {
            let yrs = '';

            for (let i = curTime.getFullYear(); i >= 2015; i--) {
                yrs += '<option ' + (i == curTime.getFullYear() ? 'disabled ' : '') + 'value="' + i + '">' + i + '</option>';
            }

            createDataForm('Historical Fires', '<p>See historical wildfires by selecting a year in our archive.</p>' +
                '<select id="archive_years" style="margin-top:1em"><option>- Choose a year -</option>' + yrs + '</select>' +
                '<div class="btn-group centered"><input type="button" class="btn btn-gray" value="Cancel" onclick="this.parentElement.parentElement.parentElement.remove()"></div>');
        }

        /* create legend */
        if (target.closest('li').id == 'legend') {
            /* create dynamic legend from json array */
            let legCont = '';

            legend.categories.forEach(function (c) {
                let k = Object.keys(c)[0];
                legCont += '<div class="group"><h3 class="group-title">' + c[k] + '</h3>';

                legend.items[k].forEach(function (l) {
                    legCont += '<div class="row"><div class="ic">' + (l[0] == 'icon' ? l[1] : '<div class="color" style="background-color:' + l[2] + '">' + (l[1] ? l[1] : '') + '</div>') +
                        '</div><div class="desc">' + l[3] + '</div></div>';
                });

                legCont += '</div>';
            });

            impact.innerHTML = impactHeader + '<div class="content"><div class="legend">' + legCont + '</div></div>';
            impact.style.display = 'flex';
            impact.querySelector('#a').innerHTML = 'Legend';
        }

        /* show user any fires they're following */
        if (target.closest('li').id == 'myfires') {
            impact.innerHTML = impactHeader + '<div class="content"><div id="spinner" class="centered"></div></div>';
            impact.style.display = 'flex';
            impact.querySelector('#a').innerHTML = 'My Fires';

            const r = setInterval(() => {
                if (trackedDone) {
                    clearInterval(r);

                    let content = '<p class="message error">You are not currently following any wildfire incidents. Click on a fire to start following an incident.</p>';

                    /* if user is following any incidents */
                    if (tracked.length > 0) {
                        content = '';
                        const wf = new Wildfires();

                        tracked.forEach((id) => {
                            const fire = wf.findFire(id);

                            if (fire != null) {
                                const p = fire.properties,
                                    name = wf.fireName(p.name, p.type, p.incidentId),
                                    acres = (p.acres == 'Unknown' ? 'Unknown' : numberFormat(p.acres)),
                                    size = (acres != 'Unknown' ? conversion.sizing(2, acres.replaceAll(',', '')) : acres) + (acres != 'Unknown' ? ' <small style="font-size:14px">' + (acres == 1 ? conversion.sizing(1).slice(0, -1) : conversion.sizing(1)).toLowerCase() : '') + '</small>',
                                    fstat = p.status,
                                    st1 = (p.time.year < curTime.getFullYear() ? 'out' : wf.getStatus(fstat, p.notes)),
                                    st = (st1 ? st1 : 'active'),
                                    /*state = stateLabels[p.state].v,*/
                                    state = p.near,
                                    up = timeAgo(p.time.updated);

                                //content += '<li><h3>' + name + state + timeAgo(p.time.updated) + '<span class="status ' + st + '">' + st + '</span>' + size + '</li>';
                                content += '<li id="my-fire-incident" data-coords="' + JSON.stringify(fire.geometry.coordinates) + '"><div class="header"><h3 style="line-height:1.2;color:#537376">' + name + '</h3>' +
                                    '<i class="fas fa-star my-fire-unfollow" data-name="' + name + '" data-wfid="' + p.wfid + '" style="color:var(--yellow);cursor:pointer"></i></div><span class="state">' + state + '</span>' +
                                    '<div class="inf"><p style="color:var(--dark-gray);font-size:18px">' + size + '</p><span class="status ' + st + '">' + st.toUpperCase() + '</span></div>' +
                                    '<p class="updated" style="margin-top:1em;text-align:left">Last update ' + up + '</p></li>';
                            }
                        });

                        content = '<ul class="my-fires">' + content + '</ul>';
                    }

                    impact.querySelector('.content').innerHTML = content;
                }
            }, 500);
        }

        /* sync map settings */
        if (target.closest('li').id == 'save') {
            saveSession(false, true);
        }

        /* manually reload the page */
        if (target.closest('li').id == 'refresh') {
            location.reload();
        }

        /* open new incident report form */
        if (target.closest('li').id == 'report') {
            document.querySelector('li#report').setAttribute('data-active', '1');
            map.getCanvas().style.cursor = 'crosshair';
            notify('info', 'Click anywhere on the map to report a <b>NEW</b> fire incident.');
        }
    }

    /* if user clicks a share button on the app */
    if (target.id == 'sharer') {
        if (navigator.share) {
            navigator.share({
                title: (target.getAttribute('title') ? target.getAttribute('title') : document.title),
                text: "",
                url: (target.getAttribute('data-href') ? target.getAttribute('data-href').split('#')[0] : window.location.href.split('#')[0])
            }).then(() => {
            }).catch((e) => {
                console.error(e);
            });
        }
    }

    /* pause of play radar */
    if (target.classList.contains('radarControl')) {
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

    /* add fire to tracked list (or remove) */
    if (target.id == 'trackFire') {
        let id = parseInt(target.getAttribute('data-id')),
            f = new Wildfires().findFire(id),
            name = f.properties.name + (f.properties.type != 'Smoke Check' ? ' Fire' : ''),
            m;

        if (f != null) {
            /* remove, otherwise add */
            if (target.getAttribute('data-following') == '1' && tracked.includes(id)) {
                m = 'remove';
                tracked.splice(tracked.indexOf(id), 1);
            } else {
                m = 'add';
                tracked.push(id);
            }

            const tf = document.querySelector('#trackFire');

            if (m == 'add') {
                tf.setAttribute('data-following', '1');
                tf.setAttribute('title', 'You\'re following this fire');
                tf.classList.add('follow', 'fas');
                tf.classList.remove('far');
            } else {
                tf.removeAttribute('data-following');
                tf.setAttribute('title', 'Follow this fire');
                tf.classList.remove('fas', 'follow');
                tf.classList.add('far');
            }

            if (settings.user) {
                await api(host + 'api/v1/trackFires/' + m, [['wfid', id]]);
            } else {
                localStorage.setItem('tracked', JSON.stringify(tracked));
            }

            notify('success', (m == 'add' ? 'You\'re now following the ' : 'You\'re no longer following the ') + name + '.');
        }
    }

    /* open modal to display a WWA */
    if (target.classList.contains('readWWA')) {
        const id = target.getAttribute('data-id');

        new NWS().readWWA(id);
    }

    /* cancel a new report */
    if (target.id == 'cancelNewRpt') {
        document.querySelector('li#report').setAttribute('data-active', 0);
        document.querySelector('#data-form').remove();
    }

    /* click on tile from my fires to go to the incident they click on */
    if (target.closest('li') && target.closest('li').id == 'my-fire-incident' && !target.classList.contains('my-fire-unfollow')) {
        const c = JSON.parse(target.getAttribute('data-coords'));

        map.flyTo({
            center: c,
            zoom: 11.5
        });
    }

    /* stop following a fire from the "my fires" panel */
    if (target.classList.contains('my-fire-unfollow')) {
        const id = target.getAttribute('data-wfid'),
            name = target.getAttribute('data-name');

        target.parentElement.parentElement.remove();

        if (settings.user) {
            await api(host + 'api/v1/trackFires/remove', [['wfid', id]]);
        } else {
            const t = JSON.parse(localStorage.getItem('tracked')),
                n = t.splice(t.indexOf(id), 1);

            localStorage.setItem('tracked', JSON.stringify(n));
        }

        tracked.splice(tracked.indexOf(id), 1);
        notify('success', 'You\'re no longer following the ' + name + '.');
    }
});

window.addEventListener('submit', async (e) => {
    /* submit user NEW INCIDENT form */
    if (e.target.id == 'newReport') {
        e.preventDefault();

        let error = false,
            errorMsg = '';

        if (document.querySelector('#nrerrors')) {
            document.querySelector('#nrerrors').remove();
        }

        /* error checking */
        if (document.querySelector('#newReport select[name=type]').options[document.querySelector('#newReport select[name=type]').selectedIndex].value == '- Choose -') {
            error = true;
            errorMsg += '<li>Please choose an incident type</li>';
        }

        if (document.querySelector('#newReport input[name=size]').value == '') {
            error = true;
            errorMsg += '<li>Please estimate the size of the fire (even if it\'s 0)</li>';
        } else if (!document.querySelector('#newReport input[name=size]').value.match(/([0-9.]+)/)) {
            error = true;
            errorMsg += '<li>Your incident size cannot contain non-numeric characters</li>'
        }

        if (document.querySelector('#newReport textarea[name=notes]').value == '') {
            error = true;
            errorMsg += '<li>Please provide some details about this incident</li>';
        }

        if (error === true) {
            document.querySelector('#newReport').insertAdjacentHTML('afterbegin', '<ul id="nrerrors" style="margin: 0 0 1em 1em;font-size:14px;color:var(--red)">' + errorMsg + '</ul>');
        } else {
            if (confirm('Are you sure this is a new incident? If so, click "OK." Otherwise, please click "Cancel."')) {
                const sub = document.querySelector('#newReport input[type=submit]'),
                    canc = document.querySelector('#newReport .btn-group a'),
                    fd = [],
                    ent = new URLSearchParams(new FormData(document.querySelector('form#newReport')).entries());

                document.querySelector('li#report').setAttribute('data-active', '0');
                sub.disabled = true;
                sub.value = 'Submitting...';
                canc.style.display = 'none';

                for (const [key, value] of ent) {
                    fd.push([key, value]);
                }

                const send = await api(apiURL + 'newReport', fd);

                if (send.success == 1) {
                    setTimeout(() => {
                        document.querySelector('#data-form').remove();
                        notify('success', 'Your report was sent to us for review before it may be added to the map.');
                    }, 500);
                } else {
                    sub.disabled = false;
                    sub.value = 'Submit Report';
                    canc.style.display = 'block';

                    notify('error', 'There was an error submitting your report. Please try again.');
                }
            }
        }
    }
});

function debounce(callback, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callback.apply(this, args);
        }, wait);
    };
}

window.addEventListener('keydown', (e) => {
    if (e.code == 'Escape') {
        const p = document.querySelector('.mapboxgl-popup');

        if (p) {
            p.remove();
        }
    }

    if (e.target.id == 'q') {
        if (!e.ctrlKey && !e.altKey && e.key != 'Enter' && e.key != 'Shift') {
            const results = document.querySelector('#search-results');

            if (results.style.display == '' || results.style.display == 'none') {
                results.style.display = 'flex';
            }

            results.querySelector('.standby').innerHTML = '<i class="fa-duotone fa-spinner-third"></i><span>Searching...</span>';

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

window.addEventListener('keyup', debounce((e) => {
    if (e.target.id == 'q') {
        let wf = new Wildfires(),
            userSearch = async (q) => {
                let query = q.toLowerCase().replace('fire', ''),
                    count = 0,
                    results = document.querySelector('#search-results');

                if (query.length > 0) {
                    activeIncidents.forEach((f) => {
                        let use = false,
                            p = f.properties,
                            name = wf.fireName(p.name, p.type, p.incidentId),
                            /*acres = (p.acres == 'Unknown' ? 'Unknown' : numberFormat(p.acres)),
                            acresDisp = (acres != 'Unknown' ? conversion.sizing(2, acres.replaceAll(',', '')) : acres) + ' ' + (acres != 'Unknown' ? (acres == 1 ? conversion.sizing(1).slice(0, -1) : conversion.sizing(1)).toLowerCase() : ''),*/
                            acresDisp = conversion.acres(p.acres),
                            fstat = p.status,
                            status = (p.time.year < curTime.getFullYear() ? 'out' : wf.getStatus(fstat, p.notes)),
                            j = name.toLowerCase().split(' ');

                        for (let i = 0; i < j.length; i++) {
                            if (j[i].search(query) >= 0) {
                                use = true;
                            }
                        }

                        if (name.toLowerCase().search(query) >= 0) {
                            use = true;
                        }

                        if (use) {
                            const li = document.createElement('li');
                            li.setAttribute('data-type', 'incident');
                            li.setAttribute('data-wfid', p.wfid);
                            li.innerHTML = '<span class="icon fire fas fa-fire"></span><h3>' + name + '<span>' + p.type + ' in ' + stateLabels[p.state].v + ' &middot; <b>' + acresDisp + '</b></span></h3>';
                            results.appendChild(li);
                            count++;
                        }
                    });

                    if (query.length >= 3) {
                        const search = await api(apiURL + 'search', [['q', query], ['citiesonly', 1]]);

                        if (search.rs != null && search.rs.length > 0) {
                            search.rs.forEach((p) => {
                                const st = (/,\s([A-Z][A-Z])\s/gm).exec(p.name)[1];

                                //if (theseStates.includes(st)) {
                                const li = document.createElement('li');

                                li.setAttribute('data-lat', p.lat);
                                li.setAttribute('data-lon', p.lon);
                                li.setAttribute('data-type', 'city');
                                li.innerHTML = '<span class="icon fas fa-location-dot"></span><h3>' + p.name /*p.name.split(',')[0] + ', ' + stateLabels[st].v*/ + '<span>' + p.county + ' County</span></h3>';
                                results.appendChild(li);
                                count++;
                                //}
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
}, 1050));

window.addEventListener('input', (e) => {
    /* perimeter min size change text */
    if (e.target.parentElement.id == 'perimeterSize' && e.target.classList.contains('slider')) {
        /*settings.updatePSize(e.target.value);*/
        document.querySelector('#pSize').innerHTML = e.target.value + ' acres';
    }
});

window.addEventListener('change', (e) => {
    const target = e.target;

    /* change basemap */
    if (target.classList.contains('basemap-option')) {
        const tile = target.getAttribute('data-tile');

        map.setStyle(tiles[tile], {
            diff: false
        }).on('style.load', () => {
            const wf = new Wildfires();
            wf.displayFires('all', 0);
            wf.displayFires('new', 1);
            wf.displayFires('smk', 2);
            wf.displayFires('rx', 3);
        });

        settings.settings.tile = tile;
    }

    /* perimeter min size change */
    if (target.parentElement.id == 'perimeterSize' && target.classList.contains('slider')) {
        const v = target.value;

        settings.updatePSize(v);

        document.querySelector('#pSize').innerHTML = v + ' acres';

        map.removeLayer('perimeters_outline')
            .removeLayer('perimeters_fill')
            .removeLayer('perimeters_title')
            .removeSource('perimeters');

        new Wildfires().perimeters();
    }

    /* layer on/off */
    if (target.classList.contains('layChkBx')) {
        const layers = [];

        document.querySelectorAll('.layChkBx').forEach((e) => {
            if (e.checked) {
                layers.push(e.id);
            }
        });

        /* update settings to reflect anytime a checkbox is selected or not */
        settings.updateLayers(layers);

        /* toggle the layer on or off*/
        toggleLayer(target);
    }

    /* change outlook type and day from SPC */
    if (document.querySelector('#spc') && document.querySelector('#spc').checked && (target.id == 'otlkType' || target.id == 'otlkDay')) {
        settings.updateSpecial();
        new NWS().spc(true);
    }

    /* change forecast models and forecast hour */
    if (document.querySelector('#ndfd') && document.querySelector('#ndfd').checked && (target.id == 'forecastModel' || target.id == 'fcstTime')) {
        settings.updateSpecial();
        new NWS().ndfd(true);
    }

    /* change SFP date/time */
    if (document.querySelector('#sfp') && document.querySelector('#sfp').checked && (target.id == 'sfpDateSelect')) {
        settings.updateSpecial();
        new Layers().sfp(true);
    }

    /* save personalized map settings from account modal */
    if (document.querySelector('#impact #settings')) {
        document.querySelectorAll('#impact #settings select').forEach((s) => {
            settings.updatePersonal(s);
        });

        saveSession(true);
    }

    /* go to archived wildfire map based on user selection in modal */
    if (target.id == 'archive_years') {
        const ay = document.querySelector('#archive_years'),
            s = ay.options[ay.selectedIndex].value;

        if (s != '- Choose a year -') {
            window.location.href = host + 'archive/' + s + (window.location.search ? window.location.search : '') + (window.location.hash ? window.location.hash : '');
        }
    }
});

window.addEventListener('keydown', (e) => {
    /* close things on esc */
    if (e.key == 'Escape') {

    }
});

window.addEventListener('focus', (e) => {
    if (e.target.id == 'q') {
        const results = document.querySelector('#search-results');

        if (results.style.display == '' || results.style.display == 'none') {
            results.style.display = 'flex';
        }
    }
});

window.onload = async () => {
    conversion = new Convert();

    /* save settings automatically after the first 10 seconds, then every 5 minutes, whether to the session or user account */
    setTimeout(function () {
        saveSession(true, false);

        setInterval(() => {
            saveSession(true, false);
        }, settings.get('saveFreq'));
    }, 300000);

    setInterval(() => {
        window.location.href = window.location.href;
    }, 1000 * 60 * 5);

    /* get top clicked fires */
    const top = await api(apiURL + 'events');
    topFires = top.top;
};

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        let usr = null,
            set,
            wild = new Wildfires(),
            token = (/token=(.*?)(?=;|$)/gm).exec(document.cookie);

        const dc = await api(apiURL + 'dispatch/all');
        dispatchCenters = dc.dispatch;

        if (token != null) {
            const get = await api(apiURL + 'user/get/mapofire', [['token', token[1]]]);
            usr = get.user;

            /* change menu button */
            if (usr != null) {
                const a = document.querySelector('#account');
                a.querySelector('span').innerHTML = 'Account';
                a.setAttribute('data-tooltip', '{"text":"Account Settings","dir":"right"}');
            }
        }/* else {
            usr = null;
        }*/

        document.querySelector('nav ul').style.display = 'flex';

        if (window.innerWidth > 600) {
            document.querySelector('#close-navbar').classList.add('show');
        }

        /* create settings class based on user profile and settings */
        settings = new Settings(usr);

        /* get user's currently tracked wildfires */
        wild.getTrackedFires();

        /* initialize map */
        init();

        /* if URL is supposed to open an incident */
        if (window.location.pathname.search('/fires') >= 0) {
            let id = window.location.pathname.split('/')[2];
            wild.incident(id);
        }

        /* if URL is supposed to open a weather alert */
        if (window.location.pathname.search('/weather/alert') >= 0) {
            const id = window.location.pathname.split('/')[3];
            new NWS().readWWA(id);
        }

        if (window.location.search && window.location.search.search('loggedOut') >= 0) {
            window.history.pushState({
                "pageTitle": document.title
            }, '', window.location.href.replace(window.location.search, ''));
        }
    } else {
        const q = document.querySelector('#q'),
            sr = document.querySelector('#search-results');

        impact.addEventListener('scroll', () => {
            localStorage.setItem('impactScroll', impact.scrollTop);
        });

        q.addEventListener('focus', () => {
            if (topFires.length > 0) {
                sr.style.display = 'flex';
                sr.querySelector('li.standby').innerHTML = '<h6 style="color:var(--blue);font-size:18px">Trending incidents...</h6>';

                const stop = topFires.length > 5 ? 5 : topFires.length;

                for (let i = 0; i < stop; i++) {
                    const p = topFires[i].data,
                        /*acres = (p.acres == 'Unknown' ? 'Unknown' : numberFormat(p.acres)),
                        acresDisp = (acres != 'Unknown' ? conversion.sizing(2, acres.replaceAll(',', '')) : acres) + ' ' + (acres != 'Unknown' ? (acres == 1 ? conversion.sizing(1).slice(0, -1) : conversion.sizing(1)).toLowerCase() : ''),*/
                        acresDisp = conversion.acres(p.acres),
                        li = document.createElement('li');

                    li.setAttribute('data-type', 'incident');
                    li.setAttribute('data-wfid', p.wfid);
                    li.innerHTML = '<span class="icon fire fas fa-fire"></span><h3>' + new Wildfires().fireName(p.name, p.type, null) + '<span>' + p.type + ' in ' + stateLabels[p.state].v + ' &middot; <b>' + acresDisp + '</b></span></h3>';
                    sr.appendChild(li);
                }
            }
        });

        /* send fire click data to server for processing every 20 secs */
        setInterval(() => {
            new Wildfires().commitLog();
        }, 20000);
    }
};