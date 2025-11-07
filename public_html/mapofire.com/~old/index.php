<?
if (unserialize($_SESSION['settings'])['center'] != null) {
    $settings = unserialize($_SESSION['settings']);
} else {
    $settings = array('center' => array(45.05606124274415, -117.75695800781251),
                    'zoom' => 7,
                    'tile' => 'terrain',
                    'perimeters' => array('minSize' => 500, 'color' => 'default', 'zoom' => 1),
                    'saveFreq' => 30000);
}
$jsversion = array($version, (substr($version, -2) == '.0' ? substr($version, 0, -2) : $version));

if ($_GET['state']) {
    //$settings['state'] = $_GET['state'];
    $state = ucwords(str_replace('-', ' ', $_GET['state']));

    if ($_GET['county']) {
        //$settings['county'] = $_GET['county'];
        $county = ucwords(str_replace('-', ' ', $_GET['county']));
    }
}

if ($_GET['archive']) {
    $settings['archive'] = $_GET['archive'];
}

$otitle = ($_GET['archive'] ? $_GET['archive'].' Historic' : 'Current').' '.($state && $county ? $county.' County, ' : '').($state ? $state : 'U.S. & Canada').' Wildfire, Forest Fire & Lightning Strike Map - MAP-o-Fire';
$odesc = 'See all '.($_GET['archive'] ? $_GET['archive'].' historical' : 'current burning').' wildfires, lightning strikes, air quality, and smoke forecasts for '.($state && $county ? $county.' County, ' : '').($state ? $state : 'the United States and Canada').' using the MAP-o-Fire web app.';

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
    <link rel="preconnect" href="//fonts.gstatic.com/">
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
    <meta name="robots" content="index,follow">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" media="print" onload="this.onload=null;this.removeAttribute('media');">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="stylesheet" href="<?=$baseURL?>src/css/main-<?=$version?>.css">
    <script async defer src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
    <link rel="canonical" href="<?=substr($baseURL, 0, -1).$_SERVER['REQUEST_URI']?>" />
    <link rel="shortlink" href="<?echo $baseURL; if ($_GET){ echo '?'; foreach($_REQUEST as $a => $b) { $c .= $a.'='.$b.'&'; } echo substr($c, 0, -1); }?>" />
</head>
<body class="mapofire" data-t="<?=$otitle?>" data-d="<?=$odesc?>">

<?if(strpos($_SERVER['REQUEST_URI'], '/wildfire/') === false && $android != 1) {?>
<div id="loading">
    <div class="content">
        <img src="https://www.mapotechnology.com/assets/images/mapofire_logo.png" style="width:250px;height:65.5px" title="Map-o-Fire logo" alt="Map-o-Fire logo">
        <div class="spinner s2" data-progress="0" style="margin:15px 0"></div>
        <div class="progress"><span>Getting wildfires...</span></div>
    </div>
</div>
<?}?>

<div id="map"<?=($android == 1 ? ' class="android"' : '').($state ? ' data-state="'.$state.'"' : '').($county ? ' data-county="'.$county.'"' : '')?>>
    <?if($android != 1){?><div class="logo"><a href="https://www.mapofire.com"><img src="https://www.mapotechnology.com/assets/images/mapo_logo_square_transparent.png" style="width:65px;height:65px" title="MAPO LLC" alt="MAPO LLC logo"></a></div><?}?>
</div>

<div class="select" id="tileChange" data-selected>
    <div class="select-styled" style="min-width:155px"></div>
    <ul class="select-options" style="min-width:155px"></ul>
</div>

<div class="select" id="yearChange" data-selected>
    <div class="select-styled" style="min-width:155px"></div>
    <ul class="select-options" style="min-width:155px"></ul>
</div>

<div class="searchControl in-use">
    <i class="far fa-magnifying-glass"></i>
    <input type="text" id="q" autocomplete="off" placeholder="Search for fires, cities, states...">
    <i class="fas fa-times" id="closeSearch"></i>
</div>
<div id="search-results"></div>

<div class="controlContainer">
    <div class="control" id="local"><i class="fas fa-bell"></i></div>
    <?if($android != 1 || ($android == 1 && $_SESSION['uid'])){?><div class="control ttip" id="account" data-tooltip='{"text":"<?=($_SESSION['uid'] ? 'Manage map settings' : 'Login/Create Account')?>","dir":"right"}'><i class="fa<?=($_SESSION['uid'] ? 's' : 't')?> fa-user-circle"></i></div><?}?>
    <?if($android != 1){?><div class="control ttip" id="mylocation" data-tooltip='{"text":"Find my location","dir":"right"}'><i class="fas fa-location-arrow"></i></div><?}?>
    <div class="control ttip" id="layers" data-tooltip='{"text":"Map Layers","dir":"right"}'><i class="fas fa-sharp fa-layer-group"></i></div>
    <div class="control ttip" id="basemap" data-tooltip='{"text":"Basemaps","dir":"right"}'><i class="fas fa-grid"></i></div>
    <div class="control ttip" id="legend" data-tooltip='{"text":"Legend","dir":"right"}'><i class="far fa-list"></i></div>
    <div class="control ttip" data-tooltip='{"text":"Refresh the map","dir":"right"}' onclick="location.reload();return false"><i class="fas fa-sync"></i></div>
    <?/*<div class="control ttip" id="find" data-tooltip='{"text":"Search the map","dir":"right"}'><i class="fas fa-magnifying-glass"></i></div>*/?>
    <div class="control ttip" id="archive" data-tooltip='{"text":"Archived fire maps","dir":"right"}'><i class="far fa-calendars"></i></div>
    <div class="control ttip" id="report" data-active="0" data-tooltip='{"text":"Report a new fire","dir":"right"}'><i class="fas fa-location-plus"></i></div>
    <div class="control ttip" id="save" data-tooltip='{"text":"Sync map settings","dir":"right"}'><i class="fas fa-cloud-arrow-up"></i></div>
    <div class="control" id="alerts"><i class="fas fa-sharp fa-bolt"></i><div class="notify" style="background-color:#e38715">0</div></div>
</div>

<div class="legend"></div>

<div id="radarControl">
    <span class="time">--</span>
    <div class="cont">
        <i class="fad fa-circle-pause" id="radarPause" data-pause="0"></i>
        <input type="range" min="0" max="12" value="0">
    </div>
</div>

<div id="modal">
    <div class="close"></div>
    <div class="content"></div>
</div>

<div id="impact" data-open="0">
    <div class="impactClose" onclick="closeImpact()"><i class="far fa-times"></i></div>
    <div class="wrapper"></div>
</div>

<div id="tracked"></div>

<i class="fa-regular fa-wifi-slash" style="font-size:0.5px"></i>

<div id="g_id_onload" data-client_id="27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com" data-context="signin" data-ux_mode="popup" data-callback="loginWithGoogle" data-auto_prompt="false"></div>

<script>var isAndroid = <?=($android == 1 ? 1 : 0)?>, ver = <?=json_encode($jsversion)?>, allVers = <?=json_encode($allVersions)?>, settings = <?=json_encode($settings)?>, layers = <?=json_encode($layers)?>, dispatchCenters = <?=json_encode($dc)?>;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X03WWLX3BJ');</script>
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/proj4@2.8.0/dist/proj4-src.min.js"></script>
<script src="<?=$baseURL?>src/js/utilities-<?=$version?>.js?<?=time()?>"></script>
<script src="<?=$baseURL?>src/js/forms-<?=$version?>.js"></script>
<script async src="<?=$baseURL?>src/js/main-<?=$version?>.js?<?=time()?>"></script>
<script defer src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>

</body>
</html>