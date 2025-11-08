<?
$thresholds = [
    ['AL' => 17941.681818182],
    ['AK' => 2769.8780487805],
    ['AZ' => 15658.552083333],
    ['AR' => 4119.6983425414],
    ['CA' => 21365.458082192],
    ['CO' => 17686.610305958],
    ['CT' => 12634.113636364],
    ['DE' => 4114.8252427184],
    ['DC' => 229848.33333333],
    ['FL' => 13054.353338969],
    ['GA' => 5369.3442288049],
    ['HI' => 7780.362745098],
    ['ID' => 2885.2234042553],
    ['IL' => 6886.9033816425],
    ['IN' => 4073.5063291139],
    ['IA' => 2233.2327586207],
    ['KS' => 2682.5925925926],
    ['KY' => 1609.7391304348],
    ['LA' => 3870.2163522013],
    ['ME' => 2301.6015779093],
    ['MD' => 6556.799744898],
    ['MA' => 13455.049304054],
    ['MI' => 9166.8243626062],
    ['MN' => 8551.8952380952],
    ['MS' => 2426.610787172],
    ['MO' => 2910.6475770925],
    ['MT' => 1402.4600389864],
    ['NE' => 2454.6458658346],
    ['NV' => 19076.801282051],
    ['NH' => 2603.2162162162],
    ['NJ' => 9020.7570093458],
    ['NM' => 3087.6465364121],
    ['NY' => 426081.40385591],
    ['NC' => 6249.5452755906],
    ['ND' => 1249.8773006135],
    ['OH' => 5406.8541801685],
    ['OK' => 3628.6289954338],
    ['OR' => 6508.651119403],
    ['PA' => 3349.5233680958],
    ['RI' => 7665.8720930233],
    ['SC' => 14268.671641791],
    ['SD' => 1459.3646055437],
    ['TN' => 8663.4661870504],
    ['TX' => 9210.8625204583],
    ['UT' => 8071.3187660668],
    ['VT' => 1495.9419795222],
    ['VA' => 5771.6099815157],
    ['WA' => 8048.5281531532],
    ['WV' => 1514.0900109769],
    ['WI' => 6492.8139303483],
    ['WY' => 3538.3423076923]
];

function get_data($url)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json', 'version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch);

    return json_decode($output, TRUE);
}

function get_html($url)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch);

    return $output;
}

function post_data($url, $post)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json', 'version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch);

    return json_decode($output, TRUE);
}

function std_dev($arr)
{
    $variance = 0.0;
    $average = average($arr);

    foreach ($arr as $i) {
        $variance += pow(($i - $average), 2);
    }

    return round(floatval(sqrt($variance / count($arr))), 4);
}

function average($arr)
{
    return array_sum($arr) / count($arr);
}

function distance($lat1, $lon1, $lat2, $lon2, $round = true)
{
    $theta = floatval($lon1) - floatval($lon2);
    $dist  = sin(deg2rad(floatval($lat1))) * sin(deg2rad(floatval($lat2))) + cos(deg2rad(floatval($lat1))) * cos(deg2rad(floatval($lat2))) * cos(deg2rad($theta));
    $dist  = acos($dist);
    $dist  = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return ($round ? round($miles, 2) : $miles);
}

function polygon($points_polygon, $vertices_x, $vertices_y, $longitude_x, $latitude_y)
{
    $i = $j = $c = 0;
    for ($i = 0, $j = $points_polygon - 1; $i < $points_polygon; $j = $i++) {
        if ((($vertices_y[$i] > $latitude_y != ($vertices_y[$j] > $latitude_y)) && ($longitude_x < ($vertices_x[$j] - $vertices_x[$i]) * ($latitude_y - $vertices_y[$i]) / ($vertices_y[$j] - $vertices_y[$i]) + $vertices_x[$i])))
            $c = !$c;
    }
    return $c;
}

function pointInPolygon($lat, $lon, $geo) {
    $geometry = json_decode(gzuncompress($geo));
    $coords = $geometry->coordinates;

    if ($geometry->type == 'Polygon') {
        return pointInRings($lon, $lat, $coords);
    } elseif ($geometry->type == 'MultiPolygon') {
        foreach ($coords as $polygon) {
            if (pointInRings($lon, $lat, $polygon)) return true;
        }
    }
    return false;
}

function pointInRings($x, $y, $rings) {
    foreach ($rings as $ring) {
        if (pointInSingleRing($x, $y, $ring)) return true;
    }
    return false;
}

function pointInSingleRing($x, $y, $ring) {
    $inside = false;
    $n = count($ring);
    for ($i = 0, $j = $n-1; $i < $n; $j = $i++) {
        if ((($ring[$i][1] > $y) != ($ring[$j][1] > $y)) &&
            ($x < ($ring[$j][0]-$ring[$i][0]) * ($y-$ring[$i][1])/($ring[$j][1]-$ring[$i][1]) + $ring[$i][0])) {
            $inside = !$inside;
        }
    }
    return $inside;
}

function getBearing($lat1, $lon1, $lat2, $lon2)
{
    $lat1 = floatval($lat1);
    $lat2 = floatval($lat2);
    $lon1 = floatval($lon1);
    $lon2 = floatval($lon2);

    $dLon = deg2rad($lon2) - deg2rad($lon1);
    $dPhi = log(tan(deg2rad($lat2) / 2 + pi() / 4) / tan(deg2rad($lat1) / 2 + pi() / 4));

    if (abs($dLon) > pi()) {
        if ($dLon > 0) {
            $dLon = (2 * pi() - $dLon) * -1;
        } else {
            $dLon = 2 * pi() + $dLon;
        }
    }

    return getCompassDirection((rad2deg(atan2($dLon, $dPhi)) + 360) % 360);
}

function getCompassDirection($bearing)
{
    $tmp = round($bearing / 22.5);
    switch ($tmp) {
        case 1:
            $direction = "NNE";
            break;
        case 2:
            $direction = "NE";
            break;
        case 3:
            $direction = "ENE";
            break;
        case 4:
            $direction = "East";
            break;
        case 5:
            $direction = "ESE";
            break;
        case 6:
            $direction = "SE";
            break;
        case 7:
            $direction = "SSE";
            break;
        case 8:
            $direction = "South";
            break;
        case 9:
            $direction = "SSW";
            break;
        case 10:
            $direction = "SW";
            break;
        case 11:
            $direction = "WSW";
            break;
        case 12:
            $direction = "West";
            break;
        case 13:
            $direction = "WNW";
            break;
        case 14:
            $direction = "NW";
            break;
        case 15:
            $direction = "NNW";
            break;
        default:
            $direction = "North";
    }
    return $direction;
}

function convertCoords($lon3857, $lat3857)
{
    $e_value = 2.7182818284;
    $x = 20037508.34;

    $long4326 = ($lon3857 * 180) / $x;
    $lat4326 = $lat3857 / ($x / 180);
    $exponent = (pi() / 180) * $lat4326;

    $lat4326 = atan(pow($e_value, $exponent));
    $lat4326 = $lat4326 / (pi() / 360);
    $lat4326 = $lat4326 - 90;

    return [$long4326, $lat4326];
}

/*function getState($c, $st)
{
    $lat = $c[0];
    $lon = $c[1];

    foreach ($st as $g) {
        $x = array();
        $y = array();
        for ($i = 0; $i < count($g->geo); $i++) {
            $x[] = $g->geo[$i][0];
            $y[] = $g->geo[$i][1];
        }

        if (polygon(count($x), $y, $x, $lon, $lat)) {
            $s = $g->state;
        }
    }

    if (!$s) {
        $json = get_data('https://nominatim.openstreetmap.org/search?q=' . urlencode($lat . ',' . $lon) . '&addressdetails=1&format=json');
        $s = convertState($json[0]['address']['state'], 2);
    }

    return $s;
}*/

function getState($c)
{
    global $con;
    $lat = $c[0];
    $lon = $c[1];
    $state = null;

    if ($lat && $lon && $lon != '-') {
        $result = mysqli_query($con, "SELECT state, geo FROM states WHERE (($lat <= ymax AND $lat >= ymin) AND ($lon >= xmin AND $lon <= xmax))");
        $count = mysqli_num_rows($result);

        if ($count == 1) {
            $state = mysqli_fetch_assoc($result)['state'];
        } else {
            while ($row = mysqli_fetch_assoc($result)) {
                $geo = unserialize($row['geo']);

                $x = array();
                $y = array();
                for ($i = 0; $i < count($geo); $i++) {
                    $x[] = $geo[$i][0];
                    $y[] = $geo[$i][1];
                }

                if (polygon(count($x), $y, $x, $lon, $lat)) {
                    $state = $row['state'];
                    break;
                }
            }

            if ($state == null) {
                $json = get_data('https://nominatim.openstreetmap.org/search?q=' . urlencode($lat . ',' . $lon) . '&addressdetails=1&format=json');
                $state = convertState($json[0]['address']['state'], 2);
            }
        }
    }

    return $state;
}

function phptimezone($tz)
{
    switch ($tz) {
        case 'Pacific':
            $w = 'Los_Angeles';
            break;
        case 'Mountain':
            $w = 'Denver';
            break;
        case 'Central':
            $w = 'Chicago';
            break;
        case 'Eastern':
            $w = 'New_York';
            break;
        case 'Alaska':
            $w = 'Anchorage';
            break;
    }

    return 'America/' . $w;
}

function getTimezone($c, $mysqlCon = null)
{
    if ($mysqlCon) {
        $con = $mysqlCon;
    } else {
        global $con;
    }

    $lat = $c[0];
    $lon = $c[1];

    if ($lat && $lon && $lon != '-') {
        $result = mysqli_query($con, "SELECT zone, geo FROM timezones WHERE ($lat >= CAST(ymin AS float) AND $lat <= CAST(ymax AS float)) AND ($lon >= CAST(xmin AS float) AND $lon <= CAST(xmax AS float))");
        while ($row = mysqli_fetch_assoc($result)) {
            $geometry = unserialize($row['geo']);
            $points_polygon = count($geometry);

            if ($points_polygon == 1) {
                $vertices_x = [];
                $vertices_y = [];

                foreach ($geometry[0] as $coords) {
                    $vertices_x[] = $coords[0];
                    $vertices_y[] = $coords[1];
                }

                if (polygon(count($geometry[0]), $vertices_x, $vertices_y, $lon, $lat)) {
                    return phptimezone($row['zone']);
                }
            } else {
                for ($i = 0; $i < $points_polygon; $i++) {
                    $vertices_x = [];
                    $vertices_y = [];

                    foreach ($geometry[$i][0] as $coords) {
                        $vertices_x[] = $coords[0];
                        $vertices_y[] = $coords[1];
                    }

                    if (polygon(count($geometry[$i][0]), $vertices_x, $vertices_y, $lon, $lat)) {
                        return phptimezone($row['zone']);
                    }
                }
            }
        }
    }

    return null;
}

/*function getTimezone($c)
{
    $lat = $c[0];
    $lon = $c[1];
    $timezones = DateTimeZone::listIdentifiers(DateTimeZone::AMERICA | DateTimeZone::PACIFIC);

    $closestTimezone = '';
    $closestDistance = PHP_FLOAT_MAX;

    foreach ($timezones as $timezone) {
        $tz = new DateTimeZone($timezone);
        $location = $tz->getLocation();
        $tzLat = $location['latitude'];
        $tzLon = $location['longitude'];

        // Calculate distance using the Haversine formula or a simpler approximation
        $distance = distance($lat, $lon, $tzLat, $tzLon);

        if ($distance < $closestDistance) {
            $closestTimezone = $timezone;
            $closestDistance = $distance;
        }
    }

    return $closestTimezone;
}*/

/*function getTimezone($c, $g)
{
    for ($z = 0; $z < count($g); $z++) {
        $x = array();
        $y = array();
        $a = (count($g[$z]->geometry->coordinates[0]) == 1 ? $g[$z]->geometry->coordinates[0][0] : $g[$z]->geometry->coordinates[0]);

        for ($i = 0; $i < count($a); $i++) {
            $x[] = $a[$i][1];
            $y[] = $a[$i][0];
        }

        if (polygon(count($x), $y, $x, $c[1], $c[0])) {
            $s = $g[$z]->properties->Zone;
        }
    }

    switch ($s) {
        case 'Pacific':
            $t = 'Los_Angeles';
            break;
        case 'Mountain':
            $t = 'Denver';
            break;
        case 'Central':
            $t = 'Chicago';
            break;
        case 'Eastern':
            $t = 'New_York';
            break;
        case 'Alaska':
            $t = 'Anchorage';
            break;
    }

    return 'America/' . $t;
}*/

function defaultIncName($inc)
{
    preg_match('/-([0-9]+)/', $inc, $last);
    return 'Incident ' . ltrim($last[1], 0);
}

function incidentName($name, $inc, $type = null)
{
    if ($type == 'Smoke Check') {
        $ps = explode('-', $inc);
        return 'Smoke Check #' . $ps[1] . '-' . ltrim($ps[2], '0');
    } else {
        $a = explode('-', $inc);
        $things = array('Rn', 'Pr', 'Nw', 'Rs', 'Rv', 'Pv', 'Od', 'Ne', 'Cs', 'Fa', 'Cr', 'Cf', 'Gp', 'Sc');
        $name = substr($name, 0, 4) == 'Loc-' ? substr($name, 4, strlen($name)) : $name;
        $name = preg_replace('/#[0-9+]/', ' $0', preg_replace('/^([\/])*/', '', ltrim(/*preg_replace("/(\w+)/e", "ucfirst('\\1')",*/trim(str_replace(array('/ ', '  ', ' Fire'), array('/', ' ', ''), ucwords(strtolower($name))/*)*/)), '.')));
        $name = substr($name, 0, 4) == 'Inc ' ? str_replace('Inc ', 'Incident ', $name) : (substr($name, 0, 4) == 'INC ' ? str_replace('INC ', 'Incident ', $name) : $name);

        foreach ($things as $t) {
            $name = substr($name, -3) == ' ' . $t ? substr($name, 0, strlen($name) - 3) : $name;
            $name = substr($name, 0, 5) == $t . ' - ' ? substr($name, 5, strlen($name)) : (substr($name, 0, 3) == $t . ' ' ? substr($name, 3, strlen($name)) : $name);
        }

        if (strpos($name, 'Outside Investigation') !== false) {
            $name = defaultIncName($inc);
        }

        if (substr($name, 0, 3) == substr($inc, -3)) {
            $name = preg_replace("/[0-9][0-9][0-9][ ]/", "", $name);
        }

        if (substr($name, 0, 4) == 'Nfca' || substr($name, 0, 4) == 'NFCA' || $name == '') {
            $name = defaultIncName($inc);
        }

        if (substr($name, 0, 3) == 'Fa/') {
            $name = substr($name, 3, strlen($name));
        }

        if (substr($name, -3) == ' Rx') {
            $name = substr($name, 0, strlen($name) - 3) . ' RX';
        } else {
            $name = str_replace(' Rx ', ' RX ', $name);
        }

        if (substr($name, 0, 2) == 'Mc') {
            $name = 'Mc' . ucfirst(substr($name, 2, strlen($name)));
        } else if (substr($name, 0, 3) == 'Mac') {
            $name = 'Mac' . ucfirst(substr($name, 3, strlen($name)));
        }

        if (substr($name, 0, 4) == 'Loc ') {
            $name = substr($name, 4, strlen($name));
        }

        if (substr($name, strlen($name) - 5) == ' ' . $a[1] || substr($name, strlen($name) - 5) == ' 0' . $a[1]) {
            $name = substr($name, 0, -5);
        }

        if ((is_numeric($name) && ($name == $a[1])) || $name == 'Incident' || $name == '*******') {
            $name = 'Incident ' . $a[1] . '-' . ltrim($a[2], 0);
        }

        if (strpos($name, '/') !== FALSE) {
            $name = str_replace(array('//', '/ ', ' /', '  /'), array(' / ', ' / ', ' / ', ' /'), $name);
            $a = explode('/', $name);
            $name = $a[0] . '/' . ucfirst($a[1]);
        }

        if (substr_count($name, '-') > 1) {
            $name = str_replace('-', ' ', $name);
        }

        if (substr($name, -1) == '.') {
            $name = substr($name, 0, -1);
        }

        if (strpos($name, '\'') !== false || strpos($name, '-') !== false) {
            $a = explode('\'', $name);
            $name = $a[0] . '\'' . ucfirst($a[1]);
            $b = explode('-', $name);
            $name = $b[0] . '-' . ucfirst($b[1]);
        }

        preg_match('/(.*)\s([0-9]+)/', $name, $output1);

        //if (strpos($inc, $output1[2]) !== false) {
        if ($output1 && str_contains($output1[2], $inc)) {
            $name = str_replace($output1[2], '', $name);
        }

        preg_match('/([A-Z][a-z])([0-9]+)/', $name, $output);

        if ($output) {
            preg_match('/([0]{2,})([0-9]+)/', $output[2], $match);
            $name = 'Incident ' . $match[2];
        }

        if ($name == 'Utl') {
            $name = 'UTL';
        }

        $name = preg_replace('/Lac-(.*)/', 'LAC-$1', $name);

        $name = str_replace('\'S ', '\'s ', rtrim($name, '-'));
        $name = rtrim(ucwords(preg_replace('/\s?\'$/', '', str_replace(['  ', '&amp;', 'Utl-'], [' ', '&', ''], preg_replace('/Mm([0-9]+)/', 'MM$1', $name)))));

        if ($name == 'Incident' || $name == 'Inc.' || $name == 'Inc') {
            $name = defaultIncName($inc);
        }

        $name = str_replace('\'S', '\'s', $name);

        return $name;
    }
}

function incNum($d, $s, $i)
{
    preg_match('/([A-Z0-9]{3,})-([0-9]+)/', $i, $match);
    $id = str_pad((substr($match[2], 0, 2) == date('y', $d) ? substr($match[2], 2, strlen($match[2])) : $match[2]), 6, '0', STR_PAD_LEFT);
    $unit = (strlen($match[1]) >= 5 ? $match[1] : $s . $match[1]);
    return date('Y', $d) . '-' . $unit . '-' . $id;
}

function latLon($l)
{
    $a = explode(',', $l);
    $b = $a[0];
    $c = ltrim($a[1]);

    if (strpos($b, ' ') !== FALSE) {
        $b = explode(' ', $b);
        $c = explode(' ', $c);
        return array(($b[0] + ($b[1] / 60)), ($c[0] - ($c[1] / 60)));
    } else {
        return array($b, $c);
    }
}

function status($i)
{
    if ($i != '.') {
        preg_match_all('/([A-Za-z]+):\s([0-9\/\s]+)/', $i, $match);
        for ($x = 0; $x < count($match[1]); $x++) {
            $s[$match[1][$x]] = strtotime(substr($match[2][$x], 0, -2) . ':' . substr($match[2][$x], -2));
        }
        return $s;
    } else {
        return '';
    }
}

function calculateMedian(array $numbers)
{
    if (empty($numbers)) {
        return 0;
    }
    sort($numbers, SORT_NUMERIC);
    $count = count($numbers);
    $middleIndex = floor($count / 2);

    return ($count % 2 === 1) ? $numbers[$middleIndex] : ($numbers[$middleIndex - 1] + $numbers[$middleIndex]) / 2;
}

function getCounty($con, $coords, $oregon = false) {
    $lat = $coords[0];
    $lon = $coords[1];
    $isOregon = $oregon ? " state = 'OR' AND" : "";

    $result = mysqli_query($con, "SELECT name, fips, geo FROM counties WHERE$isOregon $lon BETWEEN xmin AND xmax AND $lat BETWEEN ymin AND ymax");

    while ($row = mysqli_fetch_assoc($result)) {
        if (pointInPolygon($lat, $lon, $row['geo'])) {
            return [
                'county' => $row['name'],
                'fips' => $row['fips']
            ];
        }
    }

    return null;
}

function getLocation($con, $coords, $returnArray = false, $sameState = null)
{
    global $thresholds;
    $thresholdsArr = array_merge(...$thresholds);
    $locations = [];
    $bestCity = null;
    $closestCity = null;
    $bestScore = 1000000;

    if ($coords[0] && $coords[1] && $coords[1] != '-') {
        $minLat = round($coords[0] - 0.5, 1);
        $maxLat = round($coords[0] + 0.5, 1);
        $minLon = round($coords[1] + 0.5, 1);
        $maxLon = round($coords[1] - 0.5, 1);

        $result = mysqli_query($con, "SELECT city, county, state_prefix AS state, zip_code, population, lat, lon, 
    (3959 * acos(cos(radians($coords[0])) * cos(radians(lat)) * cos(radians(lon) - radians($coords[1])) + 
    sin(radians($coords[0])) * sin(radians(lat)))) AS distance FROM cities WHERE (lat BETWEEN $minLat AND $maxLat) AND 
    (lon BETWEEN $maxLon AND $minLon) ORDER BY distance ASC, state ASC, city ASC LIMIT 50");

        while ($row = mysqli_fetch_assoc($result)) {
            $locations[] = $row;
            $state = $row['state'];
            $population = $row['population'];
            $threshold = $thresholdsArr[$state] ?? 0; // Use the flattened array

            // Check if the current city's population is greater than the state's threshold
            if ($population > $threshold) {
                $bestCity = $row;
                $bestScore = 0; // Set to a value that will prevent further looping
                break; // Exit the loop as we found a suitable city
            }
        }

        // If no city met the threshold, fallback to the existing "best score" logic
        if ($bestCity === null) {
            foreach ($locations as $row) {
                if (!$closestCity) {
                    $closestCity = $row;
                }

                $distance = $row['distance'];
                $population = $row['population'];
                $score = $population > 0 ? $distance / log($population + 1) : 0;

                if ($score < $bestScore) {
                    $bestScore = $score;
                    $bestCity = $row;
                    break;
                }
            }
        }

        $chosenCity = $bestCity ?? $closestCity;

        if ($chosenCity && $chosenCity['distance'] > 25) {
            $newBestCity = null;
            $maxPopulation = 0;

            $chosenCityId = $chosenCity['city'] . $chosenCity['state'];

            foreach ($locations as $row) {
                $currentCityId = $row['city'] . $row['state'];

                if ($currentCityId !== $chosenCityId && $row['population'] > $maxPopulation) {
                    $maxPopulation = $row['population'];
                    $newBestCity = $row;
                }
            }

            if ($newBestCity) {
                $chosenCity = $newBestCity;
            }
        }

        if ($chosenCity) {
            $dist = number_format($chosenCity['distance'], 1);
            $bearing = getBearing($chosenCity['lat'], $chosenCity['lon'], $coords[0], $coords[1]);
            $near = $dist . ' miles ' . $bearing . ' of ' . $chosenCity['city'] . ', ' . $chosenCity['state'];

            return $returnArray ? $chosenCity : (trim($chosenCity['city']) && trim($chosenCity['state']) ? $near : '');
        } else {
            return null;
        }
    }
    return null;
}

function getLocation2($con, $coords, $returnArray = false, $sameState = null)
{
    $bestCity = null;
    $closestCity = null;
    $bestScore = 1000000;

    if ($coords[0] && $coords[1] && $coords[1] != '-') {
        $minLat = round($coords[0] - 0.5, 1);
        $maxLat = round($coords[0] + 0.5, 1);
        $minLon = round($coords[1] + 0.5, 1);
        $maxLon = round($coords[1] - 0.5, 1);

        $result = mysqli_query($con, "SELECT city, county, state_prefix AS state, zip_code, population, lat, lon, 
    (3959 * acos(cos(radians($coords[0])) * cos(radians(lat)) * cos(radians(lon) - radians($coords[1])) + 
    sin(radians($coords[0])) * sin(radians(lat)))) AS distance FROM cities WHERE (lat BETWEEN $minLat AND $maxLat) AND 
    (lon BETWEEN $maxLon AND $minLon) ORDER BY distance ASC, state ASC, city ASC LIMIT 50");

        while ($row = mysqli_fetch_assoc($result)) {
            if ($row['distance'] > 100) {
                continue;
            }

            /*if ($sameState && $row['state'] !== $sameState) {
            continue;
        }*/

            if (!$closestCity) {
                $closestCity = $row;
            }

            $distance = $row['distance'];
            $population = $row['population'];
            $score = $population ? $distance / log($population + 1) : 0;

            if ($score < $bestScore) {
                $bestScore = $score;
                $bestCity = $row;
                break;
            }
        }

        $chosenCity = $bestCity ?? $closestCity;

        if ($chosenCity) {
            $dist = number_format($chosenCity['distance'], 1);
            $bearing = getBearing($chosenCity['lat'], $chosenCity['lon'], $coords[0], $coords[1]);
            $near = $dist . ' miles ' . $bearing . ' of ' . $chosenCity['city'] . ', ' . $chosenCity['state'];

            return $returnArray ? $chosenCity : (trim($chosenCity['city']) && trim($chosenCity['state']) ? $near : '');
        } else {
            return null;
        }
    }
    return null;
}

function utlPresent($row)
{
    $name = strtolower($row['name']);
    $notes = strtolower($row['notes']);
    $words = ['utl', 'unable to locate', 'same as ', 'do not use', 'doi report only', 'fs report only'];

    # loop through keywords that indicate the incident is utl etc
    foreach ($words as $w) {
        if (strpos($name, $w) !== false || strpos($notes, $w) !== false) {
            return true;
        }
    }

    return false;
}

function wildfireAlgorithm($request, $inc_type, $status, $row, $archive, $p = false)
{
    $parts = [];
    $show_fire = false;
    $time = time();
    $timeDiff = time() - $row['date'];
    #$week2 = strtotime('-5 days');
    $last2 = 60 * 60 * 2;
    $last12 = 60 * 60 * 12;
    $day1 = 60 * 60 * 24;
    $days3 = $day1 * 3;
    $day5 = strtotime('-5 days');
    $onemonth = (60 * 60 * 24 * (365.25 / 12));
    $acres = floatval(str_replace(',', '', $row['acres']));
    $noAcres = $acres == '' || $acres == 'Unknown' || $acres == 0 ? true : false;
    $status = $status != false && !empty($status) && $status != '' ? (is_array($status) ? $status : unserialize($status)) : [];
    $isUTL = utlPresent($row);

    if (($row['updated'] > $day5) && !$isUTL) {
        $show_fire = true;
        $parts[] = [1, true];
    }

    if ($timeDiff > $day1 && $isUTL) {
        $show_fire = false;
        $parts[] = [1, false];
    }

    #if ($noAcres && ($timeDiff > $onemonth)) {
    if ($noAcres && ($timeDiff > $day1)) {
        $show_fire = false;
        $parts[] = [3, false];
    }

    if ($inc_type == 'Smoke Check' && (($timeDiff > $last2 && $noAcres) || $isUTL)) {
        $show_fire = false;
        $parts[] = [4, false];
    }

    if (($time - intval($row['updated'])) > $days3 || empty(intval($row['updated']))) {
        $show_fire = false;
        $parts[] = [6, false];
    }

    if (is_array($status) && $status['Out'] && ($timeDiff > $days3)) {
        $show_fire = false;
        $parts[] = [7, false];
    }

    if (is_array($status) && ($status['Contain'] || $status['Control']) && ($timeDiff > $day5) && $acres <= 1) {
        $show_fire = false;
        $parts[] = [8, false];
    }

    if ($acres < 50 && ($timeDiff > $onemonth)) {
        $show_fire = false;
        $parts[] = [9, false];
    }

    if ($acres > 1000) {
        $show_fire = true;
        $parts[] = [5, true];
    }

    if (($archive != '' && $archive != 0) || $request == 'new') {
        $show_fire = true;
        $parts[] = [10, true];
    }

    return $p ? $parts : $show_fire;
}

function wildfireAlgorithm2($request, $inc_type, $status, $row, $archive, $p = false/*, $week2, $weekold*/)
{
    $parts = [];
    $show_fire = false;
    #$time = 1722176207;
    $time = time();
    #$week2 = strtotime('-5 days');
    $last12 = (60 * 60 * 12);
    $weekold = (60 * 60 * 24 * 3);
    $fivedaysold = (60 * 60 * 24 * 5);
    $acres = floatval(str_replace(',', '', $row['acres']));
    $status = ($status != false && !empty($status) && $status != '' ? (is_array($status) ? $status : unserialize($status)) : []);

    // if the incident was updated within the *timeframe* AND the notes say UTL = SHOW ON MAP
    if (($row['updated'] > $fivedaysold) && (strpos(strtolower($row['notes']), 'unable to locate') !== TRUE && strpos(strtolower($row['notes']), 'utl') !== TRUE)) {
        $show_fire = true;
        $parts[] = [1, true];
    }

    // if the incident is within 24 hours old and is UTL = HIDE FROM MAP
    if ((($time - $row['date']) > 86400) && (strtolower($row['name']) == 'utl' || strpos(strtolower($row['notes']), 'utl') !== FALSE)) {
        $show_fire = false;
        $parts[] = [2, false];
    }

    // if the incident is 0 acres and happened more than 24 hours ago = HIDE FROM MAP
    if (($acres == 0 || $acres == '' || $acres == 'Unknown') && (($time - $row['date']) > (60 * 60 * 24))) {
        $show_fire = false;
        $parts[] = [3, false];
    }

    // if the incident type is a smoke check the happened in the last 12 hours and has 0 acres or has UTL in the name = HIDE FROM MAP
    if ($inc_type == 'Smoke Check' && ((($time - $row['date']) > (60 * 60 * 12) && ($acres == 0 || $acres == '')) || strpos(strtolower($row['name']), 'utl') !== FALSE || strpos(strtolower($row['name']), 'do not use') !== FALSE)) {
        $show_fire = false;
        $parts[] = [4, false];
    }

    // if incident acreage is > 1000 acres = SHOW ON MAP
    if ($acres > 1000) {
        $show_fire = true;
        $parts[] = [5, true];
    }

    // if incident was last updated over a week ago = HIDE FROM MAP
    if (($time - $row['updated']) > $weekold || empty($row['updated'])) {
        $show_fire = false;
        $parts[] = [6, false];
    }

    // if the incident is "out" and is older than 3 days = HIDE FROM MAP
    if (is_array($status) && $status['Out'] && (($time - $row['date']) > $weekold)) {
        $show_fire = false;
        $parts[] = [7, false];
    }

    // if the incident is "contained" or "controlled" and is older than 5 days and acres are <=1 = HIDE FROM MAP
    if (is_array($status) && ($status['Contain'] || $status['Control']) && (($time - $row['date']) > $fivedaysold) && $acres <= 1) {
        $show_fire = false;
        $parts[] = [8, false];
    }

    // if the incident is < 50 acres and happened >= 1 month ago = HIDE FROM MAP
    if ($acres < 50 && (($time - $row['date']) > (60 * 60 * 24 * (365 / 12)))) {
        $show_fire = false;
        $parts[] = [9, false];
    }

    // if not an archived incident and new fires are requested = SHOW ON MAP
    if (($archive != '' && $archive != 0) || $request == 'new') {
        $show_fire = true;
        $parts[] = [10, true];
    }

    return $p ? $parts : $show_fire;
}

function wildfireURL($wfid, $name, $state)
{
    #$name = preg_replace('/\-{2,}/', '-', str_replace(['&amp;-', '&-', 'and-', '&', '_'], ['', '', '', '', '-'], strtolower(str_replace(['/', ' ', '\''], [' ', '-', ''], $name)));
    #$name = str_replace(['&amp;-', '&-', 'and-', '&', '_'], ['', '', '', '', '-'], strtolower(str_replace(['/', ' ', '\''], [' ', '-', ''], $name)));
    #$name = /*preg_replace('/-{2,}/', '-',
    #preg_replace('/\s+|\band\b|\bor\b|\bthe\b|\bwith\b/', '-',*/
    #strtolower($name)/*))*/;
    $name = preg_replace(
        '/-{2,}/',
        '-',
        preg_replace(
            '/\./',
            '',
            preg_replace(
                '/\s+|\band\b|\bor\b|\bthe\b|\bwith\b/',
                '-',
                str_replace(
                    ['&amp;-', '#', '&-', 'and-', '&', '_', '/', '\''],
                    ['', '', '', '', '', '-', '', ''],
                    strtolower($name . ' fire')
                )
            )
        )
    );
    $state = substr($state, 0, 2) == 'CA' && strlen($state) > 2 ? str_replace('CA', '', $state) : $state;
    $url = 'wildfire/' . $wfid . '/' . strtolower(str_replace(' ', '-', convertState($state, 1))) . '/' . $name;

    return preg_replace('/\/-/', '/', $url);
}

function guideUrl($s, $ty, $id)
{
    $words = array('and', 'at');
    $s = str_replace(' ', '-', str_replace('  ', ' ', preg_replace('/([^A-Za-z0-9\s]+)/', '', strtolower($s))));

    foreach ($words as $r) {
        $s = str_replace($r . '-', '', $s);
    }

    return rtrim(rtrim('guide/' . $ty . '/' . $id . '/' . $s, '-'), ' ');
}

function bbox($bbox, $lat, $lon)
{
    $bbox = json_decode($bbox);
    $latmin = $bbox->ymin;
    $latmax = $bbox->ymax;
    $lonmin = $bbox->xmin;
    $lonmax = $bbox->xmax;

    return (($lat >= $latmin && $lat <= $latmax) && ($lon >= $lonmax && $lon <= $lonmin) ? true : false);
}

function sd_square($x, $mean)
{
    return pow($x - $mean, 2);
}

function remove_outliers($dataset, $magnitude = 2)
{
    $count = count($dataset);
    $mean = array_sum($dataset) / $count; // Calculate the mean
    $deviation = sqrt(array_sum(array_map("sd_square", $dataset, array_fill(0, $count, $mean))) / $count) * $magnitude; // Calculate standard deviation and times by magnitude

    return array_filter($dataset, function ($x) use ($mean, $deviation) {
        return ($x <= $mean + $deviation && $x >= $mean - $deviation);
    }); // Return filtered array of values that lie within $mean +- $deviation.
}
