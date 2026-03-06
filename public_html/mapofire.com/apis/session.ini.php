<?
//header('Content-type: application/json');
$time = time();

if ($_REQUEST['app'] == 1) {
    $uid = $_REQUEST['uid'];
    $settings = json_encode(json_decode($_REQUEST['settings'], true));

    executeQuery('sii', [$settings, $time, $uid], "UPDATE settings SET settings = ?, method = '1', time = ? WHERE uid = ?");

    $returnJson = ['success' => 1, 'time' => $time];
    return;
}

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

$_SESSION['settings'] = $settings;

if ($_SESSION['uid']) {
    executeQuery('ssii', [$safeSettings, $method, $time, $_SESSION['uid']], "UPDATE settings SET settings = ?, method = ?, time = ? WHERE uid = ?");
    executeQuery('ii', [$time, $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
}

if ($token) {
    $now = time();
    $q = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid FROM sessions WHERE token = '$token' AND expires > $now LIMIT 1"));
    $uid = $q['uid'];

    if ($uid) {
        executeQuery('ssii', [$safeSettings, $method, $time, $uid], "UPDATE settings SET settings = ?, method = ?, time = ? WHERE uid = ?");
        executeQuery('ii', [$time, $uid], "UPDATE users SET last_active = ? WHERE uid = ?");
    }
}

$returnJson = ['success' => 1, 'time' => $time];