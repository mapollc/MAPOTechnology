<?
ini_set('display_errors', 0);
error_reporting(E_ALL);

$domain = str_replace('www.', '', $_SERVER['HTTP_HOST']);

ini_set('session.cookie_domain', '.'.$domain);
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

include_once 'db.ini.php';

session_start();

function nextURL($next){
    $cleanNext = preg_replace('/(\#[0-9.]+\/[0-9\-\.]+\/[0-9\-\.]+)/', '', $next);

    if (strpos($cleanNext, 'next=') !== false) {
        $parts = explode('next=', $cleanNext);
        return $parts[0] . 'next=' . urlencode($parts[1]) . (strpos($next, '?') !== false ? '&' : '?') . 'loggedOut=1';
    }

    return $next . (strpos($next, '?') !== false ? '&' : '?') . 'loggedOut=1';
}

$time = time();
$uid = isset($_SESSION['uid']) && is_numeric($_SESSION['uid']) ? intval($_SESSION['uid']) : null;
$token = $_SESSION['token'] ?? $_COOKIE['token'] ?? null;

if (/*$uid && */$token) {
    if ($uid) {
        $q1 = prepareQuery('si', [$time, $uid], "UPDATE users SET last_active = ? WHERE uid = ?");
    }
    $q2 = prepareQuery('s', [$token], "UPDATE sessions SET expires = 0 WHERE token = ?");

    if ($q1 && $q2) {
        setcookie('token', '', $time - 3600 * 24 * 7, '/', '.'.$domain, true);
        $_SESSION = [];
        
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 60 * 60 * 24 * 45,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );

        session_destroy();
        session_regenerate_id(true);
    }
}

$goto = 'https://www.mapotechnology.com/secure/login?loggedOut=1';

if (isset($_GET['expired']) && $_GET['expired'] == 1 && isset($_GET['method']) && $_GET['method'] == 'login') {
    $goto .= '&service=' . ($_GET['service'] ?? '') . '&next=' . urlencode($_GET['next'] ?? '');
} else if (isset($_GET['next'])) {
    $goto = nextURL($_GET['next']);
} else if ($domain != 'mapotechnology.com') {
    $goto .= '&service=' . explode('.', $domain)[0];
}

#echo $goto;
header("Location: $goto");
exit();