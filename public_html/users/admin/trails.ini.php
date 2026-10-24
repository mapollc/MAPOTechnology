<?
$con2 = mysqli_connect('localhost', 'mapo_main', 'smQeP]-xjj+Uw$s_', 'mapo_trails');
$token = 'sk.eyJ1IjoibWFwb2xsYyIsImEiOiJjbHMyOGkxeW8wMThpMmxxajk2dmtuOWRrIn0.6JVcAORAMRoPBrgf0q_ymQ';
$datasetID = 'clnnlg3w728a02nmv0ffz57jf';

$activities = ['ATV', 'Alpine Ski', 'Backcountry Ski', 'Beginner', 'Big Ride', 'Big Ski', 'Climb', 'Dirtbike', 'Fantasy', 'Gravel Bike', 'Hike', 'Mountain Bike', 'Nordic Ski', 'Private', 'Race', 'Road Bike', 'Snowmobile', 'Summit'];
$icons = ['4x4' => '4x4', 'big_air' => 'Big Air', 'bigfoot' => 'Bigfoot', 'bridge' => 'Bridge', 'cabin' => 'Cabin', 'camp' => 'Campground', 'caution' => 'Caution', 'fishing' => 'Fishing', 'hike' => 'Hike', 'info' => 'Info', 'lake' => 'Lake', 'media' => 'Media', 'mtn_bike' => 'Mountain Bike', 'parking' => 'Parking', 'redneck' => 'Redneck', 'restroom' => 'Restroom', 'river' => 'River', 'sledding' => 'Sledding', 'summit' => 'Summit', 'swim' => 'Swimming'];
$gpxOptions = ['ATV Track', 'Gravel', 'Road', 'Single Track', 'Ski Line', 'Snowmobile', 'Tour'];

function gpxToGeoJson($file)
{
    $xml = simplexml_load_file("/home/mapo/public_html/mapotrails.com/data/gpx/$file", 'SimpleXMLElement', LIBXML_NOCDATA);

    if ($xml === false) {
        return null;
    }

    $point = $xml->xpath('//*[local-name()="trkpt"]');

    if (!$point) {
        return null;
    }

    $count = count($point);

    if ($count === 0) {
        return null;
    }

    $coords = [];

    for ($x = 0; $x < $count; $x++) {
        $coords[] = [
            (float) $point[$x]['lon'],
            (float) $point[$x]['lat']
        ];
    }

    return $coords;
}

function generateTrailGeoJSON($tid, $title, $type, $premium, $public, $term, $keywords)
{
    global $con2;

    $stats = mysqli_fetch_assoc(mysqli_query($con2, "SELECT stats FROM gpx g LEFT JOIN stats s ON s.gis_id = g.id WHERE g.trail_id = $tid AND delta = 0 LIMIT 1"));
    $data = mysqli_query($con2, "SELECT id, filename, mode, caption, delta, display FROM gpx WHERE trail_id = $tid ORDER BY delta ASC");

    $feats = [];

    while ($gpx = mysqli_fetch_assoc($data)) {
        if (empty($gpx) || $gpx['filename'] == '' || !file_exists("/home/mapo/public_html/mapotrails.com/data/gpx/{$gpx['filename']}")) continue;

        $coords = gpxToGeoJson($gpx['filename']);

        if ($coords == null || empty($coords)) continue;

        /*if ($gpx['delta'] == 0) {
            $new = json_encode($collect['stats']);
            $time = time();
            mysqli_query($con2, "UPDATE stats SET stats = '$new', calculated = $time WHERE trail_id = $row[id]");
        }*/

        $prop = [
            'trail_id' => (int) $tid,
            'id' => (int) $gpx['id'],
            'title' => $title,
            'type' => $type,
            'color' => trailColor($gpx['mode']),
            'url' => guideUrl($title, $type, $tid),
            'delta' => (int) $gpx['delta'],
            'term' => $term,
            'keywords' => $keywords,
            'mode' => $gpx['mode'],
            'caption' => $gpx['caption'],
            'stats' => $stats['stats'] ? json_decode($stats['stats']) : null,
            'premium' => (int) $premium,
            'public' => (int) $public,
            'display' => (int) $gpx['display'],
        ];

        $feats[] = [
            'id' => (int) $gpx['id'],
            'type' => 'Feature',
            'geometry' => [
                'type' => 'LineString',
                'coordinates' => $coords
            ],
            'properties' => $prop
        ];
    }

    if ($feats && count($feats) > 0) {
        $geojson = [
            'type' => 'FeatureCollection',
            'features' => $feats
        ];

        $output = json_encode($geojson);

        $saveFile = "/home/mapo/public_html/mapotrails.com/data/geojson/$tid.geojson";

        file_put_contents($saveFile, $output);
        chown($saveFile, 'mapo');
        chgrp($saveFile, 'mapo');
    }
}

/*function sendToMapbox($id, $json = null, $send = true)
{
    global $token;
    global $datasetID;

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, "https://api.mapbox.com/datasets/v1/mapollc/$datasetID/features/$id?access_token=$token");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $send ? 'PUT' : 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    if ($send) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));
    }

    $result = curl_exec($ch);
    $output = curl_errno($ch) ? curl_error($ch) : $result;

    return $output;
}

function updateTileset()
{
    global $token;
    $ch = curl_init();

    $params = [
        'tileset' => 'mapollc.clnnlg3w728a02nmv0ffz57jf-6mcgs',
        'url' => 'mapbox://datasets/mapollc/clnnlg3w728a02nmv0ffz57jf',
        'name' => 'mapotrails'
    ];

    curl_setopt($ch, CURLOPT_URL, "https://api.mapbox.com/uploads/v1/mapollc?access_token=$token");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Cache-Control: no-cache']);

    $result = curl_exec($ch);
    $output = curl_errno($ch) ? curl_error($ch) : $result;

    return json_decode($output);
}*/

function updateTileset(/*$trailID = null*/)
{
    $scriptPath = '/home/mapo/public_html/cron/generateTrails.php';
    $logPath    = '/home/mapo/logs/generate_trails.log';

    ////if ($trailID) {
    ////$cmd = sprintf('php %s %d > %s 2>&1 &', escapeshellarg($scriptPath), $trailID, escapeshellarg($logPath));
    ////} else {
    $cmd = sprintf('php %s %s > %s 2>&1 &', escapeshellarg($scriptPath), '--tiles', escapeshellarg($logPath));
    ////}

    exec($cmd);

    return true;
}

function guideUrl($s, $ty, $id)
{
    $words = ['and', 'at'];
    $s = str_replace(
        ' ',
        '-',
        str_replace(
            '  ',
            ' ',
            preg_replace('/([^A-Za-z0-9\s]+)/', '', strtolower($s))
        )
    );

    foreach ($words as $r) {
        $s = str_replace($r . '-', '', $s);
    }

    return rtrim(rtrim('guide/' . ($ty ? "$ty/" : '') . "$id/$s", '-'), ' ');
}

if ($function == 'create' || $function == 'edit') {
    include_once "{$documentRoot}admin/incs/add_edit-trail.ini.php";
    return;
}

if ($function == 'map') {
    include_once "{$documentRoot}admin/incs/map-trail.ini.php";
    return;
}

if ($function == 'delete') {
    include_once "{$documentRoot}admin/incs/delete_trail.ini.php";
    return;
}

// update mapbox vector tiles on user request
if ($function == 'vector') {
    $update = updateTileset();

    if ($update) header("Location: ../trails?tiles=1");
    ////$uploadID = $update->id;

    ////if ($update->error == null) {
    ////    echo message(true, 'A request for Mapbox to update trail data was submitted successfully.');
    ////} else {
    ////    echo message(false, 'There was an error publishing trail data to Mapbox. Try again later.');
    ////}
}

$edit = $permission->trails()->edit();

if ($_GET['tiles'] == 1) {
    echo message(true, 'Vector tiles for Map of Trails are being generated...');
}

if ($_GET['deleted'] == 1) {
    echo message(true, 'You have successfully deleted that trail/snow guide.');
}
?>
<div class="row">
    <div class="col">
        <div class="card">
            <h1>Trails Management</h1>

            <div class="controls">
                <form action="" id="searchTrails" method="get">
                    <input type="text" class="input" style="display:inline-block;max-width:300px" name="q" placeholder="Search trails..." value="<?= ($_GET['q'] ? $_GET['q'] : '') ?>">

                    <select name="type" class="input" style="max-width:100px">
                        <option <?= !isset($_GET['type']) ? 'selected ' : '' ?>value="all">All Types</option>
                        <option <?= $_GET['type'] == 'trail' ? 'selected ' : '' ?>value="trail">Trail</option>
                        <option <?= $_GET['type'] == 'trail' ? 'selected ' : '' ?>value="snow">Snow</option>
                    </select>

                    <select name="category" class="input" style="max-width:140px">
                        <option>All Activities</option>
                        <? foreach ($activities as $a) {
                            echo "<option " . ($a === $_GET['category'] ? 'selected ' : '') . "value=\"$a\">$a</option>";
                        } ?>
                    </select>

                    <select name="public" class="input" style="max-width:124px">
                        <option <?= !isset($_GET['public']) ? 'selected ' : '' ?>value="all">All Visibilities</option>
                        <option <?= $_GET['public'] == '1' ? 'selected ' : '' ?>value="1">Public</option>
                        <option <?= $_GET['public'] == '0' ? 'selected ' : '' ?>value="0">Not Public</option>
                    </select>

                    <select name="premium" class="input" style="max-width:124px">
                        <option <?= !isset($_GET['premium']) ? 'selected ' : '' ?>value="all">All Tiers</option>
                        <option <?= $_GET['premium'] == '1' ? 'selected ' : '' ?>value="1">Premium</option>
                        <option <?= $_GET['premium'] == '0' ? 'selected ' : '' ?>value="0">Not Premium</option>
                    </select>

                    <input type="submit" class="btn btn-blue" value="Search">

                    <a href="trails/create" class="btn btn-green">Create new trail</a>
                    <!--<a href="trails/systems" class="btn btn-yellow">Manage Trail Systems</a>-->
                    <a href="trails/vector?<?= time() ?>" class="btn btn-light-blue">Publish vector tiles</a>
                    <span class="help">Last published <?= ago(filemtime('/home/mapo/public_html/mapotrails.com/data/maps/tiles')) ?></span>

                </form>
            </div>

            <p id="resultsNum" style="min-height:21px;font-size:14px;padding:0"></p>

            <div class="table-responsive">
                <table class="table" id="listOfTrails" data-edit="<?= $edit->all() ?? $edit->own() ?? 0 ?>">
                    <thead class="sortable">
                        <tr>
                            <!--<th class="sortTable" data-url="sort=id&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">ID</th>-->
                            <th class="sortTable" data-url="sort=type&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Type</th>
                            <th style="width:300px" class="sortTable" data-url="sort=title&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Title</th>
                            <th class="sortTable" data-url="sort=author&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Author</th>
                            <th class="sortTable" data-url="sort=updated&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DESC' ? 'DESC' : 'ASC') . ($queryParams ? "&$queryParams" : '') ?>">Last Update</th>
                            <th class="sortTable" data-url="sort=created&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'DeSC' ? 'DESC' : 'ASC') . ($queryParams ? "&$queryParams" : '') ?>">Created</th>
                            <th class="sortTable" data-url="sort=premium&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Premium</th>
                            <th class="sortTable" data-url="sort=public&order=<?= (!isset($_GET['order']) || $_GET['order'] != 'ASC' ? 'ASC' : 'DESC') . ($queryParams ? "&$queryParams" : '') ?>">Public</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="pagination">
                <div></div>
            </div>
        </div>
    </div>
</div>