<?
exit();
$con = mysqli_connect('localhost', 'mapo_main', 'Q.1.w.2.e34', 'mapo_trails');
$time = time();

function distance($lat1, $lon1, $lat2, $lon2) {
    $theta = floatval($lon1) - floatval($lon2);
    $dist  = sin(deg2rad(floatval($lat1))) * sin(deg2rad(floatval($lat2))) + cos(deg2rad(floatval($lat1))) * cos(deg2rad(floatval($lat2))) * cos(deg2rad($theta));
    $dist  = acos($dist);
    $dist  = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return round($miles, 2);
}

function get_data($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json','version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch); 
   
    return json_decode($output, TRUE);
}

$sql = mysqli_query($con, "SELECT id, title FROM trails WHERE id >= 8080");
while($row = mysqli_fetch_assoc($sql)) {
    mysqli_query($con, "INSERT INTO media (trail_id,file,type,title,delta) VALUES('$row[id]','','photo','$row[title]','0')");
}
exit();

$json = get_data('https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_TrailNFSPublish_01/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=TRAIL_NO%2CTRAIL_NAME&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=6&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=OBJECTID&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&featureEncoding=esriDefault&f=geojson');

#for ($i = 21; $i < 22; $i++) {
for ($i = 0; $i < count($json[features]); $i++) {
    $num = $json[features][$i][properties]['TRAIL_NO'];
    $name = str_replace('  ', ' ', (str_replace(['Ohv-m/c','Ohv-atv'], ['OHV-M/C','OHV-ATV'], ucwords(strtolower($json[features][$i][properties]['TRAIL_NAME'])))));

    if ($name) {
        $content = '';
        $dist = 0;
        $title = $name.' #'.$num;
        $filename = 'usfs_'.strtolower(str_replace(' ', '_', $name)).'_'.$num.'.gpx';
        
        mysqli_query($con, "INSERT INTO trails (type,author,title,route,keywords,season,contributors,created,updated)
        VALUES('trail','USFS','$title','','','','','$time','$time')");

        $id = mysqli_insert_id($con);

        mysqli_query($con, "INSERT INTO gpx (trail_id,filename,mode,caption,delta,display) VALUES('$id','$filename','Single Track','$title','0','1')");
        
        $totalcoords = count($json[features][$i][geometry][coordinates]);
        for ($x = 0; $x < $totalcoords; $x++) {
            $lat = $json[features][$i][geometry][coordinates][$x][1];
            $lon = $json[features][$i][geometry][coordinates][$x][0];
            $lat2 = $json[features][$i][geometry][coordinates][$x - 1][1];
            $lon2 = $json[features][$i][geometry][coordinates][$x - 1][0];

            if ($x > 0) {
                $dist += distance($lat, $lon, $lat2, $lon2);
            }

            $content .= '<trkpt lat="'.$lat.'" lon="'.$lon.'"></trkpt>';
        }

        $stats = serialize(array('geo' => array('start' => array($json[features][$i][geometry][coordinates][0][1], $json[features][$i][geometry][coordinates][0][0]),
                                    'end' => array($json[features][$i][geometry][coordinates][$totalcoords - 1][1], $json[features][$i][geometry][coordinates][$totalcoords - 1][0])),
                                    'elevation' => array(), 'altitude' => array(), 'distance' => $dist));

        mysqli_query($con, "INSERT INTO stats (trail_id,stats) VALUES('$id','$stats')");

        $data = '<?xml version="1.0"?><gpx creator="GPS Visualizer http://www.gpsvisualizer.com/" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"><trk><name>Sled Track</name><trkseg>'.$content.'</trkseg></trk></gpx>';

        $file = fopen('./data/gpx/'.$filename, 'w');
        fwrite($file, $data);
        fclose($file);

        echo 'Done with '.$title.'...
';
    }
}
?>