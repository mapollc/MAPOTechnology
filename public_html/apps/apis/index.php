<?
$host = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);

if (!filter_var($host, FILTER_VALIDATE_IP) && $host !== 'localhost') {
    $parts = explode('.', $host);
    $host = '.' . implode('.', array_slice($parts, -2));
}

ini_set('display_errors', 1);
error_reporting(E_ERROR | E_PARSE);

ini_set('log_errors', 1);
ini_set('memory_limit', '1024M');
ini_set("error_log", './error_log');
ini_set('session.cookie_domain', $host);
ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);
date_default_timezone_set('UTC');

session_start();

$startAPITime = microtime(true);
$noMetadata = false;
$failed = 0;
$apiOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$normalizedOrigin = preg_replace('#^https?://(www\.)?#', '', $apiOrigin);
$apiKey = $_REQUEST['key'] ?? '';

$allowedTokens = [
    'c196d0958608ad2b7d4af2be078ecc54' => ['mapotechnology.com', 'apps.mapotechnology.com']
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

require_once '/home/mapo/public_html/db.ini.php';

$api = $_REQUEST['api'];
$method = $_REQUEST['method'];
$function = $_REQUEST['function'];
$format = $_REQUEST['format'];
$version = isset($_GET['version']) ? (int) $_GET['version'] : 1;
$allowBrowser = true;

if ($_SERVER['REQUEST_URI'] == '/') {
    echo '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:150%;font-family:sans-serif;text-align:center"><h1>MAPO LLC</h1>' .
        '<h2>API Server</h2><iframe frameborder="0" style="width:191px;height:30px" src="https://status.mapotechnology.com/badge?theme=light"></iframe></div>';
} else {
    if (!isset($_GET['version'])) {
        $returnJson = ['error' => array('response' => 'error', 'code' => 404, 'msg' => 'An API version has not been specified.')];
    } else {
        if (empty($allowedDomain)) {
            $failed = 1;
            $returnJson = ['error' => array('response' => 'error', 'code' => 400, 'msg' => 'The token you specified is not valid')];
        } else {
            if ($_SERVER['HTTP_REFERER'] == '' && $allowBrowser === false) {
                $failed = 1;
                $returnJson = array('reponse' => 'error', 'code' => 403, 'msg' => 'You cannot access this data via browser window');
            } else {
                $apiMap = [
                    'polygen' => 'polygen'
                ];

                $file = $apiMap[$api] ?? null;
                $failed = 0;

                if ($file != null) {
                    $path = "/home/mapo/public_html/apps/apis/v$version/$file.inc.php";

                    if (file_exists($path)) {
                        if ($api == 'polygen') {
                            try {
                                $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_polygen');
                            } catch (mysqli_sql_exception $e) {
                                echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
                            }

                            include_once '/home/mapo/public_html/apps/pg/helpers.ini.php';
                            $helper = new Helpers(null);
                        }

                        include_once $path;
                    } else {
                        $returnJson = ['response' => 'error', 'code' => 404, 'msg' => 'The API resource you\'re looking for doesn\'t exist.'];
                    }
                }
            }
        }
    }

    $elapsed = microtime(true) - $startAPITime;
    $now = time();
    $arr = [
        'apiVersion' => $version,
        'origin' => $allowOrigin,
        'time' => gmdate('Y-m-d\TH:i:sP', $updateForCacheTime ? $updateForCacheTime : time()),
        'response' => ($elapsed > 1 ? round($elapsed, 3) . 's' : round($elapsed, 4) . 'ms')
    ];
    $thereq = $api . ($method ? '/' . $method : '') . ($function ? '/' . $function : '');

    ////mysqli_query($con, "INSERT INTO apiUsage (request,token,origin,time,response,cache,elapsed) VALUES('$thereq','$_REQUEST[key]','$output_array[1]','$now','$failed','$cac','$elapsed')");

    // close all mysql connections
    mysqli_close($con);
    if ($con2) mysqli_close($con2);

    // close memcache connection at the end, if started in the first place
    if ($memcache) $memcache->quit();

    // if API response is cached, add that parameter to the metadata
    if (!$noMetadata) {
        if ($returnJson instanceof stdClass) {
            $returnJson->metadata = $arr;
            if ($isCached) {
                $tmp = [];
                $tmp = $returnJson->metadata;
                $returnJson->metadata = array_merge(['cache' => true], $tmp);
            }
        } else {
            $returnJson['metadata'] = $arr;
            if ($isCached) $returnJson['metadata']['cache'] = true;
        }
    }

    if ($returnJson) {
        echo json_encode($returnJson, $format ? JSON_PRETTY_PRINT : 0);
    }

    exit();
}
