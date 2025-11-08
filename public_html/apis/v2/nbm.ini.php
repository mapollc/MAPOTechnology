<?
date_default_timezone_set('UTC');

function name($t) {
    $names = [
        'UTC' => 'time', 'TMP' => 'temp', 'TSD' => 'temp_std_dev', 'DPT' => 'dewpoint', 'DSD' => 'dp_std_dev',
        'SKY' => 'sky_cover', 'SSD' => 'sky_cover_std_dev', 'WDR' => 'wind_dir', 'WSP' => 'wind_speed',
        'WSD' => 'wind_speed_std_dev', 'GST' => 'wind_gust', 'GSD' => 'wind_gust_std_dev', 'P01' => 'pop_1hr',
        'P06' => 'pop_6hr', 'Q01' => 'qpf_1hr', 'T01' => 'tstm_prob_1hr', 'PZR' => 'fzrn_prob',
        'PSN' => 'snow_prob', 'PPL' => 'sleet_prob', 'PRA' => 'rain_prob', 'S01' => 'snow_accum_1hr',
        'SLV' => 'snow_level', 'I01' => 'ice_accum_1hr', 'CIG' => 'ceiling_height', 'LCB' => 'lowest_clouds',
        'VIS' => 'visibility', 'MHT' => 'mixing_height', 'TWD' => 'transport_wind_dir', 'TWS' => 'transport_wind_speed',
        'HID' => 'haines_index', 'SOL' => 'solar_rad'
    ];

    return $names[$t] ? $names[$t] : $t;
}

function convertTime($date, $hrs) {
    $nextDay = false;
    $count = 0;

    foreach ($hrs as $hr) {
        $newdate = substr($date, 4, 2).'/'.substr($date, 6, 2).'/'.substr($date, 0, 4);
        $ts = "$newdate $hr:00 UTC";

        if ($hr == '00' && $count != 0) {
            $nextDay = true;
        }

        if ($nextDay) {
            $ts = date('m/d/Y H:i', strtotime($ts) + 86400).' UTC';
        }

        $time[] = strtotime($ts);
        $count++;
    }
    return $time;
}

function wind($wind) {
    foreach ($wind as $w) {
        $mph[] = round($w * 1.15078, 1);
    }
    return $mph;
}

function toInt($val) {
    foreach ($val as $v) {
        $o[] = floatval($v);
    }
    return $o;
}

function divide($val, $div) {
    foreach ($val as $v) {
        $o[] = $v * $div;
    }
    return $o;
}

function parseWX($stn, $lines) {
    global $date;
    global $fcsthr;
    
    $run = substr($date, 0, 4).'-'.substr($date, 4, 2).'-'.substr($date, 6, 2).'T'.$fcsthr.':00:00 GMT';
    $winds = ['WSP', 'WSD', 'GST', 'GSD', 'TWS'];
    $useThese = ['UTC', 'TMP', 'TSD', 'DPT', 'DSD', 'SKY', 'WDR', 'P01', 'P06', 'Q01', 'T01', 'PZR', 'PSN', 'PPL', 'PRA', 'S01', 'SLV', 'I01', 'HID', 'WSP', 'WSD', 'GST', 'GSD'];

    for ($i = 1; $i < count($lines); $i++) {
        $line = $lines[$i];
        preg_match('/(([A-Z0-9]{3})\s{1,3})(.*)/', $line, $var);
        $variable = $var[2];

        if (in_array($variable, $useThese)) {
            preg_match_all('/([0-9\-]{1,3})/', $var[3], $each);
            $val = $each[1];

            if ($variable != 'P06' && $variable != 'HID') {
                if ($variable == 'UTC') {
                    $val = convertTime($date, $val);
                } else if (in_array($variable, $winds)) {
                    $val = wind($val);
                } else if ($variable == 'PZR' || $variable == 'PSN' || $variable == 'PPL' || $variable == 'P01') {
                    $val = divide($val, .01);
                } else if ($variable == 'S01') {
                    $val = divide($val, .1);
                } else if ($variable == 'SLV') {
                    $val = divide($val, 100);
                } else if ($variable == 'Q01') {
                    $val = divide($val, .01);
                }

                $out[name($variable)] = toInt($val);
            }
        }
    }

    for ($i = 0; $i < 25; $i++) {
        $hr = [];

        foreach (array_keys($out) as $k) {
            if ($k == 'time') {
                $times = $out[$k];
            } else {
                $hr[$k] = $out[$k];
            }
        }

        $data = array('times' => $times, 'data' => $hr);
    }
    $stats = stats($out['temp'], $out['qpf_1hr'], $out['rain_prob'], $out['snow_accum_1hr'], $out['snow_prob'], $out['fzrn_prob'], $out['pop_1hr'], $out['wind_speed'], $out['wind_gust'], $out['tstm_prob_1hr']);

    return array('nbm' => array('id' => $stn->id, 'name' => $stn->name, 'model_run' => $run, 'valid' => ['from' => $times[0], 'until' => $times[24]], 'stats' => $stats, 'forecast' => $data));
}

function stats($t, $qpf, $rprob, $sn, $sprob, $fzrnprob, $pop, $wspd, $wgst, $tstm) {
    $vars = ['temp' => $t, 'qpf' => $qpf, 'rain_prob' => $rprob, 'snow_accum' => $sn, 'snow_prob' => $sprob, 'fzrn_prob' => $fzrnprob,
    'pop' => $pop, 'tstm_prob' => $tstm, 'wind_speed' => $wspd, 'wind_gust' => $wgst];

    foreach ($vars as $k => $v) {
        if (array_sum($v) == 0) {
            $data = null;
        } else {
            $data = ['min' => min($v), 'max' => max($v), 'mean' => array_sum($v) / count($v), 'std_dev' => std_dev($v)];

            if ($k == 'snow_accum') {
                $data['total'] = array_sum($v);
            }
        }

        $out[$k] = $data;
    }

    return $out;
}

function nbm($stn, $file) {
    $a = preg_split('/(\n\s{5,}\n)/', $file);

    for ($i = 1; $i < count($a); $i++) {
        $lines = preg_split('/\n/', ltrim(rtrim($a[$i])));
        preg_match('/(.*?)\s{1,}NBM V4.2 NBH GUIDANCE\s{1,}([0-9]+\/[0-9]+\/[0-9]+)\s{1,}([0-9]{4})/', $lines[0], $details);
        $id = $details[1];

        if ($id == $stn->id) {
            return parseWX($stn, $lines);
        }
    }

    return array('error' => true);
}

function stations($id, $lat = null, $lon = null) {
    global $stns;

    if ($id == null) {
        foreach ($stns as $st) {
            $locs[] = $st;
            $dist[] = distance($lat, $lon, $st->lat, $st->lon);
        }

        return $locs[array_search(min($dist), $dist)];
    } else {
        foreach ($stns as $st) {
            if ($st->id == $id) {
                return $st;
            }
        }
    }
    return null;
}

if ((isset($method) && $method == '') || (!isset($method) && !isset($_GET['lat']) && !isset($_GET['lon']))) {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid station ID was provided');
} else if (!isset($method) && ((isset($_GET['lat']) && !isset($_GET['lon'])) || (!isset($_GET['lat']) && isset($_GET['lon'])))) {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'An invalid latitude and longitude were provided');
} else {
    $shift = intval(date('i')) >= 40 ? '+0 hours' : '-1 hour';
    $date = date('Ymd', strtotime($shift));
    $fcsthr = date('H', strtotime($shift));

    $cachefilename = "$date$fcsthr_".(isset($_GET['lat']) && isset($_GET['lon']) ? "$_GET[lat]_$_GET[lon]" : $_GET['id']);
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211); 
    $cache = $memcache->get($cachefilename);
    $cachetime = $memcache->get("$cachefilename-time");

    if (!$cache || filemtime(root().'nbm.ini.php') > $cachetime) {
        $stns = json_decode(file_get_contents('./cache/nbm.json'));
        $url = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/blend/prod/blend.$date/$fcsthr/text/blend_nbhtx.t".$fcsthr."z";
        $file = file_get_contents($url);

        if (isset($_GET['lat']) && isset($_GET['lon'])) {
            $findStn = stations(null, $_GET['lat'], $_GET['lon']);

            $nbm = nbm($findStn, $file);
        } else {
            $station = stations($method);
            $nbm = nbm($station, $file);
        }

        $returnJson = $nbm;
        $memcache->set($cachefilename, json_encode($returnJson), 3600);
        $memcache->set("$cachefilename-time", time(), 3600);
    } else {
        $isCached = true;
        $cache = json_decode($cache);
        $returnJson = $cache;
    }
}