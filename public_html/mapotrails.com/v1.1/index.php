<?
include_once('/home/mapo/public_html/subs.inc.php');

if ($_GET['show'] == 1) {
    print_r($_GET);
}

if ($_GET['logout'] == 1) {
    $_SESSION = array();
    session_regenerate_id();
    setcookie('token', '', time() - (60 * 60 * 24 * 7), '/', '.mapotrails.com');
}

$user = false;
$settings = array('center' => array(45.24588722974015, -117.71850585937501), 'zoom' => 9, 'tile' => 'terrain');

// Function to truncate text to a certain length
function truncate($text, $length) {
    $length = abs((int)$length);
    $text = strip_tags($text);

    if (strlen($text) > $length) {
        $text = preg_replace("/^(.{1,$length})(\s.*|$)/s", '\\1...', $text);
    }

    return str_replace('....', '...', $text);
}

if ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'com.mapollc.main' || $_GET['app'] == 1) {
    $android = 1;

    if ($_COOKIE['token'] && !isset($_SESSION['uid'])) {
        $con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
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

if (isset($_SESSION['uid'])) {
    $user = array('uid' => $_SESSION['uid'], 'first_name' => $_SESSION['first_name'], 'last_name' => $_SESSION['last_name'], 'name' => $_SESSION['name'], 'role' => $_SESSION['role'], 'token' => $_COOKIE['token']);
    #$subscribe = array('active' => false);

    // get any user subscriptions
    /*$con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
    $sub = mysqli_query($con, "SELECT subscription, plan, billing.created, start, end AS ends, trial, active FROM users LEFT JOIN billing ON billing.email = users.email WHERE uid = '$_SESSION[uid]' AND active = 1");
    while ($data = mysqli_fetch_assoc($sub)) {
        $subs[] = $data;
    }
    mysqli_close($con);

    foreach ($subs as $s) {
        if ($s['plan'] == $mapoSubscriptions['mapotrails'][($stripeLive ? 'live' : 'test')]) {
            $subscribe = array('active' => true, 'plan' => $s['plan'], 'trial' => ($s['trial'] == 1 ? true : false), 'created' => $s['created'], 'start' => $s['start'], 'ends' => $s['ends']);
        }
    }*/
}

// If map settings are NOT stored in a session variable
if (!$_SESSION['mtsettings'] && $_SESSION['uid']) {
    include('../db.ini.php');
    $user_settings = unserialize(mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM trail_settings WHERE uid = '$_SESSION[uid]'"))['settings']);
    mysqli_close($con);
    
    if ($user_settings) {
        $_SESSION['mtsettings'] = $user_settings;
    } else {
        $_SESSION['mtsettings'] = $settings;
    }
} else if ($_SESSION['mtsettings']) {
    $settings = unserialize($_SESSION['mtsettings']);
    $settings = ($settings ? $settings : $_SESSION['mtsettings']);
}

// If user is logged in, set the user variables for the app
/*if ($_SESSION['uid']) {
    if (!$_SESSION['subscribe']) {
        include_once('/home/mapo/public_html/db.ini.php');
        $bill = mysqli_fetch_assoc(mysqli_query($con, "SELECT subscription FROM billing AS b LEFT JOIN users AS u ON b.email = u.email AND plan = 'price_1NmiH6IpCdpJm6cTP1rELzPw' AND uid = '$_SESSION[uid]' AND active = 1 ORDER BY b.created DESC LIMIT 1"));
        mysqli_close($con);
    }

    $user = array('uid' => $_SESSION['uid'], 'first_name' => $_SESSION['first_name'], 'last_name' => $_SESSION['last_name'], 'name' => $_SESSION['name'], 'role' => $_SESSION['role']);

    if ($bill) {
        $_SESSION['subscribe'] = array('active' => 1, 'id' => $bill['subscription']);
    }
    print_r($user);
} else {
    $user = false;
}*/

$settings['version'] = array($version, (substr($version, -2) == '.0' ? substr($version, 0, -2) : $version));

$category = ($_GET['category'] ? $_GET['category'] : 'trail');
$settings['category'] = $category;

if (!array_key_exists('trails', $settings)) {
    $settings['trails'] = true;
}

if (!array_key_exists('trailheads', $settings)) {
    $settings['trailheads'] = true;
}

if (!array_key_exists('usfs', $settings)) {
    $settings['usfs'] = false;
}

if (!array_key_exists('waypoints', $settings)) {
    $settings['waypoints'] = true;
}

if ($category != 'snow' && !array_key_exists('avy', $settings)) {
    $settings['avy'] = false;
}

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

if ($_GET['tid']) {
    $json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/trails/guide?key=cf707f0516e5c1226835bbf0eece4a0c&id='.$_GET['tid']));
    $metaimg = 'https://cdn.mapotrails.com/photos/'.$json->guide->media[0]->file;
    $title = $json->guide->metadata->title.' - Online Recreation Mapping';
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
    <link rel="preconnect" href="//unpkg.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//mapbox.com">
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
    <link rel="preload" href="https://unpkg.com/leaflet.pm@latest/dist/leaflet.pm.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://unpkg.com/leaflet.pm@latest/dist/leaflet.pm.css"></noscript>
    <link href="<?=$domain?>src/css/main-<?=$version?>.css" rel="stylesheet">
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <?/*<link href="main.css" rel="stylesheet">
    <script src="//kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>*/?>
    <link rel="canonical" href="<?=$domain.substr($_SERVER['REQUEST_URI'], 1)?>" />
    <link rel="shortlink" href="<?echo $domain.substr($_SERVER['SCRIPT_NAME'], 1); if ($_GET){ echo '?'; foreach($_REQUEST as $a => $b) { $c .= $a.'='.$b.'&'; } echo substr($c, 0, -1); }?>" />
</head>
<body>

    <nav>
        <div class="nav-wrapper">
            <div class="logo"><a href="#" onclick="window.location.href=window.location.href;return false"><img src="https://www.mapotechnology.com/assets/images/mapotrails_icon_transparent.png"></a></div>
            <ul>
                <?if($android != 1){?>
                <li id="account" class="ttip" data-tooltip='{"text":"<?=($_SESSION['uid'] ? 'Your Account' : 'Login')?>","dir":"left"}'><i class="fas fa-user-circle"></i><span><?=($_SESSION['uid'] ? 'Account' : 'Login')?></span></li>
                <?}?>
                <li id="basemap" class="ttip" data-tooltip='{"text":"Basemaps","dir":"left"}'><i class="fas fa-grid"></i><span>Maps</span></li>
                <li id="layer-group" class="ttip" data-tooltip='{"text":"Layers","dir":"left"}'><i class="fas fa-layer-group"></i><span>Layers</span></li>
                <?if($android != 1){?>
                <li id="userUploads" class="ttip" data-tooltip='{"text":"Your saved content","dir":"left"}'><i class="fas fa-folders"></i><span>Content</span></li>
                <li id="import" class="ttip" data-tooltip='{"text":"Import a file","dir":"left"}'><i class="far fa-file-import"></i><span>Upload</span></li>
                <?}?>
                <li id="save" class="ttip" data-tooltip='{"text":"Sync map settings","dir":"left"}'><i class="fas fa-cloud-arrow-up"></i><span>Sync</span></li>
                <li id="mylocation" class="ttip" data-tooltip='{"text":"Find my location","dir":"left"}'><i class="fas fa-location-arrow"></i><span>Location</span></li>
                <li class="ttip" data-tooltip='{"text":"About Map-o-Trails","dir":"left"}' onclick="window.location.href='https://www.mapotrails.com/about'"><i class="fas fa-circle-info"></i><span>About</span></li>
                <?if ($_SESSION['uid']){?>
                <li class="ttip" data-tooltip='{"text":"Logout","dir":"left"}' onclick="window.location.href='https://www.mapotrails.com/logout?service=mapotrails&next=<?=urlencode('https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'])?>'"><i class="far fa-right-from-bracket"></i><span>Logout</span></li>
                <?}?>
            </ul>
            <i class="fas fa-chevron-left" id="close-navbar" data-open="1"></i>
        </div>
    </nav>

    <?/*<div class="marketing" style="padding-left:calc(.75em + var(--nav-width))">
        <div>
            <span>Upgrade to Map-o-Trails Premium to access additional features.</span>
            <a class="btn btn-xs btn-light-blue" style="font-size:15px;margin:0" href="https://www.mapotechnology.com/checkout?price_id=<?=$mapoSubscriptions['mapotrails'][($stripeLive ? 'live' : 'test')]?>&host=mapotrails.com&return=<?=urlencode($_SERVER['REQUEST_URI'])?>">Upgrade</a>
        </div>
        <i class="far fa-xmark" onclick="this.parentElement.remove()"></i>
    </div>*/?>
    <div class="wrapper">
        <div id="map"<?=($ll ? ' data-lat="' . $ll[0] . '" data-lon="' . $ll[1] . '"' : '').($_GET['z'] ? ' data-zoom="' . $_GET['z'] . '"' : '').($_GET['tid'] ? ' data-tid="'.$_GET['tid'].'"' : '')?>></div>

        <?/*if($android != 1){?><div class="logo"><a href="https://www.mapofire.com"><img src="https://www.mapotechnology.com/assets/images/mapo_logo_square_transparent.png" style="width:65px;height:65px" title="MAPO LLC" alt="MAPO LLC logo"></a></div><?}*/?>
                
        <div class="select" id="tileChange" data-selected>
            <div class="select-styled"></div>
            <ul class="select-options"></ul>
        </div>
            
        <div id="weather">
            <div class="v">
                <div id="temp">--<sup>&deg;F</sup></div>
                <div id="wind">
                    <span><b>0</b>mph</span>
                </div>
            </div>
        </div>

        <div class="searchControl">
            <i class="far fa-magnifying-glass"></i>
            <input type="text" id="q" autocomplete="off" placeholder="Search for places...">
            <i class="fas fa-times" id="closeSearch" style="display:none"></i>
        </div>
        <div id="search-results"></div>
    </div>

    <div class="alert"></div>
    <div id="modal"></div>
    <div id="loading"><div class="spinner alt" style="position:absolute;top:50%;left:50%"></div></div>

    <script async src="https://www.googletagmanager.com/gtag/js?id=G-4KN1GPWFWM"></script>
    <script>var buildDate='<?=$buildDate?>',isAndroid=<?=($android == 1 ? 1 : 0)?>,user=<?=json_encode($user)?>,settings=<?=json_encode($settings)?>;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-4KN1GPWFWM');
    var runtime=function(t){"use strict";var r,e=Object.prototype,n=e.hasOwnProperty,o=Object.defineProperty||function(t,r,e){t[r]=e.value},i="function"==typeof Symbol?Symbol:{},a=i.iterator||"@@iterator",c=i.asyncIterator||"@@asyncIterator",u=i.toStringTag||"@@toStringTag";function h(t,r,e){return Object.defineProperty(t,r,{value:e,enumerable:!0,configurable:!0,writable:!0}),t[r]}try{h({},"")}catch(f){h=function(t,r,e){return t[r]=e}}function l(t,e,n,i){var a,c,u,h,f=Object.create((e&&e.prototype instanceof d?e:d).prototype);return o(f,"_invoke",{value:(a=t,c=n,u=new j(i||[]),h=p,function t(e,n){if(h===y)throw Error("Generator is already running");if(h===v){if("throw"===e)throw n;return{value:r,done:!0}}for(u.method=e,u.arg=n;;){var o=u.delegate;if(o){var i=k(o,u);if(i){if(i===g)continue;return i}}if("next"===u.method)u.sent=u._sent=u.arg;else if("throw"===u.method){if(h===p)throw h=v,u.arg;u.dispatchException(u.arg)}else"return"===u.method&&u.abrupt("return",u.arg);h=y;var f=s(a,c,u);if("normal"===f.type){if(h=u.done?v:"suspendedYield",f.arg===g)continue;return{value:f.arg,done:u.done}}"throw"===f.type&&(h=v,u.method="throw",u.arg=f.arg)}})}),f}function s(t,r,e){try{return{type:"normal",arg:t.call(r,e)}}catch(n){return{type:"throw",arg:n}}}t.wrap=l;var p="suspendedStart",y="executing",v="completed",g={};function d(){}function m(){}function w(){}var L={};h(L,a,function(){return this});var x=Object.getPrototypeOf,$=x&&x(x(F([])));$&&$!==e&&n.call($,a)&&(L=$);var E=w.prototype=d.prototype=Object.create(L);function b(t){["next","throw","return"].forEach(function(r){h(t,r,function(t){return this._invoke(r,t)})})}function _(t,r){var e;o(this,"_invoke",{value:function o(i,a){function c(){return new r(function(e,o){!function e(o,i,a,c){var u=s(t[o],t,i);if("throw"===u.type)c(u.arg);else{var h=u.arg,f=h.value;return f&&"object"==typeof f&&n.call(f,"__await")?r.resolve(f.__await).then(function(t){e("next",t,a,c)},function(t){e("throw",t,a,c)}):r.resolve(f).then(function(t){h.value=t,a(h)},function(t){return e("throw",t,a,c)})}}(i,a,e,o)})}return e=e?e.then(c,c):c()}})}function k(t,e){var n=e.method,o=t.iterator[n];if(o===r)return e.delegate=null,"throw"===n&&t.iterator.return&&(e.method="return",e.arg=r,k(t,e),"throw"===e.method)||"return"!==n&&(e.method="throw",e.arg=TypeError("The iterator does not provide a '"+n+"' method")),g;var i=s(o,t.iterator,e.arg);if("throw"===i.type)return e.method="throw",e.arg=i.arg,e.delegate=null,g;var a=i.arg;return a?a.done?(e[t.resultName]=a.value,e.next=t.nextLoc,"return"!==e.method&&(e.method="next",e.arg=r),e.delegate=null,g):a:(e.method="throw",e.arg=TypeError("iterator result is not an object"),e.delegate=null,g)}function G(t){var r={tryLoc:t[0]};1 in t&&(r.catchLoc=t[1]),2 in t&&(r.finallyLoc=t[2],r.afterLoc=t[3]),this.tryEntries.push(r)}function P(t){var r=t.completion||{};r.type="normal",delete r.arg,t.completion=r}function j(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(G,this),this.reset(!0)}function F(t){if(null!=t){var e=t[a];if(e)return e.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var o=-1,i=function e(){for(;++o<t.length;)if(n.call(t,o))return e.value=t[o],e.done=!1,e;return e.value=r,e.done=!0,e};return i.next=i}}throw TypeError(typeof t+" is not iterable")}return m.prototype=w,o(E,"constructor",{value:w,configurable:!0}),o(w,"constructor",{value:m,configurable:!0}),m.displayName=h(w,u,"GeneratorFunction"),t.isGeneratorFunction=function(t){var r="function"==typeof t&&t.constructor;return!!r&&(r===m||"GeneratorFunction"===(r.displayName||r.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,w):(t.__proto__=w,h(t,u,"GeneratorFunction")),t.prototype=Object.create(E),t},t.awrap=function(t){return{__await:t}},b(_.prototype),h(_.prototype,c,function(){return this}),t.AsyncIterator=_,t.async=function(r,e,n,o,i){void 0===i&&(i=Promise);var a=new _(l(r,e,n,o),i);return t.isGeneratorFunction(e)?a:a.next().then(function(t){return t.done?t.value:a.next()})},b(E),h(E,u,"Generator"),h(E,a,function(){return this}),h(E,"toString",function(){return"[object Generator]"}),t.keys=function(t){var r=Object(t),e=[];for(var n in r)e.push(n);return e.reverse(),function t(){for(;e.length;){var n=e.pop();if(n in r)return t.value=n,t.done=!1,t}return t.done=!0,t}},t.values=F,j.prototype={constructor:j,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=r,this.done=!1,this.delegate=null,this.method="next",this.arg=r,this.tryEntries.forEach(P),!t)for(var e in this)"t"===e.charAt(0)&&n.call(this,e)&&!isNaN(+e.slice(1))&&(this[e]=r)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var e=this;function o(n,o){return c.type="throw",c.arg=t,e.next=n,o&&(e.method="next",e.arg=r),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],c=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var u=n.call(a,"catchLoc"),h=n.call(a,"finallyLoc");if(u&&h){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(u){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else if(h){if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else throw Error("try statement without catch or finally")}}},abrupt:function(t,r){for(var e=this.tryEntries.length-1;e>=0;--e){var o=this.tryEntries[e];if(o.tryLoc<=this.prev&&n.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=r&&r<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return(a.type=t,a.arg=r,i)?(this.method="next",this.next=i.finallyLoc,g):this.complete(a)},complete:function(t,r){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&r&&(this.next=r),g},finish:function(t){for(var r=this.tryEntries.length-1;r>=0;--r){var e=this.tryEntries[r];if(e.finallyLoc===t)return this.complete(e.completion,e.afterLoc),P(e),g}},catch:function(t){for(var r=this.tryEntries.length-1;r>=0;--r){var e=this.tryEntries[r];if(e.tryLoc===t){var n=e.completion;if("throw"===n.type){var o=n.arg;P(e)}return o}}throw Error("illegal catch attempt")},delegateYield:function(t,e,n){return this.delegate={iterator:F(t),resultName:e,nextLoc:n},"next"===this.method&&(this.arg=r),g}},t}("object"==typeof module?module.exports:{});try{regeneratorRuntime=runtime}catch(t){"object"==typeof globalThis?globalThis.regeneratorRuntime=runtime:Function("r","regeneratorRuntime = r")(runtime)}</script>
    <?/*<script>var isAndroid = 0, user = {"uid":"1","first_name":"Tesmond","last_name":"Hurd","name":"Tesmond Hurd","role":"ADMIN"}, settings = <?=json_encode($settings)?>;</script>*/?>
    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.min.js"></script>
    <script src="https://www.mapotrails.com/src/js/vector-<?=$version?>.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <script src="https://unpkg.com/leaflet-topography" type="text/javascript"></script>
    <script src="https://www.mapotrails.com/src/js/main-<?=$version?>.js"></script>
    <script src="https://www.mapotrails.com/src/js/utilities-<?=$version?>.js"></script>
    <script async src="https://unpkg.com/leaflet.pm@latest/dist/leaflet.pm.min.js"></script>
    <script async defer src="https://www.mapotrails.com/src/js/decor-<?=$version?>.js"></script>
    <?/*<script src="main.js"></script>
    <script src="utilities.js"></script>
    <script src="decor.js"></script>*/?>
    <script async defer src="https://cdn.jsdelivr.net/npm/@tmcw/togeojson/dist/togeojson.umd.min.js"></script>
</body>

</html>