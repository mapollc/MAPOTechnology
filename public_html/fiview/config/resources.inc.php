<?
// Check if user has permissions to add or edit
if (!in_array('editResources', $userPermissions) && !in_array('addResources', $userPermissions)) {
    require_once('noauth.ini.php');
    exit();
}

// Get zones and jurisdictions for this agency from the config table
$jsql = mysqli_query($con, "SELECT type, value FROM $db.config WHERE aid = '$agency' AND type = 'zone' OR type = 'jurisdiction' ORDER BY value ASC");
while ($j = mysqli_fetch_assoc($jsql)) {
    if ($j['type'] == 'zone') {
        $zones[] = $j['value'];
    } else {
        $v = unserialize($j['value']);
        $juris[$v['value']] = array($v['agency'], $v['name']);
    }
}

if ($_GET['mode']) {
    // Check if user has permissions to add or edit
    if (($_GET['mode'] == 'add' && !in_array('addResources', $userPermissions)) || ($_GET['mode'] == 'edit' && !in_array('editResources', $userPermissions))) {
        require_once('noauth.ini.php');
        exit();
    }

    // On form submit, update or insert data into mysql
    if (isset($_POST['action'])) {
        $agency = strtoupper($agency);
        $name = mysqli_real_escape_string($con, $_POST['name']);
        $bool = mysqli_num_rows(mysqli_query($con, "SELECT unit FROM $db.resources WHERE agency = '$agency' AND unit = '$_POST[unit]'"));

        if (!$_POST['type']) {
            $errors += 1;
            $errorMsg .= 'You must specify which type of unit this is.<br>';
        }
        if ($bool > 0 && $_POST['action'] == 'Add Resource') {
            $errors += 1;
            $errorMsg .= 'The unit ' . $_POST['unit'] . ' already exists in CAD.</b><br>';
        }
        if (!$_POST['unit']) {
            $errors += 1;
            $errorMsg .= 'You must enter a unit number.<br>';
        }
        if (!$_POST['zone']) {
            $errors += 1;
            $errorMsg .= 'You must assign this resource a zone.<br>';
        }
        if (!$_POST['juris']) {
            $errors += 1;
            $errorMsg .= 'You must assign this resource a jurisdiction.<br>';
        }
        if (!$_POST['ia']) {
            $errors += 1;
            $errorMsg .= 'You must specify whether this resource can be assigned to incidents.<br>';
        }
        //if(!$_POST['shared']){ $errors += 1; $errorMsg .= 'You must specify whether this resource can be shared elsewhere.'; }

        if ($errors == 0) {
            if ($_POST['action'] == 'Save Changes') {
                $actionSQL = "UPDATE $db.resources SET jurisdiction = '$_POST[juris]', zone = '$_POST[zone]', zone2 = '$_POST[zone]', unit = '$_POST[unit]', type = '$_POST[type]', name = '$name', ia = '$_POST[ia]', shared = '$_POST[shared]', active = '$_POST[active]' WHERE unit = '$_POST[unit]' AND agency = '$agency'";
                $success = 'You succesfully edited settings for <b>' . $_POST['unit'] . '.</b>';
            } else if ($_POST['action'] == 'Add Resource') {
                $actionSQL = "INSERT INTO $db.resources (agency,jurisdiction,zone,zone2,unit,type,name,inc,status,ia,shared,location,last_comm,active) VALUES('$agency','$_POST[juris]','$_POST[zone]','$_POST[zone]','$_POST[unit]','$_POST[type]','$name','','','$_POST[ia]','$_POST[shared]','','','$_POST[active]')";
                $success = 'You successfully added <b>' . $_POST['unit'] . '</b> to ' . $software_name . '.';
            }

            mysqli_query($con, $actionSQL) or die(mysqli_error($con));
        }
    }

    if ($_GET['mode'] == 'edit') {
        $r = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM $db.resources WHERE unit = '$_GET[unit]' AND agency = '$agency'"));
    }
?>
    <h1><?= ($_GET['mode'] == 'add' ? 'Add New Resource' : 'Edit Resource: ' . $r['unit']) ?></h1>

    <? if ($success) { ?>
        <div id="message" class="success inline">
            <div class="text"><?= $success ?></div>
        </div>
    <? } ?>

    <? if ($errors > 0) { ?>
        <div id="message" class="error inline">
            <div class="text"><?= $errorMsg ?></div>
        </div>
    <? } ?>

    <form action="" method="post">
        <? if ($r) { ?><input type="hidden" name="unit" value="<?= $r['unit'] ?>"><? } ?>

        <div class="row">
            <div class="col w-6">
                <b class="req">Type</b>
                <select name="type">
                    <option>- Choose Type -</option>
                    <? foreach ($resource_types as $k => $t) {
                        echo '<option ' . ($k == $r['type'] || $k == $_POST['type'] ? 'selected ' : '') . 'value="' . $k . '">' . $t . '</option>';
                    }?>
                </select>

                <b class="req">Unit</b>
                <input type="text" name="unit" placeholder="E1234" value="<?= ($r['unit'] ? $r['unit'] : $_POST['unit']) ?>">

                <b>Name</b>
                <input type="text" name="name" placeholder="Unit Name" value="<?= ($r['name'] ? $r['name'] : $_POST['name']) ?>">

                <b class="req">Active Resource</b>
                <select name="active" style="max-width:100px">
                    <option <?= ($r['active'] == 1 ? 'selected ' : '') ?>value="1">Yes</option>
                    <option <?= ($r['active'] == 0 ? 'selected ' : '') ?>value="0">No</option>
                </select>

            </div>
            <div class="col w-6">
                <b class="req">Dispatch Zone</b>
                <select name="zone">
                    <option value="">- Choose Zone -</option>
                    <? foreach ($zones as $z) {
                        echo '<option ' . ($r['zone'] == $z || $_POST['zone'] == $z ? 'selected ' : '') . 'value="' . $z . '">' . $z . '</option>';
                    } ?>
                </select>

                <b class="req">Jurisdiction</b>
                <select name="juris">
                    <option value="">- Choose Jurisdiction -</option>
                    <? foreach ($juris as $a => $b) {
                        echo '<option ' . ($r['jurisdiction'] == $a || $_POST['jurisdiction'] == $a ? 'selected ' : '') . 'value="' . $a . '">' . $b[1] . ' (' . $b[0] . ')</option>';
                    } ?>
                </select>

                <b class="req">Can be assigned to incidents?</b>
                <div class="checkbox"><input type="radio" name="ia" id="ia1" value="1" <?= ($r['ia'] == 1 ? ' checked' : '') ?>><label for="ia1">Yes</label></div>
                <div class="checkbox"><input type="radio" name="ia" id="ia2" value="0" <?= ($r['ia'] == 0 ? ' checked' : '') ?>><label for="ia2">No</label></div>

                <b class="req">Shared Resource?</b>
                <div class="checkbox"><input type="radio" name="shared" id="sr1" value="1" <?= ($r['shared'] == 1 ? ' checked' : '') ?>><label for="sr1">Yes</label></div>
                <div class="checkbox"><input type="radio" name="shared" id="sr2" value="0" <?= ($r['shared'] == 0 ? ' checked' : '') ?>><label for="sr2">No</label></div>
            </div>
        </div>

        <input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="<?= ($_GET['mode'] == 'edit' ? 'Save Changes' : 'Add Resource') ?>">
        <input type="button" class="btn" onclick="window.location.href='../resources'" value="Go Back">
    </form>

<? } else {
    $au = mysqli_query($con, "SELECT * FROM $db.resources WHERE agency = '$agency' ORDER BY unit ASC");
?>
    <h1><?= $adminTitle ?></h1>

    <p class="help">Manage all resources within <?= $software_name ?> for your dispatch center</p>

    <? if (in_array('addResources', $userPermissions)) { ?>
        <input type="button" class="btn blue" onclick="window.location.href='resources/add'" value="Add Resource">
    <? } ?>

    <div class="table-responsive">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>Global ID</th>
                    <th>Unit</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Dispatch Zone</th>
                    <th>Agency</th>
                    <th>Jurisdiction</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <? while ($r = mysqli_fetch_assoc($au)) {
                    $a = str_replace('-', '', $r['agency']);
                    $rid = substr($a, 0, 2) . '-' . substr($a, 2, strlen($a)) . '-' . $r['id'];
                ?>
                    <tr>
                        <td><?= $rid ?></td>
                        <td style="font-weight:bold"><?= $r['unit'] ?></td>
                        <td><?= $r['name'] ?></td>
                        <td><?= $resource_types[$r['type']] ?></td>
                        <td><?= $r['zone'] ?></td>
                        <td><?= $juris[$r['jurisdiction']][0] ?></td>
                        <td><?= $juris[$r['jurisdiction']][1] ?></td>
                        <td><? if (in_array('editResources', $userPermissions)) { ?><a href="resources/edit?unit=<?= $r['unit'] ?>">edit</a><? } ?></td>
                    </tr>
                <? } ?>
            </tbody>
        </table>
    </div>

<? } ?>