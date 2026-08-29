<?
const USE_CACHE = false;
$memcache = new Memcached();
if (!count($memcache->getServerList())) $memcache->addServer('127.0.0.1', 11211);

function geometryType($coordinates)
{
    // Polygon: [ring][point][lon/lat]
    if (isset($coordinates[0][0][0]) && is_numeric($coordinates[0][0][0])) return 'Polygon';

    // MultiPolygon: [polygon][ring][point][lon/lat]
    if (isset($coordinates[0][0][0][0]) && is_numeric($coordinates[0][0][0][0])) return 'MultiPolygon';

    return null;
}

if (!$method) {
    return $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'No method was supplied to the API'];
}

/*
 * Return a count of evacuations, and we can total them by state and county too 
 */
if ($method == 'count') {
    $total = 0;
    $states = [];
    $counties = [];

    $result = mysqli_query($con, "SELECT state, county FROM evacuations");

    while ($row = mysqli_fetch_assoc($result)) {
        $total++;

        $state = $row['state'];
        $county = $row['county'];

        // Count by state
        $states[$state] = ($states[$state] ?? 0) + 1;

        // Count by state/county
        $counties[$state][$county ?: 'Unknown'] = ($counties[$state][$county ?: 'Unknown'] ?? 0) + 1;
    }

    foreach ($counties as &$stateCounties) {
        arsort($stateCounties);
    }
    unset($stateCounties);

    return $returnJson = [
        'total' => $total,
        'states' => $states,
        'counties' => $counties
    ];
}

/*
 * Return a count of evacuations, and we can total them by state and county too 
 */
if ($method == 'list') {
    $cacheKey = "evacs_v$version"
        . (isset($_REQUEST['state']) ? "_$_REQUEST[state]" : '')
        . (isset($_REQUEST['county']) ? "_$_REQUEST[county]" : '')
        . (isset($_REQUEST['level']) ? "_$_REQUEST[level]" : '')
        . (isset($_REQUEST['updated']) ? "_$_REQUEST[updated]" : '');

    if (!USE_CACHE) $memcache->delete($cacheKey);
    $cached = $memcache->get($cacheKey);

    if ($cached !== false) {
        $isCached = true;
        return $returnJson = json_decode($cached, true);
    }

    $types = '';
    $params = $where = [];

    if (isset($_REQUEST['state'])) {
        $types .= 's';
        $params[] = $_REQUEST['state'];
        $where[] = "state = ?";
    }

    if (isset($_REQUEST['county'])) {
        $types .= 's';
        $params[] = $_REQUEST['county'];
        $where[] = "county = ?";
    }

    if (isset($_REQUEST['level'])) {
        $types .= 'i';
        $params[] = $_REQUEST['level'];
        $where[] = "level = ?";
    }

    if (isset($_REQUEST['updated'])) {
        $types .= 'i';
        $params[] = $_REQUEST['updated'];
        $where[] = "updated >= ?";
    }

    $conds = implode(' AND ', $where);

    $results = executeQuery(
        $types,
        $params,
        "SELECT id, lat, lon, state, county, zoneID, level, notes, updated
        FROM evacuations " . (count($where) > 0 ? " WHERE $conds " : '') .
            "ORDER BY state ASC, county ASC, level DESC"
    );

    $out = ['evacuations' => null];

    if (!empty($results)) {
        $out = ['evacuations' => $results];
    }

    if (USE_CACHE) $memcache->set($cacheKey, json_encode($out), 450);

    return $returnJson = $out;
}