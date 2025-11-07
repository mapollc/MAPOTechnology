<?
$pageTitle = 'MAPOfire Map Settings';
$includeLeaflet = true;
include_once('/home/mapo/public_html/mapofire.com/layers.inc.php');
$time = time();

function convertToDec($a, $b, $c) {
    $m = floatval(abs($a)) + floatval($b / 60) + floatval($c / 3600);

    return ($a < 0 ? $m * -1 : $m);
}

function convertToDMS($dec) {
    $vars = explode(".",$dec);
    $deg = $vars[0];
    $tempma = "0.".$vars[1];

    $tempma = $tempma * 3600;
    $min = floor($tempma / 60);
    $sec = $tempma - ($min*60);

    return [$deg, $min, rtrim(round($sec, 4), 0)];
} 

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
        'tile' => $_POST['basemap'],
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

    mysqli_query($con, "UPDATE settings SET settings = '$settings', method = '0', time = '$time' WHERE uid = '$_SESSION[uid]'");
    echo message(true, 'Your map settings were successfully updated.');
}

$row = mysqli_fetch_assoc(mysqli_query($con, "SELECT settings, method, time FROM settings WHERE uid = '$_SESSION[uid]'"));
$settings = unserialize($row['settings']);
$checkboxes = $settings['checkboxes'];
$basemaps = array(
    'terrain' => 'Terrain', 'satellite' => 'Satellite', 'osm' => 'Open Street Map', 'modis' => 'MODIS Satellite',
    'caltopo' => 'CalTopo', 'fs16' => 'USFS 2016', 'delorme' => 'DeLorme', 'usgs' => 'USGS', 'carto' => 'CartoDB', 'faa' => 'FAA Sectional'
);

$latdms = convertToDMS($settings['center'][0]);
$londms = convertToDMS($settings['center'][1]);
?>
<div class="row">
    <div class="col w-12">
        <div class="card">
            <script>
                var settings = <?= json_encode($settings) ?>
            </script>
            <div id="map" style="width:100%;height:400px"></div>
            <span class="help">Drag the map or the marker to set where you want your map to be centered upon returning to the map</span>
        </div>
    </div>
</div>

<form action="" method="post">
    <input type="hidden" name="checkboxes" value='<?= serialize($row['checkboxes']) ?>'>

    <div class="row">
        <div class="col w-6">
            <div class="card">
                <h3 class="category">Map Defaults</h3>

                <div style="font-size:14px;padding-bottom:10px;color:<?=(time()-$row['time'] > 3600 ? 'red' : 'green')?>">
                    <i class="fas fa-sync" style="padding-right:10px"></i> Your map settings were last synced <?=($row['method'] == 1 ? 'automatic' : 'manu')?>ally <?=ago($row['time'])?>
                </div>

                <label>Map Center</label>
                <span class="help">You can manually enter at latitude/longitude, or drag the marker on the map above</span>
                <div id="coordsDisplayDec" style="display:<?=($settings['coordsDisplay'] == 'dec' ? 'flex' : 'none')?>;align-items:center;justify-content:space-between;max-width:420px">
                    <input type="text" class="input" style="max-width:200px" name="lat" placeholder="Latitude" value="<?= $settings['center'][0] ?>"> ,
                    <input type="text" class="input" style="max-width:200px" name="lon" placeholder="Longitude" value="<?= $settings['center'][1] ?>">
                </div>
                <div id="coordsDisplayDMS" style="display:<?=($settings['coordsDisplay'] == 'dms' ? 'flex' : 'none')?>;gap:25px">
                    <div style="display:flex;align-items:center;justify-content:space-between;max-width:250px;flex:1">
                        <input type="text" class="input" style="max-width:75px" name="latdeg" placeholder="42" value="<?=$latdms[0]?>">&deg; 
                        <input type="text" class="input" style="max-width:50px" name="latmin" placeholder="9" value="<?=$latdms[1]?>">' 
                        <input type="text" class="input" style="max-width:100px" name="latsec" placeholder="6.768" value="<?=$latdms[2]?>">" 
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;max-width:250px;flex:1">
                        <input type="text" class="input" style="max-width:75px" name="londeg" placeholder="-117" value="<?=$londms[0]?>">&deg; 
                        <input type="text" class="input" style="max-width:50px" name="lonmin" placeholder="21" value="<?=$londms[1]?>">' 
                        <input type="text" class="input" style="max-width:100px" name="lonsec" placeholder="4.0536" value="<?=$londms[2]?>">" 
                    </div>
                </div>

                <label>Zoom</label>
                <select class="input" style="max-width:200px" name="zoom">
                    <? for ($i = 3; $i < 21; $i++) {
                        echo '<option ' . ($settings['zoom'] == $i ? 'selected ' : '') . 'value="' . $i . '">' . $i . '</option>';
                    } ?>
                </select>

                <label>Basemap</label>
                <select class="input" style="max-width:200px" name="basemap">
                    <? foreach ($basemaps as $k => $b) {
                        echo '<option ' . ($settings['tile'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . $b . '</option>';
                    } ?>
                </select>

                <div class="btn-group" style="margin-top:25px">
                    <input type="submit" name="action" class="btn btn-green" value="Save Map Settings">
                    <a href="#" class="btn btn-blue" id="getGeoLocation"><i class="fas fa-location-dot"></i> Get My Location</a>
                </div>
            </div>
        </div>
        <div class="col w-6">
            <div class="card">
                <h3 class="category">Preferences</h3>

                <label>Save Frequency</label>
                <span class="help">Choose how often you want your settings to sync automatically</span>
                <select class="input" name="saveFreq">
                    <option <?= ($settings['saveFreq'] == '60000' ? 'selected ' : '') ?>value="60000">1 min</option>
                    <option <?= ($settings['saveFreq'] == '300000' ? 'selected ' : '') ?>value="300000">5 mins</option>
                    <option <?= ($settings['saveFreq'] == '600000' ? 'selected ' : '') ?>value="600000">10 mins</option>
                    <option <?= ($settings['saveFreq'] == '900000' ? 'selected ' : '') ?>value="900000">15 mins</option>
                    <option <?= ($settings['saveFreq'] == '1800000' ? 'selected ' : '') ?>value="1800000">30 mins</option>
                </select>

                <label>Cache Fire Data</label>
                <span class="help">Cache fire incident data to your device for faster loading</span>
                <div class="radio"><input type="radio" name="locallySave" value="y" <?= ($settings['locallySave'] == 'y' ? ' checked' : '') ?>><label>Yes</label></div>
                <div class="radio"><input type="radio" name="locallySave" value="n" <?= (!$settings['locallySave'] || $settings['locallySave'] == 'n' ? ' checked' : '') ?>><label>No</label></div>

                <label>Coordinates Format</label>
                <select class="input" name="coordsDisplay">
                    <option <?= ($settings['coordsDisplay'] == 'dec' ? 'selected ' : '') ?>value="dec">Decimal</option>
                    <option <?= ($settings['coordsDisplay'] == 'dms' ? 'selected ' : '') ?>value="dms">Degs, Mins, Secs</option>
                    <option <?= ($settings['coordsDisplay'] == 'utm' ? 'selected ' : '') ?>value="utm">UTM</option>
                </select>

                <label>Temperature Format</label>
                <div class="radio"><input type="radio" name="temp" value="f" <?= (!$settings['weather']['temp'] || $settings['weather']['temp'] == 'f' ? ' checked' : '') ?>><label>&deg;F</label></div>
                <div class="radio"><input type="radio" name="temp" value="c" <?= ($settings['weather']['temp'] == 'c' ? ' checked' : '') ?>><label>&deg;C</label></div>

                <label>Wind Speed Format</label>
                <select class="input" name="wind">
                    <option <?= ($settings['weather']['wind'] == 'mph' ? 'selected ' : '') ?>value="mph">mph</option>
                    <option <?= ($settings['weather']['wind'] == 'm/s' ? 'selected ' : '') ?>value="m/s">m/s</option>
                    <option <?= ($settings['weather']['wind'] == 'kts' ? 'selected ' : '') ?>value="kts">kts</option>
                    <option <?= ($settings['weather']['wind'] == 'km/h' ? 'selected ' : '') ?>value="km/h">km/h</option>
                </select>

                <label>Acres Unit</label>
                <span class="help">What unit do you want to see fire & perimeter sizes?</span>
                <select class="input" name="acresUnit">
                    <option <?=(!$settings['acresUnit'] || $settings['acresUnit']=='acres' ? 'selected ' : '')?>value="acres">acres</option>
                    <option <?=($settings['acresUnit']=='hectares' ? 'selected ' : '')?>value="hectares">hectares</option>
                    <option <?=($settings['acresUnit']=='sqmi' ? 'selected ' : '')?>value="sqmi">sq. mi.</option>
                    <option <?=($settings['acresUnit']=='sqkm' ? 'selected ' : '')?>value="sqkm">sq. km.</option>
                </select>

                <label>Perimeters</label>
                <span class="help">Set the minimum size of fires to show on the map</span>
                <div style="display:flex;align-items:center;margin:10px 0 15px 0">
                    <input type="range" name="minsize" style="width:100%;max-width:400px;margin:0" min="0" max="1000" step="25" value="<?= ($settings['perimeters']['minSize'] ? $settings['perimeters']['minSize'] : 500) ?>">
                    <span id="psize" style="min-width:100px;padding-left:15px"><?= $settings['perimeters']['minSize'] ?> acres</span>
                </div>

                <label>Perimeter Color</label>
                <select class="input" name="perimColor">
                    <option <?= ($settings['perimeters']['color'] == 'default' ? 'selected ' : '') ?>value="default">Default</option>
                    <option <?= ($settings['perimeters']['color'] == 'red' ? 'selected ' : '') ?>value="red">Red</option>
                    <option <?= ($settings['perimeters']['color'] == 'blue' ? 'selected ' : '') ?>value="blue">Blue</option>
                    <option <?= ($settings['perimeters']['color'] == 'orange' ? 'selected ' : '') ?>value="orange">Orange</option>
                    <option <?= ($settings['perimeters']['color'] == 'green' ? 'selected ' : '') ?>value="green">Green</option>
                    <option <?= ($settings['perimeters']['color'] == 'purple' ? 'selected ' : '') ?>value="purple">Purple</option>
                    <option <?= ($settings['perimeters']['color'] == 'brown' ? 'selected ' : '') ?>value="brown">Brown</option>
                    <option <?= ($settings['perimeters']['color'] == 'black' ? 'selected ' : '') ?>value="black">Black</option>
                </select>

                <label>Perimeter Zoom</label>
                <span class="help">Zoom to fire perimeter on click to fit within screen</span>
                <div class="radio"><input type="radio" name="pzoom" value="1" <?= ($settings['perimeters']['zoom'] == 1 ? ' checked' : '') ?>><label>Yes</label></div>
                <div class="radio"><input type="radio" name="pzoom" value="0" <?= ($settings['perimeters']['zoom'] == 0 ? ' checked' : '') ?>><label>No</label></div>

                <label>Perimeter Tooltip</label>
                <span class="help">Show fire name when mouse hovers over a perimeter (desktop only)</span>
                <div class="radio"><input type="radio" name="ttip" value="1" <?= ($settings['perimeters']['ttip'] == 1 ? ' checked' : '') ?>><label>Yes</label></div>
                <div class="radio"><input type="radio" name="ttip" value="0" <?= ($settings['perimeters']['ttip'] == 0 ? ' checked' : '') ?>><label>No</label></div>
                <div class="clear"></div>

                <input type="submit" name="action" style="margin-top:25px" class="btn btn-green" value="Save Map Settings">
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col w-12">
            <div class="card">
                <div class="grids" style="margin-bottom:25px">
                    <? foreach ($layers['layers'] as $k => $v) { ?>
                        <div>
                            <h3 class="category"><?= $layers['categories'][$k] ?></h3>
                            <? foreach ($v as $l) {
                                if ($l['perms'] != 1 || ($user['role'] != 'GUEST' && $l['perms'] == 1)) { ?>
                                    <div class="checkbox" style="display:block">
                                        <input type="checkbox" id="<?= $l['id'] ?>" name="checkboxes[<?= $l['id'] ?>]" value="1" <?= (($checkboxes && in_array($l['id'], $checkboxes) || !$checkboxes && $l['default'] == 1) ? ' checked' : '') ?>>
                                        <label for="<?= $l['id'] ?>"><?= $l['name'] ?><?= ($l['perms'] == 1 ? '<i class="fad fa-lock-open" title="You have access to this premium layer" style="padding-left:10px;color:#b74a4a"></i>' : '') ?></label>
                                    </div>
                            <? }
                            } ?>
                        </div>
                    <? } ?>
                </div>
                <input type="submit" name="action" class="btn btn-green" value="Save Map Settings">
            </div>
        </div>
    </div>

</form>