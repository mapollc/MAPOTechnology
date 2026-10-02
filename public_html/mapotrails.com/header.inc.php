<?
$host = str_replace('www.', '', $_SERVER['HTTP_HOST']);
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

ini_set('session.cookie_domain', ".$host");
ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Expires: 0');

session_start();

include_once '/home/mapo/guid.inc.php';
setupGUID();

$domain = 'https://mapotrails.com/';

$title = ($title ? "$title - " : '') . 'Map of Trails';
$metaDesc ??= $metaDesc ?? '';
$metaPhoto ??= $metaPhoto ?? '';

ob_start();
?>
<!DOCTYPE html>

<html lang="en-US">

<head>
    <meta charset="utf-8">
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <title><?= $title ?></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1">
    <meta name="description" content="<?= $metaDesc ?>">
    <meta property="og:title" content="<?= $title ?>">
    <meta property="og:description" content="<?= $metaDesc ?>">
    <meta property="og:type" content="<?= $ogtype ?: 'website' ?>">
    <? if (isset($trail)) { ?>
        <meta property="article:published_time" content="<?= date('Y-m-d\TH:i:sO', $trail['created']) ?>">
        <meta property="article:modified_time" content="<?= date('Y-m-d\TH:i:sO', $trail['updated']) ?>">
    <? } ?>
    <meta property="og:site_name" content="Map of Trails">
    <meta property="og:url" content="//<?= $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?>">
    <meta property="og:image" content="<?= ($metaPhoto ?: '//mapotechnology.com/assets/images/mapotrails_logo.png') ?>">
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="//<?= $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?>">
    <meta property="twitter:title" content="<?= $title ?> | Map of Trails">
    <meta property="twitter:description" content="<?= $metaDesc ?>">
    <meta property="twitter:image" content="<?= $metaphoto ?: '//mapotechnology.com/assets/images/mapotrails_logo.png' ?>">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#ffc65c">
    <meta name="robots" content="index,follow">
    <link rel="apple-touch-icon" sizes="114x114" href="//mapotechnology.com/assets/images/mt-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="//mapotechnology.com/assets/images/mt-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="//mapotechnology.com/assets/images/mt-favicon-16x16.png">
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/mt-favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="//mapotechnology.com/src/css/global.css" />
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600&display=swap">
    </noscript>
    <link rel="stylesheet" href="//www.mapotrails.com/src/css/mapotrails.css" />
    <? if ($includeMaplibre) { ?>
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/maplibre-gl@6.1.0/dist/maplibre-gl.min.css">
    <? } ?>
    <script src="//kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
</head>

<body>

    <header class="navbar">
        <div class="logo">
            <a href="<?= $domain ?>">
                <img src="//mapotechnology.com/assets/images/mapotrails_logo.png" class="logo">
            </a>
        </div>

        <ul class="nav-links<?= isset($_SESSION['uid']) ? ' auth' : '' ?>">
            <li><a href="<?= $domain ?>about">About</a></li>
            <li><a href="<?= $domain ?>guides">Guides</a></li>
            <li><a href="<?= $domain ?>">Trail Map</a></li>
            <? if (!$_SESSION['uid']) { ?>
                <li><a class="btn btn-orange sharp" href="//auth.mapotechnology.com/login?service=mapotrails&next=<?= urlencode('//' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']) ?>">Login</a></li>
            <? } else { ?>
                <li><a class="btn btn-orange sharp" href="//mapotechnology.com/account/home?ref=mapotrails">Account</a></li>
            <? } ?>
        </ul>

        <div class="header-controls">
            <button class="mobile-nav-toggle" aria-label="Toggle navigation">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>
        </div>
    </header>
<?
$headerContent = ob_get_clean();
?>