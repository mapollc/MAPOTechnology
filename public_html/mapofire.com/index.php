<?
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);

// set the base URL for this app
$host = preg_replace('/(www\.)?([a-z]+)\.([a-z]+)/', '$2.$3', $_SERVER['HTTP_HOST']);
$rootURL = "https://www.$host/";
$baseURL = '//mapofire.com/';
$root = '/home/mapo/public_html/mapofire.com/';

// get the current map version to load all relevant files
$version = trim($_GET['version'] ?? '') ?: file_get_contents("$root/version.txt");
$appPath = "{$root}dist/app-$version.php";

// get build date
$buildDate = date('Y-m-d\TH:i:sP', filemtime("$root/dist/$version/js/app.js"));

//ga4 ID
$ga_id = 'G-X03WWLX3BJ';

ini_set('session.cookie_domain', ".$host");

header('Cache-Control: must-revalidate, public, max-age=3600');
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 3600));
header('Pragma: cache');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', filemtime("{$root}index.php")));
header('Content-type: text/html');

require_once "{$root}layers.inc.php";
include_once '/home/mapo/guid.inc.php';

session_start();

setupGUID('mapofire.com');

// use the script to update user's last active time
if (isset($_SESSION['visited']) && time() - $_SESSION['visited'] > 600) {
    require_once '/home/mapo/database.inc.php';
    executeQuery('ii', [time(), $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
    mysqli_close($con);
}
$_SESSION['visited'] = time();

$provinces = ['alberta', 'british columbia', 'manitoba', 'new brunswick', 'newfoundland', 'northwest territories', 'nova scotia', 'nunavut', 'ontario', 'prince edward island', 'quebec', 'saskatchewan', 'yukon'];
$states = [...$provinces, 'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'district of columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming'];

// redirect for misinformed urls
if (isset($_GET['state']) && !in_array(strtolower(str_replace('-', ' ', $_GET['state'])), $states)) {
    header("Location: $baseURL");
}

if (isset($_GET['wfid']) && !isset($_GET['firestate']) && isset($_GET['name'])) {
    header("Location: $baseURL");
    exit();
}

// validate if the user is trying to pull up a state fire map that IS valid
if (isset($_GET['state']) && in_array(str_replace('-', ' ', $_GET['state']), $provinces) && isset($_GET['county'])) {
    header("Location: $baseURL" . "state/$_GET[state]");
    exit();
}

// redirect users if they're trying to view a country AND historical wildfire map
if (isset($_GET['country']) && isset($_GET['archive'])) {
    header("Location: $baseURL" . ltrim(rtrim(preg_replace('/archive=([0-9]+)&?/', '', $_SERVER['REQUEST_URI']), '?'), '/'));
    exit();
}

// parse layers json from layers.inc.php
$jsLayers = json_encode($layers);
$jsLayers = str_replace('perms2', 'perms', preg_replace('/(,"perms":(true|false))/', '', $jsLayers));

// load the current index.php file for the version
if (file_exists($appPath)) {
    //$dark_mode = $_COOKIE['dark_mode'] && $_COOKIE['dark_mode'] == 'true' ? true : false;

    $country = ucwords(str_replace('-', ' ', $_GET['country']));
    $state = ucwords(str_replace('-', ' ', $_GET['state']));
    $county = ucwords(str_replace('-', ' ', $_GET['county']));

    if (!isset($_GET['version'])) {
        $javascript = "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-X03WWLX3BJ',{'user_id':'$_COOKIE[guid]'});";
    } else {
        $javascript = "function gtag(){}";
    }

    $isLoggedIn = $_SESSION['token'] ? 'true' : 'false';
    $javascript .= "window.isAuthUser=$isLoggedIn;
    const VERSION='$version',
    BUILD_DATE='$buildDate',
    country=" . ($country ? "'$country'" : 'null') . ",
    state=" . ($state ? "'$state'" : 'null') . ",
    county=" . ($county ? "'$county'" : 'null') . ",
    defaultTitle='{{title}}',
    defaultDesc='{{desc}}'," .
        ($_GET['archive'] ? "historical='$_GET[archive]'," : '') .
        "layers=$jsLayers;";

    $javascript = preg_replace('/(\n|\r|\s{2,})/', '', $javascript);

    require_once $appPath;
    return;
}

http_response_code(404);
include_once '../error.php';
