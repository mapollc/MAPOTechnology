<?
ini_set('display_errors', 0);
$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');

function sendToMapbox($id, $json) {
    $datasetID = 'clnnlg3w728a02nmv0ffz57jf';
    $token = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbG5ucDAzeHUwNzh4Mm5wajV5ZmtrdTY1In0.02tUj5yH3IBEbYsO-wI3TQ';
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/datasets/v1/mapollc/'.$datasetID.'/features/'.$id.'?access_token='.$token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));

    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $resp = 'Error:' . curl_error($ch);
    } else {
        $resp = json_decode($result);
    }
    curl_close($ch);
    return $resp;
}

$result = mysqli_query($con2, "SELECT id, type, public, premium FROM trails ORDER BY id DESC");
while ($row = mysqli_fetch_assoc($result)) {
    $json = json_decode(file_get_contents('https://api.mapotechnology.com/v1/trails/gis?key=cf707f0516e5c1226835bbf0eece4a0c&format=1&id='.$row['id']));

    $prop = [
        'trail_id' => $json->trail->trail_id,
        'type' => $row['type'],
        'title' => $json->trail->title,
        'url' => $json->trail->url,
        'stats' => $json->trail->stats,
        'public' => $row['public'],
        'premium' => $row['premium']
    ];

    $i = 0;
    foreach ($json->trail->gis as $gis) {
        if (!empty($gis->gpx)) {
            $coords = [];

            $prop['delta'] = $i;
            $prop['id'] = $gis->id;
            $prop['color'] = $gis->color;
            $prop['mode'] = $gis->mode;
            $prop['caption'] = $gis->caption;

            for ($i = 0; $i < count($gis->gpx); $i++) {
                $coords[] = [floatval($gis->gpx[$i]->coords[1]), floatval($gis->gpx[$i]->coords[0])];
            }

            $feature = array('type' => 'Feature', 'geometry' => array('type' => 'LineString', 'coordinates' => $coords), 'properties' => $prop);

            sendToMapbox($gis->id, $feature);
            $i++;
        }
    }
}


/*$out = array('type' => 'FeatureCollection', 'features' => $features);
#print_r($out);
$save = fopen('./trails.geojson', 'w');
fwrite($save, json_encode($out, JSON_PRETTY_PRINT));
fclose($save);*/

mysqli_close($con2);

/*ini_set('display_errors',1);
include('../db.ini.php');
include('../apis/functions.inc.php');

$ss = json_decode(file_get_contents('/home/mapo/public_html/cron/states.json'));

$result = mysqli_query($con, "SELECT wfid, lat, lon FROM wildfires WHERE state = '' ORDER BY captured DESC");
while ($row = mysqli_fetch_assoc($result)) {
    $state = getState([$row['lat'], $row['lon']], $ss);

    if ($state) {
        $sql .= "UPDATE wildfires SET state = '$state' WHERE wfid = '$row[wfid]';";
    }
}

$runSQL = mysqli_multi_query($con, $sql) or die(mysqli_error($con));
        if ($runSQL) {
            do {
                if ($result = mysqli_store_result($con)) {
                    while ($row = mysqli_fetch_row($result)) { }
                    mysqli_free_result($result);
                }
                if (mysqli_more_results($con)) { }
            } while (mysqli_next_result($con));
        }

        echo 'Done!!!';
mysqli_close($con);*/
?>