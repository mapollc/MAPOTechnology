<?
$token = $_REQUEST['token'];
$settings = $_REQUEST['settings'];

if (isset($token)) {
    if ($method == 'list') {
        $result = mysqli_query($con, "SELECT msgID, REPLACE(text, 'Â', '') AS text, time FROM appNotifications AS n LEFT JOIN appNotificationsSent AS s ON s.user = n.uid WHERE token = '$token' ORDER BY time DESC");
        while ($row = mysqli_fetch_assoc($result)) {
            $notif[] = $row;
        }

        $returnJson = array('notifications' => $notif);
    } else {
        if (isset($settings)) {
            $uid = $_REQUEST['uid'] ? $_REQUEST['uid'] : 'NULL';
            $time = time();
            $settings = mysqli_real_escape_string($con, json_encode(json_decode($settings)));

            $exist = mysqli_num_rows(mysqli_query($con, "SELECT token FROM appNotifications WHERE token = '$token' LIMIT 1"));
            if ($exist == 0) {
                mysqli_query($con, "INSERT INTO appNotifications (auth_user_id, token, settings, updated) VALUES($uid, '$token', '$settings', '$time')");
            } else {
                mysqli_query($con, "UPDATE appNotifications SET auth_user_id = $uid, settings = '$settings', updated = '$time' WHERE token = '$token'");
            }

            $returnJson = array('response' => 'success');
        } else {
            $returnJson = array('response' => 'error', 'code' => 2, 'msg' => 'No preferences were sent');
        }
    }
} else {
    $returnJson = array('response' => 'error', 'code' => 1, 'msg' => 'No device token was sent');
}
