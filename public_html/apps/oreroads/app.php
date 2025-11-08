<?
date_default_timezone_set('America/Los_Angeles');
session_start();

$stableVersion = '1.4';

/*if ($_SERVER['SCRIPT_URI'] == 'https://www.mapotechnology.com/oregonroads/app') {
    header('Location: https://apps.mapotechnology.com/oregonroads');
    exit();
}

if (strpos($_SERVER['REQUEST_URI'], 'oreroads') !== false) {
    header('Location: ..'.str_replace('oreroads', 'oregonroads', $_SERVER['REQUEST_URI']));
    exit();
}*/

// use the script to update user's last active time
if (isset($_SESSION['visited']) && time() - $_SESSION['visited'] > 600) {
    require_once '/home/mapo/database.inc.php';
    prepareQuery('ii', [time(), $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
    mysqli_close($con);
}
$_SESSION['visited'] = time();

$title = 'Oregon Roads - Winter Road Conditions and Traveler Information by MAPO LLC';
$desc = 'Find current Oregon road conditions, roadside camera images, and weather information using TripCheck.com data in our intuitive app.';

$files = ['app.css','app.js','init.js'];
$times[] = filemtime('./oreroads/app.php');

foreach ($files as $file) {
    $times[] = filemtime('./oreroads/v'.$version.'/'.$file);
}

$build = date('Y-m-d\TH:i:sO', max($times));
$mapboxVersion = '3.15.0';
$version = isset($_GET['version']) ? $_GET['version'] : $stableVersion;
?>
<!DOCTYPE html>
<html lang="en-US" xmlns:og="http://ogp.me/ns#">

<head>
    <title><?= $title ?></title>
    <meta charset="utf-8">
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//cdnjs.cloudflare.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//tripcheck.com">
    <link rel="preconnect" href="//api.weather.gov">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=1" />
    <meta name="description" content="<?= $desc ?>">
    <meta property="og:title" content="<?= $title ?>">
    <meta property="og:description" content="<?= $desc ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Oregon Roads by MAPO LLC">
    <meta property="og:url" content="<?= $_SERVER['SCRIPT_URI'] ?>">
    <meta property="og:image" content="https://i.imgur.com/fDXRt3B.png">
    <meta property="og:image:alt" content="OregonRoads by MAPO LLC">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?= $_SERVER['SCRIPT_URI'] ?>">
    <meta property="twitter:title" content="<?= $title ?>">
    <meta property="twitter:description" content="<?= $desc ?>">
    <meta property="twitter:image" content="https://i.imgur.com/fDXRt3B.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#f99d1c">
    <meta name="robots" content="index,follow">
    <link href="https://api.mapbox.com/mapbox-gl-js/v<?=$mapboxVersion?>/mapbox-gl.css" rel="stylesheet">
    <? if (isset($_GET['version'])) {?>
    <link href="https://apps.mapotechnology.com/oreroads/v<?=$version?>/app.css" rel="stylesheet">
    <? } else { ?>
    <link href="https://apps.mapotechnology.com/src/oreroads/css/v<?=$version?>/app.css" rel="stylesheet">
    <? } ?>
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/oreroads/favicon.ico" type="image/x-icon" />
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;700&display=swap">
    </noscript>
    <script async src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link href="<?= $_SERVER['SCRIPT_URI'] ?>" rel="canonical">
</head>

<body>

    <h1 style="position:absolute;top:-100px">Oregon Roads, based on TripCheck.com</h1>
    <div id="map"></div>

    <div class="backdrop"></div>
    <div id="loading" class="init">
        <img src="https://www.mapotechnology.com/assets/images/oreroads/oreroads_square_logo.png" height="75">
        <div class="spinner"></div>
        <span>Loading...</span>
    </div>

    <script>let version='<?=$version?>',build='<?= $build ?>';</script>
    <script src="https://api.mapbox.com/mapbox-gl-js/v<?=$mapboxVersion?>/mapbox-gl.js"></script>
    <?if (!isset($_GET['version'])) {?>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6');</script>
    <?} if (isset($_GET['version'])) {?>
    <script src="https://apps.mapotechnology.com/oreroads/v<?=$_GET['version']?>/init.js"></script>
    <script src="https://apps.mapotechnology.com/oreroads/v<?=$_GET['version']?>/app.js"></script>
    <? } else {?>
    <script src="https://apps.mapotechnology.com/src/oreroads/js/v<?=$version?>/init.js"></script>
    <script src="https://apps.mapotechnology.com/src/oreroads/js/v<?=$version?>/app.js"></script>
    <? } ?>

</body>
</html>