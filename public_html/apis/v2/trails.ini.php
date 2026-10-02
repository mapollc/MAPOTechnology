<?
function trailColor($m)
{
    $colors = ['cb2626', '40d740', 'ff973a', 'ebeb2e', 'f977dd', '6daee3', '9873f0', 'ff8298', '698d65', '009688', '3949ab', '880e4f'];

    return '#' . match ($m) {
        'Snowmobile' => 'ff0000',
        'Tour' => '0058aa',
        'Ski Line' => '13ff2f',
        'Gravel' => '747474',
        'ATV Track' => '00ffff',
        'Road' => '000',
        'Single Track' => $colors[array_rand($colors)],
        default => '000'
    };
}

function gpxToGeoJson($file)
{
    $xml = simplexml_load_file("/home/mapo/public_html/mapotrails.com/data/gpx/$file", 'SimpleXMLElement', LIBXML_NOCDATA);

    if ($xml === false) {
        return null;
    }

    $points = $xml->xpath('//*[local-name()="trkpt"]');

    if (!$points) {
        return null;
    }

    $coordinates = [];

    foreach ($points as $point) {
        $coordinates[] = [
            (float) $point['lon'],
            (float) $point['lat']
        ];
    }

    return [
        'type' => 'LineString',
        'coordinates' => $coordinates
    ];
}

if ($method == 'list') {
    $activity = '';
    $type = 's';
    $params[] = $_REQUEST['types'] ?? 'trail';

    if (isset($_REQUEST['activity'])) {
        $type .= 's';
        $params[] = json_encode(ucwords(str_replace('-', ' ', $_REQUEST['activity'])));
        $activity = "AND JSON_CONTAINS(term, ?)";
    }

    $trails = executeQuery(
        $type,
        $params,
        "SELECT t.id, t.title, t.type, season, term, keywords, file, m.title AS caption, stats, created, updated, public, premium
        FROM trails t
        LEFT JOIN categories c ON c.trail_id = t.id
        LEFT JOIN stats s ON s.trail_id = t.id
        LEFT JOIN media m ON m.trail_id = t.id AND m.type = 'photo' AND (delta = NULL OR delta = (SELECT MIN(delta) FROM media WHERE trail_id = t.id))
        WHERE public = 1 AND t.type IN (?) $activity
        ORDER BY delta ASC",
        true
    );

    $listOfTrails = [];

    if (!empty($trails)) {
        foreach ($trails as $trail) {
            $trail['term'] = json_decode($trail['term']);
            $trail['stats'] = json_decode($trail['stats']);
            $trail['icon'] = $trail['term'][0] ?? '';
            $trail['url'] = guideUrl($trail['title'], $trail['type'], $trail['id']);
            /*$trail['public'] = $trail['public'];
            $trail['premium'] = $trail['premium'];*/

            $listOfTrails[] = [
                'id' => $trail['id'],
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$trail['stats']->geo->start[1], $trail['stats']->geo->start[0]]
                ],
                'properties' => $trail
            ];
        }
    }

    return $returnJson = ['type' => 'FeatureCollection', 'features' => $listOfTrails];
}

if ($method == 'guide') {
    $data = executeQuery(
        'i',
        [$_REQUEST['id']],
        "SELECT stats FROM stats WHERE trail_id = ?",
        true
    );

    $photos = executeQuery(
        'i',
        [$_REQUEST['id']],
        "SELECT id, file, title FROM media WHERE trail_id = ? ORDER BY delta ASC",
        true
    );

    $waypoints = executeQuery(
        'i',
        [$_REQUEST['id']],
        "SELECT id, name, lat, lon, elev, note, icon FROM waypoints WHERE (lat != 0 AND lon != 0) AND trail_id = ? ORDER BY delta ASC",
        true
    );

    $ph = null;

    foreach ($photos as $p) {
        $ph[] = $p;
    }

    if (!is_array($waypoints[0])) $waypoints = [$waypoints];

    $returnJson = [
        'guide' => [
            'stats' => $data['stats'] ? json_decode($data['stats']) : null,
            'waypoints' => $waypoints ?? null,
            'photos' => $ph
        ]
    ];
}

if ($method == 'waypoints') {
    $activity = '';
    $params = 's';
    $where[] = $_REQUEST['types'] ?? 'trail';

    if (isset($_REQUEST['activity'])) {
        $params .= 's';
        $where[] = json_encode(ucwords(str_replace('-', ' ', $_REQUEST['activity'])));
        $activity = "AND JSON_CONTAINS(term, ?)";
    }

    $waypoints = executeQuery(
        $params,
        $where,
        "SELECT title, type, term, w.*, public, premium
        FROM waypoints w
        LEFT JOIN trails t ON t.id = w.trail_id
        LEFT JOIN categories c ON c.trail_id = t.id
        WHERE t.type IN (?) AND t.id IS NOT NULL AND (lat != 0 AND lon != 0) $activity
        ORDER BY t.id ASC, delta ASC",
        true
    );

    $features = [];

    if (!empty($waypoints)) {
        foreach ($waypoints as $p) {
            $features[] = [
                'id' => $p['id'],
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$p['lon'], $p['lat']]
                ],
                'properties' => [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'note' => $p['note'],
                    'icon' => $p['icon'] ?? 'info',
                    'elevation' => $p['elev'],
                    'trail' => [
                        'trail_id' => $p['trail_id'],
                        'title' => $p['title'],
                        'type' => $p['type'],
                        'activity' => json_decode($p['term'])
                    ],
                    'public' => $p['public'],
                    'premium' => $p['premium']
                ]
            ];
        }
    }

    return $returnJson = ['type' => 'FeatureCollection', 'features' => $features];
}

if ($method == 'chart') {
    $chart = null;
    $query = executeQuery(
        'i',
        [$_REQUEST['id']],
        "SELECT filename FROM gpx g WHERE id = ?",
        true
    );

    $file = $query['filename'] ?? null;
    $path = "/home/mapo/public_html/mapotrails.com/data/gpx/$file";

    if (!$query || !$file || !file_exists($path)) {
        return $returnJson = [
            'response' => 'error',
            'code' => 1,
            'msg' => 'The GPX track does not exist'
        ];
    }

    $xml = simplexml_load_file($path, 'SimpleXMLElement', LIBXML_NOCDATA);

    if ($xml === false) {
        return $returnJson = [
            'response' => 'error',
            'code' => 2,
            'msg' => 'The GPX data is invalid'
        ];
    }

    $points = $xml->xpath('//*[local-name()="trkpt"]');
    $chart = [];
    $dist = 0;

    if (isset($points[0]->ele)) {
        $chart[] = [
            0,
            (float) $points[0]->ele
        ];
    }

    for ($i = 1, $count = count($points); $i < $count; $i++) {
        $dist += distance(
            (float) $points[$i]['lat'],
            (float) $points[$i]['lon'],
            (float) $points[$i - 1]['lat'],
            (float) $points[$i - 1]['lon']
        );

        if (!isset($points[$i]->ele) || !$dist) {
            continue;
        }

        if ($dist <= ($chart[array_key_last($chart)][0] ?? -1)) {
            continue;
        }

        $chart[] = [
            $dist,
            (float) $points[$i]->ele
        ];
    }

    return $returnJson = [
        'chart' => $chart
    ];
}

if ($method == 'geojson') {
    $gpx = executeQuery(
        'i',
        [$_REQUEST['id'] ?? $_REQUEST['gis_id']],
        "SELECT t.id AS trail_id, g.id, t.title, t.type, g.delta, term, keywords, filename, mode, caption, stats, premium, public, display
        FROM gpx g
        LEFT JOIN categories c ON c.trail_id = g.trail_id
        LEFT JOIN trails t ON t.id = g.trail_id
        LEFT JOIN stats s ON s.trail_id = g.trail_id
        WHERE " . (isset($_REQUEST['gis_id']) ? "g.id" : "g.trail_id") . " = ?
        ORDER BY delta ASC",
        true
    );

    if (empty($gpx)) return $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'The trail you\'re looking for does not exist'];

    $file = null;

    if (!is_array($gpx[0])) $gpx = [$gpx];
    $feats = [];

    foreach ($gpx as $track) {
        $prop = [];

        foreach ($track as $k => $v) {
            if ($k === 'filename') {
                $file = $v;
                continue;
            }

            if ($k === 'id') $gid = $v;

            $prop[$k] = in_array($k, ['stats', 'keywords', 'term']) ? json_decode($v, true) : $v;
        }

        $prop['color'] = trailColor($track['mode']);
        $prop['url'] = guideUrl($track['title'], $track['type'], $track['trail_id']);

        $feats[] = [
            'id' => $gid,
            'type' => 'Feature',
            'geometry' => gpxToGeoJson($file),
            'properties' => $prop
        ];
    }

    $returnJson = [
        'type' => 'FeatureCollection',
        'features' => $feats
    ];
}
