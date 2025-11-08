<?
session_start();
require('../config.inc.php');
require('../secure.inc.php');

$aid = strtoupper($_GET[agency]);
$a = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$aid'"));
$loc = unserialize($a[geo]);
?>
<!DOCTYPE html>
<html>
<head>
<title>WildUSA Mapping - <?=$a[fullname]?></title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@<?=$versions['leaflet']?>/dist/leaflet.css">
<style>
*{box-sizing:border-box}
html,body,#map{width:100%;height:100%;margin:0;padding:0}
path.leaflet-interactive{cursor:grab}
.leaflet-popup-content-wrapper, .leaflet-popup-tip{background-color:#4a4a4a;color:#f5f5f5}
.leaflet-popup-content{margin:10px 12px}
.leaflet-popup-content p{margin:0}
.status{font-weight:bold}
.status.enr{color:#ff3bc3}
.status.ons{color:#ff2323}
.status.lea{color:#00ff00}
.status.not{color:#817fff}
.status.avos{color:#ff991b}
.status.com{color:#fbff08}
.status.ava{color:#50ec34}
.status.ins{color:#5ff1e2}
.status.ous{color:#bbb}
</style>
</head>
<body>

<div id="map" data-lat="<?=$loc[lat]?>" data-lon="<?=$loc[lon]?>"></div>

<script src="https://code.jquery.com/jquery-<?=$versions['jquery']?>.min.js"></script>
<script src="https://unpkg.com/leaflet@<?=$versions['leaflet']?>/dist/leaflet.js"></script>
<script>
var map,
    osm,
		juris,
		agency = '<?=$_GET[agency]?>',
		host = '<?=$baseurl?>/',
		mlat = parseFloat($('#map').attr('data-lat')),
		mlon = parseFloat($('#map').attr('data-lon')),
		active_incidents = [],
		pending_incidents = [],
		resources = [],
		cur_inc_ids = [];

function boundary() {
  $.ajax({
	  url: 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/National_Dispatch_Current/FeatureServer/0/query?where=DispUnitID+%3D+%27USORBMC%27&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=',
		method: 'GET',
		dataType: 'json',
		success: function(geo) {
		  juris = L.geoJSON(geo, {
				style: {
				  color: '#000',
					weight: 2,
					fillColor: 'red',
					fillOpacity: 0.05
				}
			}).addTo(map);
			
			map.fitBounds(juris.getBounds());
		}
	});
}

function getResources() {
  $.ajax({
    url: host + 'ajax/api/cad/resources',
    method: 'POST',
    data: {
      agency: agency
    },
    dataType: 'json',
    success: function(r) {		
			if (r.response.units && r.response.units.length > 0) {
		    for (var i = 0; i < r.response.units.length; i++) {
					resources.push(r.response.units[i]);
			  }
			}
		}
	});
}

function resourceStatus(s) {
  var r = '';
  switch (s) {
    case 'ava':
      r = 'Available';
      break;
    case 'enr':
      r = 'Enroute';
      break;
    case 'ons':
      r = 'On-Scene';
      break;
    case 'lea':
      r = 'Leaving Scene';
      break;
    case 'not':
      r = 'Notified';
      break;
    case 'avos':
      r = 'Available On-Scene';
      break;
    case 'com':
      r = 'Committed';
      break;
    case 'ins':
      r = 'In Service';
      break;
    case 'ous':
      r = 'Out of Service';
      break;
  }
  return r;
}

function getIncRes(num) {
  var ia = [];
	
	for (var i = 0; i < resources.length; i++) {
	  if (num == resources[i].inc) {
		  ia.push([resources[i].unit, resources[i].status]); 
		}
	}
	
	return ia;
}

$(document).ready(function () {
  map = L.map('map').setView([mlat, mlon], 8),
  osm = L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        id: 'OSM',
        minZoom: 3,
        maxZoom: 18
      }),
  
  fs = L.tileLayer('https://apps.fs.usda.gov/fsgisx05/rest/services/wo_nfs_gtac/EGIS_RecreationBasemap_01/MapServer/tile/{z}/{y}/{x}', {
        id: 'USFS',
        minZoom: 3,
        maxZoom: 18,
        zIndex: 21
      });
  		
  osm.addTo(map);
  fs.addTo(map);
  
  getResources();
	boundary();
	
  $.ajax({
    url: host + 'ajax/api/cad/incidents',
    method: 'POST',
    data: {
      agency: agency,
			map: 1
    },
    dataType: 'json',
    success: function(r) {
		  if (r.response.active && r.response.active.length > 0) {
        for (var i = 0; i < r.response.active.length; i++) {
          if (cur_inc_ids.includes(r.response.active[i].id) === false) {
  				  var iares = '';
						num = r.response.active[i].jurisdiction.substr(2, r.response.active[i].jurisdiction.length) + '-' + r.response.active[i].num;
						var res = getIncRes(num);
						for (var x = 0; x < res.length; x++) {
						  if (res[x][0] && res[x][1]) {
							  iares += '<span class="status ' + res[x][1] + '" title="' + resourceStatus(res[x][1]) + '">' + res[x][0] + '</span>';
							}
						}
						
						var m = L.marker([r.response.active[i].geo.lat, r.response.active[i].geo.lon], {
										  title: r.response.active[i].name
										})
										.bindPopup('<p style="text-align:center"><b style="font-size:14px">' + r.response.active[i].name + '</b><br>' + new Date(r.response.active[i].reported*1000).getFullYear() + '-' + r.response.active[i].jurisdiction + '-' + r.response.active[i].num + '<br><span style="line-height:250%;font-weight:bold;text-decoration:underline">Resources</span><br>' + iares + '</p>')
										.addTo(map);
						active_incidents.push(m);
						
            cur_inc_ids.push(r.response.active[i].id);
          }
        }
			}
      
		  if (r.response.pending && r.response.pending.length > 0) {
  			for (var i = 0; i < r.response.pending.length; i++) {
          if (cur_inc_ids.includes(r.response.pending[i].id) === false) {
  				  var iares = '';
  				  var num = r.response.pending[i].jurisdiction.substr(2, r.response.pending[i].jurisdiction.length) + '-' + r.response.pending[i].num;
						var res = getIncRes(num);
						for (var x = 0; x < res.length; x++) {
						  if (res[x][0] && res[x][1]) {
							  iares += '<span class="status ' + res[x][1] + '" title="' + resourceStatus(res[x][1]) + '">' + res[x][0] + '</span>';
							}
						}

						var m = L.marker([r.response.pending[i].geo.lat, r.response.pending[i].geo.lon], {
										  title: r.response.pending[i].name
										})
										.bindPopup('<p style="text-align:center"><b style="font-size:14px">' + r.response.pending[i].name + '</b><br>' + new Date(r.response.pending[i].reported*1000).getFullYear() + '-' + r.response.pending[i].jurisdiction + '-' + r.response.pending[i].num + '<br><span style="line-height:250%;font-weight:bold;text-decoration:underline">Resources</span><br>' + iares + '</p>')
										.addTo(map);
						pending_incidents.push(m);
          
            cur_inc_ids.push(r.response.pending[i].id);
					}
        }
			}
    }
  });
});
</script>
</body>
</html>