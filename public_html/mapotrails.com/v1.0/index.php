<?
$user = false;
$settings = array('center' => array(45.24588722974015, -117.71850585937501), 'zoom' => 9, 'tile' => 'terrain');

if ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'com.mapollc.main' || $_GET['app'] == 1) {
    $android = 1;

    if ($_COOKIE['token'] && !isset($_SESSION['uid'])) {
        $con = mysqli_connect('localhost', 'mapo_main', 'Q.1.w.2.e34', 'mapo_main');
        $time = time();
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT u.uid, first_name, last_name, role, expires FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid WHERE token = '$_COOKIE[token]' AND expires > '$time'"));
        mysqli_close($con);

        $_SESSION['uid'] = $row['uid'];
        $_SESSION['first_name'] = $row['first_name'];
        $_SESSION['last_name'] = $row['last_name'];
        $_SESSION['role'] = $row['role'];
        $_SESSION['expires'] = $row['expires'];
    }
}

// Function to truncate text to a certain length
function truncate($text, $length) {
    $length = abs((int)$length);
    $text = strip_tags($text);

    if (strlen($text) > $length) {
        $text = preg_replace("/^(.{1,$length})(\s.*|$)/s", '\\1...', $text);
    }

    return str_replace('....', '...', $text);
}

// If map settings are NOT stored in a session variable
if (!$_SESSION['mtsettings'] && $_SESSION['uid']) {
    include('../db.ini.php');
    $settings = unserialize(mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM trail_settings WHERE uid = '$_SESSION[uid]'"))['settings']);
    mysqli_close($con);
    
    if ($settings) {
        $_SESSION['mtsettings'] = $settings;
    }
} else if ($_SESSION['mtsettings']) {
    $settings = unserialize($_SESSION['mtsettings']);
    $settings = ($settings ? $settings : $_SESSION['mtsettings']);
}

// If user is logged in, set the user variables for the app
if ($_SESSION['uid']) {
    if (!$_SESSION['subscribe']) {
        include_once('/home/mapo/public_html/db.ini.php');
        $bill = mysqli_fetch_assoc(mysqli_query($con, "SELECT subscription FROM billing AS b LEFT JOIN users AS u ON b.email = u.email AND plan = 'price_1NmiH6IpCdpJm6cTP1rELzPw' AND uid = '$_SESSION[uid]' AND active = 1 ORDER BY b.created DESC LIMIT 1"));
        mysqli_close($con);
    }

    $user = array('uid' => $_SESSION['uid'], 'first_name' => $_SESSION['first_name'], 'last_name' => $_SESSION['last_name'], 'name' => $_SESSION['name'], 'role' => $_SESSION['role']);

    if ($bill) {
        $_SESSION['subscribe'] = array('active' => 1, 'id' => $bill['subscription']);
    }
} else {
    $user = false;
}

$settings['version'] = array($version, (substr($version, -2) == '.0' ? substr($version, 0, -2) : $version));

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
if ($_GET['ll']) {
    $ll = explode(',', $_GET['ll']);
}

// set conditional variables
$avy = ($category == 'snow' && $settings['avy'] === true || $category != 'snow' && $settings['avy'] === true ? true : false);
$usfs = (!empty($settings['usfs']) || $settings['usfs'] === true ? true : false);
$waypoints = (!empty($settings['waypoints']) || $settings['waypoints'] === true ? true : false);
$trails = (empty($settings['trails']) || $settings['trails'] === true ? true : false);

if ($_GET['tid']) {
    $json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/trails/guide?key=cf707f0516e5c1226835bbf0eece4a0c&id='.$_GET['tid']));
    $metaimg = 'https://www.mapotrails.com/data/photos/'.$json->guide->media[0]->file;
    $title = $json->guide->metadata->title;
    $desc = truncate($json->guide->metadata->route, 165);
    $settings['category'] = $json->guide->metadata->type;
} else {
    $title = 'Interactive ' . ($_GET['activity'] ? ucwords(str_replace('-', ' ', $_GET['activity'])) . ' ' : ($category ? ucwords($category) . ' ' : '')) . 'Maps '.($_GET['area'] ? 'near '.ucwords(str_replace('-', ' ', $_GET['area'])).' ' : '').'- Online Recreation Mapping';
    $desc = 'Find trails to hike, mountain bike, ski, and snowmoboile in Oregon using Map-o-Trails, a recreation mapping app.';
}

$settings['android'] = ($android == 1 ? 1 : 0);
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$title?> - Map-o-Trails</title>
    <meta charset="utf-8">
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?> - Map-o-Trails">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Map-o-Trails">
    <meta property="og:url" content="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>">
    <meta property="og:image" content="<?=($metaimg ? $metaimg : 'https://www.mapotechnology.com/assets/images/mapotrails_logo.png')?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>">
    <meta property="twitter:title" content="<?=$title?> - Map-o-Trails">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="<?=($metaimg ? $metaimg : 'https://www.mapotechnology.com/assets/images/mapotrails_logo.png')?>">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#00385c">
    <meta name="robots" content="index,follow">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <link rel="preload" href="https://www.mapotechnology.com/assets/css/global.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://www.mapotechnology.com/assets/css/global.css"></noscript>
    <link href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" rel="stylesheet" />
    <link rel="preload" href="https://unpkg.com/leaflet.pm@2.2.0/dist/leaflet.pm.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://unpkg.com/leaflet.pm@2.2.0/dist/leaflet.pm.css"></noscript>
    <link href="<?=$domain?>src/css/main-<?=$version?>.css" rel="stylesheet">
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="canonical" href="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>" />
    <link rel="shortlink" href="<?echo $domain.substr($_SERVER['SCRIPT_NAME'], 1); if ($_GET){ echo '?'; foreach($_REQUEST as $a => $b) { $c .= $a.'='.$b.'&'; } echo substr($c, 0, -1); }?>" />
</head>
<body>
    <nav>
        <ul>
            <?if($android != 1){?>
            <li id="account" class="ttip" data-tooltip='{"text":"<?=($_SESSION['uid'] ? 'Your Account' : 'Login')?>","dir":"left"}'><i class="fa<?=($_SESSION['uid'] ? 's' : 't')?> fa-user-circle"></i><span><?=($_SESSION['uid'] ? 'Account' : 'Login')?></span></li>
            <?}?>
            <!--<li id="find" class="ttip" data-tooltip='{"text":"Search for places","dir":"left"}'><i class="fas fa-magnifying-glass"></i><span>Search</span></li>-->
            <li id="basemap" class="ttip" data-tooltip='{"text":"Basemaps","dir":"left"}'><i class="fas fa-grid"></i><span>Basemap</span></li>
            <li id="trails" class="ttip<?=($trails ? ' active' : '')?>" data-tooltip='{"text":"Trails/Routes","dir":"left"}' data-overlay="<?=($trails ? 1 : 0)?>"><i class="fas fa-route"></i><span>Trails</span></li>
            <li id="waypoints" class="ttip<?=($waypoints ? ' active' : '')?>" data-tooltip='{"text":"Trail Waypoints","dir":"left"}' data-overlay="<?=($waypoints ? 1 : 0)?>"><i class="fas fa-map-location-dot"></i><span>Waypoints</span></li>
            <li id="avalanche" class="ttip<?=($avy ? ' active' : '')?>" data-tooltip='{"text":"Avalanche Shading","dir":"left"}' data-overlay="<?=($avy ? 1 : 0)?>"><i class="far fa-hill-avalanche"></i><span>Avalanche</span></li>
            <li id="usfs" class="ttip<?=($usfs ? ' active' : '')?>" data-tooltip='{"text":"USFS Boundaries","dir":"left"}' data-overlay="<?=($usfs ? 1 : 0)?>"><i class="fas fa-trees"></i><span>USFS</span></li>
            <?if($android != 1){?>
            <li id="userUploads" class="ttip" data-tooltip='{"text":"Your saved content","dir":"left"}'><i class="fas fa-folders"></i><span>Content</span></li>
            <li id="import" class="ttip" data-tooltip='{"text":"Import a file","dir":"left"}'><i class="far fa-file-import"></i><span>Upload</span></li>
            <?}?>
            <li id="save" class="ttip" data-tooltip='{"text":"Sync map settings","dir":"left"}'><i class="fas fa-cloud-arrow-up"></i><span>Sync</span></li>
            <li id="mylocation" class="ttip" data-tooltip='{"text":"Find my location","dir":"left"}'><i class="fas fa-location-arrow"></i><span>Location</span></li>
            <li class="ttip" data-tooltip='{"text":"About Map-o-Trails","dir":"left"}' onclick="window.location.href='https://www.mapotrails.com/about'"><i class="fas fa-circle-info"></i><span>About</span></li>
        </ul>
    </nav>
    <?if($android != 1){?><div class="logo"><a href="https://www.mapofire.com"><img src="https://www.mapotechnology.com/assets/images/mapo_logo_square_transparent.png" style="width:65px;height:65px" title="MAPO LLC" alt="MAPO LLC logo"></a></div><?}?>
            
    <div class="select" id="tileChange" data-selected>
        <div class="select-styled" style="min-width:155px"></div>
        <ul class="select-options" style="min-width:155px"></ul>
    </div>

    <div id="weather" class="control">
        <div id="temp">--&deg;F</div>
        <div id="wind">0 mph</div>
        <span id="upd">--</span>
    </div>

    <div id="map"<?=($ll ? ' data-lat="' . $ll[0] . '" data-lon="' . $ll[1] . '"' : '').($_GET['z'] ? ' data-zoom="' . $_GET['z'] . '"' : '').($_GET['tid'] ? ' data-tid="'.$_GET['tid'].'"' : '')?>></div>

    <div class="searchControl">
        <i class="far fa-magnifying-glass"></i>
        <input type="text" id="q" autocomplete="off" placeholder="Search for places...">
        <i class="fas fa-times" id="closeSearch" onclick="document.querySelector('.searchControl').classList.toggle('in-use')"></i>
    </div>
    <div id="search-results"></div>

    <div id="modal"></div>
    <div id="loading"><div class="spinner alt" style="position:absolute;top:50%;left:50%"></div></div>

    <script async src="https://www.googletagmanager.com/gtag/js?id=G-4KN1GPWFWM"></script>
    <script>var buildDate = '<?=$buildDate?>', isAndroid = <?=($android == 1 ? 1 : 0)?>, user = <?=json_encode($user)?>, settings = <?=json_encode($settings)?>;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4KN1GPWFWM');</script>
    <!--<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>-->
    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster-src.min.js"></script>
    <script async defer src="https://unpkg.com/leaflet.pm@2.2.0/dist/leaflet.pm.min.js"></script>
    <script src="https://www.mapotrails.com/src/js/main-<?=$version?>.js"></script>
    <script src="https://www.mapotrails.com/src/js/utilities-<?=$version?>.js"></script>
    <script async defer src="https://www.mapotrails.com/src/js/decor-<?=$version?>.js"></script>
    <script async defer src="https://cdn.jsdelivr.net/npm/@tmcw/togeojson/dist/togeojson.umd.min.js"></script>
</body>

</html>