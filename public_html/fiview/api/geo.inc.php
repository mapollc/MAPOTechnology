<?
/*$con2 = mysqli_connect('localhost', 'fwavyc5_fwac', 'fwac2017');
if(!$con2){ die('Could not connect: ' . mysqli_connect_error()); }
mysqli_select_db($con2, "fwac");*/

//https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Jurisdictional_Unit_(Public)/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=%7B%0D%0A++%22y%22%3A+45.090813%2C%0D%0A++%22x%22%3A+-117.459521%2C%0D%0A++%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%0D%0A%7D&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=false&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=true&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=html&token=

function getZone($lat, $lon) {
    global $agency;
    
    $json = json_decode(file_get_contents('../map/zones_'.strtoupper($agency).'.json'));
    for($i = 0; $i < count($json->features); $i++) {
        $f = $json->features[$i];
        $vertices_x = [];
        $vertices_y = [];
        $points_polygon = $f->geometry->coordinates[0];
        foreach ($points_polygon as $c) {
            $vertices_x[] = $c[0];
            $vertices_y[] = $c[1];
        }
        
        if (polygon(count($points_polygon) - 1, $vertices_x, $vertices_y, $lon, $lat)) {
            return $f->properties->title;
        }
    }
}

$lat  = $_REQUEST['lat'];
$lon  = $_REQUEST['lon'];
$lat1 = floor($lat) - 0.5;
$lat2 = ceil($lat) + 0.5;
$lon1 = ceil($lon) + 0.5;
$lon2 = floor($lon) - 0.5;

$loc = get_data('https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=%7B%22x%22%3A+'.$lon.'%2C+%22y%22%3A+'.$lat.'%2C+%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&outFields=NAME%2CSTATE_NAME&returnGeometry=false&returnQueryGeometry=false&f=json');
$json = get_data('https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/exts/CadastralSpecialServices/GetTRS?lat=' . $lat . '&lon=' . $lon . '&units=DD&returnalllevels=true&f=json');
$zone = getZone($lat, $lon);

$np = mysqli_query($con, "SELECT * FROM $db.cities WHERE (lat >= '$lat1' AND lat <= '$lat2') AND (lon >= '$lon1' AND lon <= '$lon2') ORDER BY CAST(population AS INT) DESC");
if (mysqli_num_rows($np) == 0) {
    $closest = 1;
    $np = mysqli_query($con2, "SELECT * FROM cities");
}
 
while($row = mysqli_fetch_assoc($np)) {
    $dist = distance($lat, $lon, $row['lat'], $row['lon']);
    $bear = getBearing($row['lat'], $row['lon'], $lat, $lon);
    
    if($_REQUEST['full'] == 1) {
        $location[] = $row;
    } else {
        $location[] = $row['city'] . ', ' . $row['state_prefix'];
    }

    $distances[] = $dist;
    $bearings[]  = $bear;
    $pop[]       = $row['population'];
}
//mysqli_close($con2);

asort($distances);
asort($pop);
 
$med = (array_sum($pop) / count($pop));
#$med = $med+($med*.1);

foreach($distances as $key => $d) {
    if($closest == 1) {
        $usethis = $key;
        break;
    } else {
        //if($pop[$key] >= $med) {
        if($pop[$key] > 1000 && $d < 40){
            $usethis = $key;
            break;
        }
    }
}

if(!$usethis) {
    foreach($distances as $key => $d){
	    if($pop[$key] >= $med){
            $usethis = $key;
            break;
	    }
    } 
}
	
$aik = $usethis;
$land = ($json['features'] ? $json['features'][0]['attributes']['landdescription'] : $json['alllevels']['township']['features'][0]['attributes']['landdescription']);
$t = ltrim(substr($land, 5, 2), 0) . ltrim(substr($land, 7, 2), 0);
$r = ltrim(substr($land, 9, 3), 0) . ltrim(substr($land, 12, 2), 0);
$s = ltrim(substr($land, 17, 2), 0);
$ss	= (strlen($land)==25 ? substr($land, -4) : '');
$trs	= array('t' => $t, 'r' => $r, 's' => $s, 'ss' => $ss);

$return = array('geolocation' => round($distances[$aik], 1).' miles '.getCompassDirection($bearings[$aik]).' of '.$location[$aik],
              	'county' => str_replace(' County', '', $loc['features'][0]['attributes']['NAME']),
              	'state' => $loc['features'][0]['attributes']['STATE_NAME'],
              	'trs' => ($trs ? $trs : ''),
                'zone' => $zone);
?>