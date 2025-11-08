<?
/*<style>html,body{background:transparent}</style>
<script src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>

<div id="sprite" style="display:inline-flex;gap:2px"></div>

<script>
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
        case 'road':
            icon = 'fas fa-road';
            color = '#3a3a3a';
            t = 1;
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
            color = '#282829';
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
            t = 1;
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

    var c = (icon == 0 ? '<img src="https://www.mapotechnology.com/assets/images/lake.png" style="width:25px;padding:2px">' : '<i class="' + icon + '" style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);font-size: 14px"></i>');

    return '<div style="width:26px;height:26px;border-radius:8px;border:0px solid #686868">' +
        '<div style="position:relative;width:100%;height:100%;border-radius:50%;background-color:' + color + ';color:#' + (t == 1 ? 'fff' : '282829') + '">' + c + '</div></div>';
}

var c = '';
var icons = ['4x4','atv','big_air','bigfoot','big ride','bridge','cabin','camp','camp2','caution','climb','dirtbike','fishing','hike','road','fantasy','gravel','info','lake','media',
            'mtn_bike','parking','road','restroom','river','sledding','apski','atski','ski','nski','snowmobile','summit'];

for (var i = 0; i < icons.length; i++) {
 c += wpIcon(icons[i]);
}

document.getElementById('sprite').innerHTML = c;
</script>
*/

ini_set('display_errors',0);
$user = false;
$settings = array('center' => array(45.333476954750694, -117.95646239909979), 'zoom' => 8.745630556965585, 'tile' => 'outdoors-v12');

$category = ($_GET['category'] ? $_GET['category'] : 'trail');
$settings['category'] = $category;

if ($_GET['activity']) {
    $settings['activity'] = $_GET['activity'];
}
if ($_GET['area']) {
    $settings['area'] = $_GET['area'];
}
if ($_GET['tid']) {
    $settings['unique'] = $_GET['tid'];
}
?>
<!DOCTYPE html>
<html>
<head>
<link href='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css' rel='stylesheet' />
<script src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
<style>
*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;padding:0}
#tileChange{    position: absolute;
    z-index: 99999;
    top: 10px;
    left: 10px;}
.waypoint.mapboxgl-marker {
    width: 26px !important;
    height: 26px !important;
    border: 1px solid #686868;
    border-radius: 8px;
    cursor: pointer;
}
.waypoint.mapboxgl-marker > div {
    position: relative;
    width: 100%;
    height: 100%;
    box-shadow: 0 0 10px rgb(50 50 50 / 30%);
    border-radius: 7px;
}
.waypoint.mapboxgl-marker > div > i {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
}
#modal {
    position: absolute;
    display: none;
    flex-direction: column;
    top: 10px;
    left: 48px;
    width: calc(100% - 72px);
    max-width: 475px;
    height: calc(100% - 114px);
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 0.25rem 0.3125rem #0003, 0 0.4375rem 0.625rem rgb(0 0 0 / 14.1%), 0 0.125rem 1rem rgb(0 0 0 / 12.2%);
    overflow-y: auto;
    user-select: none;
    z-index: 9998;
}

#modal header {
    display: flex;
    flex: 0 0 auto;
    max-width: 100%;
    padding: 20px;
    min-height: 50px;
    background: transparent;
    border-radius: 5px 5px 0 0;
}

#modal header h3.title {
    display: flex;
    flex: 1;
    font-family: dosis;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 0.4px;
    color: var(--gray);
    max-width: 395px;
}

#modal #mclose {
    display: flex;
    width: 50px;
    height: 25px;
    justify-content: flex-end;
    align-items: flex-start;
    font-size: 25px;
    color: #777;
    cursor: pointer;
    transition: all .15s ease-in-out;
}

#modal #mclose i:hover {
    color: #444;
}

#modal .content {
    display: block;
    padding: 0 20px 20px 20px;
}

#modal .content .tab-wrapper {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
}

#modal .content .tab-wrapper .tabs {
    display: flex;
    list-style: none;
    gap: 0 10px;
    border-bottom: 1px solid var(--blue-gray);
}

#modal .content .tab-wrapper .tabs li {
    display: flex;
    flex-grow: 0;
    align-items: center;
    padding: 10px 20px 13px 20px;
    font-weight: 400;
    letter-spacing: 0px;
    color: var(--blue-gray);
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

#modal .content .tab-wrapper .tabs li i {
    padding-right: 10px;
    font-size: 92%;
    vertical-align: middle;
}

#modal .content .tab-wrapper .tabs li.active {
    border-bottom-color: var(--light-blue);
    color: var(--light-blue);
}

#modal .content .tab-wrapper .tab-content {
    display: none;
    width: 100%;
    height: auto;
    padding-top: 10px;
}

#modal .content .tab-wrapper .tab-content.active {
    display: block;
}

#modal .content img {
    width: 100%;
    height: auto;
    border-radius: 5px;
    box-shadow: 0 0 22px rgb(50 50 50 / 30%);
}

#modal .content .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 10px 0;
}

#modal .content .tags .tag {
    display: flex;
    flex: 0 1 auto;
    padding: 6px;
    border: 1px solid rgb(0 166 237 / 20%);
    font-size: 15px;
    color: var(--light-blue);
    border-radius: 4px;
    user-select: none;
    transition: all .15s ease-in-out;
    cursor: pointer;
}

#modal .content .tags .tag:hover {
    background-color: rgb(0 166 237 / 5%);
}

#modal .content h4 {
    display: block;
    font-size: 20px;
    font-weight: 600;
    padding: 10px 0;
    border-bottom: 1px solid rgb(0 0 0 / 16%);
}

#modal .leaflet-marker-icon.waypoint {
    position: relative;
    top: unset;
    left: unset;
    width: 26px;
    height: 26px;
}

#modal .leaflet-marker-icon.waypoint>div i {
    font-size: 15px;
}

#modal .content ul.stats,
#modal .content ul.wxstats,
#modal .content ul.weather {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 0 0 30px;
    list-style-type: none;
}

#modal .content ul.weather li {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 15px 0;
    margin-bottom: 5px;
    border-radius: 5px;
    padding: 10px;
}

#modal .content ul.weather li:nth-child(odd) {
    background-color: #f9f9f9;
}

#modal .content ul.weather li .head {
    display: flex;
    gap: 10px;
    justify-content: space-between;
}

#modal .content ul.weather li .head img {
    display: flex;
    width: 50px;
    height: 50px;
    margin-right: 25px;
    box-shadow: 0 0 10px rgb(50 50 50 / 30%);
}

#modal .content ul.weather li .head .title {
    display: flex;
    flex-direction: column;
    flex: 1;
    line-height: 1.5;
}

#modal .content ul.weather li .head .title h3 {
    padding-bottom: 5px;
    font-family: dosis;
    font-weight: 600;
    color: var(--blue);
    line-height: 1;
}

#modal .content ul.weather li .head .temp {
    color: var(--red);
    font-size: 18px;
    font-weight: 400;
}

#modal .content ul.weather li .fcst {
    font-size: 15px;
    font-weight: 200;
    line-height: 1.2;
}

#modal .content ul.stats li,
#modal .content ul.wxstats li {
    flex: 1 0 auto;
    padding: 0.5rem 0.75rem;
    min-width: calc(50% - 3px);
    max-width: 100%;
    background: #f5f5f5;
    border-radius: 6px;
}

#modal .content ul.stats li:first-child {
    min-width: 100%;
    text-align: center;
}

#modal .content ul.stats li .caption,
#modal .content ul.wxstats li .caption {
    font-weight: 400;
    font-size: 13px;
    color: #656565;
}

#modal .content ul.stats li .value,
#modal .content ul.wxstats li .value {
    padding: 10px 0 0;
    font-size: 19px;
    font-weight: 600;
    color: #606060;
}

#modal .content ul.stats li:first-child .value {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0 10px;
}

#modal .content ul.stats li .value span,
#modal .content ul.wxstats li .value span {
    padding-left: 2px;
    font-weight: 400;
    color: #838383;
}

#modal .content .current {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    gap: 0;
}

#modal .content .current .code {
    display: flex;
    margin-left: 25px;
    font-size: 75px;
    color: var(--blue);
}

#modal .content .current .temps {
    display: flex;
    flex-direction: column;
    flex: 1 1 50%;
    border: 4px solid rgb(11 149 191 / 32%);
    border-radius: 50%;
    padding: 35px 15px;
    max-width: 162px;
    height: 162px;
    text-align: center;

}

#modal .content ul.user-tracks {
    display: flex;
    flex-direction: column;
    list-style: none;
}

#modal .content ul.user-tracks li {
    display: flex;
    flex-direction: column;
    margin-bottom: 7px;
    border-bottom: 1px solid #dddddd;
    padding-bottom: 5px;
}

#modal .content ul.user-tracks li:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border: 0;
}

#modal .content ul.user-tracks li .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

#modal .content ul.user-tracks li .title .a {
    font-family: dosis;
    font-size: 16px;
    color: #444;
}

#modal .content ul.user-tracks li .title .a .btn {
    display: none;
    margin-left: 10px;
    padding: 4px 10px;
    min-width: 0;
    font-size: 13px;
    letter-spacing: 0 !important;
}


#modal .content ul.user-tracks li .title .a i {
    font-size: 15px;
    padding-left: 10px;
    color: var(--light-blue);
    cursor: pointer;
}

#modal .content ul.user-tracks li .title .a input,
#modal .content ul.user-tracks li #objName input {
    padding: 3px 5px;
    max-width: 150px;
    font-family: noto sans;
    font-size: 15px;
    border: 1px solid var(--light-blue);
    border-radius: 5px;
    outline: none;
}

#modal .content ul.user-tracks li .title .b {
    font-size: 13px;
    font-weight: 100;
    color: #b3b3b3;
}

#modal .content ul.user-tracks li .trk {
    margin-bottom: 7px;
}

#modal .content ul.user-tracks li .trk .h {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

#modal .content ul.user-tracks li .trk .h:only-child,
#modal .content ul.user-tracks li .trk .h:last-child {
    margin-bottom: 0;
}

#modal .content ul.user-tracks li .trk .h>.j {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

#modal .content ul.user-tracks li .trk .h .checkbox {
    position: relative;
}

#modal .content ul.user-tracks li .trk .h .checkbox input[type=checkbox] {
    position: absolute;
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
}
</style>
</head>
<body>

<div id="map" style="width:100%;height:100%"<?=($ll ? ' data-lat="' . $ll[0] . '" data-lon="' . $ll[1] . '"' : '').($_GET['z'] ? ' data-zoom="' . $_GET['z'] . '"' : '').($_GET['tid'] ? ' data-tid="'.$_GET['tid'].'"' : '')?>></div>

<div id="modal"></div>
<select id="tileChange">
    <option value="outdoors-v12">Terrain</option>
    <option value="satellite-streets-v12">Satellite</option>
    <option value="streets-v11">Streets</option>
</select>

<script>var user = <?=json_encode($user)?>, settings = <?=json_encode($settings)?>;</script>
<script src='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js'></script>
<script>
var map,
    host = 'https://www.mapotrails.com/',
    cdn = 'https://cdn.mapotrails.com/',
    apiURL = 'https://api.mapotechnology.com/v1/',
    key = 'cf707f0516e5c1226835bbf0eece4a0c',
    category,
    activity,
    area,
    unique,
    wyp = false,
    BOUNDS_PADDING = 100,
    trailData = [],
    trailJson = [],
    trailIDs = [],
    lines = [],
    favTrails = [];

const modalHeader = '<header><h3 id="a" class="title"><div class="placeholder" style="width:225px;height:28px"></div></h3><div id="mclose" onclick="closeModal()" title="Close window">' +
    '<i class="far fa-xmark"></i></div></header>';

const trailBrief = modalHeader + '<div class="content"><a id="j" target="blank" href="#"><img id="trailImg" class="placeholder" style="width:100%;height:175px"></a><div class="tags">' +
    '<div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 5px 0 0"></div><div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 5px 0 5px"></div>' +
    '<div class="placeholder" style="display:inline-block;width:87px;height:23px;margin:0 0 0 5px"></div></div>{favTrailLink}<h4>Trail Stats</h4><ul class="stats" style="margin-top:10px"><li><div class="caption">Guide Type</div><div class="value" id="i">' +
    '<div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Distance</div><div class="value" id="c">' +
    '<div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Max. Altitude</div><div class="value" id="d"><div class="placeholder" style="width:50%;height:19px;margin:0">' +
    '</div></div></li><li><div class="caption">Min. Altitude</div><div class="value" id="e"><div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Elev. Gain</div>' +
    '<div class="value" id="f"><div class="placeholder" style="width:50%;height:19px;margin:0"></div></div></li><li><div class="caption">Elev. Loss</div><div class="value" id="g"><div class="placeholder" style="width:50%;height:19px;margin:0"></div>' +
    '</div></li></ul><a href="#" id="h" target="blank" class="btn btn-lg btn-green btn-center">Explore the full guide</a></div>';

const weather = modalHeader + '<div class="content"><div class="tab-wrapper"><ul class="tabs"><li class="active" rel="cur"><i class="far fa-circle-exclamation"></i>Current</li><li rel="fcst"><i class="far fa-cloud-sun"></i>Forecast</li></ul>' +
    '<div class="tab-content active" data-tab="cur">Getting current weather...</div><div class="tab-content" data-tab="fcst"><ul class="weather"><li><div class="head"><img class="placeholder" style="height:50px"><div class="title">' +
    '<h3 class="placeholder" style="width:60%;height:24px"></h3><span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
    '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
    '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
    '<div class="fcst placeholder" style="height:55px"></div></li><li><div class="head"><img class="placeholder" style="height:50px"><div class="title"><h3 class="placeholder" style="width:60%;height:24px"></h3>' +
    '<span style="width:50%;height:15px;font-weight:400;font-size:13px;color:var(--gray)" class="placeholder"></span></div><div class="temp placeholder" style="width:38px;height:19px"></div></div>' +
    '<div class="fcst placeholder" style="height:55px"></div></li></ul></div></div></div>';

const upload = modalHeader + '<div class="content"><p style="margin:10px 0;font-size:15px;color:#666;text-align:center">Upload a GPX, geojson, or KML file to display on the map (max size = 10 MB)</p>' +
    '<form action="" id="fileUpload" method="post" enctype="multipart/form-data" style="margin-top:15px"><input type="file" name="file" placeholder="Upload a file" accept=".gpx,.geojson,.kml">' +
    '<div class="uploading"><i class="fa-duotone fa-spinner-third"></i>Uploading your file...</div></form></div>';

const userFiles = modalHeader + '<div class="content"><div class="tab-wrapper ufiles"><ol class="tabs"><li class="active" rel="import"><i class="fa-light fa-upload"></i>Uploaded</li><li rel="draw"><i class="fa-solid fa-folders"></i>Custom</li></ol>' +
    '<div class="tab-content active" data-tab="import"><div class="selectAll"><div class="checkbox"><label for="selectAll" style="padding:0 10px 0 0">Select All</label><input type="checkbox" id="selectAll" data-tab="import"></div></div>' +
    '<ul class="user-tracks"></ul></div><div class="tab-content" data-tab="draw"><p class="message error">You don\'t have any custom points, tracks, or polygons</p><div class="selectAll" style="justify-content:space-between;align-items:center">' +
    '<div style="display:flex;flex-direction:column"><a href="#" id="saveUserObjects" class="btn btn-red btn-sm" style="min-width:unset;padding:6px 8px;font-size:14px" onclick="return false"><i class="fas fa-cloud-arrow-up"></i>Sync Your Data</a>' +
    '<span id="lastsynced" style="font-size:13px;padding:5px 0 2px 0;color:var(--blue-gray)">Last synced...</span></div><div class="checkbox"><label for="selectAll" style="padding:0 10px 0 0">Select All</label><input type="checkbox" id="selectAll" style="margin-right:15px" data-tab="draw">' +
    '</div></div><ul class="user-tracks"></ul></div></div></div>';

const mappings = new Map();

const roles = {
    ADMIN: "ADMIN",
    PREMIUM: "PREMIUM",
    GUEST: "GUEST"
};

const actions = {
    ADMIN: "ADMIN",
    DRAW: "DRAW"
};

mappings.set(actions.ADMIN, [roles.ADMIN]);
mappings.set(actions.DRAW, [roles.PREMIUM, roles.ADMIN]);

function metric(v, u) {
    return (u == 'm' ? (v / 3.2808) : (v * 1.60934));
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

function hasPermission(user, action) {
    if (!user?.role) {
        return false;
    }

    if (mappings.has(action)) {
        return mappings.get(action).includes(user.role);
    }

    return false;
}

function markerIcon(c, tid = null) {
    var i;
    if (c.includes('Mountain Bike')) {
        i = wpIcon('mtn_bike', tid);
    } else if (c.includes('Hike')) {
        i = wpIcon('hike', tid);
    } else if (c.includes('ATV')) {
        i = wpIcon('atv', tid);
    } else if (c.includes('Climb')) {
        i = wpIcon('climb', tid);
    } else if (c.includes('Dirtbike')) {
        i = wpIcon('dirtbike', tid);
    } else if (c.includes('Gravel Bike')) {
        i = wpIcon('gravel', tid);
    } else if (c.includes('Road Bike')) {
        i = wpIcon('road', tid);
    } else if (c.includes('Alpine Ski')) {
        i = wpIcon('apski', tid);
    } else if (c.includes('Backcountry Ski')) {
        i = wpIcon('atski', tid);
    } else if (c.includes('Nordic Ski')) {
        i = wpIcon('nski', tid);
    } else if (c.includes('Snowmobile')) {
        i = wpIcon('snowmobile', tid);
    } else {
        i = wpIcon('info', tid);
    }
    return i;
}

function wpIcon(i, tid = null) {
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
        case 'road':
            icon = 'fas fa-road';
            color = '#3a3a3a';
            t = 1;
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
            color = '#282829';
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
            t = 1;
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

    var c = (icon == 0 ? '<img src="https://www.mapotechnology.com/assets/images/lake.png" style="width:25px;padding:2px">' : '<i class="' + icon + '"></i>');

    const el = document.createElement('div');
    el.className = 'waypoint' + (tid != null ? ' trail' : '');
    el.innerHTML = '<div style="background-color:' + color + ';color:#' + (t == 1 ? 'fff' : '282829') + '">' + c + '</div>';
    el.style.width = '26px';
    el.style.height = '26px';

    if (tid != null) {
        el.addEventListener('click', () => {
            readTrail(tid);
        });
    }

    return el;
}

function getTrailFromID(tid) {
    var thisTrail = null;

    trailJson.forEach((t) => {
        if (t.trail_id == tid) {
            thisTrail = t;
        }
    });

    return thisTrail;
}

function readTrail(tid) {
    var trail = getTrailFromID(tid),
        k = '',
        content = trailBrief,
        q = map.queryRenderedFeatures({
            id: 'trails'
        });

    q.forEach((f) => {
        if (tid == f.properties.trail_id) {
            var bounds = new mapboxgl.LngLatBounds();

            for (let x = 0; x < f.geometry.coordinates.length; x++) {
                bounds.extend(f.geometry.coordinates[x]);
            }

            map.fitBounds(bounds, {
                padding: BOUNDS_PADDING
            });

            map.setFeatureState({
                source: 'trails',
                sourceLayer: 'database-36m0mx',
                id: f.id,
            }, {
                click: true
            });
        }
    });

    /*if (favTrails.includes(trail.trail_id)) {
        var link = '<a href="#" id="favTrail" onclick="return false" data-id="' + trail.trail_id + '" data-favorite="1" class="btn btn-sm btn-yellow" style="margin-top:10px;padding:6px 9px;min-width:143px"><i class="fa-sharp fas fa-star"></i> Favorited Trail</a>';
    } else {
        var link = '<a href="#" id="favTrail" onclick="return false" data-id="' + trail.trail_id + '" data-favorite="0" class="btn btn-sm btn-yellow" style="margin-top:10px;padding:6px 9px;min-width:143px"><i class="fa-sharp far fa-star"></i> Favorite Trail</a>';
    }

    let modal = document.querySelector('#modal');

    modal.innerHTML = content.replace('{favTrailLink}', (user.uid ? link : ''));
    modal.style.display = 'flex';

    document.querySelector('#a').innerHTML = trail.title;
    document.querySelector('#j').innerHTML = '<img id="trailImg" class="placeholder" src="' + cdn + 'photos/' + trail.thumbnail + '" onerror="this.parentElement.parentElement.prepend(\'<div class=noimg></div>\');this.parentElement.remove();" style="width:100%;height:175px">';
    document.querySelector('#trailImg').style.height = 'unset';
    document.querySelector('#i').innerHTML = '<div class="leaflet-marker-icon waypoint" title="' + trail.category + '">' + trail.icon.options.html + '</div>' + trail.category;
    document.querySelector('#c').innerHTML = trail.stats.distance.toFixed(1) + '<span>mi</span>';
    document.querySelector('#d').innerHTML = numberFormat(trail.stats.elevation.max, 1) + '<span>ft</span>';
    document.querySelector('#e').innerHTML = numberFormat(trail.stats.elevation.min, 1) + '<span>ft</span>';
    document.querySelector('#f').innerHTML = numberFormat(trail.stats.altitude.gain, 1) + '<span>ft</span>';
    document.querySelector('#g').innerHTML = numberFormat(trail.stats.altitude.loss, 1) + '<span>ft</span>';
    document.querySelectorAll('#h, #j').forEach((e) => {
        e.setAttribute('href', host + trail.url);
    });

    if (trail.keywords != null && trail.keywords !== false) {
        trail.keywords.forEach(function (w) {
            k += '<div class="tag" onclick="window.open(\'' + host + 'guides/all/all-activities/' + w.replaceAll(' ', '-').toLowerCase() + '\')">#' + w.replaceAll(' ', '') + '</div>';
        });

        document.querySelector('.tags').innerHTML = k;
    } else {
        document.querySelector('.tags').remove();
    }*/
}

async function init() {
    var fields = {};

    if (settings.category) {
        fields.filter = settings.category;
    }

    if (settings.activity) {
        fields.category = settings.activity.replaceAll('-', ' ');
    }

    const resp = await fetch(apiURL + 'trails/list?key=' + key + '&filter=trail&format=1', {
        method: 'POST',
        body: JSON.stringify(fields)
    });

    if (resp.ok) {
        const t = await resp.json();

        t.trails.forEach((trail) => {
            if (trail.stats.geo) {
                let m = new mapboxgl.Marker(markerIcon(trail.category, trail.trail_id), {
                    anchor: 'center',
                    scale: 2
                })
                    .setLngLat([trail.stats.geo.start[1], trail.stats.geo.start[0]])
                    .addTo(map);

                m._element.trail_id = trail.trail_id;

                trailData.push(m);
                trailJson.push(trail);
            }
        });
        //getGIS();
    }
}

function getGIS() {
    trailData.forEach(async (e) => {
        var tid = e._element.trail_id;

        if (map.getBounds().contains(e.getLngLat()) && !trailIDs.includes(tid)) {
            const resp = await fetch(apiURL + 'trails/gis?key=' + key + '&id=' + tid);

            if (resp.ok) {
                var js = await resp.json();
                const gis = js.trail.gis;
                
                if (gis != null) {
                    /* loop through all the GIS tracks for this trail */
                    for (var i = 0; i < gis.length; i++) {
                        var sourceID = 'route_' + tid + '_' + i,
                            coords = [],
                            mbcoords = [],
                            elev = [],
                            mode = gis[i].mode,
                            dist = (gis[i].gpx.length > 1 ? gis[i].gpx[gis[i].gpx.length - 1].chart.dist : 0),
                            cap = gis[i].caption,
                            grades = []/*,
                            gradeCount = 0,
                            gradeTotal = 0*/;

                        /* loop through coordinates of the trail and parse them into array  */
                        for (var x = 0; x < gis[i].gpx.length; x++) {
                            var e = parseFloat(gis[i].gpx[x].chart.elev.toFixed(1)),
                                d = parseFloat(gis[i].gpx[x].chart.dist.toFixed(3));

                            coords.push(gis[i].gpx[x].coords);
                            mbcoords.push([parseFloat(gis[i].gpx[x].coords[1]), parseFloat(gis[i].gpx[x].coords[0])]);
                            elev.push(gis[i].gpx[x].chart.elev);

                            /* if not the first point in the GPX, calculate the slope between each point */
                            if (x > 0) {
                                var h = x - 1,
                                    f = parseFloat(gis[i].gpx[h].chart.elev.toFixed(1)),
                                    j = parseFloat(gis[i].gpx[h].chart.dist.toFixed(3));

                                var ch = (((e - f) / ((d - j) * 5280)) * 100).toFixed(1);

                                if (!isNaN(ch) && ch.search('Infinity') < 0) {
                                    /*if (ch > 100) {
                                        ch = 100;
                                    }*/

                                    grades.push(parseFloat(ch));
                                }
                            }
                        }

                        var emin = Math.round(Math.min.apply(null, elev)),
                            emax = Math.round(Math.max.apply(null, elev)),
                            avg = 0,
                            /*avg = (gradeTotal / gradeCount).toFixed(1),*/
                            max = Math.max.apply(null, grades).toFixed(1),
                            max = (max == 0 ? Math.min.apply(null, grades) : max);

                        for (var j = 0; j < grades.length; j++) {
                            avg += grades[j];
                        }
                        avg = (avg / grades.length).toFixed(1);

                        const desc = (i == 0 ? 'Trail Stats' : cap) + (hasPermission(user, actions.ADMIN) ? '<a style="display:block;text-align:center" target="blank" href="https://www.mapotechnology.com/account/admin/trails/edit?id=' + r.trail.trail_id + '">edit</a>' : '') +
                                '<div class="row"><div class="col title">Distance:</div><div class="col">' + dist.toFixed(2) +
                                ' miles (' + numberFormat(metric(dist, 'km'), 2) + ' km)</div></div><div class="row"><div class="col title">Max Elev:</div><div class="col">' + numberFormat(emax, 0) + ' ft. (' + numberFormat(metric(emax, 'm'), 1) + ' m)</div></div><div class="row">' +
                                '<div class="col title">Min Elev:</div><div class="col">' + numberFormat(emin, 0) + ' ft. (' + numberFormat(metric(emin, 'm'), 1) + ' m)</div></div>' +
                                '<div class="row"><div class="col title">Avg. Trail Slope</div><div class="col">' + avg + '%</div></div>' +
                                '<div class="row"><div class="col title">Max. Trail Slope</div><div class="col">' + max + '%</div></div>'

                        /* create a data source for the trail routes */
                        map.addSource(sourceID + '_data', {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'properties': {
                                    'id': gis[i].id,
                                    'tid': tid,
                                    'seq': i,
                                    'type': 'route',
                                    'title': (gis[i].caption ? gis[i].caption : gis[i].title),
                                    'desc': desc
                                },
                                'geometry': {
                                    'type': 'LineString',
                                    'coordinates': mbcoords
                                }
                            }
                        });

                        /* add the trail routes to the map */
                        map.addLayer({
                            'id': sourceID,
                            'type': 'line',
                            'source': sourceID + '_data',
                            'layout': {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            'paint': {
                                'line-color': gis[i].color,
                                'line-width': 6.5
                            }
                        });

                        lines.push(sourceID);
                        trailIDs.push(tid);

                        /* add extra wide polyline to map to make it easier for mobile users to click on */
                        /*L.polyline(coords, {
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
                            p.bindPopup(popup((i == 0 ? 'Trail Stats' : cap), (hasPermission(user, actions.ADMIN) ? '<a style="display:block;text-align:center" target="blank" href="https://www.mapotechnology.com/account/admin/trails/edit?id=' + r.trail.trail_id + '">edit</a>' : '') +
                                '<div class="row"><div class="col title">Distance:</div><div class="col">' + dist.toFixed(2) +
                                ' miles (' + numberFormat(metric(dist, 'km'), 2) + ' km)</div></div><div class="row"><div class="col title">Max Elev:</div><div class="col">' + numberFormat(emax, 0) + ' ft. (' + numberFormat(metric(emax, 'm'), 1) + ' m)</div></div><div class="row">' +
                                '<div class="col title">Min Elev:</div><div class="col">' + numberFormat(emin, 0) + ' ft. (' + numberFormat(metric(emin, 'm'), 1) + ' m)</div></div>' +
                                '<div class="row"><div class="col title">Avg. Trail Slope</div><div class="col">' + avg + '%</div></div>' +
                                '<div class="row"><div class="col title">Max. Trail Slope</div><div class="col">' + max + '%</div></div>'), {
                                className: 'trail-popup',
                                minWidth: 300,
                                maxWidth: 300
                            });
                        }*/

                        /*if (unique && unique == r.trail.trail_id && i == 0) {
                            map.fitBounds(p.getBounds());
                        }

                        lines.push(p);*/
                    }
                }
            }
        }
    });
}

async function getWaypoints() {
    const resp = await fetch(apiURL + 'trails/waypoints?key=' + key, {
        method: 'POST',
        body: JSON.stringify('{"filter": ' + settings.category + '}')
    });

    if (resp.ok) {
        const w = await resp.json();

        wyp = true;

        if (w.waypoints != null) {
            for (var i = 0; i < w.waypoints.length; i++) {
                var name = w.waypoints[i].name,
                    note = w.waypoints[i].note,
                    icon = w.waypoints[i].icon,
                    lat = w.waypoints[i].lat,
                    lon = w.waypoints[i].lon,
                    p;

                if (name && note != 'N/A') {
                    p = name + '<p style="margin:0;text-align:center">' + note + '</p>';
                } else if (name && note == 'N/A') {
                    p = 'Waypoint' + '<p style="margin:0;text-align:center">' + name + '</p>';
                } else if (!name && note != 'N/A') {
                    p = 'Waypoint' + '<p style="margin:0;text-align:center">' + note + '</p>';
                }

                let m = new mapboxgl.Marker(wpIcon(icon))
                    .setLngLat([lon, lat])
                    .setPopup(new mapboxgl.Popup().setHTML(p))
                    .addTo(map);

                /*if (name && note != 'N/A') {
                    p = popup(name, '<p style="margin:0;text-align:center">' + note + '</p>');
                } else if (name && note == 'N/A') {
                    p = popup('Waypoint', '<p style="margin:0;text-align:center">' + name + '</p>');
                } else if (!name && note != 'N/A') {
                    p = popup('Waypoint', '<p style="margin:0;text-align:center">' + note + '</p>');
                }

                var m = L.marker([lat, lon], {
                    icon: wpIcon(icon),
                    pane: 'waypoints',
                    trail: w.waypoints[i].trail_id,
                    title: (name ? name : '') + (note != 'N/A' ? ' / ' + note : '')
                })
                    .bindPopup(p, {
                        className: 'trail-popup d',
                        minWidth: 225,
                        maxWidth: 250
                    });

                waypoints.push(m);

                /*if ($('#waypoints').attr('data-overlay') == 1 || settings.waypoints !== false) {
                    m.addTo(map);
                }*/
            }
        }

        /*if (settings.waypoints === true) {
            waypoints.forEach((w) => {
                w.addTo(map);
            });
        }*/
    }
}

document.addEventListener('DOMContentLoaded', () => {
    var webMap = document.querySelector('#map'),
        tileChange = document.getElementById('tileChange'),
        center = settings.center,
        zoom = settings.zoom,
        tile = (settings.tile ? settings.tile : 'outdoors-v12'),
        category = (settings.category ? settings.category : null),
        activity = (settings.activity ? settings.activity.replace('-', ' ') : null),
        area = (settings.area ? settings.area.replace('-', ' ') : null);

    //getWeather(center, false);

    for (let i = 0; i < tileChange.options.length; i++) {
        if (tile == tileChange.options[i].value) {
            tileChange.options[i].selected = true;
        }
    }

    if (webMap.getAttribute('data-lat') != null && webMap.getAttribute('data-lon') != null) {
        center = [webMap.getAttribute('data-lat'), webMap.getAttribute('data-lon')];
    }

    if (webMap.getAttribute('data-zoom')) {
        zoom = webMap.getAttribute('data-zoom');
    }

    map = new mapboxgl.Map({
        container: 'map',
        center: [center[1], center[0]],
        zoom: zoom,
        minZoom: 5.76,
        hash: true,
        //style: 'mapbox://styles/mapbox/' + tile,    /*satellite-streets-v12*/
        style: 'mapbox://styles/mapollc/clnnpsgob00st01pv20978ob9',
        //accessToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3ppd3oxbGw5MmtyaXEyenRtZG5xIn0.jBgm6b3soPoBzbKjvMUwWw'
        accessToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ'
    })
    .on('load', () => {
        const colors = ['#cb2626', '#40d740', '#ff973a', '#ebeb2e', '#f977dd', '#6daee3', '#9873f0', '#ff8298', '#698d65', '#009688', '#3949ab', '#880e4f'];
        init();
        /*getWaypoints();*/

        map.addSource('avy', {
            'type': 'raster',
            'tiles': [
                //'https://d3kcsn1y1fg3m9.cloudfront.net/tiles/4/{z}/{x}/{y}.png'
                'https://www.mapotechnology.com/assets/images/tiles/4/{z}/{x}/{y}.png'
            ],
            'tileSize': 256
        });

        if (settings.category == 'snow') {
            map.addLayer({
                'id': 'avy',
                'type': 'raster',
                'source': 'avy',
                'paint': {
                    'raster-opacity': 0.5
                }
            });
        }

        map.addSource('trails', {
            type: 'vector',
            url: 'mapbox://mapollc.cp6y8yzb'
        });

        /* add trails to the map */
        map.addLayer({
            'id': 'trails',
            'type': 'line',
            'source': 'trails',
            'source-layer': 'database-36m0mx',
            'filter': ['==', 'type', (settings.category ? settings.category : 'trail')],
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-width': {
                    /*'case',
                    ['boolean', ['feature-state', 'click'], false],
                    6,
                    3*/'base': 6,
                    'stops': [
                        [6, 2],
                        [10, 5]
                    ]
                },
                'line-color': [
                    'to-color', ['get', 'color'],
                    colors[8]
                ]
            }
        });

        map.addLayer({
            'id': 'symbols',
            'type': 'symbol',
            'source': 'trails',
            'source-layer': 'database-36m0mx',
            'filter': ['==', 'type', (settings.category ? settings.category : 'trail')],
            'layout': {
                'symbol-placement': 'line',
                'text-font': ['Open Sans Regular'],
                'text-field': '{caption}',
                'text-size': 12,
                'text-justify': 'center',
                'text-letter-spacing': 0.1
            },
            'paint': {
                'text-color': '#fff',
                'text-halo-blur': 1,
                'text-halo-width': 2,
                'text-halo-color': '#444'
            }
        });

        /* add trailheads to the map */
        /*map.loadImage(
            'sprites.png',
            (error, image) => {
                if (error) throw error;

                map.addImage('ths', image);

                
            }
        );

        map.addSource('trailheads', {
            type: 'vector',
            url: 'mapbox://mapollc.clnns5sgk2xer2bno1ljsf8x4-4k2s4'
        });

        map.addLayer({
            'id': 'trailheads',
            'type': 'circle',
            'source': 'trailheads',
            'source-layer': 'trailheads',
            'paint': {
                'circle-color': '#777',
                'circle-radius': {
                    'base': 3,
                    'stops': [
                        [7, 5],
                        [10, 14]
                    ]
                }
            }
        });*/
    })/*
    .on('moveend', () => {
        if (map.getZoom() >= 12) {
            getGIS();
        }
    })
    .on('zoomend', () => {
        if (map.getZoom() >= 12) {
            getGIS();
        }
    })*/;

    map.on('click', (e) => {
        const f = map.queryRenderedFeatures([e.point.x, e.point.y], {
            layers: ['trails']
        });

        /* clicking on trail routes */
        if (f.length > 0) {
            f.forEach((feat) => {
                if (feat.layer.id == 'trails') {
                    /*if (feat.properties.delta == 0) {
                        /* open trail modal *//*
                        readTrail(feat.properties.trail_id);
                    } else {
                        /* open popup on trail */
                        let pu = new mapboxgl.Popup()
                            .setLngLat([e.lngLat.lng, e.lngLat.lat])
                            .setMaxWidth('300px')
                            .setHTML(feat.properties.caption)
                            .addTo(map);

                        pu.on('close', (e) => {
                            map.setFeatureState({
                                source: 'trails',
                                sourceLayer: 'database-36m0mx',
                                id: feat.id,
                            }, {
                                click: false
                            });
                        });

                        var bounds = new mapboxgl.LngLatBounds();

                        for (let x = 0; x < feat.geometry.coordinates.length; x++) {
                            bounds.extend(feat.geometry.coordinates[x]);
                        }

                        map.fitBounds(bounds, {
                            padding: BOUNDS_PADDING
                        });

                        map.setFeatureState({
                            source: 'trails',
                            sourceLayer: 'database-36m0mx',
                            id: feat.id,
                        }, {
                            click: true
                        });
                    //}
                }
            });
        }
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.ScaleControl({
        unit: 'imperial'
    }));

    /* change basemap on user select */
    tileChange.addEventListener('change', (e) => {
        map.setStyle('mapbox://styles/mapbox/' + e.target.value);
        /*trailIDs = [];
        getGIS();*/
    });
});
</script>

</body>
</html>