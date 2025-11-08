<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);
include_once '/home/mapo/public_html/subs.inc.php';

function generateFooter($js = null) {
    $footer = '';
    if ($js) {
        foreach ($js as $j) {
            $footer .= '<script src="'.$j.'"></script>
    ';
        }
    }

    $footer .= "<script async defer src=\"https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6\"></script>
    <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6');document.querySelector('.menu-control').addEventListener('click',(e)=>{if (e.target.classList.contains('fa-bars')){e.target.classList.remove('fa-bars');e.target.classList.add('fa-xmark');document.querySelector('header nav ul').style.height='fit-content';}else{e.target.classList.add('fa-bars');e.target.classList.remove('fa-xmark');document.querySelector('header nav ul').style.height=0;}});</script>
";    

    $footer .= '
    <footer><div class="container"><p style="letter-spacing:1px">&copy; '.date('Y').' MAPO LLC</p><div class="footer-menu"><ul>
    <li><a href="https://www.mapotechnology.com/about">About</a></li>
    <li><a href="https://www.mapotechnology.com/about/contact">Contact</a></li>
    <li><a href="https://www.mapotechnology.com/checkout">Donate</a></li>
    <li><a href="https://www.mapotechnology.com/about/legal/terms">Terms</a></li>
    <li><a href="https://www.mapotechnology.com/about/legal/privacy">Privacy</a></li>
    </ul></div></div></footer>
    </body></html>';

    return $footer;
}

$domain = 'https://www.mapotrails.com/';

if ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'com.mapollc.main' || $_GET['android'] == 1) {
    $android = 1;
}

if ($_COOKIE['token'] || $_SESSION['token']) {
    $json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/subscriptions?key=cf707f0516e5c1226835bbf0eece4a0c&token='.($_COOKIE['token'] ? $_COOKIE['token'] : ($_SESSION['token'] ? $_SESSION['token'] : ''))))->subscriptions;
    
    if ($json) {
        foreach ($json as $s) {
            if ($s->plan == $mapoSubscriptions['mapotrails'][($stripeLive ? 'live' : 'test')]) {
                $subscribe = array('active' => true, 'plan' => $s->plan, 'is_trial' => $s->is_trial, 'created' => $s->purchased, 'start' => $s->period_start, 'ends' => $s->period_end);
            }
        }
    } else {
        $subscribe = array('active' => false);
    }
}
?>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" version="XHTML+RDFa 1.0" dir="ltr" xmlns:fb="http://ogp.me/ns/fb#" xmlns:og="http://ogp.me/ns#">
<head>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <title><?=$title?> | Map of Trails</title>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1">
    <meta name="description" content="<?=$metaDesc?>">
    <meta property="og:title" content="<?=$title?> | Map of Trails">
    <meta property="og:description" content="<?=$metaDesc?>">
    <meta property="og:type" content="<?=($ogtype ? $ogtype : 'website')?>">
    <?if($ogtype == 'article'){?>
<meta property="article:published_time" content="<?=date('Y-m-d\TH:i:sO', $article['created'])?>">
    <meta property="article:modified_time" content="<?=date('Y-m-d\TH:i:sO', $article['updated'])?>">
    <?}if($trail->guide->metadata->geo){?>
<meta property="place:location:latitude" content="<?=$trail->guide->metadata->geo[0]?>"/>
    <meta property="place:location:longitude" content="<?=$trail->guide->metadata->geo[1]?>"/>
    <?}?>
<meta property="og:site_name" content="Map of Trails">
    <meta property="og:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="og:image" content="<?=($metaphoto ? $metaphoto : 'https://www.mapotechnology.com/assets/images/mapotrails_logo.png')?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>">
    <meta property="twitter:title" content="<?=$title?> | Map of Trails">
    <meta property="twitter:description" content="<?=$metaDesc?>">
    <meta property="twitter:image" content="<?=($metaphoto ? $metaphoto : 'https://www.mapotechnology.com/assets/images/mapotrails_logo.png')?>">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#ffc65c">
    <meta name="robots" content="index,follow">
    <link rel="apple-touch-icon" sizes="114x114" href="https://www.mapotechnology.com/assets/images/mt-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.mapotechnology.com/assets/images/mt-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.mapotechnology.com/assets/images/mt-favicon-16x16.png">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/mt-favicon.ico" type="image/x-icon" />
    <?if($includeMapbox){?>
    <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/v3.2.0/mapbox-gl.css" />   
    <?}?>
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css" />
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;600&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;600&family=Noto+Sans:wght@200;400&display=swap">
    </noscript>
    <link rel="stylesheet" href="https://www.mapotrails.com/src/css/mapotrails.css" />
    <?if($css){
    foreach ($css as $c) {
    echo '<link rel="stylesheet" href="'.$c.'" />
';
    }}?>
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="canonical" href="<?='https://'.$_SERVER['HTTP_HOST'].'/'.substr($_SERVER['REQUEST_URI'], 1)?>" />
    <link rel="shortlink" href="<?echo 'https://'.$_SERVER['HTTP_HOST'].'/'.substr($_SERVER['SCRIPT_NAME'], 1); if ($_GET){ echo '?'; foreach($_GET as $a => $b) { $cccc .= $a.'='.$b.'&'; } echo substr($cccc, 0, -1); }?>" />
</head>
<body<?=($android==1 ? ' class="android"' : '')?>>
    
<header<?//=$guideTitle ? ' class="dark"' : ''?>>
    <nav>
        <a href="<?=$domain?>"><img src="https://www.mapotechnology.com/assets/images/mapotrails_logo<?//=$guideTitle ? '_transparent' : ''?>.png" class="logo"></a>
        <ul>
            <li><a href="<?=$domain?>about">About</a></li>
            <li><a href="<?=$domain?>guides">Guides</a></li>
            <li><a href="<?=$domain?>">Trail Map</a></li>
            <?if(!$_SESSION['uid']){?>
            <li><a class="btn btn-sm btn-orange sharp" href="https://www.mapotechnology.com/secure/login?service=mapotrails&next=<?=urlencode('https://'.$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI'])?>">Login</a></li>
            <?}else{?>
            <li><a class="btn btn-sm btn-orange sharp" href="https://www.mapotechnology.com/account/home?ref=mapotrails">Account</a></li>
            <?}?>
        </ul>
        <div class="menu-control"><i class="far fa-bars"></i></div>
    </nav>
</header>

<?if($bannerImage && $guideTitle){?>
<div class="banner" style="<?=!isset($bannerImage) ? 'background-image:url(//cdn.mapotrails.com/display/pxl_20210926_185531292.jpg)' : $bannerImage?>">
    <div class="hero">
        <div class="container">
            <?=$_GET['tid'] && $_GET['category'] && $trail->guide->metadata->premium == 1 ? '<span class="premium">Premium Guide</span>' : ''?>
            <h1><?=$guideTitle ? $guideTitle : $title?></h1>
        </div>
    </div>
</div>
<?}else{
    echo '<div style="margin-top:var(--header-height)"></div>';   
}?>