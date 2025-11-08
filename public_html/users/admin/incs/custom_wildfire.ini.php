<?
if ($function == 'create' && !$permission->fire()->add() || $function == 'modify' && !$permission->fire()->edit()) {
    echo invalidPermissions();
} else {
    $sql2 = mysqli_query($con, "SELECT unit, area FROM dispatch_zones WHERE unit LIKE '%C' ORDER BY unit ASC");

    while ($row = mysqli_fetch_assoc($sql2)) {
        $dispatchCenters[] = array('unit' => $row['unit'], 'name' => $row['area']);
    }

    if ($function == 'modify') {
        $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT * FROM wildfires WHERE wfid = '$_GET[wfid]'"));
        $e = explode('-', $row['incidentID']);
        $status = $row['status'] != '' ? unserialize($row['status']) : [];
    }

    if ($function == 'modify' && $row['owner'] != 'mapo') {
        echo errorCode('Not a MAPO Incident', 'This incident was created automatically from IRWIN and cannot be modified. '.
            'Change this incident\'s display status <a href="edit?wfid='.$_GET['wfid'].'">here</a>');
    } else {
        $num = mysqli_num_rows(mysqli_query($con, "SELECT wfid FROM wildfires WHERE owner = 'MAPO' AND year = '$year'")) + 1;
    ?>
    <h1 class="category"><?= $function == 'modify' ? 'Modify' : 'Create New' ?> Incident<?= $function == 'modify' ? ': ' . $row['incidentID'] : '' ?></h1>

    <form action="" method="post">
        <? if ($function == 'modify') { ?>
            <input type="hidden" name="wfid" value="<?= $_GET['wfid'] ?>">
            <input type="hidden" name="modify" value="1">
        <? } ?>
        <input type="hidden" name="inhouse_num" value="<?= $num ?>">
        <input type="hidden" name="near" value="<?= $row['geo'] ?>">
        <input type="hidden" name="tz" value="<?= $row['timezone'] ?>">

        <div class="row">
            <div class="col w50">
                <label>Discovery Date/Time</label>
                <input type="datetime-local" name="discovered" class="input" value="<?= date('Y-m-d\TH:i', $row ? $row['date'] : time()) ?>" placeholder="">

                <label>Format</label>
                <div class="radio" style="margin-bottom:0">
                    <input type="radio" id="f1" name="format" value="irwin" <?= $e[1] != 'MAPO' || !$e ? ' checked' : '' ?>><label for="f1">IRWIN</label>
                </div>
                <div class="radio" style="margin-bottom:0">
                    <input type="radio" id="f2" name="format" value="mapo" <?= $e[1] == 'MAPO' ? ' checked ' : '' ?>><label for="f2">MAPO</label>
                </div>

                <label>Dispatch Center</label>
                <select name="agency" class="input">
                    <option value="">- Dispatch Center -</option>
                <?for ($i = 0; $i < count($dispatchCenters); $i++) {
                    echo '<option '.($row['agency'] == $dispatchCenters[$i]['unit'] ? 'selected ' : '').'value="'.$dispatchCenters[$i]['unit'].'">'.$dispatchCenters[$i]['unit'].' - '.$dispatchCenters[$i]['name'].'</option>';
                }?>
                </select>

                <label>Incident Number</label>
                <span id="notirwin" style="display:none" class="help">Incident # was generated automatically; don't change</span>
                <input type="text" name="year" required class="input" style="display:inline-block;max-width:65px;margin-top:0" value="<?= $function == 'modify' ? $e[0] : date('Y') ?>"> -
                <input type="text" name="juris" required class="input" style="display:inline-block;max-width:100px;margin-top:0" placeholder="ORWWF" value="<?= $e[1] ?>"> -
                <input type="text" name="num" required class="input" style="display:inline-block;max-width:85px;margin-top:0" placeholder="001" value="<?= $e[2] ?>">

                <label>Incident Name</label>
                <input type="text" class="input" required name="name" placeholder="Incident 001" value="<?= $row['name'] ?>">

                <label>Incident Type</label>
                <div class="radio" style="margin-bottom:0">
                    <input type="radio" id="it1" required name="type" value="Wildfire" <?= ($row['type'] == 'Wildfire' ? ' checked' : '') ?>><label for="it1">Wildfire</label>
                </div>
                <div class="radio" style="margin-bottom:0">
                    <input type="radio" id="it1" required name="type" value="Smoke check" <?= ($row['type'] == 'Smoke check' ? ' checked' : '') ?>><label for="it1">Smoke Check</label>
                </div>
                <div class="radio" style="margin-bottom:0">
                    <input type="radio" id="it1" required name="type" value="Prescribed Fire" <?= ($row['type'] == 'Prescribed Fire' ? ' checked' : '') ?>><label for="it1">Prescribed Burn</label>
                </div>

                <label>Coordinates</label>
                <input type="text" name="lat" required class="input" style="display:inline-block;max-width:125px;margin-top:0" placeholder="45.32" value="<?= $row['lat'] ?>">,&nbsp;
                <input type="text" name="lon" required class="input" style="display:inline-block;max-width:125px;margin-top:0" placeholder="-118.1" value="<?= $row['lon'] ?>">
            </div>
            <div class="col w50">
                <label>State</label>
                <select class="input" name="state" <?= $function != 'modify' ? ' disabled' : '' ?>>
                    <? foreach ($statesArray as $k => $v) {
                        echo '<option ' . ($row['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
                    } ?>
                </select>

                <label>Location</label>
                <input type="text" id="geoc" class="input" placeholder="--" value="<?= $row['geo'] ?>" disabled>

                <label>Size (acres)</label>
                <input type="text" name="acres" class="input" style="max-width:80px" value="<?= $row['acres'] ?>" placeholder="0">

                <label>Notes</label>
                <textarea name="notes" class="input" placeholder="Notes about the incident..." style="width:100%;height:125px;resize:none"><?= $row['notes'] ?></textarea>

                <label>Status</label>
                <div class="checkbox">
                    <input type="checkbox" id="s1" name="control" value="1" <?= ($status['Control'] ? ' checked' : '') ?>><label for="s1">Controlled</label>
                </div>
                <div class="checkbox">
                    <input type="checkbox" id="s2" name="contain" value="1" <?= ($status['Contain'] ? ' checked' : '') ?>><label for="s2">Contained</label>
                </div>
                <div class="checkbox">
                    <input type="checkbox" id="s3" name="out" value="1" <?= ($status['Out'] ? ' checked' : '') ?>><label for="s3">Out</label>
                </div>

                <label>Display on map</label>
                <div class="radio">
                    <input type="radio" id="d1" name="display" required value="1" <?= !$row || $row['display'] == 1 ? ' checked' : '' ?>><label for="d1">Yes</label>
                </div>
                <div class="radio">
                    <input type="radio" id="d2" name="display" required value="0" <?= $row && $row['display'] == 0 ? ' checked' : '' ?>><label for="d2">No</label>
                </div>

                <? if ($function == 'modify') { ?>
                    <label>Created</label>
                    <input type="text" disabled class="input" value="<?= date('l, F j, Y H:i T', $row['captured']) ?>">

                    <label>Updated</label>
                    <input type="text" disabled class="input" value="<?= date('l, F j, Y H:i T', $row['updated']) ?>">
                <? } ?>
            </div>
        </div>

        <div class="btn-group">
            <input type="submit" class="btn btn-green" name="create" value="Save Incident">
            <input type="button" class="btn" value="Go Back" onclick="window.location.href='../wildfires'">
        </div>
    </form>
<? } 
}?>