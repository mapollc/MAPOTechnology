<?
function geocode($c)
{
    global $con;

    $usethis = null;
    $a1 = round($c[0] - 0.5, 1);
    $a2 = round($c[0] + 0.5, 1);
    $b1 = round($c[1] + 0.5, 1);
    $b2 = round($c[1] - 0.5, 1);

    $sql = mysqli_query($con, "SELECT fips, city, county, state_prefix, state_name, lat, lon, elevation, population FROM cities WHERE (CAST(lat AS float) >= '$a1' AND CAST(lat AS float) <= '$a2') AND (CAST(lon as float) <= '$b1' AND CAST(lon as float) >= '$b2')");
    while ($row = mysqli_fetch_assoc($sql)) {
        $pop[] = $row['population'];
        $bear[] = getBearing($row['lat'], $row['lon'], $c[0], $c[1]);
        $dist[] = distance($row['lat'], $row['lon'], $c[0], $c[1]);
        $location[] = $row;
    }

    $med = array_sum($pop) / count($pop);
    asort($dist);

    foreach ($dist as $key => $d) {
        //if($pop[$key] > 1000 && $d < 40){
        $usethis = $key;
        break;
        //}
    }

    if (!$usethis) {
        foreach ($dist as $key => $d) {
            if ($pop[$key] >= $med) {
                $usethis = $key;
                break;
            }
        }
    }

    return $location[$usethis];
}

$coords = [$_REQUEST['lat'], $_REQUEST['lon']];

if ($method == 'incident') {
    $g = json_decode(file_get_contents('../cron/timezones.json'))->features;
    $st = json_decode(file_get_contents('../cron/states.json'));

    $returnJson = array('geocode' => array('near' => getLocation($con, $coords, $_REQUEST['co'] ? 1 : 0), 'state' => getState($coords), 'timezone' => getTimezone($coords)));
} else if ($method == 'bbox') {
    $dec = json_decode($_REQUEST['geometry']);
    $xmin = $dec->xmin;
    $xmax = $dec->xmax;
    $ymin = $dec->ymin;
    $ymax = $dec->ymax;

    $result = mysqli_query($con, "SELECT fips, city, county, state_prefix, state_name, lat, lon, elevation, population FROM cities WHERE (lat >= '$ymin' AND lat <= '$ymax') AND  (lon <= '$xmax' AND lon >= '$xmin') ORDER BY CAST(population AS float) DESC");
    while ($row = mysqli_fetch_assoc($result)) {
        $location[] = $row;
        $st[] = $row['state_name'];
        $co[] = $row['county'];
    }
    $st = array_unique($st);
    $co = array_unique($co);

    foreach ($st as $s) {
        $states[] = $s;
    }

    foreach ($co as $c) {
        $counties[] = $c;
    }

    $returnJson = array('geocode' => array('bbox' => $dec, 'results' => array('states' => $states, 'counties' => $counties, 'cities' => $location)));
} else if ($method == 'list') {
    $result = mysqli_query($con, "SELECT city, zip_code, lat, lon, population FROM cities WHERE state_prefix = '$_REQUEST[state]' AND county = '$_REQUEST[county]'");
    while ($row = mysqli_fetch_assoc($result)) {
        $cities[] = $row;
    }

    $returnJson = array('geocode' => $cities);
} else {
    if (isset($_REQUEST['fips'])) {
        $geo = mysqli_fetch_assoc(mysqli_query($con, "SELECT fips, city, county, state_prefix, state_name, lat, lon, elevation, population FROM cities WHERE fips = '$_REQUEST[fips]' LIMIT 1"));
    } else {
        $geo = geocode($coords);
    }

    $returnJson = array('geocode' => $geo);
}
