<?
/*$e = explode('.', $_REQUEST['lon']);
$json = get_data('https://api.weather.gov/points/' . (float)substr($_REQUEST['lat'], 0, 7) . ',' . (float)($e[0] . '.' . substr($e[1], 0, 4)));
date_default_timezone_set($json['properties']['timeZone']);

$b = explode('/', $json['properties']['fireWeatherZone']);
$check = array($b[5]);

$c = get_data('https://api.weather.gov/alerts/active/zone/' . explode('/', $json['properties']['county'])[5]);
$county = preg_replace('/\s\([A-Z0-9]+\)/', ',', explode(' for ', $c['title'])[1]);*/
$oldevents = [];

/*for ($x = 0; $x < 2; $x++) {
    if ($x == 0) {
        $json = get_data('https://api.weather.gov/alerts/active/zone/' . $check[$x]);
    } else {*/
        $json = get_data('https://api.weather.gov/alerts/active?point=' . $_REQUEST['lat'] . ',' . $_REQUEST['lon']);
    //}

    if ($json['features']) {
        for ($i = 0; $i < count($json['features']); $i++) {
            $prop = $json['features'][$i]['properties'];

            if (!in_array($prop['id'], $oldevents)) {
                $from = strtotime($prop['effective']);
                $end = ($prop['ends'] ? $prop['ends'] : $prop['expires']);
                $wfo = substr($prop['senderName'], 0, -3) . ',' . substr($prop['senderName'], -3);
                
                preg_match('/\s((P|M|C|E|)(S|D)T)\s/', $prop['headline'], $match);
                if ($match[1]) {
                    if ($match[2] == 'P') $tz = 'Los_Angeles';
                    else if ($match[2] == 'M') $tz = 'Denver';
                    else if ($match[2] == 'C') $tz = 'Chicago';
                    else if ($match[2] == 'E') $tz = 'New_York';
                    date_default_timezone_set("America/$tz");
                }

                $effective = date('g:i A T', $from);

                if ($from < strtotime(date('n/j/Y').' 23:59:59')) {
                    $effective .= ' Today';
                } else {
                    $effective .= date('l', $from);
                }
                    
                $theAlert = [
                    'id' => $prop['id'],
                    'event' => $prop['event'],
                    'headline' => $prop['headline'],
                    'area' => $prop['areaDesc'],
                    'effective' => $effective,
                    'expires' => date('g:i A T l', strtotime($end))
                ];

                if ($_REQUEST['app'] == 1) {
                    $theAlert['wfo'] = $wfo;
                }/* else {
                    $alerts[] = [
                        'id' => $prop['id'],
                        'event' => $prop['event'],
                        'headline' => $prop['headline'],
                        'area' => $prop['areaDesc'],
                        'expires' => date('g:i A T l', strtotime($end))
                    ];
                }*/
                $alerts[] = $theAlert;

                $oldevents[] = $prop['id'];
            }
        }
    }
//}

sort($alerts);

$returnJson = array('alerts' => $alerts, 'county' => $county);