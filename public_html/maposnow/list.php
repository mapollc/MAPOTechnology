<?
session_start();

include_once('../db.ini.php');
$sql = mysqli_query($con, "SELECT * FROM snow_dashboards WHERE active = 1 ORDER BY state ASC, dashboard ASC");
mysqli_close($con);

while ($row = mysqli_fetch_assoc($sql)) {
    $set = unserialize($row['settings']);
    $geo = array('lat' => $set['lat'], 'lng' => $set['lng'], 'z' => $set['z']);
    $dashboards[] = array('state' => $row['state'], 'long_state' => $set['long_state'], 'dashboard' => $row['dashboard'], 'name' => $row['name'], 'wfo' => $set['wfo'], 'geo' => $geo, 'shape' => $set['geo']);
}
?>
<!DOCTYPE html>
<html>
<head>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//api.mapbox.com">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Winter Recreation & Snow Dashboard - Map-o-Snow</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=2, user-scalable=1" />
    <meta name="description" content="">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#3b5b72" />
    <meta name="robots" content="noindex,nofollow">
    <link rel="preload" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Noto+Sans:wght@200;400&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Dosis:wght@400;600;800&family=Noto+Sans:wght@200;400&display=swap"></noscript>
    <link href='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css' rel='stylesheet' />
    <script src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link href="./style.css" rel="stylesheet">
    <link rel="canonical" href="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['PHP_SELF'].'?'.$_SERVER['QUERY_STRING']?>" />
    <link rel="shortlink" href="https://<?=$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']?>" />
</head>
<body>

<header>
    <div class="container">
        <div class="head">
            <a href="https://www.mapotechnology.com"><img class="logo" src="https://www.mapotechnology.com/assets/images/mapo_logo_transparent.png"></a>
            <a href="<?=$acctLink?>"><i class="fa<?=($_SESSION['uid'] ? 's' : 't')?> fa-circle-user" style="margin-right:5px"></i> <?=($_SESSION['uid'] ? 'Hello, '.$_SESSION['first_name'] : 'Login')?></a>
        </div>
    </div>
</header>

<main>
    <div class="container">
        <h1>Map-o-Snow Dashboards</h1>
        <p style="margin:10px 0 15px 0">Description...</p>
        <div id="map" style="width:100%;height:600px"></div>
    </div>
</main>

<footer>
    <div class="container">
        &copy; <?=date('Y')?> MAPO LLC
    </div>
</footer>

<script>let dashboards = <?=json_encode($dashboards)?>;</script>
<script src='https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js'></script>
<script async defer src="https://cdn.jsdelivr.net/npm/frappe-charts@1.2.4/dist/frappe-charts.min.iife.js"></script>
<script async defer src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
let map;

function displayBoards() {
    dashboards.forEach((b, i) => {
        let c = [];
        
        b.shape.forEach((e) => {
            c.push([e.lng, e.lat]);
        });

        map.addSource('outline' + i, {
            'type': 'geojson',
            'data': {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [c]
                },
                properties: {
                    name: b.name,
                    state: b.state,
                    long_state: b.long_state,
                    dashboard: b.dashboard
                }
            }
        });

        map.addLayer({
            'id': 'fil' + i,
            'type': 'fill',
            'source': 'outline' + i,
            'layout': {},
            'paint': {
                'fill-color': '#0080ff',
                'fill-opacity': 0.5
            }
        });

        map.addLayer({
            'id': 'otl' + i,
            'type': 'line',
            'source': 'outline' + i,
            'layout': {},
            'paint': {
                'line-color': '#0080ff',
                'line-opacity': 1
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    map = new mapboxgl.Map({
        container: 'map',
        center: [-116.1, 45.32],
        zoom: 5.3,
        minZoom: 5.3,
        hash: false,
        style: 'mapbox://styles/mapbox/light-v11',
        accessToken: 'pk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5qb3V0dHQxMjRjMmxvOTJkYmRwYm83In0.vG5mhiv4FkkIranN7uySVQ'
    })
    .on('click', (e) => {
            const f = map.queryRenderedFeatures([e.point.x, e.point.y]);

            /* clicking on snotels */
            if (f.length > 0) {
                f.forEach((feature) => {
                    if (feature.layer.id.search('fil') >= 0) {
                        new mapboxgl.Popup({
                            offset: 25,
                            maxWidth: 75
                        })
                            .setLngLat([e.lngLat.lng, e.lngLat.lat])
                            .setHTML('<b>' + feature.properties.long_state + ' / ' + feature.properties.name + '</b><br>' +
                                '<a href="./dashboard/' + feature.properties.state + '/' + feature.properties.dashboard + '">View Dashboard</a>')
                            .setMaxWidth("300px")
                            .addTo(map);
                    }
                });
            }
        })
    .on('load', () => {
        /* get snotel layer */
        map.addSource('snotels', {
                type: 'vector',
                url: 'mapbox://mapollc.clnvzgl9v2vzd2blkijt84icc-1gjxv'
            });

            /* add snotels to map */
            map.addLayer({
                'id': 'snotels',
                'type': 'circle',
                'source': 'snotels',
                'source-layer': 'snotels',
                'filter': ['!=', 'networkCode', 'COOP'],
                'paint': {
                    'circle-color': '#38428b',
                    'circle-stroke-color': '#f9f9f9',
                    'circle-stroke-width': 2,
                    'circle-radius': {
                        'base': 3,
                        'stops': [
                            [7, 5],
                            [10, 8]
                        ]
                    }
                }
            });

            /* add labels for snotels */
            map.addLayer({
                'id': 'symbols',
                'type': 'symbol',
                'source': 'snotels',
                'minzoom': 8,
                'source-layer': 'snotels',
                'filter': ['==', 'networkCode', 'SNTL'],
                'layout': {
                    'symbol-placement': 'point',
                    'text-font': ['Open Sans Regular'],
                    'text-field': '{name}',
                    'text-size': 12,
                    'text-offset': [0, 1.35],
                    'text-justify': 'center',
                    'text-letter-spacing': 0,
                    'text-allow-overlap': false
                },
                'paint': {
                    'text-color': '#222',
                    'text-halo-blur': 0,
                    'text-halo-width': 0.5,
                    'text-halo-color': '#ccc'
                }
            });

            displayBoards();
    });

    map.addControl(new mapboxgl.NavigationControl());
});
</script>

</body>
</html>