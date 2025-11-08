<?
ini_set('display_errors',1);
include_once('../apis/functions.inc.php');
include_once('../db.ini.php');

$MINIMUM_DISTANCE = 30;
$DELIVER_TYPE = 'email';
$ids = array();
$time = time();
$dow = ['Every day','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

$headers = 'From: notifications@mapofire.com' . "\r\n" . 'Reply-To: info@mapotechnology.com' . "\r\n" . 'X-Mailer: PHP/' . phpversion();

$result = mysqli_query($con, "SELECT wfid FROM notifications_sent");
while ($row = mysqli_fetch_assoc($result)) {
    $ids[] = $row['wfid'];
}

$json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/wildfires/all,new?format=1&key=c196d0958608ad2b7d4af2be078ecc54'));

// loop through all new fires on the map
foreach ($json->features as $fire) {
    $prop = $fire->properties;

    // if a notification has already been sent for this WFID
    if (!in_array($prop->wfid, $ids)) {
        $lat = $fire->geometry->coordinates[1];
        $lon = $fire->geometry->coordinates[0];
        $dist = round(distance($lat, $lon, 45.360106, -118.176498), 1);
        $bearing = getBearing($lat, $lon, 45.360106, -118.176498);
        
        // if the incident is within a certain distance from the user
        if ($dist < $MINIMUM_DISTANCE) {
            $msg[] = 'A new '.strtolower($prop->type).' was discovered '.ago($prop->time->discovered).', '.$dist.' miles '.$bearing.' of you, and is reported at '.$prop->acres.' acre'.($prop->acres != 1 ? 's' : '').'. More details: www.mapofire.com/f/'.$prop->wfid;
            $wildfires[] = $fire;

            mysqli_query($con, "INSERT INTO notifications (wfid,time) VALUES('$prop->wfid','$time')");
        }
    }
}

$body = '<table style="width:100%;border-collapse:collapse;padding:5px" cellpadding="5" cellspacing="0">'.
        '<tr style="font-weight:bold"><td>Name</td><td>State</td><td>Size</td><td>Discovered</td><td>&nbsp;</td></tr>';

foreach ($wildfires as $f) {
    $state = convertState($f->properties->state, 1);
    $body .= '<tr><td style="color:#ed254e;font-weight:bold">'.$f->properties->name.' Fire<b></td><td>'.$state.'</td>' .
            '<td>'.number_format($f->properties->acres).' acre'.($f->properties->acres != 1 ? 's' : '').'</td><td>'.ago($f->properties->time->discovered).'</td>'.
            '<td><a href="https://www.mapofire.com/'.$f->properties->url.'?utm_campaign=fire_notifications&utm_medium=email&utm_source=notification&utm_content='.$f->properties->name.' ('.$state.')">More</a></td></tr>';
}

$sql = mysqli_query($con, "SELECT n.settings, n.active, first_name, email FROM notifications AS n LEFT JOIN users AS u ON u.uid = n.uid WHERE n.active = 1 ORDER BY n.uid DESC") or die(mysqli_error($con));
while ($user = mysqli_fetch_assoc($sql)) {
    $pref = unserialize($user['settings']);

    // every day schedule
    if (count($pref['dow']) == 8 && $pref['start'][0] != 'null' && $pref['end'][0] != 'null') {
        $start = $pref['start'][0];
        $end = $pref['end'][0];
        $day = 'every day';
    } else {
        $start = $pref['start'][date('w') + 1];
        $end = $pref['end'][date('w') + 1];
        $day = 'on '.$dow[date('w') + 1].'\'s';
    }
    $when = '<br><br><span style="font-size:14px">You\'ve signed up to receive these notifications '.$day.' from '.$start.' '.($start > 12 ? 'P' : 'A').'M to '.($end > 12 ? $end - 12 : $end).' '.($end > 12 ? 'P' : 'A').'M. <a href="https://www.mapotechnology.com/account/notifications?ref=email">Change these settings</a>.</span>';

    if (($start != 'null' && date('G') >= $start) && ($end != 'null' && date('G') <= $end)) {
        $send = true;
    } else {
        $send = false;
    }

    if ($send) {
        if ($DELIVER_TYPE == 'sms') {
            foreach ($msg as $m) {
                #mail('5412409140@vtext.com', '', $m);
            }
        } else {
            #sendEmail($user['email'], 'New wildfires were reported near you', 'newfires', array('{fname}' => $user['first_name'], '{notificationTimes}' => $when, '{fires}' => $body.'</table>'));
        }
    }
}

mysqli_close($con);
?>