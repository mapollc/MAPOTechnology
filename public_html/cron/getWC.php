<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);
include_once '/home/mapo/public_html/cron/dispatch.inc.php';

$failed = [];

function backup($center) {
    $run1 = "./cache/run1/{$center}.json";
    $run2 = "./cache/run2/{$center}.json";

    // Nothing to back up
    if (!file_exists($run1)) return false;

    $fmtime = filemtime($run1);

    // Remove existing backup if present
    if (file_exists($run2)) unlink($run2);

    // Move run1 to run2
    if (!rename($run1, $run2)) return false;

    touch($run2, $fmtime);

    return true;
}

foreach ($newDispatchCenters as $center) {
    $fetch = file_get_contents("https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/$center/incidents");
    $json = json_encode(json_decode($fetch)[0]);

    if ($json) {
        backup($center);

        $file = fopen("./cache/run1/{$center}.json", 'w');
        fwrite($file, $json);
        fclose($file);
        echo "Finished retreiving CAD (json) data from {$center}..
";
    } else {
        $failed[] = $center;
        echo "Failed to retreive CAD (json) data from {$center}..
";
    }
}

if (count($failed) > 0) {
    foreach ($failed as $center) {
        $fetch = file_get_contents("https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/$center/incidents");
        $json = json_encode(json_decode($fetch)[0]);

        if ($json) {
            backup($center);
    
            $file = fopen("./cache/run1/{$center}.json", 'w');
            fwrite($file, $json);
            fclose($file);
            echo "Finished retreiving CAD (json) data from $center (2nd attempt)...
";
        } else {
            echo "Failed to retreive CAD (json) data from $center (2nd attempt)...
";
        }
    }

    $failed = [];
}

/*include_once '/home/mapo/public_html/db.ini.php';
logEvent('Retrieved wildfire data from WildCAD-E', true);
mysqli_close($con);*/