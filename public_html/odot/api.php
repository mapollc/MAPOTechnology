<?
header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');

// declare global variables
$method = $_REQUEST['method'];

function odotAPI($url) {
    $curl = curl_init($url);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

    $headers = array('Cache-Control: no-cache', 'Ocp-Apim-Subscription-Key: 3b5cbb65989f45948a09e8e0a3ed1c4d');
    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);

    $resp = curl_exec($curl);
    curl_close($curl);

    return json_decode($resp);
}

function getCompassDirection($bearing){
    $tmp = round($bearing / 22.5);
    switch($tmp) {
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
            $direction = "E";
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
            $direction = "S";
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
            $direction = "W";
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
            $direction = "N";
    }
    
    return $direction;
}

function CtoF($t, $d) {
    return round(($t / $d) * (9/5) + 32, 1);
}

function getRWIS($stns) {
    foreach ($stns as $stn) {
        $json = odotAPI('https://api.odot.state.or.us/tripcheck/v2/Rwis/Status?StationId='.$stn);
        $wx = $json->WeatherStations[0]->RoadWeather;
        $sfc = $json->WeatherStations[0]->SurfaceCondition;
        $temp = round(CtoF($wx->{'air-temperature'}, 10), 1);
        $dp = round(CtoF($wx->{'dewpoint-temp'}, 10), 1);
        $rh = $wx->{'relative-humidity'};
        $winddir = getCompassDirection($wx->{'avg-wind-direction'});
        $windspd = $wx->{'avg-wind-speed'};
        $gust = $wx->{'avg-wind-gust-speed'};
        $ptype = $wx->{'precip-type'};
        $pintense = $wx->{'precip-intensity'};
        $prate = $wx->{'precip-rate'};
        $updated = strtotime($wx->{'last-update-time'});
    
        $data[$stn] = array('temp' => $temp, 'dewpoint' => $dp);

        // wind data
        if ($winddir !=0 && $windspd != 0) {
            $data[$stn]['wind'] = array('dir' => $winddir, 'speed' => $windspd, 'gust' => $gust);
        }

        // if we have road surface sensors
        if (!empty($sfc->{'surface-temperatures'})) {
            foreach ($sfc->{'surface-temperatures'} as $st) {
                $sfctemps[] = CtoF($st->{'surface-temperature'}, 10);
            }

            $data[$stn]['road'] = array('temps' => $sfctemps);

            // grip factor
            if ($sfc->{'mobile-friction'} != 101) {
                $data[$stn]['road']['grip'] = $sfc->{'mobile-friction'} / 100;
            }
        }

        $data[$stn]['updated'] = $updated;
    }

    #return $json;
    return $data;
}

// get rwis data from ODOT
if ($method == 'rwis') {
    // if we need to get multiple stations or just 1
    if (strpos($_REQUEST['stn'], ';')) {
        $e = explode(';', $_REQUEST['stn']);
        $stn = $e;
    } else {
        $stn[] = $_REQUEST['stn'];
    }

    $response = getRWIS($stn);
} else if ($method == 'cameras') {
    $json = json_decode(file_get_contents('./cameras.json'));

    foreach ($json->CCTVInventoryRequest as $cam) {
        $response[] = array('id' => $cam->{'device-id'}, 'hwy' => str_replace(['OR','US','I'], ['ORE','US-','I-'], $cam->{'route-id'}), 'mp' => $cam->milepoint,
                            'name' => $cam->{'device-name'}, 'lat' => $cam->latitude, 'lon' => $cam->longitude, 'url' => $cam->{'cctv-url'}, 'updated' => strtotime($cam->{'last-update-time'}));
    }
} else if ($method == 'vms') {
    $types = ['VMS' => 'Variable Message Sign',
    'CWS' => 'Curve Warning Sign',
    'VAS' => 'Variable Advisory Speed Sign',
    'SZDS' => 'Snow Zone Drum Sign',
    'DSMAR' => 'Drum Sign Miles Ahead Rider',
    'TT' => 'Travel Time', 
    'VSL' => 'Variable Speed Limit',
    'HWS' => 'Hazard Warning Sign'];

    $meta = json_decode(file_get_contents('vms.json'))->{'dms-inventory-items'};
    $json = odotAPI('https://api.odot.state.or.us/tripcheck/Dms/Status')->dmsItems;
    #$json = json_decode(file_get_contents('test.json'))->dmsItems;

    foreach ($json as $v) {
        $lines = $msg = array();
        $index = array_search($v->{'device-id'}, array_column($meta, 'device-id'));
        preg_match('/([A-Z]+)\s(.*)/', $meta[$index]->{'device-name'}, $match);
        $name = str_replace($match[1].' ', '', $meta[$index]->{'device-name'});
        $type = array('code' => $match[1], 'name' => $types[$match[1]]);
        $lat = $meta[$index]->{'latitude'};
        $lon = $meta[$index]->{'longitude'};

        foreach ($v->dmsCurrentMessage as $k => $h) {
            if ($h != '' && $h != ',' && strpos($h, 'BLANK') === false && strpos($h, 'Blank') === false) {
                $lines[] = preg_replace('/(SPEED|LIMIT|TRUCKS)([0-9]+)/', '$1 $2', $h);
            }
        }

        for ($i = 0; $i < count($lines); $i++) {
            if ($i > 2) {
                $msg[1][] = $lines[$i];
            } else {
                $msg[0][] = $lines[$i];
            }
        }

        if (count($lines) > 0) {
            $response[] = array('id' => $v->{'device-id'}, 'name' => $name, 'type' => $type, 'lat' => $lat, 'lon' => $lon, 'hwy' => $meta[$index]->{'route-id'}, 'mp' => $meta[$index]->milepoint, 'message' => $msg);
        }
    }
}

// return json response to user
echo json_encode(array($method => $response), JSON_PRETTY_PRINT);
?>