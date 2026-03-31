<?
$time = time();
$uid = null;
$token = $_COOKIE['token'] ?? $_REQUEST['token'];

// get user id from session uid or cookie token
if ($token) {
    $row = executeQuery('si', [$token, $time], "SELECT uid FROM sessions WHERE token = ? AND expires > ?");
    $uid = $row['uid'] ?? null;
}/* else if (isset($_SESSION['uid'])) {
    $uid = $_SESSION['uid'] ?? null;
}*/

if ($uid == null) {
    $returnJson = ['response' => 'error', 'code' => 1, 'msg' => 'User authentication failed'];
    return;
}

if ($method == 'list') {
    if ($_REQUEST['meta'] == 1) {
        $sql = "SELECT incidentId, state, name, date, geo, type, acres, t.wfid, time, status FROM track_fires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid WHERE uid = $uid";
    } else {
        $where = "uid = '$uid'" . ($_REQUEST['wfid'] ? ' AND wfid = ' . $_REQUEST['wfid'] : '');
        $sql = "SELECT wfid, time FROM track_fires WHERE $where";
    }

    if ($_REQUEST['wfid']) {
        $num = mysqli_num_rows(mysqli_query($con, $sql));
        $out = ['tracked' => $num == 0 ? false : true];
    } else {
        $result = mysqli_query($con, $sql);
        while ($row = mysqli_fetch_assoc($result)) {
            if ($_REQUEST['meta'] == 1) {
                $f[] = [
                    'wfid' => intval($row['wfid']),
                    'incidentId' => $row['incidentId'],
                    'state' => $row['state'],
                    'date' => $row['date'],
                    'name' => $row['name'],
                    'type' => $row['type'],
                    'acres' => /*$uid == 1 ? $row['acres'] - 1000 : */ $row['acres'],
                    'geo' => $row['geo'],
                    'status' => unserialize($row['status']),
                    'url' => wildfireURL($row['wfid'], $row['name'], $row['state'])
                ];
            } else {
                $f[] = ['wfid' => intval($row['wfid']), 'time' => floatval($row['time'])];
            }
        }
        $out = ['fires' => $f];
    }
} else {
    if (!$_REQUEST['wfid']) {
        $out = ['error' => 'No WFID was specified'];
    } else {
        if ($method == 'add') {
            mysqli_query($con, "INSERT INTO track_fires (uid,wfid,time) VALUES('$uid','$_REQUEST[wfid]','$time')");
            $out = ['success' => 'added'];
        } else if ($method == 'remove') {
            mysqli_query($con, "DELETE FROM track_fires WHERE uid = '$uid' AND wfid = '$_REQUEST[wfid]'");
            $out = ['success' => 'removed'];
        }
    }
}

$returnJson = $out;