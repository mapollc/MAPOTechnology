<?
if ($_GET['tid']) {
    $json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/trails/guide/short?key=cf707f0516e5c1226835bbf0eece4a0c&id='.$_GET['tid']))->guide;
    $metaimg = 'https://cdn.mapotrails.com/photos/'.$json->photo;
    $title = $json->title.' - Online Recreation Mapping';
    $desc = $json->route;
    $settings['category'] = $json->type;
} else {
    $doing = ($_GET['activity'] ? ing(ucwords(str_replace('-', ' ', $_GET['activity']))) : ($_GET['category'] == 'snow' ? 'Snowmobile, Backcountry Ski, and Nordic Ski' : 'Hiking, Mountain Bike, and Gravel & Road Bike'));
    $title = $doing . ' Trail Maps'.($_GET['area'] ? ' near '.ucwords(str_replace('-', ' ', $_GET['area'])) : '');
    $desc = 'Find trails to '.($_GET['activity'] ? str_replace('-', ' ', $_GET['activity']) : 'hike, mountain bike, ski, and snowmobile').' '.($_GET['area'] ? 'near '.ucwords(str_replace('-', ' ', $_GET['area'])) : 'in Oregon, Idaho, Utah, and California').' using Map of Trails, a recreation mapping app.';
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title><?=$title?> | Map of Trails</title>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//kit.fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//api.mapbox.com">
    <link rel="preconnect" href="//mapbox.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?> - Map of Trails">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Map of Trails">
    <meta property="og:url" content="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>">
    <meta property="og:image" content="<?=($metaimg ? $metaimg : 'https://www.mapotechnology.com/assets/images/mapotrails_logo.png')?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>">
    <meta property="twitter:title" content="<?=$title?> - Map of Trails">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="<?=($metaimg ? $metaimg : 'https://www.mapotechnology.com/assets/images/mapotrails_logo.png')?>">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#00385c">
    <meta name="robots" content="index,follow">
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mt-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mt-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mt-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mt-favicon.ico" type="image/x-icon" />
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" rel="stylesheet">
    <script async src="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.js"></script>
    <script async src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="<?=$domain?>src/css/mt.app-<?=$version?>.css">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Roboto:wght@200;400;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="<?=$domain?>src/css/mt.supp-<?=$version?>.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="<?=$domain?>src/css/wx.icons-<?=$version?>.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;600&family=Noto+Sans:wght@200;400&display=swap">
        <link rel="stylesheet" href="<?=$domain?>src/css/mt.supp-<?=$version?>.css">
        <link rel="stylesheet" href="<?=$domain?>src/css/wx.icons-<?=$version?>.css">
    </noscript>    
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="canonical" href="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>" />
</head>
<body>

    <nav>
        <div class="nav-wrapper">
            <div class="logo"><a href="#" onclick="window.location.href=window.location.href;return false">
                <img src="https://www.mapotechnology.com/assets/images/mapotrails_icon_transparent.png" alt="Map of Trails logo" title="Map of Trails logo">
            </a></div>
            <span id="dd-close" class="far fa-xmark"></span>
            <ul>
                <?if ($android != 1) {?>
                    <li id="account" class="ttip" data-tooltip='{"text":"<?= ($_SESSION['uid'] ? 'Your Account' : 'Login') ?>","dir":"left"}'><i class="fas fa-user-circle"></i><span><?= ($_SESSION['uid'] ? 'Account' : 'Login') ?></span></li>
                <?}?>
                <li id="basemap" class="ttip" data-tooltip='{"text":"Basemaps","dir":"left"}'><i class="fas fa-grid"></i><span>Maps</span></li>
                <li id="layer-group" class="ttip" data-tooltip='{"text":"Layers","dir":"left"}'><i class="fas fa-layer-group"></i><span>Layers</span></li>
                <?if ($android != 1) {?>
                    <li id="custom" class="ttip" data-tooltip='{"text":"Your saved content","dir":"left"}'><i class="fas fa-folders"></i><span>Content</span></li>
                    <li id="import" class="ttip" data-tooltip='{"text":"Import a file","dir":"left"}'><i class="far fa-file-import"></i><span>Upload</span></li>
                <?}?>
                <li id="save" class="ttip" data-tooltip='{"text":"Sync map settings","dir":"left"}'><i class="fas fa-cloud-arrow-up"></i><span>Sync</span></li>
                <!--<li id="mylocation" class="ttip" data-tooltip='{"text":"Find my location","dir":"left"}'><i class="fas fa-location-arrow"></i><span>Location</span></li>-->
                <li class="ttip" data-tooltip='{"text":"About Map-o-Trails","dir":"left"}' onclick="window.location.href='https://www.mapotrails.com/about'"><i class="fas fa-circle-info"></i><span>About</span></li>
                <li class="ttip" data-tooltip='{"text":"Donate","dir":"left"}' onclick="window.location.href='https://buy.stripe.com/6oEdTx7PFdAJ8YU3cc'"><i class="fas fa-circle-dollar-to-slot"></i><span>Donate</span></li>
                <?if ($_SESSION['uid']) {?>
                    <li class="ttip" data-tooltip='{"text":"Logout","dir":"left"}' onclick="window.location.href='https://www.mapotrails.com/logout?service=mapotrails&next=<?= urlencode('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>'"><i class="far fa-right-from-bracket"></i><span>Logout</span></li>
                <?}?>
            </ul>
            <i class="fas fa-chevron-left" title="Toggle navigation" id="close-navbar" data-open="1"></i>
        </div>
    </nav>

    <div class="wrapper">
        <div id="map"></div>
        <div class="loading"><div class="s"></div><span>Loading trails...</span></div>
        
        <div class="filter-controls">
            <span id="menuIcon" class="fas fa-bars"></span>
            <div class="search control">
                <span class="far fa-magnifying-glass" style="color:var(--gray)"></span>
                <input type="text" id="q" autocomplete="off" disabled placeholder="Search for trails, cities, and more...">
                <ul id="search-results" class="control"><li class="standby" style="gap:.5em"><i class="fa-duotone fa-spinner-third"></i><span>Searching...</span></li></ul>
            </div>
            <div class="dropdown-button">
                <button class="dd control" data-dd="activities">
                    <i class="fas fa-filter-list" style="color:#3e3e3e"></i>
                    <span class="label">All <?=ucfirst($settings->category)?></span>
                    <span class="arrow" style="z-index:0"></span>
                </button>
                <ul class="list control" data-dd="activities"><li data-type="trail">All Trail</li><li data-type="snow">All Snow</li></ul>
            </div>
        </div>

        <?/*<div id="weather"><div class="v"><div id="temp">--<sup>&deg;F</sup></div><div id="wind"><span><b>0</b>mph</span></div></div></div>*/?>
        <div id="modal"></div>
    </div>
    
    <script>let user=<?=json_encode($user)?>,settings=<?=json_encode($settings)?>;</script>
    <script src="<?=$domain?>src/js/mt.app-<?=$version?>.js"></script>
    <i class="wi wi-na" style="position:absolute;top:-10px;left:-10px;font-size:0.1px"></i>

</body>

</html>