<?
function sendToMapbox($id, $json) {
    global $token;
    $datasetID = 'clnnlg3w728a02nmv0ffz57jf';
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'https://api.mapbox.com/datasets/v1/mapollc/'.$datasetID.'/features/'.$id.'?access_token='.$token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));

    $headers[] = 'Content-Type: application/json';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $result = curl_exec($ch);
    if (curl_errno($ch)) {
        $output = curl_error($ch);
    } else {
        $output = $result;
    }
    curl_close($ch);
    
    return $output;
}

function convert($lat) {
    $a = explode('/', $lat[0])[0];
    $b = explode('/', $lat[1])[0];
    $c = explode('/', $lat[2])[0];

    return [$a, $b, $c];
}

function DMStoDD($deg, $min, $sec) {
    return $deg + ((($min * 60) + (substr($sec, 0, -2).'.'.substr($sec, -2))) / 3600);
}

function gps($lat, $lon) {
    $a = convert($lat);
    $b = convert($lon);

    return [DMStoDD($a[0], $a[1], $a[2]), DMStoDD($b[0], $b[1], $b[2]) * -1];
}

function keywords() {
    global $con2;

    $sq = mysqli_query($con2, "SELECT keywords FROM trails");
    while ($w = mysqli_fetch_assoc($sq)) {
        foreach (unserialize($w['keywords']) as $k) {
            if ($k != '') {
                $keyw[] = $k;
            }
        }
    }
    asort($keyw);
    return json_encode(array_values(array_unique($keyw)));
}

function trailColor($m) {
    $randcolor = array('cb2626', '40d740', 'ff973a', 'ebeb2e', 'f977dd', '6daee3', '9873f0', 'ff8298', '698d65', '009688', '3949ab', '880e4f');
    $z = rand(0, count($randcolor) - 1);

    if ($m == 'Snowmobile' && $m != 'Single Track') {
        $type = 'Sled';
        $color = 'ff0000';
    } else if ($m == 'Tour') {
        $type = 'Ski';
        $color = '0058aa';
    } else if ($m == 'Ski Line') {
        $type = 'Shred';
        $color = '13ff2f';
    } else if ($m == 'Gravel') {
        $type = 'gravelroad';
        $color = '747474';
    } else if ($m == 'ATV Track') {
        $type = 'ATV';
        $color = '00ffff';
    } else if ($m == 'Road') {
        $type = 'road';
        $color = '000';
    } else if ($m == 'Single Track') {
        $type = 'singletrack';
        $color = $randcolor[$z];
    } else {
        $color = '000';
    }
    return '#' . $color;
}

if (isset($_POST['action'])) {
    require_once $documentRoot . 'admin/trailGPX.inc.php';
    require_once 'trailSQL.inc.php';
}

if (($function == 'create' && !$permission->trails()->add()) ||
    ($function == 'edit' && (!$permission->trails()->edit()->all() && !$permission->trails()->edit()->own()) ||
        (!$permission->trails()->edit()->all() && $permission->trails()->edit()->own()) && $row['author'] != $user['fullName'])
) {
    echo invalidPermissions();
} else {
    if ($function == 'edit') {
        $row = mysqli_fetch_assoc(mysqli_query($con2, "SELECT type, created, updated, author, title, route, keywords, season, contributors, term, public, premium FROM trails LEFT JOIN categories ON trail_id = trails.id WHERE trails.id = $_GET[id]"));
        $sql = mysqli_query($con2, "SELECT * FROM waypoints WHERE trail_id = '$_GET[id]' ORDER BY delta ASC");
        $media = mysqli_query($con2, "SELECT * FROM media WHERE trail_id = '$_GET[id]' ORDER BY delta ASC");
        $fsql = mysqli_query($con2, "SELECT * FROM gpx WHERE trail_id = '$_GET[id]' ORDER BY delta ASC");
        $terms = unserialize($row['term']);

        foreach (unserialize($row['keywords']) as $k) {
            $kw .= $k . ', ';
        }

        if ($_GET['justadded'] == 1) {
            echo message(true, '<b>' . $row['title'] . '</b> was successfully created.');
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
                    <h1><?= $function == 'create' ? 'Add New' : 'Edit' ?> Trail<?= $function == 'edit' ? ': ' . $row['title'] : '' ?></h1>
                    <? if ($function == 'edit') { ?>
                        <span class="help" style="margin:-1em 0 1em 0"><?= $row['updated'] > $row['created'] ? 'Updated: ' . date('D, M j, Y g:i A', $row['updated']) . ' &middot; ' : '' ?>Created: <?= date('D, M j, Y g:i A', $row['created']) ?></span>
                    <? } ?>

                    <label>Title</label>
                    <input type="text" name="title" class="input" style="display:inline-block;max-width:600px" placeholder="Trail or snow guide title..." value="<?= $row['title'] ?>">
                    <? if ($function == 'edit') { ?>
                        <div style="display:inline-block">
                            <a target="blank" href="https://www.mapotrails.com/<?= guideUrl($row['title'], $row['type'], $_GET['id']) ?>">View guide</a>
                        </div>
                    <? } ?>

                    <label>Author</label>
                    <input type="text" name="author" class="input" value="<?= $function == 'create' ? $_SESSION['name'] : $row['author'] ?>" <?= ($function == 'edit' ? ' disabled' : '') ?>>

                    <div class="row" style="margin-top:1em!important">
                        <div class="col w17">
                            <label>Trail Type</label>
                            <div class="radio">
                                <input type="radio" id="tt" name="type" value="trail" <?= ($row['type'] == 'trail' ? ' checked' : '') ?>><label for="tt">Trail</label>
                            </div>
                            <div class="radio">
                                <input type="radio" id="ts" name="type" value="trail" <?= ($row['type'] == 'snow' ? ' checked' : '') ?>><label for="ts">Snow</label>
                            </div>
                        </div>
                        <div class="col w17">
                            <label>Published</label>
                            <select class="input" style="width:100px" name="public">
                                <option <?= ($row['public'] == 1 ? 'selected ' : '') ?>value="1">Yes</option>
                                <option <?= ($row['public'] != 1 ? 'selected ' : '') ?>value="0">No</option>
                            </select>
                        </div>
                        <div class="col w17">
                            <label>Premium Guide</label>
                            <select class="input" style="width:100px" name="premium">
                                <option <?= ($row['premium'] == 1 ? 'selected ' : '') ?>value="1">Yes</option>
                                <option <?= ($row['premium'] != 1 ? 'selected ' : '') ?>value="0">No</option>
                            </select>
                        </div>
                    </div>

                    <label>Activity</label>
                    <div style="display:flex;flex-wrap:wrap;gap:0 10px">
                        <? foreach ($activities as $a) { ?>
                            <div class="checkbox" style="display:flex;align-items:center;min-width:200px">
                                <input type="checkbox" name="term[]" id="<?= $a ?>" value="<?= $a ?>" <?= $terms ? (in_array($a, $terms) ? ' checked' : '') : '' ?>>
                                <label for="<?= $a ?>"><?= $a ?></label>
                            </div>
                        <? } ?>
                    </div>

                    <label>Trail Description</label>
                    <textarea name="route" class="input" style="line-height:1.3;max-width:1200px;height:300px" placeholder="Description of the trail..."><?= $row['route'] ?></textarea>

                    <label>Season</label>
                    <input type="text" name="season" class="input" placeholder="Season" value="<?= $row['season'] ?>">

                    <label>Contributors</label>
                    <input type="text" name="contributors" class="input" style="max-width:600px" placeholder="Contributors" value="<?= $row['contributors'] ?>">

                    <label>Keywords</label>
                    <input type="text" name="keywords" class="input" style="max-width:600px" placeholder="Keywords (separated by commas)" value="<?= substr($kw, 0, -2) ?>">
                    <div id="kw-results"></div>
                </div>

                <div class="card">
                    <h2>GPX Files</h2>
                    <ul id="files">
                        <? if ($fsql) {
                            while ($gpx = mysqli_fetch_assoc($fsql)) { ?>
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
                                            <a class="btn btn-sm btn-red" style="display:block;margin-top:15px;min-width:unset" href="#" id="deletegpx" data-tid="<?= $_GET['id'] ?>" data-delta="<?= $gpx['delta'] ?>" data-filename="<?= $gpx['filename'] ?>" data-id="<?= $gpx['id'] ?>" onclick="return false">Delete</a>
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

                    <!--<div id="multimedia-container" class="grids" style="margin-bottom:10px;grid-template-columns: repeat(5, minmax(0, 1fr))">-->
                    <div class="sortable multimedia">
                        <? if ($function == 'edit') {
                            while ($ph = mysqli_fetch_assoc($media)) {
                                $data = unserialize($ph['data']);
                        ?>
                                <div class="wrapper">
                                    <? if ($ph['type'] == 'photo') { ?>
                                        <a target="blank" href="https://cdn.mapotrails.com/photos/<?= $ph['file'] ?>">
                                            <img src="https://cdn.mapotrails.com/photos/thumbnail/<?= $ph['file'] ?>" style="display:block;max-width:100%">
                                        </a>
                                    <? } else { ?>
                                        <iframe style="width:100%;height:150px" src="https://www.youtube.com/embed/UGpei_reX_4?si=Dr6WpLW1GgtmvFzy&amp;controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
                                    <? }
                                    if ($ph['type'] == 'photo') { ?>
                                        <span style="display:block;font-size:12px;color:#888;margin-top:3px">
                                            File Size: <?= $data['filesize'] ? round($data['filesize'] * 0.000001, 1) . ' MB' : '~' ?><br>
                                            Dimensions: <?= $data['width'] ? $data['width'] . '/' . $data['height'] . ' px' : 'Unknown' ?><br>
                                            Geolocated: <?= $data['coordinates'] ? '<b style="font-weight:500;color:green">Yes</b>' : 'No' ?>
                                        </span>
                                    <? } ?>
                                    <input type="hidden" name="media[id][]" value="<?= $ph['id'] ?>">
                                    <input type="text" name="media[caption][]" class="input" style="max-width:350px" placeholder="Photo caption..." value="<?= $ph['title'] ?>">
                                    <a class="btn btn-sm btn-red" style="display:block;margin:0.5em auto 0 auto;padding:4px 6px;min-width:unset;font-size:13px;font-weight:400" href="#" id="deletemedia" data-filename="<?= $ph['file'] ?>" data-id="<?= $ph['id'] ?>" onclick="return false">Delete</a>
                                </div>
                        <? }
                        }
                        ?>
                    </div>
                </div>

                <div class="card">
                    <h2>Waypoints</h2>

                    <a class="btn btn-sm btn-blue" style="display:block;margin:10px 0 25px 0" href="#" id="addwaypoint" onclick="return false">Add Waypoint</a>
                    <?/*if($_SESSION['uid'] == 1) {
                    echo '<div id="waypoint-map" style="width:100%;height:400px"></div>';
                    } */?>

                    <ul id="waypoints">
                        <? if ($sql) {
                            while ($way = mysqli_fetch_assoc($sql)) {
                                /*$data['id'] = $way['id'];
                    $data['delta'] = $way['delta'];
                    $data['lat'] = floatval($way['lat']);
                    $data['lon'] = floatval($way['lon']);
                    $data['name'] = $way['name'];
                    $data['note'] = $way['note'];
                    $data['icon'] = $way['icon'];
                    echo '<input type="hidden" id="waypoint'.$way['delta'].'" name="waypoint[]" value=\''.json_encode($data).'\'>';*/
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

                    <script>
                        const keywords = <?= keywords() ?>;
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
<? } ?>