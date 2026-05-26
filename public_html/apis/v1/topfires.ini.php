<?
function normalize($value, $min, $max)
{
    if ($max - $min == 0) return 0;

    $n = ($value - $min) / ($max - $min);

    return max(0, min(1, $n)); // added: clamp between 0–1
}

function recencyScore($dateDiscovered)
{
    $hours = (time() - $dateDiscovered) / 3600;

    if ($hours < 6) return 1; // added: boost very new fires

    return exp(-0.05 * $hours); // changed: slower decay
}

function scaleLog($value)
{
    return log(1 + max(0, $value)); // added: prevent negative issues
}

function trendScore($count, $acres, $discovered, $stats)
{
    $clicks = normalize(scaleLog($count), $stats['min_clicks'], $stats['max_clicks']);
    $acres  = normalize(scaleLog($acres), $stats['min_acres'], $stats['max_acres']);
    $recency = recencyScore($discovered);

    // weights (tunable)
    $wClicks = 0.5;
    $wAcres  = 0.3;
    $wRecent = 0.2;

    return ($clicks * $wClicks) + ($acres * $wAcres) + ($recency * $wRecent);
}

$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211);
$cacheKey = "trendingFires_$version" . isset($_REQUEST['limit']) ? "_{$_REQUEST['limit']}" : '';
$cache = $memcache->get($cacheKey);
$cacheTime = $memcache->get("$cacheKey-time");

if ($cache !== false && $cacheTime !== false && filemtime(__DIR__ . '/topfires.ini.php') < $cacheTime) {
    $topFires = $cache['top'] ?? null;
    $total = $cache['total'] ?? 0;
    $isCached = true;
} else {
    $result = mysqli_query($con, "SELECT t.*, w.status, w.date AS discovered, w.acres FROM topFires AS t INNER JOIN wildfires AS w ON w.wfid = t.wfid  ORDER BY t.count DESC LIMIT 200");

    $stats = null;
    $top = [];
    $clickVals = [];
    $acreVals  = [];

    while ($row = mysqli_fetch_assoc($result)) {
        $status = $row['status'] ? json_decode($row['status'], true) : null;

        if ($status !== null && in_array('Out', $status)) continue;
        if (time() - $row['discovered'] > 60 * 60 * 24 * 30 || floatval($row['acres']) <= 1) continue;

        $data = json_decode($row['data']);
        if (!$data) continue;

        $count = intval($row['count']);
        $acres = floatval($row['acres']);
        $data->wfid = intval($row['wfid']);

        // collect normalized inputs (log-scaled)
        $logClicks = scaleLog($count);
        $logAcres  = scaleLog($acres);

        $clickVals[] = $logClicks;
        $acreVals[]  = $logAcres;

        $top[] = [
            'score' => 0, // will compute later
            'wfid' => intval($row['wfid']),
            'count' => $count,
            'acres' => $acres,                 // added
            'discovered' => $row['discovered'], // added
            'data' => $data
        ];
    }

    if (!empty($clickVals) && !empty($acreVals)) {
        $stats = [
            'min_clicks' => min($clickVals),
            'max_clicks' => max($clickVals),
            'min_acres'  => min($acreVals),
            'max_acres'  => max($acreVals)
        ];

        foreach ($top as &$fire) {
            $fire['score'] = trendScore(
                $fire['count'],
                $fire['acres'],
                $fire['discovered'],
                $stats
            );
        }
        unset($fire);
    }

    if (!empty($top)) {
        usort($top, fn($a, $b) => $b['score'] <=> $a['score']);

        $topFires = [];
        $total = 0;
        $clicks = 0;

        $limit = isset($_REQUEST['limit']) ? max(1, (int)$_REQUEST['limit']) : 10;
        $maxItems = min($limit, count($top));

        for ($i = 0; $i < $maxItems; $i++) {
            unset($top[$i]['discovered']);
            unset($top[$i]['acres']);
            $topFires[] = $top[$i];

            $total++;
            $clicks += $top[$i]['count'];
        }

        $avgClicks = $total > 0 ? $clicks / $total : 0;

        foreach ($topFires as &$fire) {
            $fire['trending'] = $fire['count'] >= $avgClicks;
        }
        unset($fire);
    } else {
        $topFires = null;
        $total = 0;
    }

    $memcache->set($cacheKey, ['top' => $topFires, 'total' => $total], 900);
    $memcache->set("$cacheKey-time", time(), 900);
}

$returnJson = ['top' => $topFires, 'total' => $total];

/*if ($_GET['test'] == 1) {
    $result = mysqli_query($con, "SELECT t.*, w.status, w.date AS discovered, w.acres FROM topFires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid ORDER BY t.count DESC LIMIT 200");
    $total = $clicks = 0;

    while ($row = mysqli_fetch_assoc($result)) {
        $status = $row['status'] != '' ? json_decode($row['status'], true) : null;

        if ($status == null || ($status != null && !in_array('Out', $status))) {
            if (time() - $row['discovered'] < 60 * 60 * 24 * 30 && floatval($row['acres']) > 1) {
                $data = json_decode($row['data']);
                $count = intval($row['count']);
                $data->wfid = intval($data->wfid);
                //$score = intval($count) * floatval($row['acres']) * (time() - $row['discovered']);
                $top[] = ['score' => 0, 'wfid' => intval($row['wfid']), 'count' => $count, 'data' => $data];
            }
        }
    }

    if ($top) {
        usort($top, function ($a, $b) {
            return $b['count'] <=> $a['count'];
        });

        for ($i = 0; $i < 10; $i++) {
            if ($top[$i] != null) {
                unset($top[$i]['score']);
                $topFires[] = $top[$i];

                $total++;
                $clicks += $top[$i]['count'];
            }
        }

        for ($i = 0; $i < count($topFires); $i++) {
            $trend = $topFires[$i]['count'] >= $clicks / $total ? true : false;

            $topFires[$i]['trending'] = $trend;
        }
    } else {
        $topFires = null;
    }

    $returnJson = array('top' => $topFires, 'total' => $total);

    /*while ($row = mysqli_fetch_assoc($result)) {
        $useFire = true;

        if ($row['acres'] == 0) {
            $useFire = false;
        }

        if ($row['status'] != '') {
            $status = unserialize($row['status']);

            if (array_key_exists('Control', $status) || array_key_exists('Contain', $status) || array_key_exists('Out', $status)) {
                $useFire = false;
            }
        }

        if (time() - $row['discovered'] > 60 * 60 * 24 * 3 && $row['acres'] < 1000) {
            $useFire = false;
        }

        if (time() - $row['updated'] > 60 * 60 * 24) {
            $useFire = false;
        }

        if ($useFire) {
            $data = json_decode($row['data']);
            $count = intval($row['count']);
            $data->wfid = intval($data->wfid);
            $top[] = ['wfid' => intval($row['wfid']), 'count' => $count, 'data' => $data];
            $total++;
            $clicks += $count;
        }

        if ($total > 9) {
            break;
        }
    }

    $avg = $clicks / $total;

    foreach ($top as $ea) {
        $ea['trending'] = $ea['count'] > $avg ? true : false;
        $topFires[] = $ea;
    }

    $returnJson = array('top' => $topFires, 'total' => $total);*//*
} else {

    $useCache = false;
    $cachefilename = 'events';
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $cache = $memcache->get($cachefilename);
    $limit = $_REQUEST['limit'] ? $_REQUEST['limit'] : 10;

    if ($useCache == false || (!$cache || filemtime(root() . 'topfires.ini.php') > $memcache->get($cachefilename . '-time'))) {
        $result = mysqli_query($con, "SELECT * FROM topFires ORDER BY count DESC LIMIT $limit");
        $total = $clicks = 0;

        while ($row = mysqli_fetch_assoc($result)) {
            $data = json_decode($row['data']);
            $count = intval($row['count']);
            $data->wfid = intval($data->wfid);
            $top[] = ['wfid' => intval($row['wfid']), 'count' => $count, 'data' => $data];
            $total++;
            $clicks += $count;
        }

        $avg = $clicks / $total;

        foreach ($top as $ea) {
            $ea['trending'] = $ea['count'] > $avg ? true : false;
            $topFires[] = $ea;
        }

        $returnJson = array('top' => $topFires, 'total' => $total);
        $memcache->set($cachefilename, json_encode($returnJson), 600);
        $memcache->set($cachefilename . '-time', time(), 600);
    } else {
        $isCached = true;
        $cache = json_decode($cache);
        $returnJson = $cache;
    }
}
/*if ($method == 'updated') {
    $returnJson = ['cacheFile' => filemtime('/home/mapo/public_html/apis/cache/event.json'), 'memcached' => $memcache->get($cachefilename . '-time')];
} else {
    if ($useCache == false || (!$cache || filemtime(root() . 'topfires.ini.php') > $memcache->get($cachefilename . '-time'))) {
        $top = null;
        $total = 0;
        $json = file_get_contents('./cache/event.json');

        if (substr($json, -2) == ']]') {
            $json = substr($json, 0, strlen($json) - 1);
        }

        $events = json_decode($json);

        if ($events) {
            usort($events, function ($a, $b) {
                return $a->count < $b->count;
            });

            foreach (array_slice($events, 0, 10) as $j) {
                foreach ($j->data as $k => $v) {
                    $data[$k] = $k == 'wfid' ? intval($v) : $v;
                }

                $top[] = ['wfid' => $j->wfid, 'count' => $j->count, 'data' => $data];
                $total += $j->count;
            }
        }

        $returnJson = array('top' => $top, 'total' => $total);
        $memcache->set($cachefilename, json_encode($returnJson), 600);
        $memcache->set($cachefilename.'-time', time(), 600);
    } else {
        $isCached = true;
        $cache = json_decode($cache);
        $returnJson = $cache;
    }
}*/