<?
ini_set('display_errors', 0);
ini_set('session.cookie_domain', '.mapotechnology.com');
$baseURL = 'https://www.mapotechnology.com/';
$linkURL = 'https://www.mapotechnology.com/account/';
$productName = 'MAP-o-Fire';
$companyName = 'MAPO LLC.';

print_r($_SESSION);

include_once('../db.ini.php');
require_once('secure.inc.php');

$page = $_GET['page'];
$pageFile = $_GET['page'].'.ini.php';
$versions = array('leaflet' => '1.9.4', 'jquery' => '3.6.4');
$method = ($_GET['method'] ? $_GET['method'] : false);
$function = ($_GET['function'] ? $_GET['function'] : false);
$path = $page.($method ? '/'.$method : '');

// IF THE USER MUST BE A SUPER USER
$doNotEdit = array(1);
$superAdmin = in_array($_SESSION['uid'], $doNotEdit) ? true : false;
#$user['role'] = getUserRole($user['role']);

function invalidPermissions() {
    return '<div style="padding:200px 0;text-align:center"><h1 style="font-size:50px">Insufficient Permissions</h1><h3 style="padding:50px 0;font-weight:400">You do not have the proper permissions to access this page or content.</h3>'.
    '<a class="btn btn-lg" href="#" onclick="history.go(-1);return false">Go Back</a></div>';
}

function message($t, $m) {
    return '<div class="message '.($t === true ? 'success' : 'error').'">'.$m.'</div>';
}

switch($path) {
    case 'home'             : $pageTitle = 'User Dashboard';            break;
    case 'admin/people'     : $pageTitle = 'Manage Users';              break;
    case 'admin/dispatch'   : $pageTitle = 'Manage Dispatch Centers';   break;
    case 'admin/api-usage'  : $pageTitle = 'API Usage';                 break;
    case 'admin/log'        : $pageTitle = 'Activity Log';              break;
    case 'settings'         : $pageTitle = 'Account Settings';          break;
    case 'notifications'    : $pageTitle = 'Notifications';             break;
    case 'billing'          : $pageTitle = 'Billing';                   break;
    case 'admin/wildfires'  : $pageTitle = 'Wildfire Management';       break;
    case 'admin/trails'     : $pageTitle = 'Trails Management';         break;
    case 'admin/snow'       : $pageTitle = 'Map-o-Snow Dashboard';      break;
    case 'admin/webcams'    : $pageTitle = 'Webcam Management';         break;
    case 'mapofire'         : $pageTitle = 'Fire Map Settings';         break;
    case 'mapotrails'       : $pageTitle = 'Trail Map Settings';        break;
}

if (!file_exists($pageFile)) {
    $pageTitle = 'Page Not Found';
}

$securePages = array('wildfires', 'admin');
?>
<!DOCTYPE html>

<html lang="en-US" xmlns:og="http://ogp.me/ns#">
<head>
    <title><?=($pageTitle ? $pageTitle.' - ' : '' ).'My Account | '.$companyName?></title>
    <link rel="preconnect" href="//fonts.gstatic.com/">
    <link rel="preconnect" href="//services3.arcgis.com">
    <link rel="preconnect" href="//cdn.jsdelivr.net">
    <link rel="preconnect" href="//fontawesome.com">
    <link rel="preconnect" href="//ka-p.fontawesome.com">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
    <meta name="description" content="<?=$desc?>" rel="<?=$desc?>">
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="theme-color" content="#ffc65c" />
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@400&family=Dosis:wght@400;500;600&family=Noto+Sans:wght@200;400&display=swap">
    <link rel="stylesheet" href="https://www.mapotechnology.com/assets/css/global.css">
    <link rel="stylesheet" href="<?=$baseURL?>users/style.css?<?=time()?>">
    <script async src="https://kit.fontawesome.com/a107124392.js" crossorigin="anonymous"></script>
    <link rel="shortcut icon" href="https://www.mapotechnology.com/images/favicon.ico" type="image/x-icon" />
    <link rel="canonical" href="<?=substr($baseURL, 0, -1).$_SERVER['REQUEST_URI']?>" />
    <link rel="shortlink" href="<?echo $baseURL; if ($_GET){ echo '?'; foreach($_GET as $a => $b) { $c .= $a.'='.$b.'&'; } echo substr($c, 0, -1); }?>" />
</head>
<body>

<div class="wrapper">
    <div class="sidebar">
        <div class="sidebar-wrapper">
            <span id="close-sidebar"><i class="fat fa-xmark"></i></span>
            <ul class="nav">
                <li<?=($path == 'home' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>home"><i class="fal fa-house-blank"></i><span>Home</span></a>
                </li>

                <li<?=(strpos($path, 'settings') !== false ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>settings"><i class="fat fa-gear"></i><span>Account</span></a>
                </li>

                <?/*<li<?=($path == 'billing' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>billing"><i class="fat fa-file-invoice-dollar"></i><span>Billing</span></a>
                </li>*/?>

                <?if($user['permissions']['user']['add'] == 1 || $user['permissions']['user']['edit'] == 1) {?>
                <li<?=($path == 'admin/people' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/people"><i class="fat fa-users"></i><span>Manage Users</span></a>
                </li>
                <?}?>
                
                <?if($user['permissions']['fire']['add'] == 1 || $user['permissions']['fire']['edit'] == 1) {?>
                <li<?=($path == 'admin/wildfires' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/wildfires"><i class="fat fa-fire-alt"></i><span>Wildfire Management</span></a>
                </li>
                <?}?>

                <?if($user['permissions']['view']['api'] == 1) {?>
                <li<?=($path == 'admin/api-usage' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/api-usage"><i class="fat fa-webhook"></i><span>API Usage</span></a>
                </li>
                <?}?>
                
                <?if($user['permissions']['manage']['dispatch'] == 1){?>
                <li<?=($path == 'admin/dispatch' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/dispatch"><i class="fat fa-light-emergency-on"></i><span>Dispatch Centers</span></a>
                </li>
                <?}?>

                <?if($user['permissions']['trails']['add'] == 1 || $user['permissions']['trails']['edit']['all'] == 1 || $user['permissions']['trails']['edit']['own'] == 1) {?>
                <li<?=($path == 'admin/trails' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/trails"><i class="fat fa-person-hiking"></i><span>Manage Trails</span></a>
                </li>
                <?}?>
                
                <?if($user['permissions']['manage']['snow_dashboards'] == 1){?>
                <li<?=($path == 'admin/snow' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/snow"><i class="fat fa-snowflake"></i><span>Snow Dashboards</span></a>
                </li>
                <?}?>

                <?if($user['permissions']['manage']['webcams'] == 1){?>
                <li<?=($path == 'admin/webcams' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>admin/webcams"><i class="far fa-video"></i><span>Webcam Management</span></a>
                </li>
                <?}/*?>
                <li<?=($path == 'notifications' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>notifications"><i class="fat fa-bell"></i><span>Notifications</span></a>
                </li>
                <?}*/?>

                <li<?=($path == 'mapofire' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>mapofire"><i class="fat fa-map"></i><span>Fire Map Settings</span></a>
                </li>

                <?/*<li<?=($path == 'mapotrails' ? ' class="active"' : '')?>>
                    <a href="<?=$linkURL?>mapotrails"><i class="fat fa-person-hiking"></i><span>Trails Map Settings</span></a>
                </li>*/?>

                <li<?=($path == 'logout' ? ' class="active"' : '')?>>
                    <a href="<?=$baseURL?>logout"><i class="fat fa-arrow-left-to-line"></i><span>Logout</span></a>
                </li>
            </ul>
        </div>
    </div>
    <div class="main-panel">
        <div class="container">
            <div class="navbar">
                <div class="items">
                    <div class="p">
                        <div id="menuIcon"><i class="far fa-bars"></i></div>
                    </div>
                    <div class="p" style="text-align:center"><img class="logo" src="https://www.mapotechnology.com/assets/images/mapo_logo.png"></div>
                    <div class="p">
                        <div class="user" onclick="window.location.href='https://www.mapotechnology.com/account/settings'"><?=$user['firstInitial'].$user['lastInitial']?></div>
                    </div>
                </div>
            </div>
            <main>
                <div class="content">
                    <?
                    if (!in_array($_GET['page'], $securePages) || in_array($_GET['page'], $securePages) && $user['role'] == 'ADMIN' || $_GET['method'] == 'trails' && $user['role'] == 'TRAIL MODERATOR') {
                        if (file_exists($pageFile)) {
                            include_once($pageFile);
                        } else {
                            echo '<div style="padding:200px 0;text-align:center"><h1 style="font-size:50px">Page Not Found</h1><h3 style="padding:50px 0;font-weight:400">The link your clicked or URL you entered was not found. Try a different page.</h3>'.
                            '<a class="btn btn-lg" href="#" onclick="history.go(-1);return false">Go Back</a></div>';
                        }

                        if ($con) {
                            mysqli_close($con);
                        }
                    } else {
                        //echo '<div class="row"><div class="col"><div class="card" style="padding:200px 0;text-align:center">'.invalidPermissions().'</div></div></div>';
                        echo invalidPermissions();
                    }?>

                    <footer>
                        <ul class="menu">
                            <li><a href="<?=$baseURL?>about">About</a>
                            <li><a href="<?=$baseURL?>about/contact">Contact</a>
                            <li><a href="<?=$baseURL?>about/legal/terms">Terms</a>
                            <li><a href="<?=$baseURL?>about/legal/privacy">Privacy</a>
                        </ul>
                        <span>&copy; <?=date('Y').' '.$companyName?></span>
                    </footer>
                </div>
            </main>
        </div>
    </div>
</div>

<script>var uid=<?=$_SESSION['uid']?>,userLocation<?=($user['location'] ? '='.json_encode($user['location']) : '')?>;</script>
<script src="https://code.jquery.com/jquery-<?=$versions['jquery']?>.min.js"></script>
<?if($includeJqueryUI){?>
<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.js"></script>
<?}if($includeLeaflet){?>
<script src="https://cdn.jsdelivr.net/npm/leaflet@<?=$versions['leaflet']?>/dist/leaflet-src.min.js"></script>
<?}if($includeLeafletPM){?>
<script src="https://unpkg.com/leaflet.pm@2.2.0/dist/leaflet.pm.min.js"></script>
<?}if($includeChartjs){?>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.2.1/dist/chart.umd.min.js"></script>
<?}?>
<script src="<?=$baseURL?>users/main.js"></script>
</body>
</html>