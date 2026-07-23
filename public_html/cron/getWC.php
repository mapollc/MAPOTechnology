<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);
include_once '/home/mapo/public_html/cron/dispatch.inc.php';

$failed = [];
const MAX_CONCURRENT = 25;

function backup($center)
{
    $run1 = "./cache/run1/{$center}.json";
    $run2 = "./cache/run2/{$center}.json";

    if (!file_exists($run1)) {
        return false;
    }

    $fmtime = filemtime($run1);

    if (file_exists($run2)) {
        unlink($run2);
    }

    if (!rename($run1, $run2)) {
        return false;
    }

    touch($run2, $fmtime);

    return true;
}

function fetchCenters(array $centers): array
{
    $results = [];

    $queue = array_values($centers);
    $multi = curl_multi_init();
    $handles = [];

    while (!empty($queue) || !empty($handles)) {
        while (count($handles) < MAX_CONCURRENT && !empty($queue)) {
            $center = array_shift($queue);
            $ch = curl_init("https://snknmqmon6.execute-api.us-west-2.amazonaws.com/centers/$center/incidents");

            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_ENCODING => "",
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2TLS,
            ]);

            curl_multi_add_handle($multi, $ch);

            $handles[(int)$ch] = [
                'center' => $center,
                'handle' => $ch
            ];
        }

        do {
            $status = curl_multi_exec($multi, $running);
        } while ($status === CURLM_CALL_MULTI_PERFORM);

        while ($info = curl_multi_info_read($multi)) {
            $ch = $info['handle'];
            $center = $handles[(int)$ch]['center'];

            if ($info['result'] === CURLE_OK) {
                $body = curl_multi_getcontent($ch);
                $decoded = json_decode($body);

                $results[$center] = isset($decoded[0]) ? json_encode($decoded[0]) : null;
            } else {
                $results[$center] = null;
            }

            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);

            unset($handles[(int)$ch]);
        }

        if ($running) {
            curl_multi_select($multi, 1);
        }
    }

    curl_multi_close($multi);

    return $results;
}

function processCenters(array $centers): array
{
    $failed = [];
    $responses = fetchCenters($centers);

    foreach ($responses as $center => $json) {
        if ($json) {
            backup($center);

            file_put_contents("./cache/run1/{$center}.json", $json);

            echo "Finished retrieving CAD (json) data from {$center}..." . PHP_EOL;
        } else {
            $failed[] = $center;
            echo "Failed to retrieve CAD (json) data from {$center}..." . PHP_EOL;
        }
    }

    return $failed;
}

$failed = processCenters($newDispatchCenters);

if (!empty($failed)) {
    echo PHP_EOL . "Retrying " . count($failed) . " failed dispatch centers..." . PHP_EOL;

    $failed = processCenters($failed);

    if (!empty($failed)) {
        echo PHP_EOL . "Still failed:" . PHP_EOL;

        foreach ($failed as $center) {
            echo " - {$center}" . PHP_EOL;
        }
    }
}

/*function backup($center) {
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
}*/

/*include_once '/home/mapo/public_html/config.inc.php';
logEvent('Retrieved wildfire data from WildCAD-E', true);
mysqli_close($con);*/