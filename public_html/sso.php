<?
$vars = '';
$domain = str_replace(['www.', 'apps.'], ['', ''], $_SERVER['HTTP_HOST']);

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('session.cookie_domain', ".$domain");
session_start();

$noMysql = false;
require '/home/mapo/public_html/db.ini.php';

// create the URI for failed authentication
if (isset($_GET['service'])) {
    $vars .= '&service='.$_GET['service'];
}
if (isset($_GET['prod'])) {
    $vars .= '&prod='.$_GET['prod'];
}
if (isset($_GET['next'])) {
    $vars .= '&next='.urlencode($_GET['next']);
}
$next = $_REQUEST['next'];
$redirectURL = '';
$failURL = 'https://www.mapotechnology.com/secure/login';

// if the user is already logged in, just go to the next URL
/*if (isset($_SESSION['uid']) && $_SESSION['expires'] > time()) {
    header("Location: $next");
    exit();
}*/

if ($_REQUEST['token']) {
    $token = $_REQUEST['token'];

    // check if the token is valid and came from this server
    if (validToken($token)) {
        if ($_GET['next']) {
            $next = $_GET['next'];
        } else {
            if ($_GET['service'] == 'apps') {
                $next = 'https://apps.mapotechnology.com' . ($_GET['prod'] ? '/'.$_GET['prod'] : '');
            } else {
                $next = 'https://'.$domain;
            }
        }
    
        $json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/user/get?key='.$apiKey.'&token=' . $_REQUEST['token']), true);

        if ($json['response'] && $json['response'] == 'error') {
            $qs = preg_replace('/token=(.*?)&/', '', $_SERVER['QUERY_STRING']);
    
            $_SESSION = array();
            session_regenerate_id();
            setcookie('token', '', time() - 60 * 60 * 24 * 30, '/', ".$domain", true);
    
            $redirectURL = 'https://www.mapotechnology.com/secure/login?fail=3'.($qs ? '&'.$qs : '');
        } else {
            $user = $json['user'];
            $_SESSION['uid'] = $user['uid'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name'] = $user['last_name'];
            $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['token'] = $user['token'];
            $_SESSION['expires'] = $user['expires'];
            $_SESSION['subscriptions'] = json_encode($subscribe);
    
            setcookie('token', $user['token'], $user['expires'], '/', ".$domain", true);

            $redirectURL = $next;
        }
    } else {
        $redirectURL = "$failURL?fail=3$vars";
    }
} else {
    $redirectURL = "$failURL?fail=3$vars";
}

////echo $redirectURL;
header("Location: $redirectURL");
exit();