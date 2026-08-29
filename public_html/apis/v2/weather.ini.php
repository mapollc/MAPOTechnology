<?
function getData($stn) {
    return get_data("https://api.weather.gov/stations/$stn/observations/latest");
}

function updated($t) {
    preg_match('/([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})/', $t, $d);

    return strtotime("$d[2]/$d[3]/$d[1] $d[4]:$d[5] UTC");
}

function CtoF($t) {
    return ($t * (9 / 5)) + 32;
}

function format($var, $val) {
    global $_REQUEST;
    
    $unit = $_REQUEST['unit'] ?? 'f';

    if ($unit === 'f') {
        if ($var === 'temp') return CtoF($val);
    }

    return $val;
}

if (isset($method)) {
    $wx = getData($method);
    if (!$wx) return $returnJson = ['response' => 'error'];

    $geo = $wx['geometry'];
    $lat = $geo['coordinates'][1];
    $lon = $geo['coordinates'][0];

    $prop = $wx['properties'];

    $id = $prop['stationId'];
    $name = $prop['stationName'];
    $elev = round($wx['elevation'] * 3.281, 0);
    $updated = updated($prop['timestamp']);
    $obs = null;

    if ($prop['temperature']['value'] != null) $obs['temp']['current'] = format('temp', $prop['temperature']['value']);
    if ($prop['relativeHumidity']['value'] != null) $obs['rh'] = $prop['relativeHumidity']['value'];

    $returnJson = [
        'weather' => [
            'id' => $id,
            'name' => $name,
            'elevation' => $elev,
            'lat' => $lat,
            'lon' => $lon,
            'obs' => $obs,
            'updated' => $updated
        ]
    ];
}