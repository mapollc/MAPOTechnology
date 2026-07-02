<?
$domain = str_replace('www.', '', $_SERVER['HTTP_HOST']);

ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('session.cookie_domain', ".$domain");

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');

include_once 'config.inc.php';

session_start();

function nextURL($next)
{
    global $isLoggedOut;
    if (!$next) return $next;

    $allowedDomains = [
        'mapofire.com',
        'mapotrails.com',
        'wildfiremap.org',
        'fireweatheravalanche.org',
        'mapotechnology.com',
        'apps.mapotechnology.com'
    ];

    $parsed = parse_url($next);
    if (!isset($parsed['host'])) return '';

    foreach ($allowedDomains as $allowed) {
        if (stripos($parsed['host'], $allowed) !== false) {
            $urlParts = explode('#', $next, 2);
            $base = $urlParts[0];
            $hash = isset($urlParts[1]) ? '#' . $urlParts[1] : '';
            $sep = (strpos($base, '?') !== false) ? '&' : '?';
            return "$base$sep$isLoggedOut$hash";
        }
    }
    return '';
}

$time = time();
$token = $_SESSION['token'] ?? $_COOKIE['token'] ?? null;
$isLoggedOut = !isset($_GET['expired']) || $_GET['expired'] != 1 ? 'loggedOut=1' : '';
$secureURL = 'https://auth.mapotechnology.com/login?';
$isMainDomain = $domain === 'mapotechnology.com';

if ($token) {
    $user = executeQuery('s', [$token], "SELECT u.uid FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid WHERE token = ? LIMIT 1");
    if ($user) executeQuery('si', [$time, $user['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");

    executeQuery('s', [$token], "UPDATE sessions SET expires = 0 WHERE token = ?");

    setcookie('token', '', [
        'expires' => $time - 31557600, // 60 * 60 * 24 * 365.25
        'path' => '/',
        'domain' => ".$domain",
        'secure' => true,
        'httponly' => false,
        'samesite' => 'Lax'
    ]);

    $params = session_get_cookie_params();

    setcookie(session_name(), '', [
        'expires' => $time - 31557600, // 60 * 60 * 24 * 365.25
        'path' => $params['path'],
        'domain' => $params['domain'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite']
    ]);

    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
}

$goto = '';
$next = $_GET['next'] ?? '';
$service = urlencode($_GET['service'] ?? '');

if (isset($_GET['expired'], $_GET['method']) && $_GET['expired'] == 1 && $_GET['method'] == 'login') {
    $next = urlencode($next);
    $goto = $secureURL . "fail=2" .
        (!empty($service) ? "&service=$service" : '') .
        (!empty($next) ? "&next=$next" : '');
} else if (!$isMainDomain) {
    $sub = explode('.', $domain)[0];
    $mainLogoutNext = $next ? nextURL($next) : '';

    $goto = "https://mapotechnology.com/logout";
    $query['sso'] = 1;
    if (!empty($sub)) $query['service'] = $sub;
    if ($mainLogoutNext) $query['next'] = $mainLogoutNext;

    if (!empty($query)) {
        $goto .= '?' . http_build_query($query);
    }
} else {
    if ($_GET['sso'] == 1) {
        $redirect = match ($service) {
            'mapofire' => 'mapofire.com',
            'mapotrails' => 'mapotrails.com',
            'apps' => 'apps.mapotechnology.com'
        };

        $goto = $next ?: ($service ? "//$redirect" : $secureURL) . '?loggedOut=1';
    } else {
        $goto = $secureURL . ($next ? 'next=' . urlencode(nextURL($next)) : $isLoggedOut);
    }
}

#echo $goto;
header("Location: $goto");
exit();
