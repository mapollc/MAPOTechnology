<?
$mapboxVersion = '3.18.1';
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
    <link href="//api.mapbox.com/mapbox-gl-js/v<?=$mapboxVersion?>/mapbox-gl.css" rel="stylesheet">
    <? if (isset($_GET['version'])) {?>
    <link href="//apps.mapotechnology.com/oreroads/v<?=$version?>/app.css" rel="stylesheet">
    <? } else { ?>
    <link href="//apps.mapotechnology.com/src/oreroads/css/v<?=$version?>/app.css" rel="stylesheet">
    <? } ?>
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/oreroads/favicon.ico" type="image/x-icon" />
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
        <img src="//mapotechnology.com/assets/images/oreroads/oreroads_icon_small.png" height="75">
        <div class="spinner"></div>
        <span>Loading...</span>
    </div>

    <script>let version='<?=$version?>',build='<?= $build ?>';</script>
    <script src="//api.mapbox.com/mapbox-gl-js/v<?=$mapboxVersion?>/mapbox-gl.js"></script>
    <?if (!isset($_GET['version'])) {?>
    <script async src="//www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6',{'user_id':'<?= $_COOKIE['guid'] ?>'});</script>
    <?} if (isset($_GET['version'])) {?>
    <script src="//apps.mapotechnology.com/oreroads/v<?=$_GET['version']?>/app.js"></script>
    <? } else {?>
    <script src="//apps.mapotechnology.com/src/oreroads/js/v<?=$version?>/app.js"></script>
    <? } ?>

</body>
</html>