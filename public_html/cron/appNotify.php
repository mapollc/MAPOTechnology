<?
ini_set('display_errors', 1);
error_reporting(E_ERROR & E_PARSE);
include '../db.ini.php';
date_default_timezone_set('America/Los_Angeles');

function weather($n) {
    switch ($n) {
        case 'No Report' : return 0;
        case 'Clear/No Precipitation' : return 1;
        case 'Partly Cloudy' : return 2;
        case 'Overcast' : return 3;
        case 'Ground Fog' : return 4;
        case 'Intermittent Showers' : return 5;
        case 'Rain' : return 6;
        case 'Snow Flurries' : return 7;
        case 'Snowing Hard & Continuously' : return 8;
        case 'Severe Weather Alert' : return 9;
    }
}

function base64UrlEncode($text) {
    return str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode($text)
    );
}

function getGoogleToken() {
    $authConfigString = file_get_contents("/home/mapo/firebase.json");
    $authConfig = json_decode($authConfigString);
    $secret = openssl_get_privatekey($authConfig->private_key);

    $header = json_encode([
        'typ' => 'JWT',
        'alg' => 'RS256'
    ]);

    $time = time();
    $start = $time - 60;
    $end = $start + 3600;

    $payload = json_encode([
        "iss" => $authConfig->client_email,
        "scope" => "https://www.googleapis.com/auth/firebase.messaging",
        "aud" => "https://oauth2.googleapis.com/token",
        "exp" => $end,
        "iat" => $start
    ]);

    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload);
    $result = openssl_sign($base64UrlHeader . "." . $base64UrlPayload, $signature, $secret, OPENSSL_ALGO_SHA256);
    $base64UrlSignature = base64UrlEncode($signature);
    $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

    $options = array('http' => array(
        'method'  => 'POST',
        'content' => 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion='.$jwt,
        'header'  => "Content-Type: application/x-www-form-urlencoded"
    ));
    $context  = stream_context_create($options);
    $responseText = file_get_contents("https://oauth2.googleapis.com/token", false, $context);

    return json_decode($responseText)->access_token;
}

function sendNotification($user, $id, $title, $msg, $type) {
    global $token;
    $send = array(
        'message' => [
            'token' => $user,
            'data' => [
                'title' => $title,
                'text' => $msg,
                'id' => strval($id),
                'click_action' => $type
            ]
        ]
    );

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/v1/projects/oreroads-4a383/messages:send');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($send));
    
    $headers = array();
    $headers[] = 'Authorization: Bearer '.$token;
    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $result = array('error' => curl_error($ch));
    }
    curl_close($ch);

    return json_decode($result);
}

$token = getGoogleToken();
$now = time();
$tf = strtotime('-5 days');
$test = false;
$reports = json_decode(file_get_contents('https://api.mapotechnology.com/v1/roads?key=c196d0958608ad2b7d4af2be078ecc54' . ($test ? '&test=1' : '')));
$incidents = json_decode(file_get_contents('https://api.mapotechnology.com/v1/roads/incidents?key=c196d0958608ad2b7d4af2be078ecc54' . ($test ? '&test=1' : '')));

/*$msg = 'At '.date('g:i A', time()).', ODOT was reporting 5°F and partly cloudy with spots of ice.';

$resp = sendNotification('eZ8e0GwlR2ixzqeGbmKaAJ:APA91bFodYF9p12riCdz5sWQNZ5RYWNhalzE5R9AS580Q-xxy_TMEI6x5A8lAeA03mb6f2vO2fJffIo2LcjfrQLu-qGOiUlzoHceXzCg1L77G278-RKnYC5_NyoTrQNzR3ULhsmqeeB7',
'-9999', '', '', 'UPDATE');

if (!$resp->error) {
    echo 'sent...\n';
}

exit();*/

// get a list of reports already sent
$uqids = [];
$sql = mysqli_query($con, "SELECT msgID FROM appNotificationsSent WHERE time >= '$tf'");
while ($row = mysqli_fetch_assoc($sql)) {
    $uqids[] = $row['msgID'];
}

// get app users to send notifications to
if (!$test) {
    $result = mysqli_query($con, "SELECT * FROM appNotifications");
} else {
    $result = mysqli_query($con, "SELECT * FROM appNotifications WHERE auth_user_id = 1");
}

while ($row = mysqli_fetch_assoc($result)) {
    $user = $row['token'];
    $settings = json_decode($row['settings']);
    $roads = $settings->reports->roads;
    $chainsReq = $settings->reports->chains;
    $closures = $settings->closures;

    // send notifications for closures
    if ($settings->notifications->closures) {
        foreach ($incidents->features as $inc) {
            if ($inc->properties->type == 'Closure' && $inc->properties->impact == 'Closure' && in_array($inc->properties->location->hwy, $closures)) {
                $upload = json_encode(json_decode(json_encode($inc, true)));
                $lanes = [];
                foreach ($inc->properties->lanes as $e) {
                    $lanes[] = $e->direction;
                }
                $lanes = array_values(array_unique($lanes));
                $bothDir = ((in_array('WB', $lanes) && in_array('EB', $lanes)) || (in_array('NB', $lanes) && in_array('SB', $lanes)) ? true : false);

                $incID = $inc->properties->id;
                $loc = $inc->properties->location->desc;
                $loc2 = $inc->properties->location->enddesc;
                $mp1 = $inc->properties->location->milepost->start;
                $mp2 = $inc->properties->location->milepost->end;
                $dist = abs($mp2-$mp1);
                $dir = $inc->properties->location->direction ? $inc->properties->location->direction : (count($lanes) == 1 ? $lanes[0] : implode(' & ', $lanes));
                //$range = ' (MP '.($mp1 && $mp2 ? $mp1.' to '.$mp2 : ($mp1 ? $mp1 : $mp2)).' '.$dir.')';
                $title = 'CLOSURE: '.$inc->properties->location->hwy.$range;
                $msgContent = $loc.': '.$inc->properties->desc;
                #$title = 'CLOSURE: '.$loc;
                /*$msgContent = $inc->properties->location->hwy.' is closed '.($mp2 ? 'for '.$dist.' miles '.($bothDir ? 'between' : 'from').' '.
                    explode(', ', $loc)[1].' '.($bothDir ? 'and' : 'to').' '.explode(', ', $loc2)[1] : ($bothDir ? 'in both directions ' : '').'at milepost '.$mp1).'. '.$inc->properties->desc;*/

                $msg = mysqli_real_escape_string($con, $msgContent);

                mysqli_query($con, "INSERT IGNORE INTO closures (id,json) VALUES('$incID','$upload')");

                $uqid = preg_replace('/([A-Za-z]+)/', '', $row['uid'].$incID);
                if (!in_array($uqid, $uqids)) {
                    $resp = sendNotification($user, str_replace('T', '', $incID), $title, $msg, 'INCIDENT');

                    if (!$resp->error) {
                        echo 'Notification for '.$incID.' sent to user #'.$row['uid'].'...
';
                        mysqli_query($con, "INSERT INTO appNotificationsSent (user,msgID,text,time) VALUES('$row[uid]','$uqid', '$loc|$msg', '$now')") or die(mysqli_error($con));
                    }
                }
            }
        }
    }

    // send notifications for 12-37 updates/changes
    if ($settings->notifications->reports) {
        foreach ($reports->rw as $rpt) {
            if (in_array($rpt->name, $roads)) {
                $weather = $road = false;

                if (in_array(weather($rpt->weather), $settings->reports->weather)) {
                    $weather = true;
                }

                if (in_array($rpt->road->id, $settings->reports->conditions)) {
                    $road = true;
                }

                if ($road || $weather) {
                    if ($road && $weather) {
                        $title = 'Road Conditions & Weather Update';
                    } else {
                        if ($road && !$weather) {
                            $title = 'Road Conditions Update';
                        } else {
                            $title = 'Weather Update';
                        }
                    }

                    if ($rpt->restrict->chains->cond == 'A') {
                        $chains = '';
                    } else {
                        $chains = $rpt->restrict->chains->desc;
                    }

                    $uqid = $row['uid'].$rpt->id.$rpt->updated;
                    $time = date('g:i A', $rpt->updated);
                    $msg = mysqli_real_escape_string($con, 'At '.$time.', ODOT was reporting '.$rpt->temp.'°F and '.strtolower($rpt->weather).' with '.strtolower($rpt->road->condition).'.'.($chains != '' ? ' '.$chains.'.' : ''));

                    // if this road report update wasn't already sent
                    if (!in_array($uqid, $uqids)) {
                        $resp = sendNotification($user, $rpt->id, $rpt->name, $msg, 'RW');

                        if (!$resp->error) {
                            echo 'Notification for '.$rpt->name.' sent to user #'.$row['uid'].'...
';
                            mysqli_query($con, "INSERT INTO appNotificationsSent (user,msgID,text,time) VALUES('$row[uid]', '$uqid', '$rpt->name|$msg', '$now')");
                        }
                    }
                }
            }
        }
    }
}

mysqli_close($con);

/*
stdClass Object
(
    [notifications] => stdClass Object
        (
            [reports] => 1
        )

    [reports] => stdClass Object
        (
            [weather] => Array
                (
                    [0] => 7
                    [1] => 8
                    [2] => 9
                )

            [conditions] => Array
                (
                    [0] => 5
                    [1] => 6
                )

        )

)*/