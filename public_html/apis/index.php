<?
$ho = explode('.', $_SERVER['HTTP_HOST']);
$host = '.' . $ho[count($ho) - 2] . '.' . $ho[count($ho) - 1];

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('memory_limit', '1024M');
error_reporting(E_ERROR | E_PARSE);
ini_set("error_log", './error_log');
ini_set('session.cookie_domain', $host);
////session_set_cookie_params(0, '/', $host);
session_start();

$startAPITime = microtime(true);
$noMetadata = false;
$failed = 0;
date_default_timezone_set('America/Los_Angeles');

function writeToLog($key, $t, $version, $api, $method, $function, $isCached) {
    $filePath = './cache/access-log';
    $now = DateTime::createFromFormat('U.u', microtime(true));

    if ($now === false) {
        $now = new DateTime();
    }

    $now->setTimezone(new DateTimeZone('America/Los_Angeles'));
    $time = $now->format('Y-m-d H:i:s.u T');
    $domain = $t ? $t->domain : '';
    $params = preg_replace('/(?:&|^)(?:version|api|method|function)=[^&]*/i', '', $_SERVER['QUERY_STRING']);
    $url = $api.($method ? "/$method" : '').($function ? "/$function" : '').($params ? '?'. substr($params, 1, strlen($params)) : '').($isCached ? '   [CACHED]' : '').'   '.$_SERVER['REMOTE_ADDR'];
    $line = "[$time]: $domain  [$key]  /v$version/$url
";

    if (file_exists($filePath)) {
        if (filesize($filePath) > 1000000 * 50) {
            unlink($filePath);
        } else {
            $line .= file_get_contents($filePath);
        }
    }
    
    file_put_contents($filePath, $line);
}

function root() {
    global $version;
    return $_SERVER['DOCUMENT_ROOT'].'/v'.$version.'/';
}

include_once '/home/mapo/public_html/db.ini.php';
require_once '/home/mapo/public_html/apis/functions.inc.php';

$allowedTokens = array(
    ['id' => 1, 'token' => 'c196d0958608ad2b7d4af2be078ecc54', 'domain' => 'mapotechnology.com'],
    ['id' => 2, 'token' => '50e2c43f8f63ff0ed20127ee2487f15e', 'domain' => 'mapofire.com'],
    ['id' => 3, 'token' => 'cf707f0516e5c1226835bbf0eece4a0c', 'domain' => 'mapotrails.com'],
    ['id' => 4, 'token' => '97b9fb49574cc2e1ccd3f19bc5d94a8c', 'domain' => 'com.mapollc.main'],
    ['id' => 5, 'token' => 'bG9jYWxob3N0', 'domain' => 'localhost'],
    ['id' => 6, 'token' => '97b9fb49574cc2e1ccd3f19bc5d94a8c', 'domain' => 'com.mapollc.oreroads'],
    ['id' => 7, 'token' => '85f58fa255efe0f779e0dfcd62d87e6d', 'domain' => 'wildfiremap.org'],
    ['id' => 8, 'token' => '191eab18c50c8f5653bdeba13f219bed', 'domain' => 'fireweatheravalanche.org']
);

foreach ($allowedTokens as $i) {
    if ($i['token'] == $_REQUEST['key']) {
        $t = $i;
        break;
    }
}
////$t = mysqli_fetch_assoc(mysqli_query($con, "SELECT domain FROM apitokens WHERE token = '$_REQUEST[key]'"));

preg_match('/\/([A-Za-z0-9.]+)\//', $_SERVER['HTTP_REFERER'], $output_array);
$api = $_REQUEST['api'];
$method = $_REQUEST['method'];
$function = $_REQUEST['function'];
$format = $_REQUEST['format'];
$version = floatval($_GET['version']);
$allowBrowser = true;
$needSess = array('logFire', 'session', 'favorite', 'profile', 'trackFires', 'user', 'upload');
$needCon2 = array('favorite', 'trails', 'upload');
$isCached = false;

$ts = gmdate("D, d M Y H:i:s", time() + 900) . ' GMT';
header('Expires: '.$ts);
header('Pragma: cache');
header('Cache-control: max-age='.$ts);

if ($_SERVER['REQUEST_URI'] == '/') {
    header('Content-type: text/html');

    echo '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:150%;font-family:verdana;text-align:center"><h1>MAPO LLC</h1><h2>API Server v1.0</h2></div>';
} else {    
    if (!isset($_GET['version'])) {
        $returnJson = array('error' => array('response' => 'error', 'code' => 404, 'msg' => 'An API version has not been specified.'));
    } else {
        if (!$t) {
            $failed = 1;
            $returnJson = array('error' => array('response' => 'error', 'code' => 400, 'msg' => 'The token you specified is not valid'));
        } else {
            if (str_replace('www.', '', $output_array[1]) != $t['domain'] || strpos($output_array[1], $t['domain']) === false || $_SERVER['HTTP_REFERER'] != '') {
                if (/*in_array($api, $needSess) && */$_SERVER['HTTP_REFERER'] == '' && $allowBrowser === false) {
                    $failed = 1;
                    $returnJson = array('reponse' => 'error', 'code' => 403, 'msg' => 'You cannot access this data via browser window');
                } else {
                    /*if (in_array($api, $needSess)) {
                        session_start();
                    }*/
                    if (in_array($api, $needCon2)) {
                        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

                        if (mysqli_connect_errno()) {
                            echo 'Failed to connect to MySQL: ' . mysqli_connect_error();
                        }
                    }

                    switch ($api) {
                        case 'avalanche':
                            $file = 'avalanche';
                            break;
                        case 'billing':
                            $file = 'billing';
                            break;
                        case 'createChart':
                            $file = 'chart';
                            break;
                        case 'crowdsource':
                            $file = 'crowdsource';
                            break;
                        case 'dispatch':
                            $file = 'dispatch';
                            break;
                        case 'elevation':
                            $file = 'elevation';
                            break;
                        case 'evacuations':
                            $file = 'evacuations';
                            break;
                        case 'events':
                            $file = 'topfires';
                            break;
                        case 'favorite':
                            $file = 'favorite';
                            break;
                        case 'fire-weather':
                            $file = 'fire-wx';
                            break;
                        case 'forecast':
                            $file = 'forecast';
                            break;
                        case 'fwf':
                            $file = 'fwf';
                            break;
                        case 'geocode':
                            $file = 'geocode';
                            break;
                        case 'getWWA':
                            $file = 'getWWA';
                            break;
                        case 'incidentPhoto':
                            $file = 'incidentPhoto';
                            break;
                        case 'jurisdiction':
                            $file = 'jurisdiction';
                            break;
                        case 'lightning':
                            $file = 'lightning';
                            break;
                        case 'logFire':
                            $file = 'logFire';
                            break;
                        case 'manageApp':
                            $file = 'app';
                            break;    
                        case 'message':
                            $file = 'message';
                            break;
                        case 'nbm':
                            $file = 'nbm';
                            break;
                        case 'newReport':
                            $file = 'newReport';
                            break;
                        case 'nws':
                            $file = 'nws';
                            break;
                        case 'odot':
                            $file = 'odot';
                            break;
                        case 'oreroads':
                            $file = 'oreroads';
                            break;
                        case 'outlooks':
                            $file = 'outlooks';
                            break;
                        case 'profile':
                            $file = 'profile';
                            break;
                        case 'payment':
                            $file = 'payment';
                            break;
                        case 'raws':
                            $file = 'raws';
                            break;
                        case 'recaptcha':
                            $file = 'recaptcha';
                            break;
                        case 'report':
                            $file = 'state-report';
                            break;
                        case 'risk':
                            $file = 'risk';
                            break;
                        case 'roads':
                            $file = 'roads';
                            break;
                        case 'rth':
                            $file = 'rth';
                            break;
                        case 'rundown':
                            $file = 'rundown';
                            break;
                        case 'search':
                            $file = 'search';
                            break;
                        case 'session':
                            $file = 'session';
                            break;
                        case 'snowfall':
                            $file = 'wpc';
                            break;
                        case 'subscriptions':
                            $file = 'subscriptions';
                            break;
                        case 'spc':
                            $file = 'spc';
                            break;
                        case 'tfrs':
                            $file = 'tfrs';
                            break;
                        case 'trails':
                            $file = 'trails';
                            break;
                        case 'trackFires':
                            $file = 'track';
                            break;
                        case 'user':
                            $file = 'user';
                            break;
                        case 'usfs':
                            $file = 'usfs';
                            break;
                        case 'upload':
                            $file = 'upload';
                            break;
                        case 'versioning':
                            $file = 'version';
                            break;
                        case 'weather':
                            $file = 'weather';
                            break;
                        case 'webcams':
                            $file = 'webcams';
                            break;
                        case 'wildfires':
                            $file = 'wildfires';
                            break;
                        case 'winter':
                            $file = 'winter';
                            break;
                        case 'wwas':
                            $file = 'wwas';
                            break;
                    }

                    $failed = 0;
                    $path = '/home/mapo/public_html' . ($mapotrails == 1 ? '/mapotrails.com' : ($mapofire == 1 ? '/mapofire.com' : '')) . '/apis/'. ($mapotrails != 1 && $mapofire != 1 ? 'v' . $_GET['version'] . '/' : '') . $file . '.ini.php';

                    if (file_exists($path)) {
                        include_once $path;
                    } else {
                        $returnJson = array('response' => 'error', 'code' => 404, 'msg' => 'The API resource you\'re looking for doesn\'t exist.');
                    }
                }
            } else {
                $failed = 1;
                $returnJson = array('response' => 'error', 'code' => 401, 'msg' => 'The domain you\'re using is not authorized to use this token');
            }
        }
    }

    writeToLog($_REQUEST['key'], $t, $version, $api, $method, $function, $isCached);

    $elapsed = microtime(true) - $startAPITime;
    $now = time();
    $arr = array('apiVersion' => intval($_GET['version']), 'origin' => $output_array[1], 'time' => gmdate('Y-m-d\TH:i:sP', $updateForCacheTime ? $updateForCacheTime : time()), 'response' => ($elapsed > 1 ? round($elapsed, 3) . 's' : round($elapsed, 4) . 'ms'));
    $thereq = $api . ($method ? '/' . $method : '') . ($function ? '/' . $function : '');

    ////mysqli_query($con, "INSERT INTO apiUsage (request,token,origin,time,response,cache,elapsed) VALUES('$thereq','$_REQUEST[key]','$output_array[1]','$now','$failed','$cac','$elapsed')");

    // close all mysql connections
    mysqli_close($con);
    if ($con2) {
        mysqli_close($con2);
    }

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
                $returnJson->metadata = array_merge(['cache' => true], $tmp);
            }
        } else {
            $returnJson['metadata'] = $arr;
            if ($isCached) {
                $returnJson['metadata']['cache'] = true;
            }
        }
    }

    header('Content-type: application/json');
    header("Cache-Control: public, max-age=600");
    header("Expires: " . gmdate('D, d M Y H:i:s', time() + 600) . ' GMT');
    header("Last-Modified: " . gmdate('D, d M Y H:i:s') . ' GMT');
    header('Access-Control-Allow-Credentials: true');
    #header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Origin: ' . ($t && $output_array && ($t['domain'] == 'localhost' || $output_array[1] == '') ? '*' : 'https://'.$output_array[1]));

    if ($returnJson) {
        if ($format) {
            echo json_encode($returnJson, JSON_PRETTY_PRINT);
        } else {
            echo json_encode($returnJson);
        }
    }
}
