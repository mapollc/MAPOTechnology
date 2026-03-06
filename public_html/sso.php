<?
$domain = str_replace(['www.', 'apps.'], '', $_SERVER['HTTP_HOST']);

ini_set('display_errors', 0);
error_reporting(E_ERROR | E_PARSE);
ini_set('session.cookie_domain', ".$domain");
session_start();

require '/home/mapo/public_html/db.ini.php';

$vars = '';
$time = time();
$token = trim($_REQUEST['token'] ?? '');
$next = $_REQUEST['next'] ?? '';
$redirectURL = '';
$failURL = 'https://auth.mapotechnology.com/login';

// create the URI for failed authentication
if (isset($_GET['service'])) {
    $vars .= '&service=' . $_GET['service'];
}
if (isset($_GET['prod'])) {
    $vars .= '&prod=' . $_GET['prod'];
}
if (isset($_GET['next'])) {
    $vars .= '&next=' . urlencode($_GET['next']);
}

function nextURL()
{
    global $_GET;
    global $domain;
    $allowedDomains = [
        'mapofire.com',
        'mapotrails.com',
        'wildfiremap.org',
        'fireweatheravalanche.org',
        'mapotechnology.com',
        'apps.mapotechnology.com'
    ];
    $next = $_GET['next'];
    $prod = $_GET['prod'] ? '/' . $_GET['prod'] : '';
    $service = $_GET['service'] ?? '';
    $default = $service === 'apps' ? "https://apps.mapotechnology.com$prod" : "https://$domain";

    if (!$next) {
        return $default;
    }

    $parsed = parse_url($next);

    if (isset($parsed['host'])) {
        $host = $parsed['host'];
        foreach ($allowedDomains as $allowed) {
            if (stripos($host, $allowed) !== false) {
                return $next;
            }
        }
        return $default;
    }

    return $next;
}

function getUserFromAPI($apiKey, $token)
{
    $url = 'https://api.mapotechnology.com/v1/user/get?key=' . urlencode($apiKey) . '&token=' . urlencode($token);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);         // 5 second timeout
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);  // 3 second connection timeout
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);  // return false on HTTP errors

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($response === false || $httpCode >= 400) {
        return null;
    }

    $json = json_decode($response, true);
    return $json['user'] ?? null;
}

$redirectToFail = function ($failCode = 3, $extra = '') use ($failURL) {
    header("Location: $failURL?fail=$failCode$extra");
    exit();
};

// check if token even exists in the URL
if (!$token) {
    $redirectToFail(3, $vars);
}

// check if the token is valid and came from this server
if (!validToken($token)) {
    $redirectToFail();
}

// get user details for session from API
$user = getUserFromAPI($apiKey, $_REQUEST['token']);

// if user returns error or no user at all, clear session/token cookie
if (!$user) {
    setcookie('token', '', [
        'expires' => $time - 604800, // 60 * 60 * 24 * 30
        'path' => '/',
        'domain' => ".$domain",
        'secure' => true,
        'httponly' => false,
        'samesite' => 'Lax'
    ]);

    $_SESSION = [];
    session_regenerate_id(true);

    $qs = preg_replace('/([&?])token=[^&]*/', '', $_SERVER['QUERY_STRING']);
    $redirectToFail(3, $qs ? "&$qs" : '');
}

// set session & cookie variables
$_SESSION['uid'] = $user['uid'];
$_SESSION['first_name'] = $user['first_name'];
$_SESSION['last_name'] = $user['last_name'];
$_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
$_SESSION['role'] = $user['role'];
$_SESSION['token'] = $user['token'];
$_SESSION['expires'] = $user['expires'];
$_SESSION['subscriptions'] = json_encode($subscribe ?? []);

setcookie('token', $user['token'], [
    'expires' => $user['expires'],
    'path' => '/',
    'domain' => ".$domain",
    'secure' => true,
    'httponly' => true,
    'samesite' => 'None'
]);

if ($_COOKIE['guid'] !== $user['guid']) {
    setcookie('guid', $user['guid'], [
        'expires' => time() + 31557600, // 60 * 60 * 24 * 365.25
        'path' => '/',
        'domain' => ".$domain",
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

$next = nextURL();

#echo $next;
header("Location: $next");
exit();