<?
$includeLeaflet = true;
include_once '/home/mapo/public_html/mapofire.com/layers.inc.php';
include_once '/home/mapo/public_html/subs.inc.php';

function convertToDec($a, $b, $c)
{
    $m = floatval(abs($a)) + floatval($b / 60) + floatval($c / 3600);

    return $a < 0 ? $m * -1 : $m;
}

function convertToDMS($dec)
{
    $vars = explode(".", $dec);
    $deg = $vars[0];
    $tempma = "0." . $vars[1];

    $tempma = $tempma * 3600;
    $min = floor($tempma / 60);
    $sec = $tempma - $min * 60;

    return [$deg, $min, rtrim(round($sec, 4), 0)];
}

function getSubscriptions($email){
    global $plan;
    $sub = prepareQuery('s', [$email], "SELECT cid, subscription, trial, plan, created, start, end AS ends, status, cancel_end_period FROM billing WHERE email = ? AND status != 'expired' ORDER BY created DESC");

    if (empty($sub)) {
        return [];
    } else {
        if (isset($sub['cid'])) {
            $plan->setPlan(null, $sub['plan']);
            $sub['name'] = $plan->getName();
            $sub['id'] = $plan->getPriceName() ? $plan->getPriceName() : null;

            $sub['start'] = intval($sub['start']);
            $sub['ends'] = intval($sub['ends']);
            $sub['created'] = intval($sub['created']);
            $sub['cancel_end_period'] = $sub['cancel_end_period'] == 1 ? true : false;

            return [$sub];
        } else {
            foreach ($sub as $s) {
                $plan->setPlan(null, $s['plan']);
                $s['name'] = $plan->getName();
                $s['id'] = $plan->getPriceName() ? $plan->getPriceName() : null;

                $s['start'] = intval($s['start']);
                $s['ends'] = intval($s['ends']);
                $s['created'] = intval($s['created']);
                $s['cancel_end_period'] = $s['cancel_end_period'] == 1 ? true : false;

                $allSubs[] = $s;
            }

            return $allSubs;
        }
    }
}

$basemaps = ['outdoors' => 'MAPO Outdoors', 'satellite' => 'Satellite', 'fs16' => 'USFS 2016', 'dark' => 'Dark', 'osm' => 'Open Street Map', 'terrain' => 'Terrain'];
$tilePerms = [
    [],
    [],
    ['PRO'],
    ['PREMIUM', 'PRO'],
    [],
    ['PREMIUM', 'PRO']
];

if (isset($_POST['action'])) {
    foreach ($_POST['checkboxes'] as $k => $v) {
        $cbs[] = $k;
    }

    if ($_POST['coordsDisplay'] == 'dms') {
        $lat = convertToDec($_POST['latdeg'], $_POST['latmin'], $_POST['latsec']);
        $lon = convertToDec($_POST['londeg'], $_POST['lonmin'], $_POST['lonsec']);
    } else {
        $lat = $_POST['lat'];
        $lon = $_POST['lon'];
    }

    $settings = serialize(array(
        'center' => array($lat, $lon),
        'zoom' => $_POST['zoom'],
        'tile' => $_POST['tile'],
        'saveFreq' => $_POST['saveFreq'],
        'locallySave' => $_POST['locallySave'],
        'checkboxes' => $cbs,
        'coordsDisplay' => $_POST['coordsDisplay'],
        'perimeters' => array(
            'minSize' => $_POST['minsize'],
            'color' => $_POST['perimColor'],
            'zoom' => $_POST['pzoom'],
            'ttip' => $_POST['ttip']
        ),
        'weather' => array(
            'temp' => $_POST['temp'],
            'wind' => $_POST['wind']
        ),
        'acresUnit' => $_POST['acresUnit']
    ));

    mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '0', time = '$time' WHERE uid = $_SESSION[uid]");
    echo message(true, 'Your map settings were successfully updated.');
}

/*$sub = mysqli_query($con, "SELECT subscription, plan, b.created, start, end AS ends, active FROM billing AS b LEFT JOIN users AS u ON u.email = b.email WHERE u.uid = '$_SESSION[uid]' AND active = 1");
while ($data = mysqli_fetch_assoc($sub)) {
    $subscribe[] = $data;
}

$activeSub = false;
foreach ($subscribe as $sub) {
    if ($sub['plan'] == $mapoSubscriptions['mapofire'][$stripeLive ? 'live' : 'test']) {
        if ($sub['active'] == 1 && $sub['ends'] > time()) {
            $activeSub = true;
        }
    }
}*/

$checkboxes = [];
$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings, method, time FROM settings WHERE uid = $_SESSION[uid]"));
$settings = unserialize($row['settings']);
$checkboxes = $settings['checkboxes'];

$hasPremium = false;
$hasPro = false;
$tiers = [
    'PREMIUM' => ['ignite_monthly', 'ignite_annual'],
    'PRO' => ['hotshot_monthly', 'hotshot_annual']
];
$subs = getSubscriptions($user['email']);

if (!empty($subs)) {
    foreach ($subs as $sub) {
        if ($sub['ends'] > time() && $sub['status'] != 'expired') {
            if (in_array($sub['id'], $tiers['PRO'])) {
                $hasPro = true;
            }

            if (in_array($sub['id'], $tiers['PREMIUM'])) {
                $hasPremium = true;
            }
        }
    }
}

if ($hasPro) {
    $hasPremium = true;
}
?>
<form action="" method="post" style="margin:0">
    <input type="hidden" name="lat" value="<?= $settings['center'][0] ?>">
    <input type="hidden" name="lon" value="<?= $settings['center'][1] ?>">

    <div class="rows">
        <div class="row">
            <div class="col w100">
                <div class="card">
                    <div id="map" style="width:100%;height:400px"></div>
                    <script>
                        const settings = <?= json_encode($settings) ?>;
                    </script>
                    <span class="help">Drag the map or the marker to set where you want your map to be centered upon returning to the map</span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col w100">
                <div class="card dark">
                    <h2>Map</h2>

                    <div style="font-size:14px;padding-bottom:1em;color:<?= time() - $row['time'] > 3600 ? 'red' : 'green' ?>">
                        <i class="fas fa-sync" style="padding-right:10px"></i> Your map settings were last synced <?= $row['method'] == 1 ? 'automatic' : 'manu' ?>ally <?= strtolower(ago($row['time'])) ?>
                    </div>

                    <label>Map Center</label>
                    <p style="padding-top:0">Use the map to set the center location you want the map to default to. When using the map, the last location you looked at will be automatically saved.</p>

                    <div class="row">
                        <div class="col w50">
                            <label>Zoom</label>
                            <select class="input" style="max-width:200px" name="zoom">
                                <? for ($i = 3; $i < 21; $i++) {
                                    echo '<option ' . ($settings['zoom'] == $i ? 'selected ' : '') . 'value="' . $i . '">' . $i . '</option>';
                                } ?>
                            </select>
                        </div>
                        <div class="col w50">
                            <label>Basemap</label>
                            <select name="tile" class="input">
                                <? $i = 0;
                                foreach ($basemaps as $k => $v) {
                                    $disabled = false;

                                    if (empty($tilePerms[$i]) || (in_array('PREMIUM', $tilePerms[$i]) && $hasPremium) || (in_array('PRO', $tilePerms[$i]) && $hasPro)) {
                                        $disabled = true;
                                    }

                                    echo '<option ' . (!$disabled ? 'disabled ' : '') . ($settings['tile'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . $v . '</option>';
                                    $i++;
                                } ?>
                            </select>
                        </div>
                    </div>

                    <input type="submit" name="action" class="btn btn-green" value="Save Map Settings">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col w100">
                <div class="card dark">
                    <h2>Preferences</h2>

                    <div class="row">
                        <div class="col w50">
                            <label>Save Frequency</label>
                            <span class="help">Choose how often you want your settings to sync automatically</span>
                            <select class="input" name="saveFreq">
                                <option <?= $settings['saveFreq'] == '60000' ? 'selected ' : '' ?>value="60000">1 min</option>
                                <option <?= $settings['saveFreq'] == '300000' ? 'selected ' : '' ?>value="300000">5 mins</option>
                                <option <?= $settings['saveFreq'] == '600000' ? 'selected ' : '' ?>value="600000">10 mins</option>
                                <option <?= $settings['saveFreq'] == '900000' ? 'selected ' : '' ?>value="900000">15 mins</option>
                                <option <?= $settings['saveFreq'] == '1800000' ? 'selected ' : '' ?>value="1800000">30 mins</option>
                            </select>

                            <label>Cache Fire Data</label>
                            <span class="help">Cache fire incident data to your device for faster loading</span>
                            <div class="radio"><input type="radio" name="locallySave" value="y" <?= $settings['locallySave'] == 'y' ? ' checked' : '' ?>><label>Yes</label></div>
                            <div class="radio"><input type="radio" name="locallySave" value="n" <?= !$settings['locallySave'] || $settings['locallySave'] == 'n' ? ' checked' : '' ?>><label>No</label></div>

                            <label>Coordinates Format</label>
                            <select class="input" name="coordsDisplay">
                                <option <?= $settings['coordsDisplay'] == 'dec' ? 'selected ' : '' ?>value="dec">Decimal</option>
                                <option <?= $settings['coordsDisplay'] == 'dms' ? 'selected ' : '' ?>value="dms">Degs, Mins, Secs</option>
                                <option <?= $settings['coordsDisplay'] == 'utm' ? 'selected ' : '' ?>value="utm">UTM</option>
                            </select>

                            <label>Temperature Format</label>
                            <div class="radio"><input type="radio" name="temp" value="f" <?= !$settings['weather']['temp'] || $settings['weather']['temp'] == 'f' ? ' checked' : '' ?>><label>&deg;F</label></div>
                            <div class="radio"><input type="radio" name="temp" value="c" <?= $settings['weather']['temp'] == 'c' ? ' checked' : '' ?>><label>&deg;C</label></div>

                            <label>Wind Speed Format</label>
                            <div class="radio"><input type="radio" id="wind1" name="wind" value="mph"<?= empty($settings['weather']) || $settings['weather']['wind'] == 'mph' ? 'checked ' : '' ?>><label for="wind1">mph</label></div>
                            <div class="radio"><input type="radio" id="wind2" name="wind" value="m/s"<?= $settings['weather']['wind'] == 'm/s' ? 'checked ' : '' ?>><label for="wind2">m/s</label></div>
                            <div class="radio"><input type="radio" id="wind3" name="wind" value="kts"<?= $settings['weather']['wind'] == 'kts' ? 'checked ' : '' ?>><label for="wind3">kts</label></div>
                            <div class="radio"><input type="radio" id="wind4" name="wind" value="km/h"<?= $settings['weather']['wind'] == 'km/h' ? 'checked ' : '' ?>><label for="wind4">km/h</label></div>
                        </div>
                        <div class="col w50">
                            <label>Acres Unit</label>
                            <span class="help">What unit do you want to see fire & perimeter sizes?</span>
                            <select class="input" name="acresUnit">
                                <option <?= !$settings['acresUnit'] || $settings['acresUnit'] == 'acres' ? 'selected ' : '' ?>value="acres">acres</option>
                                <option <?= $settings['acresUnit'] == 'hectares' ? 'selected ' : '' ?>value="hectares">hectares</option>
                                <option <?= $settings['acresUnit'] == 'sqmi' ? 'selected ' : '' ?>value="sqmi">sq. mi.</option>
                                <option <?= $settings['acresUnit'] == 'sqkm' ? 'selected ' : '' ?>value="sqkm">sq. km.</option>
                            </select>

                            <label>Perimeters</label>
                            <span class="help">Set the minimum size of fires to show on the map</span>
                            <div style="display:flex;align-items:center;margin:10px 0 15px 0">
                                <input type="range" name="minsize" style="width:100%;max-width:400px;margin:0" min="0" max="1000" step="25" value="<?= $settings['perimeters']['minSize'] != null ? $settings['perimeters']['minSize'] : 500 ?>">
                                <span id="psize" style="min-width:100px;padding-left:15px"><?= $settings['perimeters']['minSize'] ?> acres</span>
                            </div>

                            <label>Perimeter Color</label>
                            <select class="input" name="perimColor">
                                <option <?= $settings['perimeters']['color'] == 'default' ? 'selected ' : '' ?>value="default">Default</option>
                                <option <?= $settings['perimeters']['color'] == 'red' ? 'selected ' : '' ?>value="red">Red</option>
                                <option <?= $settings['perimeters']['color'] == 'blue' ? 'selected ' : '' ?>value="blue">Blue</option>
                                <option <?= $settings['perimeters']['color'] == 'orange' ? 'selected ' : '' ?>value="orange">Orange</option>
                                <option <?= $settings['perimeters']['color'] == 'green' ? 'selected ' : '' ?>value="green">Green</option>
                                <option <?= $settings['perimeters']['color'] == 'purple' ? 'selected ' : '' ?>value="purple">Purple</option>
                                <option <?= $settings['perimeters']['color'] == 'brown' ? 'selected ' : '' ?>value="brown">Brown</option>
                                <option <?= $settings['perimeters']['color'] == 'black' ? 'selected ' : '' ?>value="black">Black</option>
                            </select>

                            <label>Perimeter Zoom</label>
                            <span class="help">Zoom to fire perimeter on click to fit within screen</span>
                            <div class="radio"><input type="radio" name="pzoom" value="1" <?= $settings['perimeters']['zoom'] == 1 ? ' checked' : '' ?>><label>Yes</label></div>
                            <div class="radio"><input type="radio" name="pzoom" value="0" <?= $settings['perimeters']['zoom'] == 0 ? ' checked' : '' ?>><label>No</label></div>

                            <label>Perimeter Tooltip</label>
                            <span class="help">Show fire name when mouse hovers over a perimeter (desktop only)</span>
                            <div class="radio"><input type="radio" name="ttip" value="1" <?= $settings['perimeters']['ttip'] == 1 ? ' checked' : '' ?>><label>Yes</label></div>
                            <div class="radio"><input type="radio" name="ttip" value="0" <?= $settings['perimeters']['ttip'] == 0 ? ' checked' : '' ?>><label>No</label></div>
                        </div>
                    </div>

                    <input type="submit" name="action" class="btn btn-green" value="Save Map Settings">
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col w100">
                <div class="card dark">
                    <h2>Layers</h2>

                    <div class="row">
                        <div class="col w50">
                            <?
                            foreach ($layers['layers'] as $n => $a) {
                                if ($n == 'plan') {
                                    break;
                                }
                                echo '<h3 style="margin-bottom:0.5em">' . $layers['categories'][$n] . '</h3>';

                                foreach ($a as $layer) {
                                    $unlocked = false;

                                    if (empty($layer['perms2']) || (in_array('PREMIUM', $layer['perms2']) && $hasPremium) || (in_array('PRO', $layer['perms2']) && $hasPro)) {
                                        $unlocked = true;
                                    }
                                    
                                    /*if ($layer['perms'] && $user['role'] != 'ADMIN' || ($layer['perms'] && !$activeSub && $user['role'] != 'ADMIN')) {
                                        $unlocked = false;
                                    }*/

                                    echo '<div class="checkbox" style="display:block">';

                                    if (!$unlocked) {
                                        echo '<i class="fad fa-lock" title="You don\'t have access to this premium layer"></i>';
                                    } else {
                                        echo '<input type="checkbox" id="' . $layer['id'] . '" name="checkboxes[' . $layer['id'] . ']" value="1"' . (($checkboxes != null && in_array($layer['id'], $checkboxes) || $checkboxes == null && $layer['default'] == 1) ? ' checked' : '') . '>';
                                    }

                                    echo '<label for="' . $layer['id'] . '"' . (!$unlocked ? ' style="padding:0 0 0 1em' : '') . '">' . $layer['name'] . '</label>' .
                                        '<span class="help" style="margin-left:2.3em">' . $layer['desc'] . '</p></div>';
                                }
                            } ?>
                        </div>
                        <div class="col w50">
                            <?
                            foreach ($layers['layers'] as $n => $a) {
                                if ($n != 'fire' && $n != 'wx' && $n != 'evac') {
                                    echo '<h3 style="margin-bottom:0.5em">' . $layers['categories'][$n] . '</h3>';

                                    foreach ($a as $layer) {
                                        $unlocked = false;

                                        if (empty($layer['perms2']) || (in_array('PREMIUM', $layer['perms2']) && $hasPremium) || (in_array('PRO', $layer['perms2']) && $hasPro)) {
                                            $unlocked = true;
                                        }

                                        /*if ($layer['perms'] && $user['role'] != 'ADMIN' || ($layer['perms'] && !$activeSub && $user['role'] != 'ADMIN')) {
                                            $unlocked = false;
                                        }*/

                                        echo '<div class="checkbox" style="display:block">';

                                        if (!$unlocked) {
                                            echo '<i class="fad fa-lock" title="You don\'t have access to this premium layer"></i>';
                                        } else {
                                            echo '<input type="checkbox" id="' . $layer['id'] . '" name="checkboxes[' . $layer['id'] . ']" value="1"' . (($checkboxes != null && in_array($layer['id'], $checkboxes) || $checkboxes == null && $layer['default'] == 1) ? ' checked' : '') . '>';
                                        }

                                        echo '<label for="' . $layer['id'] . '"' . (!$unlocked ? ' style="padding:0 0 0 1em' : '') . '">' . $layer['name'] . '</label>' .
                                            '<span class="help" style="margin-left:2.3em">' . $layer['desc'] . '</span></div>';
                                    }
                                }
                            } ?>
                        </div>
                    </div>

                    <input type="submit" name="action" class="btn btn-green" value="Save Map Settings">
                </div>
            </div>
        </div>
    </div>
</form>