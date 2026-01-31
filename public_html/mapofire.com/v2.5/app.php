<?
$fireType = $country == 'Austrailia' ? 'Bushfire' : ($country == 'Canada' ? 'Forest Fire' : 'Wildfire');
$parts = [];

if (!empty($country)) $parts[] = $country;
if (!empty($county)) $parts[] = $county . ' County,';
if (!empty($state)) $parts[] = $state;
$titleParts = $parts;

if (!empty($_GET['archive'])) $titleParts[] = $_GET['archive'] . ' Historical';

$title = trim(implode(' ', $titleParts) . ' ' . $fireType . ' Map: Track Live Fires, Smoke, & Lightning | Map of Fire');

if (!empty($_GET['archive'])) {
    if (!empty($state)) {
        $descLoc = (!empty($county) ? $county . ' County, ' : '') . $state;
    } elseif (!empty($country)) {
        $descLoc = $country;
    } else {
        $descLoc = 'the US';
    }

    $desc = 'Explore historical data on wildfires from ' . $_GET['archive'] . ' across ' . $descLoc . ' with Map of Fire. Discover past ' . strtolower($fireType) . ' occurrences, their locations, sizes, and impact.';
} else {
    if (!empty($state)) {
        $descLoc = (!empty($county) ? $county . ' County, ' : '') . $state;

        if (in_array(strtolower($state), $provinces)) $descLoc .= ', Canada';
    } elseif (!empty($country)) {
        $descLoc = $country;
    } else {
        $descLoc = 'the US';
    }

    $desc = 'Track ' . strtolower($fireType) . 's & smoke across ' . $descLoc . '. Monitor fire spread, intensity, and lightning strikes. Stay informed with real-time updates on Map of Fire.';
}

/*$title = ($country ? "$country " : '') . ($county ? "$county County, " : '') . ($state ? "$state " : '') . ($_GET['archive'] ? $_GET['archive'] . ' Historical ' : '') . $fireType . ' Map: Track Live Fires, Smoke, & Lightning | Map of Fire';

if ($_GET['archive']) {
    $desc = 'Explore historical data on wildfires from ' . $_GET['archive'] . ' across ' . ($state ? ($county ? $county . ' County, ' : '') . $state : ($country ? $country : 'the US')) . ' with Map of Fire. Discover past ' . strtolower($fireType) . ' occurrences, their locations, sizes, and impact.';
} else {
    $desc = 'Track ' . strtolower($fireType) . 's & smoke across ' . ($state ? ($county ? $county . ' County, ' : '') . $state . (in_array(strtolower($state), $provinces) ? ', Canada' : '') : ($country ? $country : 'the US')) . '. Monitor fire spread, intensity, and lightning strikes. Stay informed with real-time updates on Map of Fire.';
}*/

$javascript = str_replace(['{{title}}', '{{desc}}'], [$title, $desc], $javascript);
?>
<!DOCTYPE html>
<html lang="en-US">

<head>
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//fonts.gstatic.com" crossorigin>
    <title><?= $title ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <meta name="description" content="<?= $desc ?>" />
    <meta property="og:title" content="<?= $title ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://mapotechnology.com/assets/images/preview_mapofire.png">
    <meta property="og:image:alt" content="Map of Fire: Web App preview">
    <meta property="og:image:width" content="1920">
    <meta property="og:image:height" content="1080">
    <meta property="og:site_name" content="Map of Fire" />
    <meta property="og:url" content="https://<?= $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?>" />
    <meta property="og:description" content="<?= $desc ?>" />
    <meta name="twitter:title" content="<?= $title ?>">
    <meta name="twitter:description" content="<?= $desc ?>">
    <meta name="twitter:image" content="https://mapotechnology.com/assets/images/preview_mapofire.png">
    <script async src="//kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <link rel="manifest" href="https://www.mapotechnology.com/assets/images/mf-site.webmanifest">
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/maplibre-gl@<?= $maplibreVersion ?>/dist/maplibre-gl.min.css" media="print" onload="this.media='all'">
    <? if (isset($_GET['version'])) { ?>
        <link rel="stylesheet" href="<?= $baseURL ?>v<?= $version ?>/mf.app.css">
        <link rel="preload" href="<?= $baseURL ?>v<?= $version ?>/mf.supp.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <? } else { ?>
        <link rel="stylesheet" href="<?= $baseURL ?>src/css/mf.app-<?= $version ?>.css">
        <link rel="preload" href="<?= $baseURL ?>src/css/mf.supp-<?= $version ?>.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <? } ?>
    <link rel="preload" href="//mapotechnology.com/src/css/global.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//mapotechnology.com/src/css/global.css">
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap">
        <? if (isset($_GET['version'])) { ?>
            <link rel="stylesheet" href="<?= $baseURL ?>v<?= $version ?>/mf.supp.css" media="print" onload="this.media='all'">
        <?} else { ?>
            <link rel="stylesheet" href="<?= $baseURL ?>src/css/mf.supp-<?= $version ?>.css" media="print" onload="this.media='all'">
        <? } ?>
    </noscript>
    <link rel="canonical" href="https://<?= $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?>" />
    <? if ($_GET['wfid']) { ?>
        <link rel="shortlink" href="https://<?= "$_SERVER[HTTP_HOST]/f/$_GET[wfid]" ?>" />
    <? } ?>
</head>

<body>

    <div class="android-banner">
        <div class="inner">
            <span class="dismiss far fa-xmark" data-action="close-android"></span>
            <div class="icon"></div>
            <div class="text"><b>Map of Fire: Wildfire Map</b><span>Download on the Google Play Store</span></div>
        </div>
        <a href="https://play.google.com/store/apps/details?id=com.mapollc.mapofire" class="btn btn-sm btn-yellow play_store_download" style="margin:0">Download</a>
    </div>

    <main>
        <nav id="app-nav">
            <div class="nav-wrapper">
                <div class="logo">
                    <a href="#" onclick="window.location.href=window.location.href;return false">
                        <img src="https://www.mapotechnology.com/assets/images/mapofire_icon_transparent.png" alt="Map of Fire logo" title="Map of Fire">
                    </a>
                </div>
                <span id="dd-close" data-action="dropdown-nav" class="far fa-xmark"></span>
                <ul>
                    <li id="account" data-action="account"><i class="fas fa-user-circle"></i><span>Login</span></li>
                    <li id="new_fires" style="display:none"><i class="fas fa-fire-flame"></i><span>New Fires</span></li>
                    <li data-action="basemap"><i class="far fa-grid"></i><span>Maps</span></li>
                    <li data-action="layers"><i class="far fa-layer-group"></i><span>Layers</span></li>
                    <li id="legend" data-action="legend"><i class="far fa-list"></i><span>Legend</span></li>
                    <li data-action="myfires"><i class="far fa-display-chart-up"></i><span>My Fires</span></li>
                    <li id="refresh" data-action="refresh"><i class="far fa-sync"></i><span>Refresh</span></li>
                    <li id="report" data-action="report" data-active="0"><i class="far fa-location-plus"></i><span>Report</span></li>
                    <li id="save" data-action="save"><i class="far fa-cloud-arrow-up"></i><span>Sync</span></li>
                </ul>
                <i class="fas fa-chevron-left" title="Toggle navigation" id="close-navbar" data-action="close-navbar" data-open="1"></i>
            </div>
        </nav>

        <div class="app-wrapper">
            <div id="map"></div>
            <div class="bd"></div>
            <div class="loading">
                <img src="//mapotechnology.com/assets/images/mapofire_logo_200.png" fetchpriority="high" alt="Map of Fire logo" title="Map of Fire" style="height:50px">
                <div class="s"></div><span>Loading wildfires...</span>
            </div>

            <div class="filter-controls">
                <span id="menuIcon" data-action="dropdown-nav" class="fas fa-bars"></span>
                <div class="search control">
                    <span class="far fa-magnifying-glass"></span>
                    <input type="text" id="q" autocomplete="off" disabled placeholder="Search wildfires, cities, or coordinates">
                    <span id="clearSearch" data-action="clear-search" class="far fa-xmark"></span>
                    <ul id="search-results" class="control">
                        <li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third"></i><span>Searching...</span></li>
                    </ul>
                </div>
                <!--<div class="tools control"></div>-->
            </div>
        </div>

        <div id="modal">
            <div class="close" data-action="close-modal">
                <div class="handle"></div>
            </div>
            <div class="content"></div>
        </div>

        <div id="impact">
            <header>
                <h2 class="title"></h2>
                <div class="impactClose" data-action="close-impact"><i class="fat fa-times"></i></div>
            </header>
            <div class="wrapper"></div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@<?= $maplibreVersion ?>/dist/maplibre-gl.min.js"></script>
    <? if (!isset($_GET['version'])) { ?>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>
    <? } ?>
    <script><?= $javascript ?></script>
    <? if (isset($_GET['version'])) { ?>
        <script src="<?= $baseURL . 'v' . $version ?>/mf.app.js"></script>
        <script defer src="<?= $baseURL . 'v' . $version ?>/mf.supp.js"></script>
        <script async defer src="<?= $baseURL . 'v' . $version ?>/arcgis.js"></script>
    <? } else { ?>
        <script src="<?= $baseURL ?>src/js/mf.app-<?= $version ?>.js"></script>
        <script defer src="<?= $baseURL ?>src/js/mf.supp-<?= $version ?>.js"></script>
        <script async defer src="<?= $baseURL ?>src/js/arcgis-<?= $version ?>.js"></script>
    <? } ?>
</body>

</html>