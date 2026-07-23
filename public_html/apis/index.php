<?
$host = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);

if (!filter_var($host, FILTER_VALIDATE_IP) && $host !== 'localhost') {
    $parts = explode('.', $host);
    $host = '.' . implode('.', array_slice($parts, -2));
}

ini_set('display_errors', 1);
error_reporting(E_ERROR | E_PARSE);

ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);
ini_set('log_errors', 1);
ini_set('memory_limit', '1024M');
ini_set("error_log", './error_log');
ini_set('session.cookie_domain', $host);
date_default_timezone_set('America/Los_Angeles');

$startAPITime = microtime(true);
$noMetadata = false;
$failed = 0;
$apiOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$normalizedOrigin = preg_replace('#^https?://(www\.)?#', '', $apiOrigin);
$apiKey = $_REQUEST['key'] ?? '';

$allowedTokens = [
    'c196d0958608ad2b7d4af2be078ecc54' => ['mapotechnology.com', 'apps.mapotechnology.com'],
    '50e2c43f8f63ff0ed20127ee2487f15e' => ['mapofire.com'],
    'cf707f0516e5c1226835bbf0eece4a0c' => ['mapotrails.com'],
    '97b9fb49574cc2e1ccd3f19bc5d94a8c' => ['com.mapollc.main', 'com.mapollc.oreroads'],
    'bG9jYWxob3N0'                     => ['localhost', '127.0.0.1:5500'],
    '85f58fa255efe0f779e0dfcd62d87e6d' => ['wildfiremap.org'],
    '191eab18c50c8f5653bdeba13f219bed' => ['fireweatheravalanche.org'],
    '57a83db35f6d91d1ee2bd83a2d305857' => ['auth.mapotechnology.com']
];

$allowedDomain = $allowedTokens[$apiKey] ?? [];
$allowOrigin = array_filter($allowedDomain, fn($domain) => stripos($normalizedOrigin, $domain) !== false) ? $apiOrigin : '';

header('Content-type: ' . ($_SERVER['REQUEST_URI'] == '/' ? 'text/html' : 'application/json'));
header("Cache-Control: public, max-age=600");
header('Pragma: cache');
header("Expires: " . gmdate('D, d M Y H:i:s', time() + 600) . ' GMT');
header("Last-Modified: " . gmdate('D, d M Y H:i:s') . ' GMT');

if ($allowOrigin) {
    header('Access-Control-Allow-Credentials: true');
    header("Access-Control-Allow-Origin: $allowOrigin");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function writeToLog($key, $version, $api, $method, $function, $isCached)
{
    global $allowedDomain;

    $filePath = './cache/access-log';
    $now = DateTime::createFromFormat('U.u', microtime(true));

    if ($now === false) {
        $now = new DateTime();
    }

    $now->setTimezone(new DateTimeZone('America/Los_Angeles'));
    $time = $now->format('Y-m-d H:i:s.u T');
    $params = preg_replace('/(?:&|^)(?:version|api|method|function)=[^&]*/i', '', $_SERVER['QUERY_STRING']);
    $url = $api . ($method ? "/$method" : '') . ($function ? "/$function" : '') . ($params ? '?' . substr($params, 1, strlen($params)) : '') . ($isCached ? '   [CACHED]' : '') . '   ' . $_SERVER['REMOTE_ADDR'];
    $line = "[$time]: $allowedDomain  [$key]  /v$version/$url
";

    if (file_exists($filePath)) {
        if (filesize($filePath) > 1000000 * 50) {
            unlink($filePath);
        } else {
            file_put_contents($filePath, $line, FILE_APPEND | LOCK_EX);
        }
    }

    file_put_contents($filePath, $line);
}

function root()
{
    global $version;
    return $_SERVER['DOCUMENT_ROOT'] . '/v' . $version . '/';
}

include_once '/home/mapo/public_html/config.inc.php';
require_once '/home/mapo/public_html/apis/functions.inc.php';

$api = $_REQUEST['api'];
$method = $_REQUEST['method'];
$function = $_REQUEST['function'];
$format = $_REQUEST['format'];
$version = isset($_GET['version']) ? (int) $_GET['version'] : 1;
$allowBrowser = true;
$needSess = ['profile', 'account', 'user', 'user-content', 'session', 'track'];
$needCon2 = ['favorite', 'trails', 'upload'];
$isCached = false;
$isCachedType = null;

if ($_SERVER['REQUEST_URI'] == '/') {
    echo '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:150%;font-family:sans-serif;text-align:center"><h1>MAPO LLC</h1>' .
        '<h2>API Server</h2><iframe frameborder="0" style="width:191px;height:30px" src="https://status.mapotechnology.com/badge?theme=light"></iframe></div>';
} else {
    if (!isset($_GET['version'])) {
        $returnJson = ['error' => ['response' => 'error', 'code' => 404, 'msg' => 'An API version has not been specified.']];
    } else {
        if (empty($allowedDomain)) {
            $failed = 1;
            $returnJson = ['error' => ['response' => 'error', 'code' => 400, 'msg' => 'The token you specified is not valid']];
        } else {
            if ($_SERVER['HTTP_REFERER'] == '' && $allowBrowser === false) {
                $failed = 1;
                $returnJson = ['reponse' => 'error', 'code' => 403, 'msg' => 'You cannot access this data via browser window'];
            } else {
                if (in_array($api, $needCon2)) {
                    $con2 = mapoTrailsDB();

                    if (mysqli_connect_errno()) {
                        echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
                    }
                }

                $apiMap = [
                    'account' => 'account',
                    'avalanche' => 'avalanche',
                    'billing' => 'billing',
                    'createChart' => 'chart',
                    'crowdsource' => 'crowdsource',
                    'climo' => 'fireclimo',
                    'dispatch' => 'dispatch',
                    'elevation' => 'elevation',
                    'evacuations' => 'evacuations',
                    'events' => 'topfires',
                    'favorite' => 'favorite',
                    'fire-weather' => 'fire-wx',
                    'forecast' => 'forecast',
                    'fwf' => 'fwf',
                    'geocode' => 'geocode',
                    'getWWA' => 'getWWA',
                    'incidentPhoto' => 'incidentPhoto',
                    'jurisdiction' => 'jurisdiction',
                    'lightning' => 'lightning',
                    'logFire' => 'logFire',
                    'manageApp' => 'app',
                    'maps' => 'maps',
                    'message' => 'message',
                    'model' => 'model',
                    'nbm' => 'nbm',
                    'newReport' => 'newReport',
                    'nws' => 'nws',
                    'odot' => 'odot',
                    'oreroads' => 'oreroads',
                    'outlooks' => 'outlooks',
                    'profile' => 'profile',
                    'payment' => 'payment',
                    'raws' => 'raws',
                    'recaptcha' => 'recaptcha',
                    'report' => 'state-report',
                    'risk' => 'risk',
                    'roads' => 'roads',
                    'rth' => 'rth',
                    'rundown' => 'rundown',
                    'search' => 'search',
                    'session' => 'session',
                    'snowfall' => 'wpc',
                    'subscriptions' => 'subscriptions',
                    'spc' => 'spc',
                    'tfrs' => 'tfrs',
                    'trails' => 'trails',
                    'trackFires' => 'track',
                    'user' => 'user',
                    'usfs' => 'usfs',
                    'upload' => 'upload',
                    'userContent' => 'user-content',
                    'versioning' => 'version',
                    'weather' => 'weather',
                    'webcams' => 'webcams',
                    'wildfires' => 'wildfires',
                    'winter' => 'winter',
                    'wwas' => 'wwas'
                ];

                $file = $apiMap[$api] ?? null;
                $failed = 0;
                $path = '/home/mapo/public_html' . ($mapotrails == 1 ? '/mapotrails.com' : ($mapofire == 1 ? '/mapofire.com' : '')) . '/apis/' . ($mapotrails != 1 && $mapofire != 1 ? 'v' . $_GET['version'] . '/' : '') . $file . '.ini.php';

                if ($file == null || !file_exists($path)) {
                    $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The API resource you\'re looking for doesn\'t exist.'];
                } else {
                    if (in_array($file, $needSess)) {
                        session_start();
                    }

                    include_once $path;
                }
            }
        }
    }

    writeToLog($apiKey, $version, $api, $method, $function, $isCached);

    $elapsed = microtime(true) - $startAPITime;
    $now = time();
    $arr = [
        'apiVersion' => $version,
        'origin' => $allowOrigin,
        'time' => gmdate('Y-m-d\TH:i:sP', $updateForCacheTime ? $updateForCacheTime : time()),
        'response' => ($elapsed > 1 ? round($elapsed, 3) . 's' : round($elapsed, 4) . 'ms')
    ];
    $thereq = $api . ($method ? "/$method" : '') . ($function ? "/$function" : '');

    ////mysqli_query($con, "INSERT INTO apiUsage (request,token,origin,time,response,cache,elapsed) VALUES('$thereq','$_REQUEST[key]','$output_array[1]','$now','$failed','$cac','$elapsed')");

    // close all mysql connections
    mysqli_close($con);
    if ($con2) mysqli_close($con2);

    // close memcache connection at the end, if started in the first place
    if ($memcache) {
        $memcache->quit();
    }

    // if API response is cached, add that parameter to the metadata
    if (!$noMetadata) {
        if ($returnJson instanceof stdClass) {
            $returnJson->metadata = $arr;
            if ($isCached) {
                $tmp = [];
                $tmp = $returnJson->metadata;
                $arr = ['cache' => true];
                if ($isCachedType != null) $arr['cacheType'] = $isCachedType;
                $returnJson->metadata = array_merge($arr, $tmp);
            }
        } else {
            $returnJson['metadata'] = $arr;
            if ($isCached) $returnJson['metadata']['cache'] = true;
            if ($isCachedType != null) $returnJson['metadata']['cacheType'] = $isCachedType;
        }
    }

    if ($returnJson) {
        echo json_encode($returnJson, $format ? JSON_PRETTY_PRINT : 0);
    }

    exit();
}
