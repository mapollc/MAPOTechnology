<?
header('Content-type: application/json');
$time = time();

if ($_REQUEST['app'] == 1) {
    $uid = $_REQUEST['uid'];
    $settings = serialize(json_decode($_REQUEST['settings'], true));

    mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '1', time = '$time' WHERE uid = '$uid'");

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
    $settings = serialize($settings);

    $_SESSION['settings'] = $settings;

    if ($_SESSION['uid']) {
        mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = $_SESSION[uid]");
        mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = $_SESSION[uid]");
    }

    if ($_REQUEST['token']) {
        $now = time();
        $q = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid FROM sessions WHERE token = '$_REQUEST[token]' AND expires > $now LIMIT 1"));
        $uid = $q['uid'];

        if ($uid) {
            mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = $uid");
            mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = $uid");
        }
    }

    $returnJson = ['success' => 1, 'time' => $time];
}