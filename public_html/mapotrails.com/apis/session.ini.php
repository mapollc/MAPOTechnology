<?
$time = time();

if ($method == 'get') {
    $returnJson = [
        'ip' => $_SERVER['REMOTE_ADDR'],
        'guid' => $_COOKIE['guid'] ?? null,
        'time' => time() * 1000
    ];
    return;
}

$method = $_REQUEST['method'] == 'true' ? 1 : 0;
$settings = json_decode($_REQUEST['settings'], true);

$safeSettings = json_encode($settings);
$token = $_COOKIE['token'] ?? $_REQUEST['token'];
$uid = $_SESSION['uid'] ?? null;

if ($token) {
    $q = executeQuery(
        'si',
        [$token, time()],
        "SELECT uid FROM sessions WHERE token = ? AND expires > ? LIMIT 1"
    );

    $uid = $q['uid'] ?? null;
}


if (isset($_SESSION['uid'])) {
    $_SESSION['settings'] = $settings;
}

if ($uid) {
    executeQuery(
        'ssii',
        [$safeSettings, $method, time(), $uid],
        "UPDATE trail_settings SET settings = ?, method = ?, time = ? WHERE uid = ?"
    );

    executeQuery(
        'ii',
        [time(), $uid],
        "UPDATE users SET last_active = ? WHERE uid = ?"
    );

    return $returnJson = ['success' => 1, 'time' => $time];
}

$returnJson = ['response' => 'error', 'time' => $time];