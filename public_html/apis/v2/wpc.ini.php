<?
date_default_timezone_set('UTC');

function getForecast($json) {
    global $cycle;
    global $startTime;
    global $endTime;
    global $getID;
    global $_REQUEST;

    for ($i = 0; $i < count($json->features); $i++) {
        if ((isset($_REQUEST['wfo']) && $_REQUEST['wfo'] == $json->features[$i]->properties->WFO) ||
            (isset($_REQUEST['state']) && $_REQUEST['state'] == $json->features[$i]->properties->state) ||
            (isset($_REQUEST['id']) && !str_contains($_REQUEST['id'], ',') && $getID == $json->features[$i]->properties->location_id) ||
            (isset($_REQUEST['id']) && str_contains($_REQUEST['id'], ',') && in_array($json->features[$i]->properties->location_id, $getID))) {

            $prop = $json->features[$i]->properties;
            $prob = ['p01' => floatval(str_replace('%', '', $prop->ige0p10)) / 100,
                    'p1' => floatval(str_replace('%', '', $prop->ige1p00)) / 100,
                    'p2' => floatval(str_replace('%', '', $prop->ige2p00)) / 100,
                    'p4' => floatval(str_replace('%', '', $prop->ige4p00)) / 100,
                    'p6' => floatval(str_replace('%', '', $prop->ige6p00)) / 100,
                    'p8' => floatval(str_replace('%', '', $prop->ige8p00)) / 100,
                    'p12' => floatval(str_replace('%', '', $prop->ige12p0)) / 100,
                    'p18' => floatval(str_replace('%', '', $prop->ige18p0)) / 100
                ];
            $accum = ['expected' => ($prop->expected_range ? explode('–', str_replace('"', '', $prop->expected_range)) : null),
                    'prob' => [
                        'low' => intval(str_replace('"', '', $prop->ip0p10)), // 10%
                        'expected' => intval(str_replace('"', '', $prop->ip0p25)), // 25%
                        'moderate' => intval(str_replace('"', '', $prop->ip0p75)), // 75%
                        'high' => intval(str_replace('"', '', $prop->ip0p90)) // 90%
                        ]
                    ];
            $data = ['id' => $prop->location_id, 'wfo' => $prop->WFO, 'name' => $prop->name, 'state' => $prop->state,
                        'elevation' => ($prop->elev_in_ft ? $prop->elev_in_ft : null), 'prob' => $prob, 'accum' => $accum];

            if (isset($_REQUEST['geojson'])) {
                $data['fhour'] = ['cycle' => $cycle->getTimestamp(), 'start' => $startTime, 'end' => $endTime];
                $points[] = ['type' => 'Feature', 'geometry' => $json->features[$i]->geometry, 'properties' => $data];
            } else {
                $points[] = $data;
            }
        }
    }

    usort($points, function ($a, $b) {
        $comp1 = strcmp($a['state'], $b['state']);
        if ($comp1 != 0) {
            return $comp1;
        }

        return strcmp($a['name'], $b['name']);
    });

    return $points;
}

$times = get_html('https://www.wpc.ncep.noaa.gov/Prob_Precip/hourly-data/latest/fcst_time.txt?'.time());
$year = substr($times, 0, 4);
$month = substr($times, 4, 2);
$day = substr($times, 6, 2);
$hour = substr($times, 8, 2);
$cycle = new DateTime();
$cycle->setTimezone(new DateTimeZone('UTC'));
$cycle->setDate($year, $month, $day);
$cycle->setTime($hour, 0, 0);

$accumPeriods = [];
$cycleHourString = str_pad($cycle->format('H'), 2, '0', STR_PAD_LEFT);
$fcstPeriod = $_REQUEST['period'] ? $_REQUEST['period'] : 1;

$cachefilename = 'fh:'.$cycleHourString.'_h:'.($_REQUEST['hour'] ? $_REQUEST['hour'] : 72).($_REQUEST['id'] ? '_id:'.$_REQUEST['id'] : '').
($_REQUEST['wfo'] ? '_wfo:'.$_REQUEST['wfo'] : '').($_REQUEST['state'] ? '_state:'.$_REQUEST['state'] : '').($_REQUEST['period'] ? '_p:'.$_REQUEST['period'] : '');

$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211); 
$cache = $memcache->get($cachefilename);

if (!$cache || filemtime(root().'wpc.ini.php') > $memcache->get($cachefilename.'-time')) {
    // determine the forecast hours based on the UTC time range
    if ($hour >= 12 && $hour < 18) {
        $startTime = strtotime($month.'/'.$day.'/'.$year.' 12:00 UTC');
        $endTime = strtotime($month.'/'.$day.'/'.$year.' 12:00 UTC') + ($_REQUEST['hour'] == 24 ? 24 : 72) * 3600;
    }

    if (!isset($_REQUEST['wfo']) && !isset($_REQUEST['state']) && !isset($_REQUEST['id'])) {
        $returnJson = array('response' => 'error', 'code' => 500, 'msg' => 'A state, WFO, or ID was not provided');
    } else {
        if ($_REQUEST['hour'] == '72') {
            if (in_array($cycleHourString, ['00', '01', '02', '03', '04', '05', '11', '12', '13', '14', '15', '16', '17', '22', '23'])) {
                $accumPeriods = [24, 72];
            } else if (in_array($cycleHourString, ['06', '07', '08', '09', '10', '18', '19', '20', '21'])) {
                $accumPeriods = [24, 66];
            }

            $offsetValues = [0, 1, 2, 3, 4, 5];
            $offset = $offsetValues[$hour % 6];
            $start = 24 - $offset;
            $fHour = in_array($hour, ['11', '22', '23']) ? max($accumPeriods) + 6 - $offset : max($accumPeriods) - $offset;
            $accumPeriod = array_slice($accumPeriods, -1);

            $url = "https://www.wpc.ncep.noaa.gov/Prob_Precip/hourly-data/latest/points_prob_sn_$accumPeriod[0]h0$fHour.geojson";
        } else {   
            for ($i = 0; $i < 9; $i++) {
                $time = $endTime + $i * 6 * 60 * 60;
                $accumPeriod[] = $time;
                $accumPeriods[] = ($time - $cycle->getTimestamp()) / 3600;
            }

            $endTime = $accumPeriod[$fcstPeriod - 1];
            $startTime = $endTime - 24 * 3600;
            $fHour = $accumPeriods[$fcstPeriod - 1];

            $url = "https://www.wpc.ncep.noaa.gov/Prob_Precip/hourly-data/latest/points_prob_sn_24h0$fHour.geojson";
        }

        $json = json_decode(file_get_contents($url.'?'.time()));

        if (!$json) {
            $returnJson = array('response' => 'error', 'code' => 404, 'msg' => 'Data not found');
        } else {
            if (str_contains($_REQUEST['id'], ',')) {
                $getID = explode(',', $_REQUEST['id']);
            } else {
                $getID = $_REQUEST['id'];
            }

            $points = getForecast($json);

            if (isset($_REQUEST['geojson'])) {
                $returnJson = ['type' => 'FeatureCollection', 'features' => $points];
            } else {
                $returnJson = ['snowfall' => ['fhour' => ['cycle' => $cycle->getTimestamp(), 'start' => $startTime, 'end' => $endTime], 'points' => $points]];
            }
        }
    }

    $memcache->set($cachefilename, json_encode($returnJson), 3600);
    $memcache->set($cachefilename.'-time', time(), 3600);
} else {
    $isCached = true;
    $cache = json_decode($cache);
    $returnJson = $cache;
}