<?
/*$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

$result = mysqli_query($con2, "SELECT trail_id, filename FROM gpx WHERE delta = 0 ORDER BY trail_id DESC");

while ($row = mysqli_fetch_assoc($result)) {
    echo '----- Starting ' . $row['trail_id'] . ' -----' . PHP_EOL;

    $time = round(microtime(true), 0);
    $prevElev = 0;
    $file = "/home/mapo/public_html/mapotrails.com/data/gpx/{$row['filename']}";

    if (!file_exists($file)) {
        mysqli_query($con2, "UPDATE stats SET stats = '', calculated = $time WHERE trail_id = $row[trail_id]");
        echo '----- File doesn\'t exist for ' . $row['trail_id'] . ' -----' . PHP_EOL;
    } else {
        // Load the GPX file
        $xml = simplexml_load_file($file, 'SimpleXMLElement', LIBXML_NOCDATA);

        if ($xml === false) {
            echo '----- Unable to parse ' . $row['trail_id'] . ' -----' . PHP_EOL;
        } else {

            // Collect all track points
            $point = $xml->xpath('//*[local-name()="trkpt"]');

            if (!$point) {
                return '';
            }

            $count = count($point);

            if ($count === 0) {
                return '';
            }

            $coords = [];
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

            for ($x = 0; $x < $count; $x++) {
                $elev = (float) $point[$x]->ele * 3.281;

                $elevations[] = $elev;
                $lat[] = (float) $point[$x]['lat'];
                $lon[] = (float) $point[$x]['lon'];
                $coords[] = [
                    (float) $point[$x]['lon'],
                    (float) $point[$x]['lat']
                ];

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
                    'sw' => [
                        $lon ? min($lon) : 0,
                        $lat ? min($lat) : 0
                    ],
                    'ne' => [
                        $lon ? max($lon) : 0,
                        $lat ? max($lat) : 0
                    ]
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

            $data = mysqli_real_escape_string($con2, json_encode($stats));

            mysqli_query($con2, "UPDATE stats SET stats = '$data', calculated = $time WHERE trail_id = $row[trail_id]");

            echo '----- Done calculating stats for ' . $row['trail_id'] . ' -----' . PHP_EOL;
        }
    }
}