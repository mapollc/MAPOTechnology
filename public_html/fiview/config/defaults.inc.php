<?
// Check if user has permissions to add or edit
if (!in_array('defaults', $userPermissions)) {
    require_once('noauth.ini.php');
    exit();
}

// Redirect back to admin homepage if there isn't a specific data type specified
if ($_GET['mode'] != 'zones' && $_GET['mode'] != 'jurisdictions' && $_GET['mode'] != 'incidents' && $_GET['mode'] != 'units') {
    header('Location: ' . $baseurl . '/admin');
    exit();
}

if ($_GET['mode'] == 'zones') {
    $what = 'Dispatch Zones';
    $sql = "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'zone'";
} else if ($_GET['mode'] == 'incidents') {
    $what = 'Incident Types';
    $sql = "SELECT aid, value FROM $db.config WHERE (aid = '$agency' OR aid = 'all') AND type = 'incident'";
} else if ($_GET['mode'] == 'units') {
    $what = 'Agency Units';
    $sql = "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'unit'";
} else if ($_GET['mode'] == 'jurisdictions') {
    $what = 'Jurisdictions';
    $sql = "SELECT value FROM $db.config WHERE aid = '$agency' AND type = 'jurisdiction'";
}

// save all the data
if (isset($_POST['action'])) {
    $agency = strtoupper($agency);
    $type = substr($_GET['mode'], 0, -1);

    if ($type == 'jurisdiction') {
        $run .= "DELETE FROM $db.config WHERE aid LIKE '$agency' AND type = 'jurisdiction';";
        for ($i = 0; $i < count($_POST['state']); $i++) {
            $j = mysqli_real_escape_string($con, serialize(array('state' => $_POST['state'][$i], 'value' => $_POST['unit'][$i], 'agency' => $_POST['agency'][$i], 'name' => $_POST['area'][$i])));
            $run .= "INSERT INTO $db.config (aid,type,value) VALUES('$agency','jurisdiction','$j');";
        }        
    } else {
        // add new values into mysql table
        foreach ($_POST['types'] as $t) {
            if (!in_array($t, $_POST['oldvalues'])) {
                $run .= "INSERT INTO $db.config (aid,type,value) VALUES('$agency','$type','$t');";
            }
        }

        // remove existing values in mysql table
        foreach ($_POST['oldvalues'] as $t) {
            if (!in_array($t, $_POST['types'])) {
                $run .= "DELETE FROM $db.config WHERE aid = '$agency' AND type = '$type' AND value = '$t';";
            }
        }
    }

    // run all the mysql queries to add, remove, or update values
    if (mysqli_multi_query($con, $run)) {
        do {
            if ($result = mysqli_store_result($con)) {
                while ($row = mysqli_fetch_row($result)) {
                }
                mysqli_free_result($result);
            }
            if (mysqli_more_results($con)) {
            }
        } while (mysqli_next_result($con));
    }

    $success = 1;
}

if ($_GET['mode'] == 'jurisdictions') {
    $d = mysqli_fetch_assoc(mysqli_query($con, "SELECT value FROM $db.config WHERE aid LIKE '$agency'"));
    $dispatchStates = unserialize($d['value'])['dispatchStates'];
}

$query = mysqli_query($con, $sql . " ORDER BY aid ASC, value ASC");
$aq = mysqli_query($con, "SELECT value FROM $db.config WHERE aid LIKE '$agency' AND type = 'unit' ORDER BY value ASC");
while ($aa = mysqli_fetch_assoc($aq)) {
    $allAgencies[] = $aa['value'];
}
$agency = strtoupper($agency);
?>
<h1>Manage <?= $what ?></h1>

<p class="help">Manage <?= $what ?> for your dispatch center</p>

<? if ($success) { ?>
    <div id="message" class="success inline">
        <div class="text">You have successfully saved your <?= strtolower($what) ?> for <?= $agency ?>.</div>
    </div>
<? } ?>

<form action="" method="post">
    <input type="hidden" name="type" value="<?= $_GET['mode'] ?>">

    <a class="btn blue sm" id="addRow" data-what="<?= $what ?>" href="#" onclick="return false"><i class="fas fa-plus"></i> Add <?= substr($what, 0, -1) ?></a>

    <?if ($_GET['mode'] == 'jurisdictions') {?>
        <ol>
        <?while ($row = mysqli_fetch_assoc($query)) {
            if ($_GET['mode'] == 'jurisdictions') {
            $data = unserialize($row['value']);
            ?>
            <li>
                <select id="dstate" name="state[]" style="display:inline-block;width:100px;margin-right:10px"><option></option>
                <?foreach($dispatchStates as $s) {
                    echo '<option '.($data['state'] == $s ? 'selected ' : '').'value="'.$s.'">'.$s.'</option>';
                }?>
                </select>

                <select id="dagencies" name="agency[]" style="display:inline-block;margin-right:10px"><option>- Choose Agency -</option><option selected value="<?=$data['agency']?>"><?=$data['agency']?></option></select>
                <select id="darea" name="unit[]" style="display:inline-block;margin-right:10px"><option>- Choose Unit -</option><option selected value="<?=$data['value']?>"><?=$data['name']?></option></select>
                <input type="text" id="dunit" style="display:inline-block;margin-right:10px;width:150px" value="<?=$data['value']?>" disabled>
                <a href="#" class="btn red sm" style="margin-left:0.5em" id="removeRow" onclick="return false"><i class="fas fa-delete-left"></i></a>
                <input type="hidden" name="area[]" value="<?=$data['name']?>">
            </li>
            <?}
        }?>
        </ol>
    <?
    echo '<script>var dispatchStates = '.json_encode($dispatchStates).';</script>';
    } else {
    echo '<script>var allAgencies = ' . json_encode($allAgencies) . '</script>';
    echo '<ol>';
    while ($row = mysqli_fetch_assoc($query)) {
        if ($_GET['mode'] == 'jurisdictions') {
            $data = unserialize($row['value']);
            echo '<li><input type="text" name="value[]" style="display:inline-block;width:100px;margin-right:1em" placeholder="' . $agency . '" value="' . $data['value'] . '">' .
                '<input type="text" name="name[]" style="display:inline-block;margin-right:1em" placeholder="Jurisdiction Name" value="' . $data['name'] . '">' .
                '<select style="display:inline-block;width:400px" name="agencies[]"><option></option>';
            foreach ($allAgencies as $a) {
                echo '<option ' . ($a == $data['agency'] ? 'selected ' : '') . 'value="' . $a . '">' . $a . '</option>';
            }
            echo '</select><a href="#" class="btn red sm" style="margin-left:0.5em" id="removeRow" onclick="return false"><i class="fas fa-delete-left"></i></a></li>';
        } else {
            echo ($row['aid'] != 'all' ? '<input type="hidden" name="oldvalues[]" value="' . $row['value'] . '">' : '') .
                '<li><input type="text" name="types[]" placeholder="' . $what . '" value="' . $row['value'] . '" style="display:inline-block' . ($row['aid'] == 'all' ? ';cursor:help" title="Agencies can\'t edit this ' . strtolower(substr($what, 0, -1)) . '" disabled' : '"') . '>' .
                '<a href="#" class="btn red sm" style="margin-left:0.5em" id="removeRow" onclick="return false"><i class="fas fa-delete-left"></i></a></li>';
        }
    }
    echo '</ol>';
    ?>
    <?}?>

    <input type="submit" class="btn green" style="margin-right:0.5em" name="action" value="Save <?= $what ?>">
    <input type="button" class="btn" onclick="window.location.href='../../../admin'" value="Go Back">

</form>