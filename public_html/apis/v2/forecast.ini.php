<?
$directions = [
    'N' => 'North',
    'NNE' => 'North-Northeast',
    'NE' => 'Northeast',
    'ENE' => 'East-Northeast',
    'E' => 'East',
    'ESE' => 'East-Southeast',
    'SE' => 'Southeast',
    'SSE' => 'South-Southeast',
    'S' => 'South',
    'SSW' => 'South-Southwest',
    'SW' => 'Southwest',
    'WSW' => 'West-Southwest',
    'W' => 'West',
    'WNW' => 'West-Northwest',
    'NW' => 'Northwest',
    'NNW' => 'North-Northwest',
];

function offset($tz)
{
    if ($tz == 'America/Los_Angeles') {
        $of = date('I') == 0 ? 8 : 7;
    } else if ($tz == 'America/Boise' || $tz == 'America/Denver') {
        $of = date('I') == 0 ? 7 : 6;
    } else if ($tz == 'America/Chicago') {
        $of = date('I') == 0 ? 6 : 5;
    } else if ($tz == 'America/New_York') {
        $of = date('I') == 0 ? 5 : 4;
    }
    return $of * 3600;
}

function findFirstAndLastZero($array)
{
    $first = -1;
    $last = -1;

    for ($i = 0; $i < count($array); $i++) {
        if ($array[$i] != 0) {
            if ($first == -1) {
                $first = $i;
            }
            $last = $i;
        }
    }

    return array($first, $last);
}

/*function forecast($f) {
    $pop = $f->daily_chance_of_snow > $f->daily_chance_of_rain ? $f->daily_chance_of_snow : $f->daily_chance_of_rain;
    $snowfall = round($f->totalsnow_cm / 2.54, 1);
    $precip = $f->totalprecip_in;
    $accum = $snowfall > 0 ? ' Expect new snow accumulations of around '.$snowfall.' inch'.($snowfall !=1 ? 'es' : '').'.' : ($precip > 0 ? ' Total precipitation around '.round($precip, 2).' inch'.($precip !=1 ? 'es' : '').'.' : '');
    
    return rtrim(ucfirst(strtolower($f->condition->text))).' with a high around '.ceil($f->maxtemp_f).'&deg;F and a nighttime low near '.floor($f->mintemp_f).'&deg;F.'.($pop > 0 ? ' Chance of precipition '.$pop.'%.' : '').$accum;
}*/

function calculate_precipitation_likelihood($precip_array, $precip_array2)
{
    $total_hours = count($precip_array);
    $total_hours2 = count($precip_array2);
    $hours_with_precipitation = array_filter($precip_array, fn($chance) => $chance > 0);
    $hours_with_precipitation2 = array_filter($precip_array2, fn($chance2) => $chance2 > 0);
    $percentage = (count($hours_with_precipitation) / $total_hours) * 100;
    $percentage2 = (count($hours_with_precipitation2) / $total_hours2) * 100;

    return $percentage + $percentage2 > 100 ? 100 : round($percentage + $percentage2);
}

function precip_type($cond) {
    $types = [];

    foreach ($cond as $k => $v) {
        $s = strtolower($k);

        if (strpos($s, 'snow') !== false) {
            $types[] = 'Snow';
        }

        if (strpos($s, 'rain') !== false) {
            $types[] = 'Rain';
        }

        if (strpos($s, 'freezing drizzle') !== false || strpos($s, 'freezing rain') !== false) {
            $types[] = 'Freezing rain';
        }
    }

    $types = array_values(array_unique($types));
    $count = count($types);

    if ($count == 0) {
        return 'None'; 
    } elseif ($count == 1) {
        return $types[0];
    } elseif ($count == 2) {
        return ucfirst(strtolower(implode(' and ', $types)));
    } else {
        $last = array_pop($types); 
        return ucfirst(strtolower(implode(', ', $types) . ', and ' . $last));
    }
}

function sky($cond) {
    $sunny = $cond['Sunny'] != null ? true : false;
    $clear = $cond['Clear'] != null ? true : false;
    $pc = $cond['Partly Cloudy'] != null ? true : false;
    $ovc = $cond['Overcast'] != null ? true : false;
    $cloudy = false;
    
    foreach ($cond as $k => $v) {
        $s = strtolower($k);
        
        if (strpos($s, 'rain') !== false || strpos($s, 'snow') !== false) {
            $cloudy = true;
        }
    }

    return $ovc ? 'Overcast' : ($cloudy ? 'Mostly Cloudy' : ($pc ? 'Partly Cloudy' : ($clear ? 'Clear' : ($sunny ? 'Sunny' : 'Unknown'))));
}

function conditions($cond) {
    arsort($cond);

    foreach ($cond as $k => $v) {
        $wx[] = $k;
        $count[] = $v;
    }

    if ($count[0] == $count[1] || $count[1] - $count[0] < 2) {
        return ucfirst(strtolower($wx[0].' and '.$wx[1]));
    } else {
        return $wx[0];
    }
}

function text($daytime, $arr) {
    $chill = $arr['temp'] - $arr['wind_chill'] > 10 && $arr['wind_chill'] < 20 ? ' and a wind chill down to '.round($arr['wind_chill']) : '';
    $heat = $arr['heat_index'] - $arr['temp'] > 5 && $arr['heat_index'] > 80 ? ', with temperatures feeling like '.round($arr['heat_index']) : '';

    $text = $arr['weather']['cond'].' with a ';
    $text .= ($daytime ? 'high near '.$arr['temp'] : 'low around '.$arr['temp']).$heat.$chill.'. ';

    $text .= ($arr['wind']['speed'] == 'Light' ? 'Light winds' : 'Winds '.strtolower($arr['wind']['dir']).' around '.$arr['wind']['speed'].' mph').'. ';
    
    $text .= $arr['precip']['pop'] > 0 ? 'Chance of '.($arr['precip']['type'] != 'None' ? strtolower($arr['precip']['type']) : '').' around '.$arr['precip']['pop'].'%.' : '';

    if ($arr['precip']['accum']['precip'] == 0 && $arr['precip']['accum']['snow'] > 0) {
        $text .= ' Expect around '.$arr['precip']['accum']['snow'].' inches of new snow.';
    } else if ($arr['precip']['accum']['snow'] == 0 && strpos(strtolower($arr['precip']['type']), 'snow') !== false) {
        $text .= ' Little to no new snow accumulation expected.';
    }

    return $text;
}

function doDaily($day)
{
    global $directions;

    for ($i = 0; $i < count($day->hour); $i++) {
        $icon[$day->hour[$i]->is_day][] = str_replace('//cdn.weatherapi.com/weather/64x64/', '', $day->hour[$i]->condition->icon);
        $conds[$day->hour[$i]->is_day][] = rtrim($day->hour[$i]->condition->text);
        $wspd[$day->hour[$i]->is_day][] = $day->hour[$i]->wind_mph;
        $wdir[$day->hour[$i]->is_day][] = $day->hour[$i]->wind_dir;
        $chanceSnow[$day->hour[$i]->is_day][] = $day->hour[$i]->chance_of_snow;
        $chanceRain[$day->hour[$i]->is_day][] = $day->hour[$i]->chance_of_rain;
        $precipAccum[$day->hour[$i]->is_day][] = $day->hour[$i]->precip_in;
        $snowAccum[$day->hour[$i]->is_day][] = $day->hour[$i]->snow_cm / 2.54;
        $chill[$day->hour[$i]->is_day][] = $day->hour[$i]->windchill_f;
        $heat[$day->hour[$i]->is_day][] = $day->hour[$i]->heatindex_f;
    }

    $cond = array_count_values($conds[0]);
    $cond2 = array_count_values($conds[1]);
    $icon[0] = array_count_values($icon[0]);
    $icon[1] = array_count_values($icon[1]);

    arsort($icon[0]);
    arsort($icon[1]);

    if (precip_type($cond) == 'Rain and snow') {
        $accum = ['precip' => array_sum($precipAccum[0]), 'snow' => array_sum($snowAccum[0])];
    } else if (strpos(strtolower(precip_type($cond)), 'snow') !== false) {
        $accum = ['precip' => 0.0, 'snow' => array_sum($snowAccum[0])];
    } else {
        $accum = ['precip' => array_sum($precipAccum[0]), 'snow' => 0.0];
    }

    if (precip_type($cond) == 'Rain and snow') {
        $accum2 = ['precip' => array_sum($precipAccum[1]), 'snow' => array_sum($snowAccum[1])];
    } else if (strpos(strtolower(precip_type($cond)), 'snow') !== false) {
        $accum2 = ['precip' => 0.0, 'snow' => array_sum($snowAccum[1])];
    } else {
        $accum2 = ['precip' => array_sum($precipAccum[1]), 'snow' => 0.0];
    }
    $accum['precip'] = round($accum['precip'], 1);
    $accum['snow'] = round($accum['snow'], 1);
    $accum2['precip'] = round($accum2['precip'], 1);
    $accum2['snow'] = round($accum2['snow'], 1);

    $precip = ['type' => precip_type($cond), 'pop' => calculate_precipitation_likelihood($chanceSnow[0], $chanceRain[0]), 'accum' => $accum];
    $precip2 = ['type' => precip_type($cond2), 'pop' => calculate_precipitation_likelihood($chanceSnow[1], $chanceRain[1]), 'accum' => $accum2];
    $wc = min($chill[0]);
    $wc2 = min($chill[1]);
    $hi = max($heat[0]);
    $hi2 = max($heat[1]);
    $minwind = round(min($wspd[0]));
    $maxwind = round(max($wspd[0]));
    $minwind2 = round(min($wspd[1]));
    $maxwind2 = round(max($wspd[1]));
    $dir = array_count_values($wdir[0]);
    $dir2 = array_count_values($wdir[1]);

    arsort($dir);
    arsort($dir2);
    $dir = $directions[key(array_slice($dir, 0, 1))];
    $dir2 = $directions[key(array_slice($dir2, 0, 1))];

    $wind = ['speed' => $maxwind <= 5 ? 'Light' : ($minwind == 0 ? $maxwind : $minwind . '-' . $maxwind), 'dir' => $dir];
    $wind2 = ['speed' => $maxwind2 <= 5 ? 'Light' : ($minwind2 == 0 ? $maxwind2 : $minwind2 . '-' . $maxwind2), 'dir' => $dir2];

    $fcstDay = array('temp' => ceil($day->day->maxtemp_f), 'wind_chill' => $wc, 'heat_index' => $hi, 'weather' => ['icon' => key($icon[0]), 'sky' => sky($cond), 'cond' => conditions($cond)], 'precip' => $precip, 'wind' => $wind, 'text' => null);
    $fcstNight = array('temp' => floor($day->day->mintemp_f), 'wind_chill' => $wc2, 'heat_index' => $hi2, 'weather' => ['icon' => key($icon[1]), 'sky' => sky($cond2), 'cond' => conditions($cond2)], 'precip' => $precip2, 'wind' => $wind2, 'text' => null);

    $fcstDay['text'] = text(true, $fcstDay);
    $fcstNight['text'] = text(false, $fcstNight);

    $fcst = array('date' => $day->date_epoch, 'day' => $fcstDay, 'night' => $fcstNight);

    return $fcst;
}

$cachefilename = 'forecast:'.$_GET['q'];
$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211); 
$cache = $memcache->get($cachefilename);

$accums = [];

if (!isset($_GET['q']) || empty($_GET['q'])) {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'A location for the forecast was not provided');
} else {
    if (!$cache || filemtime('forecast.ini.php') > $memcache->get($cachefilename . '-time')) {
        $wxForecast = file_get_contents('https://api.weatherapi.com/v1/forecast.json?q='.urlencode($_GET['q']).'&days=7&alerts=no&aqi=no&key=b931fd5bb1184908a7232832241212');
        #$wxForecast = file_get_contents('/home/mapo/public_html/apis/v2/weatherapi.json');

        $memcache->set($cachefilename, $wxForecast, 3600);
        $memcache->set($cachefilename.'-time', time(), 3600);
    } else {
        $wxForecast = $cache;
        $isCached = true;
    }

    $json = json_decode($wxForecast);

    if ($json->error) {
        $returnJson = array('response' => 'error', 'code' => 3, 'msg' => 'No location was found for this query');
    } else {
        $offset = offset($json->location->tz_id);
        date_default_timezone_set($json->location->tz_id);

        // only show weather forecast data for locations in the US
        if ($json->location->country != 'United States of America' && $json->location->country != 'USA') {
            $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'The location provided is invalid');
        } else {
            // get hourly forecast for today
            for ($x = 0; $x < count($json->forecast->forecastday); $x++) {
                for ($i = 0; $i < count($json->forecast->forecastday[$x]->hour); $i++) {
                    if ($x < 2) {
                        if ($json->forecast->forecastday[$x]->hour[$i]->{'time_epoch'} >= time() && $json->forecast->forecastday[$x]->hour[$i]->{'time_epoch'} <= strtotime('+24 hours')) {
                            $fields = $json->forecast->forecastday[$x]->hour[$i];
                            $wx = ['condition' => rtrim($fields->condition->text), 'icon' => str_replace('//cdn.weatherapi.com/weather/64x64/', '', $fields->condition->icon)];
                            $wind = ['speed' => $fields->wind_mph, 'gust' => $fields->gust_mph, 'direction' => $fields->wind_dir, 'rawdir' => $fields->wind_degree];
                            $precip = ['snow' => $fields->chance_of_snow, 'rain' => $fields->chance_of_rain, 'snowAccum' => $fields->snow_cm / 2.54, 'rainAccum' => $fields->precip_in];

                            $hourly[] = array('time' => $fields->time_epoch + $offset, 'daytime' => $fields->is_day == 1 ? true : false, 'temp' => $fields->temp_f, 'rh' => $fields->humidity, 'weather' => $wx, 'wind' => $wind, 'precip' => $precip);
                        }
                    }

                    $daily[$json->forecast->forecastday[$x]->date] = doDaily($json->forecast->forecastday[$x]);
                }
            }

            $returnJson = array('forecast' => array('location' => $json->location, 'daily' => array_values($daily), 'hourly' => $hourly));

            // get daily forecast
            /*for ($i = 0; $i < count($json->forecast->forecastday); $i++) {
                $fields = $json->forecast->forecastday[$i]->day;
                $wx = ['condition' => rtrim($fields->condition->text), 'icon' => str_replace('//cdn.weatherapi.com/weather/64x64/', '', $fields->condition->icon)];
                $snowfall = $fields->totalsnow_cm / 2.54;
                $precip = ['snow' => $fields->daily_chance_of_snow, 'rain' => $fields->daily_chance_of_rain, 'snowAccum' => $snowfall, 'rainAccum' => $fields->totalprecip_in];
                $astro = $json->forecast->forecastday[$i]->astro;
                unset($json->forecast->forecastday[$i]->astro->moon_illumination);
                unset($json->forecast->forecastday[$i]->astro->is_moon_up);
                unset($json->forecast->forecastday[$i]->astro->is_sun_up);
                
                $accums['time'][] = $json->forecast->forecastday[$i]->date_epoch + $offset;
                $accums['daily'][] = $snowfall;
                $accums['total'][] = array_sum($accums['daily']);
            
                $daily[] = array('time' => $json->forecast->forecastday[$i]->date_epoch + $offset, 'temp' => ['high' => $fields->maxtemp_f, 'avg' => $fields->avgtemp_f, 'low' => $fields->mintemp_f], 'text' => forecast($fields), 'weather' => $wx, 'wind' => $fields->maxwind_mph, 'precip' => $precip, 'astro' => $astro);
            }
            
            $totalSnow = round(array_sum($accums['daily']), 1);
            $periods = findFirstAndLastZero($accums['daily']);
            $accums['text'] = 'A total of '.$totalSnow.' inches of snow is expected between '.date('l, n/j', $accums['time'][$periods[0]]).' and '.date('l, n/j', $accums['time'][$periods[1]]);
            
            #$returnJson = array('forecast' => array('location' => $json->location, 'daily' => $daily, 'hourly' => $hourly));
            
            if ($method == 'winter') {
                $returnJson['forecast']['winter'] = $accums;
            }*/
        }
    }
}
