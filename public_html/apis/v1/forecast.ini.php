<?
$accums = array('min' => [], 'max' => [], 'time' => []);
$snowAccumulation = array('min' => 0, 'max' => 0);

function nwsTime($t) {
    return strtotime(explode('/', $t)[0]);
}

/*function stdev($a) {
    $n = count($a);
    
    if ($n === 0) {
        return false;
    }
    
    $mean = array_sum($a) / $n;
    $std_dev = 0.0;
    
    foreach ($a as $val) {
        $std_dev += pow($val - $mean, 2);
    }

    return sqrt($std_dev / $n);
}*/

function snowAccum($time, $text) {
    global $snowAccumulation;
    global $accums;

    $accums['time'][] = $time;
    preg_match_all('/Little or no snow|snow accumulation of (.*?) inch/', $text, $matches, PREG_SET_ORDER, 0);

    if (count($matches) > 0) {
        preg_match('/([0-9]+)\sto\s([0-9]+)/', $matches[0][1], $out);

        if (count($out) > 1) {
            $snowAccumulation['min'] = $snowAccumulation['min'] + $out[1];
            $snowAccumulation['max'] = $snowAccumulation['max'] + $out[2];

            $accums['min'][] = floatval($out[1] ? $out[1] : 0);
            $accums['max'][] = floatval($out[2] ? $out[2] : 0);
            return array('min' => intval($out[1]), 'max' => intval($out[2]));
        } else {
            if (str_contains($matches[0][1], 'quarter')) {
                $max = 0.25;
            } else if (str_contains($matches[0][1], 'half')) {
                $max = 0.5;
            } else if (str_contains($matches[0][0], 'Little')) {
                $max = 0.1;
            };

            $snowAccumulation['max'] = $snowAccumulation['max'] + $max;

            $accums['min'][] = floatval(0);
            $accums['max'][] = floatval($max ? $max : 0);
            return array('min' => 0, 'max' => $max);
        }
    } else {
        $accums['min'][] = floatval(0);
        $accums['max'][] = floatval(0);
        return array('min' => 0, 'max' => 0);
    }
}

if ($method == 'incident') {
    $a = get_data('https://api.weather.gov/points/'.$_REQUEST['lat'].','.$_REQUEST['lon'])['properties']['forecastGridData'];
    $json = get_data($a)['properties'];

    for ($i = 0; $i < count($json['temperature']['values']); $i++) {
        $time = strtotime(explode('/', $json['temperature']['values'][$i]['validTime'])[0]);
        
        if ($time >= time() && $time <= strtotime('+24 hours')) {
            $temp[] = round(($json['temperature']['values'][$i]['value'] * 1.8) + 32, 0);
            $rh[] = $json['relativeHumidity']['values'][$i]['value'];
            $windSpd[] = round($json['windSpeed']['values'][$i]['value'] / 1.609, 0);
            $windGust[] = round($json['windGust']['values'][$i]['value'] / 1.609, 0);
        }
        /*if (strtotime('+12 hours') - strtotime($json['periods'][$i]['startTime']) >= 0) {
            $temp[] = $json['periods'][$i]['temperature'];
            $wind[] = str_replace(' mph', '', $json['periods'][$i]['windSpeed']);
        }*/
    }

    $returnJson = array('forecast' => array('temp' => array('min' => min($temp), 'max' => max($temp)),
                                            'rh' => array('min' => min($rh), 'max' => max($rh)),
                                            'wind' => array('speed' => array('min' => min($windSpd), 'max' => max($windSpd)),
                                                            'gusts' => array('min' => min($windGust), 'max' => max($windGust)))),
                        'updated' => strtotime(explode('/', $json['updateTime'])[0]));
    //print_r($json);
} else {
    if (!isset($_REQUEST['lat']) || !isset($_REQUEST['lon'])) {
        $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'A latitude and longitude were not provided');
    } else {
        $cachefilename = round($_REQUEST['lat'], 4).'|'.round($_REQUEST['lon'], 4);
        $memcache = new Memcached();
        $memcache->addServer('127.0.0.1', 11211); 
        $cache = $memcache->get($cachefilename);

        if (!$cache || filemtime('forecast.ini.php') > $memcache->get($cachefilename.'-time')) {
            $a = get_data('https://api.weather.gov/points/'.round($_REQUEST['lat'], 4).','.round($_REQUEST['lon'], 4));
            $cwa = $a['properties']['cwa'];
            /*$x = $a['properties']['gridX'];
            $y = $a['properties']['gridY'];*/

            $b = json_decode(json_encode(get_data($a['properties']['forecastHourly'])), true);
            $c = json_decode(json_encode(get_data($a['properties']['forecast'])), true);

            /*$b = json_decode(json_encode(get_data('https://api.weather.gov/gridpoints/'.$cwa.'/'.$x.','.$y.'/forecast/hourly')), true);
            unset($b['@context']);*

            $c = json_decode(json_encode(get_data('https://api.weather.gov/gridpoints/'.$cwa.'/'.$x.','.$y.'/forecast')), true);
            unset($c['@context']);*/

            for ($i = 0; $i < 24; $i++) {
                $b['properties']['periods'][$i]['startTime'] = nwsTime($b['properties']['periods'][$i]['startTime']);
                $b['properties']['periods'][$i]['endTime'] = nwsTime($b['properties']['periods'][$i]['endTime']);

                preg_match('/(rain|snow),[0-9]+/', $b['properties']['periods'][$i]['icon'], $match);

                if (count($match) == 0) {
                    $b['properties']['periods'][$i]['icon'] = preg_replace('/,[0-9]+/', '', $b['properties']['periods'][$i]['icon']);
                }

                $b['properties']['periods'][$i]['probabilityOfPrecipitation'] = $b['properties']['periods'][$i]['probabilityOfPrecipitation']['value'];
                $b['properties']['periods'][$i]['relativeHumidity'] = $b['properties']['periods'][$i]['relativeHumidity']['value'];
                $b['properties']['periods'][$i]['dewpoint'] = ((9/5) * $b['properties']['periods'][$i]['dewpoint']['value']) + 32;

                $periods[] = $b['properties']['periods'][$i];
            }

            for ($i = 0; $i < 14; $i++) {
                $c['properties']['periods'][$i]['startTime'] = nwsTime($c['properties']['periods'][$i]['startTime']);
                $c['properties']['periods'][$i]['endTime'] = nwsTime($c['properties']['periods'][$i]['endTime']);

                preg_match('/(rain|snow),[0-9]+/', $c['properties']['periods'][$i]['icon'], $match);

                if (count($match) == 0) {
                    $c['properties']['periods'][$i]['icon'] = preg_replace('/,[0-9]+/', '', $c['properties']['periods'][$i]['icon']);
                }

                $c['properties']['periods'][$i]['probabilityOfPrecipitation'] = $c['properties']['periods'][$i]['probabilityOfPrecipitation']['value'];

                if ($_REQUEST['winter'] == 1) {
                    $c['properties']['periods'][$i]['snow'] = snowAccum($c['properties']['periods'][$i]['startTime'], $c['properties']['periods'][$i]['detailedForecast']);
                }

                $days[] = $c['properties']['periods'][$i];
            }

            $hourly = array('updated' => nwsTime($b['properties']['updateTime']), 'periods' => $periods);
            $daily = array('updated' => nwsTime($c['properties']['updateTime']), 'periods' => $days);

            //print_r($snowAccumulation);
            $fcst = array('forecast' => array('wfo' => $cwa, 'hourly' => $hourly, 'daily' => $daily));

            if ($_REQUEST['winter'] == 1) {
                $allAccum = 0;
                $allAccum2 = 0;

                for ($i = 0; $i < count($accums['time']); $i++) {
                    $allAccum += $accums['min'][$i];
                    $allAccum2 += $accums['max'][$i];
                    $period['min'][] = $allAccum;
                    $period['max'][] = $allAccum2;
                }

                if ($accums['time'][0] == false) {
                    $snowAccumulation = null;
                } else {
                    $snowAccumulation['chart'] = array('min' => $accums['min'], 'max' => $accums['max'], 'period' => $period, 'times' => $accums['time']);
                    //$snowAccumulation['stdDev'] = ['min' => stdev($accums['min']), 'max' => stdev($accums['max'])];
                    $snowAccumulation['unit'] = 'in';
                }

                /*if ($snowAccumulation['min'] > 12 && $snowAccumulation['max'] > 12) {
                    $snowAccumulation['min'] = round($snowAccumulation['min'] / 12, 1);
                    $snowAccumulation['max'] = round($snowAccumulation['max'] / 12, 1);
                    $snowAccumulation['unit'] = "ft";
                }*/

                $fcst['winter'] = $snowAccumulation;
            }

            $returnJson = $fcst;

            $memcache->set($cachefilename, json_encode($returnJson), 3600);
            $memcache->set($cachefilename.'-time', time(), 3600);        
        } else {
            $isCached = true;
            $cache = json_decode($cache);
            $returnJson = $cache;        
        }
    }
}