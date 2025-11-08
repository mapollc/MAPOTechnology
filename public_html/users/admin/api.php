<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

$allowed_origins = [
    "https://mapotechnology.com",
    "https://www.mapotechnology.com"
];

header('Content-type: application/json');
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
session_start();

//echo json_encode(['test' => null]);
//exit();

require_once '/home/mapo/public_html/vendor/autoload.php';

use UAParser\Parser;

function deleteMapboxFeature($id)
{
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/datasets/v1/mapollc/clnnlg3w728a02nmv0ffz57jf/features/' . $id . '?access_token=sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        echo 'Error:' . curl_error($ch);
    }
    curl_close($ch);
}

function guideUrl($s, $ty, $id)
{
    $words = array('and', 'at');
    $s = str_replace(' ', '-', str_replace('  ', ' ', preg_replace('/([^A-Za-z0-9\s]+)/', '', strtolower($s))));

    foreach ($words as $r) {
        $s = str_replace($r . '-', '', $s);
    }

    return rtrim(rtrim('guide/' . $ty . '/' . $id . '/' . $s, '-'), ' ');
}

function getMapbox($datasetID)
{
    $token = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/datasets/v1/mapollc/' . $datasetID . '?access_token=' . $token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');

    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $output = curl_error($ch);
    } else {
        $output = $result;
    }
    curl_close($ch);

    return json_decode($output);
}

include_once '../../db.ini.php';

$callback = $_REQUEST['callback'];
$mode = $_REQUEST['mode'];

if (str_contains($_SERVER['HTTP_REFERER'], 'mapotechnology.com') || $_REQUEST['android'] != 1) {
    $id = $_REQUEST['id'];
    $out = null;
    $mapotrails = array('userUploads', 'waypoint', 'gpx', 'media', 'favtrails');

    if (in_array($callback, $mapotrails)) {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
    }

    //  START APIS  //
    if ($callback == 'mapotrails') {
        if ($mode == 'meta') {
            $out = getMapbox('clnnlg3w728a02nmv0ffz57jf');
        }
    } else if ($callback == 'invoices') {
        $query = prepareQuery('s', [$_SESSION['email']], "SELECT cid FROM billing WHERE email = ? ORDER BY status ASC, created DESC LIMIT 1");

        if (count($query) == 0) {
            $out = 'error';
        } else {
            include_once '/home/mapo/stripe/init.php';
            $stripe = new \Stripe\StripeClient($stripeSecretKey);

            try {
                $invoices = $stripe->invoices->all([
                    'customer' => $query['cid'],
                    'limit' => 25
                ]);

                $out = $invoices;
            } catch (Exception $e) {
                $out = null;
            }
        }
    } else if ($callback == 'receipt') {
        include_once '/home/mapo/stripe/init.php';
        \Stripe\Stripe::setApiKey($stripeSecretKey);

        $out = \Stripe\Charge::retrieve($_REQUEST['charge'], []);
    } else if ($callback == 'userUploads') {
        $sql = mysqli_query($con2, "SELECT * FROM userMapUploads WHERE uid = $_SESSION[uid] ORDER BY modified DESC");

        while ($row = mysqli_fetch_assoc($sql)) {
            $out[] = $row;
        }
    } else if ($callback == 'waypoint') {
        if ($mode == 'delete') {
            mysqli_query($con2, "DELETE FROM waypoints WHERE id = '$id'");
            $out = 'success';
        }
    } else if ($callback == 'gpx') {
        if ($mode == 'delete') {
            mysqli_query($con2, "DELETE FROM gpx WHERE id = '$id'");

            if ($_REQUEST['delta'] == 0) {
                mysqli_query($con2, "DELETE FROM `stats` WHERE trail_id = '$_REQUEST[trail_id]'");
            }

            if (file_exists('/home/mapo/public_html/mapotrails.com/data/gpx/' . $_REQUEST['filename'])) {
                unlink('/home/mapo/public_html/mapotrails.com/data/gpx/' . $_REQUEST['filename']);
            }

            deleteMapboxFeature($id);

            $out = 'success';
        }
    } else if ($callback == 'media') {
        if ($mode == 'delete') {
            mysqli_query($con2, "DELETE FROM media WHERE id = '$id'");
            unlink('/home/mapo/public_html/mapotrails.com/data/photos/' . $_REQUEST['filename']);
            unlink('/home/mapo/public_html/mapotrails.com/data/photos/large/' . $_REQUEST['filename']);
            unlink('/home/mapo/public_html/mapotrails.com/data/photos/thumbnail/' . $_REQUEST['filename']);
            $out = 'success';
        }
    } else if ($callback == 'favtrails') {
        if ($_REQUEST['method'] == 'remove') {
            mysqli_query($con2, "DELETE FROM track_trails WHERE tid = '$_REQUEST[tid]' AND uid = '$_SESSION[uid]'");

            $out = array('success' => 1);
        } else {
            $sql = mysqli_query($con2, "SELECT t.id, f.tid, t.type, title, stats FROM track_trails AS f LEFT JOIN trails AS t ON t.id = f.tid LEFT JOIN stats AS s ON s.trail_id = f.tid WHERE uid = $_SESSION[uid] ORDER BY time DESC");

            while ($row = mysqli_fetch_assoc($sql)) {
                $trails[] = array('id' => $row['id'], 'title' => $row['title'], 'url' => guideUrl($row['title'], $row['type'], $row['tid']), 'stats' => unserialize($row['stats']));
            }

            $out = $trails;
        }
    } else if ($callback == 'updateUser') {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT password, phone FROM users WHERE uid = '$_REQUEST[uid]'"));

        if ($mode == 'location') {
            $geo = mysqli_real_escape_string($con, serialize(json_decode($_REQUEST['geo'])));

            mysqli_query($con, "UPDATE users SET location = '$geo' WHERE uid = '$_REQUEST[uid]'");
            $out = 'success';
        } else if ($mode == 'password') {
            $old = $_REQUEST['old'];
            $new = $_REQUEST['new'];
            $cpass = $_REQUEST['confirm'];

            if (!password_verify($old, $row['password'])) {
                $out = array('error' => 1);
            } else {
                if (!$new) {
                    $out = array('error' => 2);
                } else if ($new && !$cpass) {
                    $out = array('error' => 3);
                } else {
                    $pass = password_hash($new, PASSWORD_DEFAULT);
                    mysqli_query($con, "UPDATE users SET password = '$pass' WHERE uid = '$_REQUEST[uid]'");
                    $out = array('success' => 1);
                }
            }
        } else {
            $fname = mysqli_real_escape_string($con, $_REQUEST['fname']);
            $lname = mysqli_real_escape_string($con, $_REQUEST['lname']);
            $email = mysqli_real_escape_string($con, $_REQUEST['email']);
            $fields = "first_name = '$fname', last_name = '$lname', email = '$email'";

            if ($row['phone'] != $_REQUEST['phone']) {
                $p = preg_replace('/([^0-9])/', '', $_REQUEST['phone']);
                $p = substr($p, 0, 3) . '-' . substr($p, 3, 3) . '-' . substr($p, 6, 4);
                $phone = mysqli_real_escape_string($con, $p);
                $fields .= ", phone = '$phone'";
            }

            mysqli_query($con, "UPDATE users SET $fields WHERE uid = '$_REQUEST[uid]'");
            $out = 'success';
        }
    } else if ($callback == 'wildfires') {
        if ($mode == 'hide') {
            mysqli_query($con, "UPDATE wildfires SET display = '0' WHERE wfid = '$_REQUEST[id]'");
            logEvent('A wildfire was hidden from displaying (wfid #' . $_REQUEST['wfid'] . ')');

            $out = 'success';
        }
    } else if ($callback == 'jurisdictions') {
        $query = $_REQUEST['q'];
        $sql = mysqli_query($con, "SELECT agency, unit, area FROM dispatch_zones WHERE unit LIKE '%$query%' OR agency LIKE '%$query%' OR area LIKE '%$query%' ORDER BY unit ASC LIMIT 25");

        while ($row = mysqli_fetch_assoc($sql)) {
            $results[] = $row;
        }

        $out = ['results' => $results];
    } else if ($callback == 'download') {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
        $user_agent = Parser::create();

        $account = prepareQuery('i', [$_SESSION['uid']], "SELECT uid, first_name, last_name, email, ip_address, last_active, created, role, phone, location, provider FROM users WHERE uid = ?");
        $mf = prepareQuery('i', [$_SESSION['uid']], "SELECT settings, method, CAST(time AS FLOAT) AS last_synced FROM settings WHERE uid = ?");
        $mt = prepareQuery('i', [$_SESSION['uid']], "SELECT settings, method, CAST(time AS FLOAT) AS last_synced FROM trail_settings WHERE uid = ?");
        $ore = prepareQuery('i', [$_SESSION['uid']], "SELECT settings, CAST(time AS FLOAT) AS last_synced FROM oreroads_settings WHERE uid = ?");
        $sess = prepareQuery('i', [$_SESSION['uid']], "SELECT sid, ip, host, source AS login_source, location, CAST(created AS FLOAT) AS logged_in FROM sessions WHERE uid = ? ORDER BY created DESC");

        $mtUp = prepareQuery('i', [$_SESSION['uid']], "SELECT fid, fileName, file AS filePath, CAST(size AS INT) AS size, type, CAST(created AS FLOAT) AS created, CAST(modified AS FLOAT) AS modified FROM userMapUploads WHERE uid = ?", true);
        $fold = prepareQuery('i', [$_SESSION['uid']], "SELECT id AS object_id, fid AS folder_id, name, items, CAST(created AS float) AS created, cast(modified as float) AS modified FROM user_data_folders WHERE uid = ?", true);
        $mtUd = prepareQuery('i', [$_SESSION['uid']], "SELECT oid AS object_id, gis_id, type, name, color, notes, CAST(created AS float) AS created, CAST(modified AS float) AS modified FROM user_data WHERE uid = ?", true);

        if ($mtUp && !isset($mtUp[0])) {
            $mtUp = [$mtUp];
        }

        if ($mtUd && !isset($mtUd[0])) {
            $mtUd = [$mtUd];
        }

        if ($fold && !isset($fold[0])) {
            $fold = [$fold];
        }

        for ($i = 0; $i < count($sess); $i++) {
            if ($mtUd[$i]['stats']) {
                $mtUd[$i]['stats'] = json_decode($mtUd[$i]['stats']);
            }
        }

        for ($i = 0; $i < count($sess); $i++) {
            if (str_contains($sess[$i]['host'], '}')) {
                $sess[$i]['host'] = json_decode($sess[$i]['host']);
            } else {
                $agent = $user_agent->parse($sess[$i]['host']);
                $sess[$i]['host'] = $agent;
            }

            $sess[$i]['ip_location'] = $sess[$i]['location'] == '' ? 'Unknown' : unserialize($sess[$i]['location']);
            unset($sess[$i]['location']);
        }

        foreach ($account as $k => $v) {
            if ($k == 'last_active' || $k == 'created') {
                $v = floatval($v);
            }

            if ($k == 'provider') {
                $v = $v == 1 ? 'google' : 'mapo';
            }

            if ($k == 'location') {
                $v = unserialize($v);
            }

            if ($k == 'role') {
                $v = getUserRole($v);
            }

            $account[$k] = $v;
        }

        $account['sessions'] = $sess;
        $mf['settings'] = unserialize($mf['settings']);
        $mt['settings'] = json_decode($mt['settings']);
        $ore['settings'] = json_decode($ore['settings']);
        $mf['method'] = $mf['method'] == 1 ? 'automatic' : 'manual';
        $mt['method'] = $mt['method'] == 1 ? 'automatic' : 'manual';

        $mt['userContent'] = [
            'userUploads' => $mtUp,
            'mapCreated' => [
                'folders' => $fold,
                'objects' => $mtUd
            ]
        ];

        $out = [
            'account' => $account,
            'mapofire' => $mf,
            'mapotrails' => $mt,
            'oregonroads' => $ore
        ];
    }
} else {
    $out = array('error' => 'You cannot access this from a browser');
}

mysqli_close($con);
if ($con2) {
    mysqli_close($con2);
}

echo json_encode(array('response' => $out));
#echo json_encode(array('response' => $out), JSON_PRETTY_PRINT);