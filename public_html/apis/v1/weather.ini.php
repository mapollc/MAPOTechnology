<?
function remove_outliers2($array)
{
    $mean = array_sum($array) / count($array);
    $std_dev = sqrt(array_sum(array_map(function ($x) use ($mean) {
        return pow($x - $mean, 2);
    }, $array)) / count($array));
    $threshold = 2 * $std_dev;

    return array_filter($array, function ($x) use ($mean, $threshold) {
        return abs($x - $mean) <= $threshold;
    });
}
function FtoC($t)
{
    return ($t - 32) * (5 / 9);
}

function INtoCM($in)
{
    return round($in * 2.54, 1);
}

function heatIndex($t, $rh)
{
    $hi = 0.5 * ($t + 61.0 + (($t - 68.0) * 1.2) + ($rh * 0.094));

    if ($hi > 80) {
        $hi = -42.379 + 2.04901523 * $t + 10.14333127 * $rh - .22475541 * $t * $rh - .00683783 * $t * $t - .05481717 * $rh * $rh + .00122874 * $t * $t * $rh + .00085282 * $t * $rh * $rh - .00000199 * $t * $t * $rh * $rh;

        if ($rh < 13 && ($t > 80 && $t < 112)) {
            $hi -= ((13 - $rh) / 4) * sqrt((17 - abs($t - 95.0)) / 17);
        } else if ($rh > 85 && ($t > 80 && $t < 87)) {
            $hi +=  (($rh - 85) / 10) * ((87 - $t) / 5);
        }
    }

    return round($hi, 1);
}

function windChill($t, $v)
{
    return round(35.74 + (0.6215 * $t) - (35.75 * pow($v, 0.16)) + (0.4275 * $t * pow($v, 0.16)), 1);
}

function getWeatherCode($v)
{
    if ($v == -3) {
        $color = 'red';
        $desc = 'Water Spout';
    } else if ($v == -2) {
        $color = 'red';
        $desc = 'Funnel Cloud';
    } else if ($v == -1) {
        $color = 'red';
        $desc = 'Tornado';
    } else if ($v == 1) {
        $color = 'green';
        $desc = 'Rain';
    } else if ($v == 2) {
        $color = 'green';
        $desc = 'Drizzle';
    } else if ($v == 3) {
        $color = 'green';
        $desc = 'Snow';
    } else if ($v == 4) {
        $color = 'green';
        $desc = 'Hail';
    } else if ($v == 5) {
        $color = 'red';
        $desc = 'Thunder';
    } else if ($v == 6) {
        $color = 'orange';
        $desc = 'Haze';
    } else if ($v == 7) {
        $color = '#FF00FF';
        $desc = 'Smoke';
    } else if ($v == 8) {
        $color = '#FF00FF';
        $desc = 'Dust';
    } else if ($v == 9) {
        $color = '#FF00FF';
        $desc = 'Fog';
    } else if ($v == 10) {
        $color = 'red';
        $desc = 'Squalls';
    } else if ($v == 11) {
        $color = '#FF00FF';
        $desc = 'Volcanic Ash';
    } else if ($v == 13) {
        $color = 'green';
        $desc = 'Light rain';
    } else if ($v == 14) {
        $color = 'green';
        $desc = 'Heavy rain';
    } else if ($v == 15) {
        $color = 'red';
        $desc = 'Freezing rain';
    } else if ($v == 16) {
        $color = 'green';
        $desc = 'Showers';
    } else if ($v == 17) {
        $color = 'green';
        $desc = 'Light drizzle';
    } else if ($v == 18) {
        $color = 'green';
        $desc = 'Heavy drizzle';
    } else if ($v == 19) {
        $color = 'green';
        $desc = 'Freezing drizzle';
    } else if ($v == 20) {
        $color = 'green';
        $desc = 'Light snow';
    } else if ($v == 21) {
        $color = 'green';
        $desc = 'Heavy snow';
    } else if ($v == 22) {
        $color = 'green';
        $desc = 'Snow';
    } else if ($v == 23) {
        $color = 'green';
        $desc = 'Ice pellets';
    } else if ($v == 24) {
        $color = 'green';
        $desc = 'Snow grains';
    } else if ($v == 25) {
        $color = 'green';
        $desc = 'Snow pellets';
    } else if ($v == 26) {
        $color = 'green';
        $desc = 'Light hail';
    } else if ($v == 27) {
        $color = 'green';
        $desc = 'Heavy hail';
    } else if ($v == 28) {
        $color = 'red';
        $desc = 'Light thunderstorm';
    } else if ($v == 29) {
        $color = 'red';
        $desc = 'Heavy thunderstorm';
    } else if ($v == 30) {
        $color = '#FF00FF';
        $desc = 'Freezing Fog';
    } else if ($v == 31) {
        $color = 'orange';
        $desc = 'Mist';
    } else if ($v == 32) {
        $color = 'orange';
        $desc = 'Blowing snow';
    } else if ($v == 33) {
        $color = 'orange';
        $desc = 'Blowing dust';
    } else if ($v == 34) {
        $color = 'orange';
        $desc = 'Blowing spray';
    } else if ($v == 35) {
        $color = 'orange';
        $desc = 'Blowing sand';
    } else if ($v == 36) {
        $color = 'green';
        $desc = 'Ice crystals';
    } else if ($v == 37) {
        $color = 'green';
        $desc = 'Ice needles';
    } else if ($v == 38) {
        $color = 'green';
        $desc = 'Light hail';
    } else if ($v == 39) {
        $color = 'orange';
        $desc = 'Smoke, haze';
    } else if ($v == 40) {
        $color = 'orange';
        $desc = 'Dust whirls';
    } else if ($v == 41) {
        $color = '';
        $desc = 'Unknown precipitation';
    } else if ($v == 49) {
        $color = 'red';
        $desc = 'Light freezing rain';
    } else if ($v == 50) {
        $color = 'red';
        $desc = 'Heavy freezing rain';
    } else if ($v == 51) {
        $color = 'green';
        $desc = 'Light showers';
    } else if ($v == 52) {
        $color = 'green';
        $desc = 'Heavy showers';
    } else if ($v == 53) {
        $color = 'green';
        $desc = 'Light freezing drizzle';
    } else if ($v == 54) {
        $color = 'green';
        $desc = 'Heavy freezing drizzle';
    } else if ($v == 55) {
        $color = 'green';
        $desc = 'Light snow';
    } else if ($v == 56) {
        $color = 'green';
        $desc = 'Heavy snow';
    } else if ($v == 57) {
        $color = 'green';
        $desc = 'Light ice pellets';
    } else if ($v == 58) {
        $color = 'green';
        $desc = 'Heavy ice pellets';
    } else if ($v == 59) {
        $color = 'green';
        $desc = 'Light snow grains';
    } else if ($v == 60) {
        $color = 'green';
        $desc = 'Heavy snow grains';
    } else if ($v == 61) {
        $color = 'green';
        $desc = 'Light snow pellets';
    } else if ($v == 62) {
        $color = 'green';
        $desc = 'Heavy snow pellets';
    } else if ($v == 63) {
        $color = 'green';
        $desc = 'Ice pellets';
    } else if ($v == 64) {
        $color = 'green';
        $desc = 'Light ice crystals';
    } else if ($v == 65) {
        $color = 'green';
        $desc = 'Heavy ice crystals';
    } else if ($v == 66) {
        $color = 'red';
        $desc = 'Thunder shower';
    } else if ($v == 67) {
        $color = 'green';
        $desc = 'Snow pellets';
    } else if ($v == 68) {
        $color = 'orange';
        $desc = 'Heavy blowing dust';
    } else if ($v == 69) {
        $color = 'orange';
        $desc = 'Heavy blowing sand';
    } else if ($v == 69) {
        $color = 'orange';
        $desc = 'Heavy blowing snow';
    } else if ($v == 75) {
        $color = 'green';
        $desc = 'Light ice pellets';
    } else if ($v == 76) {
        $color = 'green';
        $desc = 'Heavy ice pellets';
    } else if ($v == 77) {
        $color = 'red';
        $desc = 'Light thunder shower';
    } else if ($v == 78) {
        $color = 'red';
        $desc = 'Heavy thunder shower';
    } else {
        $color = '';
        $desc = '';
    }

    return $desc;
}

function getWeather($v)
{
    if ($v < 80) {
        return [getWeatherCode($v)];
    } else if ($v < 6400) {
        $e1 = floor($v / 80);
        $e2 = $v % 80;
        return [getWeatherCode($e1), getWeatherCode($e2)];
    } else {
        $e1 = floor($v / 6400);
        $e2 = $v - 6400 * $e1;
        $e3 = $v % 80;
        return [getWeatherCode($e1), getWeatherCode($e2), getWeatherCode($e3)];
    }
}

function formatName($s)
{
    $r = implode('/', array_map('ucfirst', explode('/', str_replace(' At ', ' at ', ucwords(strtolower($s))))));
    if (substr($r, 0, 2) == 'Cw' || substr($r, 0, 2) == 'Dw' || substr($r, 0, 2) == 'Ew' || substr($r, 0, 2) == 'Fw') {
        $r = str_replace(substr($r, 0, 2), strtoupper(substr($r, 0, 2)), $r);
    }
    $r = str_replace(array('Ii', ' Eb', ' Wb', ' Mp'), array('II', ' EB', ' WB', ' MP'), $r);

    $parts = explode('/', $r);
    $parts = explode('-', implode('/', $parts));

    for ($i = 1; $i < count($parts); $i++) {
        $parts[$i] = ucfirst($parts[$i]);
    }

    return implode('-', $parts);
}

function calculateSnowTotals($snowArray, $dt)
{
    global $unit;

    $sdepth = remove_outliers2(array_reverse($snowArray));
    #$dt = remove_outliers2(array_reverse($dtArray));

    for ($i = 0; $i < count($dt); $i++) {
        # remove null values from snow depth
        if ($sdepth[$i] == null) {
            unset($sdepth[$i]);
            unset($dt[$i]);
        } else {
            $snow[] = $sdepth[$i];
        }
    }

    for ($i = 0; $i < count($dt); $i++) {
        $timediff = abs(strtotime($dt[0]) - strtotime($dt[$i]));

        if ($timediff == 21600) {
            $s6 = $unit != 'f' ? INtoCM($snow[$i]) : $snow[$i];
        } else if ($timediff == 43200) {
            $s12 = $unit != 'f' ? INtoCM($snow[$i]) : $snow[$i];
        } else if ($timediff == 86400) {
            $s24 = $unit != 'f' ? INtoCM($snow[$i]) : $snow[$i];
        } else if ($timediff == 172800) {
            $s48 = $unit != 'f' ? INtoCM($snow[$i]) : $snow[$i];
        }
    }

    $hs = $unit != 'f' ? INtoCM($snow[0]) : $snow[0];
    $s6 = $s6 == '' ? null : (($hs - $s6) <= 0 ? 0 : $hs - $s6);
    $s12 = $s12 == '' ? null : (($hs - $s12) <= 0 ? 0 : $hs - $s12);
    $s24 = $s24 == '' ? null : (($hs - $s24) <= 0 ? 0 : $hs - $s24);
    $s48 = $s48 == '' ? null : (($hs - $s48) <= 0 ? 0 : $hs - $s48);

    if (!empty($snowArray)) {
        /* Fix erroneous issues with snow calculations
                    If there was snow compression, change to 0" of new snow */
        $hs = $hs < 0 ? 0 : $hs;                                # If the weather station returns a snow depth < 0, set the depth equal to 0, otherwise show the current HS 
        $s12 = $s12 < $s6 ? $s6 : $s12;                        # If 12-hr snow < 6-hr snow, set 12-hr snow = 6-hr snow
        $s24 = $s24 < $s12 ? $s12 : $s24;                    # If 24-hr snow < 12-hr snow, set 24-hr snow = 12-hr snow
        $s48 = $s48 < $s24 ? $s24 : $s48;                    # If 48-hr snow < 24-hr snow, set 48-hr snow = 24-hr snow
        $s6 = $s6 < 0 ? 0 : $s6;                                # If 6-hr snow < 0, set 6-hr snow = 0
        $s12 = $s12 < 0 ? 0 : $s12;                              # If 12-hr snow < 0, set 12-hr snow = 0
        $s24 = $s24 < 0 ? 0 : $s24;                              # If 24-hr snow < 0, set 24-hr snow = 0
        $s48 = $s48 < 0 ? 0 : $s48;                              # If 48-hr snow < 0, set 48-hr snow = 0
    }

    $hs = $hs == null ? 0 : $hs;
    $s6 = $s6 == null ? 0 : $s6;
    $s12 = $s12 == null ? 0 : $s12;
    $s24 = $s24 == null ? 0 : $s24;
    $s48 = $s48 == null ? 0 : $s48;

    return array('hs' => $hs, '6hr' => $s6, '12hr' => $s12, '24hr' => $s24, '48hr' => $s48);
}

function getWX($stn, $start, $end)
{
    global $_REQUEST;
    ////$token = 'd8c6aee36a994f90857925cea26934be';
    $token = '44f4f6fef5d3468894bf07594e8862c0';

    if ($_REQUEST['latest'] == 1) {
        $url = 'https://api.synopticlabs.org/v2/stations/latest?token=' . $token . '&' . ($_REQUEST['radius'] ? 'radius=' . $_REQUEST['radius'] : 'stid=' . $stn) . '&timeformat=%m/%d/%Y%20%H:%M&vars=air_temp%2Cdew_point_temperature%2Cwind_speed%2Cwind_gust%2Cwind_direction%2Crelative_humidity%2Csnow_depth%2Cpressure%2Cprecip_accum_one_hour%2Cweather_cond_code&units=temp%7Cf%2Cspeed%7Cmph%2Cprecip%7Cin&obtimezone=local&showemptystations=0&status=active&networkimportance=2,1&' . ($_REQUEST['radius'] ? 'limit=4' : '');
    } else {
        if ($stn == 'nearby') {
            $url = 'https://api.synopticlabs.org/v2/stations/timeseries?token=' . $token . '&radius=' . $_REQUEST['radius'] . '&start=' . $start . '&end=' . $end . '&timeformat=%m/%d/%Y%20%H:%M&vars=air_temp%2Cdew_point_temperature%2Cwind_speed%2Cwind_gust%2Cwind_direction%2Crelative_humidity%2Csnow_depth%2Cpressure%2Cprecip_accum_one_hour%2Cweather_cond_code&units=temp%7Cf%2Cspeed%7Cmph%2Cprecip%7Cin&obtimezone=local&showemptystations=0&status=active&networkimportance=2,1&limit=2';
        } else {
            $url = 'https://api.synopticlabs.org/v2/stations/timeseries?token=' . $token . '&stid=' . $stn . '&start=' . $start . '&end=' . $end . '&timeformat=%m/%d/%Y%20%H:%M&vars=air_temp%2Cdew_point_temperature%2Cwind_speed%2Cwind_gust%2Cwind_direction%2Crelative_humidity%2Csnow_depth%2Cpressure%2Cprecip_accum_one_hour%2Cweather_cond_code&units=temp%7Cf%2Cspeed%7Cmph%2Cprecip%7Cin&obtimezone=local&showemptystations=0&status=active&networkimportance=2,1';
        }
    }

    $json = file_get_contents($url);
    return json_decode($json);
    ////return $url;

    /* sample data for snow totals with outliers
        https://api.synopticlabs.org/v2/stations/timeseries?token=44f4f6fef5d3468894bf07594e8862c0&stid=ANRO3&start=202411142154&end=202411172154&timeformat=%m/%d/%Y%20%H:%M&vars=air_temp%2Cwind_speed%2Cwind_gust%2Cwind_direction%2Crelative_humidity%2Csnow_depth%2Cpressure%2Cprecip_accum_one_hour%2Cweather_cond_code&units=temp%7Cf%2Cspeed%7Cmph%2Cprecip%7Cin&obtimezone=local&showemptystations=0&status=active&networkimportance=2,1
    */
}

function doData($wx)
{
    global $function;
    global $unit;

    date_default_timezone_set($wx->TIMEZONE);

    // set station variables
    $vars = [];
    $name = formatName($wx->NAME);
    $elev = floatval($wx->ELEVATION);
    $lat = floatval($wx->LATITUDE);
    $lon = floatval($wx->LONGITUDE);
    $obs = $wx->OBSERVATIONS;
    $latest = $obs->{'date_time'} ? count($obs->{'date_time'}) - 1 : 0;
    $updated = $_REQUEST['latest'] == 1 ? strtotime($obs->{'air_temp_value_1'}->{'date_time'} . ' ' . date('T')) : strtotime($obs->{'date_time'}[$latest] . ' ' . date('T'));

    if ($function == 'history') {
        for ($i = $latest; $i >= 0; $i--) {
            $tmparr = [];
            $temp = $obs->{'air_temp_set_1'}[$i];
            $dp = $obs->{'dew_point_temperature_set_1d'}[$i];
            $rh = $obs->{'relative_humidity_set_1'}[$i];
            $wdir = $obs->{'wind_direction_set_1'}[$i];
            $wspd = $obs->{'wind_speed_set_1'}[$i];
            $wgst = $obs->{'wind_gust_set_1'}[$i];

            $dir = $wdir == null ? 'V' : getCompassDirection($wdir);

            $tmparr['time'] = strtotime($obs->{'date_time'}[$i]);

            if ($temp !== null) {
                $tmparr['temp'] = $unit != 'f' ? FtoC($temp) : $temp;
            }

            if ($dp !== null) {
                $tmparr['dewpoint'] = $unit != 'f' ? FtoC($dp) : $dp;
            }

            if ($rh !== null) {
                $tmparr['rh'] = $rh;
            }

            if ($wspd !== null) {
                $tmparr['wind_dir'] = strlen($dir) > 3 ? substr($dir, 0, 1) : $dir;
                $tmparr['raw_wind_dir'] = $wdir == null ? -99999 : $wdir;
                $tmparr['wind_speed'] = round($wspd, 1);
                $tmparr['wind_gust'] = round($wgst, 1);
            }

            if ($obs->{'snow_depth_set_1'} && count($obs->{'snow_depth_set_1'}) > 0) {
                $tmparr['hs'] = $obs->{'snow_depth_set_1'}[$i];
            }

            $vars[] = $tmparr;
        }
    } else {
        // get basic, current weather variables
        if ($_REQUEST['latest'] == 1) {
            $temp = $obs->{'air_temp_value_1'}->value;
            $dp = $obs->{'dew_point_temperature_set_1d'}->value;
            $rh = $obs->{'relative_humidity_value_1'}->value;
            $wdir = $obs->{'wind_direction_value_1'}->value;
            $wspd = $obs->{'wind_speed_value_1'}->value;
            $wgst = $obs->{'wind_gust_value_1'}->value;
            $pres = $obs->{'pressure_value_1d'}->value;
            $code = $obs->{'weather_cond_code_value_1'}->value && (time() - strtotime($obs->{'weather_cond_code_value_1'}->date_time) < 7200) ? getWeather($obs->{'weather_cond_code_value_1'}->value) : null;
            $precip = $obs->{'precip_accum_one_hour_value_1'}->value;
            $sndv = $obs->{'snow_depth_value_1'}->value;
        } else {
            $temp = $obs->{'air_temp_set_1'}[$latest];
            $dp = $obs->{'dew_point_temperature_set_1d'}[$latest];
            $rh = $obs->{'relative_humidity_set_1'}[$latest];
            $wdir = $obs->{'wind_direction_set_1'}[$latest];
            $wspd = $obs->{'wind_speed_set_1'}[$latest];
            $wgst = $obs->{'wind_gust_set_1'}[$latest];
            $pres = $obs->{'pressure_set_1d'}[$latest];
            $code = $obs->{'weather_cond_code_value_1'}[$latest] && (time() - strtotime($obs->date_time[$latest]) < 7200) ? getWeather($obs->{'weather_cond_code_value_1'}[$latest]) : null;
            $precip = $obs->{'precip_accum_one_hour_set_1'}[$latest];
        }

        if ($temp == null/* || $temp == 0*/) {
            $vars['temp']['current'] = null;
        } else {
            $elap = 0;
            $vars['temp']['current'] = round($unit != 'f' ? FtoC($temp) : $temp, 1);

            // figure out min/max 24 hour temperatures
            for ($i = $latest; $i >= 0; $i--) {
                $diff = strtotime($obs->{'date_time'}[$latest]) - strtotime($obs->{'date_time'}[$i]);

                // define array with temperatures for the last 24 hrs
                if ($diff <= 86400 && $obs->{'air_temp_set_1'}[$i] != null) {
                    $arr[] = $obs->{'air_temp_set_1'}[$i];
                    $bfc[] = [strtotime($obs->{'date_time'}[$i]), $obs->{'air_temp_set_1'}[$i]];
                }

                // define array with temperatures for the last 3 hrs
                if ($diff <= 10800 && $obs->{'air_temp_set_1'}[$i] != null) {
                    $l3ht[] = $obs->{'air_temp_set_1'}[$i];
                }
            }

            if ($bfc) {
                for ($i = 0; $i < count($bfc); $i++) {
                    $x = $i + 1;

                    if ($bfc[$i][1] <= 32 && $i > 0 && $i < count($bfc) - 1) {
                        $elap += ($bfc[$i][0] - $bfc[$x][0]);
                    }
                }
            }

            if ($_REQUEST['latest'] != 1) {
                if ($arr) {
                    $vars['temp']['24h_max'] = $unit != 'f' ? FtoC(max($arr)) : max($arr);
                    $vars['temp']['24h_min'] = $unit != 'f' ? FtoC(min($arr)) : min($arr);
                }

                if ($_REQUEST['flags'] == 1) {
                    $vars['temp']['aob_frzg'] = [$elap, ($bfc[0][0] - $bfc[(count($bfc) - 1)][0])];
                    $vars['temp']['rise_3'] = $l3ht[0] - $l3ht[(count($l3ht) - 1)];
                }
            }
        }

        if ($dp != null) {
            $vars['dewpoint'] = round($unit != 'f' ? FtoC($dp) : $dp, 1);
        }

        if ($rh != null) {
            $vars['rh'] = round($rh, 1);
        }

        if ($wspd != null) {
            $dir = $wdir == null ? 'V' : getCompassDirection($wdir);
            $vars['wind_dir'] = (strlen($dir) > 3 ? substr($dir, 0, 1) : $dir);
            $vars['raw_wind_dir'] = ($wdir == null ? 0 : $wdir);
            $vars['wind_speed'] = round($wspd, 1);

            if ($temp <= 40 && $wspd > 0) {
                $v = windChill($temp, $wspd);
                $vars['wind_chill'] = $unit != 'f' ? FtoC($v) : $v;
            }

            if ($temp >= 80 && $rh > 0) {
                $v = heatIndex($temp, $rh);
                $vars['heat_index'] = $unit != 'f' ? FtoC($v) : $v;
            }
        }

        if ($wgst != null) {
            $vars['wind_gust'] = $wgst;
        }

        if ($precip && $precip != '0.001') {
            $vars['precip'] = round($precip * 0.0393700787, 2);
        }

        if ($pres) {
            $vars['pressure'] = round($pres / 3386, 2);
        }

        if ($obs->{'weather_cond_code_value_1'} && $code != null) {
            $vars['weather'] = $code;
        }

        // deal with snow depth on SNOTELS
        if ($sndv) {
            $vars['snow'] = array('hs' => $sndv);
        } else {
            if ($obs->{'snow_depth_set_1'}) {
                if (count($obs->{'snow_depth_set_1'}) > 0) {
                    $vars['snow'] = calculateSnowTotals($obs->{'snow_depth_set_1'}, $obs->{'date_time'});
                }
            }
        }
    }

    $returnJson = array('weather' => array('id' => $wx->STID, 'name' => $name, 'MNET' => $wx->MNET_ID, 'elevation' => $elev, 'lat' => $lat, 'lon' => $lon, 'unit' => $unit, 'obs' => $vars, 'updated' => $updated));

    if ($function == 'history') {
        $start = $returnJson['weather']['obs'][0]['time'];
        $end = $returnJson['weather']['obs'][count($returnJson['weather']['obs']) - 1]['time'];

        $returnJson['weather']['starttime'] = $start;
        $returnJson['weather']['endtime'] = $end;
    }

    return $returnJson;
}

$useCache = true;
$stn = $method;
$thest = $stn == 'nearby' ? $_REQUEST['radius'] : $stn;
$time = time();
$unit = $_REQUEST['unit'] ? $_REQUEST['unit'] : 'f';
$start = date('YmdHi', ($time - (60 * 60 * ($_REQUEST['hrs'] ? ($_REQUEST['hrs'] > 168 ? 72 : $_REQUEST['hrs']) : 72)) - date('Z')));
$end = date('YmdHi', ($time - date('Z')));

if ($method == 'nearby' && !isset($_REQUEST['radius'])) {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'No station or radius provided');
} else if ($method == 'snotels') {
    $json = get_data('https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations?activeOnly=true&elements=SNWD%2CTOBS&returnForecastPointMetadata=false&returnReservoirMetadata=false&returnStationElements=false&stationTriplets=' . urlencode('*:OR:SNTL,*:OR:SNTLT,*:ID:SNTL,*:ID:SNTLT,*:UT:SNTL,*:UT:SNTLT,*:CA:SNTL,*:CA:SNTLT'));

    foreach ($json as $s) {
        $feat[] = array(
            'type' => 'Feature',
            'geometry' => array('type' => 'Point', 'coordinates' => [$s['longitude'], $s['latitude']]),
            'properties' => array('id' => $s['stationId'], 'code' => $s['shefId'], 'type' => ($s['networkCode'] == 'SNTL' ? 'SNOTEL' : ($s['networkCode'] == 'SNTLT' ? 'SNOLITE' : 'Other')), 'name' => $s['name'], 'state' => $s['stateCode'], 'county' => $s['countyName'], 'elevation' => $s['elevation'])
        );
    }

    $returnJson = array('type' => 'FeatureCollection', 'features' => $feat);
} else if ($method == 'snolite') {
    $stnID = $_GET['function'];

    $cachefilename = $stnID . '_' . $unit;
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $cache = $memcache->get($cachefilename);

    if (!$cache || (filemtime(root().'weather.ini.php') > $memcache->get($cachefilename . '-time'))) {
        $start = date('Y-m-d\%20H:i', strtotime('-2 days'));
        $end = date('Y-m-d\%20H:i');
        $meta = get_data('https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations?stationTriplets=' . $stnID . '&returnForecastPointMetadata=false&returnReservoirMetadata=false&returnStationElements=false&activeOnly=true');
        $json = get_data('https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/data?stationTriplets=' . $stnID . '&elements=TOBS,SNWD&duration=HOURLY&beginDate=' . $start . '&endDate=' . $end . '&periodRef=END&centralTendencyType=NONE&returnFlags=false&returnOriginalValues=false&returnSuspectData=true');

        $id = $meta[0]['stationId'];
        $name = $meta[0]['name'];
        $mnet = $meta[0]['networkCode'];
        $lat = $meta[0]['latitude'];
        $lon = $meta[0]['longitude'];
        $elevation = $meta[0]['elevation'];

        foreach ($json[0]['data'] as $element) {
            if ($element['stationElement']['elementCode'] == 'SNWD') {
                foreach ($element['values'] as $item) {
                    $dt[] = strtotime($item['date']);
                    $snow[] = $item['value'];
                }
            } else if ($element['stationElement']['elementCode'] == 'TOBS') {
                foreach ($element['values'] as $item) {
                    if (time() - strtotime($item['date']) <= 86400) {
                        $tempArr[] = $item['value'];
                    }

                    $temp[] = $item['value'];
                }
            }
        }

        $dt = array_reverse($dt);
        $snow = array_reverse($snow);
        $temp = array_reverse($temp);
        $latest = 0;
        $updated = $dt[$latest];

        $returnJson = array('weather' => array(
            'id' => $id,
            'name' => $name,
            'MNET' => $mnet,
            'elevation' => $elevation,
            'lat' => $lat,
            'lon' => $lon,
            'unit' => $unit,
            'obs' => array('temp' => array('current' => $temp[$latest]), 'snow' => calculateSnowTotals($snow, $dt)),
            'updated' => $updated
        ));

        if ($tempArr) {
            $returnJson['weather']['obs']['temp']['24h_max'] = max($tempArr);
            $returnJson['weather']['obs']['temp']['24h_min'] = min($tempArr);
        }

        $memcache->set($cachefilename, json_encode($returnJson), 900);
        $memcache->set($cachefilename . '-time', time(), 900);
    } else {
        $isCached = true;
        $cache = json_decode($cache);
        $returnJson = $cache;
    }
} else {
    $cachefilename = $thest . '_' . $unit . ($function == 'history' ? '_history' : '');
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $cache = $memcache->get($cachefilename);

    if ($useCache == false || !$cache || filemtime(root() . 'weather.ini.php') > $memcache->get($cachefilename . '-time')) {
        //preg_match('/(([A-Z0-9]+):([A-Z0-9]{2}):([A-Z0-9]+))/', $stn, $matches);
        $parse = getWX($stn, $start, $end);

        // error from synoptic
        if (is_numeric($parse->status) || $parse->SUMMARY->{'NUMBER_OF_OBJECTS'} == 0) {
            $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'No stations found for this request');
        } else {
            // loop through stations until one is found that is less than 3 hours old
            for ($i = 0; $i < count($parse->STATION); $i++) {
                $returnJson = doData($parse->STATION[$i]);

                if (time() - $returnJson['weather']['updated'] < (60 * 60 * 3)) {
                    break;
                }
            }

            $memcache->set($cachefilename, json_encode($returnJson), 900);
            $memcache->set($cachefilename . '-time', time(), 900);
        }
    } else {
        $isCached = true;
        $cache = json_decode($cache);
        $returnJson = $cache;
    }
}
