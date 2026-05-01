<?
////ini_set('display_errors', 0);
////error_reporting(E_ALL);
ini_set('session.cookie_domain', '.mapotechnology.com');

$allowed_origins = [
    "https://mapotechnology.com",
    "https://www.mapotechnology.com"
];
$mapboxToken = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header('Content-type: application/json');
session_start();

require_once '/home/mapo/public_html/vendor/autoload.php';

use UAParser\Parser;

function getUserID()
{
    global $_REQUEST;

    $token = $_COOKIE['token'] ?? $_REQUEST['token'] ?? null;

    $user = executeQuery('s', [$token], "SELECT uid FROM sessions WHERE token = ? LIMIT 1");
    return $user['uid'] ?? null;
}

function deleteMapboxFeature($id)
{
    global $mapboxToken;
    $ch = curl_init();
    $url = "https://api.mapbox.com/datasets/v1/mapollc/clnnlg3w728a02nmv0ffz57jf/features/$id?access_token=$mapboxToken";

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_CUSTOMREQUEST => 'DELETE'
    ]);

    $result = curl_exec($ch);
    if (curl_errno($ch)) return 'Error:' . curl_error($ch);

    return $result;
}

function getMapbox($datasetID)
{
    global $mapboxToken;
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => "https://api.mapbox.com/datasets/v1/mapollc/$datasetID?access_token=$mapboxToken",
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => ['Content-Type: application/json']
    ]);

    $result = curl_exec($ch);
    if (curl_errno($ch)) return curl_error($ch);

    return json_decode($result);
}

include_once '../../db.ini.php';
include_once '/home/mapo/public_html/apis/functions.inc.php';

$callback = $_REQUEST['callback'];
$mode = $_REQUEST['mode'];

if (str_contains($_SERVER['HTTP_ORIGIN'], 'mapotechnology.com') || $_REQUEST['android'] != 1 && isset($_REQUEST['key'])) {
    $id = $_REQUEST['id'];
    $out = null;
    $mapotrails = ['userUploads', 'waypoint', 'gpx', 'media', 'favtrails'];

    if (in_array($callback, $mapotrails)) {
        $con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
    }

    //  START APIS  //
    if ($callback == 'mapotrails') {
        if ($mode == 'meta') $out = getMapbox('clnnlg3w728a02nmv0ffz57jf');
    } else if ($callback == 'invoices') {
        $query = executeQuery('s', [$_SESSION['email']], "SELECT cid FROM billing WHERE email = ? ORDER BY status ASC, created DESC LIMIT 1");

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
        $uid = getUserID();
        $sql = mysqli_query($con2, "SELECT u.* FROM userMapUploads AS u WHERE uid = $uid ORDER BY u.modified DESC");

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
    } else if ($callback == 'favFires') {
        $uid = getUserID();
        $sql = "SELECT incidentId, state, name, date, geo, type, acres, t.wfid, time, status FROM track_fires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid WHERE uid = $uid";

        $result = mysqli_query($con, $sql);
        while ($row = mysqli_fetch_assoc($result)) {
            $f[] = [
                'wfid' => intval($row['wfid']),
                'incidentId' => $row['incidentId'],
                'state' => $row['state'],
                'date' => $row['date'],
                'name' => $row['name'],
                'type' => $row['type'],
                'acres' => /*$uid == 1 ? $row['acres'] - 1000 : */ $row['acres'],
                'geo' => $row['geo'],
                'status' => unserialize($row['status']),
                'url' => wildfireURL($row['wfid'], $row['name'], $row['state'])
            ];
        }

        $out = ['fires' => $f];
    } else if ($callback == 'favtrails') {
        $uid = getUserID();

        if ($_REQUEST['method'] == 'remove') {
            mysqli_query($con2, "DELETE FROM track_trails WHERE tid = '$_REQUEST[tid]' AND uid = '$uid'");

            $out = ['success' => 1];
        } else {
            $sql = mysqli_query($con2, "SELECT t.id, f.tid, t.type, title, stats FROM track_trails AS f LEFT JOIN trails AS t ON t.id = f.tid LEFT JOIN stats AS s ON s.trail_id = f.tid WHERE uid = $uid ORDER BY f.time DESC");

            while ($row = mysqli_fetch_assoc($sql)) {
                $trails[] = [
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'url' => guideUrl($row['title'], $row['type'], $row['tid']),
                    'stats' => unserialize($row['stats'])
                ];
            }

            $out = $trails;
        }
    } else if ($callback == 'updateUser') {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT password, phone FROM users WHERE uid = '$_REQUEST[uid]'"));

        if ($mode == 'location') {
            $geo = mysqli_real_escape_string($con, $_REQUEST['geo']);

            mysqli_query($con, "UPDATE users SET location = '$geo' WHERE uid = '$_REQUEST[uid]'");
            $out = 'success';
        } else if ($mode == 'password') {
            $old = $_REQUEST['old'];
            $new = $_REQUEST['new'];
            $cpass = $_REQUEST['confirm'];

            if (!password_verify($old, $row['password'])) {
                $out = ['error' => 1];
            } else {
                if (!$new) {
                    $out = ['error' => 2];
                } else if ($new && !$cpass) {
                    $out = ['error' => 3];
                } else {
                    $pass = password_hash($new, PASSWORD_DEFAULT);
                    mysqli_query($con, "UPDATE users SET password = '$pass' WHERE uid = '$_REQUEST[uid]'");
                    $out = ['success' => 1];
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
    } else if ($callback == 'getFires') {
        if (isset($_REQUEST['start']) && isset($_REQUEST['end'])) {
            $start = strtotime($_REQUEST['start'] . ' 00:00:00');
            $end = strtotime($_REQUEST['end'] . ' 23:59:59');
        } else {
            $start = strtotime('1/1/' . date('Y') . ' 00:00:00');
            $end = time();
        }

        $when = "(date >= $start AND date <= $end)";

        $where = isset($_REQUEST['q']) && $_REQUEST['q'] != '' ? ' AND (name LIKE \'%' . $_REQUEST['q'] . '%\' OR incidentID LIKE \'%' . $_REQUEST['q'] . '%\')' : '';
        $where .= isset($_REQUEST['type']) && $_REQUEST['type'] != '' ? ' AND type = \'' . $_REQUEST['type'] . '\'' : '';
        //$where .= isset($_REQUEST['state']) && $_REQUEST['state'] != '' ? ' AND state = \'' . $_REQUEST['state'] . '\'' : '';
        $where .= isset($_REQUEST['unit']) && $_REQUEST['unit'] != '' ? ' AND incidentID LIKE \'%' . $_REQUEST['unit'] . '%\'' : '';
        $where .= isset($_REQUEST['dispatch']) && $_REQUEST['dispatch'] != '' ? ' AND agency = \'' . $_REQUEST['dispatch'] . '\'' : '';
        $where .= isset($_REQUEST['display']) && $_REQUEST['display'] != '' ? ' AND display = \'' . ($_REQUEST['display'] == 'yes' ? 1 : 0) . '\'' : '';

        if (isset($_REQUEST['state']) && is_array($_REQUEST['state']) && !empty($_REQUEST['state'][0])) {
            foreach ($_REQUEST['state'] as $state) {
                $states .= "state = '$state' OR ";
            }

            $where .= " AND (" . substr($states, 0, -4) . ")";
        }

        $rowsPerPage = 100;
        $currentPage = $_REQUEST['results'] ?? 1;
        $offset = ($currentPage - 1) * $rowsPerPage;

        if ($mode == 'duplicates') {
            $year = date('Y');
            $where = preg_replace('/AND\s([a-z]+)\s=\s/m', 'AND t1.$1 = ', str_replace(['AND display = \'1\'', 'AND display = \'0\''], ['', ''], $where)) . ' AND date > ' . strtotime('-1 week');
            $query = "SELECT t1.* FROM wildfires t1 JOIN (SELECT state, name, MAX(date) as max_date FROM wildfires WHERE $when AND display = 1 GROUP BY state, name HAVING COUNT(*) > 1) t2 ON t1.state = t2.state AND t1.name = t2.name WHERE t1.year = $year AND t1.display = 1 $where ORDER BY t1.state ASC, t1.name ASC, t1.acres DESC";
        } else {
            $query = "SELECT wfid, agency, incidentID, type, state, name, year, date, acres, updated, display, owner FROM wildfires WHERE $when $where AND display IS NOT NULL ORDER BY " . (isset($_REQUEST['sort']) ? ($_REQUEST['sort'] == 'acres' ? 'CAST(acres AS float)' : $_REQUEST['sort']) . ' ' . $_REQUEST['order'] : (!isset($_REQUEST['q']) || (isset($_REQUEST['q']) && $_REQUEST['q'] == '') ? "date DESC" : "CAST(acres AS float) DESC"));
            $totalRows = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS totalRows FROM wildfires WHERE $when $where AND display IS NOT NULL"))['totalRows'];
            $query .= " LIMIT $offset, $rowsPerPage";
        }

        $sql = mysqli_query($con, $query);

        if ($mode == 'duplicates') $totalRows = mysqli_num_rows($sql);

        while ($row = mysqli_fetch_assoc($sql)) {
            $row['name'] = incidentName($row['name'], $row['incidentID'], $row['type']);
            $out['fires'][] = $row;
        }

        $out['count'] = intval($totalRows ?? 0);
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

        if (isset($_REQUEST['token']) && $_REQUEST['token'] != '') {
            $resp = executeQuery('s', [$_REQUEST['token']], "SELECT u.uid FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid WHERE s.token = ? AND s.expires > 0 LIMIT 1");
            $uid = $resp['uid'];
        } else {
            $uid = $_SESSION['uid'];
        }

        if (!$uid) {
            $out = ['error' => 'No token was provided or your session ID doesn\'t exist'];
        } else {
            $account = executeQuery('i', [$uid], "SELECT uid, first_name, last_name, email, ip_address, last_active, created, role, phone, location, provider FROM users WHERE uid = ?");
            $mf = executeQuery('i', [$uid], "SELECT settings, method, CAST(time AS FLOAT) AS last_synced FROM settings WHERE uid = ?");
            $mt = executeQuery('i', [$uid], "SELECT settings, method, CAST(time AS FLOAT) AS last_synced FROM trail_settings WHERE uid = ?");
            $ore = executeQuery('i', [$uid], "SELECT settings, CAST(time AS FLOAT) AS last_synced FROM oreroads_settings WHERE uid = ?");
            $sess = executeQuery('i', [$uid], "SELECT sid, ip, host, source AS login_source, location, CAST(created AS FLOAT) AS logged_in FROM sessions WHERE uid = ? ORDER BY created DESC");

            $mtUp = executeQuery('i', [$uid], "SELECT fid, fileName, file AS filePath, CAST(size AS INT) AS size, type, CAST(created AS FLOAT) AS created, CAST(modified AS FLOAT) AS modified FROM userMapUploads WHERE uid = ?", true);
            $fold = executeQuery('i', [$uid], "SELECT id AS object_id, fid AS folder_id, name, items, CAST(created AS float) AS created, cast(modified as float) AS modified FROM user_data_folders WHERE uid = ?", true);
            $mtUd = executeQuery('i', [$uid], "SELECT oid AS object_id, gis_id, type, name, color, notes, CAST(created AS float) AS created, CAST(modified AS float) AS modified FROM user_data WHERE uid = ?", true);

            if ($mtUp && !isset($mtUp[0])) $mtUp = [$mtUp];
            if ($mtUd && !isset($mtUd[0])) $mtUd = [$mtUd];
            if ($fold && !isset($fold[0])) $fold = [$fold];

            for ($i = 0; $i < count($sess); $i++) {
                if ($mtUd[$i]['stats']) $mtUd[$i]['stats'] = json_decode($mtUd[$i]['stats']);
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
                if ($k == 'last_active' || $k == 'created') $v = floatval($v);
                if ($k == 'provider') $v = $v == 1 ? 'google' : 'mapo';
                if ($k == 'location') $v = json_decode($v);
                if ($k == 'role') $v = getUserRole($v);

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
    }
} else {
    $out = ['error' => 'You cannot access this from a browser'];
}

mysqli_close($con);
if ($con2) mysqli_close($con2);

echo json_encode(['response' => $out]);
#echo json_encode(array('response' => $out), JSON_PRETTY_PRINT);