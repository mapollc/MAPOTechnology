<?
include_once '../apis/functions.inc.php';
include_once '/home/mapo/public_html/cron/dispatch.inc.php';
$newDispatchCenters[] = 'MAPO';
asort($newDispatchCenters);

function size($a)
{
    $acres = floatval($a);

    if ($a == '') {
        return 'Unknown';
    } else {
        if (is_float($acres)) {
            $o = number_format($acres, 2);

            return substr(strval($o), -2) == '00' ? number_format($acres, 0) : (substr(strval($o), -1) == '0' ? number_format($acres, 1) : $o);
        } else {
            return 'Unknown';
        }
    }
}

function is_duplicate_fire($current_fire, $last_fire, $acres_threshold = 10.0, $id_last_digits = 3)
{
    // Basic checks for valid data in both fires.
    if (empty($current_fire) || empty($last_fire)) {
        return false; // Cannot compare with empty data.
    }

    // Normalize state and name for comparison (case-insensitive)
    $current_name_state = strtolower($current_fire['state'] . $current_fire['name']);
    $last_name_state = strtolower($last_fire['state'] . $last_fire['name']);

    // Extract last digits of incident IDs
    $current_id_suffix = substr($current_fire['incidentID'], -$id_last_digits);
    $last_id_suffix = substr($last_fire['incidentID'], -$id_last_digits);

    // Check for similar acres.  Handle null/empty acres robustly.
    $acres_match = false;
    $current_acres = floatval($current_fire['acres']); // Ensure float for comparison
    $last_acres = floatval($last_fire['acres']);     // Ensure float

    if (($current_acres === 0.0 || $current_acres === 0)  || ($last_acres === 0.0 || $last_acres === 0)) {
        $acres_match = true; // Consider 0 acres a match, or no acres reported.
    } elseif (is_numeric($current_acres) && is_numeric($last_acres)) {
        $acres_difference = abs($current_acres - $last_acres);
        $acres_match = $acres_difference <= $acres_threshold; // Define a reasonable threshold
    }

    // Core duplicate criteria:
    $name_state_match = $current_name_state === $last_name_state;
    $id_suffix_match  = $current_id_suffix === $last_id_suffix;

    return $name_state_match && $acres_match && $id_suffix_match;
}

// create or modify a MAPO-entered incident
if (isset($_POST['create']) && $_POST['create'] == 'Save Incident') {
    $year = date('Y');
    $time = time();
    $date = strtotime($_POST['discovered']);
    $id = $_POST['year'] . '-' . $_POST['juris'] . '-' . str_pad($_POST['num'], '6', '0', STR_PAD_LEFT);
    $name = mysqli_real_escape_string($con, str_replace(' Fire', '', $_POST['name']));
    $near = mysqli_real_escape_string($con, $_POST['near']);
    $notes = mysqli_real_escape_string($con, $_POST['notes']);
    $status = array();
    $agency = isset($_POST['agency']) && $_POST['agency'] != '' ? $_POST['agency'] : 'MAPO';

    if ($_POST['control'] == 1) {
        $status['Control'] = $time;
    }

    if ($_POST['contain'] == 1) {
        $status['Contain'] = $time;
    }

    if ($_POST['out'] == 1) {
        $status['Out'] = $time;
    }

    if (count($status) == 0) {
        $status = '';
    } else {
        $status = serialize($status);
    }

    if ($_POST['modify'] == 1) {
        $sql = "UPDATE wildfires SET incidentID = '$id', state = '$_POST[state]', agency = '$agency', unit = '$_POST[juris]', year = '$year', date = '$date', name = '$name', type = '$_POST[type]', lat = '$_POST[lat]',
        lon = '$_POST[lon]', geo = '$near', acres = '$_POST[acres]', notes = '$notes', status = '$status', updated = '$time', timezone = '$_POST[tz]', display = '$_POST[display]' WHERE wfid = '$_POST[wfid]'";

        $msg = 'You have successfully updated Incident #' . $id . '.';
        logEvent('Modified a ' . strtolower($_POST['type']) . ' incident (#' . $id . ')');
    } else {
        $sql = "INSERT INTO wildfires (incidentID,state,agency,unit,year,date,name,type,lat,lon,geo,acres,status,notes,resources,fuels,captured,updated,timezone,display,owner)
        VALUES('$id','$_POST[state]','$agency','$_POST[juris]','$year','$date','$name','$_POST[type]','$_POST[lat]','$_POST[lon]','$near','$_POST[acres]','$status','$notes','','','$time','$time','$_POST[tz]','$_POST[display]','mapo')";

        $msg = 'Incident ' . $id . ' was successfully created. You can modify it <a href="modify?wfid={{wfid}}">here</a>.';
    }

    #echo $sql;
    mysqli_query($con, $sql);
    if ($_POST['modify'] != 1) {
        $msg = str_replace('{{wfid}}', mysqli_insert_id($con), $msg);
        logEvent('Created a new ' . strtolower($_POST['type']) . ' incident (#' . $id . ')');
    }
    mysqli_query($con, "INSERT INTO acres_history (incidentID,acres,updated) SELECT incidentID, acres, updated FROM wildfires WHERE incidentID = '$id' AND NOT EXISTS (SELECT 1 FROM acres_history WHERE acres_history.acres = '$_POST[acres]' AND acres_history.incidentID = '$id')");

    echo message(true, $msg);
}

// modify all wildfires
if (isset($_POST['action']) && $_POST['action'] == 'Save Changes') {
    $acres = str_replace(',', '', $_POST['acres']);
    mysqli_query($con, "UPDATE wildfires SET acres = '$acres', display = '$_POST[display]' WHERE wfid = '$_POST[wfid]'");

    logEvent("Updated a wildfire incident: <a href=\"../wildfires/edit?wfid=$_POST[wfid]\">WFID #$_POST[wfid]</a>");
    echo message(true, 'Changes to this wildfire incident were successfully saved.');
}

// clear API cache of wildfires
if ($_GET['cache'] == 'clear') {
    $memcache = new Memcached();
    $memcache->addServer('127.0.0.1', 11211);
    $keys = ['all', 'new', 'rx', 'smk', 'all,new', 'all,new,smk', 'all,new,smk,rx'];

    foreach ($keys as $key) {
        $key = 'api-fires_' . $key;

        if ($memcache->get($key)) {
            $memcache->delete($key);
        }
    }

    logEvent("Manually cleared wildfire API caches");
    echo message(true, 'The wildfires API cache has been cleared.');
}
?>

<div class="row">
    <div class="col w100">
        <div class="card">
            <?
            if ($function == 'stats') {
                include_once 'incs/fire-stats.ini.php';
            } else if ($function == 'create' || $function == 'modify') {
                include_once 'incs/custom_wildfire.ini.php';
            } else if ($function == 'edit') {
                include_once 'incs/edit-wildfire.ini.php';
            } else if ($function == 'log') {
                include_once 'incs/log-wildfire.ini.php';
            } else if ($function == 'controls') { ?>
                <h1>Wildfire Management &mdash; Controls</h1>

                <div class="btn-group">
                    <a class="btn btn-light-blue" href="<?= $linkURL ?>admin/wildfires?cache=clear">Clear API Cache</a>
                    <? if ($function != 'duplicates') { ?><a class="btn btn-red" href="<?= $linkURL ?>admin/wildfires/duplicates">See Duplicates</a><? } ?>
                    <a class="btn btn-yellow" href="<?= $linkURL ?>admin/wildfires/log">Acres History</a>
                    <? if ($permission->fire()->add()) { ?><a class="btn btn-green" href="<?= $linkURL ?>admin/wildfires/create">Create New Incident</a><? } ?>
                    <a class="btn btn-black" href="<?= $linkURL ?>admin/wildfires/stats">Statistics</a>
                    <a class="btn btn-gray btn-sm" href="#" onclick="history.go(-1);return false">Go Back</a>
                </div>
            <? } else {
                include_once 'incs/view-wildfire.ini.php';
            } ?>
        </div>
    </div>
</div>