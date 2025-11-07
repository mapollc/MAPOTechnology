<?
#$settings['tile'] = 'outdoors';
#$settings = array('center' => array(39.25, -98.06), 'zoom' => 4.38, 'tile' => 'outdoors');
$state = ucwords(str_replace('-', ' ', $_GET['state']));
$county = ucwords(str_replace('-', ' ', $_GET['county']));

//$otitle = 'Map of Fire: '.($_GET['archive'] ? 'Historic '.$_GET['archive'].' ' : 'Current ').($state ? ($county ? $county.' County, ' : '').$state.' ' : '').'Wildfire, Smoke, and Lightning Map';

$otitle = 'Wildfire Map - Current Wildfires, Forest Fires, and Lightning Strikes near you - Map of Fire';

if ($_GET['archive']) {
    $odesc = 'Explore historical data on wildfires from '.$_GET['archive'].' across '.($state ? ($county ? $county.' County, ' : '').$state : 'the United States').' with Map of Fire. Discover past wildfire occurrences, their locations, sizes, and impact. Gain insights into wildfire trends over time for research, analysis, or planning.';
} else {
    $odesc = 'Get real-time updates on wildfires, smoke, and lightning strikes across '.($state ? ($county ? $county.' County, ' : '').$state : 'the United States').' with Map of Fire. Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity.';
}

// if user is loading an incident page
if (strpos($_SERVER['REQUEST_URI'], '/fires/') !== FALSE) {
    include_once('../db.ini.php');
    preg_match('/\/([0-9]{6,})\//', $_SERVER['REQUEST_URI'], $match);

    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT w.name, date, geo, acres, status, w.captured, w.updated, image, caption FROM wildfires AS w LEFT JOIN inciweb AS i ON i.state = w.state AND i.name = w.name AND i.year = w.year LEFT JOIN incident_photos AS ip ON ip.wfid = w.wfid OR ip.incidentNum LIKE CONCAT('NWCG-', i.incident_id) WHERE w.wfid = '$match[1]' LIMIT 1"));
    mysqli_close($con);
    $s = unserialize($row['status']);
    $photo = $row['image'];
    $caption = $row['caption'];
    $status = ($s['Out'] ? 'out' : ($s['Control'] ? 'controlled' : ($s['Contain'] ? 'contained' : 'active')));
    $title = $row['name'].' Fire near '.explode(' of ', $row['geo'])[1].' - Current Incident Information and Wildfire Map - Map of Fire';
    $desc = 'The '.$row['name'].' Fire, located '.$row['geo'].', is currently considered '.$status.' after starting '.ago($row['date']).', and is '.number_format($row['acres']).' acres as of '.ago(($row['updated'] ? $row['updated'] : $row['captured'])).'.';
    #$desc = 'Real-time wildfire and smoke map for the United States, including Oregon, Washington, Idaho, California, Montana, and more. See what current wildfires and wildfire perimeters are near you using Map-o-Fire.';
} else {
    $title = $otitle;
    $desc = $odesc;
}
?>
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="//server.arcgisonline.com">
    <link rel="preconnect" href="//unpkg.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <title><?=$otitle?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <meta name="description" content="<?=$odesc?>" />
    <meta property="og:title" content="<?=$otitle?>" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/preview_mapofire.png">
    <meta property="og:image:alt" content="Map of Fire: Web App preview">
    <meta property="og:image:width" content="1920">
    <meta property="og:image:height" content="1080">
    <meta property="og:site_name" content="Map of Fire" />
    <meta property="og:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>" />
    <meta property="fb:app_id" content="100092541746116" />
    <meta property="og:description" content="<?=$odesc?>" />
    <meta name="twitter:title" content="<?=$otitle?>">
    <meta name="twitter:description" content="<?=$odesc?>">
    <meta name="twitter:image" content="https://www.mapotechnology.com/assets/images/preview_mapofire.png">
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>
    <script async src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="https://www.mapotechnology.com/assets/images/mf-site.webmanifest">
    <link rel="stylesheet" href="<?=$baseURL?>src/css/mf.app-<?=$version?>.css">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Noto+Sans:wght@200;400&family=Roboto:wght@200;400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="<?=$baseURL?>src/css/mf.supp-<?=$version?>.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;700&family=Noto+Sans:wght@200;400&display=swap">
        <link rel="stylesheet" href="<?=$baseURL?>src/css/mf.supp-<?=$version?>.css">
    </noscript>    
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="canonical" href="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>" />
    <link rel="shortlink" href="https://<?=$_SERVER['HTTP_HOST'].($_SERVER['QUERY_STRING'] ? '?'.$_SERVER['QUERY_STRING'] : '')?>" />
</head>
<body data-title="<?=$otitle?>" data-desc="<?=$odesc?>">

    <nav>
        <div class="nav-wrapper">
            <div class="logo"><a href="#" onclick="window.location.href=window.location.href;return false">
                    <img src="https://www.mapotechnology.com/assets/images/mapofire_icon_transparent.png" alt="Map of Fire logo" title="Map of Fire logo">
                </a></div>
            <span id="dd-close" class="far fa-xmark"></span>
            <ul>
                <li class="ttip" id="account" data-tooltip='{"text":"Login/Create Account","dir":"right"}'><i class="fas fa-user-circle"></i><span>Login</span></li>
                <li class="ttip" id="basemap" data-tooltip='{"text":"Basemaps","dir":"right"}'><i class="fas fa-grid"></i><span>Maps</span></li>
                <li class="ttip" id="layers" data-tooltip='{"text":"Map Layers","dir":"right"}'><i class="fas fa-sharp fa-layer-group"></i><span>Layers</span></li>
                <li class="ttip" id="legend" data-tooltip='{"text":"Legend","dir":"right"}'><i class="far fa-list"></i><span>Legend</span></li>
                <li class="ttip" id="myfires" data-tooltip='{"text":"My Fires","dir":"right"}'><i class="fas fa-fire-extinguisher"></i><span>My Fires</span></li>
                <li class="ttip" id="refresh" data-tooltip='{"text":"Refresh the map","dir":"right"}'><i class="fas fa-sync"></i><span>Refresh</span></li>
                <?/*<li class="ttip" id="find" data-tooltip='{"text":"Search the map","dir":"right"}'><i class="fas fa-magnifying-glass"></i></li>*/?>
                <li class="ttip" id="archive" data-tooltip='{"text":"Archived fire maps","dir":"right"}'><i class="far fa-calendars"></i><span>Historical</span></li>
                <li class="ttip" id="report" data-active="0" data-tooltip='{"text":"Report a new fire","dir":"right"}'><i class="fas fa-location-plus"></i><span>Report</span></li>
                <?if ($_SESSION['uid']){?>
                <li class="ttip" id="save" data-tooltip='{"text":"Sync map settings","dir":"right"}'><i class="fas fa-cloud-arrow-up"></i><span>Sync</span></li>
                <li class="ttip" data-tooltip='{"text":"Logout","dir":"right"}' onclick="window.location.href='https://www.mapofire.com/logout?service=mapofire&next=<?=urlencode('https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'])?>'"><i class="far fa-right-from-bracket"></i><span>Logout</span></li>
                <?}?>
                <?/*<li id="alerts"><i class="fas fa-sharp fa-bolt"></i><div class="notify" style="background-color:#e38715">0</div><span>Notifications</span></li>*/?>
            </ul>
            <i class="fas fa-chevron-left" title="Toggle navigation" id="close-navbar" data-open="1"></i>

        </div>
    </nav>

    <div class="wrapper">
        <div id="map"></div>
        <div class="bd"></div>
        <div class="loading">
            <img src="https://www.mapotechnology.com/assets/images/mapofire_logo.png" style="height:50px">
            <div class="s"></div><span>Loading wildfires...</span>
        </div>
        
        <div class="filter-controls">
            <span id="menuIcon" class="fas fa-bars"></span>
            <div class="search control">
                <span class="far fa-magnifying-glass" style="color:var(--gray)"></span>
                <input type="text" id="q" autocomplete="off" disabled placeholder="Search for fires, cities, and more...">
                <ul id="search-results" class="control"><li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third"></i><span>Searching...</span></li></ul>
            </div>
        </div>

        <?/*<div id="weather"><div class="v"><div id="temp">--<sup>&deg;F</sup></div><div id="wind"><span><b>0</b>mph</span></div></div></div>*/?>
        <div id="modal">
            <div class="close"></div>
            <div class="content"></div>
        </div>
        <div id="impact">
            <header>
                <h2 class="title"></h2>
                <div class="impactClose"><i class="far fa-times"></i></div>
            </header>
            <div class="wrapper"></div>
        </div>
    </div>
    
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-X03WWLX3BJ');let version='<?=$version?>',buildDate='<?=$buildDate?>'<?=$_GET['archive'] ? ",historical='".$_GET['archive']."'" : ""?>,state=<?=$state ? "'".$state."'" : 'null'?>,county=<?=$county ? "'".$county."'" : 'null'?>,layers=<?=json_encode($layers)?>;</script>
    <script src="<?=$baseURL?>src/js/mf.app-<?=$version?>.js"></script>

</body>
</html>