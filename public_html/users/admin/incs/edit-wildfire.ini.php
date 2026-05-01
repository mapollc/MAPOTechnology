<?
if (!$permission->fire()->edit()) {
    echo invalidPermissions();
} else {
    function getStatus($s, $n, $t = 'Wildfire', $ac = '0') {
        $a = strtolower((string)$ac);
        
        if (!$s && !$n) return 'active';
    
        if ($s) {
            if ($s['Out'] ?? false) return 'out';
            if ($s['Control'] ?? false) return 'controlled';
            if ($s['Contain'] ?? false) return 'contained';
            if ((array)$s) return ''; // Checks if object has any properties
        }
    
        $notes = strtolower($n ?? '');
        if (str_contains($notes, 'contain')) return 'contained';
        if (str_contains($notes, 'control')) return 'controlled';
    
        return ($t === 'Smoke Check' && in_array($a, ['0', 'unknown', ''])) 
            ? 'unknown' 
            : 'active';
    }

    function fireName($n, $t, $i) {
        $parts = $i ? explode('-', $i) : [];
    
        return match ($t) {
            'Prescribed Fire' => str_contains($n ?? '', 'RX') ? $n : "$n RX",
            'Smoke Check' => "Smoke Check" . ($i ? " #{$parts[1]}-" . (int)$parts[2] : ""),
            default => empty($n) ? "Incident #" . (int)($parts[2] ?? 0) : ucwords(strtolower(preg_replace('/^\d+(?=\D)\s?/', '', $n))) . " Fire"
        };
    }

    function formatTime($t) {
        if (time() - $t > 86400) return date('l, F j, Y - g:i A T', $t);
        else return ago($t);
    }

    function tz($tz) {
        return match($tz) {
            'America/Los_Angeles' => 'Pacific',
            'America/Denver' => 'Mountain',
            'America/Chicago' => 'Central',
            'America/New_York' => 'Eastern',
            default => $tz
        };
    }

    $row = mysqli_fetch_assoc(mysqli_query($con, "SELECT w.*, ws.fuels AS fuelGroup, ws.causes, ws.behavior, ws.image AS incPhoto, d.agency AS jurisdiction, d.area AS jurisdiction_unit, c.name AS center_name FROM wildfires AS w 
        LEFT JOIN dispatch_centers AS c ON c.agency LIKE w.agency OR c.agency LIKE CONCAT(SUBSTRING(w.agency, 1, 2), '-', SUBSTRING(w.agency, 3, 5))
        LEFT JOIN wildfiresSupp AS ws ON ws.incidentID = w.incidentID
        LEFT JOIN dispatch_zones AS d ON d.unit = SUBSTRING_INDEX(SUBSTRING_INDEX(w.incidentID, '-', -2), '-', 1) WHERE wfid = $_GET[wfid]"));

    if (!$row) {
        echo errorCode('Wildfire Not Found', 'The wildfire incident you are searching for does not exist.');
    } else {
        date_default_timezone_set($row['timezone']);
        $type = $row['type'];
        $geocode = json_decode($row['near']);
        $acres = $row['acres'];
        $status = getStatus(unserialize($row['status']), $row['notes'], $type, $acres);
?>

        <form action="" method="post" enctype="multipart/form-data">
            <input type="hidden" name="wfid" value="<?= $row['wfid'] ?>">
            <input type="hidden" name="incID" value="<?= $row['incidentID'] ?>">
            <input type="hidden" name="previous_acres" value="<?= $acres ?>">

            <div class="cad-card">
                <div class="header">
                    <div style="flex:0 1 auto">
                        <div class="title">
                            <h1 style="margin:0;color:#5e4949"><?= strtoupper(fireName($row['name'], $type, $row['incidentID'])) ?></h1>
                            <span style="font-size:20px;color:#505050">#<?= $row['incidentID'] ?></span>
                        </div>
                    </div>
                    <div class="details">
                        <span class="status-badge <?= $status ?>"><?= strtoupper($status) ?></span>
                        <div style="color:#000;margin-top:5px">WFID #: <?= $row['wfid'] ?></div>
                    </div>
                </div>

                <div class="grid">
                    <div class="item">
                        <div class="label">Fire Year</div>
                        <span><?= $row['year'] ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Incident Type</div>
                        <span><?= $type ?></span>
                    </div>
                    <div class="item">
                        <div class="label">State</div>
                        <span><?= convertState($row['state'], 1) . " ($row[state])" ?></span>
                    </div>
                    <div class="item">
                        <div class="label">County</div>
                        <span><?= "$geocode->county County" ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Nearest Location</div>
                        <span><?= $geocode->near ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Coordinates</div>
                        <span><a href="https://www.mapofire.com/#13/<?= "$row[lat]/$row[lon]" ?>"><?= "$row[lat], $row[lon]" ?></a></span>
                    </div>
                    <div class="item">
                        <div class="label">Last Updated</div>
                        <span><?= formatTime($row['updated']) ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Discovered</div>
                        <span><?= formatTime($row['date']) ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Dispatch</div>
                        <span><?= ($row['center_name'] ? $row['center_name'] : '') . " (<a href=\"../dispatch/edit?agency=$row[agency]\">$row[agency]</a>)" ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Jurisdiction</div>
                        <span><?= ($row['jurisdiction'] ? $row['jurisdiction'] . ($row['jurisdiction_unit'] ? ' &mdash; ' . $row['jurisdiction_unit'] : '') : 'None') . " ($row[unit])" ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Size</div>
                        <input type="number" name="acres" class="field" style="max-width:106px" step="0.02" placeholder="0" value="<?= $acres ?>" <?= $status == 'out' ? ' disabled' : '' ?>>
                    </div>
                    <div class="item">
                        <div class="label">Behavior</div>
                        <span><?= $row['behavior'] && $row['behavior'] != '[]' ? implode(', ', json_decode($row['behavior'])) : 'N/A' ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Cause</div>
                        <span><?= $row['causes'] && $row['causes'] != '[]' ? implode(' - ', array_unique(json_decode($row['causes']))) : 'N/A' ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Fuels</div>
                        <span><?= $row['fuelGroup'] && $row['fuelGroup'] != '[]' ? implode(', ', json_decode($row['fuelGroup'])) : ($row['fuels'] ? $row['fuels'] : 'N/A') ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Notes</div>
                        <span><?= $row['notes'] ? $row['notes'] : 'N/A' ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Data Source</div>
                        <span><?= $row['owner'] ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Incident Timezone</div>
                        <span><?= tz($row['timezone']) ?> Time</span>
                    </div>
                    <div class="item">
                        <div class="label">Captured</div>
                        <span><?= formatTime($row['captured']) ?></span>
                    </div>
                    <div class="item">
                        <div class="label">Incident Photo</div>
                        <input type="file" name="incPhoto" id="incPhoto" class="field" style="color:#444;font-size:14px;font-weight:400" accept="image/png, image/jpeg">
                        <? if ($row['incPhoto'] != null) {
                            $path = "../../../assets/images/mapofire/incidents/$row[incPhoto]";
                            echo "<a target=\"_blank\" href=\"$path\"><img loading=\"lazy\" style=\"max-width:200px\" src=\"$path\"></a>";
                        } ?>
                    </div>
                    <div class="item">
                        <div class="label">Display on Map</div>
                        <div class="radio" style="margin:0">
                            <input type="radio" id="d1" name="display" value="1" <?= $row['display'] == 1 ? ' checked' : '' ?>>
                            <label for="d1">Yes</label>
                        </div>
                        <div class="radio" style="margin:0">
                            <input type="radio" id="d2" name="display" value="0" <?= $row['display'] != 1 ? ' checked' : '' ?>>
                            <label for="d2">No</label>
                        </div>
                    </div>
                </div>

                <div class="btn-group">
                    <input type="submit" class="btn btn-green" name="action" value="Save Changes">
                    <input type="button" class="btn" value="Go Back" onclick="goBack('../wildfires')">
                </div>
            </div>

        </form>
<?
    }
} ?>