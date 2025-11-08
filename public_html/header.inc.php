<?
$host = str_replace('www.', '', $_SERVER['HTTP_HOST']);
ini_set('session.cookie_domain', ".$host");

session_start();

$domain = 'https://www.mapotechnology.com/';
$logoURL = str_contains($host, $domain) ? $domain : "https://$host";

// get subscription pricing matrix and attributes
include_once '/home/mapo/public_html/subs.inc.php';

if ($host == 'mapotrails.com' || $host == 'lagranderide.com') {
    $siteProduct = 'Map of Trails';
    $site = 'mapotrails';
    $logo = 'trails';
} else if ($host == 'mapofire.com' || $host == 'wildfiremap.org' || $host == 'fireweatheravalanche.org') {
    $siteProduct = 'Map of Fire';
    $site = 'mapofire';
    $logo = 'fire';
} else {
    $siteProduct = 'MAPO LLC';
    $site = 'mapo';
    $logo = '';
}

$websiteTitle = ($bktitle ? $bktitle : ($title ? $title : '')).($site == 'mapo' && $frontPage ? 'Innovative Mapping Technology for Wildfire & Recreation' : '').' | '.$siteProduct;

$metaDesc = $metaDesc ? $metaDesc : 'Track wildfires with Map of Fire. Explore trails with Map of Trails. Expert mapping solutions for outdoor safety & recreation by MAPO LLC.';
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=$websiteTitle?></title>
    <meta charset="utf-8">
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=2, minimum-scale=1, user-scalable=1">
    <meta name="description" content="<?=$metaDesc?>">
    <meta property="og:locale" content="en_US" />
    <meta property="og:title" content="<?=$websiteTitle?>">
    <meta property="og:description" content="<?=$metaDesc?>">
    <?if($ogtype){
    echo $ogtype;
    }else{?>
    <meta property="og:type" content="website">
    <?}?>
    <meta property="og:site_name" content="<?=$site == 'mapotrails' ? 'MapoTrails.com' : ($site == 'mapofire' ? 'MapoFire.com' : 'MAPO LLC')?>">
    <meta property="og:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="og:image" content="<?=$metaphoto ? $metaphoto : 'https://www.mapotechnology.com/assets/images/mapo_logo_square.png'?>">
    <meta property="og:image:alt" content="<?=$metaphoto ? $metacaption : 'MAPO LLC'?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="twitter:title" content="<?=$websiteTitle?>">
    <meta property="twitter:description" content="<?=$metaDesc?>">
    <meta property="twitter:image" content="<?=$metaphoto ? $metaphoto : 'https://www.mapotechnology.com/assets/images/mapo_logo_square.png'?>">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#ffc65c">
    <meta name="robots" content="index,follow">
    <link rel="shortcut icon" href="<?=$domain?>assets/images/favicon.ico" type="image/x-icon" />
    <link rel="apple-touch-icon" sizes="120x120" href="<?=$domain?>assets/images/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="<?=$domain?>assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="<?=$domain?>assets/images/favicon-16x16.png">
    <link rel="stylesheet" href="<?=$domain?>src/css/global.css">
    <link rel="stylesheet" href="<?=$domain?>src/css/main.css">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600&family=Dosis:wght@400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto@300;400;500;600&family=Dosis:wght@400;500;600&display=swap">
    </noscript>
    <?if($css){
    foreach ($css as $c) {
        echo '<link rel="stylesheet" href="'.$c.'"></script>
';
    }
    }?>
    <script async src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="canonical" href="<?="https://$_SERVER[HTTP_HOST]/".substr($_SERVER['REQUEST_URI'], 1)?>" />
    <?if($frontPage){?>
    <style>.stat{padding:1rem;background-color:rgb(15 15 15 / 65%);border-radius:4px;text-align:center;color:#fff}.stat h2{font-size:2.5rem;font-weight:600;letter-spacing:1px;text-overflow:ellipsis;overflow-wrap:normal;overflow:hidden}.stat span{font-size:18px;font-weight:400}</style>
    <?} if ($_SERVER['PHP_SELF'] == '/legal.php') {?>
    <style>.legal ol li{margin:10px 0 5px 25px;font-size:18px;font-weight:600;letter-spacing:1px;padding:0}.legal ol li span{padding-left:10px}.legal ul{margin-left:90px!important;}.legal p{margin-left:55px!important;}.legal ul li{font-size:18px;line-height:1.5;padding:5px 0 5px 10px}.legal p:first-child,.legal p:nth-child(2),.legal p:nth-child(3),.legal p:nth-child(4){margin-left:0!important}.legal p.ind{margin-left:110px!important}</style>
    <?}?>
</head>
<body<?=!$frontPage && $_SERVER['PHP_SELF'] != '/legal.php' ? ' class="page"' : ''?>>

<header>
    <div class="container" style="height:100%">
        <div class="row d-flex align-items-center" style="height:100%">
            <div class="col-3">
                <a href="<?=$logoURL?>">
                    <img loading="lazy" class="logo2" src="<?=$domain?>assets/images/mapo<?=$logo?>_logo.png" alt="<?=$siteProduct?> logo" title="<?=$siteProduct?> logo">
                    <img class="logo" src="<?=$domain?>assets/images/mapo<?=$logo?>_logo_transparent.png" alt="<?=$siteProduct?> logo" title="<?=$siteProduct?> logo">
                </a>
            </div>
            <div class="col text-right">
                <nav class="navbar">
                    <ul class="navbar_menu">
                        <li><a href="https://www.mapofire.com/?utm_campaign=front&utm_source=mapotechnology.com&utm_medium=header">wildfires</a></li>
                        <li><a href="https://www.mapotrails.com/?utm_campaign=front&utm_source=mapotechnology.com&utm_medium=header">trails</a></li>
                        <li><a href="<?=$domain?>about">about</a></li>
                        <li><a href="<?=$domain?>contact">contact</a></li>
                        <li><a href="<?=$domain.($_SESSION['uid'] ? 'account/home' : 'secure/login?ref=header')?>"><?=$_SESSION['uid'] ? 'Account' : 'Login'?></a></li>
                    </ul>
                    <div class="menu_icon" data-open="0">
                        <i class="fat fa-bars" aria-hidden="true"></i>
                    </div>
                </nav>
            </div>
        </div>
    </div>
</header>

<?if (!$frontPage) {?>
<div class="banner title">
    <div class="hero">
        <div class="container">
            <div class="row">
                <div class="col">
                    <h1><?=$title?></h1>
                </div>
            </div>
        </div>
    </div>
</div>
<?}?>