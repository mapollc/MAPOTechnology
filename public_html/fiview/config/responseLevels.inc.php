<?
if (isset($_GET['mode']) && !in_array('responseLevels', $userPermissions)) {
    require_once('noauth.ini.php');
    exit();
}

if ($_GET['mode'] == 'areas') {
    include_once('areas.ini.php');
} else {
    if (isset($_POST['action']) && $_POST['action'] == 'Save Changes') {
        $errors = 0;

        for ($i = 0; $i < count($_POST['type']); $i++) {
            $s[] = array('type' => $_POST['type'][$i], 'count' => $_POST['req'][$i]);
        }
        $level = mysqli_real_escape_string($con, $_POST['name']);
        $re = serialize($s);

        if ($level == '') {
            $errors += 1;
            $errorMsg .= 'You must specifiy a name for this response level.<br>';
        }

        if ($_POST['priority'] == '') {
            $errors += 1;
            $errorMsg .= 'You must specifiy the priority for this response level.<br>';
        }

        if ($errors == 0) {
            if ($_POST['mode'] == 'add') {
                $sql = "INSERT INTO $db.responseLevels (agency,level,priority,settings,zones) VALUES('$agency','$level','$_POST[priority]','$re','')";
                $success = 'You have successfully added response level <b>'.$_POST['name'].'</b>.';
            } else {
                $sql = "UPDATE $db.responseLevels SET level = '$level', priority = '$_POST[priority]', settings = '$re' WHERE agency = '$agency' AND id = '$_POST[id]'";
                $success = 'You have successfully updated response level <b>'.$_POST['name'].'</b>.';
            }

            mysqli_query($con, $sql);
        } else {
            $error = $errorMsg;
        }
    }

    #$sql = mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'zone' ORDER BY value ASC");
    $result = mysqli_query($con, "SELECT id, level, priority, active FROM $db.responseLevels WHERE agency = '$agency' ORDER BY priority ASC");
    $value = unserialize(mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'responseAreas'"))['value']);
    $settings = unserialize($sql['settings']);
    ?>

    <h1>Response Levels</h1>

    <?if ($success) {?>
        <div id="message" class="success inline">
            <div class="text"><?= $success ?></div>
        </div>
    <?}?>

    <?if ($error) {?>
        <div id="message" class="error inline">
            <div class="text"><?= $error ?></div>
        </div>
    <?}?>

    <?if (!isset($_GET['mode'])) {?>
        <p class="help">Create response levels for incidents that allows CAD to suggest resources for assignment</p>

        <? if (in_array('responseLevels', $userPermissions)) { ?>
            <input type="button" class="btn blue" onclick="window.location.href='responseLevels/add'" value="Add Response Level">
        <? } ?>

        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Priority/Order</th>
                        <th>Level Name</th>
                        <th>Active</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <? while ($row = mysqli_fetch_assoc($result)) {
                        echo '<tr><td>' . $row['id'] . '</td><td>'.$row['priority'].'</td><td>' . $row['level'] . '</td><td>' . ($row['active'] == 1 ? 'Yes' : 'No') . '</td>'.
                        '<td>' . (in_array('responseLevels', $userPermissions) ? '<a href="./responseLevels/edit?id=' . $row['id'] . '">edit</a>' : '') . '</td></tr>';
                    } ?>
                </tbody>
            </table>
        </div>

    <h1>Response Areas</h1>
    <p class="help">Assign response levels to individual dispatch zones</p>

    <input type="button" class="btn blue" onclick="window.location.href='responseLevels/areas'" value="Modify Response Areas">

    <div class="table-responsive">
        <table class="table table-striped">
            <thead>
                <th>Zone</th>
                <th>Response Levels</th>
            </thead>
            <tbody>
            <?foreach($value as $k => $v) {
                $levels = '';
                $total = count($v);
                $x = 0;
                foreach ($v as $o) {
                    $levels .= $o.($x < $total - 1 ? ', ' : '');
                    $x++;
                }
                echo '<tr><td>'.$k.'</td><td>'.$levels.'</td></tr>';
            }?>
            </tbody>
        </table>
    </div>
    <? } else {
        if ($_GET['mode'] == 'edit') {
            $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT level, priority, settings, active FROM $db.responseLevels WHERE id = '$_GET[id]'"));
            $re = unserialize($row['settings']);
        }
    ?>
        <form action="" method="post">
            <input type="hidden" name="mode" value="<?= $_GET['mode'] ?>">
            <?= ($_GET['mode'] == 'edit' ? '<input type="hidden" name="id" value="' . $_GET['id'] . '">' : '') ?>

            <b class="req">Response Level Name</b>
            <input type="text" name="name" value="<?= $row['level'] ?>">

            <b class="req">Priority</b>
            <input type="text" name="priority" style="width:75px" placeholder="1" value="<?=$row['priority']?>">

            <b class="req">Active</b>
            <div class="checkbox"><input type="radio" id="a1" name="active" value="1" <?= ($row['active'] == 1 ? ' checked' : '') ?>><label for="a1">Yes</label></div>
            <div class="checkbox" style="margin-bottom:10px"><input type="radio" id="a2" name="active" value="0" <?= ($row['active'] == 0 ? ' checked' : '') ?>><label for="a2">No</label></div>

            <b class="req">Resources Required</b>
            <? $x = 0;
            foreach ($resource_types as $k => $t) { ?>
                <div class="row align-items-center" style="margin-bottom:5px">
                    <div class="col w-2">
                        <input type="hidden" name="type[]" value="<?= $k ?>">
                        <?= $t ?>
                    </div>
                    <div class="col w-1">
                        <select name="req[]" style="margin-bottom:0">
                            <? for ($i = 0; $i <= 15; $i++) {
                                echo '<option ' . ($re[$x]['type'] == $k && $re[$x]['count'] == $i ? 'selected ' : '') . 'value="' . $i . '">' . $i . '</option>';
                            } ?>
                        </select>
                    </div>
                </div>
            <? $x++;
            } ?>

            <input type="submit" name="action" class="btn green" style="margin-right:0.5em" value="Save Changes">
            <input type="button" class="btn" onclick="window.location.href='../responseLevels'" value="Go Back">
        </form>
    <?}
}?>