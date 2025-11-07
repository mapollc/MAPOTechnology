<?
$jsversion = array($version, (substr($version, -2) == '.0' ? substr($version, 0, -2) : $version));

if ($_GET['state']) {
    //$settings['state'] = $_GET['state'];
    $state = ucwords(str_replace('-', ' ', $_GET['state']));
    $settings['state'] = $state;

    if ($_GET['county']) {
        //$settings['county'] = $_GET['county'];
        $county = ucwords(str_replace('-', ' ', $_GET['county']));
        $settings['county'] = $county;
    }
}

if ($_GET['archive']) {
    $settings['archive'] = $_GET['archive'];
}

$otitle = ($state ? ($county ? $county.' County, ' : '').$state : '').' Map of Fire: '.($_GET['archive'] ? 'Historic '.$_GET['archive'].' ' : 'Current ').(!$state ? 'US ' : '').'Wildfire, Smoke, and Lightning Map';
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
    $title = $row['name'].' Fire near '.explode(' of ', $row['geo'])[1].' - Current Incident Information and Wildfire Map - MAP-o-Fire';
    $desc = 'The '.$row['name'].' Fire, located '.$row['geo'].', is currently considered '.$status.' after starting '.ago($row['date']).', and is '.number_format($row['acres']).' acres as of '.ago(($row['updated'] ? $row['updated'] : $row['captured'])).'.';
    #$desc = 'Real-time wildfire and smoke map for the United States, including Oregon, Washington, Idaho, California, Montana, and more. See what current wildfires and wildfire perimeters are near you using Map-o-Fire.';
} else {
    $title = $otitle;
    $desc = $odesc;
}

$dc = json_decode(file_get_contents('https://api.mapotechnology.com/v1/dispatch/all?format=1&key=c196d0958608ad2b7d4af2be078ecc54'))->dispatch;
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$title?></title>
    <link rel="preconnect" href="//server.arcgisonline.com">
    <link rel="preconnect" href="//unpkg.com">
    <link rel="preconnect" href="//fonts.gstatic.com/" crossorigin>
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?>">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Map-o-Fire">
    <meta property="og:url" content="<?=$baseURL.(strpos($_SERVER['REQUEST_URI'], '/wildfire/') !== FALSE ? substr($_SERVER['REQUEST_URI'], 1) : '')?>">
    <meta property="og:image" content="https://www.mapotechnology.com/assets/<?=($photo ? $photo : 'images/mapo_logo_square.png')?>">
    <meta property="og:image:alt" content="<?=($photo ? $caption : 'MAPO LLC')?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?=$baseURL.(strpos($_SERVER['REQUEST_URI'], '/wildfire/') !== FALSE ? substr($_SERVER['REQUEST_URI'], 1) : '')?>">
    <meta property="twitter:title" content="<?=$title?>">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="https://www.mapotechnology.com/assets/<?=($photo ? $photo : 'images/mapo_logo_square.png')?>">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <meta name="robots" content="index,follow">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@400;600&family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@400;600&family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" media="print" onload="this.onload=null;this.removeAttribute('media');">
    <link rel="preload" href="https://www.mapotechnology.com/src/css/global.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css"></noscript>
    <link rel="stylesheet" href="<?=$baseURL?>src/css/main-<?=$version?>.css">
    <?/*<link rel="stylesheet" href="v<?=$version?>/main.css">*/?>
    <link rel="canonical" href="<?=substr($baseURL, 0, -1).$_SERVER['REQUEST_URI']?>" />
    <link rel="shortlink" href="<?echo $baseURL; if ($_GET){ echo '?'; foreach($_REQUEST as $a => $b) { $c .= $a.'='.$b.'&'; } echo substr($c, 0, -1); }?>" />
</head>
<body class="mapofire">

<nav>
    <div class="nav-wrapper">
        <div class="logo"><a href="#" onclick="window.location.href=window.location.href;return false"><img src="https://www.mapotechnology.com/assets/images/mapofire_icon_transparent.png"></a></div>
        <ul>
            <?if($android != 1 || ($android == 1 && $_SESSION['uid'])){?><li class="ttip" id="account" data-tooltip='{"text":"<?=($_SESSION['uid'] ? 'Manage map settings' : 'Login/Create Account')?>","dir":"right"}'><i class="fas fa-user-circle"></i><span><?=($_SESSION['uid'] ? 'Account' : 'Login')?></span></li><?}?>
            <?if($android != 1){?><li class="ttip" id="mylocation" data-tooltip='{"text":"Find my location","dir":"right"}'><i class="fas fa-location-arrow"></i><span>Location</span></li><?}?>
            <li class="ttip" id="basemap" data-tooltip='{"text":"Basemaps","dir":"right"}'><i class="fas fa-grid"></i><span>Maps</span></li>
            <li class="ttip" id="layers" data-tooltip='{"text":"Map Layers","dir":"right"}'><i class="fas fa-sharp fa-layer-group"></i><span>Layers</span></li>
            <li class="ttip" id="legend" data-tooltip='{"text":"Legend","dir":"right"}'><i class="far fa-list"></i><span>Legend</span></li>
            <li class="ttip" id="refresh" data-tooltip='{"text":"Refresh the map","dir":"right"}'><i class="fas fa-sync"></i><span>Refresh</span></li>
            <?/*<li class="ttip" id="find" data-tooltip='{"text":"Search the map","dir":"right"}'><i class="fas fa-magnifying-glass"></i></li>*/?>
            <li class="ttip" data-tooltip='{"text":"Donate","dir":"left"}' onclick="window.location.href='https://buy.stripe.com/6oEdTx7PFdAJ8YU3cc'"><i class="fas fa-circle-dollar-to-slot"></i><span>Donate</span></li>
            <li class="ttip" id="archive" data-tooltip='{"text":"Archived fire maps","dir":"right"}'><i class="far fa-calendars"></i><span>Historical</span></li>
            <li class="ttip" id="report" data-active="0" data-tooltip='{"text":"Report a new fire","dir":"right"}'><i class="fas fa-location-plus"></i><span>Report</span></li>
            <li class="ttip" id="save" data-tooltip='{"text":"Sync map settings","dir":"right"}'><i class="fas fa-cloud-arrow-up"></i><span>Sync</span></li>
            <?if ($_SESSION['uid']){?>
            <li class="ttip" data-tooltip='{"text":"Logout","dir":"right"}' onclick="window.location.href='https://www.mapofire.com/logout?service=mapofire&next=<?=urlencode('https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'])?>'"><i class="far fa-right-from-bracket"></i><span>Logout</span></li>
            <?}?>
            <?/*<li id="alerts"><i class="fas fa-sharp fa-bolt"></i><div class="notify" style="background-color:#e38715">0</div><span>Notifications</span></li>*/?>
        </ul>
        <i class="fas fa-chevron-left" id="close-navbar" data-open="1"></i>
    </div>
</nav>

<?/*<div class="marketing" style="padding-left:calc(.75em + var(--nav-width))">
    <div>
        <span>Upgrade to Map-o-Fire Premium to access additional features.</span>
        <a class="btn btn-xs btn-light-blue" style="font-size:15px;margin:0" href="https://www.mapotechnology.com/checkout?price_id=<?=$mapoSubscriptions['mapofire'][($stripeLive ? 'live' : 'test')]?>&host=mapofire.com&return=<?=urlencode($_SERVER['REQUEST_URI'])?>">Upgrade</a>
    </div>
    <i class="far fa-xmark" onclick="this.parentElement.remove()"></i>
</div>*/?>

<div class="wrapper">
    <div id="map"<?=($android == 1 ? ' class="android"' : '').($state ? ' data-state="'.$state.'"' : '').($county ? ' data-county="'.$county.'"' : '')?>></div>

    <div class="searchControl">
        <i class="far fa-magnifying-glass"></i>
        <input type="text" id="q" autocomplete="off" placeholder="Search for fires, cities, states...">
        <i class="fas fa-times" id="closeSearch" style="display:none"></i>
    </div>
    <div id="search-results"></div>

    <div id="radarControl">
        <span class="time">--</span>
        <div class="cont">
            <i class="fad fa-circle-pause" id="radarPause" data-pause="0"></i>
            <input type="range" min="0" max="12" value="0">
        </div>
    </div>
</div>

<div id="modal">
    <div class="close"></div>
    <div class="content"></div>
</div>

<div id="impact">
    <header>
        <h2 class="title"></h2>
        <div class="impactClose" onclick="closeImpact()"><i class="far fa-times"></i></div>
    </header>
    <div class="wrapper"></div>
</div>

<div class="alert"></div>
<div id="tracked"></div>

<i class="fa-regular fa-wifi-slash" style="font-size:0.5px"></i>

<script>let isAndroid=<?=($android == 1 ? 1 : 0)?>,ver=<?=json_encode($jsversion)?>,allVers=<?=json_encode($allVersions)?>,settings=<?=json_encode($settings)?>,layers=<?=json_encode($layers)?>,dispatchCenters=<?=json_encode($dc)?>;</script>
<script async src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="<?=$baseURL?>src/js/utilities-<?=$version?>.js"></script>
<script src="<?=$baseURL?>src/js/forms-<?=$version?>.js"></script>
<script src="<?=$baseURL?>src/js/main-<?=$version?>.js"></script>
<?/*<script src="v<?=$version?>/utilities.js?<?=time()?>"></script>
<script src="v<?=$version?>/forms.js"></script>
<script async src="v<?=$version?>/main.js?<?=time()?>"></script>*/?>
<script async src="https://cdn.jsdelivr.net/npm/proj4@2.8.0/dist/proj4-src.min.js"></script>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X03WWLX3BJ');</script>

</body>
</html>