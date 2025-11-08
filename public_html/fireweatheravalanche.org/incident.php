<?
////ini_set('display_errors',1);
////error_reporting(E_ALL);
$host = str_replace('www.', '', $_SERVER['HTTP_HOST']);

ini_set('session.cookie_domain', ".$host");
header('Cache-Control: must-revalidate, public, max-age=900');
header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 900));
header('Pragma: cache');
header('Last-Modified: '.gmdate('D, d M Y H:i:s \G\M\T', filemtime('/home/mapo/public_html/mapofire.com/mf-incident.php')));
header('Content-type: text/html');

session_start();

$mapoURL = 'https://www.mapotechnology.com/';
$baseURL = 'https://www.mapofire.com/';

// get the current map version to load all relevant files
$version = !$_GET['version'] ? '2.2' : $_GET['version'];

// mapbox sdk version
$mapboxVersion = '3.9.2';

//ga4 ID
$ga_id = $host == 'wildfiremap.org' ? 'G-2DNCL70GJF' : 'G-X03WWLX3BJ';

// login link
$loginLink = $mapoURL.'secure/login?service='.explode('.', $host)[0].'&next='.urlencode('https://www.'.$host.$_SERVER['REQUEST_URI']);

if (!isset($_COOKIE['token']) && $_SESSION['uid']) {
    header("Location: $loginLink");
    exit();
}

$noMysql = true;
include_once '/home/mapo/public_html/db.ini.php';
include_once '/home/mapo/public_html/subs.inc.php';

function metaDesc($fireName, $near, $near_long, $acres, $fire) {
    $size = floatval(str_replace(',', '', $acres));
    $adj = $size < 1000 ? ' small' : ($size > 100000 ? 'n extremely' : ($size > 10000 ? ' significantly' : '')).' large';
    $previousYear = date('Y', $fire->time->discovered) < date('Y') ? true : false;
    $s = 'The '. $fireName.($previousYear ? ' near '.$near_long.',' : '');
    $type = function ($fire) {
        $t = '';
        if (strpos(strtolower($fire->properties->notes), 'lightning') !== false) {
            $t = ', lightning-caused';
        }
        return $t . ' ' . strtolower($fire->properties->type);
    };

    if ($previousYear) {
        if ($fire->properties->status->Contain) {
            $contain = ' It was contained on ' . date('F j, Y', $fire->properties->status->Contain) . '.';
        }
    
        if ($fire->properties->status->Out) {
            $contain = ' It was fully extinguished '.date('F j, Y', $fire->properties->status->Out).'.';
        }

        $s .= ' was a' . $adj . $type($fire) . ' that burned ' . $acres . ' acres in ' . date('F Y', $fire->time->discovered) . '.' . $contain;
    } else {
        if ($fire->properties->containment != 'N/A') {
            $progress = ' and is ' . $fire->properties->containment . ' contained';
        }
    
        $s .= ', a' . $adj . ' ' . strtolower($fire->properties->type) . ' located ' . $near . ', was discovered on ' . date('F j, Y', $fire->time->discovered) . '. ';

        if ($fire->properties->containment == '100%') {
            $s .= 'The fire was fully contained at ' . $acres . ' acres.';
        } else {
            $s .= 'The fire is currently ' . $acres . ' acres' . $progress . '.';
        }
    }

    return $s;
}

// list of common fire agencies
$agencies = [
    'US Forest Service' => 'USFS',
    'Bureau of Land Management' => 'BLM',
    'Bureau of Indian Affairs' => 'BIA',
    'National Park Service' => 'NPS',
    'Bureau of Reclamation' => 'BOR',
    'US Fish & Wildlife Service' => 'USFWS',
    'Oregon Department of Forestry' => 'ODF',
    'Department of Natural Resources' => 'DNR',
    'Idaho Department of Lands' => 'IDL',
    'California Department of Forestry & Fire Protection' => 'CAL FIRE',
    'California Department of Forestry and Fire Protection' => 'CAL FIRE',
    'Arizona Department of Forestry and Fire Management' => 'Arizona DFFM'
];

function getStatus($s, $n) {
    return $s == null ? (strpos($n, 'contain') === true ? 'contained' : (strpos($n, 'control') === true ? 'controlled' : 'active')) : ($s->Out ? 'out' : ($s->Control ? 'controlled' : ($s->Contain ? 'contained' : '')));
}

function numberFormat($n) {
    $e = explode('.', $n);
    $n = number_format(intval($e[0]), 0, '.', ',');
    return $n.(count($e) > 1 ? '.'.$e[1] : '');
}

function stringCase($string) {
    return preg_replace_callback('/(\-|\/)([a-z])/', function($m) { return strtoupper($m[0]); }, ucwords(strtolower($string)));
}

function fireName($n, $t, $i) {
    $s = explode('-', $i);
    
    if ($t == 'Prescribed Fire') {
        $o = strpos($n, 'RX') === true ? $n : $n.' RX';
    } else if ($t == 'Smoke Check') {
        $o = 'Smoke Check #'.ltrim(strval($s[2]), '0');
    } else {
        $o = !$n ? '' : rtrim($n == '' ? 'Incident #' + intval($s[2]) :stringCase($n), ' ').' Fire';
    }
    return $o;
}

if ($_SERVER['HTTP_X_REQUESTED_WITH'] == 'com.mapollc.mapofire' || $_GET['app'] == 1) {
    $android = 1;
}

// load the current index.php file for the version
if (file_exists('/home/mapo/public_html/mapofire.com/v' . $version . '/mf-incident.php')) {
    require_once '/home/mapo/public_html/mapofire.com/v' . $version . '/mf-incident.php';
} else {
    http_response_code(404);
}
