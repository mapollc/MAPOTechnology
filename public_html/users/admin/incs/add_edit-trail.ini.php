<?
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

function trailColor($m)
{
    $colors = ['cb2626', '40d740', 'ff973a', 'ebeb2e', 'f977dd', '6daee3', '9873f0', 'ff8298', '698d65', '009688', '3949ab', '880e4f'];

    return '#' . match ($m) {
        'Snowmobile' => 'ff0000',
        'Tour' => '0058aa',
        'Ski Line' => '13ff2f',
        'Gravel' => '747474',
        'ATV Track' => '00ffff',
        'Road' => '000',
        'Single Track' => $colors[array_rand($colors)],
        default => '000'
    };
}

function getWaypointElev($lat, $lon)
{
    $geo = [
        'x' => $lon,
        'y' => $lat,
        'spatialReference' => ['wkid' => 4326]
    ];
    $raster = [
        ['rasterFunction' => 'None'],
        ['rasterFunction' => 'Slope Degrees'],
        ['rasterFunction' => 'Aspect Degrees'],
        ['rasterFunction' => 'Height Ellipsoidal']
    ];

    $url = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify?geometry=" .
        urlencode(json_encode($geo)) . "&geometryType=esriGeometryPoint&mosaicRule=&renderingRule=&renderingRules=" .
        urlencode(json_encode($raster)) . "&pixelSize=&time=&returnGeometry=false&returnCatalogItems=false&f=json";

    $json = file_get_contents($url);

    return $json
        ? round(json_decode($json)->value * 3.28084, 1)
        : null;
}

// on form submit
if (isset($_POST['action'])) {
    require_once "{$documentRoot}admin/trailGPX.inc.php";
    require_once 'trailSQL.inc.php';
}

$row = $waypointsSQL = $gpxSQL = $media = null;
$kw = [];
$pp = $permission->trails()->edit();
//$months = [1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec'];

if (
    $function == 'create' && !$permission->trails()->add() ||
    $function == 'edit' && (!$pp->all() && !$pp->own() ||
        !$pp->all() && $pp->own() && $row['author'] != $user['fullName'])
) {
    echo invalidPermissions();
    return;
}

if ($function == 'edit') {
    $trailID = $_GET['id'];

    $row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT type, created, updated, author, title, route, keywords, season, contributors, term, public, premium FROM trails LEFT JOIN categories ON trail_id = trails.id WHERE trails.id = $trailID"));
    $waypointsSQL = mysqli_query($con2, "SELECT * FROM waypoints WHERE trail_id = $trailID ORDER BY delta ASC");
    $media = mysqli_query($con2, "SELECT * FROM media WHERE trail_id = $trailID ORDER BY delta ASC");
    $gpxSQL = mysqli_query($con2, "SELECT * FROM gpx WHERE trail_id = $trailID ORDER BY delta ASC");

    // convert json to array of categories
    $terms = json_decode($row['term']);

    // create an array of keywords
    foreach (json_decode($row['keywords']) as $k) {
        $kw[] = $k;
    }

    $route = $row['route'];

    // if the user has created content
    if ($_GET['justadded'] == 1) {
        echo message(true, "<b>{$row['title']}</b> was successfully created.");
    }
}
?>
<form action="" method="post" enctype="multipart/form-data">
    <? if ($function == 'edit') { ?>
        <input type="hidden" name="id" value="<?= $_GET['id'] ?>">
    <? } ?>

    <div class="row">
        <div class="col">
            <div class="card">
                <h1><?= $function == 'create' ? 'Add New' : 'Edit' ?> Trail<?= $function == 'edit' ? ": {$row['title']}" : '' ?></h1>
                <? if ($function == 'edit') { ?>
                    <span class="help" style="margin:-1em 0 1em 0"><?= $row['updated'] > $row['created'] ? 'Updated: ' . date('D, M j, Y g:i A', $row['updated']) . ' &middot; ' : '' ?>Created: <?= date('D, M j, Y g:i A', $row['created']) ?></span>
                <? } ?>

                <label>Title</label>
                <input type="text" name="title" class="input" required style="display:inline-block;max-width:600px" placeholder="Trail or snow guide title..." value="<?= $row['title'] ?>">

                <? if ($function == 'edit') { ?>
                    <div style="display:inline-block">
                        <a target="blank" href="https://www.mapotrails.com/<?= guideUrl($row['title'], $row['type'], $_GET['id']) ?>">View guide</a>
                    </div>
                <? } ?>

                <label>Author</label>
                <input type="text" name="author" class="input" value="<?= $function == 'create' ? $_SESSION['name'] : $row['author'] ?>" readonly<?= $function == 'edit' ? ' disabled' : '' ?>>

                <div class="row" style="margin-top:1em!important">
                    <div class="col w17">
                        <label>Trail Type</label>
                        <select class="input" style="width:150px" name="type">
                            <option<?= $row['type'] == 'trail' ? ' selected' : '' ?> value="trail">Trail</option>
                                <option<?= $row['type'] == 'snow' ? ' selected' : '' ?> value="snow">Snow</option>
                        </select>
                    </div>
                    <div class="col w17">
                        <label>Published</label>
                        <select class="input" style="width:100px" name="public">
                            <option <?= $row['public'] == 1 ? 'selected ' : '' ?>value="1">Yes</option>
                            <option <?= $row['public'] != 1 ? 'selected ' : '' ?>value="0">No</option>
                        </select>
                    </div>
                    <div class="col w17">
                        <label>Premium Guide</label>
                        <select class="input" style="width:100px" name="premium">
                            <option <?= $row['premium'] == 1 ? 'selected ' : '' ?>value="1">Yes</option>
                            <option <?= $row['premium'] != 1 ? 'selected ' : '' ?>value="0">No</option>
                        </select>
                    </div>
                </div>

                <label>Activity</label>
                <div class="mt-act">
                    <? foreach ($activities as $a) { ?>
                        <div class="checkbox">
                            <input type="checkbox" name="term[]" id="<?= $a ?>" value="<?= $a ?>" <?= $terms ? (in_array($a, $terms) ? ' checked' : '') : '' ?>>
                            <label for="<?= $a ?>"><?= $a ?></label>
                        </div>
                    <? } ?>
                </div>

                <label>Trail Description</label>
                <textarea name="route" id="route" class="input" style="line-height:1.3;max-width:1200px;height:300px" placeholder="Description of the trail..." data-wysiwyg><?= $route ?></textarea>

                <label>Season</label>
                <input type="text" name="season" class="input" placeholder="Season" value="<?= $row['season'] ?>">

                <?/*<div class="month-selector">
                    <? foreach ($months as $value => $month) { ?>
                        <input type="checkbox" id="month-<?= $value ?>" name="months[]" value="<?= $value ?>">
                        <label for="month-<?= $value ?>"><?= $month ?></label>
                    <? } ?>
                </div>*/ ?>

                <label>Contributors</label>
                <input type="text" name="contributors" class="input" placeholder="Contributors" value="<?= $row['contributors'] ?>">

                <label>Keywords</label>
                <input type="text" name="keywords" class="input" autocomplete="off" placeholder="Keywords (separated by commas)" value="<?= implode(', ', $kw) ?>">
                <div id="kw-results"></div>
            </div>

            <div class="card">
                <h2>GPX Files</h2>
                <ul id="files">
                    <? if ($gpxSQL) {
                        while ($gpx = mysqli_fetch_assoc($gpxSQL)) { ?>
                            <li>
                                <input type="hidden" name="oldgpx[id][<?= $gpx['delta'] ?>]" value="<?= $gpx['id'] ?>">
                                <input type="hidden" name="oldgpx[delta][<?= $gpx['delta'] ?>]" value="<?= $gpx['delta'] ?>">
                                <input type="hidden" name="oldgpx[filename][<?= $gpx['delta'] ?>]" value="<?= $gpx['filename'] ?>">

                                <div class="wrap">
                                    <div class="file">
                                        <label style="margin-bottom:5px">Map Data File</label>
                                        <a target="blank" style="font-size:15px" href="https://cdn.mapotrails.com/gpx/<?= $gpx['filename'] ?>"><?= $gpx['filename'] ?></a>
                                    </div>

                                    <div class="column">
                                        <label style="margin-bottom:5px">Description</label>
                                        <input type="text" class="input" style="display:inline-block;max-width:400px" name="oldgpx[caption][<?= $gpx['delta'] ?>]" placeholder="GPX file caption" value="<?= $gpx['caption'] ?>">
                                    </div>

                                    <div class="column">
                                        <label style="margin-bottom:5px">Type</label>
                                        <select name="oldgpx[mode][<?= $gpx['delta'] ?>]" class="input" style="margin-top:0;max-width:175px">
                                            <option value="">- Choose Mode -</option>
                                            <? foreach ($gpxOptions as $o) {
                                                echo '<option ' . ($o == $gpx['mode'] ? 'selected ' : '') . 'value="' . $o . '">' . $o . '</option>';
                                            } ?>
                                        </select>
                                    </div>

                                    <div class="column">
                                        <label style="margin-bottom:1em">Display</label>
                                        <div>
                                            <div class="radio">
                                                <input type="radio" name="oldgpx[display][<?= $gpx['delta'] ?>]" value="1" <?= ($gpx['display'] == 1 ? ' checked' : '') ?>><label>Yes</label>
                                            </div>
                                            <div class="radio">
                                                <input type="radio" name="oldgpx[display][<?= $gpx['delta'] ?>]" value="0" <?= ($gpx['display'] == 0 ? ' checked' : '') ?>><label>No</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="column">
                                        <a class="btn btn-sm btn-black" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletegpx" data-tid="<?= $_GET['id'] ?>" data-delta="<?= $gpx['delta'] ?>" data-filename="<?= $gpx['filename'] ?>" data-id="<?= $gpx['id'] ?>" onclick="return false">Delete</a>
                                    </div>
                                </div>
                            </li>
                    <? }
                    } ?>
                </ul>
                <a class="btn btn-sm btn-blue" style="display:block;margin:10px 0 25px 0" href="#" id="addgpx" onclick="return false">Add GPX File</a>
            </div>

            <div class="card">
                <h2>Multimedia</h2>
                <label style="margin-top:10px">Upload new multimedia</label>
                <input type="file" name="multimedia[]" class="input" multiple>

                <? if ($function == 'edit') {
                    echo '<div class="sortable multimedia">';

                    while ($ph = mysqli_fetch_assoc($media)) {
                        $data = json_decode($ph['data'], true);
                        $isPhoto = $ph['type'] === 'photo';
                ?>
                        <div class="wrapper">
                            <? if ($isPhoto) { ?>
                                <a target="blank" href="https://cdn.mapotrails.com/photos/<?= $ph['file'] ?>">
                                    <img src="https://cdn.mapotrails.com/photos/thumbnail/<?= $ph['file'] ?>" style="display:block;max-width:100%">
                                </a>
                            <? } else { ?>
                                <iframe style="width:100%;height:177.5px" src="https://www.youtube.com/embed/UGpei_reX_4?si=Dr6WpLW1GgtmvFzy&amp;controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                            <? }

                            if ($isPhoto) { ?>
                                <span style="display:block;font-size:12px;color:#888;margin-top:3px">
                                    File Size: <?= $data['filesize'] ? round($data['filesize'] * 0.000001, 1) . ' MB' : '~' ?><br>
                                    Dimensions: <?= $data['width'] ? $data['width'] . '/' . $data['height'] . ' px' : 'Unknown' ?><br>
                                    Geolocated: <?= $data['coordinates'] ? '<b style="font-weight:500;color:green">Yes</b>' : 'No' ?>
                                </span>
                            <? } ?>

                            <input type="hidden" name="media[id][]" value="<?= $ph['id'] ?>">
                            <input type="text" name="media[caption][]" class="input" style="max-width:350px" placeholder="<?= $isPhoto ? 'Photo' : 'Video' ?> caption..." value="<?= $ph['title'] ?>">
                            <a class="btn btn-sm btn-red" style="display:block;margin:0.5em auto 0 auto!important;padding:4px 6px;min-width:unset;font-size:13px;font-weight:400" href="#" id="deletemedia" data-filename="<?= $ph['file'] ?>" data-id="<?= $ph['id'] ?>" onclick="return false">Delete</a>
                        </div>
                <? }
                    echo '</div>';
                }
                ?>
            </div>

            <div class="card">
                <h2>Waypoints</h2>

                <?/*if($_SESSION['uid'] == 1) {
                    echo '<div id="waypoint-map" style="width:100%;height:400px"></div>';
                    } */ ?>

                <ul id="waypoints">
                    <? if ($waypointsSQL) {
                        while ($way = mysqli_fetch_assoc($waypointsSQL)) {
                    ?>
                            <li>
                                <input type="hidden" name="waypoint[id][]" value="<?= $way['id'] ?>">
                                <input type="hidden" name="waypoint[delta][]" value="<?= $way['delta'] ?>">
                                <div class="wrap">
                                    <div class="column">
                                        <label style="margin-bottom:5px">Name</label>
                                        <input type="text" name="waypoint[name][]" class="input" placeholder="Waypoint Name" value="<?= $way['name'] ?>">
                                    </div>
                                    <div class="column">
                                        <label style="margin-bottom:5px">Notes</label>
                                        <input type="text" name="waypoint[note][]" class="input" placeholder="Waypoint Notes" value="<?= $way['note'] ?>">
                                    </div>
                                    <div class="column">
                                        <label style="margin-bottom:5px">Icon</label>
                                        <select name="waypoint[icon][]" class="input" style="max-width:165px;margin:0">
                                            <option>- Icon -</option>
                                            <? foreach ($icons as $k => $v) { ?>
                                                <option <?= ($k == $way['icon'] ? 'selected ' : '') ?>value="<?= $k ?>"><?= $v ?></option>
                                            <? } ?>
                                        </select>
                                    </div>
                                    <div class="column">
                                        <label style="margin-bottom:5px">Latitude</label>
                                        <input type="text" name="waypoint[lat][]" class="input" style="max-width:150px" placeholder="45.01234" value="<?= $way['lat'] ?>">
                                    </div>
                                    <div class="column">
                                        <label style="margin-bottom:5px">Longitude</label>
                                        <input type="text" name="waypoint[lon][]" class="input" style="max-width:150px" placeholder="-118.123456" value="<?= $way['lon'] ?>">
                                    </div>
                                    <div class="column">
                                        <a class="btn btn-sm btn-red" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletewaypoint" data-id="<?= $way['id'] ?>" onclick="return false">Delete</a>
                                    </div>
                                </div>
                            </li>
                    <? }
                    } ?>
                </ul>

                <a class="btn btn-sm btn-blue" style="display:block;margin:10px 0 25px 0" href="#" id="addwaypoint" onclick="return false">Add Waypoint</a>

                <script>
                    const keywords = <?= json_encode($kw) ?>;
                </script>
            </div>

            <div class="btn-group" style="margin-top:10px">
                <input type="submit" name="action" class="btn btn-green" value="Save Changes">
                <input type="button" class="btn btn-gray" onclick="window.location.href='../trails'" value="Go Back">
                <input type="button" class="btn btn-red" onclick="window.location.href='delete?id=<?= $_GET['id'] ?>'" value="Delete">
            </div>
        </div>
    </div>
    </div>
</form>