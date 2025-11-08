<?
$productPage = true;
session_start();

include_once 'subs.inc.php';

if (strpos($_SERVER['REQUEST_URI'], 'oreroads') !== false) {
    header('Location: ..'.str_replace('oreroads', 'oregonroads', $_SERVER['REQUEST_URI']));
    exit();
}

function utm($source) {
    global $product;

    return $source != '' ? "utm_campaign=$product&utm_medium=service_page&utm_source=$source" : '';
}

function webUrl($append, $source = '') {
    global $product;

    if ($product == 'mapofire') {
        $url = 'https://www.mapofire.com';
    } else {
        $url = 'https://apps.mapotechnology.com/oregonroads';
    }

    return $url.($append ? $append : '').'?'.utm($source);
}

if ($product == 'mapofire') {
    $productName = 'Map of Fire';
    $themeColor = '#f18f01';
    $metaimg = 'preview_mapofire.png';
    $favicon = 'mf-favicon';
    $downloadUrl = 'https://play.google.com/store/apps/details?id=com.mapollc.mapofire';
    $title = 'Map of Fire: Live Wildfire, Lightning, & Smoke Map - MAPO LLC';
    $desc = 'Get real-time updates on wildfires, smoke, and lightning strikes across the United States with Map of Fire. Monitor the spread and intensity of wildfires, track smoke dispersion, and stay alert to lightning activity.';
} else {
    $productName = 'OregonRoads';
    $themeColor = '#f99d1c';
    $metaimg = 'oreroads/nwi3fNa.png';
    $favicon = 'oreroads/favicon';
    $downloadUrl = 'https://play.google.com/store/apps/details?id=com.mapollc.oreroads';
    $title = 'OregonRoads - Real-time Winter Road Conditions App';
    $desc = 'Get real-time updates on Oregon winter road conditions, incidents, and traveler information from ODOT through our convenient Android app or web map.';
}
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$title?></title>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="description" content="<?=$desc?>">
    <meta property="og:title" content="<?=$title?>">
    <meta property="og:description" content="<?=$desc?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="<?=$productName?>">
    <meta property="og:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/<?=$metaimg?>">
    <meta property="og:image:alt" content="<?=$productName?> - MAPO LLC">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="twitter:title" content="<?=$title?>">
    <meta property="twitter:description" content="<?=$desc?>">
    <meta property="twitter:image" content="https://www.mapotechnology.com/assets/images/<?=$metaimg?>">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="<?=$themeColor?>">
    <meta name="robots" content="index,follow">
    <script src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/<?=$favicon?>.ico" type="image/x-icon" />
    <link href="../src/css/product.css" rel="stylesheet">
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600&display=swap"></noscript>
    <link href="../src/css/global.css" rel="stylesheet">
    <?if ($product == 'mapofire'){?>
    <style>.header-product{background-image:url(https://www.mapotechnology.com/assets/images/wildfire-bg2.jpeg);}.highlight li{display:flex;flex-direction:column;}.highlight li b{font-size:1.2rem;text-transform:uppercase;color:#444;letter-spacing:2px;}@media(max-width:768px){header .container a:nth-child(2){display:none}}</style>
    <?}?>
</head>

<body>
