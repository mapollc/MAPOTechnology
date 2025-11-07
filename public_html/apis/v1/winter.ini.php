<?
$useCache = true;
$coords = $_REQUEST['lat'].','.$_REQUEST['lon'];
$now = time();
$max = strtotime('+3 days');
$cachefile = mysqli_fetch_assoc(mysqli_query($con, "SELECT data, updated FROM winter_cache WHERE coords = '$coords'"));

if ($useCache === false || (count($cachefile) == 0 || ($now - $cachefile['updated']) > 3600 || filemtime('winter.ini.php') > $cachefile['updated'])) {
    $temp = array();
    $a = json_decode(json_encode(get_data('https://api.weather.gov/points/'.rtrim(number_format($_REQUEST['lat'], 4), '0').','.rtrim(number_format($_REQUEST['lon'], 4), '0'))));
    $b = $a->properties->relativeLocation->properties;
    $wx = json_decode(json_encode(get_data($a->properties->forecastGridData)));

    $loc = number_format($b->distance->value / 1609, 1).' miles '.getCompassDirection($b->bearing->value).' of '.$b->city.', '.$b->state;

    $tz = $a->properties->timeZone;
    $wfo = $a->properties->gridId;
    $elev = number_format($wx->properties->elevation->value * 3.28084, 0);

    for ($i = 0; $i < count($wx->properties->snowLevel->values); $i++) {
        $dt = strtotime(explode('+', $wx->properties->snowLevel->values[$i]->validTime)[0]);
        if ($dt >= time() && $dt < $max) {
            $time[] = $dt;
            $frzg[] = round($wx->properties->snowLevel->values[$i]->value * 3.28084, 0);
        }
    }

    for ($i = 0; $i < count($frzg); $i++) {
        $temp[] = $wx->properties->temperature->values[$i]->value * (9 / 5) + 32;
    }

    $fcst = array('time' => $time, 'temp' => $temp, 'frzg' => $frzg);
    $stats = array('temp' => array('min' => min($temp), 'max' => max($temp), 'mean' => average($temp), 'stdev' => std_dev($temp)),
                'frzg' => array('min' => min($frzg), 'max' => max($frzg), 'mean' => average($frzg), 'stdev' => std_dev($frzg)));

    $returnJson = array('weather' => array('wfo' => $wfo, 'location' => $loc, 'elevation' => $elev, 'timezone' => $tz, 'forecast' => $fcst, 'stats' => $stats));

    $encoded = json_encode($returnJson);
    if (count($cachefile) > 0) {
        $query = "UPDATE winter_cache SET data = '$encoded', updated = '$now' WHERE coords = '$coords'";
    } else {
        $query = "INSERT INTO winter_cache (coords,data,updated) VALUES('$coords','$encoded','$now')";
    }

    mysqli_query($con, $query);
} else {
    $isCached = true;
    $cache = json_decode($cachefile['data']);
    $cache->cached = 1;
    $returnJson = $cache;
}
?>