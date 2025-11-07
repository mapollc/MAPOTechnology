<!DOCTYPE html>
<html>

<head>
    <link href="https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.css" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
        }

        html,
        body,
        #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0
        }

        .leaflet-control-attribution {
            display: none!important;
        }
    </style>
</head>

<body>

    <div id="map"></div>

    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet-src.min.js"></script>
    <script>
        var map, osm, terrain;

        map = L.map('map', {
                preferCanvas: true,
                renderer: L.canvas(),
                zoomControl: false,
                touchZoom: false,
                dragging: false,
                tap: false
            })
            .setView([<?=$_GET['lat']?>, <?=$_GET['lon']?>], 5);

        osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            id: 'OSM',
            minZoom: 0,
            maxZoom: 19
        });
        
        terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
            id: 'Terrain',
            minZoom: 3,
            maxZoom: 18,
        });

        carto = L.tileLayer('https://a.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png', {
            id: 'DeLorme',
            minZoom: 3,
            maxZoom: 18,
        });
    
        osm.addTo(map);

        $.ajax({
            url: 'https://api.weather.gov/zones/fire/<?=$_GET['zone']?>',
            method: 'GET',
            dataType: 'json',
            success: function(g) {
                var b = L.geoJSON(g, {
                        style: function(feature) {
                            return {
                                /*color: '#ed254e'*/
                                color: '#282829'
                            }
                        }
                    })
                    .addTo(map);

                map.fitBounds(b.getBounds());
            }
        });
    </script>
</body>

</html>