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
$cacheKey = 'trendingFires_v2';
$cache = $memcache->get($cacheKey);

if ($cache !== false) {
    $topFires = $cache['top'] ?? null;
    $total = $cache['total'] ?? 0;
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

        for ($i = 0; $i < min(10, count($top)); $i++) {
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
}

$returnJson = ['top' => $topFires, 'total' => $total];
