<?
session_start();
$versions = [
    'maplibre' => '5.6.2',
    'turf' => '7.2.0',
    'mustache' => '4.2.0',
    'chartist' => '1.5.0'
]
?>
<!DOCTYPE html>
<html lang="en-US">

<head>
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//services.arcgis.com">
    <link rel="preconnect" href="//services2.arcgis.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <link rel="preconnect" href="//mapotechnology.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <title>TornadoIQ: Tornado Tracks and Risk Viewer - MAPO LLC</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@<?= $versions['maplibre'] ?>/dist/maplibre-gl.min.css" rel="stylesheet" />
    <link href="https://apps.mapotechnology.com/src/toriq/css/main.css" rel="stylesheet">
    <?/*<link href="main.css" rel="stylesheet">*/?>
    <script src="https://kit.fontawesome.com/aa68e0c9b6.js" crossorigin="anonymous"></script>
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <link rel="preload" href="https://cdn.jsdelivr.net/npm/chartist@<?= $versions['chartist'] ?>/dist/index.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/chartist@<?= $versions['chartist'] ?>/dist/index.min.css">
        <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap">
    </noscript>
    <link rel="shortcut icon" href="https://www.mapotechnology.com/images/favicon.ico" type="image/x-icon" />
</head>

<body>

    <main>
        <div id="map"></div>

        <span id="menuIcon" data-action="dropdown-nav" class="fas fa-bars"></span>
        <div class="filter-controls">
            <div class="search control">
                <span class="far fa-magnifying-glass"></span>
                <input type="text" id="q" autocomplete="off" disabled placeholder="Search for cities...">
                <ul id="search-results" class="control">
                    <li class="standby" style="gap:.5em">
                        <i class="fa-duotone fa-spinner-third"></i><span>Searching...</span>
                    </li>
                </ul>
            </div>

            <div class="dropdown-button disabled">
                <button class="dd control" disabled data-item="settings">
                    <i class="fas fa-cog"></i>
                    <span class="arrow" style="z-index:0"></span>
                </button>
                <ul class="list control" data-item="settings"></ul>
            </div>

            <div class="dropdown-button disabled">
                <button class="dd control" disabled data-item="mag">
                    <i class="fas fa-tornado"></i>
                    <span class="label">EF Rating</span>
                    <span class="arrow" style="z-index:0"></span>
                </button>
                <ul class="list control" data-item="mag"></ul>
            </div>

            <div class="dropdown-button disabled">
                <button class="dd control" disabled data-item="months">
                    <i class="far fa-calendar"></i>
                    <span class="label">Months</span>
                    <span class="arrow" style="z-index:0"></span>
                </button>
                <ul class="list control" data-item="months"></ul>
            </div>

            <div id="data-loading" class="loading"></div>
        </div>
    </main>

    <div id="modal"></div>

    <script src="https://apps.mapotechnology.com/src/toriq/js/arcgis.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@<?= $versions['maplibre'] ?>/dist/maplibre-gl.min.js"></script>
    <script async src="https://apps.mapotechnology.com/src/toriq/js/modal.js"></script>
    <script src="https://apps.mapotechnology.com/src/toriq/js/main.js"></script>
    <script async defer src="https://cdn.jsdelivr.net/npm/@turf/turf@<?= $versions['turf'] ?>/turf.min.js"></script>
    <script async defer src="https://cdn.jsdelivr.net/npm/mustache@<?= $versions['mustache'] ?>/mustache.min.js"></script>
    <script async defer src="https://cdn.jsdelivr.net/npm/chartist@<?= $versions['chartist'] ?>/dist/index.umd.min.js"></script>
</body>

</html>