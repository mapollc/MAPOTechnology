<?
session_start();
$isLoggedIn = isset($_SESSION['uid']);

if ($_GET['page'] == 'top-15') {
    $file = 'top.inc.php';
    $title = "Top 15 Largest Wildfires in US History - Wildfire Dashboard - Map of Fire";
    $desc = "Learn about the top 15 largest wildfires in US history on Map of Fire's BlazeBoard wildfire dashboard.";
} else {
    $file = 'dashboard.inc.php';
    $title = "BlazeBoard - Wildfire Dashboard - Map of Fire";
    $desc = "BlazeBoard is Map of Fire's wildfire dashboard, displaying active fires, fire size, suppression costs, personnel, and fuel types in one view.";
}
?>
<!DOCTYPE html>
<html lang="en-US">

<head>
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <title><?= $title ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <meta name="description" content="<?= $desc ?>" />
    <meta property="og:title" content="<?= $title ?>" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://www.mapotechnology.com/assets/images/preview_mapofire.png" />
    <meta property="og:image:alt" content="<?= $title ?>" />
    <meta property="og:image:width" content="1920" />
    <meta property="og:image:height" content="1080" />
    <meta property="og:site_name" content="Map of Fire" />
    <meta property="og:url" content="https://mapofire.com/blazeboard" />
    <meta property="fb:app_id" content="100092541746116" />
    <meta property="og:description" content="<?= $desc ?>" />
    <meta name="twitter:title" content="<?= $title ?>" />
    <meta name="twitter:description" content="<?= $desc ?>" />
    <meta name="twitter:image" content="//mapotechnology.com/assets/images/preview_mapofire.png">
    <link rel="stylesheet" href="//mapotechnology.com/assets/css/global.css">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="stylesheet" href="//mapofire.com/src/css/dashboard/main.css">
    <?if ($_GET['page'] == 'top-15') {?>
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/maplibre-gl@5.17.0/dist/maplibre-gl.min.css" media="print" onload="this.media='all'">
    <?}?>
    <script async src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="apple-touch-icon" sizes="114x114" href="//mapotechnology.com/assets/images/mf-apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="//mapotechnology.com/assets/images/mf-favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="//mapotechnology.com/assets/images/mf-favicon-16x16.png">
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/mf-favicon.ico" type="image/x-icon" />
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600;700&display=swap">
    </noscript>
</head>

<body id="<?= explode('.', $file)[0] ?>">
    <header>
        <div class="heading">
            <div class="title" title="Map of Fire Wi-Fire Dash">
                <img src="//mapotechnology.com/assets/images/mapofire_logo_transparent.png"
                    title="Map of Fire Wi-Fire Dash" alt="Map of Fire logo" loading="lazy" class="logo">
                <img src="//mapotechnology.com/assets/images/mapofire_icon_transparent.png"
                    title="Map of Fire Wi-Fire Dash" alt="Map of Fire logo" loading="lazy" class="icon">
                <h1>BlazeBoard</h1>
            </div>
            <div class="data">
                <p><?= $isLoggedIn ? "Hi, $_SESSION[first_name]" : '<a style="color:#fff" href="//auth.mapotechnology.com/login?service=mapofire&next=' . urlencode($_SERVER['REQUEST_URI']) . '">Login</a>' ?></p>
                <span id="now"></span>
            </div>
            <i id="menuIcon" class="fas fa-ellipsis-vertical"></i>
        </div>
    </header>

    <? require_once $file?>

    <footer>
        <p>&copy; <?= date('Y') ?> MAPO LLC</p>
        <ul class="footer-menu">
            <li><a href="//mapotechnology.com/about">About</a></li>
            <li><a href="//mapotechnology.com/about/contact">Contact</a></li>
            <li><a href="//mapotechnology.com/purchase/mapofire?utm_campaign=mapofire&utm_medium=footer&utm_source=blazeboard">Pricing</a></li>
            <li><a href="//mapotechnology.com/about/legal/terms">Terms</a></li>
            <li><a href="//mapotechnology.com/about/legal/privacy">Privacy</a></li>
        </ul>
    </footer>

    <!--<script async src="https://www.googletagmanager.com/gtag/js?id=G-X03WWLX3BJ"></script>-->
    <script src="../src/js/dashboard/main.js"></script>
    <!--<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X03WWLX3BJ'<?= isset($_COOKIE['guid']) ? ",{'user_id':'$_COOKIE[guid]'}" : '' ?>);</script>-->
</body>

</html>