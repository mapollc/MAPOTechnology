<?
function calculateDistance($pointA, $pointB)
{
    $lat1 = (float) $pointA['lat'];
    $lon1 = (float) $pointA['lon'];
    $lat2 = (float) $pointB['lat'];
    $lon2 = (float) $pointB['lon'];

    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = max(-1, min(1, $dist));
    $dist = rad2deg(acos($dist));

    return $dist * 60 * 1.1515 * 5280;
}

function alreadyExists($target_dir, $basename)
{
    if (!file_exists("{$target_dir}{$basename}")) {
        return $basename;
    }

    $extension = pathinfo($basename, PATHINFO_EXTENSION);
    $filename = pathinfo($basename, PATHINFO_FILENAME);

    do {
        $basename = "{$filename}_" . bin2hex(random_bytes(4)) . ".$extension";
    } while (file_exists("{$target_dir}{$basename}"));

    return $basename;
}

function doUpload($i, $trailID, $mode, $caption, $delta, $display)
{
    global $_FILES;
    global $con2;

    $gg = $i;
    $target_dir = '/home/mapo/public_html/mapotrails.com/data/gpx/';
    $basename = str_replace(' ', '_', basename($_FILES['gpxFile']['name'][$gg]));

    $basename = alreadyExists($target_dir, $basename);
    $target_file = "{$target_dir}{$basename}";

    // successfully uploaded
    if (!move_uploaded_file($_FILES['gpxFile']['tmp_name'][$gg], $target_file)) {
        return '';
    }

    $basename_sql = mysqli_real_escape_string($con2, $basename);
    $mode_sql = mysqli_real_escape_string($con2, $mode);
    $caption_sql = mysqli_real_escape_string($con2, $caption);

    mysqli_query($con2, "INSERT INTO gpx (trail_id,filename,mode,caption,delta,display)
        VALUES($trailID, '$basename_sql', '$mode_sql', '$caption_sql', $delta, $display)");

    $gisID = mysqli_insert_id($con2);

    return parseGPX(
        $gisID,
        $trailID,
        $delta,
        $basename
    );
}

function parseGPX($gisID, $trailID, $delta, $file)
{
    global $con2;

    $sqlQueries = '';

    $filePath = $file;

    if (!str_starts_with($filePath, '/')) {
        $filePath = "/home/mapo/public_html/mapotrails.com/data/gpx/" . basename($file);
    }

    if (!file_exists($filePath)) return '';

    // Suppress XML parsing errors/warnings from malformed namespaces (like undefined tp1)
    libxml_use_internal_errors(true);

    // Load the GPX file
    $xml = simplexml_load_file($filePath, 'SimpleXMLElement', LIBXML_NOCDATA);

    // Clear the error buffer
    libxml_clear_errors();

    if ($xml === false) return '';

    // Collect all track points
    $point = $xml->xpath('//*[local-name()="trkpt"]');

    if (!$point) return '';

    $count = count($point);
    if ($count === 0) return '';

    $lat = [];
    $lon = [];
    $elevations = [];
    $slopes = [];

    $start = [
        (float) $point[0]['lat'],
        (float) $point[0]['lon']
    ];
    $end = [
        (float) $point[$count - 1]['lat'],
        (float) $point[$count - 1]['lon']
    ];

    $dist = $gain = $loss = 0;
    $prevElev = (float)$point[0]->ele * 3.281;

    for ($x = 0; $x < $count; $x++) {
        $elev = (float) $point[$x]->ele * 3.281;

        $elevations[] = $elev;
        $lat[] = (float) $point[$x]['lat'];
        $lon[] = (float) $point[$x]['lon'];

        if ($x > 0) {
            $j = $x - 1;
            $distance = calculateDistance($point[$x], $point[$j]);

            if (!is_nan($distance)) {
                $dist += $distance;
            }

            // Calculate the elevation gain/loss
            if ($elev >= $prevElev) {
                $gain += $elev - $prevElev;
            } else if ($elev < $prevElev) {
                $loss += $elev - $prevElev;
            }

            // Calculate slope only when the segment has a measurable horizontal distance
            if ($distance > 0) {
                $slope = round((($elev - $prevElev) / $distance) * 100, 1);

                if (is_finite($slope)) {
                    $slopes[] = $slope;
                }
            }
        }

        $prevElev = $elev;
    }

    $stats = [
        'geo' => [
            'start' => $start,
            'end' => $end
        ],
        'bounds' => [
            'sw' => [$lon ? min($lon) : 0, $lat ? min($lat) : 0],
            'ne' => [$lon ? max($lon) : 0, $lat ? max($lat) : 0]
        ],
        'elevation' => [
            'min' => $elevations ? min($elevations) : 0,
            'max' => $elevations ? max($elevations) : 0
        ],
        'altitude' => [
            'gain' => $gain ?? 0,
            'loss' => $loss ?? 0
        ],
        'slope' => [
            'min' => $slopes ? min($slopes) : null,
            'avg' => $slopes ? round(array_sum(array_map('abs', $slopes)) / count($slopes), 1) : null,
            'max' => $slopes ? max($slopes) : null
        ],
        'distance' => round($dist / 5280, 3)
    ];

    // save the initial trail stats
    ////if ($delta == 0) {
    $time = time();
    $sstats = mysqli_real_escape_string($con2, json_encode($stats));

    $sqlQueries .= "INSERT INTO stats (trail_id, gis_id, stats, calculated)
        VALUES($trailID, $gisID, '$sstats', $time) ON DUPLICATE KEY UPDATE stats = '$sstats', calculated = $time;";
    ////}

    return $sqlQueries;
}
