<?
$mapotrails = 1;
require_once('/home/mapo/public_html/apis/index.php');

exit();
#ini_set('display_errors', 1);
#error_reporting(E_ALL);
ini_set('session.cookie_domain', '.mapotrails.com');
session_set_cookie_params(0, '/', '.mapotrails.com');
session_start();

$start = microtime(true);
date_default_timezone_set('America/Los_Angeles');

include('../../db.ini.php');

/*function get_data($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json','version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch); 
   
    return json_decode($output, TRUE);
}

function get_data2($url){
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json','version=1'));
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36');
    $output = curl_exec($ch);
    curl_close($ch); 
   
    return $output;
}

function distance($lat1, $lon1, $lat2, $lon2) {
    $theta = floatval($lon1) - floatval($lon2);
    $dist  = sin(deg2rad(floatval($lat1))) * sin(deg2rad(floatval($lat2))) + cos(deg2rad(floatval($lat1))) * cos(deg2rad(floatval($lat2))) * cos(deg2rad($theta));
    $dist  = acos($dist);
    $dist  = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;
    return round($miles, 2);
}*/

$t = mysqli_fetch_assoc(mysqli_query($con, "SELECT domain FROM apitokens WHERE token = '$_REQUEST[key]'"));

preg_match('/\/([A-Za-z0-9.]+)\//', $_SERVER['HTTP_REFERER'], $output_array);
$api = $_REQUEST['api'];
$method = $_REQUEST['method'];
$format = $_REQUEST['format'];
$needSess = array('logFire', 'session', 'trackFires', 'user');

if (!$t) {
    $returnJson = array('error' => array('code' => 401, 'message' => 'The token you specified is not valid'));
} else {
    if (str_replace('www.', '', $output_array[1]) == $t['domain'] || $_SERVER['HTTP_REFERER'] == '') {
        //header('Access-Control-Allow-Origin: https://www.'.$t['domain']);

        /*if (in_array($api, $needSess) && $_SERVER['HTTP_REFERER'] == '') {
            $returnJson = array('error' => array('code' => 403, 'message' => 'You cannot access this data via window browser'));
        } else {*/
            if (in_array($api, $needSess)) {

            }
        
            switch ($api) {
                case 'events': $file = 'topfires'; break;
                case 'forecast': $file = 'forecast'; break;
                case 'getWWA': $file = 'getWWA'; break;
                case 'logFire': $file = 'logFire'; break;
                case 'nbm': $file = 'nbm'; break;
                case 'newReport': $file = 'newReport'; break;
                case 'nws': $file = 'nws'; break;
                case 'odot': $file = 'odot'; break;
                case 'risk': $file = 'risk'; break;
                case 'search': $file = 'search'; break;
                case 'session': $file = 'session'; break;
                case 'trackFires': $file = 'track'; break;
                case 'user': $file = 'user'; break;
                case 'wwas': $file = 'wwas'; break;
            }
            
            include_once($file.'.ini.php');
        //}
    } else {
        $returnJson = array('error' => array('code' => 500, 'message' => 'The domain you\'re using is not authorized to use this token'));
    }
}

mysqli_close($con);

$elapsed = microtime(true) - $start;

$returnJson['metadata'] = array('apiVersion' => $_GET['version'], 'origin' => $output_array[1], 'time' => gmdate('Y-m-d\TH:i:s'), 'response' => ($elapsed > 1 ? round($elapsed, 3).'s' : round($elapsed, 4).'ms'));

header('Access-Control-Allow-Origin: *');
header('Content-type: application/json');

echo ($format ? json_encode($returnJson, JSON_PRETTY_PRINT) : json_encode($returnJson));
?>