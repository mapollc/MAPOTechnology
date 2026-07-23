<?
define('API_CACHE_ENABLED', true);

function generateCacheKey($category)
{
    global $_REQUEST;

    return "api-fires_$category" .
        (!empty($_REQUEST['archive']) ? "_{$_REQUEST['archive']}" : '') .
        (!empty($_REQUEST['agency']) ? "_{$_REQUEST['agency']}" : '') .
        (!empty($_REQUEST['state']) ? "_{$_REQUEST['state']}" : '') .
        (!empty($_REQUEST['start']) && !empty($_REQUEST['end']) ? "_{$_REQUEST['start']}{$_REQUEST['end']}" : '') .
        (!empty($_REQUEST['sort']) ? "_{$_REQUEST['sort']}" : '') .
        (!empty($_REQUEST['order']) ? "_{$_REQUEST['order']}" : '');
}

function getDispatchZones()
{
    static $zones = null;

    if ($zones === null) $zones = json_decode(file_get_contents('../cron/dispatch_zones.json'));

    return $zones;
}

function dispatchZones($id)
{
    static $lookup = null;

    if ($lookup === null) {
        $lookup = [];

        foreach (getDispatchZones() as $zone) {
            $lookup[$zone->unit] = $zone;
        }
    }

    $parts = explode('-', $id);
    $unit = $parts[1] ?? '';

    return $lookup[$unit]
        ?? (object)[
            'agency' => null,
            'area' => null,
            'logo' => null
        ];
}

$category = $_GET['method'];
$year = date('Y');

if ($category == 'stats') {
    return include 'fire-stats.ini.php';
}

if ($category == 'incident') {
    return include 'helpers/fireIncident.inc.php';
}

if ($category == 'canada') {
    return include 'helpers/canadaFires.inc.php';
}

// CHANGED: only initialize Memcached when caching is enabled
$mem = new Memcached();
if (!count($mem->getServerList())) $mem->addServer('127.0.0.1', 11211);

$cacheKey = generateCacheKey($category);

if (!API_CACHE_ENABLED) {
    $mem->delete($cacheKey);
}

// -------------------------
// BBOX requests bypass cache
// -------------------------
if (isset($_REQUEST['bbox'])) {
    $js = json_decode(urldecode($_REQUEST['bbox']));

    $ymin = $js->ymin;
    $ymax = $js->ymax;
    $xmin = $js->xmin;
    $xmax = $js->xmax;

    require_once 'helpers/getWildfires.inc.php';

    return $returnJson;
}

// -------------------------
// Development mode
// -------------------------

// CHANGED: completely bypass cache logic when disabled
if (!API_CACHE_ENABLED) {
    require_once 'helpers/getWildfires.inc.php';
    return $returnJson;
}

// -------------------------
// Cache settings
// -------------------------

$ttl = !empty($_REQUEST['archive']) ? 31557600 : 300;
$now = time();

$cache = $mem->get($cacheKey);
$cacheTimeRaw = $mem->get("$cacheKey-time");
$cacheTime = is_numeric($cacheTimeRaw) ? (int)$cacheTimeRaw : 0;

$lockKey = "$cacheKey-lock";

// CHANGED: determine validity once
$isCacheValid = $cache && $cacheTime > 0 && (($now - $cacheTime) < $ttl);

// -------------------------
// Serve valid cache
// -------------------------
if ($isCacheValid) {
    $isCached = true;

    $returnJson = json_decode($cache);
    if ($returnJson === null && json_last_error() !== JSON_ERROR_NONE) $mem->delete($cacheKey);

    return $returnJson;
}

// -------------------------
// Stale cache handling
// -------------------------

$hasCache = !empty($cache);

// CHANGED: acquire lock once
$gotLock = $mem->add($lockKey, 1, 20);

if (!$gotLock) {

    // CHANGED: serve stale cache while another request rebuilds
    if ($hasCache) {
        $isCached = true;

        $returnJson = json_decode($cache);
        if ($returnJson === null && json_last_error() !== JSON_ERROR_NONE) $mem->delete($cacheKey);

        return $returnJson;
    }

    // CHANGED: no cache and another process rebuilding
    return [
        'error' => 'warming cache'
    ];
}

// -------------------------
// Build fresh data
// -------------------------

try {

    require_once 'helpers/getWildfires.inc.php';

    // CHANGED: cache writes only occur when build succeeds
    $json = json_encode($returnJson);

    $mem->set($cacheKey, $json, $ttl);
    $mem->set("$cacheKey-time", $now, $ttl);

    executeQuery(
        'ssi',
        [$cacheKey, $json, $now + $ttl],
        "REPLACE INTO wildfire_api_cache (cache_key, cache_data, expires) VALUES (?,?,?)"
    );
} finally {
    // CHANGED: always release lock
    $mem->delete($lockKey);
}

return $returnJson;