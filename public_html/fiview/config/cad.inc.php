<?
// Check if user has permissions to add or edit
if (!in_array('cad', $userPermissions)) {
    require_once('noauth.ini.php');
    exit();
}

if (isset($_POST['action']) && $_POST['action'] == 'Save Configuration') {
    $sn = mysqli_real_escape_string($con, $_POST['shortname']);
    $fn = mysqli_real_escape_string($con, $_POST['fullname']);

    ksort($_POST);
    foreach ($_POST as $k => $v) {
        if ($k != 'shortname' && $k != 'fullname' && $k != 'timezone' && $k != 'action') {
            $ns[$k] = $v;
        }
    }
    $newsettings = serialize($ns);

    mysqli_query($con, "UPDATE $db.agencies SET shortname = '$sn', fullname = '$fn', timezone = '$_POST[timezone]' WHERE agency_id = '$agency'");
    mysqli_query($con, "UPDATE $db.config SET value = '$newsettings' WHERE aid = '$agency' AND type = 'settings'");
    $success = 1;
}

$timezones = array('Anchorage' => 'Alaskan', 'Los_Angeles' => 'Pacific', 'Boise' => 'Mountain', 'Phoenix' => 'Arizona', 'Chicago' => 'Central', 'New_York' => 'Eastern');

$sql1 = mysqli_query($con, "SELECT * FROM $db.config WHERE (aid = 'all' OR aid = '$agency') AND (type = 'incident' OR type = 'zone' OR type = 'jurisdiction') ORDER BY value ASC");
$agc = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.agencies WHERE agency_id = '$agency'"));
$agSet = unserialize($ag['value']);

while ($g = mysqli_fetch_assoc($sql1)) {
    if ($g['type'] == 'incident') {
        $incs[] = $g['value'];
    }
    if ($g['type'] == 'jurisdiction') {
        $juris[] = unserialize($g['value']);
    }
    if ($g['type'] == 'zone') {
        $zones[] = $g['value'];
    }
}
?>
<h1>Configure <?= $software_name ?> Settings</h1>

<p class="help">Manage global settings for CAD and information for your dispatch center</p>

<? if ($success) { ?>
    <div id="message" class="success inline">
        <div class="text">You have successfully saved your <?= $software_name ?> settings.</div>
    </div>
<? } ?>

<form action="" method="post">

    <div class="row">
        <div class="col w-3">
            <div class="row">
                <div class="col w-6">
                    <b>Agency ID</b><input type="text" style="width:125px;cursor:help" value="<?= $agc['agency_id'] ?>" title="This cannot be changed by agencies" disabled>
                </div>
                <div class="col w-6">
                    <b>Software Version</b>
                    <select style="max-width:105px" disabled>
                    <?foreach($software_versions as $v){
                        echo '<option '.($software_build == $v ? 'selected ' : '').'value="'.$v.'">'.$v.'</option>';
                    }?>
                    </select>
                </div>
            </div>
        </div>
        <div class="col w-3"><b>Short Name</b><input type="text" name="shortname" placeholder="Agency Short Name" value="<?= $agc['shortname'] ?>"></div>
        <div class="col w-3"><b>Full Name</b><input type="text" name="fullname" placeholder="Agency Full Name" value="<?= $agc['fullname'] ?>"></div>
    </div>

    <div class="row">
        <div class="col w-3"><b>Agency City</b><input type="text" name="city" style="width:300px" placeholder="City" value="<?= $agSet['city'] ?>"></div>
        <div class="col w-3"><b>Agency State</b>
            <select name="state" style="width:250px">
                <option></option>
                <? foreach ($states_array as $k => $v) {
                    echo '<option ' . ($k == $agSet['state'] ? 'selected ' : '') . 'value="' . $k . '">' . $v . '</option>';
                } ?>
            </select>
        </div>
        <div class="col w-3"><b>Agency Timezone</b>
            <select name="timezone" style="width:200px">
                <? foreach ($timezones as $tz => $v) {
                    echo '<option ' . ('America/' . $tz == $agc['timezone'] ? 'selected ' : '') . 'value="America/' . $tz . '">' . $v . ' Time</option>';
                } ?>
            </select>
        </div>
        <div class="col w-3"><b>Default IP Address</b>
            <input type="text" name="default_ip" style="width:200px" placeholder="<?= $_SERVER['REMOTE_ADDR'] ?>" value="<?= $agSet['default_ip'] ?>">
        </div>
    </div>

    <hr>

    <div class="row">
        <div class="col w-3">
            <b>Default Incident</b>
            <select name="default_incident">
                <option></option>
                <? foreach ($incs as $i) {
                    echo '<option ' . ($i == $agSet['default_incident'] ? 'selected ' : '') . 'value="' . $i . '">' . $i . '</option>';
                } ?>
            </select>
        </div>
        <div class="col w-3">
            <b>Default Jurisdiction</b>
            <select name="default_jurisdiction">
                <option></option>
                <? foreach ($juris as $j) {
                    echo '<option ' . ($j['value'] == $agSet['default_jurisdiction'] ? 'selected ' : '') . 'value="' . $j['value'] . '">' . $j['value'] . ' (' . $j['name'] . ')</option>';
                } ?>
            </select>
        </div>
        <div class="col w-3">
            <b>Default Zone</b>
            <select name="default_zone">
                <option></option>
                <? foreach ($zones as $z) {
                    echo '<option ' . ($z == $agSet['default_zone'] ? 'selected ' : '') . 'value="' . $z . '">' . $z . '</option>';
                } ?>
            </select>
        </div>
        <div class="col w-3">
            <div class="row">
                <div class="col">
                    <b>Status Timer (minutes)</b>
                    <input type="text" name="status_timer" style="width:80px" placeholder="15" value="<?= $agSet['status_timer'] ?>">
                </div>
                <div class="col">
                    <b>CAD Refresh Time (seconds)</b>
                    <input type="text" name="reload_time" style="width:80px" placeholder="2" value="<?= $agSet['reload_time'] ?>">
                </div>
            </div>
        </div>
    </div>

    <hr>

    <div class="row">
        <div class="col">
            <b>Response Levels</b>
            <select name="response_levels">
                <? for ($i = 1; $i < 11; $i++) {
                    echo '<option ' . ($i == $agSet['response_levels'] ? 'selected ' : '') . 'value="' . $i . '">' . $i . '</option>';
                } ?>
            </select>
        </div>
    </div>

    <hr>

    <div class="row">
        <div class="col">
            <b>Default Coordinate Type</b>
            <div class="checkbox"><input type="radio" id="dec" name="coord_type" value="dec"<?=($agSet['coord_type'] == 'dec' ? ' checked' : '')?>><label for="dec">Decimal</label></div>
            <?/*<div class="checkbox"><input type="radio" id="dds" name="coord_type" value="dds"<?=($agSet['coord_type'] == 'dds' ? ' checked' : '')?>><label for="dds">Decimal Degrees</label></div>*/?>
            <div class="checkbox"><input type="radio" id="dms" name="coord_type" value="dms"<?=($agSet['coord_type'] == 'dms' ? ' checked' : '')?>><label for="dms">Degrees, Minutes, Seconds</label></div>
        </div>
    </div>

    <hr>

    <div class="row">
        <div class="col">
            <b>States in Dispatch Area</b>

            <? $i = 0;
            foreach ($states_array as $a => $b) {
                echo ($i % 12 == 0 ? ($i != 0 ? '</div>' : '') . '<div class="row">' : '');
                echo '<div class="col w-1"><div class="checkbox"><input type="checkbox" name="dispatchStates[]" id="'.$b.'" value="' . $a . '"' . (in_array($a, $agSet['dispatchStates']) ? ' checked' : '') . '><label for="'.$b.'">' . $b . '</label></div></div>';
                $i++;
            } ?>
        </div>

    </div>
    </div>

    <input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="Save Configuration">
    <input type="button" class="btn" onclick="window.location.href='../../admin'" value="Go Back">

</form>