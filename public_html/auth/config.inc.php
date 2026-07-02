<?
ini_set('session.cookie_domain', '.mapotechnology.com');
session_start();

$method = $_GET['method'];
$allowedMethods = ['confirmation', 'invitation', 'login', 'forgot', 'reset', 'register'];
$gtoken = $_GET['gtoken'] ?? null;
$google_client_id = '27619385576-o8elfb66trj3e5v2acahnjm0jiqacg5n.apps.googleusercontent.com';

// ensure user is navigating to valid page
if (!in_array($method, $allowedMethods)) {
    header("Location: ../login");
    exit();
}

// receive login data from google
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['credential'])) {
    header('Location: ' . $_SERVER['SCRIPT_URI'] . "?gtoken=$_POST[credential]" . (isset($_POST['state']) ? '&' . $_POST['state'] : ''));
    exit();
}

require_once '../config.inc.php';
require_once '../subs.inc.php';

// set GUID if in query parameters
if (isset($_GET['guid']) && !empty($_GET['guid'])) {
    setcookie('guid', $_GET['guid'], [
        'expires' => time() + 31557600,  // 60 * 60 * 24 * 365.25
        'path' => '/',
        'domain' => '.mapotechnology.com',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
} else if (!$_COOKIE['guid']) {
    include_once '/home/mapo/guid.inc.php';
    setupGUID();
}

if ($_GET['fail'] == 3) {
    $_SESSION = [];
    session_destroy();
    session_regenerate_id(true);
    setcookie('token', '', [
        'expires' => time() - 60 * 60 * 24 * 7,
        'path' => '/', 
        'domain' => '.mapotechnology.com',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

$service = $_GET['src'] ?? $_GET['service'] ?? null;
$fireMaps = ['mapofire', 'wildfiremap', 'fireweatheravalanche'];
$sourceURL = 'https://';
$serviceName = null;
$nextURL = preg_replace('/(\?|&)loggedOut=1/', '', $_GET['next'] ?? '');
$prod = $_GET['prod'] ?? '';
$logo = 'mapo_logo_small.png';

// get the default service URL
$sourceURL .= $service == 'apps' ? 'apps.mapotechnology.com' : "www.$service." . (str_contains($service, 'mapo') ? 'com' : 'org');

// define the service name and logo for the referring service (if available)
if ($service == 'mapotrails') {
    $serviceName = 'Map of Trails';
    $logo = 'mapotrails_logo.png';
}

if (in_array($service, $fireMaps)) {
    $serviceName = 'Map of Fire';
    $logo = 'mapofire_logo.png';
}

if ($service == 'apps') {
    if ($prod == 'oregonroads') {
        $serviceName = 'Oregon Roads';
        $logo = 'oreroads/oreroads_square_logo.png';
    } else if ($prod == 'polygen') {
        $serviceName = 'PolyGEN';
        $logo = 'polygen_logo.png';
    } else if ($prod == 'crisiscoord') {
        $serviceName = 'CrisisCoord';
    }
}