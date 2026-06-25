<?
if ($function == 'create' && !$permission->fire()->add() || $function == 'modify' && !$permission->fire()->edit()) {
    echo invalidPermissions();
} else {
    $behaviors = ['Active','Backing','Creeping','Crowning','Extreme','Flanking','Group Torching','Isolated Torching','Long-range Spotting','Minimal','Moderate','Running','Short Crown Runs','Short-range Spotting','Single Tree Torching','Smoldering','Spotting','Torching','Uphill Runs','Wind Driven Runs'];
    $fuels = ['Brush (2 feet)','Chaparral (6 feet)','Closed Timber Litter','Dormant Brush, Hardwood Slash','Hardwood Litter','Heavy Logging Slash','Light Logging Slash','Medium Logging Slash','Short Grass (1 foot)','Southern Rough','Tall Grass (2.5 feet)','Timber (Grass and Understory)','Timber (Litter and Understory)'];

    $sql2 = mysqli_query($con, "SELECT agency, name FROM dispatch_centers ORDER BY agency ASC");

    while ($row = mysqli_fetch_assoc($sql2)) {
        $dc[] = ['unit' => $row['agency'], 'name' => $row['name']];
    }

    // if converting a crowdsource report into an actual incident
    $crowd = null;
    if (isset($_GET['crowdsource']) && isset($_GET['cid'])) {
        $crowd = executeQuery('i', [$_GET['cid']], "SELECT state, type, acres, details, geo, time FROM user_reports WHERE id = ?");
        $crowdGeo = json_decode($crowd['geo']);
    }

    if ($function == 'modify') {
        $row = executeQuery('i', [$_GET['wfid']], "SELECT * FROM wildfires WHERE wfid = ?");
        $e = explode('-', $row['incidentID']);
        $status = $row['status'] != '' ? unserialize($row['status']) : [];
    }

    if (isset($_GET['crowdsource'])) {
        $tt = 'New Incident from Crowdsource Report';
    } else {
        $tt = ($function == 'modify' ? 'Modify' : 'Create New') . ' Incident' . ($function == 'modify' ? ': ' . $row['incidentID'] : '');
    }

    if ($function == 'modify' && $row['owner'] != 'mapo') {
        echo errorCode('Not a MAPO Incident', 'This incident was created automatically from IRWIN and cannot be modified. ' .
            'Change this incident\'s display status <a href="edit?wfid=' . $_GET['wfid'] . '">here</a>');
    } else {
        $curtotal = mysqli_fetch_assoc(mysqli_query($con, "SELECT COUNT(*) AS total FROM wildfires WHERE owner = 'mapo' AND year = '$year'"))['total'];
        $num = ($curtotal ?? 0) + 1;
?>
        <h1 class="category"><?= $tt ?></h1>

        <? if ($function == 'modify') { ?>
            <span class="help">
                <? if ($row['updated'] != $row['captured']) {
                    echo "Updated <b>" . date('l, F j, Y H:i T', $row['updated']) . "</b> &middot;";
                } ?>
                Created <b><?= date('l, F j, Y H:i T', $row['captured']) ?></b> by <b><?= $row['owner'] ?></b>
            </span>
        <? } ?>

        <form action="" method="post">
            <? if ($function == 'modify') { ?>
                <input type="hidden" name="wfid" value="<?= $_GET['wfid'] ?>">
                <input type="hidden" name="modify" value="1">
            <? } if (isset($_GET['crowdsource'])) { ?>
                <input type="hidden" name="crowdsource" data-lat="<?= $crowdGeo->lat ?>" data-lon="<?= $crowdGeo->lon ?>">
            <? } ?>
            <input type="hidden" name="inhouse_num" value="<?= $num ?>">
            <input type="hidden" name="near" value='<?= $row['near'] ?>'>
            <input type="hidden" name="tz" value="<?= $row['timezone'] ?>">

            <div class="row">
                <div class="col w50">
                    <label>Discovery Date/Time</label>
                    <input type="datetime-local" name="discovered" class="input" value="<?= date('Y-m-d\TH:i', $crowd ? $crowd['time'] : ($row ? $row['date'] : time())) ?>" placeholder="">

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
                        <? for ($i = 0; $i < count($dc); $i++) {
                            $isSelect = $crowd && $_GET['dispatch'] == $dc[$i]['unit'] || $row['agency'] == $dc[$i]['unit'];
                            echo '<option ' . ($isSelect ? 'selected ' : '') . 'value="' . $dc[$i]['unit'] . '">' . $dc[$i]['unit'] . ' - ' . $dc[$i]['name'] . '</option>';
                        } ?>
                    </select>

                    <label>Incident Number</label>
                    <span id="notirwin" style="display:none" class="help">Incident # was generated automatically; don't change</span>
                    <input type="text" name="year" required class="input" style="display:inline-block;max-width:65px;margin-top:0" value="<?= $function == 'modify' ? $e[0] : date('Y') ?>"> -
                    <input type="text" name="juris" required<?= $e[1] == 'MAPO' ? ' readonly ' : '' ?> class="input" style="display:inline-block;max-width:100px;margin-top:0" placeholder="ORWWF" value="<?= $e[1] ?>"> -
                    <input type="text" name="num" required<?= $e[1] == 'MAPO' ? ' readonly ' : '' ?> class="input" style="display:inline-block;max-width:85px;margin-top:0" placeholder="001" value="<?= $e[2] ?>">

                    <label>Incident Name</label>
                    <input type="text" class="input" required name="name" placeholder="Incident 001" value="<?= $row['name'] ?>">

                    <label>Incident Type</label>
                    <div class="radio" style="margin-bottom:0">
                        <input type="radio" id="it1" required name="type" value="Wildfire" <?= $crowd['type'] == 'Wildfire' || $row['type'] == 'Wildfire' ? ' checked' : '' ?>>
                        <label for="it1">Wildfire</label>
                    </div>
                    <div class="radio" style="margin-bottom:0">
                        <input type="radio" id="it1" required name="type" value="Smoke check" <?= $crowd['type'] == 'Smoke Check' || $row['type'] == 'Smoke check' ? ' checked' : '' ?>>
                        <label for="it1">Smoke Check</label>
                    </div>
                    <div class="radio" style="margin-bottom:0">
                        <input type="radio" id="it1" required name="type" value="Prescribed Fire" <?= $crowd['type'] == 'Prescribed Fire' || $row['type'] == 'Prescribed Fire' ? ' checked' : '' ?>>
                        <label for="it1">Prescribed Burn</label>
                    </div>

                    <label>Display on map</label>
                    <div class="radio" style="margin:0">
                        <input type="radio" id="d1" name="display" required value="1" <?= !$row || $row['display'] == 1 ? ' checked' : '' ?>><label for="d1">Yes</label>
                    </div>
                    <div class="radio" style="margin:0">
                        <input type="radio" id="d2" name="display" required value="0" <?= $row && $row['display'] == 0 ? ' checked' : '' ?>><label for="d2">No</label>
                    </div>
                </div>
                <div class="col w50">
                    <label>Coordinates</label>
                    <div class="coordinates">
                        <input type="text" name="lat" required class="input" style="max-width:150px" placeholder="45.32" value="<?= $crowdGeo->lat ?? $row['lat'] ?? ''  ?>">
                        <span>,</span>
                        <input type="text" name="lon" required class="input" style="max-width:150px" placeholder="-118.1" value="<?= $crowdGeo->lon ?? $row['lon'] ?? '' ?>">
                        <div class="spinner" id="geocoding" style="display:none;width:16px;height:16px;margin:0 0 14.5px 1em"></div>
                    </div>

                    <label>State</label>
                    <select class="input" name="state" <?= $function != 'modify' ? ' disabled' : '' ?>>
                        <? foreach ($statesArray as $k => $v) {
                            echo '<option ' . ($row['state'] == $k ? 'selected ' : '') . 'value="' . $k . '">' . ucwords(strtolower($v)) . '</option>';
                        } ?>
                    </select>

                    <label>Location</label>
                    <input type="text" id="geoc" class="input" placeholder="--" value="<?= json_decode($row['near'])->near ?>" disabled>

                    <label>Size (acres)</label>
                    <input type="text" name="acres" class="input" style="max-width:80px" value="<?= $crowd['acres'] ?? $row['acres'] ?>" placeholder="0">

                    <label>Status</label>
                    <div class="checkbox" style="margin:0">
                        <input type="checkbox" id="s1" name="control" value="1" <?= ($status['Control'] ? ' checked' : '') ?>><label for="s1">Controlled</label>
                    </div>
                    <div class="checkbox" style="margin:0">
                        <input type="checkbox" id="s2" name="contain" value="1" <?= ($status['Contain'] ? ' checked' : '') ?>><label for="s2">Contained</label>
                    </div>
                    <div class="checkbox" style="margin:0">
                        <input type="checkbox" id="s3" name="out" value="1" <?= ($status['Out'] ? ' checked' : '') ?>><label for="s3">Out</label>
                    </div>

                    <label>Notes</label>
                    <textarea name="notes" class="input" placeholder="Notes about the incident..." style="width:100%;height:99px;resize:none"><?= $crowd['details'] ?? $row['notes'] ?></textarea>
                </div>
            </div>

            <div class="btn-group">
                <input type="submit" class="btn btn-green" name="create" value="<?= $function == 'modify' ? 'Save' : 'Create' ?> Incident">
                <input type="button" class="btn" value="Go Back" onclick="history.go(-1)">
            </div>
        </form>
<? }
} ?>