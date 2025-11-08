<?
require_once 'coming-soon.html';
exit();

ini_set('display_errors', 1);
$version = $_GET['version'] ? $_GET['version'] : '2.2';

if ($version == '2.0') {
    include_once '../subs.inc.php';
    $buildDate = date('Y-m-d\TH:i:sO', max(filemtime('./v' . $version . '/index.php'), filemtime('./v' . $version . '/main.js'), filemtime('./v' . $version . '/main.css')));
    $domain = '//mapotrails.com/';
    ini_set('session.cookie_domain', '.mapotrails.com');

    header('Cache-Control: public, max-age=604800');
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 604800));
    header('Content-Encoding: gzip, compress, br');

    session_start();

    /*if (!isset($_SESSION['uid'])) {
    header('Location: https://www.mapotechnology.com/secure/login?src=mapotrails&next='.urlencode($_SERVER['REQUEST_URI']));
    exit();
}

if ($_SESSION['role'] != 'ADMIN') {
    header('Location: https://www.mapotechnology.com');
    exit();
}*/

    function ing($t)
    {
        if ($t == 'Atv') {
            return 'ATV';
        } else {
            if (substr($t, -1) == 'e') {
                return substr($t, 0, strlen($t) - 1) . 'ing';
            } else {
                return $t;
            }
        }
    }

    if ($_GET['logout'] == 1) {
        $_SESSION = array();
        session_regenerate_id();
        setcookie('token', '', time() - (60 * 60 * 24 * 7), '/', '.mapotrails.com');
    }

    $user = array('uid' => null);

    if (isset($_SESSION['uid'])) {
        $user = array(
            'uid' => $_SESSION['uid'],
            'first_name' => $_SESSION['first_name'],
            'last_name' => $_SESSION['last_name'],
            'name' => $_SESSION['name'],
            'role' => $_SESSION['role'],
            'token' => $_COOKIE['token']
        );
    }

    $layers = array('trailheads' => true, 'trails' => true, 'snotel' => false, 'waypoints' => true, 'avy' => ($_GET['category'] == 'snow' ? true : false), 'fsadmin' => false, 'contours' => false, 'radar' => false);
    $settings = array('center' => array(44.75603319, -117.43075129), 'zoom' => 6.4, 'tile' => 'outdoors');

    if ($_SESSION['uid']) {
        $con = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_main');
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM trail_settings WHERE uid = '$_SESSION[uid]'"));

        if ($row['settings'] != '' && $row['settings'] != 'null') {
            $settings = json_decode($row['settings'], true);
        }

        mysqli_close($con);
    }

    /*if (!$_SESSION['mtsettings'] && $_SESSION['uid']) {
    include('../db.ini.php');
    $user_settings = unserialize(mysqli_fetch_assoc(mysqli_query($con, "SELECT settings FROM trail_settings WHERE uid = '$_SESSION[uid]'"))['settings']);
    mysqli_close($con);
    
    if ($user_settings) {
        $_SESSION['mtsettings'] = $user_settings;
    } else {
        $_SESSION['mtsettings'] = $settings;
    }
} else if ($_SESSION['mtsettings']) {
    $settings = ($_SESSION['mtsettings'] ? json_decode($_SESSION['mtsettings'], true) : $settings);
}*/

    $settings['category'] = ($_GET['category'] ? $_GET['category'] : 'trail');

    if (!$settings['layers']) {
        $settings['layers'] = $layers;
    }

    if ($_GET['activity']) {
        $settings['activity'] = $_GET['activity'];
    }

    if ($_GET['area']) {
        $settings['area'] = $_GET['area'];
    }

    if ($_GET['tid']) {
        $settings['tid'] = $_GET['tid'];
    }

    $settings['version'] = array($version, (substr($version, -2) == '.0' ? substr($version, 0, -2) : $version));

    require './v' . $version . '/index.php';
} else {
    ini_set('session.cookie_domain', '.mapotrails.com');
    session_start();

    include_once '/home/mapo/public_html/subs.inc.php';

    $domain = '//mapotrails.com/';
    $cdn = '//cdn.mapotrails.com/';

    // get last modified time for the app's build date/time
    $files = ['index.php','mt.app.css','mt.app.js'];
    foreach ($files as $file) {
        if (file_exists($file)) {
            $times[] = filemtime('./v'.$version.'/'.$file);
        }
    }
    $buildDate = date('Y-m-d\TH:i:sO', max($times));

    function ing($t){
        if ($t == 'Atv') {
            return 'ATV';
        } else {
            if (substr($t, -1) == 'e') {
                return substr($t, 0, strlen($t) - 1) . 'ing';
            } else {
                return $t;
            }
        }
    }
    /*$settings['category'] = $_GET['category'] ? $_GET['category'] : 'trail';

    if (!$settings['layers']) {
        $settings['layers'] = $layers;
    }

    if ($_GET['activity']) {
        $settings['activity'] = $_GET['activity'];
    }

    if ($_GET['area']) {
        $settings['area'] = $_GET['area'];
    }

    if ($_GET['tid']) {
        $settings['tid'] = $_GET['tid'];
    }

    $settings['version'] = array($version, (substr($version, -2) == '.0' ? substr($version, 0, -2) : $version));*/

    // load the current index.php file for the version
    if (file_exists('./v' . $version . '/index.php')) {
        require_once './v' . $version . '/index.php';
    } else {
        http_response_code(404);
    }
}