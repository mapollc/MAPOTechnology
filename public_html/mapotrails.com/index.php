<?
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);

function ing($t)
{
    return (substr($t, -1) == 'e' ? substr($t, 0, -1) . 'ing' : (substr($t, -1) == 'i' || substr($t, -1) == 'b' ? $t . 'ing' : $t));
}

// set the base URL for this app
$host = preg_replace('/(www\.)?([a-z]+)\.([a-z]+)/', '$2.$3', $_SERVER['HTTP_HOST']);
$rootURL = "https://www.$host/";
$baseURL = '//mapotrails.com/';
$root = '/home/mapo/public_html/mapotrails.com/';

// get the current map version to load all relevant files
$version = trim($_GET['version'] ?? '') ?: file_get_contents("$root/version.txt");
$appPath = "{$root}dist/app-$version.php";

// get build date
$buildDate = date('Y-m-d\TH:i:sP', filemtime("$root/dist/$version/js/app.js"));

//ga4 ID
$ga_id = 'G-4KN1GPWFWM';

ini_set('session.cookie_domain', ".$host");

header('Cache-Control: must-revalidate, public, max-age=3600');
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 3600));
header('Pragma: cache');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T', filemtime("{$root}index.php")));
header('Content-type: text/html');

include_once '/home/mapo/guid.inc.php';

session_start();

setupGUID('mapotrails.com');

// use the script to update user's last active time
if (isset($_SESSION['visited']) && time() - $_SESSION['visited'] > 600) {
    require_once '/home/mapo/database.inc.php';
    executeQuery('ii', [time(), $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
    mysqli_close($con);
}
$_SESSION['visited'] = time();

// load the current index.php file for the version
if (file_exists($appPath)) {
    $javascript = !isset($_GET['version']) ? "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','$ga_id',{'user_id':'$_COOKIE[guid]'});" : "function gtag(){}";

    $isLoggedIn = $_SESSION['token'] ? 'true' : 'false';
    $javascript .= "window.isAuthUser=$isLoggedIn;";
    $javascript .= "const VERSION='$version',";
    $javascript .= "BUILD_DATE='$buildDate',";
    $javascript .= "defaultTitle='{{title}}',defaultDesc='{{desc}}'";

    if (isset($_GET['tid'])) $javascript .= ",FIND_TRAIL=true,QUERY_TRAIL_ID={$_GET['tid']}";

    $javascript = preg_replace('/(\n|\r|\s{2,})/', '', "$javascript;");

    require_once $appPath;
    return;
}

http_response_code(404);
include_once '../error.php';
