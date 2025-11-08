<?
$category = $_GET['method'];
$year = date('Y');

function dispatchZones($id) {
    global $dzones;
    $r = ['agency' => null, 'area' => null, 'logo' => null];

    for ($i = 0; $i < count($dzones); $i++) {
        $unit = $dzones[$i]->unit;
        if ($unit == explode('-', $id)[1]) {
            $r = $dzones[$i];
            break;
        }
    }

    return $r;
}

function generateCacheKey($category) {
    global $_REQUEST;
 
    return 'api-fires_'.$category.
            ($_REQUEST['archive'] ? '_'.$_REQUEST['archive'] : '').
            ($_REQUEST['agency'] ? '_'.$_REQUEST['agency'] : '').
            ($_REQUEST['state'] ? '_'.$_REQUEST['state'] : '').
            ($_REQUEST['start'] && $_REQUEST['end'] ? '_'.$_REQUEST['start'].$_REQUEST['end'] : '').
            ($_REQUEST['sort'] ? '_'.$_REQUEST['sort'] : '').
            ($_REQUEST['order'] ? '_'.$_REQUEST['order'] : '');
}

if ($category == 'incident') {
    require_once 'fire-info.ini.php';
} else if ($category == 'canada') {
    $weeks1 = strtotime('-7 days');
    $weeks3 = strtotime('-3 weeks');
    $months6 = strtotime('-6 months');
    $sql = "SELECT * FROM ca_wildfires WHERE (((date >= $weeks3 AND CAST(acres AS float) < 1000 AND status != 'Under control') OR (date >= $weeks1 AND CAST(acres AS float) < 1000 AND status = 'Under control')) OR (date >= $months6 AND CAST(acres AS float) >= 1000)) AND display = 1 ORDER BY ".($_REQUEST['order'] ? ($_REQUEST['order'] == 'acres' ? 'CAST(acres AS float)' : $_REQUEST['order']) : 'CAST(date AS float)')." DESC";

    $result = mysqli_query($con, $sql);

    $total = 0;
    while ($row = mysqli_fetch_assoc($result)) {
        $url = 'wildfire/' . $row['wfid'] . '/canada/' . strtolower(str_replace('--', '-', str_replace('_', '-', str_replace(' ', '-', $row['name'])))) . '-fire';

        $features[] = [
            'type' => 'Feature',
            'geometry' => [
                'type' => 'Point',
                'coordinates' => [
                    floatval($row['lon']),
                    floatval($row['lat'])
                ]
            ],
            'properties' => [
                'wfid' => intval($row['wfid']),
                'province' => $row['province'],
                'name' => str_replace('_', ' ', $row['name']),
                'type' => 'Wildfire',
                'acres' => floatval($row['acres']),
                'status' => ($row['status'] ? $row['status'] : null),
                'near' => $row['geo'] ? $row['geo'] : null,
                'url' => $url,
                'time' => [
                    'year' => intval($row['year']),
                    'discovered' => floatval($row['date']),
                    'captured' => floatval($row['captured']),
                    'updated' => floatval($row['updated']),
                    'timezone' => $row['timezone']
                ]
            ]
        ];

        $total++;
    }

    $returnJson = array('type' => 'FeatureCollection', 'features' => $features, 'totalFires' => $total);
} else {
    if (isset($_REQUEST['bbox'])) {
        $js = json_decode(urldecode($_REQUEST['bbox']));
        $ymin = $js->ymin;
        $ymax = $js->ymax;
        $xmin = $js->xmin;
        $xmax = $js->xmax;
    } else {
        $cacheExpires = time() + ($_REQUEST['archive'] ? 31557600 : 300);
        $cachefilename = generateCacheKey($category);
        $memcache = new Memcached();
        $memcache->addServer('127.0.0.1', 11211); 
        $cache = $memcache->get($cachefilename);
        $cacheTime = $memcache->get("$cachefilename-time");
    }

    // if a memcached object doesn't exist, the script was updated since last cached, or the memcached object is expired
    // otherwise use memcached data
    if (!$cache || filemtime(root().'wildfires.ini.php') > $cacheTime || filemtime(root().'getWildfires.inc.php') > $cacheTime || time() - $cacheTime > $cacheExpires) {
        $cacheResult = mysqli_fetch_assoc(mysqli_query($con, "SELECT cache_data, expires FROM wildfire_api_cache WHERE cache_key = '$cachefilename' LIMIT 1"));

        // if data is cached in database and not expired, use it and then set the memcached object
        // otherwise we need to query the database for fresh data
        if ($cacheResult && $cacheResult['expires'] > time()) {
            $isCached = true;
            $returnJson = json_decode($cacheResult['cache_data']);

            $memcache->set($cachefilename, json_encode($returnJson), $cacheExpires);
            $memcache->set("$cachefilename-time", time(), $cacheExpires);
        } else {
            require_once 'getWildfires.inc.php';

            if (!isset($_REQUEST['bbox'])) {
                prepareQuery('ssi', [$cachefilename, json_encode($returnJson), $cacheExpires], "REPLACE INTO wildfire_api_cache (cache_key, cache_data, expires) VALUES (?,?,?)");
                $memcache->set($cachefilename, json_encode($returnJson), $cacheExpires);
                $memcache->set("$cachefilename-time", time(), $cacheExpires);
            }
        }
    } else {
        $isCached = true;
        $updateForCacheTime = $memcache->get("$cachefilename-time");
        $cache = json_decode($cache);
        ////$cache->cached = true;
        $returnJson = $cache;
    }
}