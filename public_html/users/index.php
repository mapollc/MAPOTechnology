<?
ini_set('display_errors', 1);
error_reporting(E_ERROR && E_PARSE);
ini_set('session.cookie_domain', '.mapotechnology.com');

header_remove('Cache-Control');
header_remove('Expires');
header_remove('Pragma');
header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
header('Expires: ' . gmdate('D, d M Y H:i:s', strtotime('-1 hour')) . ' GMT');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$baseURL = 'https://www.mapotechnology.com/';
$linkURL = 'https://www.mapotechnology.com/account/';
$productName = 'Map of Fire';
$companyName = 'MAPO LLC';
$queryParams = preg_replace('/(?:sort=[^&]*|order=[^&]*)(&?)/i', '$1', explode('?', $_SERVER['REQUEST_URI'])[1]);
$queryParams = $queryParams == '&' ? '' : $queryParams;
$queryParams = ltrim($queryParams, '&');

$page = $_GET['page'];
$pageFile = $_GET['page'] . '.ini.php';
$versions = array('leaflet' => '1.9.4', 'jquery' => '3.6.4');
$method = $_GET['method'] ? $_GET['method'] : false;
$function = $_GET['function'] ? $_GET['function'] : false;
$path = $page . ($method ? '/' . $method : '');
$baseRoot = '/home/mapo/public_html/';
$documentRoot = $baseRoot . 'users/';

include_once '../db.ini.php';
require_once './secure.inc.php';
include_once '/home/mapo/public_html/subs.inc.php';
require_once $baseRoot . '/vendor/autoload.php';

use UAParser\Parser;
$user_agent = Parser::create();

require_once 'permissions.inc.php';

// include leaflet on these pages only
$leafletPages = array('mapofire.ini.php');

// IF THE USER MUST BE A SUPER USER
$doNotEdit = array(1, 2);
$superAdmin = in_array($_SESSION['uid'], $doNotEdit) ? true : false;

switch ($path) {
    case 'home':
        $pageTitle = 'User Dashboard';
        break;
    case 'admin/people':
        $pageTitle = 'Manage Users';
        break;
    case 'admin/dispatch':
        $pageTitle = 'Manage Dispatch Centers';
        break;
    /*case 'admin/api-usage':
        $pageTitle = 'API Usage';
        break;*/
    case 'admin/log':
        $pageTitle = 'Activity Log';
        break;
    case 'settings':
        $pageTitle = 'Account Settings';
        break;
    case 'settings/devices':
        $pageTitle = 'Device Logins';
        break;
    case 'notifications':
        $pageTitle = 'Notifications';
        break;
    case 'billing':
        $pageTitle = 'Billing';
        break;
    case 'admin/wildfires':
        $pageTitle = 'Wildfire Management';
        break;
    case 'admin/crowdsource':
        $pageTitle = 'Crowdsourced Wildfire Reports';
        break;
    case 'admin/trails':
        $pageTitle = 'Trails Management';
        break;
    case 'admin/avalanches':
        $pageTitle = 'Avalanche Accidents';
        break;
    case 'admin/status':
        $pageTitle = 'Services Cache Status';
        break;
    /*case 'admin/snow':
        $pageTitle = 'Map-o-Snow Dashboard';
        break;
    case 'admin/webcams':
        $pageTitle = 'Webcam Management';
        break;*/
    case 'mapofire':
        $pageTitle = 'Map of Fire Settings';
        break;
    case 'mapotrails':
        $pageTitle = 'Trail Map Settings';
        break;
}

if (!file_exists($pageFile)) {
    $pageTitle = 'Page Not Found';
}

$securePages = array('wildfires', /*'billing',*/ 'admin');
$lock = '<i class="far fa-lock"></i>';
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">

<head>
    <title><?= ($pageTitle ? $pageTitle . ' - ' : '') . 'My Account | ' . $companyName ?></title>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
    <meta name="description" content="" rel="">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400;500;600&display=swap">
    <link rel="stylesheet" href="https://www.mapotechnology.com/src/css/global.css">
    <link rel="stylesheet" href="<?=$baseURL?>src/css/account.css">
    <script async src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <? if (in_array($pageFile, $leafletPages) || $method.$function == 'trailscreate' || $method.$function == 'trailsedit') { ?>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@<?=$versions['leaflet']?>/dist/leaflet.min.css">
    <? } ?>
    <link rel="shortcut icon" href="https://www.mapotechnology.com/images/favicon.ico" type="image/x-icon" />
    <link rel="canonical" href="<?= substr($baseURL, 0, -1) . $_SERVER['REQUEST_URI'] ?>" />
</head>

<body>
    <? if (!isset($_GET['ref']) && $_GET['ref'] != 'com.mapollc.mapofire') {?>
    <header>
        <div class="container">
            <div class="row align-center space-between">
                <div class="col">
                    <a href="https://www.mapotechnology.com/account/home"><img src="https://www.mapotechnology.com/assets/images/mapo_logo.png" style="height:35px"></a>
                </div>
                <div class="col">
                    <div id="menuIcon"><i class="far fa-bars"></i></div>
                </div>
            </div>
        </div>
    </header>
    <? } else { 
        echo '<div style="display:block;clear:both;margin:0.5em 0"></div>';
    } ?>

    <div class="sidebar">
        <div class="sidebar-wrapper">
            <?/*<span id="close-sidebar"><i class="fat fa-xmark"></i></span>*/ ?>
            <ul class="nav">
                <li><a href="<?=$linkURL?>home"><span>Home</span></a></li>
                <li><a href="<?=$linkURL?>settings"><span>Account</span></a></li>
                <? if($_SESSION['uid'] == 1 || $_SESSION['uid'] == 2172) {?>
                <li><a href="<?=$linkURL?>billing"><span>Billing</span></a></li>
                <?}
                if ($permission->user()->add() || $permission->user()->edit()) { ?>
                <li><a href="<?=$linkURL?>admin/people"><span>Manage Users</span><?=$lock?></a></li>
                <?}
                if ($permission->fire()->add() || $permission->fire()->edit()) {?>
                <li><a href="<?=$linkURL?>admin/wildfires"><span>Wildfire Management</span><?=$lock?></a></li>
                <?}
                if ($permission->view()->reports() || $permission->manage()->reports()) {?>
                <li><a href="<?=$linkURL?>admin/crowdsource"><span>Crowdsource Reports</span><?=$lock?></a></li>
                <?}
                if ($permission->manage()->dispatch()) {?>
                <li><a href="<?=$linkURL?>admin/dispatch"><span>Dispatch Centers</span><?=$lock?></a></li>
                <?}
                if ($permission->view()->avys()) {?>
                <li><a href="<?=$linkURL?>admin/avalanches"><span>Avalanche Accidents</span><?=$lock?></a></li>
                <?}
                if ($permission->trails()->add() || $permission->trails()->edit()->all() || $permission->trails()->edit()->own()) {?>
                <li><a href="<?=$linkURL?>admin/trails"><span>Manage Trails</span></a></li>
                <?}?>
                <li><a href="<?=$linkURL?>mapofire"><span>Map of Fire Settings</span></a></li>
                <li><a href="<?=$baseURL?>logout?<?=time()?>"><span>Logout</span></a></li>
            </ul>
        </div>
    </div>

    <section>
        <div class="container">
            <?
            if (!in_array($_GET['page'], $securePages) || (in_array($_GET['page'], $securePages) && $user['role'] == 'ADMIN')) {
                //// || $_GET['method'] == 'trails' && $user['role'] == 'TRAIL MODERATOR'*/) {
                if (file_exists($pageFile)) {
                    include_once './' . $pageFile;
                } else {
                    echo pageNotFound();
                }

                if ($con) {
                    mysqli_close($con);
                }
            } else {
                echo invalidPermissions();
            } ?>
        </div>
    </section>

    <? if (!isset($_GET['ref']) && $_GET['ref'] != 'com.mapollc.mapofire') {?>
    <footer>
        <div class="container">
            <div class="row space-between">
                <div class="col">
                    <p>&copy; <?=date('Y').' '.$companyName?></p>
                </div>
                <div class="col">
                    <ul class="inline-menu">
                        <li><a href="<?= $baseURL ?>about">About</a>
                        <li><a href="<?= $baseURL ?>about/contact">Contact</a>
                        <li><a href="<?= $baseURL ?>checkout?price_id=<?=$mapoSubscriptions['donate']['live']?>">Donate</a>
                        <li><a href="<?= $baseURL ?>about/legal/terms">Terms</a>
                        <li><a href="<?= $baseURL ?>about/legal/privacy">Privacy</a>
                    </ul>
                </div>
            </div>
        </div>
    </footer>
    <? } ?>

    <div id="shadow"></div>

    <script>let uid=<?= $_SESSION['uid'] ?>,userLocation<?= $user['location'] ? '=' . json_encode($user['location']) : '' ?>;</script>
    <? if (in_array($pageFile, $leafletPages) || $method.$function == 'trailscreate' || $method.$function == 'trailsedit') { ?>
    <script src="https://cdn.jsdelivr.net/npm/leaflet@<?=$versions['leaflet']?>/dist/leaflet-src.min.js"></script>
    <? } ?>
    <script src="<?=$baseURL?>src/js/account.js?<?=time()?>"></script>

</body>

</html>