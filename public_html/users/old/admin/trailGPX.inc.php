<?
/*function getDist($lat1, $lon1, $lat2, $lon2, $round = true)
{
    $theta = floatval($lon1) - floatval($lon2);
    $dist  = sin(deg2rad(floatval($lat1))) * sin(deg2rad(floatval($lat2))) + cos(deg2rad(floatval($lat1))) * cos(deg2rad(floatval($lat2))) * cos(deg2rad($theta));
    $dist  = acos($dist);
    $dist  = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return ($round ? round($miles, 2) : $miles);
}*/

function getDist($lat1, $lon1, $lat2, $lon2) {

    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515 * 5280;
    return $miles;
}

function doUpload($con2, $i, $trailID, $mode, $caption, $delta, $display) {
    global $_FILES;

    $gg = $i;
    $target_dir = '/home/mapo/public_html/mapotrails.com/data/gpx/';
    $basename = str_replace(' ', '_', basename($_FILES['gpxFile']['name'][$gg]));

    if (file_exists($target_dir . $basename)) {
        $basename = substr($basename, 0, -4) . '_' . rand(0, 1000) . substr($basename, -4);
    }
    $target_file = $target_dir . $basename;

    // successfully uploaded
    if (move_uploaded_file($_FILES['gpxFile']['tmp_name'][$gg], $target_file)) {
        mysqli_query($con2, "INSERT INTO gpx (trail_id,filename,mode,caption,delta,display) VALUES('$trailID','$basename','$mode','$caption','$delta','$display')");
        $gisID = mysqli_insert_id($con2);
    }

    return parseGPX($gisID, $trailID, $mode, $caption, $delta, $display, $target_file, false);
}

function parseGPX($gisID, $trailID, $mode, $caption, $delta, $display, $file, $update) {
    global $_POST;
    #global $sqlQueries;
    global $title;

    $sqlQueries = '';
    $prevElev = $prevDist = 0;
    $json = json_decode(json_encode(simplexml_load_file($file)));

    $point = $json->trk->trkseg->trkpt;
    $count = count($point);
    $coords = [];
    $lat = [];
    $lon = [];
    $elevations = [];
    $start = [$point[0]->{'@attributes'}->lat, $point[0]->{'@attributes'}->lon];
    $end = [$point[$count - 1]->{'@attributes'}->lat, $point[$count - 1]->{'@attributes'}->lon];
    $dist = $gain = $loss = 0;

    for ($x = 0; $x < $count; $x++) {
        $j = $x - 1;

        $elev = $point[$x]->ele * 3.281;
        $elevations[] = $elev;
        $lat[] = floatval($point[$x]->{'@attributes'}->lat);
        $lon[] = floatval($point[$x]->{'@attributes'}->lon);
        $coords[] = [floatval($point[$x]->{'@attributes'}->lon), floatval($point[$x]->{'@attributes'}->lat)];

        if ($x > 0) {
            $distance = getDist($point[$x]->{'@attributes'}->lat, $point[$x]->{'@attributes'}->lon, $point[$j]->{'@attributes'}->lat, $point[$j]->{'@attributes'}->lon);
            $dist += (is_nan($distance) ? 0 : $distance);
            $gain += ($elev > $prevElev ? $elev - $prevElev : 0);
            $loss += ($elev < $prevElev ? $elev - $prevElev : 0);

            try {
                $slope = round(($elev - $prevElev) / (($dist * 5280) - ($prevDist * 5280)) * 100, 1);
            } catch(DivisionByZeroError $e) {

            }

            if (!is_nan($slope)) {
                $slopes[] = $slope;
            }
        }

        $prevElev = $elev;
        $prevDist = $dist;
    }

    $stats = array(
        'geo' => array('start' => $start, 'end' => $end),
        'bounds' => ['sw' => [min($lon), min($lat)], 'ne' => [max($lon), max($lat)]],
        'elevation' => array('min' => min($elevations), 'max' => max($elevations)),
        'altitude' => array('gain' => $gain, 'loss' => $loss), 'distance' => round($dist / 5280, 3)
    );

    if ($delta == 0 && !$update) {
        $sstats = serialize($stats);
        $sqlQueries = "INSERT INTO stats (trail_id,stats) VALUES('$trailID','$sstats') ON DUPLICATE KEY UPDATE stats = '$sstats';";
    }

    $mbprop = [
        'mode' => $mode,
        'color' => trailColor($mode),
        'caption' => $caption,
        'delta' => $delta,
        'display' => $display,
        'gis_id' => $gisID,
        'trail_id' => $trailID,
        'type' => $_POST['type'],
        'title' => $title,
        'url' => guideUrl($title, $_POST['type'], $trailID),
        'stats' => $stats,
        'public' => $_POST['public'],
        'premium' => $_POST['premium']
    ];

    sendToMapbox($gisID, array('type' => 'Feature', 'geometry' => array('type' => 'LineString', 'coordinates' => $coords), 'properties' => $mbprop));
    return $sqlQueries;
}