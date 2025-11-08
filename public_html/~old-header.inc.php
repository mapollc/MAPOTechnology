<?
if ($_GET['test'] == 1) {
    require_once 'header2.inc.php';
} else {
////ini_set('display_errors',1);
////error_reporting(E_ALL);
ini_set('session.cookie_domain', str_replace('www', '', $_SERVER['HTTP_HOST']));
session_start();
$domain = 'https://www.mapotechnology.com/';
$metaDesc = $metaDesc ? $metaDesc : 'Creators of the Map of Fire wildfire map and Map of Trails recreation map. We develop graphical interface system technology and online content. Track wildfires and find recreation trails using our apps.';

if ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'com.mapollc.main' || $_GET['android'] == 1) {
    $android = 1;
}

$host = str_replace('www.', '', $_SERVER['HTTP_HOST']);

if ($host == 'mapotrails.com' || $host == 'lagranderide.com') {
    $site = 'mapotrails';
} else if ($host == 'mapofire.com' || $host == 'wildfiremap.org' || $host == 'fireweatheravalanche.org') {
    $site = 'mapofire';
} else {
    $site = 'mapo';
}

$websiteTitle = ($bktitle ? $bktitle : ($title ? $title.' - ' : '')).($site == 'mapotrails' ? 'Map-o-Trails' : ($site == 'mapofire' ? 'Map-o-Fire' : 'MAPO LLC')).($site == 'mapo' && $_SERVER['SCRIPT_NAME'] == '/index.php' ? ' - Oregon-based organization developing wildfire & recreation mapping technology' : '');
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
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?=$metaDesc?>">
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
    <meta property="og:image:alt" content="<?=($metaphoto ? $metacaption : 'MAPO LLC')?>">
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
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto@400;500&family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <link rel="stylesheet" href="<?=$domain?>src/css/global.css">
    <link rel="stylesheet" href="<?=$domain?>src/css/main.css">
    <?if($css){
    foreach ($css as $c) {
        echo '<link rel="stylesheet" href="'.$c.'"></script>
';
    }
    }?>
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="canonical" href="<?='https://'.$_SERVER['HTTP_HOST'].'/'.substr($_SERVER['REQUEST_URI'], 1)?>" />
    <link rel="shortlink" href="<?echo 'https://'.$_SERVER['HTTP_HOST'].'/'.substr($_SERVER['SCRIPT_NAME'], 1); if ($_GET){ echo '?'; foreach($_GET as $a => $b) { $cccc .= $a.'='.$b.'&'; } echo substr($cccc, 0, -1); }?>" />
    <style>.stat{padding:1rem;background-color:rgb(15 15 15 / 65%);border-radius:4px;text-align:center;color:#fff}.stat h2{font-size:2.5rem;font-weight:600;letter-spacing:1px;text-overflow:ellipsis;overflow-wrap:normal;overflow:hidden}.stat span{font-size:18px;font-weight:400}</style>
</head>
<body<?=($android==1 ? ' class="android"' : '')?>>

<?if($android != 1){?>
<header<?=($mapotrails === true && $trail->guide->media && count($trail->guide->media) == 0 ? ' class="dark" data-mt="1"' : '')?>>
    <div class="container" style="height:100%">
        <div class="row d-flex align-items-center" style="height:100%">
            <div class="col-3">
                <a href="<?=($site == 'mapotrails' ? 'https://www.'.$site.'.com/guides/trail' : $domain)?>">
                    <img class="logo2" <?=$mapotrails && $trail->guide->media && count($trail->guide->media) == 0 ? ' style="display:block"' : ''?>src="<?=$domain?>assets/images/mapo<?=($site=='mapotrails' ? 'trails' : ($site=='mapofire' ? 'fire' : ''))?>_logo.png" alt="MAPO LLC logo" title="MAPO LLC logo">
                    <img class="logo" <?=$mapotrails && $trail->guide->media && count($trail->guide->media) == 0 ? ' style="display:none"' : ''?>src="<?=$domain?>assets/images/mapo<?=($site=='mapotrails' ? 'trails' : ($site=='mapofire' ? 'fire' : ''))?>_logo_transparent.png" alt="MAPO LLC logo" title="MAPO LLC logo">
                </a>
            </div>
            <div class="col text-right">
                <nav class="navbar">
                    <ul class="navbar_menu">
                        <li><a href="https://www.mapofire.com/?utm_campaign=front&utm_source=mapotechnology.com&utm_medium=header">wildfires</a></li>
                        <li><a href="https://www.mapotrails.com/?utm_campaign=front&utm_source=mapotechnology.com&utm_medium=header">trails</a></li>
                        <li><a href="<?=$domain?>about">about</a></li>
                        <li><a href="<?=$domain?>contact">contact</a></li>
                        <li><a href="<?=$domain.($loginLink ? $loginLink : 'account/home')?>"><?=($_SESSION['uid'] ? 'Account' : 'Login')?></a></li>
                        <!--<li class="navbar-user"><a href="secure/login"><i class="fal fa-user-circle" aria-hidden="true"></i><span>my account</span></a></li>-->
                    </ul>
                    <div class="menu_icon" data-open="0">
                        <i class="far fa-bars" aria-hidden="true"></i>
                    </div>
                </nav>
            </div>
        </div>
    </div>
</header>
<?}?>

<?if ($frontPage !== true && $mapotrails !== true) {?>
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
<?}}?>