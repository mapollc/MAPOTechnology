<?
$time = time();
$uid = null;

if ($_REQUEST['token']) {
    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid FROM sessions WHERE token = '$_REQUEST[token]' AND expires > '$time'"));
    $uid = $row['uid'];
} else if (isset($_SESSION['uid'])) {
    $uid = $_SESSION['uid'];
}

if ($uid == null) {
    $out = array('response' => 'error', 'code' => 1, 'msg' => 'User authentication failed');
} else {
    if ($method == 'list') {
        if ($_REQUEST['meta'] == 1) {
            /*if (isset($_REQUEST['token'])) {
                $sql = "SELECT state, name, date, geo, type, acres, t.wfid, time, status FROM track_fires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid LEFT JOIN sessions AS s ON s.uid = t.uid WHERE s.token = '$_REQUEST[token]' AND s.expires > '$time'";
            } else {*/
                $sql = "SELECT incidentId, state, name, date, geo, type, acres, t.wfid, time, status FROM track_fires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid WHERE uid = $uid";
            //}
        } else {
            $where = "uid = '$uid'" . ($_REQUEST['wfid'] ? ' AND wfid = ' . $_REQUEST['wfid'] : '');
            $sql = "SELECT wfid, time FROM track_fires WHERE " . $where;
        }

        if ($_REQUEST['wfid']) {
            $num = mysqli_num_rows(mysqli_query($con, $sql));
            $out = array('tracked' => ($num == 0 ? false : true));
        } else {
            $result = mysqli_query($con, $sql);
            while ($row = mysqli_fetch_assoc($result)) {
                if ($_REQUEST['meta'] == 1) {
                    $f[] = array(
                        'wfid' => intval($row['wfid']),
                        'incidentId' => $row['incidentId'],
                        'state' => $row['state'],
                        'date' => $row['date'],
                        'name' => $row['name'],
                        'type' => $row['type'],
                        'acres' => /*$uid == 1 ? $row['acres'] - 1000 : */$row['acres'],
                        'geo' => $row['geo'],
                        'status' => unserialize($row['status']),
                        'url' => wildfireURL($row['wfid'], $row['name'], $row['state'])
                    );
                } else {
                    $f[] = array('wfid' => intval($row['wfid']), 'time' => floatval($row['time']));
                }
            }
            $out = array('fires' => $f);
        }
    } else {
        if (!$_REQUEST['wfid']) {
            $out = array('error' => 'No WFID was specified');
        } else {
            if ($method == 'add') {
                mysqli_query($con, "INSERT INTO track_fires (uid,wfid,time) VALUES('$uid','$_REQUEST[wfid]','$time')");
                $out = array('success' => 'added');
            } else if ($method == 'remove') {
                mysqli_query($con, "DELETE FROM track_fires WHERE uid = '$uid' AND wfid = '$_REQUEST[wfid]'");
                $out = array('success' => 'removed');
            }
        }
    }
}

$returnJson = $out;
