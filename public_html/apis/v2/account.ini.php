<?
use UAParser\Parser;

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

function getUserID()
{
    global $_REQUEST;

    $token = $_COOKIE['token'] ?? $_REQUEST['token'] ?? null;

    $user = executeQuery('s', [$token], "SELECT uid FROM sessions WHERE token = ? LIMIT 1");
    return $user['uid'] ?? null;
}

$id = $_REQUEST['id'] ?? null;
$mode = $_REQUEST['mode'] ?? null;
$mapotrails = ['userUploads', 'waypoint', 'gpx', 'media', 'favtrails', 'download'];
$mapboxToken = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';

if (in_array($method, $mapotrails)) $con2 = mapoTrailsDB();

// METHOD: mapotrails
if ($method == 'mapotrails') {
    if ($mode == 'meta') $response = getMapbox('clnnlg3w728a02nmv0ffz57jf');
}

// METHOD: invoices
if ($method == 'invoices') {
    $query = executeQuery('s', [$_SESSION['email']], "SELECT cid FROM billing WHERE email = ? ORDER BY status ASC, created DESC LIMIT 1");

    if (count($query) == 0) {
        $response = 'error';
    } else {
        include_once '/home/mapo/stripe/init.php';
        $stripe = new \Stripe\StripeClient($stripeSecretKey);

        try {
            $invoices = $stripe->invoices->all([
                'customer' => $query['cid'],
                'limit' => 25
            ]);

            $response = $invoices;
        } catch (Exception $e) {
            $response = null;
        }
    }
}

// METHOD: receipt
if ($method == 'receipt') {
    include_once '/home/mapo/stripe/init.php';
    \Stripe\Stripe::setApiKey($stripeSecretKey);

    $response = \Stripe\Charge::retrieve($_REQUEST['charge'], []);
}

// METHOD: userUploads
if ($method == 'userUploads') {
    $uid = getUserID();
    $sql = executeQuery('i', [$uid], "SELECT u.* FROM userMapUploads AS u WHERE uid = ? ORDER BY u.modified DESC");

    while ($row = mysqli_fetch_assoc($sql)) {
        $response[] = $row;
    }
} 

// METHOD: waypoint
if ($method == 'waypoint') {
    if ($mode == 'delete') {
        executeQuery('s', [$id], "DELETE FROM waypoints WHERE id = ?");
        $response = 'success';
    }
} 

// METHOD: gpx
if ($method == 'gpx') {
    if ($mode == 'delete') {
        executeQuery('s', [$id], "DELETE FROM gpx WHERE id = ?");

        if ($_REQUEST['delta'] == 0) {
            executeQuery('s', [$_REQUEST['trail_id']], "DELETE FROM `stats` WHERE trail_id = ?");
        }

        if (file_exists('/home/mapo/public_html/mapotrails.com/data/gpx/' . $_REQUEST['filename'])) {
            unlink('/home/mapo/public_html/mapotrails.com/data/gpx/' . $_REQUEST['filename']);
        }

        deleteMapboxFeature($id);

        $response = 'success';
    }
}

// METHOD: media
if ($method == 'media') {    
    if ($mode == 'delete') {
        executeQuery('s', [$id], "DELETE FROM media WHERE id = ?");

        unlink('/home/mapo/public_html/mapotrails.com/data/photos/' . $_REQUEST['filename']);
        unlink('/home/mapo/public_html/mapotrails.com/data/photos/large/' . $_REQUEST['filename']);
        unlink('/home/mapo/public_html/mapotrails.com/data/photos/thumbnail/' . $_REQUEST['filename']);
        $response = 'success';
    }
}

// METHOD: favFires
if ($method == 'favFires') {
    $uid = getUserID();
    $sql = "SELECT incidentId, state, name, date, geo, type, acres, t.wfid, time, status FROM track_fires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid WHERE uid = ?";

    $result = executeQuery('i', [$uid], $sql);
    foreach($result as $row) {
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

    $response = ['fires' => $f];
}

// METHOD: favTrails
if ($method == 'favTrails') {
    $uid = getUserID();

    if ($_REQUEST['method'] == 'remove') {
        executeQuery('ii', [$_REQUEST['tid'], $uid], "DELETE FROM track_trails WHERE tid = ? AND uid = ?");

        $response = ['success' => 1];
    } else {
        $result = executeQuery('i', [$uid], "SELECT t.id, f.tid, t.type, title, stats FROM track_trails AS f LEFT JOIN trails AS t ON t.id = f.tid LEFT JOIN stats AS s ON s.trail_id = f.tid WHERE uid = ? ORDER BY f.time DESC");

        foreach($result as $row) {
            $trails[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'url' => guideUrl($row['title'], $row['type'], $row['tid']),
                'stats' => unserialize($row['stats'])
            ];
        }

        $response = $trails;
    }
}

// METHOD: wildfires
if ($method == 'wildfires') {
    if ($mode == 'hide') {
        mysqli_query($con, "UPDATE wildfires SET display = '0' WHERE wfid = $id");
        logEvent('A wildfire was hidden from displaying (wfid #' . $_REQUEST['wfid'] . ')');

        $response = 'success';
    }
}

// METHOD: getFires
if ($method == 'getFires') {
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
        $row['url'] = wildfireURL($row['wfid'], $row['name'], $row['state']);
        $response['fires'][] = $row;
    }

    $response['count'] = intval($totalRows ?? 0);
}

// METHOD: jurisdictions
if ($method == 'jurisdictions') {
    $query = $_REQUEST['q'];
    $sql = mysqli_query($con, "SELECT agency, unit, area FROM dispatch_zones WHERE unit LIKE '%$query%' OR agency LIKE '%$query%' OR area LIKE '%$query%' ORDER BY unit ASC LIMIT 25");

    while ($row = mysqli_fetch_assoc($sql)) {
        $results[] = $row;
    }

    $response = ['results' => $results];
}

if ($method == 'download') {
    //$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
    $user_agent = Parser::create();

    if (isset($_REQUEST['token']) && $_REQUEST['token'] != '') {
        $resp = executeQuery('s', [$_REQUEST['token']], "SELECT u.uid FROM sessions AS s LEFT JOIN users AS u ON u.uid = s.uid WHERE s.token = ? AND s.expires > 0 LIMIT 1");
        $uid = $resp['uid'];
    } else {
        $uid = $_SESSION['uid'];
    }

    if (!$uid) {
        $response = ['error' => 'No token was provided or your session ID doesn\'t exist'];
    } else {
        $account = executeQuery('i', [$uid], "SELECT uid, first_name, last_name, email, ip_address, last_active, created, role, phone, location, provider FROM users WHERE uid = ?");
        $mf = executeQuery('i', [$uid], "SELECT settings, method, CAST(time AS FLOAT) AS last_synced FROM settings WHERE uid = ?");
        $mt = executeQuery('i', [$uid], "SELECT settings, method, CAST(time AS FLOAT) AS last_synced FROM trail_settings WHERE uid = ?");
        $ore = executeQuery('i', [$uid], "SELECT settings, CAST(time AS FLOAT) AS last_synced FROM oreroads_settings WHERE uid = ?");
        $sess = executeQuery('i', [$uid], "SELECT sid, ip, host, source AS login_source, location, CAST(created AS FLOAT) AS logged_in FROM sessions WHERE uid = ? AND expires > 0 ORDER BY created DESC");

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

        $response = [
            'account' => $account,
            'mapofire' => $mf,
            'mapotrails' => $mt,
            'oregonroads' => $ore
        ];
    }
}

$returnJson = ['response' => $response];
