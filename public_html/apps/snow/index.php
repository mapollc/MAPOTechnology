<?
if (!$router->url('b')) {
    header('Location: https://apps.mapotechnology.com'. $_SERVER['REQUEST_URI'] . '/wallowas');
    exit();
}

session_start();

$dashboard = $router->url('b');
$title = ($dashboard == 'wallowas' ? 'Wallowa' : 'Blue') . ' Mountains';
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//api.mapotechnology.com/">
    <title><?=$title?> - Snow Dashboards | MAPO LLC</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="theme-color" content="#f99d1c">
    <meta name="robots" content="index,follow">
    <link href="<?= $_SERVER['SCRIPT_URI'] ?>" rel="canonical">
    <link rel="shortcut icon" href="https://www.mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
    <link href="https://www.mapotechnology.com/assets/css/global.css" rel="stylesheet">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600&display=swap">
    </noscript>
    <link href="https://apps.mapotechnology.com/src/snow/css/app.css" rel="stylesheet">
</head>
<body>

<div class="wrapper">
    <header>
        <div class="header">
            <a href="https://www.mapotechnology.com"><img class="logo" src="https://www.mapotechnology.com/assets/images/mapo_logo_transparent.png"></a>
            <div>
                <div class="toggle">
                    <span data-deg="f" class="selected">&deg;F</span>
                    <span data-deg="c">&deg;C</span>
                </div>
            </div>
        </div>
        <h1 class="title">Winter Dashboard: <?=$title?></h1>
    </header>
    <main>
        <div id="weather"></div>
    </main>

    <footer>
        &copy; <?=date('Y')?> MAPO LLC
    </footer>
</div>


<script async src="https://www.googletagmanager.com/gtag/js?id=G-J2PB456CE6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-J2PB456CE6');const dashboard = '<?=$dashboard?>';</script>
<script src="https://apps.mapotechnology.com/src/snow/js/app.js"></script>
</body>
</html>