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

function convert($lat)
{
    $a = explode('/', $lat[0])[0];
    $b = explode('/', $lat[1])[0];
    $c = explode('/', $lat[2])[0];

    return [$a, $b, $c];
}

function DMStoDD($deg, $min, $sec)
{
    return $deg + ((($min * 60) + (substr($sec, 0, -2) . '.' . substr($sec, -2))) / 3600);
}

function gps($lat, $lon)
{
    $a = convert($lat);
    $b = convert($lon);

    return [DMStoDD($a[0], $a[1], $a[2]), DMStoDD($b[0], $b[1], $b[2]) * -1];
}

function uploadTrailPhotos($trailID)
{
    global $_FILES;
    global $con2;

    $listOfPhotos = [];

    // add new multimedia
    $multimedia = $_FILES['multimedia'] ?? null;

    if (!empty($multimedia['name']) && count($multimedia['name']) > 0) {
        // Start new media deltas right after the highest reordered delta, 
        // or fallback to counting database rows if no media items were posted.
        $existingRes = mysqli_query($con2, "SELECT COUNT(*) as cnt FROM media WHERE trail_id = $trailID");
        $existingRow = mysqli_fetch_assoc($existingRes);
        $delta = (int)($existingRow['cnt'] ?? 0);

        $target_dir = '/home/mapo/public_html/mapotrails.com/data/photos/';

        for ($i = 0; $i < count($multimedia['name']); $i++) {
            // Skip empty upload fields.
            if (empty($multimedia['name'][$i])) {
                continue;
            }

            // Skip files that PHP reported as having an upload error.
            if ($multimedia['error'][$i] !== UPLOAD_ERR_OK) {
                $wf = true;
                continue;
            }

            /*
         * Validate the actual image rather than trusting the filename extension.
         * getimagesize() also gives us the dimensions and MIME type we need later.
         */
            $exif = @getimagesize($multimedia['tmp_name'][$i]);

            if ($exif === false) {
                $wf = true;
                continue;
            }

            $mime = $exif['mime'];

            if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif'], true)) {
                $wf = true;
                continue;
            }

            // Get the original extension from the uploaded filename.
            $extn = strtolower(pathinfo($multimedia['name'][$i], PATHINFO_EXTENSION));

            if ($extn === 'jpeg') $extn = 'jpg';

            // Generate a safe filename instead of relying on the user's uploaded filename. This also eliminates filename collisions.
            $basename = pathinfo($multimedia['name'][$i], PATHINFO_FILENAME)
                . '_' . bin2hex(random_bytes(4))
                . '.' . $extn;

            $target_file = "{$target_dir}{$basename}";

            // Move the original image into the photos directory.
            if (!move_uploaded_file($multimedia['tmp_name'][$i], $target_file)) {
                $wf = true;
                continue;
            }

            // Read EXIF data about the photo.
            $exifData = '';

            $exif = @exif_read_data($target_file, 'IFD0');

            if ($exif !== false) {
                $size = $exif['FileSize'] ?? filesize($target_file);
                $ewidth = $exif['COMPUTED']['Width'] ?? null;
                $eheight = $exif['COMPUTED']['Height'] ?? null;

                $date = null;

                if (!empty($exif['DateTimeOriginal'])) {
                    $date = strtotime($exif['DateTimeOriginal']);
                } elseif (!empty($exif['FileDateTime'])) {
                    $date = $exif['FileDateTime'];
                }

                if ($size && $ewidth && $eheight) {
                    $data = [
                        'filesize' => $size,
                        'width'    => $ewidth,
                        'height'   => $eheight,
                        'time'     => $date
                    ];

                    if (!empty($exif['GPSLatitude']) && !empty($exif['GPSLongitude'])) {
                        $data['coordinates'] = gps(
                            $exif['GPSLatitude'],
                            $exif['GPSLongitude']
                        );
                    }

                    $exifData = json_encode(
                        $data,
                        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
                    );
                }
            }

            /*
         * Get the actual image dimensions.
         * $exif is already the getimagesize() result from above,
         * but read it again from the moved file so all processing
         * happens against the final file.
         */
            $exif = @getimagesize($target_file);

            // Remove the original if it somehow isn't a valid image.
            if ($exif === false) {
                unlink($target_file);
                $wf = true;
                continue;
            }

            $width = $exif[0];
            $height = $exif[1];

            $type = match ($exif['mime']) {
                'image/jpeg' => 'jpeg',
                'image/png'  => 'png',
                'image/gif'  => 'gif',
                default      => ''
            };

            if (!$type || !$width || !$height) {
                unlink($target_file);
                $wf = true;
                continue;
            }

            // Calculate resized dimensions while preserving aspect ratio.
            $newwidth = 480;
            $newheight = round($height / ($width / $newwidth));

            $newwidth2 = 350;
            $newheight2 = round($height / ($width / $newwidth2));

            // Create the resized images.
            $thumb = imagecreatetruecolor($newwidth, $newheight);
            $thumb2 = imagecreatetruecolor($newwidth2, $newheight2);

            // Preserve transparency for PNG and GIF images.
            if ($type === 'png' || $type === 'gif') {
                imagealphablending($thumb, false);
                imagesavealpha($thumb, true);

                imagealphablending($thumb2, false);
                imagesavealpha($thumb2, true);

                $transparent = imagecolorallocatealpha($thumb, 0, 0, 0, 127);
                $transparent2 = imagecolorallocatealpha($thumb2, 0, 0, 0, 127);

                imagefill($thumb, 0, 0, $transparent);
                imagefill($thumb2, 0, 0, $transparent2);
            }

            // Create the source image.
            $source = match ($type) {
                'jpeg' => @imagecreatefromjpeg($target_file),
                'png'  => @imagecreatefrompng($target_file),
                'gif'  => @imagecreatefromgif($target_file),
                default => false
            };

            if ($source === false) {
                unlink($target_file);

                $wf = true;
                continue;
            }

            // Resize the image to both required sizes.
            imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newwidth, $newheight, $width, $height);
            imagecopyresampled($thumb2, $source, 0, 0, 0, 0, $newwidth2, $newheight2, $width, $height);

            // Save the large and thumbnail versions.
            if ($type === 'jpeg') {
                imagejpeg($thumb, "{$target_dir}large/$basename", 100);
                imagejpeg($thumb2, "{$target_dir}thumbnail/$basename", 100);
            } elseif ($type === 'png') {
                imagepng($thumb, "{$target_dir}large/$basename");
                imagepng($thumb2, "{$target_dir}thumbnail/$basename");
            } elseif ($type === 'gif') {
                imagegif($thumb, "{$target_dir}large/$basename");
                imagegif($thumb2, "{$target_dir}thumbnail/$basename");
            }

            /*
         * Add the media record to the existing SQL query string.
         *
         * Escape values because this is still using the existing
         * multi-query process rather than changing the database workflow.
         */
            $trailID_sql = mysqli_real_escape_string($con2, $trailID);
            $basename_sql = mysqli_real_escape_string($con2, $basename);
            $exifData_sql = mysqli_real_escape_string($con2, $exifData);

            mysqli_query($con2, "INSERT INTO media (trail_id, file, type, title, data, delta) VALUES ('$trailID_sql', '$basename_sql', 'photo', '', '$exifData_sql', '$delta')");
            $mid = mysqli_insert_id($con2);

            $listOfPhotos[] = [
                'id' => $mid,
                'file' => $basename,
                'delta' => $delta,
                'exif' => json_decode($exifData)
            ];

            // Increment only after successfully processing the image.
            $delta++;
        }
    }

    return $listOfPhotos;
}

$id = $_REQUEST['id'] ?? null;
$mode = $_REQUEST['mode'] ?? null;
$mapotrails = ['mapotrails', 'userUploads', 'waypoint', 'gpx', 'media', 'favtrails', 'getTrails', 'download'];
$mapboxToken = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';

if (in_array($method, $mapotrails)) $con2 = mapoTrailsDB();

// METHOD: mapotrails
if ($method == 'mapotrails') {
    if ($function == 'keywords') {
        $terms = [];

        $result = mysqli_query($con2, "SELECT keywords FROM trails");

        while ($row = mysqli_fetch_assoc($result)) {
            foreach (json_decode($row['keywords']) as $k) {
                if ($k != '') $terms[] = $k;
            }
        }

        $response = array_values(array_unique($terms));
    }

    if ($function == 'meta') {
        $response = getMapbox('clnnlg3w728a02nmv0ffz57jf');
    }

    // METHOD: waypoint
    if ($function == 'waypoint') {
        if ($mode == 'delete') {
            executeQuery('s', [$id], "DELETE FROM waypoints WHERE id = ?", true);
            $response = 'success';
        }
    }

    // METHOD: gpx
    if ($function == 'gpx') {
        if ($mode == 'delete') {
            executeQuery('s', [$id], "DELETE FROM gpx WHERE id = ?", true);

            if ($_REQUEST['delta'] == 0) {
                executeQuery('s', [$_REQUEST['trail_id']], "DELETE FROM `stats` WHERE trail_id = ?", true);
            }

            $folder = '/home/mapo/public_html/mapotrails.com/data/gpx';

            if (file_exists("$folder/{$_REQUEST['filename']}")) {
                unlink("$folder/{$_REQUEST['filename']}");
            }

            deleteMapboxFeature($id);

            $response = 'success';
        }
    }

    // METHOD: media
    if ($function == 'media') {
        if ($mode == 'upload') {
            $response = uploadTrailPhotos($_REQUEST['trail_id']);
        }

        if ($mode == 'delete') {
            executeQuery('s', [$id], "DELETE FROM media WHERE id = ?", true);

            $folder = '/home/mapo/public_html/mapotrails.com/data/photos';

            unlink("$folder/{$_REQUEST['filename']}");
            unlink("$folder/large/{$_REQUEST['filename']}");
            unlink("$folder/thumbnail/{$_REQUEST['filename']}");

            $response = 'success';
        }
    }

    // METHOD: stats
    if ($function == 'stats') {
        $stats = null;
        $data = executeQuery('s', [$id], "SELECT stats FROM stats WHERE gis_id = ?", true);

        if (!empty($data)) $stats = json_decode($data['stats']);

        $response = ['stats' => $stats];
    }
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

// METHOD: favFires
if ($method == 'favFires') {
    $uid = getUserID();
    $sql = "SELECT incidentId, state, name, date, geo, type, acres, t.wfid, time, status FROM track_fires AS t LEFT JOIN wildfires AS w ON w.wfid = t.wfid WHERE uid = ?";

    $result = executeQuery('i', [$uid], $sql);
    foreach ($result as $row) {
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

        foreach ($result as $row) {
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

    if ($function == 'duplicates') {
        $year = date('Y');
        $where = preg_replace('/AND\s([a-z]+)\s=\s/m', 'AND t1.$1 = ', str_replace(['AND display = \'1\'', 'AND display = \'0\''], ['', ''], $where)) . ' AND date > ' . strtotime('-1 week');
        $query = "SELECT t1.* FROM wildfires t1 JOIN (SELECT state, name, MAX(date) as max_date FROM wildfires WHERE $when AND display = 1 GROUP BY state, name HAVING COUNT(*) > 1) t2 ON t1.state = t2.state AND t1.name = t2.name WHERE t1.year = $year AND t1.display = 1 $where ORDER BY t1.state ASC, t1.name ASC, t1.acres DESC";
    } else {
        $query = "SELECT wfid, agency, incidentID, type, state, name, year, date, acres, updated, display, owner FROM wildfires WHERE $when $where AND display IS NOT NULL ORDER BY " . (isset($_REQUEST['sort']) ? ($_REQUEST['sort'] == 'acres' ? 'CAST(acres AS float)' : $_REQUEST['sort']) . ' ' . $_REQUEST['order'] : (!isset($_REQUEST['q']) || (isset($_REQUEST['q']) && $_REQUEST['q'] == '') ? "date DESC" : "CAST(acres AS float) DESC"));
        $totalRows = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS totalRows FROM wildfires WHERE $when $where AND display IS NOT NULL"))['totalRows'];
        $query .= " LIMIT $offset, $rowsPerPage";
    }

    $sql = mysqli_query($con, $query);

    if ($function == 'duplicates') $totalRows = mysqli_num_rows($sql);

    while ($row = mysqli_fetch_assoc($sql)) {
        $row['name'] = incidentName($row['name'], $row['incidentID'], $row['type']);
        $row['url'] = wildfireURL($row['wfid'], $row['name'], $row['state']);
        $response['fires'][] = $row;
    }

    $response['count'] = intval($totalRows ?? 0);
}

// METHOD: getTrails
if ($method == 'getTrails') {
    $catFilter = $_REQUEST['category'] == 'All Activities' ? '' : strtolower($_REQUEST['category'] ?? '');

    if (!isset($_REQUEST['type']) || strtolower($_REQUEST['type']) == 'all') {
        $types = "'trail','snow'";
    } else {
        $types = '"' . $_REQUEST['type'] . '"';
    }

    $where = "type IN ($types)";
    $where .= isset($_REQUEST['q']) && $_REQUEST['q'] != '' ? ' AND (title LIKE \'%' . $_REQUEST['q'] . '%\' OR keywords LIKE \'%' . $_REQUEST['q'] . '%\')' : '';

    $rowsPerPage = 100;
    $currentPage = $_REQUEST['results'] ?? 1;
    $offset = ($currentPage - 1) * $rowsPerPage;

    $query = "SELECT t.id, type, title, term, author, premium, public, created, updated
    FROM trails t
    LEFT JOIN categories c ON c.trail_id = t.id
    WHERE $where
    ORDER BY " . ($_REQUEST['sort'] ?: 'updated') . ' ' . ($_REQUEST['order'] ?: 'DESC');

    $totalRows = mysqli_fetch_assoc(mysqli_query($con2, "SELECT COUNT(*) AS totalRows FROM trails WHERE $where"))['totalRows'];
    $query .= " LIMIT $offset, $rowsPerPage";

    $sql = mysqli_query($con2, $query);

    while ($row = mysqli_fetch_assoc($sql)) {
        if ($catFilter !== '') {
            $terms = json_decode(strtolower($row['term'] ?? ''), true) ?? [];

            // Skip if the requested type is not in the decoded JSON terms array
            if (!in_array($catFilter, $terms, true)) {
                continue;
            }
        }

        $response['trails'][] = [
            'id' => (int) $row['id'],
            'type' => $row['type'],
            'title' => $row['title'],
            'author' => $row['author'],
            'url' => guideUrl($row['title'], $row['type'], $row['id']),
            'public' => (int) $row['public'],
            'premium' => (int) $row['premium'],
            'created' => (int) $row['created'],
            'updated' => (int) $row['updated']
        ];
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
