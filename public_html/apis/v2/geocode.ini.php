<?
$lat = $_REQUEST['lat'];
$lon = $_REQUEST['lon'];
$geometry = $_REQUEST['geometry'];
$coords = [$lat, $lon];

function geojson($row)
{
    foreach ($row as $k => $v) {
        $val = $v;
        if ($k == 'id' || $k == 'zip_code' || $k == 'fips' || $k == 'area_code' || $k == 'elevation' || $k == 'population') {
            $val = intval($v);
        }

        $prop[$k] = $val;
    }
    unset($prop['lat']);
    unset($prop['lon']);

    return array(
        'type' => 'Feature',
        'geometry' => array(
            'type' => 'Point',
            'coordinates' => array(floatval($row['lon']), floatval($row['lat']))
        ),
        'properties' => $prop
    );
}

// default sorting order
$order = 'state_prefix ASC, city ASC';

// get all cities within a geojson bounding box
if ($method == 'bbox') {
    if ($geometry) {
        $dec = json_decode($geometry);
        $xmin = $dec->xmin;
        $xmax = $dec->xmax;
        $ymin = $dec->ymin;
        $ymax = $dec->ymax;
        $ltr = distance($ymax, $xmin, $ymax, $xmax);
        $ttb = distance($ymax, $xmin, $ymin, $xmin);

        $result = mysqli_query($con, "SELECT * FROM cities WHERE (lat >= '$ymin' AND lat <= '$ymax') AND  (lon <= '$xmax' AND lon >= '$xmin') ORDER BY $order");
        while ($row = mysqli_fetch_assoc($result)) {
            $feat[] = geojson($row);
        }

        $returnJson = array('type' => 'FeatureCollection', 'bbox' => array('area' => $ltr * $ttb), 'features' => $feat, 'results' => $feat ? count($feat) : 0);
    } else {
        $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid geometry (bounding box) was provided.');
    }
} else {
    // get cities within a distance, or by county, or by state
    if ($method == 'within') {
        if ($function == 'county' || $function == 'state') {
            // get cities by county name, or else use the database to figure out what county a set of coordinates is in
            if (isset($_REQUEST['county'])) {
                $county = mysqli_real_escape_string($con, $_REQUEST['county']);
                $state = mysqli_real_escape_string($con, $_REQUEST['state']);
                $sql = "SELECT * FROM cities WHERE county = '$county' AND state_prefix = '$state' ORDER BY $order";
            } else {
                $place = getLocation2($con, $coords, true);

                if ($function == 'county') {
                    $sql = "SELECT * FROM cities WHERE county = '$place[county]' AND state_prefix = '$place[state]' ORDER BY $order";
                } else {
                    $sql = "SELECT * FROM cities WHERE state_prefix = '$place[state]' ORDER BY $order";
                }
            }

            $result = mysqli_query($con, $sql);

            while ($row = mysqli_fetch_assoc($result)) {
                $feat[] = geojson($row);
            }

            $returnJson = array('type' => 'FeatureCollection', 'features' => $feat, 'results' => $feat ? count($feat) : 0);
        } else {
            if ($lat && $lon) {
                // get cities within a radius
                if (isset($_REQUEST['radius'])) {
                    $radius = $_REQUEST['radius'] > 50 ? 50 : $_REQUEST['radius'];
                    $maxlat = round($lat + 1, 0);
                    $minlat = round($lat - 1, 0);
                    $maxlon = round($lon + 1, 0);
                    $minlon = round($lon - 1, 0);

                    $sql = mysqli_query($con, "SELECT * FROM cities WHERE (lat >= '$minlat' AND lat <= '$maxlat') AND  (lon <= '$minlon' AND lon >= '$maxlon') ORDER BY $order");
                    while ($row = mysqli_fetch_assoc($sql)) {
                        $dist = distance($lat, $lon, $row['lat'], $row['lon']);

                        if ($dist <= $radius) {
                            $feat[] = geojson($row);
                        }
                    }

                    $returnJson = array('type' => 'FeatureCollection', 'features' => $feat, 'results' => $feat ? count($feat) : 0);
                } else {
                    $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'You must specify a radius to use this method.');
                }
            } else {
                $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'A valid latitude and/or longitude was not provided.');
            }
        }
    } else if ($method == 'reverse') {
        $c = [$_REQUEST['lat'], $_REQUEST['lon']];
        $a1 = round($c[0] - 0.5, 1);
        $a2 = round($c[0] + 0.5, 1);
        $b1 = round($c[1] + 0.5, 1);
        $b2 = round($c[1] - 0.5, 1);
    
        $sql = "SELECT city, state_prefix AS state, state_name, zip_code, population, lat, lon, county FROM cities WHERE (CAST(lat AS float) >= '$a1' AND CAST(lat AS float) <= '$a2') AND (CAST(lon as float) <= '$b1' AND CAST(lon as float) >= '$b2')";
        $result = mysqli_query($con, $sql);
        while ($row = mysqli_fetch_assoc($result)) {
            $row['lat'] = floatval($row['lat']);
            $row['lon'] = floatval($row['lon']);
            $row['zip_code'] = intval($row['zip_code']);
            $row['population'] = intval($row['population']);

            $location[] = $row;
            $dist[] = distance($c[0], $c[1], $row['lat'], $row['lon']);
        }
    
        if ($dist) {
            asort($dist);
        }

        foreach ($dist as $k => $d) {
            $usethis = $k;
            break;
        }

        $returnJson = array('geocode' => $location[$usethis]);
    } else {
        // return the nearest city to the lat/lon
        $g = json_decode(file_get_contents('../cron/timezones.json'))->features;
        $returnJson = array('geocode' => array('near' => getLocation2($con, $coords, $_REQUEST['full'] ? true : false), 'state' => getState($coords), 'timezone' => getTimezone($coords, $con)));
    }
}
