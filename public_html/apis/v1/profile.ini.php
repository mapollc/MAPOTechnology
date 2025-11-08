<?
$time = time();
$uid = ($_SESSION['uid'] ? $_SESSION['uid'] : $_REQUEST['uid']);
$token = $_REQUEST['token'];

$sql = "SELECT u.uid, first_name, last_name, email, phone, role, provider, u.location, us.settings, us.time AS sync, us.method FROM users AS u LEFT JOIN sessions AS s ON s.uid = u.uid LEFT JOIN settings AS us ON us.uid = u.uid WHERE u.uid = '$uid' AND token = '$token'";
$row = mysqli_fetch_assoc(mysqli_query($con, $sql));

foreach ($row as $k => $v) {
    $user[$k] = ($k == 'location' || $k == 'settings' ? unserialize($v) : $v);
}

$returnJson = array('user' => ($row ? $user : 'error'));
?>