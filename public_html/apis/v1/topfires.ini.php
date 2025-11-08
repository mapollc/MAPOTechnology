<?
if ($_GET['test'] == 1) {
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

    usort($top, function($a, $b) {
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

    $returnJson = array('top' => $topFires, 'total' => $total);*/
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
    $memcache->set($cachefilename.'-time', time(), 600);
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