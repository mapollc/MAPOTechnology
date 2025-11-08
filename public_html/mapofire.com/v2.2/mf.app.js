let map,
    host = 'https://www.mapofire.com/',
    domain = 'https://www.mapotechnology.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    platform = window.location.host.search('wildfiremap.org') >= 0 ? 'wildfiremap' : (window.location.host.search('fireweatheravalanche.org') >= 0 ? 'fireweatheravalanche' : 'mapofire'),
    apiKey = platform == 'fireweatheravalanche' ? '191eab18c50c8f5653bdeba13f219bed' : (platform == 'wildfiremap' ? '85f58fa255efe0f779e0dfcd62d87e6d' : '50e2c43f8f63ff0ed20127ee2487f15e'),
    urlSpecific = /*platform == 'wildfiremap' ? host2 : host*/window.location.origin + '/',
    productName = 'Map of Fire',
    company = 'MAPO LLC',
    sub_id = 'price_1MgxhSIpCdpJm6cTaKp2dqf5',
    donateLink = 'https://mapofire.com/donate',
    mapboxToken = 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw',
    defaultAttr = '&copy; <a href="https://www.mapbox.com/about/maps/">MapBox</a> ',
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    curTime = new Date(),
    conversion,
    settings,
    darkMode = document.body.classList.contains('dark-mode'),
    trending = false,
    searchTrend = '',
    CLUSTER_FIRES = true,
    highchartsLoad = false,
    chart,
    hrrrSmokeTime = {
        'init': gmtime(-3600),
        'fcst': gmtime(+3600)
    },
    dispatchCenters,
    selected = {
        perim: null,
        evac: null,
        nri: null,
        erc: null
    },
    marker,
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
    activeEvacuations = null,
    evacsLoaded = false,
    premFeature = '<i class="fas fa-lock" style="color:#656565" title="Subscribe to Map of Fire Premium to gain access to this feature"></i>',
    tileNames = ['outdoors', 'satellite', /*'caltopo',*/ 'fs16', 'dark',/* 'delorme',*/ 'osm', 'terrain'],
    tilePerms = [0, 0, /*1,*/ 1, 1, 0, 0],
    icons = ['', 'out', 'big', 'controlled', 'contained', 'large', 'complex', 'new', 'new-big', 'rx', 'smoke'],
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
                attribution: defaultAttr + '&copy; <a href="https://www.arcgis.com">ArcGIS/ESRI</a>'
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
        'outdoors': 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9?optimize=true',
        'satellite': 'mapbox://styles/mapollc/clvh22ic505rn01pkdic7evid?optimize=true',
        'osm': osm,
        'fs16': fs16,
        'caltopo': caltopo,
        'terrain': terrain,
        'dark': 'mapbox://styles/mapbox/dark-v11'/*,
        'terrain': 'mapbox://styles/mapbox/streets-v12'*/
    },
    modal = document.querySelector('#modal'),
    impact = document.querySelector('#impact'),
    disclaimer = 'This information is based on an automated collection of data from various state and federal interagency dispatch centers and other governmental sources. Always refer to your local sources for the latest updates on evacuations or other critical information.',
    impactHeader = `<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" onclick="closeImpact()" title="Close window">
        <i class="far fa-xmark" onclick="closeImpact()"></i></div></header>`,
    userSettingsForm = `<div id="settings">
   <div class="r">
      <div class="var">Save Frequency</div>
      <div class="input">
         <select id="saveFreq">
            <option value="60000">1 min</option>
            <option value="300000">5 mins</option>
            <option value="600000">10 mins</option>
            <option value="900000">15 mins</option>
            <option value="1800000">30 mins</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Perimeter Color</div>
      <div class="input">
         <select id="perimColor">
            <option value="default">Default</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="orange">Orange</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="brown">Brown</option>
            <option value="black">Black</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Perimeter Tooltip</div>
      <div class="input">
         <select id="perimTtip">
            <option value="1">Yes</option>
            <option value="0">No</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Perimeter Zoom</div>
      <div class="input">
         <select id="perimZoom">
            <option value="1">Yes</option>
            <option value="0">No</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Coordinates</div>
      <div class="input">
         <select id="coordsDisplay">
            <option value="dec">Decimal</option>
            <option value="dms">Degs, Mins, Secs</option>
            <option value="utm">UTM</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Temperature Unit</div>
      <div class="input">
         <select id="tempUnit">
            <option value="f">&deg;F</option>
            <option value="c">&deg;C</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Wind Speed Unit</div>
      <div class="input">
         <select id="windSpeedUnit">
            <option value="mph">mph</option>
            <option value="m/s">m/s</option>
            <option value="kts">kts</option>
            <option value="km/h">km/h</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Fire Size Unit</div>
      <div class="input">
         <select id="acresUnit">
            <option value="acres">acres</option>
            <option value="hectares">hectares</option>
            <option value="sqmi">sq. mi.</option>
            <option value="sqkm">sq. km.</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Cache Fire Data</div>
      <div class="input">
         <select id="locallySave">
            <option value="y">Yes</option>
            <option value="n">No</option>
         </select>
      </div>
   </div>
   <div class="r">
      <div class="var">Fire Display</div>
      <div class="input">
         <select id="fireDisplay">
            <option value="page">Open incident page</option>
            <option value="map">On the map</option>
         </select>
      </div>
   </div>
   <div class="btn-group centered"><a target="blank" class="btn btn-green" href="${domain}account/home?ref=mapofire">Manage account</a></div>
   <div class="my-subs">
      <!--<h2>Subscriptions</h2>-->
      <div id="subs"></div>
   </div>
   <div style="margin-top:5em;font-size:12px;text-align:center;color:var(--blue-gray);line-height:1.3">&copy; ${new Date().getFullYear()} ${company}<br>Version ${version}
   </div>
</div>`,
    newReport = `<form id="newReport" method="post">
    <input type="hidden" name="platform" value="web"><input type="hidden" name="authUser" value="0"><input type="hidden" name="lat"><input type="hidden" name="lon"><input type="hidden" name="state">
    <input type="hidden" name="version" value="${version}">
    <input type="hidden" name="geolocation"><label>County</label><input type="text" id="gc" value="Loading..." disabled><label>State</label><input type="text" id="gs" value="Loading..." disabled><label>General Location</label><input type="text" id="gl" value="Loading..." disabled>
    <label>What type of incident is this?</label>
    <select name="type">
        <option>- Choose -</option>
        <option value="Wildfire">Wildfire</option>
        <option value="Smoke Check">Smoke Check</option>
        <option value="Prescribed Burn">Prescribed Burn</option>
    </select>
    <label>How big is it?</label><input type="text" name="size" placeholder="eg: 10" style="display:inline-block;max-width:100px">
    <div id="alab" style="display:inline-block;padding-left:5px">acres</div>
    <label>Brief description of incident:</label>
    <textarea name="notes" placeholder="Anything else you can add..." style="min-height:100px;resize:none"></textarea>
    <div class="btn-group centered"><input type="submit" class="btn btn-blue" value="Submit Report">
        <a class="btn btn-gray" href="#" id="cancelNewRpt" onclick="return false">Cancel</a>
    </div>
    <div class="disclaimer">Submitting this report only sends information to the ${productName} team&mdash;it does not send any information to emergency or governmental authorities. Please call 911 to report a new wildfire.</div>
</form>`,
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
            { 'viirs': 'VIIRS Hotspots' },
            { 'drought': 'Drought Conditions' },
            { 'nfdrs': 'Fire Danger' },
            { 'sfp': 'Significant Fire Potential' },
            /*{ 'burnProb': 'Burn Probability' },*/
            { 'fhsz': 'CAL FIRE Hazard Severity Zones' },
            { 'lands': 'Land Ownership' },
            { 'rth': 'Wildfire Risk to Homes' },
            { 'bp': 'Wildfire Likelihood' },
            { 'whp': 'Wildfire Hazard Potential' },
            { 'nri': 'FEMA Wildfire Risk Index' }
        ],
        'items': {
            'fire': [
                ['icon', '<div class="fire-icon new"><i class="fas fa-fire"></i></div>', '', 'New Fire'],
                ['icon', '<div class="fire-icon new fast"><i class="fas fa-fire"></i></div>', '', 'Fast Growing Fire'],
                ['icon', '<div class="fire-icon"><i class="fas fa-fire"></i></div>', '', 'Active Fire (0-100 acres)'],
                ['icon', '<div class="fire-icon big"><i class="fas fa-fire"></i></div>', '', 'Active Fire (100-1000 acres)'],
                ['icon', '<div class="fire-icon large"><i class="fas fa-fire"></i></div>', '', 'Active Fire (>1000 acres)'],
                ['icon', '<div class="fire-icon complex"><i class="fad fa-fire-flame-curved" aria-hidden="true" style="position:absolute;left:2px;top:2px;color:rgb(255 255 255 / 100%)"></i>' +
                    '<i class="fad fa-fire-flame-curved" aria-hidden="true" style="position:absolute;right:1px;bottom:2px;color:rgb(255 255 255 / 100%)"></i>' +
                    '<div style="position:absolute;width:25px;border-bottom:1px solid rgb(255 255 255 / 68%);top:50%;transform:rotate(-45deg)"></div></div>', '', 'Complex'],
                ['icon', '<div class="fire-icon contain"><i class="fas fa-fire"></i></div>', '', 'Contained Fire'],
                ['icon', '<div class="fire-icon controlled"><i class="fas fa-fire"></i></div>', '', 'Controlled Fire'],
                ['icon', '<div class="fire-icon rx"><i class="fas fa-prescription"></i></div>', '', 'Prescribed Burn'],
                ['icon', '<div class="fire-icon smkchk"><i class="fas fa-badge-check"></i></div>', '', 'Smoke Check']
            ],
            'viirs': [
                ['icon', '<div class="modis t24"></div>', '', 'Heat Detection (0-24 hrs)'],
                ['icon', '<div class="modis t48"></div>', '', 'Heat Detection (24-48 hrs)'],
                ['icon', '<div class="modis t72"></div>', '', 'Heat Detection (48-72 hrs)']
            ],
            'nfdrs': [
                ['color', '', '#3db471', 'Low'],
                ['color', '', '#00ff00', 'Moderate'],
                ['color', '', '#ffff00', 'High'],
                ['color', '', '#ff8b00', 'Very High'],
                ['color', '', '#b31f1f', 'Extreme']
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
            /*'burnProb': [
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
            ],*/
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
                ['color', '', '#9e9e9e', 'Insufficient Data']
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
                ['color', '', '#c4001a', '95-100th percentile']
            ],
            'bp': [
                ['color', '', '#fff0cf', 'Very Low'],
                ['color', '', '#fdca94', 'Low'],
                ['color', '', '#f26d4b', 'Moderate'],
                ['color', '', '#c91d13', 'High'],
                ['color', '', '#7f0000', 'Very High']
            ],
            'whp': [
                ['color', '', '#37a300', 'Very Low'],
                ['color', '', '#a3ff94', 'Low'],
                ['color', '', '#ffff63', 'Moderate'],
                ['color', '', '#ffa300', 'High'],
                ['color', '', '#ee1900', 'Very High'],
                ['color', '', '#e1e1e1', 'Non-burnable'],
                ['color', '', '#006fff', 'Water']
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

async function api(url, fields = null) {
    let result,
        ops = {
            method: url.search('weather.gov') >= 0 ? 'GET' : 'POST',
        },
        fd = new FormData();

    if (url.search(apiURL) >= 0 || url.search(apiURL.replace('v1', 'v2')) >= 0 || url.search(host) >= 0) {
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

function isVisible(div) {
    const rect = document.querySelector(div).getBoundingClientRect();
    const windowHeight = window.innerHeight;

    return rect.top >= 0 && rect.bottom <= windowHeight;
}

class Convert {
    acres(a) {
        let acres = (a == 'Unknown' || a == '' ? 'Unknown' : numberFormat(a)),
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

    sizing(v, size = null) {
        let d = '',
            a = size == null ? null : parseFloat(size.toString().replace(',', '')),
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

class Settings {
    constructor(u) {
        this.defaultLayers = [];
        this.defaultSettings = {
            center: [43.67, -117.15],
            zoom: 5,
            tile: 'outdoors',
            perimeters: {
                'minSize': 500,
                'color': 'default',
                'zoom': 1
            },
            saveFreq: 300000
        };
        this.user = u;
        this.role = u != null ? u.role : 'GUEST';
        this.settings = u != null && u.settings.allsettings ? u.settings.allsettings : this.defaultSettings;
        this.archive = typeof historical !== 'undefined' ? historical : null;

        if (!this.settings.checkboxes) {
            Object.keys(layers.layers).forEach((e) => {
                layers.layers[e].forEach((f) => {
                    if (f.default) {
                        this.defaultLayers.push(f.id);
                    }
                });
            });

            this.settings.checkboxes = this.defaultLayers;
        }
    }

    updateLayers(layers) {
        this.settings.checkboxes = layers;
    }

    updateSpecial() {
        const ot = document.querySelector('#otlkType'),
            od = document.querySelector('#otlkDay'),
            fm = document.querySelector('#forecastModel'),
            ft = document.querySelector('#fcstTime'),
            sf = document.querySelector('#sfpDateSelect'),
            ec = document.querySelector('#erc_time');

        this.settings.special = {
            otlkType: ot.options[ot.selectedIndex].value,
            otlkDay: od.options[od.selectedIndex].value,
            erc: ec.options[ec.selectedIndex].value,
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
            return this.getRole() == 'PREMIUM' ? true : (this.getRole() == 'ADMIN' ? true : this.subscriptions().valid());
        }
    }

    getToken() {
        return this.user ? this.user.token : null;
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
            };
        } else {
            return null;
        }
    }

    weather() {
        return {
            wind: () => {
                return this.settings.weather && this.settings.weather.wind ? this.settings.weather.wind : 'mph';
            },
            temp: () => {
                return this.settings.weather && this.settings.weather.temp ? this.settings.weather.temp : 'f';
            }
        };
    }

    special() {
        return {
            erc: () => {
                return this.settings.special && this.settings.special.erc ? this.settings.special.erc : 'obs';
            },
            otlkDay: () => {
                return this.settings.special && this.settings.special.otlkDay ? this.settings.special.otlkDay : 1;
            },
            otlkType: () => {
                return this.settings.special && this.settings.special.otlkType ? this.settings.special.otlkType : 'severe';
            }
        };
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

        if (wwa && wwa.features.length > 0) {
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
                        })/*.on('click', 'wwas_fill', (e) => {
                        const l = e.lngLat;

                        this.find(l.lat, l.lng);
                    })*/;
                    }
                }
            }
        }
    }

    /* get current weather alerts at the lat/lon of the users' click point */
    async find(lat, lon) {
        let out = '<p>There are no valid weather alerts at this location</p>',
            popup = new Popup('').create('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div>' +
                '<p style="text-align:center;margin-top:0.5em;font-size:14px">Getting weather alerts...</p>');

        /*new mapboxgl.Popup()
            .setLngLat([lon, lat])
            .setHTML('<div id="spinner" class="sm" style="display:block;text-align:center;margin:0 auto"></div><p style="text-align:center;margin-top:0.5em">Getting weather alerts...</p>')
            .addTo(map);*/

        const data = await api(apiURL + 'nws', [['lat', lat], ['lon', lon]]);

        if (data.alerts && data.alerts.length > 0) {
            let c = '';

            data.alerts.forEach((a) => {
                c += '<li style="line-height:1.3"><a href="#" class="readWWA" onclick="return false" data-id="' + a.id + '">' + a.event + '</a> until ' + a.expires + '</li>';
            });

            /* update the popup with valid alerts */
            out = '<ul style="padding-inline-start:1em;display:inline-flex;flex-direction:column;gap:.5em">' + c + '</ul>';
        }

        popup.update(out, 'Current Alerts');
    }

    /* get SPC convective and fire weather outlooks */
    async spc(update = false) {
        let dy, ty;

        if (document.querySelector('#otlkDay')) {
            dy = document.querySelector('#otlkDay').options[document.querySelector('#otlkDay').selectedIndex].value;
            ty = document.querySelector('#otlkType').options[document.querySelector('#otlkType').selectedIndex].value;
        } else {
            dy = settings.special().otlkDay();
            ty = settings.special().otlkType();
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
                }).on('mouseenter', 'outlook_fill', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'outlook_fill', () => {
                    map.getCanvas().style.cursor = 'auto';
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
                    'https://nowcoast.noaa.gov/geoserver/satellite/wms?service=WMS&layers=' + layer + '&request=GetMap&styles=&format=image/png&transparent=true&version=1.3.0&width=1920&height=515&crs=EPSG%3A3857&bbox={bbox-epsg-3857}'
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

    async getOutlookText(otlkType, day) {
        modal.querySelector('.content').innerHTML = '<div class="container"><div class="loading"><div class="s"></div></div></div>';
        modal.classList.add('wwa', 'open');
        modal.classList.remove('fire', 'closing');

        let type,
            graphics = '',
            request = await api(apiURL + 'outlooks/' + otlkType + '/text', [['day', day]]),
            valid1 = dateTime(request.outlook.valid, true, true),
            valid2 = dateTime(request.outlook.expires, true, true);

        if (otlkType == 'severe') {
            type = 'Convective Outlook';
        } else {
            type = 'Fire Weather Outlook';
        }

        request.outlook.graphics.forEach((g) => {
            graphics += `<div class="g"><a target="blank" href="https://www.spc.noaa.gov/products/${g}"><img alt="Day ${day} ${type}" title="Day ${day} ${type}" src="https://www.spc.noaa.gov/products/${g}"></a></div>`;
        });

        let content = `<div class="container">
            <h1 class="title">
                Day ${day} ${type}
            </h1>
            <div class="bar">
                <p class="times">
                    <span>Issued <b>${timeAgo(request.outlook.issued)}</b></span>
                    <span>Valid from <b>${valid1}</b> until <b>${valid2}</b></span>
                    <span>Issued by <a target="blank" href="https://www.spc.noaa.gov/" title="NOAA/NWS Storm Prediction Center">NOAA/NWS Storm Prediction Center</a></span>
                </p>
            </div>
            <div class="wwa-details">
                ${request.outlook.text}
                <p style="color:#561717"><b>Forecaster:</b> ${request.outlook.forecaster}</p>
            </div>
            <div class="graphics">
                ${graphics}
            </div>
        </div>`;

        modal.querySelector('.content').innerHTML = content;
    }

    async readWWA(id) {
        modal.querySelector('.content').innerHTML = '<div class="container"><div class="loading"><div class="s"></div></div></div>';
        modal.classList.add('wwa', 'open');
        modal.classList.remove('fire', 'closing');

        const request = await api(apiURL + 'getWWA', [['id', id]]),
            a = request.wwa,
            worker = new Worker(urlSpecific + 'src/js/wwas-' + version + '.js');

        setHeaders(a.title + ' issued by the National Weather Service in ' + a.office, 'weather/alert/' + id,
            'The National Weather Service in ' + a.office + ' has issued a ' + a.title + ' for ' + a.area + ' until ' + a.expires + '.');

        worker.postMessage(a);

        /* add content to modal after service worker finishes */
        worker.onmessage = (event) => {
            modal.querySelector('.content').innerHTML = event.data;

            if (a.title == 'Tornado Warning' || a.title == 'Severe Thunderstorm Warning') {
                modal.querySelector('h1.title').style.color = a.color;
            }
        };
    }
}

class Wildfires {
    constructor() {
        this.store = localStorage.getItem('clicks');
        this.agencies = {
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
                        ['-', now, ['to-number', ['get', 'discovered', ['get', 'time']]]],
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
                    ['to-number', ['get', 'year', ['get', 'time']]], curTime.getFullYear()
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
        if (s == '' || s === false && n == '') {
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

    createChart(fireName, incID, hist) {
        if (hist.length > 1) {
            document.querySelector('#acres_history').parentElement.parentElement.remove();
        } else {
            const data = [],
                data2 = [];
            /*const labels = [],
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
            });*/
            hist.forEach((h) => {
                data.push([h.updated * 1000, h.acres]);
                data2.push([h.updated * 1000, h.change]);
            });
            data.reverse();
            data2.reverse();

            const fmt = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            },
                date1 = Intl.DateTimeFormat('en-US', fmt).format(data[0][0]),
                date2 = Intl.DateTimeFormat('en-US', fmt).format(data[data.length - 1][0]),
                dates = date1 == date2 ? ' on ' + date1 : ' from ' + date1 + ' to ' + date2;

            Highcharts.setOptions({
                time: {
                    timezone: 'America/Los_Angeles'
                }
            });

            chart = Highcharts.chart('acres_history', {
                chart: {
                    type: 'line',
                    style: {
                        fontFamily: 'Roboto'
                    }
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: 'Incident Growth History',
                    align: 'left'
                },
                events: {
                    render() {
                        document.querySelector('#acres_history').style.backgroundColor = 'transparent';
                    }
                },
                subtitle: {
                    text: '<b>' + fireName + ' (' + incID + ') growth history ' + dates + '.</b><br>&copy; ' + new Date().getFullYear() + ' MAPO LLC',
                    useHTML: true,
                    verticalAlign: 'bottom',
                    align: 'left'
                },
                navigation: {
                    buttonOptions: {
                        enabled: true
                    }
                },
                tooltip: {
                    xDateFormat: '%a, %b %e, %Y %l:%M %p',
                    shared: true
                },
                xAxis: {
                    type: 'datetime',
                    labels: {
                        format: '{value:%b %e}'
                    }
                },
                yAxis: [{
                    title: {
                        text: 'Total Acres',
                        style: {
                            color: '#888'
                        }
                    },
                    min: 0
                }, {
                    title: {
                        text: 'Change in Acres',
                        style: {
                            color: '#888'
                        }
                    },
                    min: 0,
                    opposite: true
                }],
                series: [{
                    name: 'Total Acres',
                    type: 'line',
                    data: data
                }, {
                    name: 'Change in Acres',
                    type: 'line',
                    data: data2,
                    yAxis: 1
                }],
                panning: true,
                panKey: 'ctrl',
                zooming: {
                    type: 'xy'
                },
                plotOptions: {
                    series: {
                        marker: {
                            symbol: 'circle',
                            fillColor: '#fff',
                            enabled: true,
                            radius: 3,
                            lineWidth: 1,
                            lineColor: null
                        }
                    }
                },
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 600
                        },
                        chartOptions: {
                            yAxis: {
                                title: {
                                    text: ''
                                }
                            }
                        }
                    }]
                },
                colors: ['#e41616', '#ffd54f']
            });
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
    async getWildfires(update = false) {
        const types = ['all', 'new', 'smk', 'rx'];

        if (settings.archive) {
            const fires = await api(apiURL + 'wildfires/all', [['archive', settings.archive], ['bbox', getbbox()]]);

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
            if (update) {
                map.getSource(types[0] + '_fires').setData(fires);
            } else {
                if (!map.getSource(types[0] + '_fires')) {
                    map.addSource(types[0] + '_fires', {
                        type: 'geojson',
                        data: fires,
                        cluster: CLUSTER_FIRES,
                        clusterMaxZoom: window.innerWidth < 600 || window.outerWidth < 600 ? 6 : 7,
                        clusterMinPoints: 20,
                        clusterRadius: 50
                    });
                }
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
                            clusterMaxZoom: 8,
                            clusterMinPoints: 5,
                            clusterRadius: 20
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
            fireLayerName = type + '_fires_layer',
            vis = settings.includes(lay[n]) || !settings.get('checkboxes') && type != 'rx' ? 'visible' : 'none';

        /* add fires to map */
        if (map.getSource(type + '_fires')) {
            if (!map.getLayer(fireLayerName)) {
                map.addLayer({
                    id: fireLayerName,
                    type: 'symbol',
                    source: type + '_fires',
                    layout: {
                        'icon-image': this.fireIcon(type),
                        'icon-size': [
                            'case',
                            ['has', 'Out'],
                            0.3,
                            0.4
                        ],
                        'icon-allow-overlap': true,
                        visibility: vis
                    }/*,
                    paint: {
                        'icon-opacity': [
                            'case',
                            ['has', 'Out'],
                            0.5,
                            1
                        ]
                    }*/
                }).on('mouseenter', fireLayerName, () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', fireLayerName, () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }

            if (!map.getLayer(type + '_fire_title')) {
                map.addLayer({
                    id: type + '_fire_title',
                    type: 'symbol',
                    source: type + '_fires',
                    minzoom: window.innerWidth < 600 || window.outerWidth < 600 ? 5 : 6,
                    paint: {
                        'text-color': '#000',
                        'text-halo-color': '#fff',
                        'text-halo-blur': 1,
                        'text-halo-width': 2,
                        'text-opacity': [
                            'step',
                            ['zoom'],
                            [
                                'case',
                                ['>', ['to-number', ['get', 'acres']], 1000],
                                1.0,
                                0.0
                            ],
                            9,
                            1.0
                        ]
                    },
                    layout: {
                        'symbol-placement': 'point',
                        'symbol-spacing': 150,
                        'text-font': ['Source Sans Pro SemiBold'],
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
                        'text-size': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            7,
                            [
                                'case',
                                ['>', ['to-number', ['get', 'acres']], 1000],
                                12,
                                10
                            ],
                            14,
                            [
                                'case',
                                ['>', ['to-number', ['get', 'acres']], 1000],
                                15,
                                13
                            ]
                        ],
                        'text-max-width': 8,
                        'text-anchor': 'top',
                        'text-offset': [
                            'case',
                            ['>', ['to-number', ['get', 'acres']], 1000],
                            [0, 1.2],
                            [0, 1]
                        ],
                        'text-allow-overlap': false,
                        'text-letter-spacing': 0.05,
                        visibility: vis
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
        /*wx.nearbyAQ();*/
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

    incident(wfid, click = false) {
        const cacheIncident = async () => {
            const cache = await caches.open('mapofire-v' + version);

            try {
                if (settings.fire().cache()) {
                    const cachedResponse = await cache.match(wfid);

                    if (cachedResponse) {
                        const cachedData = await cachedResponse.json();

                        if (Date.now() - cachedData.timestamp < (10 * 60 * 1000)) {
                            return cachedData.data;
                        }
                    }
                }

                const data = await api(apiURL + 'wildfires/incident', [['wfid', wfid], ['history', 1]]);

                if (settings.fire().cache()) {
                    await cache.put(wfid, new Response(JSON.stringify({
                        data: data,
                        timestamp: Date.now()
                    })));
                }

                return data;
            } catch (error) {
                console.error(error);
            }
        };

        /* open modal */
        modal.querySelector('.content').innerHTML = '<div class="container"><div class="loading"><div class="s"></div></div></div>';
        modal.classList.add('fire', 'open');
        modal.classList.remove('wwa', 'closing');

        /* get incident json from cache or API */
        cacheIncident(wfid).then(getinc => {
            const worker = new Worker(urlSpecific + 'src/js/incident-' + version + '.js'),
                fname = this.fireName(getinc.fire.properties.fireName, getinc.fire.properties.type, getinc.fire.properties.incID),
                near = getinc.fire.geometry.near,
                acresHistory = getinc.fire.properties.acres_history,
                where = () => {
                    const rpt = setInterval(() => {
                        if (map.getSource('composite') && map.isSourceLoaded('composite')) {
                            let found = false,
                                f = map.queryRenderedFeatures(map.project([getinc.fire.geometry.lon, getinc.fire.geometry.lat]));

                            f.forEach((g) => {
                                if (g.layer.id == 'us-counties') {
                                    found = true;

                                    document.querySelector('.juris p').innerHTML = '<b>' + getinc.fire.properties.type.toUpperCase() +
                                        '</b> reported in ' + g.properties.NAME + ', ' + stateLabels[getinc.fire.properties.fireState].v;
                                }
                            });

                            if (!found) {
                                document.querySelector('.juris p').innerHTML = document.querySelector('.juris p').dataset.adv;
                            }

                            clearInterval(rpt);
                        }
                    }, 500);
                };

            /* zoom to fire on the map */
            if (!click) {
                map.easeTo({
                    center: [getinc.fire.geometry.lon, getinc.fire.geometry.lat],
                    zoom: 12,
                    duration: 0
                });
            }

            /* change the URL in the browser */
            //if (window.location.pathname.search('/fires') >= 0) {
            setHeaders(fname + ' near ' + near.split(' of ')[1] + ' - Current Incident Information and Wildfire Map', getinc.fire.properties.url,
                'See current information on the ' + fname + ' near ' + near.split(' of ')[1] + '.');

            if (getinc.fire.inciweb && getinc.fire.inciweb.photo) {
                document.querySelector('meta[property="og:image"]').setAttribute('content', `https://www.mapofire.com/src/images/incident?path=${getinc.fire.inciweb.photo.url}`);
                document.querySelector('meta[name="twitter:image"]').setAttribute('content', `https://www.mapofire.com/src/images/incident?path=${getinc.fire.inciweb.photo.url}`);
            }

            if (getinc.fire.inciweb && getinc.fire.inciweb.photo) {
                document.querySelector('meta[property="og:image:alt"]').setAttribute('content', getinc.fire.inciweb.photo.caption);
            }
            //}

            /* send data to service worker */
            worker.postMessage({
                json: getinc,
                role: settings.getRole(),
                hasPermissions: settings.hasPermissions(),
                vars: {
                    domain: domain,
                    center: this.getDispatchCenter(getinc.fire.protection.dispatch),
                    agencies: this.agencies,
                    stateLabels: stateLabels,
                    tracked: tracked,
                    sizeUnit: conversion.sizing(1).toLowerCase(),
                    reported: timeAgo(getinc.fire.time.discovered),
                    updated: timeAgo(getinc.fire.time.updated)
                }
            });

            /* add content to modal after service worker finishes */
            worker.onmessage = (event) => {
                modal.querySelector('.content').innerHTML = event.data;

                /* create inline donation cta */
                const donate = `<div class="donate"><div><p>Your contribution makes a difference. Donate to support our work.</p>
                    <a href="${donateLink}?utm_campaign=Fundraising&utm_source=mapofire&utm_medium=incident_page" id="map_fire_modal_donate" target="blank" class="btn btn-green" onclick="this.parentElement.parentElement.remove();return true">
                    <i class="fas fa-heart"></i>Contribute</a></div>
                    <i class="far fa-xmark" onclick="this.parentElement.remove();return false"></i></div>`;

                if (document.querySelector('.dispatch')) {
                    document.querySelector('.dispatch').insertAdjacentHTML('beforebegin', donate);
                }

                /* get incident weather and the county the incident is located in */
                where();
                this.doWeather([getinc.fire.geometry.lon, getinc.fire.geometry.lat]);

                /* remove any features that require a user to be subscribed */
                if (!settings.hasPermissions('PREMIUM')) {
                    document.querySelector('#acres_history').parentElement.parentElement.remove();

                    /* blur coordinates */
                    document.querySelector('span.coords').innerHTML = '0.0000 -0.0000';
                    document.querySelector('span.coords').classList.add('blur');
                } else {
                    /* load the script for the chart, then create the acreage chart */
                    if (acresHistory != null) {
                        const c = this;

                        if (!highchartsLoad) {
                            loadScript('https://code.highcharts.com/highcharts.js')
                                .then(() => {
                                    highchartsLoad = true;

                                    loadScript('https://code.highcharts.com/modules/exporting.js').then(() => {
                                        c.createChart(fname, getinc.fire.properties.incidentId, acresHistory);
                                    });
                                });
                        } else {
                            c.createChart(fname, getinc.fire.properties.incidentId, acresHistory);
                        }
                    } else {
                        document.querySelector('#acres_history').parentElement.parentElement.remove();
                    }
                }
            };
        });
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
        let vis = !settings.user || !settings.get('checkboxes') || settings.includes('perimeters') ? 'visible' : 'none',
            y = (settings.archive ? settings.archive : curTime.getFullYear()),
            min = settings.perimeters().minSize(),
            pc = this.perimeterColor(settings.perimeters().color()),
            o = 'OBJECTID,attr_UniqueFireIdentifier,poly_IncidentName,attr_IncidentName,poly_DateCurrent,poly_GISAcres,poly_Acres_AutoCalc,poly_MapMethod,attr_POOState,attr_ContainmentDateTime,attr_FireOutDateTime',
            perimName = 'attr_IncidentName',
            w = 'attr_FireDiscoveryDateTime>=TIMESTAMP \'' + y + '-01-01 00:00:00\' AND attr_FireDiscoveryDateTime<=TIMESTAMP \'' + y + '-12-31 23:59:59\'';

        if (settings.archive) {
            w += ' AND (poly_GISAcres > ' + min + ' OR poly_Acres_AutoCalc > ' + min + ') AND attr_FireOutDateTime IS NULL';
        }

        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query', [
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
                            3,
                            1
                        ],
                        'line-color': pc
                    },
                    layout: {
                        visibility: vis
                    }
                }).addLayer({
                    id: 'perimeters_fill',
                    type: 'fill',
                    source: 'perimeters',
                    paint: {
                        'fill-opacity': 0.3,
                        'fill-color': pc
                    },
                    layout: {
                        visibility: vis
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
                        /*'symbol-avoid-edges': true,*/
                        'text-font': ['DIN Pro Medium'],
                        'text-field': ['upcase', ['concat', ['get', perimName], ' Fire']],
                        /*'text-justify': 'center',*/
                        'text-size': 13,
                        /*'text-max-width': 8,*/
                        'text-max-angle': 30,
                        'text-padding': 5,
                        'text-pitch-alignment': 'viewport',
                        'text-rotation-alignment': 'map',
                        'text-offset': [0, 1],
                        /*'text-anchor': 'center',
                        'text-letter-spacing': 0.05*/
                        visibility: vis
                    }
                }).on('mouseenter', 'perimeters_fill', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'perimeters_fill', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
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

        /* get evacuations */
        this.evacuations();
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
                })/*.on('click', 'airQuality', (e) => {
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
                                    d.quality + '</span><p>' + d.desc + '</p><p class="updated" style="text-align:left">Last report ' + timeAgo(new Date(e.properties.LocalTimeString).getTime()) + '</p>')
                                .addTo(map);
                        }
                    }
                })*/.addLayer({
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

    async lightning() {
        map.addSource('lightning1', {
            type: 'raster',
            maxzoom: 15,
            tiles: [
                //host + 'api/v1/lightning?key=' + apiKey + '&x={x}&y={y}&z={z}&s=256&t=5'
                //'https://tiles.lightningmaps.org/?x={x}&y={y}&z={z}&s=256&t=5'
                'https://www.firewxavy.org/apis/lightning/5/{z}/{x}/{y}'
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
                //host + 'api/v1/lightning?key=' + apiKey + '&x={x}&y={y}&z={z}&s=256&t=6'
                //'https://tiles.lightningmaps.org/?x={x}&y={y}&z={z}&s=256&t=6'
                'https://www.firewxavy.org/apis/lightning/6/{z}/{x}/{y}'
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
        const url = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query',
            n = (w == 1 ? '24' : (w == 2 ? '48' : '72')),
            ts = (days) => {
                const date = new Date(new Date().getTime() - (days * 60 * 60 * 24 * 1000)),
                    hours = date.getHours(),
                    minutes = date.getMinutes().toString().padStart(2, '0');

                return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${hours}:${minutes}`;
            },
            fd1 = ts(1),
            fd2 = ts(2),
            fd3 = ts(3);

        await fetch(url + '?where=acq_time >= DATE \'' + (w == 1 ? fd1 : (w == 2 ? fd2 : fd3)) + ':00\'' + (w != 1 ? ' AND acq_time <= DATE \'' + (w == 2 ? fd1 : fd2) + ':00\'' : '') + '&outFields=*&geometry=' + getbbox() + '&geometryPrecision=6&returnGeometry=true&f=geojson')
            .then(async (resp) => {
                const data = await resp.json();

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
                            type: 'symbol',
                            source: 'modis' + n,
                            layout: {
                                'icon-image': 'modis' + w,
                                'icon-size': 0.5,
                                'icon-allow-overlap': true
                            },
                            paint: {
                                'icon-opacity': [
                                    'interpolate',
                                    ['linear'],
                                    ['zoom'],
                                    0,
                                    0.5,
                                    10,
                                    0.5,
                                    13.5,
                                    1
                                ]
                            }
                        }).on('mouseenter', 'modis' + n, () => {
                            map.getCanvas().style.cursor = 'pointer';
                        }).on('mouseleave', 'modis' + n, () => {
                            map.getCanvas().style.cursor = 'auto';
                        });
                    }
                }
            });
    }

    async erc(update = false, toggle = false) {
        const sel = document.querySelector('#erc_time'),
            dy = sel ? sel.options[sel.selectedIndex].value : settings.special().erc(),
            obs = [
                'case',
                ['<', ['to-number', ['get', 'avg_ec_percentile']], 60], '#bae1a6',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_percentile']], 60],
                    ['<', ['to-number', ['get', 'avg_ec_percentile']], 80]
                ],
                '#efffce',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_percentile']], 80],
                    ['<', ['to-number', ['get', 'avg_ec_percentile']], 90]
                ],
                '#ffffe8',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_percentile']], 90],
                    ['<', ['to-number', ['get', 'avg_ec_percentile']], 97]
                ],
                '#ffe1a6',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_percentile']], 97],
                    ['<', ['to-number', ['get', 'avg_ec_percentile']], 100]
                ],
                '#ffa6a6',
                ['>=', ['to-number', ['get', 'avg_ec_percentile']], 100], '#e1a6a6',
                '#e1e1e1'
            ],
            fcst = [
                'case',
                ['<', ['to-number', ['get', 'avg_ec_fcast_percentile']], 60], '#bae1a6',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_fcast_percentile']], 60],
                    ['<', ['to-number', ['get', 'avg_ec_fcast_percentile']], 80]
                ],
                '#efffce',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_fcast_percentile']], 80],
                    ['<', ['to-number', ['get', 'avg_ec_fcast_percentile']], 90]
                ],
                '#ffffe8',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_fcast_percentile']], 90],
                    ['<', ['to-number', ['get', 'avg_ec_fcast_percentile']], 97]
                ],
                '#ffe1a6',
                [
                    'all',
                    ['>=', ['to-number', ['get', 'avg_ec_fcast_percentile']], 97],
                    ['<', ['to-number', ['get', 'avg_ec_fcast_percentile']], 100]
                ],
                '#ffa6a6',
                ['>=', ['to-number', ['get', 'avg_ec_fcast_percentile']], 100], '#e1a6a6',
                '#e1e1e1'
            ];

        if (toggle) {
            map.setPaintProperty('erc_fill', 'fill-color', dy == 'obs' ? obs : fcst);
        } else {
            const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/DRAFT_NFDRS_ERC_Forecasted/FeatureServer/1/query', [
                ['where', '1=1'],
                ['outFields', 'OBJECTID,PSANAME,PSANationalCode,avg_ec_fcast_percentile,avg_ec_fcast_trend,avg_ec_percentile,avg_ec_trend,nfdr_dt'],
                ['returnGeometry', true],
                ['resultType', 'tile'],
                ['geometryPrecision', 6],
                ['geometry', getbbox()],
                ['f', 'geojson']
            ]);

            /* add ID to features for mapbox */
            data.features.forEach((f, n) => {
                data.features[n].id = f.properties.OBJECTID;
            });

            if (update) {
                map.getSource('erc').setData(data);
                map.setPaintProperty('erc_fill', 'fill-color', dy == 'obs' ? obs : fcst)
            } else {
                if (data && data.features.length > 0) {
                    if (!map.getSource('erc')) {
                        map.addSource('erc', {
                            type: 'geojson',
                            data: data
                        });
                    }

                    if (!map.getLayer('erc_fill')) {
                        map.addLayer({
                            id: 'erc_fill',
                            type: 'fill',
                            source: 'erc',
                            paint: {
                                'fill-color': dy == 'obs' ? obs : fcst,
                                'fill-opacity': 0.6
                            },
                            layout: {
                                visibility: 'visible'
                            }
                        }).addLayer({
                            id: 'erc_outline',
                            type: 'line',
                            source: 'erc',
                            paint: {
                                'line-color': [
                                    'case',
                                    ['boolean', ['feature-state', 'click'], false],
                                    '#111',
                                    '#555'
                                ],
                                'line-width': [
                                    'case',
                                    ['boolean', ['feature-state', 'click'], false],
                                    3,
                                    1
                                ]
                            },
                            layout: {
                                visibility: 'visible'
                            }
                        });
                    }
                }
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
            ['outFields', 'OBJECTID,NRI_ID,COUNTY,STATE,STATEABBRV,WFIR_RISKS,WFIR_RISKR,EAL_SPCTL,POPULATION,BUILDVALUE,AGRIVALUE,AREA'],
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
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            '#111',
                            '#555'
                        ],
                        'line-width': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            3,
                            1
                        ]
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

    bp() {
        if (!map.getSource('bp')) {
            map.addSource('bp', {
                type: 'raster',
                tiles: [
                    'https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/RMRS_WRC_BurnProbability/ImageServer/exportImage?service=WMS&request=GetMap&layers=show%3A0&styles=&format=png32&transparent=true&version=1.1.1&id=Wildfire%20Risk%20to%20Homes&dpi=96&bboxSR=102100&imageSR=102100&size=256%2C256&f=image&width=256&height=256&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'
                ],
                tileSize: 256
            });
        }

        if (!map.getLayer('bp')) {
            map.addLayer({
                id: 'bp',
                type: 'raster',
                source: 'bp',
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
                    /*'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/export?service=WMS&request=GetMap&layers=show%3A17&styles=&format=png32&transparent=true&version=1.1.1&id=Federal%20Lands&dpi=96&bboxSR=102100&imageSR=102100&size=256,256&f=image&srs=EPSG%3A3857&bbox={bbox-epsg-3857}'*/
                    'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/tile/{z}/{y}/{x}'
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
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/DMP_National_Dispatch_Boundaries_Public/FeatureServer/0/query', [
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
        const data = await api('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/DMP_NationalGACCBoundaries_Public/FeatureServer/0/query', [
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
        const data = await api('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/ArcGIS/rest/services/FHSZ_SRA_LRA_Combined/FeatureServer/0/query', [
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

    async calfireAircraft(update = false) {
        await fetch('https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/ArcGIS/rest/services/CAL_FIRE_Aircraft_Tracking_public_view/FeatureServer/0/query?where=1%3D1&outFields=*&geometryPrecision=6&returnGeometry=true&f=geojson')
            .then(async (resp) => {
                const data = await resp.json();

                if (update) {
                    map.getSource('calfireAircraft').setData(data);
                } else {
                    if (data && data.features.length > 0) {
                        if (!map.getSource('calfireAircraft')) {
                            map.addSource('calfireAircraft', {
                                type: 'geojson',
                                data: data
                            });
                        }

                        if (!map.getLayer('calfireAircraft')) {
                            map.addLayer({
                                id: 'calfireAircraft',
                                type: 'symbol',
                                minzoom: 5.7,
                                source: 'calfireAircraft',
                                layout: {
                                    'icon-image': [
                                        'case',
                                        ['==', ['get', 'organizationGroup'], 'Helicopter'], 'helicopter',
                                        ['==', ['get', 'organizationGroup'], 'Tactical'], 'plane_tactical',
                                        ['==', ['get', 'organizationGroup'], 'Tanker'], 'plane_large', 'plane_small'],
                                    'icon-size': 0.8,
                                    'icon-rotate': ['to-number', ['get', 'cog']],
                                    'icon-allow-overlap': true,
                                    visibility: 'visible'
                                }
                            }).addLayer({
                                id: 'calfireAircraft_title',
                                type: 'symbol',
                                minzoom: 5.7,
                                source: 'calfireAircraft',
                                paint: {
                                    'text-color': '#444',
                                    'text-halo-color': '#fff',
                                    'text-halo-blur': 1,
                                    'text-halo-width': 2
                                },
                                layout: {
                                    'symbol-placement': 'point',
                                    'text-font': ['Source Sans Pro SemiBold'],
                                    'text-field': ['concat', ['get', 'unitId'], ' ', [
                                        'case',
                                        ['!=', ['to-string', ['get', 'tailNumber']], 'null'],
                                        ['concat', '(', ['get', 'tailNumber'], ')'],
                                        ''
                                    ], ['get', 'category']],
                                    'text-justify': 'center',
                                    'text-size': 12,
                                    'text-max-width': 8,
                                    'text-anchor': 'bottom',
                                    'text-offset': [0, 4.5],
                                    'text-letter-spacing': 0.05,
                                    visibility: 'visible'
                                }
                            });
                        }
                    }
                }
            });
    }

    async evacuations() {
        if (!evacsLoaded) {
            const data = await api(apiURL + 'evacuations');

            /* store active evacuations for use elsewhere within the map */
            evacsLoaded = true;
            if (data.features && data.features.length > 0) {
                activeEvacuations = data.features;
            }

            if (!map.getSource('evac')) {
                map.addSource('evac', {
                    type: 'geojson',
                    data: data
                });
            }

            if (!map.getLayer('evac')) {
                map.addLayer({
                    id: 'evac',
                    type: 'fill',
                    source: 'evac',
                    paint: {
                        'fill-color': [
                            'case',
                            ['==', ['to-number', ['get', 'level']], 2], '#ffff00',
                            ['==', ['to-number', ['get', 'level']], 3], '#e60000',
                            '#38a800'
                        ],
                        'fill-opacity': 0.275
                    },
                    layout: {
                        visibility: settings.includes('evac') ? 'visible' : 'none'
                    }
                }).addLayer({
                    type: 'line',
                    source: 'evac',
                    id: 'evac_outline',
                    paint: {
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'click'], false],
                            '#00a6ed',
                            '#222'
                        ],
                        'line-width': 2,
                        'line-dasharray': [0, 2, 3]
                    },
                    layout: {
                        visibility: settings.includes('evac') ? 'visible' : 'none'
                    }
                }).addLayer({
                    id: 'evac_title',
                    type: 'symbol',
                    source: 'evac',
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
                        'text-font': ['Source Sans Pro SemiBold'],
                        'text-field': [
                            'case',
                            ['==', ['to-number', ['get', 'level']], 2], 'Level 2: Be Set',
                            ['==', ['to-number', ['get', 'level']], 3], 'Level 3: Go Now',
                            'Level 1: Be Ready'
                        ],
                        'text-justify': 'center',
                        'text-size': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            10,
                            10,
                            12,
                            15
                        ],
                        'text-max-width': 8,
                        'text-anchor': 'center',
                        'text-offset': [0, 1],
                        'text-letter-spacing': 0.05,
                        visibility: settings.includes('evac') ? 'visible' : 'none'
                    }
                }).on('mouseenter', 'evac', () => {
                    map.getCanvas().style.cursor = 'pointer';
                }).on('mouseleave', 'evac', () => {
                    map.getCanvas().style.cursor = 'auto';
                });
            }
        }
    }
}

function gmtime(s) {
    var d = new Date(new Date().getTime() + (s * 1000)),
        m = d.getUTCMonth() + 1,
        t = d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate() + 'T' + (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours() + ':00:00';

    return t;
}

function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
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

function init() {
    let wf = new Wildfires(),
        lay = new Layers(),
        ctr_lat = settings.map().lat,
        ctr_lon = settings.map().lon;

    map = new mapboxgl.Map({
        container: 'map',
        accessToken: mapboxToken,
        zoom: settings.map().zoom,
        center: [ctr_lon, ctr_lat],
        style: tiles[settings.getBasemap()],
        projection: 'mercator',
        hash: true,
        pitch: (settings.map().pitch ? settings.map().pitch : 0),
        bearing: (settings.map().bearing ? settings.map().bearing : 0),
        attributionControl: false,
        collectResourceTiming: true/*,
        transformRequest: (url, resourceType) => {
            if (/tiles\.lightningmaps\.org/.test(url) && resourceType === 'Tile') {
                console.log(url, resourceType);
                return {
                    url: url,
                    mode: 'no-cors',
                    referrer: ''
                };
            }
        }*/
    }).on('error', (e) => {
        if (e && e.error.status != 500) { }
    }).on('zoomend', () => {
        /* control whether FS roads show on the map based on the zoom level */
        if (settings.includes('roads')) {
            if (!map.getLayer('roads')) {
                new Layers().roads();
            }

            map.setLayoutProperty('roads', 'visibility', map.getZoom() <= 11 ? 'none' : (map.getLayer('roads') ? 'visible' : 'visible'));
        }
    }).on('click', async (e) => {
        onMapClick(e);

        /* open new incident report form */
        if (document.querySelector('li#report').getAttribute('data-active') == 1) {
            map.panTo([e.lngLat.lng, e.lngLat.lat]);
            createDataForm('Report an incident', newReport);

            map.getCanvas().style.cursor = 'auto';

            const data = await api(apiURL.replace('v1', 'v2') + 'geocode/incident', [['lat', e.lngLat.lat], ['lon', e.lngLat.lng]]);

            doReport(data, e.lngLat.lat, e.lngLat.lng);
        }
    }).on('style.load', () => {
        /* add banner for archived maps to let the user know */
        if (settings.archive) {
            const b = document.createElement('div');
            b.classList.add('message', 'error', 'banner');
            b.innerHTML = 'You are viewing a historical wildfire map for <b><u>' + settings.archive + '</u></b>';
            document.body.appendChild(b);
        }

        /* add 3D terrain to map */
        map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
        }).setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1
        }).setFog(fog);

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

        /* add fire icons */
        icons.forEach((icon) => {
            icon = (icon ? '-' : '') + icon;

            if (!map.hasImage('fire-icon' + icon)) {
                map.loadImage(domain + 'assets/images/icons/fire/fire-icon' + icon + '.png', (error, image) => {
                    if (error) throw error;
                    map.addImage('fire-icon' + icon, image);
                });
            }
        });

        /* add aircraft icons */
        ['helicopter', 'plane_tactical', 'plane_large', 'plane_small'].forEach((icon) => {
            if (!map.hasImage(icon)) {
                map.loadImage(domain + 'assets/images/icons/fire/' + icon + '.png', (error, image) => {
                    if (error) throw error;
                    map.addImage(icon, image);
                });
            }
        });

        /* add modis icons */
        for (let i = 1; i < 4; i++) {
            map.loadImage(domain + 'assets/images/icons/fire/modis' + i + '.png', (error, image) => { if (error) throw error; map.addImage('modis' + i, image); });
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
    }).on('moveend', debounce(() => {
        map.getCanvas().style.cursor = 'auto';

        if (!settings.user || !settings.get('checkboxes') || settings.includes('perimeters')) {
            wf.perimeters(true);
        }

        if ((!settings.get('checkboxes') || settings.includes('allFires')) && settings.archive != null) {
            new Wildfires().getWildfires(true);
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
            const int = setInterval(() => {
                if (Weather !== undefined) {
                    new Weather().raws(true);
                    clearInterval(int);
                }
            }, 500);
        }

        if (settings.includes('erc')) {
            new Layers().erc(true);
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
    }, 650));

    /* add map controls */
    map.addControl(new mapboxgl.FullscreenControl({
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
            fitBoundsOptions: {
                maxZoom: 10.16
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
        if (impact.style.display == 'flex') {
            document.querySelector('#otlkType').disabled = checked ? false : true;
            document.querySelector('#otlkDay').disabled = checked ? false : true;
        }

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
        if (impact.style.display == 'flex') {
            document.querySelector('#forecastModel').disabled = checked ? false : true;
            document.querySelector('#fcstTime').disabled = checked ? false : true;
        }

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
    } else if (layer == 'erc') {
        if (impact.style.display == 'flex') {
            document.querySelector('#erc_time').disabled = checked ? false : true;
        }

        if (map.getSource('erc')) {
            map.setLayoutProperty('erc_fill', 'visibility', (checked ? 'visible' : 'none'));
            map.setLayoutProperty('erc_outline', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().erc();
            }
        }
    } else if (layer == 'sfp') {
        if (impact.style.display == 'flex') {
            document.querySelector('#sfpDateSelect').disabled = checked ? false : true;
        }

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
    } else if (layer == 'bp') {
        if (map.getSource('bp')) {
            map.setLayoutProperty('bp', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().bp();
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
    } else if (layer == 'evac') {
        if (map.getSource('evac')) {
            map.setLayoutProperty('evac', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('evac_outline', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('evac_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().evacuations();
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
    } else if (layer == 'calfireAircraft') {
        if (map.getSource('calfireAircraft')) {
            map.setLayoutProperty('calfireAircraft', 'visibility', (checked ? 'visible' : 'none'))
                .setLayoutProperty('calfireAircraft_title', 'visibility', (checked ? 'visible' : 'none'));
        } else {
            if (checked) {
                new Layers().calfireAircraft();
            }
        }
    }
}

function marketing() {
    const m = localStorage.getItem('marketing'),
        REPEAT_EVERY_DAY = 2;

    if (m == null || (Number(Date.now() - Number(m)) > 86400000 * REPEAT_EVERY_DAY)) {
        const content = `<p style="margin:1.5em 0;font-size:18px;font-weight:400">Map of Fire delivers life-saving wildfire and public safety information to everyone, free of charge. Your contribution directly fuels our ability to continue this critical work. Thank you for your support!</p>
            <div class="btn-group no-margin" style="width:100%;justify-content:space-between">
            <input type="button" id="donate_cta" class="btn btn-red dn" value="Yes! I\'ll help out" onclick="window.open('${donateLink}?utm_campaign=Fundraising&utm_source=mapofire&utm_medium=popup');closeDataForm();">
            <input type="button" id="donate_dismiss" class="btn btn-gray dn" value="Later, maybe" onclick="closeDataForm()"></div>`;

        const el = document.createElement('div');
        el.classList.add('shadow');
        document.body.appendChild(el);

        createDataForm('Protecting communities starts with you.', content);
        document.querySelector('#data-form').classList.add('bg');
        localStorage.setItem('marketing', curTime.getTime());
    }
}

/* click event listener */
window.addEventListener('click', async (e) => {
    const target = e.target,
        sr = document.querySelector('#search-results')/*,
        popup = document.querySelector('.popup')*/;

    if (target.parentElement.id == 'modal' && target.classList.contains('close')) {
        closeModal();
    }

    if (target.id == 'close-popup') {
        if (marker) {
            marker.remove();
        }

        document.querySelector('.popup').remove();

        if (selected.perim && map.getSource('perimeters')) {
            map.removeFeatureState({
                source: 'perimeters',
                id: selected.perim
            });
        }

        if (selected.evac && map.getSource('evac')) {
            map.removeFeatureState({
                source: 'evac',
                id: selected.evac
            });
        }

        if (selected.nri && map.getSource('nri')) {
            map.removeFeatureState({
                source: 'nri',
                id: selected.nri
            });
        }

        if (selected.erc && map.getSource('erc')) {
            map.removeFeatureState({
                source: 'erc',
                id: selected.erc
            });
        }
    }

    if (target.classList.contains('impactClose')) {
        closeImpact();
    }

    if (sr.style.display != 'none' && target.closest('li') != null && target.closest('li').parentElement.id == 'search-results') {
        const p = target.closest('li'),
            type = p.dataset.type;

        if (!p.classList.contains('standby')) {
            console.log(type);
            if (type == 'city') {
                const lat = p.dataset.lat,
                    lon = p.dataset.lon,
                    name = p.dataset.name.split(', ');

                marker = new mapboxgl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(map);

                new Popup('City').create(`${name[0]}, ${p.dataset.county} County, ${name[1]}`);

                map.easeTo({
                    center: new mapboxgl.LngLat(lon, lat),
                    zoom: 10
                });
            } else if (type == 'gis') {
                const lat = p.dataset.lat,
                    lon = p.dataset.lon,
                    name = p.dataset.name.split(', '),
                    county = p.dataset.county,
                    geoType = p.dataset.geotype;

                marker = new mapboxgl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(map);

                new Popup(geoType).create(name[0] + ', ' + county + ' County, ' + name[1]);

                map.easeTo({
                    center: new mapboxgl.LngLat(lon, lat),
                    zoom: 11.25
                });
            } else if (type == 'state') {
                const bbox = JSON.parse(p.dataset.bbox);

                map.fitBounds([
                    [bbox.x.min, bbox.y.min],
                    [bbox.x.max, bbox.y.max]
                ], {
                    padding: 50
                });
            } else if (type == 'coordinates') {
                const lat = p.dataset.lat,
                    lon = p.dataset.lon;

                marker = new mapboxgl.Marker()
                    .setLngLat([lon, lat])
                    .addTo(map);

                new Popup('Coordinates').create(`${lat},&nbsp;${lon}`);

                map.easeTo({
                    center: [lon, lat],
                    zoom: 10
                });
            } else {
                const r = new Wildfires().findFire(parseInt(p.getAttribute('data-wfid')));

                map.easeTo({
                    center: r.geometry.coordinates,
                    zoom: 10
                });
            }
        }

        sr.innerHTML = '<li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third" aria-hidden="true"></i><span>Searching...</span></li>';
        sr.style.display = 'none';
    }

    /* hide search results if outside search result container */
    if (!target.contains(document.querySelector('#search-results')) &&
        (target.parentElement && !target.parentElement.contains(document.querySelector('#search-results'))) &&
        !target.contains(document.querySelector('#q'))) {
        document.querySelector('#search-results').style.display = 'none';
        document.querySelector('#q').value = '';

        document.querySelectorAll('#search-results li:not(.standby)').forEach((li) => {
            li.remove();
        });
    }

    /* hide impact panel if outside of container */
    if (impact != null && impact.style.display == 'flex' && !impact.contains(e.target) && e.target !== impact) {
        closeImpact();
    }

    /* 
     * navigation menu controls
     * /

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

            /* donate */
            if (target.closest('li').id == 'donate') {
                window.open(donateLink + '?utm_campaign=Fundraising&utm_source=mapofire&utm_medium=nav_menu');
            }

            /* user account & settings */
            if (target.closest('li').id == 'account') {
                if (settings.user == null) {
                    window.location.href = domain + 'secure/login?service=' + platform + '&next=' + encodeURIComponent(window.location.href);
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

            /* logout */
            if (target.closest('li').id == 'logout') {
                window.location.href = urlSpecific + 'logout?service=' + platform + '&next=' + encodeURIComponent(window.location.href);
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
                        const hasPerms = l.perms == false || (l.perms == true && settings.hasPermissions('PREMIUM')) ? true : false,
                            isChecked = l.default && !settings.get('checkboxes') || settings.get('checkboxes') && settings.includes(l.id) ? true : false;

                        console.log(hasPerms);

                        lay += '<li class="layer" data-p="' + l.perms + '" data-id="' + l.id + '" title="' + l.name + '"><div class="checkbox">' +
                            (hasPerms ? '<input type="checkbox" class="layChkBx" data-type="' + l.type + '" id="' + l.id + '"' + (isChecked ? ' checked' : '') + '>' : premFeature) + '</div>' +
                            '<div class="desc"><label for="' + l.id + '">' + l.name + '</label><span>' + l.desc/*layerDesc[g[0]][i]*/ + '</span>';

                        if (l.id == 'perimeters') {
                            lay += '<div id="perimeterSize"><i class="fad fa-filters" style="color:#b9b9b9"></i><input type="range" class="slider" min="0" max="1000" step="25" value="' + settings.get('perimeters').minSize + '">' +
                                '<div id="pSize" style="width:69.11px">' + settings.get('perimeters').minSize + ' acres</div></div>';
                        }

                        if (hasPerms) {
                            if (l.id == 'ndfd') {
                                lay += '<div id="models"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select' + (!isChecked ? ' disabled' : '') + ' id="forecastModel" style="min-width:170px"><option ' + (settings.get('special').forecastModel == 'apparent_temperature' || !settings.get('special') ? 'selected ' : '') + 'value="apparent_temperature">Temperature</option>' +
                                    '<option ' + (settings.get('special').forecastModel == 'relative_humidity' ? 'selected ' : '') + 'value="relative_humidity">Humidity</option><option ' + (settings.get('special').forecastModel == 'wind_speed' ? 'selected ' : '') + 'value="wind_speed">Wind Speed</option>' +
                                    '<option ' + (settings.get('special').forecastModel == 'total_sky_cover' ? 'selected ' : '') + 'value="total_sky_cover">Cloud Cover</option><option ' + (settings.get('special').forecastModel == '12hr_precipitation_probability' ? 'selected ' : '') + 'value="12hr_precipitation_probability">12-hr POPs</option></select>' +
                                    '<select' + (!isChecked ? ' disabled' : '') + ' id="fcstTime" data-type="reg" style="min-width:100px;max-width:35%">' + initNDFDTimes() + '</select></div>';
                            } else if (l.id == 'sfp') {
                                lay += '<div id="sfpDate"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select' + (!isChecked ? ' disabled' : '') + ' id="sfpDateSelect">' + sfpTimes() + '</select></div>';
                            } else if (l.id == 'spc') {
                                lay += '<div id="otlks"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select' + (!isChecked ? ' disabled' : '') + ' id="otlkType" style="min-width:170px">' +
                                    '<option ' + (settings.special().otlkType() == 'fire' ? 'selected ' : '') + 'value="fire">Fire Weather</option>' +
                                    '<option ' + (settings.special().otlkType() == 'severe' ? 'selected ' : '') + 'value="severe">Severe/Convective</option></select>' +
                                    '<select' + (!isChecked ? ' disabled' : '') + ' id="otlkDay" style="min-width:100px"><option ' + (settings.special().otlkDay() == 1 ? 'selected ' : '') + 'value="1">Day 1</option>' +
                                    '<option ' + (settings.special().otlkDay() == 2 ? 'selected ' : '') + 'value="2">Day 2</option>' +
                                    (settings.special().otlkType() != 'fire' ? '<option ' + (settings.special().otlkDay() == 3 ? 'selected ' : '') + 'value="3">Day 3</option>' : '') +
                                    '</select></div>';
                            } else if (l.id == 'erc') {
                                lay += '<div id="ercs"><i class="far fa-filter-list" style="color:#b9b9b9"></i><select' + (!isChecked ? ' disabled' : '') + ' id="erc_time" style="min-width:197px">' +
                                    '<option ' + (settings.special().erc() == 'obs' ? 'selected ' : '') + 'value="obs">Observed (Today)</option>' +
                                    '<option ' + (settings.special().erc() == 'fcst' ? 'selected ' : '') + 'value="fcst">Forecasted (Tomorrow)</option></select></div>';
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

                new Popup('Historical Wildfires').create('<p style="font-size:14px;color:var(--blue-gray);line-height:1.2">See historical wildfires by selecting a year in our archive.</p>' +
                    '<select id="archive_years" style="border:1px solid #cfcfcf;margin-top:1em"><option>- Choose a year -</option>' + yrs + '</select>' +
                    '<div class="btn-group centered"><input type="button" class="btn btn-sm btn-gray" value="Cancel" onclick="this.parentElement.parentElement.parentElement.remove()"></div>');
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

                                    content += `<li id="my-fire-incident" data-coords="${JSON.stringify(fire.geometry.coordinates)}">
                                    <div class="header"><h3 style="line-height:1.2;color:#537376">${name}</h3>
                                    <i class="fas fa-star my-fire-unfollow" data-name="${name}" data-wfid="${p.wfid}" style="color:var(--yellow);cursor:pointer"></i></div>
                                    <span class="state">${state}</span>
                                    <div class="inf"><p style="color:var(--dark-gray);font-size:18px">${size}</p>
                                    <span class="status ${st}">${st.toUpperCase()}</span></div>
                                    <p class="updated" style="margin-top:0.5em;text-align:left">Last update ${up}</p></li>`;
                                }
                            });

                            content = '<ul class="my-fires">' + content + '</ul>';
                        }

                        impact.querySelector('.content').innerHTML = content;
                    }
                }, 500);
            }
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

    if (target.id == 'readSPC') {
        const t = target.dataset.type,
            d = target.dataset.day;

        new NWS().getOutlookText(t, d);
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
            const tf = document.querySelector('#trackFire');

            /* remove, otherwise add */
            if (target.getAttribute('data-mode') == 'unfollow' && tracked.includes(id)) {
                m = 'remove';
                tracked.splice(tracked.indexOf(id), 1);
            } else {
                m = 'add';
                tracked.push(id);
            }

            if (m == 'add') {
                tf.setAttribute('data-mode', 'unfollow');
                tf.setAttribute('title', 'You\'re following this incident');
                tf.classList.add('btn-gray');
                tf.classList.remove('btn-yellow');
                tf.innerHTML = '<i class="far fa-check"></i>Following this incident';
            } else {
                tf.setAttribute('data-mode', 'follow');
                tf.setAttribute('title', 'Start following this incident');
                tf.classList.remove('btn-gray');
                tf.classList.add('btn-yellow');
                tf.innerHTML = '<i class="far fa-plus"></i>Follow this incident';
            }

            /* if user is logged in, save to account, otherwise store in local storage */
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

window.addEventListener('keydown', (e) => {
    if (e.code == 'Escape') {
        if (isVisible('#modal')) {
            closeModal();
        }

        if (isVisible('.popup')) {
            if (marker) {
                marker.remove();
            }

            document.querySelector('.popup').remove();
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
                    const crds = (/([0-9]{2}\.[0-9]+),\s?(-[0-9]{3}.[0-9]+)/gm).exec(query);

                    if (crds != null) {
                        const lat = crds[1],
                            lon = crds[2],
                            h = map.getCenter(),
                            dist = distance(h.lat, h.lng, lat, lon).toFixed(1);

                        const li = document.createElement('li');
                        li.setAttribute('data-type', 'coordinates');
                        li.setAttribute('data-lat', lat);
                        li.setAttribute('data-lon', lon);
                        li.innerHTML = `<span class="icon fas fa-map-location"></span><h3>${parseFloat(lat).toFixed(6).replace(/[0]+$/, '')},&nbsp;${parseFloat(lon).toFixed(6).replace(/[0]+$/, '')}<span>${dist} mile${dist != 1 ? 's' : ''} away</span></h3>`;
                        results.appendChild(li);

                        count++;
                    } else {
                        activeIncidents.forEach((f) => {
                            let use = false,
                                p = f.properties,
                                name = wf.fireName(p.name, p.type, p.incidentId),
                                acresDisp = conversion.acres(p.acres),
                                fstat = p.status,
                                status = (p.time.year < curTime.getFullYear() ? 'out' : wf.getStatus(fstat, p.notes)),
                                j = name.toLowerCase().split(' ');

                            for (let i = 0; i < j.length; i++) {
                                if (j[i].search(query) >= 0) {
                                    use = true;
                                    break;
                                }
                            }

                            if (name.toLowerCase().search(query) >= 0) {
                                use = true;
                            }

                            if (use) {
                                const li = document.createElement('li');
                                li.setAttribute('data-type', 'incident');
                                li.setAttribute('data-wfid', p.wfid);
                                li.setAttribute('title', name);
                                li.innerHTML = `<span class="icon fire fas fa-fire"></span><h3>${name}<span>${p.type} in ${stateLabels[p.state].v} &middot;
                                <b>${acresDisp}</b> &middot; <span class="fstatus ${status}">${ucfirst(status)}</span></span></h3>`;
                                results.appendChild(li);

                                count++;
                            }
                        });

                        if (query.length >= 3) {
                            const search = await api(apiURL + 'search', [['q', query], ['citiesonly', 1]]);

                            if (search.rs != null && search.rs.length > 0) {
                                search.rs.forEach((p) => {
                                    const li = document.createElement('li');

                                    if (p.type == 'State') {
                                        li.setAttribute('data-bbox', JSON.stringify(p.bbox));
                                    } else {
                                        if (p.type == 'GIS') {
                                            li.setAttribute('data-geotype', p.geoType);
                                        }

                                        li.setAttribute('data-lat', p.lat);
                                        li.setAttribute('data-lon', p.lon);
                                    }
                                    li.setAttribute('data-name', p.name);
                                    li.setAttribute('data-county', p.county ? p.county : '');
                                    li.setAttribute('data-type', p.type.toLowerCase());
                                    li.innerHTML = `<span class="icon fas fa-location-dot"></span><h3>${p.name}<span>${p.type == 'GIS' ? p.geoType + ' in ' : ''}${p.county ? p.county + ' County' : 'State'}</span></h3>`;
                                    results.appendChild(li);

                                    count++;
                                });
                            }
                        }
                    }
                } else {
                    results.innerHTML = searchTrend;
                }

                if (count == 0) {
                    results.querySelector('li.standby').style.userSelect = 'none';
                    results.querySelector('li.standby').style.cursor = 'auto';

                    if (results.querySelector('li.standby i')) {
                        results.querySelector('li.standby i').style.display = 'none';
                        results.querySelector('li.standby span').innerHTML = 'No results found';
                    }
                } else {
                    results.querySelector('li.standby').style.display = 'none';
                }
            };

        userSearch(e.target.value);
    }
}, 1050));

window.addEventListener('focus', (e) => {
    if (e.target.id == 'q') {
        const results = document.querySelector('#search-results');

        if (results.style.display == '' || results.style.display == 'none') {
            results.style.display = 'flex';
        }
    }
});

window.onload = async () => {
    /* get top clicked fires */
    const top = await api(apiURL + 'events');
    topFires = top.top;

    /* save settings automatically after the first 10 seconds, then every 5 minutes, whether to the session or user account */
    setTimeout(function () {
        saveSession(true, false);

        setInterval(() => {
            saveSession(true, false);
        }, settings.get('saveFreq'));
    }, 60 * 5 * 1000);

    /* reload the map automatically every 5 minutes */
    setInterval(() => {
        window.location.href = window.location.href;
    }, 60 * 5 * 1000);

    /* add service worker to handle additional js execution */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(urlSpecific + 'src/js/service-worker-' + version + '.js')
            .then(registration => {
                if (registration.active) {
                    registration.active.postMessage({
                        'version': version,
                        'mbVersion': mbVersion,
                        'host': urlSpecific
                    });
                }
            })
            .catch(error => {
                console.error('Service worker registration failed:', error);
            });
    }
};

document.onreadystatechange = async () => {
    if (document.readyState != 'complete') {
        conversion = new Convert();

        let usr = null,
            set,
            wild = new Wildfires(),
            token = (/token=(.*?)(?=;|$)/gm).exec(document.cookie);

        if (localStorage.getItem('dispatch') == null || Date.now() - localStorage.getItem('dispatch_time') > 60 * 60 * 24 * 1000) {
            const dc = await api(apiURL + 'dispatch/all');
            localStorage.setItem('dispatch', JSON.stringify(dc.dispatch));
            localStorage.setItem('dispatch_time', Date.now());
            dispatchCenters = dc.dispatch;
        } else {
            dispatchCenters = JSON.parse(localStorage.getItem('dispatch'));
        }

        if (token != null) {
            const get = await api(apiURL + 'user/get/mapofire', [['token', token[1]]]);
            usr = get.user;

            /* change menu button */
            if (usr != null) {
                const a = document.querySelector('#account');
                a.querySelector('span').innerHTML = 'Account';
                a.setAttribute('data-tooltip', '{"text":"Account Settings","dir":"right"}');
            }
        } else {
            document.querySelector('#save').remove();
            document.querySelector('#logout').remove();
        }

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

        if (/loggedOut=1/.test(window.location.href)) {
            notify('success', 'You were successfully logged out.');
        }

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

        /* if the user is on an Android device, show the download app banner */
        if (/android/.test(navigator.userAgent.toLowerCase())) {
            document.querySelector('.android-banner').style.display = 'flex';
        }

        impact.addEventListener('scroll', () => {
            localStorage.setItem('impactScroll', impact.scrollTop);
        });

        q.addEventListener('blur', () => {
            trending = false;
        });

        q.addEventListener('focus', () => {
            const wf = new Wildfires();

            if (!trending) {
                trending = true;

                let count = 0;
                sr.style.display = 'flex';
                sr.querySelector('li.standby').innerHTML = '<h6 style="color:var(--blue);font-size:18px;cursor:auto;user-select:none">Trending incidents...</h6>';

                if (topFires != null && topFires.length > 0) {
                    for (let i = 0; i < topFires.length; i++) {
                        const p = topFires[i].data,
                            fire = wf.findFire(p.wfid);

                        if (fire) {
                            const fireName = wf.fireName(fire.properties.name, fire.properties.type, fire.properties.incidentId),
                                acres = conversion.acres(fire.properties.acres),
                                li = document.createElement('li');

                            li.setAttribute('data-type', 'incident');
                            li.setAttribute('data-wfid', p.wfid);
                            li.setAttribute('title', fireName);
                            li.innerHTML = '<span class="icon fire fas fa-fire"></span><h3>' + fireName +
                                '<span>' + fire.properties.type + ' in ' + stateLabels[fire.properties.state].v + ' &middot; <b>' + acres + '</b></span></h3>';
                            sr.appendChild(li);

                            if (count == 5) {
                                break;
                            }

                            count++;
                        }
                    }
                } else {
                    const li = document.createElement('li');
                    li.classList.add('standby');
                    li.innerHTML = '<span>No currently trending fires</span>';
                    sr.appendChild(li);
                }

                searchTrend = sr.innerHTML;
            }
        });

        /* send fire click data to server for processing every 20 secs */
        setInterval(() => {
            new Wildfires().commitLog();
        }, 20000);
    }
};