<?
$e = explode('.', $_REQUEST['lon']);
$json = get_data('https://api.weather.gov/points/' . (float)substr($_REQUEST['lat'], 0, 7) . ',' . (float)($e[0] . '.' . substr($e[1], 0, 4)));
date_default_timezone_set($json['properties']['timeZone']);

$b = explode('/', $json['properties']['fireWeatherZone']);
$check = array($b[5]);

$c = get_data('https://api.weather.gov/alerts/active/zone/' . explode('/', $json['properties']['county'])[5]);
$county = preg_replace('/\s\([A-Z0-9]+\)/', ',', explode(' for ', $c['title'])[1]);
$oldevents = [];

for ($x = 0; $x < 2; $x++) {
    if ($x == 0) {
        $json = get_data('https://api.weather.gov/alerts/active/zone/' . $check[$x]);
    } else {
        $json = get_data('https://api.weather.gov/alerts/active?point=' . $_REQUEST['lat'] . ',' . $_REQUEST['lon']);
    }

    if ($json['features']) {
        for ($i = 0; $i < count($json['features']); $i++) {
            if (!in_array($json['features'][$i]['properties']['id'], $oldevents)) {
                $sent = $json['features'][$i]['properties']['sent'];
                $end = ($json['features'][$i]['properties']['ends'] ? $json['features'][$i]['properties']['ends'] : $json['features'][$i]['properties']['expires']);
                $wfo = substr($json['features'][$i]['properties']['senderName'], 0, -3) . ',' . substr($json['features'][$i]['properties']['senderName'], -3);

                if ($_REQUEST['app'] == 1) {
                    $alerts[] = array('id' => $json['features'][$i]['properties']['id'], 'event' => $json['features'][$i]['properties']['event'], 'issued' => ago(strtotime($sent), null), 'expires' => date('g:i A T l', strtotime($end)), 'wfo' => $wfo);
                } else {
                    $alerts[] = array('id' => $json['features'][$i]['properties']['id'], 'event' => $json['features'][$i]['properties']['event'], 'headline' => $json['features'][$i]['properties']['headline'], 'area' => $json['features'][$i]['properties']['areaDesc'], 'expires' => date('g:i A T l', strtotime($end)));
                }

                $oldevents[] = $json['features'][$i]['properties']['id'];
            }
        }
    }
}

sort($alerts);

$returnJson = array('alerts' => $alerts, 'county' => $county);