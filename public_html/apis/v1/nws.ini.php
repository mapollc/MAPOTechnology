<?
$oldevents = [];
$alerts = [];
$county = null;

$json = get_data("https://api.weather.gov/alerts/active?point={$_REQUEST['lat']},{$_REQUEST['lon']}");

foreach ($json['features'] ?? [] as $feature) {
    $prop = $feature['properties'];

    if (in_array($prop['id'], $oldevents)) return;

    $from = strtotime($prop['effective']);
    $end = $prop['ends'] ?: $prop['expires'];
    $wfo = substr($prop['senderName'], 0, -3) . ',' . substr($prop['senderName'], -3);

    preg_match('/\s((P|M|C|E|)(S|D)T)\s/', $prop['headline'], $match);

    if ($match[1]) {
        $tz = match ($match[2]) {
            'P' => 'Los_Angeles',
            'M' => 'Denver',
            'C' => 'Chicago',
            'E' => 'New_York'
        };

        date_default_timezone_set("America/$tz");
    }

    $effective = date('g:i A T', $from);

    if ($from < strtotime(date('n/j/Y') . ' 23:59:59')) {
        $effective .= ' Today';
    } else {
        $effective .= date('l', $from);
    }

    $alert = [
        'id' => $prop['id'],
        'event' => $prop['event'],
        'headline' => $prop['headline'],
        'area' => $prop['areaDesc'],
        'effective' => $effective,
        'expires' => date('g:i A T l', strtotime($end))
    ];

    if ($_REQUEST['app'] == 1) {
        $alert['wfo'] = $wfo;
    }

    $alerts[] = $alert;
    $oldevents[] = $prop['id'];
}

sort($alerts);

$returnJson = [
    'alerts' => $alerts,
    'county' => $county
];