<?
//header('Content-type: application/json');
$time = time();

if ($_REQUEST['app'] == 1) {
    $uid = $_REQUEST['uid'];
    $settings = json_encode(json_decode($_REQUEST['settings'], true));

    executeQuery('sii', [$settings, $time, $uid], "UPDATE settings SET settings = ?, method = '1', time = ? WHERE uid = ?");
    ////mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '1', time = '$time' WHERE uid = '$uid'");

    $returnJson = array('success' => 1, 'time' => $time);
} else if ($method == 'get') {
    $returnJson = [
        'ip' => $_SERVER['REMOTE_ADDR'],
        'guid' => $_COOKIE['guid'] ? $_COOKIE['guid'] : null,
        'time' => time() * 1000
    ];
} else {
    $method = $_REQUEST['method'] == 'true' ? 1 : 0;
    $settings = json_decode($_REQUEST['settings'], true);
    $safeSettings = json_encode($settings);

    $_SESSION['settings'] = $settings;

    if ($_SESSION['uid']) {
        executeQuery('ssii', [$safeSettings, $method, $time, $_SESSION['uid']], "UPDATE settings SET settings = ?, method = ?, time = ? WHERE uid = ?");
        executeQuery('ii', [$time, $_SESSION['uid']], "UPDATE users SET last_active = ? WHERE uid = ?");
        ////mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = $_SESSION[uid]");
        ////mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = $_SESSION[uid]");
    }

    if ($_REQUEST['token']) {
        $now = time();
        $q = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid FROM sessions WHERE token = '$_REQUEST[token]' AND expires > $now LIMIT 1"));
        $uid = $q['uid'];

        if ($uid) {
            executeQuery('ssii', [$safeSettings, $method, $time, $uid], "UPDATE settings SET settings = ?, method = ?, time = ? WHERE uid = ?");
            executeQuery('ii', [$time, $uid], "UPDATE users SET last_active = ? WHERE uid = ?");
            ////mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = $uid");
            ////mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = $uid");
        }
    }

    $returnJson = ['success' => 1, 'time' => $time];
}