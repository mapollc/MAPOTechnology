<?
$domain = str_replace(['www.', 'apps.'], '', $_SERVER['HTTP_HOST']);

ini_set('display_errors', 0);
ini_set('opcache.enable', 0);
ini_set('opcache.enable_cli', 0);
ini_set('session.cookie_domain', ".$domain");
error_reporting(E_ERROR | E_PARSE);

session_start();

require '/home/mapo/public_html/config.inc.php';

$vars = '';
$time = time();
$apiKey = '50e2c43f8f63ff0ed20127ee2487f15e';
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

function getUserFromAPI($apiKey, $code)
{
    $ch = curl_init("https://api.mapotechnology.com/v2/user/exchange_sso");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'key' => $apiKey,
        'code' => $code
    ]));

    $response = json_decode(curl_exec($ch), true);

    return $response ?? null;
}

$redirectToFail = function ($failCode = 3, $extra = '') use ($failURL) {
    header("Location: $failURL?fail=$failCode$extra");
    //echo "Location: $failURL?fail=$failCode$extra";
    exit();
};

$response = getUserFromAPI($apiKey, $_GET['code']);

if (isset($response['response']) && $response['response'] === 'valid') {
    $user = $response['user'] ?? null;

    if ($user === null) {
        $redirectToFail(3, $vars);
    } else {
        // set session & cookie variables
        $_SESSION['uid'] = $user['uid'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['name'] = $user['first_name'] . ' ' . $user['last_name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['token'] = $response['token'];
        $_SESSION['expires'] = $user['expires'];
        $_SESSION['subscriptions'] = json_encode($user['subscriptions'] ?? []);

        setcookie('token', $response['token'], [
            'expires' => $user['expires'],
            'path' => '/',
            'domain' => ".$domain",
            'secure' => true,
            'httponly' => true,
            'samesite' => 'None'
        ]);

        if (!isset($_COOKIE['guid']) || $_COOKIE['guid'] !== $user['guid']) {
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

        //echo $next;
        header("Location: $next");
        exit();
    }
} else {
    $failCode = $response['code'] > 10 ? 4 : 3;
    if ($failCode === 4) $vars .= '&err=' . $response['msg'];

    $redirectToFail($failCode, $vars);
    exit();
}

// check if token even exists in the URL
/*if (!$token) {
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

    $qs = preg_replace('/([&?])token=[^&]*//*', '', $_SERVER['QUERY_STRING']);
    $redirectToFail(3, $qs ? "&$qs" : '');
} else {
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

    if (!isset($_COOKIE['guid']) || $_COOKIE['guid'] !== $user['guid']) {
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

    //echo $next;
    header("Location: $next");
    exit();
}*/