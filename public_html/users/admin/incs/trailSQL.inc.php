<?
$time = time();
$term = mysqli_real_escape_string($con2, json_encode($_POST['term'] ?? ''));
$title = mysqli_real_escape_string($con2, $_POST['title']);
$route = mysqli_real_escape_string($con2, $_POST['route']);
$season = mysqli_real_escape_string($con2, $_POST['season']);
$contrib = mysqli_real_escape_string($con2, $_POST['contributors']);
$rawKeywords = explode(', ', $_POST['keywords']);
$keywords = mysqli_real_escape_string($con2, json_encode($_POST['keywords'] == '' ? [] : $rawKeywords));

$sqlQueries = '';
$trailID = null;
$wf = null;
$gpxDelta = 0;

$public = $_POST['public'] ?? 0;
$premium = $_POST['premium'] ?? 0;
$type = mysqli_real_escape_string($con2, $_POST['type']);
$maxDelta = -1;

/*
 * * * * * GENERAL META DATA ABOUT THE TRAIL * * * * * 
 */

// add a new trail guide
if ($function == 'create') {
    $author = mysqli_real_escape_string($con2, $_POST['author']);

    mysqli_query($con2, "INSERT INTO trails (`type`,author,title,`route`,keywords,season,contributors,created,updated,public,premium)
    VALUES('$type','$author','$title','$route','$keywords','$season','$contrib','$time','$time',$public,$premium)");

    $trailID = mysqli_insert_id($con2);

    ////logEvent("Created a new trail guide (<a href=\https://www.mapotechnology.com/account/admin/trails/edit?id=$trailID\">$title</a>)");
} else if ($function == 'edit') {
    // edit an existing trail guide
    $trailID = (int) $_POST['id'];

    // update photo captions
    $media = $_POST['media'] ?? null;
    $maxDelta = -1;

    if (!empty($media['id']) && is_array($media['id'])) {
        $sqlQueries .= "UPDATE media SET delta = delta + 10000 WHERE trail_id = $trailID;";

        for ($i = 0; $i < count($media['id']); $i++) {
            $id = (int) $media['id'][$i];
            $newDelta = (int)($media['delta'][$i] ?? $i);
            $caption = mysqli_real_escape_string($con2, $media['caption'][$i] ?? '');

            $sqlQueries .= "UPDATE media SET title = '$caption', delta = $newDelta WHERE id = $id AND trail_id = $trailID;";

            if ($newDelta > $maxDelta) {
                $maxDelta = $newDelta;
            }
        }
    }

    $sqlQueries .= "UPDATE trails SET type = '$type', title = '$title', route = '$route', season = '$season', contributors = '$contrib', 
        keywords = '$keywords', updated = '$time', public = $public, premium = $premium WHERE id = $trailID;";

    ////logEvent("Edited trail guide #$trailID (<a href=\"https://www.mapotechnology.com/account/admin/trails/edit?id=$trailID\">$title</a>)");
}

// add or update categories
$sqlQueries .= "INSERT INTO categories (trail_id,term) VALUES('$trailID','$term') ON DUPLICATE KEY UPDATE term = '$term';";

if (!empty($waypoint['id'])) {
    $count = count($waypoint['id']);

    for ($i = 0; $i < $count; $i++) {
        $id = $waypoint['id'][$i];

        $deltaInput = $waypoint['delta'][$i] ?? null;
        $delta = is_numeric($deltaInput) ? (int)$deltaInput : $i;

        $lat = $waypoint['lat'][$i];
        $lon = $waypoint['lon'][$i];

        $icon = mysqli_real_escape_string($con2, $waypoint['icon'][$i] ?? 'info');
        $name = mysqli_real_escape_string($con2, $waypoint['name'][$i] ?? '');
        $note = mysqli_real_escape_string($con2, $waypoint['note'][$i] ?: 'N/A');

        $elev = getWaypointElev($lat, $lon);

        // New waypoint insertion
        if (!$id) {
            $sqlQueries .= "INSERT INTO waypoints (trail_id, name, lat, lon, elev, note, icon, delta)
            VALUES ($trailID, '$name', $lat, $lon, $elev, '$note', '$icon', $delta);";
        } else {
            // Update existing waypoint, including the new delta order
            $sqlQueries .= "UPDATE waypoints SET name = '$name', lat = $lat, lon = $lon, elev = $elev, note = '$note', icon = '$icon', delta = $delta
            WHERE id = $id AND trail_id = $trailID;";
        }
    }
}

/*
 * * * * * GPX UPLOADS AND PROCESSING * * * * * 
 */

// update existing gpx files
$oldgpx = $_POST['oldgpx'] ?? [];

if (!empty($oldgpx)) {
    foreach ($oldgpx['mode'] ?? [] as $i => $mode) {
        $id = $_POST['oldgpx']['id'][$i];

        if (!$id) continue;

        $currentDelta = (int)($_POST['oldgpx']['delta'][$i] ?? 0);
        $caption = mysqli_real_escape_string($con2, $_POST['oldgpx']['caption'][$i] ?? '');
        $display = $_POST['oldgpx']['display'][$i] ?? 0;
        $filename = basename($_POST['oldgpx']['filename'][$i] ?? '');

        $sqlQueries .= parseGPX(
            $id,
            $trailID,
            $currentDelta,
            $filename
        );

        $sqlQueries .= "UPDATE gpx SET mode = '$mode', caption = '$caption', delta = $currentDelta, display = '$display' WHERE id = $id AND trail_id = $trailID;";
        $gpxDelta = max($gpxDelta, $currentDelta + 1);
    }
}

// add new gpx files
$newGPX = $_POST['gpx'] ?? [];

if (!empty($newGPX['mode'])) {
    $newGPX['mode'] = array_values($newGPX['mode']);
    $newGPX['caption'] = array_values($newGPX['caption'] ?? []);
    $newGPX['display'] = array_values($newGPX['display'] ?? []);

    foreach ($newGPX['mode'] as $i => $mode) {
        $delta = $gpxDelta + $i;

        $caption = mysqli_real_escape_string($con2, $newGPX['caption'][$i]);
        $display = $newGPX['display'][$i] ?? 1;

        $sqlQueries .= doUpload(
            $i,
            $trailID,
            $mode,
            $caption,
            $delta,
            $display
        );
    }
}

/*
 * * * * * MySQL QUERYING * * * * * 
 */

////echo $sqlQueries;exit();
$runSQL = mysqli_multi_query($con2, $sqlQueries) or die(mysqli_error($con2));
if ($runSQL) {
    do {
        if ($result = mysqli_store_result($con2)) {
            while ($row = mysqli_fetch_row($result)) {
            }
            mysqli_free_result($result);
        }
        if (mysqli_more_results($con2)) {
        }
    } while (mysqli_next_result($con2));
}

generateTrailGeoJSON($trailID, $title, $type, $premium, $public, $_POST['term'], $rawKeywords);

if ($function == 'edit') {
    if ($wf) {
        echo message(false, 'The multimedia you uploaded is not a PNG, JPEG, or GIF.');
    } else {
        echo message(true, '<b>' . $_POST['title'] . '</b> has successfully been updated.');
    }

    return;
}

header("Location: edit?id=$trailID&justadded=1");
