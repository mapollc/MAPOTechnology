<?
function whatState($state, $coords) {
    $st = explode(' / ', $state)[0];

    if ($st) {
        return $st;
    } else {
        return getState($coords);
    }
}

if ($_REQUEST['type'] && $_REQUEST['size'] && $_REQUEST['notes']) {
    //if ($_REQUEST['crowdsource'] == 1) {
        $msg = '';

        if ($_REQUEST['authUser'] == 1) {
            $row = prepareQuery('i', [$_REQUEST['uid']], "SELECT first_name, last_name, email FROM users WHERE uid = ?");
            $msg .= '<b>Reported By:</b> ' . $row['first_name'] . ' ' . $row['last_name'] . ' (<a href="' . $row['email'] . '">' . $row['email'] . '</a>)<br>';
        } else {
            $msg .= '<b>Reported by:</b> Anonymous<br>';
        }

        $state = whatState($_REQUEST['state'], [$_REQUEST['lat'], $_REQUEST['lon']]);
        $type = $_REQUEST['type'];
        $acres = preg_replace('/\D+/', '', $_REQUEST['size']);
        $details = $_REQUEST['notes'];
        $geo = json_encode(['lat' => $_REQUEST['lat'], 'lon' => $_REQUEST['lon'], 'near' => $_REQUEST['geolocation']]);
        $u = ['authUser' => $_REQUEST['authUser'], 'platform' => $_REQUEST['platform'], 'version' => $_REQUEST['version'], 'ip' => $_SERVER['REMOTE_ADDR'], 'user_agent' => $_SERVER['HTTP_USER_AGENT']];
        if ($_REQUEST['uid']) {
            $u['uid'] = $_REQUEST['uid'];
        }
        $user = json_encode($u);
        $time = time();

        $upload = prepareQuery('ssssssi', [$state,$type,$acres,$details,$geo,$user,$time], "INSERT INTO user_reports (state,type,acres,details,geo,user,time) VALUES(?,?,?,?,?,?,?)");
        $rid = mysqli_insert_id($con);

        $msg .= '<br><a href="https://www.mapotechnology.com/account/admin/crowdsource/view?id='.$rid.'">View Report</a>';

        // Email MAPO with new report details
        sendEmail('thurd@mapotechnology.com', 'NEW Incident Report from Map of Fire', 'newreport_mapo', array('reportID' => $rid, '{fname}' => 'Map of Fire', '{type}' => $_REQUEST['type'], '{report}' => $msg));

        if ($row['email']) {
            sendEmail($row['email'], 'Thanks for reporting a new incident', 'newreport', array('{fname}' => $row['first_name'], '{type}' => $_REQUEST['type'], '{report}' => $msg));
        }
    /*} else {
        $msg = '';

        if ($_REQUEST['authUser'] == 1) {
            $row = prepareQuery('i', [$uid], "SELECT first_name, last_name, email FROM users WHERE uid = ?");
            $msg .= '<b>Reported By:</b> ' . $row['first_name'] . ' ' . $row['last_name'] . ' (<a href="' . $row['email'] . '">' . $row['email'] . '</a>)<br>';
        } else {
            $msg .= '<b>Reported by:</b> Anonymous<br>';
        }

        #$msg .= '<b>Geolocation:</b> '.$json->geolocation->distance.' miles '.$json->geolocation->bearing.' of '.$json->city.'<br>';
        #$msg .= '<b>Geolocation:</b> ' . $_REQUEST['geolocation'] . '<br>';

        foreach ($_REQUEST as $k => $v) {
            if ($k != 'api' && $k != 'authUser' && $k != 'uid' && $k != 'format' && $k != 'key') {
                $msg .= '<b>' . ucwords(($k == 'time' ? 'Report Time' : ($k == 'version' ? 'Map Version' : $k))) . ':</b> ' . ($k == 'time' ? date('l, F j, Y H:i:s T', $v) : ($k == 'type' ? strtoupper($v) : ($k == 'size' ? $v . ' acre' . ($v != 1 ? 's' : '') : $v))) . '<br>';
            }
        }

        $msg .= '<b>IP Address:</b> ' . $_SERVER['REMOTE_ADDR'] . '<br>';
        $msg .= '<b>User Agent:</b> ' . $_SERVER['HTTP_USER_AGENT'] . '<br>';

        // Email MAPO with new report details
        sendEmail('thurd@mapotechnology.com', 'NEW Incident Report from Map of Fire', 'newreport_mapo', array('{fname}' => 'Map of Fire', '{type}' => $_REQUEST['type'], '{report}' => $msg));

        if ($row['email']) {
            sendEmail($row['email'], 'Thanks for reporting a new incident', 'newreport', array('{fname}' => $row['first_name'], '{type}' => $_REQUEST['type'], '{report}' => $msg));
        }
    }*/

    $returnJson = array('success' => 1);
} else {
    $returnJson = array('error' => 1);
}
