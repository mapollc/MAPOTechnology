<?
$title = ($county ? "$county County, " : '').($state ? "$state " : '').($_GET['archive'] ? $_GET['archive'].' Historical ' : '').'Wildfire Map: Track Live Fires, Smoke, & Lightning | Map of Fire';

if ($_GET['archive']) {
    $desc = 'Explore historical data on wildfires from '.$_GET['archive'].' across '.($state ? ($county ? $county.' County, ' : '').$state : 'the US').' with Map of Fire. Discover past wildfire occurrences, their locations, sizes, and impact.';
} else {
    $desc = 'Track wildfires & smoke across '.($state ? ($county ? $county.' County, ' : '') . $state . (in_array(strtolower($state), $provinces) ? ', Canada' : '') : 'the US').'. Monitor fire spread, intensity, and lightning strikes. Stay informed with real-time updates on Map of Fire.';
}

$javascript = str_replace(['{{title}}', '{{desc}}'], [$title, $desc], $javascript);
?>
<!DOCTYPE html>
<html lang="en-US">
<head>
    <link rel="preconnect" href="//api.mapbox.com">
    <link rel="preconnect" href="//server.arcgisonline.com">
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <title><?=$title?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <meta name="description" content="<?=$desc?>" />
    <meta property="og:title" content="<?=$title?>" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/preview_mapofire.png">
    <meta property="og:image:alt" content="Map of Fire: Web App preview">
    <meta property="og:image:width" content="1920">
    <meta property="og:image:height" content="1080">
    <meta property="og:site_name" content="Map of Fire" />
    <meta property="og:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>" />
    <meta property="fb:app_id" content="100092541746116" />
    <meta property="og:description" content="<?=$desc?>" />
    <meta name="twitter:title" content="<?=$title?>">
    <meta name="twitter:description" content="<?=$desc?>">
    <meta name="twitter:image" content="https://www.mapotechnology.com/assets/images/preview_mapofire.png">
    <script async src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="https://www.mapotechnology.com/assets/images/mf-site.webmanifest">
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v<?=$mapboxVersion?>/mapbox-gl.css">
    <link rel="stylesheet" href="<?=$baseURL?>src/css/mf.app-<?=$version?>.css">
    <?if($dark_mode){?>
    <link rel="stylesheet" href="<?=$baseURL?>src/css/mf.app-dark_mode-<?=$version?>.css">
    <?}?>
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="<?=$baseURL?>src/css/mf.supp-<?=$version?>.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap">
        <link rel="stylesheet" href="<?=$baseURL?>src/css/mf.supp-<?=$version?>.css">
    </noscript>
    <link rel="canonical" href="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>" />
    <?if($_GET['wfid']){?>
    <link rel="shortlink" href="https://<?="$_SERVER[HTTP_HOST]/f/$_GET[wfid]"?>" />
    <?}?>
</head>
<body<?=$dark_mode ? ' class="dark-mode"' : ''?>>

    <div class="android-banner">
        <div class="inner">
            <span class="dismiss far fa-xmark" onclick="this.parentElement.parentElement.remove()"></span>
            <div class="icon"></div>
            <div class="text"><b>Map of Fire: Wildfire Map</b><span>Download on the Google Play Store</span></div>
        </div>
        <a href="https://play.google.com/store/apps/details?id=com.mapollc.mapofire" class="btn btn-sm btn-yellow play_store_download" style="margin:0">Download</a>
    </div>

    <div class="main">
        <nav>
            <div class="nav-wrapper">
                <div class="logo">
                    <a href="#" onclick="window.location.href=window.location.href;return false">
                        <img loading="lazy" src="https://www.mapotechnology.com/assets/images/mapofire_icon_transparent.png" alt="Map of Fire logo" title="Map of Fire logo">
                    </a>
                </div>
                <span id="dd-close" data-action="dropdown-nav" class="far fa-xmark"></span>
                <ul>
                    <li class="ttip" id="account" data-action="account" data-tooltip='{"text":"Login/Create Account","dir":"right"}'><i class="fas fa-user-circle"></i><span>Login</span></li>
                    <li class="ttip" data-action="donate" data-tooltip='{"text":"Donate","dir":"right"}'><i class="fas fa-heart"></i><span>Donate</span></li>
                    <li class="ttip" data-action="basemap" data-tooltip='{"text":"Basemaps","dir":"right"}'><i class="fas fa-grid"></i><span>Maps</span></li>
                    <li class="ttip" data-action="layers" data-tooltip='{"text":"Map Layers","dir":"right"}'><i class="fas fa-sharp fa-layer-group"></i><span>Layers</span></li>
                    <li class="ttip" data-action="legend" data-tooltip='{"text":"Legend","dir":"right"}'><i class="far fa-list"></i><span>Legend</span></li>
                    <li class="ttip" id="fwf" data-action="fwf" data-tooltip='{"text":"Fire Weather","dir":"right"}'><i class="far fa-cloud-bolt"></i><span>Fire WX</span></li>
                    <li class="ttip" data-action="myfires" data-tooltip='{"text":"My Fires","dir":"right"}'><i class="fas fa-fire-extinguisher"></i><span>My Fires</span></li>
                    <li class="ttip" data-action="refresh" data-tooltip='{"text":"Refresh the map","dir":"right"}'><i class="fas fa-sync"></i><span>Refresh</span></li>
                    <li class="ttip" data-action="archive" data-tooltip='{"text":"Archived fire maps","dir":"right"}'><i class="far fa-calendars"></i><span>Historical</span></li>
                    <li class="ttip" id="report" data-action="report" data-active="0" data-tooltip='{"text":"Report a new fire","dir":"right"}'><i class="fas fa-location-plus"></i><span>Report</span></li>
                    <li class="ttip" id="save" data-action="save" data-tooltip='{"text":"Sync map settings","dir":"right"}'><i class="fas fa-cloud-arrow-up"></i><span>Sync</span></li>
                    <?/*<li class="ttip" id="logout" data-action="logout" data-tooltip='{"text":"Logout","dir":"right"}'><i class="far fa-right-from-bracket"></i><span>Logout</span></li>
                    <li><label class="switch"><input id="dark_mode" type="checkbox"<?=$dark_mode ? ' checked' : ''?>><div class="slider"></div></label><span>Dark Mode</span></li>*/?>
                </ul>
                <i class="fas fa-chevron-left" title="Toggle navigation" id="close-navbar" data-action="close-navbar" data-open="1"></i>

            </div>
        </nav>

        <div class="wrapper">
            <div id="map"></div>
            <div class="bd"></div>
            <div class="loading">
                <img src="https://www.mapotechnology.com/assets/images/mapofire_logo.png" alt="Map of Fire logo" title="Map of Fire logo" style="height:50px">
                <div class="s"></div><span>Loading wildfires...</span>
            </div>
            
            <div class="filter-controls">
                <span id="menuIcon" data-action="dropdown-nav" class="fas fa-bars"></span>
                <div class="search control">
                    <span class="far fa-magnifying-glass" style="color:var(--gray)"></span>
                    <input type="text" id="q" autocomplete="off" disabled placeholder="Search for fires, cities, and more...">
                    <ul id="search-results" class="control"><li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third"></i><span>Searching...</span></li></ul>
                </div>
            </div>
            </div>

            <div id="modal">
                <div data-action="close-modal" class="close"></div>
                <div class="content"></div>
            </div>
            <div id="impact">
                <header>
                    <h2 class="title"></h2>
                    <div class="impactClose" data-action="close-impact"><i class="far fa-times"></i></div>
                </header>
                <div class="wrapper"></div>
            </div>
        </div>
    </div>

    <script src="https://api.mapbox.com/mapbox-gl-js/v<?=$mapboxVersion?>/mapbox-gl.js"></script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>
    <script><?=$javascript?></script>
    <?if(isset($_GET['version'])){?>
    <script src="<?=$baseURL.'v'.$version?>/mf.app.js"></script>
    <script defer src="<?=$baseURL.'v'.$version?>/mf.supp.js"></script>
    <?}else{?>
    <script src="<?=$baseURL?>src/js/mf.app-<?=$version?>.js"></script>
    <script defer src="<?=$baseURL?>src/js/mf.supp-<?=$version?>.js"></script>
    <?}?>
</body>
</html>