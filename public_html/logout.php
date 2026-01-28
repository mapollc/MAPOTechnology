<?
ini_set('display_errors', 0);
error_reporting(E_ALL);

$domain = str_replace('www.', '', $_SERVER['HTTP_HOST']);

ini_set('session.cookie_domain', '.' . $domain);
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

include_once 'db.ini.php';

session_start();

function nextURL($next)
{
    global $isLoggedOut;
    if (!$isLoggedOut || !$next) return $next;

    $urlParts = explode('#', $next, 2);
    $base = $urlParts[0];
    $hash = isset($urlParts[1]) ? '#' . $urlParts[1] : '';

    $sep = (strpos($base, '?') !== false) ? '&' : '?';

    return $base . $sep . $isLoggedOut . $hash;
}

$time = time();
$token = $_SESSION['token'] ?? $_COOKIE['token'] ?? null;
$isLoggedOut = !isset($_GET['expired']) || $_GET['expired'] != 1 ? 'loggedOut=1' : '';
$secureURL = 'https://www.mapotechnology.com/secure/login?';

if ($token) {
    $user = prepareQuery('s', [$token], "SELECT u.uid FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid WHERE token = ? LIMIT 1");

    if ($user) {
        $q1 = prepareQuery('si', [$time, $user['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
    }

    prepareQuery('s', [$token], "UPDATE sessions SET expires = 0 WHERE token = ?");

    setcookie('token', '', $time - 3600 * 24 * 365.25, "/", "." . $domain, true);
    
    $_SESSION = [];
    $params = session_get_cookie_params();
    
    setcookie(
        session_name(),
        '',
        time() - 3600 * 24 * 365.25,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );

    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

$goto = '';

if (isset($_GET['expired'], $_GET['method']) && $_GET['expired'] == 1 && $_GET['method'] == 'login') {
    $service = urlencode($_GET['service'] ?? '');
    $next = urlencode($_GET['next'] ?? '');
    $goto = $secureURL . "fail=2" . (!empty($service) ? "&service=$service" : '') . (!empty($next) ? "&next=$next" : '');
} else if (isset($_GET['next'])) {
    $goto = nextURL($_GET['next']);
} else if ($domain !== 'mapotechnology.com') {
    $sub = explode('.', $domain)[0];
    $goto = $secureURL . (!empty($sub) ? "service=$sub" : '');
} else {
    $goto = $secureURL . $isLoggedOut;
}

#echo $goto;
header("Location: $goto");
exit();