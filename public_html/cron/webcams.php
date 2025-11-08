<?
include('../db.ini.php');
include('../apis/functions.inc.php');

$json = json_decode(file_get_contents('https://d3kcsn1y1fg3m9.cloudfront.net/gis/routes/snostorm_routes_OR.json'));

$i = 1;
foreach ($json as $a) {
    $name = implode('/', array_map('ucwords',explode('/', implode('-', array_map('ucwords', explode('-', $a->name))))));
    $type = (count($a->geometry->path) < 3 ? 'Point' : 'LineString');

    if ($type == 'Point') {
        $coords = [$a->geometry->path[0][1], $a->geometry->path[0][0]];
    } else {
        $coords = array();

        for ($x = 0; $x < count($a->geometry->path); $x++) {
            $coords[] = [$a->geometry->path[$x][1], $a->geometry->path[$x][0]];
        }
    }

    $f[] = array('type' => 'Feature', 'geometry' => ['type' => $type, 'coordinates' => $coords], 'properties' => ['id' => $i, 'name' => $name, 'hwy' => $a->hwy]);
    $i++;
}

echo json_encode(array('type' => 'FeatureCollection', 'features' => $f));

/*$i = 1;
$result = mysqli_query($con, "SELECT id, lat, lon FROM webcams WHERE county = ''");
$total = mysqli_num_rows($result);
while ($row = mysqli_fetch_assoc($result)) {
    $a = $row['lat'];
    $b = $row['lon'];
    $json = json_decode(file_get_contents('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Census_Counties/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=%7B%22x%22%3A'.$b.'%2C%22y%22%3A'.$a.'%2C%22spatialReference%22%3A%7B%22wkid%22%3A4326%7D%7D&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelWithin&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=NAME&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=6&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=geojson&token='));

    $county = mysqli_real_escape_string($con, str_replace(' County', '', $json->features[0]->properties->NAME));

    mysqli_query($con, "UPDATE webcams SET county = '$county' WHERE id = '$row[id]'");
    echo 'Done with '.$i.' of '.$total.'...
';
    $i++;
}

#echo $sqlQueries;

$time = time();

$json = json_decode(file_get_contents('https://oss.weathershare.org/data/CCTV/OSS_cctv.json'));

foreach($json[0] as $c) {
    if (strpos($c->id, 'CA') !== false || $c->source == 'CALTRANS') {
        $state = 'CA';
        $source = 'Caltrans';
        $name = mysqli_real_escape_string($con, $c->location);
        $county = $c->county;
        $lat = $c->latitude;
        $lon = $c->longitude;
        $url = (is_array($c->url) ? $c->url[0] : $c->url);

        
        $sqlQueries .= "INSERT INTO webcams (state,county,name,lat,lon,url,network,source,added) VALUES('$state','$county','$name','$lat','$lon','$url','$source','1','$time');";
        #break;
    }
}

#echo $sqlQueries;

if (mysqli_multi_query($con, $sqlQueries) or die(mysqli_error($con))) {
    do {
        if ($result = mysqli_store_result($con)) {
            while ($row = mysqli_fetch_row($result)) { }
            mysqli_free_result($result);
        }
        if (mysqli_more_results($con)) { }
    } while (mysqli_next_result($con));
}
?>