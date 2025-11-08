<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

$metadata = [];

function getStations() {
    global $metadata;
    $rwisfile = './cache/stations.json';

    /*if (time() - filemtime($rwisfile) > (60 * 60 * 24 * 15.20833)) {
        $url = "https://api.odot.state.or.us/tripcheck/v2/Rwis/Inventory";
        $curl = curl_init();

        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");

        curl_setopt($curl, CURLOPT_HTTPHEADER, ['Cache-Control: no-cache', 'Ocp-Apim-Subscription-Key: 35452c0361314863b66308a86b394fa1']);

        $result = curl_exec($curl);
        curl_close($curl);

        file_put_contents($rwisfile, $result);

        $resp = json_decode($result);
    } else {*/
        $resp = json_decode(file_get_contents($rwisfile));
    //}

    foreach ($resp->{'ess-site-list'} as $l) {
        $id = $l->{'station-id'};
        $name = preg_replace('/RWIS\s{1,}/', '', preg_replace('/\s{2,}/', ' ', $l->{'station-name'}));
        $hwy = str_replace('OR', 'ORE', $l->{'route-id'});
        $mp = $l->{'milepoint'};
        $lat = $l->{'latitude'};
        $lon = $l->{'longitude'};

        $metadata[$id] = array('id' => $id, 'name' => $name, 'hwy' => $hwy, 'mp' => $mp, 'lat' => $lat, 'lon' => $lon);
    }

    return true;
}

function getRWIS() {
    $stns = '';
    $url = "https://api.odot.state.or.us/tripcheck/v2/Rwis/Status";
    $curl = curl_init($url);

    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "GET");

    curl_setopt($curl, CURLOPT_HTTPHEADER, ['Cache-Control: no-cache', 'Ocp-Apim-Subscription-Key: 3b5cbb65989f45948a09e8e0a3ed1c4d']);

    $resp = json_decode(curl_exec($curl));
    curl_close($curl);

    return $resp->WeatherStations;
}

function CtoF($t) {
    return round(($t / 10) * (9 / 5) + 32, 2);
}

function MtoMPH($s) {
    return round(($s / 10) * 2.237, 2);
}

function getCompassDirection($bearing) {
    $tmp = round($bearing / 22.5);
    switch ($tmp) {
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
            $direction = "East";
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
            $direction = "South";
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
            $direction = "West";
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
            $direction = "North";
    }
    return $direction;
}

function relativeHumidity($tempF, $dewF) {
    if ($tempF == 1001 || $dewF == 1001 || empty($tempF) || empty($dewF)) {
        return null;
    }

    $tempC = ($tempF - 32) * (5 / 9);
    $dewC = ($dewF - 32) * (5 / 9);
    
    $e0 = 6.112;
    $c1 = 17.625;
    $c2 = 243.04;

    $es = $e0 * exp(($c1 * $tempC) / ($c2 + $tempC));
    $e = $e0 * exp(($c1 * $dewC)/ ($c2 + $dewC));

    $rh = 100 * ($e / $es);
    return max(0.0, min(100.0, $rh));
}

/*function record($time, $stn, $data) {
    global $con;
    $data = serialize($data);
    $name = $stn['name'];
    $hwy = $stn['hwy'];
    $mp = $stn['mp'];
    $uqid = $stn['id'].'-'.$time;
    
    mysqli_query($con, "INSERT IGNORE INTO rwis (uqid,stn,hwy,mp,data,time) VALUES('$uqid','$name', '$hwy', '$mp', '$data', '$time')");
}*/

/*"station-id": "12RW013",
        "RoadWeather": {
            "air-temperature": 227,
            "atmospheric-pressure": 0,
            "avg-wind-direction": 293,
            "avg-wind-gust-direction": 0,
            "avg-wind-gust-speed": 26,
            "avg-wind-speed": 10,
            "dewpoint-temp": 47,
            "last-update-time": "2023-06-08T01:23:54.153Z",
            "relative-humidity": 31,
            "visibility": 20000
        },
        "SurfaceCondition": {
            "mobile-friction": 78,
            "surface-freeze-point": 1001,
            "surface-salinity": 65535,
            "surface-temperatures": [{
                "sensor-id": 0,
                "surface-temperature": 270
            }, {
                "sensor-id": 1,
                "surface-temperature": 276
            }],
            "water-depth": 65535
        }*/
getStations();

foreach (getRWIS() as $stn) {
    #if ($stn->{'station-id'} == '14RW011') {
        $temp = empty($stn->RoadWeather->{'air-temperature'}) || $stn->RoadWeather->{'air-temperature'} == 1001 ? null : CtoF($stn->RoadWeather->{'air-temperature'});
        $dp = empty($stn->RoadWeather->{'dewpoint-temp'}) || $stn->RoadWeather->{'dewpoint-temp'} == 1001 ? null : CtoF($stn->RoadWeather->{'dewpoint-temp'});
        $rh = relativeHumidity(CtoF($stn->RoadWeather->{'air-temperature'}), CtoF($stn->RoadWeather->{'dewpoint-temp'}));
        $wd = $stn->RoadWeather->{'avg-wind-direction'} == 361 || !$stn->RoadWeather->{'avg-wind-direction'} ? null : getCompassDirection($stn->RoadWeather->{'avg-wind-direction'});
        $raw = $stn->RoadWeather->{'avg-wind-direction'} == 361 ? null : $stn->RoadWeather->{'avg-wind-direction'};
        $ws = $stn->RoadWeather->{'avg-wind-speed'} == 65535 ? null : MtoMPH($stn->RoadWeather->{'avg-wind-speed'});
        $gust = $stn->RoadWeather->{'avg-wind-gust-speed'} == 65535 ? null : MtoMPH($stn->RoadWeather->{'avg-wind-gust-speed'});
        $vis = empty($stn->RoadWeather->visibility) || $stn->RoadWeather->visibility == 1000001 ? null : $stn->RoadWeather->visibility / 1609 / 10;
        $rate = empty($stn->RoadWeather->{'precip-rate'}) || $stn->RoadWeather->{'precip-rate'} == 65535 ? null : $stn->RoadWeather->{'precip-rate'};
        $ptype = empty($stn->RoadWeather->{'precip-situation'}) || $stn->RoadWeather->{'precip-situation'} == 'unknown' ? null : $stn->RoadWeather->{'precip-situation'};

        $grip = (empty($stn->SurfaceCondition->{'mobile-friction'}) || $stn->SurfaceCondition->{'mobile-friction'} == 101 ? null : $stn->SurfaceCondition->{'mobile-friction'} / 100);
        //$sfcFrz = (empty($stn->SurfaceCondition->{'surface-freeze-point'}) || $stn->SurfaceCondition->{'surface-freeze-point'} == 1001 ? null : CtoF($stn->SurfaceCondition->{'surface-freeze-point'}));
        //$salinity = (empty($stn->SurfaceCondition->{'surface-salinity'}) || $stn->SurfaceCondition->{'surface-salinity'} == 65535 ? null : $stn->SurfaceCondition->{'surface-salinity'});
        $sfcTemp1 = (empty($stn->SurfaceCondition->{'surface-temperatures'}[0]) || $stn->SurfaceCondition->{'surface-temperatures'}[0] == 1001 ? false : CtoF($stn->SurfaceCondition->{'surface-temperatures'}[0]->{'surface-temperature'}));
        $sfcTemp2 = (empty($stn->SurfaceCondition->{'surface-temperatures'}[1]) || $stn->SurfaceCondition->{'surface-temperatures'}[1] == 1001 ? false : CtoF($stn->SurfaceCondition->{'surface-temperatures'}[1]->{'surface-temperature'}));
        $pavement = [];

        if ($sfcTemp1) {
            $pavement[] = $sfcTemp1;
        }

        if ($sfcTemp2) {
            $pavement[] = $sfcTemp2;
        }

        $updated = strtotime($stn->RoadWeather->{'last-update-time'});

        if ($updated > 0 && $temp != null) {
            $theStation = $metadata[$stn->{'station-id'}];
            $coords = [$theStation['lon'], $theStation['lat']];
            unset($theStation['lat']);
            unset($theStation['lon']);

            $theWind = $raw == null && $wd == 0 || $ws == null ? null : array('dir' => $wd, 'rawdir' => $raw, 'speed' => $ws, 'gust' => $gust);
            $weather = array('temp' => $temp, 'td' => $dp, 'rh' => $rh, 'prcprate' => $rate, 'ptype' => $ptype, 'visibility' => $vis, 'wind' => $theWind);
            $surface = array('grip' => $grip/*, 'sfcFrz' => $sfcFrz, 'salinity' => $salinity*/, 'pavement' => count($pavement) == 0 ? null : $pavement);
            $data[] = array('type' => 'Feature', 'geometry' => array('type' => 'Point', 'coordinates' => $coords),
            'properties' => ['id' => $stn->{'station-id'}, 'station' => $theStation, 'weather' => $weather, 'surface' => $surface, 'updated' => $updated]);
    
            if ($grip != null) {
                $array = $surface;
                $array['temp'] = $temp;
                $array['dp'] = $dp;
                //record($updated, $metadata[$stn->{'station-id'}], $array);
            }
        }
    #}
}

#print_r($data);
#echo json_encode($data, JSON_PRETTY_PRINT);
file_put_contents('./cache/rwis.json', json_encode(array('type' => 'FeatureCollection', 'features' => $data)));