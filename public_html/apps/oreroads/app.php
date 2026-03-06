<?
if (function_exists('opcache_invalidate')) {
    opcache_invalidate($path, true);
}

date_default_timezone_set('America/Los_Angeles');
session_start();

$stableVersion = '1.6';

include_once '/home/mapo/guid.inc.php';
setupGUID();

/*if ($_SERVER['SCRIPT_URI'] == 'https://www.mapotechnology.com/oregonroads/app') {
    header('Location: https://apps.mapotechnology.com/oregonroads');
    exit();
}

if (strpos($_SERVER['REQUEST_URI'], 'oreroads') !== false) {
    header('Location: ..'.str_replace('oreroads', 'oregonroads', $_SERVER['REQUEST_URI']));
    exit();
}*/

// use the script to update user's last active time
if (isset($_SESSION['visited']) && time() - $_SESSION['visited'] > 600) {
    require_once '/home/mapo/database.inc.php';
    executeQuery('ii', [time(), $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
    mysqli_close($con);
}
$_SESSION['visited'] = time();

$title = 'Oregon Roads - Winter Road Conditions and Traveler Information by MAPO LLC';
$desc = 'Find current Oregon road conditions, roadside camera images, and weather information using TripCheck.com data in our intuitive app.';

$files = ['app.css','app.js','init.js'];
$times[] = filemtime('./oreroads/app.php');

foreach ($files as $file) {
    $times[] = filemtime('./oreroads/v'.$version.'/'.$file);
}

$build = date('Y-m-d\TH:i:sO', max($times));
$version = isset($_GET['version']) ? $_GET['version'] : $stableVersion;

include_once "/home/mapo/public_html/apps/oreroads/v$version/app.php";