<?
ini_set('display_errors', 1);
include_once '/home/mapo/public_html/cron/dispatch.inc.php';

$failed = array();

function backup($center) {
    $fmtime = filemtime('./cache/run1/'.$center.'.json');
    unlink('./cache/run2/'.$center.'.json');
    rename('./cache/run1/'.$center.'.json', './cache/run2/'.$center.'.json');
    touch('./cache/run2/'.$center.'.json', $fmtime);
}

foreach ($newDispatchCenters as $center) {
    $json = json_encode(json_decode(file_get_contents('https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/'.$center.'/incidents'))[0]);

    if ($json) {
        backup($center);

        $file = fopen('./cache/run1/'.$center.'.json', 'w');
        fwrite($file, $json);
        fclose($file);
        echo 'Finished retreiving CAD (json) data from '.$center.'...
';
    } else {
        $failed[] = $center;
        echo 'Failed to retreive CAD (json) data from '.$center.'...
';
    }
}

if (count($failed) > 0) {
    foreach ($failed as $center) {
        $json = json_encode(json_decode(file_get_contents('https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/'.$center.'/incidents'))[0]);

        if ($json) {
            backup($center);
    
            $file = fopen('./cache/run1/'.$center.'.json', 'w');
            fwrite($file, $json);
            fclose($file);
            echo 'Finished retreiving CAD (json) data from '.$center.' (2nd attempt)...
';
        } else {
            echo 'Failed to retreive CAD (json) data from '.$center.' (2nd attempt)...
';
        }
    }

    $failed = array();
}

include_once '/home/mapo/public_html/db.ini.php';
logEvent('Retrieved wildfire data from WildCAD-E', true);
mysqli_close($con);