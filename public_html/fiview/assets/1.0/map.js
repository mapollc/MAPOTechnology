var map,
    terrain,
    usfs,
    osm,
    smark,
    smark2,
    lands,
    jurisdiction,
    layerControl,
    incidents = L.layerGroup(),
    assigned = [];

function getbbox() {
    var b = map.getBounds(),
        sw = b.getSouthWest(),
        ne = b.getNorthEast();

    return (b ? JSON.stringify({
        xmin: ne.lng,
        ymin: sw.lat,
        xmax: sw.lng,
        ymax: ne.lat,
        spatialReference: {
            wkid: 4326
        }
    }) : false);
}

function inPolygon(marker, poly) {
    var inside = false;
    var x = marker.getLatLng().lat,
        y = marker.getLatLng().lng;

    for (var ii = 0; ii < poly.getLatLngs().length; ii++) {
        var polyPoints = poly.getLatLngs()[ii];
        for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            var xi = polyPoints[i].lat,
                yi = polyPoints[i].lng;
            var xj = polyPoints[j].lat,
                yj = polyPoints[j].lng;

            var intersect = ((yi > y) != (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
    }

    return inside;
}

function search(q) {
    if (smark != undefined) {
        smark.removeFrom(map);
    }

    if (q.match(/([0-9.]+),\s?([\-0-9.]+)/gm)) {
        var a = q.replaceAll(' ', '').split(','),
            lat = parseFloat(a[0]),
            lon = parseFloat(a[1]);

        smark = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@' + L.version + '/dist/images/marker-icon.png',
                iconSize: [25, 41],
                className: 'gis'
            })
        })
        .on('rightclick')
            .on('click', function () {
                doGeo(lat, lon);
            })
            .addTo(map);

        map.setView([lat, lon], 11);
    } else {
        $('#search-results').html('<div id="result" class="no-click">Searching...</div>').show();

        $.ajax({
            url: 'https://api.mapotechnology.com/v1/search?key=c196d0958608ad2b7d4af2be078ecc54',
            /*url: 'https://nominatim.openstreetmap.org/search.php',*/
            method: 'POST',
            data: {
                q: q,
                cad: 1
            },
            dataType: 'json',
            success: function (r) {
                var res = '';

                if (r.rs) {
                    if (r.rs.length == 0) {
                        res = '<div id="result" class="no-click">No results found</div>';
                    } else {
                        for (var i = 0; i < r.rs.length; i++) {
                            if (r.rs[i].type == 'City') {
                                var name = '<b>' + r.rs[i].name + '</b><br><span style="font-weight:100">' + r.rs[i].county + ' County</span>';
                            } else {
                                var name = '<b>' + r.rs[i].name + '</b>, ' + r.rs[i].county + ' County, ' + r.rs[i].state +
                                    '<br><span style="font-weight:100">' + r.rs[i].geoType + '</span>';
                            }

                            res += '<div id="result" data-cat="' + r.rs[i].type + '" data-lat="' + r.rs[i].lat + '" data-lon="' + r.rs[i].lon + '">' + name + '</div>';
                        }
                    }

                    $('#search-results').html(res).show();
                }
            }
        });
    }
}

function raws(a, b) {
    $.ajax({
        url: 'https://api.synopticlabs.org/v2/stations/latest',
        method: 'GET',
        dataType: 'json',
        data: {
            token: '461a0d3f4c4b44d3876855c013d64b00',
            radius: a + ',' + b + ',' + 5,
            vars: 'air_temp,wind_speed,wind_direction,relative_humidity',
            units: 'temp|f,speed|mph',
            obtimezone: 'local',
            showemptystations: 0,
            status: 'active',
            networkimportance: '2,1',
            limit: 1
        },
        success: function (data) {

        }
    });
}

function getSupp(a, b) {
    /* get psa */
    $.get('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_PSA_Current/FeatureServer/0/query?where=1%3D1&geometry=' + b + ',' + a + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=PSANAME,PSANationalCode&returnGeometry=false&f=json', function (r) {
        $('#initial').append('<br><b>PSA:</b> ' + r.features[0].attributes.PSANAME + ' (' + r.features[0].attributes.PSANationalCode + ')');
    });

    /* get gacc */
    $.get('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_GACC_Current/FeatureServer/0/query?where=1%3D1&geometry=' + b + ',' + a + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=GACCAbbreviation&returnGeometry=false&f=json', function (r) {
        $('#initial').append('<br><b>GACC:</b> ' + r.features[0].attributes.GACCAbbreviation);
    });

    /* get landowner */
    $.get('https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Jurisdictional_Unit_(Public)/FeatureServer/0/query?where=1%3D1&geometry=' + b + ',' + a + '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=LandownerKind,LandownerCategory,LocalName&returnGeometry=false&f=json', function (r) {
        $('#initial').append('<br><b>Landowner:</b> ' + r.features[0].attributes.LandownerKind + (r.features[0].attributes.LandownerCategory != 'Private' ? '&nbsp;/&nbsp;' + r.features[0].attributes.LandownerCategory : '') + (r.features[0].attributes.LocalName ? ' (' + r.features[0].attributes.LocalName + ')' : ''));
    });
}

function doGeo(a, b) {
    var a = a.toFixed(6),
        b = b.toFixed(6),
        btn = '<input type="button" id="createNewInc" class="btn" data-lat="' + a + '" data-lon="' + b + '" style="margin:10px 0 0 0;background-color:var(--red);color:#fff" value="Create Incident">';

    $('#panel').html('<i id="close" class="far fa-xmark"></i>Getting geolocation data...').animate({
        left: '0px'
    }, 500);

    $.ajax({
        url: host + 'ajax/api/cad/geo',
        method: 'POST',
        data: {
            lat: a,
            lon: b
        },
        dataType: 'json',
        success: function (d) {
            getSupp(a, b);

            var r = d.response,
                c = '<i id="close" class="far fa-xmark"></i><span id="initial"><b>Coordinates:</b> ' + a + ', ' + b + '<br><b>Nearby:</b> ' + r.geolocation + '<br><b>County/State:</b> ' + r.county + ' / ' + r.state +
                    '<br><b>TRS:</b> ' + r.trs.t + ' ' + r.trs.r + ' S' + r.trs.s + (r.trs.ss ? '&nbsp;/&nbsp;' + r.trs.ss : '') + '<br>' +
                    '<b>Zone:</b> ' + r.zone + '</span>' + btn;

            $('#panel').html(c);
        }
    });
}

function unitStatus(s) {
    var v = '';
    switch (s) {
        case 'ava':
            v = 'Available';
            break;
        case 'asgn':
            v = 'Assigned';
            break;
        case 'com':
            v = 'Committed';
            break;
        case 'enr':
            v = 'Enroute';
            break;
        case 'ins':
            v = 'In-Service';
            break;
        case 'lea':
            v = 'Leaving Scene';
            break;
        case 'not':
            v = 'Notified';
            break;
        case 'ons':
            v = 'On Scene';
            break;
        case 'ous':
            v = 'Out-of-Service';
            break;
    }
    return v;
}

function getResources() {
    /* get units assigned to incidents */
    $.ajax({
        url: host + 'ajax/api/cad/resources',
        method: 'POST',
        data: {
            assigned: 1
        },
        dataType: 'json',
        success: function (u) {
            if (u.response.units) {
                for (var i = 0; i < u.response.units.length; i++) {
                    assigned.push({
                        inc: u.response.units[i].inc,
                        unit: u.response.units[i].unit,
                        status: u.response.units[i].status
                    });
                }
            }
        },
        complete: function () {
            getIncidents();
        }
    });
}

function getIncidents() {
    /* get current incidents in CAD */
    $.ajax({
        url: host + 'ajax/api/cad/incidents',
        method: 'POST',
        dataType: 'json',
        success: function (r) {
            if (r.response) {
                /* remove incident layers before re-adding*/
                incidents.getLayers().forEach(function (l) {
                    incidents.removeLayer(l);
                });

                for (var i = 0; i < r.response.length; i++) {
                    var assgn = '',
                        d = new Date(r.response[i].reported * 1000),
                        inc = r.response[i].juris + '-' + r.response[i].num;

                    /* check to see which units are assigned to this incident */
                    assigned.forEach(function (u) {
                        if (u.inc == inc) {
                            assgn += '<span class="status ' + u.status + '" title="' + unitStatus(u.status) + '" style="margin-right:5px">' + u.unit + '</span>'
                        }
                    });

                    var m = L.marker([r.response[i].geo.lat, r.response[i].geo.lon], {
                        icon: L.divIcon({
                            html: '<i class="' + (r.response[i].type.toLowerCase().search('fire') >= 0 ? 'fas fa-fire' : '') + '"></i>',
                            className: 'incident',
                            popupAnchor: [6, 11]
                        })
                    })
                        .bindPopup('<span style="font-size:18px;font-weight:bold;text-decoration:underline">' + r.response[i].name.toUpperCase() + ' (' + inc + ')</span><br><b>Type:</b> ' +
                            r.response[i].type + '<br><b>Status:</b> ' + (r.response[i].status == 1 ? 'Open' : 'Pending') + '<br><b>Discovered:</b> ' + d.toString().split(' GMT')[0] +
                            '<br><b>Resources:</b> ' + assgn);

                    incidents.addLayer(m);
                }

                map.addLayer(incidents);
            }
        }
    });
}

/* set basemaps */
terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    id: 'ESRI World Terrain',
    attribution: 'ESRI',
    maxZoom: 19
});

usfs = L.tileLayer('https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}', {
    id: 'USFS Lands',
    attribution: 'USFS',
    maxZoom: 17
})
    .setZIndex(999);

osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    id: 'OSM',
    attribution: 'OpenStreetMap'
});

lands = L.tileLayer.wms('https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_without_PriUnk/MapServer/export', {
    id: 'Land Ownership',
    transparent: true,
    layers: 'show:17',
    dpi: 96,
    format: 'png32',
    bboxSR: 102100,
    imageSR: 102100,
    size: '256,256',
    f: 'image',
    opacity: 0.75
})
    .setZIndex(998);

/* setup map */
map = L.map('map', {
    center: [45, -118],
    zoom: 7,
    layers: [incidents]
})
    .on('popupclose', function () {
        setTimeout(function () {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }, 400);
    })
    .on('zoomend', function () {
        var op;

        if (map.getZoom() > 10) {
            op = 0.75;
        } else {
            op = 1;
        }

        usfs.setOpacity(op);
    })
    .on('contextmenu', function (e) {
        var a = e.latlng.lat,
            b = e.latlng.lng;

        smark2 = L.marker([a, b], {
            draggable: true
        })
            .on('dragend', function (e) {
                doGeo(this.getLatLng().lat, this.getLatLng().lng);
            })
            /*.bindPopup('Loading...' + btn, {
                minWidth: 250,
                maxWidth: 275
            })
            .on('popupclose', function () {
                this.removeFrom(map);
            })*/
            .addTo(map)
            /*.openPopup()*/;

        doGeo(a, b);
    });

layerControl = L.control.layers({
    'Terrain': terrain,
    'OpenStreetMap': osm
}, {
    'USFS Boundaries': usfs,
    'Incidents': incidents,
    'Land Ownership': lands
})
    .addTo(map);

terrain.addTo(map);
usfs.addTo(map);

/* get incidents and assigned resources initially, then every 15 secs */
getResources();

setInterval(function () {
    getResources();
}, 150000);

/* get dispatch center zones and map them */
$.ajax({
    /*url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_Dispatch_Current/FeatureServer/0/query?where=DispUnitID+%3D+%27US' + agency_id + '%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson&token=',*/
    url: 'map/zones_' + agency.toUpperCase() + '.json',
    method: 'GET',
    dataType: 'json',
    success: function (d) {
        jurisdiction = L.geoJSON(d.features, {
            color: '#282829',
            weight: 2,
            fillOpacity: 0.1
        })
            .addTo(map);

        layerControl.addOverlay(jurisdiction, "Dispatch Zones");
        map.fitBounds(jurisdiction.getBounds());
    },
    complete: function () {
        /*raws();*/
    }
});

/* close panel */
$(document).on('click', '[id^=close]', function () {
    $('#panel').animate({
        left: '-300px'
    }, 500);

    if (smark != undefined) {
        smark.removeFrom(map);
    }

    if (smark2 != undefined) {
        smark2.removeFrom(map);
    }
});

/* controls on map */
$(document).on('click', '[id^=reset]', function () {
    map.fitBounds(jurisdiction.getBounds());
});

/* on search result click */
$(document).on('click', '[id^=result]', function () {
    if ($(this).hasClass('no-click') === false) {
        var lat = parseFloat($(this).attr('data-lat')),
            lon = parseFloat($(this).attr('data-lon'));

        smark = L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'https://unpkg.com/leaflet@' + L.version + '/dist/images/marker-icon.png',
                iconSize: [25, 41],
                className: 'gis'
            })
        })
            .on('click', function () {
                doGeo(lat, lon);
            })
            .addTo(map);

        map.setView([lat, lon], 14);

        $('#q').val('');
        $('#search-results').hide().html('');
    }
});

/* create a new incident based on map location */
$(document).on('click', '[id^=createNewInc]', function () {
    var lat = $(this).attr('data-lat'),
        lon = $(this).attr('data-lon');

    smark2.removeFrom(map);
    window.opener.createNewIncident(lat, lon);
});

/* search map */
$('#q').keypress(function (e) {
    if (e.which == 13) {
        search($(this).val());
        return false;
    }
});

$(document).on('keydown', function (e) {
    /* esc */
    if (e.which == 27) {
        $('#search-results').hide().html('');
    }
});