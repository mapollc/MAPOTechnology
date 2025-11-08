<?
#ini_set('display_errors', 1);
#error_reporting(E_ALL);
$con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

function getDist($lat1, $lon1, $lat2, $lon2)
{

    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515 * 5280;
    return $miles;
}

function calculate($file)
{
    $prevElev = 0;
    $prevDist = 0;
    $json = json_decode(json_encode(simplexml_load_file($file)));

    $point = $json->trk->trkseg->trkpt;
    $count = $point == null ? 0 : count($point);
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
            $dist += is_nan($distance) ? 0 : $distance;
            $gain += $elev > $prevElev ? $elev - $prevElev : 0;
            $loss += $elev < $prevElev ? $elev - $prevElev : 0;

            try {
                $slope = round(($elev - $prevElev) / ($dist * 5280 - $prevDist * 5280) * 100, 1);
            } catch (DivisionByZeroError $e) { }

            if (!is_nan($slope)) {
                $slopes[] = $slope;
            }
        }

        $prevElev = $elev;
        $prevDist = $dist;
    }

    $stats = array(
        'geo' => array('start' => $start, 'end' => $end),
        'bounds' => ['sw' => [$lon != null ? min($lon) : 0, $lat != null ? min($lat) : 0], 'ne' => [$lon != null ? max($lon) : 0, $lat != null ? max($lat) : 0]],
        'elevation' => array('min' => $elevations != null ? min($elevations) : 0, 'max' => $elevations != null ? max($elevations) : 0),
        'altitude' => array('gain' => $gain, 'loss' => $loss),
        'distance' => round($dist / 5280, 3)
    );

    return $stats;
}

$result = mysqli_query($con, "SELECT * FROM gpx WHERE delta = 0 ORDER BY trail_id ASC");
#$result = mysqli_query($con, "SELECT * FROM gpx WHERE trail_id = 168 ORDER BY trail_id ASC");
while ($row = mysqli_fetch_assoc($result)) {
    $file = '/home/mapo/public_html/mapotrails.com/data/gpx/'.$row['filename'];

    if (file_exists($file)) {
        //print_r(calculate($file));
        $c = serialize(calculate($file));

        mysqli_query($con, "INSERT INTO stats2 (trail_id,stats) VALUES('$row[trail_id]','$c') ON DUPLICATE KEY UPDATE stats = '$c'");
        echo 'Done with '.$row['trail_id'].'...
';
    }
}

mysqli_close($con);