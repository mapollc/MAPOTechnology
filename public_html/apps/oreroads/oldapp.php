<?
ini_set('display_errors', 0);
include_once('/home/mapo/public_html/subs.inc.php');

if ($_SERVER['SCRIPT_URI'] == 'https://www.mapotechnology.com/oregonroads/app') {
    header('Location: https://apps.mapotechnology.com/oregonroads');
    exit();
}

if (strpos($_SERVER['REQUEST_URI'], 'oreroads') !== false) {
    header('Location: ..'.str_replace('oreroads', 'oregonroads', $_SERVER['REQUEST_URI']));
    exit();
}

date_default_timezone_set('America/Los_Angeles');
session_start();

$user = 'null';
$sync = 'null';
$favorites = 'null';

if (isset($_SESSION['uid'])) {
    $con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings, time FROM oreroads_settings WHERE uid = '$_SESSION[uid]' LIMIT 1"));

    $favorites = json_encode(json_decode($row['settings']));
    $sync = $row['time'];
    $user = $_SESSION;
    $user = json_encode($user);

    // get any user subscriptions
    $sub = mysqli_query($con, "SELECT subscription, plan, billing.created, start, end AS ends, trial, active FROM users LEFT JOIN billing ON billing.email = users.email WHERE uid = $_SESSION[uid] AND active = 1");
    while ($data = mysqli_fetch_assoc($sub)) {
        $subs[] = $data;
    }
    mysqli_close($con);

    if ($subs) {
        foreach ($subs as $s) {
            if ($s['plan'] == $mapoSubscriptions['oregonroads'][($stripeLive ? 'live' : 'test')]) {
                $subscribe = array('active' => true, 'plan' => $s['plan'], 'trial' => ($s['trial'] == 1 ? true : false), 'created' => $s['created'], 'start' => $s['start'], 'ends' => $s['ends']);
            }
        }
    } else {
        $subscribe = array('active' => false);
    }

    /*$_SESSION['subscriptions'] = json_encode($subscribe);
    mysqli_close($con);
    
    if ($_SESSION['subscriptions']) {    
        foreach (json_decode($_SESSION['subscriptions']) as $s) {
            if ($s->plan == $mapoSubscriptions['mapotrails']['test']) {
                $subscribe = array('active' => true, 'plan' => $s->plan, 'created' => $s->created, 'start' => $s->start, 'ends' => $s->ends);
            }
        }
    } else {
        $subscribe = array('active' => false);
    }*/
}

$localhost = ($_SERVER['HTTP_HOST'] == 'localhost' ? true : false);
$title = 'Oregon Roads - Winter Road Conditions and Traveler Information by MAPO LLC';
$desc = 'Find current Oregon road conditions, roadside camera images, and weather information using TripCheck.com data in our intuitive app.';
//$version = ($_GET['version'] ? $_GET['version'] : file_get_contents('https://www.mapotechnology.com/oreroads/version.txt'));
$version = file_get_contents(($localhost ? '..' : '/home/mapo/public_html/apps/oreroads').'/version.txt');
$build = date('Y-m-d\TH:i:sO', filemtime((!$localhost ? './v'.$version.'/' : '').'app.js'));
?>
<!DOCTYPE html>
<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$title?></title>
    <meta charset="utf-8">
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//cdnjs.cloudflare.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//tripcheck.com">
    <link rel="preconnect" href="//api.weather.gov">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=1" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?>">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Oregon Roads by MAPO LLC">
    <meta property="og:url" content="<?=$_SERVER['SCRIPT_URI']?>">
    <meta property="og:image" content="https://i.imgur.com/fDXRt3B.png">
    <meta property="og:image:alt" content="OregonRoads by MAPO LLC">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?=$_SERVER['SCRIPT_URI']?>">
    <meta property="twitter:title" content="<?=$title?>">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="https://i.imgur.com/fDXRt3B.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#f99d1c">
    <meta name="robots" content="index,follow">
    <link href="<?=$_SERVER['SCRIPT_URI']?>" rel="canonical">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/oreroads/favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.css">
    <script src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link href="<?=($localhost ? 'style.css' : 'https://www.mapotechnology.com/app/oreroads/css/v'.$version.'/style.css')?>" rel="stylesheet">
    <link href="<?=($localhost ? 'app.css' : 'https://www.mapotechnology.com/app/oreroads/css/v'.$version.'/app.css')?>" rel="stylesheet">
</head>
<body>

    <h1 style="position:absolute;top:-100px">Oregon Roads, based on TripCheck.com</h1>
    <div id="map" style="width:100%;height:100%;outline:none"></div>
    <div id="loading">
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" viewBox="0 0 200 200"><radialGradient id="a12" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)"><stop offset="0" stop-color="#FF156D"></stop><stop offset=".3" stop-color="#FF156D" stop-opacity=".9"></stop><stop offset=".6" stop-color="#FF156D" stop-opacity=".6"></stop><stop offset=".8" stop-color="#FF156D" stop-opacity=".3"></stop><stop offset="1" stop-color="#FF156D" stop-opacity="0"></stop></radialGradient><circle transform-origin="center" fill="none" stroke="url(#a12)" stroke-width="10" stroke-linecap="round" stroke-dasharray="200 1000" stroke-dashoffset="0" cx="100" cy="100" r="70"><animateTransform type="rotate" attributeName="transform" calcMode="spline" dur="2" values="360;0" keyTimes="0;1" keySplines="0 0 1 1" repeatCount="indefinite"></animateTransform></circle><circle transform-origin="center" fill="none" opacity=".2" stroke="#FF156D" stroke-width="10" stroke-linecap="round" cx="100" cy="100" r="70"></circle></svg><br>
            <span>Loading...</span>
        </div>
    </div>

    <div class="zoom-controls">
        <button class="zoom-in" type="button" aria-label="Zoom in" aria-disabled="false">
            <span class="ctrl-icon" aria-hidden="true" title="Zoom in"></span>
        </button>
        <button class="zoom-out" type="button" aria-label="Zoom out" aria-disabled="false">
            <span class="ctrl-icon" aria-hidden="true" title="Zoom out"></span>
        </button>
        <button class="query" type="button" aria-label="Search" aria-disabled="false">
            <span class="ctrl-icon" aria-hidden="true" title="Search"></span>
        </button>
    </div>

    <?if(!$localhost){?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
    <?}?>
    <script><?if(!$localhost){?>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6');<?}?>let webApp=true,version='<?=$version?>',build='<?=$build?>',user=<?=$user?>,subscribe=<?=json_encode($subscribe)?>,sync=<?=$sync?>,favorites=<?=$favorites?>;</script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.min.js"></script>
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/pouchdb/6.2.0/pouchdb.min.js"></script>
    <!--<script defer src="<?=($localhost ? 'pouchdb.js' : 'https://www.mapotechnology.com/app/oreroads/js/v'.$version.'/pouchdb.js')?>"></script>-->
    <script src="<?=$localhost ? 'roads.js' : 'https://www.mapotechnology.com/app/oreroads/js/v'.$version.'/roads.js?'.time()?>"></script>
    <script defer src="<?=$localhost ? 'app.js' : 'https://www.mapotechnology.com/app/oreroads/js/v'.$version.'/app.js?'.time()?>"></script>
</body>

</html>