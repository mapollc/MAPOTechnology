<?
header('Content-type: application/json');
$time = time();

if ($_REQUEST['app'] == 1) {
    $uid = $_REQUEST['uid'];
    $settings = serialize(json_decode($_REQUEST['settings'], true));

    mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '1', time = '$time' WHERE uid = '$uid'");

    $returnJson = array('success' => 1, 'time' => $time);
} else {
    //if ($_REQUEST['new'] == 1) {
        $method = $_REQUEST['method'] == 'true' ? 1 : 0;
        $settings = json_decode($_REQUEST['settings'], true);
    /*} else {
        $center = $_REQUEST['center'];
        $zoom = $_REQUEST['zoom'];
        $tile = $_REQUEST['tile'];
        $method = ($_REQUEST['method'] == 'true' ? 1 : 0);
        $perimeters = array('minSize' => $_REQUEST['perimeters']['minSize'],
                            'color' => $_REQUEST['perimeters']['color'],
                            'zoom' => $_REQUEST['perimeters']['zoom'],
                            'ttip' => $_REQUEST['perimeters']['ttip']);
        $weather = array('temp' => $_REQUEST['weather']['temp'],
                        'wind' => $_REQUEST['weather']['wind']);

        $settings = array('center' => $center,
                                    'zoom' => $zoom,
                                    'tile' => $tile,
                                    'saveFreq' => $_REQUEST['saveFreq'],
                                    'locallySave' => $_REQUEST['locallySave'],
                                    'checkboxes' => $_REQUEST['checkboxes'],
                                    'coordsDisplay' => $_REQUEST['coordsDisplay'],
                                    'perimeters' => $perimeters,
                                    'weather' => $weather,
                                    'acres' => $_REQUEST['acres'],
                                    'fireDisplay' => $_REQUEST['fireDisplay']
                                );

        if ($_REQUEST['special']) {
            $settings['special'] = array('otlkType' => $_REQUEST['special']['otlkType'],
                                        'otlkDay' => $_REQUEST['special']['otlkDay'],
                                        'sfpDate' => $_REQUEST['special']['sfpDate'],    
                                        'forecastModel' => $_REQUEST['special']['forecastModel'],    
                                        'fcstTime' => $_REQUEST['special']['fcstTime']);
        }
    }*/
    $settings = serialize($settings);

    $_SESSION['settings'] = $settings;
    
    if ($_SESSION['uid']) {
        mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = '$_SESSION[uid]'");
        mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$_SESSION[uid]'");
    }

    if ($_REQUEST['token']) {
        $now = time();
        $q = mysqli_fetch_assoc(mysqli_query($con, "SELECT uid FROM sessions WHERE token = '$_REQUEST[token]' AND expires > '$now' LIMIT 1"));
        $uid = $q['uid'];

        if ($uid) {
            mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '$method', time = '$time' WHERE uid = '$uid'");
            mysqli_query($con, "UPDATE users SET last_active = '$time' WHERE uid = '$uid'");
        }
    }

    $returnJson = array('success' => 1, 'time' => $time);
}