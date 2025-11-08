<?
date_default_timezone_set('UTC');

$date = date('Y/m/d', strtotime((date('H') < 2 ? '-1 day' : 'now')));

function KtoF($k) {
    global $_REQUEST;

    $r = round((($k - 273.15) * 1.8) + 32, 1);

    if ($_REQUEST['tu'] == 'c') {
        $r = round(($r - 32) * (5 / 9), 1);
    }

    return $r;
}

function msToMph($s) {
    global $_REQUEST;

    $r = $s * 2.237;

    if ($_REQUEST['wu'] == 'km/h') {
        $r = $s * 1.609;
    } else {
        $r = $_REQUEST['wu'] == 'mph' || !$_REQUEST['wu'] ? $r : $s / ($_REQUEST['wu'] == 'm/s' ? 2.237 : ($_REQUEST['wu'] == 'kts' ? 1.151 : 1));
    }

    return $r;
}

if (!$_REQUEST['stn']) {
    $json = json_decode(file_get_contents('nbm.json'));

    foreach ($json as $l) {
        if (($l->lat >= floor($_REQUEST['lat']) - 1 && $l->lat <= ceil($_REQUEST['lat']) + 1) && ($l->lon <= ceil($_REQUEST['lon']) + 1 && $l->lon >= floor($_REQUEST['lon']) - 1)) {
            $locs[] = $l;
            $dist[] = distance($l->lat, $l->lon, $_REQUEST['lat'], $_REQUEST['lon']);
        }
    }

    $stn = $locs[array_search(min($dist), $dist)]->id;
} else {
    $stn = $_REQUEST['stn'];
}

$useCache = true;
$stn = str_replace(' ', '%20', $stn);
$times = get_data('http://hwp-viz.gsd.esrl.noaa.gov/wave1d//getdates?prefix=/' . $date . '/NBM4.1');
$cachefile = './cache/' . str_replace('%20', '-', $stn) . '_' . str_replace('/', '', $date) . max($times) . ($method == 'winter' ? '_winter' : '') . '.json';

if ($useCache === false || !file_exists($cachefile) || (time() - filemtime($cachefile) > 3600 || filemtime('nbm.ini.php') > filemtime($cachefile))) {
    $url = 'https://hwp-viz.gsd.esrl.noaa.gov/wave1d/data/archive/' . $date . '/NBM4.1/' . max($times) . '/' . $stn . '.csv?random=' . time();
    $file = get_html($url);

    if (!$file) {
        $url = 'https://hwp-viz.gsd.esrl.noaa.gov/wave1d/data/archive/' . $date . '/NBM4.1/' . (max($times) - 6) . '/' . $stn . '.csv?random=' . time();
        $file = get_html($url);
    }

    // the stations specified is not valid
    if (strpos($file, '400 Bad Request') !== false) {
        $returnJson = array('error' => 1, 'msg' => 'The station specified is invalid');
    } else {
        $rows = explode("\n", $file);
        $headings = explode(',', $rows[0]);
        unset($rows[0]);

        if ($method == 'winter') {
            $accum = 0;

            foreach ($rows as $row) {
                $a = array_combine($headings, explode(',', $row));
                $time = substr($a['ValidTime'], 4, 2) . '/' . substr($a['ValidTime'], 6, 2) . '/' . substr($a['ValidTime'], 0, 4) . ' ' . substr($a['ValidTime'], 8, 2) . ':00 UTC';
                $modelTime = strtotime($time);

                if ($modelTime >= time() && $modelTime <= strtotime('+3 days')) {
                    $dt[] = $modelTime;
                    $temp[] = ($a['TMP_2 m above ground'] ? array('value' => KtoF($a['TMP_2 m above ground']), 'stdev' => $a['TMP_2 m above ground_ens std dev']) : null);
                    $sl[] = ($a['SNOWLVL_0 m above mean sea level'] ? $a['SNOWLVL_0 m above mean sea level'] * 3.281 : null);
                    $slr[] = ($a['SNOWLR_surface'] ? $a['SNOWLR_surface'] : null);

                    if ($a['ASNOW6hr_surface']) {
                        $accum += $a['ASNOW6hr_surface'];
                        $hr6[] = array('valid' => $time, 'total' => $a['ASNOW6hr_surface'] * 39.37, 'accum' => $accum * 39.37);
                    }
                }

                if (date('H', $modelTime) == '00') {
                    if ($a['ASNOW24hr_surface_prob >0.0254']) {
                        $prob['times'][] = $modelTime;
                        $prob['in1'][] = $a['ASNOW24hr_surface_prob >0.0254'];
                    }/* else {
                        $prob['in1'][] = 0;
                    }*/

                    if ($a['ASNOW24hr_surface_prob >0.0508']) {
                        $prob['in2'][] = $a['ASNOW24hr_surface_prob >0.0508'];
                    }/* else {
                        $prob['in2'][] = 0;
                    }*/

                    if ($a['ASNOW24hr_surface_prob >0.1016']) {
                        $prob['in4'][] = $a['ASNOW24hr_surface_prob >0.1016'];
                    }/* else {
                        $prob['in4'][] = 0;
                    }*/

                    if ($a['ASNOW24hr_surface_prob >0.1524']) {
                        $prob['in6'][] = $a['ASNOW24hr_surface_prob >0.1524'];
                    }/* else {
                        $prob['in6'][] = 0;
                    }*/

                    if ($a['ASNOW24hr_surface_prob >0.2032']) {
                        $prob['in8'][] = $a['ASNOW24hr_surface_prob >0.2032'];
                    }/* else {
                        $prob['in8'][] = 0;
                    }*/

                    if ($a['ASNOW24hr_surface_prob >0.3048']) {
                        $prob['in12'][] = $a['ASNOW24hr_surface_prob >0.3048'];
                    }/* else {
                        $prob['in12'][] = 0;
                    }*/
                }
            }

            $outp = array('time' => $dt, 'temp' => $temp, 'frzg_level' => $sl, 'slr' => $slr, '6hr_accum' => $hr6, 'snprob' => $prob);
        } else {
            $wx = [];
            $data = [];
            $rollingTemp = [];
            $rollingRH = [];
            $rollingWind = [];
            $rollingGust = [];
            $count = $num = 0;

            foreach ($rows as $row) {
                $a = array_combine($headings, explode(',', $row));
                $time = substr($a['ValidTime'], 4, 2) . '/' . substr($a['ValidTime'], 6, 2) . '/' . substr($a['ValidTime'], 0, 4) . ' ' . substr($a['ValidTime'], 8, 2) . ':00 UTC';
                $modelTime = strtotime($time);

                if ($modelTime >= time() && $modelTime <= strtotime('+3 days')) {
                    if ($count == 0) {
                        $firstTime = $modelTime;
                    }
                    $dt[] = $modelTime;

                    if (KtoF($a['TMP_2 m above ground']) > -100) {
                        $tmpTemp[] = KtoF($a['TMP_2 m above ground']);
                    }
                    $tmpRH[] = $a['RH_2 m above ground'];
                    $tmpWind[] = msToMph($a['WIND_10 m above ground']);
                    $tmpGust[] = msToMph($a['GUST_10 m above ground']);
                    
                    if (date('H', $modelTime) == '0'.(date('I') == 0 ? '8' : '7')) {
                        $rollingStart[] = (time() < $modelTime - (60 * 60 * 24) ? $modelTime - (60 * 60 * 24) : $firstTime);
                        $rollingEnd[] = $modelTime;
                        $rollingRH[] = $tmpRH;
                        $rollingTemp[] = $tmpTemp;
                        $rollingWind[] = $tmpWind;
                        $rollingGust[] = $tmpGust;
                        $tmpTemp = array();
                        $tmpRH = array();
                        $tmpWind = array();
                        $tmpGust = array();
                    }

                    if ($a['TMP_2 m above ground']) {
                        $t = floatval(KtoF($a['TMP_2 m above ground']));
                        $sd = floatval($a['TMP_2 m above ground_ens std dev']);
                        $temp[] = array('value' => $t, 'min' => $t - $sd, 'max' => $t + $sd);
                    }

                    if ($a['RH_2 m above ground']) {
                        $rh[] = array('value' => floatval($a['RH_2 m above ground']));
                    }

                    if ($a['WIND_10 m above ground']) {
                        $w = floatval(msToMph($a['WIND_10 m above ground']));
                        $sd = floatval($a['WIND_10 m above ground_ens std dev']);
                        $speed[] = array('value' => $w, 'min' => $w - $sd, 'max' => $w + $sd);
                    }

                    if ($a['GUST_10 m above ground']) {
                        $w = floatval(msToMph($a['GUST_10 m above ground']));
                        $sd = floatval($a['GUST_10 m above ground_ens std dev']);
                        $gust[] = array('value' => $w, 'min' => $w - $sd, 'max' => $w + $sd);
                    }

                    if ($a['MIXHT_entire atmosphere (considered as a single layer)']) {
                        $m = floatval($a['MIXHT_entire atmosphere (considered as a single layer)'] * 3.281);
                        $mh[] = array('value' => $m);
                    }

                    $count++;
                }
            }

            for ($i = 0; $i < count($rollingStart); $i++) {
                $minTemp = floatval(min(array_values(array_filter($rollingTemp[$i]))));
                $maxTemp = floatval(max(array_values(array_filter($rollingTemp[$i]))));
                $minRH = floatval(min(array_values(array_filter($rollingRH[$i]))));
                $maxRH = floatval(max(array_values(array_filter($rollingRH[$i]))));
                $ws = floatval(max(array_values(array_filter($rollingWind[$i]))));
                $wg = floatval(max(array_values(array_filter($rollingGust[$i]))));

                $periods[] = array('valid' => $rollingStart[$i], 'until' => $rollingEnd[$i], 'temp' => array('min' => $minTemp, 'max' => $maxTemp),
                    'rh' => array('min' => $minRH, 'max' => $maxRH), 'wind' => array('sustained' => $ws, 'gusts' => $wg));
            }
            
            $outp = array('overview' => array('periods' => $periods), 'time' => $dt, 'temp' => $temp, 'rh' => $rh, 'wind' => array('speed' => $speed, 'gusts' => $gust), 'mixing' => $mh);

                /*$t = $a['TMP_2 m above ground'];
                $tdev = $a['TMP_2 m above ground_ens std dev'];
                $rh = $a['RH_2 m above ground'];
                $wind = $a['WIND_10 m above ground'];
                $wdev = $a['WIND_10 m above ground_ens std dev'];

                /*$minwind = floor($wind - ($wdev * 2.237));
                    $windq1 = floor($wind - (0.675 * ($wdev * 2.237)));
                    $windq3 = floor($wind + (0.675 * ($wdev * 2.237)));
                    $maxwind = ceil($wind + ($wdev * 2.237));*/
                /*$tdev = $a['TMP_2 m above ground_ens std dev'];
                    $min = floor(1.8 * ($a['TMP_2 m above ground'] - $tdev - 273.15) + 32);
                    $q1 = floor($t - (0.675 * $tdev));
                    $q3 = floor($t + (0.675 * $tdev));
                    $max = ceil(1.8 * ($a['TMP_2 m above ground'] + $tdev - 273.15) + 32);*/

                /*$dt = substr($time, 4, 2) . '/' . substr($time, 6, 2) . '/' . substr($time, 0, 4) . ' ' . substr($time, 8, 2) . ':00 UTC';
                $day = (date('H', strtotime($dt)) >= '19' || date('H', strtotime($dt)) <= '04' ? 'day' : 'night');

                if ($day != $prevday) {
                    $outp[] = array();
                }

                /*if (floor($t) == -460 && $rh == '') {
                        $arr[] = array('date' => $dt, 'nodata' => 1);        
                    } else {*/
                /*if ($t && $rh && $wind && (strtotime($dt) >= time())) {
                    //$nice = date(($date != $prevdate || !$prevdate ? 'M j ' : '').'g A', strtotime($dt));
                    $outp[] = array('date' => $dt, 'label' => strtotime($dt), 'temp' => array(KtoF($t - $tdev), KtoF($t), KtoF($t + $tdev)), 'rh' => $rh, 'wind' => array(msToMph($wind - $wdev), msToMph($wind), msToMph($wind + $wdev)));
                    //$arr[] = array('date' => $dt, 'temp' => $t, 'temp_dev' => $tdev, 'rh' => $rh, 'wind' => $wind, 'wind_dev' => $wdev);
                    /*$arr[] = array('date' => $dt, 'rh' => $rh, 'temp' => array('min' => $min, 'q1' => $q1, 'mid' => floor($t), 'q3' => $q3, 'max' => $max),
                                                                'wind' => array('min' => $minwind, 'q1' => $windq1, 'mid' => floor($wind), 'q3' => $windq3, 'max' => $maxwind));*/
                /*}
                $prevday = $day;
            }

            /*foreach($arr as $a) {
                    if (empty($a)) {
                        $count = 0;
                        $num++;
                        if (!empty($a)) {
                            $wx[($num - 1)][] = $a;
                        }
                    } else {
                        $wx[$num][] = $a;
                    }
                }

                $wx = array_values($wx);*/
            //$outp = array_values(array_filter($arr));
        }

        $returnJson = array('nbm' => array('stn' => $stn, 'model_run' => date('Y-m-d\T') . max($times) . ':00:00Z', 'valid' => min($outp['time']), 'ends' => max($outp['time']), 'data' => $outp));

        file_put_contents($cachefile, json_encode($returnJson));
    }
} else {
    $isCached = true;
    $stored = file_get_contents($cachefile);
    $returnJson = json_decode($stored, true);
}
?>